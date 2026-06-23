import React, { useState, useEffect } from 'react';
import { Save, Trash2, FolderHeart, Zap } from 'lucide-react';
import audioEngine from '../audio/audioEngine';

const DEFAULT_PRESETS = [
  {
    name: 'Cozy Fireplace',
    isDefault: true,
    visualizerTheme: 'nebula',
    channels: {
      rain: { playing: true, volume: 0.4, params: { intensity: 0.4 } },
      campfire: { playing: true, volume: 0.7, params: { crackleRate: 0.6 } },
      wind: { playing: false, volume: 0.0, params: { speed: 0.3 } },
      drone: { playing: false, volume: 0.0, params: { depth: 0.4 } },
      binaural: { playing: false, volume: 0.0, params: { beatFreq: 5 } },
      lofi: { playing: false, volume: 0.0, params: { tempo: 0.5 } }
    }
  },
  {
    name: 'Deep Focus Space',
    isDefault: true,
    visualizerTheme: 'vortex',
    channels: {
      rain: { playing: false, volume: 0.0, params: { intensity: 0.5 } },
      campfire: { playing: false, volume: 0.0, params: { crackleRate: 0.5 } },
      wind: { playing: false, volume: 0.0, params: { speed: 0.4 } },
      drone: { playing: true, volume: 0.5, params: { depth: 0.7 } },
      binaural: { playing: true, volume: 0.7, params: { beatFreq: 6 } },
      lofi: { playing: false, volume: 0.0, params: { tempo: 0.5 } }
    }
  },
  {
    name: 'Lofi Coffee Shop',
    isDefault: true,
    visualizerTheme: 'aurora',
    channels: {
      rain: { playing: true, volume: 0.3, params: { intensity: 0.3 } },
      campfire: { playing: false, volume: 0.0, params: { crackleRate: 0.5 } },
      wind: { playing: false, volume: 0.0, params: { speed: 0.4 } },
      drone: { playing: false, volume: 0.0, params: { depth: 0.5 } },
      binaural: { playing: false, volume: 0.0, params: { beatFreq: 5 } },
      lofi: { playing: true, volume: 0.6, params: { tempo: 0.5 } }
    }
  }
];

const Presets = ({ currentChannels, currentTheme, onSelectPreset }) => {
  const [presets, setPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');

  // Load user presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aethersound_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading presets', e);
      }
    }
  }, []);

  // Save a new preset
  const handleSavePreset = (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    audioEngine.triggerKeyboardClick();

    // Deep copy current channel states
    const channelsToSave = {};
    Object.keys(currentChannels).forEach(key => {
      channelsToSave[key] = {
        playing: currentChannels[key].playing,
        volume: currentChannels[key].volume,
        params: { ...currentChannels[key].params }
      };
    });

    const newPreset = {
      name: newPresetName.trim(),
      isDefault: false,
      visualizerTheme: currentTheme,
      channels: channelsToSave
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('aethersound_presets', JSON.stringify(updatedPresets));
    setNewPresetName('');
  };

  // Delete a user preset
  const handleDeletePreset = (index, e) => {
    e.stopPropagation(); // Avoid triggering selection
    audioEngine.triggerKeyboardClick();

    const updatedPresets = presets.filter((_, idx) => idx !== index);
    setPresets(updatedPresets);
    localStorage.setItem('aethersound_presets', JSON.stringify(updatedPresets));
  };

  // Load a preset
  const handleLoad = (preset) => {
    audioEngine.triggerKeyboardClick();
    onSelectPreset(preset);
  };

  return (
    <div className="presets-panel">
      <div className="presets-header">
        <FolderHeart size={18} className="header-icon" />
        <h2>Soundscape Presets</h2>
      </div>

      <div className="presets-list">
        {/* Render Defaults */}
        <div className="preset-section-title">Curated Mixes</div>
        <div className="presets-grid">
          {DEFAULT_PRESETS.map((preset, idx) => (
            <button
              key={`default-${idx}`}
              className="preset-card default"
              onClick={() => handleLoad(preset)}
            >
              <Zap size={12} className="card-icon" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Render User Saved */}
        <div className="preset-section-title">My Custom Mixes</div>
        {presets.length === 0 ? (
          <p className="no-presets">No custom mixes saved yet. Build your favorite soundscape and save it below!</p>
        ) : (
          <div className="presets-grid">
            {presets.map((preset, idx) => (
              <div key={`user-${idx}`} className="preset-card-wrapper">
                <button
                  className="preset-card user"
                  onClick={() => handleLoad(preset)}
                >
                  <span>{preset.name}</span>
                </button>
                <button
                  className="delete-preset-btn"
                  onClick={(e) => handleDeletePreset(idx, e)}
                  title="Delete Preset"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Current State Form */}
      <form onSubmit={handleSavePreset} className="save-preset-form">
        <input
          type="text"
          placeholder="Name current mix..."
          value={newPresetName}
          onChange={(e) => setNewPresetName(e.target.value)}
          maxLength={20}
          className="preset-input"
        />
        <button type="submit" className="save-btn" disabled={!newPresetName.trim()}>
          <Save size={16} />
          <span>Save Mix</span>
        </button>
      </form>
    </div>
  );
};

export default Presets;
