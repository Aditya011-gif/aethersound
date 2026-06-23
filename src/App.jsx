import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Wind, 
  Flame, 
  Radio, 
  Activity, 
  Music, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Sparkles,
  Info,
  Tv
} from 'lucide-react';
import audioEngine from './audio/audioEngine';
import CanvasVisualizer from './components/CanvasVisualizer';
import SoundChannel from './components/SoundChannel';
import Timer from './components/Timer';
import Presets from './components/Presets';

// Channel definitions
const CHANNELS_META = [
  {
    id: 'rain',
    label: 'Rainfall',
    description: 'Steady, deep white noise filtered to mimic falling rain.',
    Icon: CloudRain,
    paramLabels: { intensity: 'Intensity (Filter Cutoff)' }
  },
  {
    id: 'wind',
    label: 'Forest Wind',
    description: 'Resonant bandpass howling generator swept by an LFO.',
    Icon: Wind,
    paramLabels: { speed: 'Wind Speed & Gusts' }
  },
  {
    id: 'campfire',
    label: 'Campfire',
    description: 'Deep crackling fire with randomly scheduled high-frequency pops.',
    Icon: Flame,
    paramLabels: { crackleRate: 'Crackle Frequency' }
  },
  {
    id: 'drone',
    label: 'Space Drone',
    description: 'Detuned dual sawtooth oscillators breathing via slow filters.',
    Icon: Radio,
    paramLabels: { depth: 'Resonant Chorus Depth' }
  },
  {
    id: 'binaural',
    label: 'Binaural Beats',
    description: 'Carrier frequencies offset to produce a 5Hz focus Theta beat.',
    Icon: Activity,
    paramLabels: { beatFreq: 'Offset Beat Freq (1Hz - 20Hz)' }
  },
  {
    id: 'lofi',
    label: 'Lofi Chill',
    description: 'Synthesized ambient chill beats layered with soft piano chords.',
    Icon: Music,
    paramLabels: { tempo: 'Melodic Progression' }
  }
];

