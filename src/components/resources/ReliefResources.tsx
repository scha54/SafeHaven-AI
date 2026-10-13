import React, { useState } from 'react';
import {
  PackageCheck,
  Home,
  Shield,
  Activity,
  Droplet,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { Resource, ResourceType } from '../../types';
import { findMatchingResources } from '../../services/resourceMatcher';

export const ReliefResources: React.FC = () => {
  const {
    resources,
    incidents,
    updateResource,
    allocateResource,
    releaseResourceAllocation,
    importResourcesFromCSV,
    selectedIncident,
    setSelectedIncident,
    loadScenario,
  } = useDisaster();

  const [activeTypeTab, setActiveTypeTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingIncidentId, setMatchingIncidentId] = useState<string>(
    selectedIncident?.id || incidents[0]?.id || ''
  );
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  const targetIncident = incidents.find((i) => i.id === matchingIncidentId) || incidents[0];

  // Run matching engine
  const matchCandidates = targetIncident
    ? findMatchingResources(targetIncident, resources)
    : [];

  const filteredResources = resources.filter((res) => {
    const matchesType = activeTypeTab === 'ALL' || res.type === activeTypeTab;
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.location.barangay || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'resource_id',
      'resource_name',
      'resource_type',
      'latitude',
      'longitude',
      'total_capacity',
      'occupied_capacity',
      'cots_available',
      'drinking_water_liters',
      'food_packs_available',
      'medical_kits_available',
      'availability_status',
    ];
    const rows = resources.map((r) => [
      r.id,
      `"${r.name}"`,
      r.type,
      r.location.lat,
      r.location.lng,
      r.totalCapacity ?? '',
      r.occupiedCapacity ?? '',
      r.cotsAvailable ?? '',
      r.drinkingWaterLiters ?? '',
      r.foodPacks ?? '',
      r.medicalKits ?? '',
      r.availabilityStatus,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safehaven_resources_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleImportCsv = () => {
    if (!csvInput.trim()) return;
    const result = importResourcesFromCSV(csvInput);
    if (result.success) {
      alert(`Successfully imported ${result.count} resources!`);
      setShowCsvModal(false);
      setCsvInput('');
    } else {
      alert(`Import error: ${result.error}`);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-400" />
            <span>Intelligent Relief Resource Allocation & Inventory</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated matching based on proximity, live capacity, skills, and overbooking prevention safeguards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadScenario('scenario_c')}
            className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
            <span>Simulate Shelter 98% Cap (Scenario C)</span>
          </button>

          <button
            onClick={() => setShowCsvModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Resource Matching Engine Recommendation Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-800/50 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Intelligent Allocation Matcher & Proximity Ranking
              </h3>
              <p className="text-xs text-slate-400">
                Evaluating destination capacity, specialized trauma care, and water rescue equipment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">For Incident:</span>
            <select
              value={matchingIncidentId}
              onChange={(e) => {
                setMatchingIncidentId(e.target.value);
                const inc = incidents.find((i) => i.id === e.target.value);
                if (inc) setSelectedIncident(inc);
              }}
              className="p-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-cyan-500 font-mono w-full md:w-80"
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  [{inc.id}] {inc.title.slice(0, 40)}... ({inc.severity})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top 3 Match Candidates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {matchCandidates.slice(0, 3).map((candidate, idx) => {
            const isAssigned = candidate.resource.assignedIncidentIds.includes(
              targetIncident?.id || ''
            );

            return (
              <div
                key={candidate.resource.id}
                className={`p-3.5 rounded-lg border space-y-2.5 transition-all ${
                  !candidate.isEligible
                    ? 'bg-red-950/20 border-red-900/50 opacity-80'
                    : idx === 0
                    ? 'bg-slate-900 border-cyan-500/70 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase">
                      RANK #{idx + 1} • {candidate.resource.type.toUpperCase()}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1">
                      {candidate.resource.name}
                    </h4>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-mono ${
                        candidate.isEligible ? 'text-cyan-400' : 'text-red-400'
                      }`}
                    >
                      {candidate.matchScore}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Match</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Distance from scene:</span>
                    <span className="text-white font-mono font-semibold">
                      {candidate.distanceKm} km
                    </span>
                  </div>

                  {candidate.resource.totalCapacity && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Available Space:</span>
                      <span className="text-white font-mono font-semibold">
                        {(candidate.resource.totalCapacity || 0) -
                          (candidate.resource.occupiedCapacity || 0)}{' '}
                        spots
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800">
                  {candidate.rationale}
                </p>

                <div className="pt-1">
                  {isAssigned ? (
                    <button
                      onClick={() =>
                        releaseResourceAllocation(targetIncident.id, candidate.resource.id)
                      }
                      className="w-full py-1.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-semibold transition-colors"
                    >
                      Release Allocation
                    </button>
                  ) : candidate.isEligible ? (
                    <button
                      onClick={() => {
                        const success = allocateResource(targetIncident.id, candidate.resource.id);
                        if (success) {
                          alert(`Allocated ${candidate.resource.name} to ${targetIncident.id}!`);
                        }
                      }}
                      className="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      Commit Allocation
                    </button>
                  ) : (
                    <div className="text-center py-1 text-[11px] text-red-400 font-mono font-semibold">
                      Constraint: Ineligible
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Filtering Tabs & Search */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-mono">
          {['ALL', 'shelter', 'hospital', 'rescue_team', 'supply_depot', 'volunteer_group'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTypeTab(t)}
              className={`px-3 py-1 rounded transition-colors uppercase ${
                activeTypeTab === t
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search facility name, skill, or barangay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => {
          const isHospital = resource.type === 'hospital';
          const isShelter = resource.type === 'shelter';
          const isRescue = resource.type === 'rescue_team';
          const isFull = resource.availabilityStatus === 'At_Capacity';

          const freeCap =
            resource.totalCapacity && resource.occupiedCapacity !== undefined
              ? resource.totalCapacity - resource.occupiedCapacity
              : null;

          return (
            <div
              key={resource.id}
              className={`p-4 rounded-xl border space-y-3 transition-all ${
                isFull
                  ? 'bg-red-950/20 border-red-900/60'
                  : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400">
                      {resource.id}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                      {resource.type.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white pt-1">
                    {resource.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {resource.location.address}
                  </p>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                    isFull
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {resource.availabilityStatus.replace('_', ' ')}
                </span>
              </div>

              {/* Capacities / Specs */}
              {resource.totalCapacity !== undefined && (
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Occupancy:</span>
                    <span className={isFull ? 'text-red-400 font-bold' : 'text-slate-200'}>
                      {resource.occupiedCapacity} / {resource.totalCapacity} ({freeCap} free)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull
                          ? 'bg-red-500'
                          : ((resource.occupiedCapacity || 0) / (resource.totalCapacity || 1)) > 0.75
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((resource.occupiedCapacity || 0) / (resource.totalCapacity || 1)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Supplies breakdown if available */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-300">
                {resource.drinkingWaterLiters !== undefined && (
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">WATER</span>
                    <span>{resource.drinkingWaterLiters.toLocaleString()} L</span>
                  </div>
                )}
                {resource.foodPacks !== undefined && (
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">FOOD PACKS</span>
                    <span>{resource.foodPacks.toLocaleString()}</span>
                  </div>
                )}
                {resource.medicalKits !== undefined && (
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MED KITS</span>
                    <span>{resource.medicalKits}</span>
                  </div>
                )}
                {resource.crewCount !== undefined && (
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">CREW COUNT</span>
                    <span>{resource.crewCount} personnel</span>
                  </div>
                )}
              </div>

              {resource.notes && (
                <p className="text-[11px] text-slate-400 italic border-t border-slate-800 pt-2">
                  "{resource.notes}"
                </p>
              )}

              {/* Status Toggle Button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">
                  Tel: {resource.contactNumber}
                </span>

                <button
                  onClick={() => {
                    const newStatus = isFull ? 'Available' : 'At_Capacity';
                    updateResource(resource.id, {
                      availabilityStatus: newStatus as any,
                    });
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {isFull ? 'Mark Available' : 'Mark At Capacity'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Import Resource Inventory CSV</span>
              </h3>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Paste CSV contents below. Must include headers: <code>resource_id, resource_name, resource_type, latitude, longitude, total_capacity, occupied_capacity, drinking_water_liters, food_packs_available, medical_kits_available</code>
            </p>

            <textarea
              rows={8}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder={`resource_id,resource_name,resource_type,latitude,longitude,total_capacity,occupied_capacity,drinking_water_liters,food_packs,medical_kits
RES-09,Loyola Heights Evacuation Hall,shelter,14.6400,121.0770,300,45,2000,500,20`}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md font-mono text-[11px] text-white focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-md bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCsv}
                className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
              >
                Parse & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
