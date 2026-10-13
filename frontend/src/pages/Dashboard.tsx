import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  RefreshCw,
  ArrowRight,
  Bell,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { analyticsApi, ridesApi } from '../services/api';
import { DashboardStats, NotificationItem, RideListItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { wsClient } from '../services/websocket';

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#f59e0b',
  ACCEPTED: '#3b82f6',
  IN_PROGRESS: '#6366f1',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRides, setRecentRides] = useState<RideListItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [statsData, ridesData, notifsData] = await Promise.all([
        analyticsApi.getDashboardStats(),
        ridesApi.listRides({ limit: 8 }),
        analyticsApi.listNotifications(undefined, 8),
      ]);
      setStats(statsData);
      setRecentRides(ridesData);
      setNotifications(notifsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to live domain events via WebSocket
    const unsubscribe = wsClient.subscribe((event) => {
      // Re-fetch stats on live domain events
      fetchDashboardData();
    });

    return () => unsubscribe();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const chartData = stats?.statusBreakdown
    ? Object.entries(stats.statusBreakdown).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
        color: STATUS_COLORS[status] || '#94a3b8',
      }))
    : [];

  const vehicleData = stats?.vehicleBreakdown
    ? Object.entries(stats.vehicleBreakdown).map(([type, count]) => ({
        name: type,
        count: count,
      }))
    : [];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading operations dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Fleet Operations & Dispatch Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time ride dispatch telemetry, fleet availability, state machine analytics, and revenue metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/book"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <span>Book New Ride</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Rides */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Rides</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalRides ?? 0}</div>
          <div className="text-[11px] text-slate-500">All registered trips</div>
        </div>

        {/* Active Rides */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Rides</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats?.activeRides ?? 0}</div>
          <div className="text-[11px] text-slate-500">Requested / In-Transit</div>
        </div>

        {/* Available Drivers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fleet Ready</span>
            <Car className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats?.availableDrivers ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.totalDrivers ?? 0}</span>
          </div>
          <div className="text-[11px] text-slate-500">Available drivers</div>
        </div>

        {/* Completed Rides */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.completedRides ?? 0}</div>
          <div className="text-[11px] text-slate-500">Fulfilled trips</div>
        </div>

        {/* Cancelled Rides */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{stats?.cancelledRides ?? 0}</div>
          <div className="text-[11px] text-slate-500">User/Driver cancels</div>
        </div>

        {/* Simulated Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Revenue</span>
            <IndianRupee className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            ₹{stats?.totalRevenue ? stats.totalRevenue.toFixed(0) : '0'}
          </div>
          <div className="text-[11px] text-slate-500">Simulated transactions</div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ride Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ride State Machine Distribution</h2>
              <p className="text-xs text-slate-500">Live breakdown across lifecycle phases</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value} rides`, 'Count']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No active ride data available
              </div>
            )}
          </div>
        </div>

        {/* Fleet Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Fleet Vehicles by Type</h2>
              <p className="text-xs text-slate-500">Composition of active registered vehicles</p>
            </div>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            {vehicleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No fleet data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Rides Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Rides (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Dispatched Rides</h2>
              <p className="text-xs text-slate-500">Live operational log of rides</p>
            </div>
            <Link
              to="/dispatch"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Driver Dispatch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Ride ID</th>
                  <th className="px-4 py-3">Rider / Driver</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentRides.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No rides found. Click "Book New Ride" to create one.
                    </td>
                  </tr>
                ) : (
                  recentRides.map((ride) => (
                    <tr key={ride.rideId} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">
                        {ride.rideId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{ride.userName || ride.userId}</div>
                        <div className="text-[11px] text-slate-500">
                          {ride.driverName ? `Driver: ${ride.driverName}` : 'No driver yet'}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="truncate font-medium text-slate-800" title={ride.pickupAddress}>
                          From: {ride.pickupAddress}
                        </div>
                        <div className="truncate text-[11px] text-slate-500" title={ride.destinationAddress}>
                          To: {ride.destinationAddress}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ride.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ₹{ride.finalFare ? ride.finalFare.toFixed(2) : ride.estimatedFare.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/track?rideId=${ride.rideId}`}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                        >
                          Track
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Notification & Event Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <h2 className="text-base font-bold text-slate-900">System Event Stream</h2>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
              Domain Events
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No events recorded yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-mono text-blue-600 font-semibold">{n.rideId || 'SYSTEM'}</span>
                    <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
