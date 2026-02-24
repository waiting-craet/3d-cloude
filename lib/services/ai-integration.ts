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
   * @param customPrompt - Optional custom prompt to append to system prompt
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
   * This uses DeepSeek's chat completion format with optimized prompts
   */
  private buildRequestPayload(text: string, customPrompt?: string): any {
    // 优化的系统提示词
    const systemPrompt = `你是一位专业的知识图谱构建专家，擅长从文本中精准提取实体和关系。

## 核心任务
分析提供的文本，提取结构化的知识图谱数据：

### 1. 实体提取（节点）
识别文本中的关键实体，包括但不限于：
- **人物**：人名、角色、职位
- **组织**：公司、机构、团队、部门
- **概念**：理论、方法、技术、产品
- **地点**：国家、城市、地址、场所
- **事件**：活动、会议、项目
- **时间**：日期、时期、阶段
- **物品**：设备、工具、资源

对每个实体提供：
- **name**：实体名称（简洁明确）
- **type**：实体类型（使用上述分类或更具体的类型）
- **properties**：相关属性（如描述、状态、数值等）

### 2. 关系提取（边）
识别实体之间的连接关系，常见关系类型：
- **从属关系**：belongs_to, part_of, member_of
- **关联关系**：related_to, associated_with, connected_to
- **因果关系**：causes, leads_to, results_in
- **时序关系**：before, after, during
- **层级关系**：manages, reports_to, supervises
- **功能关系**：uses, produces, provides
- **位置关系**：located_in, near, contains

对每个关系提供：
- **from**：源实体名称（必须与实体列表中的name完全匹配）
- **to**：目标实体名称（必须与实体列表中的name完全匹配）
- **type**：关系类型（使用上述分类或更具体的类型）
- **properties**：关系属性（如强度、时间、描述等）

## 提取原则
1. **准确性优先**：只提取文本中明确提到的实体和关系
2. **避免冗余**：相同实体只提取一次，合并重复信息
3. **保持一致**：关系中的实体名称必须与实体列表完全匹配
4. **语义完整**：确保提取的信息具有完整的语义
5. **类型规范**：使用标准化的类型名称（小写+下划线）

## 输出格式
返回严格的JSON格式：
{
  "entities": [
    {
      "name": "实体名称",
      "type": "实体类型",
      "properties": {
        "属性名": "属性值"
      }
    }
  ],
  "relationships": [
    {
      "from": "源实体名称",
      "to": "目标实体名称",
      "type": "关系类型",
      "properties": {
        "属性名": "属性值"
      }
    }
  ]
}

## 重要提醒
- 所有关系中的实体名称必须在entities数组中存在
- 使用简洁明确的命名，避免过长的描述性文字
- 属性值应该是具体的信息，而非重复实体名称${customPrompt ? '\n\n## 用户特殊要求\n' + customPrompt : ''}`;

    return {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt
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
