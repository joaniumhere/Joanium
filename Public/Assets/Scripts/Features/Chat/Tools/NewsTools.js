// openworld — Features/Chat/Tools/NewsTools.js
export const NEWS_TOOLS = [
    {
        name: 'get_news',
        description: 'Fetch the latest news headlines. Filter by keyword, category (technology, science, business, sports, entertainment, health, politics), or country code.',
        category: 'newsdata',
        parameters: {
            query: { type: 'string', required: false, description: 'Search keyword (e.g. "AI", "climate change", "SpaceX")' },
            category: { type: 'string', required: false, description: 'News category: technology, science, business, sports, entertainment, health, politics' },
            country: { type: 'string', required: false, description: 'Country code (e.g. "us", "gb", "in", "de"). Default: all countries' },
            count: { type: 'number', required: false, description: 'Number of headlines to return (default: 5, max: 10)' },
        },
    },
];
