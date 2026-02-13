/**
 * Mock AI Integration Service for Development/Testing
 * 
 * This service provides a mock implementation of AI analysis
 * for development and testing purposes when real AI API is not available.
 */

import { AIIntegrationService, AIAnalysisResult, AIEntity, AIRelationship } from './ai-integration';

/**
 * Mock AI Integration Service Implementation
 */
export class MockAIIntegrationService implements AIIntegrationService {
  /**
   * Analyzes document text using mock data
   * Extracts entities and relationships based on simple patterns
   */
  async analyzeDocument(text: string): Promise<AIAnalysisResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Document text cannot be empty');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple entity extraction based on capitalized words
    const entities: AIEntity[] = [];
    const entityNames = new Set<string>();
    
    // Extract capitalized words as potential entities
    const words = text.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[.,!?;:()]/g, '');
      if (cleaned.length > 2 && /^[A-Z]/.test(cleaned) && !entityNames.has(cleaned)) {
        entityNames.add(cleaned);
        entities.push({
          name: cleaned,
          type: this.guessEntityType(cleaned),
          properties: {
            source: 'mock_extraction',
            confidence: 0.7,
          },
        });
      }
    }

    // Create mock relationships between entities
    const relationships: AIRelationship[] = [];
    const entityArray = Array.from(entityNames);
    
    for (let i = 0; i < entityArray.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 3, entityArray.length); j++) {
        relationships.push({
          from: entityArray[i],
          to: entityArray[j],
          type: this.guessRelationshipType(entityArray[i], entityArray[j]),
          properties: {
            source: 'mock_extraction',
            confidence: 0.6,
          },
        });
      }
    }

    console.log('[Mock AI Service] Analysis complete:', {
      entities: entities.length,
      relationships: relationships.length,
    });

    return {
      entities,
      relationships,
    };
  }

  /**
   * Guess entity type based on name
   */
  private guessEntityType(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.match(/^(john|mary|james|robert|michael|david|sarah|emma|lisa|anna)/i)) {
      return 'person';
    }
    if (lowerName.match(/^(company|corporation|inc|ltd|llc|group|organization)/i)) {
      return 'organization';
    }
    if (lowerName.match(/^(new york|london|paris|tokyo|beijing|shanghai|california|texas)/i)) {
      return 'location';
    }
    if (lowerName.match(/^(technology|science|business|health|education|sports)/i)) {
      return 'category';
    }
    
    return 'entity';
  }

  /**
   * Guess relationship type based on entity names
   */
  private guessRelationshipType(from: string, to: string): string {
    const types = [
      'related_to',
      'connected_to',
      'associated_with',
      'mentioned_with',
      'linked_to',
    ];
    
    // Simple hash-based selection for consistency
    const hash = (from + to).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return types[hash % types.length];
  }
}

/**
 * Factory function to create mock AI Integration Service
 */
export function createMockAIIntegrationService(): AIIntegrationService {
  return new MockAIIntegrationService();
}

/**
 * Check if we should use mock service
 */
export function shouldUseMockAIService(): boolean {
  const apiKey = process.env.AI_API_KEY;
  
  // Use mock if API key is not configured or is the placeholder
  return !apiKey || apiKey === 'sk-your-api-key-here' || apiKey.trim().length === 0;
}
