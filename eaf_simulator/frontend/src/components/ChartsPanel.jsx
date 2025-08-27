import React, { useState, useMemo } from 'react';
import './ChartsPanel.css';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const ChartsPanel = ({ simulationData, simulationHistory }) => {
    const [selectedChart, setSelectedChart] = useState('temperature');
    const [timeRange, setTimeRange] = useState('all');

    // Process data for charts
    const chartData = useMemo(() => {
        if (!simulationHistory || simulationHistory.length === 0) {
            return [];
        }

        let filteredData = [...simulationHistory];

        // Apply time range filter
        if (timeRange !== 'all') {
            const now = Date.now();
            const rangeMs = parseInt(timeRange) * 1000;
            filteredData = filteredData.filter(item => 
                (now - new Date(item.timestamp).getTime()) <= rangeMs
            );
        }

        return filteredData.map((item, index) => ({
            time: index,
            timestamp: item.timestamp,
            metalTemp: item.zone_temperatures?.liquid_metal || 0,
            slagTemp: item.zone_temperatures?.slag || 0,
            refractoryTemp: item.zone_temperatures?.refractory || 0,
            power: item.current_power || 0,
            efficiency: item.energy_efficiency || 0,
            metalMass: item.zone_masses?.liquid_metal || 0,
            slagMass: item.zone_masses?.slag || 0,
            arcLength: item.arc_length || 0,
            electrodePosition: item.electrode_position || 0
        }));
    }, [simulationHistory, timeRange]);

    // Calculate summary metrics
    const summaryMetrics = useMemo(() => {
        if (chartData.length === 0) return {};

        const latest = chartData[chartData.length - 1];
        const avgTemp = chartData.reduce((sum, item) => sum + item.metalTemp, 0) / chartData.length;
        const maxPower = Math.max(...chartData.map(item => item.power));
        const avgEfficiency = chartData.reduce((sum, item) => sum + item.efficiency, 0) / chartData.length;

        return {
            currentTemp: latest.metalTemp,
            avgTemp: avgTemp,
            currentPower: latest.power,
            maxPower: maxPower,
            currentEfficiency: latest.efficiency,
            avgEfficiency: avgEfficiency,
            totalMass: latest.metalMass + latest.slagMass
        };
    }, [chartData]);

    // Chart configurations
    const chartConfigs = {
        temperature: {
            title: 'Temperature Trends',
            dataKey: 'metalTemp',
            color: '#e53e3e',
            yAxisLabel: 'Temperature (°C)',
            data: chartData.map(item => ({
                time: item.time,
                'Liquid Metal': item.metalTemp,
                'Slag': item.slagTemp,
                'Refractory': item.refractoryTemp
            }))
        },
        power: {
            title: 'Power Consumption',
            dataKey: 'power',
            color: '#3182ce',
            yAxisLabel: 'Power (kW)',
            data: chartData.map(item => ({
                time: item.time,
                'Arc Power': item.power
            }))
        },
        efficiency: {
            title: 'Energy Efficiency',
            dataKey: 'efficiency',
            color: '#38a169',
            yAxisLabel: 'Efficiency (%)',
            data: chartData.map(item => ({
                time: item.time,
                'Efficiency': item.efficiency
            }))
        },
        mass: {
            title: 'Mass Distribution',
            dataKey: 'metalMass',
            color: '#d69e2e',
            yAxisLabel: 'Mass (tons)',
            data: chartData.map(item => ({
                time: item.time,
                'Liquid Metal': item.metalMass,
                'Slag': item.slagMass
            }))
        }
    };

    const currentConfig = chartConfigs[selectedChart];

    // Render chart based on selection
    const renderChart = () => {
        if (chartData.length === 0) {
            return (
                <div className="chart-no-data">
                    No simulation data available. Start a simulation to see real-time charts.
                </div>
            );
        }

        const dataKeys = Object.keys(currentConfig.data[0]).filter(key => key !== 'time');

        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentConfig.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="time" 
                        stroke="#718096"
                        fontSize={12}
                    />
                    <YAxis 
                        stroke="#718096"
                        fontSize={12}
                        label={{ 
                            value: currentConfig.yAxisLabel, 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#718096' }
                        }}
                    />
                    <Tooltip 
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <Legend />
                    {dataKeys.map((key, index) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={getChartColor(index)}
                            strokeWidth={2}
                            dot={{ fill: getChartColor(index), strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 6, stroke: getChartColor(index), strokeWidth: 2 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    };

    const getChartColor = (index) => {
        const colors = ['#e53e3e', '#3182ce', '#38a169', '#d69e2e', '#805ad5', '#dd6b20'];
        return colors[index % colors.length];
    };

    return (
        <div className="charts-panel">
            <h2 className="charts-panel-title">Real-time Data Analytics</h2>

            {/* Summary Metrics */}
            <div className="metrics-overview">
                <div className="metric-card">
                    <div className="metric-value">{summaryMetrics.currentTemp?.toFixed(0) || '0'}</div>
                    <div className="metric-label">Current Temp (°C)</div>
                </div>
                <div className="metric-card">
                    <div className="metric-value">{summaryMetrics.currentPower?.toFixed(0) || '0'}</div>
                    <div className="metric-label">Current Power (kW)</div>
                </div>
                <div className="metric-card">
                    <div className="metric-value">{summaryMetrics.currentEfficiency?.toFixed(1) || '0'}</div>
                    <div className="metric-label">Efficiency (%)</div>
                </div>
                <div className="metric-card">
                    <div className="metric-value">{summaryMetrics.totalMass?.toFixed(1) || '0'}</div>
                    <div className="metric-label">Total Mass (tons)</div>
                </div>
            </div>

            {/* Chart Controls */}
            <div className="chart-controls">
                <button
                    className={`chart-control-button ${selectedChart === 'temperature' ? 'active' : ''}`}
                    onClick={() => setSelectedChart('temperature')}
                >
                    Temperature
                </button>
                <button
                    className={`chart-control-button ${selectedChart === 'power' ? 'active' : ''}`}
                    onClick={() => setSelectedChart('power')}
                >
                    Power
                </button>
                <button
                    className={`chart-control-button ${selectedChart === 'efficiency' ? 'active' : ''}`}
                    onClick={() => setSelectedChart('efficiency')}
                >
                    Efficiency
                </button>
                <button
                    className={`chart-control-button ${selectedChart === 'mass' ? 'active' : ''}`}
                    onClick={() => setSelectedChart('mass')}
                >
                    Mass
                </button>
            </div>

            {/* Time Range Selector */}
            <div className="time-range-selector">
                <label>Time Range:</label>
                <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                >
                    <option value="all">All Data</option>
                    <option value="300">Last 5 minutes</option>
                    <option value="900">Last 15 minutes</option>
                    <option value="1800">Last 30 minutes</option>
                    <option value="3600">Last hour</option>
                </select>
            </div>

            {/* Chart Container */}
            <div className="chart-container">
                <h3 className="chart-title">{currentConfig?.title}</h3>
                <div className="chart-wrapper">
                    {renderChart()}
                </div>
            </div>

            {/* Chart Legend */}
            <div className="chart-legend">
                <div className="legend-item">
                    <div className="legend-color temperature"></div>
                    <span>Temperature</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color power"></div>
                    <span>Power</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color mass"></div>
                    <span>Mass</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color efficiency"></div>
                    <span>Efficiency</span>
                </div>
            </div>
        </div>
    );
};

export default ChartsPanel;