function App() {
  const [channels, setChannels] = useState(audioEngine.channels);
  const [visualizerTheme, setVisualizerTheme] = useState('nebula');
  const [keyboardClicks, setKeyboardClicks] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Sync state helper
  const syncState = () => {
    // Create new object reference to trigger react render
    const updated = {};
    Object.keys(audioEngine.channels).forEach(key => {
      updated[key] = {
        playing: audioEngine.channels[key].playing,
        volume: audioEngine.channels[key].volume,
        params: { ...audioEngine.channels[key].params }
      };
    });
    setChannels(updated);
  };

  // Channel toggle handler
  const handleToggleChannel = (id) => {
    audioEngine.triggerKeyboardClick();
    if (channels[id].playing) {
      audioEngine.stopChannel(id);
    } else {
      audioEngine.startChannel(id);
    }
    syncState();
  };

  // Volume slider handler
  const handleVolumeChange = (id, val) => {
    audioEngine.setVolume(id, val);
    syncState();
  };

  // Extra parameters handler
  const handleParamChange = (id, paramName, val) => {
    audioEngine.setParameter(id, paramName, val);
    syncState();
  };

  // Mute All toggle
  const handleToggleMuteAll = () => {
    audioEngine.triggerKeyboardClick();
    if (isMuted) {
      audioEngine.masterGain.gain.setValueAtTime(0, audioEngine.ctx?.currentTime || 0);
      audioEngine.masterGain.gain.linearRampToValueAtTime(1.0, (audioEngine.ctx?.currentTime || 0) + 0.3);
      setIsMuted(false);
    } else {
      audioEngine.masterGain.gain.setValueAtTime(audioEngine.masterGain.gain.value, audioEngine.ctx?.currentTime || 0);
      audioEngine.masterGain.gain.linearRampToValueAtTime(0.0001, (audioEngine.ctx?.currentTime || 0) + 0.3);
      setIsMuted(true);
    }
  };

  // Preset Selection Loader
  const handleSelectPreset = (preset) => {
    // Stop all active channels first
    Object.keys(channels).forEach(key => {
      if (channels[key].playing) {
        audioEngine.stopChannel(key);
      }
    });

    // Load new preset values into audio engine
    Object.keys(preset.channels).forEach(key => {
      const targetChan = preset.channels[key];
      audioEngine.setVolume(key, targetChan.volume);
      
      // Load custom parameters
      if (targetChan.params) {
        Object.keys(targetChan.params).forEach(pName => {
          audioEngine.setParameter(key, pName, targetChan.params[pName]);
        });
      }

      // Start if playing
      if (targetChan.playing) {
        audioEngine.startChannel(key);
      }
    });

    setVisualizerTheme(preset.visualizerTheme);
    setIsMuted(false);
    syncState();
  };

  // Global keyboard shortcuts and key clicks
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Trigger satisfying mechanical click sound if enabled and not typing in text field
      const isInput = e.target.tagName === 'INPUT' && e.target.type === 'text';
      
      if (keyboardClicks && !isInput) {
        audioEngine.triggerKeyboardClick();
      }

      // Key combos
      if (!isInput) {
        // Alt+M: Toggle Mute
        if (e.key.toLowerCase() === 'm' && e.altKey) {
          e.preventDefault();
          handleToggleMuteAll();
        }
        // Alt+T: Cycle Themes
        if (e.key.toLowerCase() === 't' && e.altKey) {
          e.preventDefault();
          const themes = ['aurora', 'nebula', 'vortex'];
          const nextIdx = (themes.indexOf(visualizerTheme) + 1) % themes.length;
          setVisualizerTheme(themes[nextIdx]);
        }
        // Alt+K: Toggle Keyboard Click
        if (e.key.toLowerCase() === 'k' && e.altKey) {
          e.preventDefault();
          setKeyboardClicks(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardClicks, visualizerTheme, isMuted]);

  return (
    <div className="app-container">
      {/* Dynamic Background Visualizer */}
      <CanvasVisualizer theme={visualizerTheme} />

      {/* Decorative Aurora Backdrop Blur Circles */}
      <div className="glow-circle gc-1"></div>
      <div className="glow-circle gc-2"></div>

      {/* Main Dashboard Layout */}
      <header className="app-header">
        <div className="logo-section">
          <Sparkles className="logo-sparkle animate-pulse" />
          <h1 className="logo-text">AetherSound</h1>
          <span className="logo-badge">Procedural Ambient Synthesizer</span>
        </div>

        <div className="header-controls">
          {/* Visualizer Selector */}
          <div className="selector-group">
            <Tv size={14} className="selector-icon" />
            <button 
              className={`theme-btn ${visualizerTheme === 'aurora' ? 'active' : ''}`}
              onClick={() => { audioEngine.triggerKeyboardClick(); setVisualizerTheme('aurora'); }}
            >
              Aurora
            </button>
            <button 
              className={`theme-btn ${visualizerTheme === 'nebula' ? 'active' : ''}`}
              onClick={() => { audioEngine.triggerKeyboardClick(); setVisualizerTheme('nebula'); }}
            >
              Nebula
            </button>
            <button 
              className={`theme-btn ${visualizerTheme === 'vortex' ? 'active' : ''}`}
              onClick={() => { audioEngine.triggerKeyboardClick(); setVisualizerTheme('vortex'); }}
            >
              Vortex
            </button>
          </div>

          {/* Keyboard Click Toggler */}
          <button 
            className={`header-toggle-btn ${keyboardClicks ? 'active' : ''}`}
            onClick={() => { audioEngine.triggerKeyboardClick(); setKeyboardClicks(prev => !prev); }}
            title="Mechanical typing sounds (Click keys to test)"
          >
            <Keyboard size={18} />
            <span>Typewriter Keys: {keyboardClicks ? 'ON' : 'OFF'}</span>
          </button>

          {/* Master Mute */}
          <button 
            className={`header-toggle-btn mute-all-btn ${isMuted ? 'muted' : ''}`}
            onClick={handleToggleMuteAll}
            title={isMuted ? 'Unmute All' : 'Mute All'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{isMuted ? 'Muted' : 'Mute Master'}</span>
          </button>

          {/* Info Modal Trigger */}
          <button 
            className={`header-toggle-btn ${showInfo ? 'active' : ''}`}
            onClick={() => { audioEngine.triggerKeyboardClick(); setShowInfo(prev => !prev); }}
            title="Project Information"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Info panel popup */}
      {showInfo && (
        <div className="info-modal-backdrop" onClick={() => setShowInfo(false)}>
          <div className="info-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>About AetherSound</h2>
            <p>AetherSound is an ambient soundscape synthesizer designed for relaxation, meditation, and focus.</p>
            <h3>🌟 Procedural Web Audio Engine</h3>
            <p>Unlike standard loop-players that load large static audio files, AetherSound synthesizes all environmental textures procedurally in real-time. By utilizing low-frequency oscillators, white noise bandpass sweeps, detuned sines, and envelope triggers, we build live textures that load instantly, play completely offline, and can be sculpted via sliders.</p>
            <h3>⌨️ Responsive Typist mode</h3>
            <p>Enable <strong>Typewriter Keys</strong> and hear mechanical keypress clicks as you work. The audio synthesizer generates unique click variations to simulate mechanical typing feedback.</p>
            <h3>🛠️ Dynamic Hotkeys</h3>
            <ul className="hotkeys-list">
              <li><kbd>Alt + T</kbd> : Cycle canvas visualizer theme</li>
              <li><kbd>Alt + M</kbd> : Toggle Master Mute</li>
              <li><kbd>Alt + K</kbd> : Toggle Keyboard click sounds</li>
              <li><kbd>Any Key</kbd> : Trigger keystroke feedback</li>
            </ul>
            <button className="close-info-btn" onClick={() => setShowInfo(false)}>Start Creating</button>
          </div>
        </div>
      )}

      <main className="dashboard-content">
        {/* Left Side: Audio Channels Grid */}
        <section className="channels-section">
          <div className="section-header-label">Ambient Sound Generators</div>
          <div className="channels-grid">
            {CHANNELS_META.map((meta) => {
              const chan = channels[meta.id] || { playing: false, volume: 0, params: {} };
              return (
                <SoundChannel
                  key={meta.id}
                  id={meta.id}
                  label={meta.label}
                  description={meta.description}
                  isPlaying={chan.playing}
                  volume={chan.volume}
                  params={chan.params}
                  paramLabels={meta.paramLabels}
                  onToggle={handleToggleChannel}
                  onVolumeChange={handleVolumeChange}
                  onParamChange={handleParamChange}
                  Icon={meta.Icon}
                />
              );
            })}
          </div>
        </section>

        {/* Right Side: Pomodoro Timer & Preset Mixer */}
        <section className="utilities-section">
          <div className="section-header-label">Focus Dashboard</div>
          <Timer />
          <Presets 
            currentChannels={channels} 
            currentTheme={visualizerTheme} 
            onSelectPreset={handleSelectPreset} 
          />
        </section>
      </main>

      <footer className="app-footer">
        <div className="shortcuts-info">
          <span>Keyboard Shortcuts: </span>
          <span className="shortcut"><kbd>Alt + T</kbd> Cycle Visuals</span>
          <span className="shortcut"><kbd>Alt + M</kbd> Mute Master</span>
          <span className="shortcut"><kbd>Alt + K</kbd> Keys Feedback</span>
        </div>
        <div className="footer-credits">
          Made with Web Audio API & React
        </div>
      </footer>
    </div>
  );
}

export default App;
