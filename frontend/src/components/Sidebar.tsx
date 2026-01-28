import { useEffect, useState, useMemo } from 'react';
import { useSatelliteStore } from '../store/satelliteStore';
import { satelliteAPI } from '../services/api';
import type { Category } from '../types/satellite';

export const Sidebar: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    const satellitesMap = useSatelliteStore(state => state.satellites);
    const positions = useSatelliteStore(state => state.positions);
    const searchQuery = useSatelliteStore(state => state.searchQuery);
    const selectedCategory = useSatelliteStore(state => state.selectedCategory);
    const selectedSatelliteId = useSatelliteStore(state => state.selectedSatelliteId);

    const setSearchQuery = useSatelliteStore(state => state.setSearchQuery);
    const setSelectedCategory = useSatelliteStore(state => state.setSelectedCategory);
    const setSelectedSatellite = useSatelliteStore(state => state.setSelectedSatellite);

    // Filter satellites
    const filteredSatellites = useMemo(() => {
        return Array.from(satellitesMap.values()).filter(sat => {
            const matchesCategory = !selectedCategory || sat.category === selectedCategory;
            const matchesSearch = !searchQuery ||
                sat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sat.noradId.toString().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        }).map(sat => ({
            ...sat,
            position: positions.get(sat.noradId)
        }));
    }, [satellitesMap, positions, searchQuery, selectedCategory]);

    // Load categories
    useEffect(() => {
        satelliteAPI.getCategories().then(response => {
            if (response.success && response.data) {
                setCategories(response.data);
            }
        }).catch(console.error);
    }, []);

    return (
        <div className="w-80 h-full bg-dark-800 border-r border-dark-600 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-dark-600">
                <h1 className="text-2xl font-bold text-neon-blue text-glow mb-1">
                    Satellite Tracker
                </h1>
                <p className="text-sm text-gray-400">Real-time Orbital Monitoring</p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-dark-600">
                <input
                    type="text"
                    placeholder="Search satellites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg 
                     text-gray-100 placeholder-gray-500 focus:outline-none focus:border-neon-blue 
                     transition-colors"
                />
            </div>

            {/* Category Filter */}
            <div className="p-4 border-b border-dark-600">
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Category
                </label>
                <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg 
                     text-gray-100 focus:outline-none focus:border-neon-blue 
                     transition-colors cursor-pointer"
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.name} value={cat.name}>
                            {cat.name} ({cat.count})
                        </option>
                    ))}
                </select>
            </div>

            {/* Satellite List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-2">
                    {filteredSatellites.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No satellites found
                        </div>
                    ) : (
                        filteredSatellites.map(sat => (
                            <button
                                key={sat.noradId}
                                onClick={() => setSelectedSatellite(sat.noradId)}
                                className={`w-full text-left p-3 mb-2 rounded-lg transition-all
                  ${selectedSatelliteId === sat.noradId
                                        ? 'bg-neon-blue/20 border border-neon-blue/50 shadow-neon'
                                        : 'bg-dark-700 border border-dark-600 hover:border-neon-blue/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm text-gray-100 truncate">
                                            {sat.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            NORAD: {sat.noradId}
                                        </p>
                                        {sat.position && (
                                            <div className="mt-2 space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Alt:</span>
                                                    <span className="text-neon-cyan font-mono">
                                                        {sat.position.altitude.toFixed(0)} km
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Vel:</span>
                                                    <span className="text-neon-cyan font-mono">
                                                        {sat.position.velocity.toFixed(2)} km/s
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {sat.position && (
                                        <div className="ml-2">
                                            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse-slow" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Stats Footer */}
            <div className="p-4 border-t border-dark-600 bg-dark-900">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tracking:</span>
                    <span className="text-neon-blue font-mono font-semibold">
                        {filteredSatellites.filter(s => s.position).length} / {filteredSatellites.length}
                    </span>
                </div>
            </div>
        </div>
    );
};
