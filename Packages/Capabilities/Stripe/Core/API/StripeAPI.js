const BASE = 'https://api.stripe.com/v1';

function headers(creds) {
  return {
    Authorization: `Bearer ${creds.token}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

async function stripeFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message ?? `Stripe API error: ${res.status}`);
  }
  return res.json();
}

// ── Existing ───────────────────────────────────────────────────────────────

export async function getBalance(creds) {
  const b = await stripeFetch('/balance', creds);
  return {
    available: (b.available ?? []).map((a) => ({
      amount: a.amount / 100,
      currency: a.currency.toUpperCase(),
    })),
    pending: (b.pending ?? []).map((p) => ({
      amount: p.amount / 100,
      currency: p.currency.toUpperCase(),
    })),
  };
}

export async function listCustomers(creds, limit = 10) {
  const data = await stripeFetch(`/customers?limit=${limit}`, creds);
  return (data.data ?? []).map((c) => ({
    id: c.id,
    email: c.email ?? null,
    name: c.name ?? null,
    created: c.created,
    currency: c.currency ?? null,
  }));
}

export async function listCharges(creds, limit = 10) {
  const data = await stripeFetch(`/charges?limit=${limit}`, creds);
  return (data.data ?? []).map((c) => ({
    id: c.id,
    amount: c.amount / 100,
    currency: c.currency?.toUpperCase() ?? '',
    status: c.status,
    description: c.description ?? null,
    receiptEmail: c.receipt_email ?? null,
    created: c.created,
  }));
}

export async function listSubscriptions(creds, limit = 10) {
  const data = await stripeFetch(`/subscriptions?limit=${limit}&status=all`, creds);
  return (data.data ?? []).map((s) => ({
    id: s.id,
    status: s.status,
    customerId: s.customer,
    currentPeriodEnd: s.current_period_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    created: s.created,
  }));
}

// ── Existing: List endpoints ───────────────────────────────────────────────

export async function listInvoices(creds, limit = 10) {
  const data = await stripeFetch(`/invoices?limit=${limit}`, creds);
  return (data.data ?? []).map((i) => ({
    id: i.id,
    customerId: i.customer,
    customerEmail: i.customer_email ?? null,
    amountDue: i.amount_due / 100,
    amountPaid: i.amount_paid / 100,
    currency: i.currency?.toUpperCase() ?? '',
    status: i.status,
    dueDate: i.due_date ?? null,
    created: i.created,
  }));
}

export async function listPaymentIntents(creds, limit = 10) {
  const data = await stripeFetch(`/payment_intents?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    customerId: p.customer ?? null,
    description: p.description ?? null,
    created: p.created,
  }));
}

export async function listProducts(creds, limit = 10) {
  const data = await stripeFetch(`/products?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    active: p.active,
    created: p.created,
  }));
}

export async function listPrices(creds, limit = 10) {
  const data = await stripeFetch(`/prices?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    productId: p.product,
    unitAmount: p.unit_amount != null ? p.unit_amount / 100 : null,
    currency: p.currency?.toUpperCase() ?? '',
    type: p.type,
    recurring: p.recurring
      ? { interval: p.recurring.interval, intervalCount: p.recurring.interval_count }
      : null,
    active: p.active,
    created: p.created,
  }));
}

export async function listRefunds(creds, limit = 10) {
  const data = await stripeFetch(`/refunds?limit=${limit}`, creds);
  return (data.data ?? []).map((r) => ({
    id: r.id,
    amount: r.amount / 100,
    currency: r.currency?.toUpperCase() ?? '',
    chargeId: r.charge,
    status: r.status,
    reason: r.reason ?? null,
    created: r.created,
  }));
}

export async function listDisputes(creds, limit = 10) {
  const data = await stripeFetch(`/disputes?limit=${limit}`, creds);
  return (data.data ?? []).map((d) => ({
    id: d.id,
    amount: d.amount / 100,
    currency: d.currency?.toUpperCase() ?? '',
    chargeId: d.charge,
    status: d.status,
    reason: d.reason,
    created: d.created,
  }));
}

