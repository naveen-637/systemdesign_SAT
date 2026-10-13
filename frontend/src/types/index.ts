export type RideStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type DriverStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface LocationCoords {
  lat: number;
  lng: number;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  vehicleNumber: string;
  vehicleType: string;
  rating: number;
  latitude: number;
  longitude: number;
  availabilityStatus: DriverStatus;
  updatedAt?: string;
}

export interface NearbyDriver {
  driverId: string;
  name: string;
  vehicleNumber: string;
  vehicleType: string;
  rating: number;
  distanceKm: number;
  location: {
    lat: number;
    lng: number;
  };
}

export interface RideListItem {
  rideId: string;
  userId: string;
  userName?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  pickupAddress: string;
  destinationAddress: string;
  status: RideStatus;
  estimatedFare: number;
  finalFare?: number | null;
  createdAt: string;
}

export interface RideStatusDetail {
  rideId: string;
  userId: string;
  status: RideStatus;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  assignedDriver?: {
    driverId: string;
    name: string;
    vehicleNumber: string;
    vehicleType: string;
    rating: number;
    currentLocation?: {
      lat: number;
      lng: number;
    };
  } | null;
  estimatedFare: number;
  finalFare?: number | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRides: number;
  activeRides: number;
  availableDrivers: number;
  totalDrivers: number;
  completedRides: number;
  cancelledRides: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
  vehicleBreakdown: Record<string, number>;
}

export interface NotificationItem {
  id: string;
  userId: string;
  rideId?: string | null;
  message: string;
  readStatus: boolean;
  createdAt: string;
}

export interface HealthCheck {
  status: string;
  database: string;
  cache: string;
  messageBroker: string;
  timestamp: string;
}

export interface PricingEstimate {
  estimatedFare: number;
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  perKmRate: number;
  surgeMultiplier: number;
}
