export function isSecureLinkTokenShape(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,}$/.test(token);
}
