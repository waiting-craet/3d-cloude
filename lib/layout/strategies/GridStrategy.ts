/**
 * 网格布局策略
 * 
 * 适用于稀疏大图（节点数 > 30 且密度 < 0.1）或无边图谱
 * 将节点排列成3D网格结构
 */

import { BaseLayoutStrategy } from './ILayoutStrategy';
import { Node3D, Edge, LayoutConfig, GraphMetrics, LayoutStrategy } from '../types';

export class GridStrategy extends BaseLayoutStrategy {
  readonly name = LayoutStrategy.GRID;
  
  /**
   * 应用网格布局
   * 
   * 算法步骤：
   * 1. 计算网格维度（尽量接近立方体）
   * 2. 按顺序将节点放置在网格位置上
   * 3. 添加轻微的随机偏移增加自然感
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
    
    // 1. 计算网格维度
    const dimensions = this.calculateGridDimensions(nodes.length);
    
    // 2. 计算间距
    const spacing = config.minNodeDistance * 1.5;
    
    // 3. 为每个节点分配网格位置
    const result: Node3D[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      const position = this.getGridPosition(i, dimensions, spacing);
      
      // 添加轻微的随机偏移（±10%）以增加自然感
      const jitter = spacing * 0.1;
      const x = position.x + (Math.random() - 0.5) * jitter;
      const y = position.y + (Math.random() - 0.5) * jitter;
      const z = position.z + (Math.random() - 0.5) * jitter;
      
      result.push({
        ...nodes[i],
        x3d: x,
        y3d: y,
        z3d: z
      });
    }
    
    // 4. 居中整个布局
    return this.centerNodes(this.validateCoordinates(result));
  }
  
  /**
   * 检查是否适用
   * 网格布局适用于稀疏大图或无边图谱
   */
  isApplicable(metrics: GraphMetrics): boolean {
    // 无边图谱
    if (metrics.edgeCount === 0) {
      return true;
    }
    
    // 稀疏大图
    return metrics.nodeCount > 30 && metrics.density < 0.1;
  }
  
  /**
   * 计算网格维度
   * 尽量使网格接近立方体形状
   * 
   * @param nodeCount - 节点数量
   * @returns 网格的宽、高、深度
   */
  private calculateGridDimensions(nodeCount: number): { width: number; height: number; depth: number } {
    // 计算立方根作为基准
    const cubeRoot = Math.cbrt(nodeCount);
    
    // 向上取整得到基础维度
    let width = Math.ceil(cubeRoot);
    let height = Math.ceil(cubeRoot);
    let depth = Math.ceil(cubeRoot);
    
    // 调整维度以适应实际节点数量
    // 优先减少高度（Y轴），使布局更扁平
    while (width * height * depth > nodeCount + width * height) {
      depth--;
    }
    
    while (width * height * depth > nodeCount + width) {
      height--;
    }
    
    // 确保至少为1
    width = Math.max(1, width);
    height = Math.max(1, height);
    depth = Math.max(1, depth);
    
    return { width, height, depth };
  }
  
  /**
   * 获取网格中第i个位置的3D坐标
   * 
   * @param index - 节点索引
   * @param dimensions - 网格维度
   * @param spacing - 网格间距
   */
  private getGridPosition(
    index: number,
    dimensions: { width: number; height: number; depth: number },
    spacing: number
  ): { x: number; y: number; z: number } {
    // 计算网格坐标
    const x = index % dimensions.width;
    const y = Math.floor(index / (dimensions.width * dimensions.depth)) % dimensions.height;
    const z = Math.floor(index / dimensions.width) % dimensions.depth;
    
    // 转换为3D空间坐标（居中）
    return {
      x: (x - (dimensions.width - 1) / 2) * spacing,
      y: (y - (dimensions.height - 1) / 2) * spacing,
      z: (z - (dimensions.depth - 1) / 2) * spacing
    };
  }
}
