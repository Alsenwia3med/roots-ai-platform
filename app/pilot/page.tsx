import { PublicPage } from "../../components/public/PublicPage";

export default function PilotPage() {
  return <PublicPage eyebrow="Pilot Program" title="Join the ROOTS-AI™ Free Beta" intro="The beta explores whether a structured, non-diagnostic assessment can help people understand self-reported patterns involving weight resistance, energy, sleep, stress and appetite." cards={[{ title: "Adults aged 18 and over", body: "Participation is intended for adults aged 18 and over." }, { title: "Voluntary participation", body: "Participation is voluntary and withdrawal is permitted." }, { title: "Educational experience", body: "The experience is educational and does not provide medical care." }]} />;
}
