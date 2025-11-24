# 3D Portfolio

A modern 3D portfolio website built with Next.js, React, TypeScript, and Three.js.

## Features

- ⚡ Next.js 15 with App Router
- 🎨 Three.js for 3D graphics
- 🔷 React Three Fiber for declarative 3D scenes
- 🛠️ React Three Drei for useful helpers
- 💎 TypeScript for type safety
- 🎭 Tailwind CSS for styling

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
│   │   └── Scene.tsx        # Main Three.js 3D scene
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Home page
├── public/
└── package.json
```

## Technologies Used

- **Next.js** - React framework for production
- **Three.js** - JavaScript 3D library
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for React Three Fiber
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework

## Features in the Scene

- Rotating 3D cube with gradient material
- Orbit controls for camera manipulation (drag to rotate, scroll to zoom)
- Multiple light sources (ambient, directional, and point lights)
- Grid helper for spatial reference
- Smooth animations using useFrame

## Customization

You can customize the 3D scene by editing `app/components/Scene.tsx`:

- Change the cube color by modifying the `color` prop in `meshStandardMaterial`
- Adjust rotation speed by changing the delta multiplier in `useFrame`
- Add more 3D objects by creating new mesh components
- Modify lighting by adjusting light positions and intensities

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [React Three Drei Documentation](https://github.com/pmndrs/drei)

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).
