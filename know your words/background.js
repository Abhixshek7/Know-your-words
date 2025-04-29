// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getMeaning') {
        fetchWordMeaning(request.word)
            .then(result => {
                sendResponse({ meaning: result.meaning, example: result.example });
            })
            .catch(error => {
                sendResponse({ 
                    meaning: 'Error fetching meaning. Please try again.',
                    example: ''
                });
            });
        return true; // Required for async response
    }
});

// Function to fetch word meaning using Gemini API
async function fetchWordMeaning(word) {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a helpful dictionary assistant. For the word "${word}", provide a definition and example that is appropriate for the word's complexity:

1. For simple words (articles, common nouns, basic verbs):
   - Give a very simple, child-friendly definition
   - Use a basic, everyday example
   - Keep it short and clear

2. For more complex words:
   - Provide a clear, concise definition
   - Include a practical example
   - Explain in simple terms

Format your response as a JSON object with exactly these two fields:
{
    "meaning": "your definition here",
    "example": "your example sentence here"
}

Make sure to:
- Match the complexity of the definition to the word
- Use examples that are easy to understand
- Keep definitions brief and clear
- Always provide both definition and example`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response from Gemini API');
        }

        const content = data.candidates[0].content.parts[0].text;
        
        try {
            const result = JSON.parse(content);
            
            // Validate that we have both meaning and example
            if (!result.meaning || !result.example) {
                throw new Error('Missing meaning or example in response');
            }

            return {
                meaning: result.meaning,
                example: result.example
            };
        } catch (e) {
            console.error('Error parsing Gemini response:', e);
            // If parsing fails, try to extract meaning and example from the raw text
            const extracted = extractMeaningAndExample(content);
            if (extracted) {
                return extracted;
            }
            // Fallback to dictionary API if extraction fails
            return await fetchFromDictionaryAPI(word);
        }
    } catch (error) {
        console.error('Error fetching word meaning:', error);
        // Fallback to dictionary API
        return await fetchFromDictionaryAPI(word);
    }
}

// Helper function to extract meaning and example from raw text
function extractMeaningAndExample(text) {
    try {
        // Try to find definition and example in the text
        const meaningMatch = text.match(/"meaning":\s*"([^"]+)"/);
        const exampleMatch = text.match(/"example":\s*"([^"]+)"/);
        
        if (meaningMatch && exampleMatch) {
            return {
                meaning: meaningMatch[1],
                example: exampleMatch[1]
            };
        }
        
        // If JSON parsing failed but we can find definition and example markers
        const definitionMatch = text.match(/definition[^:]*:\s*([^\n]+)/i);
        const exampleMatch2 = text.match(/example[^:]*:\s*([^\n]+)/i);
        
        if (definitionMatch && exampleMatch2) {
            return {
                meaning: definitionMatch[1].trim(),
                example: exampleMatch2[1].trim()
            };
        }
        
        return null;
    } catch (e) {
        console.error('Error extracting meaning and example:', e);
        return null;
    }
}

// Fallback function to use dictionary API
async function fetchFromDictionaryAPI(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].meanings) {
            const meaning = data[0].meanings[0].definitions[0].definition;
            let example = data[0].meanings[0].definitions[0].example || '';
            
            // If no example is found, create a simple one based on word type
            if (!example) {
                if (word.toLowerCase() === 'the' || word.toLowerCase() === 'a' || word.toLowerCase() === 'an') {
                    example = `Example: ${word} cat is sleeping.`;
                } else if (word.length <= 4) {
                    example = `Example: I like ${word}.`;
                } else {
                    example = `Example: The word "${word}" is used in this sentence.`;
                }
            }
            
            return {
                meaning: meaning,
                example: example
            };
        } else {
            // Create simple definitions for common words
            const simpleDefinitions = {
                'the': 'A word used before nouns to show they are specific',
                'a': 'A word used before nouns that start with consonant sounds',
                'an': 'A word used before nouns that start with vowel sounds',
                'and': 'A word used to connect words or phrases',
                'but': 'A word used to show contrast',
                'or': 'A word used to show choices',
                'in': 'A word that shows something is inside',
                'on': 'A word that shows something is above',
                'at': 'A word that shows a specific place or time',
                'to': 'A word used to show direction or purpose'
            };

            if (simpleDefinitions[word.toLowerCase()]) {
                return {
                    meaning: simpleDefinitions[word.toLowerCase()],
                    example: `Example: ${word} book is on the table.`
                };
            }

            return {
                meaning: 'No meaning found for this word.',
                example: `Example: The word "${word}" is used in this sentence.`
            };
        }
    } catch (error) {
        console.error('Error fetching from dictionary API:', error);
        return {
            meaning: 'Error fetching meaning. Please try again.',
            example: `Example: The word "${word}" is used in this sentence.`
        };
    }
} 