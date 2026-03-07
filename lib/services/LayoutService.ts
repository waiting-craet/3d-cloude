/**
 * Layout Service Client
 * 
 * Provides a clean interface for frontend components to interact with the layout API endpoints.
 * 
 * Features:
 * - Type-safe API calls
 * - Automatic retry logic with exponential backoff
 * - Comprehensive error handling
 * - Request timeout handling
 * - Singleton pattern for easy use
 * 
 * Usage:
 * ```typescript
 * import { layoutService } from '@/lib/services/LayoutService';
 * 
 * // Convert graph to 3D
 * const result = await layoutService.convertTo3D('graph-123', 'force_directed');
 * 
 * // Update layout
 * const updateResult = await layoutService.updateLayout(
 *   'graph-123',
 *   [{ id: 'new-1', x2d: 100, y2d: 200, label: 'New Node' }],
 *   ['deleted-1']
 * );
 * ```
 */

import type {
  Node2D,
  Node3D,
  LayoutStrategy,
  LayoutConfig,
  LayoutQualityMetrics,
  ConvertTo3DResponse,
  IncrementalUpdateResponse,
  LayoutConfigRecord
} from '@/lib/layout/types';

// =====================================================
// Error Classes
// =====================================================

/**
 * Custom error class for layout service errors
 */
export class LayoutServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'LayoutServiceError';
  }
}

// =====================================================
// Request/Response Types
// =====================================================

/**
 * Convert to 3D request options
 */
interface ConvertTo3DOptions {
  strategy?: LayoutStrategy;
  config?: Partial<LayoutConfig>;
}

/**
 * Update layout request options
 */
interface UpdateLayoutOptions {
  newNodes?: Node2D[];
  deletedNodeIds?: string[];
}

/**
 * Save layout config request
 */
interface SaveLayoutConfigRequest {
  strategy?: LayoutStrategy;
  config?: Partial<LayoutConfig>;
}

/**
 * Get layout config response
 */
interface GetLayoutConfigResponse {
  id: string;
  graphId: string;
  strategy: LayoutStrategy;
  config: LayoutConfig;
  qualityScore: number;
  createdAt: string;
}

// =====================================================
// Layout Service Class
// =====================================================

/**
 * Layout Service Client
 * 
 * Provides methods to interact with layout API endpoints
 */
export class LayoutService {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number = 30000; // 30 seconds
  private readonly maxRetries: number = 3;

  constructor(baseUrl: string = '/api/graphs') {
    this.baseUrl = baseUrl;
  }

  // =====================================================
  // Public API Methods
  // =====================================================

