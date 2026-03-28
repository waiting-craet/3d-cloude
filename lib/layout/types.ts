/**
 * 2D到3D图谱转换优化 - TypeScript类型定义
 * 
 * 本文件定义了布局引擎所需的所有类型和接口
 */

// =====================================================
// 基础节点和边类型
// =====================================================

/**
 * 2D节点接口
 * 表示工作流图谱中的平面节点
 */
export interface Node2D {
  id: string;
  x2d: number;
  y2d: number;
  label: string;
}

/**
 * 3D节点接口
 * 扩展2D节点，添加3D坐标
 */
export interface Node3D extends Node2D {
  x3d: number;
  y3d: number;
  z3d: number;
}

/**
 * 边接口
 * 表示节点之间的连接关系
 */
export interface Edge {
  id: string;
  source: string;  // 源节点ID
  target: string;  // 目标节点ID
  weight?: number; // 边权重（可选）
}

/**
 * 3D向量
 * 用于力模拟计算
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 进度回调函数类型
 * 用于报告长时间运行操作的进度
 */
export type ProgressCallback = (progress: number, message: string) => void;

// =====================================================
// 布局策略枚举
// =====================================================

/**
 * 布局策略类型
 */
export enum LayoutStrategy {
  /** 层级布局 - 适用于有向无环图 */
  HIERARCHICAL = 'hierarchical',
  
  /** 径向布局 - 适用于有明显中心节点的图谱 */
  RADIAL = 'radial',
  
  /** 力导向布局 - 适用于密集图谱 */
  FORCE_DIRECTED = 'force_directed',
  
  /** 网格布局 - 适用于稀疏大图 */
  GRID = 'grid',
  
  /** 球形布局 - 适用于完全连接图 */
  SPHERICAL = 'spherical'
}

// =====================================================
// 配置接口
// =====================================================

/**
 * 布局配置接口
 * 包含所有可配置的布局参数
 */
export interface LayoutConfig {
  /** Y轴变化范围，默认8 */
  heightVariation: number;
  
  /** 最小节点间距，默认18 */
  minNodeDistance: number;
  
  /** 力模拟迭代次数，默认80 */
  iterations: number;
  
  /** 弹簧长度，默认18 */
  springLength: number;
  
  /** 排斥力强度，默认900 */
  repulsionStrength: number;
  
  /** 阻尼系数，默认0.9 */
  damping: number;
  
  /** 收敛阈值，默认0.01 */
  convergenceThreshold: number;
  
  /** 批处理大小，默认15 */
  batchSize: number;
  
  /** 批次延迟（毫秒），默认100 */
  batchDelay: number;
}

/**
 * 坐标转换选项
 */
export interface ConversionOptions {
  /** 高度变化因子 */
  heightVariation: number;
  
  /** 是否保持拓扑关系 */
  preserveTopology: boolean;
  
  /** 缩放因子 */
  scaleFactor: number;
}

/**
 * 力模拟配置
 */
export interface ForceConfig {
  /** 迭代次数 */
  iterations: number;
  
  /** 弹簧长度 */
  springLength: number;
  
  /** 排斥力强度 */
  repulsionStrength: number;
  
  /** 阻尼系数 */
  damping: number;
  
  /** 收敛阈值 */
  convergenceThreshold: number;
}

// =====================================================
// 质量指标接口
// =====================================================

/**
 * 布局质量指标
 * 用于评估转换后的布局质量
 */
export interface LayoutQualityMetrics {
  /** 节点间距标准差 */
  nodeDistanceStdDev: number;
  
  /** 边长度标准差 */
  edgeLengthStdDev: number;
  
  /** 空间均匀性（0-1） */
  spatialUniformity: number;
  
  /** 空间利用率（0.6-0.85为理想范围） */
  spaceUtilization: number;
  
  /** 重叠节点数 */
  overlapCount: number;
  
  /** 综合质量分数（0-100） */
  qualityScore: number;
}

/**
 * 图谱分析指标
 */
export interface GraphMetrics {
  /** 节点数量 */
  nodeCount: number;
  
  /** 边数量 */
  edgeCount: number;
  
  /** 图谱密度（0-1） */
  density: number;
  
  /** 是否为有向无环图 */
  isDAG: boolean;
  
