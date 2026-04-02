/**
 * AI Analysis API Endpoint
 * 
 * Receives document text, calls AI Model API, performs duplicate detection,
 * and returns structured graph data with conflict information.
 * 
 * Requirements: 1.1, 1.2, 1.3, 5.5, 6.4, 1.5, 12.1, 12.2, 12.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAIIntegrationService } from '@/lib/services/ai-integration';
import { getDuplicateDetectionService } from '@/lib/services/duplicate-detection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request body interface
 */
interface AnalyzeRequest {
  documentText: string;
  projectId?: string;
  graphId?: string;
  visualizationType: '2d' | '3d';
  customPrompt?: string; // 用户自定义提示词
}

/**
 * Preview node structure with duplicate detection metadata
 */
interface PreviewNode {
  id: string;  // Temporary UUID
  name: string;
  description?: string;  // Optional description
  type?: string;  // Optional, for backward compatibility
  properties?: Record<string, any>;  // Optional, for backward compatibility
  isDuplicate?: boolean;
  duplicateOf?: string;
  conflicts?: Array<{
    property: string;
    existingValue: any;
    newValue: any;
  }>;
}

/**
 * Preview edge structure with redundancy detection metadata
 */
interface PreviewEdge {
  id: string;  // Temporary UUID
  fromNodeId: string;
  toNodeId: string;
  label: string;
  properties?: Record<string, any>;  // Optional, for backward compatibility
  isRedundant?: boolean;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').replace(/[，。；：、,.!?！？]+$/g, '');
}

function normalizeEdgeLabel(label?: string): string {
  const normalized = normalizeName(label || '');
  return normalized || '关联';
}

function getPairKey(a: string, b: string): string {
  const left = a.toLowerCase().trim();
  const right = b.toLowerCase().trim();
  return left <= right ? `${left}|${right}` : `${right}|${left}`;
}

function isWeakRelationshipLabel(label: string): boolean {
  const weakLabels = new Set(['关联', '相关', '联系', '共现', '有关']);
  return weakLabels.has(label);
}

function pickBetterRelationshipLabel(currentLabel: string, candidateLabel: string): string {
  const currentWeak = isWeakRelationshipLabel(currentLabel);
  const candidateWeak = isWeakRelationshipLabel(candidateLabel);
  if (currentWeak !== candidateWeak) {
    return candidateWeak ? currentLabel : candidateLabel;
  }

  // Prefer concise but meaningful labels.
  return candidateLabel.length < currentLabel.length ? candidateLabel : currentLabel;
}

function calculateTargetNodeCount(textLength: number): number {
  if (textLength < 1200) return 28;
  if (textLength < 3000) return 40;
  if (textLength < 6000) return 58;
  return 76;
}

