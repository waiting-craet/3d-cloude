/**
 * Navigation Service
 * 
 * Handles navigation to graph visualization pages with proper URL construction,
 * router integration, comprehensive error handling, and structured logging capabilities.
 * 
 * Requirements: 1.2, 2.2, 2.3, 2.4
 */

/**
 * Router interface for Next.js 13+ App Router
 */
export interface AppRouter {
  push: (href: string) => void
}

/**
 * Error types for navigation failures
 */
export enum NavigationErrorType {
  INVALID_GRAPH_ID = 'invalid_graph_id',
  ROUTER_UNAVAILABLE = 'router_unavailable',
  NAVIGATION_FAILED = 'navigation_failed',
  URL_CONSTRUCTION_FAILED = 'url_construction_failed',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Error recovery strategies
 */
export enum ErrorRecoveryStrategy {
  SHOW_ERROR = 'show_error',
  RETRY_OPERATION = 'retry_operation',
  MANUAL_NAVIGATION = 'manual_navigation',
  FALLBACK_UI = 'fallback_ui'
}

/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
  timestamp: string
  errorType: NavigationErrorType
  errorMessage: string
  graphId?: string
  userAction: string
  stackTrace?: string
  context?: Record<string, any>
  recoveryStrategy: ErrorRecoveryStrategy
  userMessage: string
}

/**
 * Result of a navigation operation
 */
export interface NavigationResult {
  success: boolean
  error?: string
}

/**
 * Enhanced navigation result with error details
 */
export interface EnhancedNavigationResult extends NavigationResult {
  errorType?: NavigationErrorType
  recoveryStrategy?: ErrorRecoveryStrategy
  logEntry?: ErrorLogEntry
  fallbackUrl?: string
}

/**
 * Navigation service for handling graph page navigation with comprehensive error handling
 */
export class NavigationService {
  private static errorLogs: ErrorLogEntry[] = []

