import { Canvas } from '@react-three/fiber';
import { OrbitControls, CameraShake, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, Glitch } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import React, { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../audio/AudioContext';
import { ElementUniverse } from './ElementUniverse';

// --- Reactive Post Processing Engine ---
const AudioReactiveEffects = ({ audioDataRef, isMobile }) => {
    const bloomRef = useRef();
    const caRef = useRef();
    const glitchRef = useRef();
    // Pre-allocate vector to prevent garbage collection stutter
    const vec2 = useMemo(() => new THREE.Vector2(0, 0), []);

    useFrame(() => {
        if (!bloomRef.current || !caRef.current || !glitchRef.current || !audioDataRef.current) return;

        const audioData = audioDataRef.current;

        const presence = Number(audioData.presence) || 0.001;
        const mid = Number(audioData.mid) || 0.001;
        const subBass = Number(audioData.subBass) || 0.001;
        const bass = Math.pow(Number(audioData.bass) || 0.001, 2.0);
        const brilliance = Number(audioData.brilliance) || 0.001;

        const stateStyle = audioData.alchemicalState || 'sacred';

        // Pulsing Bloom: Glows intensely with the vocals and synths. 
        // CRITICAL FIX: To prevent "circular structure to JSON" crashes in React's patching layer, 
        // we must target the underlying Three.js Effect pass properties, NOT overwrite the React top-level getter/setters manually.
        // PHASE 10: Drastically tamed the bloom to stop the "nuclear bright" effect.
        // PHASE 12: Absolute Bloom Neutralization. We rely on the mesh emissive materials entirely.
        let nextIntensity = 0.05 + (presence * 0.1) + (mid * 0.1);
        if (!isFinite(nextIntensity) || isNaN(nextIntensity)) nextIntensity = 0.05;

        // Ensure Bloom only captures the literal brightest 1% of the screen
        let nextThreshold = Math.max(0.85, 0.98 - (mid * 0.05));
        if (!isFinite(nextThreshold) || isNaN(nextThreshold)) nextThreshold = 0.98;

        if (bloomRef.current) {
            // Some versions of postprocessing expose an intensity value uniform
            if (bloomRef.current.intensity !== undefined) {
                // Must mutate cleanly without replacing the setter instance
                if (typeof bloomRef.current.intensity === 'number') {
                    bloomRef.current.intensity = nextIntensity;
                } else if (bloomRef.current.intensity.value !== undefined) {
                    bloomRef.current.intensity.value = nextIntensity;
                }
            }
            if (bloomRef.current.luminanceMaterial !== undefined) {
                bloomRef.current.luminanceMaterial.threshold = nextThreshold;
            }
        }

        // Reactive Chromatic Aberration: diffracts the screen heavily on bass & snare impacts
        let impactPower = (subBass * 2.5) + bass + (brilliance * 1.5);

        let abberationCap = 0.08;
        if (stateStyle === 'physical') {
            impactPower *= 1.5; // 50% more sensitive in physical state
            abberationCap = 0.15; // Allows screen to tear much harder
        } else if (stateStyle === 'ethereal') {
            impactPower *= 0.2; // Severely suppress aberration in ambient moments
        }

        if (impactPower > 1.6 && isFinite(impactPower) && !isNaN(impactPower)) {
            const dist = Math.min((impactPower - 1.6) * 0.04, abberationCap);
            vec2.x = dist;
            vec2.y = dist;
        } else {
            // Explicitly step down mathematically
            vec2.x += (0 - vec2.x) * 0.1;
            vec2.y += (0 - vec2.y) * 0.1;

            if (isNaN(vec2.x) || !isFinite(vec2.x)) vec2.x = 0;
            if (isNaN(vec2.y) || !isFinite(vec2.y)) vec2.y = 0;
        }

        // Safely apply to the Chromatic Aberration Effect, depending on how the internal library exposes the offset
        if (caRef.current && caRef.current.offset) {
            if (typeof caRef.current.offset.set === 'function') {
                caRef.current.offset.set(vec2.x, vec2.y);
            } else if (Array.isArray(caRef.current.offset)) {
                caRef.current.offset[0] = vec2.x;
                caRef.current.offset[1] = vec2.y;
            } else {
                caRef.current.offset.x = vec2.x;
                caRef.current.offset.y = vec2.y;
            }
        }

        // The Quantum Glitch: Reality tearing apart
        // Only trigger on absolute maximum peaks combining heavy thunder sub/bass and sharp vocal/snare presence
        const peakRealityTear = (subBass * 1.5) + bass + (presence * 2.0);
        let glitchThreshold = 3.0; // Sacred default
        if (stateStyle === 'physical') glitchThreshold = 2.0; // Rips much easier on heavy bass tracks
        if (stateStyle === 'ethereal') glitchThreshold = 999.0; // Impossible to glitch in Ethereal

        if (peakRealityTear > glitchThreshold) {
            glitchRef.current.mode = GlitchMode.SPORADIC;
            glitchRef.current.factor = 1.0;
        } else {
            // Turn off glitch immediately when audio drops below the chaos threshold to keep the effect sparse and profound
            glitchRef.current.mode = GlitchMode.DISABLED;
            glitchRef.current.factor = 0.0;
        }

    });

    return (
        <EffectComposer disableNormalPass>
            <Bloom ref={bloomRef} luminanceThreshold={0.98} luminanceSmoothing={0.9} intensity={0.05} mipmapBlur />

            {/* The Quantum Glitch (Must sit before CA to tear the screen first) */}
            <Glitch
                ref={glitchRef}
                delay={[1.5, 3.5]} // Doesn't matter, we manually override factor
                duration={[0.1, 0.3]}
                strength={[0.3, 1.0]}
                mode={GlitchMode.DISABLED} // Start disabled
                active // The active prop must be true for our manual mode/factor overrides to be processed by the render loop
            />

            {/* The Chromatic Aberration effect sitting ready to be shocked (Disabled on Mobile for Performance) */}
            {!isMobile && (
                <ChromaticAberration ref={caRef} offset={[0, 0]} radialModulation={false} modulationOffset={0.0} />
            )}
            <Noise opacity={0.03} blendFunction={BlendFunction.SOFT_LIGHT} />
            <Vignette eskil={false} offset={0.3} darkness={0.8} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
    );
};

// 2. The Vizzy-Tier Tremor Engine
const KinematicCameraShake = ({ audioDataRef }) => {
    const shakeRef = useRef();

    useFrame((state) => {
        if (!shakeRef.current || !audioDataRef.current) return;

        const audioData = audioDataRef.current;
        const subBass = Number(audioData.subBass) || 0;
        const bass = Number(audioData.bass) || 0;
        const stateStyle = audioData.alchemicalState || 'sacred';

        // For a mystical, cinematic track, we want slow floating drift, not violent shaking
        // Tremor power pushes the drift slightly more on hits, but stays smooth
        let tremorPower = (subBass * 2.0) + bass;
        let tremorScaling = 1.0;

        if (stateStyle === 'physical') {
            tremorScaling = 2.5; // Multiply the shake violence directly
        } else if (stateStyle === 'ethereal') {
            tremorScaling = 0.2; // Practically disable jitter for smooth drone shots
        }

        shakeRef.current.setIntensity(Math.min((tremorPower * 0.3) * tremorScaling, 0.8));
    });

    return (
        <CameraShake
            ref={shakeRef}
            maxYaw={0.05}
            maxPitch={0.05}
            maxRoll={0.05}
            yawFrequency={0.5}
            pitchFrequency={0.5}
            rollFrequency={0.5}
        />
    );
};

// 3. Generative Sacred Sigils (Phase 8/9: Subliminal Anchors with 3D Depth)
const SacredSigilFlashes = ({ audioDataRef }) => {
    // Refs to control the DOM elements directly without triggering React re-renders for 60fps performance
    const metatronRef = useRef();
    const seedRef = useRef();
    const merkabaRef = useRef();
    const vectorRef = useRef();
    const sriRef = useRef();
    const flowerRef = useRef();

    // Group them for easier iteration
    const sigils = useRef([]);

    // We only need to populate the array once the refs are attached
    useFrame(() => {
        if (sigils.current.length === 0 && metatronRef.current) {
            sigils.current = [
                { ref: metatronRef, type: 'physical' },
                { ref: seedRef, type: 'ethereal' },
                { ref: merkabaRef, type: 'physical' },
                { ref: vectorRef, type: 'physical' },
                { ref: sriRef, type: 'ethereal' },
                { ref: flowerRef, type: 'ethereal' }
            ];
        }

        if (!audioDataRef.current || sigils.current.length === 0) return;

        const audioData = audioDataRef.current;
        const subBass = Number(audioData.subBass) || 0;
        const brilliance = Number(audioData.brilliance) || 0;
        const stateStyle = audioData.alchemicalState || 'sacred';

        // Check for *moderate* energy. Phase 12 requires Omnipresent Mandalas.
        // We dropped the requirement from > 0.80 down to > 0.35
        const massiveHit = (subBass > 0.35 || brilliance > 0.45);

        // Determine which sigils should be active based on state
        let targetIndex = -1;

        if (massiveHit) {
            // Filter available sigils by the current Alchemical State
            let available = sigils.current.map((s, i) => ({ ...s, index: i }));

            if (stateStyle === 'physical') {
                available = available.filter(s => s.type === 'physical');
            } else if (stateStyle === 'ethereal') {
                available = available.filter(s => s.type === 'ethereal');
            }
            // If 'sacred', all are available

            // Pick a random one from the available pool based on the current timestamp (changes every 500ms)
            const timeGatedSeed = Math.floor(Date.now() / 500);
            targetIndex = available[timeGatedSeed % available.length].index;
        }

        // Apply optical flashes and 3D CSS transforms directly to the DOM node styles
        sigils.current.forEach((sigil, index) => {
            const el = sigil.ref.current;
            if (!el) return;

            const currentOpacity = parseFloat(el.style.opacity || 0);

            if (index === targetIndex) {
                el.style.opacity = '0.85';

                // 3D CSS Projection Math
                // Generate a random stable rotation based on the current beat so it looks like it's floating at an angle
                const timeStr = Math.floor(Date.now() / 500).toString();
                const rotX = (Number(timeStr.slice(-1)) - 5) * 8; // -40deg to +40deg
                const rotY = (Number(timeStr.slice(-2, -1)) - 5) * 8;

                // The geometry punches forward on bass, pulls back on treble
                const scale = 1.0 + (subBass * 0.4) - (brilliance * 0.2);

                el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
            } else {
                // Phase 12: Omnipresent Mandalas - they fade extremely slowly and never truly vanish
                el.style.opacity = Math.max(0.2, currentOpacity - 0.015).toString();
            }
        });
    });

    return (
        <>
            <Html center zIndexRange={[100, 0]} className="pointer-events-none mix-blend-screen opacity-100">
                <div className="relative w-[1000px] h-[1000px] flex items-center justify-center perspective-[1000px]">
                    <img
                        ref={metatronRef}
                        src="/assets/sigils/metatron.svg"
                        alt="Metatron's Cube"
                        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] will-change-transform"
                        style={{ opacity: 0, transition: 'transform 0.05s ease-out' }}
                    />
                    <img
                        ref={seedRef}
                        src="/assets/sigils/seed_of_life.svg"
                        alt="Seed of Life"
                        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] will-change-transform"
                        style={{ opacity: 0, transition: 'transform 0.05s ease-out' }}
                    />
                    <img
                        ref={merkabaRef}
                        src="/assets/sigils/merkaba.svg"
                        alt="Merkaba"
                        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] will-change-transform"
                        style={{ opacity: 0, transition: 'transform 0.05s ease-out' }}
                    />
                    <img
                        ref={vectorRef}
                        src="/assets/sigils/vector_equilibrium.svg"
                        alt="Vector Equilibrium"
                        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] will-change-transform"
                        style={{ opacity: 0, transition: 'transform 0.05s ease-out' }}
                    />
                    <img
                        ref={sriRef}
                        src="/assets/sigils/sri_yantra.svg"
                        alt="Sri Yantra"
                        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] will-change-transform"
                        style={{ opacity: 0, transition: 'transform 0.05s ease-out' }}
                    />
                    <img
                        ref={flowerRef}
                        src="/assets/sigils/flower_of_life.svg"
                        alt="Flower of Life"
                        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] will-change-transform"
                        style={{ opacity: 0, transition: 'transform 0.05s ease-out' }}
                    />
                </div>
            </Html>
        </>
    );
};

