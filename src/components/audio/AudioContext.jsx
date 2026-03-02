import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { useVisualizerConfig } from '../ui/VisualizerContext';

// Create a context so any component can access the audio data
const AudioContextContext = createContext(null);

export const useAudio = () => useContext(AudioContextContext);

export const AudioProvider = ({ children }) => {
    // Optionally extract the config. If AudioProvider is used without a VisualizerProvider parent, gracefully fallback.
    const visualizerConfig = useVisualizerConfig();
    const configRefs = visualizerConfig ? visualizerConfig.configRefs : null;

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const audioElementRef = useRef(null);
    const dataArrayRef = useRef(null);

    const bandBinsRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMicActive, setIsMicActive] = useState(false); // Track if we're listening to the environment/system
    const [audioDevices, setAudioDevices] = useState([]); // List of available input drivers

    // Request permissions and enumerate devices
    const fetchAudioDevices = async () => {
        try {
            // Must ask for permission first in many browsers before giving full device labels
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            setAudioDevices(devices.filter(device => device.kind === 'audioinput'));
        } catch (err) {
            console.error("Device enumeration failed:", err);
        }
    };

    // Load devices on mount
    useEffect(() => {
        fetchAudioDevices();
    }, []);

    // High frequency data must use a ref to prevent 60fps React re-renders destroying WebGL Context
    const audioDataRef = useRef({
        subBass: 0,
        bass: 0,
        lowMid: 0,
        mid: 0,
        highMid: 0,
        presence: 0,
        brilliance: 0,
        sustainedPads: 0,
        raw: new Uint8Array(0),
    });

    // Initialize Web Audio API elements
    const initAudio = async () => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();

            // High resolution FFT (2048 bins)
            analyserRef.current.fftSize = 4096;
            // Smooth out jitters a bit for visual stability
            analyserRef.current.smoothingTimeConstant = 0.85;

            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            // Calculate bin mapping based on the actual hardware sample rate
            const nyquist = audioContextRef.current.sampleRate / 2;
            const getBin = (freq) => Math.max(0, Math.min(bufferLength - 1, Math.floor((freq / nyquist) * bufferLength)));

            // Map our specific frequency ranges to FFT bins
            bandBinsRef.current = {
                subBass: [getBin(20), getBin(60)],         // Rumble, deep impacts
                bass: [getBin(60), getBin(250)],           // Kick drums, thick basslines
                lowMid: [getBin(250), getBin(500)],        // Lower synths, deep vocals
                mid: [getBin(500), getBin(2000)],          // Core synths, main vocals
                highMid: [getBin(2000), getBin(4000)],     // Lead synths, aggressive vocal textures
                presence: [getBin(4000), getBin(6000)],    // Claps, harsh percussions
                brilliance: [getBin(6000), getBin(20000)]  // High-hats, cymbals, air
            };
        }

        // Modern browsers rigidly enforce this: audio contexts start suspended until user gesture.
        try {
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
        } catch (err) {
            console.error("Audio Web API Resume Failed: ", err);
        }

        // We use a persistent HTML5 Audio Element to STREAM the file rather than 
        // decoding it all into RAM at once, which causes WebGL Out-Of-Memory crashes.
        if (!audioElementRef.current) {
            audioElementRef.current = new Audio();
            // REMOVED: audioElementRef.current.crossOrigin = "anonymous";
            // Apple/Safari strictly rejects anonymous CORS on blob: local file URLs.
            audioElementRef.current.loop = true;

            // Route the HTML5 audio element into our Web Audio API analyzer graph
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);

            audioElementRef.current.onended = () => setIsPlaying(false);
            audioElementRef.current.onplay = () => setIsPlaying(true);
            audioElementRef.current.onpause = () => setIsPlaying(false);
        }
    };

    const processAudio = async (file) => {
        try {
            await initAudio();

            // Stop current playback
            if (audioElementRef.current && isPlaying) {
                audioElementRef.current.pause();
            }

            // Create a fast, memory-safe streaming URL instead of a giant RAM ArrayBuffer
            const objectUrl = URL.createObjectURL(file);
            audioElementRef.current.src = objectUrl;

            // Start streaming playback
            await audioElementRef.current.play();
            setIsPlaying(true);

        } catch (error) {
            console.error("Audio Stream Error: ", error.message || error);
            setIsPlaying(false);
            setIsMicActive(false);
        }
    };

    // Brand new method to capture live system audio or microphone
    const startMicrophoneCapture = async (deviceId = null) => {
        try {
            await initAudio();

            // Stop any playing file
            if (audioElementRef.current && isPlaying) {
                audioElementRef.current.pause();
            }

            // Request permission to capture audio
            // To capture system audio, the user must select their system Loopback interface 
            // (e.g., "Stereo Mix" on Windows, or BlackHole/Loopback on Mac) when the browser asks for mic access.
            const constraints = {
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false // We want pure, raw audio data
                }
            };

            // If a specific device (like BlackHole Virtual Cable) is requested, strict bind it
            if (deviceId) {
                constraints.audio.deviceId = { exact: deviceId };
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Disconnect purely the old source from the graph if it exists
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }

            // Pipe the live stream into our elite analyzer
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);
            // DO NOT connect a live mic stream to the destination (speakers) or it will cause an infinite deafening feedback loop!

            setIsPlaying(true);
            setIsMicActive(true);

            // Save the stream so we can kill its tracks later if needed
            audioElementRef.current.srcObject = null; // Clear file obj
            audioElementRef.current.stream = stream;

        } catch (error) {
            console.error("Microphone Capture Error: ", error.message || error);
            setIsPlaying(false);
            setIsMicActive(false);
        }
    };

    const stopAudio = () => {
        // Stop file playback
        if (audioElementRef.current && !isMicActive) {
            audioElementRef.current.pause();
        }

        // Kill microphone streams
        if (audioElementRef.current && audioElementRef.current.stream) {
            audioElementRef.current.stream.getTracks().forEach(track => track.stop());
            audioElementRef.current.stream = null;
        }

        setIsPlaying(false);
        setIsMicActive(false);
    };

    // The main update loop for audio data
    useEffect(() => {
        let animationFrameId;
        // Tracking variable to simulate slow-release instrumentation like Brass/Pads without importing external math libraries
        let smoothedPads = 0.001;

        // Alchemical State Engine Trackers
        let smoothedPhysical = 0.001;
        let smoothedEthereal = 0.001;

        // Phase 14: Granular Instrument & Transient Tracking
        let prevSubBass = 0.001;
        let prevPresence = 0.001;
        let prevBrilliance = 0.001;
        let smoothedPiano = 0.001;
        let smoothedStrings = 0.001;
        let smoothedBrass = 0.001;
        let smoothedVoice = 0.001;

        const updateAudioData = () => {
            if (isPlaying && analyserRef.current && dataArrayRef.current && bandBinsRef.current) {
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);

                // Helper to average out the amplitude of a specific range of bins
                const getAverage = (startBin, endBin) => {
                    let sum = 0;
                    const count = endBin - startBin;
                    if (count <= 0) return 0;
                    for (let i = startBin; i < endBin; i++) {
                        const val = dataArrayRef.current[i] / 255;
                        sum += val * val;
                    }
                    const result = Math.sqrt(sum / count);
                    if (isNaN(result) || !isFinite(result) || result <= 0.001) return 0.001;
                    return result;
                };

                const bands = bandBinsRef.current;

                // Grab user-defined visualizer config refs down from the UI context dynamically
                let sensitivity = 1.0;
                if (configRefs?.sensitivity) {
                    sensitivity = configRefs.sensitivity;
                }

                // Calculate current frame energy and dynamically boost/cut the amplitude limits mapping
                const currentSubBass = Math.min(getAverage(bands.subBass[0], bands.subBass[1]) * sensitivity, 1.0);
                const currentBass = Math.min(getAverage(bands.bass[0], bands.bass[1]) * sensitivity, 1.0);
                const currentLowMid = Math.min(getAverage(bands.lowMid[0], bands.lowMid[1]) * sensitivity, 1.0);
                const currentMid = Math.min(getAverage(bands.mid[0], bands.mid[1]) * sensitivity, 1.0);
                const currentHighMid = Math.min(getAverage(bands.highMid[0], bands.highMid[1]) * sensitivity, 1.0);
                const currentPresence = Math.min(getAverage(bands.presence[0], bands.presence[1]) * sensitivity, 1.0);
                const currentBrilliance = Math.min(getAverage(bands.brilliance[0], bands.brilliance[1]) * sensitivity, 1.0);

                const rawPadsLayer = (currentLowMid + currentMid) / 2.0;

                // Heavy inertia (5% progression per frame) filters out fast vocal chops and isolates long synth swells
                smoothedPads += (rawPadsLayer - smoothedPads) * 0.05;

                // === The Alchemical State Engine ===
                // We maintain a tiny bit of history to determine the "Genre" or "Energy" of the current section.
                const currentPhysicalEnergy = currentSubBass + currentBass;
                const currentEtherealEnergy = smoothedPads + currentHighMid;

                // Smooth the energy readings over time (heavy inertia) so the state doesn't flicker wildly on every drum hit
                smoothedPhysical += (currentPhysicalEnergy - smoothedPhysical) * 0.02; // Very slow reaction
                smoothedEthereal += (currentEtherealEnergy - smoothedEthereal) * 0.02;

                // State Classification Logic
                let currentState = 'sacred'; // Default balanced state

                // If bass completely overpowers melodic elements (Trap / Dubstep / Heavy Techno)
                if (smoothedPhysical > smoothedEthereal * 1.8 && smoothedPhysical > 0.1) {
                    currentState = 'physical';
                }
                // If sustained melodic elements completely overpower bass (Ambient / Classical / Intro builds)
                else if (smoothedEthereal > smoothedPhysical * 2.0 && smoothedEthereal > 0.05) {
                    currentState = 'ethereal';
                }

                // Smooth out the state transition (only switch if the new state has held true for a while, or just rely on the heavily smoothed energy integers)
                // The smoothed energy variables above ensure it takes a few seconds of straight sub-bass to shift into 'Physical'

                // Phase 14: Transient (Attack) Detection
                // Calculates the instantaneous delta between frames to isolate hard strikes
                const kickHit = Math.max(0, currentSubBass - prevSubBass);
                const snareHit = Math.max(0, currentPresence - prevPresence);
                const hihatHit = Math.max(0, currentBrilliance - prevBrilliance);

                // Decay Trackers
                prevSubBass = currentSubBass;
                prevPresence = currentPresence;
                prevBrilliance = currentBrilliance;

                // Sustained Melodics
                // Piano requires a medium-fast envelope targeting the core Mids
                const rawPiano = currentMid;
                smoothedPiano += (rawPiano - smoothedPiano) * 0.2; // 20% interpolation (snappy but sustained)

                // Strings/Ambient require a very slow, majestic envelope targeting the LowMids & HighMids
                const rawStrings = (currentLowMid + currentHighMid) / 2.0;
                smoothedStrings += (rawStrings - smoothedStrings) * 0.02; // 2% interpolation (very slow build)

                // Brass requires a warm, moderate build prioritizing lowMids and bass warmth
                const rawBrass = currentLowMid;
                smoothedBrass += (rawBrass - smoothedBrass) * 0.1;

                // Voice operates primarily in the upper mids/presence. Fast attack/decay.
                const rawVoice = (currentMid + currentPresence) / 2.0;
                smoothedVoice += (rawVoice - smoothedVoice) * 0.3;

                // Mutate the ref directly. DO NOT call setState here, or React will re-render the whole app 60fps.
                audioDataRef.current = {
                    subBass: currentSubBass,
                    bass: currentBass,
                    lowMid: currentLowMid,
                    mid: currentMid,
                    highMid: currentHighMid,
                    presence: currentPresence,
                    brilliance: currentBrilliance,
                    sustainedPads: Math.max(0.001, smoothedPads),
                    alchemicalState: currentState,
                    raw: dataArrayRef.current,
                    // Phase 14 Explicit Instrument Assignments
                    kick: kickHit,
                    snare: snareHit,
                    hihat: hihatHit,
                    piano: Math.max(0.001, smoothedPiano),
                    strings: Math.max(0.001, smoothedStrings),
                    brass: Math.max(0.001, smoothedBrass),
                    voice: Math.max(0.001, smoothedVoice)
                };
            }

            // High performance polling loop linked to browser refresh rate
            animationFrameId = requestAnimationFrame(updateAudioData);
        };

        updateAudioData();

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    return (
        <AudioContextContext.Provider value={{
            isPlaying,
            isMicActive,
            audioDataRef,
            audioDevices,
            processAudio,
            startMicrophoneCapture,
            stopAudio
        }}>
            {children}
        </AudioContextContext.Provider>
    );
};
