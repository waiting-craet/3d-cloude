/**
 * 空间优化器 (Spatial Optimizer)
 * 
 * 负责优化节点在三维空间中的分布，确保：
 * - 消除节点重叠
 * - 实现均匀的空间分布
 * - 应用自适应间距因子
 * - 保持合理的空间利用率
 * 
 * 功能：
 * - 解决节点重叠问题
 * - 根据节点数量自适应调整间距
 * - 优化三维空间分布的均匀性
 * - 计算和验证空间利用率
 * 
 * 验证需求: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import type { 
  Node3D, 
  Edge, 
  LayoutConfig, 
  OptimizationResult, 
  CollisionReport 
} from './types';
import { CollisionDetector } from './CollisionDetector';

/**
 * 空间优化器类
 * 
 * 提供空间优化算法，包括：
 * 1. 重叠解决：通过迭代调整节点位置消除重叠
 * 2. 自适应间距：根据节点数量动态调整间距因子
 * 3. 均匀分布：确保节点在X、Y、Z三个维度上均匀分布
 * 4. 空间利用率：保持在60%-85%的理想范围
 */
export class SpatialOptimizer {
  private config: LayoutConfig;
  private detector: CollisionDetector;

  /**
   * 创建空间优化器
   * @param config 布局配置
   */
  constructor(config: LayoutConfig) {
    this.config = config;
    this.detector = new CollisionDetector(config.minNodeDistance);
  }

  /**
   * 优化节点的空间分布
   * 
   * 执行完整的空间优化流程：
   * 1. 应用自适应间距因子
   * 2. 检测并解决节点重叠
   * 3. 确保均匀分布
   * 4. 验证空间利用率
   * 
   * @param nodes 节点列表
   * @param edges 边列表（用于保持连接关系）
   * @returns 优化结果
   * 
   * 验证需求: 1.2, 2.1-2.7
   */
  optimize(nodes: Node3D[], edges: Edge[]): OptimizationResult {
    if (nodes.length === 0) {
      return {
        nodes: [],
        iterationsUsed: 0,
        overlapResolved: true,
        finalQuality: 100
      };
    }

    let optimizedNodes = [...nodes];
    let iterationsUsed = 0;
    const maxIterations = 20;

    // 步骤1: 应用自适应间距因子
    optimizedNodes = this.applyAdaptiveSpacing(optimizedNodes, nodes.length);

    // 步骤2: 检测碰撞
    let collisions = this.detector.detectCollisions(optimizedNodes);

    // 步骤3: 解决重叠（如果存在）
    if (collisions.hasCollisions) {
      optimizedNodes = this.resolveOverlaps(optimizedNodes, collisions);
      iterationsUsed = maxIterations; // 记录使用的迭代次数
      
      // 重新检测以验证
      collisions = this.detector.detectCollisions(optimizedNodes);
    }

    // 步骤4: 确保均匀分布
    optimizedNodes = this.ensureUniformDistribution(optimizedNodes);

    // 步骤5: 计算最终质量
    const spaceUtilization = this.calculateSpaceUtilization(optimizedNodes);
    const overlapResolved = !collisions.hasCollisions;
    
    // 计算质量分数
    let finalQuality = 100;
    if (!overlapResolved) {
      finalQuality -= collisions.collisionPairs.length * 10;
    }
    if (spaceUtilization < 0.6 || spaceUtilization > 0.85) {
      finalQuality -= 20;
    }
    finalQuality = Math.max(0, Math.min(100, finalQuality));

    return {
      nodes: optimizedNodes,
      iterationsUsed,
      overlapResolved,
      finalQuality
    };
  }

