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

    // Simple entity extraction based on capitalized words or long words for Chinese
    const entities: AIEntity[] = [];
    const entityNames = new Set<string>();
    
    // Extract words as potential entities (support Chinese and English)
    // 对于中文，我们提取长度在2-6之间的词，或者是英文大写开头的词
    const words = text.split(/[\s，。、！？；：（）《》【】]+/);
    for (const word of words) {
      const cleaned = word.replace(/[.,!?;:()]/g, '').trim();
      
      // 判断是否是英文首字母大写，或者中文字符串长度适中
      const isEnglishCapitalized = cleaned.length > 2 && /^[A-Z]/.test(cleaned);
      const isChineseWord = /^[\u4e00-\u9fa5]{2,8}$/.test(cleaned);
      
      // 排除一些常见无意义词汇
      const stopWords = ['我们', '他们', '这个', '那个', '但是', '因为', '所以', '如果', '或者'];
      const isStopWord = stopWords.includes(cleaned);
      
      if ((isEnglishCapitalized || isChineseWord) && !isStopWord && !entityNames.has(cleaned)) {
        entityNames.add(cleaned);
        entities.push({
          name: cleaned,
          type: this.guessEntityType(cleaned),
          properties: {
            source: 'mock_extraction',
            confidence: 0.7,
          },
        });
        
        // 为了避免生成过多无意义节点，限制最多生成20个节点
        if (entities.length >= 20) break;
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
      '相关于',
      '连接到',
      '关联于',
      '提及于',
      '链接到',
      '属于',
      '包含',
      '依赖于'
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
