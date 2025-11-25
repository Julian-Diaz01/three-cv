'use client'

/**
 * Light Array Demo - Reusable Components for 3D Visualizations
 * 
 * VERTEX PARTICLES:
 * ================
 * Core component: VertexParticles - Adds glowing particles at mesh vertices
 * 
 * Usage Examples:
 * 
 * 1. With OBJ files (controlled rotation):
 *    <OBJWithParticles 
 *      modelPath="/yourModel.OBJ"
 *      particleColor="#00ffff"
 *      particleSize={0.03}
 *      sampleRate={1}
 *      animated={true}                    // Optional: enable pulsing animation
 *      showMesh={true}
 *      rotation={[rotX, rotY, rotZ]}      // Optional: control rotation externally
 *      autoRotate={false}                 // Optional: disable auto-rotation
 *    />
 * 
 * 2. With any Three.js object:
 *    const obj = useLoader(OBJLoader, '/model.OBJ')
 *    <VertexParticles 
 *      object={obj} 
 *      particleColor="#ff0000" 
 *      animated={true}           // Optional: enable pulsing animation
 *    />
 * 
 * 3. With primitives:
 *    <GeometryWithParticles 
 *      geometry={new THREE.SphereGeometry(1, 32, 32)}
 *      particleColor="#00ff00"
 *      animated={false}          // Animation is off by default
 *    />
 */

import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { createLightArrayMaterial, updateShaderTime, useSpecialMaterial } from '../hooks/useSpecialMaterial'
import { applyMaterialToObject } from '../hooks/useTexturedMaterial'

/**
 * Example: Cat Head with animated light array material
 */
export function LightArrayCube({ transparent = false }: { transparent?: boolean } = {}) {
  const groupRef = useRef<THREE.Group>(null)
  const catHead = useLoader(OBJLoader, '/cat.obj')
  const materialsRef = useRef<THREE.Material[]>([])
  
  // Create light array material
  const material = createLightArrayMaterial({
    gridSize: [8, 8],
    lightColor: '#00ffff',
    backgroundColor: '#001a33',
    transparent
  })

  // Apply material to the loaded OBJ and store references
  useEffect(() => {
    if (catHead && material) {
      // Clear previous materials
      materialsRef.current = []
      
      // Apply cloned material to each mesh
      catHead.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Clone the material for each mesh to avoid sharing issues
          const clonedMaterial = material.clone()
          child.material = clonedMaterial
          child.castShadow = true
          child.receiveShadow = true
          materialsRef.current.push(clonedMaterial)
          
          // Ensure geometry has necessary attributes
          if (child.geometry) {
            child.geometry.computeVertexNormals()
            if (!child.geometry.attributes.uv) {
              // If no UVs, the shader will use position-based coordinates
              console.log('No UVs found, using position-based coordinates')
            }
          }
        }
      })
    }
    
    // Cleanup
    return () => {
      materialsRef.current.forEach(mat => mat.dispose())
      materialsRef.current = []
    }
  }, [catHead, material])

  // Update animation time for all materials
  useFrame((state, delta) => {
    materialsRef.current.forEach(mat => {
      updateShaderTime(mat, delta)
    })
    
    // Optional: rotate the model
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
      groupRef.current.rotation.x += delta * 0.1
    }
  })

  return (
    <primitive 
      ref={groupRef}
      object={catHead} 
      scale={1}
    />
  )
}

/**
 * Example: Sphere with emissive (glowing) material
 */
export function EmissiveSphere({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const { material } = useSpecialMaterial({
    type: 'emissive',
    color: '#ff0000',
    emissiveColor: '#ff0000',
    emissiveIntensity: 2.0
  })

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Pulsing animation
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5
      if (material instanceof THREE.MeshStandardMaterial) {
        material.emissiveIntensity = 1.0 + pulse * 1.5
      }
    }
  })

  return (
    <mesh ref={meshRef} position={position} material={material || undefined}>
      <sphereGeometry args={[0.5, 32, 32]} />
    </mesh>
  )
}

/**
 * Example: Plane with neon glow effect
 */
