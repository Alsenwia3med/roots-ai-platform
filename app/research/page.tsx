import { PublicPage } from "../../components/public/PublicPage";

export default function ResearchPage() {
  return <PublicPage eyebrow="ROOTS / Research" title="Research with context." intro="We work with researchers and healthcare professionals to validate useful, responsible ways of understanding biological context." cards={[{ title: "Pilot program", body: "Independent pilots help us evaluate clarity, usefulness, and participant experience before new biological layers are introduced." }, { title: "Evidence first", body: "Every new signal must be separately validated and governed. The platform does not turn an association into a diagnosis." }, { title: "For professionals", body: "Our reports are designed to support informed conversations and education, not replace clinical judgment." }]} />;
}
