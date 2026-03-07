/**
 * 层级布局策略
 * 
 * 适用于有向无环图（DAG）
 * 按层级分配Y坐标，同层节点在XZ平面上均匀分布
 */

import { BaseLayoutStrategy } from './ILayoutStrategy';
import { Node3D, Edge, LayoutConfig, GraphMetrics, LayoutStrategy } from '../types';

export class HierarchicalStrategy extends BaseLayoutStrategy {
  readonly name = LayoutStrategy.HIERARCHICAL;
  
  /**
   * 应用层级布局
   * 
   * 算法步骤：
   * 1. 拓扑排序确定节点层级
   * 2. 按层级分配Y坐标（高度）
   * 3. 同层节点在XZ平面上均匀分布
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
    
    // 1. 计算每个节点的层级
    const levels = this.calculateLevels(nodes, edges);
    
    // 2. 按层级分组节点
    const nodesByLevel = this.groupNodesByLevel(nodes, levels);
    
    // 3. 计算布局参数
    const levelHeight = config.minNodeDistance * 2;
    const maxLevel = Math.max(...levels.values());
    
    // 4. 为每层节点分配位置
    const result: Node3D[] = [];
    
    for (let level = 0; level <= maxLevel; level++) {
      const levelNodes = nodesByLevel.get(level) || [];
      if (levelNodes.length === 0) continue;
      
      // Y坐标：层级越高，Y值越大
      const y = level * levelHeight;
      
      // 在XZ平面上排列节点
      const arranged = this.arrangeNodesInPlane(levelNodes, config.minNodeDistance);
      
      for (let i = 0; i < arranged.length; i++) {
        result.push({
          ...arranged[i],
          y3d: y
        });
      }
    }
    
    // 5. 居中整个布局
    return this.centerNodes(this.validateCoordinates(result));
  }
  
  /**
   * 检查是否适用
   * 层级布局适用于有向无环图（DAG）
   */
  isApplicable(metrics: GraphMetrics): boolean {
    return metrics.isDAG;
  }
  
  /**
   * 计算每个节点的层级（使用拓扑排序）
   * 
   * 层级定义：
   * - 没有入边的节点为第0层
   * - 其他节点的层级 = max(前驱节点层级) + 1
   */
  private calculateLevels(nodes: Node3D[], edges: Edge[]): Map<string, number> {
    const levels = new Map<string, number>();
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    
    // 初始化
    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
      levels.set(node.id, 0);
    }
    
    // 构建邻接表和入度表
    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      const neighbors = adjacency.get(edge.source);
      if (neighbors) {
        neighbors.push(edge.target);
      }
    }
    
    // 拓扑排序（BFS）
    const queue: string[] = [];
    
    // 将所有入度为0的节点加入队列
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
        levels.set(nodeId, 0);
      }
    }
    
    // 处理队列
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;
      const neighbors = adjacency.get(current) || [];
      
      for (const neighbor of neighbors) {
        // 更新邻居的层级
        const neighborLevel = levels.get(neighbor) || 0;
        levels.set(neighbor, Math.max(neighborLevel, currentLevel + 1));
        
        // 减少入度
        const degree = inDegree.get(neighbor) || 0;
        inDegree.set(neighbor, degree - 1);
        
        // 如果入度为0，加入队列
        if (degree - 1 === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // 如果不是DAG（有环），使用简单的层级分配
    if (levels.size < nodes.length) {
      console.warn('Graph contains cycles, using fallback level assignment');
      let level = 0;
      for (const node of nodes) {
        if (!levels.has(node.id)) {
          levels.set(node.id, level++);
        }
      }
    }
    
    return levels;
  }
  
  /**
   * 按层级分组节点
   */
  private groupNodesByLevel(nodes: Node3D[], levels: Map<string, number>): Map<number, Node3D[]> {
    const groups = new Map<number, Node3D[]>();
    
    for (const node of nodes) {
      const level = levels.get(node.id) || 0;
      if (!groups.has(level)) {
        groups.set(level, []);
      }
      groups.get(level)!.push(node);
    }
    
    return groups;
  }
  
  /**
   * 在XZ平面上排列节点
   * 使用圆形或网格排列，取决于节点数量
   */
  private arrangeNodesInPlane(nodes: Node3D[], spacing: number): Node3D[] {
    if (nodes.length === 1) {
      return [{
        ...nodes[0],
        x3d: 0,
        z3d: 0
      }];
    }
    
    // 如果节点较少，使用圆形排列
    if (nodes.length <= 8) {
      return this.arrangeInCircle(nodes, spacing);
    }
    
    // 否则使用网格排列
    return this.arrangeInGrid(nodes, spacing);
  }
  
  /**
   * 圆形排列
   */
  private arrangeInCircle(nodes: Node3D[], spacing: number): Node3D[] {
    const radius = (nodes.length * spacing) / (2 * Math.PI);
    const angleStep = (2 * Math.PI) / nodes.length;
    
    return nodes.map((node, index) => {
      const angle = index * angleStep;
      return {
        ...node,
        x3d: radius * Math.cos(angle),
        z3d: radius * Math.sin(angle)
      };
    });
  }
  
  /**
   * 网格排列
   */
  private arrangeInGrid(nodes: Node3D[], spacing: number): Node3D[] {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    
    return nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      return {
        ...node,
        x3d: col * spacing - (cols * spacing) / 2,
        z3d: row * spacing - (Math.ceil(nodes.length / cols) * spacing) / 2
      };
    });
  }
}
