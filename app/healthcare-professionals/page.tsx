import { PublicPage } from "../../components/public/PublicPage";

export default function HealthcareProfessionalsPage() {
  return <PublicPage eyebrow="For Professionals" title="A clearer basis for informed conversations." intro="ROOTS-AI is designed to support education and conversation without replacing clinical judgment." cards={[{ title: "Context first", body: "Reports organize self-reported patterns into a transparent educational view." }, { title: "Governed explanation", body: "Deterministic rules calculate indicators; governed language explains approved content." }, { title: "Not a clinical replacement", body: "ROOTS-AI does not diagnose, prescribe, or replace professional care." }]} />;
}
