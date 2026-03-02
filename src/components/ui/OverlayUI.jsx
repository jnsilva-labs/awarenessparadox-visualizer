import { useRef, useEffect, useState } from 'react';
import { useAudio } from '../audio/AudioContext';

export const OverlayUI = () => {
    const { isPlaying, isMicActive, processAudio, startMicrophoneCapture, stopAudio, audioDataRef, audioDevices } = useAudio();
    const fileInputRef = useRef(null);
    const titleRef = useRef(null);
    const [debugLogs, setDebugLogs] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');

    // Global Error Catcher for On-Screen Debugging
    useEffect(() => {
        const handleError = (msg, url, lineNo, columnNo, error) => {
            const string = msg.toLowerCase();
            const substring = "script error";
            if (string.indexOf(substring) > -1) {
                setDebugLogs(prev => [...prev.slice(-4), 'Script Error: See Browser Console for Detail']);
            } else {
                const message = [
                    'Message: ' + msg,
                    'URL: ' + url,
                    'Line: ' + lineNo,
                    'Column: ' + columnNo,
                    'Error object: ' + (error ? (error.stack || error.message || String(error)) : 'None')
                ].join(' - ');
                setDebugLogs(prev => [...prev.slice(-4), message]);
            }
            return false;
        };

        const handleRejection = (event) => {
            setDebugLogs(prev => [...prev.slice(-4), 'Unhandled Promise Rejection: ' + event.reason]);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    // Audio-Reactive UI "God Ray" Title
    useEffect(() => {
        let animationFrameId;

        const animateUI = () => {
            if (isPlaying && titleRef.current && audioDataRef.current) {
                const audioData = audioDataRef.current;
                // Peak reactivity based on multiple hard-hitting bands
                const subBass = audioData.subBass || 0;
                const bass = Math.pow(audioData.bass || 0, 2.0);
                const brilliance = audioData.brilliance || 0;

                const peakPower = (subBass * 1.5) + bass + (brilliance * 0.5);

                // When peak hits hard, increase tracking and massive text shadow
                if (peakPower > 1.4) {
                    const extraSpacing = Math.min((peakPower - 1.4) * 0.3, 0.5);
                    titleRef.current.style.letterSpacing = `${0.1 + extraSpacing}em`;

                    const glowIntensity = Math.min(peakPower * 10, 30);
                    titleRef.current.style.textShadow = `0 0 ${glowIntensity}px rgba(255,255,255,0.8), 0 0 ${glowIntensity * 2}px rgba(212,175,55,0.6)`;
                } else {
                    // Smooth decay back to base CSS
                    titleRef.current.style.letterSpacing = '0.1em';
                    titleRef.current.style.textShadow = '0 0 15px rgba(255,255,255,0.5)';
                }
            } else if (titleRef.current) {
                titleRef.current.style.letterSpacing = '0.1em';
                titleRef.current.style.textShadow = '0 0 15px rgba(255,255,255,0.5)';
            }
            animationFrameId = requestAnimationFrame(animateUI);
        };

        animateUI();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, audioDataRef]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            processAudio(file);
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10 w-full h-full">
            {/* Top Header */}
            <header className="flex flex-col md:flex-row justify-between items-start w-full gap-4 md:gap-0">
                <div className="flex flex-col">
                    <h1
                        ref={titleRef}
                        className="text-2xl md:text-3xl font-light tracking-widest text-white/90 uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-[letter-spacing,text-shadow] duration-75"
                    >
                        Awareness <span className="text-gold-alchemical font-normal">Paradox</span>
                    </h1>
                    <p className="text-xs md:text-sm tracking-widest text-ethereal-blue/70 uppercase mt-1">
                        Metaphysical Audio Visualizer
                    </p>
                </div>

                {/* Controls */}
                <div className="pointer-events-auto flex w-full md:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="audio/*,audio/mpeg,.mp3,.wav,.m4a"
                        className="hidden"
                    />

                    {!isPlaying ? (
                        <div className="flex flex-col items-start md:items-end gap-2 md:gap-3 w-full md:w-auto">
                            {audioDevices.length > 0 && (
                                <select
                                    className="w-full md:w-auto px-2 md:px-4 py-1.5 md:py-2 bg-black/50 border border-white/20 text-white/80 rounded-sm text-[10px] md:text-xs tracking-wider uppercase backdrop-blur-md outline-none focus:border-ethereal-blue transition-colors"
                                    value={selectedDeviceId}
                                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                                >
                                    <option value="">Default System Microphone</option>
                                    {audioDevices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className="flex flex-row gap-2 md:gap-4 w-full md:w-auto">
                                <button
                                    onClick={() => startMicrophoneCapture(selectedDeviceId)}
                                    className="flex-1 md:flex-none px-2 md:px-6 py-2 md:py-2 bg-ethereal-blue/10 border border-ethereal-blue/30 text-ethereal-blue hover:bg-ethereal-blue/20 hover:border-ethereal-blue hover:shadow-[0_0_20px_rgba(100,200,255,0.4)] transition-all duration-300 rounded-sm backdrop-blur-md text-[10px] md:text-sm tracking-widest md:tracking-wider uppercase"
                                >
                                    SYSTEM AUDIO
                                </button>
                                <button
                                    onClick={handleUploadClick}
                                    className="flex-1 md:flex-none px-2 md:px-6 py-2 md:py-2 bg-white/5 border border-white/20 hover:bg-gold-alchemical/20 hover:border-gold-alchemical hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 rounded-sm backdrop-blur-md text-[10px] md:text-sm tracking-widest md:tracking-wider uppercase"
                                >
                                    UPLOAD AUDIO
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full md:w-auto flex justify-start md:justify-end">
                            <button
                                onClick={stopAudio}
                                className="w-full md:w-auto px-4 md:px-6 py-2 bg-white/5 border border-red-500/30 text-red-100 hover:bg-red-500/20 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 rounded-sm backdrop-blur-md text-[10px] md:text-sm tracking-widest md:tracking-wider uppercase"
                            >
                                Stop Sync
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Bottom info (optional) */}
            <footer className="w-full flex justify-between items-end pb-2">
                <p className="text-xs text-white/30 tracking-widest uppercase">
                    {isPlaying
                        ? (isMicActive ? 'Listening to Environment // Quantum Field Engaged' : 'File Sync Active // Quantum Field Engaged')
                        : 'Awaiting Resonance'}
                </p>
                {/* Name removed for clean presentation */}
            </footer>
            {/* Global Error Overlay */}
            {debugLogs.length > 0 && (
                <div className="absolute top-0 right-0 p-4 max-w-xl w-full z-[100] pointer-events-none">
                    <div className="bg-red-900/90 border-2 border-red-500 rounded p-4 shadow-2xl backdrop-blur-md">
                        <h3 className="text-red-300 font-bold mb-2 uppercase tracking-widest text-sm">CRITICAL SYSTEM ERROR</h3>
                        <div className="space-y-2 text-xs font-mono text-red-100 overflow-y-auto max-h-64 break-words">
                            {debugLogs.map((log, i) => (
                                <div key={i} className="pb-2 border-b border-red-700/50">{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
