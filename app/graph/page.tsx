import KnowledgeGraph from '@/components/KnowledgeGraph'
import TopNavbar from '@/components/TopNavbar'
import NodeDetailPanel from '@/components/NodeDetailPanel'
import FloatingAddButton from '@/components/FloatingAddButton'

export default function GraphPage() {
  return (
    <main>
      <TopNavbar />
      <KnowledgeGraph />
      <NodeDetailPanel />
      <FloatingAddButton />
    </main>
  )
}
