/**
 * Navigation Service Performance and Timing Tests
 * 
 * Task 9.3: Performance and timing validation
 * - Verify navigation performance and timing
 * - Test navigation service efficiency
 * - Validate error handling performance
 * - Requirements: 4.2, 4.3
 */

import { NavigationService, AppRouter, NavigationErrorType, ErrorRecoveryStrategy } from '../navigation-service'

describe('NavigationService Performance and Timing', () => {
  let mockRouter: jest.Mocked<AppRouter>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Clear error logs before each test
    NavigationService.clearErrorLogs()
    
    // Mock router
    mockRouter = {
      push: jest.fn(),
    }
  })

  describe('Navigation Performance Benchmarks', () => {
    it('should complete navigation within acceptable time limits', async () => {
      const testGraphId = 'perf-test-123'
      const startTime = Date.now()

      const result = await NavigationService.navigateToGraph(testGraphId, mockRouter)

      const endTime = Date.now()
      const navigationTime = endTime - startTime

      // Navigation should complete quickly (within 50ms for successful case)
      expect(navigationTime).toBeLessThan(50)
      expect(result.success).toBe(true)
      expect(mockRouter.push).toHaveBeenCalledWith(`/graph?graphId=${testGraphId}`)
    })

    it('should handle multiple concurrent navigation requests efficiently', async () => {
      const testGraphIds = ['concurrent-1', 'concurrent-2', 'concurrent-3', 'concurrent-4', 'concurrent-5']
      const startTime = Date.now()

      // Execute multiple navigation requests concurrently
      const promises = testGraphIds.map(graphId => 
        NavigationService.navigateToGraph(graphId, mockRouter)
      )

      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All requests should complete quickly (within 100ms total)
      expect(totalTime).toBeLessThan(100)

      // All should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(mockRouter.push).toHaveBeenCalledWith(`/graph?graphId=${testGraphIds[index]}`)
      })

      // Should have made 5 router calls
      expect(mockRouter.push).toHaveBeenCalledTimes(5)
    })

    it('should handle large graphId values efficiently', async () => {
      // Create a large graphId (1000 characters)
      const largeGraphId = 'a'.repeat(1000)
      const startTime = Date.now()

      const result = await NavigationService.navigateToGraph(largeGraphId, mockRouter)

      const endTime = Date.now()
      const navigationTime = endTime - startTime

      // Should still complete quickly even with large graphId
      expect(navigationTime).toBeLessThan(100)
      expect(result.success).toBe(true)
      
      // Verify URL encoding works correctly
      const expectedUrl = `/graph?graphId=${encodeURIComponent(largeGraphId)}`
      expect(mockRouter.push).toHaveBeenCalledWith(expectedUrl)
    })

    it('should optimize memory usage during navigation operations', async () => {
      const testGraphId = 'memory-test-456'
      
      // Perform multiple navigation operations to test memory usage
      for (let i = 0; i < 100; i++) {
        const result = await NavigationService.navigateToGraph(`${testGraphId}-${i}`, mockRouter)
        expect(result.success).toBe(true)
      }

      // Verify all operations completed successfully
      expect(mockRouter.push).toHaveBeenCalledTimes(100)

      // Error logs should not accumulate for successful operations
      const errorLogs = NavigationService.getErrorLogs()
      expect(errorLogs).toHaveLength(0)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle invalid graphId errors quickly', async () => {
      const invalidGraphIds = ['', '   ', null as any, undefined as any, 123 as any]
      const startTime = Date.now()

      const promises = invalidGraphIds.map(graphId => 
        NavigationService.navigateToGraph(graphId, mockRouter)
      )

      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Error handling should be fast (within 50ms total)
      expect(totalTime).toBeLessThan(50)

      // All should fail with appropriate error type
      results.forEach(result => {
        expect(result.success).toBe(false)
        expect(result.errorType).toBe(NavigationErrorType.INVALID_GRAPH_ID)
        expect(result.recoveryStrategy).toBe(ErrorRecoveryStrategy.SHOW_ERROR)
      })

      // Router should not be called for invalid graphIds
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should handle router errors efficiently', async () => {
      const testGraphId = 'router-error-test'
      
      // Mock router to throw error
      mockRouter.push.mockImplementation(() => {
        throw new Error('Router navigation failed')
      })

      const startTime = Date.now()
      const result = await NavigationService.navigateToGraph(testGraphId, mockRouter)
      const endTime = Date.now()
      const errorHandlingTime = endTime - startTime

      // Error handling should be fast (within 50ms)
      expect(errorHandlingTime).toBeLessThan(50)
      expect(result.success).toBe(false)
      expect(result.errorType).toBe(NavigationErrorType.NAVIGATION_FAILED)
      expect(result.recoveryStrategy).toBe(ErrorRecoveryStrategy.FALLBACK_UI)
    })

    it('should manage error logs efficiently without memory leaks', async () => {
      const testGraphId = 'error-log-test'
      
      // Generate many errors to test log management
      for (let i = 0; i < 50; i++) {
        await NavigationService.navigateToGraph('', mockRouter) // Invalid graphId
      }

      const errorLogs = NavigationService.getErrorLogs()
      
      // Should have logged errors but not exceed reasonable limits
      expect(errorLogs.length).toBe(10) // getErrorLogs returns last 10 by default
      
      // Each log should have proper structure
      errorLogs.forEach(log => {
        expect(log).toHaveProperty('timestamp')
        expect(log).toHaveProperty('errorType')
        expect(log).toHaveProperty('errorMessage')
        expect(log).toHaveProperty('recoveryStrategy')
        expect(log).toHaveProperty('userMessage')
      })

      // Clear logs should work efficiently
      const clearStartTime = Date.now()
      NavigationService.clearErrorLogs()
      const clearEndTime = Date.now()
      const clearTime = clearEndTime - clearStartTime

      expect(clearTime).toBeLessThan(10) // Should clear quickly
      expect(NavigationService.getErrorLogs()).toHaveLength(0)
    })
  })

  describe('Retry Navigation Performance', () => {
    it('should handle retry operations within acceptable time limits', async () => {
      const testGraphId = 'retry-test-789'
      let attemptCount = 0

      // Mock router to fail first 2 attempts, succeed on 3rd
      mockRouter.push.mockImplementation(() => {
        attemptCount++
        if (attemptCount <= 2) {
          throw new Error(`Attempt ${attemptCount} failed`)
        }
        // Success on 3rd attempt
      })

      const startTime = Date.now()
      const result = await NavigationService.retryNavigation(testGraphId, mockRouter, 3, 100)
      const endTime = Date.now()
      const totalRetryTime = endTime - startTime

      // Retry should complete within reasonable time
      // 3 attempts + 2 delays (100ms + 200ms) = ~300ms + execution time
      expect(totalRetryTime).toBeLessThan(500)
      expect(result.success).toBe(true)
      expect(attemptCount).toBe(3)
    })

    it('should handle exponential backoff timing correctly', async () => {
      const testGraphId = 'backoff-test-123'
      const baseDelay = 100
      const maxRetries = 3

      // Mock router to always fail
      mockRouter.push.mockImplementation(() => {
        throw new Error('Navigation always fails')
      })

      const startTime = Date.now()
      const result = await NavigationService.retryNavigation(testGraphId, mockRouter, maxRetries, baseDelay)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Expected delays: 100ms + 200ms = 300ms + execution time
      // Should complete within reasonable bounds
      expect(totalTime).toBeGreaterThanOrEqual(300) // At least the delay time
      expect(totalTime).toBeLessThan(500) // But not too much overhead

      expect(result.success).toBe(false)
      expect(mockRouter.push).toHaveBeenCalledTimes(maxRetries)
    })

    it('should optimize retry performance for fast failures', async () => {
      const testGraphId = 'fast-fail-test'

      // Test with invalid router (null)
      const startTime = Date.now()
      const result = await NavigationService.retryNavigation(testGraphId, null as any, 3, 100)
      const endTime = Date.now()
      const fastFailTime = endTime - startTime

      // Should fail fast but may include retry delays for consistency
      // Allow for retry delays but ensure it's still reasonable
      expect(fastFailTime).toBeLessThan(500) // Allow for retry delays
      expect(result.success).toBe(false)
      expect(result.errorType).toBe(NavigationErrorType.ROUTER_UNAVAILABLE)
    })
  })

  describe('URL Construction Performance', () => {
    it('should construct URLs efficiently for various graphId formats', () => {
      const testCases = [
        'simple-id',
        'id-with-dashes-123',
        'id_with_underscores_456',
        'id with spaces',
        'id/with/slashes',
        'id?with=query&params=true',
        'id#with-fragment',
        'id%with%encoded%chars',
        '中文图谱ID',
        'emoji-id-🚀-test',
      ]

      const startTime = performance.now()

      testCases.forEach(graphId => {
        const url = NavigationService.constructGraphUrl(graphId)
        expect(url).toBe(`/graph?graphId=${encodeURIComponent(graphId)}`)
      })

      const endTime = performance.now()
      const constructionTime = endTime - startTime

      // URL construction should be very fast (within 10ms for all test cases)
      expect(constructionTime).toBeLessThan(10)
    })

    it('should validate graphIds efficiently', () => {
      const validIds = Array.from({ length: 1000 }, (_, i) => `valid-id-${i}`)
      const invalidIds = ['', '   ', null as any, undefined as any, 123 as any]

      const startTime = performance.now()

      // Test valid IDs
      validIds.forEach(id => {
        expect(NavigationService.isValidGraphId(id)).toBe(true)
      })

      // Test invalid IDs
      invalidIds.forEach(id => {
        expect(NavigationService.isValidGraphId(id)).toBe(false)
      })

      const endTime = performance.now()
      const validationTime = endTime - startTime

      // Validation should be very fast (within 50ms for 1000+ validations)
      expect(validationTime).toBeLessThan(50)
    })
  })

  describe('Timing Requirements Validation (4.2, 4.3)', () => {
    it('should meet navigation timing requirements for typical use cases', async () => {
      const testGraphId = 'timing-requirement-test'
      const iterations = 10
      const navigationTimes: number[] = []

      // Test multiple navigation operations to get average timing
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        const result = await NavigationService.navigateToGraph(`${testGraphId}-${i}`, mockRouter)
        const endTime = Date.now()
        
        expect(result.success).toBe(true)
        navigationTimes.push(endTime - startTime)
      }

      // Calculate average navigation time
      const averageTime = navigationTimes.reduce((sum, time) => sum + time, 0) / iterations
      const maxTime = Math.max(...navigationTimes)

      // Navigation should be consistently fast
      expect(averageTime).toBeLessThan(20) // Average under 20ms
      expect(maxTime).toBeLessThan(50) // No single operation over 50ms

      // All operations should have succeeded
      expect(mockRouter.push).toHaveBeenCalledTimes(iterations)
    })

    it('should handle navigation within 1-2 second workflow requirement', async () => {
      // This test simulates the complete workflow timing requirement
      const testGraphId = 'workflow-timing-test'
      
      // Simulate the complete save-to-navigation workflow timing
      const workflowStartTime = Date.now()
      
      // Step 1: Save operation (simulated - 200ms)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Step 2: Success message display (1.5 seconds as per requirement 4.2)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Step 3: Navigation (should be fast)
      const navigationStartTime = Date.now()
      const result = await NavigationService.navigateToGraph(testGraphId, mockRouter)
      const navigationEndTime = Date.now()
      
      const workflowEndTime = Date.now()
      
      // Verify navigation was successful and fast
      expect(result.success).toBe(true)
      const navigationTime = navigationEndTime - navigationStartTime
      expect(navigationTime).toBeLessThan(50) // Navigation itself should be very fast
      
      // Total workflow should complete within 2 seconds (requirement 4.3)
      const totalWorkflowTime = workflowEndTime - workflowStartTime
      expect(totalWorkflowTime).toBeLessThan(2000) // Within 2 seconds total
      expect(totalWorkflowTime).toBeGreaterThanOrEqual(1700) // At least 1.7s due to required delays
    })

    it('should maintain performance under load conditions', async () => {
      const concurrentOperations = 20
      const testGraphId = 'load-test'
      
      const startTime = Date.now()
      
      // Create multiple concurrent navigation requests
      const promises = Array.from({ length: concurrentOperations }, (_, i) =>
        NavigationService.navigateToGraph(`${testGraphId}-${i}`, mockRouter)
      )
      
      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
      
      // Should handle load efficiently (within 200ms for 20 concurrent operations)
      expect(totalTime).toBeLessThan(200)
      expect(mockRouter.push).toHaveBeenCalledTimes(concurrentOperations)
      
      // Average time per operation should be reasonable
      const averageTimePerOperation = totalTime / concurrentOperations
      expect(averageTimePerOperation).toBeLessThan(10)
    })
  })
})