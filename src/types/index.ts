export type DriverStatus = 'available' | 'busy' | 'offline';

export type RequestStatus =
  | 'waiting'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  driverId?: string;
  status: RequestStatus;
  vehicleModel: string;
  vehiclePlate: string;
  problemDescription: string;
  photoUrl?: string;
  clientLocation: Location;
  destinationAddress?: string;
  estimatedPrice?: number;
  createdAt: any;
  acceptedAt?: any;
  completedAt?: any;
}

export type DriverStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Requests: undefined;
  Map: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type RequestsStackParamList = {
  RequestsList: undefined;
  ServiceDetail: { requestId: string };
  Navigation: { requestId: string };
  CompleteService: { requestId: string };
};
