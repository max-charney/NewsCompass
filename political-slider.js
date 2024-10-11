const PoliticalSlider = () => {
    const [value, setValue] = React.useState(50);
    const [includeNeutral, setIncludeNeutral] = React.useState(true);

    const handleChange = (event) => {
        const newValue = Number(event.target.value);
        setValue(newValue);
        updateGlobalState(newValue, includeNeutral);
        refreshNewsDisplay();
    };

    const handleNeutralToggle = (event) => {
        const newIncludeNeutral = event.target.checked;
        setIncludeNeutral(newIncludeNeutral);
        updateGlobalState(value, newIncludeNeutral);
        refreshNewsDisplay();
    };

    const updateGlobalState = (newValue, newIncludeNeutral) => {
        window.politicalSliderState = { 
            value: newValue, 
            includeNeutral: newIncludeNeutral 
        };
    };

    React.useEffect(() => {
        updateGlobalState();
    }, []);
 
    const getBackgroundStyle = () => {
        const thumbWidth = 20;
        const totalWidth = 500;
        const offset = (thumbWidth / totalWidth) * 100 / 2;
        const adjustedValue = ((value * (100 - 2 * offset)) / 100) + offset;
       
        return {
            background: `linear-gradient(to right,
                #3b82f6 0%,
                #3b82f6 ${adjustedValue}%,
                #ef4444 ${adjustedValue}%,
                #ef4444 100%)`
        };
    };
 
    return (
        <div className="political-slider">
            <h2>Political Leaning Preference</h2>
            <div className="slider-container">
                <div className="slider-background" style={getBackgroundStyle()}></div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={handleChange}
                    className="slider"
                />
            </div>
            <div className="slider-labels">
                <span>Left-leaning</span>
                <span>Right-leaning</span>
            </div>
            <div className="distribution-info">
                <p>Current Distribution:</p>
                <p>
                    <span className="left-percentage">{value}% Left-leaning</span>|
                    <span className="right-percentage">{100 - value}% Right-leaning</span>
                </p>
            </div>
            <div className="neutral-toggle">
                <label className="toggle-container">
                    <input
                        type="checkbox"
                        checked={includeNeutral}
                        onChange={handleNeutralToggle}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Include neutral articles</span>
                </label>
            </div>
        </div>
    );
};

function refreshNewsDisplay() {
    if (allArticles.length > 0) {
        newsContainer.innerHTML = ''; // Clear current display
        displayArticleBatch(allArticles); // Redisplay with new preferences
    }
}

ReactDOM.render(<PoliticalSlider />, document.getElementById('political-slider-root'));

// Set initial global state
window.politicalSliderState = { value: 50, includeNeutral: true };
