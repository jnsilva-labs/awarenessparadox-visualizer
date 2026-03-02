import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// --- The Cinematic Color Journey ---
// Generates a shifting base hue that slowly travels through four specific "Alchemical" colors.
// PHASE 12: Heavily influenced by subBass drops to create instant, aggressive color palette shifts.
const getGlobalHue = (time, audioData, offset = 0) => {
    // 60-second cycle for a slow, majestic color journey
    const cycleTime = 60.0;

    // Calculate aggressive bass offset. 
    // We square the subBass so small kicks do nothing, but massive drops warp the entire dimension.
    let bassColorWarp = 0;
    if (audioData) {
        const subBass = Number(audioData.subBass) || 0;
        bassColorWarp = Math.pow(subBass, 2.0) * 0.4; // Can push the hue up to 40% across the spectrum instantly
    }

    const progress = ((time % cycleTime) / cycleTime); // 0.0 to 1.0

    // The Sacred Palette
    // 0.75 = Mystic Purple
    // 0.90 = Alchemical Magenta
    // 0.50 = Ethereal Teal / Cyan
    // 0.12 = Sacred Gold / Brass
    const stops = [0.75, 0.90, 0.50, 0.12];

    const segment = progress * stops.length;
    const index = Math.floor(segment);
    const nextIndex = (index + 1) % stops.length;
    const segmentProgress = segment - index;

    // Smooth Sine interpolation for buttery, non-linear color shifting
    const ease = (1 - Math.cos(segmentProgress * Math.PI)) / 2;

    // Lerp between the two stops
    const h1 = stops[index];
    const h2 = stops[nextIndex];

    // Handle wrap-around gracefully if we jump from 0.9 to 0.1
    let lerpedHue;
    if (Math.abs(h1 - h2) > 0.5) {
        let altH2 = h2 > h1 ? h2 - 1.0 : h2 + 1.0;
        lerpedHue = h1 + (altH2 - h1) * ease;
        if (lerpedHue < 0) lerpedHue += 1.0;
        if (lerpedHue > 1) lerpedHue -= 1.0;
    } else {
        lerpedHue = h1 + (h2 - h1) * ease;
    }

    // Apply steady offset + violent bass warp
    return (lerpedHue + offset + bassColorWarp) % 1.0;
};

// --- Phase 13: The 3D Merkaba (Star Tetrahedron) ---
// Two overlapping, intersecting tetrahedrons that spin independently within the core
const MerkabaShell = ({ audioDataRef, baseHue }) => {
    const groupRef = useRef();
    const upTetraRef = useRef();
    const downTetraRef = useRef();

    useFrame((state) => {
        if (!groupRef.current || !upTetraRef.current || !downTetraRef.current || !audioDataRef.current) return;

        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const brilliance = Number(audioData.brilliance) || 0;
        const midReactivity = Number(audioData.mid) || 0;

        // The entire Merkaba rotates majestically
        groupRef.current.rotation.y = time * 0.4;
        groupRef.current.rotation.z = time * 0.2;

        // The internal tetrahedrons counter-rotate slightly for a complex mechanical feel
        upTetraRef.current.rotation.y = time * 0.5 + (brilliance * 0.2);
        downTetraRef.current.rotation.y = -time * 0.5 - (brilliance * 0.2);

        // Flash intensely on mid/high hits
        const pulse = 1.0 + (midReactivity * 0.4);
        groupRef.current.scale.set(pulse, pulse, pulse);

        const glow = 0.4 + (brilliance * 1.5);
        upTetraRef.current.material.color.setHSL((baseHue + 0.1) % 1.0, 1.0, 0.6);
        upTetraRef.current.material.emissive.setHSL((baseHue + 0.1) % 1.0, 1.0, 0.5);
        upTetraRef.current.material.emissiveIntensity = glow;

        downTetraRef.current.material.color.setHSL((baseHue - 0.1 + 1.0) % 1.0, 1.0, 0.6);
        downTetraRef.current.material.emissive.setHSL((baseHue - 0.1 + 1.0) % 1.0, 1.0, 0.5);
        downTetraRef.current.material.emissiveIntensity = glow;
    });

    return (
        <group ref={groupRef}>
            {/* Upward pointing tetrahedron */}
            <mesh ref={upTetraRef}>
                <tetrahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" />
            </mesh>
            {/* Downward pointing tetrahedron (inverted) */}
            <mesh ref={downTetraRef} rotation={[Math.PI, 0, 0]}>
                <tetrahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" />
            </mesh>
        </group>
    );
};

