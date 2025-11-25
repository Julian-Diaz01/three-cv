import { useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

export type MaterialType = 'standard' | 'emissive' | 'neon' | 'holographic' | 'custom'

interface SpecialMaterialOptions {
  type?: MaterialType
  texturePath?: string
  color?: string
  emissiveColor?: string
  emissiveIntensity?: number
  roughness?: number
  metalness?: number
  animate?: boolean
  customShader?: {
    vertexShader?: string
    fragmentShader?: string
    uniforms?: { [key: string]: THREE.IUniform }
  }
}

/**
 * Custom hook for creating special materials with advanced effects
 */
export function useSpecialMaterial({
  type = 'standard',
  texturePath,
  color = '#ffffff',
  emissiveColor = '#00ff00',
  emissiveIntensity = 1.0,
  roughness = 0.5,
  metalness = 0.1,
  animate = false,
  customShader
}: SpecialMaterialOptions = {}) {
  const [material, setMaterial] = useState<THREE.Material | null>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  // Load texture if path is provided
  useEffect(() => {
    if (texturePath) {
      const loader = new THREE.TextureLoader()
      loader.load(
        texturePath,
        (loadedTexture) => {
          setTexture(loadedTexture)
          console.log(`Texture loaded: ${texturePath}`)
        },
        undefined,
        (error) => {
          console.warn(`Failed to load texture: ${texturePath}`, error)
        }
      )
    }
  }, [texturePath])

  // Create material based on type
  useEffect(() => {
    let newMaterial: THREE.Material

    switch (type) {
      case 'emissive':
        // Glowing material that emits light
        newMaterial = new THREE.MeshStandardMaterial({
          color,
          emissive: emissiveColor,
          emissiveIntensity,
          map: texture,
          roughness,
          metalness
        })
        break

      case 'neon':
        // Bright neon effect with no texture influence
        newMaterial = new THREE.MeshStandardMaterial({
          color,
          emissive: emissiveColor,
          emissiveIntensity: 2.0,
          roughness: 0.1,
          metalness: 0,
          toneMapped: false // Prevents tone mapping for brighter colors
        })
        break

      case 'holographic':
        // Iridescent holographic effect
        newMaterial = new THREE.MeshPhysicalMaterial({
          color,
          metalness: 0.9,
          roughness: 0.1,
          transmission: 0.5,
          thickness: 0.5,
          iridescence: 1.0,
          iridescenceIOR: 1.5,
          map: texture
        })
        break

      case 'custom':
        // Custom shader material
        if (customShader) {
          newMaterial = new THREE.ShaderMaterial({
            vertexShader: customShader.vertexShader || defaultVertexShader,
            fragmentShader: customShader.fragmentShader || defaultFragmentShader,
            uniforms: {
              time: { value: 0 },
              color: { value: new THREE.Color(color) },
              ...customShader.uniforms
            }
          })
        } else {
          // Fallback to standard if no shader provided
          newMaterial = new THREE.MeshStandardMaterial({ color, map: texture })
        }
        break

      case 'standard':
      default:
        // Standard material with texture support
        newMaterial = new THREE.MeshStandardMaterial({
          color,
          map: texture,
          roughness,
          metalness
        })
        break
    }

    setMaterial(newMaterial)

    return () => {
      newMaterial.dispose()
    }
  }, [type, color, emissiveColor, emissiveIntensity, roughness, metalness, texture, customShader])

  return { material, texture }
}

// Default shaders for custom materials
const defaultVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const defaultFragmentShader = `
  uniform float time;
  uniform vec3 color;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Animated gradient effect
    float pattern = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
    vec3 finalColor = color * (0.5 + pattern * 0.5);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

/**
 * Create a shader material with an array of lights effect
 */
export function createLightArrayMaterial(options: {
  gridSize?: [number, number]
  lightColor?: string
  backgroundColor?: string
  animate?: boolean
  transparent?: boolean
} = {}) {
  const {
    gridSize = [10, 10],
    lightColor = '#00ffff',
    backgroundColor = '#000033',
    transparent = false
  } = options

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      // Use UV if available, otherwise will use position in fragment shader
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform float time;
    uniform vec3 lightColor;
    uniform vec3 backgroundColor;
    uniform vec2 gridSize;
    uniform bool isTransparent;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;

    void main() {
      // Use position-based coordinates if UV is not available or is zero
      // This ensures the effect works on any geometry
      vec2 coords;
      if (length(vUv) < 0.001) {
        // No UVs available, use position-based coordinates
        coords = vec2(vPosition.x + vPosition.z, vPosition.y + vPosition.z) * 0.5 + 0.5;
      } else {
        // Use UV coordinates
        coords = vUv;
      }
      
      // Create grid of lights
      vec2 grid = fract(coords * gridSize);
      
      // Distance from center of each cell
      vec2 center = abs(grid - 0.5);
      float dist = length(center);
      
      // Create circular lights with animation (brighter pulse)
      float pulse = sin(time * 2.0 + coords.x * 10.0 + coords.y * 10.0) * 0.3 + 0.7;
      float light = smoothstep(0.3, 0.1, dist) * pulse;
      
      // Add some variation based on surface normal for 3D effect
      float normalEffect = abs(dot(vNormal, vec3(0.0, 0.0, 1.0))) * 0.3 + 0.7;
      light *= normalEffect;
      
      // Mix light and background colors
      vec3 finalColor = mix(backgroundColor, lightColor, light);
      
      // Set alpha based on light intensity if transparent (minimum 0.6 visibility)
      float alpha = isTransparent ? max(light, 0.6) : 1.0;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: 0 },
      lightColor: { value: new THREE.Color(lightColor) },
      backgroundColor: { value: new THREE.Color(backgroundColor) },
      gridSize: { value: new THREE.Vector2(gridSize[0], gridSize[1]) },
      isTransparent: { value: transparent }
    },
    side: THREE.DoubleSide,
    transparent: transparent,
    depthWrite: !transparent
  })
}

/**
 * Update shader material uniforms (call this in useFrame for animations)
 */
export function updateShaderTime(material: THREE.Material, deltaTime: number) {
  if (material instanceof THREE.ShaderMaterial && material.uniforms.time) {
    material.uniforms.time.value += deltaTime
  }
}

