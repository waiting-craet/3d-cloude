/**
 * LayoutEngine - 核心布局引擎
 * 
 * 协调整个2D到3D图谱转换流程，是布局系统的核心组件
 * 
 * 主要功能：
 * - 执行完整的2D到3D转换流程
 * - 自动选择和应用最合适的布局策略
 * - 检测和解决节点重叠
 * - 优化空间分布
 * - 验证布局质量
 * - 支持增量更新
 * - 持久化布局数据
 * 
 * 验证需求: 1.1-12.6
 */

import {
  Node2D,
  Node3D,
  Edge,
  LayoutConfig,
  LayoutStrategy,
  LayoutQualityMetrics,
  ValidationResult,
  DEFAULT_LAYOUT_CONFIG,
  OPTIMIZED_LAYOUT_CONFIGS,
  isValidCoordinate,
  ProgressCallback
} from './types';

import { GraphAnalyzer } from './GraphAnalyzer';
import { CoordinateConverter } from './CoordinateConverter';
import { ForceSimulator } from './ForceSimulator';
import { CollisionDetector } from './CollisionDetector';
import { SpatialOptimizer } from './SpatialOptimizer';

// 导入所有布局策略
import { HierarchicalStrategy } from './strategies/HierarchicalStrategy';
import { RadialStrategy } from './strategies/RadialStrategy';
import { ForceDirectedStrategy } from './strategies/ForceDirectedStrategy';
import { GridStrategy } from './strategies/GridStrategy';
import { SphericalStrategy } from './strategies/SphericalStrategy';
import type { ILayoutStrategy } from './strategies/ILayoutStrategy';
import { PerformanceMonitor, PerformanceMetrics } from './PerformanceMonitor';

/**
 * 布局错误类
 */
export class LayoutError extends Error {
  constructor(
    message: string,
    public details: string[] = [],
    public cause?: Error
  ) {
    super(message);
    this.name = 'LayoutError';
  }
}

/**
 * 布局引擎类
 * 
 * 这是整个布局系统的核心，负责协调所有组件完成2D到3D的转换
 */
export class LayoutEngine {
  private config: LayoutConfig;
  private analyzer: GraphAnalyzer;
  private converter: CoordinateConverter;
  private simulator: ForceSimulator;
  private detector: CollisionDetector;
  private optimizer: SpatialOptimizer;
  private strategies: Map<LayoutStrategy, ILayoutStrategy>;

  /**
   * 创建布局引擎实例
   * 
   * @param config 布局配置（可选，使用默认配置）
   * 
   * 验证需求: 9.7
   */
  constructor(config?: Partial<LayoutConfig>) {
    // 合并配置并验证
    this.config = this.validateConfig(config);

    // 初始化所有组件
    this.analyzer = new GraphAnalyzer();
    this.converter = new CoordinateConverter(this.config);
    this.simulator = new ForceSimulator({
      iterations: this.config.iterations,
      springLength: this.config.springLength,
      repulsionStrength: this.config.repulsionStrength,
      damping: this.config.damping,
      convergenceThreshold: this.config.convergenceThreshold
    });
    this.detector = new CollisionDetector(this.config.minNodeDistance);
    this.optimizer = new SpatialOptimizer(this.config);

    // 初始化所有布局策略
    this.strategies = new Map();
    this.strategies.set(LayoutStrategy.HIERARCHICAL, new HierarchicalStrategy());
    this.strategies.set(LayoutStrategy.RADIAL, new RadialStrategy());
    this.strategies.set(LayoutStrategy.FORCE_DIRECTED, new ForceDirectedStrategy());
    this.strategies.set(LayoutStrategy.GRID, new GridStrategy());
    this.strategies.set(LayoutStrategy.SPHERICAL, new SphericalStrategy());

    console.log('LayoutEngine initialized with config:', this.config);
  }