  /** 是否有中心节点 */
  hasCentralNode: boolean;
  
  /** 中心节点的度数 */
  centralNodeDegree: number;
  
  /** 平均度数 */
  averageDegree: number;
  
  /** 最大度数 */
  maxDegree: number;
}

// =====================================================
// 碰撞检测接口
// =====================================================

/**
 * 碰撞检测报告
 */
export interface CollisionReport {
  /** 是否存在碰撞 */
  hasCollisions: boolean;
  
  /** 碰撞节点对列表 */
  collisionPairs: Array<[string, string]>;
  
  /** 最小距离 */
  minDistance: number;
  
  /** 平均距离 */
  averageDistance: number;
}

// =====================================================
// 优化结果接口
// =====================================================

/**
 * 空间优化结果
 */
export interface OptimizationResult {
  /** 优化后的节点 */
  nodes: Node3D[];
  
  /** 使用的迭代次数 */
  iterationsUsed: number;
  
  /** 是否解决了重叠 */
  overlapResolved: boolean;
  
  /** 最终质量分数 */
  finalQuality: number;
}

// =====================================================
// API请求/响应接口
// =====================================================

/**
 * 转换为3D请求
 */
export interface ConvertTo3DRequest {
  /** 图谱ID */
  graphId: string;
  
  /** 布局策略（可选） */
  strategy?: LayoutStrategy;
  
  /** 配置参数（可选） */
  config?: Partial<LayoutConfig>;
  
  /** 是否强制重新计算 */
  forceRecalculate?: boolean;
}

/**
 * 转换为3D响应
 */
export interface ConvertTo3DResponse {
  /** 是否成功 */
  success: boolean;
  
  /** 转换后的节点 */
  nodes: Node3D[];
  
  /** 质量指标 */
  metrics: LayoutQualityMetrics;
  
  /** 使用的策略 */
  strategy: LayoutStrategy;
  
  /** 处理时间（毫秒） */
  processingTime: number;
}

/**
 * 增量更新请求
 */
export interface IncrementalUpdateRequest {
  /** 图谱ID */
  graphId: string;
  
  /** 新增节点（可选） */
  newNodes?: Node2D[];
  
  /** 删除的节点ID列表（可选） */
  deletedNodeIds?: string[];
}

/**
 * 增量更新响应
 */
export interface IncrementalUpdateResponse {
  /** 是否成功 */
  success: boolean;
  
  /** 更新后的节点 */
  updatedNodes: Node3D[];
  
  /** 质量变化（百分比） */
  qualityChange: number;
  
  /** 处理时间（毫秒） */
  processingTime: number;
  
  /** 是否建议重新布局 */
  shouldReLayout?: boolean;
}

// =====================================================
// 数据库模型接口
// =====================================================

/**
 * 布局配置记录
 * 对应 layout_configs 表
 */
export interface LayoutConfigRecord {
  /** 配置ID */
  id: string;
  
  /** 图谱ID */
  graphId: string;
  
  /** 布局策略 */
  strategy: LayoutStrategy;
  
  /** 配置JSON字符串 */
  configJson: string;
  
  /** 质量分数 */
  qualityScore: number;
  
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 布局历史记录
 * 对应 layout_history 表
 */
export interface LayoutHistoryRecord {
  /** 历史记录ID */
  id: string;
  
  /** 图谱ID */
  graphId: string;
  
  /** 节点ID */
  nodeId: string;
  
  /** 3D X坐标 */
  x3d: number;
  
  /** 3D Y坐标 */
  y3d: number;
  
  /** 3D Z坐标 */
  z3d: number;
  
  /** 版本号 */
  version: number;
  
  /** 创建时间 */
  createdAt: Date;
}

// =====================================================
// 内部数据结构
// =====================================================

/**
 * 节点状态（用于力模拟）
 */
export interface NodeState {
  /** 节点 */
  node: Node3D;
  
  /** 速度向量 */
  velocity: Vector3D;
  
  /** 加速度向量 */
  acceleration: Vector3D;
  
  /** 质量 */
  mass: number;
}

/**
 * 空间网格（用于碰撞检测优化）
 */
export interface SpatialGrid {
  /** 单元格大小 */
  cellSize: number;
  
