import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    online: boolean;
    connection?: any;
    effectiveType?: string;
    downlink?: number;
  }>({
    online: navigator.onLine
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      setNetworkInfo({
        online: navigator.onLine,
        connection,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink
      });
    };

    // Initial check
    updateNetworkInfo();

    // Listen for network changes
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);
    
    // Listen for connection changes if available
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  const getConnectionColor = () => {
    if (!networkInfo.online) return 'text-red-400';
    
    switch (networkInfo.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'text-red-400';
      case '3g':
        return 'text-yellow-400';
      case '4g':
        return 'text-green-400';
      default:
        return 'text-blue-400';
    }
  };

  const getConnectionText = () => {
    if (!networkInfo.online) return 'Offline';
    
    if (networkInfo.effectiveType) {
      return `${networkInfo.effectiveType.toUpperCase()}${networkInfo.downlink ? ` (${networkInfo.downlink} Mbps)` : ''}`;
    }
    
    return 'Online';
  };

  return (
    <div className="flex justify-center mb-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
        {networkInfo.online ? (
          <Wifi className={getConnectionColor()} size={16} />
        ) : (
          <WifiOff className="text-red-400" size={16} />
        )}
        <span className={`text-sm font-medium ${getConnectionColor()}`}>
          {getConnectionText()}
        </span>
        {networkInfo.online && (
          <Signal className={getConnectionColor()} size={14} />
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;