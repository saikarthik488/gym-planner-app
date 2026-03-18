export function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}