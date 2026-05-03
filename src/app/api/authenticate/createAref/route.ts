import { NextRequest } from 'next/server';
import { ok, err, validateBase, createdEmails } from '../../_testHelpers';

// In the real API, codeAref is inherited from the calling user's JWT.
// Here we accept it from the body as a fallback for testing.
const DEFAULT_AREF = process.env.TEST_CODE_AREF ?? 'AREF-TEST-01';

export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();

  const baseError = validateBase(body);
  if (baseError) return baseError;

  const codeAref = String(body.codeAref ?? DEFAULT_AREF).trim();

  createdEmails.add(email);

  return ok({
    message: 'AREF manager created successfully',
    user: {
      email,
      full_name: body.full_name ?? body.fullName,
      userType: 'RESPONSABLE_SI',
      codeAref,
    },
  });
}