  /**
   * 验证并修正配置参数
   * 
   * 需求 9.7: 无效配置使用默认值并记录警告
   * 
   * @param config 用户提供的配置
   * @returns 验证后的完整配置
   */
  private validateConfig(config?: Partial<LayoutConfig>): LayoutConfig {
    const validated = { ...DEFAULT_LAYOUT_CONFIG, ...config };

    // 验证每个参数
    if (validated.heightVariation < 0 || validated.heightVariation > 50) {
      console.warn(`Invalid heightVariation: ${validated.heightVariation}, using default: ${DEFAULT_LAYOUT_CONFIG.heightVariation}`);
      validated.heightVariation = DEFAULT_LAYOUT_CONFIG.heightVariation;
    }

    if (validated.minNodeDistance < 5 || validated.minNodeDistance > 100) {
      console.warn(`Invalid minNodeDistance: ${validated.minNodeDistance}, using default: ${DEFAULT_LAYOUT_CONFIG.minNodeDistance}`);
      validated.minNodeDistance = DEFAULT_LAYOUT_CONFIG.minNodeDistance;
    }

    if (validated.iterations < 50 || validated.iterations > 300) {
      console.warn(`Invalid iterations: ${validated.iterations}, using default: ${DEFAULT_LAYOUT_CONFIG.iterations}`);
      validated.iterations = DEFAULT_LAYOUT_CONFIG.iterations;
    }

    if (validated.springLength < 5 || validated.springLength > 200) {
      console.warn(`Invalid springLength: ${validated.springLength}, using default: ${DEFAULT_LAYOUT_CONFIG.springLength}`);
      validated.springLength = DEFAULT_LAYOUT_CONFIG.springLength;
    }

    if (validated.repulsionStrength < 100 || validated.repulsionStrength > 10000) {
      console.warn(`Invalid repulsionStrength: ${validated.repulsionStrength}, using default: ${DEFAULT_LAYOUT_CONFIG.repulsionStrength}`);
      validated.repulsionStrength = DEFAULT_LAYOUT_CONFIG.repulsionStrength;
    }

    if (validated.damping < 0 || validated.damping > 1) {
      console.warn(`Invalid damping: ${validated.damping}, using default: ${DEFAULT_LAYOUT_CONFIG.damping}`);
      validated.damping = DEFAULT_LAYOUT_CONFIG.damping;
    }

    if (validated.convergenceThreshold < 0.001 || validated.convergenceThreshold > 0.1) {
      console.warn(`Invalid convergenceThreshold: ${validated.convergenceThreshold}, using default: ${DEFAULT_LAYOUT_CONFIG.convergenceThreshold}`);
      validated.convergenceThreshold = DEFAULT_LAYOUT_CONFIG.convergenceThreshold;
    }

    if (validated.batchSize < 1 || validated.batchSize > 100) {
      console.warn(`Invalid batchSize: ${validated.batchSize}, using default: ${DEFAULT_LAYOUT_CONFIG.batchSize}`);
      validated.batchSize = DEFAULT_LAYOUT_CONFIG.batchSize;
    }

    if (validated.batchDelay < 0 || validated.batchDelay > 1000) {
      console.warn(`Invalid batchDelay: ${validated.batchDelay}, using default: ${DEFAULT_LAYOUT_CONFIG.batchDelay}`);
      validated.batchDelay = DEFAULT_LAYOUT_CONFIG.batchDelay;
    }

    return validated;
  }

  /**
   * 根据节点数量选择最优配置
   * 
   * @param nodeCount 节点数量
   * @returns 优化的配置
   */
  private selectOptimalConfig(nodeCount: number): LayoutConfig {
    if (nodeCount < 20) {
      console.log(`Using 'small' config for ${nodeCount} nodes`);
      return { ...OPTIMIZED_LAYOUT_CONFIGS.small };
    } else if (nodeCount <= 50) {
      console.log(`Using 'medium' config for ${nodeCount} nodes`);
      return { ...OPTIMIZED_LAYOUT_CONFIGS.medium };
    } else if (nodeCount <= 100) {
      console.log(`Using 'large' config for ${nodeCount} nodes`);
      return { ...OPTIMIZED_LAYOUT_CONFIGS.large };
    } else {
      console.log(`Using 'xlarge' config for ${nodeCount} nodes`);
      return { ...OPTIMIZED_LAYOUT_CONFIGS.xlarge };
    }
  }

