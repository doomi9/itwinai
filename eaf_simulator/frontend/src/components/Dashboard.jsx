import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import EAFVisualizer from './EAFVisualizer';
import ControlPanel from './ControlPanel';
import ChartsPanel from './ChartsPanel';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Dashboard = () => {
    const [simulationData, setSimulationData] = useState(null);
    const [simulationHistory, setSimulationHistory] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [websocket, setWebsocket] = useState(null);
    const [error, setError] = useState(null);

    // Initialize WebSocket connection
    useEffect(() => {
        console.log('🔌 Attempting WebSocket connection to ws://localhost:8000/ws');
        
        const ws = new WebSocket(`ws://localhost:8000/ws`);

        ws.onopen = () => {
            console.log('✅ WebSocket connected successfully');
            setWebsocket(ws);
            setError(null); // Clear any previous errors
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 WebSocket message received:', data);
                
                // Handle different message types
                if (data.type === 'connection_status') {
                    console.log('✅ WebSocket connection confirmed:', data.message);
                    setError(null);
                } else if (data.type === 'heartbeat') {
                    console.log('💓 WebSocket heartbeat received, simulation running:', data.simulation_running);
                } else if (data.type === 'simulation_data') {
                    console.log('📊 Simulation data received:', data);
                    setSimulationData(data);

                    // Add to history
                    setSimulationHistory(prev => {
                        const newHistory = [...prev, data];
                        // Keep only last 1000 points
                        return newHistory.slice(-1000);
                    });
                } else {
                    // Handle legacy messages without type
                    console.log('📨 Legacy message received:', data);
                    setSimulationData(data);

                    // Add to history
                    setSimulationHistory(prev => {
                        const newHistory = [...prev, data];
                        // Keep only last 1000 points
                        return newHistory.slice(-1000);
                    });
                }
            } catch (err) {
                console.error('❌ Failed to parse WebSocket message:', err);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket error occurred:', error);
            console.error('❌ WebSocket readyState:', ws.readyState);
            console.error('❌ WebSocket URL:', ws.url);
            setError('WebSocket connection failed - check console for details');
        };

        ws.onclose = (event) => {
            console.log('🔌 WebSocket disconnected:', event.code, event.reason);
            setWebsocket(null);
        };

        // Cleanup function
        return () => {
            console.log('🧹 Cleaning up WebSocket connection');
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    // Start simulation
    const handleStartSimulation = useCallback(async (params) => {
        try {
            setError(null);

            const response = await fetch(`${API_BASE_URL}/api/simulation/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                setIsRunning(true);
                console.log('Simulation started:', result);
            } else {
                throw new Error(result.message || 'Failed to start simulation');
            }
        } catch (err) {
            console.error('Failed to start simulation:', err);
            setError(err.message);
        }
    }, [API_BASE_URL]);

    // Stop simulation
    const handleStopSimulation = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/simulation/stop`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                setIsRunning(false);
                console.log('Simulation stopped:', result);
            } else {
                throw new Error(result.message || 'Failed to stop simulation');
            }
        } catch (err) {
            console.error('Failed to stop simulation:', err);
            setError(err.message);
        }
    }, [API_BASE_URL]);

    // Update operating parameters
    const handleUpdateParameters = useCallback(async (params) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/control/parameters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Parameters updated:', result);
        } catch (err) {
            console.error('Failed to update parameters:', err);
            setError(err.message);
        }
    }, [API_BASE_URL]);

    // Add material
    const handleAddMaterial = useCallback(async (materialData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/control/materials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(materialData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Material added:', result);
        } catch (err) {
            console.error('Failed to add material:', err);
            setError(err.message);
        }
    }, [API_BASE_URL]);

    // Get connection status
    const getConnectionStatus = () => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            return 'connected';
        } else if (websocket && websocket.readyState === WebSocket.CONNECTING) {
            return 'connecting';
        } else {
            return 'disconnected';
        }
    };

    const connectionStatus = getConnectionStatus();

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">EAF Control Center</h1>
                <p className="dashboard-subtitle">Monitor and control your electric arc furnace in real-time</p>
                
                <div className="status-bar">
                    <div className="status-item">
                        <span className="websocket-indicator connected"></span>
                        <span className="status-label">WebSocket: {connectionStatus}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-indicator running"></span>
                        <span className="status-label">Simulation: {isRunning ? 'Running' : 'Stopped'}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Data Points: {simulationHistory.length}</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {error && (
                    <div className="error-message">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div className="dashboard-grid dashboard-grid-2">
                    <div className="dashboard-card">
                        <h2 className="dashboard-card-title">3D Visualization</h2>
                        <EAFVisualizer 
                            simulationData={simulationData}
                            isRunning={isRunning}
                        />
                    </div>
                    
                    <div className="dashboard-card">
                        <h2 className="dashboard-card-title">Control Panel</h2>
                        <ControlPanel
                            isRunning={isRunning}
                            onStartSimulation={handleStartSimulation}
                            onStopSimulation={handleStopSimulation}
                            onUpdateParameters={handleUpdateParameters}
                            onAddMaterial={handleAddMaterial}
                            simulationData={simulationData}
                        />
                    </div>
                </div>

                <div className="dashboard-card">
                    <h2 className="dashboard-card-title">Data Analytics</h2>
                    <ChartsPanel 
                        simulationData={simulationData}
                        simulationHistory={simulationHistory}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
