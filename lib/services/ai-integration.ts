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
  type: string;
  properties: Record<string, any>;
}

/**
 * Relationship between entities extracted by AI
 */
export interface AIRelationship {
  from: string;  // Entity name
  to: string;    // Entity name
  type: string;
  properties: Record<string, any>;
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
    // Build system message - use custom prompt if provided, otherwise use default
    const systemContent = customPrompt || `你是知识图谱构建专家，擅长从文本中提取实体和关系。请仔细分析文本，提取核心信息。

## 提取规则

### 1. 实体提取（节点）
识别文本中的关键实体，包括：
- **人物 (person)**: 真实人物、虚构角色、历史人物
- **组织 (organization)**: 公司、机构、团队、政府部门
- **地点 (location)**: 国家、城市、建筑、地理位置
- **概念 (concept)**: 理论、方法、技术、学科领域
- **事件 (event)**: 重要事件、活动、会议
- **产品 (product)**: 产品、服务、工具、系统
- **时间 (time)**: 时间点、时期、年代
- **其他 (other)**: 其他重要实体

每个实体包含：
- name: 实体名称（使用原文中的准确名称）
- type: 实体类型（从上述类型中选择最合适的）
- properties: 相关属性（如描述、特征、数值等）

### 2. 关系提取（边）
识别实体间的语义关系，常见关系类型：
- **属于 (belongs_to)**: A属于B、A是B的一部分
- **位于 (located_in)**: A位于B、A在B
- **工作于 (works_for)**: A在B工作、A任职于B
- **创建 (created)**: A创建了B、A发明了B
- **参与 (participates_in)**: A参与B、A参加B
- **影响 (influences)**: A影响B、A导致B
- **关联 (related_to)**: A与B相关、A和B有联系
- **拥有 (owns)**: A拥有B、A持有B
- **使用 (uses)**: A使用B、A应用B
- **产生 (produces)**: A产生B、A生成B

每个关系包含：
- from: 源实体名称（必须与entities中的name完全匹配）
- to: 目标实体名称（必须与entities中的name完全匹配）
- type: 关系类型（使用上述类型或自定义更准确的类型）
- properties: 关系属性（如时间、强度、描述等）

## 输出格式
严格按照以下JSON格式返回：
{
  "entities": [
    {
      "name": "实体名称",
      "type": "实体类型",
      "properties": {
        "description": "简短描述",
        "其他属性": "属性值"
      }
    }
  ],
  "relationships": [
    {
      "from": "源实体名称",
      "to": "目标实体名称",
      "type": "关系类型",
      "properties": {
        "description": "关系描述"
      }
    }
  ]
}

## 重要提示
1. 实体名称必须准确，使用文本中的原始表述
2. 关系中的from和to必须与entities数组中的name完全一致
3. 优先提取核心实体和主要关系，避免过度细化
4. 为实体和关系添加有意义的properties，帮助理解上下文
5. 关系类型应该语义明确，便于理解
6. 如果文本是中文，实体名称和属性使用中文；如果是英文，使用英文`

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
      temperature: 0.3,
      response_format: { type: 'json_object' }
    };
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

      // Extract entities
      const entities: AIEntity[] = [];
      if (Array.isArray(data.entities)) {
        for (const entity of data.entities) {
          if (!entity.name || typeof entity.name !== 'string') {
            console.warn('[AI Service] Skipping entity with invalid name:', entity);
            continue;
          }
          
          const trimmedName = entity.name.trim();
          if (trimmedName.length === 0) {
            console.warn('[AI Service] Skipping entity with empty name after trimming:', entity);
            continue;
          }
          
          entities.push({
            name: trimmedName,
            type: entity.type || 'entity',
            properties: entity.properties || {},
          });
        }
      }

      // Extract relationships
      const relationships: AIRelationship[] = [];
      if (Array.isArray(data.relationships)) {
        // Create a set of valid entity names for validation
        const entityNames = new Set(entities.map(e => e.name.toLowerCase()));
        
        for (const rel of data.relationships) {
          if (!rel.from || !rel.to || typeof rel.from !== 'string' || typeof rel.to !== 'string') {
            console.warn('[AI Service] Skipping relationship with invalid from/to:', rel);
            continue;
          }
          
          const fromName = rel.from.trim();
          const toName = rel.to.trim();
          
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
          
          relationships.push({
            from: fromName,
            to: toName,
            type: rel.type || 'related_to',
            properties: rel.properties || {},
          });
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
