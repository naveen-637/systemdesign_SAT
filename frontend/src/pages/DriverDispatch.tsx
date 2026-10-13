import React, { useState, useEffect } from 'react';
import {
  Car,
  CheckCircle,
  Play,
  Check,
  MapPin,
  Star,
  RefreshCw,
  AlertCircle,
  Clock,
  Compass,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { driversApi, ridesApi } from '../services/api';
import { Driver, RideListItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { wsClient } from '../services/websocket';

export const DriverDispatch: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rides, setRides] = useState<RideListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Selected driver for ride acceptance modal/action
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);
  const [selectedDriverForAccept, setSelectedDriverForAccept] = useState<string>('');

  // Location update modal
  const [updatingDriver, setUpdatingDriver] = useState<Driver | null>(null);
  const [updateLat, setUpdateLat] = useState<number>(11.0168);
  const [updateLng, setUpdateLng] = useState<number>(76.9558);
  const [updateStatus, setUpdateStatus] = useState<string>('AVAILABLE');

  const fetchData = async () => {
    try {
      setActionError(null);
      const [driversData, ridesData] = await Promise.all([
        driversApi.listDrivers(statusFilter || undefined),
        ridesApi.listRides({ limit: 50 }),
      ]);
      setDrivers(driversData);
      setRides(ridesData);

      // Default selected driver for acceptance
      const availableDrivers = driversData.filter((d) => d.availabilityStatus === 'AVAILABLE');
      if (availableDrivers.length > 0 && !selectedDriverForAccept) {
        setSelectedDriverForAccept(availableDrivers[0].id);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to fetch dispatch telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to live WebSocket domain events
    const unsubscribe = wsClient.subscribe(() => {
      fetchData();
    });

    return () => unsubscribe();
  }, [statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // 1. Accept Ride Action
  const handleAcceptRide = async (rideId: string) => {
    if (!selectedDriverForAccept) {
      setActionError('Please select an available driver to accept the ride.');
      return;
    }

    try {
      setActionError(null);
      setActionSuccess(null);
      await ridesApi.acceptRide(rideId, selectedDriverForAccept);
      setActionSuccess(`Driver ${selectedDriverForAccept} successfully accepted ride ${rideId}`);
      setAcceptingRideId(null);
      fetchData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Conflict: Ride cannot be accepted.');
    }
  };

  // 2. Start Ride Action
  const handleStartRide = async (rideId: string) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      await ridesApi.startRide(rideId);
      setActionSuccess(`Ride ${rideId} is now IN_PROGRESS.`);
      fetchData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Failed to start ride.');
    }
  };

  // 3. Complete Ride Action
  const handleCompleteRide = async (rideId: string) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      await ridesApi.completeRide(rideId);
      setActionSuccess(`Ride ${rideId} marked COMPLETED. Assigned driver released back to AVAILABLE.`);
      fetchData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Failed to complete ride.');
    }
  };

  // 4. Update Driver Location
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingDriver) return;

    try {
      setActionError(null);
      setActionSuccess(null);
      await driversApi.updateLocation({
        driverId: updatingDriver.id,
        lat: updateLat,
        lng: updateLng,
        availabilityStatus: updateStatus,
      });
      setActionSuccess(`Driver ${updatingDriver.name} GPS telemetry updated successfully.`);
      setUpdatingDriver(null);
      fetchData();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to update location.');
    }
  };

  // Filter rides awaiting action
  const requestedRides = rides.filter((r) => r.status === 'REQUESTED');
  const acceptedRides = rides.filter((r) => r.status === 'ACCEPTED');
  const inProgressRides = rides.filter((r) => r.status === 'IN_PROGRESS');

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Fleet Dispatch & Driver Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage fleet availability, accept incoming ride requests, control trip lifecycle transitions, and simulate GPS telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Lifecycle Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Awaiting Acceptance (REQUESTED) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              1. Awaiting Acceptance ({requestedRides.length})
            </span>
            <span className="text-[10px] font-mono bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              REQUESTED
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {requestedRides.length === 0 ? (
              <p className="text-xs text-amber-700/70 py-4 text-center">No pending ride requests.</p>
            ) : (
              requestedRides.map((r) => (
                <div key={r.rideId} className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">{r.rideId}</span>
                    <span className="font-bold text-slate-800">₹{r.estimatedFare.toFixed(0)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">From: {r.pickupAddress}</div>
                  <div className="text-[11px] text-slate-600 truncate">To: {r.destinationAddress}</div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <select
                      value={selectedDriverForAccept}
                      onChange={(e) => setSelectedDriverForAccept(e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-[11px] font-medium"
                    >
                      <option value="">Choose Driver...</option>
                      {drivers
                        .filter((d) => d.availabilityStatus === 'AVAILABLE')
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.vehicleType})
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => handleAcceptRide(r.rideId)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] shadow-2xs cursor-pointer transition"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Accepted - Ready to Start (ACCEPTED) */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <Play className="w-4 h-4 text-blue-600" />
              2. Ready to Start ({acceptedRides.length})
            </span>
            <span className="text-[10px] font-mono bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-full font-bold">
              ACCEPTED
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {acceptedRides.length === 0 ? (
              <p className="text-xs text-blue-700/70 py-4 text-center">No accepted rides waiting to start.</p>
            ) : (
              acceptedRides.map((r) => (
                <div key={r.rideId} className="p-3 bg-white rounded-xl border border-blue-200 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">{r.rideId}</span>
                    <span className="text-[11px] font-semibold text-slate-700">Driver: {r.driverName || r.driverId}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">Route: {r.destinationAddress}</div>
                  <button
                    onClick={() => handleStartRide(r.rideId)}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[11px] shadow-2xs cursor-pointer transition flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start Ride (POST /api/rides/{r.rideId}/start)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* In Progress - Complete (IN_PROGRESS) */}
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-indigo-600" />
              3. In Transit / Complete ({inProgressRides.length})
            </span>
            <span className="text-[10px] font-mono bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
              IN_PROGRESS
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {inProgressRides.length === 0 ? (
              <p className="text-xs text-indigo-700/70 py-4 text-center">No rides currently in transit.</p>
            ) : (
              inProgressRides.map((r) => (
                <div key={r.rideId} className="p-3 bg-white rounded-xl border border-indigo-200 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700">{r.rideId}</span>
                    <span className="text-[11px] font-semibold text-slate-700">Driver: {r.driverName || r.driverId}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">Arriving at: {r.destinationAddress}</div>
                  <button
                    onClick={() => handleCompleteRide(r.rideId)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-2xs cursor-pointer transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Complete Trip (POST /api/rides/{r.rideId}/complete)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fleet Driver Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registered Fleet Directory ({drivers.length})</h2>
            <p className="text-xs text-slate-500">Live fleet tracking, telemetry coordinates, and availability states</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['', 'AVAILABLE', 'BUSY', 'OFFLINE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg transition ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status ? status : 'ALL FLEET'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Driver ID</th>
                <th className="px-4 py-3">Driver Name</th>
                <th className="px-4 py-3">Vehicle Details</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Current Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Telemetry Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No drivers matching selected filter.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{d.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{d.name}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{d.vehicleNumber}</div>
                      <div className="text-[11px] text-slate-500">{d.vehicleType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current mr-1" />
                        {d.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {d.latitude.toFixed(4)}°N, {d.longitude.toFixed(4)}°E
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.availabilityStatus} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setUpdatingDriver(d);
                          setUpdateLat(d.latitude);
                          setUpdateLng(d.longitude);
                          setUpdateStatus(d.availabilityStatus);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-300 rounded transition cursor-pointer"
                      >
                        Update GPS
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Location Modal */}
      {updatingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Driver GPS Telemetry</h3>
                <p className="text-xs text-slate-500">{updatingDriver.name} ({updatingDriver.id})</p>
              </div>
              <button
                onClick={() => setUpdatingDriver(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">LATITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={updateLat}
                    onChange={(e) => setUpdateLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={updateLng}
                    onChange={(e) => setUpdateLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">AVAILABILITY STATUS</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BUSY">BUSY</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUpdatingDriver(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save & Broadcast (PUT /api/drivers/location)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
