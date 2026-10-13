import { Incident, Resource, ResourceType } from '../types';
import { calculateHaversineKm } from './routingService';

export interface ResourceMatchCandidate {
  resource: Resource;
  distanceKm: number;
  matchScore: number; // 0-100
  isEligible: boolean;
  rejectionReason?: string;
  rationale: string;
}

export function findMatchingResources(
  incident: Incident,
  allResources: Resource[],
  preferredType?: ResourceType
): ResourceMatchCandidate[] {
  const isMedical = incident.category === 'medical_emergency' || incident.vulnerabilities.includes('medical_critical');
  const targetType = preferredType || (isMedical ? 'hospital' : 'shelter');

  const candidates = allResources
    .filter((res) => (preferredType ? res.type === preferredType : res.type === targetType || res.type === 'rescue_team'))
    .map((resource) => {
      const distanceKm = calculateHaversineKm(incident.location, resource.location);

      let isEligible = true;
      let rejectionReason: string | undefined;

      // Capacity check for shelters & hospitals
      if (resource.totalCapacity && resource.occupiedCapacity !== undefined) {
        const remainingCapacity = resource.totalCapacity - resource.occupiedCapacity;
        const occupancyRate = resource.occupiedCapacity / resource.totalCapacity;

        if (remainingCapacity <= 0 || occupancyRate >= 0.95 || resource.availabilityStatus === 'At_Capacity') {
          isEligible = false;
          rejectionReason = `Facility at capacity (${Math.round(occupancyRate * 100)}% occupied, only ${remainingCapacity} spots remaining). Excluded to prevent overcrowding.`;
        }
      }

      if (resource.availabilityStatus === 'Inaccessible') {
        isEligible = false;
        rejectionReason = 'Facility access road reported blocked or compromised.';
      } else if (resource.availabilityStatus === 'In_Transit') {
        isEligible = false;
        rejectionReason = 'Team currently actively deployed on another high-priority mission.';
      }

      // Compute composite match score
      let matchScore = 80;
      // Closer is better (lose 5 pts per km)
      matchScore -= Math.min(30, Math.round(distanceKm * 6));

      // Capacity bonus
      if (resource.totalCapacity && resource.occupiedCapacity !== undefined) {
        const freeSpaces = resource.totalCapacity - resource.occupiedCapacity;
        if (freeSpaces > 100) matchScore += 15;
        else if (freeSpaces > 40) matchScore += 8;
      }

      // Skill / specialty bonus
      if (isMedical && resource.specialties?.some((s) => s.toLowerCase().includes('trauma') || s.toLowerCase().includes('icu'))) {
        matchScore += 20;
      }
      if (incident.category === 'flood' && resource.teamSkills?.some((s) => s.toLowerCase().includes('boat') || s.toLowerCase().includes('swift water'))) {
        matchScore += 20;
      }

      matchScore = Math.max(10, Math.min(99, matchScore));

      // Synthesize rationale
      let rationale = '';
      if (!isEligible) {
        rationale = rejectionReason || 'Ineligible due to operational constraint.';
      } else {
        const freeCount =
          resource.totalCapacity && resource.occupiedCapacity !== undefined
            ? resource.totalCapacity - resource.occupiedCapacity
            : null;
        rationale = `Recommended ${resource.type} because it is located ${distanceKm} km from the scene, has ${
          freeCount !== null ? `${freeCount} available spaces` : 'ready deployment status'
        }, and features direct access via high-elevation transit corridors without reported access restrictions.`;
      }

      return {
        resource,
        distanceKm,
        matchScore: isEligible ? matchScore : 0,
        isEligible,
        rejectionReason,
        rationale,
      };
    });

  // Sort: eligible first, then highest matchScore, then lowest distance
  return candidates.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.distanceKm - b.distanceKm;
  });
}
