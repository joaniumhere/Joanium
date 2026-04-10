export const WIKI_TOOLS = [
  {
    name: 'search_wikipedia',
    description:
      'Search Wikipedia for any topic and get a concise summary, extract, and link. Great for quick knowledge lookups.',
    category: 'wikipedia',
    parameters: {
      query: {
        type: 'string',
        required: true,
        description:
          'Topic to search for (e.g. "quantum computing", "Roman Empire", "photosynthesis")',
      },
    },
  },
  {
    name: 'get_wikipedia_sections',
    description:
      "Get the full table of contents / section outline of a Wikipedia article. Useful for understanding an article's structure before diving in.",
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Exact or approximate Wikipedia article title (e.g. "Albert Einstein")',
      },
    },
  },
  {
    name: 'get_wikipedia_section_content',
    description: 'Fetch the text content of a specific named section from a Wikipedia article.',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title',
      },
      section: {
        type: 'string',
        required: true,
        description: 'Section name to retrieve (e.g. "Early life", "Legacy")',
      },
    },
  },
  {
    name: 'get_wikipedia_search_results',
    description:
      'Search Wikipedia and return multiple matching article titles and snippets — not just the top result. Good for browsing options when the topic is ambiguous.',
    category: 'wikipedia',
    parameters: {
      query: {
        type: 'string',
        required: true,
        description: 'Search query',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Number of results to return (default 5, max 10)',
      },
    },
  },
  {
    name: 'get_wikipedia_full_article',
    description:
      'Retrieve the full plain-text content of a Wikipedia article (all sections combined). Use when a summary is not enough and the complete text is needed.',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title',
      },
    },
  },
  {
    name: 'get_wikipedia_categories',
    description:
      'List all categories that a Wikipedia article belongs to. Useful for understanding how a topic is classified.',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title',
      },
    },
  },
  {
    name: 'get_wikipedia_languages',
    description:
      'List all languages in which a Wikipedia article is available, along with the localized title in each language.',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title (in English)',
      },
    },
  },
  {
    name: 'get_wikipedia_article_in_language',
    description:
      'Fetch the summary of a Wikipedia article in a specific language (e.g. French, Spanish, German).',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title (in English)',
      },
      lang: {
        type: 'string',
        required: true,
        description:
          'Two-letter language code (e.g. "fr" for French, "de" for German, "es" for Spanish)',
      },
    },
  },
  {
    name: 'get_wikipedia_images',
    description:
      'Get a list of images used in a Wikipedia article, including their URLs and captions.',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title',
      },
    },
  },
  {
    name: 'get_wikipedia_linked_articles',
    description:
      'Get a list of all Wikipedia articles that are linked from within a given article. Useful for exploring related topics.',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Max number of links to return (default 20)',
      },
    },
  },
  {
    name: 'get_wikipedia_random_article',
    description:
      'Fetch a completely random Wikipedia article summary. Great for discovery and fun facts.',
    category: 'wikipedia',
    parameters: {},
  },
  {
    name: 'get_wikipedia_featured_article',
    description:
      "Get today's Wikipedia featured article — the article the Wikipedia community has selected as an excellent example for the current date.",
    category: 'wikipedia',
    parameters: {},
  },
  {
    name: 'get_wikipedia_on_this_day',
    description:
      'Get a list of notable historical events, births, and deaths that occurred on a specific calendar date (month and day).',
    category: 'wikipedia',
    parameters: {
      month: {
        type: 'number',
        required: true,
        description: 'Month number (1–12)',
      },
      day: {
        type: 'number',
        required: true,
        description: 'Day of the month (1–31)',
      },
      type: {
        type: 'string',
        required: false,
        description:
          'Type of events to fetch: "events", "births", "deaths", or "all" (default "all")',
      },
    },
  },
  {
    name: 'get_wikipedia_most_read',
    description:
      'Get the most-read Wikipedia articles for a given date, showing what topics the world is currently interested in.',
    category: 'wikipedia',
    parameters: {
      date: {
        type: 'string',
        required: false,
        description: 'Date in YYYY-MM-DD format (defaults to yesterday if not provided)',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Number of top articles to return (default 10)',
      },
    },
  },
  {
    name: 'get_wikipedia_page_views',
    description:
      'Get daily page view statistics for a Wikipedia article over a date range, showing how popular a topic is over time.',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title',
      },
      start: {
        type: 'string',
        required: true,
        description: 'Start date in YYYYMMDD format (e.g. "20240101")',
      },
      end: {
        type: 'string',
        required: true,
        description: 'End date in YYYYMMDD format (e.g. "20240131")',
      },
    },
  },
  {
    name: 'get_wikipedia_did_you_know',
    description:
      'Fetch current "Did You Know" hook facts from Wikipedia\'s main page — interesting trivia about recently created or expanded articles.',
    category: 'wikipedia',
    parameters: {},
  },
  {
    name: 'get_wikipedia_nearby_articles',
    description:
      "Find Wikipedia articles about places geographically near a given latitude/longitude coordinate. Great for exploring what's notable around a location.",
    category: 'wikipedia',
    parameters: {
      lat: {
        type: 'number',
        required: true,
        description: 'Latitude (e.g. 48.8566 for Paris)',
      },
      lon: {
        type: 'number',
        required: true,
        description: 'Longitude (e.g. 2.3522 for Paris)',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Number of nearby articles to return (default 10)',
      },
    },
  },
  {
    name: 'get_wikipedia_revision_history',
    description:
      'Get the recent edit/revision history of a Wikipedia article, showing who edited it and when.',
    category: 'wikipedia',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Wikipedia article title',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Number of recent revisions to return (default 10)',
      },
    },
  },
  {
    name: 'get_wikipedia_disambiguation',
    description:
      'For a term with multiple meanings, fetch the disambiguation page and list all possible interpretations and their Wikipedia articles.',
    category: 'wikipedia',
    parameters: {
      term: {
        type: 'string',
        required: true,
        description: 'Ambiguous term to look up (e.g. "Mercury", "Python", "Phoenix")',
      },
    },
  },
  {
    name: 'compare_wikipedia_articles',
    description:
      'Fetch summaries of two Wikipedia topics side-by-side so they can be compared. Useful for contrasting related subjects.',
    category: 'wikipedia',
    parameters: {
      topic_a: {
        type: 'string',
        required: true,
        description: 'First topic to compare (e.g. "Buddhism")',
      },
      topic_b: {
        type: 'string',
        required: true,
        description: 'Second topic to compare (e.g. "Hinduism")',
      },
    },
  },
];
