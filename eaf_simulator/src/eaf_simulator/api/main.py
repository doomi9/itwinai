"""
FastAPI Backend for EAF Simulator

This module provides a RESTful API for controlling and monitoring
the Electric Arc Furnace simulation in real-time.
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd

from ..components import (
    EAFSimulationEngine,
    EAFParameters,
    EAFZone,
    EAFMaterial
)
from ..pipeline import EAFSimulationPipeline


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        if self.active_connections:
            # Remove closed connections
            self.active_connections = [conn for conn in self.active_connections if not conn.client_state.disconnected]
            
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send message to WebSocket: {str(e)}")
                    # Remove failed connection
                    if connection in self.active_connections:
                        self.active_connections.remove(connection)

# Initialize connection manager
manager = ConnectionManager()

# Initialize FastAPI app
app = FastAPI(
    title="EAF Simulator API",
    description="Real-time control and monitoring API for Electric Arc Furnace simulation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulation state
simulation_engine: Optional[EAFSimulationEngine] = None
simulation_task: Optional[asyncio.Task] = None
websocket_connections: List[WebSocket] = []


# Pydantic models for API requests/responses
class SimulationStartRequest(BaseModel):
    furnace_capacity: float = Field(150.0, description="Furnace capacity in tons")
    simulation_duration: float = Field(3600.0, description="Simulation duration in seconds")
    time_step: float = Field(1.0, description="Time step in seconds")
    arc_voltage: float = Field(400.0, description="Arc voltage in Volts")
    arc_current: float = Field(50.0, description="Arc current in Amperes")
    power_factor: float = Field(0.8, description="Power factor")


class ParameterUpdateRequest(BaseModel):
    arc_voltage: Optional[float] = None
    arc_current: Optional[float] = None
    power_factor: Optional[float] = None
    electrode_position: Optional[float] = None
    oxygen_flow_rate: Optional[float] = None
    carbon_injection_rate: Optional[float] = None
    lime_addition_rate: Optional[float] = None
    dolomite_addition_rate: Optional[float] = None


class MaterialAdditionRequest(BaseModel):
    material_name: str = Field(..., description="Name of material to add")
    amount: float = Field(..., description="Amount to add in kg")
    zone: str = Field("liquid_metal", description="Zone to add material to")


class SimulationStatus(BaseModel):
    is_running: bool
    current_time: float
    total_duration: float
    progress_percentage: float
    current_temperature: float
    current_power: float


class ZoneStatus(BaseModel):
    name: str
    temperature: float
    mass: float
    materials: Dict[str, float]


class SimulationResults(BaseModel):
    status: str
    data: Dict[str, Any]
    message: str


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "EAF Simulator API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "simulation": "/api/simulation",
            "control": "/api/control",
            "monitoring": "/api/monitoring",
            "websocket": "/ws"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "simulation_running": simulation_engine is not None and simulation_engine.is_running
    }


@app.post("/api/simulation/start")
async def start_simulation(request: SimulationStartRequest):
    """Start a new EAF simulation"""
    global simulation_engine, simulation_task
    
    try:
        # Create new simulation engine
        simulation_engine = EAFSimulationEngine(
            furnace_capacity=request.furnace_capacity,
            simulation_duration=request.simulation_duration,
            time_step=request.time_step
        )
        
        # Set initial operating parameters
        params = EAFParameters(
            arc_voltage=request.arc_voltage,
            arc_current=request.arc_current,
            power_factor=request.power_factor,
            electrode_position=2.0,
            oxygen_flow_rate=0.5,
            carbon_injection_rate=0.1,
            lime_addition_rate=0.05,
            dolomite_addition_rate=0.03
        )
        simulation_engine.set_operating_parameters(params)
        
        # Start simulation in background
        simulation_task = asyncio.create_task(run_simulation())
        
        logger.info(f"Simulation started with capacity: {request.furnace_capacity} tons")
        
        return {
            "status": "success",
            "message": "Simulation started successfully",
            "simulation_id": id(simulation_engine),
            "parameters": request.dict()
        }
        
    except Exception as e:
        logger.error(f"Failed to start simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulation/stop")
async def stop_simulation():
    """Stop the current simulation"""
    global simulation_engine, simulation_task
    
    if simulation_engine is None:
        raise HTTPException(status_code=400, detail="No simulation running")
    
    try:
        simulation_engine.stop_simulation()
        if simulation_task:
            simulation_task.cancel()
        
        logger.info("Simulation stopped by user")
        
        return {
            "status": "success",
            "message": "Simulation stopped successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to stop simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/simulation/status")
async def get_simulation_status():
    """Get current simulation status"""
    global simulation_engine
    
    if simulation_engine is None:
        return SimulationStatus(
            is_running=False,
            current_time=0.0,
            total_duration=0.0,
            progress_percentage=0.0,
            current_temperature=0.0,
            current_power=0.0
        )
    
    try:
        current_temp = simulation_engine.zones['liquid_metal'].temperature
        current_power = simulation_engine._calculate_arc_power()
        progress = (simulation_engine.current_time / simulation_engine.simulation_duration) * 100
        
        return SimulationStatus(
            is_running=simulation_engine.is_running,
            current_time=simulation_engine.current_time,
            total_duration=simulation_engine.simulation_duration,
            progress_percentage=progress,
            current_temperature=current_temp,
            current_power=current_power
        )
        
    except Exception as e:
        logger.error(f"Failed to get simulation status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/simulation/zones")
async def get_zone_status():
    """Get status of all furnace zones"""
    global simulation_engine
    
    if simulation_engine is None:
        raise HTTPException(status_code=400, detail="No simulation running")
    
    try:
        zones = []
        for zone_name, zone in simulation_engine.zones.items():
            zones.append(ZoneStatus(
                name=zone.name,
                temperature=zone.temperature,
                mass=zone.mass,
                materials=zone.materials
            ))
        
        return {"zones": zones}
        
    except Exception as e:
        logger.error(f"Failed to get zone status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/control/parameters")
async def update_parameters(request: ParameterUpdateRequest):
    """Update operating parameters during simulation"""
    global simulation_engine
    
    if simulation_engine is None:
        raise HTTPException(status_code=400, detail="No simulation running")
    
    try:
        # Get current parameters
        current_params = simulation_engine.operating_params
        
        # Update only provided parameters
        update_dict = request.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(current_params, key, value)
        
        # Apply updated parameters
        simulation_engine.set_operating_parameters(current_params)
        
        logger.info(f"Parameters updated: {update_dict}")
        
        return {
            "status": "success",
            "message": "Parameters updated successfully",
            "updated_parameters": update_dict
        }
        
    except Exception as e:
        logger.error(f"Failed to update parameters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/control/materials")
async def add_material(request: MaterialAdditionRequest):
    """Add material to a specific zone"""
    global simulation_engine
    
    if simulation_engine is None:
        raise HTTPException(status_code=400, detail="No simulation running")
    
    try:
        simulation_engine.add_material(
            material_name=request.material_name,
            amount=request.amount,
            zone=request.zone
        )
        
        logger.info(f"Added {request.amount} kg of {request.material_name} to {request.zone}")
        
        return {
            "status": "success",
            "message": f"Added {request.amount} kg of {request.material_name} to {request.zone}"
        }
        
    except Exception as e:
        logger.error(f"Failed to add material: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/monitoring/real-time")
async def get_real_time_data():
    """Get real-time monitoring data"""
    global simulation_engine
    
    if simulation_engine is None:
        raise HTTPException(status_code=400, detail="No simulation running")
    
    try:
        # Get current simulation data
        current_data = simulation_engine._record_simulation_data()
        
        # Get zone temperatures
        zone_temperatures = {
            name: zone.temperature for name, zone in simulation_engine.zones.items()
        }
        
        # Get operating parameters
        params = simulation_engine.operating_params
        
        return {
            "timestamp": datetime.now().isoformat(),
            "simulation_time": simulation_engine.current_time,
            "zone_temperatures": zone_temperatures,
            "operating_parameters": {
                "arc_voltage": params.arc_voltage,
                "arc_current": params.arc_current,
                "power_factor": params.power_factor,
                "electrode_position": params.electrode_position
            },
            "current_power": simulation_engine._calculate_arc_power()
        }
        
    except Exception as e:
        logger.error(f"Failed to get real-time data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/monitoring/history")
async def get_simulation_history():
    """Get simulation history data"""
    global simulation_engine
    
    if simulation_engine is None:
        raise HTTPException(status_code=400, detail="No simulation running")
    
    try:
        # Convert simulation data to DataFrame for easier manipulation
        df = pd.DataFrame(simulation_engine.simulation_data)
        
        if df.empty:
            return {"data": [], "message": "No simulation data available yet"}
        
        # Return last 100 data points
        recent_data = df.tail(100).to_dict('records')
        
        return {
            "data": recent_data,
            "total_points": len(df),
            "time_range": {
                "start": df['timestamp'].min(),
                "end": df['timestamp'].max()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get simulation history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time simulation updates"""
    await manager.connect(websocket)
    
    try:
        # Send immediate connection confirmation
        connection_msg = {
            "type": "connection_status",
            "status": "connected",
            "timestamp": datetime.now().isoformat(),
            "message": "WebSocket connected successfully"
        }
        await websocket.send_text(json.dumps(connection_msg))
        
        while True:
            # Send real-time updates every second
            if simulation_engine and simulation_engine.is_running:
                data = await get_real_time_data()
                # Add message type for frontend to distinguish
                data["type"] = "simulation_data"
                await websocket.send_text(json.dumps(data))
            else:
                # Send heartbeat to keep connection alive
                heartbeat_msg = {
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat(),
                    "simulation_running": simulation_engine is not None and simulation_engine.is_running
                }
                await websocket.send_text(json.dumps(heartbeat_msg))
            
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket)


# Background task for running simulation
async def run_simulation():
    """Run the simulation in the background"""
    global simulation_engine
    
    try:
        while simulation_engine and simulation_engine.is_running:
            # Update simulation step
            simulation_engine._update_simulation_step()
            
            # Record data
            simulation_engine._record_simulation_data()
            
            # Broadcast update to WebSocket clients
            if manager.active_connections:
                try:
                    data = await get_real_time_data()
                    await manager.broadcast(json.dumps(data))
                except Exception as e:
                    logger.error(f"Failed to broadcast update: {str(e)}")
            
            # Advance time
            simulation_engine.current_time += simulation_engine.time_step
            
            # Check if simulation is complete
            if simulation_engine.current_time >= simulation_engine.simulation_duration:
                simulation_engine.is_running = False
                break
            
            # Wait for next time step
            await asyncio.sleep(simulation_engine.time_step)
            
    except asyncio.CancelledError:
        logger.info("Simulation task cancelled")
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
    finally:
        if simulation_engine:
            simulation_engine.is_running = False


# Mount static files for frontend
# app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    # Run the FastAPI server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
