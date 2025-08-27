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

    const [materialInput, setMaterialInput] = useState({
        material_name: '',
        amount: 0,
        zone: 'liquid_metal'
    });

    const handleSimulationParamChange = (field, value) => {
        setSimulationParams(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const handleOperatingParamChange = (field, value) => {
        setOperatingParams(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const handleStartSimulation = () => {
        onStartSimulation(simulationParams);
    };

    const handleStopSimulation = () => {
        onStopSimulation();
    };

    const handleUpdateParameters = () => {
        onUpdateParameters(operatingParams);
    };

    const handleMaterialInputChange = (field, value) => {
        setMaterialInput(prev => ({
            ...prev,
            [field]: field === 'amount' ? parseFloat(value) || 0 : value
        }));
    };

    const handleAddMaterial = () => {
        if (materialInput.material_name && materialInput.amount > 0) {
            onAddMaterial(materialInput);
            setMaterialInput({
                material_name: '',
                amount: 0,
                zone: 'liquid_metal'
            });
        }
    };

    const getCurrentPower = () => {
        if (!simulationData) return 0;
        return (operatingParams.arc_voltage * operatingParams.arc_current * operatingParams.power_factor) / 1000;
    };

    const getCurrentEfficiency = () => {
        if (!simulationData) return 0;
        // Simplified efficiency calculation
        const power = getCurrentPower();
        if (power === 0) return 0;
        return Math.min(95, Math.max(70, 85 + (power - 20) * 0.5));
    };

    return (
        <div className="control-panel">
            <h2 className="control-panel-title">Simulation Controls</h2>

            {/* Simulation Setup */}
            <div className="control-section">
                <h3 className="control-section-title">Simulation Setup</h3>
                <div className="control-grid control-grid-3">
                    <div className="control-input-group">
                        <label>Furnace Capacity (tons)</label>
                        <input
                            type="number"
                            value={simulationParams.furnace_capacity}
                            onChange={(e) => handleSimulationParamChange('furnace_capacity', e.target.value)}
                            step="0.1"
                            min="10"
                            max="500"
                        />
                    </div>
                    <div className="control-input-group">
                        <label>Duration (seconds)</label>
                        <input
                            type="number"
                            value={simulationParams.simulation_duration}
                            onChange={(e) => handleSimulationParamChange('simulation_duration', e.target.value)}
                            step="1"
                            min="60"
                            max="7200"
                        />
                    </div>
                    <div className="control-input-group">
                        <label>Time Step (seconds)</label>
                        <input
                            type="number"
                            value={simulationParams.time_step}
                            onChange={(e) => handleSimulationParamChange('time_step', e.target.value)}
                            step="0.1"
                            min="0.1"
                            max="10"
                        />
                    </div>
                </div>
            </div>

            {/* Operating Parameters */}
            <div className="control-section">
                <h3 className="control-section-title">Operating Parameters</h3>
                <div className="control-grid control-grid-2">
                    <div className="control-input-group">
                        <label>Arc Voltage (V)</label>
                        <input
                            type="number"
                            value={operatingParams.arc_voltage}
                            onChange={(e) => handleOperatingParamChange('arc_voltage', e.target.value)}
                            step="1"
                            min="200"
                            max="800"
                        />
                    </div>
                    <div className="control-input-group">
                        <label>Arc Current (kA)</label>
                        <input
                            type="number"
                            value={operatingParams.arc_current}
                            onChange={(e) => handleOperatingParamChange('arc_current', e.target.value)}
                            step="0.1"
                            min="20"
                            max="100"
                        />
                    </div>
                    <div className="control-input-group">
                        <label>Power Factor</label>
                        <input
                            type="number"
                            value={operatingParams.power_factor}
                            onChange={(e) => handleOperatingParamChange('power_factor', e.target.value)}
                            step="0.01"
                            min="0.5"
                            max="1.0"
                        />
                    </div>
                    <div className="control-input-group">
                        <label>Electrode Position (m)</label>
                        <input
                            type="number"
                            value={operatingParams.electrode_position}
                            onChange={(e) => handleOperatingParamChange('electrode_position', e.target.value)}
                            step="0.1"
                            min="0.5"
                            max="5.0"
                        />
                    </div>
                </div>
            </div>

            {/* Material Injection */}
            <div className="control-section">
                <h3 className="control-section-title">Material Injection</h3>
                <div className="control-grid control-grid-2">
                    <div className="control-input-group">
                        <label>Oxygen Flow Rate (m³/min)</label>
                        <input
                            type="number"
                            value={operatingParams.oxygen_flow_rate}
                            onChange={(e) => handleOperatingParamChange('oxygen_flow_rate', e.target.value)}
                            step="0.1"
                            min="0"
                            max="5"
                        />
                    </div>
                    <div className="control-input-group">
                        <label>Carbon Injection (kg/min)</label>
                        <input
                            type="number"
                            value={operatingParams.carbon_injection_rate}
                            onChange={(e) => handleOperatingParamChange('carbon_injection_rate', e.target.value)}
                            step="0.01"
                            min="0"
                            max="1"
                        />
                    </div>
                    <div className="control-input-group">
                        <label>Lime Addition (kg/min)</label>
                        <input
                            type="number"
                            value={operatingParams.lime_addition_rate}
                            onChange={(e) => handleOperatingParamChange('lime_addition_rate', e.target.value)}
                            step="0.01"
                            min="0"
                            max="1"
                        />
                    </div>
                    <div className="control-input-group">
                        <label>Dolomite Addition (kg/min)</label>
                        <input
                            type="number"
                            value={operatingParams.dolomite_addition_rate}
                            onChange={(e) => handleOperatingParamChange('dolomite_addition_rate', e.target.value)}
                            step="0.01"
                            min="0"
                            max="1"
                        />
                    </div>
                </div>
            </div>

            {/* Current Parameters Display */}
            <div className="parameter-display">
                <div className="parameter-display-title">Current Parameters</div>
                <div className="parameter-grid">
                    <div className="parameter-item">
                        <div className="parameter-value">{getCurrentPower().toFixed(1)}</div>
                        <div className="parameter-unit">MW</div>
                    </div>
                    <div className="parameter-item">
                        <div className="parameter-value">{getCurrentEfficiency().toFixed(1)}</div>
                        <div className="parameter-unit">%</div>
                    </div>
                    <div className="parameter-item">
                        <div className="parameter-value">{operatingParams.arc_voltage}</div>
                        <div className="parameter-unit">V</div>
                    </div>
                    <div className="parameter-item">
                        <div className="parameter-value">{operatingParams.arc_current}</div>
                        <div className="parameter-unit">kA</div>
                    </div>
                </div>
            </div>

            {/* Material Addition */}
            <div className="material-controls">
                <h3 className="material-controls-title">Add Material</h3>
                <div className="material-input-row">
                    <input
                        type="text"
                        placeholder="Material name (e.g., Fe, C, Si)"
                        value={materialInput.material_name}
                        onChange={(e) => handleMaterialInputChange('material_name', e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Amount (kg)"
                        value={materialInput.amount}
                        onChange={(e) => handleMaterialInputChange('amount', e.target.value)}
                        min="0"
                        step="0.1"
                    />
                    <select
                        value={materialInput.zone}
                        onChange={(e) => handleMaterialInputChange('zone', e.target.value)}
                    >
                        <option value="liquid_metal">Liquid Metal</option>
                        <option value="slag">Slag</option>
                        <option value="refractory">Refractory</option>
                    </select>
                    <button 
                        className="add-material-button"
                        onClick={handleAddMaterial}
                        disabled={!materialInput.material_name || materialInput.amount <= 0}
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Control Buttons */}
            <div className="control-buttons">
                {!isRunning ? (
                    <button 
                        className="control-button primary"
                        onClick={handleStartSimulation}
                    >
                        Start Simulation
                    </button>
                ) : (
                    <button 
                        className="control-button danger"
                        onClick={handleStopSimulation}
                    >
                        Stop Simulation
                    </button>
                )}
                
                <button 
                    className="control-button secondary"
                    onClick={handleUpdateParameters}
                    disabled={!isRunning}
                >
                    Update Parameters
                </button>
            </div>
        </div>
    );
};

export default ControlPanel;
