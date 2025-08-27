#!/bin/bash

# Electric Arc Furnace Simulator - Quick Start Script
# This script sets up and runs the EAF simulator

set -e

echo "🔥 Electric Arc Furnace Simulator - Quick Start"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        print_success "Python 3 found: $(python3 --version)"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
        print_success "Python found: $(python --version)"
    else
        print_error "Python is not installed. Please install Python 3.8+ first."
        exit 1
    fi
}

# Check if pip is installed
check_pip() {
    print_status "Checking pip installation..."
    if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
        print_error "pip is not installed. Please install pip first."
        exit 1
    fi
    print_success "pip found"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        print_success "Node.js found: $(node --version)"
    else
        print_warning "Node.js not found. Frontend will not be available."
        NODE_AVAILABLE=false
    fi
}

# Create virtual environment
create_venv() {
    print_status "Creating Python virtual environment..."
    if [ ! -d ".venv" ]; then
        $PYTHON_CMD -m venv .venv
        print_success "Virtual environment created"
    else
        print_status "Virtual environment already exists"
    fi
}

# Activate virtual environment
activate_venv() {
    print_status "Activating virtual environment..."
    source .venv/bin/activate
    print_success "Virtual environment activated"
}

# Install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Python dependencies installed"
}

# Install Node.js dependencies
install_node_deps() {
    if [ "$NODE_AVAILABLE" = true ]; then
        print_status "Installing Node.js dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Node.js dependencies installed"
    fi
}

# Create configuration files
create_configs() {
    print_status "Creating configuration files..."
    
    # Create example config if it doesn't exist
    if [ ! -f "eaf_config.yaml" ]; then
        cat > eaf_config.yaml << EOF
# EAF Simulator Configuration
furnace_capacity: 150.0  # tons
simulation_duration: 3600.0  # seconds (1 hour)
time_step: 1.0  # seconds

operating_parameters:
  arc_voltage: 400.0  # Volts
  arc_current: 50.0   # Amperes
  power_factor: 0.8
  electrode_position: 2.0  # meters
  oxygen_flow_rate: 0.5    # m³/s
  carbon_injection_rate: 0.1  # kg/s
  lime_addition_rate: 0.05    # kg/s
  dolomite_addition_rate: 0.03  # kg/s

materials:
  initial_scrap: 100.0  # tons
  initial_dri: 50.0     # tons
  lime_reserve: 10.0    # tons
  dolomite_reserve: 5.0 # tons

monitoring:
  log_interval: 1.0     # seconds
  save_interval: 60.0   # seconds
  alert_thresholds:
    max_temperature: 2000.0  # Kelvin
    min_temperature: 298.0   # Kelvin
    max_power: 100000.0      # Watts
    min_carbon: 0.01         # mass fraction
EOF
        print_success "Configuration file created: eaf_config.yaml"
    fi
    
    # Create .env file
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# EAF Simulator Environment Variables
ITWINAI_LOG_LEVEL=INFO
REACT_APP_API_URL=http://localhost:8000
MLFLOW_TRACKING_URI=http://localhost:5000
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=admin-token-123
INFLUXDB_ORG=eaf-simulator
INFLUXDB_BUCKET=eaf-data
EOF
        print_success "Environment file created: .env"
    fi
}

# Run example simulation
run_example() {
    print_status "Running example simulation..."
    
    # Check if example script exists
    if [ -f "examples/run_eaf_simulation.py" ]; then
        $PYTHON_CMD examples/run_eaf_simulation.py
        print_success "Example simulation completed"
    else
        print_warning "Example script not found, skipping example run"
    fi
}

# Start backend server
start_backend() {
    print_status "Starting backend server..."
    print_status "Backend will be available at: http://localhost:8000"
    print_status "API documentation: http://localhost:8000/docs"
    
    # Start in background
    nohup $PYTHON_CMD -m eaf_simulator.api.main > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server is running
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend server started successfully"
    else
        print_error "Backend server failed to start. Check backend.log for details."
        exit 1
    fi
}

# Start frontend (if available)
start_frontend() {
    if [ "$NODE_AVAILABLE" = true ]; then
        print_status "Starting frontend..."
        print_status "Frontend will be available at: http://localhost:3000"
        
        # Start in background
        cd frontend
        nohup npm start > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../frontend.pid
        cd ..
        
        # Wait a moment for frontend to start
        sleep 5
        
        print_success "Frontend started successfully"
    else
        print_warning "Frontend not available (Node.js not installed)"
    fi
}

# Show status
show_status() {
    echo ""
    echo "🎉 EAF Simulator is now running!"
    echo "================================="
    echo ""
    echo "🌐 Backend API:    http://localhost:8000"
    echo "📚 API Docs:       http://localhost:8000/docs"
    
    if [ "$NODE_AVAILABLE" = true ]; then
        echo "🎨 Frontend:        http://localhost:3000"
    fi
    
    echo ""
    echo "📊 MLflow UI:      http://localhost:5000"
    echo "📈 InfluxDB:       http://localhost:8086"
    echo ""
    echo "📁 Log files:"
    echo "   - Backend:       backend.log"
    echo "   - Frontend:      frontend.log"
    echo ""
    echo "🛑 To stop the simulator:"
    echo "   ./stop_simulator.sh"
    echo ""
    echo "📖 For more information, see README.md"
}

# Main execution
main() {
    # Initialize variables
    NODE_AVAILABLE=true
    
    # Check prerequisites
    check_python
    check_pip
    check_node
    
    # Setup environment
    create_venv
    activate_venv
    install_python_deps
    install_node_deps
    
    # Create configurations
    create_configs
    
    # Run example (optional)
    read -p "Do you want to run an example simulation first? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_example
    fi
    
    # Start services
    start_backend
    start_frontend
    
    # Show final status
    show_status
}

# Run main function
main "$@"
