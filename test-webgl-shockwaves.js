const assert = require('assert');

function simulateShockwave() {
    let opacity = 0.8;
    for (let i = 0; i < 400; i++) {
        opacity *= 0.85;
    }
    console.log("Opacity after 400 frames of decay:", opacity);
    // At 60fps, 400 frames is ~6 seconds. Opacity dives straight into scientific notation, e.g. 5e-30.
    // Three.js and WebGL shaders will violently reject IEEE 754 subnormal floats in Uniforms.
}

simulateShockwave();
