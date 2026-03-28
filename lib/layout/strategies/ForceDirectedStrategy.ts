/**
 * 力导向布局策略
 * 
 * 适用于密集图谱（密度 > 0.2）
 * 使用物理模拟优化节点分布
 */

import { BaseLayoutStrategy } from './ILayoutStrategy';
import { Node3D, Edge, LayoutConfig, GraphMetrics, LayoutStrategy } from '../types';
import { ForceSimulator } from '../ForceSimulator';

export class ForceDirectedStrategy extends BaseLayoutStrategy {
  readonly name = LayoutStrategy.FORCE_DIRECTED;
  
  /**
   * 应用力导向布局
   * 
   * 算法步骤：
   * 1. 使用现有的3D坐标作为初始位置
   * 2. 创建ForceSimulator实例
   * 3. 执行力模拟优化节点分布
   * 4. 返回优化后的节点位置
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
    
    // 1. 确保所有节点都有有效的初始3D坐标
    const initializedNodes = this.ensureInitialPositions(nodes, config);
    
    // 2. 创建力模拟器
    const simulator = new ForceSimulator({
      iterations: config.iterations,
      springLength: config.springLength,
      repulsionStrength: config.repulsionStrength,
      damping: config.damping,
      convergenceThreshold: config.convergenceThreshold
    });
    
    // 3. 执行力模拟
    const result = simulator.simulate(initializedNodes, edges);
    
    // 4. 居中并验证结果
    return this.centerNodes(this.validateCoordinates(result));
  }
  
  /**
   * 检查是否适用
   * 力导向布局适用于密集图谱
   */
  isApplicable(metrics: GraphMetrics): boolean {
    return metrics.density > 0.2;
  }
  
  /**
   * 确保所有节点都有有效的初始3D位置
   * 如果节点的3D坐标无效，使用2D坐标或随机位置初始化
   */
  private ensureInitialPositions(nodes: Node3D[], config: LayoutConfig): Node3D[] {
    return nodes.map(node => {
      // 检查是否有有效的3D坐标
      const hasValidX = isFinite(node.x3d) && !isNaN(node.x3d);
      const hasValidY = isFinite(node.y3d) && !isNaN(node.y3d);
      const hasValidZ = isFinite(node.z3d) && !isNaN(node.z3d);
      
      if (hasValidX && hasValidY && hasValidZ) {
        return node;
      }
      
      // 使用2D坐标初始化3D位置
      return {
        ...node,
        x3d: hasValidX ? node.x3d : (isFinite(node.x2d) ? node.x2d : Math.random() * 100 - 50),
        y3d: hasValidY ? node.y3d : (Math.random() - 0.5) * config.heightVariation,
        z3d: hasValidZ ? node.z3d : (isFinite(node.y2d) ? node.y2d : Math.random() * 100 - 50)
      };
    });
  }
}