// 1. The Morphing Sacred Core (Stationary, deeply evolving Platonic Solids)
const EvolvingSacredCore = ({ audioDataRef }) => {
    const torusRef = useRef();
    const dodecaRef = useRef();
    const icosaRef = useRef();
    const coreJewelRef = useRef();
    const groupRef = useRef();

    useFrame((state) => {
        if (!torusRef.current || !dodecaRef.current || !icosaRef.current || !coreJewelRef.current || !groupRef.current || !audioDataRef.current) return;

        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const midReactivity = Number(audioData.mid) || 0;
        const lowMid = Number(audioData.lowMid) || 0;
        const presence = Number(audioData.presence) || 0;
        const stateStyle = audioData.alchemicalState || 'sacred';

        // --- Alchemical State Overrides ---
        let baseHue = getGlobalHue(time, audioDataRef.current);
        let spinSpeedMulti = 1.0;

        if (stateStyle === 'physical') {
            // Aggressive Trap/Dubstep State: Lock colors primarily to Cyan/Magenta but allow bass warping
            baseHue = (0.5 + (Math.pow(Number(audioData.subBass) || 0, 2) * 0.4)) % 1.0;
            spinSpeedMulti = 2.0; // Spin twice as fast
        } else if (stateStyle === 'ethereal') {
            // Ambient / Classical State: Lock colors to Mystic Purple and pulse slowly
            baseHue = (0.75 + (Math.pow(Number(audioData.subBass) || 0, 2) * 0.2)) % 1.0;
            spinSpeedMulti = 0.3; // Spin very slowly
        }

        // Use a complementary hue for dramatic contrast
        let complementaryHue = (baseHue + 0.5) % 1.0;
        if (stateStyle === 'physical') complementaryHue = 0.85; // Force Magenta contrast for physical
        if (stateStyle === 'ethereal') complementaryHue = 0.12; // Force Gold contrast for ethereal

        // Majestic spin
        groupRef.current.rotation.y = time * 0.15 * spinSpeedMulti;
        groupRef.current.rotation.x = time * 0.1 * spinSpeedMulti;

        // Beating heart scale - very reactive to kick and piano
        const pulse = 1.0 + (Number(audioData.kick) || 0) * 1.5 + (Number(audioData.piano) || 0) * 0.5;
        if (isFinite(pulse) && !isNaN(pulse)) {
            groupRef.current.scale.set(pulse, pulse, pulse);
        }

        // Crossfade opacities for organic morphing
        const phase1 = (Math.sin(time * 0.8) + 1) / 2;
        const phase2 = (Math.sin(time * 0.8 + 2.094) + 1) / 2;
        const phase3 = (Math.sin(time * 0.8 + 4.188) + 1) / 2;

        // Torus - Glowing Energy Ring (Mapped exclusively to Kick)
        const kick = Number(audioData.kick) || 0;
        torusRef.current.material.opacity = phase1 * 0.7 + 0.1;
        torusRef.current.material.emissiveIntensity = phase1 * 0.4 + (kick * 1.5) + 0.2;
        torusRef.current.scale.setScalar(1.0 + phase1 * 0.4 + (kick * 0.5));
        torusRef.current.material.color.setHSL(complementaryHue, 1.0, 0.5);
        torusRef.current.material.emissive.setHSL(complementaryHue, 1.0, 0.4);

        // Dodecahedron - Glassy Core (Mapped exclusively to Piano / sustained mediums)
        const piano = Number(audioData.piano) || 0;
        dodecaRef.current.material.opacity = phase2 * 0.8 + 0.3;
        dodecaRef.current.material.emissiveIntensity = phase2 * 0.3 + (piano * 1.2) + 0.2;
        dodecaRef.current.scale.setScalar(1.4 + phase2 * 0.3 + (piano * 0.3));
        dodecaRef.current.material.color.setHSL((complementaryHue + 0.1) % 1.0, 1.0, 0.4);
        dodecaRef.current.material.emissive.setHSL((complementaryHue + 0.1) % 1.0, 1.0, 0.3);

        // Icosahedron - Outer Shell (Mapped exclusively to Snare)
        const snare = Number(audioData.snare) || 0;
        icosaRef.current.material.opacity = phase3 * 0.6 + 0.1;
        icosaRef.current.material.emissiveIntensity = phase3 * 0.4 + (snare * 2.5) + 0.2;
        icosaRef.current.scale.setScalar(1.8 + phase3 * 0.3 + (snare * 0.6));
        icosaRef.current.material.color.setHSL((baseHue - 0.1 + 1.0) % 1.0, 1.0, 0.4);
        icosaRef.current.material.emissive.setHSL((baseHue - 0.1 + 1.0) % 1.0, 1.0, 0.4);

        // Inner Jewel - Solid glowing massive core (Mapped to HiHats / extreme transients)
        const hihat = Number(audioData.hihat) || 0;
        coreJewelRef.current.material.emissiveIntensity = 0.2 + (hihat * 3.0);
        coreJewelRef.current.material.emissive.setHSL(baseHue, 1.0, 0.5);
        coreJewelRef.current.rotation.y = time * 0.8;
        coreJewelRef.current.rotation.x = time * -0.5;
        coreJewelRef.current.scale.setScalar(1.0 + (hihat * 1.5));
    });

    return (
        <group ref={groupRef}>
            <mesh ref={torusRef}>
                <torusGeometry args={[2.5, 0.1, 32, 100]} />
                <meshStandardMaterial wireframe transparent blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            <mesh ref={dodecaRef}>
                <dodecahedronGeometry args={[1.8, 0]} />
                <meshPhysicalMaterial
                    transparent
                    transmission={0.9}
                    opacity={1}
                    roughness={0.1}
                    thickness={1.5}
                    depthWrite={false}
                    iridescence={1.0}           // Enable absolute maximum iridescence interference 
                    iridescenceIOR={1.8}        // High index of refraction for severe rainbow scattering
                    iridescenceThicknessRange={[100, 800]} // Wide thickness variance for intense color pooling
                    clearcoat={1.0}             // Add a hard glossy shell
                    clearcoatRoughness={0.0}
                />
            </mesh>
            <mesh ref={icosaRef}>
                <icosahedronGeometry args={[2.2, 1]} />
                <meshStandardMaterial wireframe transparent blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            {/* Grounding inner bright jewel - totally opaque and massively glowing */}
            <mesh ref={coreJewelRef}>
                <icosahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} depthWrite={true} />
            </mesh>
        </group>
    );
};

