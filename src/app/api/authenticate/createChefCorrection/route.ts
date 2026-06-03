import { NextRequest } from 'next/server';
import { ok, err, validateBase, createdEmails } from '../../_testHelpers';

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS ?? 'test.com,example.com,gov.ma').split(',');

// Track codeCentre per codeAref to prevent duplicates
const centreByAref = new Map<string, Set<string>>();

export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const domain = email.split('@')[1] ?? '';

  if (!ALLOWED_DOMAINS.includes(domain)) {
    return err(`email domain "${domain}" is not allowed. Allowed: ${ALLOWED_DOMAINS.join(', ')}`, 403);
  }

  const baseError = validateBase(body);
  if (baseError) return baseError;

  const codeCentre = String(body.codeCentre ?? '').trim();
  const codeAref = String(body.codeAref ?? '').trim();

  if (!codeCentre) return err('codeCentre is required');
  if (!codeAref) return err('codeAref is required');

  const used = centreByAref.get(codeAref) ?? new Set();
  if (used.has(codeCentre)) {
    return err(`codeCentre "${codeCentre}" already has a chef de correction for aref "${codeAref}"`, 409);
  }

  used.add(codeCentre);
  centreByAref.set(codeAref, used);
  createdEmails.add(email);

  return ok({
    message: 'Chef de correction created successfully',
    user: {
      email,
      name: body.name,
      userType: 'CHEF_CORRECTION',
      codeCentre,
      codeAref,
    },
  });
}
