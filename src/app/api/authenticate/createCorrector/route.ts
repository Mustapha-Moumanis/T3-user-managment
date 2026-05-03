import { NextRequest } from 'next/server';
import { ok, err, validateBase, createdEmails } from '../../_testHelpers';

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS ?? 'test.com,example.com,gov.ma').split(',');

export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const domain = email.split('@')[1] ?? '';

  if (!ALLOWED_DOMAINS.includes(domain)) {
    return err(`email domain "${domain}" is not allowed. Allowed: ${ALLOWED_DOMAINS.join(', ')}`, 403);
  }

  const baseError = validateBase(body);
  if (baseError) return baseError;

  if (!String(body.codeCentre ?? '').trim()) return err('codeCentre is required');
  const matieres = body.matieres;
  if (!matieres || !Array.isArray(matieres) || matieres.length === 0) {
    return err('matieres (non-empty array) is required');
  }

  createdEmails.add(email);

  return ok({
    message: 'Corrector created successfully',
    user: {
      email,
      fullName: body.fullName,
      userType: 'CORRECTOR',
      codeCentre: body.codeCentre,
      matieres,
    },
  });
}
