import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Explorer from './pages/Explorer';
import SwipeScreen from './components/screens/SwipeScreen';
import ResultScreen from './components/screens/ResultScreen';
import extinctData from './data/extinct.json';
import type { ExtinctSpecies, Candidate } from './types';

const allExtinct = extinctData as ExtinctSpecies[];

type AppState =
  | { screen: 'explorer' }
  | { screen: 'swipe'; extinct: ExtinctSpecies }
  | { screen: 'result'; extinct: ExtinctSpecies; matched: Candidate };

export default function App() {
  const [state, setState] = useState<AppState>({ screen: 'explorer' });

  const handleSelect = (id: string) => {
    const match = allExtinct.find((s) => s.id === id);
    if (match) setState({ screen: 'swipe', extinct: match });
  };

  const handleMatch = (extinct: ExtinctSpecies, candidate: Candidate) => {
    setState({ screen: 'result', extinct, matched: candidate });
  };

  const handleReset = () => {
    setState({ screen: 'explorer' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {state.screen === 'explorer' && (
            <Explorer onSelect={handleSelect} />
          )}
          {state.screen === 'swipe' && (
            <SwipeScreen
              extinct={state.extinct}
              onMatch={(candidate) => handleMatch(state.extinct, candidate)}
            />
          )}
          {state.screen === 'result' && (
            <ResultScreen
              extinct={state.extinct}
              matched={state.matched}
              onReset={handleReset}
            />
          )}
        </main>
      </div>
    </div>
  );
}
