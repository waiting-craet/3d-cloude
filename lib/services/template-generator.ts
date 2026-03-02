/**
 * TemplateGenerator - 生成简化格式的导入模板
 * 
 * 支持三种格式:
 * - JSON: nodes/edges分离格式
 * - CSV: 简单的三列格式
 * - Excel: 三元组格式 (实体1-内容1-关系-实体2-内容2)
 */

export interface TemplateConfig {
  includeExamples?: boolean      // 是否包含示例数据，默认true
  exampleNodeCount?: number      // 示例节点数量，默认5
  exampleEdgeCount?: number      // 示例边数量，默认5
  includeMediaFields?: boolean   // 是否包含媒体字段示例，默认true
  includeInstructions?: boolean  // 是否包含使用说明，默认true
}

export interface SimplifiedNodeData {
  label: string              // 必填：节点名称
  description?: string       // 可选：节点描述
  image?: string            // 可选：图片URL
  video?: string            // 可选：视频URL
}

export interface SimplifiedEdgeData {
  source: string            // 必填：起始节点
  target: string            // 必填：目标节点
  label?: string            // 可选：关系名称
}

export interface TripleData {
  entity1: string           // 实体1（起始节点）
  content1?: string         // 内容1（起始节点描述）
  relation?: string         // 关系（边标签）
  entity2: string           // 实体2（目标节点）
  content2?: string         // 内容2（目标节点描述）
}

export class TemplateGenerator {
  private readonly DEFAULT_CONFIG: Required<TemplateConfig> = {
    includeExamples: true,
    exampleNodeCount: 5,
    exampleEdgeCount: 5,
    includeMediaFields: true,
    includeInstructions: true
  }

  /**
   * 生成JSON模板
   */
  generateJSONTemplate(config?: TemplateConfig): string {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    const template: any = {}

    if (finalConfig.includeInstructions) {
      template['使用说明'] = {
        '简介': '这是一个简化的3D知识图谱模板，只需填写节点名称和关系即可',
        '自动生成': '系统会自动生成：3D坐标、节点颜色、节点大小、节点形状、节点ID',
        '必填字段': 'label（节点名称）、source（起始节点）、target（目标节点）',
        '可选字段': 'description（节点描述）、image（图片URL）、video（视频URL）、label（关系名称）',
        '提示': '删除此说明对象后开始填写您的数据'
      }
    }

    if (finalConfig.includeExamples) {
      const nodes = this.generateExampleNodes(
        finalConfig.exampleNodeCount,
        finalConfig.includeMediaFields
      )
      const edges = this.generateExampleEdges(nodes, finalConfig.exampleEdgeCount)

      template.nodes = nodes
      template.edges = edges
    } else {
      template.nodes = []
      template.edges = []
    }

    return JSON.stringify(template, null, 2)
  }

  /**
   * 生成CSV模板
   */
  generateCSVTemplate(config?: TemplateConfig): string {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    let csv = ''

    if (finalConfig.includeInstructions) {
      csv += '# 知识图谱导入模板 (CSV格式)\n'
      csv += '# 说明: 只需填写三列 - source(起始节点), target(目标节点), label(关系名称)\n'
      csv += '# 系统会自动生成: 3D坐标、节点颜色、节点大小、节点ID\n'
      csv += '# 提示: 删除这些注释行后开始填写您的数据\n'
      csv += '\n'
    }

    // CSV头部
    csv += 'source,target,label\n'

    if (finalConfig.includeExamples) {
      const nodes = this.generateExampleNodes(finalConfig.exampleNodeCount, false)
      const edges = this.generateExampleEdges(nodes, finalConfig.exampleEdgeCount)

      edges.forEach(edge => {
        csv += `${edge.source},${edge.target},${edge.label || ''}\n`
      })
    }

    return csv
  }

