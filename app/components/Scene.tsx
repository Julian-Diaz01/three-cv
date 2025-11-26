'use client'

import { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Model } from './Model'

export default function Scene() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const modelRotation: [number, number, number] = [0, scrollY * 0.01, 0]

  return (
    <div className="w-full h-screen">
      <Canvas>
        <PerspectiveCamera makeDefault position={[6, 5, 7]} />
        <OrbitControls 
          enabled={true}
          enableDamping 
          dampingFactor={0.05}
          target={[0, 0, 0]}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <group position={[0, 1, 0]} scale={0.1}>
          <Suspense fallback={null}>
            <Model 
              modelPath="/cat_idle.glb"
              particleColor="#00ffff"
              meshColor="#F3F3F3"
              meshOpacity={0.05}
              particleSize={0.2}         
              sampleRate={1}             
              animated={true}           
              showMesh={true}          
              rotation={modelRotation}   
              autoRotate={false}
              interactive={true}
              disperseRadius={6}
              disperseStrength={10}
              returnSpeed={1.0}
              use3DGradient={true}
              gradientColors={[
                { color: '#ff0000', position: [0, 0, 0] },
                { color: '#FF7300', position: [1, 0, 0] },
                { color: '#00ffff', position: [0, 1, 0] },
                { color: '#FF7300', position: [1, 1, 0] },
                { color: '#ff00ff', position: [0, 0, 1] },
                { color: '#00ffff', position: [1, 0, 1] },
              ]}
              gradientBlendPower={2.0}
              playAnimation={true}
              animationIndex={0}
            />
          </Suspense>
        </group>
      </Canvas>
    </div>
  )
}

