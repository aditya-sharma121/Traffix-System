import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { SimulationState } from '../services/api';
import { MapPin, Layers, Navigation, Siren, ShieldCheck, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  state: SimulationState | null;
}

interface CityPreset {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  intersectionName: string;
}

const CITY_PRESETS: CityPreset[] = [
  { name: '🗽 New York (Broadway & 7th Ave)', lat: 40.7580, lng: -73.9855, zoom: 18, intersectionName: 'Times Square Central Junction' },
  { name: '🌁 San Francisco (Market & 4th St)', lat: 37.7857, lng: -122.4064, zoom: 18, intersectionName: 'Market Street Commercial Corridor' },
  { name: '🇬🇧 London (Oxford Circus)', lat: 51.5152, lng: -0.1419, zoom: 18, intersectionName: 'Oxford Circus Intersection' },
  { name: '🇯🇵 Tokyo (Shibuya Crossing)', lat: 35.6595, lng: 139.7005, zoom: 18, intersectionName: 'Shibuya Scramble Crossing' },
  { name: '🇮🇳 New Delhi (Connaught Place)', lat: 28.6315, lng: 77.2167, zoom: 18, intersectionName: 'Barakhamba Radial Junction' },
  { name: '🏙️ Bengaluru (MG Road & Brigade)', lat: 12.9740, lng: 77.6080, zoom: 18, intersectionName: 'Brigade Road Junction' }
];