export function NeonPlane({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const { material } = useSpecialMaterial({
    type: 'neon',
    color: '#ff00ff',
    emissiveColor: '#ff00ff'
  })

  return (
    <mesh position={position} material={material || undefined}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

/**
 * Example: Holographic/Iridescent material
 */
export function HolographicTorus({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const { material } = useSpecialMaterial({
    type: 'holographic',
    color: '#ffffff'
  })

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={position} material={material || undefined}>
      <torusGeometry args={[1, 0.4, 16, 100]} />
    </mesh>
  )
}

/**
 * Reusable component: Add glowing particles at vertices of any mesh/object
 * 
 * @param object - THREE.Object3D (mesh, group, or loaded model)
 * @param particleColor - Color of the particles
 * @param particleSize - Base size of particles
 * @param animated - Enable pulsing animation (default: false)
 * @param sampleRate - Use every Nth vertex (1 = all vertices, 2 = every other, etc.)
 */
export function VertexParticles({ 
  object,
  particleColor = '#00ffff',
  particleSize = 0.02,
  animated = false,
  sampleRate = 1
}: { 
  object: THREE.Object3D
  particleColor?: string
  particleSize?: number
  animated?: boolean
  sampleRate?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)

  // Extract vertices from the provided object
  useEffect(() => {
    if (!object) return

    const positions: number[] = []
    
    // Traverse the object and collect all vertex positions
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geom = child.geometry
        const positionAttribute = geom.attributes.position
        
        if (positionAttribute) {
          const posArray = positionAttribute.array
          
          // Sample vertices based on sampleRate
          for (let i = 0; i < posArray.length; i += 3 * sampleRate) {
            positions.push(posArray[i])     // x
            positions.push(posArray[i + 1]) // y
            positions.push(posArray[i + 2]) // z
          }
        }
      }
    })

    console.log(`Extracted ${positions.length / 3} vertices (sample rate: ${sampleRate})`)

    // Create a new geometry with the collected positions
    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )

    setGeometry(particleGeometry)

    return () => {
      particleGeometry.dispose()
    }
  }, [object, sampleRate])

  // Create particle material with custom shader for glowing effect
  const particleMaterial = useMemo(() => {
    const vertexShader = `
      uniform float time;
      uniform float size;
      uniform bool animated;
      varying vec3 vColor;
      
      void main() {
        vColor = vec3(1.0);
        
        // Animate particle size with a pulsing effect (if animated is true)
        float pulse = animated 
          ? sin(time * 2.0 + position.x * 10.0 + position.y * 10.0) * 0.5 + 1.0
          : 1.0;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `

    const fragmentShader = `
      uniform vec3 color;
      varying vec3 vColor;
      
      void main() {
        // Create circular particles
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        // Glow effect - brighter in the center
        float intensity = 1.0 - (dist * 2.0);
        intensity = pow(intensity, 2.0);
        
        vec3 finalColor = color * intensity;
        gl_FragColor = vec4(finalColor, intensity);
      }
    `

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        size: { value: particleSize },
        color: { value: new THREE.Color(particleColor) },
        animated: { value: animated }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [particleColor, particleSize, animated])

  // Animation
  useFrame((state, delta) => {
    if (animated && particleMaterial.uniforms.time) {
      particleMaterial.uniforms.time.value += delta
    }
  })

  // Cleanup
  useEffect(() => {
    return () => {
      particleMaterial.dispose()
    }
  }, [particleMaterial])

  if (!geometry) return null

  return <points ref={pointsRef} geometry={geometry} material={particleMaterial} />
}

/**
 * Example: OBJ Model with vertex particles
 * Demonstrates how to use VertexParticles with a loaded OBJ file
 */
export function OBJWithParticles({ 
  modelPath,
  particleColor = '#00ffff',
  particleSize = 0.03,
  sampleRate = 1,
  animated = false,
  showMesh = true,
  meshOpacity = 0.3,
  meshColor = '#001a33',
  rotation,
  autoRotate = false,
  rotationSpeed = 0.3
}: { 
  modelPath: string
  particleColor?: string
  particleSize?: number
  sampleRate?: number
  animated?: boolean
  showMesh?: boolean
  meshOpacity?: number
  meshColor?: string
  rotation?: [number, number, number]
  autoRotate?: boolean
  rotationSpeed?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const obj = useLoader(OBJLoader, modelPath)
  
  // Simple material for the mesh
  const meshMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: meshColor,
      transparent: meshOpacity < 1,
      opacity: meshOpacity,
      side: THREE.DoubleSide
    })
  }, [meshColor, meshOpacity])

  useEffect(() => {
    if (obj && meshMaterial && showMesh) {
      applyMaterialToObject(obj, meshMaterial, true)
    }
  }, [obj, meshMaterial, showMesh])

  // Apply external rotation if provided
  useEffect(() => {
    if (groupRef.current && rotation) {
      groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2])
    }
  }, [rotation])

  // Auto-rotate animation (optional)
  useFrame((state, delta) => {
    if (groupRef.current && autoRotate && rotationSpeed > 0) {
      groupRef.current.rotation.y += delta * rotationSpeed
    }
  })

  return (
    <group ref={groupRef}>
      {showMesh && <primitive object={obj.clone()} />}
      <VertexParticles 
        object={obj}
        particleColor={particleColor} 
        particleSize={particleSize}
        sampleRate={sampleRate}
        animated={animated}
      />
    </group>
  )
}

/**
 * Example: Primitive geometry with vertex particles
 * Shows how to use VertexParticles with any Three.js geometry
 */
export function GeometryWithParticles({
  geometry,
  particleColor = '#00ffff',
  particleSize = 0.05,
  sampleRate = 1,
  animated = false
}: {
  geometry: THREE.BufferGeometry
  particleColor?: string
  particleSize?: number
  sampleRate?: number
  animated?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  return (
    <mesh ref={meshRef}>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial visible={false} />
      {meshRef.current && (
        <VertexParticles 
          object={meshRef.current}
          particleColor={particleColor}
          particleSize={particleSize}
          sampleRate={sampleRate}
          animated={animated}
        />
      )}
    </mesh>
  )
}

