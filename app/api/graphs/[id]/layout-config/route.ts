/**
 * 布局配置管理API端点
 * 
 * GET /api/graphs/[id]/layout-config - 获取布局配置
 * POST /api/graphs/[id]/layout-config - 保存布局配置
 * 
 * 功能：
 * - 从数据库加载布局配置
 * - 保存布局配置和质量分数
 * - 验证配置参数
 * 
 * 验证需求: 9.1-9.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retryOperation, getDescriptiveErrorMessage } from '@/lib/db-helpers';
import { LayoutEngine } from '@/lib/layout/LayoutEngine';
import type { LayoutConfig, LayoutStrategy } from '@/lib/layout/types';
import { createId } from '@paralleldrive/cuid2';

interface LayoutConfigData {
  strategy: LayoutStrategy;
  config: Partial<LayoutConfig>;
  qualityScore?: number;
}

interface GetConfigResponse {
  success: boolean;
  config?: LayoutConfigData;
  error?: string;
  details?: string;
}

interface SaveConfigResponse {
  success: boolean;
  configId?: string;
  error?: string;
  details?: string;
}

/**
 * GET /api/graphs/[id]/layout-config
 * 
 * 获取图谱的布局配置
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetConfigResponse>> {
  const graphId = params.id;

  try {
    if (!graphId || typeof graphId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid graphId'
        },
        { status: 400 }
      );
    }

    // 从数据库加载配置
    const configData = await retryOperation(async () => {
      await prisma.$connect();

      // 尝试查询 layout_configs 表
      try {
        const config = await (prisma as any).layout_configs.findFirst({
          where: { graph_id: graphId },
          orderBy: { created_at: 'desc' }
        });

        return config;
      } catch (error) {
        // 如果表不存在，返回 null
        console.log('[Get-Config] layout_configs table not found, using defaults');
        return null;
      }
    }, 3, 1000);

    if (!configData) {
      // 返回默认配置
      const engine = new LayoutEngine();
      const defaultConfig = engine.getConfig();

      return NextResponse.json({
        success: true,
        config: {
          strategy: 'force_directed' as LayoutStrategy,
          config: defaultConfig
        }
      });
    }

    // 解析配置JSON
    const config: LayoutConfigData = {
      strategy: configData.strategy as LayoutStrategy,
      config: JSON.parse(configData.config_json),
      qualityScore: configData.quality_score
    };

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('[Get-Config] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: getDescriptiveErrorMessage(error),
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graphs/[id]/layout-config
 * 
 * 保存图谱的布局配置
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SaveConfigResponse>> {
  const graphId = params.id;

  try {
    if (!graphId || typeof graphId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid graphId'
        },
        { status: 400 }
      );
    }

    const body: LayoutConfigData = await request.json();
    const { strategy, config, qualityScore } = body;

    // 验证配置
    const engine = new LayoutEngine(config);
    const validatedConfig = engine.getConfig();

    // 保存到数据库
    const configId = await retryOperation(async () => {
      await prisma.$connect();

      try {
        const id = createId();
        
        await (prisma as any).layout_configs.create({
          data: {
            id,
            graph_id: graphId,
            strategy,
            config_json: JSON.stringify(validatedConfig),
            quality_score: qualityScore || null
          }
        });

        return id;
      } catch (error) {
        console.log('[Save-Config] layout_configs table not found, skipping save');
        return 'skipped';
      }
    }, 3, 1000);

    return NextResponse.json({
      success: true,
      configId
    });

  } catch (error) {
    console.error('[Save-Config] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: getDescriptiveErrorMessage(error),
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}
