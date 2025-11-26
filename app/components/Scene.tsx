'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { GLBWithParticles, VertexParticles } from './LightArray'

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
          enabled={true}
          enableDamping 
          dampingFactor={0.05}
          target={[0, 0, 0]}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* 3D Objects - Rotation controlled by scroll */}
        <group position={[0, 1, 0]} scale={0.1}>
        <Suspense fallback={null}>
          <GLBWithParticles 
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
            waveAmplitude={1}
            use3DGradient={true}
            gradientColors={[
              { color: '#ff0000', position: [0, 0, 0] },      //  bottom-left-front corner
              { color: '#FF7300', position: [1, 0, 0] },      //  bottom-right-front corner
              { color: '#00ffff', position: [0, 1, 0] },      //  top-left-front corner
              { color: '#FF7300', position: [1, 1, 0] },      //  top-right-front corner
              { color: '#ff00ff', position: [0, 0, 1] },      //  bottom-left-back corner
              { color: '#00ffff', position: [1, 0, 1] },      //  bottom-right-back corner
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

