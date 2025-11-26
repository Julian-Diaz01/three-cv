# 3D Portfolio

A modern 3D portfolio website featuring animated particle effects, GLB model loading, and interactive 3D gradients built with Next.js, React, TypeScript, and Three.js.

## Features

- ⚡ Next.js 15 with App Router
- 🎨 Three.js for 3D graphics
- 🔷 React Three Fiber for declarative 3D scenes
- 🛠️ React Three Drei for useful helpers
- 💎 TypeScript for type safety
- 🎭 Tailwind CSS for styling
- ✨ Custom shader-based particle system
- 🎮 Interactive mouse-driven particle dispersion
- 🌈 3D multi-color gradient system
- 🎬 GLB/GLTF model animation support
- 📜 Scroll-based model rotation

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
3d-portfolio/
├── app/
│   ├── components/
│   │   ├── Model.tsx       # GLB model loader with animations
│   │   ├── Particles.tsx   # Particle system with shaders
│   │   └── Scene.tsx       # Main 3D scene setup
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Home page
├── public/
│   └── cat_idle.glb        # 3D model file
└── package.json
```

## Technologies Used

- **Next.js** - React framework for production
- **Three.js** - JavaScript 3D library
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for React Three Fiber
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **Custom GLSL Shaders** - For particle effects and gradients

## Scene Features

### 🎬 Animated GLB Models
- Loads and displays GLTF/GLB 3D models
- Supports skeletal animation with automatic skinning
- Configurable mesh visibility and opacity
- Scroll-based rotation control

### ✨ Particle System
- Vertex-based particles extracted from 3D models
- Custom shader materials with glow effects
- Pulsing animation for particles
- Follows skeletal animation in real-time

### 🎮 Mouse Interaction
- Particles disperse away from mouse cursor
- Smooth physics-based movement with spring dynamics
- Configurable dispersion radius and strength
- Smooth return to original positions

### 🌈 3D Gradient System
- Multi-color gradients with up to 8 colors
- Distance-based color blending in 3D space
- Configurable blend power for smooth or sharp transitions
- Colors positioned in normalized 3D coordinates

### 🎛️ Controls
- Orbit controls for camera manipulation
- Scroll to rotate the model
- Mouse interaction with particles
- Smooth damped camera movements

## Customization

### Model Component

```tsx
<Model 
  modelPath="/your-model.glb"
  particleColor="#00ffff"
  particleSize={0.2}
  animated={true}
  interactive={true}
  disperseRadius={6}
  disperseStrength={10}
  use3DGradient={true}
  gradientColors={[
    { color: '#ff0000', position: [0, 0, 0] },
    { color: '#00ffff', position: [1, 1, 1] },
  ]}
  playAnimation={true}
/>
```

### Key Props

- `modelPath` - Path to your GLB/GLTF model file
- `particleColor` - Base color for particles
- `particleSize` - Size of individual particles
- `sampleRate` - Vertex sampling (1 = all vertices, 2 = every other, etc.)
- `animated` - Enable particle pulsing animation
- `interactive` - Enable mouse interaction
- `disperseRadius` - Mouse interaction radius
- `disperseStrength` - How far particles move away
- `use3DGradient` - Enable multi-color gradient
- `gradientColors` - Array of colors with 3D positions
- `gradientBlendPower` - Gradient smoothness (1-2 = smooth, 3-5 = sharp)

