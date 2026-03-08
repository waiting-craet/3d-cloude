# AI Save Graph Transaction Timeout Fix

## Problem
When saving AI-generated graphs, users encountered the error:
```
Failed to save graph: Transaction API error: Unable to start a transaction in the given time.
```

This error occurs when the database connection pool is exhausted or when transactions take too long to acquire a lock.

## Root Cause
1. **Connection Pool Exhaustion**: Neon (serverless PostgreSQL) has limited connection pool capacity
2. **Long Transaction Time**: Creating many nodes and edges in a single transaction can exceed timeout limits
3. **No Retry Logic**: Failed transactions were not retried

## Solution

### 1. Added Transaction Timeout Configuration
```typescript
await prisma.$transaction(async (tx) => {
  // ... transaction logic
}, {
  maxWait: 5000,  // Wait up to 5 seconds for a transaction slot
  timeout: 20000, // Transaction must complete within 20 seconds
});
```

### 2. Moved Project Validation Outside Transaction
Validating the project exists before starting the transaction reduces the time the transaction is held:
```typescript
// Validate project before transaction (faster failure)
const project = await prisma.project.findUnique({
  where: { id: body.projectId },
});

if (!project) {
  return NextResponse.json({ error: 'Project not found' }, { status: 404 });
}
```

### 3. Added Automatic Retry Logic
Implemented exponential backoff retry for transaction timeout errors:
```typescript
export async function POST(request: NextRequest) {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      return await handleSaveGraph(request);
    } catch (error) {
      if (errorMessage.includes('Unable to start a transaction') && retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      throw error;
    }
  }
}
```

### 4. Enhanced Error Messages
Improved error messages to help diagnose issues:
- "Project not found. Please select a valid project."
- "Database connection error. Please try again."
- "Failed to save graph: [specific error message]"

## Benefits
1. **Automatic Recovery**: Transient connection issues are automatically retried
2. **Faster Failure**: Invalid requests fail quickly without holding database connections
3. **Better Diagnostics**: Clear error messages help identify the root cause
4. **Improved Reliability**: Exponential backoff prevents overwhelming the database

## Testing
To test the fix:
1. Generate an AI graph with text input
2. Click "保存图谱" in the preview modal
3. The graph should save successfully, or show a clear error message if there's an issue

## Files Modified
- `app/api/ai/save-graph/route.ts` - Added retry logic, timeout configuration, and improved error handling
- `lib/db.ts` - Added datasource configuration for better connection management

## Related Issues
- Transaction timeout errors
- "Unable to start a transaction in the given time" errors
- Database connection pool exhaustion
