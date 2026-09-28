import { PublicPage } from "../../components/public/PublicPage";

export default function HowItWorksPage() {
  return <PublicPage eyebrow="The ROOTS-AI method" title="How It Works" intro="Every layer is designed to make complex biological context easier to understand, without overstating what the data can tell us." cards={[{ title: "Assessment", body: "Answer a structured set of questions about your biological context and lived experience." }, { title: "Validation", body: "Approved rules normalize responses and preserve uncertainty rather than filling gaps." }, { title: "Interpretation", body: "The ROOTS-AI engine organizes signals into domains, drivers, and derived indicators." }, { title: "Report", body: "Receive clear language, confidence notes, and next-step context in an immutable report." }, { title: "AI assists with language generation only.", body: "AI does not diagnose, prescribe, change scores, or invent participant facts." }]} />;
}
