/**
 * Simple WebSocket Test Client
 * 
 * This script connects to the WebSocket server and tests basic functionality:
 * - Connection
 * - Subscribing to rooms
 * - Receiving position updates
 * 
 * Run with: ts-node scripts/testWebSocket.ts
 */

import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.WS_URL || 'http://localhost:3000';

let socket: Socket;

const connectToServer = () => {
    console.log(`Connecting to WebSocket server at ${SERVER_URL}...`);

    socket = io(SERVER_URL, {
        transports: ['websocket', 'polling']
    });

    // Connection events
    socket.on('connect', () => {
        console.log('✓ Connected to server');
        console.log(`Socket ID: ${socket.id}`);
    });

    socket.on('connected', (data) => {
        console.log('✓ Server welcome message:', data);
    });

    socket.on('disconnect', () => {
        console.log('✗ Disconnected from server');
    });

    socket.on('error', (error) => {
        console.error('✗ Socket error:', error);
    });

    // Subscription events
    socket.on('subscribed', (data) => {
        console.log(`✓ Subscribed to room: ${data.room}`);
    });

    socket.on('unsubscribed', (data) => {
        console.log(`✓ Unsubscribed from room: ${data.room}`);
    });

    // Position update events
    socket.on('positionUpdate', (data) => {
        console.log(`\n📡 Position Update Received:`);
        console.log(`   Timestamp: ${data.timestamp}`);
        console.log(`   Satellites: ${data.count}`);

        if (data.positions && data.positions.length > 0) {
            console.log(`\n   Sample (first 3 satellites):`);
            data.positions.slice(0, 3).forEach((pos: any) => {
                console.log(`   - NORAD ${pos.noradId}:`);
                console.log(`     Lat: ${pos.latitude.toFixed(4)}°, Lon: ${pos.longitude.toFixed(4)}°`);
                console.log(`     Alt: ${pos.altitude.toFixed(2)} km, Vel: ${pos.velocity.toFixed(2)} km/s`);
            });
        }
    });

    socket.on('satellitePosition', (data) => {
        console.log(`\n🛰️  Individual Satellite Position:`);
        console.log(`   NORAD ID: ${data.noradId}`);
        console.log(`   Latitude: ${data.latitude.toFixed(4)}°`);
        console.log(`   Longitude: ${data.longitude.toFixed(4)}°`);
        console.log(`   Altitude: ${data.altitude.toFixed(2)} km`);
        console.log(`   Velocity: ${data.velocity.toFixed(2)} km/s`);
    });
};

const testSubscriptions = () => {
    console.log('\n--- Testing Subscriptions ---');

    // Test subscribing to all satellites (should already be subscribed by default)
    setTimeout(() => {
        console.log('\nSubscribing to "all" room...');
        socket.emit('subscribe', { room: 'all', type: 'all' });
    }, 2000);

    // Test subscribing to a specific satellite (ISS = NORAD 25544)
    setTimeout(() => {
        console.log('\nSubscribing to ISS (sat:25544)...');
        socket.emit('subscribe', { room: 'sat:25544', type: 'sat' });
    }, 4000);

    // Test requesting a specific satellite position
    setTimeout(() => {
        console.log('\nRequesting position for NORAD 25544...');
        socket.emit('getSatellitePosition', { noradId: 25544 });
    }, 6000);
};

const main = () => {
    console.log('=== WebSocket Test Client ===\n');

    connectToServer();

    // Wait for connection, then test subscriptions
    setTimeout(testSubscriptions, 1000);

    // Keep running for 30 seconds to observe updates
    setTimeout(() => {
        console.log('\n\n--- Test Complete ---');
        console.log('Disconnecting...');
        socket.disconnect();
        process.exit(0);
    }, 30000);
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down test client...');
    if (socket) {
        socket.disconnect();
    }
    process.exit(0);
});

main();
