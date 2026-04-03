export const FORMS_TOOLS = [
  {
    name: 'forms_get_form',
    description:
      'Get the full structure of a Google Form — title, description, and all questions with their types and answer options.',
    category: 'forms',
    parameters: {
      form_id: {
        type: 'string',
        required: true,
        description: 'Google Form ID (from the URL, the part after /d/).',
      },
    },
  },
  {
    name: 'forms_list_responses',
    description:
      'List all submitted responses for a Google Form, including answers to each question.',
    category: 'forms',
    parameters: {
      form_id: { type: 'string', required: true, description: 'Google Form ID.' },
      max_results: {
        type: 'number',
        required: false,
        description: 'Max responses to return (default: 50).',
      },
    },
  },
  {
    name: 'forms_get_response',
    description: 'Get a single specific response from a Google Form by its response ID.',
    category: 'forms',
    parameters: {
      form_id: { type: 'string', required: true, description: 'Google Form ID.' },
      response_id: {
        type: 'string',
        required: true,
        description: 'Response ID (from forms_list_responses).',
      },
    },
  },
  {
    name: 'forms_get_summary',
    description:
      'Get a high-level summary of a Google Form — question count, response count, and form metadata.',
    category: 'forms',
    parameters: {
      form_id: { type: 'string', required: true, description: 'Google Form ID.' },
    },
  },
];
