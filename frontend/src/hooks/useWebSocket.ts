import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSatelliteStore } from '../store/satelliteStore';
import type { SatellitePosition } from '../types/satellite';

interface UseWebSocketOptions {
    autoConnect?: boolean;
    reconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
    const { autoConnect = true, reconnectAttempts = 5 } = options;
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const updatePosition = useSatelliteStore(state => state.updatePosition);
    const updatePositions = useSatelliteStore(state => state.updatePositions);
    const setError = useSatelliteStore(state => state.setError);

    useEffect(() => {
        if (!autoConnect) return;

        // Connect to WebSocket server
        const socket = io('/', {
            reconnectionAttempts: reconnectAttempts,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
            setError('Failed to connect to real-time server');
        });

        // Data events
        socket.on('positionUpdate', (data: { positions: SatellitePosition[] }) => {
            updatePositions(data.positions);
        });

        socket.on('satellitePosition', (data: SatellitePosition) => {
            updatePosition(data);
        });

        socket.on('error', (error: { message: string }) => {
            console.error('WebSocket error:', error);
            setError(error.message);
        });

        // Cleanup
        return () => {
            socket.disconnect();
        };
    }, [autoConnect, reconnectAttempts, updatePosition, updatePositions, setError]);

    // Helper functions
    const subscribe = (room: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('subscribe', { room });
        }
    };

    const unsubscribe = (room: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('unsubscribe', { room });
        }
    };

    return {
        socket: socketRef.current,
        subscribe,
        unsubscribe,
        isConnected,
    };
};
