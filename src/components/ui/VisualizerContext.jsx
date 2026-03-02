import React, { createContext, useContext, useState, useRef } from 'react';

const VisualizerContext = createContext(null);

export const useVisualizerConfig = () => useContext(VisualizerContext);

export const VisualizerProvider = ({ children }) => {
    // We use Refs for continuous sliding values so the 60fps render loop 
    // can read them instantly without triggering heavy React re-renders.
    const configRefs = useRef({
        sensitivity: 1.0,     // 0.1 to 3.0
        bloomGlow: 1.0,       // 0.0 to 3.0
        cameraSpeed: 1.0,     // 0.1 to 3.0
        geometryDensity: 1.0, // 0.2 to 2.0 (dangerous)
        theme: 'sacred',      // 'sacred', 'cyberpunk', 'abyssal'
    });

    // We also use state to manually force re-renders ONLY for the UI Control Panel itself
    // when the user is dragging the sliders. The canvas ignores this state.
    const [uiState, setUiState] = useState({
        sensitivity: 1.0,
        bloomGlow: 1.0,
        cameraSpeed: 1.0,
        geometryDensity: 1.0,
        theme: 'sacred'
    });

    const updateConfig = (key, value) => {
        configRefs.current[key] = value;
        setUiState(prev => ({ ...prev, [key]: value }));
    };

    return (
        <VisualizerContext.Provider value={{ configRefs: configRefs, uiState, updateConfig }}>
            {children}
        </VisualizerContext.Provider>
    );
};
