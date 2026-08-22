/**
 * Distance calculation utilities
 */

import { calculateDistance } from './coordinates.js';

/**
 * Find nearest location from a list
 * @param {Object} target - Target location {lat, lng}
 * @param {Array} locations - Array of locations with {lat, lng, ...}
 * @param {number} limit - Maximum number of results
 * @returns {Array} - Sorted locations by distance
 */
export function findNearestLocations(target, locations, limit = 5) {
  const withDistance = locations.map(location => ({
    ...location,
    distance: calculateDistance(
      target.lat,
      target.lng,
      location.lat,
      location.lng
    ),
  }));

  return withDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Filter locations within radius
 * @param {Object} center - Center location {lat, lng}
 * @param {Array} locations - Array of locations
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} - Locations within radius
 */
export function filterLocationsWithinRadius(center, locations, radiusKm) {
  return locations.filter(location => {
    const distance = calculateDistance(
      center.lat,
      center.lng,
      location.lat,
      location.lng
    );
    return distance <= radiusKm;
  });
}