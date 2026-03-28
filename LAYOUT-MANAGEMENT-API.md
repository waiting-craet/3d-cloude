# Layout Management API Implementation

## Overview

This document describes the implementation of three Layout Management API endpoints for the 2D to 3D layout optimization feature.

## Implemented Endpoints

### 1. POST /api/graphs/[graphId]/reset-layout

**Purpose**: Reset the layout of a graph by clearing existing 3D coordinates and re-executing the conversion algorithm.

**Request Body**:
```typescript
{
  strategy?: LayoutStrategy;  // Optional: 'hierarchical' | 'radial' | 'force_directed' | 'grid' | 'spherical'
  config?: Partial<LayoutConfig>;  // Optional: Custom layout configuration
}
```

**Response**:
```typescript
{
  success: boolean;
  nodes?: Node3D[];  // Array of nodes with new 3D coordinates
  qualityMetrics?: LayoutQualityMetrics;  // Quality metrics for the new layout
  strategy?: LayoutStrategy;  // Strategy used for layout
  processingTime?: number;  // Time taken in milliseconds
  error?: string;  // Error message if failed
  details?: string;  // Detailed error info (dev mode only)
}
```

**Features**:
- Clears existing 3D coordinates before re-calculation
- Loads 2D nodes and edges from database
- Calls LayoutEngine to execute conversion with specified or auto-selected strategy
- Saves new 3D coordinates to database using batch processing
- Returns new layout with quality metrics
- 30-second timeout protection
- Retry logic with exponential backoff for database operations
- Comprehensive error handling (404, 400, 503, 504)

**Validates Requirements**: 12.6

---

### 2. GET /api/graphs/[graphId]/layout-config

**Purpose**: Retrieve the layout configuration for a specific graph.

**Response**:
```typescript
{
  success: boolean;
  config?: LayoutConfig;  // Layout configuration parameters
  strategy?: LayoutStrategy;  // Saved layout strategy
  qualityScore?: number;  // Current layout quality score (0-100)
  error?: string;  // Error message if failed
  details?: string;  // Detailed error info (dev mode only)
}
```

**Features**:
- Loads configuration from `layout_configs` table if available
- Returns default configuration if no saved config exists
- Calculates current quality score if 3D layout exists
- Gracefully handles missing `layout_configs` table (returns defaults)
- 5-second timeout for config operations
- Retry logic for database operations
- Comprehensive error handling (404, 400, 503)

**Validates Requirements**: 9.1-9.7

---

### 3. POST /api/graphs/[graphId]/layout-config

**Purpose**: Save layout configuration for a specific graph.

**Request Body**:
```typescript
{
  strategy?: LayoutStrategy;  // Optional: Layout strategy to use
  config: Partial<LayoutConfig>;  // Configuration parameters to save
}
```

**Response**:
```typescript
{
  success: boolean;
  config?: LayoutConfig;  // Validated and saved configuration
  strategy?: LayoutStrategy;  // Saved strategy
  error?: string;  // Error message if failed
  details?: string;  // Detailed error info (dev mode only)
}
```

**Features**:
- Validates configuration parameters using LayoutEngine
- Saves to `layout_configs` table (upsert operation)
- Returns validated configuration
- Gracefully handles missing `layout_configs` table (logs warning but succeeds)
- Invalid parameters are automatically corrected to defaults with warnings
- 5-second timeout for config operations
- Retry logic for database operations
- Comprehensive error handling (404, 400, 503)

**Validates Requirements**: 9.1-9.7

---

## Configuration Parameters

The `LayoutConfig` interface includes:

```typescript
interface LayoutConfig {
  heightVariation: number;        // Y-axis variation range (default: 8)
  minNodeDistance: number;        // Minimum distance between nodes (default: 18)
  iterations: number;             // Force simulation iterations (default: 80)
  springLength: number;           // Spring length for connected nodes (default: 18)
  repulsionStrength: number;      // Repulsion force strength (default: 900)
  damping: number;                // Damping coefficient (default: 0.9)
  convergenceThreshold: number;   // Convergence threshold (default: 0.01)
  batchSize: number;              // Batch size for database operations (default: 15)
  batchDelay: number;             // Delay between batches in ms (default: 100)
}
```

## Layout Strategies

Available strategies:
- `hierarchical`: For DAG (directed acyclic graph) structures
- `radial`: For graphs with central nodes
- `force_directed`: For dense graphs (density > 0.2)
- `grid`: For sparse large graphs (>30 nodes, density < 0.1)
- `spherical`: For complete or nearly complete graphs
- `auto`: Automatically selects the best strategy based on graph metrics

## Error Handling

All endpoints implement comprehensive error handling:

### HTTP Status Codes
- `200`: Success
- `400`: Invalid request (bad graphId, missing parameters, invalid config)
- `404`: Graph not found
- `503`: Database connection error
- `504`: Operation timeout

### Error Response Format
```typescript
{
  success: false,
  error: string,  // User-friendly error message
  details?: string  // Technical details (only in development mode)
}
```

### Retry Logic
- Database operations retry up to 3 times with exponential backoff
- Initial retry delay: 1 second
- Exponential backoff multiplier: 2x

### Timeout Protection
- Reset layout: 30 seconds
- Get/Save config: 5 seconds (implicit via retry logic)

