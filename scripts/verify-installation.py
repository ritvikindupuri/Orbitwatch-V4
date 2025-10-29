#!/usr/bin/env python3
"""
SENTINEL-X Installation Verification Script
This script verifies that all dependencies and configurations are properly set up.
"""

import sys
import os
import subprocess
import importlib
import requests
from datetime import datetime

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_status(check, status, message=""):
    """Print a status line with check mark or X"""
    symbol = "✓" if status else "✗"
    color = "\033[92m" if status else "\033[91m"  # Green or Red
    reset = "\033[0m"
    print(f"{color}{symbol}{reset} {check}: {message}")
    return status

def check_python_version():
    """Check Python version"""
    print_header("Python Environment Check")
    version = sys.version_info
    required_major, required_minor = 3, 9
    
    version_ok = version.major >= required_major and version.minor >= required_minor
    print_status("Python Version", version_ok, 
                f"{version.major}.{version.minor}.{version.micro} (Required: {required_major}.{required_minor}+)")
    return version_ok

def check_python_packages():
    """Check required Python packages"""
    print_header("Python Dependencies Check")
    
    required_packages = [
        ("flask", "Flask"),
        ("flask_socketio", "Flask-SocketIO"),
        ("tensorflow", "TensorFlow"),
        ("sklearn", "scikit-learn"),
        ("numpy", "NumPy"),
        ("requests", "Requests")
    ]
    
    all_ok = True
    for package_name, display_name in required_packages:
        try:
            module = importlib.import_module(package_name)
            version = getattr(module, '__version__', 'Unknown')
            print_status(display_name, True, f"v{version}")
        except ImportError:
            print_status(display_name, False, "Not installed")
            all_ok = False
    
    return all_ok

def check_node_environment():
    """Check Node.js and npm"""
    print_header("Node.js Environment Check")
    
    try:
        # Check Node.js
        node_result = subprocess.run(['node', '--version'], 
                                   capture_output=True, text=True, timeout=10)
        if node_result.returncode == 0:
            node_version = node_result.stdout.strip()
            node_ok = True
            print_status("Node.js", True, node_version)
        else:
            node_ok = False
            print_status("Node.js", False, "Not found")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        node_ok = False
        print_status("Node.js", False, "Not found or not responding")
    
    try:
        # Check npm
        npm_result = subprocess.run(['npm', '--version'], 
                                  capture_output=True, text=True, timeout=10)
        if npm_result.returncode == 0:
            npm_version = npm_result.stdout.strip()
            npm_ok = True
            print_status("npm", True, f"v{npm_version}")
        else:
            npm_ok = False
            print_status("npm", False, "Not found")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        npm_ok = False
        print_status("npm", False, "Not found or not responding")
    
    return node_ok and npm_ok

def check_environment_variables():
    """Check required environment variables"""
    print_header("Environment Variables Check")
    
    username = os.getenv('SPACE_TRACK_USERNAME')
    password = os.getenv('SPACE_TRACK_PASSWORD')
    
    username_ok = print_status("SPACE_TRACK_USERNAME", bool(username), 
                              "Set" if username else "Not set")
    password_ok = print_status("SPACE_TRACK_PASSWORD", bool(password), 
                              "Set" if password else "Not set")
    
    return username_ok and password_ok

def check_space_track_connection():
    """Test Space-Track.org API connection"""
    print_header("Space-Track.org API Check")
    
    username = os.getenv('SPACE_TRACK_USERNAME')
    password = os.getenv('SPACE_TRACK_PASSWORD')
    
    if not username or not password:
        print_status("API Connection", False, "Credentials not configured")
        return False
    
    try:
        session = requests.Session()
        auth_url = "https://www.space-track.org/ajaxauth/login"
        auth_payload = {'identity': username, 'password': password}
        
        print("Testing authentication...")
        response = session.post(auth_url, data=auth_payload, timeout=30)
        
        if response.status_code == 200:
            print_status("Authentication", True, "Successful")
            
            # Test a simple data request
            test_url = "https://www.space-track.org/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/25544/format/json"
            test_response = session.get(test_url, timeout=30)
            
            if test_response.status_code == 200:
                data = test_response.json()
                if data:
                    print_status("Data Retrieval", True, f"Retrieved {len(data)} records")
                    return True
                else:
                    print_status("Data Retrieval", False, "No data returned")
                    return False
            else:
                print_status("Data Retrieval", False, f"HTTP {test_response.status_code}")
                return False
        else:
            print_status("Authentication", False, f"HTTP {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print_status("API Connection", False, "Connection timeout")
        return False
    except requests.exceptions.ConnectionError:
        print_status("API Connection", False, "Connection error")
        return False
    except Exception as e:
        print_status("API Connection", False, f"Error: {str(e)}")
        return False

def check_file_structure():
    """Check required files and directories"""
    print_header("File Structure Check")
    
    required_files = [
        "package.json",
        "requirements.txt",
        "app/page.tsx",
        "services/ml_service/main.py",
        "components/ui/tabs.tsx"
    ]
    
    all_ok = True
    for file_path in required_files:
        exists = os.path.exists(file_path)
        print_status(file_path, exists, "Found" if exists else "Missing")
        if not exists:
            all_ok = False
    
    return all_ok

def check_ports():
    """Check if required ports are available"""
    print_header("Port Availability Check")
    
    import socket
    
    ports_to_check = [3000, 5000]
    all_ok = True
    
    for port in ports_to_check:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(('localhost', port))
                if result == 0:
                    print_status(f"Port {port}", False, "In use")
                    all_ok = False
                else:
                    print_status(f"Port {port}", True, "Available")
        except Exception as e:
            print_status(f"Port {port}", False, f"Error checking: {str(e)}")
            all_ok = False
    
    return all_ok

def main():
    """Main verification function"""
    print("SENTINEL-X Installation Verification")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    checks = [
        ("Python Environment", check_python_version),
        ("Python Dependencies", check_python_packages),
        ("Node.js Environment", check_node_environment),
        ("Environment Variables", check_environment_variables),
        ("File Structure", check_file_structure),
        ("Port Availability", check_ports),
        ("Space-Track.org API", check_space_track_connection)
    ]
    
    results = {}
    for check_name, check_func in checks:
        try:
            results[check_name] = check_func()
        except Exception as e:
            print_status(check_name, False, f"Error during check: {str(e)}")
            results[check_name] = False
    
    # Summary
    print_header("Verification Summary")
    passed = sum(results.values())
    total = len(results)
    
    for check_name, result in results.items():
        symbol = "✓" if result else "✗"
        color = "\033[92m" if result else "\033[91m"
        reset = "\033[0m"
        print(f"{color}{symbol}{reset} {check_name}")
    
    print(f"\nOverall: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 All checks passed! SENTINEL-X is ready to run.")
        print("\nNext steps:")
        print("1. Start the backend: python services/ml_service/main.py")
        print("2. Start the frontend: npm run dev")
        print("3. Open http://localhost:3000 in your browser")
    else:
        print(f"\n⚠️  {total - passed} checks failed. Please resolve the issues above before running SENTINEL-X.")
        print("\nCommon solutions:")
        if not results.get("Python Dependencies"):
            print("- Install Python dependencies: pip install -r requirements.txt")
        if not results.get("Node.js Environment"):
            print("- Install Node.js from https://nodejs.org/")
        if not results.get("Environment Variables"):
            print("- Set Space-Track.org credentials as environment variables")
        if not results.get("Space-Track.org API"):
            print("- Verify your Space-Track.org credentials and internet connection")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)