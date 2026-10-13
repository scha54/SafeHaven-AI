export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type IncidentCategory =
  | 'flood'
  | 'typhoon'
  | 'storm_surge'
  | 'landslide'
  | 'structural_damage'
  | 'medical_emergency'
  | 'other';

export type IncidentStatus =
  | 'Queued'
  | 'Analyzing'
  | 'Triaged'
  | 'Route_Planned'
  | 'Resource_Assigned'
  | 'Resolved'
  | 'Rejected';

export type VulnerabilityTag =
  | 'children'
  | 'elderly'
  | 'mobility_impaired'
  | 'medical_critical'
  | 'pregnant'
  | 'infants';

export type SourceType =
  | 'citizen_report'
  | 'field_responder'
  | 'social_media'
  | 'drone_observation'
  | 'emergency_call';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
  barangay?: string;
  city?: string;
}

export interface IncidentAnalysis {
  incidentSummary: string;
  detectedHazardType: string;
  severity: Severity;
  confidenceScore: number;
  urgency: string;
  observedFacts: string[];
  modelInferences: string[];
  visibleDamageIndicators: string[];
  potentialPopulationRisks: string[];
  recommendedNextActions: string[];
  missingInformation: string[];
  humanVerificationRequired: boolean;
  isFallback?: boolean;
  fallbackReason?: string;
  analyzedAt: string;
}

export interface PriorityBreakdown {
  baseHazardPoints: number;
  populationPoints: number;
  vulnerabilityPoints: number;
  isolationHazardPoints: number;
  timeElapsedPoints: number;
  confidencePoints: number;
  totalScore: number;
  explanation: string;
  operatorOverridden?: boolean;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  location: LocationCoordinates;
  timestamp: string;
  peopleAffected: number;
  vulnerabilities: VulnerabilityTag[];
  source: SourceType;
  status: IncidentStatus;
  priorityScore: number;
  severity: Severity;
  priorityBreakdown: PriorityBreakdown;
  imageUrl?: string;
  audioTranscript?: string;
  analysis?: IncidentAnalysis;
  allocatedResourceId?: string;
  allocatedTeamId?: string;
  assignedRouteId?: string;
  operatorNotes?: string;
  verifiedByHuman?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType =
  | 'shelter'
  | 'hospital'
  | 'supply_depot'
  | 'rescue_team'
  | 'volunteer_group';

export type ResourceAvailability =
  | 'Available'
  | 'At_Capacity'
  | 'In_Transit'
  | 'Maintenance'
  | 'Inaccessible';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: LocationCoordinates;
  totalCapacity?: number;
  occupiedCapacity?: number;
  cotsAvailable?: number;
  drinkingWaterLiters?: number;
  foodPacks?: number;
  medicalKits?: number;
  teamSkills?: string[];
  crewCount?: number;
  availabilityStatus: ResourceAvailability;
  assignedIncidentIds: string[];
  contactNumber: string;
  specialties?: string[];
  notes?: string;
  lastUpdated: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  from: LocationCoordinates;
  to: LocationCoordinates;
  status: 'Clear' | 'Reported_Flooded' | 'Submerged_Impassable' | 'Debris_Blocked';
  waterDepthCm: number;
  speedLimitKmh: number;
  currentTravelSpeedKmh: number;
  reportedAt: string;
  verifiedByHuman: boolean;
  avoidanceAdvice: string;
}

export interface RouteWaypoint {
  name: string;
  lat: number;
  lng: number;
  status: 'Safe' | 'Hazard_Proximity' | 'Congested';
}

export interface RouteRecommendation {
  id: string;
  incidentId: string;
  incidentTitle: string;
  startLocation: LocationCoordinates;
  destinationLocation: LocationCoordinates;
  destinationResourceId: string;
  destinationName: string;
  responseMode: 'Rescue_Boat' | 'High_Water_Truck' | 'Ambulance' | 'Pedestrian_Evacuation';
  totalDistanceKm: number;
  estimatedDurationMins: number;
  hazardAvoidedCount: number;
  risksEncountered: string[];
  status: 'Proposed' | 'Operator_Approved' | 'Dispatched' | 'Rejected';
  rationale: string;
  waypoints: RouteWaypoint[];
  pathCoordinates: [number, number][];
  generatedAt: string;
  approvedBy?: string;
}

export interface ResourceAllocation {
  id: string;
  incidentId: string;
  resourceId: string;
  allocatedUnits: number;
  resourceType: ResourceType;
  status: 'Pending_Approval' | 'Confirmed' | 'Released' | 'Rejected';
  rationale: string;
  timestamp: string;
  operatorId?: string;
}

export interface EmergencyAlert {
  id: string;
  templateType:
    | 'flood_evacuation'
    | 'typhoon_warning'
    | 'shelter_directions'
    | 'road_closure'
    | 'medical_aid'
    | 'supplies_distribution'
    | 'capacity_change';
  area: string;
  hazard: string;
  urgency: string;
  recommendedAction: string;
  shelterOrFacility: string;
  language: 'English' | 'Filipino' | 'Bahasa Indonesia' | 'Thai' | 'Japanese' | 'Hindi';
  headline: string;
  content: string;
  smsOptimizedContent: string;
  keySafetyInstructions: string[];
  status: 'Draft' | 'Approved_Ready' | 'Simulated_Broadcast';
  isFallback: boolean;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type:
    | 'AI_ANALYSIS'
    | 'PRIORITY_UPDATE'
    | 'RESOURCE_ALLOCATION'
    | 'ROUTE_APPROVED'
    | 'ROUTE_REJECTED'
    | 'ALERT_GENERATED'
    | 'ALERT_APPROVED'
    | 'OPERATOR_OVERRIDE'
    | 'SCENARIO_LOADED'
    | 'RESOURCE_CAPACITY_CHANGE';
  actor: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface BuildingFootprint {
  id: string;
  name: string;
  type: 'Residential' | 'School' | 'Commercial' | 'Hospital' | 'Government';
  polygon: [number, number][];
  floodRiskLevel: 'High' | 'Moderate' | 'Low';
  estimatedOccupants: number;
  elevationMeters: number;
}

export interface BenchmarkSample {
  id: string;
  text: string;
  imageUrl?: string;
  sourceEvent: string;
  groundTruthCategory: string;
  groundTruthDamage: 'Severe' | 'Mild' | 'None';
  modelPredictedCategory?: string;
  modelPredictedDamage?: 'Severe' | 'Mild' | 'None';
  confidence?: number;
  match: boolean;
}
