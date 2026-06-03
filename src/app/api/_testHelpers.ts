// Shared helpers for the temp test API routes

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tracks created emails across requests (in-memory, resets on server restart)
export const createdEmails = new Set<string>();

export function ok(data: object, status = 201) {
  return Response.json(data, { status });
}

export function err(message: string, status = 400) {
  return Response.json({ message }, { status });
}

export function randomVerificationCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function validateBase(body: Record<string, unknown>) {
  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim();

  if (!email) return err('email is required');
  if (!EMAIL_RE.test(email)) return err('invalid email format');
  if (createdEmails.has(email)) return err('user with this email already exists', 409);
  if (!name) return err('name is required');

  return null;
}
