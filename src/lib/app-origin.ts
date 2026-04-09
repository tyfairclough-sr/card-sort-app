/** Base URL for absolute links (emails, redirects). */
export function getAppOrigin(): string {
  const authUrl = process.env.AUTH_URL?.trim().replace(/\/$/, "");
  if (authUrl) return authUrl;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:6001";
}
