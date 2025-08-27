#!/usr/bin/env python3
"""
EAF Simulator Startup Script

This script starts both the backend API server and provides instructions
for starting the frontend React application.
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

def print_banner():
    """Print the EAF Simulator banner"""
    print("🔥" * 50)
    print("🔥 Electric Arc Furnace Simulator 🔥")
    print("🔥" * 50)
    print()

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Add src directory to Python path to find our mock itwinai
    src_path = Path(__file__).parent / "src"
    sys.path.insert(0, str(src_path))
    
    try:
        import itwinai
        print("✅ itwinai framework found (using local mock version)")
    except ImportError:
        print("❌ itwinai framework not found")
        print("   Please install itwinai: pip install itwinai")
        return False
    
    try:
        import fastapi
        print("✅ FastAPI found")
    except ImportError:
        print("❌ FastAPI not found")
        print("   Please install FastAPI: pip install fastapi uvicorn")
        return False
    
    try:
        import numpy
        print("✅ NumPy found")
    except ImportError:
        print("❌ NumPy not found")
        print("   Please install NumPy: pip install numpy")
        return False
    
    try:
        import pandas
        print("✅ Pandas found")
    except ImportError:
        print("❌ Pandas not found")
        print("   Please install Pandas: pip install pandas")
        return False
    
    print("✅ All Python dependencies are available")
    return True

def start_backend():
    """Start the backend API server"""
    print("\n🚀 Starting EAF Simulator Backend...")
    
    # Add src directory to Python path
    src_path = Path(__file__).parent / "src"
    sys.path.insert(0, str(src_path))
    
    try:
        # Import and start the FastAPI app
        from eaf_simulator.api.main import app
        import uvicorn
        
        print("✅ Backend server starting on http://localhost:8000")
        print("📚 API documentation will be available at http://localhost:8000/docs")
        print("🌐 Health check available at http://localhost:8000/api/health")
        print()
        print("Press Ctrl+C to stop the backend server")
        print()
        
        # Start the server
        uvicorn.run(
            "eaf_simulator.api.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
        
    except ImportError as e:
        print(f"❌ Failed to import backend modules: {e}")
        print("   Make sure you're running from the correct directory")
        return False
    except Exception as e:
        print(f"❌ Failed to start backend server: {e}")
        return False

def show_frontend_instructions():
    """Show instructions for starting the frontend"""
    print("\n🎨 Frontend Setup Instructions:")
    print("=" * 50)
    print("1. Open a new terminal window")
    print("2. Navigate to the frontend directory:")
    print("   cd frontend")
    print("3. Install Node.js dependencies:")
    print("   npm install")
    print("4. Start the React development server:")
    print("   npm start")
    print("5. The frontend will open automatically at http://localhost:3000")
    print()
    print("💡 Tip: Keep both terminal windows open - one for backend, one for frontend")
    print()

def main():
    """Main startup function"""
    print_banner()
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Please install missing dependencies and try again")
        return
    
    # Show frontend instructions
    show_frontend_instructions()
    
    # Ask user if they want to start backend now
    response = input("🚀 Start the backend server now? (y/n): ").lower().strip()
    
    if response in ['y', 'yes']:
        print("\n" + "="*50)
        start_backend()
    else:
        print("\n📋 Manual startup instructions:")
        print("1. Backend: python start_simulator.py")
        print("2. Frontend: cd frontend && npm start")
        print("\n🎉 Happy simulating!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 EAF Simulator startup interrupted")
        print("👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("Please check the error message and try again")
