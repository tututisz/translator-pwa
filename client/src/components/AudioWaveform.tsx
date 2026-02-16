import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  color?: string;
}

export function AudioWaveform({ isActive, color = 'currentColor' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const bars = 20;
      const barWidth = width / bars;
      const centerY = height / 2;

      ctx.beginPath();
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;
        const randomHeight = Math.random() * (height * 0.4);
        const y = centerY - randomHeight / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw bottom half
      ctx.beginPath();
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;
        const randomHeight = Math.random() * (height * 0.4);
        const y = centerY + randomHeight / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className="w-full h-auto"
      style={{ maxWidth: '200px' }}
    />
  );
}