// 4. The Sentient Cinematic Director (Phase 8: AI Camera Cutting)
const SentientCinematicDirector = ({ audioDataRef }) => {
    // We maintain a target spherical coordinate for buttery smooth interpolation
    const targetPos = useRef(new THREE.Spherical(12, Math.PI / 2, 0));
    const previousState = useRef('sacred');
    const cutTimer = useRef(0);

    useFrame((state, delta) => {
        if (!audioDataRef.current) return;
        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const currentState = audioData.alchemicalState || 'sacred';
        const subBass = Number(audioData.subBass) || 0;
        const kick = Number(audioData.kick) || 0;

        cutTimer.current -= delta;

        // --- Cinematic Logic ---

        // 1. Base Motion: Majestic 3D Exploratory Figure-8 Orbit
        let orbitSpeed = 0.04; // Very slow, smooth horizontal pan base

        // Propel the camera mathematically around the origin based on pure energy
        if (currentState === 'physical') {
            // Massive sweeping 360 orbits during the drop
            orbitSpeed = 0.2 + (subBass * 0.8);
        } else if (kick > 0.4) {
            // Jolt the rotation specifically on heavy kick drums
            orbitSpeed += kick * 1.5;
        }

        targetPos.current.theta += delta * orbitSpeed;
        targetPos.current.phi = (Math.PI / 2) + Math.sin(time * 0.1) * 0.3; // Gentle soaring up and down

        // 2. The Director's Cuts (State Change Events)
        if (currentState !== previousState.current && cutTimer.current <= 0) {

            if (currentState === 'physical') {
                // DROP HIT: Smoothly push in for a dramatic close up, rather than hard-snapping
                targetPos.current.radius = 7;
                // No more setFromSpherical hard cuts, allow the lerp to smoothly dive the camera in
            }
            else if (currentState === 'ethereal') {
                // AMBIENT: Glide back out to a massive wide shot
                targetPos.current.radius = 20; // Vast cosmic expanse
            }
            else {
                // SACRED: Standard majestic viewing distance
                targetPos.current.radius = 13;
            }

            previousState.current = currentState;
            cutTimer.current = 2.0; // Prevent state shifting too rapidly
        }

        // 3. Audio Reactive Pushing (Breathing with the bass)
        // We push the actual camera position back slightly on heavy bass, acting like acoustic pressure
        const acousticPressure = (Number(audioData.bass) || 0) * 0.5;
        const reactiveRadius = targetPos.current.radius + acousticPressure;

        // 4. Smooth Lerping (The Steadicam Effect)
        // Convert target spherical to Cartesian
        const targetVector = new THREE.Vector3().setFromSphericalCoords(
            reactiveRadius,
            targetPos.current.phi,
            targetPos.current.theta
        );

        // Lerp the camera towards the target position for buttery smooth tracking
        // (Unless we just hard-cut on a drop, in which case it continues smoothly from the new location)
        state.camera.position.lerp(targetVector, delta * 2.0);

        // The camera must ALWAYS perfectly track the absolute center of the Core Jewel
        state.camera.lookAt(0, 0, 0);
    });

    return null; // Component does not render pixels, only controls the camera mathematically
};

