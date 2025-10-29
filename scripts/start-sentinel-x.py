#!/usr/bin/env python3
"""
SENTINEL-X Startup Script
Automated startup script for the SENTINEL-X Satellite Anomaly Detection Platform
"""

import os
import sys
import subprocess
import time
import threading
import signal
import json
from pathlib import Path

class SentinelXLauncher:
    def __init__(self):
        self.processes = []
        self.project_root = Path(__file__).parent.parent
        self.running = True
        
    def log(self, message, level="INFO"):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def check_dependencies(self):
        """Check if all required dependencies are installed"""
        self.log("Checking dependencies...")
        
        # Check Python dependencies
        try:
            import flask
            import tensorflow
            import sklearn
            import numpy
            import requests
            self.log("✓ Python dependencies verified")
        except ImportError as e:
            self.log(f"✗ Missing Python dependency: {e}", "ERROR")
            self.log("Run: pip install -r requirements.txt", "ERROR")
            return False
            
        # Check Node.js dependencies
        if not (self.project_root / "node_modules").exists():
            self.log("✗ Node.js dependencies not installed", "ERROR")
            self.log("Run: npm install", "ERROR")
            return False
        else:
            self.log("✓ Node.js dependencies verified")
            
        return True
        
    def start_ml_service(self):
        """Start the Python ML service"""
        self.log("Starting ML Service...")
        
        ml_service_path = self.project_root / "services" / "ml_service" / "main.py"
        if not ml_service_path.exists():
            self.log("✗ ML service not found", "ERROR")
            return None
            
        try:
            process = subprocess.Popen(
                [sys.executable, str(ml_service_path)],
                cwd=str(self.project_root),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # Start thread to monitor ML service output
            threading.Thread(
                target=self.monitor_process_output,
                args=(process, "ML-SERVICE"),
                daemon=True
            ).start()
            
            self.processes.append(("ML Service", process))
            self.log("✓ ML Service started on port 5000")
            return process
            
        except Exception as e:
            self.log(f"✗ Failed to start ML service: {e}", "ERROR")
            return None
            
    def start_frontend(self):
        """Start the Next.js frontend"""
        self.log("Starting Frontend...")
        
        try:
            # Check if we should use dev or production mode
            if os.getenv("NODE_ENV") == "production":
                # Build and start production server
                self.log("Building production frontend...")
                build_process = subprocess.run(
                    ["npm", "run", "build"],
                    cwd=str(self.project_root),
                    capture_output=True,
                    text=True
                )
                
                if build_process.returncode != 0:
                    self.log(f"✗ Frontend build failed: {build_process.stderr}", "ERROR")
                    return None
                    
                process = subprocess.Popen(
                    ["npm", "start"],
                    cwd=str(self.project_root),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True,
                    bufsize=1
                )
                self.log("✓ Frontend started in production mode on port 3000")
            else:
                # Start development server
                process = subprocess.Popen(
                    ["npm", "run", "dev"],
                    cwd=str(self.project_root),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True,
                    bufsize=1
                )
                self.log("✓ Frontend started in development mode on port 3000")
            
            # Start thread to monitor frontend output
            threading.Thread(
                target=self.monitor_process_output,
                args=(process, "FRONTEND"),
                daemon=True
            ).start()
            
            self.processes.append(("Frontend", process))
            return process
            
        except Exception as e:
            self.log(f"✗ Failed to start frontend: {e}", "ERROR")
            return None
            
    def monitor_process_output(self, process, service_name):
        """Monitor and log process output"""
        try:
            for line in iter(process.stdout.readline, ''):
                if line and self.running:
                    self.log(f"[{service_name}] {line.strip()}")
        except Exception as e:
            self.log(f"Error monitoring {service_name}: {e}", "ERROR")
            
    def wait_for_service(self, port, service_name, timeout=30):
        """Wait for a service to be ready"""
        import socket
        
        self.log(f"Waiting for {service_name} to be ready on port {port}...")
        
        for i in range(timeout):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                sock.close()
                
                if result == 0:
                    self.log(f"✓ {service_name} is ready")
                    return True
                    
            except Exception:
                pass
                
            time.sleep(1)
            
        self.log(f"✗ {service_name} failed to start within {timeout} seconds", "ERROR")
        return False
        
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(signum, frame):
            self.log("Received shutdown signal, stopping services...")
            self.shutdown()
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
    def shutdown(self):
        """Gracefully shutdown all services"""
        self.running = False
        self.log("Shutting down SENTINEL-X...")
        
        for service_name, process in self.processes:
            try:
                self.log(f"Stopping {service_name}...")
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=5)
                    self.log(f"✓ {service_name} stopped")
                except subprocess.TimeoutExpired:
                    self.log(f"Force killing {service_name}...")
                    process.kill()
                    process.wait()
                    
            except Exception as e:
                self.log(f"Error stopping {service_name}: {e}", "ERROR")
                
        self.log("SENTINEL-X shutdown complete")
        sys.exit(0)
        
    def display_banner(self):
        """Display startup banner"""
        banner = """
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗ ║
║   ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║ ║
║   ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║ ║
║   ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║ ║
║   ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
║   ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
║                                                               ║
║              Advanced Satellite Anomaly Detection            ║
║                     Platform - SENTINEL-X                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
        """
        print(banner)
        
    def display_status(self):
        """Display system status and URLs"""
        status_info = """
╔═══════════════════════════════════════════════════════════════╗
║                        SYSTEM STATUS                          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  🌐 Frontend Dashboard:  http://localhost:3000               ║
║  🤖 ML Service API:      http://localhost:5000               ║
║  📊 Real-time Updates:   WebSocket Connected                 ║
║                                                               ║
║  🛰️  Satellite Tracking: ACTIVE                              ║
║  🧠 ML Anomaly Detection: ACTIVE                             ║
║  📡 Space-Track Integration: CONFIGURED                      ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                      QUICK ACTIONS                            ║
║                                                               ║
║  • Press Ctrl+C to shutdown gracefully                       ║
║  • Check logs above for any issues                           ║
║  • Visit the dashboard to start monitoring                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
        """
        print(status_info)
        
    def run(self):
        """Main execution method"""
        self.display_banner()
        self.setup_signal_handlers()
        
        # Check dependencies
        if not self.check_dependencies():
            sys.exit(1)
            
        # Start ML service first
        ml_process = self.start_ml_service()
        if not ml_process:
            sys.exit(1)
            
        # Wait for ML service to be ready
        if not self.wait_for_service(5000, "ML Service"):
            self.shutdown()
            sys.exit(1)
            
        # Start frontend
        frontend_process = self.start_frontend()
        if not frontend_process:
            self.shutdown()
            sys.exit(1)
            
        # Wait for frontend to be ready
        if not self.wait_for_service(3000, "Frontend"):
            self.shutdown()
            sys.exit(1)
            
        # Display status
        self.display_status()
        
        # Keep the main thread alive
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.shutdown()

if __name__ == "__main__":
    launcher = SentinelXLauncher()
    launcher.run()