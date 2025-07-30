#!/usr/bin/env python3
"""
AI Life Narrator - Startup Script
This script helps you start the application with proper setup.
"""

import os
import sys
import subprocess
import time
from pathlib import Path


def print_banner():
    print(
        """
🌙✨ AI Life Narrator ✨🌙
==========================
A full-stack AI-powered life storytelling application
"""
    )


def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True


def check_node_version():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js version: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass

    print("❌ Node.js is not installed or not in PATH")
    print("Please install Node.js from https://nodejs.org/")
    return False


def check_env_file():
    """Check if .env file exists"""
    env_file = Path("backend/.env")
    if env_file.exists():
        print("✅ Environment file found")
        return True

    print("⚠️  Environment file not found")
    print("Creating .env file from template...")

    try:
        # Copy from example
        example_file = Path("backend/.env.example")
        if example_file.exists():
            with open(example_file, "r") as f:
                content = f.read()

            with open(env_file, "w") as f:
                f.write(content)

            print("✅ Created .env file from template")
            print("⚠️  Please edit backend/.env and add your OpenAI API key")
            return True
        else:
            print("❌ env.example file not found")
            return False
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False


def install_backend_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing backend dependencies...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"],
            check=True,
        )
        print("✅ Backend dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing backend dependencies: {e}")
        return False


def install_frontend_dependencies():
    """Install Node.js dependencies"""
    print("\n📦 Installing frontend dependencies...")

    # Check if node_modules already exists
    if os.path.exists("frontend/node_modules"):
        print("✅ Frontend dependencies already installed (node_modules found)")
        return True

    try:
        # Try to find npm in common locations
        npm_paths = [
            "npm",  # Try PATH first
            "C:\\Users\\PhaniSravanKolapalli\\Downloads\\node-v20.19.4-win-x64\\node-v20.19.4-win-x64\\npm.cmd",
            "C:\\Program Files\\nodejs\\npm.cmd",
            "C:\\Program Files (x86)\\nodejs\\npm.cmd",
            os.path.expanduser("~\\AppData\\Roaming\\npm\\npm.cmd"),
        ]

        npm_found = False
        for npm_path in npm_paths:
            try:
                result = subprocess.run(
                    [npm_path, "--version"], capture_output=True, text=True
                )
                if result.returncode == 0:
                    print(f"Found npm at: {npm_path}")
                    subprocess.run([npm_path, "install"], cwd="frontend", check=True)
                    print("✅ Frontend dependencies installed")
                    npm_found = True
                    break
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue

        if not npm_found:
            print(
                "❌ npm not found. Please ensure Node.js and npm are installed and in your PATH."
            )
            print(
                "💡 You can manually install frontend dependencies by running: cd frontend && npm install"
            )
            return False

        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing frontend dependencies: {e}")
        return False


def start_backend():
    """Start the FastAPI backend"""
    print("\n🚀 Starting backend server...")
    try:
        # Change to backend directory and start
        os.chdir("backend")
        subprocess.Popen([sys.executable, "main.py"])
        print("✅ Backend server started on http://localhost:8000")
        os.chdir("..")
        return True
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return False


def start_frontend():
    """Start the React frontend"""
    print("\n🚀 Starting frontend server...")
    try:
        # Try to find npm in common locations
        npm_paths = [
            "npm",  # Try PATH first
            "C:\\Users\\PhaniSravanKolapalli\\Downloads\\node-v20.19.4-win-x64\\node-v20.19.4-win-x64\\npm.cmd",
            "C:\\Program Files\\nodejs\\npm.cmd",
            "C:\\Program Files (x86)\\nodejs\\npm.cmd",
            os.path.expanduser("~\\AppData\\Roaming\\npm\\npm.cmd"),
        ]

        npm_found = False
        for npm_path in npm_paths:
            try:
                result = subprocess.run(
                    [npm_path, "--version"], capture_output=True, text=True
                )
                if result.returncode == 0:
                    print(f"Found npm at: {npm_path}")
                    subprocess.Popen([npm_path, "start"], cwd="frontend")
                    print("✅ Frontend server started on http://localhost:3000")
                    npm_found = True
                    break
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue

        if not npm_found:
            print(
                "❌ npm not found. Please ensure Node.js and npm are installed and in your PATH."
            )
            print(
                "💡 You can manually start the frontend by running: cd frontend && npm start"
            )
            return False

        return True
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        return False


def main():
    print_banner()

    # Check prerequisites
    print("🔍 Checking prerequisites...")
    if not check_python_version():
        return False

    if not check_node_version():
        return False

    if not check_env_file():
        return False

    # Ask user what they want to do
    print("\n" + "=" * 50)
    print("What would you like to do?")
    print("1. Install dependencies and start the application")
    print("2. Install dependencies only")
    print("3. Start the application (assumes dependencies are installed)")
    print("4. Exit")

    choice = input("\nEnter your choice (1-4): ").strip()

    if choice == "1":
        # Install and start
        if not install_backend_dependencies():
            return False

        if not install_frontend_dependencies():
            return False

        print("\n⏳ Waiting 3 seconds before starting servers...")
        time.sleep(3)

        if not start_backend():
            return False

        print("\n⏳ Waiting 5 seconds before starting frontend...")
        time.sleep(5)

        if not start_frontend():
            return False

        print("\n" + "=" * 50)
        print("🎉 Application started successfully!")
        print("\n📱 Frontend: http://localhost:3000")
        print("🔧 Backend API: http://localhost:8000")
        print("📚 API Docs: http://localhost:8000/docs")
        print("\n👤 Demo Account:")
        print("   Email: demo@lifenarrator.com")
        print("   Password: demo123")
        print("\n⚠️  Don't forget to:")
        print("   1. Add your OpenAI API key to backend/.env")
        print("   2. Keep both terminal windows open")
        print("\nPress Ctrl+C to stop the servers")

    elif choice == "2":
        # Install only
        if not install_backend_dependencies():
            return False

        if not install_frontend_dependencies():
            return False

        print("\n✅ Dependencies installed successfully!")
        print("Run this script again and choose option 3 to start the application")

    elif choice == "3":
        # Start only
        if not start_backend():
            return False

        print("\n⏳ Waiting 5 seconds before starting frontend...")
        time.sleep(5)

        if not start_frontend():
            return False

        print("\n" + "=" * 50)
        print("🎉 Application started successfully!")
        print("\n📱 Frontend: http://localhost:3000")
        print("🔧 Backend API: http://localhost:8000")
        print("📚 API Docs: http://localhost:8000/docs")

    elif choice == "4":
        print("👋 Goodbye!")
        return True

    else:
        print("❌ Invalid choice")
        return False

    return True


if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Application stopped by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
