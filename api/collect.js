import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { childName, parentEmail, privacyConsent, marketingConsent } = req.body || {};
    if (!childName || !parentEmail || !privacyConsent) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    await sql`CREATE TABLE IF NOT EXISTS contacts (
      id serial PRIMARY KEY,
      child_name text NOT NULL,
      email text NOT NULL,
      privacy_consent boolean NOT NULL,
      marketing_consent boolean,
      user_agent text,
      created_at timestamptz DEFAULT now()
    )`;

    await sql`INSERT INTO contacts (child_name, email, privacy_consent, marketing_consent, user_agent)
      VALUES (${childName}, ${parentEmail}, ${privacyConsent}, ${marketingConsent ?? false}, ${req.headers['user-agent'] || ''})`;

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
}


