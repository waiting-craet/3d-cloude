/**
 * Unit Tests for AI Integration Service
 * 
 * Tests API error handling, response transformation, and timeout handling
 * Requirements: 1.5
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  AIIntegrationServiceImpl,
  createAIIntegrationService,
  type AIAnalysisResult,
} from '../ai-integration'

describe('AI Integration Service', () => {
  let mockFetch: jest.Mock
  let originalFetch: typeof global.fetch
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original fetch and environment
    originalFetch = global.fetch
    originalEnv = { ...process.env }
    
    // Mock fetch
    mockFetch = jest.fn()
    global.fetch = mockFetch as any
    
    // Set test environment variables
    process.env.AI_API_KEY = 'test-api-key'
    process.env.AI_API_ENDPOINT = 'https://test-api.example.com/analyze'
  })

  afterEach(() => {
    // Restore original fetch and environment
    global.fetch = originalFetch
    process.env = originalEnv
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should throw error if API key is not configured', () => {
      delete process.env.AI_API_KEY
      
      expect(() => {
        new AIIntegrationServiceImpl()
      }).toThrow('AI_API_KEY is not configured')
    })

    it('should use environment variables by default', () => {
      const service = new AIIntegrationServiceImpl()
      expect(service).toBeDefined()
    })

    it('should accept custom configuration', () => {
      const service = new AIIntegrationServiceImpl({
        apiKey: 'custom-key',
        apiEndpoint: 'https://custom-endpoint.com',
        timeout: 5000,
      })
      expect(service).toBeDefined()
    })
  })

  describe('analyzeDocument', () => {
    it('should throw error for empty text', async () => {
      const service = new AIIntegrationServiceImpl()
      
      await expect(service.analyzeDocument('')).rejects.toThrow('Document text cannot be empty')
      await expect(service.analyzeDocument('   ')).rejects.toThrow('Document text cannot be empty')
    })

    it('should successfully analyze document with valid response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              entities: [
                { name: 'Entity1', type: 'concept', properties: { key: 'value' } },
                { name: 'Entity2', type: 'person', properties: {} },
              ],
              relationships: [
                { from: 'Entity1', to: 'Entity2', type: 'relates_to', properties: {} },
              ],
            }),
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      const result = await service.analyzeDocument('Test document text')

      expect(result.entities).toHaveLength(2)
      expect(result.relationships).toHaveLength(1)
      expect(result.entities[0].name).toBe('Entity1')
      expect(result.relationships[0].from).toBe('Entity1')
      expect(result.relationships[0].to).toBe('Entity2')
    })

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error details',
      })

      const service = new AIIntegrationServiceImpl()
      
      await expect(service.analyzeDocument('Test text')).rejects.toThrow('AI API returned 500')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const service = new AIIntegrationServiceImpl()
      
      await expect(service.analyzeDocument('Test text')).rejects.toThrow('Unable to analyze document')
    })

    it('should handle timeout errors', async () => {
      // Mock fetch to simulate an abort error
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('The operation was aborted')
        error.name = 'AbortError'
        return Promise.reject(error)
      })

      const service = new AIIntegrationServiceImpl({ timeout: 50 })
      
      await expect(service.analyzeDocument('Test text')).rejects.toThrow('timed out')
    })

    it('should filter out entities with invalid names', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              entities: [
                { name: 'ValidEntity', type: 'concept', properties: {} },
                { name: '', type: 'concept', properties: {} }, // Invalid: empty name
                { type: 'concept', properties: {} }, // Invalid: missing name
                { name: 123, type: 'concept', properties: {} }, // Invalid: non-string name
              ],
              relationships: [],
            }),
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      const result = await service.analyzeDocument('Test text')

      // Only the valid entity should be included
      expect(result.entities).toHaveLength(1)
      expect(result.entities[0].name).toBe('ValidEntity')
    })

    it('should filter out relationships with invalid from/to references', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              entities: [
                { name: 'Entity1', type: 'concept', properties: {} },
                { name: 'Entity2', type: 'concept', properties: {} },
              ],
              relationships: [
                { from: 'Entity1', to: 'Entity2', type: 'valid', properties: {} }, // Valid
                { from: 'Entity1', to: 'NonExistent', type: 'invalid', properties: {} }, // Invalid: to doesn't exist
                { from: 'NonExistent', to: 'Entity2', type: 'invalid', properties: {} }, // Invalid: from doesn't exist
                { from: '', to: 'Entity2', type: 'invalid', properties: {} }, // Invalid: empty from
                { to: 'Entity2', type: 'invalid', properties: {} }, // Invalid: missing from
              ],
            }),
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      const result = await service.analyzeDocument('Test text')

      // Only the valid relationship should be included
      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].from).toBe('Entity1')
      expect(result.relationships[0].to).toBe('Entity2')
    })

    it('should handle case-insensitive entity name matching in relationships', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              entities: [
                { name: 'Entity1', type: 'concept', properties: {} },
                { name: 'Entity2', type: 'concept', properties: {} },
              ],
              relationships: [
                { from: 'entity1', to: 'ENTITY2', type: 'relates_to', properties: {} }, // Different case
              ],
            }),
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      const result = await service.analyzeDocument('Test text')

      // Relationship should be included despite case differences
      expect(result.relationships).toHaveLength(1)
    })

    it('should trim whitespace from entity names', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              entities: [
                { name: '  Entity1  ', type: 'concept', properties: {} },
                { name: '\tEntity2\n', type: 'concept', properties: {} },
              ],
              relationships: [],
            }),
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      const result = await service.analyzeDocument('Test text')

      expect(result.entities[0].name).toBe('Entity1')
      expect(result.entities[1].name).toBe('Entity2')
    })

    it('should provide default values for missing properties', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              entities: [
                { name: 'Entity1' }, // Missing type and properties
              ],
              relationships: [
                { from: 'Entity1', to: 'Entity1' }, // Missing type and properties
              ],
            }),
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      const result = await service.analyzeDocument('Test text')

      expect(result.entities[0].type).toBe('entity')
      expect(result.entities[0].properties).toEqual({})
      expect(result.relationships[0].type).toBe('related_to')
      expect(result.relationships[0].properties).toEqual({})
    })

    it('should handle malformed JSON in API response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is not valid JSON',
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      
      await expect(service.analyzeDocument('Test text')).rejects.toThrow('Failed to parse AI API response')
    })

    it('should handle missing entities array in response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              // Missing entities array
              relationships: [],
            }),
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      const result = await service.analyzeDocument('Test text')

      expect(result.entities).toEqual([])
      expect(result.relationships).toEqual([])
    })

    it('should handle missing relationships array in response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              entities: [
                { name: 'Entity1', type: 'concept', properties: {} },
              ],
              // Missing relationships array
            }),
          },
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const service = new AIIntegrationServiceImpl()
      const result = await service.analyzeDocument('Test text')

      expect(result.entities).toHaveLength(1)
      expect(result.relationships).toEqual([])
    })
  })

  describe('Factory Functions', () => {
    it('should create service instance with createAIIntegrationService', () => {
      const service = createAIIntegrationService()
      expect(service).toBeDefined()
    })

    it('should accept custom config in factory function', () => {
      const service = createAIIntegrationService({
        apiKey: 'custom-key',
        timeout: 5000,
      })
      expect(service).toBeDefined()
    })
  })

  describe('Error Message Sanitization', () => {
    it('should not expose API key in error messages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API key test-api-key is invalid'))

      const service = new AIIntegrationServiceImpl()
      
      try {
        await service.analyzeDocument('Test text')
        fail('Should have thrown an error')
      } catch (error) {
        if (error instanceof Error) {
          // Error message should be generic, not expose API key
          expect(error.message).not.toContain('test-api-key')
          expect(error.message).toBe('Unable to analyze document. Please try again later.')
        }
      }
    })

    it('should not expose endpoint URL in error messages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to connect to https://test-api.example.com'))

      const service = new AIIntegrationServiceImpl()
      
      try {
        await service.analyzeDocument('Test text')
        fail('Should have thrown an error')
      } catch (error) {
        if (error instanceof Error) {
          // Error message should be generic
          expect(error.message).not.toContain('test-api.example.com')
          expect(error.message).toBe('Unable to analyze document. Please try again later.')
        }
      }
    })
  })
})
