import { useState, useEffect } from 'react';

interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  isLoading: boolean;
}

export const useGeolocation = (isTracking: boolean) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false
  });

  useEffect(() => {
    if (!isTracking) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: new GeolocationPositionError() as GeolocationPositionError,
        isLoading: false 
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    // Check network connection to adjust tracking frequency
    const connection = (navigator as any).connection;
    if (connection) {
      // Adjust options based on connection type
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        options.maximumAge = 10000; // Cache position longer on slow connections
        options.timeout = 15000;
      } else if (connection.effectiveType === '3g') {
        options.maximumAge = 7000;
        options.timeout = 12000;
      }
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        position,
        error: null,
        isLoading: false
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        error,
        isLoading: false
      }));
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking]);

  return state;
};