  /** 单元格映射 */
  cells: Map<string, Node3D[]>;
}

/**
 * 布局上下文
 * 包含布局过程中的所有状态信息
 */
export interface LayoutContext {
  /** 节点列表 */
  nodes: Node3D[];
  
  /** 边列表 */
  edges: Edge[];
  
  /** 图谱指标 */
  metrics: GraphMetrics;
  
  /** 配置 */
  config: LayoutConfig;
  
  /** 策略 */
  strategy: LayoutStrategy;
  
  /** 质量指标（可选） */
  qualityMetrics?: LayoutQualityMetrics;
}

// =====================================================
// 验证结果接口
// =====================================================

/**
 * 输入验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  
  /** 错误列表 */
  errors: string[];
  
  /** 警告列表 */
  warnings: string[];
}

// =====================================================
// 默认配置常量
// =====================================================

/**
 * 默认布局配置
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  heightVariation: 20,        // 增加到20，提供更好的3D效果
  minNodeDistance: 15,        // 减少到15，允许更紧凑的布局
  iterations: 120,            // 增加到120，提供更充分的力模拟
  springLength: 15,           // 减少到15，使连接更紧密
  repulsionStrength: 1200,    // 增加到1200，防止节点过于密集
  damping: 0.85,              // 减少到0.85，加快收敛速度
  convergenceThreshold: 0.01,
  batchSize: 15,
  batchDelay: 100
};

/**
 * 优化的布局配置预设
 */
export const OPTIMIZED_LAYOUT_CONFIGS = {
  /** 小型图谱（< 20节点）- 强调美观 */
  small: {
    heightVariation: 25,
    minNodeDistance: 18,
    iterations: 150,
    springLength: 18,
    repulsionStrength: 1500,
    damping: 0.85,
    convergenceThreshold: 0.01,
    batchSize: 15,
    batchDelay: 100
  } as LayoutConfig,
  
  /** 中型图谱（20-50节点）- 平衡性能和质量 */
  medium: {
    heightVariation: 20,
    minNodeDistance: 15,
    iterations: 120,
    springLength: 15,
    repulsionStrength: 1200,
    damping: 0.85,
    convergenceThreshold: 0.01,
    batchSize: 15,
    batchDelay: 100
  } as LayoutConfig,
  
  /** 大型图谱（50-100节点）- 强调性能 */
  large: {
    heightVariation: 15,
    minNodeDistance: 12,
    iterations: 100,
    springLength: 12,
    repulsionStrength: 1000,
    damping: 0.9,
    convergenceThreshold: 0.02,
    batchSize: 20,
    batchDelay: 50
  } as LayoutConfig,
  
  /** 超大型图谱（> 100节点）- 最大化性能 */
  xlarge: {
    heightVariation: 12,
    minNodeDistance: 10,
    iterations: 80,
    springLength: 10,
    repulsionStrength: 800,
    damping: 0.92,
    convergenceThreshold: 0.03,
    batchSize: 25,
    batchDelay: 30
  } as LayoutConfig
};

/**
 * 默认转换选项
 */
export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = {
  heightVariation: 8,
  preserveTopology: true,
  scaleFactor: 1.0
};

// =====================================================
// 类型守卫
// =====================================================

/**
 * 检查是否为有效的Node2D
 */
export function isNode2D(obj: any): obj is Node2D {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.x2d === 'number' &&
    typeof obj.y2d === 'number' &&
    typeof obj.label === 'string'
  );
}

/**
 * 检查是否为有效的Node3D
 */
export function isNode3D(obj: any): obj is Node3D {
  return (
    isNode2D(obj) &&
    typeof (obj as Node3D).x3d === 'number' &&
    typeof (obj as Node3D).y3d === 'number' &&
    typeof (obj as Node3D).z3d === 'number'
  );
}

/**
 * 检查是否为有效的Edge
 */
export function isEdge(obj: any): obj is Edge {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.target === 'string'
  );
}

/**
 * 检查坐标是否有效（非NaN、非Infinity）
 */
export function isValidCoordinate(value: number): boolean {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}

/**
 * 检查节点坐标是否全部有效
 */
export function hasValidCoordinates(node: Node3D): boolean {
  return (
    isValidCoordinate(node.x3d) &&
    isValidCoordinate(node.y3d) &&
    isValidCoordinate(node.z3d)
  );
}
