// openworld — Features/Chat/Tools/DictionaryTools.js
export const DICTIONARY_TOOLS = [
    {
        name: 'define_word',
        description: 'Look up the definition of an English word. Returns definitions, part of speech, phonetics, synonyms, and usage examples.',
        category: 'dictionary',
        parameters: {
            word: { type: 'string', required: true, description: 'English word to define (e.g. "serendipity", "ephemeral", "ubiquitous")' },
        },
    },
];
