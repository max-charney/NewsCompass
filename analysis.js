// analysis.js
async function fetchArticleContent(url) {
    try {
        const response = await fetch('http://localhost:3000/fetch-article', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch article: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching article:', error);
        throw new Error('Failed to fetch article content. Please make sure the URL is valid.');
    }
}

async function analyzeUrl(url) {
    try {
        // Show loading state
        const analysisResult = document.getElementById('analysis-result');
        analysisResult.innerHTML = `
            <div class="analysis-loading">
                <div class="spinner"></div>
                <p>Analyzing article...</p>
            </div>
        `;

        // Fetch the article content
        const articleContent = await fetchArticleContent(url);

        // Send for analysis
        const response = await fetch('http://localhost:3000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                articles: [{
                    url: url,
                    text: articleContent.text
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Analysis failed: ${errorData.error || 'Unknown error'}`);
        }

        const results = await response.json();
        const result = results[0];

        // Display the results with improved UI
        analysisResult.innerHTML = `
            <div class="analysis-results">
                <div class="analysis-header">
                    <h2>Analysis Results</h2>
                    <span class="analysis-timestamp">Analyzed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</span>
                </div>
                
                <div class="result-content">
                    <div class="result-section">
                        <h3>Political Bias Analysis</h3>
                        <div class="leaning-indicator ${result.political_leaning}">
                            <div class="leaning-badge">
                                <span class="leaning-icon"></span>
                                <span class="leaning-text">${result.political_leaning.charAt(0).toUpperCase() + result.political_leaning.slice(1)} Leaning</span>
                            </div>
                            <p class="leaning-description">${getLeaningDescription(result.political_leaning)}</p>
                        </div>
                    </div>
                    
                    <div class="result-section">
                        <h3>Article Details</h3>
                        <div class="article-source">
                            <strong>Source:</strong> 
                            <a href="${url}" target="_blank" rel="noopener noreferrer">${new URL(url).hostname}</a>
                        </div>
                        <div class="article-preview">
                            <h4>Content Preview</h4>
                            <p>${articleContent.text.substring(0, 300)}...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error in analyzeUrl:', error);
        document.getElementById('analysis-result').innerHTML = `
            <div class="analysis-error">
                <h3>Error</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function getLeaningDescription(leaning) {
    const descriptions = {
        left: 'This article appears to present perspectives and viewpoints typically associated with left-leaning or liberal political positions.',
        right: 'This article appears to present perspectives and viewpoints typically associated with right-leaning or conservative political positions.',
        center: 'This article appears to maintain a relatively neutral political stance or presents balanced viewpoints.'
    };
    return descriptions[leaning] || 'Analysis completed.';
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('article-url-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url').value.trim();
        
        if (!url) {
            alert('Please enter a valid URL.');
            return;
        }

        try {
            new URL(url);
            await analyzeUrl(url);
        } catch (error) {
            document.getElementById('analysis-result').innerHTML = `
                <div class="analysis-error">
                    <h3>Error</h3>
                    <p>Please enter a valid URL</p>
                </div>
            `;
        }
    });
});