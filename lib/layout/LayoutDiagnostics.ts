/**
 * 布局诊断工具
 * 
 * 用于诊断2D到3D转换过程中的问题
 */

import type { Node3D, Edge, LayoutQualityMetrics } from './types';

export interface DiagnosticReport {
  timestamp: string;
  nodeCount: number;
  edgeCount: number;
  
  // 坐标分析
  coordinateStats: {
    xRange: [number, number];
    yRange: [number, number];
    zRange: [number, number];
    avgDistance: number;
    minDistance: number;
    maxDistance: number;
  };
  
  // 分布分析
  distributionStats: {
    xStdDev: number;
    yStdDev: number;
    zStdDev: number;
    isUniform: boolean;
  };
  
  // 重叠分析
  overlapStats: {
    overlapCount: number;
    overlapPairs: Array<[string, string, number]>; // [id1, id2, distance]
    minDistanceViolations: number;
  };
  
  // 质量评估
  qualityAssessment: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export class LayoutDiagnostics {
  /**
   * 生成完整的诊断报告
   */
  static generateReport(
    nodes: Node3D[],
    edges: Edge[],
    qualityMetrics: LayoutQualityMetrics,
    minNodeDistance: number = 5
  ): DiagnosticReport {
    const coordinateStats = this.analyzeCoordinates(nodes);
    const distributionStats = this.analyzeDistribution(nodes);
    const overlapStats = this.analyzeOverlaps(nodes, minNodeDistance);
    const qualityAssessment = this.assessQuality(
      nodes,
      qualityMetrics,
      coordinateStats,
      distributionStats,
      overlapStats
    );

    return {
      timestamp: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      coordinateStats,
      distributionStats,
      overlapStats,
      qualityAssessment
    };
  }

  /**
   * 分析坐标范围和距离
   */
  private static analyzeCoordinates(nodes: Node3D[]) {
    if (nodes.length === 0) {
      return {
        xRange: [0, 0] as [number, number],
        yRange: [0, 0] as [number, number],
        zRange: [0, 0] as [number, number],
        avgDistance: 0,
        minDistance: 0,
        maxDistance: 0
      };
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

    // 计算节点间距离
    const distances: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x3d - nodes[j].x3d;
        const dy = nodes[i].y3d - nodes[j].y3d;
        const dz = nodes[i].z3d - nodes[j].z3d;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        distances.push(distance);
      }
    }

    const avgDistance = distances.length > 0
      ? distances.reduce((sum, d) => sum + d, 0) / distances.length
      : 0;
    const minDistance = distances.length > 0 ? Math.min(...distances) : 0;
    const maxDistance = distances.length > 0 ? Math.max(...distances) : 0;

    return {
      xRange: [minX, maxX] as [number, number],
      yRange: [minY, maxY] as [number, number],
      zRange: [minZ, maxZ] as [number, number],
      avgDistance,
      minDistance,
      maxDistance
    };
  }

  /**
   * 分析分布均匀性
   */
  private static analyzeDistribution(nodes: Node3D[]) {
    if (nodes.length < 2) {
      return {
        xStdDev: 0,
        yStdDev: 0,
        zStdDev: 0,
        isUniform: true
      };
    }

    const xValues = nodes.map(n => n.x3d);
    const yValues = nodes.map(n => n.y3d);
    const zValues = nodes.map(n => n.z3d);

    const xStdDev = this.calculateStdDev(xValues);
    const yStdDev = this.calculateStdDev(yValues);
    const zStdDev = this.calculateStdDev(zValues);

    // 判断是否均匀：三个维度的标准差应该相近
    const avgStd = (xStdDev + yStdDev + zStdDev) / 3;
    const maxStd = Math.max(xStdDev, yStdDev, zStdDev);
    const isUniform = avgStd > 0 && maxStd / avgStd < 2.0;

    return {
      xStdDev,
      yStdDev,
      zStdDev,
      isUniform
    };
  }

