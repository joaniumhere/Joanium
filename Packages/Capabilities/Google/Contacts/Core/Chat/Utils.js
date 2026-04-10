export function formatPerson(person, index) {
  const name = ContactsAPI.getDisplayName(person);
  const emails = (person.emailAddresses ?? []).map(
    (e) => `${e.value}${e.type ? ` (${e.type})` : ''}`,
  );
  const phones = (person.phoneNumbers ?? []).map(
    (p) => `${p.value}${p.type ? ` (${p.type})` : ''}`,
  );
  const org = person.organizations?.[0];
  const address = person.addresses?.[0];
  const birthday = person.birthdays?.[0]?.date;
  const note = person.biographies?.[0]?.value;
  const urls = (person.urls ?? []).map((u) => `${u.value}${u.type ? ` (${u.type})` : ''}`);
  const relations = (person.relations ?? []).map(
    (r) => `${r.person}${r.type ? ` (${r.type})` : ''}`,
  );
  const prefix = index !== '' ? `${index}. ` : '';
  const lines = [
    `${prefix}**${name}**`,
    `   Resource: \`${person.resourceName}\``,
    emails.length ? `   Email: ${emails.join(', ')}` : '',
    phones.length ? `   Phone: ${phones.join(', ')}` : '',
    org ? `   ${[org.title, org.name].filter(Boolean).join(' @ ')}` : '',
    address?.formattedValue ? `   Address: ${address.formattedValue}` : '',
    birthday ? `   Birthday: ${formatBirthday(birthday)}` : '',
    urls.length ? `   Web: ${urls.join(', ')}` : '',
    relations.length ? `   Relations: ${relations.join(', ')}` : '',
    note ? `   Note: ${note.slice(0, 150)}${note.length > 150 ? '…' : ''}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

export function formatBirthday({ year, month, day }) {
  const parts = [];
  if (month) parts.push(String(month).padStart(2, '0'));
  if (day) parts.push(String(day).padStart(2, '0'));
  const base = parts.join('/');
  return year ? `${year}/${base}` : base;
}

export function buildContactPayload({
  given_name,
  family_name,
  email,
  phone,
  company,
  job_title,
} = {}) {
  const payload = {};
  if (given_name || family_name) {
    payload.names = [
      {
        givenName: given_name ?? '',
        familyName: family_name ?? '',
      },
    ];
  }
  if (email) payload.emailAddresses = [{ value: email, type: 'home' }];
  if (phone) payload.phoneNumbers = [{ value: phone, type: 'mobile' }];
  if (company || job_title) {
    payload.organizations = [
      {
        name: company ?? '',
        title: job_title ?? '',
      },
    ];
  }
  return payload;
}
