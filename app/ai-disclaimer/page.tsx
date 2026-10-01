import type { Metadata } from "next";

import {
  AiDisclaimerScreen,
  aiDisclaimerMetadata,
} from "../../components/legal/AiDisclaimerScreen";

/** LEG-05 — /ai-disclaimer. Required by C-05 §2 and linked from the C-04 footer. */
export const metadata: Metadata = aiDisclaimerMetadata;

export default function AiDisclaimerPage() {
  return <AiDisclaimerScreen />;
}