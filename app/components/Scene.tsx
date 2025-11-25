'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { OBJWithParticles, VertexParticles } from './LightArray'

export default function Scene() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const modelRotation: [number, number, number] = [
   0,                
   scrollY * 0.01,                
    0                
  ]

  return (
    <div className="w-full h-screen">
      {/* Camera Info Display */}
      <Canvas>
        <PerspectiveCamera makeDefault position={[6, 5 , 7]} />
        <OrbitControls 
          enabled={false}
          enableDamping 
          dampingFactor={0.05}
          target={[0, 0, 0]}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* 3D Objects - Rotation controlled by scroll */}
        <group position={[0, -2, 0]} scale={0.009}>
        <Suspense fallback={null}>
          <OBJWithParticles 
            modelPath="/cat.obj"
            particleColor="#00ffff"
            particleSize={0.1}         
            sampleRate={1}             
            animated={true}           
            showMesh={false}          
            rotation={modelRotation}   
            autoRotate={false}
            interactive={true}
            disperseRadius={7}
            disperseStrength={120}
            returnSpeed={1.0}
            waveAmplitude={1}
            use3DGradient={true}
            gradientColors={[
              { color: '#ff0000', position: [0, 0, 0] },      // Red - bottom-left-front
              { color: '#00FF0D', position: [0, 1, 0] },      // Blue - top-left-front
              { color: '#ff00ff', position: [0, 0, 1] },      // Magenta - bottom-left-back
              { color: '#00ffff', position: [1, 0, 1] },      // Cyan - bottom-right-back
            ]}
            gradientBlendPower={2.0}
          />
        </Suspense>
        </group>
      </Canvas>
    </div>
  )
}

