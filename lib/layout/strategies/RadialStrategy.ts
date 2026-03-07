/**
 * 径向布局策略
 * 
 * 适用于有明显中心节点的图谱
 * 中心节点在原点，其他节点按距离分层排列
 */

import { BaseLayoutStrategy } from './ILayoutStrategy';
import { Node3D, Edge, LayoutConfig, GraphMetrics, LayoutStrategy } from '../types';

export class RadialStrategy extends BaseLayoutStrategy {
  readonly name = LayoutStrategy.RADIAL;
  
  /**
   * 应用径向布局
   * 
   * 算法步骤：
   * 1. 识别中心节点（度数最高的节点）
   * 2. 计算每个节点到中心的距离（BFS层级）
   * 3. 按距离分层，在每层的圆周上均匀分布节点
   * 4. 添加高度变化增强3D效果
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
    
    // 1. 找到中心节点
    const centerNode = this.findCenterNode(nodes, edges);
    
    // 2. 计算每个节点到中心的距离
    const distances = this.calculateDistancesFromCenter(nodes, edges, centerNode.id);
    
    // 3. 按距离分组
    const nodesByDistance = this.groupNodesByDistance(nodes, distances);
    
    // 4. 布局参数
    const radiusStep = config.minNodeDistance * 2;
    const maxDistance = Math.max(...distances.values());
    
    // 5. 为每层节点分配位置
    const result: Node3D[] = [];
    
    for (let distance = 0; distance <= maxDistance; distance++) {
      const distanceNodes = nodesByDistance.get(distance) || [];
      if (distanceNodes.length === 0) continue;
      
      if (distance === 0) {
        // 中心节点放在原点
        result.push({
          ...distanceNodes[0],
          x3d: 0,
          y3d: 0,
          z3d: 0
        });
      } else {
        // 其他节点在圆周上分布
        const radius = distance * radiusStep;
        const arranged = this.arrangeNodesOnCircle(distanceNodes, radius, distance, config);
        result.push(...arranged);
      }
    }
    
    // 6. 居中整个布局
    return this.centerNodes(this.validateCoordinates(result));
  }
  
  /**
   * 检查是否适用
   * 径向布局适用于有明显中心节点的图谱
   */
  isApplicable(metrics: GraphMetrics): boolean {
    return metrics.hasCentralNode;
  }
  
  /**
   * 找到中心节点（度数最高的节点）
   */
  private findCenterNode(nodes: Node3D[], edges: Edge[]): Node3D {
    const degrees = this.calculateDegrees(nodes, edges);
    
    let centerNode = nodes[0];
    let maxDegree = 0;
    
    for (const node of nodes) {
      const degree = degrees.get(node.id) || 0;
      if (degree > maxDegree) {
        maxDegree = degree;
        centerNode = node;
      }
    }
    
    return centerNode;
  }
  
  /**
   * 使用BFS计算每个节点到中心节点的距离
   */
  private calculateDistancesFromCenter(
    nodes: Node3D[],
    edges: Edge[],
    centerId: string
  ): Map<string, number> {
    const distances = new Map<string, number>();
    const adjacency = this.buildAdjacencyList(nodes, edges);
    const visited = new Set<string>();
    const queue: Array<{ id: string; distance: number }> = [];
    
    // 初始化
    queue.push({ id: centerId, distance: 0 });
    visited.add(centerId);
    distances.set(centerId, 0);
    
    // BFS
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adjacency.get(current.id) || [];
      
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const distance = current.distance + 1;
          distances.set(neighborId, distance);
          queue.push({ id: neighborId, distance });
        }
      }
    }
    
    // 对于未连接的节点，分配最大距离+1
    const maxDistance = Math.max(...Array.from(distances.values()), 0);
    for (const node of nodes) {
      if (!distances.has(node.id)) {
        distances.set(node.id, maxDistance + 1);
      }
    }
    
    return distances;
  }
  
  /**
   * 按距离分组节点
   */
  private groupNodesByDistance(
    nodes: Node3D[],
    distances: Map<string, number>
  ): Map<number, Node3D[]> {
    const groups = new Map<number, Node3D[]>();
    
    for (const node of nodes) {
      const distance = distances.get(node.id) || 0;
      if (!groups.has(distance)) {
        groups.set(distance, []);
      }
      groups.get(distance)!.push(node);
    }
    
    return groups;
  }
  
  /**
   * 在圆周上排列节点
   * 
   * @param nodes - 要排列的节点
   * @param radius - 圆的半径
   * @param layer - 层级（用于计算高度）
   * @param config - 配置
   */
  private arrangeNodesOnCircle(
    nodes: Node3D[],
    radius: number,
    layer: number,
    config: LayoutConfig
  ): Node3D[] {
    const angleStep = (2 * Math.PI) / nodes.length;
    
    return nodes.map((node, index) => {
      const angle = index * angleStep;
      
      // XZ平面上的圆形分布
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      // Y坐标：添加高度变化
      // 使用正弦波创建起伏效果
      const heightFactor = config.heightVariation / 2;
      const y = Math.sin(angle * 2) * heightFactor + Math.sin(layer * 0.5) * heightFactor;
      
      return {
        ...node,
        x3d: x,
        y3d: y,
        z3d: z
      };
    });
  }
}
