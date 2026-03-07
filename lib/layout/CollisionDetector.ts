/**
 * 碰撞检测器 (Collision Detector)
 * 
 * 负责检测和报告节点之间的碰撞（重叠）情况
 * 
 * 功能：
 * - 检测所有节点对之间的距离
 * - 识别距离小于最小安全距离的节点对
 * - 提供基础碰撞检测和优化的空间划分算法
 * - 支持大规模图谱的高效碰撞检测
 * 
 * 验证需求: 1.1, 1.3, 1.4
 */

import type { Node3D, CollisionReport } from './types';

/**
 * 空间网格类
 * 用于大规模图谱的碰撞检测优化
 * 
 * 通过将3D空间划分为网格单元，只检查相邻单元格中的节点，
 * 将碰撞检测的时间复杂度从O(n²)降低到O(n)
 */
export class SpatialGrid {
  private cellSize: number;
  private cells: Map<string, Node3D[]>;

  /**
   * 创建空间网格
   * @param cellSize 单元格大小（通常设置为最小距离的2倍）
   */
  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  /**
   * 将节点插入网格
   * @param node 要插入的节点
   */
  insert(node: Node3D): void {
    const cellKey = this.getCellKey(node);
    if (!this.cells.has(cellKey)) {
      this.cells.set(cellKey, []);
    }
    this.cells.get(cellKey)!.push(node);
  }

  /**
   * 获取节点所在的单元格键
   * @param node 节点
   * @returns 单元格键（格式: "x,y,z"）
   */
  private getCellKey(node: Node3D): string {
    const x = Math.floor(node.x3d / this.cellSize);
    const y = Math.floor(node.y3d / this.cellSize);
    const z = Math.floor(node.z3d / this.cellSize);
    return `${x},${y},${z}`;
  }

