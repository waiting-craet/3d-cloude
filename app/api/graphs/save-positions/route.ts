import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId, verifyGraphOwnership } from '@/lib/auth';

// 请求体类型定义
interface SavePositionsRequest {
  graphId: string;
  nodes: Array<{
    id: string;
    x: number;
    y: number;
  }>;
  metadata?: {
    scale?: number;
    offset?: { x: number; y: number };
  };
}

// 响应类型定义
interface SavePositionsResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// 输入验证函数
function validateSavePositionsRequest(body: any): {
  valid: boolean;
  error?: string;
} {
  // 验证graphId
  if (!body.graphId || typeof body.graphId !== 'string') {
    return { valid: false, error: 'graphId无效' };
  }

  // 验证nodes数组
  if (!Array.isArray(body.nodes)) {
    return { valid: false, error: 'nodes必须是数组' };
  }

  // 限制节点数量
  if (body.nodes.length > 1000) {
    return { valid: false, error: '节点数量超过限制（最多1000个）' };
  }

  // 验证每个节点
  for (const node of body.nodes) {
    if (!node.id || typeof node.id !== 'string') {
      return { valid: false, error: '节点ID无效' };
    }

    if (typeof node.x !== 'number' || typeof node.y !== 'number') {
      return { valid: false, error: '坐标必须是数字' };
    }

    if (!isFinite(node.x) || !isFinite(node.y)) {
      return { valid: false, error: '坐标值无效（不能是NaN或Infinity）' };
    }
  }

  return { valid: true };
}

// POST - 保存节点位置
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: SavePositionsRequest = await request.json();
    const { graphId, nodes, metadata } = body;

    // 输入验证
    const validation = validateSavePositionsRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 身份验证
    const userId = await getCurrentUserId(request, { required: true });
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      );
    }

    // 权限检查
    const hasPermission = await verifyGraphOwnership({
      graphId,
      userId
    });

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: '无权限修改此图谱' },
        { status: 403 }
      );
    }

    // 查询图谱
    const graph = await prisma.graph.findUnique({
      where: { id: graphId },
      select: { id: true, settings: true }
    });

    if (!graph) {
      return NextResponse.json(
        { success: false, error: '图谱不存在' },
        { status: 404 }
      );
    }

    // 解析现有settings
    let currentSettings: any = {};
    if (graph.settings) {
      try {
        currentSettings = JSON.parse(graph.settings);
      } catch (error) {
        console.warn('解析settings失败，使用空对象');
        currentSettings = {};
      }
    }

    // 更新workflowPositions
    currentSettings.workflowPositions = {
      nodes,
      metadata,
      lastSaved: new Date().toISOString()
    };

    // 保存到数据库
    const updatedGraph = await prisma.graph.update({
      where: { id: graphId },
      data: {
        settings: JSON.stringify(currentSettings),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: '位置保存成功',
      graph: updatedGraph  // 返回更新后的graph对象
    });

  } catch (error: any) {
    console.error('保存位置失败:', error);
    
    // 处理身份验证错误
    if (error.message === '用户未登录') {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
