/**
 * Navigation Service Error Handling Tests
 * 
 * Tests the comprehensive error handling capabilities of the NavigationService
 * including structured logging, error categorization, and recovery strategies.
 * 
 * Requirements: 2.2, 2.3, 2.4
 */

import { 
  NavigationService, 
  NavigationErrorType, 
  ErrorRecoveryStrategy,
  AppRouter,
  EnhancedNavigationResult 
} from '../navigation-service'

describe('NavigationService Error Handling', () => {
  let mockRouter: AppRouter

  beforeEach(() => {
    // Clear error logs before each test
    NavigationService.clearErrorLogs()
    
    // Create mock router
    mockRouter = {
      push: jest.fn()
    }
  })

  describe('Error Categorization', () => {
    it('should categorize invalid graphId errors correctly', async () => {
      const result = await NavigationService.navigateToGraph('', mockRouter)
      
      expect(result.success).toBe(false)
      expect(result.errorType).toBe(NavigationErrorType.INVALID_GRAPH_ID)
      expect(result.recoveryStrategy).toBe(ErrorRecoveryStrategy.SHOW_ERROR)
      expect(result.error).toContain('Invalid graph identifier')
    })

    it('should categorize router unavailable errors correctly', async () => {
      const result = await NavigationService.navigateToGraph('test-id', null as any)
      
      expect(result.success).toBe(false)
      expect(result.errorType).toBe(NavigationErrorType.ROUTER_UNAVAILABLE)
      expect(result.recoveryStrategy).toBe(ErrorRecoveryStrategy.MANUAL_NAVIGATION)
      expect(result.error).toContain('Navigation system unavailable')
    })

    it('should categorize navigation failures correctly', async () => {
      const failingRouter = {
        push: jest.fn().mockImplementation(() => {
          throw new Error('Router push failed')
        })
      }

      const result = await NavigationService.navigateToGraph('test-id', failingRouter)
      
      expect(result.success).toBe(false)
      expect(result.errorType).toBe(NavigationErrorType.NAVIGATION_FAILED)
      expect(result.recoveryStrategy).toBe(ErrorRecoveryStrategy.FALLBACK_UI)
      expect(result.error).toContain('manually navigate')
    })
  })

  describe('Structured Logging', () => {
    it('should log structured error information', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await NavigationService.navigateToGraph('', mockRouter)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'NavigationService: Navigation failed -',
        expect.objectContaining({
          errorType: NavigationErrorType.INVALID_GRAPH_ID,
          errorMessage: expect.any(String),
          userAction: 'navigate_to_graph',
          recoveryStrategy: ErrorRecoveryStrategy.SHOW_ERROR,
          context: expect.any(Object),
          timestamp: expect.any(String)
        })
      )
      
      consoleSpy.mockRestore()
    })

    it('should maintain error logs', async () => {
      await NavigationService.navigateToGraph('', mockRouter)
      await NavigationService.navigateToGraph('invalid', null as any)
      
      const logs = NavigationService.getErrorLogs()
      expect(logs).toHaveLength(2)
      expect(logs[0].errorType).toBe(NavigationErrorType.INVALID_GRAPH_ID)
      expect(logs[1].errorType).toBe(NavigationErrorType.ROUTER_UNAVAILABLE)
    })
  })

  describe('Recovery Strategies', () => {
    it('should provide correct recovery strategy for each error type', () => {
      expect(NavigationService.getRecoveryStrategy(NavigationErrorType.INVALID_GRAPH_ID))
        .toBe(ErrorRecoveryStrategy.SHOW_ERROR)
      
      expect(NavigationService.getRecoveryStrategy(NavigationErrorType.ROUTER_UNAVAILABLE))
        .toBe(ErrorRecoveryStrategy.RETRY_OPERATION)
      
      expect(NavigationService.getRecoveryStrategy(NavigationErrorType.NAVIGATION_FAILED))
        .toBe(ErrorRecoveryStrategy.FALLBACK_UI)
      
      expect(NavigationService.getRecoveryStrategy(NavigationErrorType.URL_CONSTRUCTION_FAILED))
        .toBe(ErrorRecoveryStrategy.MANUAL_NAVIGATION)
    })

    it('should provide user-friendly error messages', () => {
      const message = NavigationService.getUserMessage(NavigationErrorType.NAVIGATION_FAILED)
      expect(message).toContain('manually navigate')
      expect(message).not.toContain('undefined')
      expect(message).not.toContain('null')
    })
  })

  describe('Fallback URL Generation', () => {
    it('should provide fallback URL for valid graphId', async () => {
      const result = await NavigationService.navigateToGraph('test-123', null as any)
      
      expect(result.fallbackUrl).toBe('/graph?graphId=test-123')
    })

    it('should not provide fallback URL for invalid graphId', async () => {
      const result = await NavigationService.navigateToGraph('', mockRouter)
      
      expect(result.fallbackUrl).toBeUndefined()
    })
  })

  describe('Retry Mechanism', () => {
    it('should retry navigation with exponential backoff', async () => {
      const failingRouter = {
        push: jest.fn().mockImplementation(() => {
          throw new Error('Router push failed')
        })
      }

      const startTime = Date.now()
      const result = await NavigationService.retryNavigation('test-id', failingRouter, 2, 100)
      const duration = Date.now() - startTime
      
      expect(result.success).toBe(false)
      expect(failingRouter.push).toHaveBeenCalledTimes(2) // Initial + 1 retry
      expect(duration).toBeGreaterThan(100) // Should have waited for retry delay
    })

    it('should succeed on retry if router becomes available', async () => {
      let callCount = 0
      const intermittentRouter = {
        push: jest.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            throw new Error('First attempt fails')
          }
          // Second attempt succeeds
        })
      }

      const result = await NavigationService.retryNavigation('test-id', intermittentRouter, 2, 50)
      
      expect(result.success).toBe(true)
      expect(intermittentRouter.push).toHaveBeenCalledTimes(2)
    })
  })

  describe('Context Information', () => {
    it('should include relevant context in error logs', async () => {
      await NavigationService.navigateToGraph('', mockRouter)
      
      const logs = NavigationService.getErrorLogs()
      expect(logs[0].context).toEqual({
        graphId: '',
        graphIdType: 'string'
      })
    })

    it('should include performance metrics in successful navigation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await NavigationService.navigateToGraph('test-id', mockRouter)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'NavigationService: Navigation successful to:',
        '/graph?graphId=test-id',
        expect.objectContaining({
          graphId: 'test-id',
          timestamp: expect.any(String),
          duration: expect.stringMatching(/\d+ms/),
          success: true
        })
      )
      
      consoleSpy.mockRestore()
    })
  })
})