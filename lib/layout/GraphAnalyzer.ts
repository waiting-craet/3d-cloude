/**
 * GraphAnalyzer - 图谱分析器
 * 
 * 分析图谱的拓扑特征并推荐最合适的布局策略
 * 
 * 功能：
 * - 计算图谱指标（节点数、边数、密度）
 * - 检测图谱是否为DAG（有向无环图）
 * - 识别中心节点
 * - 根据图谱特征推荐布局策略
 * 
 * 需求: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import {
  Node2D,
  Edge,
  GraphMetrics,
  LayoutStrategy
} from './types';

export class GraphAnalyzer {
  /**
   * 分析图谱并返回完整的指标
   * 
   * @param nodes - 节点列表
   * @param edges - 边列表
   * @returns 图谱分析指标
   * 
   * 需求 6.1: 分析图谱的节点数量、边数量、密度和拓扑结构
   */
  analyze(nodes: Node2D[], edges: Edge[]): GraphMetrics {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    
    // 计算图谱密度
    // 密度 = 实际边数 / 最大可能边数
    // 对于无向图: maxEdges = n * (n - 1) / 2
    // 对于有向图: maxEdges = n * (n - 1)
    // 这里假设为无向图
    const maxPossibleEdges = nodeCount > 1 ? (nodeCount * (nodeCount - 1)) / 2 : 0;
    const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
    
    // 检测是否为DAG
    const isDAG = this.detectCycles(nodes, edges);
    
    // 计算节点度数
    const degrees = this.calculateDegrees(nodes, edges);
    
    // 计算度数统计
    const degreeValues = Array.from(degrees.values());
    const maxDegree = degreeValues.length > 0 ? Math.max(...degreeValues) : 0;
    const averageDegree = degreeValues.length > 0 
      ? degreeValues.reduce((sum, d) => sum + d, 0) / degreeValues.length 
      : 0;
    
    // 识别中心节点
    // 中心节点定义：度数超过节点总数的30%
    const centralNodeThreshold = nodeCount * 0.3;
    const hasCentralNode = maxDegree > centralNodeThreshold;
    const centralNodeDegree = hasCentralNode ? maxDegree : 0;
    
    return {
      nodeCount,
      edgeCount,
      density,
      isDAG,
      hasCentralNode,
      centralNodeDegree,
      averageDegree,
      maxDegree
    };
  }
  
  /**
   * 根据图谱指标推荐最合适的布局策略
   * 
   * @param metrics - 图谱分析指标
   * @returns 推荐的布局策略
   * 
   * 需求 6.2: 如果是DAG，推荐层级布局
   * 需求 6.3: 如果有中心节点，推荐径向布局
   * 需求 6.4: 如果密度大于0.2，推荐力导向布局
   * 需求 6.5: 如果节点数>30且密度<0.1，推荐网格布局
   */
  recommendStrategy(metrics: GraphMetrics): LayoutStrategy {
    // 优先级1: 层级布局 - 适用于DAG
    if (metrics.isDAG) {
      return LayoutStrategy.HIERARCHICAL;
    }
    
    // 优先级2: 径向布局 - 适用于有明显中心节点的图谱
    if (metrics.hasCentralNode) {
      return LayoutStrategy.RADIAL;
    }
    
    // 优先级3: 网格布局 - 适用于稀疏大图
    if (metrics.nodeCount > 30 && metrics.density < 0.1) {
      return LayoutStrategy.GRID;
    }
    
    // 优先级4: 球形布局 - 适用于完全连接图
    if (metrics.density > 0.8) {
      return LayoutStrategy.SPHERICAL;
    }
    
    // 优先级5: 力导向布局 - 适用于密集图谱
    if (metrics.density > 0.2) {
      return LayoutStrategy.FORCE_DIRECTED;
    }
    
    // 默认: 力导向布局 - 通用策略
    return LayoutStrategy.FORCE_DIRECTED;
  }
  
  /**
   * 检测图谱中是否存在环（循环依赖）
   * 使用深度优先搜索（DFS）检测
   * 
   * @param nodes - 节点列表
   * @param edges - 边列表
   * @returns true 如果是DAG（无环），false 如果有环
   * 
   * 需求 6.1: 检测层级结构（是否为DAG）
   */
  detectCycles(nodes: Node2D[], edges: Edge[]): boolean {
    // 构建邻接表
    const adjacencyList = new Map<string, string[]>();
    
    // 初始化所有节点
    for (const node of nodes) {
      adjacencyList.set(node.id, []);
    }
    
    // 添加边
    for (const edge of edges) {
      const neighbors = adjacencyList.get(edge.source);
      if (neighbors) {
        neighbors.push(edge.target);
      }
    }
    
    // DFS状态：0=未访问，1=访问中，2=已完成
    const visited = new Map<string, number>();
    for (const node of nodes) {
      visited.set(node.id, 0);
    }
    
    // DFS检测环
    const hasCycle = (nodeId: string): boolean => {
      const state = visited.get(nodeId);
      
      // 如果节点正在访问中，说明找到了环
      if (state === 1) {
        return true;
      }
      
      // 如果节点已完成，跳过
      if (state === 2) {
        return false;
      }
      
      // 标记为访问中
      visited.set(nodeId, 1);
      
      // 访问所有邻居
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }
      
      // 标记为已完成
      visited.set(nodeId, 2);
      return false;
    };
    
    // 检查所有节点
    for (const node of nodes) {
      if (visited.get(node.id) === 0) {
        if (hasCycle(node.id)) {
          return false; // 有环，不是DAG
        }
      }
    }
    
    return true; // 无环，是DAG
  }
  
  /**
   * 查找图谱中的中心节点
   * 中心节点定义：度数超过节点总数30%的节点
   * 
   * @param nodes - 节点列表
   * @param edges - 边列表
   * @returns 中心节点列表
   * 
   * 需求 6.3: 识别中心节点（高度数节点）
   */
  findCentralNodes(nodes: Node2D[], edges: Edge[]): Node2D[] {
    const degrees = this.calculateDegrees(nodes, edges);
    const centralNodeThreshold = nodes.length * 0.3;
    
    const centralNodes: Node2D[] = [];
    
    for (const node of nodes) {
      const degree = degrees.get(node.id) || 0;
      if (degree > centralNodeThreshold) {
        centralNodes.push(node);
      }
    }
    
    return centralNodes;
  }
  
  /**
   * 计算每个节点的度数
   * 度数 = 连接到该节点的边的数量
   * 
   * @param nodes - 节点列表
   * @param edges - 边列表
   * @returns 节点ID到度数的映射
   * 
   * 需求 6.1: 计算图谱指标
   */
  calculateDegrees(nodes: Node2D[], edges: Edge[]): Map<string, number> {
    const degrees = new Map<string, number>();
    
    // 初始化所有节点度数为0
    for (const node of nodes) {
      degrees.set(node.id, 0);
    }
    
    // 计算度数（无向图：每条边为两个节点各增加1度）
    for (const edge of edges) {
      // 源节点度数+1
      const sourceDegree = degrees.get(edge.source) || 0;
      degrees.set(edge.source, sourceDegree + 1);
      
      // 目标节点度数+1
      const targetDegree = degrees.get(edge.target) || 0;
      degrees.set(edge.target, targetDegree + 1);
    }
    
    return degrees;
  }
}
