// Constants
const API_KEY = REDACTED;
const ARTICLES_PER_BATCH = 100;
const MAX_ARTICLES = 100;
const MAX_PAGES = 5;


// Variables
let currentPage = 1;
let loading = false;
let allArticles = [];


// DOM elements
let newsContainer;
let preferencesForm;
let topicsInput;

function getCurrentPoliticalPreferences() {
    const sliderState = window.politicalSliderState;
    if (!sliderState) {
        console.warn('Political slider state not found, using defaults');
        return { leftLeaningPercentage: 50, includeNeutral: true };
    }
    return {
        leftLeaningPercentage: sliderState.value,
        includeNeutral: sliderState.includeNeutral
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!window.politicalSliderState) {
        window.politicalSliderState = { value: 50, includeNeutral: true };
    }
    
    newsContainer = document.getElementById('news-container');
    preferencesForm = document.getElementById('preferences-form');
    topicsInput = document.getElementById('topics');


    if (preferencesForm) {
        preferencesForm.addEventListener('submit', handleFormSubmit);
    } else {
        console.error('Preferences form not found');
    }
});


function showLoader() {
    console.log('Showing loader');
    hideLoader(); // Remove any existing loader first
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
        <div class="spinner"></div>
        <p>Analyzing articles...</p>
    `;
    newsContainer.appendChild(loader);
}


function hideLoader() {
    console.log('Hiding loader');
    const loader = newsContainer.querySelector('.loader');
    if (loader) {
        loader.remove();
    }
}


function showBottomLoader() {
    console.log('Showing bottom loader');
    const loader = document.createElement('div');
    loader.className = 'bottom-loader';
    loader.innerHTML = '<div class="spinner"></div><p>Loading more articles...</p>';
    newsContainer.appendChild(loader);
}


function hideBottomLoader() {
    console.log('Hiding bottom loader');
    const loader = newsContainer.querySelector('.bottom-loader');
    if (loader) {
        loader.remove();
    }
}


function createNewsItem(article) {
    return `
        <div class="news-item ${article.politicalLeaning}">
            <h2><a href="${article.url}" target="_blank" rel="noopener noreferrer" class="article-title">${article.title}</a></h2>
            <p class="description">${article.description || ''}</p>
            <p class="source-info">Source: ${article.source.name}</p>
            <p class="political-info">Political Leaning: ${article.politicalLeaning.charAt(0).toUpperCase() + article.politicalLeaning.slice(1)}</p>
        </div>
    `;
}

async function analyzeArticle(article) {
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: article.url })
        });


        if (!response.ok) {
            throw new Error('Analysis failed');
        }


        const data = await response.json();
        return {
            ...article,
            politicalLeaning: data.political_leaning
        };
    } catch (error) {
        console.error('Error analyzing article:', error);
        return {
            ...article,
            politicalLeaning: 'center' // Default to center if analysis fails
        };
    }
}


function handleScroll() {
    if (loading) return;
   
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
   
    if (scrollTop + clientHeight >= scrollHeight - 200 && allArticles.length < MAX_ARTICLES) {
        const topics = topicsInput.value.split(',').map(topic => topic.trim());
        fetchNews(topics, false);
    }
}


function displayArticleBatch(articles, startIndex) {
    console.log('displayArticleBatch called with:', { articlesLength: articles.length, startIndex });
    const politicalSlider = document.querySelector('.political-slider input[type="range"]');
    const includeNeutral = document.querySelector('.neutral-toggle input[type="checkbox"]').checked;
    const leftLeaningPercentage = Number(politicalSlider.value);
    const rightLeaningPercentage = 100 - leftLeaningPercentage;


    console.log('Political preferences:', { leftLeaningPercentage, rightLeaningPercentage, includeNeutral });


    const remainingArticles = articles.slice(startIndex);
    console.log('Remaining articles:', remainingArticles.length);
    const balancedBatch = balanceArticles(remainingArticles, leftLeaningPercentage, rightLeaningPercentage, includeNeutral);
    console.log('Balanced batch:', balancedBatch.length);
   
    const uniqueBalancedBatch = balancedBatch.filter((article, index, self) =>
        index === self.findIndex((t) => t.url === article.url)
    );


    uniqueBalancedBatch.forEach(article => {
        const newsItem = createNewsItem(article);
        newsContainer.insertAdjacentHTML('beforeend', newsItem);
    });
   
    return startIndex + uniqueBalancedBatch.length < articles.length;
}




function isPoliticalTopic(topics) {
    const politicalKeywords = ['politics', 'government', 'election', 'democracy', 'republican', 'democrat'];
    return topics.some(topic =>
        politicalKeywords.some(keyword => topic.toLowerCase().includes(keyword))
    );
}


async function fetchNews(topics, isNewSearch = true) {
    if (isNewSearch) {
        currentPage = 1;
        newsContainer.innerHTML = '';
        allArticles = [];
        window.removeEventListener('scroll', handleScroll);
    }


    if (loading) return;
    loading = true;


    isNewSearch ? showLoader() : showBottomLoader();


    const query = topics.join(' OR ');


    try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&page=${currentPage}&apiKey=${API_KEY}&pageSize=${ARTICLES_PER_BATCH}&language=en&sortBy=publishedAt`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`NewsAPI HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.status === 'error') throw new Error(data.message || 'An error occurred while fetching news');
        if (!data.articles || !Array.isArray(data.articles)) throw new Error('Invalid response format from NewsAPI');

        const newArticles = data.articles
            .filter(article => article.title !== "[Removed]" && article.description !== "[Removed]")
            .filter(article =>
                !allArticles.some(existingArticle => existingArticle.url === article.url || existingArticle.title === article.title)
            );

            if (newArticles.length > 0) {
                const analyzedArticles = await analyzeArticles(newArticles);
                
                // Only add new articles if we have enough of each type
                const leftCount = analyzedArticles.filter(a => a.politicalLeaning === 'left').length;
                const rightCount = analyzedArticles.filter(a => a.politicalLeaning === 'right').length;
                const neutralCount = analyzedArticles.filter(a => a.politicalLeaning === 'center').length;
    
                console.log('New articles by leaning:', { leftCount, rightCount, neutralCount });
    
                allArticles = [...allArticles, ...analyzedArticles];
                displayArticleBatch(analyzedArticles);
            }
    
        currentPage++;
        if (allArticles.length < MAX_ARTICLES && currentPage <= MAX_PAGES) {
            window.addEventListener('scroll', handleScroll);
        }
    } catch (error) {
        console.error('Error in fetchNews:', error);
        newsContainer.innerHTML = `<p>Error fetching news: ${error.message}. Please try again later.</p>`;
    } finally {
        loading = false;
        hideLoader();
        hideBottomLoader();


        if (allArticles.length === 0) {
            newsContainer.innerHTML = '<p>No articles found for the given topics. Please try different search terms.</p>';
        }
    }
}


async function analyzeArticles(articles) {
    try {
        const response = await fetch('http://localhost:3000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articles: articles.map(article => ({ url: article.url, text: article.title + " " + article.description })) })
        });

        if (!response.ok) throw new Error('Analysis failed');

        const data = await response.json();
        return articles.map((article, index) => ({
            ...article,
            politicalLeaning: data[index].political_leaning.toLowerCase()
        }));
    } catch (error) {
        console.error('Error analyzing articles:', error);
        return articles.map(article => ({ ...article, politicalLeaning: 'center' }));
    }
}


function displayArticleBatch(articles) {
    const { leftLeaningPercentage, includeNeutral } = getCurrentPoliticalPreferences();
    const rightLeaningPercentage = 100 - leftLeaningPercentage;

    console.log('Current political preferences:', {
        leftLeaningPercentage,
        rightLeaningPercentage,
        includeNeutral
    });

    // Clear the container first
    if (newsContainer) {
        newsContainer.innerHTML = '';
    }

    const balancedArticles = balanceArticles(
        articles,
        leftLeaningPercentage,
        rightLeaningPercentage,
        includeNeutral
    );

    balancedArticles.forEach(article => {
        const newsItem = createNewsItem(article);
        newsContainer.insertAdjacentHTML('beforeend', newsItem);
    });

    return balancedArticles.length > 0;
}


function balanceArticles(articles, leftLeaningPercentage, rightLeaningPercentage, includeNeutral) {
    const totalDesiredArticles = Math.min(ARTICLES_PER_BATCH, articles.length);
    
    // Check if the topic is political
    const isPoliticalTopic = articles.some(article => article.politicalLeaning !== 'center');

    let leftCount, rightCount, neutralCount;
    if (isPoliticalTopic) {
        // For political topics, use the slider preferences
        if (includeNeutral) {
            neutralCount = Math.round(totalDesiredArticles * 0.1); // 10% neutral
            const remainingCount = totalDesiredArticles - neutralCount;
            leftCount = Math.round((leftLeaningPercentage / 100) * remainingCount);
            rightCount = remainingCount - leftCount;
        } else {
            neutralCount = 0;
            leftCount = Math.round((leftLeaningPercentage / 100) * totalDesiredArticles);
            rightCount = totalDesiredArticles - leftCount;
        }
    } else {
        // For non-political topics, mostly neutral articles
        neutralCount = Math.round(totalDesiredArticles * 0.8); // 80% neutral
        const remainingCount = totalDesiredArticles - neutralCount;
        leftCount = Math.round(remainingCount / 2);
        rightCount = remainingCount - leftCount;
    }

    console.log('Target article counts:', { leftCount, rightCount, neutralCount });

    // Sort articles by leaning
    const leftLeaning = articles.filter(article => article.politicalLeaning === 'left');
    const rightLeaning = articles.filter(article => article.politicalLeaning === 'right');
    const neutral = articles.filter(article => article.politicalLeaning === 'center');

    console.log('Available articles:', {
        left: leftLeaning.length,
        right: rightLeaning.length,
        neutral: neutral.length
    });

    // Function to get up to N random articles from an array
    const getRandomArticles = (arr, n) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(n, arr.length));
    };

    // Get articles for each category
    let selectedArticles = {
        left: getRandomArticles(leftLeaning, leftCount),
        right: getRandomArticles(rightLeaning, rightCount),
        neutral: getRandomArticles(neutral, neutralCount)
    };

    // Actual counts after selection
    const actualCounts = {
        left: selectedArticles.left.length,
        right: selectedArticles.right.length,
        neutral: selectedArticles.neutral.length
    };

    console.log('Selected article counts:', actualCounts);

    // Create a pattern based on actual counts
    const pattern = [];
    for (let i = 0; i < actualCounts.left; i++) pattern.push('left');
    for (let i = 0; i < actualCounts.right; i++) pattern.push('right');
    for (let i = 0; i < actualCounts.neutral; i++) pattern.push('neutral');

    // Shuffle the pattern
    const shuffledPattern = shuffleArray(pattern);

    // Use the pattern to create the final article sequence
    const balancedArticles = shuffledPattern.map(type => selectedArticles[type].pop()).filter(Boolean);

    console.log('Final balanced articles distribution:', {
        total: balancedArticles.length,
        left: balancedArticles.filter(a => a.politicalLeaning === 'left').length,
        right: balancedArticles.filter(a => a.politicalLeaning === 'right').length,
        neutral: balancedArticles.filter(a => a.politicalLeaning === 'center').length
    });

    return balancedArticles;
}

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function handleScroll() {
    if (loading) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 200 && allArticles.length < MAX_ARTICLES) {
        const topics = topicsInput.value.split(',').map(topic => topic.trim());
        fetchNews(topics, false);
    }
}

// Update the handleFormSubmit function
function handleFormSubmit(e) {
    e.preventDefault();
    const topics = topicsInput.value.split(',').map(topic => topic.trim());
    if (topics.length > 0) {
        fetchNews(topics, true);
    } else {
        alert('Please enter at least one topic.');
    }
}

// Expose a function to get the political slider state
window.getPoliticalSliderState = () => {
    // This function will be implemented in political-slider.js
    return window.politicalSliderState;
};
