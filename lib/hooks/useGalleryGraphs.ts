import useSWR from 'swr'
import { GraphCard, FilterType, PaginatedResponse } from '@/lib/types/homepage-gallery'

interface UseGalleryGraphsOptions {
  page?: number
  pageSize?: number
  filters?: FilterType[]
  sort?: 'latest' | 'popular' | 'trending'
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('获取图谱列表失败')
  return res.json()
})

export function useGalleryGraphs(options: UseGalleryGraphsOptions = {}) {
  const {
    page = 1,
    pageSize = 20,
    filters = [],
    sort = 'latest',
  } = options

  // 构建查询参数
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sort,
  })

  // 添加类型筛选参数
  if (filters.length > 0) {
    params.set('type', filters[0]) // 单选模式，只取第一个
  }

  const url = `/api/gallery/graphs?${params}`

  // 使用 SWR 进行数据获取和缓存
  const { data, error, isLoading, mutate } = useSWR<{ data: PaginatedResponse<GraphCard> }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 60 秒内不重复请求
      focusThrottleInterval: 300000, // 5 分钟内不重新验证
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  return {
    data: data?.data || null,
    isLoading,
    error: error?.message || null,
    mutate, // 允许手动重新验证
  }
}
