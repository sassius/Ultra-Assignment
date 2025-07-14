import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { RoutePoint } from '../types';

interface RouteCanvasProps {
  route: RoutePoint[];
  isTracking: boolean;
  className?: string;
}

const RouteCanvas = forwardRef<HTMLCanvasElement, RouteCanvasProps>(
  ({ route, isTracking, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useImperativeHandle(ref, () => canvasRef.current!);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (route.length === 0) {
        // Draw placeholder
        ctx.fillStyle = '#475569';
        ctx.font = '16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Start tracking to see your route', rect.width / 2, rect.height / 2);
        return;
      }

      // Calculate bounds
      const lats = route.map(p => p.lat);
      const lngs = route.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Add padding
      const padding = 20;
      const latRange = maxLat - minLat || 0.001;
      const lngRange = maxLng - minLng || 0.001;

      // Convert GPS coordinates to canvas coordinates
      const toCanvasCoords = (point: RoutePoint) => {
        const x = ((point.lng - minLng) / lngRange) * (rect.width - 2 * padding) + padding;
        const y = ((maxLat - point.lat) / latRange) * (rect.height - 2 * padding) + padding;
        return { x, y };
      };

      // Draw route path
      if (route.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const startCoords = toCanvasCoords(route[0]);
        ctx.moveTo(startCoords.x, startCoords.y);

        for (let i = 1; i < route.length; i++) {
          const coords = toCanvasCoords(route[i]);
          ctx.lineTo(coords.x, coords.y);
        }
        
        ctx.stroke();
      }

      // Draw route points
      route.forEach((point, index) => {
        const coords = toCanvasCoords(point);
        
        // Draw point
        ctx.beginPath();
        ctx.fillStyle = index === 0 ? '#10B981' : index === route.length - 1 ? '#F59E0B' : '#3B82F6';
        ctx.arc(coords.x, coords.y, index === 0 || index === route.length - 1 ? 6 : 3, 0, 2 * Math.PI);
        ctx.fill();

        // Draw accuracy circle for current position
        if (index === route.length - 1 && isTracking) {
          ctx.beginPath();
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          
          // Approximate accuracy circle (simplified)
          const accuracyRadius = Math.min(point.accuracy / 10, 20);
          ctx.arc(coords.x, coords.y, accuracyRadius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Draw start/end labels
      if (route.length > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        
        const startCoords = toCanvasCoords(route[0]);
        ctx.fillText('START', startCoords.x, startCoords.y - 10);
        
        if (route.length > 1) {
          const endCoords = toCanvasCoords(route[route.length - 1]);
          ctx.fillText(isTracking ? 'CURRENT' : 'END', endCoords.x, endCoords.y - 10);
        }
      }

      // Draw distance markers
      if (route.length > 10) {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'left';
        
        for (let i = 0; i < route.length; i += Math.floor(route.length / 5)) {
          const coords = toCanvasCoords(route[i]);
          ctx.fillText(`${i + 1}`, coords.x + 5, coords.y - 5);
        }
      }

    }, [route, isTracking]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }
);

RouteCanvas.displayName = 'RouteCanvas';

export default RouteCanvas;