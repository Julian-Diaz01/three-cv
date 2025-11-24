import Scene from './components/Scene'

export default function Home() {
  return (
    <main className="bg-gray-900">
      <div className="fixed top-8 left-8 z-10 text-white">
        <h1 className="text-4xl font-bold mb-2">3D Portfolio</h1>
        <p className="text-gray-300">Scroll to rotate</p>
      </div>
      
      <div className="fixed inset-0">
        <Scene />
      </div>
      
      {/* Scrollable content to enable scroll-based rotation */}
      <div className="relative h-[300vh] pointer-events-none">
        <div className="sticky top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white/50 pointer-events-none">
        </div>
      </div>
    </main>
  )
}