  /**
   * Navigate to the graph visualization page with the specified graphId
   * 
   * @param graphId - The unique identifier of the graph to navigate to
   * @param router - Next.js App Router instance for navigation
   * @returns Promise<EnhancedNavigationResult> - Result of the navigation operation with error details
   */
  static async navigateToGraph(graphId: string, router: AppRouter): Promise<EnhancedNavigationResult> {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()

    try {
      // Validate input parameters with detailed error categorization
      if (!graphId || typeof graphId !== 'string' || graphId.trim().length === 0) {
        return this.handleError({
          errorType: NavigationErrorType.INVALID_GRAPH_ID,
          errorMessage: 'Invalid graphId: must be a non-empty string',
          graphId,
          userAction: 'navigate_to_graph',
          context: { graphId, graphIdType: typeof graphId },
          recoveryStrategy: ErrorRecoveryStrategy.SHOW_ERROR,
          userMessage: 'Invalid graph identifier provided. Please try again.',
          timestamp
        })
      }

      if (!router) {
        return this.handleError({
          errorType: NavigationErrorType.ROUTER_UNAVAILABLE,
          errorMessage: 'Router instance is required for navigation',
          graphId: graphId.trim(),
          userAction: 'navigate_to_graph',
          context: { routerAvailable: false },
          recoveryStrategy: ErrorRecoveryStrategy.MANUAL_NAVIGATION,
          userMessage: 'Navigation system unavailable. Please refresh the page and try again.',
          timestamp
        })
      }

      // Construct the URL with error handling
      let url: string
      try {
        url = `/graph?graphId=${encodeURIComponent(graphId.trim())}`
      } catch (urlError) {
        return this.handleError({
          errorType: NavigationErrorType.URL_CONSTRUCTION_FAILED,
          errorMessage: `URL construction failed: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`,
          graphId: graphId.trim(),
          userAction: 'navigate_to_graph',
          context: { originalGraphId: graphId, urlError: urlError instanceof Error ? urlError.message : String(urlError) },
          recoveryStrategy: ErrorRecoveryStrategy.MANUAL_NAVIGATION,
          userMessage: 'Failed to construct navigation URL. Please try again.',
          timestamp,
          stackTrace: urlError instanceof Error ? urlError.stack : undefined
        })
      }
      
      // Log navigation attempt with context
      console.log('NavigationService: Attempting navigation to:', url, {
        graphId: graphId.trim(),
        timestamp,
        startTime,
        context: 'auto_navigation_after_save'
      })

      // Perform navigation using Next.js App Router with error handling
      try {
        router.push(url)
      } catch (navigationError) {
        return this.handleError({
          errorType: NavigationErrorType.NAVIGATION_FAILED,
          errorMessage: `Router navigation failed: ${navigationError instanceof Error ? navigationError.message : 'Unknown navigation error'}`,
          graphId: graphId.trim(),
          userAction: 'navigate_to_graph',
          context: { 
            url, 
            navigationError: navigationError instanceof Error ? navigationError.message : String(navigationError),
            duration: Date.now() - startTime
          },
          recoveryStrategy: ErrorRecoveryStrategy.FALLBACK_UI,
          userMessage: 'Navigation failed. You can manually navigate to the graph using the link below.',
          timestamp,
          stackTrace: navigationError instanceof Error ? navigationError.stack : undefined
        })
      }

      // Log successful navigation with performance metrics
      const duration = Date.now() - startTime
      console.log('NavigationService: Navigation successful to:', url, {
        graphId: graphId.trim(),
        timestamp,
        duration: `${duration}ms`,
        success: true
      })

      return { 
        success: true,
        fallbackUrl: url
      }

    } catch (error) {
      // Handle unexpected errors
      return this.handleError({
        errorType: NavigationErrorType.UNKNOWN_ERROR,
        errorMessage: `Unexpected navigation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        graphId,
        userAction: 'navigate_to_graph',
        context: { 
          unexpectedError: true,
          duration: Date.now() - startTime
        },
        recoveryStrategy: ErrorRecoveryStrategy.MANUAL_NAVIGATION,
        userMessage: 'An unexpected error occurred. Please try refreshing the page.',
        timestamp,
        stackTrace: error instanceof Error ? error.stack : undefined
      })
    }
  }

  /**
   * Handle navigation errors with structured logging and recovery strategies
   */
  private static handleError(errorDetails: Omit<ErrorLogEntry, 'timestamp'> & { timestamp: string }): EnhancedNavigationResult {
    const logEntry: ErrorLogEntry = {
      ...errorDetails,
      timestamp: errorDetails.timestamp
    }

    // Add to error log
    this.errorLogs.push(logEntry)

    // Log structured error
    console.error('NavigationService: Navigation failed -', {
      errorType: logEntry.errorType,
      errorMessage: logEntry.errorMessage,
      graphId: logEntry.graphId,
      userAction: logEntry.userAction,
      recoveryStrategy: logEntry.recoveryStrategy,
      context: logEntry.context,
      timestamp: logEntry.timestamp
    })

    // Log stack trace separately if available
    if (logEntry.stackTrace) {
      console.error('NavigationService: Stack trace -', logEntry.stackTrace)
    }

    // Construct fallback URL if possible
    let fallbackUrl: string | undefined
    if (logEntry.graphId && this.isValidGraphId(logEntry.graphId)) {
      try {
        fallbackUrl = this.constructGraphUrl(logEntry.graphId)
      } catch {
        // Fallback URL construction failed, will be undefined
      }
    }

    return {
      success: false,
      error: logEntry.userMessage,
      errorType: logEntry.errorType,
      recoveryStrategy: logEntry.recoveryStrategy,
      logEntry,
      fallbackUrl
    }
  }

  /**
   * Get error recovery strategy for a specific error type
   */
  static getRecoveryStrategy(errorType: NavigationErrorType): ErrorRecoveryStrategy {
    switch (errorType) {
      case NavigationErrorType.INVALID_GRAPH_ID:
        return ErrorRecoveryStrategy.SHOW_ERROR
      case NavigationErrorType.ROUTER_UNAVAILABLE:
        return ErrorRecoveryStrategy.RETRY_OPERATION
      case NavigationErrorType.NAVIGATION_FAILED:
        return ErrorRecoveryStrategy.FALLBACK_UI
      case NavigationErrorType.URL_CONSTRUCTION_FAILED:
        return ErrorRecoveryStrategy.MANUAL_NAVIGATION
      case NavigationErrorType.UNKNOWN_ERROR:
      default:
        return ErrorRecoveryStrategy.MANUAL_NAVIGATION
    }
  }

  /**
   * Get user-friendly error message for a specific error type
   */
  static getUserMessage(errorType: NavigationErrorType, graphId?: string): string {
    switch (errorType) {
      case NavigationErrorType.INVALID_GRAPH_ID:
        return 'Invalid graph identifier. Please try saving the graph again.'
      case NavigationErrorType.ROUTER_UNAVAILABLE:
        return 'Navigation system unavailable. Please refresh the page and try again.'
      case NavigationErrorType.NAVIGATION_FAILED:
        return 'Navigation failed. You can manually navigate to the graph using the link below.'
      case NavigationErrorType.URL_CONSTRUCTION_FAILED:
        return 'Failed to construct navigation URL. Please try again.'
      case NavigationErrorType.UNKNOWN_ERROR:
      default:
        return 'An unexpected error occurred during navigation. Please try refreshing the page.'
    }
  }

  /**
   * Get recent error logs for debugging
   */
  static getErrorLogs(limit: number = 10): ErrorLogEntry[] {
    return this.errorLogs.slice(-limit)
  }

  /**
   * Clear error logs
   */
  static clearErrorLogs(): void {
    this.errorLogs = []
  }

  /**
   * Construct a graph URL without performing navigation
   * 
   * @param graphId - The unique identifier of the graph
   * @returns string - The constructed URL
   */
  static constructGraphUrl(graphId: string): string {
    if (!graphId || typeof graphId !== 'string' || graphId.trim().length === 0) {
      throw new Error('Invalid graphId: must be a non-empty string')
    }

    return `/graph?graphId=${encodeURIComponent(graphId.trim())}`
  }

  /**
   * Validate if a graphId is valid for navigation
   * 
   * @param graphId - The graph identifier to validate
   * @returns boolean - True if valid, false otherwise
   */
  static isValidGraphId(graphId: string): boolean {
    return !!(graphId && typeof graphId === 'string' && graphId.trim().length > 0)
  }

  /**
   * Retry navigation with exponential backoff
   */
  static async retryNavigation(
    graphId: string, 
    router: AppRouter, 
    maxRetries: number = 3, 
    baseDelay: number = 1000
  ): Promise<EnhancedNavigationResult> {
    let lastResult: EnhancedNavigationResult

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`NavigationService: Retry attempt ${attempt}/${maxRetries} for graphId: ${graphId}`)
      
      lastResult = await this.navigateToGraph(graphId, router)
      
      if (lastResult.success) {
        console.log(`NavigationService: Retry successful on attempt ${attempt}`)
        return lastResult
      }

      // Wait before next retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`NavigationService: Waiting ${delay}ms before retry ${attempt + 1}`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    console.error(`NavigationService: All ${maxRetries} retry attempts failed for graphId: ${graphId}`)
    return lastResult!
  }
}