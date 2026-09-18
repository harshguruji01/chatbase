export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export async function checkLocationPermission(): Promise<PermissionState | 'prompt'> {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'prompt';
  }
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch {
    return 'prompt';
  }
}

export async function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser/device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Obfuscate slightly (3 decimal places is ~110m precision) for strong privacy preservation
        const lat = Math.round(position.coords.latitude * 1000) / 1000;
        const lon = Math.round(position.coords.longitude * 1000) / 1000;
        resolve({
          latitude: lat,
          longitude: lon,
        });
      },
      (error) => {
        let message = 'Unable to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location access was denied. You can enable it in your browser/device settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out.';
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
