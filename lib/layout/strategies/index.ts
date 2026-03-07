/**
 * 布局策略模块导出
 * 
 * 提供所有可用的布局策略
 */

export { ILayoutStrategy, BaseLayoutStrategy } from './ILayoutStrategy';
export { HierarchicalStrategy } from './HierarchicalStrategy';
export { RadialStrategy } from './RadialStrategy';
export { ForceDirectedStrategy } from './ForceDirectedStrategy';
export { GridStrategy } from './GridStrategy';
export { SphericalStrategy } from './SphericalStrategy';

// 导出策略工厂函数
import { ILayoutStrategy } from './ILayoutStrategy';
import { HierarchicalStrategy } from './HierarchicalStrategy';
import { RadialStrategy } from './RadialStrategy';
import { ForceDirectedStrategy } from './ForceDirectedStrategy';
import { GridStrategy } from './GridStrategy';
import { SphericalStrategy } from './SphericalStrategy';
import { LayoutStrategy } from '../types';

/**
 * 获取所有可用的布局策略实例
 */
export function getAllStrategies(): ILayoutStrategy[] {
  return [
    new HierarchicalStrategy(),
    new RadialStrategy(),
    new ForceDirectedStrategy(),
    new GridStrategy(),
    new SphericalStrategy()
  ];
}

/**
 * 根据策略名称获取策略实例
 * 
 * @param strategyName - 策略名称
 * @returns 策略实例，如果未找到则返回null
 */
export function getStrategy(strategyName: LayoutStrategy): ILayoutStrategy | null {
  switch (strategyName) {
    case LayoutStrategy.HIERARCHICAL:
      return new HierarchicalStrategy();
    case LayoutStrategy.RADIAL:
      return new RadialStrategy();
    case LayoutStrategy.FORCE_DIRECTED:
      return new ForceDirectedStrategy();
    case LayoutStrategy.GRID:
      return new GridStrategy();
    case LayoutStrategy.SPHERICAL:
      return new SphericalStrategy();
    default:
      return null;
  }
}
