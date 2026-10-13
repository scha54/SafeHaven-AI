import { Incident, PriorityBreakdown, Severity } from '../types';

export interface ScoringWeights {
  hazardWeight: number; // Max 30
  populationWeight: number; // Max 20
  vulnerabilityWeight: number; // Max 25
  isolationWeight: number; // Max 15
  timeWeight: number; // Max 5
  confidenceWeight: number; // Max 5
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  hazardWeight: 30,
  populationWeight: 20,
  vulnerabilityWeight: 25,
  isolationWeight: 15,
  timeWeight: 5,
  confidenceWeight: 5,
};

export function scoreToSeverity(score: number): Severity {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 45) return 'Medium';
  return 'Low';
}

export function calculatePriorityBreakdown(
  incident: Partial<Incident>,
  options?: { isIsolated?: boolean; confidenceScore?: number }
): PriorityBreakdown {
  const {
    category = 'flood',
    peopleAffected = 0,
    vulnerabilities = [],
    timestamp = new Date().toISOString(),
  } = incident;

  // 1. Hazard base points (0-30)
  let baseHazardPoints = 18;
  switch (category) {
    case 'flood':
      baseHazardPoints = 26;
      break;
    case 'medical_emergency':
      baseHazardPoints = 28;
      break;
    case 'landslide':
      baseHazardPoints = 27;
      break;
    case 'structural_damage':
      baseHazardPoints = 24;
      break;
    case 'storm_surge':
      baseHazardPoints = 28;
      break;
    case 'typhoon':
      baseHazardPoints = 22;
      break;
    default:
      baseHazardPoints = 15;
  }

  // 2. Population points (0-20)
  let populationPoints = Math.min(20, Math.round(peopleAffected * 1.4));
  if (peopleAffected === 0 && category === 'medical_emergency') {
    populationPoints = 10; // Individual critical patient
  }

  // 3. Vulnerability points (0-25)
  let vulnerabilityPoints = 0;
  if (vulnerabilities.includes('medical_critical')) vulnerabilityPoints += 15;
  if (vulnerabilities.includes('elderly')) vulnerabilityPoints += 8;
  if (vulnerabilities.includes('infants')) vulnerabilityPoints += 8;
  if (vulnerabilities.includes('mobility_impaired')) vulnerabilityPoints += 8;
  if (vulnerabilities.includes('pregnant')) vulnerabilityPoints += 6;
  if (vulnerabilities.includes('children')) vulnerabilityPoints += 5;
  vulnerabilityPoints = Math.min(25, vulnerabilityPoints);

  // 4. Isolation / road closure points (0-15)
  let isolationHazardPoints = options?.isIsolated ? 15 : 6;
  if (incident.description?.toLowerCase().includes('submerged') || incident.description?.toLowerCase().includes('trapped')) {
    isolationHazardPoints = Math.max(isolationHazardPoints, 14);
  }

  // 5. Time elapsed points (0-5)
  const reportTime = new Date(timestamp).getTime();
  const now = new Date('2026-10-13T10:30:00Z').getTime();
  const minutesElapsed = Math.max(0, (now - reportTime) / (1000 * 60));
  let timeElapsedPoints = 3;
  if (minutesElapsed > 60) timeElapsedPoints = 5;
  else if (minutesElapsed > 30) timeElapsedPoints = 4;
  else timeElapsedPoints = 3;

  // 6. Confidence points (0-5)
  const confidence = options?.confidenceScore ?? (incident.analysis?.confidenceScore ?? 0.85);
  const confidencePoints = Math.round(confidence * 5);

  const rawTotal =
    baseHazardPoints +
    populationPoints +
    vulnerabilityPoints +
    isolationHazardPoints +
    timeElapsedPoints +
    confidencePoints;

  const totalScore = Math.min(100, Math.max(10, rawTotal));

  // Synthesize concise explainable rationale
  const reasons: string[] = [];
  if (category === 'medical_emergency') {
    reasons.push('acute life-safety medical condition requiring immediate emergency trauma triage');
  } else if (category === 'flood') {
    reasons.push('severe water inundation posing imminent drowning or hypothermia risks');
  } else {
    reasons.push(`${category.replace('_', ' ')} incident with potential compound hazards`);
  }

  if (vulnerabilities.length > 0) {
    reasons.push(`involves high-risk vulnerable individuals (${vulnerabilities.join(', ')})`);
  }

  if (peopleAffected > 5) {
    reasons.push(`affects a significant group (${peopleAffected} people)`);
  }

  if (isolationHazardPoints >= 12) {
    reasons.push('indicates road cut-off or physical ingress barriers requiring specialized rescue equipment');
  }

  const explanation = `${scoreToSeverity(totalScore)} priority (${totalScore}/100) because the situation describes ${reasons.join(', ')}.`;

  return {
    baseHazardPoints,
    populationPoints,
    vulnerabilityPoints,
    isolationHazardPoints,
    timeElapsedPoints,
    confidencePoints,
    totalScore,
    explanation,
  };
}
