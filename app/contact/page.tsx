import { PublicPage } from "../../components/public/PublicPage";

export default function ContactPage() {
  return <PublicPage eyebrow="Contact" title="Start the right conversation" intro="Use the secure form for product support, privacy requests, research collaboration or business enquiries. Do not send urgent medical information." cards={[{ title: "Product Support", body: "For questions about the platform and approved public experience." }, { title: "Privacy", body: "Use the secure Contact page for privacy and data-rights requests." }, { title: "Research", body: "For approved research and professional collaboration enquiries." }, { title: "Business", body: "For business enquiries, use the approved contact workflow." }]} />;
}
