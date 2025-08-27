import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import './ChartsPanel.css';

const ChartsPanel = ({ simulationData, simulationHistory, isRunning }) => {

    // Process simulation history for charts
    const chartData = useMemo(() => {
        if (!simulationHistory || simulationHistory.length === 0) {
            return [];
        }

        return simulationHistory.map((data, index) => ({
            time: data.simulation_time || index,
            metalTemp: Math.round(data.zone_temperatures?.liquid_metal || 0),
            slagTemp: Math.round(data.zone_temperatures?.slag || 0),
            refractoryTemp: Math.round(data.zone_temperatures?.refractory || 0),
            power: Math.round(data.current_power || 0),
            carbon: data.zone_temperatures?.liquid_metal > 1200 ? (data.zone_temperatures?.liquid_metal - 1200) / 100 : 0,
            silicon: data.zone_temperatures?.liquid_metal > 1400 ? (data.zone_temperatures?.liquid_metal - 1400) / 200 : 0
        }));
    }, [simulationHistory]);

    // Current status data
    const currentStatus = useMemo(() => {
        if (!simulationData) return null;

        return {
            metalTemp: Math.round(simulationData.zone_temperatures?.liquid_metal || 0),
            slagTemp: Math.round(simulationData.zone_temperatures?.slag || 0),
            power: Math.round(simulationData.current_power || 0),
            simulationTime: Math.round(simulationData.simulation_time || 0)
        };
    }, [simulationData]);

    if (chartData.length === 0) {
        return (
            <div className="charts-panel">
                <h3>📊 Simulation Charts</h3>
                <div className="no-data-message">
                    <p>No simulation data available yet.</p>
                    <p>Start a simulation to see real-time charts and analytics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="charts-panel">
            <h3>📊 Simulation Charts</h3>

            {/* Current Status Cards */}
            {currentStatus && (
                <div className="status-cards">
                    <div className="status-card">
                        <div className="card-icon">🔥</div>
                        <div className="card-content">
                            <div className="card-value">{currentStatus.metalTemp}°C</div>
                            <div className="card-label">Metal Temperature</div>
                        </div>
                    </div>

                    <div className="status-card">
                        <div className="card-icon">🌋</div>
                        <div className="card-content">
                            <div className="card-value">{currentStatus.slagTemp}°C</div>
                            <div className="card-label">Slag Temperature</div>
                        </div>
                    </div>

                    <div className="status-card">
                        <div className="card-icon">⚡</div>
                        <div className="card-content">
                            <div className="card-value">{currentStatus.power} kW</div>
                            <div className="card-label">Current Power</div>
                        </div>
                    </div>

                    <div className="status-card">
                        <div className="card-icon">⏱️</div>
                        <div className="card-content">
                            <div className="card-value">{currentStatus.simulationTime}s</div>
                            <div className="card-label">Simulation Time</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Temperature Chart */}
            <div className="chart-container">
                <h4>Temperature Evolution</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            formatter={(value, name) => [value, name]}
                            labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="metalTemp"
                            stroke="#ff4444"
                            strokeWidth={2}
                            name="Metal Temperature"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="slagTemp"
                            stroke="#44ff44"
                            strokeWidth={2}
                            name="Slag Temperature"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="refractoryTemp"
                            stroke="#4444ff"
                            strokeWidth={2}
                            name="Refractory Temperature"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Power Chart */}
            <div className="chart-container">
                <h4>Power Consumption</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                            label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            formatter={(value, name) => [value, name]}
                            labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="power"
                            stroke="#ff8800"
                            fill="#ff8800"
                            fillOpacity={0.3}
                            name="Arc Power"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Chemical Composition Chart */}
            <div className="chart-container">
                <h4>Chemical Reactions</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                            label={{ value: 'Reaction Rate', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            formatter={(value, name) => [value, name]}
                            labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="carbon"
                            stroke="#8B4513"
                            strokeWidth={2}
                            name="Carbon Oxidation"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="silicon"
                            stroke="#2E8B57"
                            strokeWidth={2}
                            name="Silicon Oxidation"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Performance Metrics */}
            <div className="metrics-section">
                <h4>Performance Metrics</h4>
                <div className="metrics-grid">
                    <div className="metric-item">
                        <span className="metric-label">Max Temperature:</span>
                        <span className="metric-value">
                            {Math.max(...chartData.map(d => d.metalTemp))}°C
                        </span>
                    </div>

                    <div className="metric-item">
                        <span className="metric-label">Min Temperature:</span>
                        <span className="metric-value">
                            {Math.min(...chartData.map(d => d.metalTemp))}°C
                        </span>
                    </div>

                    <div className="metric-item">
                        <span className="metric-label">Peak Power:</span>
                        <span className="metric-value">
                            {Math.max(...chartData.map(d => d.power))} kW
                        </span>
                    </div>

                    <div className="metric-item">
                        <span className="metric-label">Total Data Points:</span>
                        <span className="metric-value">
                            {chartData.length}
                        </span>
                    </div>

                    <div className="metric-item">
                        <span className="metric-label">Temperature Range:</span>
                        <span className="metric-value">
                            {Math.max(...chartData.map(d => d.metalTemp)) - Math.min(...chartData.map(d => d.metalTemp))}°C
                        </span>
                    </div>

                    <div className="metric-item">
                        <span className="metric-label">Simulation Duration:</span>
                        <span className="metric-value">
                            {Math.max(...chartData.map(d => d.time))}s
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartsPanel;
