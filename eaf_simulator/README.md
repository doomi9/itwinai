# Electric Arc Furnace (EAF) Visual Simulator

A comprehensive, real-time visual simulator for Electric Arc Furnace operations built with itwinai framework and modern web technologies.

## 🚀 Features

### **Real-time Monitoring & Control**
- **Live temperature visualization** with heat maps and 3D models
- **Real-time process parameters** (voltage, current, power, temperature)
- **Interactive control panels** for all furnace operations
- **Dynamic material tracking** (scrap, DRI, slag, molten metal)

### **Advanced Simulation Engine**
- **Physics-based modeling** incorporating heat transfer, mass transfer, and chemical reactions
- **Multi-zone simulation** (arc zone, liquid metal, slag, refractory lining)
- **Chemical reaction modeling** (oxidation, reduction, slag formation)
- **Thermal dynamics** with radiative and convective heat transfer

### **Visualization & Analytics**
- **3D furnace visualization** with real-time updates
- **Process flow diagrams** showing material and energy flows
- **Performance metrics** and efficiency calculations
- **Historical data analysis** with trend visualization

### **Operational Features**
- **Recipe management** for different steel grades
- **Batch scheduling** and optimization
- **Safety monitoring** with alarm systems
- **Energy efficiency** tracking and recommendations

## 🏗️ Architecture

### **Backend (itwinai + Python)**
- **Simulation Engine**: Physics-based EAF modeling
- **Data Pipeline**: Real-time data processing and logging
- **API Layer**: RESTful endpoints for frontend communication
- **ML Integration**: Predictive modeling and optimization

### **Frontend (React + Three.js)**
- **3D Visualization**: Interactive furnace models
- **Control Panels**: Real-time parameter adjustment
- **Dashboard**: Comprehensive monitoring interface
- **Responsive Design**: Works on desktop and mobile

### **Data Management**
- **Real-time Database**: InfluxDB for time-series data
- **MLflow Integration**: Experiment tracking and model management
- **Data Export**: CSV, JSON, and visualization exports

## 🚀 Quick Start

### **Prerequisites**
- Python 3.10+
- Node.js 18+
- Docker (optional)

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd eaf_simulator

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd frontend
npm install

# Start the backend
python -m eaf_simulator.backend.main

# Start the frontend (in another terminal)
cd frontend
npm start
```

### **Docker Deployment**

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📊 Simulation Parameters

### **Furnace Specifications**
- **Capacity**: 100-300 tons
- **Power Rating**: 50-150 MVA
- **Electrode Diameter**: 500-700 mm
- **Operating Temperature**: 1500-1800°C

### **Material Properties**
- **Scrap Steel**: Various grades and compositions
- **DRI (Direct Reduced Iron)**: Carbon content and metallization
- **Slag Formers**: Lime, dolomite, fluorspar
- **Alloying Elements**: Manganese, chromium, nickel

### **Process Parameters**
- **Arc Voltage**: 200-800V
- **Arc Current**: 20-100 kA
- **Power Factor**: 0.7-0.9
- **Tap-to-tap Time**: 45-90 minutes

## 🎮 Usage Examples

### **Basic Operation**
1. **Start Simulation**: Initialize furnace with default parameters
2. **Load Materials**: Add scrap steel, DRI, and flux materials
3. **Start Melting**: Begin arc operation and monitor progress
4. **Control Process**: Adjust power, temperature, and chemistry
5. **Tapping**: Remove molten steel and prepare for next batch

### **Advanced Scenarios**
- **Grade Changes**: Switch between different steel specifications
- **Energy Optimization**: Minimize power consumption while maintaining quality
- **Quality Control**: Monitor and adjust chemical composition
- **Predictive Maintenance**: Use ML models to predict equipment issues

## 🔬 Scientific Background

This simulator incorporates the latest research in EAF modeling:

- **Heat Transfer**: Radiative and convective heat transfer between zones
- **Chemical Reactions**: Oxidation-reduction reactions in molten metal and slag
- **Mass Transfer**: Material flow between different furnace zones
- **Thermal Dynamics**: Temperature distribution and thermal efficiency

## 📈 Performance Metrics

### **Efficiency Indicators**
- **Specific Energy Consumption** (kWh/ton)
- **Power Factor** and electrical efficiency
- **Thermal Efficiency** and heat recovery
- **Material Yield** and metal recovery

### **Quality Metrics**
- **Chemical Composition** accuracy
- **Temperature Uniformity** across the bath
- **Slag Basicity** and refining efficiency
- **Inclusion Control** and cleanliness

## 🔌 Extensibility

### **Plugin System**
- **Custom Models**: Add new physical models
- **Data Sources**: Integrate with external systems
- **Visualization**: Create custom dashboards
- **Analytics**: Implement custom algorithms

### **API Integration**
- **REST API**: Full CRUD operations
- **WebSocket**: Real-time data streaming
- **GraphQL**: Flexible data querying
- **OAuth2**: Secure authentication

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
pytest tests/

# Code formatting
black src/
ruff check src/
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CERN** and **FZJ** for the itwinai framework
- **Imperial College London** for EAF modeling research
- **Colosseum Steelworks** team for domain expertise
- **Open source community** for the amazing tools and libraries

## 📞 Support

- **Documentation**: [Wiki](wiki/)
- **Issues**: [GitHub Issues](issues/)
- **Discussions**: [GitHub Discussions](discussions/)
- **Email**: support@eaf-simulator.com

---

**Built with ❤️ using itwinai framework for scientific computing**
