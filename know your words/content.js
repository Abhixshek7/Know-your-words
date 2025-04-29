let meaningPopup = null;

// Create and show the meaning popup
function showMeaningPopup(word, meaning, x, y) {
    // Remove existing popup if any
    if (meaningPopup) {
        meaningPopup.remove();
    }

    // Create popup element
    meaningPopup = document.createElement('div');
    meaningPopup.className = 'meaning-popup';
    
    // Create content
    const content = `
        <div class="meaning-header">
            <h3>${word}</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="meaning-content">
            <p>${meaning}</p>
        </div>
    `;
    
    meaningPopup.innerHTML = content;
    
    // Position the popup
    meaningPopup.style.left = `${x}px`;
    meaningPopup.style.top = `${y}px`;
    
    // Add to document
    document.body.appendChild(meaningPopup);
    
    // Add close button functionality
    const closeBtn = meaningPopup.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        meaningPopup.remove();
        meaningPopup = null;
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (!meaningPopup.contains(e.target)) {
            meaningPopup.remove();
            meaningPopup = null;
        }
    });
}

// Handle double click
document.addEventListener('dblclick', async (e) => {
    const selection = window.getSelection();
    const word = selection.toString().trim();
    
    if (word && word.length > 0) {
        // Get word position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Send message to background script to get meaning
        chrome.runtime.sendMessage(
            { action: 'getMeaning', word: word },
            (response) => {
                if (response && response.meaning) {
                    showMeaningPopup(
                        word,
                        response.meaning,
                        rect.left + window.scrollX,
                        rect.bottom + window.scrollY + 10
                    );
                }
            }
        );
    }
}); 