export async function listPayouts(creds, limit = 10) {
  const data = await stripeFetch(`/payouts?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    arrivalDate: p.arrival_date,
    description: p.description ?? null,
    created: p.created,
  }));
}

export async function listEvents(creds, limit = 10) {
  const data = await stripeFetch(`/events?limit=${limit}`, creds);
  return (data.data ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    objectId: e.data?.object?.id ?? null,
    created: e.created,
  }));
}

export async function listCoupons(creds, limit = 10) {
  const data = await stripeFetch(`/coupons?limit=${limit}`, creds);
  return (data.data ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? null,
    percentOff: c.percent_off ?? null,
    amountOff: c.amount_off != null ? c.amount_off / 100 : null,
    currency: c.currency?.toUpperCase() ?? null,
    duration: c.duration,
    timesRedeemed: c.times_redeemed,
    valid: c.valid,
    created: c.created,
  }));
}

export async function listPromotionCodes(creds, limit = 10) {
  const data = await stripeFetch(`/promotion_codes?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    code: p.code,
    couponId: p.coupon?.id ?? null,
    active: p.active,
    timesRedeemed: p.times_redeemed,
    created: p.created,
  }));
}

export async function listTaxRates(creds, limit = 10) {
  const data = await stripeFetch(`/tax_rates?limit=${limit}`, creds);
  return (data.data ?? []).map((t) => ({
    id: t.id,
    displayName: t.display_name,
    percentage: t.percentage,
    inclusive: t.inclusive,
    active: t.active,
    country: t.country ?? null,
    state: t.state ?? null,
    created: t.created,
  }));
}

export async function listCheckoutSessions(creds, limit = 10) {
  const data = await stripeFetch(`/checkout/sessions?limit=${limit}`, creds);
  return (data.data ?? []).map((s) => ({
    id: s.id,
    status: s.status,
    paymentStatus: s.payment_status,
    customerId: s.customer ?? null,
    customerEmail: s.customer_email ?? null,
    amountTotal: s.amount_total != null ? s.amount_total / 100 : null,
    currency: s.currency?.toUpperCase() ?? null,
    created: s.created,
  }));
}

export async function listBalanceTransactions(creds, limit = 10) {
  const data = await stripeFetch(`/balance_transactions?limit=${limit}`, creds);
  return (data.data ?? []).map((t) => ({
    id: t.id,
    amount: t.amount / 100,
    fee: t.fee / 100,
    net: t.net / 100,
    currency: t.currency?.toUpperCase() ?? '',
    type: t.type,
    status: t.status,
    created: t.created,
  }));
}

export async function listTransfers(creds, limit = 10) {
  const data = await stripeFetch(`/transfers?limit=${limit}`, creds);
  return (data.data ?? []).map((t) => ({
    id: t.id,
    amount: t.amount / 100,
    currency: t.currency?.toUpperCase() ?? '',
    destination: t.destination,
    description: t.description ?? null,
    created: t.created,
  }));
}

export async function listSetupIntents(creds, limit = 10) {
  const data = await stripeFetch(`/setup_intents?limit=${limit}`, creds);
  return (data.data ?? []).map((s) => ({
    id: s.id,
    status: s.status,
    customerId: s.customer ?? null,
    paymentMethodId: s.payment_method ?? null,
    created: s.created,
  }));
}

export async function listWebhookEndpoints(creds, limit = 10) {
  const data = await stripeFetch(`/webhook_endpoints?limit=${limit}`, creds);
  return (data.data ?? []).map((w) => ({
    id: w.id,
    url: w.url,
    status: w.status,
    enabledEvents: w.enabled_events,
    created: w.created,
  }));
}

// ── Existing: Get by ID ────────────────────────────────────────────────────

export async function getCustomer(creds, id) {
  const c = await stripeFetch(`/customers/${id}`, creds);
  return {
    id: c.id,
    email: c.email ?? null,
    name: c.name ?? null,
    currency: c.currency ?? null,
    balance: c.balance != null ? c.balance / 100 : null,
    delinquent: c.delinquent,
    created: c.created,
  };
}

export async function getCharge(creds, id) {
  const c = await stripeFetch(`/charges/${id}`, creds);
  return {
    id: c.id,
    amount: c.amount / 100,
    currency: c.currency?.toUpperCase() ?? '',
    status: c.status,
    description: c.description ?? null,
    receiptEmail: c.receipt_email ?? null,
    customerId: c.customer ?? null,
    created: c.created,
  };
}

