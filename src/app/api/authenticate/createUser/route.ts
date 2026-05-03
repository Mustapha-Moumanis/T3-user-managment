import { NextRequest } from 'next/server';
import { ok, err, validateBase, createdEmails, randomVerificationCode } from '../../_testHelpers';

const ROUTED_TYPES = ['CORRECTOR', 'RESPONSABLE_SI', 'CHEF_CORRECTION', 'RESPONSABLE_CENTRE_EXAMEN'];

export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const userType = String(body.userType ?? '');
  const email = String(body.email ?? '').trim().toLowerCase();
  const fullName = String(body.fullName ?? body.full_name ?? '').trim();

  if (!ROUTED_TYPES.includes(userType)) {
    return err(`unsupported userType: ${userType}. Expected one of: ${ROUTED_TYPES.join(', ')}`);
  }

  const baseError = validateBase(body);
  if (baseError) return baseError;

  if (userType === 'CORRECTOR') {
    if (!String(body.codeCentre ?? '').trim()) return err('codeCentre is required for CORRECTOR');
    const matieres = body.matieres;
    if (!matieres || !Array.isArray(matieres) || matieres.length === 0) {
      return err('matieres (non-empty array) is required for CORRECTOR');
    }
  }

  if (userType === 'RESPONSABLE_SI') {
    if (!String(body.codeAref ?? '').trim()) return err('codeAref is required for RESPONSABLE_SI');
  }

  if (userType === 'CHEF_CORRECTION') {
    if (!String(body.codeCentre ?? '').trim()) return err('codeCentre is required for CHEF_CORRECTION');
    if (!String(body.codeAref ?? '').trim()) return err('codeAref is required for CHEF_CORRECTION');
  }

  if (userType === 'RESPONSABLE_CENTRE_EXAMEN') {
    if (!String(body.codeCentre ?? '').trim()) return err('codeCentre is required for RESPONSABLE_CENTRE_EXAMEN');
  }

  createdEmails.add(email);

  const verificationCode = (userType === 'RESPONSABLE_CENTRE_EXAMEN') ? randomVerificationCode() : undefined;

  return ok({
    message: 'User created successfully',
    user: {
      email,
      fullName,
      userType,
      ...(body.codeCentre ? { codeCentre: body.codeCentre } : {}),
      ...(body.codeAref ? { codeAref: body.codeAref } : {}),
      ...(body.matieres ? { matieres: body.matieres } : {}),
      ...(verificationCode ? { verificationCode } : {}),
    },
  });
}