  /**
   * 主要转换方法：将2D图谱转换为3D图谱
   * 
   * 完整流程：
   * 1. 验证输入
   * 2. 处理边界情况（单节点、双节点等）
   * 3. 分析图谱特征
   * 4. 选择布局策略
   * 5. 执行初始坐标转换
   * 6. 应用布局策略
   * 7. 检测并解决碰撞
   * 8. 优化空间分布
   * 9. 验证布局质量
   * 
   * @param nodes 2D节点列表
   * @param edges 边列表
   * @param strategy 指定的布局策略（可选，不指定则自动选择）
   * @param onProgress 进度回调函数（可选）
   * @returns 3D节点列表和性能指标
   * 
   * 验证需求: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.1, 10.2, 10.3, 10.4, 10.6, 10.7
   */
  async convert3D(
    nodes: Node2D[],
    edges: Edge[],
    strategy?: LayoutStrategy,
    onProgress?: ProgressCallback
  ): Promise<{ nodes: Node3D[]; performanceMetrics: PerformanceMetrics }> {
    // Initialize performance monitoring
    const perfMonitor = new PerformanceMonitor();
    perfMonitor.start();
    perfMonitor.checkpoint('start');

    // Report initial progress
    onProgress?.(0, 'Starting layout conversion...');

    try {
      // 步骤0: 根据节点数量选择最优配置（如果用户没有提供自定义配置）
      if (nodes.length > 0 && !this.config.iterations) {
        const optimalConfig = this.selectOptimalConfig(nodes.length);
        this.updateConfig(optimalConfig);
        console.log('Applied optimal config for node count:', nodes.length);
      }

      // 步骤1: 验证输入
      onProgress?.(5, 'Validating input data...');
      const validation = this.validateInput(nodes, edges);
      if (!validation.isValid) {
        console.warn('Input validation warnings:', validation.warnings);
        // 继续执行，因为我们已经自动修复了问题
      }

      // 步骤2: 处理边界情况
      onProgress?.(10, 'Checking boundary cases...');
      const boundaryResult = this.handleBoundaryCases(nodes, edges);
      if (boundaryResult) {
        perfMonitor.checkpoint('analysis_complete');
        perfMonitor.checkpoint('conversion_complete');
        perfMonitor.checkpoint('simulation_complete');
        perfMonitor.checkpoint('optimization_complete');
        perfMonitor.checkpoint('persistence_complete');
        
        const performanceMetrics = perfMonitor.complete(
          nodes.length,
          edges.length,
          strategy || 'boundary_case'
        );
        
        onProgress?.(100, 'Conversion complete');
        return { nodes: boundaryResult, performanceMetrics };
      }

      // 步骤3: 分析图谱特征
      onProgress?.(15, 'Analyzing graph structure...');
      const metrics = this.analyzer.analyze(nodes, edges);
      console.log('Graph metrics:', metrics);
      perfMonitor.checkpoint('analysis_complete');

      // 步骤3.5: 应用自适应参数调整（针对大规模图谱）
      const adaptiveConfig = this.applyAdaptiveParameters(nodes.length, this.config);
      if (adaptiveConfig !== this.config) {
        console.log('Applied adaptive parameters for large graph:', {
          nodeCount: nodes.length,
          iterations: adaptiveConfig.iterations,
          batchSize: adaptiveConfig.batchSize
        });
        this.updateConfig(adaptiveConfig);
      }

      // 步骤4: 选择布局策略
      onProgress?.(20, 'Selecting layout strategy...');
      const selectedStrategy = strategy || this.analyzer.recommendStrategy(metrics);
      console.log(`Using layout strategy: ${selectedStrategy}`);

      // 步骤5: 执行初始坐标转换（2D -> 3D）
      onProgress?.(30, 'Converting 2D coordinates to 3D...');
      let nodes3D = this.converter.convert2Dto3D(nodes, {
        heightVariation: this.config.heightVariation,
        preserveTopology: true,
        scaleFactor: 1.0
      });
      perfMonitor.checkpoint('conversion_complete');

      // 步骤6: 应用布局策略
      onProgress?.(40, `Applying ${selectedStrategy} layout strategy...`);
      try {
        nodes3D = await this.applyStrategy(nodes3D, edges, selectedStrategy);
      } catch (error) {
        console.error('Strategy application failed, falling back to grid layout', error);
        nodes3D = await this.fallbackToGridLayout(nodes);
      }
      perfMonitor.checkpoint('simulation_complete');

      // 步骤7: 检测碰撞
      onProgress?.(70, 'Detecting collisions...');
      let collisions = this.detector.detectCollisions(nodes3D);
      console.log(`Collision detection: ${collisions.collisionPairs.length} overlaps found`);

      // 步骤8: 解决碰撞并优化空间分布
      onProgress?.(80, 'Optimizing spatial distribution...');
      if (collisions.hasCollisions || nodes3D.length > 10) {
        const optimizationResult = this.optimizer.optimize(nodes3D, edges);
        nodes3D = optimizationResult.nodes;
        console.log(`Optimization completed: quality score = ${optimizationResult.finalQuality}`);
      }
      perfMonitor.checkpoint('optimization_complete');

      // 步骤9: 验证布局质量
      onProgress?.(95, 'Validating layout quality...');
      const qualityMetrics = this.calculateQualityMetrics(nodes3D, edges);
      console.log('Layout quality metrics:', qualityMetrics);

      if (qualityMetrics.qualityScore < 30) {
        console.warn('Layout quality is poor, consider adjusting parameters or using different strategy');
      }

      perfMonitor.checkpoint('persistence_complete');
      
      // Complete performance monitoring
      const performanceMetrics = perfMonitor.complete(
        nodes.length,
        edges.length,
        selectedStrategy
      );

      onProgress?.(100, 'Conversion complete');
      return { nodes: nodes3D, performanceMetrics };

    } catch (error) {
      console.error('Fatal error in convert3D', error);
      // 最后的回退：简单的网格布局
      onProgress?.(90, 'Error occurred, using fallback layout...');
      const fallbackNodes = await this.fallbackToGridLayout(nodes);
      
      perfMonitor.checkpoint('analysis_complete');
      perfMonitor.checkpoint('conversion_complete');
      perfMonitor.checkpoint('simulation_complete');
      perfMonitor.checkpoint('optimization_complete');
      perfMonitor.checkpoint('persistence_complete');
      
      const performanceMetrics = perfMonitor.complete(
        nodes.length,
        edges.length,
        'fallback_grid'
      );
      
      onProgress?.(100, 'Fallback layout complete');
      return { nodes: fallbackNodes, performanceMetrics };
    }
  }

