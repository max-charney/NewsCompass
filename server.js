// Add this function at the top of the file
function isPolitical(text) {
    const lowerText = text.toLowerCase();
    return politicalKeywords.some(keyword => lowerText.includes(keyword));
}

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const politicalKeywords = [
    'politics', 'government', 'election', 'democrat', 'republican', 'liberal', 'conservative',
    'policy', 'legislation', 'congress', 'senate', 'parliament', 'president', 'prime minister',
    'party', 'vote', 'campaign', 'ballot', 'debate', 'referendum', 'constitution'
];

function isPolitical(text) {
    const lowerText = text.toLowerCase();
    return politicalKeywords.some(keyword => lowerText.includes(keyword));
}

async function queryWithRetry(url, data, headers, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.post(url, data, { headers });
            return response;
        } catch (error) {
            if (error.response?.data?.error?.includes('loading')) {
                const waitTime = error.response?.data?.estimated_time || 20;
                console.log(`Model loading, waiting ${waitTime} seconds...`);
                await wait(waitTime * 1000);
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries reached');
}

// New endpoint to fetch article content
app.post('/fetch-article', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Extract the main text content
        let text = '';
        
        // Get article title
        text += $('h1').first().text() + ' ';
        
        // Get article content
        $('p').each((i, elem) => {
            text += $(elem).text() + ' ';
        });
        
        // Clean up the text
        text = text.replace(/\s+/g, ' ').trim();
        
        res.json({ text });
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ error: 'Failed to fetch article content' });
    }
});

// Updated analyze endpoint
app.post('/analyze', async (req, res) => {
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles)) {
        return res.status(400).json({ error: 'Invalid input: articles array is required' });
    }

    try {
        const results = await Promise.all(articles.map(async (article) => {
            const articleText = article.text.substring(0, 512);

            if (!isPolitical(articleText)) {
                return { url: article.url, political_leaning: 'center' };
            }

            const response = await queryWithRetry(
                'https://api-inference.huggingface.co/models/bucketresearch/politicalBiasBERT',
                { inputs: articleText },
                {
                    'Authorization': `Bearer ${HF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            );

            const result = response.data[0];
            const scores = result.reduce((acc, item) => {
                acc[item.label.toLowerCase()] = item.score;
                return acc;
            }, {});

            let politicalLeaning;
            if (Math.abs(scores.left - scores.right) < 0.1) {
                politicalLeaning = 'center';
            } else {
                politicalLeaning = scores.left > scores.right ? 'left' : 'right';
            }

            return { url: article.url, political_leaning: politicalLeaning };
        }));

        res.json(results);
    } catch (error) {
        console.error('Error in /analyze:', error);
        res.status(500).json({
            error: 'An error occurred during analysis',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});