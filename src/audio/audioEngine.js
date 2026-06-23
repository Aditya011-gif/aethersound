class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.noiseBuffer = null;
    this.isInitialized = false;

    // Define sound channels
    this.channels = {
      rain: {
        playing: false,
        volume: 0.5,
        gainNode: null,
        sources: [],
        filterNode: null,
        lfoNode: null,
        params: { intensity: 0.5 } // intensity controls filter cutoff and noise gain
      },
      wind: {
        playing: false,
        volume: 0.0,
        gainNode: null,
        sources: [],
        filterNode: null,
        lfoNode: null,
        params: { speed: 0.4 } // speed controls LFO frequency and resonance
      },
      campfire: {
        playing: false,
        volume: 0.0,
        gainNode: null,
        sources: [],
        crackleInterval: null,
        params: { crackleRate: 0.5 } // crackleRate controls crackle frequency
      },
      drone: {
        playing: false,
        volume: 0.0,
        gainNode: null,
        sources: [],
        filterNode: null,
        params: { depth: 0.5 } // depth controls resonance and sweep range
      },
      binaural: {
        playing: false,
        volume: 0.0,
        gainNode: null,
        sources: [],
        params: { beatFreq: 5 } // beat frequency in Hz (offset between Left and Right)
      },
      lofi: {
        playing: false,
        volume: 0.0,
        gainNode: null,
        sources: [],
        schedulerTimeout: null,
        currentStep: 0,
        params: { tempo: 0.5 } // tempo controls chord sequence speed
      }
    };
  }

  // Initialize Web Audio Context
  init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master routing
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Build common white noise buffer
    this.createNoiseBuffer();

    // Create channel gain nodes and connect them to master
    Object.keys(this.channels).forEach(channelKey => {
      const channel = this.channels[channelKey];
      channel.gainNode = this.ctx.createGain();
      channel.gainNode.gain.value = 0; // Start at 0 volume
      channel.gainNode.connect(this.masterGain);
    });

    this.isInitialized = true;
    console.log("Audio Engine Initialized.");
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createNoiseBuffer() {
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 2 * sampleRate; // 2 seconds of noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  // Start a specific sound channel
  startChannel(name) {
    if (!this.isInitialized) this.init();
    this.resume();

    const channel = this.channels[name];
    if (channel.playing) return;

    channel.playing = true;
    // Fade in volume to its target
    channel.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    channel.gainNode.gain.linearRampToValueAtTime(channel.volume, this.ctx.currentTime + 0.5);

    switch (name) {
      case 'rain':
        this.setupRainSynth();
        break;
      case 'wind':
        this.setupWindSynth();
        break;
      case 'campfire':
        this.setupCampfireSynth();
        break;
      case 'drone':
        this.setupDroneSynth();
        break;
      case 'binaural':
        this.setupBinauralSynth();
        break;
      case 'lofi':
        this.setupLofiSynth();
        break;
    }
  }

  // Stop a specific sound channel
  stopChannel(name) {
    const channel = this.channels[name];
    if (!channel.playing) return;

    channel.playing = false;

    // Fade out gain node
    if (channel.gainNode) {
      channel.gainNode.gain.setValueAtTime(channel.gainNode.gain.value, this.ctx.currentTime);
      channel.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
    }

    // Clean up nodes after fade out completes
    setTimeout(() => {
      if (!channel.playing) {
        channel.sources.forEach(src => {
          try { src.stop(); } catch (e) {}
          try { src.disconnect(); } catch (e) {}
        });
        channel.sources = [];

        // Specific cleanups
        if (channel.lfoNode) {
          try { channel.lfoNode.stop(); } catch (e) {}
          channel.lfoNode = null;
        }
        if (channel.filterNode) {
          channel.filterNode = null;
        }
        if (channel.crackleInterval) {
          clearInterval(channel.crackleInterval);
          channel.crackleInterval = null;
        }
        if (channel.schedulerTimeout) {
          clearTimeout(channel.schedulerTimeout);
          channel.schedulerTimeout = null;
        }
      }
    }, 600);
  }

  // Set the target volume of a channel
  setVolume(name, val) {
    const channel = this.channels[name];
    channel.volume = parseFloat(val);

    if (this.isInitialized && channel.playing && channel.gainNode) {
      channel.gainNode.gain.setValueAtTime(channel.gainNode.gain.value, this.ctx.currentTime);
      channel.gainNode.gain.linearRampToValueAtTime(channel.volume, this.ctx.currentTime + 0.1);
    }
  }

  // Set custom slider parameters for a channel
  setParameter(name, paramName, val) {
    const channel = this.channels[name];
    channel.params[paramName] = parseFloat(val);

    if (!this.isInitialized || !channel.playing) return;

    if (name === 'rain' && paramName === 'intensity') {
      if (channel.filterNode) {
        // High intensity = higher filter cutoff (clearer/brighter rain)
        const cutoff = 400 + val * 1200;
        channel.filterNode.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
      }
    } else if (name === 'wind' && paramName === 'speed') {
      if (channel.lfoNode && channel.lfoGain) {
        // Higher speed = faster wind fluctuations and wider sweep
        channel.lfoNode.frequency.setValueAtTime(0.05 + val * 0.25, this.ctx.currentTime);
        channel.lfoGain.gain.setValueAtTime(100 + val * 300, this.ctx.currentTime);
      }
    } else if (name === 'campfire' && paramName === 'crackleRate') {
      // Re-initialize crackle interval timer
      if (channel.crackleInterval) {
        clearInterval(channel.crackleInterval);
      }
      this.setupCampfireCrackling();
    } else if (name === 'drone' && paramName === 'depth') {
      if (channel.filterNode) {
        // Higher depth = more filter resonance (Q)
        channel.filterNode.Q.setValueAtTime(2 + val * 10, this.ctx.currentTime);
      }
    } else if (name === 'binaural' && paramName === 'beatFreq') {
      // Adjust Right oscillator to shift offset frequency
      const leftFreq = 100;
      const rightOsc = channel.sources.find(src => src.label === 'rightOsc');
      if (rightOsc) {
        rightOsc.frequency.setValueAtTime(leftFreq + val, this.ctx.currentTime);
      }
    }
  }

  // --- Rain Procedural Synthesis ---
  setupRainSynth() {
    const channel = this.channels.rain;
    
    // Create noise source
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    // Filter noise to sound like rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const initialCutoff = 400 + channel.params.intensity * 1200;
    filter.frequency.value = initialCutoff;
    filter.Q.value = 1.0;

    // Modulate gain slightly to simulate natural variance
    const amplitudeLFO = this.ctx.createOscillator();
    amplitudeLFO.frequency.value = 0.2; // 0.2 Hz
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.15; // Modulate gain by up to 15%

    const lfoBiasNode = this.ctx.createGain();
    lfoBiasNode.gain.value = 0.85;

    // Route
    amplitudeLFO.connect(lfoGain);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.8;
    
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(channel.gainNode);

    // Start nodes
    noiseSource.start();
    amplitudeLFO.start();

    channel.sources.push(noiseSource, amplitudeLFO);
    channel.filterNode = filter;
  }

  // --- Wind Procedural Synthesis ---
  setupWindSynth() {
    const channel = this.channels.wind;

    // Noise source
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    // Bandpass filter with high resonance (creates a whistle/howl)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 5.0; // High Q for howling

    // LFO to slowly sweep filter frequency (wind gusts)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + channel.params.speed * 0.25; // How fast wind gust frequency changes

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 100 + channel.params.speed * 300; // Sweep range in Hz

    // Connect LFO to filter frequency
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Route audio
    noiseSource.connect(filter);
    filter.connect(channel.gainNode);

    // Start
    noiseSource.start();
    lfo.start();

    channel.sources.push(noiseSource, lfo);
    channel.filterNode = filter;
    channel.lfoNode = lfo;
    channel.lfoGain = lfoGain;
  }

  // --- Campfire Procedural Synthesis ---
  setupCampfireSynth() {
    const channel = this.channels.campfire;

    // 1. Warm low rumble (constant)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 75; // Sub-bass flame rumble

    noiseSource.connect(lowpass);
    lowpass.connect(channel.gainNode);
    noiseSource.start();
    channel.sources.push(noiseSource);

    // 2. Crackling impulses (periodic scheduler)
    this.setupCampfireCrackling();
  }

  setupCampfireCrackling() {
    const channel = this.channels.campfire;
    const crackleRate = channel.params.crackleRate; // 0 to 1

    // Schedule next crackle based on rate
    const scheduleNext = () => {
      if (!channel.playing) return;

      this.triggerCrackle();

      // Interval timing: higher crackleRate = smaller delay
      const baseDelay = 1500 - crackleRate * 1200; // 1500ms down to 300ms
      const randomDelay = Math.random() * baseDelay + 100;

      channel.crackleInterval = setTimeout(scheduleNext, randomDelay);
    };

    channel.crackleInterval = setTimeout(scheduleNext, 200);
  }

  triggerCrackle() {
    if (!this.isInitialized) return;
    const channel = this.channels.campfire;

    // Crackle shape: fast attack, exponential decay click
    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    crackleGain.gain.linearRampToValueAtTime(Math.random() * 0.15 + 0.05, this.ctx.currentTime + 0.001);
    crackleGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + Math.random() * 0.05 + 0.015);

    // Filter to clicky frequency range
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200 + Math.random() * 2200; // High frequency crackle
    filter.Q.value = 4.0;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    source.connect(filter);
    filter.connect(crackleGain);
    crackleGain.connect(channel.gainNode);

    source.start();

    // Self cleanup after completion
    setTimeout(() => {
      try { source.stop(); } catch(e) {}
      try { source.disconnect(); } catch(e) {}
      try { filter.disconnect(); } catch(e) {}
      try { crackleGain.disconnect(); } catch(e) {}
    }, 100);
  }

  // --- Deep Space Drone Procedural Synthesis ---
  setupDroneSynth() {
    const channel = this.channels.drone;

    // Low Sawtooth Wave Oscillator
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55; // A1 note

    // Second oscillator slightly detuned for chorus effect
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 55.4; // Slightly detuned

    // Resonant low-pass filter to make it warm and spacey
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 110;
    filter.Q.value = 2 + channel.params.depth * 10; // Resonance

    // Modulate filter cutoff slowly for "breathing" engine effect
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // Very slow 0.08 Hz

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 40; // Sweeps filter between 70Hz and 150Hz

    // Connect LFO to filter cutoff
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Route
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(channel.gainNode);

    // Start
    osc1.start();
    osc2.start();
    lfo.start();

    channel.sources.push(osc1, osc2, lfo);
    channel.filterNode = filter;
  }

  // --- Binaural Beats (Focus Drone) Synthesis ---
  setupBinauralSynth() {
    const channel = this.channels.binaural;
    const beatFreq = channel.params.beatFreq;

    const leftFreq = 100; // Base carrier frequency 100Hz (deep sine)
    const rightFreq = leftFreq + beatFreq; // Beat frequency offset

    // Left oscillator
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.value = leftFreq;

    // Right oscillator
    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.value = rightFreq;
    oscRight.label = 'rightOsc'; // tag to find and update frequency later

    // Stereo Panning
    const pannerLeft = this.ctx.createStereoPanner();
    pannerLeft.pan.value = -1.0; // Pan hard left

    const pannerRight = this.ctx.createStereoPanner();
    pannerRight.pan.value = 1.0; // Pan hard right

    // Route
    oscLeft.connect(pannerLeft);
    pannerLeft.connect(channel.gainNode);

    oscRight.connect(pannerRight);
    pannerRight.connect(channel.gainNode);

    // Start
    oscLeft.start();
    oscRight.start();

    channel.sources.push(oscLeft, oscRight);
  }

  // --- Procedural Lofi Ambient Synth Loop ---
  setupLofiSynth() {
    const channel = this.channels.lofi;
    channel.currentStep = 0;

    // Chord Progression (electric piano triangle waves with soft envelope)
    // Abmaj7 (Ab, C, Eb, G) -> Gm7 (G, Bb, D, F) -> Fm7 (F, Ab, C, Eb) -> Bb7 (Bb, D, F, Ab)
    this.lofiChords = [
      [103.83, 130.81, 155.56, 196.00], // Abmaj7
      [98.00, 116.54, 146.83, 174.61],  // Gm7
      [87.31, 103.83, 130.81, 155.56],  // Fm7
      [116.54, 146.83, 174.61, 207.65]  // Bb7
    ];

    const playLoop = () => {
      if (!channel.playing) return;

      const step = channel.currentStep % this.lofiChords.length;
      const frequencies = this.lofiChords[step];

      // Play soft chords
      this.triggerLofiChord(frequencies);

      // Play soft kick beat
      this.triggerSoftKick();

      // Trigger a soft rimshot/snare on half beats
      setTimeout(() => {
        if (channel.playing) this.triggerSoftSnare();
      }, 1000);

      channel.currentStep++;
      
      // Schedule next chord in 4 seconds
      channel.schedulerTimeout = setTimeout(playLoop, 4000);
    };

    playLoop();
  }

  triggerLofiChord(frequencies) {
    const channel = this.channels.lofi;

    // Play notes together with slow attack and release
    frequencies.forEach(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle'; // Soft harmonic structure
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.8); // 800ms fade-in
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + 2.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.8); // Fade-out

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600; // Warm filter roll-off

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(channel.gainNode);

      osc.start();
      
      // Stop and clean up after 4 seconds
      setTimeout(() => {
        try { osc.stop(); } catch(e) {}
        try { osc.disconnect(); } catch(e) {}
        try { filter.disconnect(); } catch(e) {}
        try { gain.disconnect(); } catch(e) {}
      }, 4000);
    });
  }

  triggerSoftKick() {
    const channel = this.channels.lofi;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';

    // Kick pitch sweep: 120Hz -> 50Hz
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(channel.gainNode);
    osc.start();

    setTimeout(() => {
      try { osc.stop(); } catch(e) {}
      try { osc.disconnect(); } catch(e) {}
      try { gain.disconnect(); } catch(e) {}
    }, 200);
  }

  triggerSoftSnare() {
    const channel = this.channels.lofi;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    // Filter to snare range
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(channel.gainNode);
    noiseSource.start();

    setTimeout(() => {
      try { noiseSource.stop(); } catch(e) {}
      try { noiseSource.disconnect(); } catch(e) {}
      try { filter.disconnect(); } catch(e) {}
      try { gain.disconnect(); } catch(e) {}
    }, 250);
  }

  // --- Keyboard Press Sound Synthesis ---
  triggerKeyboardClick() {
    if (!this.isInitialized) return;
    this.resume();

    // High frequency tick (mechanical switch click)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    
    // Pitch sweep for organic click: 2400Hz -> 1200Hz
    osc.frequency.setValueAtTime(2400 + Math.random() * 400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.008);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime); // Soft volume click
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.01);

    // Resonant bandpass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 3.0;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();

    setTimeout(() => {
      try { osc.stop(); } catch(e) {}
      try { osc.disconnect(); } catch(e) {}
      try { filter.disconnect(); } catch(e) {}
      try { gain.disconnect(); } catch(e) {}
    }, 30);
  }

  // --- Timer Alert Meditation Chime ---
  playTimerChime() {
    if (!this.isInitialized) this.init();
    this.resume();

    const playTone = (freq, delay, volume, duration) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime + delay);

      setTimeout(() => {
        try { osc.stop(); } catch(e) {}
        try { osc.disconnect(); } catch(e) {}
        try { gain.disconnect(); } catch(e) {}
      }, (delay + duration + 0.5) * 1000);
    };

    // A beautiful meditation bell triad chord (E Major: E4, G#4, B4, E5)
    playTone(329.63, 0.0, 0.25, 3.5);  // E4
    playTone(415.30, 0.2, 0.20, 3.0);  // G#4
    playTone(493.88, 0.4, 0.15, 2.5);  // B4
    playTone(659.25, 0.6, 0.12, 2.0);  // E5
  }

  // Get analyser byte frequency data for canvas visualizer
  getAnalyserData() {
    if (!this.isInitialized || !this.analyser) {
      return { freqData: new Uint8Array(0), timeData: new Uint8Array(0) };
    }
    const bufferLength = this.analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(freqData);
    this.analyser.getByteTimeDomainData(timeData);
    return { freqData, timeData };
  }
}

// Singleton export
const audioEngine = new AudioEngine();
export default audioEngine;
