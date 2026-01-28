import { useSatelliteStore } from '../store/satelliteStore';

export const InfoPanel: React.FC = () => {
    const satellites = useSatelliteStore(state => state.satellites);
    const positions = useSatelliteStore(state => state.positions);
    const selectedSatelliteId = useSatelliteStore(state => state.selectedSatelliteId);
    const setSelectedSatellite = useSatelliteStore(state => state.setSelectedSatellite);

    const satellite = selectedSatelliteId ? {
        ...satellites.get(selectedSatelliteId),
        position: positions.get(selectedSatelliteId)
    } : null;

    if (!satellite || !satellite.noradId) return null;

    const { position } = satellite;

    return (
        <div className="absolute top-4 right-4 w-96 glass rounded-lg p-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-neon-blue text-glow">
                        {satellite.name}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        NORAD ID: {satellite.noradId}
                    </p>
                </div>
                <button
                    onClick={() => setSelectedSatellite(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Real-time Position Data */}
            {position ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                        <span className="text-xs text-neon-green font-semibold uppercase tracking-wide">
                            Live Data
                        </span>
                    </div>

                    <DataRow
                        label="Latitude"
                        value={`${position.latitude.toFixed(4)}°`}
                        color="neon-cyan"
                    />
                    <DataRow
                        label="Longitude"
                        value={`${position.longitude.toFixed(4)}°`}
                        color="neon-cyan"
                    />
                    <DataRow
                        label="Altitude"
                        value={`${position.altitude.toFixed(2)} km`}
                        color="neon-blue"
                    />
                    <DataRow
                        label="Velocity"
                        value={`${position.velocity.toFixed(3)} km/s`}
                        color="neon-purple"
                    />
                    <DataRow
                        label="Last Update"
                        value={new Date(position.timestamp).toLocaleTimeString()}
                        color="gray-400"
                    />
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500">
                    <p>Position data not available</p>
                </div>
            )}

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-dark-600">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                    Metadata
                </h3>
                <div className="space-y-2">
                    {satellite.category && (
                        <MetadataRow label="Category" value={satellite.category} />
                    )}
                    {satellite.launchYear && (
                        <MetadataRow label="Launch Year" value={satellite.launchYear.toString()} />
                    )}
                    {satellite.country && (
                        <MetadataRow label="Country" value={satellite.country} />
                    )}
                    {satellite.owner && (
                        <MetadataRow label="Owner" value={satellite.owner} />
                    )}
                    {satellite.intlDesignator && (
                        <MetadataRow label="Intl Designator" value={satellite.intlDesignator} />
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper components
interface DataRowProps {
    label: string;
    value: string;
    color?: string;
}

const DataRow: React.FC<DataRowProps> = ({ label, value, color = 'white' }) => (
    <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{label}:</span>
        <span className={`text-sm font-mono font-semibold text-${color}`}>
            {value}
        </span>
    </div>
);

interface MetadataRowProps {
    label: string;
    value: string;
}

const MetadataRow: React.FC<MetadataRowProps> = ({ label, value }) => (
    <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500">{label}:</span>
        <span className="text-gray-300">{value}</span>
    </div>
);
