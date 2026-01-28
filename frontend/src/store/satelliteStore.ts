import { create } from 'zustand';
import type { Satellite, SatellitePosition, SatelliteWithPosition } from '../types/satellite';

interface SatelliteStore {
    // Satellites data
    satellites: Map<number, Satellite>;
    positions: Map<number, SatellitePosition>;

    // UI state
    selectedSatelliteId: number | null;
    searchQuery: string;
    selectedCategory: string | null;

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    setSatellites: (satellites: Satellite[]) => void;
    updatePosition: (position: SatellitePosition) => void;
    updatePositions: (positions: SatellitePosition[]) => void;
    setSelectedSatellite: (noradId: number | null) => void;
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Computed
    getFilteredSatellites: () => SatelliteWithPosition[];
    getSelectedSatellite: () => SatelliteWithPosition | null;
}

export const useSatelliteStore = create<SatelliteStore>((set, get) => ({
    // Initial state
    satellites: new Map(),
    positions: new Map(),
    selectedSatelliteId: null,
    searchQuery: '',
    selectedCategory: null,
    isLoading: false,
    error: null,

    // Actions
    setSatellites: (satellites) => {
        const satelliteMap = new Map<number, Satellite>();
        satellites.forEach(sat => satelliteMap.set(sat.noradId, sat));
        set({ satellites: satelliteMap });
    },

    updatePosition: (position) => {
        set((state) => {
            const newPositions = new Map(state.positions);
            newPositions.set(position.noradId, position);
            return { positions: newPositions };
        });
    },

    updatePositions: (positions) => {
        set((state) => {
            const newPositions = new Map(state.positions);
            positions.forEach(pos => newPositions.set(pos.noradId, pos));
            return { positions: newPositions };
        });
    },

    setSelectedSatellite: (noradId) => {
        set({ selectedSatelliteId: noradId });
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },

    setSelectedCategory: (category) => {
        set({ selectedCategory: category });
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },

    setError: (error) => {
        set({ error });
    },

    // These remain as helpers but aren't called in selectors directly to avoid loops
    getFilteredSatellites: () => {
        const { satellites, positions, searchQuery, selectedCategory } = get();
        let filtered = Array.from(satellites.values());
        if (selectedCategory) filtered = filtered.filter(sat => sat.category === selectedCategory);
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(sat =>
                sat.name.toLowerCase().includes(query) ||
                sat.noradId.toString().includes(query)
            );
        }
        return filtered.map(sat => ({ ...sat, position: positions.get(sat.noradId) }));
    },

    getSelectedSatellite: () => {
        const { selectedSatelliteId, satellites, positions } = get();
        if (!selectedSatelliteId) return null;
        const satellite = satellites.get(selectedSatelliteId);
        if (!satellite) return null;
        return { ...satellite, position: positions.get(selectedSatelliteId) };
    },
}));
