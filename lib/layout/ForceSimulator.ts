/**
 * 力模拟器 (Force Simulator)
 * 
 * 使用物理模拟优化节点分布，实现力导向布局算法
 * 
 * 核心算法：
 * 1. 库仑排斥力 (Coulomb Repulsion) - 使所有节点相互推开
 * 2. 胡克弹簧力 (Hooke's Spring Force) - 使有边连接的节点保持适当距离
 * 3. 迭代模拟 - 重复应用力直到系统收敛或达到最大迭代次数
 * 
 * 验证需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import {
  Node3D,
  Edge,
  Vector3D,
  ForceConfig,
  NodeState,
  DEFAULT_LAYOUT_CONFIG
} from './types';

/**
 * 力模拟器类
 * 
 * 实现基于物理的力导向布局算法，通过模拟节点之间的排斥力和弹簧力
 * 来优化节点在三维空间中的分布
 */
export class ForceSimulator {
  private config: ForceConfig;

  /**
   * 构造函数
   * @param config 力模拟配置参数
   */
  constructor(config?: Partial<ForceConfig>) {
    // 使用默认配置并合并用户配置
    this.config = {
      iterations: config?.iterations ?? DEFAULT_LAYOUT_CONFIG.iterations,
      springLength: config?.springLength ?? DEFAULT_LAYOUT_CONFIG.springLength,
      repulsionStrength: config?.repulsionStrength ?? DEFAULT_LAYOUT_CONFIG.repulsionStrength,
      damping: config?.damping ?? DEFAULT_LAYOUT_CONFIG.damping,
      convergenceThreshold: config?.convergenceThreshold ?? DEFAULT_LAYOUT_CONFIG.convergenceThreshold
    };

    // 验证配置参数
    this.validateConfig();
  }

  /**
   * 验证配置参数的有效性
   * 需求 9.7: 无效配置使用默认值并记录警告
   */
  private validateConfig(): void {
    if (this.config.iterations < 50 || this.config.iterations > 200) {
      console.warn(`Invalid iterations: ${this.config.iterations}, using default: ${DEFAULT_LAYOUT_CONFIG.iterations}`);
      this.config.iterations = DEFAULT_LAYOUT_CONFIG.iterations;
    }

    if (this.config.springLength < 5 || this.config.springLength > 100) {
      console.warn(`Invalid springLength: ${this.config.springLength}, using default: ${DEFAULT_LAYOUT_CONFIG.springLength}`);
      this.config.springLength = DEFAULT_LAYOUT_CONFIG.springLength;
    }

    if (this.config.repulsionStrength < 100 || this.config.repulsionStrength > 5000) {
      console.warn(`Invalid repulsionStrength: ${this.config.repulsionStrength}, using default: ${DEFAULT_LAYOUT_CONFIG.repulsionStrength}`);
      this.config.repulsionStrength = DEFAULT_LAYOUT_CONFIG.repulsionStrength;
    }

    if (this.config.damping < 0 || this.config.damping > 1) {
      console.warn(`Invalid damping: ${this.config.damping}, using default: ${DEFAULT_LAYOUT_CONFIG.damping}`);
      this.config.damping = DEFAULT_LAYOUT_CONFIG.damping;
    }

    if (this.config.convergenceThreshold < 0.001 || this.config.convergenceThreshold > 0.1) {
      console.warn(`Invalid convergenceThreshold: ${this.config.convergenceThreshold}, using default: ${DEFAULT_LAYOUT_CONFIG.convergenceThreshold}`);
      this.config.convergenceThreshold = DEFAULT_LAYOUT_CONFIG.convergenceThreshold;
    }
  }

  /**
   * 执行力模拟主循环
   * 
   * 需求 4.3: 迭代至少50次，最多100次（可配置）
   * 需求 4.5: 如果系统能量收敛，提前终止迭代
   * 
   * @param nodes 节点数组
   * @param edges 边数组
   * @returns 优化后的节点数组
   */
  public simulate(nodes: Node3D[], edges: Edge[]): Node3D[] {
    // 边界情况：空数组或单节点
    if (nodes.length === 0) {
      return nodes;
    }
    if (nodes.length === 1) {
      return nodes;
    }

    // 初始化节点状态
    const nodeStates = this.initializeNodeStates(nodes);
    const energyHistory: number[] = [];

    // 主循环：迭代模拟
    for (let iteration = 0; iteration < this.config.iterations; iteration++) {
      // 1. 计算所有节点的合力
      const forces = this.calculateAllForces(nodeStates, edges);

      // 2. 应用力到节点，更新位置
      this.applyForces(nodeStates, forces);

      // 3. 计算系统能量
      const energy = this.calculateEnergy(nodeStates, edges);
      energyHistory.push(energy);

      // 4. 检查收敛（需求 4.5）
      if (this.hasConverged(energyHistory)) {
        console.log(`Force simulation converged after ${iteration + 1} iterations`);
        break;
      }
    }

    // 返回更新后的节点
    return nodeStates.map(state => state.node);
  }

