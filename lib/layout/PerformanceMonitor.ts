/**
 * Performance Monitor for Layout Engine
 * 
 * Tracks and logs performance metrics for 2D to 3D layout conversion operations.
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.7
 */

export interface PerformanceMetrics {
  totalTime: number;
  analysisTime: number;
  conversionTime: number;
  simulationTime: number;
  optimizationTime: number;
  persistenceTime: number;
  nodeCount: number;
  edgeCount: number;
  strategy: string;
}

export interface PerformanceTarget {
  nodeCount: number;
  maxTime: number;
}

export class PerformanceMonitor {
  private startTime: number = 0;
  private checkpoints: Map<string, number> = new Map();
  private metrics: Partial<PerformanceMetrics> = {};
  
  // Performance targets based on Requirements 7.1-7.4
  private static readonly PERFORMANCE_TARGETS: PerformanceTarget[] = [
    { nodeCount: 20, maxTime: 2000 },    // < 20 nodes: 2 seconds
    { nodeCount: 50, maxTime: 5000 },    // 20-50 nodes: 5 seconds
    { nodeCount: 100, maxTime: 10000 },  // 50-100 nodes: 10 seconds
    { nodeCount: Infinity, maxTime: 20000 } // > 100 nodes: 20 seconds
  ];
  
  /**
   * Start performance monitoring
   */
  start(): void {
    this.startTime = Date.now();
    this.checkpoints.clear();
    this.metrics = {};
  }
  
  /**
   * Mark a checkpoint for a specific operation
   */
  checkpoint(name: string): void {
    this.checkpoints.set(name, Date.now());
  }
  
  /**
   * Calculate time elapsed since last checkpoint
   */
  private getElapsedSince(checkpointName: string): number {
    const checkpointTime = this.checkpoints.get(checkpointName);
    if (!checkpointTime) {
      return 0;
    }
    return Date.now() - checkpointTime;
  }
  
  /**
   * Calculate time between two checkpoints
   */
  private getTimeBetween(startCheckpoint: string, endCheckpoint: string): number {
    const startTime = this.checkpoints.get(startCheckpoint);
    const endTime = this.checkpoints.get(endCheckpoint);
    
    if (!startTime || !endTime) {
      return 0;
    }
    
    return endTime - startTime;
  }
  
  /**
   * Complete monitoring and return metrics
   */
  complete(nodeCount: number, edgeCount: number, strategy: string): PerformanceMetrics {
    const totalTime = Date.now() - this.startTime;
    
    // Calculate component times
    const analysisTime = this.getTimeBetween('start', 'analysis_complete');
    const conversionTime = this.getTimeBetween('analysis_complete', 'conversion_complete');
    const simulationTime = this.getTimeBetween('conversion_complete', 'simulation_complete');
    const optimizationTime = this.getTimeBetween('simulation_complete', 'optimization_complete');
    const persistenceTime = this.getTimeBetween('optimization_complete', 'persistence_complete');
    
    const metrics: PerformanceMetrics = {
      totalTime,
      analysisTime,
      conversionTime,
      simulationTime,
      optimizationTime,
      persistenceTime,
      nodeCount,
      edgeCount,
      strategy
    };
    
    // Log performance metrics
    this.logMetrics(metrics);
    
    // Check if performance target was met
    this.checkPerformanceTarget(metrics);
    
    return metrics;
  }
  
  /**
   * Log performance metrics
   */
  private logMetrics(metrics: PerformanceMetrics): void {
    console.log('=== Layout Conversion Performance ===');
    console.log(`Total Time: ${metrics.totalTime}ms`);
    console.log(`Node Count: ${metrics.nodeCount}`);
    console.log(`Edge Count: ${metrics.edgeCount}`);
    console.log(`Strategy: ${metrics.strategy}`);
    console.log('Component Times:');
    console.log(`  - Analysis: ${metrics.analysisTime}ms`);
    console.log(`  - Conversion: ${metrics.conversionTime}ms`);
    console.log(`  - Simulation: ${metrics.simulationTime}ms`);
    console.log(`  - Optimization: ${metrics.optimizationTime}ms`);
    console.log(`  - Persistence: ${metrics.persistenceTime}ms`);
    console.log('=====================================');
  }
  
  /**
   * Check if performance target was met and log warning if exceeded
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.7
   */
  private checkPerformanceTarget(metrics: PerformanceMetrics): void {
    const target = this.getPerformanceTarget(metrics.nodeCount);
    
    if (metrics.totalTime > target.maxTime) {
      const exceededBy = metrics.totalTime - target.maxTime;
      const exceededPercent = ((exceededBy / target.maxTime) * 100).toFixed(1);
      
      console.warn(
        `⚠️  Performance Warning: Conversion exceeded target time by ${exceededBy}ms (${exceededPercent}%)`
      );
      console.warn(
        `   Expected: ≤${target.maxTime}ms for ${metrics.nodeCount} nodes, Actual: ${metrics.totalTime}ms`
      );
      
      // Suggest optimizations
      this.suggestOptimizations(metrics);
    } else {
      const margin = target.maxTime - metrics.totalTime;
      const marginPercent = ((margin / target.maxTime) * 100).toFixed(1);
      console.log(
        `✓ Performance target met with ${margin}ms (${marginPercent}%) margin`
      );
    }
  }
  
  /**
   * Get performance target for given node count
   */
  private getPerformanceTarget(nodeCount: number): PerformanceTarget {
    for (const target of PerformanceMonitor.PERFORMANCE_TARGETS) {
      if (nodeCount < target.nodeCount) {
        return target;
      }
    }
    return PerformanceMonitor.PERFORMANCE_TARGETS[PerformanceMonitor.PERFORMANCE_TARGETS.length - 1];
  }
  
  /**
   * Suggest optimizations based on performance metrics
   */
  private suggestOptimizations(metrics: PerformanceMetrics): void {
    console.warn('   Suggestions:');
    
    // Identify slowest component
    const componentTimes = [
      { name: 'Analysis', time: metrics.analysisTime },
      { name: 'Conversion', time: metrics.conversionTime },
      { name: 'Simulation', time: metrics.simulationTime },
      { name: 'Optimization', time: metrics.optimizationTime },
      { name: 'Persistence', time: metrics.persistenceTime }
    ];
    
    const slowest = componentTimes.reduce((max, current) => 
      current.time > max.time ? current : max
    );
    
    console.warn(`   - Slowest component: ${slowest.name} (${slowest.time}ms)`);
    
    if (slowest.name === 'Simulation' && metrics.nodeCount > 50) {
      console.warn('   - Consider reducing iteration count for large graphs');
      console.warn('   - Consider increasing batch size for better performance');
    }
    
    if (slowest.name === 'Persistence' && metrics.nodeCount > 100) {
      console.warn('   - Consider increasing batch size for database operations');
      console.warn('   - Consider increasing batch delay to avoid connection pool exhaustion');
    }
    
    if (metrics.nodeCount > 100) {
      console.warn('   - Consider using spatial grid optimization for collision detection');
      console.warn('   - Consider implementing progress callbacks for better UX');
    }
  }
  
  /**
   * Get expected time for given node count
   */
  static getExpectedTime(nodeCount: number): number {
    for (const target of PerformanceMonitor.PERFORMANCE_TARGETS) {
      if (nodeCount < target.nodeCount) {
        return target.maxTime;
      }
    }
    return PerformanceMonitor.PERFORMANCE_TARGETS[PerformanceMonitor.PERFORMANCE_TARGETS.length - 1].maxTime;
  }
}
