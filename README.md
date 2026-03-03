<br/>
<div align="center">
<a href="https://visualizer.awarenessparadox.com">
<img src="https://visualizer.awarenessparadox.com/og-image.png" alt="Awareness Paradox | Interactive Audio Visualizer" width="100%">
</a>
</div>

# Awareness Paradox | Interactive Audio Visualizer

An elite, high-performance WebGL audio visualization engine. This project translates raw audio data into breathtaking 3D metaphysical and sacred geometry environments in true 60fps real-time.

Built utilizing a custom high-resolution Fast Fourier Transform (FFT) audio engine, the visualizer dissects audio tracks into 7 distinct frequency bands (Sub-bass, Bass, Low-Mid, Mid, High-Mid, Presence, Brilliance) and physically maps them to individual components of a complex procedural 3D world.

[**Experience the Visualizer Live**](https://visualizer.awarenessparadox.com/)

---

## 🌌 Core Features

### 🎛️ Elite Audio Engine
- **Granular Transient Detection:** Captures instantaneous percussion impacts with zero latency.
- **7-Band Frequency Isolation:** Maps specific instruments (kicks, snares, strings, synths) to isolated geometric elements.
- **The Alchemical State Engine:** A mathematical running-average buffer that classifies genre on the fly, smoothly shifting the visualizer between "Physical" (heavy bass), "Ethereal" (ambient pads), and "Sacred" (balanced) states.

### 📐 WebGL & Procedural Geometry
- **Zero-Latency Instancing:** Employs `THREE.InstancedMesh` for rendering thousands of overlapping platonic solids, fractals, and wireframes with virtually zero dropped frames.
- **Metaphysical Architecture:** Explore intricate 3D representations of Metatron's Cube, Sierpinski fractals, Merkaba intersecting tetrahedrons, and the Flower of Life.
- **Responsive Post-Processing:** Bloom thresholds, chromatic aberration distortion, and camera movement inertia are all dynamically driven by track intensity.

### 🎭 Curated Thematic Skins
The engine ships with three distinct visual paradigms that completely overhaul the post-processing stack and geometry:
1. **Sacred Alchemy:** A majestic, deep-space environment that cycles through curated celestial hues (Mystic Purple, Alchemical Magenta, Celestial Blue, Solar Amber).
2. **Cyberpunk Matrix:** A harsh, high-contrast digital realm dominated by Matrix greens, aggressive digital rain, and CRT/VHS glitch tearing artifacts.
3. **Abyssal Void:** A strict, monochrome voyage into a black hole featuring immense atmospheric scale and terrifying film grain.

---

## 🛠️ Technology Stack

- **[React 18](https://react.dev/)**
- **[Three.js](https://threejs.org/)** & **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)**
- **[@react-three/drei](https://github.com/pmndrs/drei)** & **[@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[Vite](https://vitejs.dev/)**

---

## 🚀 Getting Started

To run this visualizer locally and experience the hyper-reactive geometry for yourself:

```bash
# Clone the repository
git clone https://github.com/jnsilva-labs/awarenessparadox-visualizer.git

# Navigate into the project
cd awarenessparadox-visualizer

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Then open `http://localhost:5173` in your browser. Drag and drop any `.mp3` file, or select a microphone input, to begin the visualization.
