import React, { useState } from 'react';
import {
  Megaphone,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Radio,
  Send,
  Edit3,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { EmergencyAlert } from '../../types';
import { generateEmergencyAlertWithGemini } from '../../services/geminiService';

export const AlertsCommunications: React.FC = () => {
  const { alerts, addAlert, approveAlert } = useDisaster();

  // Generator form state
  const [selectedLanguage, setSelectedLanguage] = useState<
    'English' | 'Filipino' | 'Bahasa Indonesia' | 'Thai' | 'Japanese' | 'Hindi'
  >('Filipino');

  const [templateType, setTemplateType] = useState<
    | 'flood_evacuation'
    | 'typhoon_warning'
    | 'shelter_directions'
    | 'road_closure'
    | 'medical_aid'
    | 'capacity_change'
  >('flood_evacuation');

  const [area, setArea] = useState('Barangay Tumana and Malanday, Marikina River');
  const [hazard, setHazard] = useState('3rd Alarm River Overflow (18.2m Water Level)');
  const [urgency, setUrgency] = useState('IMMEDIATE MANDATORY EVACUATION');
  const [recommendedAction, setRecommendedAction] = useState(
    'Proceed to Concepcion Integrated School via Bayan-Bayanan elevated ridge road'
  );
  const [shelterFacility, setShelterFacility] = useState(
    'Concepcion Integrated School Evacuation Center'
  );
  const [customNotes, setCustomNotes] = useState(
    'J.P. Rizal St is submerged and closed to all vehicles.'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [approverName, setApproverName] = useState('Incident Commander Maria Santos');

  // Active inspecting alert
  const [activeAlertId, setActiveAlertId] = useState<string>(alerts[0]?.id || '');
  const activeAlert = alerts.find((a) => a.id === activeAlertId) || alerts[0];

  const handleGenerateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const generated = await generateEmergencyAlertWithGemini({
        templateType,
        area,
        hazard,
        urgency,
        recommendedAction,
        shelterOrFacility: shelterFacility,
        language: selectedLanguage,
        customNotes,
      });

      const newAlert: EmergencyAlert = {
        id: `ALT-${Date.now().toString().slice(-4)}`,
        templateType,
        area,
        hazard,
        urgency,
        recommendedAction,
        shelterOrFacility: shelterFacility,
        language: selectedLanguage,
        headline: generated.headline,
        content: generated.content,
        smsOptimizedContent: generated.smsOptimizedContent,
        keySafetyInstructions: generated.keySafetyInstructions,
        status: 'Draft',
        isFallback: generated.isFallback,
        createdAt: new Date().toISOString(),
      };

      addAlert(newAlert);
      setActiveAlertId(newAlert.id);
    } catch (err: any) {
      console.error('Alert generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied message text to clipboard!');
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <span>Multilingual Emergency Alerts & Public Communications</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated translation and localization across 6 JAPAC languages with strict human operator broadcast certification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Simulated Broadcast Engine Active</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Generator & Approved Alerts Library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (5 cols): Alert Draft Generator */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleGenerateAlert}
            className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm text-xs"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Draft Localized Advisory via Gemini AI</span>
            </h3>

            {/* Language Selector */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Language & Region:</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                {(
                  [
                    'English',
                    'Filipino',
                    'Bahasa Indonesia',
                    'Thai',
                    'Japanese',
                    'Hindi',
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    className={`py-1.5 px-2.5 rounded border transition-colors ${
                      selectedLanguage === lang
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Type */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Alert Scenario Template:</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as any)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="flood_evacuation">Mandatory Flood Evacuation Order</option>
                <option value="typhoon_warning">Typhoon Gale Warning & Stay Indoors</option>
                <option value="shelter_directions">Safe Shelter Ingress Directions</option>
                <option value="road_closure">Emergency Road Submersion / Closure Notice</option>
                <option value="medical_aid">Medical Triage Hub & Medic Dispatch</option>
                <option value="capacity_change">Shelter Overcapacity / Redirection</option>
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Affected Area / Barangay:</label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Hazard & Urgency */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hazard / Threat:</label>
                <input
                  type="text"
                  required
                  value={hazard}
                  onChange={(e) => setHazard(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Urgency:</label>
                <input
                  type="text"
                  required
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Action & Receiving Facility */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Recommended Action:</label>
              <textarea
                rows={2}
                required
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Verified Shelter / Safe Point:</label>
              <input
                type="text"
                required
                value={shelterFacility}
                onChange={(e) => setShelterFacility(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Road Closure / Safety Note:</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGenerating
                  ? `Crafting ${selectedLanguage} Advisory...`
                  : `Generate & Stage Alert (${selectedLanguage})`}
              </span>
            </button>
          </form>
        </div>

        {/* Right Col (7 cols): Staged Alert Inspection, SMS preview & Broadcast Certification */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Staged Emergency Advisories & Broadcast Queue</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Strict human verification boundary: No public warning dispatched without operator authorization
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400">
                {alerts.length} Total Alerts
              </span>
            </div>

            {/* Alert Selector tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
              {alerts.map((al) => (
                <button
                  key={al.id}
                  onClick={() => setActiveAlertId(al.id)}
                  className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeAlert?.id === al.id
                      ? 'bg-slate-800 border-cyan-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{al.id}</span>
                  <span className="text-[10px] text-slate-500">[{al.language}]</span>
                  {al.status === 'Approved_Ready' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              ))}
            </div>

            {activeAlert && (
              <div className="space-y-4 pt-1">
                {/* Status banner */}
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                    activeAlert.status === 'Approved_Ready'
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono">
                    {activeAlert.status === 'Approved_Ready' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold">OFFICIALLY CERTIFIED FOR SIMULATED BROADCAST</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="font-bold">DRAFT ONLY — PENDING HUMAN OPERATOR SIGN-OFF</span>
                      </>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    Language: {activeAlert.language}
                  </span>
                </div>

                {/* Headline & Full Broadcast Copy */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      OFFICIAL PUBLIC BROADCAST COPY
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeAlert.content)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white font-mono">
                    {activeAlert.headline}
                  </h4>

                  <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed pt-1">
                    {activeAlert.content}
                  </pre>
                </div>

                {/* SMS Compact Preview (160 Chars) */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>CELL BROADCAST / SMS COMPACT (MAX 160 CHARS):</span>
                    <span className="text-cyan-400">
                      {activeAlert.smsOptimizedContent.length} / 160
                    </span>
                  </div>
                  <p className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
                    {activeAlert.smsOptimizedContent}
                  </p>
                </div>

                {/* Key Safety Bullet Points */}
                {activeAlert.keySafetyInstructions && (
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                      Key Safety Directives:
                    </span>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {activeAlert.keySafetyInstructions.map((dir, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{dir}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Operator Approval / Simulation Broadcast Button */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 font-mono">
                    {activeAlert.status === 'Approved_Ready' ? (
                      <span>Certified by: {activeAlert.approvedBy}</span>
                    ) : (
                      <span>Awaiting certification</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeAlert.status !== 'Approved_Ready' ? (
                      <button
                        onClick={() => {
                          approveAlert(activeAlert.id, approverName);
                          alert(`Advisory ${activeAlert.id} approved and signed by ${approverName}!`);
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sign & Approve Warning</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          alert(
                            `[SIMULATED DISPATCH TEST]: Emergency advisory ${activeAlert.id} successfully queued to test cellular broadcast tower simulated gateways in ${activeAlert.area}. (Zero real public warnings emitted).`
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Test Simulated Broadcast</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
