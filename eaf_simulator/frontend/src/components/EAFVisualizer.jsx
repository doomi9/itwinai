import React, { useEffect, useRef, useState } from 'react';
import './EAFVisualizer.css';
import * as THREE from 'three';

const EAFVisualizer = ({ simulationData, isRunning }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const animationRef = useRef(null);
    const [viewMode, setViewMode] = useState('3d');
    const [showInfo, setShowInfo] = useState(true);
    const [showLegend, setShowLegend] = useState(true);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf7fafc);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(15, 10, 15);
        camera.lookAt(0, 0, 0);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Create EAF components
        createEAFComponents(scene);

        // Animation loop
        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);
            
            // Rotate the entire furnace slowly
            scene.rotation.y += 0.005;
            
            // Update arc animation
            updateArcAnimation(scene, simulationData, isRunning);
            
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (mountRef.current && renderer) {
                const width = mountRef.current.clientWidth;
                const height = mountRef.current.clientHeight;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    const createEAFComponents = (scene) => {
        // Clear existing components
        scene.children = scene.children.filter(child => 
            child.type === 'AmbientLight' || child.type === 'DirectionalLight'
        );

        // Furnace shell (refractory lining)
        const shellGeometry = new THREE.CylinderGeometry(8, 8, 12, 32);
        const shellMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.8
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.position.y = 6;
        shell.castShadow = true;
        shell.receiveShadow = true;
        scene.add(shell);

        // Liquid metal pool
        const metalGeometry = new THREE.CylinderGeometry(6, 6, 2, 32);
        const metalMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF4500,
            transparent: true,
            opacity: 0.9
        });
        const metal = new THREE.Mesh(metalGeometry, metalMaterial);
        metal.position.y = 1;
        metal.castShadow = true;
        metal.receiveShadow = true;
        scene.add(metal);

        // Slag layer
        const slagGeometry = new THREE.CylinderGeometry(6.5, 6.5, 1, 32);
        const slagMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x708090,
            transparent: true,
            opacity: 0.7
        });
        const slag = new THREE.Mesh(slagGeometry, slagMaterial);
        slag.position.y = 2.5;
        scene.add(slag);

        // Electrodes (3 graphite electrodes)
        const electrodeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
        const electrodeMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3;
            const radius = 4;
            const electrode = new THREE.Mesh(electrodeGeometry, electrodeMaterial);
            electrode.position.set(
                radius * Math.cos(angle),
                8,
                radius * Math.sin(angle)
            );
            electrode.castShadow = true;
            scene.add(electrode);
        }

        // Arc effects (will be animated)
        const arcGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
        const arcMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3;
            const radius = 4;
            const arc = new THREE.Mesh(arcGeometry, arcMaterial);
            arc.position.set(
                radius * Math.cos(angle),
                4,
                radius * Math.sin(angle)
            );
            arc.userData = { type: 'arc', index: i };
            scene.add(arc);
        }

        // Cooling water pipes
        const pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 12, 16);
        const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        
        for (let i = 0; i < 4; i++) {
            const angle = (i * 2 * Math.PI) / 4;
            const radius = 9;
            const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipe.position.set(
                radius * Math.cos(angle),
                6,
                radius * Math.sin(angle)
            );
            pipe.rotation.z = Math.PI / 2;
            scene.add(pipe);
        }

        // Roof with electrode holes
        const roofGeometry = new THREE.CylinderGeometry(8.5, 8.5, 1, 32);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 12.5;
        roof.castShadow = true;
        roof.receiveShadow = true;
        scene.add(roof);

        // Taphole
        const tapholeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
        const tapholeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const taphole = new THREE.Mesh(tapholeGeometry, tapholeMaterial);
        taphole.position.set(0, 1, -8);
        taphole.rotation.x = Math.PI / 2;
        scene.add(taphole);

        // Oxygen lance
        const lanceGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 16);
        const lanceMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        const lance = new THREE.Mesh(lanceGeometry, lanceMaterial);
        lance.position.set(0, 10, 0);
        lance.rotation.x = Math.PI / 2;
        scene.add(lance);

        // Add labels
        addLabels(scene);
    };

    const addLabels = (scene) => {
        // This would add text labels to the visualization
        // For now, we'll use simple colored indicators
    };

    const updateArcAnimation = (scene, simulationData, isRunning) => {
        if (!isRunning || !simulationData) return;

        // Find arc meshes and animate them
        scene.children.forEach(child => {
            if (child.userData?.type === 'arc') {
                // Pulse the arc
                const time = Date.now() * 0.005;
                const scale = 1 + 0.3 * Math.sin(time + child.userData.index);
                child.scale.set(scale, scale, scale);
                
                // Change color based on power
                const power = simulationData.current_power || 0;
                const intensity = Math.min(1, power / 50000); // Normalize power
                child.material.color.setHSL(0.6, 1, 0.5 + intensity * 0.5);
            }
        });

        // Update metal temperature color
        scene.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'CylinderGeometry' && 
                child.material.color.getHex() === 0xFF4500) {
                const temp = simulationData.zone_temperatures?.liquid_metal || 0;
                const normalizedTemp = Math.min(1, temp / 2000);
                const hue = 0.1 + normalizedTemp * 0.1; // Red to orange to yellow
                const saturation = 1;
                const lightness = 0.3 + normalizedTemp * 0.4;
                child.material.color.setHSL(hue, saturation, lightness);
            }
        });
    };

    const getCurrentMetrics = () => {
        if (!simulationData) return {};
        
        return {
            metalTemp: simulationData.zone_temperatures?.liquid_metal || 0,
            slagTemp: simulationData.zone_temperatures?.slag || 0,
            power: simulationData.current_power || 0,
            efficiency: simulationData.energy_efficiency || 0,
            arcLength: simulationData.arc_length || 0,
            electrodePosition: simulationData.electrode_position || 0
        };
    };

    const metrics = getCurrentMetrics();

    return (
        <div className="eaf-visualizer">
            <h2 className="eaf-visualizer-title">3D EAF Visualization</h2>
            
            <div className="visualizer-container">
                <div ref={mountRef} className="visualizer-canvas" />
                
                <div className="visualizer-overlay">
                    {/* Status Indicator */}
                    <div className="visualizer-status">
                        <div className={`visualizer-status-indicator ${isRunning ? 'running' : 'stopped'}`}></div>
                        <span className="visualizer-status-text">
                            {isRunning ? 'SIMULATION RUNNING' : 'SIMULATION STOPPED'}
                        </span>
                    </div>

                    {/* Info Panel */}
                    {showInfo && (
                        <div className="visualizer-info">
                            <div className="visualizer-info-title">Real-time Data</div>
                            <div className="visualizer-metric">
                                <span className="visualizer-metric-label">Metal Temp:</span>
                                <span className="visualizer-metric-value">{metrics.metalTemp.toFixed(0)}°C</span>
                            </div>
                            <div className="visualizer-metric">
                                <span className="visualizer-metric-label">Slag Temp:</span>
                                <span className="visualizer-metric-value">{metrics.slagTemp.toFixed(0)}°C</span>
                            </div>
                            <div className="visualizer-metric">
                                <span className="visualizer-metric-label">Power:</span>
                                <span className="visualizer-metric-value">{metrics.power.toFixed(0)} kW</span>
                            </div>
                            <div className="visualizer-metric">
                                <span className="visualizer-metric-label">Efficiency:</span>
                                <span className="visualizer-metric-value">{metrics.efficiency.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    {showLegend && (
                        <div className="visualizer-legend">
                            <div className="visualizer-legend-title">Components</div>
                            <div className="visualizer-legend-item">
                                <div className="visualizer-legend-color metal"></div>
                                <span>Liquid Metal</span>
                            </div>
                            <div className="visualizer-legend-item">
                                <div className="visualizer-legend-color slag"></div>
                                <span>Slag Layer</span>
                            </div>
                            <div className="visualizer-legend-item">
                                <div className="visualizer-legend-color refractory"></div>
                                <span>Refractory</span>
                            </div>
                            <div className="visualizer-legend-item">
                                <div className="visualizer-legend-color arc"></div>
                                <span>Electric Arc</span>
                            </div>
                            <div className="visualizer-legend-item">
                                <div className="visualizer-legend-color electrode"></div>
                                <span>Electrodes</span>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="visualizer-controls">
                        <button
                            className={`visualizer-control-button ${viewMode === '3d' ? 'active' : ''}`}
                            onClick={() => setViewMode('3d')}
                        >
                            3D View
                        </button>
                        <button
                            className={`visualizer-control-button ${viewMode === 'top' ? 'active' : ''}`}
                            onClick={() => setViewMode('top')}
                        >
                            Top View
                        </button>
                        <button
                            className={`visualizer-control-button ${viewMode === 'side' ? 'active' : ''}`}
                            onClick={() => setViewMode('side')}
                        >
                            Side View
                        </button>
                        <button
                            className="visualizer-control-button"
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            {showInfo ? 'Hide Info' : 'Show Info'}
                        </button>
                        <button
                            className="visualizer-control-button"
                            onClick={() => setShowLegend(!showLegend)}
                        >
                            {showLegend ? 'Hide Legend' : 'Show Legend'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EAFVisualizer;