export const RealGoogleMapView: React.FC<Props> = ({ state }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const vehicleLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const trafficPolylinesRef = useRef<L.LayerGroup | null>(null);
  const signalMarkerRef = useRef<L.Marker | null>(null);

  const [activeCity, setActiveCity] = useState<CityPreset>(CITY_PRESETS[0]);
  const [tileType, setTileType] = useState<'streets' | 'satellite' | 'navigation'>('streets');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [activeCity.lat, activeCity.lng],
      zoom: activeCity.zoom,
      zoomControl: false, // We render custom Google-style zoom controls
      attributionControl: false
    });

    // Basemap URLs (Crisp Open & Esri High-Res Tiles with Google Cartography aesthetic)
    const streetsTile = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const satelliteTile = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const navTile = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';

    const initialUrl = tileType === 'satellite' ? satelliteTile : tileType === 'navigation' ? navTile : streetsTile;
    const tileLayer = L.tileLayer(initialUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    vehicleLayerGroupRef.current = L.layerGroup().addTo(map);
    trafficPolylinesRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Style
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const streetsTile = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const satelliteTile = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const navTile = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';

    const url = tileType === 'satellite' ? satelliteTile : tileType === 'navigation' ? navTile : streetsTile;
    tileLayerRef.current.setUrl(url);
  }, [tileType]);

  // Update Center when city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([activeCity.lat, activeCity.lng], activeCity.zoom, {
      duration: 1.5
    });
  }, [activeCity]);

  // Update Traffic Signals & Live Vehicles overlay on the Real Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !vehicleLayerGroupRef.current || !trafficPolylinesRef.current) return;

    // Clear dynamic markers
    vehicleLayerGroupRef.current.clearLayers();
    trafficPolylinesRef.current.clearLayers();

    const centerLat = activeCity.lat;
    const centerLng = activeCity.lng;

    // 1. Draw Google Maps Traffic Polylines (North, South, East, West legs on real roads)
    const legOffset = 0.0012; // approx 130 meters in lat/lng
    const queues = state?.queues || { NORTH: 0, SOUTH: 0, EAST: 0, WEST: 0 };

    const getLegColor = (q: number) => {
      if (q > 7) return '#dc2626'; // Deep Red
      if (q > 4) return '#ef4444'; // Red
      if (q > 1) return '#f59e0b'; // Orange
      return '#22c55e'; // Green
    };

    // North approach line
    L.polyline([[centerLat + legOffset, centerLng], [centerLat, centerLng]], {
      color: getLegColor(queues.NORTH),
      weight: 6,
      opacity: 0.85
    }).addTo(trafficPolylinesRef.current);

    // South approach line
    L.polyline([[centerLat - legOffset, centerLng], [centerLat, centerLng]], {
      color: getLegColor(queues.SOUTH),
      weight: 6,
      opacity: 0.85
    }).addTo(trafficPolylinesRef.current);

    // East approach line
    L.polyline([[centerLat, centerLng + legOffset], [centerLat, centerLng]], {
      color: getLegColor(queues.EAST),
      weight: 6,
      opacity: 0.85
    }).addTo(trafficPolylinesRef.current);

    // West approach line
    L.polyline([[centerLat, centerLng - legOffset], [centerLat, centerLng]], {
      color: getLegColor(queues.WEST),
      weight: 6,
      opacity: 0.85
    }).addTo(trafficPolylinesRef.current);

    // 2. Center Traffic Light HUD Marker
    const signals = state?.signals || { NORTH: 'RED', SOUTH: 'RED', EAST: 'RED', WEST: 'RED' };
    const phase = state?.phase || 'NS_GREEN';
    const countdown = state?.time_remaining || 0;
    const isEmergency = state?.emergency_active;

    const signalIconHtml = `
      <div style="
        background: white;
        border: 2px solid ${isEmergency ? '#ef4444' : '#7c3aed'};
        border-radius: 12px;
        padding: 4px 8px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        font-family: -apple-system, sans-serif;
        text-align: center;
        white-space: nowrap;
        transform: translate(-50%, -50%);
      ">
        <div style="font-size: 14px; font-weight: 900; color: ${isEmergency ? '#dc2626' : '#6d28d9'}; font-family: monospace;">
          ${countdown}s
        </div>
        <div style="font-size: 8px; font-weight: bold; color: #475569; text-transform: uppercase;">
          ${isEmergency ? 'EMERGENCY' : phase.replace(/_/g, ' ')}
        </div>
        <div style="display: flex; gap: 3px; justify-content: center; margin-top: 2px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: ${signals.NORTH === 'GREEN' ? '#10b981' : signals.NORTH === 'YELLOW' ? '#eab308' : '#ef4444'};"></span>
          <span style="width: 6px; height: 6px; border-radius: 50%; background: ${signals.SOUTH === 'GREEN' ? '#10b981' : signals.SOUTH === 'YELLOW' ? '#eab308' : '#ef4444'};"></span>
          <span style="width: 6px; height: 6px; border-radius: 50%; background: ${signals.EAST === 'GREEN' ? '#10b981' : signals.EAST === 'YELLOW' ? '#eab308' : '#ef4444'};"></span>
          <span style="width: 6px; height: 6px; border-radius: 50%; background: ${signals.WEST === 'GREEN' ? '#10b981' : signals.WEST === 'YELLOW' ? '#eab308' : '#ef4444'};"></span>
        </div>
      </div>
    `;

    const centerIcon = L.divIcon({
      html: signalIconHtml,
      className: 'custom-traffic-hud',
      iconSize: [60, 40]
    });

    if (signalMarkerRef.current) {
      signalMarkerRef.current.setIcon(centerIcon);
      signalMarkerRef.current.setLatLng([centerLat, centerLng]);
    } else {
      signalMarkerRef.current = L.marker([centerLat, centerLng], { icon: centerIcon }).addTo(map);
    }

    // 3. Render Simulated Vehicles on the Real Street Map
    if (state && state.vehicles) {
      state.vehicles.forEach((v) => {
        // Map 0-320m simulation position to GPS coordinates along the actual road axis
        const progress = (v.position - 180.0) / 140.0; // [-1.2 to 1.0]

        let vLat = centerLat;
        let vLng = centerLng;

        if (v.direction === 'NORTH') {
          vLat = centerLat + (progress * -legOffset);
          vLng = centerLng - 0.00008; // slightly offset to lane side
        } else if (v.direction === 'SOUTH') {
          vLat = centerLat + (progress * legOffset);
          vLng = centerLng + 0.00008;
        } else if (v.direction === 'EAST') {
          vLat = centerLat + 0.00008;
          vLng = centerLng + (progress * legOffset);
        } else if (v.direction === 'WEST') {
          vLat = centerLat - 0.00008;
          vLng = centerLng + (progress * -legOffset);
        }

        const vehicleColor = v.is_emergency ? '#ef4444' : v.color || '#3b82f6';
        const vIconHtml = `
          <div style="
            width: ${v.type === 'bus' || v.type === 'truck' ? '18px' : '12px'};
            height: ${v.type === 'bus' || v.type === 'truck' ? '18px' : '12px'};
            background: ${vehicleColor};
            border: 2px solid white;
            border-radius: ${v.type === 'motorcycle' ? '50%' : '3px'};
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ${v.is_emergency ? 'animation: emergency-pulse 0.8s infinite alternate;' : ''}
          "></div>
        `;

        const vIcon = L.divIcon({
          html: vIconHtml,
          className: 'map-vehicle-marker',
          iconSize: [14, 14]
        });

        L.marker([vLat, vLng], { icon: vIcon }).addTo(vehicleLayerGroupRef.current!);
      });
    }
  }, [state, activeCity]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Top Controls Bar */}
      <div className="w-full max-w-[640px] flex flex-wrap items-center justify-between pb-2 px-1 gap-2">
        {/* City Location Preset Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-violet-200/90 rounded-xl px-2.5 py-1 shadow-xs text-xs">
          <MapPin className="w-3.5 h-3.5 text-violet-600 shrink-0" />
          <select
            value={activeCity.name}
            onChange={(e) => {
              const selected = CITY_PRESETS.find((c) => c.name === e.target.value);
              if (selected) setActiveCity(selected);
            }}
            className="bg-transparent border-none text-violet-950 font-semibold focus:outline-none cursor-pointer"
          >
            {CITY_PRESETS.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tile Style Buttons */}
        <div className="flex items-center gap-1 bg-white border border-violet-200/90 rounded-xl p-1 shadow-xs">
          <button
            onClick={() => setTileType('streets')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              tileType === 'streets' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-violet-950'
            }`}
          >
            Google Streets
          </button>
          <button
            onClick={() => setTileType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              tileType === 'satellite' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-violet-950'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setTileType('navigation')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              tileType === 'navigation' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-violet-950'
            }`}
          >
            Dark Nav
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative rounded-2xl overflow-hidden border border-violet-200 shadow-md bg-white p-1 w-full max-w-[640px] aspect-square">
        <div ref={mapContainerRef} className="w-full h-full rounded-xl z-0" />

        {/* Floating Google-Style Zoom Controls */}
        <div className="absolute right-4 bottom-8 flex flex-col gap-1 z-10">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 bg-white hover:bg-violet-50 text-slate-700 rounded-md border border-violet-200 shadow-md flex items-center justify-center font-bold transition text-base"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 bg-white hover:bg-violet-50 text-slate-700 rounded-md border border-violet-200 shadow-md flex items-center justify-center font-bold transition text-base"
            title="Zoom Out"
          >
            -
          </button>
        </div>

        {/* Google Maps Watermark & Attribution */}
        <div className="absolute bottom-2 left-3 z-10 flex items-center gap-1.5 pointer-events-none bg-white/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-600 border border-violet-100">
          <span className="font-bold text-blue-600">G</span>
          <span className="font-bold text-red-500">o</span>
          <span className="font-bold text-amber-500">o</span>
          <span className="font-bold text-blue-600">g</span>
          <span className="font-bold text-green-600">l</span>
          <span className="font-bold text-red-500">e</span>
          <span className="text-slate-400 font-sans">• Real Geospatial Map</span>
        </div>

        {/* Current Active Location Tag */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur px-3 py-1 rounded-lg border border-violet-200 shadow-xs text-xs font-semibold text-violet-950 flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-violet-600" />
          <span>{activeCity.intersectionName}</span>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex items-center justify-between w-full max-w-[640px] mt-3 text-xs text-slate-500 font-medium px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Fast Flow</span>
          <span className="flex items-center gap-1 text-amber-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate</span>
          <span className="flex items-center gap-1 text-red-600"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Congestion</span>
        </div>
        <div className="text-[11px] font-mono text-violet-700 font-semibold">
          GPS: {activeCity.lat.toFixed(4)}°N, {activeCity.lng.toFixed(4)}°W
        </div>
      </div>
    </div>
  );
};
