import { useEffect, useState } from 'react'
import * as THREE from 'three'

interface MaterialOptions {
  texturePath?: string
  fallbackColor?: string
  roughness?: number
  metalness?: number
}

/**
 * Custom hook to load a material with texture and fallback color
 * @param texturePath - Path to the texture image (optional)
 * @param fallbackColor - Fallback color if texture fails to load (default: '#04C725')
 * @param roughness - Material roughness (default: 0.5)
 * @param metalness - Material metalness (default: 0.1)
 * @returns Material object and loading status
 */
export function useTexturedMaterial({
  texturePath,
  fallbackColor = '#04C725',
  roughness = 0.5,
  metalness = 0.1
}: MaterialOptions = {}) {
  const [material, setMaterial] = useState<THREE.MeshStandardMaterial | null>(null)
  const [isTextureLoaded, setIsTextureLoaded] = useState(false)

  useEffect(() => {
    // Create fallback material with solid color
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: fallbackColor,
      roughness,
      metalness
    })

    setMaterial(fallbackMaterial)
    setIsTextureLoaded(false)

    // If texture path is provided, try to load it
    if (texturePath) {
      const textureLoader = new THREE.TextureLoader()

      textureLoader.load(
        texturePath,
        // Success callback
        (texture) => {
          const texturedMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness,
            metalness
          })
          setMaterial(texturedMaterial)
          setIsTextureLoaded(true)
          console.log(`Texture loaded successfully: ${texturePath}`)
        },
        // Progress callback
        undefined,
        // Error callback
        (error) => {
          console.warn(`Failed to load texture: ${texturePath}, using fallback color`, error)
          setIsTextureLoaded(false)
        }
      )
    }

    // Cleanup
    return () => {
      fallbackMaterial.dispose()
    }
  }, [texturePath, fallbackColor, roughness, metalness])

  return { material, isTextureLoaded }
}

/**
 * Utility function to apply material to all meshes in a 3D object
 * @param object - The 3D object (Group, Mesh, etc.)
 * @param material - The material to apply
 * @param enableShadows - Whether to enable shadows (default: true)
 */
export function applyMaterialToObject(
  object: THREE.Object3D,
  material: THREE.Material,
  enableShadows = true
) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = material
      if (enableShadows) {
        child.castShadow = true
        child.receiveShadow = true
      }
    }
  })
}