  /**
   * 初始化节点状态
   * 为每个节点创建速度、加速度和质量属性
   * 
   * @param nodes 节点数组
   * @returns 节点状态数组
   */
  private initializeNodeStates(nodes: Node3D[]): NodeState[] {
    return nodes.map(node => ({
      node: { ...node }, // 复制节点以避免修改原始数据
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      mass: 1.0 // 所有节点质量相同
    }));
  }

  /**
   * 计算所有节点的合力
   * 
   * @param nodeStates 节点状态数组
   * @param edges 边数组
   * @returns 每个节点的合力映射
   */
  private calculateAllForces(
    nodeStates: NodeState[],
    edges: Edge[]
  ): Map<string, Vector3D> {
    const forces = new Map<string, Vector3D>();

    // 初始化所有节点的力为零
    for (const state of nodeStates) {
      forces.set(state.node.id, { x: 0, y: 0, z: 0 });
    }

    // 计算排斥力（所有节点对之间）
    // 需求 4.1: 实现库仑排斥力
    for (let i = 0; i < nodeStates.length; i++) {
      for (let j = i + 1; j < nodeStates.length; j++) {
        const force = this.calculateRepulsionForce(
          nodeStates[i].node,
          nodeStates[j].node
        );

        // 将力添加到两个节点（作用力和反作用力）
        this.addForce(forces, nodeStates[i].node.id, force);
        this.addForce(forces, nodeStates[j].node.id, this.negateVector(force));
      }
    }

    // 计算弹簧力（有边连接的节点对）
    // 需求 4.2: 实现胡克弹簧力
    for (const edge of edges) {
      const sourceState = nodeStates.find(s => s.node.id === edge.source);
      const targetState = nodeStates.find(s => s.node.id === edge.target);

      if (sourceState && targetState) {
        const force = this.calculateSpringForce(
          sourceState.node,
          targetState.node,
          this.config.springLength
        );

        // 将力添加到两个节点
        this.addForce(forces, sourceState.node.id, force);
        this.addForce(forces, targetState.node.id, this.negateVector(force));
      }
    }

    return forces;
  }

  /**
   * 计算库仑排斥力
   * 
   * 需求 4.1: 实现库仑排斥力，使无连接的节点相互推开
   * 
   * 公式: F = k / distance² * direction
   * 其中 k = repulsionStrength
   * 
   * @param node1 第一个节点
   * @param node2 第二个节点
   * @returns 从node1指向node2的排斥力向量（node1受到的力）
   */
  public calculateRepulsionForce(node1: Node3D, node2: Node3D): Vector3D {
    // 计算两节点之间的向量
    const dx = node2.x3d - node1.x3d;
    const dy = node2.y3d - node1.y3d;
    const dz = node2.z3d - node1.z3d;

    // 计算距离
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // 避免除以零或距离过小
    if (distance < 0.1) {
      return { x: 0, y: 0, z: 0 };
    }

    // 计算力的大小：F = k / distance²
    const forceMagnitude = this.config.repulsionStrength / (distance * distance);

    // 归一化方向向量
    const dirX = dx / distance;
    const dirY = dy / distance;
    const dirZ = dz / distance;

    // 返回排斥力（负号表示推开，node1受到的力指向远离node2的方向）
    return {
      x: -forceMagnitude * dirX,
      y: -forceMagnitude * dirY,
      z: -forceMagnitude * dirZ
    };
  }

  /**
   * 计算胡克弹簧力
   * 
   * 需求 4.2: 实现胡克弹簧力，使有连接的节点保持适当距离
   * 
   * 公式: F = k * (distance - restLength) * direction
   * 其中 k = springStrength (从配置计算)
   * 
   * @param node1 第一个节点
   * @param node2 第二个节点
   * @param springLength 弹簧的静止长度
   * @returns 从node1指向node2的弹簧力向量（node1受到的力）
   */
  public calculateSpringForce(
    node1: Node3D,
    node2: Node3D,
    springLength: number
  ): Vector3D {
    // 计算两节点之间的向量
    const dx = node2.x3d - node1.x3d;
    const dy = node2.y3d - node1.y3d;
    const dz = node2.z3d - node1.z3d;

    // 计算距离
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // 避免除以零
    if (distance < 0.1) {
      return { x: 0, y: 0, z: 0 };
    }

    // 计算位移（实际距离 - 静止长度）
    const displacement = distance - springLength;

    // 弹簧强度系数（可调整）
    const springStrength = 0.1;

    // 计算力的大小：F = k * displacement
    const forceMagnitude = springStrength * displacement;

    // 归一化方向向量
    const dirX = dx / distance;
    const dirY = dy / distance;
    const dirZ = dz / distance;

    // 返回弹簧力（正位移产生拉力，负位移产生推力）
    return {
      x: forceMagnitude * dirX,
      y: forceMagnitude * dirY,
      z: forceMagnitude * dirZ
    };
  }

