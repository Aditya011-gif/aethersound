import React from 'react';
import { Volume2, VolumeX, Settings2 } from 'lucide-react';

const SoundChannel = ({
  id,
  label,
  description,
  isPlaying,
  volume,
  params,
  paramLabels,
  onToggle,
  onVolumeChange,
  onParamChange,
  Icon
}) => {
  return (
    <div className={`sound-card ${isPlaying ? 'active' : ''}`}>
      <div className="sound-header">
        <button 
          className={`sound-icon-btn ${isPlaying ? 'active' : ''}`}
          onClick={() => onToggle(id)}
          title={isPlaying ? `Stop ${label}` : `Start ${label}`}
        >
          <Icon size={24} className="icon-main" />
          <span className="pulse-ring"></span>
        </button>

        <div className="sound-info">
          <h3>{label}</h3>
          <p>{description}</p>
        </div>

        <div className="active-indicator"></div>
      </div>

      <div className="sound-controls">
        <div className="slider-container">
          <button 
            className="mute-btn"
            onClick={() => onVolumeChange(id, volume === 0 ? 0.5 : 0)}
            disabled={!isPlaying}
          >
            {volume === 0 || !isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isPlaying ? volume : 0}
            onChange={(e) => onVolumeChange(id, e.target.value)}
            disabled={!isPlaying}
            className="volume-slider"
          />
          <span className="volume-percentage">
            {isPlaying ? Math.round(volume * 100) : 0}%
          </span>
        </div>

        {isPlaying && params && Object.keys(params).length > 0 && (
          <div className="extra-params-panel">
            <div className="params-header">
              <Settings2 size={12} className="params-icon" />
              <span>Customize Soundscape</span>
            </div>
            
            {Object.keys(params).map((paramKey) => (
              <div key={paramKey} className="param-slider-row">
                <label className="param-label">
                  {paramLabels?.[paramKey] || paramKey}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params[paramKey]}
                  onChange={(e) => onParamChange(id, paramKey, e.target.value)}
                  className="param-slider"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundChannel;
