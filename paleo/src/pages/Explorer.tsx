import { useState } from 'react';
import ExtinctCard from '../components/cards/extinct';
import extinctData from '../data/extinct.json';
import type { ExtinctSpecies } from '../types';

const allExtinct = extinctData as ExtinctSpecies[];

const tabs = ['Overview', 'Genomics', 'Ecology'];

interface ExplorerProps {
  onSelect: (id: string) => void;
}

const Explorer = ({ onSelect }: ExplorerProps) => {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between px-10 pt-9 pb-7">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#94c3a9]/50 mb-2">
            Mission Select
          </p>
          <h1 className="text-[2.4rem] font-bold text-white leading-[1.1] tracking-[-0.025em] m-0">
            Which species do you revive?
          </h1>
        </div>

        <div className="flex items-center gap-1 mt-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-[7px] text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-[#94c3a9]/60 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-5 px-10 pb-10">
        {allExtinct.map((s) => (
          <ExtinctCard
            key={s.id}
            period={s.period}
            epochType={s.epochType}
            emoji={s.icon}
            title={s.name}
            scientificName={s.sci}
            description={s.blurb}
            tags={s.tags}
            role={s.role}
            mass={s.mass}
            range={s.range}
            onSelect={() => onSelect(s.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Explorer;
