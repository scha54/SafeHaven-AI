import React, { useState } from 'react';
import {
  Navigation as NavIcon,
  Shield,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCw,
  Compass,
  FileCheck,
  Send,
  Truck,
  Anchor,
  XCircle,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import {
  Incident,
  Resource,
  RouteRecommendation,
} from '../../types';
import { planOptimalRoute } from '../../services/routingService';

export const RescueRouting: React.FC = () => {
  const {
    incidents,
    resources,
    roadSegments,
    routes,
    addRoute,
    approveRoute,
    selectedIncident,
    setSelectedIncident,
    setActiveTab,
  } = useDisaster();

  // Active planning state
  const [activeIncidentId, setActiveIncidentId] = useState<string>(
    selectedIncident?.id || incidents[0]?.id || ''
  );
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('RES-02');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('RES-05');
  const [responseMode, setResponseMode] = useState<
    'Rescue_Boat' | 'High_Water_Truck' | 'Ambulance' | 'Pedestrian_Evacuation'
  >('Rescue_Boat');

  const [approverName, setApproverName] = useState<string>(
    'Incident Commander Maria Santos'
  );

  const activeIncident = incidents.find((i) => i.id === activeIncidentId) || incidents[0];
  const eligibleDestinations = resources.filter(
    (r) => r.type === 'shelter' || r.type === 'hospital'
  );
  const availableTeams = resources.filter((r) => r.type === 'rescue_team');

  // Compute or retrieve candidate routes for active incident
  const currentRoutes = routes.filter((r) => r.incidentId === activeIncident?.id);

  const handleGenerateRoute = () => {
    if (!activeIncident) return;
    const dest = resources.find((r) => r.id === selectedDestinationId);
    if (!dest) return;

    const newRoute = planOptimalRoute({
      incidentId: activeIncident.id,
      incidentTitle: activeIncident.title,
      startLocation: activeIncident.location,
      destinationLocation: dest.location,
      destinationResourceId: dest.id,
      destinationName: dest.name,
      responseMode,
      roadSegments,
    });

    addRoute(newRoute);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <NavIcon className="w-5 h-5 text-cyan-400" />
            <span>Rescue & Evacuation Route Planning</span>
          </h2>
          <p className="text-xs text-slate-400">
            Graph-based A* routing avoiding submerged corridors with human-in-the-loop dispatch authorization
          </p>
        </div>

        <button
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>View on Geospatial Map</span>
        </button>
      </div>

      {/* Main Grid: Route Configuration Form & Generated Candidate Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (5 cols): Route Parameters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Route Parameters & Asset Selection</span>
            </h3>

            {/* Incident Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Distress Incident:
              </label>
              <select
                value={activeIncidentId}
                onChange={(e) => {
                  setActiveIncidentId(e.target.value);
                  const inc = incidents.find((i) => i.id === e.target.value);
                  if (inc) setSelectedIncident(inc);
                }}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {incidents
                  .filter((i) => i.status !== 'Resolved')
                  .map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      [{inc.id}] {inc.title.slice(0, 48)}... ({inc.severity})
                    </option>
                  ))}
              </select>
            </div>

            {/* Active Incident Details Preview */}
            {activeIncident && (
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{activeIncident.location.address}</span>
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase">
                    {activeIncident.severity}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {activeIncident.description}
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Coordinates: {activeIncident.location.lat.toFixed(4)}°N, {activeIncident.location.lng.toFixed(4)}°E
                </div>
              </div>
            )}

            {/* Asset / Team Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deploying Rescue Asset / Team:
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.teamSkills?.[0] || 'Rescue Team'})
                  </option>
                ))}
              </select>
            </div>

            {/* Response Transit Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Response Transit Mode:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'Rescue_Boat', label: 'Zodiac / Boat', icon: Anchor },
                  { id: 'High_Water_Truck', label: '6x6 High Truck', icon: Truck },
                  { id: 'Ambulance', label: 'Ambulance EMT', icon: Shield },
                  { id: 'Pedestrian_Evacuation', label: 'Walking Evac', icon: NavIcon },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = responseMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setResponseMode(mode.id as any)}
                      className={`p-2.5 rounded-lg border flex items-center gap-2 font-medium transition-all ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destination Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destination Receiving Facility:
              </label>
              <select
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {eligibleDestinations.map((dest) => {
                  const isFull = dest.occupiedCapacity && dest.totalCapacity
                    ? dest.occupiedCapacity >= dest.totalCapacity * 0.95
                    : false;

                  return (
                    <option key={dest.id} value={dest.id} disabled={isFull}>
                      {dest.name} ({dest.type}) {isFull ? '— FULL (98%)' : `— Available`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Road Constraints Info */}
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulated Road Network Constraints Active</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                J.P. Rizal St (125cm submerged) and Marcos Highway Underpass are designated IMPASSABLE. Route algorithm will automatically calculate detour over Bayan-Bayanan high-elevation ridge.
              </p>
            </div>

            {/* Compute Button */}
            <button
              onClick={handleGenerateRoute}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>Calculate Safe Rescue Path</span>
            </button>
          </div>
        </div>

        {/* Right Col (7 cols): Calculated Route Comparison & Human Approval */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  <span>Proposed Route Recommendations & Review</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Human-in-the-loop authorization required before field team dispatch
                </p>
              </div>

              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                {currentRoutes.length} Proposal(s)
              </span>
            </div>

            {currentRoutes.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Compass className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-medium">No route recommendation computed yet for this incident.</p>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Click "Calculate Safe Rescue Path" on the left or select a 1-click scenario from the top bar to evaluate candidate routes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentRoutes.map((route) => {
                  const isApproved = route.status === 'Operator_Approved';

                  return (
                    <div
                      key={route.id}
                      className={`p-4 rounded-xl border space-y-4 transition-all ${
                        isApproved
                          ? 'bg-slate-900/90 border-emerald-500/50 shadow-md'
                          : 'bg-slate-900/80 border-slate-700'
                      }`}
                    >
                      {/* Route Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">
                              {route.id}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-white">
                              Destination: {route.destinationName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Mode: <span className="text-slate-200 font-mono">{route.responseMode.replace('_', ' ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            }`}
                          >
                            {route.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Route Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                        <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block">TOTAL DISTANCE</span>
                          <span className="text-white font-bold text-sm">
                            {route.totalDistanceKm} km
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block">EST. DURATION</span>
                          <span className="text-cyan-300 font-bold text-sm">
                            {route.estimatedDurationMins} mins
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block">HAZARDS BYPASSED</span>
                          <span className="text-emerald-400 font-bold text-sm">
                            {route.hazardAvoidedCount} closures
                          </span>
                        </div>
                      </div>

                      {/* Explainable Rationale */}
                      <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                          Algorithm Routing Rationale:
                        </span>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {route.rationale}
                        </p>
                      </div>

                      {/* Waypoints Sequence */}
                      <div className="space-y-1.5 text-xs">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">
                          Verified Waypoint Sequence:
                        </span>
                        <div className="flex flex-col gap-1 pl-2 border-l border-slate-700">
                          {route.waypoints.map((wp, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                              <span className="font-medium">{wp.name}</span>
                              <span className="text-[10px] font-mono text-slate-500">
                                ({wp.lat.toFixed(4)}, {wp.lng.toFixed(4)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Operator Sign-off Form */}
                      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-slate-400 w-full sm:w-auto">
                          {isApproved ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Authorized by {route.approvedBy}</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Awaiting Human Dispatch Authorization</span>
                            </span>
                          )}
                        </div>

                        {!isApproved && (
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => {
                                approveRoute(route.id, approverName);
                                alert(`Route ${route.id} approved! Emergency dispatch notified.`);
                              }}
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Authorize & Dispatch</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
