import React, { useState, useEffect } from 'react';
import { Play, Pause, Radio, Volume2, Link2, Music } from 'lucide-react';
import audioEngine from '../audio/audioEngine';

const Youtube = ({ size = 24, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

// Curated live radio streams (CORS-enabled)
const RADIO_STATIONS = [
  { name: 'Lofi Focus Radio', url: 'https://stream.zeno.fm/f3b5u28z438uv', description: 'Relaxing lo-fi beats for coding and study.' },
  { name: 'Ambient Sleep Space', url: 'https://stream.zeno.fm/0r044ac5568uv', description: 'Deep synthesizer drones and spatial textures.' },
  { name: 'Chill Classical Piano', url: 'https://stream.zeno.fm/s49z14v2208uv', description: 'Calm classical piano solos and arrangements.' },
  { name: 'Synthwave Retro', url: 'https://stream.zeno.fm/g6t5r223598uv', description: 'Outrun and vaporwave beats for energy.' }
];

// Curated YouTube ambient videos
const YOUTUBE_VIDEOS = [
  { name: 'Lofi Girl Live Beats 🌸', id: 'jfKfPfyJRdk', description: 'The legendary study lofi hip hop livestream.' },
  { name: 'Rainy Kyoto Café ☕', id: '5wXBL_dZJk0', description: 'Cozy jazz and rain visual ambience in Japan.' },
  { name: 'Tokyo Rain Walking 🌧️', id: 'hXd35eNfJ4M', description: 'Rain sounds and visual binaural street walk.' },
  { name: 'Deep Space Explorer 🚀', id: 'T-8152HnJgU', description: 'Calm interstellar orchestral drones and graphics.' }
];

const MusicHub = ({ onYoutubeStateChange, onMusicPlayingChange }) => {
  const [activeTab, setActiveTab] = useState('radio'); // radio, youtube
  const [radioVolume, setRadioVolume] = useState(0.4);

  // Radio state
  const [currentStationIdx, setCurrentStationIdx] = useState(0);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [customStreamUrl, setCustomStreamUrl] = useState('');

  // YouTube state
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isYoutubeActive, setIsYoutubeActive] = useState(false);

  // Set default audio volume on engine load
  useEffect(() => {
    audioEngine.setVolume('radio', radioVolume);
  }, []);

  // Handle Radio Play/Pause
  const handleToggleRadio = () => {
    audioEngine.triggerKeyboardClick();

    if (isRadioPlaying) {
      audioEngine.stopRadioStream();
      setIsRadioPlaying(false);
      onMusicPlayingChange(false);
    } else {
      // Pause YouTube if active
      if (isYoutubeActive) {
        setIsYoutubeActive(false);
        onYoutubeStateChange(false);
      }

      const url = RADIO_STATIONS[currentStationIdx].url;
      audioEngine.playRadioStream(url);
      setIsRadioPlaying(true);
      onMusicPlayingChange(true);
    }
  };

  // Change Radio Station
  const handleSelectStation = (index) => {
    audioEngine.triggerKeyboardClick();
    setCurrentStationIdx(index);

    if (isRadioPlaying) {
      audioEngine.stopRadioStream();
      audioEngine.playRadioStream(RADIO_STATIONS[index].url);
    }
  };

  // Custom Stream Loader
  const handleLoadCustomStream = (e) => {
    e.preventDefault();
    if (!customStreamUrl.trim()) return;

    audioEngine.triggerKeyboardClick();
    
    // Create custom station entry
    const newStation = {
      name: 'Custom User Stream',
      url: customStreamUrl.trim(),
      description: 'Loaded from custom stream input URL.'
    };

    // Override current stream playing
    setIsRadioPlaying(false);
    audioEngine.stopRadioStream();

    // Directly play custom stream
    setTimeout(() => {
      audioEngine.playRadioStream(newStation.url);
      setIsRadioPlaying(true);
      onMusicPlayingChange(true);
    }, 200);
  };

  // Volume Slider change
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setRadioVolume(val);
    audioEngine.setVolume('radio', val);
  };

  // Handle YouTube State Toggle
  const handleToggleYoutube = () => {
    audioEngine.triggerKeyboardClick();
    
    if (isYoutubeActive) {
      setIsYoutubeActive(false);
      onYoutubeStateChange(false);
    } else {
      // Pause live radio stream if active
      if (isRadioPlaying) {
        audioEngine.stopRadioStream();
        setIsRadioPlaying(false);
        onMusicPlayingChange(false);
      }

      setIsYoutubeActive(true);
      onYoutubeStateChange(true);
    }
  };

  // Change YouTube video
  const handleSelectVideo = (index) => {
    audioEngine.triggerKeyboardClick();
    setCurrentVideoIdx(index);
    
    // Ensure player restarts with new video ID
    if (isYoutubeActive) {
      setIsYoutubeActive(false);
      onYoutubeStateChange(false);
      setTimeout(() => {
        setIsYoutubeActive(true);
        onYoutubeStateChange(true);
      }, 100);
    }
  };

  // Tab switcher
  const handleTabChange = (tab) => {
    audioEngine.triggerKeyboardClick();
    setActiveTab(tab);
  };

  return (
    <div className="music-hub-panel">
      {/* Tab Navigation */}
      <div className="music-tabs">
        <button
          className={`music-tab-btn ${activeTab === 'radio' ? 'active' : ''}`}
          onClick={() => handleTabChange('radio')}
        >
          <Radio size={14} className="tab-icon" />
          <span>Live Radio Stations</span>
        </button>
        <button
          className={`music-tab-btn ${activeTab === 'youtube' ? 'active' : ''}`}
          onClick={() => handleTabChange('youtube')}
        >
          <Youtube size={14} className="tab-icon" />
          <span>YouTube Ambient</span>
        </button>
      </div>

      <div className="music-body">
        {activeTab === 'radio' ? (
          /* LIVE RADIO PANEL */
          <div className="radio-panel-content">
            <div className="station-display">
              <div className={`waveform-pulse ${isRadioPlaying ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="station-details">
                <h3>{RADIO_STATIONS[currentStationIdx].name}</h3>
                <p className="marquee-text-container">
                  <span className={`marquee-text ${isRadioPlaying ? 'animate' : ''}`}>
                    {RADIO_STATIONS[currentStationIdx].description} • Real-time Canvas Sync Enabled
                  </span>
                </p>
              </div>
            </div>

            {/* Play and Volume Controls */}
            <div className="player-toolbar">
              <button 
                className={`radio-play-btn ${isRadioPlaying ? 'playing' : ''}`}
                onClick={handleToggleRadio}
              >
                {isRadioPlaying ? <Pause size={20} /> : <Play size={20} />}
                <span>{isRadioPlaying ? 'PAUSE RADIO' : 'PLAY RADIO'}</span>
              </button>

              <div className="radio-volume-row">
                <Volume2 size={16} className="volume-icon" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={radioVolume}
                  onChange={handleVolumeChange}
                  className="radio-volume-slider"
                />
                <span className="vol-percent">{Math.round(radioVolume * 100)}%</span>
              </div>
            </div>

            {/* Curation List */}
            <div className="station-list">
              {RADIO_STATIONS.map((station, idx) => (
                <button
                  key={idx}
                  className={`station-item ${currentStationIdx === idx ? 'selected' : ''}`}
                  onClick={() => handleSelectStation(idx)}
                >
                  <Music size={12} className="station-icon" />
                  <div className="station-info">
                    <span className="name">{station.name}</span>
                    <span className="desc">{station.description.substring(0, 42)}...</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom URL Input */}
            <form onSubmit={handleLoadCustomStream} className="custom-stream-form">
              <div className="input-group">
                <Link2 size={14} className="input-icon" />
                <input
                  type="url"
                  placeholder="Paste direct MP3 stream URL..."
                  value={customStreamUrl}
                  onChange={(e) => setCustomStreamUrl(e.target.value)}
                  className="stream-input"
                />
                <button type="submit" className="load-stream-btn" disabled={!customStreamUrl.trim()}>
                  Load
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* YOUTUBE AMBIENT PANEL */
          <div className="youtube-panel-content">
            <div className="youtube-display-info">
              <div className="yt-icon-wrapper">
                <Youtube size={24} className="yt-logo" />
              </div>
              <div className="yt-details">
                <h3>{YOUTUBE_VIDEOS[currentVideoIdx].name}</h3>
                <p>Loads via standard YouTube Embedded Frame player. Visualizer reacts via beat simulation.</p>
              </div>
              <button 
                className={`youtube-toggle-player-btn ${isYoutubeActive ? 'active' : ''}`}
                onClick={handleToggleYoutube}
              >
                {isYoutubeActive ? 'Hide Player' : 'Launch Player'}
              </button>
            </div>

            {/* Visual Embed IFrame */}
            {isYoutubeActive && (
              <div className="youtube-player-wrapper">
                <iframe
                  className="youtube-iframe"
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEOS[currentVideoIdx].id}?enablejsapi=1&autoplay=1&controls=1&rel=0&origin=${window.location.origin}`}
                  title="YouTube Ambient Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Curated list */}
            <div className="video-list">
              {YOUTUBE_VIDEOS.map((video, idx) => (
                <button
                  key={idx}
                  className={`video-item ${currentVideoIdx === idx ? 'selected' : ''}`}
                  onClick={() => handleSelectVideo(idx)}
                >
                  <Youtube size={12} className="video-icon" />
                  <div className="video-info">
                    <span className="name">{video.name}</span>
                    <span className="desc">{video.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicHub;
