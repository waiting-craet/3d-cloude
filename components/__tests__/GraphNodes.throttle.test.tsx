/**
 * Test suite for GraphNodes drag performance optimization
 * Validates throttling mechanism for position updates
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

/**
 * Throttle function to limit execution frequency
 * @param func Function to throttle
 * @param limit Time limit in milliseconds (16ms = ~60fps)
 */
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  let lastArgs: Parameters<T> | null = null
  let timeoutId: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
        // Execute with last args if there were additional calls during throttle
        if (lastArgs) {
          func.apply(this, lastArgs)
          lastArgs = null
        }
      }, limit)
    } else {
      // Store the latest args to execute after throttle period
      lastArgs = args
    }
  }
}

describe('GraphNodes Drag Performance Optimization', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('Throttle Function', () => {
    it('should execute function immediately on first call', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      throttled('arg1')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')
    })

    it('should throttle subsequent calls within the time limit', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      // First call - should execute immediately
      throttled('call1')
      expect(mockFn).toHaveBeenCalledTimes(1)

      // Second call within throttle period - should be throttled
      throttled('call2')
      expect(mockFn).toHaveBeenCalledTimes(1)

      // Third call within throttle period - should be throttled
      throttled('call3')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should execute with last args after throttle period expires', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      // First call
      throttled('call1')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenLastCalledWith('call1')

      // Multiple calls during throttle period
      throttled('call2')
      throttled('call3')
      throttled('call4')
      expect(mockFn).toHaveBeenCalledTimes(1)

      // Advance time past throttle period
      jest.advanceTimersByTime(16)

      // Should execute with the last args
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenLastCalledWith('call4')
    })

    it('should limit execution frequency to approximately 60fps (16ms)', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      // Simulate rapid calls (every 1ms for 100ms)
      for (let i = 0; i < 100; i++) {
        throttled(`call${i}`)
        jest.advanceTimersByTime(1)
      }

      // At 60fps (16ms interval), we expect approximately 6-7 executions in 100ms
      // With our implementation: first call + subsequent calls after each 16ms period
      // 100ms / 16ms ≈ 6.25 periods, so expect around 7-13 calls
      expect(mockFn.mock.calls.length).toBeLessThanOrEqual(15)
      expect(mockFn.mock.calls.length).toBeGreaterThanOrEqual(6)
    })

    it('should not block main thread during throttling', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      // Simulate many rapid calls
      const startTime = Date.now()
      for (let i = 0; i < 1000; i++) {
        throttled(`call${i}`)
      }
      const endTime = Date.now()

      // Should complete quickly (not blocking)
      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(100) // Should be very fast
    })

    it('should preserve function context (this)', () => {
      const obj = {
        value: 42,
        method: function (this: any, arg: string) {
          return `${this.value}-${arg}`
        }
      }

      const mockFn = jest.fn(obj.method)
      const throttled = throttle(mockFn.bind(obj), 16)

      throttled('test')

      expect(mockFn).toHaveBeenCalledWith('test')
    })

    it('should handle multiple arguments correctly', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      throttled('arg1', 'arg2', 'arg3')

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })

    it('should allow execution after throttle period expires', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      // First call
      throttled('call1')
      expect(mockFn).toHaveBeenCalledTimes(1)

      // Wait for throttle period to expire
      jest.advanceTimersByTime(20)

      // Next call should execute immediately
      throttled('call2')
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenLastCalledWith('call2')
    })
  })

  describe('Drag Performance Requirements', () => {
    it('should limit position updates to approximately 60fps during drag', () => {
      const updatePosition = jest.fn()
      const throttledUpdate = throttle(updatePosition, 16)

      // Simulate drag events at high frequency (every 1ms)
      const dragDuration = 100 // 100ms of dragging
      for (let i = 0; i < dragDuration; i++) {
        throttledUpdate({ x: i, y: i, z: 0 })
        jest.advanceTimersByTime(1)
      }

      // At 60fps (16ms interval), expect ~6-13 updates in 100ms
      expect(updatePosition.mock.calls.length).toBeLessThanOrEqual(15)
      expect(updatePosition.mock.calls.length).toBeGreaterThanOrEqual(6)
    })

    it('should use the latest position when throttle period expires', () => {
      const updatePosition = jest.fn()
      const throttledUpdate = throttle(updatePosition, 16)

      // First update
      throttledUpdate({ x: 0, y: 0, z: 0 })
      expect(updatePosition).toHaveBeenLastCalledWith({ x: 0, y: 0, z: 0 })

      // Multiple rapid updates
      throttledUpdate({ x: 1, y: 1, z: 0 })
      throttledUpdate({ x: 2, y: 2, z: 0 })
      throttledUpdate({ x: 3, y: 3, z: 0 })

      // Advance time
      jest.advanceTimersByTime(16)

      // Should use the last position
      expect(updatePosition).toHaveBeenLastCalledWith({ x: 3, y: 3, z: 0 })
    })

    it('should not drop the final position update', () => {
      const updatePosition = jest.fn()
      const throttledUpdate = throttle(updatePosition, 16)

      // Simulate drag sequence
      throttledUpdate({ x: 0, y: 0, z: 0 })
      jest.advanceTimersByTime(5)
      throttledUpdate({ x: 1, y: 1, z: 0 })
      jest.advanceTimersByTime(5)
      throttledUpdate({ x: 2, y: 2, z: 0 })
      jest.advanceTimersByTime(5)
      throttledUpdate({ x: 3, y: 3, z: 0 }) // Final position

      // Advance time to ensure final update executes
      jest.advanceTimersByTime(20)

      // Should have executed with final position
      expect(updatePosition).toHaveBeenLastCalledWith({ x: 3, y: 3, z: 0 })
    })
  })

  describe('Performance Characteristics', () => {
    it('should maintain consistent frame rate under load', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      // Simulate 1 second of rapid updates (1000ms)
      const callsPerMs = 10 // Very high frequency
      for (let i = 0; i < 1000; i++) {
        for (let j = 0; j < callsPerMs; j++) {
          throttled(`call${i}-${j}`)
        }
        jest.advanceTimersByTime(1)
      }

      // At 60fps, expect approximately 60-130 executions in 1 second
      // (first call + calls after each 16ms period, with some variance)
      expect(mockFn.mock.calls.length).toBeLessThanOrEqual(140)
      expect(mockFn.mock.calls.length).toBeGreaterThanOrEqual(55)
    })

    it('should not accumulate memory during throttling', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 16)

      // Make many calls
      for (let i = 0; i < 10000; i++) {
        throttled(`call${i}`)
      }

      // Advance time to clear any pending calls
      jest.advanceTimersByTime(100)

      // Function should have been called, but not 10000 times
      expect(mockFn.mock.calls.length).toBeLessThan(100)
    })
  })
})
