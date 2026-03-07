/**
 * 坐标转换器 (Coordinate Converter)
 * 
 * 负责将2D坐标转换为3D坐标，包括：
 * - 基础坐标映射（X2D -> X3D, Y2D -> Z3D）
 * - Y轴高度变化生成
 * - 缩放因子应用
 * - 坐标序列化和反序列化
 * - 坐标有效性验证
 * 
 * 验证需求: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5, 10.5
 */

import {
  Node2D,
  Node3D,
  LayoutConfig,
  ConversionOptions,
  DEFAULT_CONVERSION_OPTIONS,
  isValidCoordinate
} from './types';

export class CoordinateConverter {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * 将2D节点转换为3D节点
   * 
   * 转换规则：
   * - X2D -> X3D (保持X轴)
   * - Y2D -> Z3D (Y轴映射到Z轴)
   * - 生成Y3D (高度变化)
   * 
   * @param nodes - 2D节点数组
   * @param options - 转换选项
   * @returns 3D节点数组
   * 
   * 验证需求: 3.1, 3.2, 5.1
   */
  convert2Dto3D(
    nodes: Node2D[],
    options: ConversionOptions = DEFAULT_CONVERSION_OPTIONS
  ): Node3D[] {
    if (!nodes || nodes.length === 0) {
      return [];
    }

    // 生成高度变化
    const heightFactor = this.calculateHeightFactor(nodes.length);
    const heights = this.generateHeightVariation(nodes, heightFactor * options.heightVariation);

    // 转换每个节点
    const nodes3D: Node3D[] = nodes.map((node, index) => {
      // 处理无效的2D坐标
      const x2d = isValidCoordinate(node.x2d) ? node.x2d : 0;
      const y2d = isValidCoordinate(node.y2d) ? node.y2d : 0;

      return {
        ...node,
        x2d, // 保留原始2D坐标（可能已修正）
        y2d,
        x3d: x2d * options.scaleFactor,  // X轴保持
        y3d: heights[index],              // Y轴为高度变化
        z3d: y2d * options.scaleFactor   // Y2D映射到Z3D
      };
    });

    // 验证并修正无效坐标
    return this.validateAndFixCoordinates(nodes3D);
  }

  /**
   * 生成Y轴高度变化
   * 
   * 使用正弦波、余弦波和线性变化的组合创建自然的高度变化
   * 
   * @param nodes - 2D节点数组
   * @param heightFactor - 高度变化因子
   * @returns 高度数组
   * 
   * 验证需求: 5.2, 5.5
   */
  generateHeightVariation(nodes: Node2D[], heightFactor: number): number[] {
    const heights: number[] = [];
    const n = nodes.length;

    // 单个节点时，高度为0
    if (n === 1) {
      return [0];
    }

    for (let i = 0; i < n; i++) {
      // 归一化索引 [0, 1]
      const t = i / n;

      // 正弦波 - 主要的高度变化
      const sine = Math.sin(t * Math.PI * 2) * heightFactor;

      // 余弦波（相位偏移）- 增加复杂性
      const cosine = Math.cos(t * Math.PI * 3 + Math.PI / 4) * heightFactor * 0.5;

      // 线性变化 - 创建整体倾斜
      const linear = (t - 0.5) * heightFactor * 0.3;

      // 基于节点位置的变化 - 增加随机性
      const positionBased = ((nodes[i].x2d % 100) / 100) * heightFactor * 0.2;

      // 组合所有变化
      const height = sine + cosine + linear + positionBased;

      heights.push(height);
    }

    return heights;
  }

  /**
   * 计算高度变化因子
   * 
   * 根据节点数量动态调整高度变化因子：
   * - 节点数 < 50: 因子 = 1.5
   * - 节点数 >= 50: 因子 = 2.0
   * 
   * @param nodeCount - 节点数量
   * @returns 高度变化因子
   * 
   * 验证需求: 5.3, 5.4
   */
  private calculateHeightFactor(nodeCount: number): number {
    return nodeCount < 50 ? 1.5 : 2.0;
  }

  /**
   * 应用缩放因子到3D节点
   * 
   * @param nodes - 3D节点数组
   * @param factor - 缩放因子
   * @returns 缩放后的3D节点数组
   */
  applyScaleFactor(nodes: Node3D[], factor: number): Node3D[] {
    if (!isValidCoordinate(factor) || factor <= 0) {
      console.warn(`Invalid scale factor: ${factor}, using 1.0`);
      factor = 1.0;
    }

    return nodes.map(node => ({
      ...node,
      x3d: node.x3d * factor,
      y3d: node.y3d * factor,
      z3d: node.z3d * factor
    }));
  }

  /**
   * 序列化节点坐标为JSON字符串
   * 
   * @param nodes - 3D节点数组
   * @returns JSON字符串
   * 
   * 验证需求: S.3 (特殊需求 - 坐标序列化)
   */
  serializeCoordinates(nodes: Node3D[]): string {
    try {
      // 只序列化必要的坐标信息
      const serializable = nodes.map(node => ({
        id: node.id,
        label: node.label,
        x2d: node.x2d,
        y2d: node.y2d,
        x3d: node.x3d,
        y3d: node.y3d,
        z3d: node.z3d
      }));

      return JSON.stringify(serializable);
    } catch (error) {
      console.error('Failed to serialize coordinates:', error);
      throw new Error('Coordinate serialization failed');
    }
  }

