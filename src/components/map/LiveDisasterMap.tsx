import React, { useState, useRef, useMemo } from 'react';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Home,
  Shield,
  Activity,
  Droplet,
  Compass,
  ArrowRight,
  Info,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import {
  Incident,
  Resource,
  RoadSegment,
  BuildingFootprint,
} from '../../types';
import {
  MANILA_MAP_CENTER,
  MARIKINA_FLOOD_HAZARD_POLYGON,
} from '../../data/seedData';

export const LiveDisasterMap: React.FC = () => {
  const {
    incidents,
    resources,
    roadSegments,
    buildingFootprints,
    routes,
    selectedIncident,
    setSelectedIncident,
    setActiveTab,
  } = useDisaster();

  // Layer Toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showRoadClosures, setShowRoadClosures] = useState(true);
  const [showFloodPolygon, setShowFloodPolygon] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Map Bounds for Manila / Marikina River Basin
  // Lat: 14.6150 (South) to 14.6850 (North) -> Span: 0.0700
  // Lng: 121.0650 (West) to 121.1250 (East) -> Span: 0.0600
  const BOUNDS = {
    minLat: 14.615,
    maxLat: 14.685,
    minLng: 121.065,
    maxLng: 121.125,
  };

  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 700;

  // Coordinate projection from (lat, lng) to SVG (x, y)
  const project = (lat: number, lng: number): [number, number] => {
    const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * SVG_WIDTH;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * SVG_HEIGHT;
    return [x, y];
  };

  // Convert flood polygon to SVG points string
  const floodPoints = useMemo(() => {
    return MARIKINA_FLOOD_HAZARD_POLYGON.map(([lat, lng]) => {
      const [x, y] = project(lat, lng);
      return `${x},${y}`;
    }).join(' ');
  }, []);

  // Filtered incidents
  const visibleIncidents = incidents.filter(
    (inc) =>
      inc.status !== 'Resolved' &&
      (filterSeverity === 'ALL' || inc.severity === filterSeverity)
  );

  // Inspector item: either clicked incident or clicked resource
  const [inspectedEntity, setInspectedEntity] = useState<
    { type: 'incident'; data: Incident } | { type: 'resource'; data: Resource } | null
  >(null);

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0F172A] border border-slate-800 rounded-xl p-3.5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span>Live Geospatial Command Map — Manila River Basin</span>
          </h2>
          <p className="text-xs text-slate-400">
            Interactive GIS displaying flood inundation zone, Google Open Buildings, road closures, and live incident triage
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setShowFloodPolygon(!showFloodPolygon)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors ${
              showFloodPolygon
                ? 'bg-blue-950/80 border-blue-700 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            🌊 Flood Inundation
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors ${
              showIncidents
                ? 'bg-red-950/80 border-red-700 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            🔥 Incidents ({visibleIncidents.length})
          </button>

          <button
            onClick={() => setShowRoadClosures(!showRoadClosures)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors ${
              showRoadClosures
                ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            🚧 Closures ({roadSegments.filter((r) => r.status !== 'Clear').length})
          </button>

          <button
            onClick={() => setShowResources(!showResources)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors ${
              showResources
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            🏥 Shelters & Teams
          </button>

          <button
            onClick={() => setShowBuildings(!showBuildings)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors ${
              showBuildings
                ? 'bg-purple-950/80 border-purple-700 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            🏢 Open Buildings ({buildingFootprints.length})
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative bg-[#070C15] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[620px] select-none">
        {/* Floating Controls: Zoom & Reset */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-1.5 rounded-lg shadow-lg">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
            title="Reset Extent"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-lg shadow-xl text-[11px] font-mono space-y-1.5 max-w-xs">
          <div className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>OPERATIONAL MAP LEGEND</span>
            <span className="text-[10px] text-cyan-400">Marikina River</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-red-500 -ml-3"></span>
              <span>Critical Incident</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>High Incident</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
              <span>Shelter Hub</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
              <span>Hospital / Trauma</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-red-500"></span>
              <span>Road Blocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-cyan-400 border-dashed"></span>
              <span>Active Route</span>
            </div>
          </div>
        </div>

        {/* SVG Tactical Map Surface */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Dark Tactical Grid Background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#131F37" strokeWidth="0.75" />
              </pattern>
              <linearGradient id="floodGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#grid)" />

            {/* Stylized Marikina River centerline */}
            <path
              d="M 520,30 Q 510,180 490,280 T 470,420 T 420,540 T 360,680"
              fill="none"
              stroke="#0284C7"
              strokeWidth="24"
              strokeOpacity="0.4"
              strokeLinecap="round"
            />
            <path
              d="M 520,30 Q 510,180 490,280 T 470,420 T 420,540 T 360,680"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="10"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />

            {/* Inundation Flood Hazard Polygon */}
            {showFloodPolygon && (
              <polygon
                points={floodPoints}
                fill="url(#floodGrad)"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeDasharray="6,4"
              />
            )}

            {/* Google Open Buildings Footprints */}
            {showBuildings &&
              buildingFootprints.map((bld) => {
                const pointsStr = bld.polygon
                  .map(([lat, lng]) => {
                    const [x, y] = project(lat, lng);
                    return `${x},${y}`;
                  })
                  .join(' ');

                const isHighRisk = bld.floodRiskLevel === 'High';

                return (
                  <polygon
                    key={bld.id}
                    points={pointsStr}
                    fill={isHighRisk ? '#EF4444' : '#0EA5E9'}
                    fillOpacity={isHighRisk ? 0.6 : 0.35}
                    stroke={isHighRisk ? '#F87171' : '#38BDF8'}
                    strokeWidth="1"
                    className="hover:opacity-90 cursor-pointer"
                  >
                    <title>
                      {bld.name} ({bld.type}) — {bld.floodRiskLevel} Flood Risk • ~{bld.estimatedOccupants} occupants
                    </title>
                  </polygon>
                );
              })}

            {/* Road Network Segments */}
            {roadSegments.map((road) => {
              const [x1, y1] = project(road.from.lat, road.from.lng);
              const [x2, y2] = project(road.to.lat, road.to.lng);
              const isBlocked = road.status === 'Submerged_Impassable' || road.status === 'Debris_Blocked';

              if (isBlocked && !showRoadClosures) return null;

              return (
                <g key={road.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isBlocked ? '#EF4444' : '#334155'}
                    strokeWidth={isBlocked ? 5 : 2.5}
                    strokeDasharray={isBlocked ? '8,4' : undefined}
                    strokeOpacity={isBlocked ? 0.9 : 0.6}
                  />
                  {isBlocked && (
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      r="7"
                      fill="#EF4444"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    >
                      <title>{road.name}: {road.avoidanceAdvice}</title>
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Active Candidate Routes */}
            {showRoutes &&
              routes.map((route) => {
                if (!route.pathCoordinates || route.pathCoordinates.length < 2) return null;
                const pathStr = route.pathCoordinates
                  .map(([lat, lng], idx) => {
                    const [x, y] = project(lat, lng);
                    return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                  })
                  .join(' ');

                return (
                  <path
                    key={route.id}
                    d={pathStr}
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6,4"
                    className="animate-pulse"
                  />
                );
              })}

            {/* Relief Resources & Facilities Markers */}
            {showResources &&
              resources.map((res) => {
                const [x, y] = project(res.location.lat, res.location.lng);
                const isHospital = res.type === 'hospital';
                const isShelter = res.type === 'shelter';
                const isRescue = res.type === 'rescue_team';
                const isDepot = res.type === 'supply_depot';

                return (
                  <g
                    key={res.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={() => setInspectedEntity({ type: 'resource', data: res })}
                    className="cursor-pointer group"
                  >
                    <rect
                      x="-10"
                      y="-10"
                      width="20"
                      height="20"
                      rx="4"
                      fill={
                        isHospital ? '#F43F5E' : isShelter ? '#2563EB' : isRescue ? '#10B981' : '#9333EA'
                      }
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className="group-hover:scale-125 transition-transform"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none font-mono"
                    >
                      {isHospital ? 'H' : isShelter ? 'S' : isRescue ? 'R' : 'D'}
                    </text>
                  </g>
                );
              })}

            {/* Live Incidents Markers */}
            {showIncidents &&
              visibleIncidents.map((inc) => {
                const [x, y] = project(inc.location.lat, inc.location.lng);
                const isCrit = inc.severity === 'Critical';
                const isHigh = inc.severity === 'High';
                const isSelected = selectedIncident?.id === inc.id;

                return (
                  <g
                    key={inc.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={() => {
                      setSelectedIncident(inc);
                      setInspectedEntity({ type: 'incident', data: inc });
                    }}
                    className="cursor-pointer group"
                  >
                    {isCrit && (
                      <circle
                        cx="0"
                        cy="0"
                        r={isSelected ? 18 : 13}
                        fill="#EF4444"
                        fillOpacity="0.3"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? 10 : 7}
                      fill={isCrit ? '#EF4444' : isHigh ? '#F59E0B' : '#06B6D4'}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="group-hover:scale-125 transition-transform"
                    />
                    <text
                      x="0"
                      y="-10"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none font-mono drop-shadow-md"
                    >
                      {inc.id}
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>
      </div>

      {/* Bottom Inspector Drawer */}
      {inspectedEntity && (
        <div className="bg-[#0F172A] border border-cyan-500/40 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {inspectedEntity.type === 'incident' ? inspectedEntity.data.id : inspectedEntity.data.id}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-white">
                {inspectedEntity.type === 'incident' ? inspectedEntity.data.title : inspectedEntity.data.name}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {inspectedEntity.type === 'incident'
                ? inspectedEntity.data.description
                : `Status: ${inspectedEntity.data.availabilityStatus} • Occupancy: ${
                    inspectedEntity.data.occupiedCapacity || 0
                  }/${inspectedEntity.data.totalCapacity || 0}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {inspectedEntity.type === 'incident' ? (
              <>
                <button
                  onClick={() => {
                    setSelectedIncident(inspectedEntity.data);
                    setActiveTab('incidents');
                  }}
                  className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                >
                  Inspect Triage
                </button>
                <button
                  onClick={() => {
                    setSelectedIncident(inspectedEntity.data);
                    setActiveTab('routing');
                  }}
                  className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Plan Route</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab('resources')}
                className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
              >
                Manage Resource Inventory
              </button>
            )}
            <button
              onClick={() => setInspectedEntity(null)}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