export async function getSubscription(creds, id) {
  const s = await stripeFetch(`/subscriptions/${id}`, creds);
  return {
    id: s.id,
    status: s.status,
    customerId: s.customer,
    currentPeriodEnd: s.current_period_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    created: s.created,
  };
}

export async function getInvoice(creds, id) {
  const i = await stripeFetch(`/invoices/${id}`, creds);
  return {
    id: i.id,
    customerId: i.customer,
    customerEmail: i.customer_email ?? null,
    amountDue: i.amount_due / 100,
    amountPaid: i.amount_paid / 100,
    currency: i.currency?.toUpperCase() ?? '',
    status: i.status,
    dueDate: i.due_date ?? null,
    created: i.created,
  };
}

export async function getPaymentIntent(creds, id) {
  const p = await stripeFetch(`/payment_intents/${id}`, creds);
  return {
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    customerId: p.customer ?? null,
    description: p.description ?? null,
    created: p.created,
  };
}

export async function getProduct(creds, id) {
  const p = await stripeFetch(`/products/${id}`, creds);
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    active: p.active,
    created: p.created,
  };
}

export async function getRefund(creds, id) {
  const r = await stripeFetch(`/refunds/${id}`, creds);
  return {
    id: r.id,
    amount: r.amount / 100,
    currency: r.currency?.toUpperCase() ?? '',
    chargeId: r.charge,
    status: r.status,
    reason: r.reason ?? null,
    created: r.created,
  };
}

export async function getDispute(creds, id) {
  const d = await stripeFetch(`/disputes/${id}`, creds);
  return {
    id: d.id,
    amount: d.amount / 100,
    currency: d.currency?.toUpperCase() ?? '',
    chargeId: d.charge,
    status: d.status,
    reason: d.reason,
    evidenceDueBy: d.evidence_details?.due_by ?? null,
    created: d.created,
  };
}

export async function getPayout(creds, id) {
  const p = await stripeFetch(`/payouts/${id}`, creds);
  return {
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    arrivalDate: p.arrival_date,
    description: p.description ?? null,
    created: p.created,
  };
}

export async function getCoupon(creds, id) {
  const c = await stripeFetch(`/coupons/${id}`, creds);
  return {
    id: c.id,
    name: c.name ?? null,
    percentOff: c.percent_off ?? null,
    amountOff: c.amount_off != null ? c.amount_off / 100 : null,
    currency: c.currency?.toUpperCase() ?? null,
    duration: c.duration,
    timesRedeemed: c.times_redeemed,
    valid: c.valid,
    created: c.created,
  };
}

// ── New: 30 additional tools ───────────────────────────────────────────────

// 1. Get connected Stripe account info
export async function getAccount(creds) {
  const a = await stripeFetch('/account', creds);
  return {
    id: a.id,
    email: a.email ?? null,
    country: a.country ?? null,
    defaultCurrency: a.default_currency?.toUpperCase() ?? null,
    chargesEnabled: a.charges_enabled,
    payoutsEnabled: a.payouts_enabled,
    detailsSubmitted: a.details_submitted,
    businessType: a.business_type ?? null,
    created: a.created,
  };
}

// 2. List subscription items for a subscription
export async function listSubscriptionItems(creds, subscriptionId, limit = 10) {
  const qs = subscriptionId
    ? `/subscription_items?subscription=${subscriptionId}&limit=${limit}`
    : `/subscription_items?limit=${limit}`;
  const data = await stripeFetch(qs, creds);
  return (data.data ?? []).map((si) => ({
    id: si.id,
    subscriptionId: si.subscription,
    priceId: si.price?.id ?? null,
    productId: si.price?.product ?? null,
    quantity: si.quantity ?? null,
    created: si.created,
  }));
}

// 3. Get a single subscription item by ID
export async function getSubscriptionItem(creds, id) {
  const si = await stripeFetch(`/subscription_items/${id}`, creds);
  return {
    id: si.id,
    subscriptionId: si.subscription,
    priceId: si.price?.id ?? null,
    productId: si.price?.product ?? null,
    quantity: si.quantity ?? null,
    created: si.created,
  };
}