  /**
   * 应用自适应参数调整
   * 
   * 针对大规模图谱优化参数以提高性能
   * 
   * 需求 7.5, 7.6: 优化大规模图谱处理
   * 
   * @param nodeCount 节点数量
   * @param config 当前配置
   * @returns 调整后的配置
   */
  private applyAdaptiveParameters(nodeCount: number, config: LayoutConfig): LayoutConfig {
    // 对于小规模图谱，使用默认配置
    if (nodeCount <= 100) {
      return config;
    }

    // 对于大规模图谱，应用优化
    const adaptiveConfig = { ...config };

    // 1. 减少迭代次数（避免过长的计算时间）
    // 大规模图谱：最多150次迭代，太少会导致无法收敛展开
    adaptiveConfig.iterations = Math.min(config.iterations, 150);

    // 2. 增加批处理大小（提高数据库操作效率）
    // 大规模图谱：每批25个节点
    adaptiveConfig.batchSize = 25;

    // 3. 调整排斥力强度（大规模图谱需要更强的排斥力）
    if (nodeCount > 200) {
      adaptiveConfig.repulsionStrength = config.repulsionStrength * 1.5; // 从 1.2 增强至 1.5
    }

    // 4. 增加最小节点间距（避免过度拥挤）
    if (nodeCount > 150) {
      adaptiveConfig.minNodeDistance = config.minNodeDistance * 1.5; // 从 1.2 增强至 1.5
    }

    console.log(`Adaptive parameters applied for ${nodeCount} nodes:`, {
      iterations: `${config.iterations} -> ${adaptiveConfig.iterations}`,
      batchSize: `${config.batchSize} -> ${adaptiveConfig.batchSize}`,
      repulsionStrength: `${config.repulsionStrength} -> ${adaptiveConfig.repulsionStrength}`,
      minNodeDistance: `${config.minNodeDistance} -> ${adaptiveConfig.minNodeDistance}`
    });

    return adaptiveConfig;
  }