// 1.5 Sierpinski Triangle Fractal
const SierpinskiFractal = ({ audioDataRef }) => {
    const instancedRef = useRef();
    const groupRef = useRef();
    const DEPTH = 5; // 1024 tetrahedrons, excellent density without crashing
    const RADIUS = 15;
    const NUM_INSTANCES = Math.pow(4, DEPTH);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const centers = useMemo(() => {
        const pts = [];
        const r = RADIUS;
        // Standard tetrahedral vertices inscribed in sphere
        const v0 = [0, r, 0];
        const v1 = [r * Math.sqrt(8 / 9), r * -1 / 3, 0];
        const v2 = [r * -Math.sqrt(2 / 9), r * -1 / 3, r * Math.sqrt(2 / 3)];
        const v3 = [r * -Math.sqrt(2 / 9), r * -1 / 3, r * -Math.sqrt(2 / 3)];

        const generate = (d, p0, p1, p2, p3) => {
            if (d === 0) {
                const cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;
                const cy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;
                const cz = (p0[2] + p1[2] + p2[2] + p3[2]) / 4;
                pts.push([cx, cy, cz]);
                return;
            }
            const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
            const m01 = mid(p0, p1);
            const m02 = mid(p0, p2);
            const m03 = mid(p0, p3);
            const m12 = mid(p1, p2);
            const m13 = mid(p1, p3);
            const m23 = mid(p2, p3);

            generate(d - 1, p0, m01, m02, m03);
            generate(d - 1, m01, p1, m12, m13);
            generate(d - 1, m02, m12, p2, m23);
            generate(d - 1, m03, m13, m23, p3);
        };
        generate(DEPTH, v0, v1, v2, v3);
        return pts;
    }, []);

    useEffect(() => {
        if (!instancedRef.current) return;
        const scale = RADIUS * Math.pow(0.5, DEPTH);
        centers.forEach((pos, i) => {
            dummy.position.set(pos[0], pos[1], pos[2]);
            dummy.scale.setScalar(scale);
            // Tetrahedron geometry default bounds fit perfectly if we rotate slightly
            dummy.rotation.x = Math.PI / 4;
            dummy.updateMatrix();
            instancedRef.current.setMatrixAt(i, dummy.matrix);
        });
        instancedRef.current.instanceMatrix.needsUpdate = true;
    }, [centers, dummy]);

    useFrame((state) => {
        if (!instancedRef.current || !groupRef.current || !audioDataRef.current) return;
        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const fastHit = Number(audioData.presence) || 0;

        // Very slow majestic rotation, offset from core
        groupRef.current.rotation.y = time * -0.05 + (fastHit * 0.1);
        groupRef.current.rotation.x = Math.sin(time * 0.02) * 0.2;

        const baseHue = getGlobalHue(time, audioDataRef.current, 0.4);
        instancedRef.current.material.color.setHSL(baseHue, 1.0, 0.5);
        instancedRef.current.material.emissive.setHSL(baseHue, 1.0, 0.5);
        instancedRef.current.material.emissiveIntensity = 0.5 + fastHit * 2.0;
        // Keep it highly transparent so it looks like ethereal math in the void
        instancedRef.current.material.opacity = 0.15 + fastHit * 0.3;
    });

    return (
        <group ref={groupRef}>
            <instancedMesh ref={instancedRef} args={[null, null, NUM_INSTANCES]}>
                <tetrahedronGeometry args={[1, 0]} />
                <meshStandardMaterial wireframe transparent blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ff00ff" emissiveIntensity={2} />
            </instancedMesh>
        </group>
    );
};