  /**
   * 生成Excel模板数据 (三元组格式)
   * 返回可以被Excel库使用的数据结构
   */
  generateExcelTemplateData(config?: TemplateConfig): {
    relationSheet: any[][]
    instructionSheet: any[][]
  } {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

    // 关系数据工作表 (三元组格式)
    const relationSheet: any[][] = []
    
    // 表头
    relationSheet.push(['实体', '内容', '关系', '实体', '内容'])

    if (finalConfig.includeExamples) {
      const triples = this.generateExampleTriples(
        finalConfig.exampleEdgeCount,
        finalConfig.includeMediaFields
      )

      triples.forEach(triple => {
        relationSheet.push([
          triple.entity1,
          triple.content1 || '',
          triple.relation || '',
          triple.entity2,
          triple.content2 || ''
        ])
      })
    }

    // 使用说明工作表
    const instructionSheet: any[][] = []
    
    if (finalConfig.includeInstructions) {
      instructionSheet.push(['知识图谱导入模板 - 使用说明'])
      instructionSheet.push([])
      instructionSheet.push(['简介'])
      instructionSheet.push(['这是一个简化的3D知识图谱模板，采用三元组格式（实体-关系-实体）'])
      instructionSheet.push(['每一行表示一个完整的关系，系统会自动提取节点和生成3D布局'])
      instructionSheet.push([])
      instructionSheet.push(['字段说明'])
      instructionSheet.push(['列A: 实体1 - 起始节点名称（必填）'])
      instructionSheet.push(['列B: 内容1 - 起始节点描述（可选）'])
      instructionSheet.push(['列C: 关系 - 边的标签（可选）'])
      instructionSheet.push(['列D: 实体2 - 目标节点名称（必填）'])
      instructionSheet.push(['列E: 内容2 - 目标节点描述（可选）'])
      instructionSheet.push([])
      instructionSheet.push(['自动生成'])
      instructionSheet.push(['系统会自动生成以下内容：'])
      instructionSheet.push(['- 3D坐标（x, y, z）'])
      instructionSheet.push(['- 节点颜色'])
      instructionSheet.push(['- 节点大小'])
      instructionSheet.push(['- 节点形状'])
      instructionSheet.push(['- 节点ID'])
      instructionSheet.push([])
      instructionSheet.push(['示例'])
      instructionSheet.push(['实体1: Python'])
      instructionSheet.push(['内容1: 一种简单易学的编程语言'])
      instructionSheet.push(['关系: 应用于'])
      instructionSheet.push(['实体2: 数据分析'])
      instructionSheet.push(['内容2: 使用数据发现规律'])
      instructionSheet.push([])
      instructionSheet.push(['提示'])
      instructionSheet.push(['1. 删除"使用说明"工作表后开始填写数据'])
      instructionSheet.push(['2. 实体名称会自动去重，相同名称会合并为同一个节点'])
      instructionSheet.push(['3. 内容字段可以留空'])
      instructionSheet.push(['4. 支持中文节点名称和关系'])
    }

    return {
      relationSheet,
      instructionSheet
    }
  }

  /**
   * 生成示例节点数据
   */
  private generateExampleNodes(
    count: number,
    includeMedia: boolean = true
  ): SimplifiedNodeData[] {
    const examples: SimplifiedNodeData[] = [
      {
        label: 'Python',
        description: '一种简单易学的编程语言',
        image: includeMedia ? 'https://example.com/python-logo.png' : undefined
      },
      {
        label: '数据分析',
        description: '使用数据发现规律和洞察'
      },
      {
        label: '机器学习',
        description: '让计算机从数据中学习',
        video: includeMedia ? 'https://example.com/ml-intro.mp4' : undefined
      },
      {
        label: 'Web开发',
        description: '构建网站和Web应用'
      },
      {
        label: '自动化脚本',
        description: '自动化重复性任务'
      },
      {
        label: '深度学习',
        description: '使用神经网络进行学习'
      },
      {
        label: '自然语言处理',
        description: '让计算机理解人类语言'
      }
    ]

    return examples.slice(0, Math.min(count, examples.length))
  }

