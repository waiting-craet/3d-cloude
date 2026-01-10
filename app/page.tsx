import KnowledgeGraph from '@/components/KnowledgeGraph'
import ControlPanel from '@/components/ControlPanel'

export const runtime = 'edge'

export default function Home() {
  return (
    <main>
      <KnowledgeGraph />
      <ControlPanel />
    </main>
  )
}
