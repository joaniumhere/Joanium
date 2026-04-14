const BASE = 'https://api.stripe.com/v1';

function headers(creds) {
  // Stripe accepts the secret key as a Bearer token
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
