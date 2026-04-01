/**
 * AI Integration Service
 * 
 * Handles communication with the external AI Model API for document analysis
 * and entity extraction. Transforms API responses into application format.
 * 
 * Requirements: 1.1, 1.5, 1.6
 */

/**
 * Entity extracted from document text by AI
 */
export interface AIEntity {
  name: string;
  description?: string;  // Optional description
  type?: string;  // Optional, for backward compatibility
  properties?: Record<string, any>;  // Optional, for backward compatibility
}

/**
 * Relationship between entities extracted by AI
 */
export interface AIRelationship {
  from: string;  // Entity name
  to: string;    // Entity name
  type: string;
  properties?: Record<string, any>;  // Optional, for backward compatibility
}

/**
 * Result of AI document analysis
 */
export interface AIAnalysisResult {
  entities: AIEntity[];
  relationships: AIRelationship[];
}

/**
 * AI Integration Service interface
 */
export interface AIIntegrationService {
  /**
   * Analyzes document text and extracts entities and relationships
   * @param text - The document text to analyze
   * @param customPrompt - Optional custom prompt to guide the AI analysis
   * @returns Promise with extracted entities and relationships
   * @throws Error if AI API fails or returns invalid response
   */
  analyzeDocument(text: string, customPrompt?: string): Promise<AIAnalysisResult>;
}

/**
 * Configuration for AI Integration Service
 */
interface AIServiceConfig {
  apiKey: string;
  apiEndpoint: string;
  timeout?: number;
}

const MAX_ENTITY_COUNT = 120;
const MAX_RELATIONSHIP_COUNT = 320;

/**
 * Implementation of AI Integration Service
 */
export class AIIntegrationServiceImpl implements AIIntegrationService {
  private apiKey: string;
  private apiEndpoint: string;
  private timeout: number;

  constructor(config?: Partial<AIServiceConfig>) {
    // Get API key from environment or config
    this.apiKey = config?.apiKey || process.env.AI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('AI_API_KEY is not configured. Please set the AI_API_KEY environment variable.');
    }

    // Default endpoint - DeepSeek API endpoint
    this.apiEndpoint = config?.apiEndpoint || process.env.AI_API_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions';
    
