/**
 * 布局策略接口
 * 
 * 定义了所有布局策略必须实现的方法
 * 每种策略负责将节点排列成特定的3D布局模式
 */

import { Node3D, Edge, LayoutConfig, GraphMetrics, LayoutStrategy } from '../types';

/**
 * 布局策略接口
 * 
 * 所有布局策略都必须实现此接口
 */
export interface ILayoutStrategy {
  /**
   * 策略名称
   */
  readonly name: LayoutStrategy;
  
  /**
   * 应用布局策略
   * 
   * @param nodes - 要布局的节点列表（已有初始3D坐标）
   * @param edges - 边列表
   * @param config - 布局配置
   * @returns 布局后的节点列表
   */
  apply(nodes: Node3D[], edges: Edge[], config: LayoutConfig): Node3D[];
  
  /**
   * 检查此策略是否适用于给定的图谱
   * 
   * @param metrics - 图谱分析指标
   * @returns 如果适用返回true，否则返回false
   */
  isApplicable(metrics: GraphMetrics): boolean;
}

/**
 * 抽象布局策略基类
 * 
 * 提供一些通用的辅助方法
 */
export abstract class BaseLayoutStrategy implements ILayoutStrategy {
  abstract readonly name: LayoutStrategy;
  
  abstract apply(nodes: Node3D[], edges: Edge[], config: LayoutConfig): Node3D[];
  
  abstract isApplicable(metrics: GraphMetrics): boolean;
  
  /**
   * 计算两个节点之间的欧几里得距离
   */
  protected calculateDistance(node1: Node3D, node2: Node3D): number {
    const dx = node2.x3d - node1.x3d;
    const dy = node2.y3d - node1.y3d;
    const dz = node2.z3d - node1.z3d;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * 计算节点列表的中心点
   */
  protected calculateCenter(nodes: Node3D[]): { x: number; y: number; z: number } {
    if (nodes.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }
    
    const sum = nodes.reduce(
      (acc, node) => ({
        x: acc.x + node.x3d,
        y: acc.y + node.y3d,
        z: acc.z + node.z3d
      }),
      { x: 0, y: 0, z: 0 }
    );
    
    return {
      x: sum.x / nodes.length,
      y: sum.y / nodes.length,
      z: sum.z / nodes.length
    };
  }
  
  /**
   * 将节点居中到原点
   */
  protected centerNodes(nodes: Node3D[]): Node3D[] {
    const center = this.calculateCenter(nodes);
    
    return nodes.map(node => ({
      ...node,
      x3d: node.x3d - center.x,
      y3d: node.y3d - center.y,
      z3d: node.z3d - center.z
    }));
  }
  
  /**
   * 构建邻接表
   */
  protected buildAdjacencyList(nodes: Node3D[], edges: Edge[]): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();
    
    // 初始化所有节点
    for (const node of nodes) {
      adjacency.set(node.id, []);
    }
    
    // 添加边
    for (const edge of edges) {
      const sourceNeighbors = adjacency.get(edge.source);
      const targetNeighbors = adjacency.get(edge.target);
      
      if (sourceNeighbors) {
        sourceNeighbors.push(edge.target);
      }
      if (targetNeighbors) {
        targetNeighbors.push(edge.source);
      }
    }
    
    return adjacency;
  }
  
  /**
   * 计算节点的度数
   */
  protected calculateDegrees(nodes: Node3D[], edges: Edge[]): Map<string, number> {
    const degrees = new Map<string, number>();
    
    // 初始化所有节点度数为0
    for (const node of nodes) {
      degrees.set(node.id, 0);
    }
    
    // 计算度数
    for (const edge of edges) {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    }
    
    return degrees;
  }
  
  /**
   * 验证坐标有效性
   */
  protected validateCoordinates(nodes: Node3D[]): Node3D[] {
    return nodes.map(node => ({
      ...node,
      x3d: isFinite(node.x3d) ? node.x3d : 0,
      y3d: isFinite(node.y3d) ? node.y3d : 0,
      z3d: isFinite(node.z3d) ? node.z3d : 0
    }));
  }
}
