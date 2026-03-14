const steps = [
  { n: 1, label: 'Select species', active: true },
  { n: 2, label: 'Find match', active: false },
  { n: 3, label: 'Review results', active: false },
];

const Sidebar = () => {
  return (
    <aside className="flex w-[230px] flex-shrink-0 flex-col min-h-screen border-r border-white/[0.06] px-6 py-7">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#4ec49a]/50 text-[#4ec49a] text-xs font-bold">
          ?
        </div>
        <span className="text-white font-bold tracking-[0.15em] text-base">PALEO</span>
      </div>

      {/* Progress */}
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#94c3a9]/50 mb-5">
          Progress
        </p>
        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div key={step.n}>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.active
                      ? 'bg-[#4ec49a] text-[#061d16]'
                      : 'border border-[#94c3a9]/25 text-[#94c3a9]/40'
                  }`}
                >
                  {step.n}
                </div>
                <span
                  className={`text-sm ${
                    step.active ? 'font-semibold text-[#eef5e9]' : 'text-[#94c3a9]/45'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`ml-[13px] h-8 w-px ${step.active ? 'bg-[#4ec49a]/25' : 'bg-white/[0.06]'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Data sources */}
      <div className="rounded-2xl bg-[#0b2318] border border-white/[0.06] p-4">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#94c3a9]/50 mb-2">
          Data Sources
        </p>
        <p className="text-[0.76rem] leading-[1.55] text-[#94c3a9]/60">
          Genomic similarity from NCBI BLAST mitochondrial alignments. Ecology from IUCN Red List
          API v3.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
