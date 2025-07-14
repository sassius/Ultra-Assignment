export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number;
}

export interface WorkoutMetrics {
  distance: number;
  duration: number;
  avgSpeed: number;
  currentSpeed: number;
}