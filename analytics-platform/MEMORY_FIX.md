# Memory Leak Fix Documentation

## Problem

Next.js dev server was consuming ~9.7 GB RAM, indicating a severe memory leak.

## Root Causes Identified

### 1. **CRITICAL: Loading ALL Gossip Observations** (Primary Issue)
- **Location**: `src/lib/pnode-queries.ts:24-25`
- **Problem**: `getGlobalPnodeView()` was loading **ALL** gossip observations for each pnode without a `take` limit
- **Impact**: If you have 500 pnodes with 1000 observations each, that's 500,000 records loaded into memory per request
- **Fix**: Added `take: 1` to only load the latest observation per pnode

### 2. **Excessive Stats Samples**
- **Location**: `src/lib/pnode-queries.ts:29`
- **Problem**: Loading 10 stats samples per pnode when only 2 are needed (latest + previous for throughput)
- **Impact**: 10x more data than necessary
- **Fix**: Reduced to `take: 2`

### 3. **N+1 Query Problem for Seed Mappings**
- **Location**: `src/lib/pnode-queries.ts:51-57` (original)
- **Problem**: Querying seed mappings separately for each pnode
- **Impact**: If you have 500 pnodes, that's 500 additional queries
- **Fix**: Single query to get all mappings, then group by pnodeId

### 4. **Prisma Connection Management**
- **Location**: `src/lib/db.ts`
- **Problem**: No explicit cleanup on process exit
- **Fix**: Added proper cleanup handlers for SIGINT/SIGTERM

## Fixes Applied

### 1. Optimized Prisma Queries

**Before:**
```typescript
gossipObservations: {
  orderBy: { observedAt: 'desc' },
  // No limit - loads ALL observations!
}
statsSamples: {
  orderBy: { timestamp: 'desc' },
  take: 10, // More than needed
}
```

**After:**
```typescript
gossipObservations: {
  orderBy: { observedAt: 'desc' },
  take: 1, // Only latest observation
}
statsSamples: {
  orderBy: { timestamp: 'desc' },
  take: 2, // Only latest + previous for throughput
}
```

### 2. Batch Seed Mapping Query

**Before:**
```typescript
// N+1 queries - one per pnode
const seedBaseUrlsSeen = await prisma.pnodeGossipObservation.findMany({
  where: { pnodeId: p.id },
  ...
});
```

**After:**
```typescript
// Single query for all pnodes
const allSeedMappings = await prisma.pnodeGossipObservation.findMany({
  where: { pnodeId: { in: pnodeIds } },
  ...
});
// Then group by pnodeId
```

### 3. Added Memory Monitoring

- Created `src/lib/memory-monitor.ts` for development monitoring
- Auto-logs memory usage every 30 seconds in dev mode
- Added memory logging to API routes

### 4. Prisma Connection Cleanup

- Added proper cleanup handlers for graceful shutdown
- Ensures connections are closed on process exit

## Verification Steps

### 1. Check Memory Usage Before/After

**Before Fix:**
```bash
# Start dev server
npm run dev

# In another terminal, monitor memory
watch -n 5 'ps aux | grep "next dev" | grep -v grep | awk "{print \$6/1024 \" MB\"}"'
```

**Expected Before:** Memory grows continuously, reaching 5-10 GB

**Expected After:** Memory stabilizes at 200-500 MB

### 2. Production Build Test

```bash
# Build production version
npm run build

# Start production server
npm run start

# Monitor memory (should be lower than dev mode)
ps aux | grep "next start" | grep -v grep
```

**Expected:** Production should use 50-70% less memory than dev mode

### 3. Heap Snapshot Analysis

```bash
# Start with heap snapshot support
node --heapsnapshot-signal=SIGUSR2 node_modules/.bin/next dev

# In another terminal, trigger snapshot
kill -USR2 <pid>

# Snapshot saved to: heap.heapnode.<pid>.<seq>.heapsnapshot
# Open in Chrome DevTools: chrome://inspect
```

### 4. Memory Diagnostics Script

```bash
# Run memory diagnostics
node scripts/memory-diagnostics.js
```

This will log memory usage every 10 seconds.

## Dev vs Production Behavior

### Development Mode Issues (Fixed)
- ✅ Hot reload / Fast Refresh - No changes needed
- ✅ Module cache growth - Normal, not a leak
- ✅ File watchers - Normal Next.js behavior
- ✅ Large in-memory datasets - **FIXED** (was loading all observations)
- ✅ Prisma query optimization - **FIXED**

### Production Mode
- Production build uses less memory (no dev tools, no hot reload)
- Same query optimizations apply
- Memory should stabilize at 200-500 MB for typical workloads

## Healthy Memory Usage

### Development Mode
- **Initial**: 150-300 MB
- **After requests**: 200-500 MB
- **Stable**: Should not exceed 1 GB even with many requests

### Production Mode
- **Initial**: 100-200 MB
- **After requests**: 150-400 MB
- **Stable**: Should not exceed 500 MB

## Monitoring in Production

Add to your deployment:

```typescript
// In API route or middleware
if (process.env.NODE_ENV === 'production') {
  const stats = getMemoryStats();
  if (stats.heapUsed > 1000 * 1024 * 1024) { // > 1GB
    console.error('Memory usage exceeded 1GB:', stats);
    // Alert monitoring system
  }
}
```

## Additional Optimizations (Future)

1. **Pagination**: If pnode count grows beyond 1000, consider pagination
2. **Caching**: Add Redis caching for frequently accessed data
3. **Streaming**: Use streaming responses for large datasets
4. **Database Indexing**: Ensure indexes on `pnodeId`, `seedBaseUrl`, `observedAt`, `timestamp`

## Testing the Fix

1. **Start dev server**: `npm run dev`
2. **Monitor memory**: Use Activity Monitor or `ps aux | grep next`
3. **Make requests**: Refresh the page multiple times
4. **Verify**: Memory should stabilize, not grow continuously
5. **Check logs**: Memory monitor should log every 30 seconds

## Rollback (If Needed)

If issues occur, revert these files:
- `src/lib/pnode-queries.ts` - Restore original query structure
- `src/lib/db.ts` - Remove cleanup handlers
- `src/lib/memory-monitor.ts` - Delete file
- `src/app/api/pnodes/route.ts` - Remove memory logging

## Questions?

If memory usage still grows:
1. Check for other large queries in the codebase
2. Verify Prisma connection pool settings
3. Check for event listeners that aren't cleaned up
4. Use heap snapshots to identify retained objects



