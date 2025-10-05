import { OAuth2Client } from 'google-auth-library';
import { serialize } from 'cookie';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ ok: false, error: 'no_credential' });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    const session = JSON.stringify({
      sub: payload.sub,
      email: payload.email,
      name: payload.name
    });

    res.setHeader('Set-Cookie', serialize('session', session, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    }));

    return res.status(200).json({ ok: true, user: { email: payload.email, name: payload.name } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'verify_failed' });
  }
}


