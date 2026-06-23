import React, { useRef, useEffect } from 'react';
import audioEngine from '../audio/audioEngine';

const CanvasVisualizer = ({ theme, isYoutubeActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize handler
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle state for Nebula theme
    const particles = [];
    const maxParticles = 100;
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.6 - 0.2,
        color: Math.random() > 0.5 ? 'rgba(139, 92, 246,' : 'rgba(6, 182, 212,',
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    // Vortex rotation angle
    let vortexAngle = 0;

    // Render loop
    const render = () => {
      // Get data from audioEngine
      const { freqData } = audioEngine.getAnalyserData(isYoutubeActive);
      
      // Calculate frequency band averages
      let bass = 0;
      let mid = 0;
      let treble = 0;

      if (freqData && freqData.length > 0) {
        // Bass: bins 0 to 10 (approx. 0 - 340Hz)
        for (let i = 0; i < 10; i++) bass += freqData[i] || 0;
        bass /= 10;

        // Mid: bins 10 to 45 (approx. 340 - 1500Hz)
        for (let i = 10; i < 45; i++) mid += freqData[i] || 0;
        mid /= 35;

        // Treble: bins 45 to 100 (approx. 1500 - 3400Hz)
        for (let i = 45; i < 100; i++) treble += freqData[i] || 0;
        treble /= 55;
      }

      // Clear with very slight alpha for a trail effect
      ctx.fillStyle = 'rgba(8, 6, 15, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (theme === 'aurora') {
        // Draw Aurora waves
        const wavesCount = 3;
        const time = Date.now() * 0.0008;

        for (let w = 0; w < wavesCount; w++) {
          ctx.beginPath();
          
          const audioOffset = w === 0 ? bass : w === 1 ? mid : treble;
          const amplitude = 30 + (audioOffset * 0.4);
          const frequency = 0.003 - (w * 0.0005);
          const yCenter = canvas.height * (0.4 + w * 0.15);

          // Custom gradients for waves
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          if (w === 0) {
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
            gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.12 + (bass / 1000)})`);
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          } else if (w === 1) {
            gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
            gradient.addColorStop(0.5, `rgba(6, 182, 212, ${0.1 + (mid / 1000)})`);
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
          } else {
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
            gradient.addColorStop(0.5, `rgba(16, 185, 129, ${0.08 + (treble / 1000)})`);
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          }

          ctx.fillStyle = gradient;

          ctx.moveTo(0, canvas.height);
          for (let x = 0; x <= canvas.width; x += 10) {
            const y = yCenter + Math.sin(x * frequency + time + w) * amplitude * Math.cos(x * 0.001 - time * 0.5);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(canvas.width, canvas.height);
          ctx.closePath();
          ctx.fill();
        }

      } else if (theme === 'nebula') {
        // Draw responsive particle system
        particles.forEach(p => {
          // React to bass / mids
          const audioForce = (bass / 255) * 2;
          const currentSpeedY = p.speedY * (1 + audioForce * 1.5);
          
          p.x += p.speedX;
          p.y += currentSpeedY;

          // Boundary wrapping
          if (p.y < 0) {
            p.y = canvas.height;
            p.x = Math.random() * canvas.width;
          }
          if (p.x < 0 || p.x > canvas.width) {
            p.speedX *= -1;
          }

          // Size pulse based on treble
          const pulseSize = p.size * (1 + (treble / 255) * 2.0);

          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha + (bass / 512)})`;
          
          // Outer glow for larger/active particles
          if (bass > 40 && p.size > 1.8) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color.includes('139') ? 'rgb(139, 92, 246)' : 'rgb(6, 182, 212)';
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        });
        ctx.shadowBlur = 0; // Reset

      } else if (theme === 'vortex') {
        // Concentric spinning rings pulsing to frequency
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.45;
        
        vortexAngle += 0.005 + (bass / 2500);

        const ringCount = 3;
        for (let r = 0; r < ringCount; r++) {
          const mod = r === 0 ? bass : r === 1 ? mid : treble;
          const currentRadius = baseRadius * (0.6 + r * 0.4) + (mod * 0.15);
          const points = 60 + r * 20;
          const color = r === 0 ? 'rgba(139, 92, 246,' : r === 1 ? 'rgba(6, 182, 212,' : 'rgba(236, 72, 153,';

          ctx.beginPath();
          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2 + (r * 0.2) + (vortexAngle * (r % 2 === 0 ? 1 : -1));
            
            // Add tiny wave displacement based on freq
            const waveIndex = Math.floor((i / points) * (freqData ? freqData.length : 128));
            const frequencyVal = freqData ? freqData[waveIndex] || 0 : 0;
            const displacement = (frequencyVal / 255) * 12;

            const radius = currentRadius + displacement;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.strokeStyle = `${color}${0.2 + (mod / 512)})`;
          ctx.lineWidth = 1.5 + (mod / 100);
          ctx.stroke();

          // Draw orbital dots
          ctx.fillStyle = `${color}${0.6 + (mod / 512)})`;
          for (let i = 0; i < points; i += 10) {
            const angle = (i / points) * Math.PI * 2 + (r * 0.2) + (vortexAngle * (r % 2 === 0 ? 1 : -1));
            const x = centerX + Math.cos(angle) * (currentRadius);
            const y = centerY + Math.sin(angle) * (currentRadius);
            
            ctx.beginPath();
            ctx.arc(x, y, 2 + (mod / 80), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [theme, isYoutubeActive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default CanvasVisualizer;