function extractSupplementaryEntities(text: string, existingNames: Set<string>, maxAdditions: number): string[] {
  if (maxAdditions <= 0) return [];

  const candidateScores = new Map<string, number>();
  const pushCandidate = (rawValue: string, score: number) => {
    const value = normalizeName(rawValue);
    if (value.length < 2 || value.length > 50) return;
    const key = value.toLowerCase();
    if (existingNames.has(key)) return;
    candidateScores.set(value, (candidateScores.get(value) || 0) + score);
  };

  // 1) 提取中文引号/书名号中的概念
  const quotedMatches = text.match(/[“"《【]([^”"》】]{2,30})[”"》】]/g) || [];
  for (const raw of quotedMatches) {
    pushCandidate(raw.replace(/[“"《【”"》】]/g, ''), 5);
  }

  // 2) 提取包含关键动词的短语左侧实体
  const relationLikeLines = text.split(/[。\n；;]+/).slice(0, 800);
  const leftEntityRegex = /^([\u4e00-\u9fa5A-Za-z0-9\-_]{2,30})(?:是|属于|位于|包括|包含|由|使用|依赖|连接|导致|影响|提出|创建)/;
  for (const line of relationLikeLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(leftEntityRegex);
    if (match?.[1]) {
      pushCandidate(match[1], 4);
    }
  }

  // 3) 英文专有名词（首字母大写短语）
  const enProperNouns = text.match(/\b[A-Z][a-zA-Z0-9-]{2,}(?:\s+[A-Z][a-zA-Z0-9-]{2,}){0,3}\b/g) || [];
  for (const noun of enProperNouns) {
    pushCandidate(noun, 3);
  }

  // 4) 中文术语后缀词抽取（提升节点可读性和专业性）
  const suffixMatches = text.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,24}(系统|模型|算法|平台|协议|框架|网络|技术|机制|方法|方案|服务|公司|大学|组织|部门|产品|项目|理论|病症|药物|材料)/g) || [];
  for (const term of suffixMatches) {
    pushCandidate(term, 3);
  }

  // 5) 根据全文出现频次加权，优先高频实体
  for (const [candidate] of candidateScores) {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hits = text.match(new RegExp(escaped, 'g'))?.length || 0;
    if (hits > 1) {
      candidateScores.set(candidate, (candidateScores.get(candidate) || 0) + Math.min(4, hits - 1));
    }
  }

  const lowValue = new Set(['内容', '情况', '问题', '方式', '方面', '结果', '系统', '数据', '信息']);
  return Array.from(candidateScores.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].length - b[0].length;
    })
    .map(([candidate]) => candidate)
    .filter(candidate => {
      const key = candidate.toLowerCase();
      if (existingNames.has(key)) return false;
      if (lowValue.has(candidate)) return false;
      return candidate.length >= 2 && candidate.length <= 50;
    })
    .slice(0, maxAdditions);
}

function dedupeRelationshipsByPair(
  relationships: Array<{ from: string; to: string; type: string }>
): Array<{ from: string; to: string; type: string }> {
  const pairMap = new Map<string, { from: string; to: string; type: string }>();

  for (const rel of relationships) {
    const from = normalizeName(rel.from);
    const to = normalizeName(rel.to);
    const type = normalizeEdgeLabel(rel.type);
    if (!from || !to || from.toLowerCase() === to.toLowerCase()) continue;

    const pairKey = getPairKey(from, to);
    const existing = pairMap.get(pairKey);
    if (!existing) {
      pairMap.set(pairKey, { from, to, type });
      continue;
    }

    const betterType = pickBetterRelationshipLabel(existing.type, type);
    pairMap.set(pairKey, { ...existing, type: betterType });
  }

  return Array.from(pairMap.values());
}

function buildCooccurrenceRelationships(
  text: string,
  entityNames: string[],
  existingPairSet: Set<string>,
  maxNewRels: number
): Array<{ from: string; to: string; type: string }> {
  if (maxNewRels <= 0 || entityNames.length < 2) return [];

  const result: Array<{ from: string; to: string; type: string }> = [];
  const sentences = text.split(/[。\n！？!?；;]+/).map(s => s.trim()).filter(Boolean).slice(0, 1200);

  for (const sentence of sentences) {
    const mentions = entityNames.filter(name => name.length >= 2 && sentence.includes(name)).slice(0, 8);
    if (mentions.length < 2) continue;

    for (let i = 0; i < mentions.length; i++) {
      for (let j = i + 1; j < mentions.length; j++) {
        const a = mentions[i];
        const b = mentions[j];
        const pairKey = getPairKey(a, b);
        if (existingPairSet.has(pairKey)) continue;
        existingPairSet.add(pairKey);
        result.push({ from: a, to: b, type: '共现' });
        if (result.length >= maxNewRels) return result;
      }
    }
  }

  return result;
}

