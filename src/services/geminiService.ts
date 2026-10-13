import { IncidentAnalysis } from '../types';

export interface SystemStatus {
  status: string;
  geminiConfigured: boolean;
  model: string;
  region: string;
  version: string;
  timestamp: string;
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status endpoint returned non-200');
    return await res.json();
  } catch (err) {
    return {
      status: 'offline_mode',
      geminiConfigured: false,
      model: 'gemini-3.8-flash (Offline Fallback)',
      region: 'JAPAC (Simulation Offline)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function analyzeIncidentWithGemini(payload: {
  title: string;
  description: string;
  category: string;
  location?: { lat: number; lng: number; address?: string };
  peopleAffected: number;
  vulnerabilities: string[];
  imageBase64?: string;
  mimeType?: string;
}): Promise<IncidentAnalysis> {
  try {
    const res = await fetch('/api/gemini/analyze-incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      ...data,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.warn('API call to /api/gemini/analyze-incident failed, using client fallback:', error?.message);
    return {
      incidentSummary: `Rule-based triage: ${payload.title} in ${payload.category} category with ${payload.peopleAffected} individuals reported.`,
      detectedHazardType: payload.category.toUpperCase(),
      severity: payload.peopleAffected > 8 || payload.vulnerabilities.length > 1 ? 'Critical' : 'High',
      confidenceScore: 0.86,
      urgency: 'Urgent Dispatch Advised',
      observedFacts: [
        `Reporter stated: "${payload.title}"`,
        `Reported ${payload.peopleAffected} affected residents`,
        `Identified vulnerabilities: ${payload.vulnerabilities.join(', ') || 'None specified'}`,
      ],
      modelInferences: [
        'Local road access impeded by flood accumulation; high-water transport advised.',
        'Secondary hazard of water contamination and power infrastructure outage.',
      ],
      visibleDamageIndicators: ['Water accumulation impeding ground access'],
      potentialPopulationRisks: ['Hypothermia, lack of potable water, structural isolation'],
      recommendedNextActions: [
        'Deploy designated shallow-draft inflatable rescue boat',
        'Verify reception capacity at Concepcion Integrated School',
        'Avoid submerged J.P. Rizal corridor',
      ],
      missingInformation: ['Exact water depth progression', 'Specific medical supplies required'],
      humanVerificationRequired: true,
      isFallback: true,
      fallbackReason: error?.message || 'Server connection error; client fallback invoked.',
      analyzedAt: new Date().toISOString(),
    };
  }
}

export async function generateEmergencyAlertWithGemini(payload: {
  templateType: string;
  area: string;
  hazard: string;
  urgency: string;
  recommendedAction: string;
  shelterOrFacility: string;
  language: string;
  customNotes?: string;
}): Promise<{
  language: string;
  headline: string;
  content: string;
  smsOptimizedContent: string;
  keySafetyInstructions: string[];
  isFallback: boolean;
}> {
  try {
    const res = await fetch('/api/gemini/generate-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.warn('Alert generation endpoint failed, using client fallback:', err);
    const content = `[EMERGENCY ADVISORY - SAFEHAVEN AI]\nArea: ${payload.area}\nHazard: ${payload.hazard} (${payload.urgency})\nAction: ${payload.recommendedAction}.\nSafe Evacuation Facility: ${payload.shelterOrFacility}.\nInstructions: Move to higher ground immediately. Do not attempt to walk or drive through flood waters. Tune to emergency frequency for official updates.\n(Issued by SafeHaven AI Command Center - Verification Required)`;

    return {
      language: payload.language,
      headline: `${payload.urgency.toUpperCase()} - ${payload.hazard} IN ${payload.area.toUpperCase()}`,
      content,
      smsOptimizedContent: content.slice(0, 158),
      keySafetyInstructions: [
        'Move to designated safe facility without delay',
        'Avoid submerged roads and live wires',
        'Bring essential medications and identification',
      ],
      isFallback: true,
    };
  }
}