// 2. Fibonacci Particle System (Highs & Percussion)
const FibonacciSpirals = ({ audioDataRef }) => {
    const pointsRef = useRef();

    // 10,000 points spanning deep massive space
    const { positions, colors } = useMemo(() => {
        const count = 10000;
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);

        const phi = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;

            const spread = 25.0; // Huge depth
            const vortexRadius = radius * spread * (1.0 + Math.abs(y) * 1.5);

            pos[i * 3] = Math.cos(theta) * vortexRadius;
            pos[i * 3 + 1] = y * spread;
            pos[i * 3 + 2] = Math.sin(theta) * vortexRadius;

            // Default color, will be tinted by material in useFrame
            col[i * 3] = 1.0;
            col[i * 3 + 1] = 1.0;
            col[i * 3 + 2] = 1.0;
        }
        return { positions: pos, colors: col };
    }, []);

    // Inertia engine properties for smooth spin dampening
    const velocityRef = useRef(0.05);

    useFrame((state) => {
        if (!pointsRef.current || !audioDataRef.current) return;

        const audioData = audioDataRef.current;
        const brilliance = Number(audioData.brilliance) || 0.001;
        const highMid = Number(audioData.highMid) || 0.001;
        const time = state.clock.elapsedTime;

        // Custom Inertia Engine: cymbals/highs drastically speed it up, then it smoothly decays back to base speed
        if (brilliance > 0.6) {
            velocityRef.current += (brilliance * 0.005); // Accelerate
            // Cap max velocity so it doesn't spin completely out of control
            velocityRef.current = Math.min(velocityRef.current, 0.4);
        }
        // Smoothly decay back to standard idle rotation
        velocityRef.current = THREE.MathUtils.lerp(velocityRef.current, 0.02, 0.05);

        // Apply velocities
        pointsRef.current.rotation.y += velocityRef.current;
        pointsRef.current.rotation.z = Math.sin(time * 0.05) * 0.1 + (highMid * 0.1);

        const scale = 1.0 + (highMid * 0.1) + Math.pow(brilliance, 2.0) * 0.5;
        if (isFinite(scale) && !isNaN(scale) && scale > 0) {
            pointsRef.current.scale.set(scale, scale, scale);
        }

        if (pointsRef.current.material) {
            // Soften flashes: Opacity capped lower, size bounded
            pointsRef.current.material.opacity = 0.2 + brilliance * 0.4; // Softened
            pointsRef.current.material.size = 0.08 + (brilliance * 0.15); // Softened

            // Tint the entire particle system with the evolving global hue
            const baseHue = getGlobalHue(time, audioDataRef.current, 0.4);
            pointsRef.current.material.color.setHSL(baseHue, 0.8, 0.6);
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.1}
                vertexColors
                transparent
                opacity={0.3}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
};

// 3. Lightning Flashes (Sub-Bass Reactivity) - The stable original version
const LightningFlashes = ({ audioDataRef }) => {
    const flashRef = useRef();

    useFrame(() => {
        if (!flashRef.current || !audioDataRef.current) return;

        const audioData = audioDataRef.current;
        const snare = Number(audioData.snare) || 0;

        // Massive white flash on pure sharp snare/clap impacts
        const impact = snare * 5.0;

        // Stably react to the audio impact
        if (impact > 1.5 && isFinite(impact) && !isNaN(impact)) {
            flashRef.current.intensity = Math.min(impact * 2.0, 5.0); // Capped at 5.0 intensity
        } else {
            // Safe mathematical decay to zero without creating subnormal floats
            const nextIntensity = flashRef.current.intensity * 0.8;
            flashRef.current.intensity = Math.max(0, isFinite(nextIntensity) ? nextIntensity : 0);
        }
    });

    return (
        <directionalLight
            ref={flashRef}
            position={[0, 10, 5]}
            intensity={0}
            color="white"
        />
    );
};

// 4. Sacred Shockwaves (Sub-Bass Detonation)
const SacredShockwaves = ({ audioDataRef }) => {
    const shockRef = useRef();
    const NUM_RINGS = 3;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Track each ring's lifecycle
    const ringStates = useRef(Array.from({ length: NUM_RINGS }, () => ({
        active: false,
        scale: 0.1,
        opacity: 0,
        matrixIndex: 0
    })));

    useFrame((state, delta) => {
        if (!shockRef.current || !audioDataRef.current) return;

        const audioData = audioDataRef.current;
        const kick = Number(audioData.kick) || 0;

        // Very strict threshold for detonating a new shockwave from true Kick drum attacks
        if (kick > 0.3) {
            // Find a dead ring and ignite it
            const deadRing = ringStates.current.find(r => !r.active);
            if (deadRing) {
                deadRing.active = true;
                deadRing.scale = 1.0;
                deadRing.opacity = 0.8;
                // Color is updated dynamically based on time
            }
        }

        const baseHue = getGlobalHue(state.clock.elapsedTime, audioDataRef.current);

        // Update all rings
        ringStates.current.forEach((ring, i) => {
            if (ring.active) {
                // Expanding outward rapidly
                ring.scale += delta * 40.0;

                // Opacity decays sharply. CRITICAL: Math.max against sub-normals!
                ring.opacity = Math.max(0.001, ring.opacity * 0.9);

                // If fully faded, kill the ring
                if (ring.opacity <= 0.01) {
                    ring.active = false;
                    ring.scale = 0.001; // hide it
                }

                dummy.position.set(0, 0, 0);
                dummy.scale.setScalar(ring.scale);
                dummy.rotation.x = state.clock.elapsedTime * 0.5 + i;
                dummy.rotation.y = state.clock.elapsedTime * 0.2;
                dummy.updateMatrix();

                shockRef.current.setMatrixAt(i, dummy.matrix);
            }
        });

        shockRef.current.instanceMatrix.needsUpdate = true;

        // Update global shockwave material
        shockRef.current.material.color.setHSL(baseHue, 1.0, 0.5);
        shockRef.current.material.emissive.setHSL(baseHue, 1.0, 0.5);
        // Bind the brightest ring's opacity to the global emissive intensity to prevent uniform bloat
        const maxOpacity = Math.max(...ringStates.current.map(r => r.opacity));
        shockRef.current.material.opacity = Math.max(0.001, maxOpacity);
        shockRef.current.material.emissiveIntensity = Math.max(0.001, maxOpacity * 3.0);
    });

    return (
        <instancedMesh ref={shockRef} args={[null, null, NUM_RINGS]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
                wireframe
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </instancedMesh>
    );
};

// 5. Floating Geometries (Background Environment)
const FloatingSacredGeometry = ({ audioDataRef }) => {
    const dodecaRef = useRef();
    const icosaRef = useRef();
    const torusRef = useRef();

    const NUM_SOLIDS = 40;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Randomize initial positions in a massive sphere around the local origin
    const { positions, rotations, scales } = useMemo(() => {
        const pos = [];
        const rot = [];
        const sca = [];
        for (let i = 0; i < NUM_SOLIDS; i++) {
            pos.push([
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 20 - 10
            ]);
            rot.push([
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ]);
            sca.push(Math.random() * 0.5 + 0.5);
        }
        return { positions: pos, rotations: rot, scales: sca };
    }, []);

    useEffect(() => {
        if (!dodecaRef.current || !icosaRef.current || !torusRef.current) return;
        const refs = [dodecaRef.current, icosaRef.current, torusRef.current];

        for (let i = 0; i < NUM_SOLIDS; i++) {
            dummy.position.set(...positions[i]);
            dummy.rotation.set(...rotations[i]);
            dummy.scale.setScalar(scales[i]);
            dummy.updateMatrix();

            // Scatter them evenly among the three groups
            const targetGroup = refs[i % 3];
            targetGroup.setMatrixAt(Math.floor(i / 3), dummy.matrix);
        }
        refs.forEach(r => { r.instanceMatrix.needsUpdate = true; });
    }, [dummy, positions, rotations, scales]);

    useFrame((state) => {
        if (!dodecaRef.current || !icosaRef.current || !torusRef.current || !audioDataRef.current) return;

        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const subBass = Number(audioData.subBass) || 0.001;
        const highMid = Number(audioData.highMid) || 0.001;

        // Groups rotate agonizingly slowly naturally, but jolt on specific frequencies
        dodecaRef.current.rotation.x = time * 0.02 + (subBass * 0.1);
        dodecaRef.current.rotation.y = time * 0.03;

        icosaRef.current.rotation.y = -time * 0.025 + (highMid * 0.1);
        icosaRef.current.rotation.z = time * 0.015;

        torusRef.current.rotation.x = time * 0.01;
        torusRef.current.rotation.z = -time * 0.02;

        const baseHue = getGlobalHue(time, audioDataRef.current, 0.7);
        // Pulse glow on bass
        dodecaRef.current.material.emissiveIntensity = 0.5 + (subBass * 2.0);
        dodecaRef.current.material.color.setHSL(baseHue, 0.5, 0.3);
        dodecaRef.current.material.emissive.setHSL(baseHue, 0.5, 0.3);
    });

    return (
        <group>
            <instancedMesh ref={dodecaRef} args={[null, null, Math.ceil(NUM_SOLIDS / 3)]}>
                <dodecahedronGeometry args={[2, 0]} />
                <meshStandardMaterial wireframe emissiveIntensity={1.0} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
            </instancedMesh>
            <instancedMesh ref={icosaRef} args={[null, null, Math.ceil(NUM_SOLIDS / 3)]}>
                <icosahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial wireframe color="cyan" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
            </instancedMesh>
            <instancedMesh ref={torusRef} args={[null, null, Math.ceil(NUM_SOLIDS / 3)]}>
                <torusGeometry args={[1.5, 0.4, 8, 24]} />
                <meshStandardMaterial wireframe color="magenta" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
            </instancedMesh>
        </group>
    );
};

// 5.5 Sacred Mantles (Phase 11: The Secret Geometry World)
const SacredWireframeMantles = ({ audioDataRef }) => {
    const groupRef = useRef();
    const icosaRef = useRef();
    const tetraRef = useRef();
    const scaffoldLinesRef = useRef();

    // 300 total geometries forming a dense 3D wireframe shell
    const NUM_GEOMETRIES = 120;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Form dense concentric shells around the core
    const { icosaPositions, icosaRotations, tetraPositions, tetraRotations, scaffoldLineGeometry } = useMemo(() => {
        const ip = [];
        const ir = [];
        const tp = [];
        const tr = [];

        // Phase 13: Metatron's Scaffold nodes mapping
        const allNodes = [];

        for (let i = 0; i < NUM_GEOMETRIES; i++) {
            // Icosahedron Shell (Inner Mantle, Radius 3.5 - 5.5)
            const radiusI1 = 3.5 + Math.random() * 2.0;
            const thetaI1 = Math.random() * Math.PI * 2;
            const phiI1 = Math.acos(2 * Math.random() - 1);
            const ix = radiusI1 * Math.sin(phiI1) * Math.cos(thetaI1);
            const iy = radiusI1 * Math.sin(phiI1) * Math.sin(thetaI1);
            const iz = radiusI1 * Math.cos(phiI1);
            ip.push([ix, iy, iz]);
            ir.push([Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]);
            allNodes.push(new THREE.Vector3(ix, iy, iz));

            // Tetrahedron Shell (Outer Mantle, Radius 5.5 - 9.0)
            const radiusT1 = 5.5 + Math.random() * 3.5;
            const thetaT1 = Math.random() * Math.PI * 2;
            const phiT1 = Math.acos(2 * Math.random() - 1);
            const tx = radiusT1 * Math.sin(phiT1) * Math.cos(thetaT1);
            const ty = radiusT1 * Math.sin(phiT1) * Math.sin(thetaT1);
            const tz = radiusT1 * Math.cos(phiT1);
            tp.push([tx, ty, tz]);
            tr.push([Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]);
            allNodes.push(new THREE.Vector3(tx, ty, tz));
        }

        // Generate the Scaffold Lines connecting nearest neighbors (Metatron concept)
        const linePositions = [];
        for (let i = 0; i < allNodes.length; i++) {
            for (let j = i + 1; j < allNodes.length; j++) {
                const dist = allNodes[i].distanceTo(allNodes[j]);
                // If they are physically close, draw a strict metaphysical connector line between them
                if (dist > 1.0 && dist < 3.5) {
                    linePositions.push(
                        allNodes[i].x, allNodes[i].y, allNodes[i].z,
                        allNodes[j].x, allNodes[j].y, allNodes[j].z
                    );
                }
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

        return {
            icosaPositions: ip,
            icosaRotations: ir,
            tetraPositions: tp,
            tetraRotations: tr,
            scaffoldLineGeometry: geo
        };
    }, []);

    useEffect(() => {
        if (!icosaRef.current || !tetraRef.current) return;

        for (let i = 0; i < NUM_GEOMETRIES; i++) {
            dummy.position.set(...icosaPositions[i]);
            dummy.rotation.set(...icosaRotations[i]);
            dummy.scale.setScalar(Math.random() * 0.4 + 0.3);
            dummy.updateMatrix();
            icosaRef.current.setMatrixAt(i, dummy.matrix);

            dummy.position.set(...tetraPositions[i]);
            dummy.rotation.set(...tetraRotations[i]);
            dummy.scale.setScalar(Math.random() * 0.5 + 0.3);
            dummy.updateMatrix();
            tetraRef.current.setMatrixAt(i, dummy.matrix);
        }
        icosaRef.current.instanceMatrix.needsUpdate = true;
        tetraRef.current.instanceMatrix.needsUpdate = true;
    }, [dummy, icosaPositions, icosaRotations, tetraPositions, tetraRotations]);

    useFrame((state) => {
        if (!groupRef.current || !audioDataRef.current || !icosaRef.current || !tetraRef.current) return;

        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const midReactivity = Number(audioData.mid) || 0;
        const subBass = Number(audioData.subBass) || 0;
        const stateStyle = audioData.alchemicalState || 'sacred';

        // Majestic, multi-axis rotation that slowly peels the layers
        let speed = 0.05;
        if (stateStyle === 'physical') speed = 0.15;
        if (stateStyle === 'ethereal') speed = 0.02;

        groupRef.current.rotation.y = time * speed;
        groupRef.current.rotation.x = time * (speed * 0.5);

        const baseHue = getGlobalHue(time, audioDataRef.current, 0.4);
        const compHue = (baseHue + 0.5) % 1.0;

        // Gently pulse the wireframes - they must strictly avoid blowing out
        const innerGlow = 0.5 + (Number(audioData.piano) || 0) * 1.2 + (Number(audioData.kick) || 0) * 1.5;
        const outerGlow = 0.3 + (Number(audioData.piano) || 0) * 0.8 + (Number(audioData.snare) || 0) * 1.5;

        icosaRef.current.material.color.setHSL(baseHue, 1.0, 0.5);
        icosaRef.current.material.emissive.setHSL(baseHue, 1.0, 0.5);
        icosaRef.current.material.emissiveIntensity = innerGlow * 0.3; // Very low multipliers
        icosaRef.current.material.opacity = Math.min(0.5, 0.15 + (innerGlow * 0.1));

        tetraRef.current.material.color.setHSL(compHue, 1.0, 0.5);
        tetraRef.current.material.emissive.setHSL(compHue, 1.0, 0.5);
        tetraRef.current.material.emissiveIntensity = outerGlow * 0.2;
        tetraRef.current.material.opacity = Math.min(0.4, 0.1 + (outerGlow * 0.1));

        // Connective Lines flash violently on highs
        if (scaffoldLinesRef.current) {
            scaffoldLinesRef.current.material.color.setHSL(baseHue, 1.0, 0.6);
            const highHit = Number(audioData.hihat) || 0; // Purely hihat transients
            scaffoldLinesRef.current.material.opacity = Math.min(0.6, 0.05 + (highHit * 1.5));
        }
    });

    return (
        <group ref={groupRef}>
            <instancedMesh ref={icosaRef} args={[null, null, NUM_GEOMETRIES]}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial wireframe transparent blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} opacity={0.3} />
            </instancedMesh>
            <instancedMesh ref={tetraRef} args={[null, null, NUM_GEOMETRIES]}>
                <tetrahedronGeometry args={[1, 0]} />
                <meshStandardMaterial wireframe transparent blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} opacity={0.2} />
            </instancedMesh>
            {/* Phase 13: Metatron's Scaffold Lines connecting the nodes */}
            <lineSegments ref={scaffoldLinesRef} geometry={scaffoldLineGeometry}>
                <lineBasicMaterial transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} color="#ffffff" />
            </lineSegments>
        </group>
    );
};

// 6. Brass & Pads Frames (Drifting peripheral sacred geometry reacting to sustained chords)
const DriftingPadGeometries = ({ audioDataRef }) => {
    const groupRef = useRef();
    const meshRef = useRef();

    const NUM_GEOMETRIES = 60;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Scatter completely away from the center core
    const { positions, rotations, scales } = useMemo(() => {
        const pos = [];
        const rot = [];
        const sca = [];
        for (let i = 0; i < NUM_GEOMETRIES; i++) {
            // Push towards the edges using radial distribution excluding the core
            const radius = 18 + Math.random() * 30; // 18 to 48 radius far away
            const theta = Math.random() * Math.PI * 2;
            const y = (Math.random() - 0.5) * 40;

            pos.push([
                Math.cos(theta) * radius,
                y,
                Math.sin(theta) * radius - 10
            ]);
            rot.push([
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ]);
            sca.push(Math.random() * 2.0 + 1.0);
        }
        return { positions: pos, rotations: rot, scales: sca };
    }, []);

    useEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < NUM_GEOMETRIES; i++) {
            dummy.position.set(...positions[i]);
            dummy.rotation.set(...rotations[i]);
            dummy.scale.setScalar(scales[i]);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [dummy, positions, rotations, scales]);

    useFrame((state) => {
        if (!meshRef.current || !audioDataRef.current || !groupRef.current) return;

        const sustain = Number(audioDataRef.current.strings) || 0;
        const stateStyle = audioDataRef.current.alchemicalState || 'sacred';
        const time = state.clock.elapsedTime;

        let spinSpeed = 0.05;
        let scaleMulti = 1.0;

        if (stateStyle === 'physical') {
            // Physical state entirely hides the soft drifting pads to focus purely on the heavy geometry
            scaleMulti = 0.001;
        } else if (stateStyle === 'ethereal') {
            // Ethereal state makes these massive and spin slightly faster
            scaleMulti = 3.0;
            spinSpeed = 0.1;
        }

        groupRef.current.rotation.y = time * spinSpeed; // Slow ambient orbit around the entire scene
        groupRef.current.rotation.x = time * (spinSpeed * 0.4);

        // Fade in completely from invisibility and glow massively depending solely on pads
        const intensity = sustain * 4.0;
        meshRef.current.material.opacity = Math.min(0.7, intensity * 0.25);
        meshRef.current.material.emissiveIntensity = Math.min(3.0, intensity);

    });

    return (
        <group ref={groupRef}>
            <instancedMesh ref={meshRef} args={[null, null, NUM_GEOMETRIES]}>
                <dodecahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial wireframe transparent blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" emissiveIntensity={0} />
            </instancedMesh>
        </group>
    );
};