// 简单的 XSS 过滤函数
function sanitizeText(text: string): string {
  if (!text) return '';
  // 替换常见的 HTML 标签
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

function pickPreferredDescription(aiDescription?: string, textDerivedDescription?: string): string | undefined {
  const aiDesc = aiDescription?.trim();
  const textDesc = textDerivedDescription?.trim();

  // Prefer richer AI description, fall back to text-derived description.
  if (aiDesc && textDesc) {
    if (aiDesc.length >= textDesc.length * 0.8) return aiDesc;
    return textDesc;
  }

  return aiDesc || textDesc || undefined;
}

// 文本解析函数，提取节点详情映射表
function extractNodeDetails(text: string): Map<string, string> {
  const nodeDetailMap = new Map<string, string>();
  if (!text) return nodeDetailMap;

  try {
    // 按行或句子进行粗略分割
    const lines = text.split(/\n+/);
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (!trimmedLine) continue;
      
      // 匹配 "节点: 详情" 或 "节点：详情" 或 "节点 - 详情" 模式
      const matchColon = trimmedLine.match(/^([^:：\-]{1,50})[:：\-]\s*(.+)$/);
      if (matchColon) {
        const nodeName = matchColon[1].trim();
        const detail = matchColon[2].trim();
        if (nodeName && detail) {
          nodeDetailMap.set(nodeName.toLowerCase(), detail);
          continue;
        }
      }
      
      // 匹配 "节点是/是指 详情" 模式
      const matchIs = trimmedLine.match(/^([^，。；\n]{1,50}?)(?:是|是指)\s*([^，。；\n]+.*)$/);
      if (matchIs) {
        const nodeName = matchIs[1].trim();
        const detail = matchIs[2].trim();
        if (nodeName && detail) {
          nodeDetailMap.set(nodeName.toLowerCase(), detail);
          continue;
        }
      }

      // 匹配 "节点\n详情段落" 模式 (节点通常较短，下一行是长文本)
      if (trimmedLine.length <= 50 && !trimmedLine.includes('。') && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && nextLine.length > 10) {
          // 清理可能的序号如 "1. " 或 "- "
          const cleanNodeName = trimmedLine.replace(/^[\d\.\-\*\s]+/, '').trim();
          if (cleanNodeName && !nodeDetailMap.has(cleanNodeName.toLowerCase())) {
            nodeDetailMap.set(cleanNodeName.toLowerCase(), nextLine);
          }
        }
      }
    }
  } catch (error) {
    console.error('[AI Analysis] Text parsing failed:', error);
  }

  return nodeDetailMap;
}