// 4. List invoice items (line items added to upcoming invoices)
export async function listInvoiceItems(creds, limit = 10) {
  const data = await stripeFetch(`/invoiceitems?limit=${limit}`, creds);
  return (data.data ?? []).map((ii) => ({
    id: ii.id,
    customerId: ii.customer,
    invoiceId: ii.invoice ?? null,
    amount: ii.amount / 100,
    currency: ii.currency?.toUpperCase() ?? '',
    description: ii.description ?? null,
    proration: ii.proration,
    quantity: ii.quantity,
    created: ii.date,
  }));
}

// 5. Get a single invoice item by ID
export async function getInvoiceItem(creds, id) {
  const ii = await stripeFetch(`/invoiceitems/${id}`, creds);
  return {
    id: ii.id,
    customerId: ii.customer,
    invoiceId: ii.invoice ?? null,
    amount: ii.amount / 100,
    currency: ii.currency?.toUpperCase() ?? '',
    description: ii.description ?? null,
    proration: ii.proration,
    quantity: ii.quantity,
    created: ii.date,
  };
}

// 6. List credit notes
export async function listCreditNotes(creds, limit = 10) {
  const data = await stripeFetch(`/credit_notes?limit=${limit}`, creds);
  return (data.data ?? []).map((cn) => ({
    id: cn.id,
    invoiceId: cn.invoice,
    customerId: cn.customer,
    amount: cn.amount / 100,
    currency: cn.currency?.toUpperCase() ?? '',
    status: cn.status,
    reason: cn.reason ?? null,
    created: cn.created,
  }));
}

// 7. Get a single credit note by ID
export async function getCreditNote(creds, id) {
  const cn = await stripeFetch(`/credit_notes/${id}`, creds);
  return {
    id: cn.id,
    invoiceId: cn.invoice,
    customerId: cn.customer,
    amount: cn.amount / 100,
    currency: cn.currency?.toUpperCase() ?? '',
    status: cn.status,
    reason: cn.reason ?? null,
    memo: cn.memo ?? null,
    created: cn.created,
  };
}

// 8. List shipping rates
export async function listShippingRates(creds, limit = 10) {
  const data = await stripeFetch(`/shipping_rates?limit=${limit}`, creds);
  return (data.data ?? []).map((sr) => ({
    id: sr.id,
    displayName: sr.display_name,
    type: sr.type,
    fixedAmount: sr.fixed_amount
      ? {
          amount: sr.fixed_amount.amount / 100,
          currency: sr.fixed_amount.currency?.toUpperCase() ?? '',
        }
      : null,
    active: sr.active,
    created: sr.created,
  }));
}

// 9. Get a single shipping rate by ID
export async function getShippingRate(creds, id) {
  const sr = await stripeFetch(`/shipping_rates/${id}`, creds);
  return {
    id: sr.id,
    displayName: sr.display_name,
    type: sr.type,
    fixedAmount: sr.fixed_amount
      ? {
          amount: sr.fixed_amount.amount / 100,
          currency: sr.fixed_amount.currency?.toUpperCase() ?? '',
        }
      : null,
    active: sr.active,
    deliveryEstimate: sr.delivery_estimate ?? null,
    created: sr.created,
  };
}

// 10. List top-ups (adding funds to Stripe balance)
export async function listTopups(creds, limit = 10) {
  const data = await stripeFetch(`/topups?limit=${limit}`, creds);
  return (data.data ?? []).map((t) => ({
    id: t.id,
    amount: t.amount / 100,
    currency: t.currency?.toUpperCase() ?? '',
    status: t.status,
    description: t.description ?? null,
    expectedAvailabilityDate: t.expected_availability_date ?? null,
    created: t.created,
  }));
}

// 11. Get a single top-up by ID
export async function getTopup(creds, id) {
  const t = await stripeFetch(`/topups/${id}`, creds);
  return {
    id: t.id,
    amount: t.amount / 100,
    currency: t.currency?.toUpperCase() ?? '',
    status: t.status,
    description: t.description ?? null,
    expectedAvailabilityDate: t.expected_availability_date ?? null,
    created: t.created,
  };
}

