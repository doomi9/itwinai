import React, { useState, useEffect, useCallback } from 'react';
import EAFVisualizer from './EAFVisualizer';
import ControlPanel from './ControlPanel';
import ChartsPanel from './ChartsPanel';
import './Dashboard.css';

const Dashboard = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [simulationData, setSimulationData] = useState(null);
    const [websocket, setWebsocket] = useState(null);
    const [simulationHistory, setSimulationHistory] = useState([]);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

            if (result.status === 'success') {
                console.log('Parameters updated:', result);
            } else {
                throw new Error(result.message || 'Failed to update parameters');
            }
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

            if (result.status === 'success') {
                console.log('Material added:', result);
            } else {
                throw new Error(result.message || 'Failed to add material');
            }
        } catch (err) {
            console.error('Failed to add material:', err);
            setError(err.message);
        }
    }, [API_BASE_URL]);

    // Get simulation status
    const getSimulationStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/simulation/status`);

            if (response.ok) {
                const status = await response.json();
                setIsRunning(status.is_running);
            }
        } catch (err) {
            console.error('Failed to get simulation status:', err);
        }
    }, [API_BASE_URL]);

    // Check status periodically
    useEffect(() => {
        getSimulationStatus();

        const interval = setInterval(getSimulationStatus, 5000);
        return () => clearInterval(interval);
    }, [getSimulationStatus]);

    // Error display
    const ErrorDisplay = () => {
        if (!error) return null;

        return (
            <div className="error-banner">
                <span className="error-message">{error}</span>
                <button
                    className="error-close"
                    onClick={() => setError(null)}
                >
                    ×
                </button>
            </div>
        );
    };

    return (
        <div className="dashboard">
            <ErrorDisplay />

            <div className="dashboard-header">
                <h1>Electric Arc Furnace Simulator</h1>
                <div className="header-info">
                    <span className="api-status">
                        API: {websocket ? 'Connected' : 'Disconnected'}
                    </span>
                    <span className="simulation-status">
                        Simulation: {isRunning ? 'Running' : 'Stopped'}
                    </span>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="main-section">
                    <div className="visualization-container">
                        <EAFVisualizer
                            simulationData={simulationData}
                            isRunning={isRunning}
                        />
                    </div>

                    <div className="control-section">
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

                <div className="charts-section">
                    <ChartsPanel
                        simulationData={simulationData}
                        simulationHistory={simulationHistory}
                        isRunning={isRunning}
                    />
                </div>
            </div>

            <div className="dashboard-footer">
                <p>
                    Built with itwinai framework |
                    Real-time EAF simulation and control
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
