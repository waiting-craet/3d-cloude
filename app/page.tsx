import KnowledgeGraph from '@/components/KnowledgeGraph'
import ControlPanel from '@/components/ControlPanel'
import DatabasePanel from '@/components/DatabasePanel'

export default function Home() {
  return (
    <main>
      <KnowledgeGraph />
      <ControlPanel />
      <DatabasePanel />
    </main>
  )
}