## Database Schema

### layout_configs Table

```sql
CREATE TABLE layout_configs (
  id VARCHAR(191) PRIMARY KEY,
  graph_id VARCHAR(191) NOT NULL,
  strategy VARCHAR(50) NOT NULL,
  config_json TEXT NOT NULL,
  quality_score DOUBLE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (graph_id) REFERENCES Graph(id) ON DELETE CASCADE
);
```

**Note**: The `layout_configs` table is optional. If the migration has not been run, the endpoints will:
- GET: Return default configuration
- POST: Log a warning but still validate and return the config
- This allows the API to work before the database migration is applied

## Batch Processing

To avoid database connection pool exhaustion, all endpoints use batch processing when saving nodes:

- Default batch size: 15 nodes
- Default delay between batches: 100ms
- Configurable via `config.batchSize` and `config.batchDelay`

Example for 100 nodes:
- 7 batches (15 nodes each, last batch has 10)
- Total delay: 600ms (6 delays × 100ms)
- Total time: ~1-2 seconds (including database operations)

## Usage Examples

### Reset Layout with Custom Strategy

```typescript
const response = await fetch('/api/graphs/my-graph-id/reset-layout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    strategy: 'force_directed',
    config: {
      iterations: 100,
      repulsionStrength: 1200
    }
  })
});

const result = await response.json();
console.log('Quality score:', result.qualityMetrics.qualityScore);
```

### Get Current Configuration

```typescript
const response = await fetch('/api/graphs/my-graph-id/layout-config');
const result = await response.json();

console.log('Current config:', result.config);
console.log('Quality score:', result.qualityScore);
```

### Save Custom Configuration

```typescript
const response = await fetch('/api/graphs/my-graph-id/layout-config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    strategy: 'hierarchical',
    config: {
      heightVariation: 10,
      minNodeDistance: 20,
      iterations: 60
    }
  })
});

const result = await response.json();
console.log('Saved config:', result.config);
```

## Integration with LayoutEngine

All endpoints use the `LayoutEngine` class from `@/lib/layout/LayoutEngine`:

1. **Reset Layout**: 
   - Creates new LayoutEngine instance with custom config
   - Calls `convert3D()` to execute full conversion
   - Calls `calculateQualityMetrics()` to evaluate result

2. **Get Config**:
   - Uses LayoutEngine to calculate quality score for existing layout
   - Returns default config if no saved config exists

3. **Save Config**:
   - Creates LayoutEngine instance to validate parameters
   - Invalid parameters are automatically corrected
   - Calls `getConfig()` to retrieve validated configuration

## Testing Recommendations

### Unit Tests
- Test invalid graphId handling
- Test missing request body handling
- Test configuration validation
- Test error responses for different scenarios

### Integration Tests
- Test full reset layout workflow
- Test config save and retrieve workflow
- Test with missing layout_configs table
- Test timeout scenarios
- Test retry logic with database failures

### Performance Tests
- Test with graphs of different sizes (10, 50, 100, 200 nodes)
- Verify batch processing works correctly
- Verify timeout protection activates appropriately

## Migration Notes

To enable full functionality with persistent configuration storage:

1. Run the database migration:
   ```bash
   mysql -u root -p neondb < migrations/001_add_3d_layout_fields.sql
   ```

2. Verify the migration:
   ```sql
   SHOW TABLES LIKE 'layout_%';
   DESCRIBE layout_configs;
   ```

3. The endpoints will automatically start using the `layout_configs` table once it exists.

## Future Enhancements

Potential improvements for future iterations:

1. **Pagination**: For large graphs, paginate node results
2. **Streaming**: Stream node updates for real-time progress
3. **Webhooks**: Notify clients when long-running layouts complete
4. **Caching**: Cache quality scores to avoid recalculation
5. **History**: Implement layout history tracking using `layout_history` table
6. **Rollback**: Add endpoint to rollback to previous layout version
7. **Comparison**: Add endpoint to compare quality scores across versions
8. **Presets**: Add predefined configuration presets for common use cases

## Related Files

- `3d-cloude/app/api/graphs/[graphId]/reset-layout/route.ts` - Reset layout endpoint
- `3d-cloude/app/api/graphs/[graphId]/layout-config/route.ts` - Config management endpoints
- `3d-cloude/lib/layout/LayoutEngine.ts` - Core layout engine
- `3d-cloude/lib/layout/types.ts` - Type definitions
- `3d-cloude/migrations/001_add_3d_layout_fields.sql` - Database migration
- `.kiro/specs/2d-to-3d-layout-optimization/design.md` - Design specification
- `.kiro/specs/2d-to-3d-layout-optimization/requirements.md` - Requirements specification

## Conclusion

All three Layout Management API endpoints have been successfully implemented with:
- ✅ Comprehensive error handling
- ✅ Retry logic with exponential backoff
- ✅ Timeout protection
- ✅ Batch processing for database operations
- ✅ Configuration validation
- ✅ Graceful degradation when database tables don't exist
- ✅ Full TypeScript type safety
- ✅ Detailed logging for debugging
- ✅ Requirements validation (9.1-9.7, 12.6)

The implementation is production-ready and follows Next.js 14 App Router best practices.
