import React, { useState } from 'react';
import './ControlPanel.css';

const ControlPanel = ({
    isRunning,
    onStartSimulation,
    onStopSimulation,
    onUpdateParameters,
    onAddMaterial,
    simulationData
}) => {
    const [simulationParams, setSimulationParams] = useState({
        furnace_capacity: 150.0,
        simulation_duration: 3600.0,
        time_step: 1.0,
        arc_voltage: 400.0,
        arc_current: 50.0,
        power_factor: 0.8
    });

    const [operatingParams, setOperatingParams] = useState({
        arc_voltage: 400.0,
        arc_current: 50.0,
        power_factor: 0.8,
        electrode_position: 2.0,
        oxygen_flow_rate: 0.5,
        carbon_injection_rate: 0.1,
        lime_addition_rate: 0.05,
        dolomite_addition_rate: 0.03
    });

    const [materialData, setMaterialData] = useState({
        material_name: 'steel_scrap',
        amount: 100.0,
        zone: 'liquid_metal'
    });

    const handleStartSimulation = () => {
        onStartSimulation(simulationParams);
    };

    const handleStopSimulation = () => {
        onStopSimulation();
    };

    const handleParameterUpdate = () => {
        onUpdateParameters(operatingParams);
    };

    const handleAddMaterial = () => {
        onAddMaterial(materialData);
    };

    const updateSimulationParam = (key, value) => {
        setSimulationParams(prev => ({
            ...prev,
            [key]: parseFloat(value)
        }));
    };

    const updateOperatingParam = (key, value) => {
        setOperatingParams(prev => ({
            ...prev,
            [key]: parseFloat(value)
        }));
    };

    const updateMaterialData = (key, value) => {
        setMaterialData(prev => ({
            ...prev,
            [key]: key === 'amount' ? parseFloat(value) : value
        }));
    };

    return (
        <div className="control-panel">
            <div className="panel-section">
                <h3>Simulation Control</h3>

                <div className="control-group">
                    <label>Furnace Capacity (tons):</label>
                    <input
                        type="number"
                        value={simulationParams.furnace_capacity}
                        onChange={(e) => updateSimulationParam('furnace_capacity', e.target.value)}
                        min="50"
                        max="500"
                        step="10"
                    />
                </div>

                <div className="control-group">
                    <label>Duration (seconds):</label>
                    <input
                        type="number"
                        value={simulationParams.simulation_duration}
                        onChange={(e) => updateSimulationParam('simulation_duration', e.target.value)}
                        min="300"
                        max="7200"
                        step="300"
                    />
                </div>

                <div className="control-group">
                    <label>Time Step (seconds):</label>
                    <input
                        type="number"
                        value={simulationParams.time_step}
                        onChange={(e) => updateSimulationParam('time_step', e.target.value)}
                        min="0.1"
                        max="10"
                        step="0.1"
                    />
                </div>

                <div className="control-group">
                    <label>Arc Voltage (V):</label>
                    <input
                        type="number"
                        value={simulationParams.arc_voltage}
                        onChange={(e) => updateSimulationParam('arc_voltage', e.target.value)}
                        min="200"
                        max="800"
                        step="25"
                    />
                </div>

                <div className="control-group">
                    <label>Arc Current (kA):</label>
                    <input
                        type="number"
                        value={simulationParams.arc_current}
                        onChange={(e) => updateSimulationParam('arc_current', e.target.value)}
                        min="20"
                        max="100"
                        step="5"
                    />
                </div>

                <div className="control-group">
                    <label>Power Factor:</label>
                    <input
                        type="number"
                        value={simulationParams.power_factor}
                        onChange={(e) => updateSimulationParam('power_factor', e.target.value)}
                        min="0.7"
                        max="0.95"
                        step="0.05"
                    />
                </div>

                <div className="button-group">
                    {!isRunning ? (
                        <button
                            className="start-btn"
                            onClick={handleStartSimulation}
                        >
                            🚀 Start Simulation
                        </button>
                    ) : (
                        <button
                            className="stop-btn"
                            onClick={handleStopSimulation}
                        >
                            ⏹️ Stop Simulation
                        </button>
                    )}
                </div>
            </div>

            <div className="panel-section">
                <h3>Operating Parameters</h3>

                <div className="control-group">
                    <label>Arc Voltage (V):</label>
                    <input
                        type="number"
                        value={operatingParams.arc_voltage}
                        onChange={(e) => updateOperatingParam('arc_voltage', e.target.value)}
                        min="200"
                        max="800"
                        step="25"
                    />
                </div>

                <div className="control-group">
                    <label>Arc Current (kA):</label>
                    <input
                        type="number"
                        value={operatingParams.arc_current}
                        onChange={(e) => updateOperatingParam('arc_current', e.target.value)}
                        min="20"
                        max="100"
                        step="5"
                    />
                </div>

                <div className="control-group">
                    <label>Power Factor:</label>
                    <input
                        type="number"
                        value={operatingParams.power_factor}
                        onChange={(e) => updateOperatingParam('power_factor', e.target.value)}
                        min="0.7"
                        max="0.95"
                        step="0.05"
                    />
                </div>

                <div className="control-group">
                    <label>Electrode Position (m):</label>
                    <input
                        type="number"
                        value={operatingParams.electrode_position}
                        onChange={(e) => updateOperatingParam('electrode_position', e.target.value)}
                        min="1.0"
                        max="3.0"
                        step="0.1"
                    />
                </div>

                <div className="control-group">
                    <label>Oxygen Flow (m³/s):</label>
                    <input
                        type="number"
                        value={operatingParams.oxygen_flow_rate}
                        onChange={(e) => updateOperatingParam('oxygen_flow_rate', e.target.value)}
                        min="0.0"
                        max="2.0"
                        step="0.1"
                    />
                </div>

                <div className="control-group">
                    <label>Carbon Injection (kg/s):</label>
                    <input
                        type="number"
                        value={operatingParams.carbon_injection_rate}
                        onChange={(e) => updateOperatingParam('carbon_injection_rate', e.target.value)}
                        min="0.0"
                        max="0.5"
                        step="0.01"
                    />
                </div>

                <div className="control-group">
                    <label>Lime Addition (kg/s):</label>
                    <input
                        type="number"
                        value={operatingParams.lime_addition_rate}
                        onChange={(e) => updateOperatingParam('lime_addition_rate', e.target.value)}
                        min="0.0"
                        max="0.2"
                        step="0.01"
                    />
                </div>

                <div className="control-group">
                    <label>Dolomite Addition (kg/s):</label>
                    <input
                        type="number"
                        value={operatingParams.dolomite_addition_rate}
                        onChange={(e) => updateOperatingParam('dolomite_addition_rate', e.target.value)}
                        min="0.0"
                        max="0.1"
                        step="0.01"
                    />
                </div>

                <div className="button-group">
                    <button
                        className="update-btn"
                        onClick={handleParameterUpdate}
                        disabled={!isRunning}
                    >
                        🔄 Update Parameters
                    </button>
                </div>
            </div>

            <div className="panel-section">
                <h3>Material Management</h3>

                <div className="control-group">
                    <label>Material:</label>
                    <select
                        value={materialData.material_name}
                        onChange={(e) => updateMaterialData('material_name', e.target.value)}
                    >
                        <option value="steel_scrap">Steel Scrap</option>
                        <option value="dri">DRI (Direct Reduced Iron)</option>
                        <option value="lime">Lime (CaO)</option>
                        <option value="dolomite">Dolomite</option>
                        <option value="carbon">Carbon</option>
                        <option value="ferromanganese">Ferromanganese</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Amount (kg):</label>
                    <input
                        type="number"
                        value={materialData.amount}
                        onChange={(e) => updateMaterialData('amount', e.target.value)}
                        min="1"
                        max="10000"
                        step="1"
                    />
                </div>

                <div className="control-group">
                    <label>Zone:</label>
                    <select
                        value={materialData.zone}
                        onChange={(e) => updateMaterialData('zone', e.target.value)}
                    >
                        <option value="liquid_metal">Liquid Metal</option>
                        <option value="slag">Slag Layer</option>
                        <option value="arc">Arc Zone</option>
                    </select>
                </div>

                <div className="button-group">
                    <button
                        className="add-material-btn"
                        onClick={handleAddMaterial}
                        disabled={!isRunning}
                    >
                        ➕ Add Material
                    </button>
                </div>
            </div>

            {simulationData && (
                <div className="panel-section">
                    <h3>Current Status</h3>

                    <div className="status-grid">
                        <div className="status-item">
                            <span className="status-label">Metal Temp:</span>
                            <span className="status-value">
                                {Math.round(simulationData.zone_temperatures?.liquid_metal || 0)}°C
                            </span>
                        </div>

                        <div className="status-item">
                            <span className="status-label">Slag Temp:</span>
                            <span className="status-value">
                                {Math.round(simulationData.zone_temperatures?.slag || 0)}°C
                            </span>
                        </div>

                        <div className="status-item">
                            <span className="status-label">Current Power:</span>
                            <span className="status-value">
                                {Math.round(simulationData.current_power || 0)} kW
                            </span>
                        </div>

                        <div className="status-item">
                            <span className="status-label">Simulation Time:</span>
                            <span className="status-value">
                                {Math.round(simulationData.simulation_time || 0)}s
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ControlPanel;
