import { NextRequest } from 'next/server';
import { createdEmails, EMAIL_RE, randomVerificationCode } from '../_testHelpers';

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);

  let csvText = '';
  if (formData) {
    const file = formData.get('file') as File | null;
    if (file) csvText = await file.text();
  }

  if (!csvText.trim()) {
    return Response.json({ message: 'CSV file is required (multipart field: file)' }, { status: 400 });
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return Response.json({ message: 'CSV must have at least a header row and one data row' }, { status: 400 });
  }

  const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const emailCol = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
  const nameCol = headers.findIndex((h) => h.includes('name') || h.includes('nom'));
  const centreCol = headers.findIndex((h) => h.includes('centre'));

  const created: object[] = [];
  const skipped: object[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(',').map((c) => c.trim());
    const email = emailCol >= 0 ? cols[emailCol]?.toLowerCase() ?? '' : '';
    const fullName = nameCol >= 0 ? cols[nameCol] ?? '' : '';
    const codeCentre = centreCol >= 0 ? cols[centreCol] ?? '' : '';

    if (!email || !EMAIL_RE.test(email) || !fullName) {
      skipped.push({ row: i, reason: 'missing required fields' });
      continue;
    }

    if (createdEmails.has(email)) {
      skipped.push({ row: i, email, reason: 'already exists' });
      continue;
    }

    createdEmails.add(email);
    created.push({
      email,
      fullName,
      codeCentre,
      userType: 'RESPONSABLE_CENTRE_EXAMEN',
      verificationCode: randomVerificationCode(),
    });
  }

  return Response.json({
    message: `${created.length} RESPONSABLE_CENTRE_EXAMEN created, ${skipped.length} skipped`,
    created,
    skipped,
  }, { status: 201 });
}
