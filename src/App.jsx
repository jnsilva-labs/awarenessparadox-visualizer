import { AudioProvider } from './components/audio/AudioContext';
import { OverlayUI } from './components/ui/OverlayUI';
import { VisualizerScene } from './components/visualizer/VisualizerScene';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-void-black text-white relative">
        <AudioProvider>
          <VisualizerScene />
          <OverlayUI />
        </AudioProvider>
      </div>
    </ErrorBoundary>
  );
};
