import { PublicPage } from "../../components/public/PublicPage";

export default function BlogPage() {
  return <PublicPage eyebrow="Insights" title="Medicine Before Symptoms™ — Insights" intro="Educational articles about metabolism, hunger, sleep, circadian biology, stress, behaviour and responsible health technology." cards={[{ title: "Insights in preparation", body: "Our first evidence-informed insights are being prepared. Please return soon." }, { title: "Educational by design", body: "Every article will display author, review date, sources and an educational disclaimer." }, { title: "No personalized medical advice", body: "Published articles are educational and are not personalized medical advice." }]} cta={false} />;
}
