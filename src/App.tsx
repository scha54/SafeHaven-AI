/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DisasterProvider, useDisaster } from './context/DisasterContext';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { IncidentIntelligence } from './components/incidents/IncidentIntelligence';
import { LiveDisasterMap } from './components/map/LiveDisasterMap';
import { RescueRouting } from './components/routing/RescueRouting';
import { ReliefResources } from './components/resources/ReliefResources';
import { AlertsCommunications } from './components/alerts/AlertsCommunications';
import { DataAIAudit } from './components/audit/DataAIAudit';
import { Shield, Sparkles, Terminal, Cpu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab } = useDisaster();

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col font-sans">
      <Header />
      <Navigation />

      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && <CommandCenter />}
        {activeTab === 'incidents' && <IncidentIntelligence />}
        {activeTab === 'map' && <LiveDisasterMap />}
        {activeTab === 'routing' && <RescueRouting />}
        {activeTab === 'resources' && <ReliefResources />}
        {activeTab === 'alerts' && <AlertsCommunications />}
        {activeTab === 'audit' && <DataAIAudit />}
      </main>

      {/* Persistent Operational Footer */}
      <footer className="bg-[#080D18] border-t border-slate-800/80 px-4 lg:px-6 py-3 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span className="text-slate-400 font-semibold">SafeHaven AI Orchestrator</span>
            <span>•</span>
            <span>JAPAC Disaster Response Command Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Gemini 3.8 Flash Multimodal</span>
            </span>
            <span>•</span>
            <span>Google Open Buildings Dataset</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Hackathon Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <DisasterProvider>
      <AppContent />
    </DisasterProvider>
  );
}
