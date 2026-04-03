// 认证和授权工具函数
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

/**
 * 获取当前登录用户ID的选项
 */
export interface GetCurrentUserIdOptions {
  required?: boolean; // 是否必须登录
}

/**
 * 从请求中获取当前登录用户ID
 * 
 * @param request - Next.js请求对象
 * @param options - 配置选项
 * @returns 用户ID或null（如果未登录且不是必需的）
 * @throws Error 如果required为true且用户未登录
 */
export async function getCurrentUserId(
  request: NextRequest,
  options?: GetCurrentUserIdOptions
): Promise<string | null> {
  try {
    // 从cookie中获取用户ID
    // 注意：这里假设使用cookie存储用户ID，实际实现可能需要验证JWT token
    const userId = request.cookies.get('userId')?.value;
    
    if (!userId) {
      if (options?.required) {
        throw new Error('用户未登录');
      }
      return null;
    }
    
    // 验证用户是否真的存在于数据库中（处理数据库被重置但cookie还在的情况）
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userExists) {
      if (options?.required) {
        throw new Error('用户状态已失效，请重新登录');
      }
      return null;
    }
    
    return userId;
  } catch (error) {
    if (options?.required) {
      throw error;
    }
    return null;
  }
}

/**
 * 验证项目所有权的选项
 */
export interface VerifyProjectOwnershipOptions {
  projectId: string;
  userId: string;
}

/**
 * 验证用户是否拥有指定项目
 * 
 * @param options - 包含projectId和userId的选项对象
 * @returns true如果用户拥有该项目，否则false
 */
export async function verifyProjectOwnership(
  options: VerifyProjectOwnershipOptions
): Promise<boolean> {
  try {
    const { projectId, userId } = options;
    
    // 查询项目并检查所有者
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true }
    });
    
    // 项目不存在
    if (!project) {
      return false;
    }
    
    // 检查所有权
    return project.userId === userId;
  } catch (error) {
    console.error('验证项目所有权失败:', error);
    return false;
  }
}

/**
 * 验证图谱所有权的选项
 */
export interface VerifyGraphOwnershipOptions {
  graphId: string;
  userId: string;
}

/**
 * 验证用户是否拥有指定图谱（通过项目关系）
 * 
 * @param options - 包含graphId和userId的选项对象
 * @returns true如果用户拥有该图谱所属的项目，否则false
 */
export async function verifyGraphOwnership(
  options: VerifyGraphOwnershipOptions
): Promise<boolean> {
  try {
    const { graphId, userId } = options;
    
    // 查询图谱及其所属项目
    const graph = await prisma.graph.findUnique({
      where: { id: graphId },
      select: {
        projectId: true,
        project: {
          select: { userId: true }
        }
      }
    });
    
    // 图谱不存在或没有关联项目
    if (!graph || !graph.project) {
      return false;
    }
    
    // 检查项目所有权
    return graph.project.userId === userId;
  } catch (error) {
    console.error('验证图谱所有权失败:', error);
    return false;
  }
}

/**
 * 验证项目访问权限
 * 
 * @param projectId - 项目ID
 * @param userId - 用户ID
 * @param operation - 操作类型
 * @returns 包含allowed和可选reason的对象
 */
export async function validateProjectAccess(
  projectId: string,
  userId: string,
  operation: 'read' | 'write' | 'delete'
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // 查询项目
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true }
    });
    
    // 项目不存在
    if (!project) {
      return {
        allowed: false,
        reason: '项目不存在'
      };
    }
    
    // read操作：项目存在即允许（可以根据需求调整）
    if (operation === 'read') {
      return { allowed: true };
    }
    
    // write/delete操作：仅所有者允许
    if (project.userId !== userId) {
      return {
        allowed: false,
        reason: '无权限操作此项目'
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('验证项目访问权限失败:', error);
    return {
      allowed: false,
      reason: '验证失败'
    };
  }
}
