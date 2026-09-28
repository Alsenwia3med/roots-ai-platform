import { PublicPage } from "../../components/public/PublicPage";

export default function ExampleReportPage() {
  return <PublicPage eyebrow="Example Report" title="Sample Report Overview" intro="Your ROOTS-AI wellness report contains 19 detailed sections across seven key domains." cards={[{ title: "Metabolic Wellness", body: "Energy production and glucose regulation insights based on your assessment responses." }, { title: "Hormonal Balance", body: "Comprehensive analysis of endocrine system patterns and regulatory state." }, { title: "Sleep Quality", body: "Detailed assessment of sleep patterns, recovery, and regeneration capacity." }, { title: "Cellular Health", body: "Cellular resilience and oxidative stress evaluation from your responses." }, { title: "Stress Resilience", body: "Nervous system adaptability and stress response capacity analysis." }, { title: "Immune Function", body: "Immune defense and inflammatory response patterns assessment." }]} />;
}
