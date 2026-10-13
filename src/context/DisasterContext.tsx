import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Incident,
  Resource,
  RoadSegment,
  BuildingFootprint,
  BenchmarkSample,
  EmergencyAlert,
  AuditEvent,
  RouteRecommendation,
} from '../types';
import {
  INITIAL_INCIDENTS,
  INITIAL_RESOURCES,
  INITIAL_ROAD_SEGMENTS,
  INITIAL_BUILDING_FOOTPRINTS,
  CRISIS_MMD_BENCHMARK_SAMPLES,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';
import { fetchSystemStatus, SystemStatus } from '../services/geminiService';
import { calculatePriorityBreakdown } from '../services/priorityEngine';
import { planOptimalRoute } from '../services/routingService';

interface DisasterContextType {
  incidents: Incident[];
  resources: Resource[];
  roadSegments: RoadSegment[];
  buildingFootprints: BuildingFootprint[];
  benchmarkSamples: BenchmarkSample[];
  alerts: EmergencyAlert[];
  auditLogs: AuditEvent[];
  routes: RouteRecommendation[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedIncident: Incident | null;
  setSelectedIncident: (inc: Incident | null) => void;
  selectedResource: Resource | null;
  setSelectedResource: (res: Resource | null) => void;
  systemStatus: SystemStatus | null;
  activeScenario: string | null;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  // Mutators
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  deleteIncident: (id: string) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  allocateResource: (incidentId: string, resourceId: string, count?: number) => boolean;
  releaseResourceAllocation: (incidentId: string, resourceId: string) => void;
  addRoute: (route: RouteRecommendation) => void;
  approveRoute: (routeId: string, approverName: string) => void;
  addAlert: (alert: EmergencyAlert) => void;
  approveAlert: (alertId: string, approverName: string) => void;
  addAuditLog: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
  loadScenario: (scenarioKey: 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d' | 'scenario_e') => void;
  resetAllData: () => void;
  importResourcesFromCSV: (csvText: string) => { success: boolean; count: number; error?: string };
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

const STORAGE_PREFIX = 'safehaven_ai_v1_';

export const DisasterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}incidents`);
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}resources`);
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}roads`);
    return saved ? JSON.parse(saved) : INITIAL_ROAD_SEGMENTS;
  });

  const [buildingFootprints, setBuildingFootprints] = useState<BuildingFootprint[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}buildings`);
    return saved ? JSON.parse(saved) : INITIAL_BUILDING_FOOTPRINTS;
  });

  const [alerts, setAlerts] = useState<EmergencyAlert[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}alerts`);
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [routes, setRoutes] = useState<RouteRecommendation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}routes`);
    return saved ? JSON.parse(saved) : [];
  });

  const [benchmarkSamples] = useState<BenchmarkSample[]>(CRISIS_MMD_BENCHMARK_SAMPLES);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}incidents`, JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}resources`, JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}roads`, JSON.stringify(roadSegments));
  }, [roadSegments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}alerts`, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}routes`, JSON.stringify(routes));
  }, [routes]);

  // Check health periodically
  useEffect(() => {
    fetchSystemStatus().then((status) => {
      setSystemStatus(status);
    });
  }, []);

  const addAuditLog = (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    const newLog: AuditEvent = {
      ...event,
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addIncident = (newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    addAuditLog({
      type: 'AI_ANALYSIS',
      actor: newIncident.analysis?.isFallback ? 'Rule-Based Fallback' : 'Gemini 3.8 Flash',
      description: `Ingested new distress report: "${newIncident.title}" (${newIncident.severity} Severity, Score: ${newIncident.priorityScore})`,
      metadata: { incidentId: newIncident.id, category: newIncident.category },
    });
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const updated = { ...inc, ...updates, updatedAt: new Date().toISOString() };
          if (selectedIncident?.id === id) {
            setSelectedIncident(updated);
          }
          return updated;
        }
        return inc;
      })
    );

    if (updates.priorityScore !== undefined || updates.operatorNotes !== undefined) {
      addAuditLog({
        type: 'OPERATOR_OVERRIDE',
        actor: 'Human Dispatcher',
        description: `Updated incident ${id} details or score.`,
        metadata: { incidentId: id, updates },
      });
    }
  };

  const deleteIncident = (id: string) => {
    setIncidents((prev) => prev.filter((inc) => inc.id !== id));
    if (selectedIncident?.id === id) setSelectedIncident(null);
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources((prev) =>
      prev.map((res) => {
        if (res.id === id) {
          const updated = { ...res, ...updates, lastUpdated: new Date().toISOString() };
          if (selectedResource?.id === id) setSelectedResource(updated);
          return updated;
        }
        return res;
      })
    );
  };

  const allocateResource = (incidentId: string, resourceId: string, count: number = 1): boolean => {
    const resource = resources.find((r) => r.id === resourceId);
    const incident = incidents.find((i) => i.id === incidentId);

    if (!resource || !incident) return false;

    // Check capacity safeguard
    if (resource.totalCapacity && resource.occupiedCapacity !== undefined) {
      if (resource.occupiedCapacity + count > resource.totalCapacity) {
        addAuditLog({
          type: 'RESOURCE_ALLOCATION',
          actor: 'Capacity Enforcement Guard',
          description: `Blocked allocation of ${resource.name}: exceeds maximum capacity of ${resource.totalCapacity}.`,
          metadata: { resourceId, incidentId },
        });
        return false;
      }
    }

    // Update resource state
    setResources((prev) =>
      prev.map((res) => {
        if (res.id === resourceId) {
          const newOccupied = (res.occupiedCapacity ?? 0) + count;
          const isFull = res.totalCapacity ? newOccupied >= res.totalCapacity * 0.95 : false;
          return {
            ...res,
            occupiedCapacity: newOccupied,
            availabilityStatus: isFull ? 'At_Capacity' : res.availabilityStatus,
            assignedIncidentIds: Array.from(new Set([...res.assignedIncidentIds, incidentId])),
            lastUpdated: new Date().toISOString(),
          };
        }
        return res;
      })
    );

    // Update incident state
    updateIncident(incidentId, {
      allocatedResourceId: resource.type === 'shelter' || resource.type === 'hospital' ? resourceId : incident.allocatedResourceId,
      allocatedTeamId: resource.type === 'rescue_team' ? resourceId : incident.allocatedTeamId,
      status: 'Resource_Assigned',
    });

    addAuditLog({
      type: 'RESOURCE_ALLOCATION',
      actor: 'Human Dispatcher',
      description: `Allocated ${resource.name} (${resource.type}) to Incident ${incidentId} ("${incident.title}").`,
      metadata: { incidentId, resourceId, count },
    });

    return true;
  };

  const releaseResourceAllocation = (incidentId: string, resourceId: string) => {
    setResources((prev) =>
      prev.map((res) => {
        if (res.id === resourceId) {
          return {
            ...res,
            assignedIncidentIds: res.assignedIncidentIds.filter((id) => id !== incidentId),
            lastUpdated: new Date().toISOString(),
          };
        }
        return res;
      })
    );

    updateIncident(incidentId, {
      allocatedResourceId: undefined,
      allocatedTeamId: undefined,
      status: 'Triaged',
    });

    addAuditLog({
      type: 'RESOURCE_ALLOCATION',
      actor: 'Human Dispatcher',
      description: `Released resource allocation for ${resourceId} from Incident ${incidentId}.`,
      metadata: { incidentId, resourceId },
    });
  };

  const addRoute = (route: RouteRecommendation) => {
    setRoutes((prev) => [route, ...prev]);
    updateIncident(route.incidentId, {
      assignedRouteId: route.id,
      status: 'Route_Planned',
    });
    addAuditLog({
      type: 'AI_ANALYSIS',
      actor: 'Geospatial Route Engine',
      description: `Computed candidate evacuation route for ${route.incidentId} to ${route.destinationName} (${route.totalDistanceKm}km, avoided ${route.hazardAvoidedCount} hazards).`,
      metadata: { routeId: route.id, incidentId: route.incidentId },
    });
  };

  const approveRoute = (routeId: string, approverName: string) => {
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId
          ? { ...r, status: 'Operator_Approved', approvedBy: approverName }
          : r
      )
    );
    const route = routes.find((r) => r.id === routeId);
    if (route) {
      updateIncident(route.incidentId, {
        status: 'Resource_Assigned',
        verifiedByHuman: true,
      });
      addAuditLog({
        type: 'ROUTE_APPROVED',
        actor: approverName,
        description: `Authorized rescue/evacuation route ${routeId} to ${route.destinationName}. Dispatch team notified.`,
        metadata: { routeId, approver: approverName },
      });
    }
  };

  const addAlert = (alert: EmergencyAlert) => {
    setAlerts((prev) => [alert, ...prev]);
    addAuditLog({
      type: 'ALERT_GENERATED',
      actor: 'SafeHaven AI Comm Engine',
      description: `Generated ${alert.language} emergency alert for ${alert.area}: "${alert.headline}".`,
      metadata: { alertId: alert.id, language: alert.language },
    });
  };

  const approveAlert = (alertId: string, approverName: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'Approved_Ready',
              approvedAt: new Date().toISOString(),
              approvedBy: approverName,
            }
          : a
      )
    );
    addAuditLog({
      type: 'ALERT_APPROVED',
      actor: approverName,
      description: `Approved emergency advisory ${alertId} for certified simulation broadcast.`,
      metadata: { alertId, approvedBy: approverName },
    });
  };

  // Scenario Orchestrator
  const loadScenario = (scenarioKey: 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d' | 'scenario_e') => {
    setActiveScenario(scenarioKey);

    switch (scenarioKey) {
      case 'scenario_a': {
        // Critical distress report in Tumana: plan route avoiding J.P. Rizal St
        const inc = incidents.find((i) => i.id === 'INC-01') || incidents[0];
        setSelectedIncident(inc);
        setActiveTab('routing');

        // Automatically calculate candidate route to Concepcion Integrated School
        const dest = resources.find((r) => r.id === 'RES-02') || resources[1];
        const route = planOptimalRoute({
          incidentId: inc.id,
          incidentTitle: inc.title,
          startLocation: inc.location,
          destinationLocation: dest.location,
          destinationResourceId: dest.id,
          destinationName: dest.name,
          responseMode: 'Rescue_Boat',
          roadSegments,
        });
        addRoute(route);

        addAuditLog({
          type: 'SCENARIO_LOADED',
          actor: 'Demo Scenario Director',
          description: 'Triggered Scenario A: "Critical Distress Report — Tumana Inundation". Avoids J.P. Rizal floodway.',
          metadata: { scenario: 'Scenario A', incidentId: inc.id },
        });
        break;
      }

      case 'scenario_b': {
        // Medical emergency in Malanday
        const inc = incidents.find((i) => i.id === 'INC-02') || incidents[1];
        setSelectedIncident(inc);
        setActiveTab('resources');

        addAuditLog({
          type: 'SCENARIO_LOADED',
          actor: 'Demo Scenario Director',
          description: 'Triggered Scenario B: "Medical Emergency — Diabetic Coma & Hypothermia". Matching with Amang Rodriguez Trauma ICU.',
          metadata: { scenario: 'Scenario B', incidentId: inc.id },
        });
        break;
      }

      case 'scenario_c': {
        // Shelter capacity constraint: Marikina Sports Center reaches 98%
        updateResource('RES-01', {
          occupiedCapacity: 1195,
          availabilityStatus: 'At_Capacity',
          notes: 'OVERCAPACITY ALERT (99.5%). All incoming transports MUST be diverted to Concepcion Integrated School.',
        });
        setActiveTab('resources');

        addAuditLog({
          type: 'RESOURCE_CAPACITY_CHANGE',
          actor: 'Capacity Monitor Alert',
          description: 'Triggered Scenario C: "Shelter Capacity Constraint". Marikina Sports Center marked At_Capacity (1195/1200).',
          metadata: { scenario: 'Scenario C', resourceId: 'RES-01' },
        });
        break;
      }

      case 'scenario_d': {
        // Multilingual emergency communication
        setActiveTab('alerts');
        addAuditLog({
          type: 'SCENARIO_LOADED',
          actor: 'Demo Scenario Director',
          description: 'Triggered Scenario D: "Multilingual Emergency Communication". Generating Tagalog, English, and regional advisories.',
          metadata: { scenario: 'Scenario D' },
        });
        break;
      }

      case 'scenario_e': {
        // Data and AI failure simulation mode
        setIsSimulatedOffline(true);
        setActiveTab('incidents');
        addAuditLog({
          type: 'SCENARIO_LOADED',
          actor: 'Demo Scenario Director',
          description: 'Triggered Scenario E: "Data & AI Service Outage". Demonstrating resilient deterministic fallback with DEMO MODE badge.',
          metadata: { scenario: 'Scenario E' },
        });
        break;
      }
    }
  };

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_PREFIX}incidents`);
    localStorage.removeItem(`${STORAGE_PREFIX}resources`);
    localStorage.removeItem(`${STORAGE_PREFIX}roads`);
    localStorage.removeItem(`${STORAGE_PREFIX}buildings`);
    localStorage.removeItem(`${STORAGE_PREFIX}alerts`);
    localStorage.removeItem(`${STORAGE_PREFIX}audit`);
    localStorage.removeItem(`${STORAGE_PREFIX}routes`);

    setIncidents(INITIAL_INCIDENTS);
    setResources(INITIAL_RESOURCES);
    setRoadSegments(INITIAL_ROAD_SEGMENTS);
    setBuildingFootprints(INITIAL_BUILDING_FOOTPRINTS);
    setAlerts(INITIAL_ALERTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setRoutes([]);
    setSelectedIncident(null);
    setSelectedResource(null);
    setActiveScenario(null);
    setIsSimulatedOffline(false);
    setActiveTab('dashboard');

    addAuditLog({
      type: 'SCENARIO_LOADED',
      actor: 'System Admin',
      description: 'Reset all application and geospatial demonstration datasets to clean baseline state.',
    });
  };

  const importResourcesFromCSV = (csvText: string): { success: boolean; count: number; error?: string } => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) return { success: false, count: 0, error: 'CSV file contains no data rows.' };

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const newItems: Resource[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim());
        if (row.length < 5) continue;

        const id = row[0] || `RES-IMP-${i}`;
        const name = row[1] || `Imported Facility ${i}`;
        const type = (row[2]?.toLowerCase() as any) || 'shelter';
        const lat = parseFloat(row[3]) || 14.645;
        const lng = parseFloat(row[4]) || 121.098;
        const totalCapacity = parseInt(row[5], 10) || 200;
        const occupiedCapacity = parseInt(row[6], 10) || 0;

        newItems.push({
          id,
          name,
          type: ['shelter', 'hospital', 'supply_depot', 'rescue_team', 'volunteer_group'].includes(type) ? type : 'shelter',
          location: { lat, lng, address: `Imported coordinate (${lat}, ${lng})` },
          totalCapacity,
          occupiedCapacity,
          cotsAvailable: Math.max(0, totalCapacity - occupiedCapacity),
          drinkingWaterLiters: parseInt(row[7], 10) || 1000,
          foodPacks: parseInt(row[8], 10) || 300,
          medicalKits: parseInt(row[9], 10) || 25,
          availabilityStatus: occupiedCapacity >= totalCapacity ? 'At_Capacity' : 'Available',
          assignedIncidentIds: [],
          contactNumber: '+63-2-8000-0000',
          lastUpdated: new Date().toISOString(),
        });
      }

      setResources((prev) => [...prev, ...newItems]);
      addAuditLog({
        type: 'RESOURCE_ALLOCATION',
        actor: 'Data Import Tool',
        description: `Imported ${newItems.length} resources from external CSV document.`,
        metadata: { importedCount: newItems.length },
      });

      return { success: true, count: newItems.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Invalid CSV format' };
    }
  };

  return (
    <DisasterContext.Provider
      value={{
        incidents,
        resources,
        roadSegments,
        buildingFootprints,
        benchmarkSamples,
        alerts,
        auditLogs,
        routes,
        activeTab,
        setActiveTab,
        selectedIncident,
        setSelectedIncident,
        selectedResource,
        setSelectedResource,
        systemStatus,
        activeScenario,
        isSimulatedOffline,
        toggleSimulatedOffline,
        addIncident,
        updateIncident,
        deleteIncident,
        updateResource,
        allocateResource,
        releaseResourceAllocation,
        addRoute,
        approveRoute,
        addAlert,
        approveAlert,
        addAuditLog,
        loadScenario,
        resetAllData,
        importResourcesFromCSV,
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
};

export const useDisaster = () => {
  const context = useContext(DisasterContext);
  if (!context) throw new Error('useDisaster must be used within DisasterProvider');
  return context;
};
