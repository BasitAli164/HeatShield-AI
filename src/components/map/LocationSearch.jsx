'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { isUSLocation } from '@/lib/geo/coordinates';
import { searchCities, getNearestCity, getStates } from '@mardillu/us-cities-utils';

// Get all US states
const US_STATES = getStates();

// Create mapping for state name -> abbreviation
const STATE_NAME_TO_ABBR = {};
const STATE_ABBR_TO_NAME = {};

US_STATES.forEach(state => {
  STATE_NAME_TO_ABBR[state.name.toLowerCase()] = state.nameAbbr;
  STATE_NAME_TO_ABBR[state.name.toLowerCase().replace(/\./g, '')] = state.nameAbbr;
  STATE_ABBR_TO_NAME[state.nameAbbr] = state.name;
});

// State aliases
const STATE_ALIASES = {
  'ca': 'CA', 'california': 'CA',
  'ny': 'NY', 'new york': 'NY',
  'tx': 'TX', 'texas': 'TX',
  'fl': 'FL', 'florida': 'FL',
  'il': 'IL', 'illinois': 'IL',
  'pa': 'PA', 'pennsylvania': 'PA',
  'oh': 'OH', 'ohio': 'OH',
  'ga': 'GA', 'georgia': 'GA',
  'nc': 'NC', 'north carolina': 'NC',
  'mi': 'MI', 'michigan': 'MI',
  'nj': 'NJ', 'new jersey': 'NJ',
  'va': 'VA', 'virginia': 'VA',
  'wa': 'WA', 'washington': 'WA',
  'ma': 'MA', 'massachusetts': 'MA',
  'az': 'AZ', 'arizona': 'AZ',
  'nv': 'NV', 'nevada': 'NV',
  'co': 'CO', 'colorado': 'CO',
  'or': 'OR', 'oregon': 'OR',
  'ut': 'UT', 'utah': 'UT',
  'md': 'MD', 'maryland': 'MD',
  'mn': 'MN', 'minnesota': 'MN',
  'wi': 'WI', 'wisconsin': 'WI',
  'mo': 'MO', 'missouri': 'MO',
  'in': 'IN', 'indiana': 'IN',
  'tn': 'TN', 'tennessee': 'TN',
  'ky': 'KY', 'kentucky': 'KY',
  'sc': 'SC', 'south carolina': 'SC',
  'al': 'AL', 'alabama': 'AL',
  'la': 'LA', 'louisiana': 'LA',
};

