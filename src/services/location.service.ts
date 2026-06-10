import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class LocationService {
  static async getCurrentLocation(): Promise<Coordinates> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }

  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const phi1 = toRadians(coord1.latitude);
    const phi2 = toRadians(coord2.latitude);
    const deltaPhi = toRadians(coord2.latitude - coord1.latitude);
    const deltaLambda = toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check whether a coordinate lies within a circular geofence centred at 'center'
   * radiusMeters is the allowed radius in meters
   */
  static isWithinGeofence(center: Coordinates, coord: Coordinates, radiusMeters: number): boolean {
    const distance = LocationService.calculateDistance(center, coord);
    return distance <= radiusMeters;
  }
}