/**
 * POST /api/ai/analyze
 * 
 * Analyzes document text using AI and returns structured graph data
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AnalyzeRequest = await request.json();
    
    // Validate required fields
    if (!body.documentText || body.documentText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document text is required and cannot be empty.',
        },
        { status: 400 }
      );
    }

    if (!body.visualizationType || body.visualizationType !== '3d') {
      return NextResponse.json(
        {
          success: false,
          error: 'Visualization type must be "3d". 2D mode is no longer supported.',
        },
        { status: 400 }
      );
    }

    // Log analysis start (server-side only)
    console.log('[AI Analysis] Starting analysis:', {
      textLength: body.documentText.length,
      projectId: body.projectId,
      graphId: body.graphId,
      visualizationType: body.visualizationType,
    });

    // Requirement 1: 文本解析阶段
    // 在调用 AI 生成节点前，先对原始文本进行语义分析，提取节点-详情映射
    const nodeDetailMap = extractNodeDetails(body.documentText);

    // Check environment variables
    console.log('[AI Analysis] Environment check:', {
      hasApiKey: !!process.env.AI_API_KEY,
      apiKeyPrefix: process.env.AI_API_KEY?.substring(0, 10),
      hasEndpoint: !!process.env.AI_API_ENDPOINT,
      endpoint: process.env.AI_API_ENDPOINT,
    });

    // Step 1: Call AI Integration Service
    const aiService = getAIIntegrationService();
    let aiResult;
    
    try {
      aiResult = await aiService.analyzeDocument(body.documentText, body.customPrompt);
    } catch (error) {
      console.error('[AI Analysis] AI service error:', error);
      
      // Return user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          error: errorMessage.includes('AI API') || errorMessage.includes('timeout') || errorMessage.includes('timed out') || errorMessage.includes('analyze')
            ? errorMessage
            : 'Unable to analyze document. Please try again later.',
        },
        { status: 500 }
      );
    }

    // Step 1.5: 结果增强 - 解决节点过少和关系稀疏问题
    const targetNodeCount = calculateTargetNodeCount(body.documentText.length);
    const existingEntityNames = new Set(aiResult.entities.map(entity => normalizeName(entity.name).toLowerCase()));
    const neededEntities = Math.max(0, targetNodeCount - aiResult.entities.length);
    const supplementaryEntityNames = extractSupplementaryEntities(body.documentText, existingEntityNames, Math.min(neededEntities, 35));

    if (supplementaryEntityNames.length > 0) {
      aiResult.entities.push(
        ...supplementaryEntityNames.map(name => ({
          name,
          description: nodeDetailMap.get(name.toLowerCase()) || undefined,
        }))
      );
    }

    // 对关系进行去重：同一对节点只保留一条边和一个标签
    aiResult.relationships = dedupeRelationshipsByPair(aiResult.relationships);

    const maxRelationshipCount = Math.max(120, Math.floor(aiResult.entities.length * 2.4));
    const missingRelationships = Math.max(0, Math.min(120, maxRelationshipCount - aiResult.relationships.length));
    if (missingRelationships > 0) {
      const pairSet = new Set<string>(
        aiResult.relationships.map(rel => getPairKey(rel.from, rel.to))
      );
      const cooccurrenceRels = buildCooccurrenceRelationships(
        body.documentText,
        aiResult.entities.map(entity => entity.name),
        pairSet,
        missingRelationships
      );
      aiResult.relationships = dedupeRelationshipsByPair([...aiResult.relationships, ...cooccurrenceRels]);
    }

    // Step 2: Create preview nodes with temporary IDs
    const nodeNameToTempId = new Map<string, string>();
    const previewNodes: PreviewNode[] = aiResult.entities.slice(0, 120).map(entity => {
      const tempId = uuidv4();
      const normalizedEntityName = normalizeName(entity.name);
      const nodeNameLower = normalizedEntityName.toLowerCase();
      nodeNameToTempId.set(nodeNameLower, tempId);
      
      const node: PreviewNode = {
        id: tempId,
        name: normalizedEntityName,
      };

      // 优先保留高质量AI描述，同时结合文本解析出的详情作为补充兜底
      const detail = pickPreferredDescription(
        entity.description,
        nodeDetailMap.get(nodeNameLower)
      );

      if (detail) {
        // XSS 过滤及最大长度截断（建议 ≤ 8 KB）
        const truncatedDetail = detail.length > 8000 ? detail.substring(0, 8000) + '...' : detail;
        node.description = sanitizeText(truncatedDetail);
      }

      return node;
    });

    // Step 3: Create preview edges with temporary node references
    const previewEdges: PreviewEdge[] = aiResult.relationships
      .slice(0, 360)
      .map(rel => ({
      id: uuidv4(),
      fromNodeId: nodeNameToTempId.get(rel.from.toLowerCase().trim()) || '',
      toNodeId: nodeNameToTempId.get(rel.to.toLowerCase().trim()) || '',
      label: normalizeEdgeLabel(rel.type),
    }))
      .filter(edge => edge.fromNodeId && edge.toNodeId && edge.fromNodeId !== edge.toNodeId)
      .filter((edge, index, edges) => {
        const pairKey = getPairKey(edge.fromNodeId, edge.toNodeId);
        const firstIndex = edges.findIndex(e => getPairKey(e.fromNodeId, e.toNodeId) === pairKey);
        if (firstIndex === index) return true;
        const firstEdge = edges[firstIndex];
        firstEdge.label = pickBetterRelationshipLabel(firstEdge.label, edge.label);
        return false;
      });

    // Step 4: Perform duplicate detection if graphId is provided
    let duplicateNodes = 0;
    let redundantEdges = 0;
    let conflicts = 0;

    if (body.graphId) {
      try {
        console.log('[AI Analysis] Starting duplicate detection for graphId:', body.graphId);
        
        // Add timeout to database queries
        const queryTimeout = 5000; // 5 seconds timeout
        
        // Fetch existing graph data with timeout
        const existingNodesPromise = prisma.node.findMany({
          where: { graphId: body.graphId },
          select: {
            id: true,
            name: true,
            metadata: true,
          },
          take: 1000, // Limit to prevent excessive data
        });

        const existingEdgesPromise = prisma.edge.findMany({
          where: { graphId: body.graphId },
          select: {
            fromNodeId: true,
            toNodeId: true,
            label: true,
          },
          take: 1000, // Limit to prevent excessive data
        });

        // Race against timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timed out')), queryTimeout)
        );

        const [existingNodes, existingEdges] = await Promise.race([
          Promise.all([existingNodesPromise, existingEdgesPromise]),
          timeoutPromise
        ]) as [any[], any[]];

        console.log('[AI Analysis] Fetched existing data:', {
          nodes: existingNodes.length,
          edges: existingEdges.length,
        });

        // Detect duplicate nodes
        const duplicateDetectionService = getDuplicateDetectionService();
        const duplicateInfo = duplicateDetectionService.detectDuplicateNodes(
          aiResult.entities.map(e => ({
            name: e.name,
            properties: e.properties || {},
          })),
          existingNodes
        );

        // Mark duplicate nodes and add conflict information
        for (const dup of duplicateInfo) {
          const previewNode = previewNodes[dup.newNodeIndex];
          if (previewNode) {
            previewNode.isDuplicate = true;
            previewNode.duplicateOf = dup.existingNodeId;
            previewNode.conflicts = dup.conflicts;
            
            duplicateNodes++;
            conflicts += dup.conflicts.length;
          }
        }

        // Create node name to ID mapping for existing nodes
        const nodeMapping = new Map<string, string>();
        for (const node of existingNodes) {
          nodeMapping.set(node.name.toLowerCase().trim(), node.id);
        }

        // Add mappings for duplicate nodes (map to existing node IDs)
        for (const dup of duplicateInfo) {
          const newNode = aiResult.entities[dup.newNodeIndex];
          if (newNode) {
            nodeMapping.set(newNode.name.toLowerCase().trim(), dup.existingNodeId);
          }
        }

        // Detect redundant edges
        const redundantIndices = duplicateDetectionService.detectRedundantEdges(
          aiResult.relationships.map(r => ({
            from: r.from,
            to: r.to,
            type: r.type,
          })),
          existingEdges,
          nodeMapping
        );

        // Mark redundant edges
        for (const index of redundantIndices) {
          const previewEdge = previewEdges[index];
          if (previewEdge) {
            previewEdge.isRedundant = true;
            redundantEdges++;
          }
        }

        console.log('[AI Analysis] Duplicate detection complete:', {
          duplicateNodes,
          redundantEdges,
          conflicts,
        });

      } catch (error) {
        // Enhanced error handling - log but don't fail the entire request
        console.error('[AI Analysis] Duplicate detection failed (continuing without it):', {
          error: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : 'Unknown',
          graphId: body.graphId,
        });

        // Log warning but continue - duplicate detection is optional
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          console.warn('[AI Analysis] Duplicate detection timed out - skipping duplicate check');
        } else if (errorMessage.includes('connection') || errorMessage.includes('Connection')) {
          console.warn('[AI Analysis] Database connection error - skipping duplicate check');
        } else {
          console.warn('[AI Analysis] Duplicate detection error - skipping duplicate check');
        }
        
        // Continue without duplicate detection
        // duplicateNodes, redundantEdges, and conflicts remain 0
      }
    }

    // Step 5: Return structured response
    const response = {
      success: true,
      data: {
        nodes: previewNodes,
        edges: previewEdges,
        stats: {
          totalNodes: previewNodes.length,
          totalEdges: previewEdges.length,
          duplicateNodes,
          redundantEdges,
          conflicts,
        },
      },
    };

    console.log('[AI Analysis] Analysis complete:', response.data.stats);

    return NextResponse.json(response);

  } catch (error) {
    // Catch-all error handler with detailed logging
    console.error('[AI Analysis] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      context: 'top_level_handler',
    });
    
    // Don't expose internal error details to client
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
