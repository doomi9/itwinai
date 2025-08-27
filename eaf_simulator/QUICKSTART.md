# 🚀 EAF Simulator - Quick Start Guide

Get the Electric Arc Furnace Simulator running in minutes!

## 📋 Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** (for cloning)

## 🚀 Quick Start (5 minutes)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd eaf_simulator

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Start Backend
```bash
# Start the backend server
python start_simulator.py

# Or manually:
cd src
python -m eaf_simulator.api.main
```

The backend will start on **http://localhost:8000**

### 3. Start Frontend
```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start React app
npm start
```

The frontend will open on **http://localhost:3000**

## 🎯 What You'll See

- **3D EAF Visualization**: Interactive furnace model with real-time updates
- **Control Panel**: Adjust operating parameters (voltage, current, power factor)
- **Real-time Monitoring**: Live temperature, power, and composition data
- **Charts & Analytics**: Performance metrics and historical data visualization

## 🔧 First Simulation

1. **Configure Parameters**:
   - Set furnace capacity (150-300 tons)
   - Choose arc voltage (400-600V) and current (40-80kA)
   - Set simulation duration (15-60 minutes)

2. **Start Simulation**:
   - Click "🚀 Start Simulation"
   - Watch real-time 3D visualization
   - Monitor temperature and power curves

3. **Control Operations**:
   - Adjust parameters during simulation
   - Add materials (scrap steel, DRI, flux)
   - Monitor chemical reactions

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check if port 8000 is free
lsof -i :8000  # On macOS/Linux
netstat -an | grep 8000  # On Windows

# Kill process if needed
kill -9 <PID>
```

### Frontend Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Common Errors
- **"Module not found"**: Make sure you're in the right directory
- **"Port already in use"**: Kill existing processes or change ports
- **"WebSocket connection failed"**: Ensure backend is running first

## 📚 Next Steps

- **Run Examples**: Check `examples/run_eaf_simulation.py`
- **Custom Models**: Modify `src/eaf_simulator/components.py`
- **Add Visualizations**: Extend `frontend/src/components/`
- **Scale Up**: Use Docker Compose for production deployment

## 🆘 Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the [examples](examples/) directory for usage patterns
- Open an issue for bugs or feature requests

---

**🎉 You're all set! Start exploring the world of Electric Arc Furnace simulation!**
