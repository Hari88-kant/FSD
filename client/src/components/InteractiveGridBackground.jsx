import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function InteractiveGridBackground() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    const mouse = { x: null, y: null, radius: 140 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Grid nodes representing power substations / circuit junctions
    let nodes = [];
    let pulses = [];

    const isDark = theme === 'dark';
    const nodeCount = Math.min(55, Math.floor((width * height) / 22000));

    function initNodes() {
      nodes = [];
      pulses = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: Math.random() * 2.2 + 1.2,
          isHub: i % 7 === 0, // Major electrical substation node
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
    }

    initNodes();

    let lastPulseTime = 0;

    function render(timestamp) {
      ctx.clearRect(0, 0, width, height);

      // Render subtle ambient glowing gradient orbs
      const darkGradient = ctx.createRadialGradient(
        width * 0.25,
        height * 0.25,
        50,
        width * 0.25,
        height * 0.25,
        width * 0.65
      );
      if (isDark) {
        darkGradient.addColorStop(0, 'rgba(14, 116, 144, 0.12)'); // cyan glow
        darkGradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.05)');
        darkGradient.addColorStop(1, 'rgba(7, 11, 20, 0)');
      } else {
        darkGradient.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
        darkGradient.addColorStop(0.5, 'rgba(241, 245, 249, 0.04)');
        darkGradient.addColorStop(1, 'rgba(248, 250, 252, 0)');
      }
      ctx.fillStyle = darkGradient;
      ctx.fillRect(0, 0, width, height);

      const secondaryGrad = ctx.createRadialGradient(
        width * 0.8,
        height * 0.75,
        40,
        width * 0.8,
        height * 0.75,
        width * 0.55
      );
      if (isDark) {
        secondaryGrad.addColorStop(0, 'rgba(245, 158, 11, 0.08)'); // amber power glow
        secondaryGrad.addColorStop(1, 'rgba(7, 11, 20, 0)');
      } else {
        secondaryGrad.addColorStop(0, 'rgba(16, 185, 129, 0.07)');
        secondaryGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = secondaryGrad;
      ctx.fillRect(0, 0, width, height);

      // Update and draw grid nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Mouse gentle magnetic pull
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            node.x += (dx / dist) * force * 1.5;
            node.y += (dy / dist) * force * 1.5;
          }
        }

        // Draw node
        node.pulsePhase += 0.03;
        const pulseSize = Math.sin(node.pulsePhase) * 0.8;

        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1, node.radius + pulseSize), 0, Math.PI * 2);

        if (isDark) {
          ctx.fillStyle = node.isHub ? '#fbbf24' : '#38bdf8';
          ctx.shadowColor = node.isHub ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.5)';
          ctx.shadowBlur = node.isHub ? 12 : 6;
        } else {
          ctx.fillStyle = node.isHub ? '#d97706' : '#2563eb';
          ctx.shadowColor = 'rgba(37, 99, 235, 0.3)';
          ctx.shadowBlur = 4;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Draw connecting transmission circuit lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 135;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (isDark ? 0.35 : 0.22);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);

            if (isDark) {
              ctx.strokeStyle =
                nodes[i].isHub || nodes[j].isHub
                  ? `rgba(245, 158, 11, ${alpha * 1.3})`
                  : `rgba(56, 189, 248, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(37, 99, 235, ${alpha * 0.85})`;
            }

            ctx.lineWidth = nodes[i].isHub || nodes[j].isHub ? 1.4 : 0.8;
            ctx.stroke();

            // Random electrical pulse along transmission line
            if (timestamp - lastPulseTime > 1600 && Math.random() < 0.02) {
              pulses.push({
                from: nodes[i],
                to: nodes[j],
                progress: 0,
                speed: 0.025,
                color: isDark ? '#38bdf8' : '#2563eb'
              });
              lastPulseTime = timestamp;
            }
          }
        }
      }

      // Draw animated electrical energy packets traveling along lines
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const px = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.progress;
        const py = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#fef08a' : '#1d4ed8';
        ctx.shadowColor = isDark ? '#fbbf24' : '#3b82f6';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="interactive-grid-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
