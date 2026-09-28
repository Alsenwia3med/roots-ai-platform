export interface CookieConsentRecord {
  version: string;
  analytics: boolean;
  decidedAt: string;
}

export const CONSENT_STORAGE_KEY = "roots-ai.cookie-consent";
export const CURRENT_CONSENT_VERSION = "1.0.1";
