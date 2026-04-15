export const STRIPE_TOOLS = [
  // ── Existing ──────────────────────────────────────────────────────────────
  {
    name: 'stripe_get_balance',
    description:
      'Get the current Stripe account balance — available and pending amounts by currency.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {},
  },
  {
    name: 'stripe_list_charges',
    description:
      'List the most recent Stripe charges with amount, currency, status, and receipt email.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of charges to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // ── Existing: List tools ───────────────────────────────────────────────────
  {
    name: 'stripe_list_customers',
    description:
      'List recent Stripe customers with their email, name, currency, and creation date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of customers to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_subscriptions',
    description:
      'List all Stripe subscriptions (all statuses) with customer ID, period end, and cancellation info.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of subscriptions to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_invoices',
    description: 'List recent Stripe invoices with amount due, amount paid, currency, and status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of invoices to return (1-100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_payment_intents',
    description:
      'List recent Stripe PaymentIntents with amount, currency, status, and linked customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of payment intents to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_products',
    description: 'List Stripe products with their name, description, and active status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of products to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_prices',
    description:
      'List Stripe prices including unit amount, currency, billing interval, and linked product.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of prices to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_refunds',
    description:
      'List recent Stripe refunds with amount, currency, status, reason, and linked charge.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of refunds to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_disputes',
    description:
      'List open and resolved Stripe disputes with amount, reason, status, and linked charge.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of disputes to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_payouts',
    description:
      'List Stripe payouts to your bank account with amount, status, and expected arrival date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of payouts to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_events',
    description: 'List recent Stripe events (webhooks log) with event type and related object ID.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of events to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_coupons',
    description:
      'List Stripe coupons with discount value (percent or fixed), duration, and redemption count.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of coupons to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_promotion_codes',
    description:
      'List Stripe promotion codes with their code string, linked coupon, active status, and redemption count.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of promotion codes to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_tax_rates',
    description:
      'List Stripe tax rates with percentage, inclusive/exclusive flag, country, and active status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of tax rates to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_checkout_sessions',
    description:
      'List recent Stripe Checkout Sessions with payment status, total amount, and customer info.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of sessions to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_balance_transactions',
    description:
      'List Stripe balance transactions showing gross amount, fee, net amount, and transaction type.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of transactions to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_transfers',
    description:
      'List Stripe transfers to connected accounts with amount, currency, and destination.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of transfers to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_setup_intents',
    description:
      'List Stripe SetupIntents used to save payment methods, with status and linked customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of setup intents to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_webhook_endpoints',
    description:
      'List configured Stripe webhook endpoints with their URL, status, and subscribed event types.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of webhook endpoints to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // ── Existing: Get by ID tools ──────────────────────────────────────────────
  {
    name: 'stripe_get_customer',
    description:
      'Retrieve a single Stripe customer by ID, including email, name, currency, and balance.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe customer ID (e.g. cus_...)', required: true },
    },
  },
  {
    name: 'stripe_get_charge',
    description:
      'Retrieve a single Stripe charge by ID with full amount, status, receipt email, and customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe charge ID (e.g. ch_...)', required: true },
    },
  },
  {
    name: 'stripe_get_subscription',
    description:
      'Retrieve a single Stripe subscription by ID with status, billing period, and cancellation details.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe subscription ID (e.g. sub_...)', required: true },
    },
  },
  {
    name: 'stripe_get_invoice',
    description:
      'Retrieve a single Stripe invoice by ID with amount due, amount paid, status, and due date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe invoice ID (e.g. in_...)', required: true },
    },
  },
  {
    name: 'stripe_get_payment_intent',
    description:
      'Retrieve a single Stripe PaymentIntent by ID with amount, currency, status, and customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe PaymentIntent ID (e.g. pi_...)', required: true },
    },
  },
  {
    name: 'stripe_get_product',
    description:
      'Retrieve a single Stripe product by ID with name, description, and active status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe product ID (e.g. prod_...)', required: true },
    },
  },
  {
    name: 'stripe_get_refund',
    description:
      'Retrieve a single Stripe refund by ID with amount, status, reason, and linked charge.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe refund ID (e.g. re_...)', required: true },
    },
  },
  {
    name: 'stripe_get_dispute',
    description:
      'Retrieve a single Stripe dispute by ID with amount, reason, status, and evidence due date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe dispute ID (e.g. dp_...)', required: true },
    },
  },
  {
    name: 'stripe_get_payout',
    description:
      'Retrieve a single Stripe payout by ID with amount, status, and bank arrival date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe payout ID (e.g. po_...)', required: true },
    },
  },
  {
    name: 'stripe_get_coupon',
    description:
      'Retrieve a single Stripe coupon by ID with discount details, duration, and redemption count.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe coupon ID', required: true },
    },
  },

  // ── New: 30 additional tools ───────────────────────────────────────────────

  // 1. Get account
  {
    name: 'stripe_get_account',
    description:
      'Retrieve the connected Stripe account details including business type, charges/payouts enabled status, country, and default currency.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {},
  },

  // 2. List subscription items
  {
    name: 'stripe_list_subscription_items',
    description:
      'List items (price + quantity pairs) belonging to a Stripe subscription. Optionally filter by subscription ID.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      subscriptionId: {
        type: 'string',
        description: 'Stripe subscription ID to filter items (e.g. sub_...)',
        required: false,
      },
      limit: {
        type: 'number',
        description: 'Number of subscription items to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 3. Get subscription item
  {
    name: 'stripe_get_subscription_item',
    description:
      'Retrieve a single Stripe subscription item by ID, showing its linked price, product, and quantity.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe subscription item ID (e.g. si_...)',
        required: true,
      },
    },
  },

  // 4. List invoice items
  {
    name: 'stripe_list_invoice_items',
    description:
      "List Stripe invoice items — pending line items that will appear on a customer's next invoice, including proration credits and charges.",
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of invoice items to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 5. Get invoice item
  {
    name: 'stripe_get_invoice_item',
    description:
      'Retrieve a single Stripe invoice item by ID with amount, description, proration flag, and linked invoice.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe invoice item ID (e.g. ii_...)',
        required: true,
      },
    },
  },

  // 6. List credit notes
  {
    name: 'stripe_list_credit_notes',
    description:
      'List Stripe credit notes issued to reduce the amount owed on an invoice, with amount, status, and reason.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of credit notes to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 7. Get credit note
  {
    name: 'stripe_get_credit_note',
    description:
      'Retrieve a single Stripe credit note by ID with full amount, linked invoice, reason, and memo.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe credit note ID (e.g. cn_...)',
        required: true,
      },
    },
  },

  // 8. List shipping rates
  {
    name: 'stripe_list_shipping_rates',
    description:
      'List Stripe shipping rates configured for Checkout Sessions, with display name, fixed amount, and active status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of shipping rates to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 9. Get shipping rate
  {
    name: 'stripe_get_shipping_rate',
    description:
      'Retrieve a single Stripe shipping rate by ID with display name, fixed amount, and delivery estimate.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe shipping rate ID (e.g. shr_...)',
        required: true,
      },
    },
  },

  // 10. List top-ups
  {
    name: 'stripe_list_topups',
    description:
      'List Stripe top-ups used to add funds directly to your Stripe balance, with amount, status, and expected availability date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of top-ups to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 11. Get top-up
  {
    name: 'stripe_get_topup',
    description:
      'Retrieve a single Stripe top-up by ID with amount, currency, status, and expected availability date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe top-up ID (e.g. tu_...)',
        required: true,
      },
    },
  },

  // 12. List Radar reviews
  {
    name: 'stripe_list_reviews',
    description:
      'List payments currently in the Stripe Radar manual review queue, with open status and reason for review.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of reviews to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 13. Get Radar review
  {
    name: 'stripe_get_review',
    description:
      'Retrieve a single Stripe Radar review by ID with open/closed status, reason, and linked charge or payment intent.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe review ID (e.g. prv_...)',
        required: true,
      },
    },
  },

  // 14. List early fraud warnings
  {
    name: 'stripe_list_early_fraud_warnings',
    description:
      'List Stripe Radar early fraud warnings — signals from card networks about potentially fraudulent charges.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of early fraud warnings to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 15. List Radar value lists
  {
    name: 'stripe_list_radar_value_lists',
    description:
      'List Stripe Radar value lists (custom block/allow lists) used in fraud prevention rules, with item type and count.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of value lists to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 16. List plans
  {
    name: 'stripe_list_plans',
    description:
      'List Stripe Plans (legacy pricing model, still fully supported) with nickname, amount, currency, and billing interval.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of plans to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 17. Get plan
  {
    name: 'stripe_get_plan',
    description:
      'Retrieve a single Stripe Plan by ID with amount, interval, linked product, and trial period days.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe plan ID',
        required: true,
      },
    },
  },

  // 18. Get payment method
  {
    name: 'stripe_get_payment_method',
    description:
      'Retrieve a single Stripe PaymentMethod by ID showing type, card brand/last4/expiry, and linked customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe payment method ID (e.g. pm_...)',
        required: true,
      },
    },
  },

  // 19. List customer payment methods
  {
    name: 'stripe_list_customer_payment_methods',
    description:
      'List all saved payment methods for a specific Stripe customer, including card brand, last 4 digits, and expiry.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      customerId: {
        type: 'string',
        description: 'Stripe customer ID whose payment methods to retrieve (e.g. cus_...)',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Number of payment methods to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 20. Search customers
  {
    name: 'stripe_search_customers',
    description:
      'Search Stripe customers using Stripe\'s Search API. Supports queries like email:"user@example.com" or name:"Acme".',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      query: {
        type: 'string',
        description: 'Stripe search query string (e.g. email:"user@example.com", name:"Acme Corp")',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Number of results to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 21. Search charges
  {
    name: 'stripe_search_charges',
    description:
      'Search Stripe charges using Stripe\'s Search API. Supports queries like amount>5000 or currency:"usd" or status:"succeeded".',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      query: {
        type: 'string',
        description:
          'Stripe search query string (e.g. amount>5000, status:"failed", currency:"usd")',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Number of results to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 22. Search invoices
  {
    name: 'stripe_search_invoices',
    description:
      'Search Stripe invoices using Stripe\'s Search API. Supports queries like status:"open" or customer:"cus_..." or total>10000.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      query: {
        type: 'string',
        description:
          'Stripe search query string (e.g. status:"open", customer:"cus_xyz", total>10000)',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Number of results to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 23. Search payment intents
  {
    name: 'stripe_search_payment_intents',
    description:
      'Search Stripe PaymentIntents using Stripe\'s Search API. Supports queries like status:"succeeded" or currency:"eur" or customer:"cus_...".',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      query: {
        type: 'string',
        description:
          'Stripe search query string (e.g. status:"requires_payment_method", currency:"gbp")',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Number of results to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 24. Search subscriptions
  {
    name: 'stripe_search_subscriptions',
    description:
      'Search Stripe subscriptions using Stripe\'s Search API. Supports queries like status:"active" or customer:"cus_...".',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      query: {
        type: 'string',
        description: 'Stripe search query string (e.g. status:"active", customer:"cus_xyz")',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Number of results to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 25. Search products
  {
    name: 'stripe_search_products',
    description:
      'Search Stripe products using Stripe\'s Search API. Supports queries like active:"true" or name:"Pro Plan".',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      query: {
        type: 'string',
        description: 'Stripe search query string (e.g. active:"true", name:"Pro")',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Number of results to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 26. List files
  {
    name: 'stripe_list_files',
    description:
      'List files uploaded to Stripe — dispute evidence, identity documents, tax forms, and more — with filename, purpose, and size.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of files to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 27. Get file
  {
    name: 'stripe_get_file',
    description:
      'Retrieve a single Stripe file by ID with filename, purpose, size, type, and download URL.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe file ID (e.g. file_...)',
        required: true,
      },
    },
  },

  // 28. List file links
  {
    name: 'stripe_list_file_links',
    description:
      'List Stripe file links — shareable public URLs created for uploaded files — with expiry and linked file ID.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of file links to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 29. List payment links
  {
    name: 'stripe_list_payment_links',
    description:
      'List Stripe Payment Links — shareable URLs that let customers pay without custom code — with active status and URL.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of payment links to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // 30. Get payment link
  {
    name: 'stripe_get_payment_link',
    description:
      'Retrieve a single Stripe Payment Link by ID with active status, URL, after-completion behavior, and promotion code settings.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: {
        type: 'string',
        description: 'Stripe payment link ID (e.g. plink_...)',
        required: true,
      },
    },
  },
];