// Isolate the Canvas from the AudioProvider context re-renders.
// EffectComposer is notoriously buggy when forced to re-render dynamically, 
// causing "circular JSON" DevTools/HMR crashes when it tries to remount passes.
const VisualizerCanvas = React.memo(({ audioDataRef, isMobile }) => {
    return (
        <Canvas
            shadows={false}
            camera={{ position: [0, 0, 12], near: 0.1, far: 1000 }}
            // Extremely important for post-processing and performance
            gl={{ powerPreference: "high-performance", antialias: false, stencil: false, depth: true }}
            dpr={isMobile ? [1, 1] : [1, 2]} // Disable retina resolutions completely on mobile to prevent GPU thermal throttling
        >
            <color attach="background" args={['#000000']} />

            <Suspense fallback={null}>
                {/* The Universe Elements */}
                <ElementUniverse audioDataRef={audioDataRef} isMobile={isMobile} />

                {/* Elite Reactive Rendering */}
                <AudioReactiveEffects audioDataRef={audioDataRef} isMobile={isMobile} />
                <KinematicCameraShake audioDataRef={audioDataRef} />
                <SacredSigilFlashes audioDataRef={audioDataRef} isMobile={isMobile} />
                <SentientCinematicDirector audioDataRef={audioDataRef} />
            </Suspense>
        </Canvas>
    );
});

export const VisualizerScene = () => {
    const { audioDataRef } = useAudio();
    // A stable, lightweight check for mobile screen sizes
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <VisualizerCanvas audioDataRef={audioDataRef} isMobile={isMobile} />
        </div>
    );
};
