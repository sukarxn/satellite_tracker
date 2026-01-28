import { useEffect } from 'react';
import { Globe } from './components/Globe';
import { Sidebar } from './components/Sidebar';
import { InfoPanel } from './components/InfoPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useSatelliteStore } from './store/satelliteStore';
import { satelliteAPI } from './services/api';
import './index.css';

function App() {
  const setSatellites = useSatelliteStore(state => state.setSatellites);
  const setLoading = useSatelliteStore(state => state.setLoading);
  const setError = useSatelliteStore(state => state.setError);
  const error = useSatelliteStore(state => state.error);

  // Connect to WebSocket for real-time updates
  const { isConnected } = useWebSocket({ autoConnect: true });

  // Load initial satellite data
  useEffect(() => {
    const loadSatellites = async () => {
      try {
        setLoading(true);
        const response = await satelliteAPI.getSatellites({ limit: 1000 });
        setSatellites(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load satellites:', err);
        setError('Failed to load satellite data');
      } finally {
        setLoading(false);
      }
    };

    loadSatellites();
  }, [setSatellites, setLoading, setError]);

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-dark-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Globe View */}
      <div className="flex-1 relative">
        <Globe />

        {/* Info Panel */}
        <InfoPanel />

        {/* Connection Status */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 glass rounded-lg px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-neon-green animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-300 font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 
                          bg-red-500/20 border border-red-500 rounded-lg px-4 py-2">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Branding */}
        <div className="absolute bottom-4 right-4 text-right">
          <p className="text-xs text-gray-600 font-mono">
            Satellite Tracker v1.0
          </p>
          <p className="text-xs text-gray-700 font-mono">
            Real-time Orbital Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
