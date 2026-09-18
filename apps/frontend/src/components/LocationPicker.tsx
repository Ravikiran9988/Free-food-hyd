import { useState, useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  value: { lat: number; lon: number } | null;
  onChange: (pos: { lat: number; lon: number }) => void;
  className?: string;
}

const HYDERABAD_CENTER: [number, number] = [17.3850, 78.4867];

// Component to handle map clicks
function MapInteraction({ setPosition }: { setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return null;
}

// Component to programmatically pan the map when location updates externally
function MapPanner({ position }: { position: L.LatLngExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { animate: true });
    }
  }, [position, map]);
  return null;
}

interface GeocodeResult {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
}

export function LocationPicker({ value, onChange, className = "h-64 w-full rounded-xl" }: LocationPickerProps) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const markerRef = useRef<L.Marker>(null);
  const searchTimeoutRef = useRef<any>(null);

  const markerPosition = value ? (L.latLng(value.lat, value.lon) as L.LatLng) : null;

  // Reverse Geocoding
  const performReverseGeocode = async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setDisplayAddress(data.display_name);
        } else {
          setDisplayAddress("Location selected");
        }
      }
    } catch (e) {
      console.error('Reverse geocode failed', e);
      setDisplayAddress("Location selected");
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handlePositionChange = (latlng: L.LatLng) => {
    onChange({ lat: latlng.lat, lon: latlng.lng });
    setGeoError(null);
    performReverseGeocode(latlng.lat, latlng.lng);
  };

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          handlePositionChange(marker.getLatLng());
        }
      },
    }),
    [onChange]
  );

  const requestGeolocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Location permission was not granted. Search for a place or select a location on the map.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionChange(L.latLng(pos.coords.latitude, pos.coords.longitude));
      },
      () => {
        setGeoError("Location permission was not granted. Search for a place or select a location on the map.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Search Geocoding
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Biased towards Hyderabad: viewbox
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&viewbox=78.1,17.6,78.8,17.2`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (e) {
        console.error('Geocode search failed', e);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // It auto-searches because of handleSearchChange, but preventing default stops form submission
    }
  };

  const handleSelectSuggestion = (s: GeocodeResult) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    onChange({ lat, lon });
    setDisplayAddress(s.display_name);
    setSearchQuery(s.display_name);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-4">
      {/* Search & Current Location Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              placeholder="🔍 Search for a place, area or landmark..."
              className="w-full pl-9 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
              ) : (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-200/50 rounded-md">Search</span>
              )}
            </div>
          </div>
          
          {/* Dropdown */}
          {showDropdown && searchQuery.length >= 3 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-[1000] max-h-60 overflow-y-auto">
              {suggestions.length > 0 ? (
                suggestions.map((s) => (
                  <button
                    key={s.place_id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 inline-block mr-2 text-slate-400" />
                    {s.display_name}
                  </button>
                ))
              ) : !isSearching ? (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  No places found.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={requestGeolocation}
          className="flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 hover:bg-brand-100 px-4 py-2.5 rounded-xl transition-colors shrink-0 w-full sm:w-auto justify-center"
        >
          <Navigation className="w-4 h-4" />
          📍 Use My Current Location
        </button>
      </div>

      {geoError && (
        <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
          {geoError}
        </div>
      )}

      {/* Map Container */}
      <div className={`relative border border-slate-200 rounded-xl overflow-hidden z-0 ${className}`}>
        <MapContainer 
          center={value ? [value.lat, value.lon] : HYDERABAD_CENTER} 
          zoom={13} 
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInteraction setPosition={handlePositionChange} />
          {markerPosition && <MapPanner position={markerPosition} />}
          {markerPosition && (
            <Marker 
              draggable={true} 
              eventHandlers={markerEventHandlers} 
              position={markerPosition} 
              ref={markerRef} 
            />
          )}
        </MapContainer>
        
        {!value && (
          <div className="absolute inset-0 bg-slate-900/10 pointer-events-none flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg border border-white/20 text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              Tap anywhere on the map to place a marker
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {value && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected location:</span>
            {isReverseGeocoding ? (
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching address...
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-900 mt-0.5">{displayAddress || "Location selected"}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pt-1">
            <div>Lat: <span className="font-semibold text-slate-700">{value.lat.toFixed(6)}</span></div>
            <div>Lon: <span className="font-semibold text-slate-700">{value.lon.toFixed(6)}</span></div>
            <div className="ml-auto text-[10px] text-slate-400 font-sans font-medium uppercase tracking-wider bg-slate-200/50 px-2 py-0.5 rounded-md">Drag marker to adjust</div>
          </div>
        </div>
      )}
    </div>
  );
}
