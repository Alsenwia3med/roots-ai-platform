export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#1A2A4A] mb-4">From Answers to Biological Intelligence</h1>
        <p className="text-lg text-[#5B6577] mb-12">
          Every layer is designed to make complex biological context easier to understand, without overstating what the data can tell us.
        </p>

        {/* The controlled sequence */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1A2A4A] mb-6">The controlled sequence</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1A2A4A] text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
              <div>
                <h3 className="text-xl font-bold text-[#1A2A4A] mb-2">Assessment</h3>
                <p className="text-[#5B6577]">Answer a structured set of questions about your biological context and lived experience.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1A2A4A] text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
              <div>
                <h3 className="text-xl font-bold text-[#1A2A4A] mb-2">Validation</h3>
                <p className="text-[#5B6577]">Approved rules normalize responses and preserve uncertainty rather than filling gaps.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1A2A4A] text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
              <div>
                <h3 className="text-xl font-bold text-[#1A2A4A] mb-2">Interpretation</h3>
                <p className="text-[#5B6577]">The ROOTS-AI engine organizes signals into domains, drivers, and derived indicators.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1A2A4A] text-white rounded-full flex items-center justify-center font-bold text-xl">4</div>
              <div>
                <h3 className="text-xl font-bold text-[#1A2A4A] mb-2">Report</h3>
                <p className="text-[#5B6577]">Receive clear language, confidence notes, and next-step context in an immutable report.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1A2A4A] text-white rounded-full flex items-center justify-center font-bold text-xl">5</div>
              <div>
                <h3 className="text-xl font-bold text-[#1A2A4A] mb-2">AI assists with language generation only.</h3>
                <p className="text-[#5B6577]">AI does not diagnose, prescribe, change scores, or invent participant facts.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1A2A4A] text-white rounded-full flex items-center justify-center font-bold text-xl">6</div>
              <div>
                <h3 className="text-xl font-bold text-[#1A2A4A] mb-2">Provenance & Transparency</h3>
                <p className="text-[#5B6577]">Every AI output is tagged with source references and confidence levels.</p>
              </div>
            </div>
          </div>
        </div>

        {/* What AI does */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1A2A4A] mb-6">What AI does</h2>
          <div className="bg-[#EEF2F8] p-6 rounded-lg">
            <ul className="space-y-3 text-[#5B6577]">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Assists with language generation for report clarity</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Provides context-aware explanations</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Suggests evidence-based next steps</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Helps communicate complex biological concepts</span>
              </li>
            </ul>
          </div>
        </div>

        {/* What AI does not do */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1A2A4A] mb-6">What AI does not do</h2>
          <div className="bg-[#FEF2F2] p-6 rounded-lg">
            <ul className="space-y-3 text-[#5B6577]">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Diagnose medical conditions</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Prescribe treatments or medications</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Change assessment scores</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Invent participant facts or data</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Override deterministic scoring rules</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Privacy */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1A2A4A] mb-6">Privacy</h2>
          <div className="bg-[#F0FDF4] p-6 rounded-lg">
            <p className="text-[#5B6577] mb-4">
              Your data is encrypted, stored securely, and never sold. You have full control over your information and can delete it at any time.
            </p>
            <ul className="space-y-2 text-[#5B6577]">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>End-to-end encryption</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Row-Level Security (RLS) policies</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Right to deletion</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Transparent data usage</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4">
          <a
            href="/assessment"
            className="px-8 py-4 bg-[#1A2A4A] text-white font-semibold rounded-lg hover:bg-[#24365C] transition-colors"
          >
            Start Your Assessment
          </a>
          <a
            href="/example-report"
            className="px-8 py-4 bg-white text-[#1A2A4A] font-semibold rounded-lg border-2 border-[#1A2A4A] hover:bg-[#EEF2F8] transition-colors"
          >
            View Example Report
          </a>
        </div>
      </div>
    </div>
  );
}
