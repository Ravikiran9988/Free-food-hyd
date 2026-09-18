import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import type { SpotSummary, MapPoint } from '../services/api';

// Marker Icons Config
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

interface MapComponentProps {
  spots?: (SpotSummary | MapPoint | any)[];
  className?: string;
  center?: [number, number];
  zoom?: number;
  selectedSpotId?: string | null;
  onSelectSpot?: (spotId: string) => void;
  autoFitBounds?: boolean;
}

export function MapComponent({
  spots = [],
  className = "h-[500px] w-full rounded-xl z-0",
  center = [17.3850, 78.4867],
  zoom = 11,
  selectedSpotId = null,
  onSelectSpot,
  autoFitBounds = false
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersMapRef = useRef<{ [id: string]: L.Marker }>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        scrollWheelZoom: true,
        zoomControl: false,
      });

      // Add Zoom Control at bottom-right for clean mobile UI
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Free Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Initialize Cluster Group
      const clusterGroup = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let c = 'bg-brand-600 text-white border-2 border-white shadow-lg';
          let size = 36;
          if (count > 50) {
            c = 'bg-emerald-700 text-white border-2 border-white shadow-lg';
            size = 44;
          } else if (count > 20) {
            c = 'bg-brand-700 text-white border-2 border-white shadow-lg';
            size = 40;
          }
          return L.divIcon({
            html: `<div class="flex items-center justify-center font-bold text-xs rounded-full w-full h-full ${c}">${count}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(size, size),
          });
        },
      });

      map.addLayer(clusterGroup);
      mapInstanceRef.current = map;
      markerClusterGroupRef.current = clusterGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerClusterGroupRef.current = null;
      }
    };
  }, []);

  // Update Markers & Clusters when spots change
  useEffect(() => {
    const clusterGroup = markerClusterGroupRef.current;
    const map = mapInstanceRef.current;
    if (!clusterGroup || !map) return;

    clusterGroup.clearLayers();
    markersMapRef.current = {};

    const validSpots = spots.filter(
      (s) => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0
    );

    const newMarkers: L.Marker[] = [];

    validSpots.forEach((spot) => {
      const liveStatus = spot.live_status || spot.status || 'upcoming';
      const statusColor =
        liveStatus === 'serving_now' || liveStatus === 'active'
          ? 'bg-emerald-500'
          : liveStatus === 'starting_soon'
          ? 'bg-amber-500'
          : 'bg-slate-600';

      const customMarkerHtml = `
        <div class="relative cursor-pointer group">
          <div class="w-6 h-6 rounded-full ${statusColor} border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold transition-transform group-hover:scale-125">
            ${liveStatus === 'serving_now' ? '🟢' : liveStatus === 'starting_soon' ? '🟡' : '🍲'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customMarkerHtml,
        className: 'custom-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([spot.latitude, spot.longitude], { icon: customIcon });

      const popupContent = `
        <div class="p-1 min-w-[200px] text-slate-900 font-sans">
          <div class="text-[10px] uppercase font-bold text-brand-700 tracking-wider mb-1">${spot.category || 'Annadhanam'}</div>
          <h4 class="font-bold text-sm leading-snug mb-1 text-slate-900">${spot.landmark || spot.name || spot.area_name.split(',')[0]}</h4>
          <p class="text-xs text-slate-600 mb-2 leading-relaxed">${spot.area_name}</p>
          <div class="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <span>🕒 ${spot.start_time || 'Schedule available'} - ${spot.end_time || ''}</span>
          </div>
          <a href="/spot/${spot.id}" class="block w-full py-2 text-center text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm">
            View Details
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280, className: 'modern-leaflet-popup' });

      marker.on('click', () => {
        if (onSelectSpot) onSelectSpot(spot.id);
      });

      markersMapRef.current[spot.id] = marker;
      newMarkers.push(marker);
    });

    clusterGroup.addLayers(newMarkers);

    // Auto-fit bounds if markers exist AND autoFitBounds is true
    if (autoFitBounds && validSpots.length > 0 && validSpots.length < 500) {
      const bounds = L.latLngBounds(validSpots.map((s) => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [spots, onSelectSpot, autoFitBounds, center, zoom]);

  // Handle selectedSpotId pan & popup open
  useEffect(() => {
    if (!selectedSpotId || !mapInstanceRef.current) return;
    const marker = markersMapRef.current[selectedSpotId];
    if (marker) {
      const latlng = marker.getLatLng();
      mapInstanceRef.current.setView(latlng, 15, { animate: true });
      marker.openPopup();
    }
  }, [selectedSpotId]);

  return (
    <div className={className}>
      <div ref={mapContainerRef} className="h-full w-full rounded-xl overflow-hidden shadow-sm border border-slate-200" />
    </div>
  );
}