// 12. List Radar reviews (manual review queue)
export async function listReviews(creds, limit = 10) {
  const data = await stripeFetch(`/reviews?limit=${limit}`, creds);
  return (data.data ?? []).map((r) => ({
    id: r.id,
    chargeId: r.charge ?? null,
    paymentIntentId: r.payment_intent ?? null,
    reason: r.reason,
    open: r.open,
    openedReason: r.opened_reason,
    closedReason: r.closed_reason ?? null,
    created: r.created,
  }));
}

// 13. Get a single Radar review by ID
export async function getReview(creds, id) {
  const r = await stripeFetch(`/reviews/${id}`, creds);
  return {
    id: r.id,
    chargeId: r.charge ?? null,
    paymentIntentId: r.payment_intent ?? null,
    reason: r.reason,
    open: r.open,
    openedReason: r.opened_reason,
    closedReason: r.closed_reason ?? null,
    billingZip: r.billing_zip ?? null,
    created: r.created,
  };
}

// 14. List Radar early fraud warnings
export async function listEarlyFraudWarnings(creds, limit = 10) {
  const data = await stripeFetch(`/radar/early_fraud_warnings?limit=${limit}`, creds);
  return (data.data ?? []).map((w) => ({
    id: w.id,
    chargeId: w.charge,
    paymentIntentId: w.payment_intent ?? null,
    fraudType: w.fraud_type,
    actionable: w.actionable,
    created: w.created,
  }));
}

// 15. List Radar value lists (block/allow lists)
export async function listRadarValueLists(creds, limit = 10) {
  const data = await stripeFetch(`/radar/value_lists?limit=${limit}`, creds);
  return (data.data ?? []).map((vl) => ({
    id: vl.id,
    name: vl.name,
    alias: vl.alias,
    itemType: vl.item_type,
    itemCount: vl.list_items?.total_count ?? null,
    created: vl.created,
  }));
}

// 16. List plans (legacy pricing model, still fully supported)
export async function listPlans(creds, limit = 10) {
  const data = await stripeFetch(`/plans?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    nickname: p.nickname ?? null,
    amount: p.amount != null ? p.amount / 100 : null,
    currency: p.currency?.toUpperCase() ?? '',
    interval: p.interval,
    intervalCount: p.interval_count,
    productId: p.product,
    active: p.active,
    created: p.created,
  }));
}

// 17. Get a single plan by ID
export async function getPlan(creds, id) {
  const p = await stripeFetch(`/plans/${id}`, creds);
  return {
    id: p.id,
    nickname: p.nickname ?? null,
    amount: p.amount != null ? p.amount / 100 : null,
    currency: p.currency?.toUpperCase() ?? '',
    interval: p.interval,
    intervalCount: p.interval_count,
    productId: p.product,
    active: p.active,
    trialPeriodDays: p.trial_period_days ?? null,
    created: p.created,
  };
}

// 18. Get a single payment method by ID
export async function getPaymentMethod(creds, id) {
  const pm = await stripeFetch(`/payment_methods/${id}`, creds);
  return {
    id: pm.id,
    type: pm.type,
    customerId: pm.customer ?? null,
    card: pm.card
      ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
          country: pm.card.country ?? null,
        }
      : null,
    billingEmail: pm.billing_details?.email ?? null,
    billingName: pm.billing_details?.name ?? null,
    created: pm.created,
  };
}

// 19. List payment methods for a specific customer
export async function listCustomerPaymentMethods(creds, customerId, limit = 10) {
  const data = await stripeFetch(`/customers/${customerId}/payment_methods?limit=${limit}`, creds);
  return (data.data ?? []).map((pm) => ({
    id: pm.id,
    type: pm.type,
    card: pm.card
      ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        }
      : null,
    billingEmail: pm.billing_details?.email ?? null,
    billingName: pm.billing_details?.name ?? null,
    created: pm.created,
  }));
}

// 20. Search customers using Stripe's Search API
export async function searchCustomers(creds, query, limit = 10) {
  const data = await stripeFetch(
    `/customers/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    creds,
  );
  return (data.data ?? []).map((c) => ({
    id: c.id,
    email: c.email ?? null,
    name: c.name ?? null,
    currency: c.currency ?? null,
    created: c.created,
  }));
}

