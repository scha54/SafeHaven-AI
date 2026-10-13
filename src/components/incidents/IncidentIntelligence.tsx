import React, { useState } from 'react';
import {
  Flame,
  Search,
  Filter,
  Plus,
  Sparkles,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Clock,
  MapPin,
  Users,
  FileText,
  Camera,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import {
  Incident,
  IncidentCategory,
  Severity,
  SourceType,
  VulnerabilityTag,
} from '../../types';
import { calculatePriorityBreakdown, scoreToSeverity } from '../../services/priorityEngine';
import { analyzeIncidentWithGemini } from '../../services/geminiService';

export const IncidentIntelligence: React.FC = () => {
  const {
    incidents,
    addIncident,
    updateIncident,
    selectedIncident,
    setSelectedIncident,
    setActiveTab,
    isSimulatedOffline,
  } = useDisaster();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // New Incident Intake Form state
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: IncidentCategory;
    barangay: string;
    lat: number;
    lng: number;
    peopleAffected: number;
    vulnerabilities: VulnerabilityTag[];
    source: SourceType;
    imageBase64?: string;
    imageMimeType?: string;
    imageFileName?: string;
    audioTranscript?: string;
  }>({
    title: '',
    description: '',
    category: 'flood',
    barangay: 'Tumana',
    lat: 14.6575,
    lng: 121.0965,
    peopleAffected: 4,
    vulnerabilities: ['children'],
    source: 'citizen_report',
    audioTranscript: '',
  });

  // Operator override drawer state
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [operatorNotes, setOperatorNotes] = useState<string>('');

  // Handle preset locations in Manila basin
  const PRESET_LOCATIONS = [
    { name: 'Bgy. Tumana (Riverside Floodway)', lat: 14.6575, lng: 121.0965, barangay: 'Tumana' },
    { name: 'Bgy. Malanday (Gen. Luna Corridor)', lat: 14.6685, lng: 121.0930, barangay: 'Malanday' },
    { name: 'Provident Village (Low Basin)', lat: 14.6360, lng: 121.0875, barangay: 'Jesus Dela Peña' },
    { name: 'Bgy. Nangka (Twin River Slope)', lat: 14.6730, lng: 121.1090, barangay: 'Nangka' },
    { name: 'Bgy. Barangka (A. Bonifacio Ave)', lat: 14.6310, lng: 121.0790, barangay: 'Barangka' },
    { name: 'Bgy. Concepcion Uno (Bayan-Bayanan)', lat: 14.6510, lng: 121.1060, barangay: 'Concepcion Uno' },
  ];

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        imageBase64: reader.result as string,
        imageMimeType: file.type,
        imageFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleVulnerabilityToggle = (v: VulnerabilityTag) => {
    setFormData((prev) => {
      const exists = prev.vulnerabilities.includes(v);
      return {
        ...prev,
        vulnerabilities: exists
          ? prev.vulnerabilities.filter((item) => item !== v)
          : [...prev.vulnerabilities, v],
      };
    });
  };

  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please provide incident title and description.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // 1. Multimodal AI Analysis
      const analysis = await analyzeIncidentWithGemini({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: { lat: formData.lat, lng: formData.lng, address: formData.barangay },
        peopleAffected: formData.peopleAffected,
        vulnerabilities: formData.vulnerabilities,
        imageBase64: formData.imageBase64,
        mimeType: formData.imageMimeType,
      });

      // 2. Explainable Prioritization calculation
      const breakdown = calculatePriorityBreakdown(
        {
          category: formData.category,
          peopleAffected: formData.peopleAffected,
          vulnerabilities: formData.vulnerabilities,
          description: formData.description,
        },
        { confidenceScore: analysis.confidenceScore }
      );

      const newId = `INC-${(incidents.length + 1).toString().padStart(2, '0')}`;
      const now = new Date().toISOString();

      const newIncident: Incident = {
        id: newId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: {
          lat: formData.lat,
          lng: formData.lng,
          address: `${formData.barangay}, Marikina City`,
          barangay: formData.barangay,
          city: 'Marikina',
        },
        timestamp: now,
        peopleAffected: formData.peopleAffected,
        vulnerabilities: formData.vulnerabilities,
        source: formData.source,
        status: 'Triaged',
        priorityScore: breakdown.totalScore,
        severity: scoreToSeverity(breakdown.totalScore),
        priorityBreakdown: breakdown,
        imageUrl: formData.imageBase64,
        audioTranscript: formData.audioTranscript,
        analysis,
        verifiedByHuman: false,
        createdAt: now,
        updatedAt: now,
      };

      addIncident(newIncident);
      setSelectedIncident(newIncident);
      setShowIntakeModal(false);

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'flood',
        barangay: 'Tumana',
        lat: 14.6575,
        lng: 121.0965,
        peopleAffected: 4,
        vulnerabilities: ['children'],
        source: 'citizen_report',
        audioTranscript: '',
      });
    } catch (err: any) {
      console.error('Failed to analyze and save incident:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filtered queue
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.location.barangay || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === 'ALL' || inc.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || inc.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span>Incident Intelligence & Multimodal Intake</span>
          </h2>
          <p className="text-xs text-slate-400">
            Multimodal ingestion, image damage inspection, explainable priority scoring, and dispatcher triage
          </p>
        </div>

        <button
          onClick={() => setShowIntakeModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Distress Intake</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search incident ID, keyword, or barangay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Severity:</span>
          </div>
          {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                selectedSeverity === sev
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Split List and Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident Cards Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing {filteredIncidents.length} incident reports</span>
            <span className="font-mono">Sorted by Priority Score</span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              const isCrit = incident.severity === 'Critical';
              const isHigh = incident.severity === 'High';

              return (
                <div
                  key={incident.id}
                  onClick={() => {
                    setSelectedIncident(incident);
                    setOverrideScore(incident.priorityScore);
                    setOperatorNotes(incident.operatorNotes || '');
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-[#0F172A] border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                            isCrit
                              ? 'bg-red-950 text-red-300 border border-red-800/60'
                              : isHigh
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                          }`}
                        >
                          {incident.severity}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-200">
                          {incident.id}
                        </span>

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {incident.location.barangay}
                        </span>

                        {incident.verifiedByHuman ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                            Unverified AI Triage
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-white pt-0.5">
                        {incident.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {incident.description}
                      </p>
                    </div>

                    {/* Priority score badge */}
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-500">PRIORITY</div>
                      <div
                        className={`text-xl font-bold font-mono ${
                          isCrit ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-cyan-400'
                        }`}
                      >
                        {incident.priorityScore}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 mt-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {incident.peopleAffected} affected
                      </span>
                      {incident.imageUrl && (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Camera className="w-3.5 h-3.5" />
                          Image Attached
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">
                        {incident.status.replace('_', ' ')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Incident Inspector & Explainable Breakdown (5 cols) */}
        <div className="lg:col-span-5">
          {selectedIncident ? (
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-5 sticky top-20 shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {selectedIncident.id}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedIncident.category.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {selectedIncident.title}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-cyan-400">
                    {selectedIncident.priorityScore}
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">
                    {selectedIncident.severity} Severity
                  </span>
                </div>
              </div>

              {/* Uploaded Media / Evidence if present */}
              {selectedIncident.imageUrl && (
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Scene Photographic Evidence</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Multimodal Vision Active</span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black/40 max-h-48">
                    <img
                      src={selectedIncident.imageUrl}
                      alt="Incident scene"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] text-slate-300 font-mono">
                      Analyzed by Gemini 3.8 Flash Vision
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Transcript if present */}
              {selectedIncident.audioTranscript && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Emergency Call Audio Transcript:
                  </span>
                  <p className="text-slate-200 italic">"{selectedIncident.audioTranscript}"</p>
                </div>
              )}

              {/* AI Structured Analysis: Facts vs Inferences */}
              {selectedIncident.analysis && (
                <div className="space-y-3 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Multimodal Analysis</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Confidence: {Math.round(selectedIncident.analysis.confidenceScore * 100)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedIncident.analysis.incidentSummary}
                  </p>

                  {/* Observed Facts vs Model Inferences */}
                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        ✓ Verified Observed Facts:
                      </span>
                      <ul className="space-y-1 text-slate-300 text-[11px]">
                        {selectedIncident.analysis.observedFacts.map((fact, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block mb-1">
                        ⚡ Model-Derived Inferences (Requires Human Sign-off):
                      </span>
                      <ul className="space-y-1 text-slate-300 text-[11px]">
                        {selectedIncident.analysis.modelInferences.map((inf, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{inf}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Explainable Scoring Breakdown */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-300 block">
                  Priority Scoring Decomposition:
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {selectedIncident.priorityBreakdown.explanation}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-center">
                    <span className="text-slate-500 block">Hazard</span>
                    <span className="text-white font-bold">
                      +{selectedIncident.priorityBreakdown.baseHazardPoints} pts
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-center">
                    <span className="text-slate-500 block">Population</span>
                    <span className="text-white font-bold">
                      +{selectedIncident.priorityBreakdown.populationPoints} pts
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-center">
                    <span className="text-slate-500 block">Vulnerability</span>
                    <span className="text-white font-bold">
                      +{selectedIncident.priorityBreakdown.vulnerabilityPoints} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Operator Override & Actions */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Operator Override:</span>
                  <button
                    onClick={() => {
                      updateIncident(selectedIncident.id, {
                        verifiedByHuman: true,
                        priorityScore: overrideScore,
                        severity: scoreToSeverity(overrideScore),
                        operatorNotes,
                      });
                      alert(`Incident ${selectedIncident.id} verified and updated!`);
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
                  >
                    Commit Override
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Adjust Score:</span>
                    <span className="text-cyan-400 font-bold">{overrideScore} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Quick Workflow Action Shortcuts */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('routing')}
                    className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Plan Rescue Route</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('resources')}
                    className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Match Resources</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-8 text-center text-slate-500 space-y-2">
              <Eye className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium">Select an incident to inspect multimodal intelligence.</p>
              <p className="text-xs text-slate-600">
                Inspect AI observed facts vs deductions, priority decomposition, and trigger response workflows.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Distress Intake Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  <span>Log New Distress Intake Report</span>
                </h3>
                <p className="text-xs text-slate-400">
                  System will trigger Gemini multimodal extraction, check nearby hazard polygons, and score urgency
                </p>
              </div>

              <button
                onClick={() => setShowIntakeModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitIntake} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Incident Headline / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rapid River Spillway Overflow — Families Trapped on Roof"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Citizen / Responder Statement *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe observed conditions, estimated water depth, building type, accessibility barriers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hazard Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as IncidentCategory })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="flood">Riverine Flood / Inundation</option>
                    <option value="medical_emergency">Medical Emergency</option>
                    <option value="landslide">Landslide / Slope Collapse</option>
                    <option value="structural_damage">Structural Damage / Downed Power</option>
                    <option value="storm_surge">Storm Surge</option>
                    <option value="typhoon">Typhoon Gale Damage</option>
                    <option value="other">Other Distress</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">People Affected Estimate</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.peopleAffected}
                    onChange={(e) => setFormData({ ...formData, peopleAffected: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Location Preset Picker */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Location (Manila Basin Preset or Coordinates)
                </label>
                <select
                  onChange={(e) => {
                    const loc = PRESET_LOCATIONS.find((l) => l.name === e.target.value);
                    if (loc) {
                      setFormData({
                        ...formData,
                        barangay: loc.barangay,
                        lat: loc.lat,
                        lng: loc.lng,
                      });
                    }
                  }}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-500"
                >
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} ({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vulnerabilities Toggle */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Vulnerability Indicators Present:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['elderly', 'children', 'infants', 'mobility_impaired', 'medical_critical', 'pregnant'] as VulnerabilityTag[]).map((tag) => {
                    const selected = formData.vulnerabilities.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleVulnerabilityToggle(tag)}
                        className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors border ${
                          selected
                            ? 'bg-red-950 text-red-300 border-red-700'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {tag.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Optional Scene Photo Upload (Multimodal Vision)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700"
                  />
                  {formData.imageFileName && (
                    <span className="text-[11px] text-cyan-400 font-mono">
                      {formData.imageFileName}
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-5 py-2 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Running Gemini Triage...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze & Commit Incident</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
