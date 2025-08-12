#!/bin/bash

# AI Life Narrator iOS Setup Script
# This script helps set up the iOS project for development

echo "🚀 Setting up AI Life Narrator iOS Project..."

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

# Check if we're in the right directory
if [ ! -f "AILifeNarrator.xcodeproj/project.pbxproj" ]; then
    print_error "Please run this script from the ios/ directory"
    exit 1
fi

# Check Xcode installation
print_status "Checking Xcode installation..."
if ! command -v xcodebuild &> /dev/null; then
    print_error "Xcode is not installed or not in PATH"
    print_error "Please install Xcode from the App Store"
    exit 1
fi

XCODE_VERSION=$(xcodebuild -version | head -n 1 | awk '{print $2}')
print_success "Found Xcode version: $XCODE_VERSION"

# Check iOS deployment target
print_status "Checking iOS deployment target..."
DEPLOYMENT_TARGET=$(grep -o 'IPHONEOS_DEPLOYMENT_TARGET = [0-9.]*' AILifeNarrator.xcodeproj/project.pbxproj | head -1 | awk '{print $3}')
if [ -n "$DEPLOYMENT_TARGET" ]; then
    print_success "iOS deployment target: $DEPLOYMENT_TARGET"
else
    print_warning "Could not determine iOS deployment target"
fi

# Check Swift version
print_status "Checking Swift version..."
if command -v swift &> /dev/null; then
    SWIFT_VERSION=$(swift --version | head -n 1 | awk '{print $4}')
    print_success "Found Swift version: $SWIFT_VERSION"
else
    print_warning "Swift command line tool not found"
fi

# Check if backend is running
print_status "Checking backend connectivity..."
if curl -s http://localhost:8000/api/health &> /dev/null; then
    print_success "Backend is running on localhost:8000"
else
    print_warning "Backend is not running on localhost:8000"
    print_warning "Please start your FastAPI backend:"
    echo "  cd ../backend"
    echo "  uvicorn main:app --host 0.0.0.0 --port 8000"
fi

# Check project structure
print_status "Checking project structure..."
MISSING_FILES=()

if [ ! -f "AILifeNarrator/AILifeNarratorApp.swift" ]; then
    MISSING_FILES+=("AILifeNarratorApp.swift")
fi

if [ ! -f "AILifeNarrator/ContentView.swift" ]; then
    MISSING_FILES+=("ContentView.swift")
fi

if [ ! -f "AILifeNarrator/Views/TimelineView.swift" ]; then
    MISSING_FILES+=("Views/TimelineView.swift")
fi

if [ ! -f "AILifeNarrator/Views/CreateEntryView.swift" ]; then
    MISSING_FILES+=("Views/CreateEntryView.swift")
fi

if [ ! -f "AILifeNarrator/Services/APIService.swift" ]; then
    MISSING_FILES+=("Services/APIService.swift")
fi

if [ ! -f "AILifeNarrator/Info.plist" ]; then
    MISSING_FILES+=("Info.plist")
fi

if [ ! -f "Package.swift" ]; then
    MISSING_FILES+=("Package.swift")
fi

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    print_success "All required files are present"
else
    print_error "Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

# Check Core Data model
print_status "Checking Core Data model..."
if [ -f "AILifeNarrator/AILifeNarrator.xcdatamodeld/AILifeNarrator.xcdatamodel/contents" ]; then
    print_success "Core Data model found"
else
    print_warning "Core Data model not found"
fi

# Create necessary directories if they don't exist
print_status "Creating necessary directories..."
mkdir -p AILifeNarrator/Views
mkdir -p AILifeNarrator/Services
mkdir -p AILifeNarrator/Models

# Check for Swift Package Manager dependencies
print_status "Checking Swift Package Manager dependencies..."
if [ -f "Package.swift" ]; then
    print_success "Package.swift found"
    
    # Check if dependencies are resolved
    if [ -d ".build" ] || [ -d "AILifeNarrator.xcodeproj/project.xcworkspace" ]; then
        print_success "Dependencies appear to be resolved"
    else
        print_warning "Dependencies may not be resolved"
        print_warning "Open the project in Xcode to resolve dependencies"
    fi
else
    print_error "Package.swift not found"
fi

# Check permissions in Info.plist
print_status "Checking Info.plist permissions..."
if grep -q "NSCameraUsageDescription" AILifeNarrator/Info.plist; then
    print_success "Camera permission configured"
else
    print_warning "Camera permission not configured"
fi

if grep -q "NSMicrophoneUsageDescription" AILifeNarrator/Info.plist; then
    print_success "Microphone permission configured"
else
    print_warning "Microphone permission not configured"
fi

if grep -q "NSPhotoLibraryUsageDescription" AILifeNarrator/Info.plist; then
    print_success "Photo library permission configured"
else
    print_warning "Photo library permission not configured"
fi

# Check network security settings
print_status "Checking network security settings..."
if grep -q "NSAppTransportSecurity" AILifeNarrator/Info.plist; then
    print_success "Network security configured"
else
    print_warning "Network security not configured"
fi

# Provide next steps
echo ""
print_success "Setup complete! Here are your next steps:"
echo ""
echo "1. Open the project in Xcode:"
echo "   open AILifeNarrator.xcodeproj"
echo ""
echo "2. Select your target device (simulator or physical device)"
echo ""
echo "3. Build and run the project (Cmd+R)"
echo ""
echo "4. If you encounter build errors:"
echo "   - Clean build folder (Cmd+Shift+K)"
echo "   - Reset package caches in Xcode"
echo "   - Ensure all dependencies are resolved"
echo ""
echo "5. Test the app functionality:"
echo "   - Login with existing credentials"
echo "   - Create new entries"
echo "   - View timeline"
echo "   - Test media capture"
echo ""

# Check if we can open Xcode
if command -v open &> /dev/null; then
    read -p "Would you like to open the project in Xcode now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Opening project in Xcode..."
        open AILifeNarrator.xcodeproj
    fi
fi

print_success "🎉 iOS project setup is complete!"
print_success "You can now start developing your mobile app!" 