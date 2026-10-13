import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Navigation,
  Car,
  Star,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  User as UserIcon,
  Search,
  Sparkles,
} from 'lucide-react';
import { usersApi, driversApi, pricingApi, ridesApi } from '../services/api';
import { User, NearbyDriver, PricingEstimate } from '../types';
import { CoordinateMap } from '../components/CoordinateMap';

// Preset locations for quick testing in Coimbatore
const LOCATION_PRESETS = [
  { name: 'Gandhipuram Cross Cut', lat: 11.0168, lng: 76.9558 },
  { name: 'Coimbatore Junction Railway', lat: 10.9987, lng: 76.9600 },
  { name: 'Brookefields Mall, RS Puram', lat: 11.0085, lng: 76.9515 },
  { name: 'Coimbatore Airport (CJB), Peelamedu', lat: 11.0310, lng: 77.0320 },
  { name: 'CHIL SEZ IT Park, Saravanampatti', lat: 11.0827, lng: 76.9958 },
  { name: 'PSG College of Technology, Peelamedu', lat: 11.0245, lng: 77.0028 },
  { name: 'Saibaba Colony, Mettupalayam Rd', lat: 11.0250, lng: 76.9500 },
];

export const BookRide: React.FC = () => {
  const navigate = useNavigate();

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Pickup state
  const [pickupAddress, setPickupAddress] = useState<string>('Gandhipuram Cross Cut Road');
  const [pickupLat, setPickupLat] = useState<number>(11.0168);
  const [pickupLng, setPickupLng] = useState<number>(76.9558);

  // Destination state
  const [destAddress, setDestAddress] = useState<string>('Coimbatore Airport (CJB), Peelamedu');
  const [destLat, setDestLat] = useState<number>(11.0310);
  const [destLng, setDestLng] = useState<number>(77.0320);

  // Search radius & nearby drivers
  const [radiusKm, setRadiusKm] = useState<number>(5.0);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [isSearchingDrivers, setIsSearchingDrivers] = useState<boolean>(false);

  // Pricing estimate
  const [estimate, setEstimate] = useState<PricingEstimate | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState<boolean>(false);

  // Booking states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<{ rideId: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const uList = await usersApi.listUsers();
        setUsers(uList);
        if (uList.length > 0) {
          setSelectedUserId(uList[0].id);
        }
      } catch {
        // fallback demo user
        setSelectedUserId('U101');
      }
    };
    fetchUsers();
  }, []);

  // Fetch nearby drivers and pricing estimate whenever pickup or destination changes
  useEffect(() => {
    const updateDriversAndPrice = async () => {
      // 1. Fetch nearby drivers
      setIsSearchingDrivers(true);
      try {
        const drivers = await driversApi.getNearby(pickupLat, pickupLng, radiusKm);
        setNearbyDrivers(drivers);
      } catch {
        setNearbyDrivers([]);
      } finally {
        setIsSearchingDrivers(false);
      }

      // 2. Fetch pricing estimate
      setIsCalculatingPrice(true);
      try {
        const est = await pricingApi.estimate({
          pickup: { lat: pickupLat, lng: pickupLng },
          destination: { lat: destLat, lng: destLng },
        });
        setEstimate(est);
      } catch {
        setEstimate(null);
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    const debounce = setTimeout(updateDriversAndPrice, 300);
    return () => clearTimeout(debounce);
  }, [pickupLat, pickupLng, destLat, destLng, radiusKm]);

  // Handle preset clicks
  const applyPickupPreset = (preset: (typeof LOCATION_PRESETS)[0]) => {
    setPickupAddress(preset.name);
    setPickupLat(preset.lat);
    setPickupLng(preset.lng);
  };

  const applyDestPreset = (preset: (typeof LOCATION_PRESETS)[0]) => {
    setDestAddress(preset.name);
    setDestLat(preset.lat);
    setDestLng(preset.lng);
  };

  // Submit ride request
  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBookingSuccess(null);

    if (!selectedUserId) {
      setError('Please select a user account');
      return;
    }
    if (!pickupAddress.trim() || !destAddress.trim()) {
      setError('Both pickup and destination addresses are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await ridesApi.requestRide({
        userId: selectedUserId,
        pickup: {
          lat: pickupLat,
          lng: pickupLng,
          address: pickupAddress,
        },
        destination: {
          lat: destLat,
          lng: destLng,
          address: destAddress,
        },
      });

      setBookingSuccess({
        rideId: res.rideId,
        message: res.message || 'Ride requested successfully',
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to request ride. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Book a Ride & Nearby Fleet Matching
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select rider, define pickup and destination coordinates, view real-time available drivers, and submit dispatch request.
        </p>
      </div>

      {/* Success Banner */}
      {bookingSuccess && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">
                Ride Requested: <span className="font-mono text-emerald-700">{bookingSuccess.rideId}</span>
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                {bookingSuccess.message}. Broadcasted to nearby drivers awaiting acceptance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/track?rideId=${bookingSuccess.rideId}`)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
            >
              <span>Track Ride Live</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/dispatch`)}
              className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg shadow-2xs transition"
            >
              Dispatch Console
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left, Radar Map & Drivers Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Booking Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <form onSubmit={handleRequestRide} className="space-y-6">
            {/* Rider Account Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                Select Passenger Profile
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.id}) — {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Pickup Location & Coordinates
                </label>
              </div>

              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Pickup address name"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">LATITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={pickupLat}
                    onChange={(e) => setPickupLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">LONGITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={pickupLng}
                    onChange={(e) => setPickupLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Quick Presets Pills */}
              <div className="pt-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {LOCATION_PRESETS.slice(0, 3).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPickupPreset(p)}
                      className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                    >
                      {p.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-rose-600" />
                Destination & Coordinates
              </label>

              <input
                type="text"
                value={destAddress}
                onChange={(e) => setDestAddress(e.target.value)}
                placeholder="Destination address name"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">LATITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={destLat}
                    onChange={(e) => setDestLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono">LONGITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={destLng}
                    onChange={(e) => setDestLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Quick Presets Pills */}
              <div className="pt-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {LOCATION_PRESETS.slice(3, 6).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyDestPreset(p)}
                      className="px-2 py-0.5 text-[10px] font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition"
                    >
                      {p.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estimated Fare & Trip Specs Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Estimated Fare</span>
                <span className="font-mono text-[11px]">
                  {estimate ? `${estimate.distanceKm} km • ~${estimate.durationMinutes} mins` : 'Calculating...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900 flex items-center">
                  ₹{estimate ? estimate.estimatedFare.toFixed(2) : '--'}
                </div>
                <div className="text-[11px] text-slate-500 text-right">
                  Base: ₹50 | Rate: ₹15/km
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Ride Request Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 text-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Compass className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Dispatching Request...' : 'Request Ride (POST /api/rides)'}</span>
            </button>
          </form>
        </div>

        {/* Right Radar Map & Live Nearby Drivers (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Radar Visual Map Component */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Geospatial Telemetry & Route Map</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Radius:</span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                >
                  <option value={3}>3 km</option>
                  <option value={5}>5 km (Default)</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                </select>
              </div>
            </div>

            <CoordinateMap
              pickup={{ lat: pickupLat, lng: pickupLng, address: pickupAddress }}
              destination={{ lat: destLat, lng: destLng, address: destAddress }}
              nearbyDrivers={nearbyDrivers}
              height="300px"
            />
          </div>

          {/* Nearby Available Drivers List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Nearby Available Drivers ({nearbyDrivers.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Haversine distance calculation within {radiusKm} km from pickup
                </p>
              </div>
              {isSearchingDrivers && (
                <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                  <Search className="w-3.5 h-3.5 animate-spin" /> Scanning fleet...
                </span>
              )}
            </div>

            {nearbyDrivers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No available drivers within {radiusKm} km radius. Try increasing the search radius above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {nearbyDrivers.map((d) => (
                  <div
                    key={d.driverId}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{d.name}</span>
                      <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                        {d.vehicleType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{d.vehicleNumber}</span>
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-current mr-0.5" />
                        {d.rating}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px] font-semibold text-emerald-700">
                      <span>Distance: {d.distanceKm.toFixed(2)} km</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({d.location.lat.toFixed(3)}, {d.location.lng.toFixed(3)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
