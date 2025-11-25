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
          {/* Mouse Interaction Settings - Fully Configurable at Component Level */}
          <OBJWithParticles 
            modelPath="/cat.obj"
            particleColor="#00ffff"
            particleSize={0.1}         
            sampleRate={1}             
            animated={true}           
            showMesh={false}          
            rotation={modelRotation}   
            autoRotate={false}
            interactive={true}              // Enable/disable mouse interaction
            disperseRadius={7}             
            disperseStrength={120}         
            returnSpeed={1.0}               // Return animation speed (higher = faster/snappier, try 2-10)
            waveAmplitude={1}             // Wave effect for organic feel (0 = none, 1 = strong)
          />
        </Suspense>
        </group>
      </Canvas>
    </div>
  )
}