// 7. Volumetric Audio Nebula (Phase 8: Dense interactive background dust)
const VolumetricAudioNebula = ({ audioDataRef }) => {
    const pointsRef = useRef();

    const PARTICLES = 8000;

    // Distribute particles in a massive spherical shell, leaving the center hollow
    const positions = useMemo(() => {
        const pos = new Float32Array(PARTICLES * 3);
        const radiusMin = 25;
        const radiusOffset = 55;
        for (let i = 0; i < PARTICLES; i++) {
            const radius = radiusMin + Math.random() * radiusOffset; // Hollow center
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = radius * Math.cos(phi);
        }
        return pos;
    }, []);

    useFrame((state) => {
        if (!pointsRef.current || !audioDataRef.current) return;

        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const subBass = Number(audioData.subBass) || 0;
        const bass = Number(audioData.bass) || 0;
        const stateStyle = audioData.alchemicalState || 'sacred';

        // Slow cinematic drift
        pointsRef.current.rotation.y = time * 0.02;
        pointsRef.current.rotation.x = time * 0.01;

        // Nebular Glow Mechanics
        let baseHue = getGlobalHue(time, audioDataRef.current, 0.5); // Offset hue for contrast
        let intensityBase = 0.5;

        if (stateStyle === 'physical') {
            baseHue = 0.9; // Magenta dominance
            intensityBase = 2.0; // Brighter default
            pointsRef.current.rotation.y = time * 0.05; // Swirls faster
        } else if (stateStyle === 'ethereal') {
            baseHue = 0.75; // Deep Purple
            intensityBase = 0.2; // Very dark and moody
        }

        // Pulse the nebula fiercely on bass impacts, but keep it dark overall
        const swell = intensityBase + (subBass * 1.5) + (bass * 0.5);

        pointsRef.current.material.color.setHSL(baseHue, 1.0, 0.3); // Darker base color
        pointsRef.current.material.opacity = Math.min(0.4, swell * 0.08); // Halved max opacity
        pointsRef.current.material.size = Math.min(4.0, 1.0 + (swell * 1.0)); // Slightly smaller particles
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={PARTICLES}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            {/* Custom glowing soft particle material */}
            <pointsMaterial
                size={1.5}
                color="#ffffff"
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={true}
                opacity={0.15} // Darker default
            />
        </points>
    );
};



// 8. The Void Wormhole (Endless Z-Axis Tunnel)
const VoidWormhole = ({ audioDataRef }) => {
    const tunnelRef = useRef();
    const NUM_RINGS = 25;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Z positions array to maintain persistent locations
    const ringZ = useRef(Array.from({ length: NUM_RINGS }, (_, i) => -i * 15 - 20));

    useFrame((state, delta) => {
        if (!tunnelRef.current || !audioDataRef.current) return;
        const audioData = audioDataRef.current;
        // The tunnel hauls forward extremely aggressively on hard kicks/bass
        const speedMultiplier = 1.0 + (Number(audioData.bass) * 4.0);

        const baseHue = getGlobalHue(state.clock.elapsedTime, audioDataRef.current, 0.3); // Offset pushes towards purples

        ringZ.current.forEach((z, i) => {
            // Move forward toward the camera
            let nextZ = z + (delta * 15.0 * speedMultiplier);
            // If passes near camera (Z > -10), reset deep into the back of the tunnel
            if (nextZ > -10) nextZ -= (NUM_RINGS * 15);
            ringZ.current[i] = nextZ;

            dummy.position.set(0, 0, nextZ);

            // Rings warp slightly on mids
            const scaleWarp = 1.0 + (Number(audioData.lowMid) * 0.5);
            dummy.scale.set(scaleWarp, scaleWarp, 1.0);

            // Spin slowly
            dummy.rotation.z = state.clock.elapsedTime * 0.05 + (i * 0.1);
            dummy.updateMatrix();
            tunnelRef.current.setMatrixAt(i, dummy.matrix);
        });

        tunnelRef.current.instanceMatrix.needsUpdate = true;

        tunnelRef.current.material.color.setHSL(baseHue, 1.0, 0.2);
        tunnelRef.current.material.emissive.setHSL(baseHue, 1.0, 0.2);
        tunnelRef.current.material.emissiveIntensity = 0.5 + (Number(audioData.bass) * 2.0);
    });

    return (
        <instancedMesh ref={tunnelRef} args={[null, null, NUM_RINGS]}>
            <torusGeometry args={[30, 0.1, 4, 32]} />
            <meshStandardMaterial wireframe transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
        </instancedMesh>
    );
};

// 9. Alchemical Dust (Massive atmospheric foreground particles)
const AlchemicalDust = ({ audioDataRef }) => {
    const dustRef = useRef();
    const NUM_PARTICLES = 2500;

    const { positions, randomFactors } = useMemo(() => {
        const pos = new Float32Array(NUM_PARTICLES * 3);
        const factors = new Float32Array(NUM_PARTICLES);
        for (let i = 0; i < NUM_PARTICLES; i++) {
            // Spread widely across X/Y but heavily biased toward the camera on Z
            pos[i * 3] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20 + 5; // (-5 to 15 closer to camera)

            factors[i] = Math.random(); // Unique drift speed
        }
        return { positions: pos, randomFactors: factors };
    }, []);

    useFrame((state, delta) => {
        if (!dustRef.current || !audioDataRef.current) return;

        const audioData = audioDataRef.current;
        const subBass = Number(audioData.subBass) || 0.001;
        const time = state.clock.elapsedTime;
        const positions = dustRef.current.geometry.attributes.position.array;

        // Animate dust drifting slowly upwards & swirling
        for (let i = 0; i < NUM_PARTICLES; i++) {
            const factor = randomFactors[i];

            // Haul upward based on subBass impacts
            positions[i * 3 + 1] += delta * (0.5 + factor + (subBass * 5.0));
            // Slight horizontal sway
            positions[i * 3] += Math.sin(time * factor) * delta * 0.5;

            // Loop Y positions back down when they float too high
            if (positions[i * 3 + 1] > 20) {
                positions[i * 3 + 1] = -20;
            }
        }

        dustRef.current.geometry.attributes.position.needsUpdate = true;

        const baseHue = getGlobalHue(time, audioDataRef.current, 0.1); // Warm gold offset
        dustRef.current.material.color.setHSL(baseHue, 1.0, 0.6);
        // Size pulses slightly with high-mids
        dustRef.current.material.size = 0.05 + (Number(audioData.highMid) * 0.05);
    });

    return (
        <points ref={dustRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={NUM_PARTICLES}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                sizeAttenuation
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
};

// 7. Golden Ratio Lattice (Phase 13: 3D Phyllotaxis)
// Replaces the flat spirals with a dense spherical lattice mapped via the Golden Angle
const GoldenRatioLattice = ({ audioDataRef }) => {
    const meshRef = useRef();
    const NUM_PARTICLES = 300;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Pre-calculate the spherical phyllotaxis positions
    const points = useMemo(() => {
        const pts = [];
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

        for (let i = 0; i < NUM_PARTICLES; i++) {
            // Y goes from 1 to -1
            const y = 1 - (i / (NUM_PARTICLES - 1)) * 2;
            const radiusAtY = Math.sqrt(1 - y * y);
            const theta = goldenAngle * i;

            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            pts.push(new THREE.Vector3(x, y, z));
        }
        return pts;
    }, []);

    useFrame((state) => {
        if (!meshRef.current || !audioDataRef.current) return;

        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const hihat = Number(audioData.hihat) || 0;
        const stateStyle = audioData.alchemicalState || 'sacred';

        const baseHue = getGlobalHue(time, audioDataRef.current);

        // Entire sphere breathes and slowly rotates
        meshRef.current.rotation.y = time * 0.05;
        meshRef.current.rotation.x = time * 0.03;

        // Base scale expands massive on high frequency hits (like cymbals/hihats)
        const reactScale = 1.0 + (hihat * 1.5);
        meshRef.current.scale.setScalar(reactScale);

        let particleScale = 0.04;
        if (stateStyle === 'ethereal') particleScale = 0.08;

        for (let i = 0; i < NUM_PARTICLES; i++) {
            const p = points[i];

            // Introduce a rolling wave through the lattice based on index and time
            const wave = Math.sin((i * 0.1) - (time * 2.0)) * 0.5 + 0.5;
            const dynamicRadius = 18 + (wave * 2.0) + (hihat * 5.0);

            dummy.position.copy(p).multiplyScalar(dynamicRadius);

            // Particles point outward relative to the center
            dummy.lookAt(0, 0, 0);

            // Pulsing scale
            const scale = particleScale * (1.0 + (wave * 0.5));
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;

        meshRef.current.material.color.setHSL((baseHue + 0.3) % 1.0, 1.0, 0.6);
        meshRef.current.material.emissive.setHSL((baseHue + 0.3) % 1.0, 1.0, 0.5);
        meshRef.current.material.emissiveIntensity = 0.5 + (hihat * 3.0);
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, NUM_PARTICLES]}>
            <coneGeometry args={[1, 2, 4]} /> {/* Pyramid shape pointing inwards */}
            <meshStandardMaterial wireframe transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" />
        </instancedMesh>
    );
};

// 10. Interactive Cursor Ripple (Phase 8: User Presence)
const InteractiveCursorRipple = ({ audioDataRef }) => {
    const meshRef = useRef();
    const NUM_ORBS = 40; // Length of the trail
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Maintain a history of previous mouse positions to create a snake/trail effect
    const trailHistory = useRef(Array(NUM_ORBS).fill({ x: 0, y: 0, z: -50 })); // Start hidden deep back

    useFrame((state) => {
        if (!meshRef.current) return;

        // Convert normalized device coordinates (-1 to +1) to 3D space relative to the camera
        // We project out exactly to Z=0 where the core geometry lives
        const vector = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5);
        vector.unproject(state.camera);
        const dir = vector.sub(state.camera.position).normalize();
        const distance = -state.camera.position.z / dir.z;
        const pos = state.camera.position.clone().add(dir.multiplyScalar(distance));

        // Update History Array (shift everything down, put new pos at 0)
        trailHistory.current.unshift({ x: pos.x, y: pos.y, z: pos.z });
        trailHistory.current.pop();

        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current; // Phase 12 needed for getGlobalHue signature
        const baseHue = getGlobalHue(time, audioData, 0.2); // Golden/Teal accent

        for (let i = 0; i < NUM_ORBS; i++) {
            const histPos = trailHistory.current[i];

            dummy.position.set(histPos.x, histPos.y, histPos.z);

            // Shrink as they get older to form a sharp tail
            const scale = Math.max(0, 0.5 * (1.0 - (i / NUM_ORBS)));
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;

        // Glow beautifully but subtly when the mouse moves, fade out when idle
        meshRef.current.material.color.setHSL(baseHue, 1.0, 0.5);
        meshRef.current.material.emissive.setHSL(baseHue, 1.0, 0.5);
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, NUM_ORBS]}>
            <icosahedronGeometry args={[0.3, 1]} />
            <meshStandardMaterial transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </instancedMesh>
    );
};

// --- Phase 13: Torus Knot Energy Fields ---
// Massive, intricate sacred knots slowly navigating the deep void
const MassiveVoidKnots = ({ audioDataRef }) => {
    const meshRef = useRef();
    const NUM_KNOTS = 12; // 12 massive knots
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const knots = useMemo(() => {
        return Array.from({ length: NUM_KNOTS }).map(() => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                -100 - Math.random() * 200
            ),
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            ),
            scale: 2 + Math.random() * 4,
            speed: 0.1 + Math.random() * 0.2
        }));
    }, []);

    useFrame((state) => {
        if (!meshRef.current || !audioDataRef.current) return;

        const time = state.clock.elapsedTime;
        const audioData = audioDataRef.current;
        const strings = Number(audioData.strings) || 0;
        const baseHue = getGlobalHue(time, audioDataRef.current);

        knots.forEach((knot, i) => {
            // Drift slowly forward and reset
            knot.position.z += knot.speed;
            if (knot.position.z > 50) {
                knot.position.z = -300;
                knot.position.x = (Math.random() - 0.5) * 200;
                knot.position.y = (Math.random() - 0.5) * 200;
            }

            dummy.position.copy(knot.position);

            // Constantly rotate
            dummy.rotation.x += knot.rotationSpeed.x;
            dummy.rotation.y += knot.rotationSpeed.y;
            dummy.rotation.z += knot.rotationSpeed.z;

            // Pulse on strings
            const pulse = knot.scale * (1.0 + (strings * 0.5));
            dummy.scale.set(pulse, pulse, pulse);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;

        // Subtle, deep energetic glow responding to majestic strings
        meshRef.current.material.color.setHSL((baseHue + 0.4) % 1.0, 0.8, 0.2);
        meshRef.current.material.emissive.setHSL((baseHue + 0.4) % 1.0, 0.8, 0.1);
        meshRef.current.material.emissiveIntensity = 0.5 + (strings * 2.5);
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, NUM_KNOTS]}>
            <torusKnotGeometry args={[3, 0.8, 128, 16]} />
            <meshStandardMaterial wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" emissive="#ffffff" />
        </instancedMesh>
    );
};

