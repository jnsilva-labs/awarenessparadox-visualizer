import { useRef } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

// Elite Metaphysical Infinite Fractal Raymarcher (Kali-set inspired)
const RaymarchedUniverseMaterial = shaderMaterial(
    {
        uTime: 0,
        uResolution: new THREE.Vector2(),
        uCameraPos: new THREE.Vector3(),
        uCameraDir: new THREE.Vector3(),
        uCameraUp: new THREE.Vector3(),
        uCameraRight: new THREE.Vector3(),
        uFov: 90.0,

        // Audio Reactivity Uniforms
        uSubBass: 0,
        uBass: 0,
        uLowMid: 0,
        uMid: 0,
        uHighMid: 0,
        uPresence: 0,
        uBrilliance: 0,

        // Aesthetic Colors
        uColorGold: new THREE.Color('#D4AF37'),
        uColorBlue: new THREE.Color('#8ab4f8'),
        uColorBase: new THREE.Color('#151525'), // Added a solid base color for the geometry walls
        uColorVoid: new THREE.Color('#05050A')
    },

    // VERTEX SHADER
    // Renders a simple full-screen quad. Raymarching happens entirely in the Fragment Shader.
    `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
  `,

    // FRAGMENT SHADER
    `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uCameraPos;
  uniform vec3 uCameraDir;
  uniform vec3 uCameraUp;
  uniform vec3 uCameraRight;
  uniform float uFov;
  
  uniform float uSubBass;
  uniform float uBass;
  uniform float uLowMid;
  uniform float uMid;
  uniform float uHighMid;
  uniform float uPresence;
  uniform float uBrilliance;
  
  uniform vec3 uColorGold;
  uniform vec3 uColorBlue;
  uniform vec3 uColorBase;
  uniform vec3 uColorVoid;
  
  varying vec2 vUv;
  
  const int MAX_STEPS = 150;
  const float MAX_DIST = 100.0;
  const float SURF_DIST = 0.002;

  mat2 rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
  }

  // The Living Metaphysical Fractal map
  float map(vec3 pos) {
      // High-speed flight path
      pos.z -= uTime * 4.0 + uSubBass * 15.0; // Bass pushes us forward much faster
      
      // Corkscrew twisting space so the user barrel-rolls through the universe
      // Severe synth reactivity causes the space to twist violently
      pos.xy *= rot(pos.z * 0.05 + uLowMid * 0.2 + uHighMid * 1.5);
      
      vec3 p = pos;
      
      // Infinite tessellation to surround us completely
      p = mod(p, 12.0) - 6.0;
      
      vec3 z = p;
      
      // 1.5 is the magic constant for dense, OVERLAPPING architectural geometry
      // This guarantees massive solid walls and structural beams, preventing "fractal dust"
      float scale = 1.5; 
      
      // Mapping the 7 audio bands directly into the fractal fabric
      float bands[7];
      bands[0] = uSubBass; 
      bands[1] = uBass; 
      bands[2] = uLowMid; 
      bands[3] = uMid; 
      bands[4] = uHighMid; 
      bands[5] = uPresence; 
      bands[6] = uBrilliance;
      
      for (int i = 0; i < 6; i++) {
          // Perfectly stable tetrahedral symmetry folding
          z = abs(z);
          if (z.x < z.y) z.xy = z.yx;
          if (z.x < z.z) z.xz = z.zx;
          if (z.y < z.z) z.yz = z.zy;
          
          // Audio reactivity safely applied to the scale displacement
          // Using base 1.0 ensures contiguous structure. The bands make the architecture 'breathe'.
          vec3 offset = vec3(1.0) + vec3(bands[i] * 0.3, bands[5-i] * 0.2, bands[i] * 0.4);
          
          z = z * scale - offset; 
      }
      
      // Compute actual fractal distance to a sharp geometric Box
      // We use 0.4 to carve out the blocks and reveal the insanely intricate internal lattice scaffolding!
      vec3 q = abs(z) - vec3(0.4 + uPresence * 1.5); 
      float dBase = length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
      
      float d = dBase * pow(scale, -6.0);
      
      // Dynamic breathing tunnel carving using the original untampered 'pos'
      float tunnelRadius = 1.6 + sin(pos.z * 0.2 + uTime) * 0.5 + uSubBass * 1.5;
      float tunnel = length(pos.xy) - tunnelRadius;
      
      // Combining the fractal with the negative tunnel space (carving a hole through the vast city)
      d = max(d, -tunnel);
      
      return d * 0.5; // Safe stepping factor
  }

  vec3 getNormal(vec3 p) {
      float d = map(p);
      vec2 e = vec2(0.002, 0);
      vec3 n = d - vec3(
          map(p - e.xyy),
          map(p - e.yxy),
          map(p - e.yyx));
      return normalize(n);
  }

  void main() {
      vec2 uv = (vUv - 0.5) * 2.0;
      uv.x *= uResolution.x / uResolution.y;
      
      // Intense Bass Thunder FOV Warp
      float fovBoom = uFov + uBass * 45.0 + uSubBass * 20.0;
      float fovFactor = tan(radians(fovBoom) / 2.0);
      vec3 rd = normalize(uCameraDir + uv.x * fovFactor * uCameraRight + uv.y * fovFactor * uCameraUp);
      
      // Camera Look-around sway
      rd.xy *= rot(sin(uTime * 0.4) * 0.3);
      
      vec3 ro = uCameraPos;
      // Thunderous camera shake from SubBass
      ro.xy += vec2(sin(uTime * 50.0), cos(uTime * 45.0)) * uSubBass * 0.6;
      
      float dO = 0.0;
      for(int i = 0; i < MAX_STEPS; i++) {
          vec3 p = ro + rd * dO;
          float dS = map(p);
          dO += dS;
          if(dO > MAX_DIST || abs(dS) < SURF_DIST) break;
      }
      
      vec3 color = uColorVoid;
      
      if(dO < MAX_DIST) {
          vec3 p = ro + rd * dO;
          vec3 n = getNormal(p);
          
          // Recalculate EXACT orbit trap at the collision point for pristine architectural coloring
          vec3 pos = p;
          pos.z -= uTime * 4.0 + uSubBass * 15.0;
          pos.xy *= rot(pos.z * 0.05 + uLowMid * 0.2 + uHighMid * 1.5);
          vec3 z = mod(pos, 12.0) - 6.0;
          
          vec4 trap = vec4(1000.0); // xyzw represent structural proximity distances
          float bands[7];
          bands[0] = uSubBass; bands[1] = uBass; bands[2] = uLowMid; bands[3] = uMid; 
          bands[4] = uHighMid; bands[5] = uPresence; bands[6] = uBrilliance;
          
          for (int i = 0; i < 6; i++) {
              z = abs(z);
              if (z.x < z.y) z.xy = z.yx;
              if (z.x < z.z) z.xz = z.zx;
              if (z.y < z.z) z.yz = z.zy;
              
              vec3 offset = vec3(1.0) + vec3(bands[i] * 0.3, bands[5-i] * 0.2, bands[i] * 0.4);
              z = z * 1.5 - offset; 
              
              trap = min(trap, vec4(abs(z), length(z)));
          }
          
          // Ethereal metaphysical Lighting
          vec3 lightDir = normalize(vec3(2.0, 4.0, -2.0));
          lightDir.xz *= rot(uTime * 0.5);
          float dif = max(dot(n, lightDir), 0.0);
          float amb = 0.4 + 0.6 * n.y; // Hemisphere ambient based on normal
          
          // Deep Orbit Coloring - The Cathedral Walls mapped to the sound!
          vec3 baseCol = uColorBase;
          // Trap X: deep internal structures glow Blue
          baseCol = mix(baseCol, uColorBlue, clamp(1.0 - trap.x * 2.0, 0.0, 1.0));
          // Trap Y: sharp exterior angles glow Gold
          baseCol = mix(baseCol, uColorGold, clamp(1.0 - trap.y * 3.0, 0.0, 1.0) * (0.5 + uMid));
          // Trap Z: extremely intricate intersections glow bright Iridescent Pink/Purple
          vec3 intenseCol = vec3(0.9, 0.4, 0.8);
          baseCol = mix(baseCol, intenseCol, clamp(1.0 - trap.z * 5.0, 0.0, 1.0) * (0.5 + uHighMid));
          
          // VOCAL COLOR INJECTION:
          // Vocals (Presence/Mid) literally paint the walls with shifting ethereal colors
          vec3 vocalColor = mix(vec3(0.1, 0.9, 0.8), vec3(1.0, 0.2, 0.6), sin(uTime + trap.w * 8.0) * 0.5 + 0.5);
          baseCol = mix(baseCol, vocalColor, uPresence * 1.8 + uMid * 1.0);
          
          // Outline Fresnel glow for metaphysical edge presence
          float fresnel = pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 3.0);
          vec3 fresnelCol = mix(uColorBlue, uColorGold, uPresence) * (1.0 + uPresence * 3.0);
          
          // Dynamic Iridescence driven by High frequencies on flat surfaces
          vec3 irid = 0.5 + 0.5 * cos(uTime + n.xyx * 3.0 + vec3(0,2,4));
          baseCol = mix(baseCol, irid, uBrilliance * 0.8);
          
          // Fake Ambient Occlusion from structural density
          float ao = clamp(trap.w * 0.6 + 0.2, 0.0, 1.0); 
          
          color = baseCol * (dif + amb) * ao;
          color += fresnelCol * fresnel;
          
          // Explosive reactive percussion flashes inside the geometry
          color += vec3(1.0) * uBrilliance * fresnel * 2.5;
          
          // Severe Bass thunder flashes cutting through the fog
          color += vec3(0.8, 0.9, 1.0) * uSubBass * 1.5;
          
          // Deep cosmos fog mask
          float fogIntensity = exp(-dO * 0.025); 
          color = mix(uColorVoid, color, fogIntensity);
      }
      
      // Dynamic noise overlay interacting directly with geometry
      vec2 noiseUV = uv + mod(uTime, 10.0);
      float screenNoise = fract(sin(dot(noiseUV, vec2(12.9898, 78.233))) * 43758.5453);
      if(screenNoise > 0.995 && uPresence > 0.4) {
          color += uColorGold * uPresence * 2.0;
      }

      color = smoothstep(0.0, 1.2, color); // Contrast curve
      gl_FragColor = vec4(color, 1.0);
  }
  `
);

