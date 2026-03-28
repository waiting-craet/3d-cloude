/**
 * Property-Based Tests for AI Integration Service
 * 
 * Feature: ai-document-analysis
 * Property 1: AI API Response Validation
 * Validates: Requirements 1.1, 1.2, 1.3
 * 
 * For any valid document text input, when the AI Model API returns a response,
 * the response should contain well-formed entities and relationships arrays,
 * and all entity names referenced in relationships should exist in the entities array.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import * as fc from 'fast-check'
import { AIIntegrationServiceImpl } from '../ai-integration'

describe('AI Integration Service - Property 1: AI API Response Validation', () => {
  let mockFetch: jest.Mock
  let originalFetch: typeof global.fetch
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalFetch = global.fetch
    originalEnv = { ...process.env }
    
    mockFetch = jest.fn()
    global.fetch = mockFetch as any
    
    process.env.AI_API_KEY = 'test-api-key'
    process.env.AI_API_ENDPOINT = 'https://test-api.example.com/analyze'
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = originalEnv
    jest.clearAllMocks()
  })

  it('should ensure all entity names in relationships exist in entities array', async () => {
    // Property: For any AI API response, all entity names referenced in relationships
    // must exist in the entities array (case-insensitive matching)
    
    await fc.assert(
      fc.asyncProperty(
        // Generate random entities with non-whitespace names
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            type: fc.constantFrom('person', 'organization', 'concept', 'location', 'entity'),
            properties: fc.dictionary(fc.string(), fc.anything()),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        // Generate random relationships that reference the entities
        async (entities) => {
          // Create relationships that reference existing entities
          const entityNames = entities.map(e => e.name)
          
          const relationships = []
          if (entityNames.length >= 2) {
            // Create some valid relationships
            for (let i = 0; i < Math.min(5, entityNames.length - 1); i++) {
              relationships.push({
                from: entityNames[i],
                to: entityNames[i + 1],
                type: 'relates_to',
                properties: {},
              })
            }
          }
          
          // Mock API response
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify({
                  entities,
                  relationships,
                }),
              },
            }],
          }
          
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          })
          
          const service = new AIIntegrationServiceImpl()
          const result = await service.analyzeDocument('Test document')
          
          // Verify all entities are present
          expect(result.entities.length).toBeGreaterThan(0)
          expect(Array.isArray(result.entities)).toBe(true)
          
          // Verify all relationships are present
          expect(Array.isArray(result.relationships)).toBe(true)
          
          // Create a set of entity names (case-insensitive)
          const entityNameSet = new Set(
            result.entities.map(e => e.name.toLowerCase())
          )
          
          // Verify all relationships reference existing entities
          for (const rel of result.relationships) {
            expect(entityNameSet.has(rel.from.toLowerCase())).toBe(true)
            expect(entityNameSet.has(rel.to.toLowerCase())).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should filter out relationships with non-existent entity references', async () => {
    // Property: For any AI API response containing relationships with invalid entity references,
    // those relationships should be filtered out, and only valid relationships should be returned
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Ensure non-empty after trim
            type: fc.constantFrom('person', 'organization', 'concept', 'location'),
            properties: fc.dictionary(fc.string(), fc.anything()),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        fc.array(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Ensure non-empty after trim
          { minLength: 1, maxLength: 5 }
        ),
        async (entities, invalidEntityNames) => {
          const entityNames = entities.map(e => e.name)
          
          // Create mix of valid and invalid relationships
          const relationships = []
          
          // Add valid relationships
          if (entityNames.length >= 2) {
            relationships.push({
              from: entityNames[0],
              to: entityNames[1],
              type: 'valid_relationship',
              properties: {},
            })
          }
          
          // Add invalid relationships (referencing non-existent entities)
          for (const invalidName of invalidEntityNames) {
            // Make sure the invalid name doesn't accidentally match a valid entity
            if (!entityNames.some(name => name.toLowerCase() === invalidName.toLowerCase())) {
              relationships.push({
                from: entityNames[0],
                to: invalidName,
                type: 'invalid_relationship',
                properties: {},
              })
            }
          }
          
          // Mock API response
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify({
                  entities,
                  relationships,
                }),
              },
            }],
          }
          
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          })
          
          const service = new AIIntegrationServiceImpl()
          const result = await service.analyzeDocument('Test document')
          
          // Create a set of valid entity names (case-insensitive)
          const validEntityNames = new Set(
            result.entities.map(e => e.name.toLowerCase())
          )
          
          // All returned relationships must reference valid entities
          for (const rel of result.relationships) {
            expect(validEntityNames.has(rel.from.toLowerCase())).toBe(true)
            expect(validEntityNames.has(rel.to.toLowerCase())).toBe(true)
          }
          
          // At least one valid relationship should be present (if we had valid entities)
          if (result.entities.length >= 2) {
            expect(result.relationships.length).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should ensure all entities have required fields (name, type, properties)', async () => {
    // Property: For any AI API response, all returned entities must have
    // name (string), type (string), and properties (object) fields
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Ensure non-empty after trim
            type: fc.option(fc.constantFrom('person', 'organization', 'concept'), { nil: undefined }),
            properties: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (entities) => {
          // Mock API response
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify({
                  entities,
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
          const result = await service.analyzeDocument('Test document')
          
          // Verify all entities have required fields
          for (const entity of result.entities) {
            // Name must be a non-empty string
            expect(typeof entity.name).toBe('string')
            expect(entity.name.length).toBeGreaterThan(0)
            
            // Type must be a string (default 'entity' if not provided)
            expect(typeof entity.type).toBe('string')
            expect(entity.type.length).toBeGreaterThan(0)
            
            // Properties must be an object
            expect(typeof entity.properties).toBe('object')
            expect(entity.properties).not.toBeNull()
            expect(Array.isArray(entity.properties)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should ensure all relationships have required fields (from, to, type, properties)', async () => {
    // Property: For any AI API response, all returned relationships must have
    // from (string), to (string), type (string), and properties (object) fields
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Ensure non-empty after trim
            type: fc.constantFrom('person', 'organization', 'concept'),
            properties: fc.dictionary(fc.string(), fc.anything()),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (entities) => {
          const entityNames = entities.map(e => e.name)
          
          // Create relationships with optional fields
          const relationships = []
          for (let i = 0; i < entityNames.length - 1; i++) {
            relationships.push({
              from: entityNames[i],
              to: entityNames[i + 1],
              type: Math.random() > 0.5 ? 'relates_to' : undefined,
              properties: Math.random() > 0.5 ? { key: 'value' } : undefined,
            })
          }
          
          // Mock API response
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify({
                  entities,
                  relationships,
                }),
              },
            }],
          }
          
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          })
          
          const service = new AIIntegrationServiceImpl()
          const result = await service.analyzeDocument('Test document')
          
          // Verify all relationships have required fields
          for (const rel of result.relationships) {
            // From must be a non-empty string
            expect(typeof rel.from).toBe('string')
            expect(rel.from.length).toBeGreaterThan(0)
            
            // To must be a non-empty string
            expect(typeof rel.to).toBe('string')
            expect(rel.to.length).toBeGreaterThan(0)
            
            // Type must be a string (default 'related_to' if not provided)
            expect(typeof rel.type).toBe('string')
            expect(rel.type.length).toBeGreaterThan(0)
            
            // Properties must be an object
            expect(typeof rel.properties).toBe('object')
            expect(rel.properties).not.toBeNull()
            expect(Array.isArray(rel.properties)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle case-insensitive entity name matching in relationships', async () => {
    // Property: For any AI API response, entity name matching in relationships
    // should be case-insensitive
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Ensure non-empty after trim
            type: fc.constantFrom('person', 'organization', 'concept'),
            properties: fc.dictionary(fc.string(), fc.anything()),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (entities) => {
          const entityNames = entities.map(e => e.name)
          
          // Create relationships with different case variations
          const relationships = []
          for (let i = 0; i < entityNames.length - 1; i++) {
            const fromName = entityNames[i]
            const toName = entityNames[i + 1]
            
            // Randomly vary the case
            const fromVariation = Math.random() > 0.5 ? fromName.toUpperCase() : fromName.toLowerCase()
            const toVariation = Math.random() > 0.5 ? toName.toUpperCase() : toName.toLowerCase()
            
            relationships.push({
              from: fromVariation,
              to: toVariation,
              type: 'relates_to',
              properties: {},
            })
          }
          
          // Mock API response
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify({
                  entities,
                  relationships,
                }),
              },
            }],
          }
          
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          })
          
          const service = new AIIntegrationServiceImpl()
          const result = await service.analyzeDocument('Test document')
          
          // All relationships should be included despite case differences
          expect(result.relationships.length).toBe(relationships.length)
          
          // Create a set of entity names (case-insensitive)
          const entityNameSet = new Set(
            result.entities.map(e => e.name.toLowerCase())
          )
          
          // Verify all relationships reference existing entities (case-insensitive)
          for (const rel of result.relationships) {
            expect(entityNameSet.has(rel.from.toLowerCase())).toBe(true)
            expect(entityNameSet.has(rel.to.toLowerCase())).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should trim whitespace from entity names', async () => {
    // Property: For any AI API response, entity names should have leading/trailing
    // whitespace trimmed
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `  ${s}  `), // Add whitespace
            type: fc.constantFrom('person', 'organization', 'concept'),
            properties: fc.dictionary(fc.string(), fc.anything()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (entities) => {
          // Mock API response
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify({
                  entities,
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
          const result = await service.analyzeDocument('Test document')
          
          // Verify all entity names are trimmed
          for (const entity of result.entities) {
            expect(entity.name).toBe(entity.name.trim())
            expect(entity.name).not.toMatch(/^\s/)
            expect(entity.name).not.toMatch(/\s$/)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty entities and relationships arrays', async () => {
    // Property: For any AI API response with empty arrays, the service should
    // return empty arrays without errors
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { entities: [], relationships: [] },
          { entities: [], relationships: undefined },
          { entities: undefined, relationships: [] },
          { entities: undefined, relationships: undefined }
        ),
        async (responseData) => {
          // Mock API response
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify(responseData),
              },
            }],
          }
          
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          })
          
          const service = new AIIntegrationServiceImpl()
          const result = await service.analyzeDocument('Test document')
          
          // Should return empty arrays, not undefined or null
          expect(Array.isArray(result.entities)).toBe(true)
          expect(Array.isArray(result.relationships)).toBe(true)
          expect(result.entities).toEqual([])
          expect(result.relationships).toEqual([])
        }
      ),
      { numRuns: 100 }
    )
  })
})
