import React, { useState } from 'react';
import {
  ShieldAlert,
  Radio,
  Sparkles,
  RotateCcw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const Header: React.FC = () => {
  const {
    systemStatus,
    loadScenario,
    resetAllData,
    isSimulatedOffline,
    toggleSimulatedOffline,
    incidents,
  } = useDisaster();

  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const criticalCount = incidents.filter((i) => i.severity === 'Critical').length;

  return (
    <header className="sticky top-0 z-40 bg-[#0B111E]/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Operational Scenario */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="w-5 h-5 text-cyan-100" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-white font-mono">
                SafeHaven<span className="text-cyan-400">.AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                EOC ORCHESTRATOR
              </span>
              {criticalCount > 0 && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-semibold bg-red-950/80 text-red-300 border border-red-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  {criticalCount} Critical
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Active Scenario:</span>
              <span className="text-slate-200 font-medium">Manila Basin Typhoon Flood Simulation</span>
            </p>
          </div>
        </div>

        {/* Center: System Status Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">SIM TIME:</span>
            <span className="text-slate-200 font-semibold">10:30 UTC+8</span>
          </div>

          <div
            onClick={toggleSimulatedOffline}
            title="Click to test offline/fallback mode"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border cursor-pointer transition-colors ${
              !isSimulatedOffline
                ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-300'
                : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI:</span>
            <span className="font-semibold">
              {!isSimulatedOffline ? 'GEMINI 3.8 FLASH' : 'DEMO FALLBACK'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>MAP INTEL:</span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
        </div>

        {/* Right: Scenario Switcher & Reset */}
        <div className="flex items-center gap-2">
          {/* Scenario Trigger Menu */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Scenario</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-lg shadow-2xl z-50 p-2 text-xs">
                <div className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  1-Click Hackathon Scenarios
                </div>

                <button
                  onClick={() => {
                    loadScenario('scenario_a');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-slate-800 flex items-start gap-2 text-slate-200 transition-colors"
                >
                  <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-mono text-[10px] font-bold mt-0.5">
                    A
                  </span>
                  <div>
                    <div className="font-semibold text-white">Critical Distress & Route Detour</div>
                    <div className="text-[11px] text-slate-400">
                      Tumana inundation; bypasses submerged J.P. Rizal St
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    loadScenario('scenario_b');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-slate-800 flex items-start gap-2 text-slate-200 transition-colors"
                >
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 font-mono text-[10px] font-bold mt-0.5">
                    B
                  </span>
                  <div>
                    <div className="font-semibold text-white">Medical Emergency Triage</div>
                    <div className="text-[11px] text-slate-400">
                      Malanday diabetic coma & hypothermia hospital allocation
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    loadScenario('scenario_c');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-slate-800 flex items-start gap-2 text-slate-200 transition-colors"
                >
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 font-mono text-[10px] font-bold mt-0.5">
                    C
                  </span>
                  <div>
                    <div className="font-semibold text-white">Shelter Overcapacity Guard</div>
                    <div className="text-[11px] text-slate-400">
                      Marikina Sports Center hits 98%; re-routes to Concepcion
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    loadScenario('scenario_d');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-slate-800 flex items-start gap-2 text-slate-200 transition-colors"
                >
                  <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-mono text-[10px] font-bold mt-0.5">
                    D
                  </span>
                  <div>
                    <div className="font-semibold text-white">Multilingual Emergency Alerts</div>
                    <div className="text-[11px] text-slate-400">
                      Tagalog, English, Indonesian, Thai warning broadcasts
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    loadScenario('scenario_e');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-slate-800 flex items-start gap-2 text-slate-200 transition-colors"
                >
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold mt-0.5">
                    E
                  </span>
                  <div>
                    <div className="font-semibold text-white">AI Outage & Fallback Resiliency</div>
                    <div className="text-[11px] text-slate-400">
                      Simulate network/API failure with transparent DEMO MODE
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Reset Baseline */}
          <button
            onClick={() => {
              if (confirm('Reset all demonstration incidents, capacities, and routes to initial baseline?')) {
                resetAllData();
              }
            }}
            title="Reset All Scenario Data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
