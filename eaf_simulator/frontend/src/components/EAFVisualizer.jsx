import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './EAFVisualizer.css';

const EAFVisualizer = ({ simulationData, isRunning }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const animationIdRef = useRef(null);

    const [furnaceModel, setFurnaceModel] = useState(null);
    const [zoneObjects, setZoneObjects] = useState({});

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        scene.fog = new THREE.Fog(0x1a1a1a, 10, 100);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(15, 10, 15);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;

        mountRef.current.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        scene.add(directionalLight);

        // Point light for arc effect
        const arcLight = new THREE.PointLight(0xff4400, 2, 10);
        arcLight.position.set(0, 8, 0);
        arcLight.castShadow = true;
        scene.add(arcLight);

        // Create furnace structure
        createFurnaceStructure(scene);

        // Store references
        sceneRef.current = scene;
        rendererRef.current = renderer;
        controlsRef.current = controls;

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            // Update controls
            controls.update();

            // Update arc light intensity based on simulation
            if (isRunning && simulationData) {
                const power = simulationData.current_power || 0;
                const normalizedPower = Math.min(power / 50000, 1); // Normalize to 0-1
                arcLight.intensity = 2 + normalizedPower * 3;
                arcLight.color.setHex(0xff4400 + Math.floor(normalizedPower * 0x00ff00));
            }

            // Render
            renderer.render(scene, camera);
        };

        animate();

        // Handle window resize
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

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    // Update visualization when simulation data changes
    useEffect(() => {
        if (simulationData && sceneRef.current) {
            updateVisualization(simulationData);
        }
    }, [simulationData]);

    const createFurnaceStructure = (scene) => {
        // Furnace body (cylinder)
        const furnaceGeometry = new THREE.CylinderGeometry(8, 8, 12, 32);
        const furnaceMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const furnace = new THREE.Mesh(furnaceGeometry, furnaceMaterial);
        furnace.position.y = 6;
        furnace.castShadow = true;
        furnace.receiveShadow = true;
        scene.add(furnace);

        // Furnace top (cone)
        const topGeometry = new THREE.ConeGeometry(8, 4, 32);
        const topMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 14;
        top.castShadow = true;
        scene.add(top);

        // Electrodes (3 graphite electrodes)
        const electrodeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
        const electrodeMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3;
            const radius = 3;
            const electrode = new THREE.Mesh(electrodeGeometry, electrodeMaterial);
            electrode.position.set(
                radius * Math.cos(angle),
                10,
                radius * Math.sin(angle)
            );
            electrode.castShadow = true;
            scene.add(electrode);
        }

        // Arc visualization
        const arcGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const arcMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.8
        });
        const arc = new THREE.Mesh(arcGeometry, arcMaterial);
        arc.position.y = 8;
        scene.add(arc);

        // Store zone objects for updates
        setZoneObjects({
            furnace,
            top,
            arc,
            electrodes: []
        });
    };

    const updateVisualization = (data) => {
        if (!sceneRef.current || !zoneObjects.furnace) return;

        // Update temperatures with color changes
        const metalTemp = data.zone_temperatures?.liquid_metal || 298;
        const slagTemp = data.zone_temperatures?.slag || 298;

        // Temperature-based color mapping
        const getTemperatureColor = (temp) => {
            if (temp < 500) return 0x0000ff; // Blue (cold)
            if (temp < 1000) return 0x00ffff; // Cyan
            if (temp < 1500) return 0x00ff00; // Green
            if (temp < 2000) return 0xffff00; // Yellow
            if (temp < 2500) return 0xff8000; // Orange
            return 0xff0000; // Red (hot)
        };

        // Update furnace color based on metal temperature
        const furnaceMaterial = zoneObjects.furnace.material;
        furnaceMaterial.color.setHex(getTemperatureColor(metalTemp));

        // Update arc intensity based on power
        if (zoneObjects.arc) {
            const power = data.current_power || 0;
            const normalizedPower = Math.min(power / 50000, 1);
            zoneObjects.arc.material.opacity = 0.3 + normalizedPower * 0.7;
            zoneObjects.arc.material.color.setHex(getTemperatureColor(2000 + normalizedPower * 1000));
        }

        // Add particle effects for high temperatures
        if (metalTemp > 1500 && !sceneRef.current.particles) {
            createParticleSystem(sceneRef.current);
        }
    };

    const createParticleSystem = (scene) => {
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 16; // x
            positions[i3 + 1] = Math.random() * 8 + 4; // y
            positions[i3 + 2] = (Math.random() - 0.5) * 16; // z

            colors[i3] = 1; // r
            colors[i3 + 1] = Math.random() * 0.5; // g
            colors[i3 + 2] = 0; // b
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);
        scene.particles = particleSystem;

        // Animate particles
        const animateParticles = () => {
            if (particleSystem) {
                const positions = particleSystem.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += 0.01; // Move up
                    if (positions[i + 1] > 12) {
                        positions[i + 1] = 4; // Reset to bottom
                    }
                }
                particleSystem.geometry.attributes.position.needsUpdate = true;
            }
            requestAnimationFrame(animateParticles);
        };
        animateParticles();
    };

    return (
        <div className="eaf-visualizer" ref={mountRef}>
            <div className="visualizer-overlay">
                <div className="temperature-display">
                    {simulationData && (
                        <>
                            <div className="temp-item">
                                <span className="temp-label">Metal:</span>
                                <span className="temp-value">
                                    {Math.round(simulationData.zone_temperatures?.liquid_metal || 0)}°C
                                </span>
                            </div>
                            <div className="temp-item">
                                <span className="temp-label">Slag:</span>
                                <span className="temp-value">
                                    {Math.round(simulationData.zone_temperatures?.slag || 0)}°C
                                </span>
                            </div>
                            <div className="temp-item">
                                <span className="temp-label">Power:</span>
                                <span className="temp-value">
                                    {Math.round(simulationData.current_power || 0)} kW
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <div className="controls-info">
                    <p>Mouse: Rotate | Scroll: Zoom | Right-click: Pan</p>
                </div>
            </div>
        </div>
    );
};

export default EAFVisualizer;