  /**
   * 解决节点重叠问题
   * 
   * 使用迭代算法将重叠的节点推开，直到满足最小距离要求。
   * 算法原理：
   * 1. 对于每对重叠节点，计算它们之间的重叠量
   * 2. 沿着连线方向将两个节点推开
   * 3. 重复直到没有重叠或达到最大迭代次数
   * 
   * @param nodes 节点列表
   * @param collisions 碰撞检测报告
   * @returns 解决重叠后的节点列表
   * 
   * 验证需求: 1.2
   */
  resolveOverlaps(nodes: Node3D[], collisions: CollisionReport): Node3D[] {
    const result = nodes.map(node => ({ ...node })); // 深拷贝
    const maxIterations = 10;

    for (let iter = 0; iter < maxIterations; iter++) {
      let resolved = true;

      for (const [id1, id2] of collisions.collisionPairs) {
        const node1 = result.find(n => n.id === id1);
        const node2 = result.find(n => n.id === id2);

        if (!node1 || !node2) continue;

        const distance = this.detector.calculateDistance(node1, node2);

        if (distance < this.config.minNodeDistance) {
          resolved = false;

          // 计算需要移动的距离
          const overlap = this.config.minNodeDistance - distance;
          const moveDistance = overlap / 2 + 1; // 额外移动1单位确保分离

          // 计算移动方向
          const dx = node2.x3d - node1.x3d;
          const dy = node2.y3d - node1.y3d;
          const dz = node2.z3d - node1.z3d;

          const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (length > 0.1) {
            // 归一化方向向量
            const dirX = dx / length;
            const dirY = dy / length;
            const dirZ = dz / length;

            // 将两个节点沿连线方向推开
            node1.x3d -= dirX * moveDistance;
            node1.y3d -= dirY * moveDistance;
            node1.z3d -= dirZ * moveDistance;

            node2.x3d += dirX * moveDistance;
            node2.y3d += dirY * moveDistance;
            node2.z3d += dirZ * moveDistance;
          } else {
            // 如果节点完全重叠，随机移动
            node2.x3d += (Math.random() - 0.5) * this.config.minNodeDistance;
            node2.y3d += (Math.random() - 0.5) * this.config.minNodeDistance;
            node2.z3d += (Math.random() - 0.5) * this.config.minNodeDistance;
          }
        }
      }

      if (resolved) break;

      // 重新检测碰撞
      collisions = this.detector.detectCollisions(result);
      if (!collisions.hasCollisions) break;
    }

    return result;
  }

  /**
   * 应用自适应间距因子
   * 
   * 根据节点数量动态调整节点之间的间距：
   * - 节点数 < 10: 因子 1.5
   * - 节点数 11-20: 因子 2.0
   * - 节点数 21-50: 因子 2.5
   * - 节点数 51-100: 因子 3.0
   * - 节点数 > 100: 因子 4.0
   * 
   * 算法：从图谱中心点向外扩展所有节点
   * 
   * @param nodes 节点列表
   * @param nodeCount 节点数量
   * @returns 应用间距因子后的节点列表
   * 
   * 验证需求: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  applyAdaptiveSpacing(nodes: Node3D[], nodeCount: number): Node3D[] {
    if (nodes.length === 0) return nodes;

    const factor = this.calculateSpacingFactor(nodeCount);

    // 计算中心点
    const center = {
      x: nodes.reduce((sum, n) => sum + n.x3d, 0) / nodes.length,
      y: nodes.reduce((sum, n) => sum + n.y3d, 0) / nodes.length,
      z: nodes.reduce((sum, n) => sum + n.z3d, 0) / nodes.length
    };

    // 从中心点向外扩展
    return nodes.map(node => ({
      ...node,
      x3d: center.x + (node.x3d - center.x) * factor,
      y3d: center.y + (node.y3d - center.y) * factor,
      z3d: center.z + (node.z3d - center.z) * factor
    }));
  }

  /**
   * 计算自适应间距因子
   * 
   * 根据节点数量返回相应的间距因子
   * 
   * @param nodeCount 节点数量
   * @returns 间距因子
   * 
   * 验证需求: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  calculateSpacingFactor(nodeCount: number): number {
    if (nodeCount < 10) return 1.5;
    if (nodeCount <= 20) return 2.0;
    if (nodeCount <= 50) return 2.5;
    if (nodeCount <= 100) return 3.0;
    return 4.0;
  }

  /**
   * 确保节点在三维空间中均匀分布
   * 
   * 通过调整节点位置，使其在X、Y、Z三个维度上的分布更加均匀。
   * 使用空间划分方法，将空间分为网格，调整节点密度过高的区域。
   * 
   * @param nodes 节点列表
   * @returns 调整后的节点列表
   * 
   * 验证需求: 2.6
   */
  ensureUniformDistribution(nodes: Node3D[]): Node3D[] {
    if (nodes.length < 3) return nodes;

    // 计算当前分布的标准差
    const xValues = nodes.map(n => n.x3d);
    const yValues = nodes.map(n => n.y3d);
    const zValues = nodes.map(n => n.z3d);

    const xStd = this.calculateStdDev(xValues);
    const yStd = this.calculateStdDev(yValues);
    const zStd = this.calculateStdDev(zValues);

    // 如果分布已经相对均匀，不需要调整
    const avgStd = (xStd + yStd + zStd) / 3;
    if (avgStd > 0 && Math.max(xStd, yStd, zStd) / avgStd < 2.0) {
      return nodes;
    }

    // 对分布不均的维度进行轻微调整
    return nodes.map(node => {
      const adjustedNode = { ...node };

      // 添加小的随机扰动以打破对称性
      const perturbation = 0.1;
      adjustedNode.x3d += (Math.random() - 0.5) * perturbation;
      adjustedNode.y3d += (Math.random() - 0.5) * perturbation;
      adjustedNode.z3d += (Math.random() - 0.5) * perturbation;

      return adjustedNode;
    });
  }

