import React, { useState, useEffect, useRef } from 'react';

const QUICK_LOCATIONS = [
  {
    name: 'Anekal Town',
    address: 'Anekal Town, Bengaluru Urban, Karnataka',
    lat: 12.7109,
    lng: 77.6953,
    icon: '🏙️'
  },
  {
    name: 'Electronic City Phase 1',
    address: 'Electronic City Phase 1, Hosur Road, Bengaluru',
    lat: 12.8452,
    lng: 77.6602,
    icon: '⚡'
  },
  {
    name: 'Jigani Industrial Area',
    address: 'Jigani Industrial Area, Anekal Taluk, Karnataka',
    lat: 12.781,
    lng: 77.632,
    icon: '🏭'
  },
  {
    name: 'Chandapura Circle',
    address: 'Chandapura Circle, Anekal Main Road, Karnataka',
    lat: 12.7985,
    lng: 77.7021,
    icon: '🏡'
  },
  {
    name: 'Attibele Border',
    address: 'Attibele Junction, Anekal Taluk, Karnataka',
    lat: 12.7788,
    lng: 77.7712,
    icon: '🛣️'
  },
  {
    name: 'HSR Layout',
    address: 'HSR Layout Sector 1, Bengaluru, Karnataka',
    lat: 12.9121,
    lng: 77.6446,
    icon: '🏢'
  }
];

export default function LocationSearchInput({
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Type to search area, landmark, or street...'
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live suggestions from OpenStreetMap Nominatim with debouncing
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query.trim()
          )}&limit=6&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          const parsed = data.map((item) => ({
            name: item.display_name.split(',')[0],
            address: item.display_name,
            lat: Number(parseFloat(item.lat).toFixed(6)),
            lng: Number(parseFloat(item.lon).toFixed(6)),
            icon: '📍'
          }));
          setSuggestions(parsed);
          setIsOpen(true);
        }
      } catch {
        // Fallback filter from quick locations if network fails
        const matched = QUICK_LOCATIONS.filter(
          (loc) =>
            loc.name.toLowerCase().includes(query.toLowerCase()) ||
            loc.address.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(matched);
        setIsOpen(matched.length > 0);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  function handleChooseLocation(item) {
    setQuery(item.address);
    onChange(item.address);
    if (onSelectLocation) {
      onSelectLocation(item.lat, item.lng, item.address);
    }
    setIsOpen(false);
  }

  return (
    <div className="location-picker-wrapper" ref={wrapperRef}>
      <div className="location-input-container">
        <span className="location-input-icon">🔍</span>
        <input
          type="text"
          className="location-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="location-clear-btn"
            onClick={() => {
              setQuery('');
              onChange('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            title="Clear location"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Location Pills */}
      <div className="quick-locations-bar">
        <span className="quick-label">⚡ Fast Select:</span>
        {QUICK_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            type="button"
            className="quick-loc-pill"
            onClick={() => handleChooseLocation(loc)}
          >
            <span>{loc.icon}</span> {loc.name}
          </button>
        ))}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="location-dropdown">
          {loading && (
            <div className="location-dropdown-loading">
              <span className="spinner-mini"></span> Searching locations...
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <ul className="location-suggestions-list">
              {suggestions.map((item, index) => (
                <li
                  key={`${item.lat}-${item.lng}-${index}`}
                  className="location-suggestion-item"
                  onClick={() => handleChooseLocation(item)}
                >
                  <span className="suggestion-icon">{item.icon}</span>
                  <div className="suggestion-details">
                    <strong className="suggestion-name">{item.name}</strong>
                    <span className="suggestion-address">{item.address}</span>
                  </div>
                  <span className="suggestion-coords">
                    {item.lat}, {item.lng}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!loading && query.trim().length >= 2 && suggestions.length === 0 && (
            <div className="location-no-results">
              No matching locations found. You can keep typing your manual address or click directly
              on the map below!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
