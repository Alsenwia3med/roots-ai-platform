import { Questionnaire } from "../../components/assessment/Questionnaire";

export default function AssessmentPage() {
  return (
    <main className="min-h-screen bg-[#FAF8] text-[#1A1A1A]">
      <header className="border-b border-[#D8DEE8] bg-[#1A2A4A] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <a href="/" className="font-semibold" aria-label="ROOTS-AI home">ROOTS-AI™</a>
          <span className="text-sm text-white/90">Educational assessment</span>
        </div>
      </header>
      <Questionnaire />
    </main>
  );
}
