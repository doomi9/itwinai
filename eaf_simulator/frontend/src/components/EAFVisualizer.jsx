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

        // Enhanced lighting for industrial look
        const pointLight1 = new THREE.PointLight(0xffaa44, 1, 50);
        pointLight1.position.set(10, 15, 10);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x4488ff, 0.8, 40);
        pointLight2.position.set(-10, 12, -10);
        scene.add(pointLight2);

        // Main furnace shell (refractory lining) - more detailed
        const shellGeometry = new THREE.CylinderGeometry(8, 8, 12, 64);
        const shellMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.9
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.position.y = 6;
        shell.castShadow = true;
        shell.receiveShadow = true;
        scene.add(shell);

        // Add refractory brick pattern
        const brickGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3);
        const brickMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 12; j++) {
                const brick = new THREE.Mesh(brickGeometry, brickMaterial);
                const angle = (i * 2 * Math.PI) / 8;
                const radius = 8.1;
                brick.position.set(
                    radius * Math.cos(angle),
                    0.2 + j * 0.4,
                    radius * Math.sin(angle)
                );
                brick.rotation.y = angle;
                scene.add(brick);
            }
        }

        // Liquid metal pool with realistic surface
        const metalGeometry = new THREE.CylinderGeometry(6, 6, 2, 64);
        const metalMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF4500,
            transparent: true,
            opacity: 0.95,
            metalness: 0.8,
            roughness: 0.2
        });
        const metal = new THREE.Mesh(metalGeometry, metalMaterial);
        metal.position.y = 1;
        metal.castShadow = true;
        metal.receiveShadow = true;
        scene.add(metal);

        // Add metal surface ripples
        const rippleGeometry = new THREE.CylinderGeometry(6.1, 6.1, 0.1, 64);
        const rippleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF6347,
            transparent: true,
            opacity: 0.7
        });
        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ripple.position.y = 2.1;
        scene.add(ripple);

        // Slag layer with realistic composition
        const slagGeometry = new THREE.CylinderGeometry(6.5, 6.5, 1.2, 64);
        const slagMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x708090,
            transparent: true,
            opacity: 0.8,
            metalness: 0.3,
            roughness: 0.7
        });
        const slag = new THREE.Mesh(slagGeometry, slagMaterial);
        slag.position.y = 2.6;
        scene.add(slag);

        // Add slag surface texture
        const slagTextureGeometry = new THREE.CylinderGeometry(6.6, 6.6, 0.1, 64);
        const slagTextureMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x556B2F,
            transparent: true,
            opacity: 0.6
        });
        const slagTexture = new THREE.Mesh(slagTextureGeometry, slagTextureMaterial);
        slagTexture.position.y = 3.2;
        scene.add(slagTexture);

        // Enhanced electrodes (3 graphite electrodes with realistic details)
        const electrodeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 32);
        const electrodeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2F4F4F,
            metalness: 0.9,
            roughness: 0.1
        });
        
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3;
            const radius = 4;
            const electrode = new THREE.Mesh(electrodeGeometry, electrodeMaterial);
            electrode.position.set(
                radius * Math.cos(angle),
                10,
                radius * Math.sin(angle)
            );
            electrode.castShadow = true;
            scene.add(electrode);

            // Add electrode holder/clamp
            const holderGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
            const holderMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const holder = new THREE.Mesh(holderGeometry, holderMaterial);
            holder.position.set(
                radius * Math.cos(angle),
                15.5,
                radius * Math.sin(angle)
            );
            scene.add(holder);

            // Add electrode cooling system
            const coolingGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 16);
            const coolingMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
            const cooling = new THREE.Mesh(coolingGeometry, coolingMaterial);
            cooling.position.set(
                radius * Math.cos(angle),
                10,
                radius * Math.sin(angle)
            );
            scene.add(cooling);
        }

        // Enhanced arc effects with realistic plasma visualization
        const arcGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 16);
        const arcMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.9
        });
        
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3;
            const radius = 4;
            const arc = new THREE.Mesh(arcGeometry, arcMaterial);
            arc.position.set(
                radius * Math.cos(angle),
                5,
                radius * Math.sin(angle)
            );
            arc.userData = { type: 'arc', index: i };
            scene.add(arc);

            // Add arc plasma effects
            const plasmaGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const plasmaMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.6
            });
            const plasma = new THREE.Mesh(plasmaGeometry, plasmaMaterial);
            plasma.position.set(
                radius * Math.cos(angle),
                3,
                radius * Math.sin(angle)
            );
            plasma.userData = { type: 'plasma', index: i };
            scene.add(plasma);
        }

        // Enhanced cooling water system
        const pipeGeometry = new THREE.CylinderGeometry(0.25, 0.25, 12, 24);
        const pipeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4169E1,
            metalness: 0.8,
            roughness: 0.2
        });
        
        for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6;
            const radius = 9.5;
            const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipe.position.set(
                radius * Math.cos(angle),
                6,
                radius * Math.sin(angle)
            );
            pipe.rotation.z = Math.PI / 2;
            scene.add(pipe);

            // Add pipe connections
            const connectionGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const connectionMaterial = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
            const connection = new THREE.Mesh(connectionGeometry, connectionMaterial);
            connection.position.set(
                radius * Math.cos(angle),
                6,
                radius * Math.sin(angle)
            );
            scene.add(connection);
        }

        // Enhanced roof with electrode holes and refractory lining
        const roofGeometry = new THREE.CylinderGeometry(8.5, 8.5, 1.5, 64);
        const roofMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x696969,
            metalness: 0.7,
            roughness: 0.3
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 13;
        roof.castShadow = true;
        roof.receiveShadow = true;
        scene.add(roof);

        // Add electrode holes in roof
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3;
            const radius = 4;
            const holeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
            const holeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            hole.position.set(
                radius * Math.cos(angle),
                13.5,
                radius * Math.sin(angle)
            );
            scene.add(hole);
        }

        // Enhanced taphole with realistic design
        const tapholeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 3, 24);
        const tapholeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x000000,
            metalness: 0.9,
            roughness: 0.1
        });
        const taphole = new THREE.Mesh(tapholeGeometry, tapholeMaterial);
        taphole.position.set(0, 1.5, -8);
        taphole.rotation.x = Math.PI / 2;
        scene.add(taphole);

        // Add taphole refractory lining
        const tapholeRefractoryGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3.5, 24);
        const tapholeRefractoryMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const tapholeRefractory = new THREE.Mesh(tapholeRefractoryGeometry, tapholeRefractoryMaterial);
        tapholeRefractory.position.set(0, 1.5, -8);
        tapholeRefractory.rotation.x = Math.PI / 2;
        scene.add(tapholeRefractory);

        // Enhanced oxygen lance with realistic details
        const lanceGeometry = new THREE.CylinderGeometry(0.15, 0.15, 5, 24);
        const lanceMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xC0C0C0,
            metalness: 0.9,
            roughness: 0.1
        });
        const lance = new THREE.Mesh(lanceGeometry, lanceMaterial);
        lance.position.set(0, 12.5, 0);
        lance.rotation.x = Math.PI / 2;
        scene.add(lance);

        // Add lance support structure
        const supportGeometry = new THREE.BoxGeometry(2, 0.3, 0.3);
        const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        const support = new THREE.Mesh(supportGeometry, supportMaterial);
        support.position.set(0, 15, 0);
        scene.add(support);

        // Add carbon injection system
        const carbonGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 16);
        const carbonMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const carbon = new THREE.Mesh(carbonGeometry, carbonMaterial);
        carbon.position.set(2, 11, 0);
        carbon.rotation.x = Math.PI / 2;
        scene.add(carbon);

        // Add lime injection system
        const limeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 16);
        const limeMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        const lime = new THREE.Mesh(limeGeometry, limeMaterial);
        lime.position.set(-2, 11, 0);
        lime.rotation.x = Math.PI / 2;
        scene.add(lime);

        // Add furnace support structure
        const supportStructureGeometry = new THREE.BoxGeometry(20, 1, 20);
        const supportStructureMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        const supportStructure = new THREE.Mesh(supportStructureGeometry, supportStructureMaterial);
        supportStructure.position.set(0, -0.5, 0);
        scene.add(supportStructure);

        // Add structural columns
        for (let i = 0; i < 4; i++) {
            const angle = (i * 2 * Math.PI) / 4;
            const radius = 12;
            const columnGeometry = new THREE.BoxGeometry(1, 15, 1);
            const columnMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(
                radius * Math.cos(angle),
                7.5,
                radius * Math.sin(angle)
            );
            scene.add(column);
        }

        // Add control panel and monitoring equipment
        const controlPanelGeometry = new THREE.BoxGeometry(3, 2, 1);
        const controlPanelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const controlPanel = new THREE.Mesh(controlPanelGeometry, controlPanelMaterial);
        controlPanel.position.set(12, 8, 0);
        scene.add(controlPanel);

        // Add monitoring screens
        const screenGeometry = new THREE.BoxGeometry(2.5, 1.5, 0.1);
        const screenMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(12, 8, 0.6);
        scene.add(screen);

        // Add labels and indicators
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
                const power = simulationData?.current_power || 0;
                const intensity = Math.min(1, power / 50000); // Normalize power
                child.material.color.setHSL(0.6, 1, 0.5 + intensity * 0.5);
            }

            // Animate plasma effects
            if (child.userData?.type === 'plasma') {
                const time = Date.now() * 0.008;
                const scale = 0.8 + 0.4 * Math.sin(time + child.userData.index * 2);
                child.scale.set(scale, scale, scale);
                
                // Change plasma color based on temperature
                const temp = simulationData?.zone_temperatures?.liquid_metal || 0;
                const normalizedTemp = Math.min(1, temp / 2000);
                const hue = 0.6 + normalizedTemp * 0.1; // Blue to cyan
                const saturation = 1;
                const lightness = 0.5 + normalizedTemp * 0.3;
                child.material.color.setHSL(hue, saturation, lightness);
            }
        });

        // Update metal temperature color with more realistic transitions
        scene.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'CylinderGeometry' && 
                child.material.color.getHex() === 0xFF4500) {
                const temp = simulationData?.zone_temperatures?.liquid_metal || 0;
                const normalizedTemp = Math.min(1, temp / 2000);
                
                // More realistic temperature color mapping
                let hue, saturation, lightness;
                if (temp < 500) {
                    // Cold - dark red
                    hue = 0.0; saturation = 0.8; lightness = 0.2;
                } else if (temp < 1000) {
                    // Warming - red
                    hue = 0.0; saturation = 1.0; lightness = 0.3;
                } else if (temp < 1500) {
                    // Hot - orange-red
                    hue = 0.05; saturation = 1.0; lightness = 0.4;
                } else if (temp < 1800) {
                    // Very hot - orange
                    hue = 0.1; saturation = 1.0; lightness = 0.5;
                } else {
                    // Extremely hot - yellow-white
                    hue = 0.15; saturation = 0.8; lightness = 0.6;
                }
                
                child.material.color.setHSL(hue, saturation, lightness);
            }
        });

        // Animate cooling water pipes
        scene.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'CylinderGeometry' && 
                child.material.color.getHex() === 0x4169E1) {
                const time = Date.now() * 0.003;
                const pulse = 0.95 + 0.05 * Math.sin(time);
                child.material.opacity = 0.8 * pulse;
            }
        });

        // Animate refractory bricks
        scene.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'BoxGeometry' && 
                child.material.color.getHex() === 0x654321) {
                const time = Date.now() * 0.001;
                const glow = 0.8 + 0.2 * Math.sin(time + child.position.x * 0.1);
                child.material.opacity = 0.9 * glow;
            }
        });
    };

    const getCurrentMetrics = () => {
        if (!simulationData) return {
            metalTemp: 0,
            slagTemp: 0,
            power: 0,
            efficiency: 0,
            arcLength: 0,
            electrodePosition: 0
        };
        
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