extend({ RaymarchedUniverseMaterial });

export const RaymarchedUniverse = ({ audioData }) => {
    const materialRef = useRef();
    const { camera, size } = useThree();

    useFrame((state, delta) => {
        if (!materialRef.current) return;

        const mat = materialRef.current;
        mat.uTime += delta;

        // Pass screen resolution for accurate ray mapping
        mat.uResolution.set(size.width, size.height);

        // Pass camera properties manually since this is a screen-space quad shader
        mat.uCameraPos.copy(camera.position);
        camera.getWorldDirection(mat.uCameraDir);
        mat.uCameraUp.copy(camera.up);
        mat.uCameraRight.crossVectors(mat.uCameraDir, mat.uCameraUp).normalize();
        mat.uFov = camera.fov;

        // Smoothly interpolate the 7-band elite audio
        mat.uSubBass = THREE.MathUtils.lerp(mat.uSubBass, audioData.subBass, 0.1);
        mat.uBass = THREE.MathUtils.lerp(mat.uBass, audioData.bass, 0.1);
        mat.uLowMid = THREE.MathUtils.lerp(mat.uLowMid, audioData.lowMid, 0.1);
        mat.uMid = THREE.MathUtils.lerp(mat.uMid, audioData.mid, 0.1);
        mat.uHighMid = THREE.MathUtils.lerp(mat.uHighMid, audioData.highMid, 0.1);
        mat.uPresence = THREE.MathUtils.lerp(mat.uPresence, audioData.presence, 0.2);
        mat.uBrilliance = THREE.MathUtils.lerp(mat.uBrilliance, audioData.brilliance, 0.3);
    });

    return (
        <mesh>
            {/* 
              A simple plane covering the entire screen. 
              The magic happens mathematically per-pixel in the fragment shader. 
            */}
            <planeGeometry args={[2, 2]} />
            <raymarchedUniverseMaterial ref={materialRef} depthWrite={false} />
        </mesh>
    );
};
