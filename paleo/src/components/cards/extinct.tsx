type EpochType = 'pleistocene' | 'modern' | 'early-modern';

type ExtinctCardProps = {
  period?: string;
  epochType?: EpochType;
  emoji?: string;
  title?: string;
  scientificName?: string;
  description?: string;
  tags?: string[];
  role?: string;
  mass?: string;
  range?: string;
  onSelect?: () => void;
};

const epochColor: Record<EpochType, string> = {
  pleistocene: 'text-[#5bc8e5]',
  modern: 'text-[#e8934a]',
  'early-modern': 'text-[#4dbf94]',
};

const ExtinctCard = ({
  period = 'Pleistocene · 4,000 BCE',
  epochType = 'pleistocene',
  emoji = '🦣',
  title = 'Woolly Mammoth',
  scientificName = 'Mammuthus primigenius',
  description = 'Shaped the mammoth steppe through grazing — their loss cascaded through entire tundra ecosystems.',
  tags = ['Megaherbivore', 'Cold-adapted', 'Keystone species'],
  role = 'Ecosystem engineer',
  mass = '6,000 kg',
  range = 'Eurasia',
  onSelect,
}: ExtinctCardProps) => {
  return (
    <article
      className="relative isolate w-full overflow-hidden rounded-[22px] px-8 pb-8 pt-7 text-[#eef5e9] shadow-[0_24px_56px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] [background:radial-gradient(circle_at_88%_8%,rgba(130,220,170,0.12),transparent_34%),linear-gradient(162deg,#0f2e20_0%,#0b2a1d_52%,#08261a_100%)] cursor-pointer hover:shadow-[0_28px_64px_rgba(0,0,0,0.44),inset_0_1px_0_rgba(255,255,255,0.1)] transition-shadow duration-200"
      aria-label={`${title} summary card`}
    >
      {/* Arrow button */}
      <button
        onClick={onSelect}
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        aria-label={`View ${title} details`}
      >
        →
      </button>

      {/* Era label */}
      <div className={`mb-5 text-[0.67rem] font-bold uppercase tracking-[0.18em] ${epochColor[epochType]}`}>
        {period}
      </div>

      {/* Emoji */}
      <div
        className="mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(202,255,220,0.07),0_8px_20px_rgba(0,0,0,0.2)] [background:radial-gradient(circle_at_40%_36%,rgba(149,231,178,0.18),rgba(26,76,56,0.18)_64%,rgba(6,36,26,0.1))]"
        aria-hidden="true"
      >
        <span className="text-5xl leading-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
          {emoji}
        </span>
      </div>

      <h2 className="m-0 font-serif text-[1.9rem] font-bold leading-[1.12] tracking-[-0.02em] text-[#f2f7f0]">
        {title}
      </h2>
      <p className="mt-2 text-[0.95rem] italic font-medium leading-[1.35] text-[#a5d0b2]/90">
        {scientificName}
      </p>
      <p className="mt-5 text-[0.92rem] leading-[1.6] text-[#dceee1]/70">
        {description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="list" aria-label="traits">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-[#a4e1bd]/[0.13] bg-[#4b7d62]/25 px-3 py-[7px] text-[0.8rem] font-medium leading-none text-[#e0f0e4]/75"
            role="listitem"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 w-full border-t border-[#9ad2b1]/[0.15]" aria-hidden="true" />

      <dl className="mt-5 grid grid-cols-3 gap-x-4 p-0">
        {[
          { label: 'Role', value: role },
          { label: 'Mass', value: mass },
          { label: 'Range', value: range },
        ].map(({ label, value }) => (
          <div key={label}>
            <dt className="mb-[6px] text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[#94c3a9]/60">
              {label}
            </dt>
            <dd className="m-0 text-[0.96rem] font-bold leading-[1.26] text-[#ecf7ed]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
};

export default ExtinctCard;