    // Default timeout: 30 seconds
    this.timeout = config?.timeout || 30000;
  }

  /**
   * Analyzes document text using AI Model API
   */
  async analyzeDocument(text: string, customPrompt?: string): Promise<AIAnalysisResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Document text cannot be empty');
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Call AI API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildRequestPayload(text, customPrompt)),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check response status
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[AI Service] API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`AI API returned ${response.status}: ${response.statusText}`);
      }

      // Parse response
      const data = await response.json();
      
      // Transform and validate response
      return this.transformResponse(data);

    } catch (error) {
      // Handle different error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('[AI Service] Request timeout after', this.timeout, 'ms');
          throw new Error('AI analysis request timed out. Please try again.');
        }
        
        // Log error details server-side only
        console.error('[AI Service] Analysis failed:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
        
        // Re-throw with user-friendly message if not already user-friendly
        if (error.message.includes('AI API') || error.message.includes('timeout') || error.message.includes('empty')) {
          throw error;
        }
        
        throw new Error(`Unable to analyze document: ${error.message}`);
      }
      
      console.error('[AI Service] Unknown error type:', error);
      throw new Error('An unexpected error occurred during AI analysis.');
    }
  }

  /**
   * Builds the request payload for the AI API
   * This uses DeepSeek's chat completion format
   */
  private buildRequestPayload(text: string, customPrompt?: string): any {
    const textLength = text.trim().length;
    const targetEntityCount =
      textLength < 1200 ? 30 :
      textLength < 3000 ? 45 :
      textLength < 6000 ? 65 : 85;

    const targetRelationCount = Math.max(40, Math.floor(targetEntityCount * 1.6));

    // Build system message - use custom prompt if provided, otherwise use default
    const systemContent = customPrompt || `你是知识图谱构建专家，擅长从文本中提取实体和关系。请仔细分析文本，提取高质量、可用于3D知识图谱可视化的结构化数据。

## 提取规则

### 1. 实体提取（节点）
识别文本中的关键实体，包括人物、组织、地点、概念、事件、产品、技术、制度、时间节点等。

每个实体包含：
- name: 实体名称（使用原文中的准确名称）
- description: 实体的简短描述（可选，用于补充说明）

### 2. 关系提取（边）
识别实体间的语义关系，常见关系类型（可扩展）：
- **属于**: A属于B、A是B的一部分
- **位于**: A位于B、A在B
- **工作于**: A在B工作、A任职于B
- **创建**: A创建了B、A发明了B
- **参与**: A参与B、A参加B
- **影响**: A影响B、A导致B
- **关联**: A与B相关、A和B有联系
- **拥有**: A拥有B、A持有B
- **使用**: A使用B、A应用B
- **产生**: A产生B、A生成B

每个关系包含：
- from: 源实体名称（必须与entities中的name完全匹配）
- to: 目标实体名称（必须与entities中的name完全匹配）
- type: 关系类型（使用简洁的中文描述，如"属于"、"位于"、"创建"等）

### 3. 质量约束（非常重要）
1. 优先输出具体、可视化价值高的实体，不要输出“问题/方面/内容/情况/方式/结果”等空泛词。
2. 关系尽量语义明确，避免大量“相关/关联”等弱关系。
3. 不要输出自环关系（from===to），避免重复关系。
4. 实体名称尽量去重（同义词保留一个主名称）。
5. 为提高3D图谱可读性，请尽量形成多中心连接结构，避免大量孤立点。
6. 目标实体数量约为 ${targetEntityCount}（允许上下浮动），目标关系数量约为 ${targetRelationCount}。
7. 若原文信息充足，请不要只输出少量节点。

## 输出格式
严格按照以下JSON格式返回：
{
  "entities": [
    {
      "name": "实体名称",
      "description": "简短描述（可选）"
    }
  ],
  "relationships": [
    {
      "from": "源实体名称",
      "to": "目标实体名称",
      "type": "关系类型"
    }
  ]
}

## 重要提示
1. 实体名称必须准确，使用文本中的原始表述
2. 关系中的from和to必须与entities数组中的name完全一致
3. 优先提取核心实体和主要关系，避免过度细化
4. 关系类型应该简洁明了，使用中文动词或动词短语
5. description字段是可选的，只在需要补充说明时添加
6. 不需要生成type（实体类型）和properties（属性）字段`

    return {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemContent
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.2,
      max_tokens: 8192,
      response_format: { type: 'json_object' }
    };
  }

  private normalizeEntityName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[，。；：、,.!?！？]+$/g, '');
  }

  private isLowValueEntity(name: string): boolean {
    const normalized = name.toLowerCase();
    const lowValueWords = [
      '内容', '情况', '方面', '方式', '问题', '结果', '过程', '数据', '信息', '系统',
      'thing', 'things', 'something', 'someone', 'it', 'this', 'that', 'these', 'those'
    ];

    if (normalized.length <= 1) return true;
    if (normalized.length > 64) return true;
    return lowValueWords.includes(normalized);
  }

  private normalizeRelationshipType(type?: string): string {
    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return '关联';
    }
    return type.trim().replace(/\s+/g, '');
  }

  /**
   * Transforms AI API response into application format
   * Validates the response structure and ensures data integrity
   * Supports both OpenAI and DeepSeek response formats
   */
  private transformResponse(apiResponse: any): AIAnalysisResult {
    try {
      // Handle chat completion response format (OpenAI/DeepSeek)
      let data = apiResponse;
      
      // If response is from chat completion API, extract the content
      if (apiResponse.choices && apiResponse.choices[0]?.message?.content) {
        const content = apiResponse.choices[0].message.content;
        // Try to parse as JSON
        try {
          data = JSON.parse(content);
        } catch (parseError) {
          console.error('[AI Service] Failed to parse message content as JSON:', content);
          throw new Error('AI API returned invalid JSON format');
        }
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid AI API response: not an object');
      }

      // Extract entities (with de-duplication and quality filtering)
      const entityMap = new Map<string, AIEntity>();
      if (Array.isArray(data.entities)) {
        for (const entity of data.entities) {
          if (!entity.name || typeof entity.name !== 'string') {
            console.warn('[AI Service] Skipping entity with invalid name:', entity);
            continue;
          }
          
          const trimmedName = this.normalizeEntityName(entity.name);
          if (trimmedName.length === 0) {
            console.warn('[AI Service] Skipping entity with empty name after trimming:', entity);
            continue;
          }

          if (this.isLowValueEntity(trimmedName)) {
            continue;
          }

          const entityKey = trimmedName.toLowerCase();
          const candidate: AIEntity = {
            name: trimmedName,
            description: entity.description || undefined,
            type: entity.type || undefined,
            properties: entity.properties || undefined,
          };

          const existing = entityMap.get(entityKey);
          if (!existing) {
            entityMap.set(entityKey, candidate);
            continue;
          }

          // Prefer richer description when merging duplicate entity names
          const existingDescLength = (existing.description || '').length;
          const candidateDescLength = (candidate.description || '').length;
          if (candidateDescLength > existingDescLength) {
            entityMap.set(entityKey, { ...existing, ...candidate });
          }
        }
      }
      const entities = Array.from(entityMap.values()).slice(0, MAX_ENTITY_COUNT);

      // Extract relationships
      const relationships: AIRelationship[] = [];
      if (Array.isArray(data.relationships)) {
        // Create a set of valid entity names for validation
        const entityNames = new Set(entities.map(e => e.name.toLowerCase()));
        const relDedupe = new Set<string>();
        
        for (const rel of data.relationships) {
          if (!rel.from || !rel.to || typeof rel.from !== 'string' || typeof rel.to !== 'string') {
            console.warn('[AI Service] Skipping relationship with invalid from/to:', rel);
            continue;
          }
          
          const fromName = this.normalizeEntityName(rel.from);
          const toName = this.normalizeEntityName(rel.to);
          
          // Skip relationships with empty names after trimming
          if (fromName.length === 0 || toName.length === 0) {
            console.warn('[AI Service] Skipping relationship with empty from/to after trimming:', rel);
            continue;
          }
          
          // Validate that referenced entities exist
          if (!entityNames.has(fromName.toLowerCase())) {
            console.warn('[AI Service] Skipping relationship: "from" entity not found:', fromName);
            continue;
          }
          
          if (!entityNames.has(toName.toLowerCase())) {
            console.warn('[AI Service] Skipping relationship: "to" entity not found:', toName);
            continue;
          }
          
          if (fromName.toLowerCase() === toName.toLowerCase()) {
            continue;
          }

          const relationshipType = this.normalizeRelationshipType(rel.type);
          const dedupeKey = `${fromName.toLowerCase()}|${toName.toLowerCase()}|${relationshipType.toLowerCase()}`;
          if (relDedupe.has(dedupeKey)) {
            continue;
          }
          relDedupe.add(dedupeKey);

          relationships.push({
            from: fromName,
            to: toName,
            type: relationshipType,
            properties: rel.properties || undefined,  // Optional
          });

          if (relationships.length >= MAX_RELATIONSHIP_COUNT) {
            break;
          }
        }
      }

      // Log statistics
      console.log('[AI Service] Analysis complete:', {
        entities: entities.length,
        relationships: relationships.length,
      });

      return {
        entities,
        relationships,
      };

    } catch (error) {
      console.error('[AI Service] Failed to transform response:', error);
      throw new Error('Failed to parse AI API response. The response format may be invalid.');
    }
  }
}

/**
 * Factory function to create AI Integration Service instance
 * Uses environment variables by default
 */
export function createAIIntegrationService(config?: Partial<AIServiceConfig>): AIIntegrationService {
  return new AIIntegrationServiceImpl(config);
}

/**
 * Default singleton instance for convenience
 */
let defaultInstance: AIIntegrationService | null = null;

export function getAIIntegrationService(): AIIntegrationService {
  // Always check for valid API key on each call (don't cache)
  const apiKey = process.env.AI_API_KEY;
  const shouldUseMock = !apiKey || apiKey === 'sk-your-api-key-here' || apiKey.trim().length === 0;
  
  if (shouldUseMock) {
    console.log('[AI Service] Using mock AI service (no valid API key configured)');
    const { createMockAIIntegrationService } = require('./ai-integration-mock');
    return createMockAIIntegrationService();
  }
  
  // Use real service with valid API key
  if (!defaultInstance) {
    defaultInstance = createAIIntegrationService();
  }
  return defaultInstance;
}
