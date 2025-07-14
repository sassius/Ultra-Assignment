import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, MapPin, Wifi, WifiOff, Activity, Timer, Zap } from 'lucide-react';
import RouteCanvas from './components/RouteCanvas';
import MetricCard from './components/MetricCard';
import NetworkStatus from './components/NetworkStatus';
import { useGeolocation } from './hooks/useGeolocation';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
import { calculateDistance, calculateSpeed, formatTime } from './utils/calculations';
import { RoutePoint, WorkoutMetrics } from './types';

function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [metrics, setMetrics] = useState<WorkoutMetrics>({
    distance: 0,
    duration: 0,
    avgSpeed: 0,
    currentSpeed: 0
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  
  const { position, error: geoError } = useGeolocation(isTracking);
  const { scheduleTask } = useBackgroundTasks();
  const isMetricsVisible = useIntersectionObserver(metricsRef);
  const isHistoryVisible = useIntersectionObserver(historyRef);

  // Handle new position updates
  useEffect(() => {
    if (position && isTracking) {
      const newPoint: RoutePoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy
      };

      setRoute(prev => {
        const updated = [...prev, newPoint];
        
        // Schedule background task to calculate metrics
        scheduleTask(() => {
          const currentTime = Date.now();
          const duration = startTime ? (currentTime - startTime) / 1000 : 0;
          
          let totalDistance = 0;
          let currentSpeed = 0;
          
          if (updated.length > 1) {
            // Calculate total distance
            for (let i = 1; i < updated.length; i++) {
              totalDistance += calculateDistance(updated[i-1], updated[i]);
            }
            
            // Calculate current speed from last two points
            if (updated.length > 1) {
              const lastTwo = updated.slice(-2);
              const distance = calculateDistance(lastTwo[0], lastTwo[1]);
              const timeDiff = (lastTwo[1].timestamp - lastTwo[0].timestamp) / 1000;
              currentSpeed = calculateSpeed(distance, timeDiff);
            }
          }
          
          const avgSpeed = duration > 0 ? totalDistance / duration : 0;
          
          setMetrics({
            distance: totalDistance,
            duration,
            avgSpeed,
            currentSpeed
          });
        });
        
        return updated;
      });
    }
  }, [position, isTracking, startTime, scheduleTask]);

  const startTracking = () => {
    setIsTracking(true);
    setStartTime(Date.now());
    setRoute([]);
    setMetrics({ distance: 0, duration: 0, avgSpeed: 0, currentSpeed: 0 });
  };

  const stopTracking = () => {
    setIsTracking(false);
    setStartTime(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <Activity className="inline-block mr-3 text-green-400" size={36} />
            Fitness Tracker
          </h1>
          <p className="text-slate-300">Track your routes and performance in real-time</p>
        </div>

        {/* Network Status */}
        <NetworkStatus />

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={startTracking}
            disabled={isTracking}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              isTracking
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <Play size={20} />
            Start Workout
          </button>
          
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              !isTracking
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <Square size={20} />
            Stop Workout
          </button>
        </div>

        {/* Route Visualization */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="text-blue-400" size={24} />
            Route Map
          </h2>
          <RouteCanvas 
            ref={canvasRef}
            route={route}
            isTracking={isTracking}
            className="w-full h-64 bg-slate-800 rounded-lg border-2 border-slate-600"
          />
        </div>

        {/* Metrics Section - Uses Intersection Observer */}
        <div ref={metricsRef} className="mb-8">
          {isMetricsVisible && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="text-yellow-400" size={24} />
                Live Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Distance"
                  value={`${metrics.distance.toFixed(2)} km`}
                  icon={<MapPin className="text-blue-400" size={24} />}
                  color="blue"
                />
                <MetricCard
                  title="Duration"
                  value={formatTime(metrics.duration)}
                  icon={<Timer className="text-green-400" size={24} />}
                  color="green"
                />
                <MetricCard
                  title="Avg Speed"
                  value={`${metrics.avgSpeed.toFixed(1)} km/h`}
                  icon={<Activity className="text-purple-400" size={24} />}
                  color="purple"
                />
                <MetricCard
                  title="Current Speed"
                  value={`${metrics.currentSpeed.toFixed(1)} km/h`}
                  icon={<Zap className="text-yellow-400" size={24} />}
                  color="yellow"
                />
              </div>
            </div>
          )}
        </div>

        {/* Workout History - Uses Intersection Observer */}
        <div ref={historyRef}>
          {isHistoryVisible && (
            <div className="animate-fadeIn bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Workout Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-slate-300">
                  <span>Total Points Tracked:</span>
                  <span className="text-white font-semibold">{route.length}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>GPS Accuracy:</span>
                  <span className="text-white font-semibold">
                    {position ? `±${position.coords.accuracy.toFixed(0)}m` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Status:</span>
                  <span className={`font-semibold ${isTracking ? 'text-green-400' : 'text-red-400'}`}>
                    {isTracking ? 'Active' : 'Stopped'}
                  </span>
                </div>
                {geoError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-300 text-sm">
                      GPS Error: {geoError.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;