  /**
   * 分析节点重叠
   */
  private static analyzeOverlaps(nodes: Node3D[], minNodeDistance: number) {
    const overlapPairs: Array<[string, string, number]> = [];
    let minDistanceViolations = 0;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x3d - nodes[j].x3d;
        const dy = nodes[i].y3d - nodes[j].y3d;
        const dz = nodes[i].z3d - nodes[j].z3d;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < minNodeDistance) {
          overlapPairs.push([nodes[i].id, nodes[j].id, distance]);
          minDistanceViolations++;
        }
      }
    }

    return {
      overlapCount: overlapPairs.length,
      overlapPairs: overlapPairs.slice(0, 10), // 只返回前10个
      minDistanceViolations
    };
  }

  /**
   * 评估质量并提供建议
   */
  private static assessQuality(
    nodes: Node3D[],
    qualityMetrics: LayoutQualityMetrics,
    coordinateStats: any,
    distributionStats: any,
    overlapStats: any
  ) {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = qualityMetrics.qualityScore;

    // 检查重叠问题
    if (overlapStats.overlapCount > 0) {
      issues.push(`发现 ${overlapStats.overlapCount} 对节点重叠`);
      recommendations.push('增加 minNodeDistance 参数或使用更多优化迭代');
    }

    // 检查分布均匀性
    if (!distributionStats.isUniform) {
      issues.push('节点分布不均匀，某些维度过于集中');
      recommendations.push('尝试使用 force_directed 或 spherical 策略');
    }

    // 检查坐标范围
    const xSpan = coordinateStats.xRange[1] - coordinateStats.xRange[0];
    const ySpan = coordinateStats.yRange[1] - coordinateStats.yRange[0];
    const zSpan = coordinateStats.zRange[1] - coordinateStats.zRange[0];

    if (zSpan < Math.max(xSpan, ySpan) * 0.3) {
      issues.push('Z轴分布过于扁平，缺乏3D效果');
      recommendations.push('增加 heightVariation 参数（建议值：15-30）');
    }

    // 检查节点密度
    if (coordinateStats.avgDistance < 10) {
      issues.push('节点过于密集，平均距离过小');
      recommendations.push('增加自适应间距因子或使用更大的画布空间');
    }

    // 检查空间利用率
    if (qualityMetrics.spaceUtilization < 0.4) {
      issues.push('空间利用率过低，节点过于分散');
      recommendations.push('减小间距因子或使用更紧凑的布局策略');
    } else if (qualityMetrics.spaceUtilization > 0.9) {
      issues.push('空间利用率过高，节点过于拥挤');
      recommendations.push('增加间距因子或使用更宽松的布局策略');
    }

    return {
      score,
      issues,
      recommendations
    };
  }

  /**
   * 计算标准差
   */
  private static calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * 打印诊断报告到控制台
   */
  static printReport(report: DiagnosticReport): void {
    console.group('🔍 布局诊断报告');
    console.log('时间:', report.timestamp);
    console.log('节点数:', report.nodeCount);
    console.log('边数:', report.edgeCount);

    console.group('📊 坐标统计');
    console.log('X范围:', report.coordinateStats.xRange);
    console.log('Y范围:', report.coordinateStats.yRange);
    console.log('Z范围:', report.coordinateStats.zRange);
    console.log('平均距离:', report.coordinateStats.avgDistance.toFixed(2));
    console.log('最小距离:', report.coordinateStats.minDistance.toFixed(2));
    console.log('最大距离:', report.coordinateStats.maxDistance.toFixed(2));
    console.groupEnd();

    console.group('📈 分布统计');
    console.log('X标准差:', report.distributionStats.xStdDev.toFixed(2));
    console.log('Y标准差:', report.distributionStats.yStdDev.toFixed(2));
    console.log('Z标准差:', report.distributionStats.zStdDev.toFixed(2));
    console.log('分布均匀:', report.distributionStats.isUniform ? '✓' : '✗');
    console.groupEnd();

    console.group('⚠️ 重叠统计');
    console.log('重叠数量:', report.overlapStats.overlapCount);
    console.log('最小距离违规:', report.overlapStats.minDistanceViolations);
    if (report.overlapStats.overlapPairs.length > 0) {
      console.log('重叠节点对（前10个）:');
      report.overlapStats.overlapPairs.forEach(([id1, id2, dist]) => {
        console.log(`  ${id1} ↔ ${id2}: ${dist.toFixed(2)}`);
      });
    }
    console.groupEnd();

    console.group('✨ 质量评估');
    console.log('质量分数:', report.qualityAssessment.score.toFixed(1));
    if (report.qualityAssessment.issues.length > 0) {
      console.log('发现的问题:');
      report.qualityAssessment.issues.forEach(issue => console.log(`  ❌ ${issue}`));
    }
    if (report.qualityAssessment.recommendations.length > 0) {
      console.log('改进建议:');
      report.qualityAssessment.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
    }
    console.groupEnd();

    console.groupEnd();
  }
}