// Helper to get state abbreviation from any input
const getStateAbbreviation = (input) => {
  if (!input) return null;
  
  const cleaned = input.trim().toLowerCase();
  
  if (cleaned.length === 2 && /^[a-z]{2}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  
  if (STATE_ALIASES[cleaned]) {
    return STATE_ALIASES[cleaned];
  }
  
  if (STATE_NAME_TO_ABBR[cleaned]) {
    return STATE_NAME_TO_ABBR[cleaned];
  }
  
  return null;
};

// Find city with state
const findCityWithState = (cityName, stateAbbr) => {
  const results = searchCities(cityName);
  if (results.length === 0) return null;
  
  if (stateAbbr) {
    const exactMatch = results.find(c => c.state === stateAbbr);
    if (exactMatch) return exactMatch;
    
    const caseMatch = results.find(c => c.state.toUpperCase() === stateAbbr.toUpperCase());
    if (caseMatch) return caseMatch;
  }
  
  return results[0];
};

export default function LocationSearch({ 
  onLocationSelect, 
  onError,
  className = '',
  defaultLocation = 'Phoenix, AZ',
}) {
  const [query, setQuery] = useState(defaultLocation);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search cities dynamically
  const handleSearch = async (value) => {
    setQuery(value);
    setIsValid(true);
    setValidationMessage('');
    
    if (value.length > 1) {
      setIsSearching(true);
      
      try {
        const parts = value.split(',').map(s => s.trim());
        const cityName = parts[0];
        const stateInput = parts.length > 1 ? parts[1] : '';
        const stateAbbr = stateInput ? getStateAbbreviation(stateInput) : null;
        
        const results = searchCities(cityName);
        
        let filteredResults = results;
        if (stateAbbr) {
          filteredResults = results.filter(c => c.state === stateAbbr);
          if (filteredResults.length === 0) {
            filteredResults = results.filter(c => c.state.toUpperCase() === stateAbbr.toUpperCase());
          }
        }
        
        if (filteredResults.length === 0) {
          filteredResults = results;
        }
        
        const formatted = filteredResults.slice(0, 10).map(city => 
          `${city.name}, ${city.state}`
        );
        
        setSuggestions(formatted);
        setIsOpen(formatted.length > 0);
      } catch (error) {
        console.warn('Search error:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // Validate location
  const validateLocation = (cityString) => {
    if (!cityString || cityString.trim().length === 0) {
      setValidationMessage('Please enter a city');
      setIsValid(false);
      return false;
    }

    const parts = cityString.split(',').map(s => s.trim());
    const cityName = parts[0];
    const stateInput = parts.length > 1 ? parts[1] : '';
    const stateAbbr = stateInput ? getStateAbbreviation(stateInput) : null;
    
    const cityData = findCityWithState(cityName, stateAbbr);
    
    if (!cityData) {
      setValidationMessage(`City "${cityName}" not found. Please select from suggestions.`);
      setIsValid(false);
      return false;
    }
    
    const formattedCity = `${cityData.name}, ${cityData.state}`;
    setQuery(formattedCity);

    setIsValid(true);
    setValidationMessage('');
    return true;
  };

  // Handle select
  const handleSelect = (cityString) => {
    setIsOpen(false);
    
    const parts = cityString.split(',').map(s => s.trim());
    const cityName = parts[0];
    const stateAbbr = parts[1];
    
    const cityData = findCityWithState(cityName, stateAbbr);
    
    if (cityData) {
      const formattedCity = `${cityData.name}, ${cityData.state}`;
      setQuery(formattedCity);
      setSuggestions([]);
      
      if (onLocationSelect) {
        onLocationSelect({
          name: formattedCity,
          latitude: cityData.latitude,
          longitude: cityData.longitude,
        });
      }
      
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } else {
      setValidationMessage('City not found');
      setIsValid(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0]);
    }
  };

  const handleCurrentLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const nearest = getNearestCity(latitude, longitude);
          
          if (nearest) {
            const cityString = `${nearest.name}, ${nearest.state}`;
            setQuery(cityString);
            setIsOpen(false);
            setSuggestions([]);
            if (onLocationSelect) {
              onLocationSelect({
                name: cityString,
                latitude: nearest.latitude,
                longitude: nearest.longitude,
              });
            }
          } else {
            setValidationMessage('No city found near your location');
            setIsValid(false);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setValidationMessage('Unable to get current location');
          setIsValid(false);
          setIsLoading(false);
          if (onError) {
            onError('Unable to get current location. Please select a city.');
          }
        }
      );
    } else {
      setValidationMessage('Geolocation not supported');
      setIsValid(false);
      setIsLoading(false);
      if (onError) {
        onError('Geolocation is not supported by your browser');
      }
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* ✅ ONLY Search Input + Search Icon + Location Icon - Row 1 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search US city (e.g., New York, NY)"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length > 0 && suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all ${
              isValid ? 'border-slate-200' : 'border-red-300 bg-red-50'
            }`}
          />
          {isValid && validationMessage && (
            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
          {!isValid && (
            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
        
        {/* Search Icon */}
        <Button 
          variant="default" 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2.5 flex-shrink-0"
          onClick={() => {
            if (suggestions.length > 0) {
              handleSelect(suggestions[0]);
            } else if (query.length > 0) {
              handleSelect(query);
            }
          }}
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        
        {/* Location Icon */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="rounded-lg px-3 py-2.5 flex-shrink-0 border-slate-200"
          title="Use my current location"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '📍'}
        </Button>
      </div>

      {/* Validation Message */}
      {!isValid && validationMessage && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {validationMessage}
        </p>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
          {suggestions.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              onMouseDown={(e) => e.preventDefault()}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center space-x-2 border-b border-slate-100 last:border-0 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span>{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}