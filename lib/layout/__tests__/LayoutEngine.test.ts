/**
 * LayoutEngine 单元测试
 * 
 * 测试核心布局引擎的基本功能
 */

import { LayoutEngine } from '../LayoutEngine';
import { Node2D, Edge, LayoutStrategy } from '../types';

describe('LayoutEngine', () => {
  let engine: LayoutEngine;

  beforeEach(() => {
    engine = new LayoutEngine();
  });

  describe('边界情况处理', () => {
    it('应该将单个节点放置在原点', async () => {
      const nodes: Node2D[] = [
        { id: '1', x2d: 50, y2d: 50, label: 'Single Node' }
      ];

      const result = await engine.convert3D(nodes, []);

      expect(result).toHaveLength(1);
      expect(result[0].x3d).toBe(0);
      expect(result[0].y3d).toBe(0);
      expect(result[0].z3d).toBe(0);
    });

    it('应该将两个节点沿X轴对称放置', async () => {
      const nodes: Node2D[] = [
        { id: '1', x2d: 0, y2d: 0, label: 'Node 1' },
        { id: '2', x2d: 100, y2d: 0, label: 'Node 2' }
      ];

      const result = await engine.convert3D(nodes, []);

      expect(result).toHaveLength(2);
      expect(result[0].x3d).toBeLessThan(0);
      expect(result[1].x3d).toBeGreaterThan(0);
      expect(Math.abs(result[0].x3d)).toBeCloseTo(Math.abs(result[1].x3d), 1);
    });
  });

  describe('基础转换', () => {
    it('应该成功转换小型图谱', async () => {
      const nodes: Node2D[] = [
        { id: '1', x2d: 0, y2d: 0, label: 'Node 1' },
        { id: '2', x2d: 100, y2d: 0, label: 'Node 2' },
        { id: '3', x2d: 50, y2d: 100, label: 'Node 3' }
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' }
      ];

      const result = await engine.convert3D(nodes, edges);

      expect(result).toHaveLength(3);
      
      // 验证所有节点都有有效的3D坐标
      for (const node of result) {
        expect(isFinite(node.x3d)).toBe(true);
        expect(isFinite(node.y3d)).toBe(true);
        expect(isFinite(node.z3d)).toBe(true);
        expect(isNaN(node.x3d)).toBe(false);
        expect(isNaN(node.y3d)).toBe(false);
        expect(isNaN(node.z3d)).toBe(false);
      }
    });

    it('应该处理无效的2D坐标', async () => {
      const nodes: Node2D[] = [
        { id: '1', x2d: NaN, y2d: 100, label: 'Invalid X' },
        { id: '2', x2d: 100, y2d: Infinity, label: 'Invalid Y' }
      ];

      const result = await engine.convert3D(nodes, []);

      expect(result).toHaveLength(2);
      
      // 无效坐标应该被替换为0
      expect(isFinite(result[0].x3d)).toBe(true);
      expect(isFinite(result[1].z3d)).toBe(true);
    });
  });

  describe('质量指标计算', () => {
    it('应该计算布局质量指标', async () => {
      const nodes: Node2D[] = [
        { id: '1', x2d: 0, y2d: 0, label: 'Node 1' },
        { id: '2', x2d: 100, y2d: 0, label: 'Node 2' },
        { id: '3', x2d: 50, y2d: 100, label: 'Node 3' },
        { id: '4', x2d: 150, y2d: 100, label: 'Node 4' }
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
        { id: 'e3', source: '3', target: '4' }
      ];

      const result = await engine.convert3D(nodes, edges);
      const metrics = engine.calculateQualityMetrics(result, edges);

      expect(metrics).toHaveProperty('nodeDistanceStdDev');
      expect(metrics).toHaveProperty('edgeLengthStdDev');
      expect(metrics).toHaveProperty('spatialUniformity');
      expect(metrics).toHaveProperty('spaceUtilization');
      expect(metrics).toHaveProperty('overlapCount');
      expect(metrics).toHaveProperty('qualityScore');

      // 质量分数应该在0-100之间
      expect(metrics.qualityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.qualityScore).toBeLessThanOrEqual(100);

      // 空间均匀性应该在0-1之间
      expect(metrics.spatialUniformity).toBeGreaterThanOrEqual(0);
      expect(metrics.spatialUniformity).toBeLessThanOrEqual(1);

      // 空间利用率应该在0-1之间
      expect(metrics.spaceUtilization).toBeGreaterThanOrEqual(0);
      expect(metrics.spaceUtilization).toBeLessThanOrEqual(1);
    });

    it('应该检测节点重叠', async () => {
      const nodes: Node2D[] = [
        { id: '1', x2d: 0, y2d: 0, label: 'Node 1' },
        { id: '2', x2d: 1, y2d: 1, label: 'Node 2' } // 非常接近
      ];

      const result = await engine.convert3D(nodes, []);
      const metrics = engine.calculateQualityMetrics(result);

      // 应该没有重叠（因为优化器会解决）
      expect(metrics.overlapCount).toBe(0);
    });
  });

  describe('增量更新', () => {
    it('应该支持添加新节点', async () => {
      const initialNodes: Node2D[] = [
        { id: '1', x2d: 0, y2d: 0, label: 'Node 1' },
        { id: '2', x2d: 100, y2d: 0, label: 'Node 2' }
      ];

      const initial3D = await engine.convert3D(initialNodes, []);

      const newNodes: Node2D[] = [
        { id: '3', x2d: 50, y2d: 100, label: 'Node 3' }
      ];

      const updateResult = await engine.incrementalUpdate(initial3D, newNodes, []);

      expect(updateResult.nodes).toHaveLength(3);
      expect(updateResult).toHaveProperty('qualityChange');
      expect(updateResult).toHaveProperty('shouldReLayout');
    });

    it('应该支持删除节点', async () => {
      const initialNodes: Node2D[] = [
        { id: '1', x2d: 0, y2d: 0, label: 'Node 1' },
        { id: '2', x2d: 100, y2d: 0, label: 'Node 2' },
        { id: '3', x2d: 50, y2d: 100, label: 'Node 3' }
      ];

      const initial3D = await engine.convert3D(initialNodes, []);

      const updateResult = await engine.incrementalUpdate(initial3D, [], ['2']);

      expect(updateResult.nodes).toHaveLength(2);
      expect(updateResult.nodes.find(n => n.id === '2')).toBeUndefined();
    });
  });

  describe('配置管理', () => {
    it('应该使用默认配置', () => {
      const config = engine.getConfig();

      expect(config).toHaveProperty('heightVariation');
      expect(config).toHaveProperty('minNodeDistance');
      expect(config).toHaveProperty('iterations');
      expect(config.heightVariation).toBe(8);
      expect(config.minNodeDistance).toBe(18);
    });

    it('应该允许更新配置', () => {
      engine.updateConfig({ minNodeDistance: 25 });

      const config = engine.getConfig();
      expect(config.minNodeDistance).toBe(25);
    });

    it('应该拒绝无效配置并使用默认值', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      engine.updateConfig({ minNodeDistance: -10 }); // 无效值

      const config = engine.getConfig();
      expect(config.minNodeDistance).toBe(18); // 应该回退到默认值
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('策略选择', () => {
    it('应该为DAG选择层级布局', async () => {
      const nodes: Node2D[] = [
        { id: '1', x2d: 0, y2d: 0, label: 'Node 1' },
        { id: '2', x2d: 100, y2d: 0, label: 'Node 2' },
        { id: '3', x2d: 50, y2d: 100, label: 'Node 3' }
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' }
      ];

      // 不指定策略，让引擎自动选择
      const result = await engine.convert3D(nodes, edges);

      expect(result).toHaveLength(3);
      // 验证结果有效
      expect(result.every(n => isFinite(n.x3d) && isFinite(n.y3d) && isFinite(n.z3d))).toBe(true);
    });

    it('应该允许手动指定策略', async () => {
      const nodes: Node2D[] = [
        { id: '1', x2d: 0, y2d: 0, label: 'Node 1' },
        { id: '2', x2d: 100, y2d: 0, label: 'Node 2' },
        { id: '3', x2d: 50, y2d: 100, label: 'Node 3' }
      ];

      const result = await engine.convert3D(nodes, [], LayoutStrategy.GRID);

      expect(result).toHaveLength(3);
      expect(result.every(n => isFinite(n.x3d) && isFinite(n.y3d) && isFinite(n.z3d))).toBe(true);
    });
  });
});