  /**
   * 生成示例边数据
   */
  private generateExampleEdges(
    nodes: SimplifiedNodeData[],
    count: number
  ): SimplifiedEdgeData[] {
    if (nodes.length < 2) return []

    const edges: SimplifiedEdgeData[] = []
    const nodeLabels = nodes.map(n => n.label)

    // 创建一些有意义的关系
    const relationships = [
      { source: 'Python', target: '数据分析', label: '应用于' },
      { source: 'Python', target: '机器学习', label: '应用于' },
      { source: 'Python', target: 'Web开发', label: '应用于' },
      { source: 'Python', target: '自动化脚本', label: '应用于' },
      { source: '数据分析', target: '机器学习', label: '支撑' },
      { source: '机器学习', target: '深度学习', label: '包含' },
      { source: '深度学习', target: '自然语言处理', label: '应用于' }
    ]

    for (const rel of relationships) {
      if (
        nodeLabels.includes(rel.source) &&
        nodeLabels.includes(rel.target) &&
        edges.length < count
      ) {
        edges.push(rel)
      }
    }

    return edges
  }

  /**
   * 生成示例三元组数据 (用于Excel格式)
   */
  private generateExampleTriples(
    count: number,
    includeMedia: boolean = true
  ): TripleData[] {
    const triples: TripleData[] = [
      {
        entity1: 'Python',
        content1: '一种简单易学的编程语言',
        relation: '应用于',
        entity2: '数据分析',
        content2: '使用数据发现规律和洞察'
      },
      {
        entity1: 'Python',
        content1: '一种简单易学的编程语言',
        relation: '应用于',
        entity2: '机器学习',
        content2: '让计算机从数据中学习'
      },
      {
        entity1: 'Python',
        content1: '一种简单易学的编程语言',
        relation: '应用于',
        entity2: 'Web开发',
        content2: '构建网站和Web应用'
      },
      {
        entity1: 'Python',
        content1: '一种简单易学的编程语言',
        relation: '应用于',
        entity2: '自动化脚本',
        content2: '自动化重复性任务'
      },
      {
        entity1: '数据分析',
        content1: '使用数据发现规律和洞察',
        relation: '支撑',
        entity2: '机器学习',
        content2: '让计算机从数据中学习'
      },
      {
        entity1: '机器学习',
        content1: '让计算机从数据中学习',
        relation: '包含',
        entity2: '深度学习',
        content2: '使用神经网络进行学习'
      },
      {
        entity1: '深度学习',
        content1: '使用神经网络进行学习',
        relation: '应用于',
        entity2: '自然语言处理',
        content2: '让计算机理解人类语言'
      }
    ]

    return triples.slice(0, Math.min(count, triples.length))
  }

  /**
   * 从三元组数据提取节点和边
   * 用于将Excel三元组格式转换为标准的nodes/edges格式
   */
  static extractNodesAndEdgesFromTriples(
    triples: TripleData[]
  ): { nodes: SimplifiedNodeData[]; edges: SimplifiedEdgeData[] } {
    const nodeMap = new Map<string, SimplifiedNodeData>()
    const edges: SimplifiedEdgeData[] = []

    triples.forEach(triple => {
      // 提取实体1
      if (!nodeMap.has(triple.entity1)) {
        nodeMap.set(triple.entity1, {
          label: triple.entity1,
          description: triple.content1
        })
      }

      // 提取实体2
      if (!nodeMap.has(triple.entity2)) {
        nodeMap.set(triple.entity2, {
          label: triple.entity2,
          description: triple.content2
        })
      }

      // 创建边
      edges.push({
        source: triple.entity1,
        target: triple.entity2,
        label: triple.relation
      })
    })

    return {
      nodes: Array.from(nodeMap.values()),
      edges
    }
  }
}