  /**
   * 验证输入数据
   * 
   * @param nodes 节点列表
   * @param edges 边列表
   * @returns 验证结果
   */
  private validateInput(nodes: Node2D[], edges: Edge[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证节点数组
    if (!nodes || nodes.length === 0) {
      errors.push('Node array is empty or undefined');
      return { isValid: false, errors, warnings };
    }

    // 验证每个节点
    for (const node of nodes) {
      if (!node.id) {
        errors.push(`Node missing id: ${JSON.stringify(node)}`);
      }
      if (!isValidCoordinate(node.x2d)) {
        warnings.push(`Invalid x2d for node ${node.id}: ${node.x2d}, will be set to 0`);
        node.x2d = 0;
      }
      if (!isValidCoordinate(node.y2d)) {
        warnings.push(`Invalid y2d for node ${node.id}: ${node.y2d}, will be set to 0`);
        node.y2d = 0;
      }
    }

    // 验证边
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        warnings.push(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        warnings.push(`Edge references non-existent target node: ${edge.target}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 处理边界情况
   * 
   * 需求 10.1: 单节点放在原点
   * 需求 10.2: 双节点沿X轴对称放置
   * 需求 10.7: 记录边界情况处理日志
   * 
   * @param nodes 节点列表
   * @param edges 边列表
   * @returns 如果是边界情况，返回处理后的节点；否则返回null
   */
  private handleBoundaryCases(nodes: Node2D[], edges: Edge[]): Node3D[] | null {
    // 单节点情况
    if (nodes.length === 1) {
      console.log('Boundary case: single node, placing at origin');
      return [{
        ...nodes[0],
        x3d: 0,
        y3d: 0,
        z3d: 0
      }];
    }

    // 双节点情况
    if (nodes.length === 2) {
      console.log('Boundary case: two nodes, placing symmetrically on X axis');
      const distance = this.config.minNodeDistance;
      return [
        {
          ...nodes[0],
          x3d: -distance / 2,
          y3d: 0,
          z3d: 0
        },
        {
          ...nodes[1],
          x3d: distance / 2,
          y3d: 0,
          z3d: 0
        }
      ];
    }

    // 无边情况
    if (edges.length === 0) {
      console.log('Boundary case: no edges, will use grid layout');
      // 不在这里处理，让策略选择器选择网格布局
    }

    // 完全连接图
    const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
    if (edges.length >= maxPossibleEdges * 0.95) {
      console.log('Boundary case: nearly complete graph, will use spherical layout');
      // 不在这里处理，让策略选择器选择球形布局
    }

    return null;
  }

  /**
   * 应用指定的布局策略
   * 
   * @param nodes 3D节点列表
   * @param edges 边列表
   * @param strategyName 策略名称
   * @returns 应用策略后的节点列表
   */
  private async applyStrategy(
    nodes: Node3D[],
    edges: Edge[],
    strategyName: LayoutStrategy
  ): Promise<Node3D[]> {
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      throw new LayoutError(`Unknown strategy: ${strategyName}`);
    }

    return strategy.apply(nodes, edges, this.config);
  }

  /**
   * 回退到简单的网格布局
   * 
   * 需求 10.6: 转换过程中发生错误时回退到简单的网格布局
   * 
   * @param nodes 2D节点列表
   * @returns 网格布局的3D节点列表
   */
  private async fallbackToGridLayout(nodes: Node2D[]): Promise<Node3D[]> {
    console.warn('Using fallback grid layout');
    
    const gridSize = Math.ceil(Math.sqrt(nodes.length));
    const spacing = this.config.minNodeDistance * 2;

    return nodes.map((node, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      return {
        ...node,
        x3d: col * spacing - (gridSize * spacing) / 2,
        y3d: 0,
        z3d: row * spacing - (gridSize * spacing) / 2
      };
    });
  }

  /**
   * 计算布局质量指标
   * 
   * 需求 8.1: 计算布局质量指标
   * 需求 8.2: 验证节点间距分布
   * 需求 8.3: 验证边长度分布
   * 需求 8.4: 验证空间均匀性
   * 需求 8.6: 提供布局质量报告
   * 
   * @param nodes 3D节点列表
   * @param edges 边列表
   * @returns 质量指标
   */
  calculateQualityMetrics(nodes: Node3D[], edges: Edge[] = []): LayoutQualityMetrics {
    if (nodes.length === 0) {
      return {
        nodeDistanceStdDev: 0,
        edgeLengthStdDev: 0,
        spatialUniformity: 1,
        spaceUtilization: 0,
        overlapCount: 0,
        qualityScore: 100
      };
    }

    // 1. 计算节点间距统计
    const distances: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        distances.push(this.detector.calculateDistance(nodes[i], nodes[j]));
      }
    }

    const avgDistance = distances.length > 0 
      ? distances.reduce((a, b) => a + b, 0) / distances.length 
      : 0;
    const nodeDistanceStdDev = this.calculateStdDev(distances, avgDistance);

    // 2. 计算边长度统计
    const edgeLengths: number[] = [];
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target) {
        edgeLengths.push(this.detector.calculateDistance(source, target));
      }
    }

    const avgEdgeLength = edgeLengths.length > 0
      ? edgeLengths.reduce((a, b) => a + b, 0) / edgeLengths.length
      : 0;
    const edgeLengthStdDev = this.calculateStdDev(edgeLengths, avgEdgeLength);

    // 3. 计算空间均匀性
    const spatialUniformity = this.calculateSpatialUniformity(nodes);

    // 4. 计算空间利用率
    const spaceUtilization = this.optimizer.calculateSpaceUtilization(nodes);

    // 5. 检测重叠
    const collisions = this.detector.detectCollisions(nodes);
    const overlapCount = collisions.collisionPairs.length;

    // 6. 计算综合质量分数
    let qualityScore = 100;

    // 惩罚重叠
    qualityScore -= Math.min(overlapCount * 10, 50);

    // 惩罚分布不均（节点间距）
    const cvDistance = avgDistance > 0 ? nodeDistanceStdDev / avgDistance : 0;
    if (cvDistance > 0.5) {
      qualityScore -= Math.min((cvDistance - 0.5) * 50, 20);
    }

    // 惩罚边长度分布不均
    const cvEdgeLength = avgEdgeLength > 0 ? edgeLengthStdDev / avgEdgeLength : 0;
    if (cvEdgeLength > 0.6) {
      qualityScore -= Math.min((cvEdgeLength - 0.6) * 30, 15);
    }

    // 惩罚空间利用率不佳
    if (spaceUtilization < 0.6 || spaceUtilization > 0.85) {
      qualityScore -= 15;
    }

    qualityScore = Math.max(0, Math.min(100, qualityScore));

    return {
      nodeDistanceStdDev,
      edgeLengthStdDev,
      spatialUniformity,
      spaceUtilization,
      overlapCount,
      qualityScore
    };
  }

  /**
   * 计算标准差
   * 
   * @param values 数值数组
   * @param mean 平均值（可选）
   * @returns 标准差
   */
  private calculateStdDev(values: number[], mean?: number): number {
    if (values.length === 0) return 0;

    const avg = mean ?? values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * 计算空间均匀性
   * 
   * 使用空间划分方法，将空间分为网格，计算每个网格中的节点数量方差
   * 
   * @param nodes 节点列表
   * @returns 空间均匀性（0-1，1表示完全均匀）
   */
  private calculateSpatialUniformity(nodes: Node3D[]): number {
    if (nodes.length < 3) return 1;

    const gridSize = 50;
    const grid = new Map<string, number>();

    for (const node of nodes) {
      const x = Math.floor(node.x3d / gridSize);
      const y = Math.floor(node.y3d / gridSize);
      const z = Math.floor(node.z3d / gridSize);
      const key = `${x},${y},${z}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }

    const counts = Array.from(grid.values());
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / counts.length;

    // 归一化到0-1，方差越小越均匀
    return 1 / (1 + variance);
  }

  /**
   * 获取当前配置
   * 
   * @returns 布局配置
   */
  getConfig(): LayoutConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   * 
   * @param config 新的配置（部分或完整）
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = this.validateConfig({ ...this.config, ...config });
    
    // 更新所有组件的配置
    this.converter = new CoordinateConverter(this.config);
    this.simulator = new ForceSimulator({
      iterations: this.config.iterations,
      springLength: this.config.springLength,
      repulsionStrength: this.config.repulsionStrength,
      damping: this.config.damping,
      convergenceThreshold: this.config.convergenceThreshold
    });
    this.detector.setMinDistance(this.config.minNodeDistance);
    this.optimizer.updateConfig(this.config);
  }

  /**
   * 增量更新布局
   * 
   * 当添加或删除节点时，增量更新布局而不是完全重新计算
   * 
   * 需求 11.1: 添加新节点时仅调整受影响节点的位置
   * 需求 11.2: 删除节点时重新平衡周围节点的位置
   * 需求 11.3: 保持现有节点位置的稳定性（移动距离小于20%）
   * 需求 11.4: 使用局部力模拟优化新增节点周围的布局
   * 需求 11.5: 如果增量更新导致布局质量下降超过30%，建议完全重新布局
   * 需求 11.6: 增量更新时间小于1秒
   * 
   * @param existingNodes 现有的3D节点列表
   * @param newNodes 新增的2D节点列表
   * @param deletedNodeIds 删除的节点ID列表
   * @returns 更新后的节点列表和质量变化信息
   */
  async incrementalUpdate(
    existingNodes: Node3D[],
    newNodes: Node2D[] = [],
    deletedNodeIds: string[] = []
  ): Promise<{
    nodes: Node3D[];
    qualityChange: number;
    shouldReLayout: boolean;
  }> {
    const startTime = Date.now();

    try {
      // 计算初始质量
      const initialQuality = this.calculateQualityMetrics(existingNodes).qualityScore;

      // 步骤1: 删除节点
      let updatedNodes = existingNodes.filter(node => !deletedNodeIds.includes(node.id));

      // 步骤2: 添加新节点
      if (newNodes.length > 0) {
        // 将新节点转换为3D坐标
        const newNodes3D = this.converter.convert2Dto3D(newNodes, {
          heightVariation: this.config.heightVariation,
          preserveTopology: true,
          scaleFactor: 1.0
        });

        // 为新节点找到合适的初始位置（避免与现有节点重叠）
        const positionedNewNodes = this.positionNewNodes(updatedNodes, newNodes3D);

        // 合并节点
        updatedNodes = [...updatedNodes, ...positionedNewNodes];
      }

      // 步骤3: 局部优化
      // 只对新增节点周围的区域进行力模拟
      if (newNodes.length > 0) {
        updatedNodes = await this.localOptimization(updatedNodes, newNodes.map(n => n.id));
      }

      // 步骤4: 检测并解决碰撞
      const collisions = this.detector.detectCollisions(updatedNodes);
      if (collisions.hasCollisions) {
        updatedNodes = this.optimizer.resolveOverlaps(updatedNodes, collisions);
      }

      // 步骤5: 验证节点位置稳定性
      const movementRatios = this.calculateMovementRatios(existingNodes, updatedNodes);
      const maxMovement = Math.max(...movementRatios);
      
      if (maxMovement > 0.2) {
        console.warn(`Some nodes moved more than 20%: max movement = ${(maxMovement * 100).toFixed(1)}%`);
      }

      // 步骤6: 计算质量变化
      const finalQuality = this.calculateQualityMetrics(updatedNodes).qualityScore;
      const qualityChange = finalQuality - initialQuality;
      const relativeQualityChange = initialQuality > 0 ? Math.abs(qualityChange) / initialQuality : 0;

      // 步骤7: 判断是否需要完全重新布局
      const shouldReLayout = relativeQualityChange > 0.3;

      if (shouldReLayout) {
        console.warn(`Layout quality dropped by ${(relativeQualityChange * 100).toFixed(1)}%, recommend full re-layout`);
      }

      const duration = Date.now() - startTime;
      console.log(`Incremental update completed in ${duration}ms`);

      return {
        nodes: updatedNodes,
        qualityChange,
        shouldReLayout
      };

    } catch (error) {
      console.error('Incremental update failed', error);
      throw new LayoutError('Incremental update failed', [], error as Error);
    }
  }

  /**
   * 为新节点找到合适的初始位置
   * 
   * 策略：在现有节点的外围找到空闲空间
   * 
   * @param existingNodes 现有节点
   * @param newNodes 新节点
   * @returns 定位后的新节点
   */
  private positionNewNodes(existingNodes: Node3D[], newNodes: Node3D[]): Node3D[] {
    if (existingNodes.length === 0) {
      return newNodes;
    }

    // 计算现有节点的边界
    const bounds = this.calculateBounds(existingNodes);
    const maxRadius = Math.max(
      bounds.maxX - bounds.minX,
      bounds.maxY - bounds.minY,
      bounds.maxZ - bounds.minZ
    ) / 2;

    // 在外围圆周上放置新节点
    const radius = maxRadius + this.config.minNodeDistance * 2;
    const angleStep = (2 * Math.PI) / newNodes.length;

    return newNodes.map((node, index) => {
      const angle = index * angleStep;
      return {
        ...node,
        x3d: radius * Math.cos(angle),
        y3d: (Math.random() - 0.5) * this.config.heightVariation,
        z3d: radius * Math.sin(angle)
      };
    });
  }

  /**
   * 局部优化：只对新增节点周围的区域进行力模拟
   * 
   * @param nodes 所有节点
   * @param newNodeIds 新增节点的ID列表
   * @returns 优化后的节点
   */
  private async localOptimization(nodes: Node3D[], newNodeIds: string[]): Promise<Node3D[]> {
    // 找到新节点的邻居（距离在一定范围内的节点）
    const affectedNodeIds = new Set<string>(newNodeIds);
    const searchRadius = this.config.minNodeDistance * 5;

    for (const newNodeId of newNodeIds) {
      const newNode = nodes.find(n => n.id === newNodeId);
      if (!newNode) continue;

      for (const node of nodes) {
        if (affectedNodeIds.has(node.id)) continue;
        
        const distance = this.detector.calculateDistance(newNode, node);
        if (distance < searchRadius) {
          affectedNodeIds.add(node.id);
        }
      }
    }

    // 只对受影响的节点进行力模拟
    const affectedNodes = nodes.filter(n => affectedNodeIds.has(n.id));
    const unaffectedNodes = nodes.filter(n => !affectedNodeIds.has(n.id));

    // 使用较少的迭代次数进行局部优化
    const localSimulator = new ForceSimulator({
      iterations: Math.min(30, this.config.iterations),
      springLength: this.config.springLength,
      repulsionStrength: this.config.repulsionStrength,
      damping: this.config.damping,
      convergenceThreshold: this.config.convergenceThreshold
    });

    const optimizedAffected = localSimulator.simulate(affectedNodes, []);

    // 合并结果
    const result = [...unaffectedNodes];
    for (const node of optimizedAffected) {
      result.push(node);
    }

    return result;
  }

  /**
   * 计算节点移动比例
   * 
   * @param oldNodes 旧节点列表
   * @param newNodes 新节点列表
   * @returns 每个节点的移动比例数组
   */
  private calculateMovementRatios(oldNodes: Node3D[], newNodes: Node3D[]): number[] {
    const ratios: number[] = [];

    for (const oldNode of oldNodes) {
      const newNode = newNodes.find(n => n.id === oldNode.id);
      if (!newNode) continue;

      // 计算移动距离
      const movement = this.detector.calculateDistance(oldNode, newNode);

      // 计算原始位置的距离（从原点）
      const originalDistance = Math.sqrt(
        oldNode.x3d * oldNode.x3d +
        oldNode.y3d * oldNode.y3d +
        oldNode.z3d * oldNode.z3d
      );

      // 计算移动比例
      const ratio = originalDistance > 0 ? movement / originalDistance : 0;
      ratios.push(ratio);
    }

    return ratios;
  }

  /**
   * 计算节点的边界框
   * 
   * @param nodes 节点列表
   * @returns 边界框
   */
  private calculateBounds(nodes: Node3D[]): {
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
   * 保存布局到数据库
   * 
   * 使用批处理策略避免数据库连接池耗尽
   * 
   * 需求 12.1: 将所有节点的三维坐标保存到数据库
   * 需求 12.2: 保存x3d、y3d、z3d三个坐标字段
   * 需求 12.3: 同时保存原始的x2d、y2d坐标
   * 需求 7.5: 使用批处理策略创建节点，每批15个节点
   * 需求 7.6: 在批次之间添加100毫秒延迟
   * 
   * @param graphId 图谱ID
   * @param nodes 节点列表
   */
  async saveLayout(graphId: string, nodes: Node3D[]): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        console.log(`Saving layout for graph ${graphId}, ${nodes.length} nodes`);

        // 使用批处理避免连接池耗尽
        for (let i = 0; i < nodes.length; i += this.config.batchSize) {
          const batch = nodes.slice(i, i + this.config.batchSize);

          await this.saveBatch(graphId, batch);

          // 批次之间延迟（需求 7.6）
          if (i + this.config.batchSize < nodes.length) {
            await this.delay(this.config.batchDelay);
          }
        }

        console.log(`Successfully saved layout for graph ${graphId}`);
        return;

      } catch (error) {
        attempt++;
        console.error(`Save attempt ${attempt} failed:`, error);

        if (attempt >= maxRetries) {
          throw new LayoutError('Failed to save layout after multiple attempts', [], error as Error);
        }

        // 指数退避
        await this.delay(1000 * Math.pow(2, attempt));
      }
    }
  }

  /**
   * 保存一批节点
   * 
   * 注意：这是一个占位实现，实际的数据库操作需要在API层实现
   * 这里只是定义了接口和批处理逻辑
   * 
   * @param graphId 图谱ID
   * @param nodes 节点批次
   */
  private async saveBatch(graphId: string, nodes: Node3D[]): Promise<void> {
    // 这里应该调用数据库API
    // 例如：
    // await db.transaction(async (tx) => {
    //   for (const node of nodes) {
    //     await tx.execute(
    //       'UPDATE nodes SET x3d = ?, y3d = ?, z3d = ?, layout_version = layout_version + 1 WHERE id = ? AND graph_id = ?',
    //       [node.x3d, node.y3d, node.z3d, node.id, graphId]
    //     );
    //   }
    // });

    // 占位实现：模拟数据库操作
    await this.delay(10); // 模拟数据库延迟
    
    console.log(`Saved batch of ${nodes.length} nodes for graph ${graphId}`);
  }

  /**
   * 从数据库加载布局
   * 
   * 需求 12.4: 优先使用已保存的三维坐标
   * 需求 12.5: 如果三维坐标不存在或无效，返回null
   * 
   * @param graphId 图谱ID
   * @returns 节点列表，如果不存在返回null
   */
  async loadLayout(graphId: string): Promise<Node3D[] | null> {
    try {
      console.log(`Loading layout for graph ${graphId}`);

      // 这里应该调用数据库API
      // 例如：
      // const result = await db.query(
      //   'SELECT id, label, x2d, y2d, x3d, y3d, z3d FROM nodes WHERE graph_id = ?',
      //   [graphId]
      // );

      // 占位实现：返回null表示需要重新计算
      console.log(`No saved layout found for graph ${graphId}`);
      return null;

    } catch (error) {
      console.error(`Failed to load layout for graph ${graphId}:`, error);
      return null;
    }
  }

  /**
   * 重置布局
   * 
   * 清除现有的3D坐标并重新执行转换
   * 
   * 需求 12.6: 提供"重置布局"功能，重新执行转换算法
   * 
   * @param graphId 图谱ID
   * @param nodes 2D节点列表
   * @param edges 边列表
   * @param strategy 指定的布局策略（可选）
   * @returns 新的3D节点列表
   */
  async resetLayout(
    graphId: string,
    nodes: Node2D[],
    edges: Edge[],
    strategy?: LayoutStrategy
  ): Promise<Node3D[]> {
    console.log(`Resetting layout for graph ${graphId}`);

    // 执行完整的转换
    const { nodes: nodes3D } = await this.convert3D(nodes, edges, strategy);

    // 保存新的布局
    await this.saveLayout(graphId, nodes3D);

    return nodes3D;
  }

  /**
   * 延迟函数
   * 
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