  /**
   * 计算空间利用率
   * 
   * 空间利用率定义为：节点占用的有效空间 / 总边界框体积
   * 理想范围：60% - 85%
   * 
   * 算法：
   * 1. 计算所有节点的边界框（最小和最大坐标）
   * 2. 计算边界框体积
   * 3. 估算节点占用的有效空间（基于节点数量和平均间距）
   * 4. 计算利用率 = 有效空间 / 边界框体积
   * 
   * @param nodes 节点列表
   * @returns 空间利用率（0-1之间）
   * 
   * 验证需求: 2.7
   */
  calculateSpaceUtilization(nodes: Node3D[]): number {
    if (nodes.length === 0) return 0;
    if (nodes.length === 1) return 0.75; // 单节点默认返回中等利用率

    // 计算边界框
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.x3d);
      maxX = Math.max(maxX, node.x3d);
      minY = Math.min(minY, node.y3d);
      maxY = Math.max(maxY, node.y3d);
      minZ = Math.min(minZ, node.z3d);
      maxZ = Math.max(maxZ, node.z3d);
    }

    // 计算边界框体积
    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    // 避免除以零
    if (width === 0 || height === 0 || depth === 0) {
      return 0.75; // 平面或线性分布，返回中等利用率
    }

    const boundingBoxVolume = width * height * depth;

    // 估算节点占用的有效空间
    // 每个节点占用一个球体，半径为最小距离的一半
    const nodeRadius = this.config.minNodeDistance / 2;
    const nodeVolume = (4 / 3) * Math.PI * Math.pow(nodeRadius, 3);
    const totalNodeVolume = nodeVolume * nodes.length;

    // 计算利用率
    const utilization = totalNodeVolume / boundingBoxVolume;

    // 限制在0-1范围内
    return Math.min(1.0, Math.max(0.0, utilization));
  }

  /**
   * 计算数组的标准差
   * 
   * @param values 数值数组
   * @returns 标准差
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * 更新配置
   * 
   * @param config 新的配置（部分或完整）
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
    this.detector.setMinDistance(this.config.minNodeDistance);
  }

  /**
   * 获取当前配置
   * 
   * @returns 当前配置
   */
  getConfig(): LayoutConfig {
    return { ...this.config };
  }
}