  /**
   * 应用力到节点，更新速度和位置
   * 
   * 需求 4.4: 在每次迭代后应用阻尼系数
   * 
   * @param nodeStates 节点状态数组
   * @param forces 每个节点的合力映射
   */
  public applyForces(
    nodeStates: NodeState[],
    forces: Map<string, Vector3D>
  ): void {
    for (const state of nodeStates) {
      const force = forces.get(state.node.id) || { x: 0, y: 0, z: 0 };

      // 根据牛顿第二定律计算加速度: a = F / m
      state.acceleration = {
        x: force.x / state.mass,
        y: force.y / state.mass,
        z: force.z / state.mass
      };

      // 更新速度: v = v + a
      state.velocity.x += state.acceleration.x;
      state.velocity.y += state.acceleration.y;
      state.velocity.z += state.acceleration.z;

      // 应用阻尼系数（需求 4.4）
      state.velocity.x *= this.config.damping;
      state.velocity.y *= this.config.damping;
      state.velocity.z *= this.config.damping;

      // 更新位置: p = p + v
      state.node.x3d += state.velocity.x;
      state.node.y3d += state.velocity.y;
      state.node.z3d += state.velocity.z;
    }
  }

  /**
   * 计算系统总能量
   * 
   * 能量 = 动能 + 势能
   * 用于判断系统是否收敛
   * 
   * @param nodeStates 节点状态数组
   * @param edges 边数组
   * @returns 系统总能量
   */
  public calculateEnergy(nodeStates: NodeState[], edges: Edge[]): number {
    let kineticEnergy = 0;
    let potentialEnergy = 0;

    // 计算动能: KE = 0.5 * m * v²
    for (const state of nodeStates) {
      const velocitySquared =
        state.velocity.x * state.velocity.x +
        state.velocity.y * state.velocity.y +
        state.velocity.z * state.velocity.z;
      kineticEnergy += 0.5 * state.mass * velocitySquared;
    }

    // 计算势能（排斥势能 + 弹簧势能）
    // 排斥势能: PE_repulsion = k / distance
    for (let i = 0; i < nodeStates.length; i++) {
      for (let j = i + 1; j < nodeStates.length; j++) {
        const distance = this.calculateDistance(
          nodeStates[i].node,
          nodeStates[j].node
        );
        if (distance > 0.1) {
          potentialEnergy += this.config.repulsionStrength / distance;
        }
      }
    }

    // 弹簧势能: PE_spring = 0.5 * k * (distance - restLength)²
    const springStrength = 0.1;
    for (const edge of edges) {
      const sourceState = nodeStates.find(s => s.node.id === edge.source);
      const targetState = nodeStates.find(s => s.node.id === edge.target);

      if (sourceState && targetState) {
        const distance = this.calculateDistance(
          sourceState.node,
          targetState.node
        );
        const displacement = distance - this.config.springLength;
        potentialEnergy += 0.5 * springStrength * displacement * displacement;
      }
    }

    return kineticEnergy + potentialEnergy;
  }

  /**
   * 检查系统是否收敛
   * 
   * 需求 4.5: 如果系统能量收敛（变化小于阈值），提前终止迭代
   * 
   * @param energyHistory 能量历史记录
   * @returns 是否已收敛
   */
  public hasConverged(energyHistory: number[]): boolean {
    // 需要至少10次迭代才能判断收敛
    if (energyHistory.length < 10) {
      return false;
    }

    // 计算最近5次迭代的能量变化
    const recentHistory = energyHistory.slice(-5);
    const avgEnergy = recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length;

    // 如果平均能量接近零，认为已收敛
    if (avgEnergy < this.config.convergenceThreshold) {
      return true;
    }

    // 计算能量变化率
    const energyChange = Math.abs(recentHistory[4] - recentHistory[0]);
    const relativeChange = energyChange / (avgEnergy + 0.001); // 避免除以零

    // 如果相对变化小于阈值，认为已收敛
    return relativeChange < this.config.convergenceThreshold;
  }

  // =====================================================
  // 辅助方法
  // =====================================================

  /**
   * 将力添加到节点
   * 
   * @param forces 力映射
   * @param nodeId 节点ID
   * @param force 要添加的力
   */
  private addForce(
    forces: Map<string, Vector3D>,
    nodeId: string,
    force: Vector3D
  ): void {
    const currentForce = forces.get(nodeId) || { x: 0, y: 0, z: 0 };
    forces.set(nodeId, {
      x: currentForce.x + force.x,
      y: currentForce.y + force.y,
      z: currentForce.z + force.z
    });
  }

  /**
   * 取向量的相反方向
   * 
   * @param vector 原向量
   * @returns 相反方向的向量
   */
  private negateVector(vector: Vector3D): Vector3D {
    return {
      x: -vector.x,
      y: -vector.y,
      z: -vector.z
    };
  }

  /**
   * 计算两个节点之间的欧几里得距离
   * 
   * @param node1 第一个节点
   * @param node2 第二个节点
   * @returns 距离
   */
  private calculateDistance(node1: Node3D, node2: Node3D): number {
    const dx = node2.x3d - node1.x3d;
    const dy = node2.y3d - node1.y3d;
    const dz = node2.z3d - node1.z3d;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 获取当前配置
   * 
   * @returns 力模拟配置
   */
  public getConfig(): ForceConfig {
    return { ...this.config };
  }
}
