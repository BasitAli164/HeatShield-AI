/**
 * Date/Time Utility Functions with Timezone Support
 */

// US Timezone mapping for cities
const CITY_TIMEZONES = {
  // Arizona (MST - No Daylight Saving)
  'Phoenix, AZ': 'America/Phoenix',
  'Tucson, AZ': 'America/Phoenix',
  
  // California (PT)
  'Los Angeles, CA': 'America/Los_Angeles',
  'San Francisco, CA': 'America/Los_Angeles',
  'San Diego, CA': 'America/Los_Angeles',
  'San Jose, CA': 'America/Los_Angeles',
  'Sacramento, CA': 'America/Los_Angeles',
  'Oakland, CA': 'America/Los_Angeles',
  'Fresno, CA': 'America/Los_Angeles',
  
  // Pacific Northwest (PT)
  'Seattle, WA': 'America/Los_Angeles',
  'Portland, OR': 'America/Los_Angeles',
  'Spokane, WA': 'America/Los_Angeles',
  'Boise, ID': 'America/Boise', // Mountain Time
  
  // Nevada (PT)
  'Las Vegas, NV': 'America/Los_Angeles',
  'Reno, NV': 'America/Los_Angeles',
  
  // Mountain Time (MT)
  'Denver, CO': 'America/Denver',
  'Salt Lake City, UT': 'America/Denver',
  'Albuquerque, NM': 'America/Denver',
  'El Paso, TX': 'America/Denver',
  
  // Central Time (CT)
  'Chicago, IL': 'America/Chicago',
  'Dallas, TX': 'America/Chicago',
  'Houston, TX': 'America/Chicago',
  'Austin, TX': 'America/Chicago',
  'San Antonio, TX': 'America/Chicago',
  'Fort Worth, TX': 'America/Chicago',
  'Oklahoma City, OK': 'America/Chicago',
  'Tulsa, OK': 'America/Chicago',
  'Kansas City, MO': 'America/Chicago',
  'St. Louis, MO': 'America/Chicago',
  'Milwaukee, WI': 'America/Chicago',
  'Minneapolis, MN': 'America/Chicago',
  'New Orleans, LA': 'America/Chicago',
  'Memphis, TN': 'America/Chicago',
  'Nashville, TN': 'America/Chicago',
  'Louisville, KY': 'America/Chicago',
  
  // Eastern Time (ET)
  'New York, NY': 'America/New_York',
  'Boston, MA': 'America/New_York',
  'Washington, DC': 'America/New_York', // ✅ ADDED
  'Miami, FL': 'America/New_York',
  'Orlando, FL': 'America/New_York',
  'Tampa, FL': 'America/New_York',
  'Jacksonville, FL': 'America/New_York',
  'Atlanta, GA': 'America/New_York',
  'Charlotte, NC': 'America/New_York',
  'Raleigh, NC': 'America/New_York',
  'Philadelphia, PA': 'America/New_York',
  'Pittsburgh, PA': 'America/New_York',
  'Buffalo, NY': 'America/New_York',
  'Rochester, NY': 'America/New_York',
  'Cleveland, OH': 'America/New_York',
  'Cincinnati, OH': 'America/New_York',
  'Columbus, OH': 'America/New_York',
  'Indianapolis, IN': 'America/Indiana/Indianapolis',
  'Detroit, MI': 'America/Detroit',
  'Baltimore, MD': 'America/New_York',
  'Richmond, VA': 'America/New_York',
  'Virginia Beach, VA': 'America/New_York',
  'Washington, DC': 'America/New_York',
};

// Default timezone for unknown cities
const DEFAULT_TIMEZONE = 'America/Phoenix';

