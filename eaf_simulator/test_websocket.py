#!/usr/bin/env python3
"""
Simple WebSocket test script for EAF Simulator
Tests the WebSocket connection to verify it's working
"""

import asyncio
import websockets
import json

async def test_websocket():
    """Test WebSocket connection to EAF Simulator"""
    uri = "ws://localhost:8000/ws"
    
    try:
        print("🔌 Testing WebSocket connection to EAF Simulator...")
        print(f"📍 Connecting to: {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Wait for a message
            print("⏳ Waiting for data...")
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Received message: {message}")
                
                # Try to parse as JSON
                try:
                    data = json.loads(message)
                    print(f"📊 Parsed data: {json.dumps(data, indent=2)}")
                except json.JSONDecodeError:
                    print("⚠️  Message is not valid JSON")
                    
            except asyncio.TimeoutError:
                print("⏰ Timeout waiting for message (this is normal if no simulation is running)")
            
            print("✅ WebSocket test completed successfully!")
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ Connection refused - WebSocket server not running")
    except Exception as e:
        print(f"❌ WebSocket test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 EAF Simulator WebSocket Test")
    print("=" * 40)
    
    # Run the test
    asyncio.run(test_websocket())
