/**
 * Heatmap Utility Functions
 * Integrated with the rest of the application
 */

/**
 * Get color based on temperature
 * @param {number} temp - Temperature in Celsius
 * @returns {string} - Hex color code
 */
export function getTemperatureColor(temp) {
  if (temp >= 40) return '#ef4444';
  if (temp >= 35) return '#f97316';
  if (temp >= 30) return '#eab308';
  if (temp >= 25) return '#22c55e';
  if (temp >= 20) return '#3b82f6';
  return '#8b5cf6';
}

/**
 * Get temperature label based on temperature
 * @param {number} temp - Temperature in Celsius
 * @returns {string} - Temperature label
 */
export function getTemperatureLabel(temp) {
  if (temp >= 40) return 'Extreme Heat';
  if (temp >= 35) return 'Very Hot';
  if (temp >= 30) return 'Hot';
  if (temp >= 25) return 'Warm';
  if (temp >= 20) return 'Mild';
  return 'Cool';
}

/**
 * Get temperature emoji based on temperature
 * @param {number} temp - Temperature in Celsius
 * @returns {string} - Emoji
 */
export function getTemperatureEmoji(temp) {
  if (temp >= 40) return '🔥';
  if (temp >= 35) return '🌡️';
  if (temp >= 30) return '☀️';
  if (temp >= 25) return '🌤️';
  if (temp >= 20) return '⛅';
  return '❄️';
}

/**
 * Get radius for circle marker based on temperature
 * @param {number} temp - Temperature in Celsius
 * @param {number} minRadius - Minimum radius
 * @param {number} maxRadius - Maximum radius
 * @returns {number} - Radius in pixels
 */
export function getTemperatureRadius(temp, minRadius = 3, maxRadius = 14) {
  const normalized = Math.min(1, Math.max(0, (temp - 20) / 25));
  return minRadius + normalized * (maxRadius - minRadius);
}

/**
 * Check if temperature is a hotspot
 * @param {number} temp - Temperature in Celsius
 * @param {number} threshold - Hotspot threshold
 * @returns {boolean} - True if hotspot
 */
export function isHotspot(temp, threshold = 35) {
  return temp >= threshold;
}

/**
 * Get hotspot severity level
 * @param {number} temp - Temperature in Celsius
 * @returns {string} - Severity level
 */
export function getHotspotSeverity(temp) {
  if (temp >= 40) return 'critical';
  if (temp >= 37) return 'severe';
  if (temp >= 35) return 'moderate';
  return 'mild';
}

/**
 * Calculate heatmap statistics from GeoJSON data
 * @param {Object} geojsonData - GeoJSON data
 * @returns {Object} - Statistics
 */
export function calculateHeatmapStats(geojsonData) {
  if (!geojsonData || !geojsonData.features) {
    return { min: null, max: null, mean: null, count: 0, hotspots: 0 };
  }

  const temperatures = geojsonData.features
    .map(f => f.properties?.temperature)
    .filter(t => t !== undefined && t !== null && !isNaN(t));

  if (temperatures.length === 0) {
    return { min: null, max: null, mean: null, count: 0, hotspots: 0 };
  }

  const sum = temperatures.reduce((a, b) => a + b, 0);
  const min = Math.min(...temperatures);
  const max = Math.max(...temperatures);
  const mean = sum / temperatures.length;
  const hotspots = temperatures.filter(t => t >= 35).length;

  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    mean: Math.round(mean * 10) / 10,
    count: temperatures.length,
    hotspots: hotspots,
  };
}

/**
 * Generate color gradient for temperature range
 * @param {number} minTemp - Minimum temperature
 * @param {number} maxTemp - Maximum temperature
 * @param {number} steps - Number of gradient steps
 * @returns {Array} - Array of {temp, color} objects
 */
export function generateTemperatureGradient(minTemp, maxTemp, steps = 5) {
  const gradient = [];
  const stepSize = (maxTemp - minTemp) / (steps - 1);
  
  for (let i = 0; i < steps; i++) {
    const temp = minTemp + i * stepSize;
    gradient.push({
      temp: Math.round(temp * 10) / 10,
      color: getTemperatureColor(temp),
      label: getTemperatureLabel(temp),
      emoji: getTemperatureEmoji(temp),
    });
  }
  
  return gradient;
}

/**
 * Format temperature for display
 * @param {number} temp - Temperature in Celsius
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted temperature
 */
export function formatTemperature(temp, decimals = 1) {
  if (temp === undefined || temp === null || isNaN(temp)) {
    return '--°C';
  }
  return `${temp.toFixed(decimals)}°C`;
}

/**
 * Get temperature range data for legend
 * @returns {Array} - Array of temperature range objects
 */
export function getTemperatureRanges() {
  return [
    { min: 40, max: 50, label: 'Extreme Heat', color: '#ef4444', emoji: '🔥' },
    { min: 35, max: 39.9, label: 'Very Hot', color: '#f97316', emoji: '🌡️' },
    { min: 30, max: 34.9, label: 'Hot', color: '#eab308', emoji: '☀️' },
    { min: 25, max: 29.9, label: 'Warm', color: '#22c55e', emoji: '🌤️' },
    { min: 20, max: 24.9, label: 'Mild', color: '#3b82f6', emoji: '⛅' },
    { min: -10, max: 19.9, label: 'Cool', color: '#8b5cf6', emoji: '❄️' },
  ];
}