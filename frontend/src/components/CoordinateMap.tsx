import React from 'react';
import { MapPin, Navigation, Car, Compass } from 'lucide-react';

interface Point {
  lat: number;
  lng: number;
  label?: string;
  type: 'pickup' | 'destination' | 'driver' | 'nearby';
}

interface CoordinateMapProps {
  pickup?: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
  driver?: { lat: number; lng: number; name?: string };
  nearbyDrivers?: Array<{ driverId: string; name: string; location: { lat: number; lng: number } }>;
  height?: string;
}

export const CoordinateMap: React.FC<CoordinateMapProps> = ({
  pickup,
  destination,
  driver,
  nearbyDrivers = [],
  height = '360px',
}) => {
  // Collect all valid points
  const points: Point[] = [];
  if (pickup) points.push({ lat: pickup.lat, lng: pickup.lng, label: pickup.address || 'Pickup', type: 'pickup' });
  if (destination) points.push({ lat: destination.lat, lng: destination.lng, label: destination.address || 'Destination', type: 'destination' });
  if (driver) points.push({ lat: driver.lat, lng: driver.lng, label: driver.name || 'Assigned Driver', type: 'driver' });
  nearbyDrivers.forEach((nd) => {
    points.push({ lat: nd.location.lat, lng: nd.location.lng, label: nd.name, type: 'nearby' });
  });

  // Calculate bounding box or default to Coimbatore center
  const centerLat = points.length ? points.reduce((acc, p) => acc + p.lat, 0) / points.length : 11.0168;
  const centerLng = points.length ? points.reduce((acc, p) => acc + p.lng, 0) / points.length : 76.9558;

  // Find min/max with padding
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = lats.length ? Math.min(...lats) - 0.015 : 10.98;
  const maxLat = lats.length ? Math.max(...lats) + 0.015 : 11.06;
  const minLng = lngs.length ? Math.min(...lngs) - 0.015 : 76.91;
  const maxLng = lngs.length ? Math.max(...lngs) + 0.015 : 77.04;

  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  // Normalize point into SVG percentage (0 - 100%)
  const toSvgX = (lng: number) => {
    return Math.min(95, Math.max(5, ((lng - minLng) / lngSpan) * 90 + 5));
  };

  const toSvgY = (lat: number) => {
    // Invert Y because latitude goes up north, SVG Y goes down
    return Math.min(95, Math.max(5, ((maxLat - lat) / latSpan) * 90 + 5));
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner flex flex-col justify-between" style={{ height }}>
      {/* Background Cartographic Grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
          </pattern>
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.4" />
          </pattern>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="#090d16" />
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#dots)" />

        {/* Vector Route Line connecting Driver -> Pickup -> Destination */}
        {pickup && destination && (
          <path
            d={
              driver
                ? `M ${toSvgX(driver.lng)}% ${toSvgY(driver.lat)}% L ${toSvgX(pickup.lng)}% ${toSvgY(pickup.lat)}% L ${toSvgX(destination.lng)}% ${toSvgY(destination.lat)}%`
                : `M ${toSvgX(pickup.lng)}% ${toSvgY(pickup.lat)}% L ${toSvgX(destination.lng)}% ${toSvgY(destination.lat)}%`
            }
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeDasharray="6,4"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Top Map HUD Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-400 animate-spin" style={{ animationDuration: '20s' }} />
          <span className="font-mono text-slate-300">GEOSPATIAL COORDINATE RADAR</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
          <span>CENTER: {centerLat.toFixed(4)}°N, {centerLng.toFixed(4)}°E</span>
          <span className="hidden sm:inline bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-800">Coimbatore Hub</span>
        </div>
      </div>

      {/* Interactive Markers Container */}
      <div className="relative z-10 flex-1 w-full h-full">
        {/* Render Pickup Pin */}
        {pickup && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `${toSvgX(pickup.lng)}%`, top: `${toSvgY(pickup.lat)}%` }}
          >
            <div className="flex flex-col items-center group">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-950">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-emerald-500/50 text-[10px] font-medium text-emerald-300 whitespace-nowrap shadow">
                Pickup ({pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)})
              </div>
            </div>
          </div>
        )}

        {/* Render Destination Pin */}
        {destination && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `${toSvgX(destination.lng)}%`, top: `${toSvgY(destination.lat)}%` }}
          >
            <div className="flex flex-col items-center group">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/50 ring-4 ring-rose-950">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-rose-500/50 text-[10px] font-medium text-rose-300 whitespace-nowrap shadow">
                Drop ({destination.lat.toFixed(4)}, {destination.lng.toFixed(4)})
              </div>
            </div>
          </div>
        )}

        {/* Render Assigned Driver Pin */}
        {driver && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
            style={{ left: `${toSvgX(driver.lng)}%`, top: `${toSvgY(driver.lat)}%` }}
          >
            <div className="flex flex-col items-center group">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/50 ring-4 ring-blue-950 animate-bounce">
                <Car className="w-4 h-4" />
              </div>
              <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-blue-500 text-[10px] font-semibold text-blue-300 whitespace-nowrap shadow">
                {driver.name || 'Driver'} ({driver.lat.toFixed(4)}, {driver.lng.toFixed(4)})
              </div>
            </div>
          </div>
        )}

        {/* Render Nearby Drivers */}
        {nearbyDrivers.map((nd) => (
          <div
            key={nd.driverId}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ left: `${toSvgX(nd.location.lng)}%`, top: `${toSvgY(nd.location.lat)}%` }}
          >
            <div className="flex flex-col items-center opacity-85 hover:opacity-100 hover:scale-110 transition-all">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 border border-slate-500 text-slate-200">
                <Car className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="mt-0.5 px-1.5 py-0.2 rounded bg-slate-900/80 text-[9px] text-slate-300 whitespace-nowrap">
                {nd.name}
              </div>
            </div>
          </div>
        ))}

        {points.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            <Compass className="w-8 h-8 mb-2 text-slate-600" />
            Enter pickup & destination coordinates to render route and telemetry
          </div>
        )}
      </div>

      {/* Bottom Map Info Footer */}
      <div className="relative z-10 flex items-center justify-between px-4 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pickup
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Drop
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Assigned Driver
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> Nearby Fleet
          </span>
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          LAT: {minLat.toFixed(3)}°-{maxLat.toFixed(3)}° | LNG: {minLng.toFixed(3)}°-{maxLng.toFixed(3)}°
        </div>
      </div>
    </div>
  );
};