// ✅ Add US state to timezone mapping for fallback
const STATE_TIMEZONES = {
  'AZ': 'America/Phoenix',
  'CA': 'America/Los_Angeles',
  'NV': 'America/Los_Angeles',
  'OR': 'America/Los_Angeles',
  'WA': 'America/Los_Angeles',
  'CO': 'America/Denver',
  'UT': 'America/Denver',
  'NM': 'America/Denver',
  'ID': 'America/Boise',
  'TX': 'America/Chicago',
  'IL': 'America/Chicago',
  'MO': 'America/Chicago',
  'WI': 'America/Chicago',
  'MN': 'America/Chicago',
  'IA': 'America/Chicago',
  'AR': 'America/Chicago',
  'LA': 'America/Chicago',
  'MS': 'America/Chicago',
  'AL': 'America/Chicago',
  'TN': 'America/Chicago',
  'KY': 'America/Chicago',
  'IN': 'America/Indiana/Indianapolis',
  'MI': 'America/Detroit',
  'OH': 'America/New_York',
  'PA': 'America/New_York',
  'NY': 'America/New_York',
  'MA': 'America/New_York',
  'CT': 'America/New_York',
  'RI': 'America/New_York',
  'NH': 'America/New_York',
  'VT': 'America/New_York',
  'ME': 'America/New_York',
  'NJ': 'America/New_York',
  'DE': 'America/New_York',
  'MD': 'America/New_York',
  'DC': 'America/New_York',
  'VA': 'America/New_York',
  'WV': 'America/New_York',
  'NC': 'America/New_York',
  'SC': 'America/New_York',
  'GA': 'America/New_York',
  'FL': 'America/New_York',
};

/**
 * Get timezone for a city
 */
export function getCityTimezone(cityName) {
  if (!cityName) return DEFAULT_TIMEZONE;
  
  // ✅ Check exact city match first
  for (const [city, timezone] of Object.entries(CITY_TIMEZONES)) {
    if (cityName.includes(city.split(',')[0]) || cityName === city) {
      return timezone;
    }
  }
  
  // ✅ If no exact match, try to extract state and find by state
  const parts = cityName.split(',');
  if (parts.length === 2) {
    const state = parts[1].trim().toUpperCase();
    if (STATE_TIMEZONES[state]) {
      return STATE_TIMEZONES[state];
    }
  }
  
  return DEFAULT_TIMEZONE;
}

/**
 * Format date for FortyGuard API
 */
export function formatDateForAPI(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Format time for display with timezone
 */
export function formatTimeWithTimezone(date, cityName = null) {
  const timezone = getCityTimezone(cityName);
  
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/**
 * Format date with timezone
 */
export function formatDateWithTimezone(date, cityName = null) {
  const timezone = getCityTimezone(cityName);
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  });
}

/**
 * Format datetime with timezone
 */
export function formatDateTimeWithTimezone(date, cityName = null) {
  const timezone = getCityTimezone(cityName);
  
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/**
 * Get current time in city's timezone
 */
export function getCurrentTimeInCity(cityName = null) {
  const timezone = getCityTimezone(cityName);
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/**
 * Format time for display (fallback to UTC if no city)
 */
export function formatTime(date, cityName = null) {
  return formatTimeWithTimezone(date, cityName);
}

/**
 * Get relative time in city's timezone
 */
export function getRelativeTimeWithTimezone(date, cityName = null) {
  const timezone = getCityTimezone(cityName);
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Check if date is within forecast window (12 hours)
 */
export function isWithinForecastWindow(date) {
  const now = new Date();
  const future = new Date(date);
  const diff = future - now;
  return diff > 0 && diff <= 12 * 3600000; // 12 hours
}

/**
 * Get forecast time slots with timezone
 */
export function getForecastTimeSlots(cityName = null, hours = 12) {
  const timezone = getCityTimezone(cityName);
  const slots = [];
  const now = new Date();
  
  for (let i = 1; i <= hours; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() + i);
    slots.push({
      time: date.toISOString(),
      label: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
      }),
      hour: i,
    });
  }
  
  return slots;
}

/**
 * Get timezone abbreviation
 */
export function getTimezoneAbbreviation(cityName = null) {
  const timezone = getCityTimezone(cityName);
  const date = new Date();
  const parts = date.toLocaleString('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  });
  const match = parts.match(/[A-Z]{3,4}$/);
  return match ? match[0] : 'UTC';
}