import React from "react";

export const Pub01GoldenScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#040D1A] text-white">
      <header className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div className="text-xl font-bold tracking-wider">ROOTS-AI™</div>
        <button className="bg-cyan-500 text-slate-950 px-4 py-2 rounded-lg font-medium">
          Get Started
        </button>
      </header>
      <section className="py-20 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
          Biological Intelligence
        </h1>
        <p className="text-slate-400 text-lg md:text-xl">
          Decoding body signals across interconnected biological networks.
        </p>
      </section>
    </div>
  );
};