export const ElementUniverse = ({ audioDataRef }) => {
    return (
        <group>
            {/* Background / Environment Layers */}
            <VolumetricAudioNebula audioDataRef={audioDataRef} />
            <VoidWormhole audioDataRef={audioDataRef} />

            {/* The proven stable components */}
            <EvolvingSacredCore audioDataRef={audioDataRef} />

            {/* Phase 11: The Sacred Mantle of wireframes wrapping the core */}
            <SacredWireframeMantles audioDataRef={audioDataRef} />

            <InteractiveCursorRipple audioDataRef={audioDataRef} />
            <FibonacciSpirals audioDataRef={audioDataRef} />
            {/* Phase 13: Upgraded to GoldenRatioLattice */}
            <GoldenRatioLattice audioDataRef={audioDataRef} />
            <LightningFlashes audioDataRef={audioDataRef} />
            <SacredShockwaves audioDataRef={audioDataRef} />
            {/* Phase 13: Massive Torus Knots */}
            <MassiveVoidKnots audioDataRef={audioDataRef} />
            <FloatingSacredGeometry audioDataRef={audioDataRef} />

            <DriftingPadGeometries audioDataRef={audioDataRef} />
            <AlchemicalDust audioDataRef={audioDataRef} />

            {/* Ambient Background Glow Layer */}
            <mesh position={[0, 0, -50]}>
                <circleGeometry args={[45, 64]} />
                <meshBasicMaterial color="#010206" transparent opacity={0.8} />
            </mesh>
        </group>
    );
};
