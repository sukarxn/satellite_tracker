import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useSatelliteStore } from '../store/satelliteStore';
import { satelliteAPI } from '../services/api';

interface GlobeProps {
    className?: string;
}

export const Globe: React.FC<GlobeProps> = ({ className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Cesium.Viewer | null>(null);
    const satelliteEntitiesRef = useRef<Map<number, Cesium.Entity>>(new Map());
    const pathEntityRef = useRef<Cesium.Entity | null>(null);

    const positions = useSatelliteStore(state => state.positions);
    const selectedSatelliteId = useSatelliteStore(state => state.selectedSatelliteId);
    const setSelectedSatellite = useSatelliteStore(state => state.setSelectedSatellite);

    // Initialize Cesium viewer
    useEffect(() => {
        console.log('Globe: useEffect init');
        if (!containerRef.current || viewerRef.current) return;

        console.log('Globe: initializing viewer...');
        let viewer: Cesium.Viewer | null = null;
        let handler: Cesium.ScreenSpaceEventHandler | null = null;

        try {
            // Create the Cesium viewer without awaiting layers first
            viewer = new Cesium.Viewer(containerRef.current, {
                animation: false,
                timeline: false,
                baseLayerPicker: false,
                fullscreenButton: false,
                geocoder: false,
                homeButton: false,
                infoBox: false,
                sceneModePicker: false,
                selectionIndicator: false,
                navigationHelpButton: false,
                shouldAnimate: true,
            });

            console.log('Globe: viewer created');
            viewerRef.current = viewer;
            (window as any).viewer = viewer;

            // Configure scene
            viewer.scene.globe.enableLighting = true;
            viewer.scene.globe.showGroundAtmosphere = true;

            // Set initial camera position
            viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(0, 20, 15000000),
                orientation: {
                    heading: 0,
                    pitch: -Cesium.Math.PI_OVER_TWO,
                    roll: 0,
                },
            });

            // Handle click events
            handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
                const pickedObject = viewer!.scene.pick(movement.position);
                if (Cesium.defined(pickedObject) && pickedObject.id) {
                    const entity = pickedObject.id as Cesium.Entity;
                    const noradId = entity.properties?.getValue(viewer!.clock.currentTime)?.noradId;
                    if (noradId) {
                        setSelectedSatellite(noradId);
                    }
                } else {
                    setSelectedSatellite(null);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            // Async load high-res imagery if available
            Cesium.ImageryLayer.fromWorldImagery({}).then(layer => {
                if (viewer) viewer.imageryLayers.add(layer);
            }).catch(e => console.warn('Globe: failed to load world imagery', e));

        } catch (error) {
            console.error('Globe: initialization error', error);
        }

        return () => {
            console.log('Globe: cleanup');
            if (handler) handler.destroy();
            if (viewer) {
                viewer.destroy();
                viewerRef.current = null;
                delete (window as any).viewer;
            }
        };
    }, [setSelectedSatellite]);

    // Update satellite positions
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const entities = satelliteEntitiesRef.current;

        positions.forEach((position, noradId) => {
            let entity = entities.get(noradId);
            const cartesianPos = Cesium.Cartesian3.fromDegrees(
                position.longitude,
                position.latitude,
                position.altitude * 1000
            );

            if (!entity) {
                entity = viewer.entities.add({
                    id: `sat-${noradId}`,
                    position: cartesianPos as any,
                    point: {
                        pixelSize: 8,
                        color: Cesium.Color.fromCssColorString('#00d4ff'),
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 1,
                    },
                    label: {
                        text: position.name,
                        font: '10px Inter, sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -10),
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000000),
                    },
                    properties: {
                        noradId,
                        name: position.name,
                    },
                });

                entities.set(noradId, entity);
            } else {
                entity.position = cartesianPos as any;
            }

            // Highlight selected satellite
            if (noradId === selectedSatelliteId) {
                if (entity.point) {
                    (entity.point.pixelSize as any) = 12;
                    (entity.point.color as any) = Cesium.Color.fromCssColorString('#00ff88');
                }
            } else {
                if (entity.point) {
                    (entity.point.pixelSize as any) = 8;
                    (entity.point.color as any) = Cesium.Color.fromCssColorString('#00d4ff');
                }
            }
        });

        // Cleanup stale entities
        if (positions.size > 0) {
            entities.forEach((entity, noradId) => {
                if (!positions.has(noradId)) {
                    viewer.entities.remove(entity);
                    entities.delete(noradId);
                }
            });
        }
    }, [positions, selectedSatelliteId]);

    // Handle orbital path
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        if (pathEntityRef.current) {
            viewer.entities.remove(pathEntityRef.current);
            pathEntityRef.current = null;
        }

        if (!selectedSatelliteId) return;

        const loadPath = async () => {
            try {
                const data = await satelliteAPI.getSatellitePath(selectedSatelliteId);

                const pathCoords = data.path.map(p =>
                    Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.altitude * 1000)
                );

                pathEntityRef.current = viewer.entities.add({
                    id: `path-${selectedSatelliteId}`,
                    polyline: {
                        positions: pathCoords,
                        width: 3,
                        material: new Cesium.PolylineGlowMaterialProperty({
                            glowPower: 0.2,
                            color: Cesium.Color.fromCssColorString('#00ff88'),
                        }),
                    }
                });

                // Zoom to satellite on first selection
                const entity = satelliteEntitiesRef.current.get(selectedSatelliteId);
                if (entity) {
                    viewer.zoomTo(entity, new Cesium.HeadingPitchRange(0, -0.5, 3000000));
                }
            } catch (error) {
                console.error('Path error:', error);
            }
        };

        loadPath();
    }, [selectedSatelliteId]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full ${className}`}
            style={{ position: 'relative', background: '#000', minHeight: '400px' }}
        />
    );
};
