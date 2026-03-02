import { Canvas } from '@react-three/fiber';
import { OrbitControls, CameraShake, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, Glitch, HueSaturation, BrightnessContrast } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../audio/AudioContext';
import { useVisualizerConfig } from '../ui/VisualizerContext';
import { ElementUniverse, getGlobalHue } from './ElementUniverse';

// --- Reactive Post Processing Engine ---
const AudioReactiveEffects = ({ audioDataRef, isMobile, configRefs }) => {

    const bloomRef = useRef();
    const caRef = useRef();
    const glitchRef = useRef();
    const hueRef = useRef();
    const contrastRef = useRef();
    const noiseRef = useRef();
    const vignetteRef = useRef();

    // Pre-allocate vector to prevent garbage collection stutter
    const vec2 = useMemo(() => new THREE.Vector2(0, 0), []);

    useFrame(() => {
        if (!bloomRef.current || !caRef.current || !glitchRef.current || !hueRef.current || !contrastRef.current || !audioDataRef.current) return;

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
        if (configRefs?.current?.bloomGlow) nextIntensity *= configRefs.current.bloomGlow;

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

        let activeTheme = configRefs?.current?.theme || 'sacred';
        let glitchThreshold = 3.0; // Sacred default
        if (stateStyle === 'physical') glitchThreshold = 2.0; // Rips much easier on heavy bass tracks
        if (stateStyle === 'ethereal') glitchThreshold = 999.0; // Impossible to glitch in Ethereal

        // Cyberpunk Theme overrides: the simulation is fundamentally unstable
        if (activeTheme === 'cyberpunk') {
            glitchThreshold = 1.2; // Rips constantly on moderate beats
        }

        if (peakRealityTear > glitchThreshold) {
            glitchRef.current.mode = GlitchMode.SPORADIC;
            glitchRef.current.factor = activeTheme === 'cyberpunk' ? 0.3 : 1.0; // Cyberpunk should 'stutter' rather than completely tear the screen off its axis
        } else {
            // Turn off glitch immediately when audio drops below the chaos threshold to keep the effect sparse and profound
            glitchRef.current.mode = GlitchMode.DISABLED;
            glitchRef.current.factor = 0.0;
        }

    });

    // Static Color Grading mutations (Done in useFrame to avoid structural Circular JSON crashes)
    useFrame(() => {
        if (!hueRef.current || !contrastRef.current || !configRefs.current) return;

        let hueRotate = 0;
        let saturationOffset = 0;
        let brightnessOffset = 0;
        let contrastOffset = 0;
        let noiseOpacity = 0.03;
        let vignetteDarkness = 0.8;

        const activeTheme = configRefs.current.theme || 'sacred';

        if (activeTheme === 'cyberpunk') {
            // Colors are now handled organically via getGlobalHue (Green/Purple shifts)
            contrastOffset = 0.1; // +10% contrast
            noiseOpacity = 0.08; // slightly more static
            vignetteDarkness = 0.9;
        } else if (activeTheme === 'abyssal') {
            saturationOffset = -1.0; // Grayscale
            contrastOffset = 0.3; // +30% contrast
            brightnessOffset = -0.15; // Moderate darkening
            noiseOpacity = 0.25; // Massive film grain simulation
            vignetteDarkness = 1.0; // Maximum corner crushing
        }

        // Must safely set postprocessing uniforms directly in the loop
        if (typeof hueRef.current.hue === 'number') {
            hueRef.current.hue = hueRotate;
            hueRef.current.saturation = saturationOffset;
        } else if (hueRef.current.hue?.value !== undefined) {
            hueRef.current.hue.value = hueRotate;
            hueRef.current.saturation.value = saturationOffset;
        }

        if (typeof contrastRef.current.brightness === 'number') {
            contrastRef.current.brightness = brightnessOffset;
            contrastRef.current.contrast = contrastOffset;
        } else if (contrastRef.current.brightness?.value !== undefined) {
            contrastRef.current.brightness.value = brightnessOffset;
            contrastRef.current.contrast.value = contrastOffset;
        }

        if (noiseRef.current && noiseRef.current.blendMode && noiseRef.current.blendMode.opacity) {
            noiseRef.current.blendMode.opacity.value = noiseOpacity;
        }

        if (vignetteRef.current) {
            if (typeof vignetteRef.current.darkness === 'number') {
                vignetteRef.current.darkness = vignetteDarkness;
            } else if (vignetteRef.current.uniforms?.has('darkness')) {
                vignetteRef.current.uniforms.get('darkness').value = vignetteDarkness;
            }
        }

        // Force rigorous grayscale at the DOM level to strip colors from React Three Fiber AND HTML overlays simultaneously
        const rootNode = document.getElementById('visualizer-root');
        if (rootNode) {
            if (activeTheme === 'abyssal') {
                rootNode.style.filter = 'grayscale(100%)';
            } else if (rootNode.style.filter) {
                rootNode.style.filter = '';
            }
        }
    });

    return (
        <EffectComposer disableNormalPass>
            <HueSaturation ref={hueRef} />
            <BrightnessContrast ref={contrastRef} />

            <Bloom ref={bloomRef} luminanceThreshold={0.98} luminanceSmoothing={0.9} intensity={0.05} mipmapBlur />

            {/* The Quantum Glitch: Tamed vectors prevent the "camera" from appearing to spin out of control */}
            <Glitch
                ref={glitchRef}
                delay={[1.5, 3.5]}
                duration={[0.1, 0.2]}
                strength={[0.02, 0.10]} // Micro-stutters and VHS tearing
                mode={GlitchMode.DISABLED}
                active
            />

            {/* The Chromatic Aberration effect sitting ready to be shocked (Disabled on Mobile for Performance) */}
            {!isMobile && (
                <ChromaticAberration ref={caRef} offset={[0, 0]} radialModulation={false} modulationOffset={0.0} />
            )}
            <Noise ref={noiseRef} opacity={0.03} blendFunction={BlendFunction.SOFT_LIGHT} />
            <Vignette ref={vignetteRef} eskil={false} offset={0.3} darkness={0.8} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
    );
};

