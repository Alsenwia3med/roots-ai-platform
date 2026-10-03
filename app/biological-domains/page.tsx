export default function BiologicalDomainsPage() {
  return (
    <div className="min-h-screen bg-roots-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4 text-center">Seven Connected Domains</h1>
        <p className="text-xl text-roots-gray text-center mb-8">One biological intelligence framework</p>

        <div className="h-[600px] bg-roots-blue rounded-2xl overflow-hidden mb-8 flex items-center justify-center">
          <p className="text-roots-gray">3D Visualization Coming Soon</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-roots-blue p-6 rounded-lg border border-roots-blue-light">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                HU
              </div>
              <div>
                <div className="font-bold">Hunger & Appetite</div>
                <div className="text-xs text-roots-gray">Signals, Reward, Eating behaviour</div>
              </div>
            </div>
          </div>

          <div className="bg-roots-blue p-6 rounded-lg border border-roots-blue-light">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                ME
              </div>
              <div>
                <div className="font-bold">Metabolism</div>
                <div className="text-xs text-roots-gray">Energy, Insulin, Storage</div>
              </div>
            </div>
          </div>

          <div className="bg-roots-blue p-6 rounded-lg border border-roots-blue-light">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                SA
              </div>
              <div>
                <div className="font-bold">Safety & Immunity</div>
                <div className="text-xs text-roots-gray">Inflammation, Defense, Repair</div>
              </div>
            </div>
          </div>

          <div className="bg-roots-blue p-6 rounded-lg border border-roots-blue-light">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                SL
              </div>
              <div>
                <div className="font-bold">Sleep & Recovery</div>
                <div className="text-xs text-roots-gray">Rhythms, Hormones, Restoration</div>
              </div>
            </div>
          </div>

          <div className="bg-roots-blue p-6 rounded-lg border border-roots-blue-light">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                CI
              </div>
              <div>
                <div className="font-bold">Circadian Timing</div>
                <div className="text-xs text-roots-gray">Biological Clock, Hormonal Rhythm</div>
              </div>
            </div>
          </div>

          <div className="bg-roots-blue p-6 rounded-lg border border-roots-blue-light">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                ST
              </div>
              <div>
                <div className="font-bold">Stress Response</div>
                <div className="text-xs text-roots-gray">HPA Axis, Resilience, Adaptation</div>
              </div>
            </div>
          </div>

          <div className="bg-roots-blue p-6 rounded-lg border border-roots-blue-light md:col-span-2 lg:col-span-3">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                IN
              </div>
              <div>
                <div className="font-bold">Inflammation</div>
                <div className="text-xs text-roots-gray">Microbiome, Gut Barrier, Systemic Signals</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center italic text-roots-gray text-lg">
          "The body is not a collection of parts, but a network of conversations."
        </div>
      </div>
    </div>
  )
}
