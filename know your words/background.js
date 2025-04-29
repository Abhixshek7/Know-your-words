// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getMeaning') {
        fetchWordMeaning(request.word)
            .then(meaning => {
                sendResponse({ meaning: meaning });
            })
            .catch(error => {
                sendResponse({ meaning: 'Error fetching meaning. Please try again.' });
            });
        return true; // Required for async response
    }
});

// Function to fetch word meaning from API
async function fetchWordMeaning(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].meanings) {
            // Get the first meaning
            const meaning = data[0].meanings[0].definitions[0].definition;
            return meaning;
        } else {
            return 'No meaning found for this word.';
        }
    } catch (error) {
        console.error('Error fetching word meaning:', error);
        return 'Error fetching meaning. Please try again.';
    }
} 