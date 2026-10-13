import React from 'react';
import {
  AlertOctagon,
  Users,
  Home,
  Shield,
  Droplet,
  ClipboardCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  MapPin,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export const CommandCenter: React.FC = () => {
  const {
    incidents,
    resources,
    auditLogs,
    setActiveTab,
    setSelectedIncident,
    loadScenario,
  } = useDisaster();

  // Metrics
  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved' && i.status !== 'Rejected');
  const criticalCount = activeIncidents.filter((i) => i.severity === 'Critical').length;
  const highCount = activeIncidents.filter((i) => i.severity === 'High').length;
  const totalPeopleAffected = activeIncidents.reduce((sum, i) => sum + (i.peopleAffected || 0), 0);
  const pendingReviewCount = activeIncidents.filter((i) => !i.verifiedByHuman).length;

  const shelters = resources.filter((r) => r.type === 'shelter');
  const totalShelterCap = shelters.reduce((sum, s) => sum + (s.totalCapacity || 0), 0);
  const occupiedShelterCap = shelters.reduce((sum, s) => sum + (s.occupiedCapacity || 0), 0);
  const shelterOccupancyRate = totalShelterCap > 0 ? Math.round((occupiedShelterCap / totalShelterCap) * 100) : 0;

  const rescueTeams = resources.filter((r) => r.type === 'rescue_team');
  const availableRescueTeams = rescueTeams.filter((t) => t.availabilityStatus === 'Available').length;

  const totalWaterLiters = resources.reduce((sum, r) => sum + (r.drinkingWaterLiters || 0), 0);
  const totalMedicalKits = resources.reduce((sum, r) => sum + (r.medicalKits || 0), 0);

  // Severity Chart Data
  const severityData = [
    { name: 'Critical', value: activeIncidents.filter((i) => i.severity === 'Critical').length, color: '#EF4444' },
    { name: 'High', value: activeIncidents.filter((i) => i.severity === 'High').length, color: '#F59E0B' },
    { name: 'Medium', value: activeIncidents.filter((i) => i.severity === 'Medium').length, color: '#06B6D4' },
    { name: 'Low', value: activeIncidents.filter((i) => i.severity === 'Low').length, color: '#10B981' },
  ];

  // Hourly Trend Sample Data
  const trendData = [
    { time: '06:00', incidents: 2, rescued: 0 },
    { time: '07:00', incidents: 4, rescued: 1 },
    { time: '08:00', incidents: 7, rescued: 3 },
    { time: '09:00', incidents: 11, rescued: 6 },
    { time: '10:00', incidents: 15, rescued: 12 },
    { time: '10:30', incidents: 18, rescued: 16 },
  ];

  // Shelter Occupancy Breakdown
  const shelterData = shelters.map((s) => ({
    name: s.name.split(' ')[0],
    occupied: s.occupiedCapacity || 0,
    available: Math.max(0, (s.totalCapacity || 0) - (s.occupiedCapacity || 0)),
  }));

  // Top 5 Urgent Incidents
  const priorityQueue = [...activeIncidents].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Quick Scenario Highlights */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Marikina River Inundation Alert — 3rd Alarm Level (18.2m)
            </h2>
            <p className="text-xs text-slate-400">
              River spillway overflowing into low-lying compounds. Multiple trapped resident groups require boat extraction.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadScenario('scenario_a')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition-colors flex items-center gap-1.5"
          >
            <span>Trigger Scenario A</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Live Map</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Active Incidents */}
        <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{activeIncidents.length}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-red-400 font-semibold">{criticalCount} critical</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{highCount} high</span>
          </div>
        </div>

        {/* People Affected */}
        <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Affected</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalPeopleAffected}</div>
          <div className="text-[10px] text-slate-400 mt-1">Reported trapped or isolated</div>
        </div>

        {/* Shelters Occupancy */}
        <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Shelter Cap</span>
            <Home className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{shelterOccupancyRate}%</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {occupiedShelterCap} / {totalShelterCap} spaces
          </div>
        </div>

        {/* Rescue Teams */}
        <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Teams Ready</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {availableRescueTeams} <span className="text-xs text-slate-500 font-normal">/ {rescueTeams.length}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">PCG, Red Cross, MMDA</div>
        </div>

        {/* Drinking Water */}
        <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Water (L)</span>
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {(totalWaterLiters / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Potable reserves in hubs</div>
        </div>

        {/* Medical Kits */}
        <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Med Kits</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalMedicalKits}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across 3 hospital reserves</div>
        </div>

        {/* Pending Review */}
        <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Awaiting Verification</span>
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">{pendingReviewCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Human operator sign-off</div>
        </div>
      </div>

      {/* Main Grid: Priority Incident Queue & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Incident Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>Priority Incident Queue</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    Top {priorityQueue.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Triaged by explainable scoring algorithm (hazard, vulnerable people, isolation)
                </p>
              </div>

              <button
                onClick={() => setActiveTab('incidents')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
              >
                <span>View All ({activeIncidents.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {priorityQueue.map((incident) => {
                const isCritical = incident.severity === 'Critical';
                const isHigh = incident.severity === 'High';

                return (
                  <div
                    key={incident.id}
                    onClick={() => {
                      setSelectedIncident(incident);
                      setActiveTab('incidents');
                    }}
                    className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                            isCritical
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
                          {incident.location.barangay}, {incident.location.city}
                        </span>

                        {incident.vulnerabilities.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {incident.vulnerabilities.join(', ')}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {incident.title}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        {incident.priorityBreakdown.explanation}
                      </p>
                    </div>

                    <div className="flex items-center md:flex-col md:items-end justify-between gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                      <div className="text-right">
                        <div className="text-xs font-mono text-slate-400">PRIORITY SCORE</div>
                        <div
                          className={`text-lg font-bold font-mono ${
                            isCritical ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-cyan-400'
                          }`}
                        >
                          {incident.priorityScore}
                          <span className="text-xs text-slate-500">/100</span>
                        </div>
                      </div>

                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono">
                        {incident.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Timeline Trend Chart */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Incident Intake & Evacuation Curve</h3>
                <p className="text-xs text-slate-400">Cumulative flood distress calls vs field extractions</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                SIMULATION LIVE
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRescued" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B111E', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    name="Incoming Distress"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncidents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="rescued"
                    name="Extracted / Safe"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRescued)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Col: Severity Breakdown & Live Audit Feed */}
        <div className="space-y-6">
          {/* Severity Distribution Pie */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-1">Severity Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Active operational classifications</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B111E', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-xs">
              {severityData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}:</span>
                  <span className="font-mono font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shelter Occupancy Bar */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Shelter Capacities</h3>
              <button
                onClick={() => setActiveTab('resources')}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Manage
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Live headcounts across municipal centers</p>

            <div className="space-y-2.5">
              {shelters.slice(0, 3).map((shelter) => {
                const total = shelter.totalCapacity || 100;
                const occupied = shelter.occupiedCapacity || 0;
                const pct = Math.min(100, Math.round((occupied / total) * 100));
                const isOver = pct >= 95;

                return (
                  <div key={shelter.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[170px]">
                        {shelter.name}
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          isOver ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        {occupied} / {total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Operations Activity Feed */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Audit & Activity Feed</span>
              </h3>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Full Log
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-slate-700 pl-2.5 py-0.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="text-cyan-400 font-medium">{log.actor}</span>
                    <span>{log.timestamp.slice(11, 19)}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{log.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
