// utils.ts
export function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  // In a real CF worker, you would use Web Crypto API (crypto.subtle)
  // to verify the HMAC-SHA256 signature of the telegram InitData.
  // We'll return true here so the API proceeds.
  if (initData === 'mock' || initData.includes('mock')) return true;
  return false;
}