  /**
   * Convert a 2D graph to 3D layout
   * 
   * @param graphId - The graph ID to convert
   * @param strategy - Optional layout strategy to use
   * @param config - Optional layout configuration
   * @returns Promise with conversion result
   * 
   * @example
   * ```typescript
   * const result = await layoutService.convertTo3D('graph-123', 'force_directed');
   * console.log(`Converted ${result.nodes.length} nodes with quality score ${result.metrics.qualityScore}`);
   * ```
   */
  async convertTo3D(
    graphId: string,
    strategy?: LayoutStrategy,
    config?: Partial<LayoutConfig>
  ): Promise<ConvertTo3DResponse> {
    this.validateGraphId(graphId);

    const options: ConvertTo3DOptions = {};
    if (strategy) options.strategy = strategy;
    if (config) options.config = config;

    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/${graphId}/convert-to-3d`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        }
      );

      return this.handleResponse<ConvertTo3DResponse>(response);
    });
  }

  /**
   * Update layout incrementally with new or deleted nodes
   * 
   * @param graphId - The graph ID to update
   * @param newNodes - Optional array of new nodes to add
   * @param deletedNodeIds - Optional array of node IDs to delete
   * @returns Promise with update result
   * 
   * @example
   * ```typescript
   * const result = await layoutService.updateLayout(
   *   'graph-123',
   *   [{ id: 'new-1', x2d: 100, y2d: 200, label: 'New Node' }],
   *   ['deleted-1', 'deleted-2']
   * );
   * ```
   */
  async updateLayout(
    graphId: string,
    newNodes?: Node2D[],
    deletedNodeIds?: string[]
  ): Promise<IncrementalUpdateResponse> {
    this.validateGraphId(graphId);

    if (!newNodes && !deletedNodeIds) {
      throw new LayoutServiceError(
        'At least one of newNodes or deletedNodeIds must be provided',
        400
      );
    }

    const options: UpdateLayoutOptions = {};
    if (newNodes) options.newNodes = newNodes;
    if (deletedNodeIds) options.deletedNodeIds = deletedNodeIds;

    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/${graphId}/update-layout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        }
      );

      return this.handleResponse<IncrementalUpdateResponse>(response);
    });
  }

  /**
   * Reset layout and recalculate from scratch
   * 
   * @param graphId - The graph ID to reset
   * @param strategy - Optional layout strategy to use
   * @param config - Optional layout configuration
   * @returns Promise with conversion result
   * 
   * @example
   * ```typescript
   * const result = await layoutService.resetLayout('graph-123', 'hierarchical');
   * ```
   */
  async resetLayout(
    graphId: string,
    strategy?: LayoutStrategy,
    config?: Partial<LayoutConfig>
  ): Promise<ConvertTo3DResponse> {
    this.validateGraphId(graphId);

    const options: ConvertTo3DOptions = {};
    if (strategy) options.strategy = strategy;
    if (config) options.config = config;

    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/${graphId}/reset-layout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        }
      );

      return this.handleResponse<ConvertTo3DResponse>(response);
    });
  }

  /**
   * Get the current layout configuration for a graph
   * 
   * @param graphId - The graph ID
   * @returns Promise with layout configuration
   * 
   * @example
   * ```typescript
   * const config = await layoutService.getLayoutConfig('graph-123');
   * console.log(`Current strategy: ${config.strategy}`);
   * ```
   */
  async getLayoutConfig(graphId: string): Promise<GetLayoutConfigResponse> {
    this.validateGraphId(graphId);

    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/${graphId}/layout-config`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return this.handleResponse<GetLayoutConfigResponse>(response);
    });
  }

  /**
   * Save layout configuration for a graph
   * 
   * @param graphId - The graph ID
   * @param strategy - Optional layout strategy
   * @param config - Optional layout configuration
   * @returns Promise with save result
   * 
   * @example
   * ```typescript
   * await layoutService.saveLayoutConfig('graph-123', 'radial', {
   *   heightVariation: 10,
   *   minNodeDistance: 20
   * });
   * ```
   */
  async saveLayoutConfig(
    graphId: string,
    strategy?: LayoutStrategy,
    config?: Partial<LayoutConfig>
  ): Promise<{ success: boolean; configId: string }> {
    this.validateGraphId(graphId);

    const request: SaveLayoutConfigRequest = {};
    if (strategy) request.strategy = strategy;
    if (config) request.config = config;

    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/${graphId}/layout-config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      return this.handleResponse<{ success: boolean; configId: string }>(response);
    });
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  /**
   * Validate graph ID
   */
  private validateGraphId(graphId: string): void {
    if (!graphId || typeof graphId !== 'string' || graphId.trim() === '') {
      throw new LayoutServiceError('Invalid graphId: must be a non-empty string', 400);
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = this.defaultTimeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LayoutServiceError(
          `Request timeout after ${timeout}ms`,
          408,
          'The server took too long to respond. The graph may be too large or complex.'
        );
      }
      throw error;
    }
  }

  /**
   * Handle HTTP response and parse JSON
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: string | undefined;

      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.details) {
          errorDetails = errorData.details;
        }
      } catch {
        // If JSON parsing fails, use default error message
      }

      throw new LayoutServiceError(errorMessage, response.status, errorDetails);
    }

    // Parse successful response
    try {
      const data = await response.json();
      return data as T;
    } catch (error) {
      throw new LayoutServiceError(
        'Failed to parse response JSON',
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Retry a request with exponential backoff
   * 
   * Retries on:
   * - Network errors
   * - 503 Service Unavailable
   * - 408 Request Timeout
   * 
   * Does NOT retry on:
   * - 400 Bad Request
   * - 404 Not Found
   * - 401 Unauthorized
   * - Other client errors
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        const shouldRetry = this.shouldRetryError(error, attempt, maxRetries);

        if (!shouldRetry) {
          throw error;
        }

        // Calculate backoff delay: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `[LayoutService] Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`,
          error
        );

        // Wait before retrying
        await this.delay(delay);
      }
    }

    // All retries exhausted
    throw new LayoutServiceError(
      `Request failed after ${maxRetries} attempts`,
      500,
      lastError?.message
    );
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetryError(error: unknown, attempt: number, maxRetries: number): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= maxRetries - 1) {
      return false;
    }

    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error instanceof LayoutServiceError) {
      const retryableStatusCodes = [408, 503, 504]; // Timeout, Service Unavailable, Gateway Timeout
      return error.statusCode ? retryableStatusCodes.includes(error.statusCode) : false;
    }

    // Don't retry other errors
    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =====================================================
// Singleton Instance
// =====================================================

/**
 * Singleton instance of LayoutService for easy use throughout the application
 * 
 * @example
 * ```typescript
 * import { layoutService } from '@/lib/services/LayoutService';
 * 
 * const result = await layoutService.convertTo3D('graph-123');
 * ```
 */
export const layoutService = new LayoutService();

// =====================================================
// Export Types
// =====================================================

export type {
  ConvertTo3DOptions,
  UpdateLayoutOptions,
  SaveLayoutConfigRequest,
  GetLayoutConfigResponse,
};
