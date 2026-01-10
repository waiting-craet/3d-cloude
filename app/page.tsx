import KnowledgeGraph from '@/components/KnowledgeGraph'
import TopNavbar from '@/components/TopNavbar'
import NodeDetailPanel from '@/components/NodeDetailPanel'

export default function Home() {
  return (
    <main>
      <TopNavbar />
      <KnowledgeGraph />
      <NodeDetailPanel />
    </main>
  )
}