// 21. Search charges using Stripe's Search API
export async function searchCharges(creds, query, limit = 10) {
  const data = await stripeFetch(
    `/charges/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    creds,
  );
  return (data.data ?? []).map((c) => ({
    id: c.id,
    amount: c.amount / 100,
    currency: c.currency?.toUpperCase() ?? '',
    status: c.status,
    description: c.description ?? null,
    receiptEmail: c.receipt_email ?? null,
    created: c.created,
  }));
}

// 22. Search invoices using Stripe's Search API
export async function searchInvoices(creds, query, limit = 10) {
  const data = await stripeFetch(
    `/invoices/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    creds,
  );
  return (data.data ?? []).map((i) => ({
    id: i.id,
    customerId: i.customer,
    customerEmail: i.customer_email ?? null,
    amountDue: i.amount_due / 100,
    amountPaid: i.amount_paid / 100,
    currency: i.currency?.toUpperCase() ?? '',
    status: i.status,
    created: i.created,
  }));
}

// 23. Search payment intents using Stripe's Search API
export async function searchPaymentIntents(creds, query, limit = 10) {
  const data = await stripeFetch(
    `/payment_intents/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    creds,
  );
  return (data.data ?? []).map((p) => ({
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    customerId: p.customer ?? null,
    description: p.description ?? null,
    created: p.created,
  }));
}

// 24. Search subscriptions using Stripe's Search API
export async function searchSubscriptions(creds, query, limit = 10) {
  const data = await stripeFetch(
    `/subscriptions/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    creds,
  );
  return (data.data ?? []).map((s) => ({
    id: s.id,
    status: s.status,
    customerId: s.customer,
    currentPeriodEnd: s.current_period_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    created: s.created,
  }));
}

// 25. Search products using Stripe's Search API
export async function searchProducts(creds, query, limit = 10) {
  const data = await stripeFetch(
    `/products/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    creds,
  );
  return (data.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    active: p.active,
    created: p.created,
  }));
}

// 26. List uploaded files (documents, dispute evidence, etc.)
export async function listFiles(creds, limit = 10) {
  const data = await stripeFetch(`/files?limit=${limit}`, creds);
  return (data.data ?? []).map((f) => ({
    id: f.id,
    filename: f.filename ?? null,
    purpose: f.purpose,
    size: f.size,
    type: f.type ?? null,
    url: f.url ?? null,
    created: f.created,
  }));
}

// 27. Get a single file by ID
export async function getFile(creds, id) {
  const f = await stripeFetch(`/files/${id}`, creds);
  return {
    id: f.id,
    filename: f.filename ?? null,
    purpose: f.purpose,
    size: f.size,
    type: f.type ?? null,
    url: f.url ?? null,
    expiresAt: f.expires_at ?? null,
    created: f.created,
  };
}

// 28. List file links (shareable URLs for uploaded files)
export async function listFileLinks(creds, limit = 10) {
  const data = await stripeFetch(`/file_links?limit=${limit}`, creds);
  return (data.data ?? []).map((fl) => ({
    id: fl.id,
    fileId: fl.file,
    url: fl.url,
    expired: fl.expired,
    expiresAt: fl.expires_at ?? null,
    created: fl.created,
  }));
}

// 29. List payment links
export async function listPaymentLinks(creds, limit = 10) {
  const data = await stripeFetch(`/payment_links?limit=${limit}`, creds);
  return (data.data ?? []).map((pl) => ({
    id: pl.id,
    active: pl.active,
    url: pl.url,
    currency: pl.currency?.toUpperCase() ?? null,
    amountTotal: pl.amount != null ? pl.amount / 100 : null,
    created: pl.created,
  }));
}

// 30. Get a single payment link by ID
export async function getPaymentLink(creds, id) {
  const pl = await stripeFetch(`/payment_links/${id}`, creds);
  return {
    id: pl.id,
    active: pl.active,
    url: pl.url,
    currency: pl.currency?.toUpperCase() ?? null,
    amountTotal: pl.amount != null ? pl.amount / 100 : null,
    afterCompletion: pl.after_completion ?? null,
    allowPromotionCodes: pl.allow_promotion_codes,
    created: pl.created,
  };
}
