'use client'

/**
 * Interactive Particle System
 * 
 * MOUSE INTERACTION CONTROLS:
 * ===========================
 * 
 * disperseRadius - Defines the AREA of mouse influence (in world space units)
 *   - Smaller values = mouse affects only nearby particles
 *   - Larger values = mouse affects particles from farther away
 *   - Example: disperseRadius={7} means particles within 7 units are affected
 * 
 * disperseStrength - How FAR particles move away from the mouse
 *   - Higher values = particles move farther
 *   - Lower values = subtle displacement
 *   - Example: disperseStrength={100} for strong displacement
 * 
 * returnSpeed - How FAST particles return to original position
 *   - Higher values (8-10) = snappy, quick return
 *   - Lower values (2-3) = slow, floaty return
 *   - Default: 5.0 for balanced physics
 * 
 * waveAmplitude - Adds organic WAVE motion to dispersal
 *   - 0 = no wave effect
 *   - 0.5 = subtle wave (default)
 *   - 1.0+ = strong wave pattern
 * 
 * Usage Example:
 * <OBJWithParticles 
 *   interactive={true}
 *   disperseRadius={7}        // ← CONTROLS MOUSE INTERACTION AREA
 *   disperseStrength={100}
 *   returnSpeed={5.0}
 *   waveAmplitude={0.5}
 * />
 */

