'use client'

import React, { useState, useEffect } from 'react'

// TypeScript interfaces
export interface PerformanceMetrics {
  searchCount: number
  cacheHitRate: number
  averageSearchTime: number
  totalSearchTime: number
  slowestSearch: number
  fastestSearch: number
  memoryUsage?: number
  networkRequests: number
}

export interface SearchPerformanceMonitorProps {
  metrics: PerformanceMetrics
  showDetails?: boolean
  className?: string
  onReset?: () => void
}

// 性能指标显示组件
const MetricCard: React.FC<{
  title: string
  value: string | number
  unit?: string
  icon: string
  color: string
  trend?: 'up' | 'down' | 'stable'
  description?: string
}> = ({ title, value, unit, icon, color, trend, description }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      default: return ''
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${color} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
        {trend && (
          <span className={`text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
          </span>
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toFixed(value < 10 ? 2 : 0) : value}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  )
}

// 性能图表组件（简化版）
const PerformanceChart: React.FC<{
  data: number[]
  label: string
  color: string
  height?: number
}> = ({ data, label, color, height = 60 }) => {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{label}</h4>
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data.map((value, index) => {
              const x = (index / (data.length - 1)) * 100
              const y = ((max - value) / range) * 100
              return `${x},${y}`
            }).join(' ')}
          />
          {data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = ((max - value) / range) * 100
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="2"
                fill={color}
              />
            )
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>最小: {min.toFixed(1)}</span>
        <span>最大: {max.toFixed(1)}</span>
      </div>
    </div>
  )
}

// 主要性能监控组件
const SearchPerformanceMonitor: React.FC<SearchPerformanceMonitorProps> = ({
  metrics,
  showDetails = false,
  className = '',
  onReset
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails)
  const [searchTimes, setSearchTimes] = useState<number[]>([])

  // 模拟搜索时间历史数据
  useEffect(() => {
    // 生成一些示例数据用于图表显示
    const times = Array.from({ length: 20 }, () => 
      metrics.averageSearchTime + (Math.random() - 0.5) * 200
    )
    setSearchTimes(times)
  }, [metrics.averageSearchTime])

  const getPerformanceGrade = () => {
    const avgTime = metrics.averageSearchTime
    if (avgTime < 200) return { grade: 'A', color: 'text-green-600', description: '优秀' }
    if (avgTime < 500) return { grade: 'B', color: 'text-blue-600', description: '良好' }
    if (avgTime < 1000) return { grade: 'C', color: 'text-yellow-600', description: '一般' }
    return { grade: 'D', color: 'text-red-600', description: '需要优化' }
  }

  const getCacheEfficiency = () => {
    const rate = metrics.cacheHitRate
    if (rate > 0.8) return { level: '高效', color: 'text-green-600' }
    if (rate > 0.5) return { level: '中等', color: 'text-yellow-600' }
    return { level: '低效', color: 'text-red-600' }
  }

  const performanceGrade = getPerformanceGrade()
  const cacheEfficiency = getCacheEfficiency()

  if (!isExpanded) {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">性能:</span>
              <span className={`text-sm font-medium ${performanceGrade.color}`}>
                {performanceGrade.grade}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">缓存:</span>
              <span className={`text-sm font-medium ${cacheEfficiency.color}`}>
                {(metrics.cacheHitRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">搜索:</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.searchCount}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-teal-600 hover:text-teal-700 transition-colors"
          >
            详情 ▼
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-teal-600">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">搜索性能监控</h3>
              <p className="text-sm text-gray-600">实时性能指标和优化建议</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onReset && (
              <button
                onClick={onReset}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                重置
              </button>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* 性能概览 */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="平均响应时间"
            value={metrics.averageSearchTime}
            unit="ms"
            icon="⚡"
            color="border-blue-500"
            description={`性能等级: ${performanceGrade.description}`}
          />
          
          <MetricCard
            title="缓存命中率"
            value={metrics.cacheHitRate * 100}
            unit="%"
            icon="💾"
            color="border-green-500"
            description={`缓存效率: ${cacheEfficiency.level}`}
          />
          
          <MetricCard
            title="搜索次数"
            value={metrics.searchCount}
            icon="🔍"
            color="border-purple-500"
            description="总搜索请求数"
          />
          
          <MetricCard
            title="网络请求"
            value={metrics.networkRequests}
            icon="🌐"
            color="border-orange-500"
            description="API调用次数"
          />
        </div>

        {/* 详细指标 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">响应时间分析</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">最快响应:</span>
                <span className="font-medium text-green-600">
                  {metrics.fastestSearch?.toFixed(0) || 0}ms
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">最慢响应:</span>
                <span className="font-medium text-red-600">
                  {metrics.slowestSearch?.toFixed(0) || 0}ms
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">总搜索时间:</span>
                <span className="font-medium text-gray-900">
                  {(metrics.totalSearchTime / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">优化建议</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {metrics.cacheHitRate < 0.5 && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500">⚠️</span>
                  <span className="text-gray-700">缓存命中率较低，建议增加缓存时间</span>
                </div>
              )}
              {metrics.averageSearchTime > 1000 && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-red-500">🐌</span>
                  <span className="text-gray-700">搜索响应较慢，建议优化查询逻辑</span>
                </div>
              )}
              {metrics.networkRequests > metrics.searchCount * 1.5 && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500">📡</span>
                  <span className="text-gray-700">网络请求过多，建议启用请求合并</span>
                </div>
              )}
              {metrics.cacheHitRate > 0.8 && metrics.averageSearchTime < 500 && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-green-500">✅</span>
                  <span className="text-gray-700">性能表现优秀，继续保持</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 性能图表 */}
        {searchTimes.length > 0 && (
          <div className="mb-6">
            <PerformanceChart
              data={searchTimes}
              label="搜索响应时间趋势"
              color="#14b8a6"
              height={80}
            />
          </div>
        )}

        {/* 内存使用情况 */}
        {metrics.memoryUsage && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">内存使用</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(metrics.memoryUsage / 100 * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {metrics.memoryUsage.toFixed(1)}MB
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPerformanceMonitor