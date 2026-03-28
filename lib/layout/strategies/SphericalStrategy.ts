/**
 * 球形布局策略
 * 
 * 适用于完全连接图或高密度图谱（密度 > 0.8）
 * 将节点均匀分布在球面上
 */

import { BaseLayoutStrategy } from './ILayoutStrategy';
import { Node3D, Edge, LayoutConfig, GraphMetrics, LayoutStrategy } from '../types';

export class SphericalStrategy extends BaseLayoutStrategy {
  readonly name = LayoutStrategy.SPHERICAL;
  
  /**
   * 应用球形布局
   * 
   * 算法步骤：
   * 1. 计算球体半径（基于节点数量和最小间距）
   * 2. 使用Fibonacci球面算法均匀分布节点
   * 3. 将节点投影到球面上
   */
  apply(nodes: Node3D[], edges: Edge[], config: LayoutConfig): Node3D[] {
    if (nodes.length === 0) {
      return [];
    }
    
    if (nodes.length === 1) {
      return [{
        ...nodes[0],
        x3d: 0,
        y3d: 0,
        z3d: 0
      }];
    }
    
    // 1. 计算球体半径
    // 基于节点数量和最小间距，确保节点在球面上不会太拥挤
    const radius = this.calculateSphereRadius(nodes.length, config.minNodeDistance);
    
    // 2. 使用Fibonacci球面算法生成均匀分布的点
    const result: Node3D[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      const position = this.fibonacciSphere(i, nodes.length, radius);
      
      result.push({
        ...nodes[i],
        x3d: position.x,
        y3d: position.y,
        z3d: position.z
      });
    }
    
    // 3. 验证坐标
    return this.validateCoordinates(result);
  }
  
  /**
   * 检查是否适用
   * 球形布局适用于完全连接图或高密度图谱
   */
  isApplicable(metrics: GraphMetrics): boolean {
    return metrics.density > 0.8;
  }
  
  /**
   * 计算球体半径
   * 
   * 基于节点数量和最小间距计算合适的球体半径
   * 确保球面上的节点不会太拥挤
   * 
   * @param nodeCount - 节点数量
   * @param minDistance - 最小节点间距
   */
  private calculateSphereRadius(nodeCount: number, minDistance: number): number {
    // 球面上均匀分布n个点，相邻点的平均距离约为：
    // d ≈ 2 * radius * sqrt(π / n)
    // 
    // 反推半径：
    // radius ≈ d / (2 * sqrt(π / n))
    
    const averageDistance = minDistance * 1.5; // 留一些余量
    const radius = averageDistance / (2 * Math.sqrt(Math.PI / nodeCount));
    
    // 确保半径至少为最小间距
    return Math.max(radius, minDistance * 2);
  }
  
  /**
   * Fibonacci球面算法
   * 
   * 在球面上均匀分布点的经典算法
   * 基于黄金角（Golden Angle）和Fibonacci数列
   * 
   * @param index - 点的索引（0到n-1）
   * @param total - 总点数
   * @param radius - 球体半径
   * @returns 球面上的3D坐标
   */
  private fibonacciSphere(index: number, total: number, radius: number): { x: number; y: number; z: number } {
    // 黄金角（约137.508度）
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    // 计算Y坐标（从-1到1均匀分布）
    const y = 1 - (index / (total - 1)) * 2;
    
    // 计算该高度处的圆的半径
    const radiusAtY = Math.sqrt(1 - y * y);
    
    // 计算角度（使用黄金角）
    const theta = goldenAngle * index;
    
    // 计算X和Z坐标
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    // 缩放到指定半径
    return {
      x: x * radius,
      y: y * radius,
      z: z * radius
    };
  }
}
