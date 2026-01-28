import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getAllCachedPositions, getPosition } from './cacheService';
import type { SatellitePosition } from './sgp4Service';

/**
 * WebSocket server instance
 */
let io: SocketIOServer | null = null;

/**
 * Broadcast interval (milliseconds)
 */
const BROADCAST_INTERVAL = 1000; // 1 second

/**
 * Broadcast timer
 */
let broadcastTimer: NodeJS.Timeout | null = null;

/**
 * Room types for selective subscription
 */
export enum RoomType {
    ALL = 'all',
    CATEGORY = 'category',
    SATELLITE = 'sat'
}

/**
 * Connected clients statistics
 */
let connectedClients = 0;

/**
 * Initialize WebSocket server
 * 
 * @param httpServer - HTTP server instance
 * @returns Socket.IO server instance
 */
export const initializeWebSocket = (httpServer: HTTPServer): SocketIOServer => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    // Connection handler
    io.on('connection', handleConnection);

    console.log('WebSocket server initialized');

    // Start broadcast loop
    startBroadcastLoop();

    return io;
};

/**
 * Handle new client connection
 * 
 * @param socket - Socket instance
 */
const handleConnection = (socket: Socket) => {
    connectedClients++;
    console.log(`Client connected: ${socket.id} (Total: ${connectedClients})`);

    // Send welcome message
    socket.emit('connected', {
        message: 'Connected to Satellite Tracker WebSocket',
        timestamp: new Date().toISOString()
    });

    // Handle room subscriptions
    socket.on('subscribe', (data: { room: string; type: RoomType }) => {
        handleSubscribe(socket, data);
    });

    socket.on('unsubscribe', (data: { room: string }) => {
        handleUnsubscribe(socket, data);
    });

    // Handle satellite position request
    socket.on('getSatellitePosition', async (data: { noradId: number }) => {
        await handleGetSatellitePosition(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`Client disconnected: ${socket.id} (Total: ${connectedClients})`);
    });

    // Default: subscribe to 'all' room
    socket.join(RoomType.ALL);
    socket.emit('subscribed', { room: RoomType.ALL });
};

/**
 * Handle subscribe request
 * Rooms:
 * - 'all': All satellites
 * - 'category:X': Satellites in category X
 * - 'sat:Y': Specific satellite with NORAD ID Y
 */
const handleSubscribe = (socket: Socket, data: { room: string; type: RoomType }) => {
    try {
        const { room, type } = data;

        // Validate room format
        if (type === RoomType.CATEGORY && !room.startsWith('category:')) {
            socket.emit('error', { message: 'Invalid category room format. Use "category:X"' });
            return;
        }

        if (type === RoomType.SATELLITE && !room.startsWith('sat:')) {
            socket.emit('error', { message: 'Invalid satellite room format. Use "sat:NORAD_ID"' });
            return;
        }

        socket.join(room);
        socket.emit('subscribed', { room, type });
        console.log(`Client ${socket.id} subscribed to room: ${room}`);
    } catch (error) {
        console.error('Error in handleSubscribe:', error);
        socket.emit('error', { message: 'Failed to subscribe to room' });
    }
};

/**
 * Handle unsubscribe request
 */
const handleUnsubscribe = (socket: Socket, data: { room: string }) => {
    try {
        const { room } = data;
        socket.leave(room);
        socket.emit('unsubscribed', { room });
        console.log(`Client ${socket.id} unsubscribed from room: ${room}`);
    } catch (error) {
        console.error('Error in handleUnsubscribe:', error);
        socket.emit('error', { message: 'Failed to unsubscribe from room' });
    }
};

/**
 * Handle individual satellite position request
 */
const handleGetSatellitePosition = async (socket: Socket, data: { noradId: number }) => {
    try {
        const { noradId } = data;
        const position = await getPosition(noradId);

        if (position) {
            socket.emit('satellitePosition', position);
        } else {
            socket.emit('error', {
                message: `Position not found for satellite ${noradId}`,
                noradId
            });
        }
    } catch (error) {
        console.error('Error in handleGetSatellitePosition:', error);
        socket.emit('error', { message: 'Failed to get satellite position' });
    }
};

/**
 * Broadcast loop - reads from Redis and emits to rooms
 */
const broadcastLoop = async () => {
    if (!io) return;

    try {
        // Get all cached positions
        const positions = await getAllCachedPositions();

        if (positions.length === 0) {
            return;
        }

        // Broadcast to 'all' room
        io.to(RoomType.ALL).emit('positionUpdate', {
            timestamp: new Date().toISOString(),
            count: positions.length,
            positions
        });

        // Broadcast individual satellite updates to specific rooms
        for (const position of positions) {
            const satRoom = `${RoomType.SATELLITE}:${position.noradId}`;
            io.to(satRoom).emit('satellitePosition', position);
        }

        // TODO: Implement category-based broadcasting when categories are added to database
        // This would require fetching satellite categories and grouping positions

    } catch (error) {
        console.error('Error in broadcast loop:', error);
    }
};

/**
 * Start the broadcast loop
 */
const startBroadcastLoop = () => {
    if (broadcastTimer) {
        console.log('Broadcast loop already running');
        return;
    }

    console.log(`Starting WebSocket broadcast loop (interval: ${BROADCAST_INTERVAL}ms)`);
    broadcastTimer = setInterval(broadcastLoop, BROADCAST_INTERVAL);
};

/**
 * Stop the broadcast loop
 */
export const stopBroadcastLoop = () => {
    if (broadcastTimer) {
        clearInterval(broadcastTimer);
        broadcastTimer = null;
        console.log('Broadcast loop stopped');
    }
};

/**
 * Get WebSocket server statistics
 */
export const getWebSocketStats = () => {
    return {
        connectedClients,
        isRunning: !!io,
        broadcastInterval: BROADCAST_INTERVAL
    };
};

/**
 * Broadcast a custom event to all clients
 */
export const broadcastEvent = (event: string, data: any) => {
    if (io) {
        io.emit(event, data);
    }
};

/**
 * Shutdown WebSocket server
 */
export const shutdownWebSocket = () => {
    stopBroadcastLoop();

    if (io) {
        io.close();
        io = null;
        console.log('WebSocket server shut down');
    }
};

// Graceful shutdown
process.on('SIGTERM', shutdownWebSocket);
process.on('SIGINT', shutdownWebSocket);

export { io };
