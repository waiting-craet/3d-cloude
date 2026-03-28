/**
 * 2D到3D图谱转换优化 - 主导出文件
 * 
 * 导出所有布局相关的类、接口和类型
 */

// 核心引擎
export { LayoutEngine, LayoutError } from './LayoutEngine';

// 组件
export { GraphAnalyzer } from './GraphAnalyzer';
export { CoordinateConverter } from './CoordinateConverter';
export { ForceSimulator } from './ForceSimulator';
export { CollisionDetector, SpatialGrid } from './CollisionDetector';
export { SpatialOptimizer } from './SpatialOptimizer';

// 策略
export { ILayoutStrategy, BaseLayoutStrategy } from './strategies/ILayoutStrategy';
export { HierarchicalStrategy } from './strategies/HierarchicalStrategy';
export { RadialStrategy } from './strategies/RadialStrategy';
export { ForceDirectedStrategy } from './strategies/ForceDirectedStrategy';
export { GridStrategy } from './strategies/GridStrategy';
export { SphericalStrategy } from './strategies/SphericalStrategy';

// 类型和接口
export type {
  Node2D,
  Node3D,
  Edge,
  Vector3D,
  LayoutConfig,
  ConversionOptions,
  ForceConfig,
  LayoutQualityMetrics,
  GraphMetrics,
  CollisionReport,
  OptimizationResult,
  ConvertTo3DRequest,
  ConvertTo3DResponse,
  IncrementalUpdateRequest,
  IncrementalUpdateResponse,
  LayoutConfigRecord,
  LayoutHistoryRecord,
  NodeState,
  SpatialGrid as SpatialGridType,
  LayoutContext,
  ValidationResult
} from './types';

// 枚举
export { LayoutStrategy } from './types';

// 常量
export { DEFAULT_LAYOUT_CONFIG, DEFAULT_CONVERSION_OPTIONS } from './types';

// 类型守卫
export {
  isNode2D,
  isNode3D,
  isEdge,
  isValidCoordinate,
  hasValidCoordinates
} from './types';