  /**
   * 从JSON字符串反序列化节点坐标
   * 
   * @param json - JSON字符串
   * @returns 3D节点数组
   * 
   * 验证需求: S.3, S.4 (特殊需求 - 坐标反序列化和验证)
   */
  deserializeCoordinates(json: string): Node3D[] {
    try {
      const parsed = JSON.parse(json);

      if (!Array.isArray(parsed)) {
        throw new Error('Deserialized data is not an array');
      }

      // 验证并修正每个节点
      const nodes: Node3D[] = parsed.map(item => {
        if (!item.id || typeof item.id !== 'string') {
          throw new Error('Invalid node: missing or invalid id');
        }

        return {
          id: item.id,
          label: item.label || '',
          x2d: isValidCoordinate(item.x2d) ? item.x2d : 0,
          y2d: isValidCoordinate(item.y2d) ? item.y2d : 0,
          x3d: isValidCoordinate(item.x3d) ? item.x3d : 0,
          y3d: isValidCoordinate(item.y3d) ? item.y3d : 0,
          z3d: isValidCoordinate(item.z3d) ? item.z3d : 0
        };
      });

      return nodes;
    } catch (error) {
      console.error('Failed to deserialize coordinates:', error);
      throw new Error('Coordinate deserialization failed');
    }
  }

  /**
   * 验证节点坐标的有效性
   * 
   * 检查所有坐标是否为有效数字（非NaN、非Infinity）
   * 
   * @param nodes - 3D节点数组
   * @returns 是否所有坐标都有效
   * 
   * 验证需求: 10.5
   */
  validateCoordinates(nodes: Node3D[]): boolean {
    for (const node of nodes) {
      if (!isValidCoordinate(node.x2d) ||
          !isValidCoordinate(node.y2d) ||
          !isValidCoordinate(node.x3d) ||
          !isValidCoordinate(node.y3d) ||
          !isValidCoordinate(node.z3d)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 验证并修正无效坐标
   * 
   * 将NaN或Infinity替换为0
   * 
   * @param nodes - 3D节点数组
   * @returns 修正后的3D节点数组
   * 
   * 验证需求: 10.5
   */
  private validateAndFixCoordinates(nodes: Node3D[]): Node3D[] {
    return nodes.map(node => {
      const fixed: Node3D = { ...node };
      let hasInvalid = false;

      // 检查并修正每个坐标
      if (!isValidCoordinate(node.x2d)) {
        fixed.x2d = 0;
        hasInvalid = true;
      }
      if (!isValidCoordinate(node.y2d)) {
        fixed.y2d = 0;
        hasInvalid = true;
      }
      if (!isValidCoordinate(node.x3d)) {
        fixed.x3d = 0;
        hasInvalid = true;
      }
      if (!isValidCoordinate(node.y3d)) {
        fixed.y3d = 0;
        hasInvalid = true;
      }
      if (!isValidCoordinate(node.z3d)) {
        fixed.z3d = 0;
        hasInvalid = true;
      }

      if (hasInvalid) {
        console.warn(`Fixed invalid coordinates for node ${node.id}`);
      }

      return fixed;
    });
  }

  /**
   * 保持拓扑关系的转换
   * 
   * 确保转换后节点的相对位置关系与2D图谱一致
   * 
   * @param nodes - 2D节点数组
   * @returns 3D节点数组
   * 
   * 验证需求: 3.2, 3.3
   */
  convertWithTopologyPreservation(nodes: Node2D[]): Node3D[] {
    // 使用默认选项，但确保preserveTopology为true
    const options: ConversionOptions = {
      ...DEFAULT_CONVERSION_OPTIONS,
      preserveTopology: true,
      heightVariation: this.config.heightVariation,
      scaleFactor: 1.0
    };

    return this.convert2Dto3D(nodes, options);
  }

  /**
   * 计算节点的边界框
   * 
   * @param nodes - 3D节点数组
   * @returns 边界框 {minX, maxX, minY, maxY, minZ, maxZ}
   */
  calculateBoundingBox(nodes: Node3D[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  } {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
    }

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

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  /**
   * 将节点居中到原点
   * 
   * @param nodes - 3D节点数组
   * @returns 居中后的3D节点数组
   */
  centerNodes(nodes: Node3D[]): Node3D[] {
    if (nodes.length === 0) {
      return [];
    }

    // 计算中心点
    const centerX = nodes.reduce((sum, n) => sum + n.x3d, 0) / nodes.length;
    const centerY = nodes.reduce((sum, n) => sum + n.y3d, 0) / nodes.length;
    const centerZ = nodes.reduce((sum, n) => sum + n.z3d, 0) / nodes.length;

    // 平移所有节点
    return nodes.map(node => ({
      ...node,
      x3d: node.x3d - centerX,
      y3d: node.y3d - centerY,
      z3d: node.z3d - centerZ
    }));
  }
}
