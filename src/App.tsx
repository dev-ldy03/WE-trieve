import { Outlet } from 'react-router-dom'
import TabBar from './components/TabBar.tsx'

export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-cream shadow-xl">
      <main className="flex-1 px-5 pt-6 pb-28">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
