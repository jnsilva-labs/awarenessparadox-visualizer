import React, { createContext, useContext, useState, useRef } from 'react';

const VisualizerContext = createContext(null);

export const useVisualizerConfig = () => useContext(VisualizerContext);

export const VisualizerProvider = ({ children }) => {
    // We use Refs for all visualizer config values so the 60fps render loop 
    // can read them instantly without triggering heavy React re-renders.
    const configRefs = useRef({
        sensitivity: 1.0,     // 0.1 to 3.0
        bloomGlow: 1.0,       // 0.0 to 3.0
        cameraSpeed: 1.0,     // 0.1 to 3.0
        geometryDensity: 1.0, // 0.2 to 2.0 (dangerous)
        theme: 'sacred',      // 'sacred', 'cyberpunk', 'abyssal'
    });

    const updateConfig = (key, value) => {
        configRefs.current[key] = value;
    };

    // The context value is memoized and NEVER structurally changes.
    // This perfectly insulates the sensitive WebGL Postprocessing stack from React's render lifecycle
    const contextValue = React.useMemo(() => ({ configRefs, updateConfig }), []);

    return (
        <VisualizerContext.Provider value={contextValue}>
            {children}
        </VisualizerContext.Provider>
    );
};