import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { createLightArrayMaterial, updateShaderTime, useSpecialMaterial } from '../hooks/useSpecialMaterial'
import { applyMaterialToObject } from '../hooks/useTexturedMaterial'



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
  sampleRate = 1,
  interactive = false,
  disperseRadius = 2.0,
  disperseStrength = 1.5,
  returnSpeed = 3.0,
  waveAmplitude = 0.3
}: { 
  object: THREE.Object3D
  particleColor?: string
  particleSize?: number
  animated?: boolean
  sampleRate?: number
  interactive?: boolean
  disperseRadius?: number
  disperseStrength?: number
  returnSpeed?: number
  waveAmplitude?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const { camera, size } = useThree()
  const mouseRef = useRef(new THREE.Vector2(9999, 9999)) // Start offscreen
  const mouse3DRef = useRef(new THREE.Vector3(9999, 9999, 9999))
  const velocitiesRef = useRef<Float32Array | null>(null)

  // Mouse tracking for interactive mode
  useEffect(() => {
    if (!interactive) return

    const handleMouseMove = (event: MouseEvent) => {
      // Convert to normalized device coordinates (-1 to +1)
      mouseRef.current.x = (event.clientX / size.width) * 2 - 1
      mouseRef.current.y = -(event.clientY / size.height) * 2 + 1

      // Project mouse position to 3D space
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouseRef.current, camera)
      
      // Project to a plane at distance from camera
      const distance = 7 // Approximate distance to the model
      const direction = raycaster.ray.direction.clone().multiplyScalar(distance)
      mouse3DRef.current.copy(camera.position).add(direction)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [interactive, camera, size])

  // Extract vertices from the provided object
  useEffect(() => {
    if (!object) return

    const positions: number[] = []
    const originalPositions: number[] = [] // Store original positions for restoration
    
    // Traverse the object and collect all vertex positions
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geom = child.geometry
        const positionAttribute = geom.attributes.position
        
        if (positionAttribute) {
          const posArray = positionAttribute.array
          
          // Sample vertices based on sampleRate
          for (let i = 0; i < posArray.length; i += 3 * sampleRate) {
            const x = posArray[i]
            const y = posArray[i + 1]
            const z = posArray[i + 2]
            
            positions.push(x, y, z)
            originalPositions.push(x, y, z)
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
    // Store original positions as a custom attribute for the shader
    particleGeometry.setAttribute(
      'originalPosition',
      new THREE.Float32BufferAttribute(originalPositions, 3)
    )
    
    // Initialize current displacement for smooth interpolation (all zeros initially)
    const displacements = new Float32Array(positions.length)
    particleGeometry.setAttribute(
      'currentDisplacement',
      new THREE.BufferAttribute(displacements, 3)
    )
    
    // Store velocities for smooth physics-based motion
    velocitiesRef.current = new Float32Array(positions.length)

    setGeometry(particleGeometry)

    return () => {
      particleGeometry.dispose()
      velocitiesRef.current = null
    }
  }, [object, sampleRate])

  // Create particle material with custom shader for glowing effect
  const particleMaterial = useMemo(() => {
    const vertexShader = `
      uniform float time;
      uniform float size;
      uniform bool animated;
      uniform bool interactive;
      uniform vec3 mousePos;
      uniform float disperseRadius;
      uniform float disperseStrength;
      uniform float waveAmplitude;
      
      attribute vec3 originalPosition;
      attribute vec3 currentDisplacement;
      varying vec3 vColor;
      varying float vDistanceFromMouse;
      
      // Simple 3D noise function for organic movement
      float noise3D(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }
      
      // Smooth easing function (ease out cubic)
      float easeOutCubic(float t) {
        float f = t - 1.0;
        return f * f * f + 1.0;
      }
      
      // Ease in-out for smoother transitions
      float easeInOutQuad(float t) {
        return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
      }
      
      void main() {
        vColor = vec3(1.0);
        
        // Use the smoothly interpolated displacement from CPU
        vec3 pos = originalPosition + currentDisplacement;
        float distanceInfluence = 0.0;
        
        // Calculate distance influence for size variation
        if (interactive) {
          vec4 worldPos = modelMatrix * vec4(originalPosition, 1.0);
          float dist = distance(worldPos.xyz, mousePos);
          vDistanceFromMouse = dist;
          
          if (dist < disperseRadius) {
            float influence = 1.0 - (dist / disperseRadius);
            distanceInfluence = easeOutCubic(influence);
          }
        }
        
        // Animate particle size with pulsing effect and interaction
        float pulse = animated 
          ? sin(time * 2.0 + originalPosition.x * 10.0 + originalPosition.y * 10.0) * 0.5 + 1.0
          : 1.0;
        
        // Particles grow slightly when dispersed for more dynamic feel
        float sizeMultiplier = 1.0 + distanceInfluence * 0.5;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * pulse * sizeMultiplier * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `

    const fragmentShader = `
      uniform vec3 color;
      varying vec3 vColor;
      varying float vDistanceFromMouse;
      
      void main() {
        // Create circular particles
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        // Glow effect - brighter in the center
        float intensity = 1.0 - (dist * 2.0);
        intensity = pow(intensity, 2.0);
        
        // Slight color shift when near mouse for extra visual feedback
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
        animated: { value: animated },
        interactive: { value: interactive },
        mousePos: { value: new THREE.Vector3(9999, 9999, 9999) },
        disperseRadius: { value: disperseRadius },
        disperseStrength: { value: disperseStrength },
        waveAmplitude: { value: waveAmplitude }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [particleColor, particleSize, animated, interactive, disperseRadius, disperseStrength, waveAmplitude])

  // Animation and mouse tracking update
  useFrame((state, delta) => {
    if (animated && particleMaterial.uniforms.time) {
      particleMaterial.uniforms.time.value += delta
    }
    
    // Update mouse position in shader
    if (interactive && particleMaterial.uniforms.mousePos) {
      particleMaterial.uniforms.mousePos.value.copy(mouse3DRef.current)
    }
    
    // Smooth interpolation for particle displacement (physics-based easing)
    if (interactive && geometry && velocitiesRef.current && pointsRef.current) {
      const displacementAttr = geometry.getAttribute('currentDisplacement') as THREE.BufferAttribute
      const originalPosAttr = geometry.getAttribute('originalPosition') as THREE.BufferAttribute
      const velocities = velocitiesRef.current
      
      if (displacementAttr && originalPosAttr) {
        const mousePos = mouse3DRef.current
        
        // Update each particle's displacement with smooth physics
        for (let i = 0; i < displacementAttr.count; i++) {
          const idx = i * 3
          
          // Get original position
          const ox = originalPosAttr.array[idx]
          const oy = originalPosAttr.array[idx + 1]
          const oz = originalPosAttr.array[idx + 2]
          
          // Transform to world space
          const worldPos = new THREE.Vector3(ox, oy, oz)
          worldPos.applyMatrix4(pointsRef.current.matrixWorld)
          
          // Calculate distance from mouse
          const dist = worldPos.distanceTo(mousePos)
          
          // Target displacement
          let targetX = 0, targetY = 0, targetZ = 0
          
          if (dist < disperseRadius) {
            // Calculate direction away from mouse
            const direction = new THREE.Vector3().subVectors(worldPos, mousePos).normalize()
            const influence = Math.pow(1.0 - (dist / disperseRadius), 2)
            
            // Add some variation
            const time = state.clock.elapsedTime
            const noise = Math.sin(ox * 0.1 + time) * 0.3
            
            targetX = direction.x * influence * disperseStrength * (1 + noise)
            targetY = direction.y * influence * disperseStrength * (1 + noise)
            targetZ = direction.z * influence * disperseStrength * (1 + noise)
          }
          
          // Current displacement
          const currentX = displacementAttr.array[idx]
          const currentY = displacementAttr.array[idx + 1]
          const currentZ = displacementAttr.array[idx + 2]
          
          // Spring physics for smooth return (higher returnSpeed = faster return)
          const springStrength = returnSpeed
          const damping = 0.8
          
          velocities[idx] += (targetX - currentX) * springStrength * delta
          velocities[idx + 1] += (targetY - currentY) * springStrength * delta
          velocities[idx + 2] += (targetZ - currentZ) * springStrength * delta
          
          // Apply damping
          velocities[idx] *= damping
          velocities[idx + 1] *= damping
          velocities[idx + 2] *= damping
          
          // Update displacement
          displacementAttr.array[idx] += velocities[idx] * delta * 60
          displacementAttr.array[idx + 1] += velocities[idx + 1] * delta * 60
          displacementAttr.array[idx + 2] += velocities[idx + 2] * delta * 60
        }
        
        displacementAttr.needsUpdate = true
      }
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
  rotationSpeed = 0.3,
  interactive = false,
  disperseRadius = 2.0,
  disperseStrength = 1.5,
  returnSpeed = 3.0,
  waveAmplitude = 0.3
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
  interactive?: boolean
  disperseRadius?: number
  disperseStrength?: number
  returnSpeed?: number
  waveAmplitude?: number
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
        interactive={interactive}
        disperseRadius={disperseRadius}
        disperseStrength={disperseStrength}
        returnSpeed={returnSpeed}
        waveAmplitude={waveAmplitude}
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