  /**
   * 获取节点相邻单元格中的所有节点
   * @param node 节点
   * @returns 相邻节点列表（包括同一单元格）
   */
  getNearbyNodes(node: Node3D): Node3D[] {
    const nearby: Node3D[] = [];
    const baseX = Math.floor(node.x3d / this.cellSize);
    const baseY = Math.floor(node.y3d / this.cellSize);
    const baseZ = Math.floor(node.z3d / this.cellSize);

    // 检查27个相邻单元格（3x3x3立方体，包括自己）
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${baseX + dx},${baseY + dy},${baseZ + dz}`;
          const cellNodes = this.cells.get(key);
          if (cellNodes) {
            nearby.push(...cellNodes);
          }
        }
      }
    }

    return nearby;
  }

  /**
   * 清空网格
   */
  clear(): void {
    this.cells.clear();
  }
}

/**
 * 碰撞检测器类
 * 
 * 提供两种碰撞检测算法：
 * 1. 基础算法：O(n²)，适用于小规模图谱（<100节点）
 * 2. 空间划分算法：O(n)，适用于大规模图谱（≥100节点）
 */
export class CollisionDetector {
  private minDistance: number;

  /**
   * 创建碰撞检测器
   * @param minDistance 最小安全距离（默认18单位）
   */
  constructor(minDistance: number = 18) {
    this.minDistance = minDistance;
  }

  /**
   * 检测所有节点对之间的碰撞
   * 
   * 根据节点数量自动选择最优算法：
   * - 节点数 < 100: 使用基础算法
   * - 节点数 ≥ 100: 使用空间划分优化算法
   * 
   * @param nodes 节点列表
   * @returns 碰撞检测报告
   * 
   * 验证需求: 1.1
   */
  detectCollisions(nodes: Node3D[]): CollisionReport {
    // 空数组或单节点无碰撞
    if (nodes.length <= 1) {
      return {
        hasCollisions: false,
        collisionPairs: [],
        minDistance: Infinity,
        averageDistance: 0
      };
    }

    // 根据节点数量选择算法
    if (nodes.length < 100) {
      return this.detectCollisionsBasic(nodes);
    } else {
      return this.detectCollisionsOptimized(nodes);
    }
  }

  /**
   * 基础碰撞检测算法
   * 时间复杂度: O(n²)
   * 
   * @param nodes 节点列表
   * @returns 碰撞检测报告
   */
  private detectCollisionsBasic(nodes: Node3D[]): CollisionReport {
    const collisionPairs: Array<[string, string]> = [];
    let minDistance = Infinity;
    let totalDistance = 0;
    let pairCount = 0;

    // 检查所有节点对
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = this.calculateDistance(nodes[i], nodes[j]);

        totalDistance += distance;
        pairCount++;

        if (distance < minDistance) {
          minDistance = distance;
        }

        // 检测碰撞
        if (distance < this.minDistance) {
          collisionPairs.push([nodes[i].id, nodes[j].id]);
        }
      }
    }

    return {
      hasCollisions: collisionPairs.length > 0,
      collisionPairs,
      minDistance,
      averageDistance: pairCount > 0 ? totalDistance / pairCount : 0
    };
  }

  /**
   * 优化的碰撞检测算法（使用空间划分）
   * 时间复杂度: O(n)（平均情况）
   * 
   * 适用于大规模图谱（≥100节点）
   * 
   * @param nodes 节点列表
   * @returns 碰撞检测报告
   */
  private detectCollisionsOptimized(nodes: Node3D[]): CollisionReport {
    // 创建空间网格，单元格大小为最小距离的2倍
    const grid = new SpatialGrid(this.minDistance * 2);

    // 将所有节点插入网格
    for (const node of nodes) {
      grid.insert(node);
    }

    const collisionPairs: Array<[string, string]> = [];
    const checked = new Set<string>();
    let minDistance = Infinity;
    let totalDistance = 0;
    let pairCount = 0;

    // 只检查相邻单元格中的节点
    for (const node of nodes) {
      const nearby = grid.getNearbyNodes(node);

      for (const other of nearby) {
        // 跳过自己
        if (node.id === other.id) continue;

        // 避免重复检查（使用排序后的ID对作为键）
        const pairKey = [node.id, other.id].sort().join('-');
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        const distance = this.calculateDistance(node, other);

        totalDistance += distance;
        pairCount++;

        if (distance < minDistance) {
          minDistance = distance;
        }

        // 检测碰撞
        if (distance < this.minDistance) {
          collisionPairs.push([node.id, other.id]);
        }
      }
    }

    return {
      hasCollisions: collisionPairs.length > 0,
      collisionPairs,
      minDistance: minDistance === Infinity ? 0 : minDistance,
      averageDistance: pairCount > 0 ? totalDistance / pairCount : 0
    };
  }

  /**
   * 检测两个节点是否碰撞
   * 
   * @param node1 第一个节点
   * @param node2 第二个节点
   * @returns 是否碰撞（距离小于最小安全距离）
   */
  isColliding(node1: Node3D, node2: Node3D): boolean {
    const distance = this.calculateDistance(node1, node2);
    return distance < this.minDistance;
  }

  /**
   * 计算两个节点之间的欧几里得距离
   * 
   * 使用3D空间中的距离公式：
   * distance = √[(x2-x1)² + (y2-y1)² + (z2-z1)²]
   * 
   * @param node1 第一个节点
   * @param node2 第二个节点
   * @returns 距离值
   */
  calculateDistance(node1: Node3D, node2: Node3D): number {
    const dx = node2.x3d - node1.x3d;
    const dy = node2.y3d - node1.y3d;
    const dz = node2.z3d - node1.z3d;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 查找距离最近的k对节点
   * 
   * 用于分析节点分布和识别潜在的拥挤区域
   * 
   * @param nodes 节点列表
   * @param k 返回的节点对数量
   * @returns 最近的k对节点及其距离，格式: [node1, node2, distance]
   */
  findClosestPairs(nodes: Node3D[], k: number): Array<[Node3D, Node3D, number]> {
    if (nodes.length < 2) {
      return [];
    }

    // 计算所有节点对的距离
    const pairs: Array<[Node3D, Node3D, number]> = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = this.calculateDistance(nodes[i], nodes[j]);
        pairs.push([nodes[i], nodes[j], distance]);
      }
    }

    // 按距离排序并返回前k个
    pairs.sort((a, b) => a[2] - b[2]);
    return pairs.slice(0, k);
  }

  /**
   * 更新最小安全距离
   * 
   * @param minDistance 新的最小安全距离
   */
  setMinDistance(minDistance: number): void {
    if (minDistance <= 0) {
      throw new Error('Minimum distance must be positive');
    }
    this.minDistance = minDistance;
  }

  /**
   * 获取当前的最小安全距离
   * 
   * @returns 最小安全距离
   */
  getMinDistance(): number {
    return this.minDistance;
  }
}