// 2. The Vizzy-Tier Tremor Engine
const KinematicCameraShake = ({ audioDataRef, configRefs }) => {
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

        if (configRefs?.current?.theme === 'cyberpunk') {
            tremorScaling *= 0.1; // Vastly reduced for cyberpunk as requested
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
const SacredSigilFlashes = ({ audioDataRef, configRefs }) => {
    // Refs to control the DOM elements directly without triggering React re-renders for 60fps performance
    const metatronRef = useRef();
    const seedRef = useRef();
    const merkabaRef = useRef();
    const vectorRef = useRef();
    const sriRef = useRef();
    const flowerRef = useRef();

    // Refs for Cyberpunk text overlays
    const cyber1Ref = useRef();
    const cyber2Ref = useRef();
    const cyber3Ref = useRef();
    const cyber4Ref = useRef();
    const cyber5Ref = useRef();
    const cyber6Ref = useRef();

    // Group them for easier iteration
    const sigils = useRef([]);

    // We only need to populate the array once the refs are attached
    useFrame((state) => {
        if (sigils.current.length === 0 && metatronRef.current && cyber1Ref.current) {
            sigils.current = [
                { ref: metatronRef, cyberRef: cyber1Ref, type: 'physical' },
                { ref: seedRef, cyberRef: cyber2Ref, type: 'ethereal' },
                { ref: merkabaRef, cyberRef: cyber3Ref, type: 'physical' },
                { ref: vectorRef, cyberRef: cyber4Ref, type: 'physical' },
                { ref: sriRef, cyberRef: cyber5Ref, type: 'ethereal' },
                { ref: flowerRef, cyberRef: cyber6Ref, type: 'ethereal' }
            ];
        }

        if (!audioDataRef.current || sigils.current.length === 0) return;

        const audioData = audioDataRef.current;
        const subBass = Number(audioData.subBass) || 0;
        const brilliance = Number(audioData.brilliance) || 0;
        const stateStyle = audioData.alchemicalState || 'sacred';

        // Check for *moderate* energy. Phase 12 requires Omnipresent Mandalas.
        // We dropped the requirement from > 0.80 down to > 0.35
        // Dramatically increase occurrence: constantly cycle every ~1 second (faster on high energy)
        const cycleSpeed = Math.max(0.2, 1.0 - (brilliance * 0.4) - (subBass * 0.4));
        const timeGatedSeed = Math.floor(state.clock.elapsedTime / cycleSpeed);

        let available = sigils.current.map((s, i) => ({ ...s, index: i }));
        if (stateStyle === 'physical') {
            available = available.filter(s => s.type === 'physical');
        } else if (stateStyle === 'ethereal') {
            available = available.filter(s => s.type === 'ethereal');
        }

        const targetIndex = available[timeGatedSeed % available.length]?.index || 0;
        const baseHue = getGlobalHue(state.clock.elapsedTime, audioData, 0, configRefs);


        // Apply optical flashes and 3D CSS transforms directly to the DOM node styles
        const isCyber = configRefs?.current?.theme === 'cyberpunk';
        const isAbyssal = configRefs?.current?.theme === 'abyssal';

        sigils.current.forEach((sigil, index) => {
            const el = sigil.ref.current;
            const cyberEl = sigil.cyberRef.current;
            if (!el || !cyberEl) return;

            const currentOpacity = parseFloat(el.style.opacity || 0);
            const currentCyberOpacity = parseFloat(cyberEl.style.opacity || 0);

            if (index === targetIndex && !isAbyssal) {
                // Extreme 3D CSS Projection Math
                const timeStr = Math.floor(Date.now() / 100).toString();
                // Sweep continuously
                const rotX = (Number(timeStr.slice(-2)) - 50) * 0.8;
                const rotY = (Number(timeStr.slice(-3, -1)) - 50) * 0.8;
                const rotZ = subBass * 45; // Spin on bass
                const kickBase = Number(audioData.kick) || 0;
                const zPop = subBass * 300 + kickBase * 100; // Physically punch out towards camera
                const scale = 1.0 + (subBass * 0.6) + (kickBase * 0.2) - (brilliance * 0.2);

                const transformStr = `perspective(1000px) translateZ(${zPop}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`;

                if (isCyber) {
                    el.style.opacity = '0';
                    cyberEl.style.opacity = '0.9';

                    // Generate random hex/binary/katakana string
                    const chars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
                    let str = '';
                    for (let i = 0; i < 16; i++) str += chars[Math.floor(Math.random() * chars.length)];
                    // Add line breaks
                    cyberEl.innerText = str.slice(0, 4) + '\n' + str.slice(4, 8) + '\n' + str.slice(8, 12) + '\n' + str.slice(12, 16);

                    cyberEl.style.transform = transformStr;
                } else {
                    cyberEl.style.opacity = '0';
                    el.style.opacity = '0.85';
                    // Apply dynamic solid color and deep drop-shadows
                    const hueDeg = Math.floor(baseHue * 360);
                    // Color the physical SVG shape via background-color (CSS Mask)
                    el.style.backgroundColor = `hsl(${hueDeg}, 100%, 65%)`;
                    // Double up the drop shadow for glow
                    el.style.filter = `drop-shadow(0 0 30px hsl(${hueDeg}, 100%, 50%)) drop-shadow(0 0 60px hsl(${hueDeg}, 100%, 30%))`;
                    el.style.transform = transformStr;
                }
            } else if (index === targetIndex && isAbyssal) {
                // Abyssal gets its own forced grayscale pass with depth
                const timeStr = Math.floor(Date.now() / 100).toString();
                const rotX = (Number(timeStr.slice(-2)) - 50) * 0.8;
                const rotY = (Number(timeStr.slice(-3, -1)) - 50) * 0.8;
                const zPop = subBass * 300;
                const scale = 1.0 + (subBass * 0.5);
                const transformStr = `perspective(1000px) translateZ(${zPop}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;

                cyberEl.style.opacity = '0';
                el.style.opacity = '0.85';
                el.style.backgroundColor = 'white'; // Solid white
                el.style.filter = 'drop-shadow(0 0 20px rgba(255,255,255,0.8)) drop-shadow(0 0 50px rgba(255,255,255,0.4))';
                el.style.transform = transformStr;
            } else {
                // Phase 12: Omnipresent Mandalas fade extremely slowly and never truly vanish
                el.style.opacity = isCyber || isAbyssal ? '0' : Math.max(0.2, currentOpacity - 0.015).toString();
                cyberEl.style.opacity = !isCyber || isAbyssal ? '0' : Math.max(0.0, currentCyberOpacity - 0.05).toString(); // fade out fast
            }
        });
    });

    return (
        <>
            <Html center zIndexRange={[100, 0]} className="pointer-events-none mix-blend-screen opacity-100">
                <div className="relative w-[1000px] h-[1000px] flex items-center justify-center perspective-[1000px] overflow-visible">
                    <div
                        ref={metatronRef}
                        className="absolute inset-x-0 inset-y-0 w-full h-full will-change-transform"
                        style={{
                            opacity: 0, transition: 'transform 0.05s ease-out, opacity 0.1s ease-out', backgroundColor: 'white',
                            WebkitMaskImage: 'url(/assets/sigils/metatron.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'
                        }}
                    />
                    <div ref={cyber1Ref} className="absolute inset-0 w-full h-full flex items-center justify-center font-mono font-bold text-6xl text-green-500 text-center leading-none whitespace-pre drop-shadow-[0_0_15px_rgba(0,255,0,1)] will-change-transform" style={{ opacity: 0, transition: 'transform 0.05s ease-out' }} />

                    <div
                        ref={seedRef}
                        className="absolute inset-x-0 inset-y-0 w-full h-full will-change-transform"
                        style={{
                            opacity: 0, transition: 'transform 0.05s ease-out, opacity 0.1s ease-out', backgroundColor: 'white',
                            WebkitMaskImage: 'url(/assets/sigils/seed_of_life.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'
                        }}
                    />
                    <div ref={cyber2Ref} className="absolute inset-0 w-full h-full flex items-center justify-center font-mono font-bold text-8xl text-green-400 text-center leading-none whitespace-pre drop-shadow-[0_0_25px_rgba(0,255,0,0.8)] will-change-transform" style={{ opacity: 0, transition: 'transform 0.05s ease-out' }} />

                    <div
                        ref={merkabaRef}
                        className="absolute inset-x-0 inset-y-0 w-full h-full will-change-transform"
                        style={{
                            opacity: 0, transition: 'transform 0.05s ease-out, opacity 0.1s ease-out', backgroundColor: 'white',
                            WebkitMaskImage: 'url(/assets/sigils/merkaba.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'
                        }}
                    />
                    <div ref={cyber3Ref} className="absolute inset-0 w-full h-full flex items-center justify-center font-mono font-black text-9xl text-green-300 text-center leading-none whitespace-pre drop-shadow-[0_0_35px_rgba(0,255,0,1)] will-change-transform" style={{ opacity: 0, transition: 'transform 0.05s ease-out' }} />

                    <div
                        ref={vectorRef}
                        className="absolute inset-x-0 inset-y-0 w-full h-full will-change-transform"
                        style={{
                            opacity: 0, transition: 'transform 0.05s ease-out, opacity 0.1s ease-out', backgroundColor: 'white',
                            WebkitMaskImage: 'url(/assets/sigils/vector_equilibrium.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'
                        }}
                    />
                    <div ref={cyber4Ref} className="absolute inset-0 w-full h-full flex items-center justify-center font-mono font-bold text-7xl text-green-500 text-center leading-none whitespace-pre drop-shadow-[0_0_20px_rgba(0,255,0,0.9)] will-change-transform" style={{ opacity: 0, transition: 'transform 0.05s ease-out' }} />

                    <div
                        ref={sriRef}
                        className="absolute inset-x-0 inset-y-0 w-full h-full will-change-transform"
                        style={{
                            opacity: 0, transition: 'transform 0.05s ease-out, opacity 0.1s ease-out', backgroundColor: 'white',
                            WebkitMaskImage: 'url(/assets/sigils/sri_yantra.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'
                        }}
                    />
                    <div ref={cyber5Ref} className="absolute inset-0 w-full h-full flex items-center justify-center font-mono font-black text-[10rem] text-[#00ff44] text-center leading-none whitespace-pre drop-shadow-[0_0_40px_rgba(0,255,0,1)] will-change-transform" style={{ opacity: 0, transition: 'transform 0.05s ease-out' }} />

                    <div
                        ref={flowerRef}
                        className="absolute inset-x-0 inset-y-0 w-full h-full will-change-transform"
                        style={{
                            opacity: 0, transition: 'transform 0.05s ease-out, opacity 0.1s ease-out', backgroundColor: 'white',
                            WebkitMaskImage: 'url(/assets/sigils/flower_of_life.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'
                        }}
                    />
                    <div ref={cyber6Ref} className="absolute inset-0 w-full h-full flex items-center justify-center font-mono font-bold text-[8rem] text-green-500 text-center leading-none whitespace-pre drop-shadow-[0_0_20px_rgba(0,255,0,0.8)] will-change-transform" style={{ opacity: 0, transition: 'transform 0.05s ease-out' }} />
                </div>
            </Html>
        </>
    );
};

// 4. The Sentient Cinematic Director (Phase 8: AI Camera Cutting)
const SentientCinematicDirector = ({ audioDataRef, configRefs }) => {
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
        const voice = Number(audioData.voice) || 0.001; // Vocal tracking

        cutTimer.current -= delta;

        // --- Cinematic Logic ---

        // 1. Base Motion: Majestic 3D Exploratory Figure-8 Orbit
        let orbitSpeed = 0.04; // Very slow, smooth horizontal pan base
        if (configRefs?.current?.cameraSpeed) orbitSpeed *= configRefs.current.cameraSpeed;

        // Propel the camera mathematically around the origin based on pure energy
        if (currentState === 'physical') {
            // Massive sweeping 360 orbits during the drop
            orbitSpeed = 0.2 + (subBass * 0.8);
        } else if (kick > 0.4) {
            // Jolt the rotation specifically on heavy kick drums
            orbitSpeed += kick * 1.5;
        }

        // Voice Mapping: When vocals sing, the camera majestically rotates and sweeps
        orbitSpeed += voice * 0.4;

        targetPos.current.theta += delta * orbitSpeed;

        // Voice also lifts the camera subtly higher for a more epic ascending shot
        targetPos.current.phi = (Math.PI / 2) + Math.sin(time * 0.1) * 0.3 - (voice * 0.15);

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
const VisualizerCanvas = React.memo(({ audioDataRef, isMobile, configRefs }) => {
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
                <ElementUniverse audioDataRef={audioDataRef} isMobile={isMobile} configRefs={configRefs} />

                {/* Elite Reactive Rendering */}
                <AudioReactiveEffects audioDataRef={audioDataRef} isMobile={isMobile} configRefs={configRefs} />
                <KinematicCameraShake audioDataRef={audioDataRef} configRefs={configRefs} />
                <SacredSigilFlashes audioDataRef={audioDataRef} configRefs={configRefs} />
                <SentientCinematicDirector audioDataRef={audioDataRef} configRefs={configRefs} />
            </Suspense>
        </Canvas>
    );
});


const MatrixRainOverlay = ({ configRefs }) => {
    const canvasRef = useRef(null);
    const dropsRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const columns = Math.ceil(canvas.width / 20);
            dropsRef.current = Array.from({ length: columns }).fill(0).map(() => Math.random() * -100);
        };
        resize();
        window.addEventListener('resize', resize);

        const katakana = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const alphabet = katakana + latin + nums;

        let animationFrameId;

        const draw = () => {
            if (configRefs?.current?.theme === 'cyberpunk') {
                if (canvas.style.opacity === '0') canvas.style.opacity = '0.6';

                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.font = '20px monospace';

                for (let i = 0; i < dropsRef.current.length; i++) {
                    if (Math.random() > 0.95) ctx.fillStyle = '#a855f7'; // purple
                    else ctx.fillStyle = '#22c55e'; // green

                    const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                    ctx.fillText(text, i * 20, dropsRef.current[i] * 20);

                    if (dropsRef.current[i] * 20 > canvas.height && Math.random() > 0.975) {
                        dropsRef.current[i] = 0;
                    }
                    dropsRef.current[i]++;
                }
            } else {
                if (canvas.style.opacity !== '0') {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    canvas.style.opacity = '0';
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    // Renders as a true background overlay
    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ opacity: 0, zIndex: 10, transition: 'opacity 0.5s' }} />;
};

export const VisualizerScene = () => {
    const { audioDataRef } = useAudio();
    const { configRefs } = useVisualizerConfig(); // Context is completely sealed, so this never causes a re-render.

    // A stable, lightweight check for mobile screen sizes
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div id="visualizer-root" className="absolute inset-0 w-full h-full z-0">
            <MatrixRainOverlay configRefs={configRefs} />
            <VisualizerCanvas audioDataRef={audioDataRef} isMobile={isMobile} configRefs={configRefs} />
        </div>
    );
};
