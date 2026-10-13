import axios from 'axios';
import {
  User,
  Driver,
  NearbyDriver,
  RideListItem,
  RideStatusDetail,
  DashboardStats,
  NotificationItem,
  HealthCheck,
  PricingEstimate,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const ridesApi = {
  requestRide: async (data: {
    userId: string;
    pickup: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
  }) => {
    const res = await apiClient.post('/rides', data);
    return res.data;
  },

  listRides: async (params?: { status?: string; userId?: string; limit?: number }) => {
    const res = await apiClient.get<RideListItem[]>('/rides', { params });
    return res.data;
  },

  getRideStatus: async (rideId: string) => {
    const res = await apiClient.get<RideStatusDetail>(`/rides/${rideId}/status`);
    return res.data;
  },

  acceptRide: async (rideId: string, driverId: string) => {
    const res = await apiClient.post(`/rides/${rideId}/accept`, { driverId });
    return res.data;
  },

  startRide: async (rideId: string) => {
    const res = await apiClient.post(`/rides/${rideId}/start`);
    return res.data;
  },

  completeRide: async (rideId: string) => {
    const res = await apiClient.post(`/rides/${rideId}/complete`);
    return res.data;
  },

  cancelRide: async (rideId: string, reason: string) => {
    const res = await apiClient.patch(`/rides/${rideId}/cancel`, { reason });
    return res.data;
  },
};

export const driversApi = {
  getNearby: async (lat: number, lng: number, radiusKm: number = 5) => {
    const res = await apiClient.get<NearbyDriver[]>('/drivers/nearby', {
      params: { lat, lng, radius_km: radiusKm },
    });
    return res.data;
  },

  listDrivers: async (statusFilter?: string) => {
    const res = await apiClient.get<Driver[]>('/drivers', {
      params: { status: statusFilter },
    });
    return res.data;
  },

  updateLocation: async (data: {
    driverId: string;
    lat: number;
    lng: number;
    availabilityStatus?: string;
  }) => {
    const res = await apiClient.put('/drivers/location', data);
    return res.data;
  },
};

export const pricingApi = {
  estimate: async (data: {
    pickup: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  }) => {
    const res = await apiClient.post<PricingEstimate>('/pricing/estimate', data);
    return res.data;
  },
};

export const paymentsApi = {
  createPayment: async (data: {
    rideId: string;
    amount?: number;
    paymentMethod: 'UPI' | 'CARD' | 'WALLET' | 'CASH';
    idempotencyKey?: string;
  }) => {
    const res = await apiClient.post('/payments', data);
    return res.data;
  },
};

export const usersApi = {
  listUsers: async () => {
    const res = await apiClient.get<User[]>('/users');
    return res.data;
  },
};

export const analyticsApi = {
  getDashboardStats: async () => {
    const res = await apiClient.get<DashboardStats>('/analytics/dashboard');
    return res.data;
  },

  listNotifications: async (userId?: string, limit: number = 20) => {
    const res = await apiClient.get<NotificationItem[]>('/analytics/notifications', {
      params: { userId, limit },
    });
    return res.data;
  },
};

export const adminApi = {
  resetDemoDatabase: async () => {
    const res = await apiClient.post('/admin/reset-demo');
    return res.data;
  },
};

export const healthApi = {
  check: async () => {
    const res = await apiClient.get<HealthCheck>('/health');
    return res.data;
  },
};
