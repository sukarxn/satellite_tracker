import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useSatelliteStore } from '../store/satelliteStore';

interface GlobeProps {
    className?: string;
}

export const Globe: React.FC<GlobeProps> = ({ className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Cesium.Viewer | null>(null);
    const satelliteEntitiesRef = useRef<Map<number, Cesium.Entity>>(new Map());

    const positions = useSatelliteStore(state => state.positions);
    const selectedSatelliteId = useSatelliteStore(state => state.selectedSatelliteId);
    const setSelectedSatellite = useSatelliteStore(state => state.setSelectedSatellite);

    // Initialize Cesium viewer
    useEffect(() => {
        if (!containerRef.current || viewerRef.current) return;

        let viewer: Cesium.Viewer | null = null;
        let handler: Cesium.ScreenSpaceEventHandler | null = null;

        const init = async () => {
            if (!containerRef.current) return;

            // Create the Cesium viewer
            viewer = new Cesium.Viewer(containerRef.current, {
                // Disable default UI widgets
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

                // Enable features
                shouldAnimate: true,

                // Base Layer & Terrain (Async APIs)
                baseLayer: await Cesium.ImageryLayer.fromWorldImagery({}),
                terrain: await Cesium.Terrain.fromWorldTerrain({}),
            });

            viewerRef.current = viewer;

            // Configure scene
            viewer.scene.globe.enableLighting = true;
            viewer.scene.globe.atmosphereLightIntensity = 3.0;
            if (viewer.scene.skyAtmosphere) {
                viewer.scene.skyAtmosphere.brightnessShift = 0.4;
            }

            // Set initial camera position
            viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(0, 30, 20000000),
                orientation: {
                    heading: 0,
                    pitch: -Cesium.Math.PI_OVER_TWO,
                    roll: 0,
                },
            });

            // Add stars
            viewer.scene.skyBox = new Cesium.SkyBox({
                sources: {
                    positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.91/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
                    negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.91/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
                    positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.91/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
                    negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.91/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
                    positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.91/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
                    negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.91/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg',
                },
            });

            // Handle click events
            handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
                const pickedObject = viewer.scene.pick(movement.position);

                if (Cesium.defined(pickedObject) && pickedObject.id) {
                    const entity = pickedObject.id as Cesium.Entity;
                    const noradId = entity.properties?.getValue(Cesium.JulianDate.now())?.noradId;

                    if (noradId) {
                        setSelectedSatellite(noradId);
                    }
                } else {
                    setSelectedSatellite(null);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        };

        init();

        // Cleanup
        return () => {
            if (handler) handler.destroy();
            if (viewer) {
                viewer.destroy();
                viewerRef.current = null;
            }
        };
    }, [setSelectedSatellite]);

    // Update satellite positions
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const entities = satelliteEntitiesRef.current;

        // Update or create entities for each position
        positions.forEach((position, noradId) => {
            let entity = entities.get(noradId);

            if (!entity) {
                // Create new entity
                entity = viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(
                        position.longitude,
                        position.latitude,
                        position.altitude * 1000 // Convert km to meters
                    ),
                    point: {
                        pixelSize: 8,
                        color: Cesium.Color.fromCssColorString('#00d4ff'),
                        outlineColor: Cesium.Color.fromCssColorString('#ffffff'),
                        outlineWidth: 2,
                        heightReference: Cesium.HeightReference.NONE,
                    },
                    label: {
                        text: position.name,
                        font: '12px Inter, sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -10),
                        showBackground: false,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000000),
                    },
                    properties: {
                        noradId,
                        name: position.name,
                    },
                });

                entities.set(noradId, entity);
            } else {
                // Update existing entity position
                entity.position = new Cesium.ConstantPositionProperty(
                    Cesium.Cartesian3.fromDegrees(
                        position.longitude,
                        position.latitude,
                        position.altitude * 1000
                    )
                );
            }

            // Highlight selected satellite
            if (noradId === selectedSatelliteId) {
                entity.point!.pixelSize = new Cesium.ConstantProperty(12);
                entity.point!.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#00ff88'));
            } else {
                entity.point!.pixelSize = new Cesium.ConstantProperty(8);
                entity.point!.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#00d4ff'));
            }
        });

        // Remove entities that no longer have positions
        entities.forEach((entity, noradId) => {
            if (!positions.has(noradId)) {
                viewer.entities.remove(entity);
                entities.delete(noradId);
            }
        });
    }, [positions, selectedSatelliteId]);

    // Focus camera on selected satellite
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !selectedSatelliteId) return;

        const entity = satelliteEntitiesRef.current.get(selectedSatelliteId);
        if (entity) {
            viewer.flyTo(entity, {
                duration: 2,
                offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.PI_OVER_FOUR, 5000000),
            });
        }
    }, [selectedSatelliteId]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full ${className}`}
            style={{ position: 'relative' }}
        />
    );
};
