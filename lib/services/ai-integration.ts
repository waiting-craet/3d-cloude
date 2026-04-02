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
    const systemContent = customPrompt || `你是一个“面向知识图谱落地”的信息抽取专家。你的任务是从输入文本中提取高质量实体（节点）、实体描述和实体关系，用于3D知识图谱可视化。

## 目标
1. 尽可能完整地提取核心实体，避免漏掉关键角色/概念/系统/事件。
2. 为每个实体提供有信息量的简明描述（优先基于原文事实）。
3. 为实体之间建立清晰关系，但同一对实体只保留一条关系边。

## 抽取要求

### A. 实体（entities）
- 实体应优先是可独立成节点的名词性对象：人物、组织、地点、概念、技术、系统、产品、项目、事件、制度、时间节点等。
- 避免空泛词：问题、方面、内容、情况、方式、结果、东西、事项等。
- 合并同义/近义/简称与全称，只保留一个主名称。
- 实体名称要短、准、稳，不能是一整句。
- 目标实体数量约为 ${targetEntityCount}（可上下浮动，按文本信息量调整）。

每个实体字段：
- name: 实体名称（必须来自原文或原文可直接归一化）
- description: 1-2句的高信息描述，优先包含“是什么/做什么/与主题的关键作用”

### B. 关系（relationships）
- 关系类型使用简短中文动词或动宾短语，例如：属于、位于、依赖、包含、导致、支持、使用、创建、管理、影响、合作。
- 严禁自环：from 不能等于 to。
- 严禁重复边：同一对实体（A,B）只允许一条关系（不区分方向）。
- 如果 A-B 可抽取多个关系，只保留最具体、信息量最高的一个关系类型（不要输出多个）。
- 优先强语义关系，尽量少用“相关/关联”等弱关系。
- 目标关系数量约为 ${targetRelationCount}（可上下浮动，按文本信息量调整）。

每个关系字段：
- from: 源实体名称（必须与entities中的name完全一致）
- to: 目标实体名称（必须与entities中的name完全一致）
- type: 关系类型（简洁清晰）

### C. 覆盖与质量
- 若文本较长，请覆盖不同段落的关键实体，不要只抽前半段。
- 若信息充足，不要只返回少量节点。
- 输出前自行检查：
  1) entities是否有重复或空泛词
  2) relationships是否存在重复对（A,B）
  3) from/to 是否都在 entities 中

## 输出格式（必须严格JSON）
{
  "entities": [
    {
      "name": "实体名称",
      "description": "实体描述"
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

只输出JSON，不要输出额外说明文字。`

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
