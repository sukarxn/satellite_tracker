import type {
    Satellite,
    PaginatedResponse,
    ApiResponse,
    SearchParams,
    Category
} from '../types/satellite';

const API_BASE_URL = '/api/v1';

class SatelliteAPI {
    private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }

    // Get paginated list of satellites
    async getSatellites(params: SearchParams = {}): Promise<PaginatedResponse<Satellite>> {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.category) queryParams.append('category', params.category);

        const query = queryParams.toString();
        const endpoint = `/satellites${query ? `?${query}` : ''}`;

        return this.fetch<PaginatedResponse<Satellite>>(endpoint);
    }

    // Get satellite by NORAD ID
    async getSatelliteById(noradId: number): Promise<ApiResponse<Satellite>> {
        return this.fetch<ApiResponse<Satellite>>(`/satellites/${noradId}`);
    }

    // Search satellites
    async searchSatellites(query: string): Promise<ApiResponse<Satellite[]>> {
        return this.fetch<ApiResponse<Satellite[]>>('/satellites/search', {
            method: 'POST',
            body: JSON.stringify({ query }),
        });
    }

    // Get categories
    async getCategories(): Promise<ApiResponse<Category[]>> {
        return this.fetch<ApiResponse<Category[]>>('/satellites/categories');
    }

    // Get system status
    async getStatus(): Promise<ApiResponse<any>> {
        return this.fetch<ApiResponse<any>>('/status');
    }
}

export const satelliteAPI = new SatelliteAPI();
