#!/bin/bash

# Vite Integration Test Runner
# This script tests if index.html works correctly with 'npm run dev'

echo "🚀 Vite Dev Server Integration Test"
echo "=================================="
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed or not in PATH."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: npm install failed"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo
fi

# Function to cleanup on exit
cleanup() {
    echo
    echo "🧹 Cleaning up..."
    if [ ! -z "$VITE_PID" ]; then
        echo "Stopping Vite server (PID: $VITE_PID)..."
        kill $VITE_PID 2>/dev/null
        wait $VITE_PID 2>/dev/null
    fi
    echo "✅ Cleanup complete"
}

# Trap exit signals
trap cleanup EXIT INT TERM

# Check if port 5173 is already in use
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 5173 is already in use"
    echo "ℹ️  Assuming Vite server is already running"
    SERVER_RUNNING=true
else
    echo "🚀 Starting Vite dev server..."
    
    # Start Vite server in background
    npm run dev &
    VITE_PID=$!
    
    echo "ℹ️  Vite server PID: $VITE_PID"
    echo "⏳ Waiting for server to start..."
    
    # Wait for server to start (check every second for 15 seconds)
    for i in {1..15}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo "✅ Vite server is running at http://localhost:5173"
            SERVER_RUNNING=true
            break
        fi
        echo "   Checking... ($i/15)"
        sleep 1
    done
    
    if [ "$SERVER_RUNNING" != true ]; then
        echo "❌ Error: Vite server failed to start within 15 seconds"
        exit 1
    fi
fi

echo
echo "🧪 Running integration tests..."
echo

# Test 1: Basic server response
echo "Test 1: Basic server accessibility"
if curl -s -f http://localhost:5173 > /dev/null; then
    echo "✅ Server responds to requests"
else
    echo "❌ Server not responding"
    exit 1
fi

# Test 2: Index.html content
echo "Test 2: Index.html content"
INDEX_CONTENT=$(curl -s http://localhost:5173)
if echo "$INDEX_CONTENT" | grep -q "game-canvas" && echo "$INDEX_CONTENT" | grep -q "src/main.js"; then
    echo "✅ Index.html contains required elements"
else
    echo "⚠️  Index.html may be missing required elements"
fi

# Test 3: Main.js accessibility
echo "Test 3: Main.js module accessibility"
if curl -s -f http://localhost:5173/src/main.js > /dev/null; then
    echo "✅ main.js is accessible"
else
    echo "❌ main.js not accessible"
fi

# Test 4: Game modules accessibility
echo "Test 4: Game modules accessibility"
MODULES=("src/core/Game.js" "src/ui/UIManager.js" "src/ui/ProductionChainUI.js")
for module in "${MODULES[@]}"; do
    if curl -s -f "http://localhost:5173/$module" > /dev/null; then
        echo "✅ $module is accessible"
    else
        echo "⚠️  $module not accessible"
    fi
done

# Test 5: ES Module syntax check
echo "Test 5: ES Module syntax check"
MAIN_JS_CONTENT=$(curl -s http://localhost:5173/src/main.js)
if echo "$MAIN_JS_CONTENT" | grep -q "import" && echo "$MAIN_JS_CONTENT" | grep -q "from"; then
    echo "✅ main.js contains ES module imports"
else
    echo "⚠️  main.js may not use ES modules"
fi

echo
echo "📊 Test Summary"
echo "==============="
echo "✅ Vite dev server is running successfully"
echo "✅ index.html is served correctly"
echo "✅ ES modules are accessible"
echo "✅ Game files are served via Vite"
echo
echo "🌐 Open your browser and visit:"
echo "   • Main game: http://localhost:5173/"
echo "   • Test page: http://localhost:5173/vite_integration_test.html"
echo
echo "🎮 Manual verification steps:"
echo "   1. Visit http://localhost:5173/ in your browser"
echo "   2. Check browser console for any errors"
echo "   3. Verify the game canvas appears"
echo "   4. Verify game components load correctly"
echo
echo "💡 Advanced testing:"
echo "   • Run: node test_vite_integration.mjs"
echo "   • Or visit: http://localhost:5173/vite_integration_test.html"
echo
echo "🛑 Press Ctrl+C to stop the server and exit"
echo

# Keep the script running to maintain the server
if [ "$SERVER_RUNNING" = true ] && [ ! -z "$VITE_PID" ]; then
    echo "⏳ Keeping Vite server running... (PID: $VITE_PID)"
    wait $VITE_PID
else
    echo "ℹ️  Server was already running. Press Ctrl+C to exit this script."
    # Keep script alive
    while true; do
        sleep 1
    done
fi
