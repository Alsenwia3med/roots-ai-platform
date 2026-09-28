import { PublicPage } from "../../components/public/PublicPage";

export default function AboutPage() {
  return <PublicPage eyebrow="ROOTS / About" title="Medicine Before Symptoms™" intro="ROOTS AI HEALTH SYSTEMS, Inc. builds educational tools that make biological context clearer and more useful." cards={[{ title: "Our principle", body: "Good interpretation starts with humility: data can inform a conversation without defining a person." }, { title: "Our standard", body: "We combine structured inputs, deterministic rules, careful governance, and transparent communication." }, { title: "Get in touch", body: "For product, research, or professional enquiries, use the Contact link in the footer." }]} />;
}
