/**
 * TemplateGenerator - 生成简化格式的导入模板
 * 
 * 支持三种格式:
 * - JSON: nodes/edges分离格式
 * - CSV: 简单的三列格式
 * - Excel: 矩阵列表格式 (每行一个实体，后续列为关系-目标实体对)
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
   * 生成JSON模板（边列表格式）
   */
  generateJSONTemplate(config?: TemplateConfig): string {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    const template: any = {}

    if (finalConfig.includeInstructions) {
      template['使用说明'] = {
        '简介': '这是一个简化的3D知识图谱模板，采用边列表格式',
        '格式说明': '每条边包含source（源节点）、relation（关系）、target（目标节点）',
        '自动生成': '系统会自动从边数据中提取唯一节点，并生成：3D坐标、节点颜色、节点大小、节点形状、节点ID',
        '必填字段': 'source（源节点）、target（目标节点）',
        '可选字段': 'relation（关系名称）',
        '提示': '删除此说明对象后开始填写您的数据'
      }
    }

    // 边列表格式模板
    template.edges = [
      { source: '节点A', relation: '连接', target: '节点B' },
      { source: '节点A', relation: '包含', target: '节点C' },
      { source: '节点B', relation: '引用', target: '节点C' }
    ]

    return JSON.stringify(template, null, 2)
  }

  /**
   * 生成CSV模板（边列表格式）
   */
  generateCSVTemplate(config?: TemplateConfig): string {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    let csv = ''

    if (finalConfig.includeInstructions) {
      csv += '# 知识图谱导入模板 (CSV格式 - 边列表)\n'
      csv += '# 说明: 每行格式为 - 源节点,关系,目标节点\n'
      csv += '# 系统会自动从边数据中提取唯一节点\n'
      csv += '# 系统会自动生成: 3D坐标、节点颜色、节点大小、节点ID\n'
      csv += '# 必填字段: 源节点、目标节点\n'
      csv += '# 可选字段: 关系\n'
      csv += '# 提示: 删除这些注释行后开始填写您的数据\n'
      csv += '\n'
    }

    // CSV头部
    csv += '源节点,关系,目标节点\n'
    
    // 添加至少3行示例数据
    csv += '节点A,连接,节点B\n'
    csv += '节点A,包含,节点C\n'
    csv += '节点B,引用,节点C\n'

    return csv
  }

  /**
   * 生成Excel边列表模板数据 (新格式)
   * 返回可以被Excel库使用的数据结构
   * 格式: 每行一条边，三列结构（源节点、关系、目标节点）
   */
  generateExcelEdgeListTemplateData(config?: TemplateConfig): {
    edgeSheet: any[][]
    instructionSheet: any[][]
  } {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

    // 边数据工作表 (边列表格式)
    const edgeSheet: any[][] = []
    
    // 第一行：列标题
    edgeSheet.push(['源节点', '关系', '目标节点'])

    // 添加至少3行示例数据
    edgeSheet.push(['节点A', '连接', '节点B'])
    edgeSheet.push(['节点A', '包含', '节点C'])
    edgeSheet.push(['节点B', '引用', '节点C'])

    // 使用说明工作表
    const instructionSheet: any[][] = []
    
    if (finalConfig.includeInstructions) {
      instructionSheet.push(['知识图谱导入模板 - 边列表格式使用说明'])
      instructionSheet.push([])
      instructionSheet.push(['简介'])
      instructionSheet.push(['这是一个简化的3D知识图谱模板，采用边列表格式'])
      instructionSheet.push(['每一行表示一条边关系，系统会自动提取所有唯一节点'])
      instructionSheet.push([])
      instructionSheet.push(['格式说明'])
      instructionSheet.push(['列A: 源节点 - 边的起始节点名称'])
      instructionSheet.push(['列B: 关系 - 描述源节点和目标节点之间的关系类型（可选）'])
      instructionSheet.push(['列C: 目标节点 - 边的终止节点名称'])
      instructionSheet.push([])
      instructionSheet.push(['示例'])
      instructionSheet.push(['源节点 | 关系 | 目标节点'])
      instructionSheet.push(['节点A | 连接 | 节点B'])
      instructionSheet.push(['节点A | 包含 | 节点C'])
      instructionSheet.push(['节点B | 引用 | 节点C'])
      instructionSheet.push([])
      instructionSheet.push(['说明：'])
      instructionSheet.push(['- 系统会自动从边数据中提取唯一节点（节点A、节点B、节点C）'])
      instructionSheet.push(['- 每行代表一条边关系，而非一个节点的所有关系'])
      instructionSheet.push([])
      instructionSheet.push(['自动生成'])
      instructionSheet.push(['系统会自动生成以下内容：'])
      instructionSheet.push(['- 节点列表（从边数据中提取）'])
      instructionSheet.push(['- 3D坐标（x, y, z）'])
      instructionSheet.push(['- 节点颜色'])
      instructionSheet.push(['- 节点大小'])
      instructionSheet.push(['- 节点形状'])
      instructionSheet.push(['- 节点ID'])
      instructionSheet.push([])
      instructionSheet.push(['重要提示'])
      instructionSheet.push(['1. 源节点和目标节点为必填字段'])
      instructionSheet.push(['2. 关系字段为可选，可以留空'])
      instructionSheet.push(['3. 系统会跳过空行和仅包含空白字符的行'])
      instructionSheet.push(['4. 如果源节点等于目标节点，系统会返回警告（自环边）'])
      instructionSheet.push(['5. 删除"使用说明"工作表后开始填写数据'])
    }

    return {
      edgeSheet,
      instructionSheet
    }
  }

  /**
   * 生成Excel模板数据 (矩阵列表格式)
   * 返回可以被Excel库使用的数据结构
   * 格式: 每行一个节点，后续列为关系-节点对
   */
  generateExcelTemplateData(config?: TemplateConfig): {
    relationSheet: any[][]
    instructionSheet: any[][]
  } {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

    // 关系数据工作表 (矩阵列表格式)
    const relationSheet: any[][] = []
    
    // 第一行：说明
    relationSheet.push(['有同名的节点要在节点名称后面加一个后缀，每一行是节点与别节点进行的连接'])
    
    // 第二行：表头
    const headerRow = ['节点(1)', '关系A', '关系B', '关系C', '关系......', '节点A', '节点B', '节点C', '节点......']
    relationSheet.push(headerRow)

    // 第三行和第四行：空白示例行
    relationSheet.push(['节点(2)'])
    relationSheet.push(['节点(3)'])

    // 使用说明工作表
    const instructionSheet: any[][] = []
    
    if (finalConfig.includeInstructions) {
      instructionSheet.push(['知识图谱导入模板 - 使用说明'])
      instructionSheet.push([])
      instructionSheet.push(['简介'])
      instructionSheet.push(['这是一个简化的3D知识图谱模板，采用矩阵列表格式'])
      instructionSheet.push(['每一行表示一个节点及其所有对外关系'])
      instructionSheet.push([])
      instructionSheet.push(['格式说明'])
      instructionSheet.push(['列A: 节点名称（如：节点(1)、节点(2)、节点(3)...）'])
      instructionSheet.push(['列B起: 先填写所有关系，再填写所有目标节点'])
      instructionSheet.push(['  示例：节点(2) | 关系A | 关系B | 节点A | 节点B'])
      instructionSheet.push(['  表示：节点(2)通过"关系A"连接到节点A，通过"关系B"连接到节点B'])
      instructionSheet.push([])
      instructionSheet.push(['填写步骤'])
      instructionSheet.push(['1. 在列A填写节点名称（如：节点(2)、节点(3)...）'])
      instructionSheet.push(['2. 在后续列先填写所有关系名称'])
      instructionSheet.push(['3. 然后填写对应的目标节点名称'])
      instructionSheet.push(['4. 关系和节点必须一一对应'])
      instructionSheet.push([])
      instructionSheet.push(['自动生成'])
      instructionSheet.push(['系统会自动生成以下内容：'])
      instructionSheet.push(['- 3D坐标（x, y, z）'])
      instructionSheet.push(['- 节点颜色'])
      instructionSheet.push(['- 节点大小'])
      instructionSheet.push(['- 节点形状'])
      instructionSheet.push(['- 节点ID'])
      instructionSheet.push([])
      instructionSheet.push(['重要提示'])
      instructionSheet.push(['1. 如有同名节点，请在节点名称后加后缀区分（如：节点(1)、节点(2)）'])
      instructionSheet.push(['2. 每一行代表一个节点的所有出边关系'])
      instructionSheet.push(['3. 先填写所有关系，再填写所有目标节点'])
      instructionSheet.push(['4. 关系数量必须等于目标节点数量'])
      instructionSheet.push(['5. 删除"使用说明"工作表后开始填写数据'])
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
   * 从边列表数据提取节点和边
   * 用于将边列表格式转换为标准的nodes/edges格式
   * 
   * @param edgeList - 边列表数据，每个对象包含source、relation、target字段
   */
  static extractNodesAndEdgesFromEdgeList(
    edgeList: Array<{ source: string; relation?: string; target: string }>
  ): { nodes: SimplifiedNodeData[]; edges: SimplifiedEdgeData[] } {
    const nodeMap = new Map<string, SimplifiedNodeData>()
    const edges: SimplifiedEdgeData[] = []

    edgeList.forEach(edge => {
      // 跳过空行和空白行
      const source = edge.source?.toString().trim()
      const target = edge.target?.toString().trim()
      
      if (!source || !target) {
        return // 跳过无效边
      }

      // 提取源节点
      if (!nodeMap.has(source)) {
        nodeMap.set(source, {
          label: source
        })
      }

      // 提取目标节点
      if (!nodeMap.has(target)) {
        nodeMap.set(target, {
          label: target
        })
      }

      // 创建边
      edges.push({
        source: source,
        target: target,
        label: edge.relation?.toString().trim() || undefined
      })
    })

    return {
      nodes: Array.from(nodeMap.values()),
      edges
    }
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

  /**
   * 从矩阵列表数据提取节点和边
   * 用于将Excel矩阵格式转换为标准的nodes/edges格式
   * 
   * 新格式: [节点, 关系1, 关系2, ..., 节点1, 节点2, ...]
   * 关系和节点分开，先所有关系，再所有目标节点
   * 
   * @param matrixData - 矩阵数据，每行格式: [节点, 关系1, 关系2, ..., 节点1, 节点2, ...]
   * @param skipRows - 跳过的行数（通常是说明行和表头行），默认2
   */
  static extractNodesAndEdgesFromMatrix(
    matrixData: any[][],
    skipRows: number = 2
  ): { nodes: SimplifiedNodeData[]; edges: SimplifiedEdgeData[] } {
    const nodeMap = new Map<string, SimplifiedNodeData>()
    const edges: SimplifiedEdgeData[] = []

    // 跳过说明行和表头行
    for (let i = skipRows; i < matrixData.length; i++) {
      const row = matrixData[i]
      if (!row || row.length === 0) continue

      const sourceNode = row[0]?.toString().trim()
      if (!sourceNode) continue

      // 添加源节点
      if (!nodeMap.has(sourceNode)) {
        nodeMap.set(sourceNode, {
          label: sourceNode
        })
      }

      // 新格式：先收集所有关系，再收集所有目标节点
      // 找到关系和节点的分界点（通常关系在前半部分，节点在后半部分）
      const dataColumns = row.slice(1).filter(cell => cell && cell.toString().trim())
      
      if (dataColumns.length === 0) continue

      // 尝试智能分割：如果列数是偶数，对半分；否则根据内容判断
      const halfPoint = Math.floor(dataColumns.length / 2)
      const relations = dataColumns.slice(0, halfPoint)
      const targetNodes = dataColumns.slice(halfPoint)

      // 创建边：关系和目标节点一一对应
      const edgeCount = Math.min(relations.length, targetNodes.length)
      for (let j = 0; j < edgeCount; j++) {
        const relation = relations[j]?.toString().trim()
        const targetNode = targetNodes[j]?.toString().trim()

        if (targetNode) {
          // 添加目标节点
          if (!nodeMap.has(targetNode)) {
            nodeMap.set(targetNode, {
              label: targetNode
            })
          }

          // 添加边
          edges.push({
            source: sourceNode,
            target: targetNode,
            label: relation || undefined
          })
        }
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges
    }
  }
}
