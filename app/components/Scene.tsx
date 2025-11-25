'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { OBJWithParticles, VertexParticles } from './LightArray'
import * as THREE from 'three'

// Component to display a cube with particles
function CubeWithParticles() {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <group position={[3, 0, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {meshRef.current && (
        <VertexParticles
          object={meshRef.current}
          particleColor="#00ffff"
          particleSize={0.05}
          sampleRate={0.5}
          animated={true}
        />
      )}
    </group>
  )
}

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
            particleSize={0.5}         
            sampleRate={10}             // More particles (every 5th vertex)
            animated={true}           
            showMesh={false}          
            meshOpacity={0.2}
            meshColor="#001a33"
            rotation={modelRotation}   
            autoRotate={false}         
          />
        </Suspense>
        </group>
 
        {/* Test cube with particles */}
        <CubeWithParticles />
      </Canvas>
    </div>
  )
}

