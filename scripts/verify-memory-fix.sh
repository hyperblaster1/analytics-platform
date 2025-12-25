#!/bin/bash
# Verification script for memory leak fixes
# Usage: ./scripts/verify-memory-fix.sh

echo "=== Memory Leak Fix Verification ==="
echo ""

# Check if Next.js is running
if ! pgrep -f "next dev" > /dev/null; then
    echo "❌ Next.js dev server is not running"
    echo "   Start it with: npm run dev"
    exit 1
fi

echo "✅ Next.js dev server is running"
echo ""

# Get process ID
PID=$(pgrep -f "next dev" | head -1)
echo "Process ID: $PID"
echo ""

# Get memory usage
echo "=== Current Memory Usage ==="
ps -p $PID -o rss=,vsz=,%mem= | awk '{printf "RSS: %.2f MB\nVSZ: %.2f MB\nMemory: %.1f%%\n", $1/1024, $2/1024, $3}'
echo ""

# Check if memory is reasonable (< 2GB)
RSS_KB=$(ps -p $PID -o rss= | head -1)
RSS_MB=$((RSS_KB / 1024))

if [ $RSS_MB -lt 2048 ]; then
    echo "✅ Memory usage is reasonable (< 2GB)"
else
    echo "⚠️  Memory usage is high (> 2GB): ${RSS_MB} MB"
    echo "   This may indicate the fix didn't work or there are other issues"
fi

echo ""
echo "=== Verification Steps ==="
echo "1. Monitor memory over time:"
echo "   watch -n 5 'ps -p $PID -o rss= | awk \"{print \\\$1/1024 \\\" MB\\\"}\"'"
echo ""
echo "2. Check for memory growth:"
echo "   Memory should stabilize, not grow continuously"
echo ""
echo "3. Check logs for memory monitoring:"
echo "   Look for '[MemoryMonitor]' logs in the Next.js output"
echo ""
echo "4. Test production build:"
echo "   npm run build && npm run start"
echo "   Production should use less memory than dev mode"



