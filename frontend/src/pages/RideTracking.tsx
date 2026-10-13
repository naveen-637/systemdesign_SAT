import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Navigation,
  MapPin,
  Car,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  RefreshCw,
  CreditCard,
  Ban,
  User as UserIcon,
  ShieldCheck,
  Play,
  RotateCw,
} from 'lucide-react';
import { ridesApi, paymentsApi, driversApi } from '../services/api';
import { RideStatusDetail, RideListItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CoordinateMap } from '../components/CoordinateMap';
import { wsClient } from '../services/websocket';

const LIFECYCLE_STEPS = [
  { key: 'REQUESTED', label: 'Requested', desc: 'Looking for drivers' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Driver en route to pickup' },
  { key: 'IN_PROGRESS', label: 'In Transit', desc: 'Ride ongoing to drop' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Trip fulfilled' },
];

export const RideTracking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rideIdFromQuery = searchParams.get('rideId') || 'R501';
  const [selectedRideId, setSelectedRideId] = useState<string>(rideIdFromQuery);
  const [allRides, setAllRides] = useState<RideListItem[]>([]);

  const [rideDetail, setRideDetail] = useState<RideStatusDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Change of plans');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Payment simulation state
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'WALLET' | 'CASH'>('UPI');
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Simulation: Move driver closer
  const [isSimulatingMove, setIsSimulatingMove] = useState<boolean>(false);

  const fetchRideStatus = async (id: string) => {
    try {
      setError(null);
      const data = await ridesApi.getRideStatus(id);
      setRideDetail(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || `Failed to fetch status for ride ${id}`);
      setRideDetail(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAllRides = async () => {
    try {
      const list = await ridesApi.listRides({ limit: 30 });
      setAllRides(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAllRides();
  }, []);

  useEffect(() => {
    if (selectedRideId) {
      setSearchParams({ rideId: selectedRideId });
      setLoading(true);
      fetchRideStatus(selectedRideId);
    }
  }, [selectedRideId]);

  // WebSocket live updates for currently viewed ride
  useEffect(() => {
    const unsubscribe = wsClient.subscribe((event) => {
      if (event.payload?.rideId === selectedRideId) {
        fetchRideStatus(selectedRideId);
      }
    });

    // Fallback polling interval
    const interval = setInterval(() => {
      if (selectedRideId) {
        fetchRideStatus(selectedRideId);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedRideId]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchRideStatus(selectedRideId);
    loadAllRides();
  };

  // Cancel ride handler
  const handleCancelRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideDetail) return;

    try {
      setIsCancelling(true);
      await ridesApi.cancelRide(rideDetail.rideId, cancelReason);
      setCancelModalOpen(false);
      fetchRideStatus(rideDetail.rideId);
      loadAllRides();
    } catch (err: any) {
      alert('Cancellation failed: ' + (err?.response?.data?.detail || 'Invalid transition'));
    } finally {
      setIsCancelling(false);
    }
  };

  // Payment handler
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideDetail) return;

    try {
      setIsPaying(true);
      const res = await paymentsApi.createPayment({
        rideId: rideDetail.rideId,
        amount: rideDetail.finalFare || rideDetail.estimatedFare,
        paymentMethod: paymentMethod,
      });
      setPaymentResult(res);
      setTimeout(() => {
        setPaymentModalOpen(false);
        fetchRideStatus(rideDetail.rideId);
      }, 1500);
    } catch (err: any) {
      alert('Payment simulation failed: ' + (err?.response?.data?.detail || 'Error'));
    } finally {
      setIsPaying(false);
    }
  };

  // Simulate GPS Step: Move assigned driver towards destination
  const handleSimulateGpsMovement = async () => {
    if (!rideDetail?.assignedDriver?.currentLocation) return;
    setIsSimulatingMove(true);

    const currLat = rideDetail.assignedDriver.currentLocation.lat;
    const currLng = rideDetail.assignedDriver.currentLocation.lng;
    const targetLat = rideDetail.status === 'ACCEPTED' ? rideDetail.pickup.lat : rideDetail.destination.lat;
    const targetLng = rideDetail.status === 'ACCEPTED' ? rideDetail.pickup.lng : rideDetail.destination.lng;

    // Move 20% closer
    const stepLat = currLat + (targetLat - currLat) * 0.25;
    const stepLng = currLng + (targetLng - currLng) * 0.25;

    try {
      await driversApi.updateLocation({
        driverId: rideDetail.assignedDriver.driverId,
        lat: parseFloat(stepLat.toFixed(5)),
        lng: parseFloat(stepLng.toFixed(5)),
      });
      fetchRideStatus(rideDetail.rideId);
    } catch (err: any) {
      alert('Failed to simulate GPS movement: ' + err.message);
    } finally {
      setIsSimulatingMove(false);
    }
  };

  const isCancellable = rideDetail && (rideDetail.status === 'REQUESTED' || rideDetail.status === 'ACCEPTED');

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Ride Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Ride Tracking & Telemetry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time ride lifecycle state machine, geospatial coordinates, and simulated driver progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Ride Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active Ride:</span>
            <select
              value={selectedRideId}
              onChange={(e) => setSelectedRideId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-700 shadow-2xs"
            >
              {allRides.map((r) => (
                <option key={r.rideId} value={r.rideId}>
                  {r.rideId} — {r.status} (₹{r.estimatedFare})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchRideStatus(selectedRideId)} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {loading && !rideDetail ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading telemetry for {selectedRideId}...
        </div>
      ) : rideDetail ? (
        <div className="space-y-6">
          {/* Status Timeline Progress Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-extrabold text-blue-700">{rideDetail.rideId}</span>
                <StatusBadge status={rideDetail.status} />
              </div>

              <div className="text-xs text-slate-500">
                Created: {new Date(rideDetail.createdAt).toLocaleTimeString()}
              </div>
            </div>

            {rideDetail.status === 'CANCELLED' ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Ride Cancelled
                </div>
                <p>Reason: {rideDetail.cancellationReason || 'No reason specified'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const currentIdx = LIFECYCLE_STEPS.findIndex((s) => s.key === rideDetail.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;

                  return (
                    <div
                      key={step.key}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-400 shadow-xs'
                          : isDone
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                          Step 0{idx + 1}
                        </span>
                        {isDone ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900">{step.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{step.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main 2-Col Layout: Map Left, Details Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Visual Radar Map (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Live Geospatial Telemetry</h3>
                  <p className="text-xs text-slate-500">Visual coordinates radar of route and driver</p>
                </div>

                {rideDetail.assignedDriver?.currentLocation && (
                  <button
                    onClick={handleSimulateGpsMovement}
                    disabled={isSimulatingMove || rideDetail.status === 'COMPLETED' || rideDetail.status === 'CANCELLED'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer disabled:opacity-40"
                    title="Simulate driver moving closer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSimulatingMove ? 'animate-spin' : ''}`} />
                    <span>Simulate GPS Step</span>
                  </button>
                )}
              </div>

              <CoordinateMap
                pickup={rideDetail.pickup}
                destination={rideDetail.destination}
                driver={
                  rideDetail.assignedDriver?.currentLocation
                    ? {
                        lat: rideDetail.assignedDriver.currentLocation.lat,
                        lng: rideDetail.assignedDriver.currentLocation.lng,
                        name: rideDetail.assignedDriver.name,
                      }
                    : undefined
                }
                height="340px"
              />

              {/* Coordinates breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Pickup Address
                  </div>
                  <p className="text-slate-600 text-[11px] truncate">{rideDetail.pickup.address}</p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {rideDetail.pickup.lat.toFixed(4)}°N, {rideDetail.pickup.lng.toFixed(4)}°E
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-rose-600" />
                    Destination Address
                  </div>
                  <p className="text-slate-600 text-[11px] truncate">{rideDetail.destination.address}</p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {rideDetail.destination.lat.toFixed(4)}°N, {rideDetail.destination.lng.toFixed(4)}°E
                  </p>
                </div>
              </div>
            </div>

            {/* Ride & Driver Info (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Assigned Driver Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  Assigned Driver Details
                </h3>

                {rideDetail.assignedDriver ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shadow-inner">
                        {rideDetail.assignedDriver.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-900">
                          {rideDetail.assignedDriver.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{rideDetail.assignedDriver.vehicleNumber}</span>
                          <span>•</span>
                          <span className="font-medium text-blue-700">{rideDetail.assignedDriver.vehicleType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Driver Rating</span>
                        <span className="font-bold text-amber-500 flex items-center mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-current mr-1" />
                          {rideDetail.assignedDriver.rating} / 5.0
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Driver ID</span>
                        <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                          {rideDetail.assignedDriver.driverId}
                        </span>
                      </div>
                    </div>

                    {rideDetail.assignedDriver.currentLocation && (
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-1">
                        <span className="text-[11px] font-semibold text-blue-800 block">Current Telemetry Coordinates:</span>
                        <span className="font-mono text-[11px] text-blue-950">
                          {rideDetail.assignedDriver.currentLocation.lat.toFixed(4)}°N, {rideDetail.assignedDriver.currentLocation.lng.toFixed(4)}°E
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Looking for nearby drivers... Go to Driver Dispatch to accept this ride.
                  </div>
                )}
              </div>

              {/* Fare & Payment Details Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                    Fare & Billing
                  </h3>
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-600">
                    {rideDetail.status === 'COMPLETED' ? 'Final Calculated Fare' : 'Estimated Fare'}
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{rideDetail.finalFare ? rideDetail.finalFare.toFixed(2) : rideDetail.estimatedFare.toFixed(2)}
                  </span>
                </div>

                {rideDetail.status === 'COMPLETED' && (
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Simulate Payment (POST /api/payments)</span>
                  </button>
                )}

                {/* Cancel Ride Action */}
                {isCancellable && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Cancel Ride (PATCH /api/rides/{rideDetail.rideId}/cancel)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Ride {rideDetail?.rideId}</h3>
                <p className="text-xs text-slate-500">State transition check will enforce cancellation policy</p>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCancelRide} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="Change of plans">Change of plans</option>
                  <option value="Driver taking too long">Driver taking too long</option>
                  <option value="Booked by mistake">Booked by mistake</option>
                  <option value="Found alternative transport">Found alternative transport</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                ⚠️ Cancelling will immediately release any assigned driver back to the AVAILABLE fleet pool.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50"
                >
                  {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Simulation Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Simulate Ride Payment</h3>
                <p className="text-xs text-slate-500">Atomic transactional write with idempotency key</p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {paymentResult ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">Payment Successful!</h4>
                <p className="font-mono text-xs text-emerald-700">
                  Ref: {paymentResult.transactionReference}
                </p>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Amount Due</span>
                  <div className="text-3xl font-black text-slate-900">
                    ₹{rideDetail?.finalFare ? rideDetail.finalFare.toFixed(2) : rideDetail?.estimatedFare.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['UPI', 'CARD', 'WALLET', 'CASH'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                          paymentMethod === method
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Simulated sandbox transaction. No real banking credentials or card numbers stored.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50"
                  >
                    {isPaying ? 'Processing...' : 'Authorize Payment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
