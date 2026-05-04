import { useRef, useEffect, useCallback } from 'react';
import type { PlantedPlant, PlantType } from '@/types/game';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  size: number;
}

interface PlantCanvasProps {
  plant: PlantedPlant;
  plantType: PlantType;
  size: number;
  onTap: () => void;
  onHarvest: () => void;
  isPressed: boolean;
}

export function PlantCanvas({ plant, plantType, size, onTap, onHarvest, isPressed }: PlantCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const floatsRef = useRef<FloatingText[]>([]);
  const timeRef = useRef(0);
  const lastPlantRef = useRef(plant);

  // Spawn particles helper
  const spawnParticles = useCallback((cx: number, cy: number, color: string, count: number, speed = 3) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * speed;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp - 2,
        life: 1,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }, []);

  const addFloat = useCallback((text: string, x: number, y: number, color: string, size = 16) => {
    floatsRef.current.push({
      x, y, text, life: 1, color, size,
    });
  }, []);

  // Track state changes
  useEffect(() => {
    const prev = lastPlantRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = size / 2;
    const cy = size / 2;

    // Growth -> mature
    if (!prev.isMature && plant.isMature) {
      spawnParticles(cx, cy, plantType.color, 25, 5);
      addFloat('✨ Созрело!', cx, cy - size * 0.2, '#ffd600', 18);
    }

    // Water increase
    if (plant.moisture > prev.moisture && !plant.isMature) {
      const diff = plant.moisture - prev.moisture;
      if (diff > 5) {
        spawnParticles(cx, cy, '#42a5f5', 8, 3);
        addFloat(`+${Math.round(diff)}%`, cx + (Math.random() - 0.5) * 40, cy - size * 0.3, '#42a5f5', 14);
      }
    }

    lastPlantRef.current = { ...plant };
  }, [plant, plantType, size, spawnParticles, addFloat]);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    const draw = () => {
      timeRef.current += 0.04;
      const t = timeRef.current;
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.32;

      ctx.clearRect(0, 0, size, size);

      // Background glow for mature
      if (plant.isMature) {
        const glowPulse = 0.5 + Math.sin(t * 2) * 0.2;
        ctx.globalAlpha = glowPulse * 0.3;
        const gradient = ctx.createRadialGradient(cx, cy - r * 0.2, 0, cx, cy - r * 0.2, r * 1.8);
        gradient.addColorStop(0, plantType.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = 1;
      }

      // Soil/ground
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.85, r * 0.8, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.82, r * 0.6, r * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sway
      const sway = Math.sin(t) * size * 0.015;
      const pressScale = isPressed ? 0.92 : 1;
      const scaleX = pressScale;
      const scaleY = pressScale;

      ctx.save();
      ctx.translate(cx, cy + r * 0.8);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-cx, -(cy + r * 0.8));

      // Stem
      const stemColor = plant.moisture < 20 ? '#8d6e63' : '#4caf50';
      ctx.strokeStyle = stemColor;
      ctx.lineWidth = size * 0.05;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.75);
      const stemTopX = cx + sway * 0.5;
      const stemTopY = cy - r * 0.15;
      ctx.bezierCurveTo(
        cx + sway * 0.3,
        cy + r * 0.3,
        cx - sway * 0.2,
        cy + r * 0.05,
        stemTopX,
        stemTopY
      );
      ctx.stroke();

      // Plant-specific drawing
      drawPlantBody(ctx, plant, plantType, cx, cy, r, sway, t, size);

      ctx.restore();

      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.025;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Floating texts
      for (let i = floatsRef.current.length - 1; i >= 0; i--) {
        const f = floatsRef.current[i];
        f.y -= 1.2;
        f.life -= 0.018;
        if (f.life <= 0) {
          floatsRef.current.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = f.life;
        ctx.fillStyle = f.color;
        ctx.font = `bold ${f.size}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(f.text, f.x, f.y);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Moisture indicator ring
      if (!plant.isMature) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
        ctx.stroke();

        const moistureAngle = (plant.moisture / 100) * Math.PI * 2 - Math.PI / 2;
        const moistColor = plant.moisture > 60 ? '#42a5f5' : plant.moisture > 30 ? '#ffa726' : '#ef5350';
        ctx.strokeStyle = moistColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.15, -Math.PI / 2, moistureAngle);
        ctx.stroke();
      }

      // Growth indicator
      if (!plant.isMature) {
        const barWidth = r * 0.8;
        const barHeight = 4;
        const barX = cx - barWidth / 2;
        const barY = cy + r * 1.25;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 2);
        ctx.fill();

        ctx.fillStyle = plantType.color;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth * (plant.growth / 100), barHeight, 2);
        ctx.fill();
      }

      // Mature indicator
      if (plant.isMature) {
        ctx.fillStyle = 'rgba(255,214,0,0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffd600';
        ctx.font = `bold ${size * 0.1}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText('СОБРАТЬ', cx, cy);
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size, plant, plantType, isPressed]);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (plant.isMature) {
      onHarvest();
    } else {
      onTap();
    }
  }, [plant.isMature, onTap, onHarvest]);

  return (
    <canvas
      ref={canvasRef}
      onTouchStart={handleTap}
      onClick={handleTap}
      style={{
        width: size,
        height: size,
        touchAction: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    />
  );
}

function drawPlantBody(
  ctx: CanvasRenderingContext2D,
  plant: PlantedPlant,
  type: PlantType,
  cx: number,
  cy: number,
  r: number,
  sway: number,
  t: number,
  size: number
) {
  const growth = plant.isMature ? 1 : plant.growth / 100;
  const hue = type.color;

  if (!plant.isMature) {
    // Growing plant - leaves
    const leafSize = r * (0.2 + growth * 0.55);
    const leafCount = 2 + Math.floor(growth * 3);

    ctx.shadowColor = hue + '44';
    ctx.shadowBlur = 12;

    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2 + t * 0.2 * (i % 2 === 0 ? 1 : -1);
      const lx = cx + Math.cos(angle) * leafSize * 0.7 + sway * (i % 2 === 0 ? 1 : -1) * 0.3;
      const ly = cy - r * 0.15 + Math.sin(angle) * leafSize * 0.3;
      const w = leafSize * (0.6 + growth * 0.3);
      const h = leafSize * 0.35;

      ctx.fillStyle = interpolateColor('#4caf50', hue, 0.3 + growth * 0.4);
      ctx.beginPath();
      ctx.ellipse(lx, ly, w, h, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Bud / center
    const budSize = leafSize * (0.3 + growth * 0.5);
    ctx.fillStyle = interpolateColor('#81c784', hue, growth);
    ctx.beginPath();
    ctx.arc(cx + sway * 0.3, cy - r * 0.2, budSize, 0, Math.PI * 2);
    ctx.fill();

    // Moisture drops
    if (plant.moisture > 50) {
      const dropCount = Math.floor(plant.moisture / 20);
      ctx.fillStyle = 'rgba(100,180,255,0.6)';
      for (let i = 0; i < dropCount; i++) {
        const dx = cx + r * (0.3 + i * 0.15) + sway;
        const dy = cy - r * (0.4 + i * 0.1) + Math.sin(t + i) * 3;
        ctx.beginPath();
        ctx.arc(dx, dy, size * 0.025, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Mature flower
    const petals = type.rarity === 'legendary' ? 12 : type.rarity === 'epic' ? 10 : 8;
    const pr = r * 0.4;

    ctx.shadowColor = hue + '88';
    ctx.shadowBlur = 24;

    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 + t * 0.3;
      const px = cx + Math.cos(angle) * pr * 0.7 + sway * 0.3;
      const py = cy - r * 0.2 + Math.sin(angle) * pr * 0.7;
      const pw = pr * 0.42;
      const ph = pr * 0.24;

      ctx.fillStyle = i % 2 === 0 ? hue : lightenColor(hue, 20);
      ctx.beginPath();
      ctx.ellipse(px, py, pw, ph, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Center
    ctx.fillStyle = '#ff6f00';
    ctx.beginPath();
    ctx.arc(cx + sway * 0.2, cy - r * 0.2, pr * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + sway * 0.2, cy - r * 0.2, pr * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Sparkles for rare+
    if (type.rarity === 'epic' || type.rarity === 'legendary') {
      for (let i = 0; i < 6; i++) {
        const sa = (t * 0.5 + (i / 6) * Math.PI * 2);
        const sr = r * (0.8 + Math.sin(t + i) * 0.15);
        const sx = cx + Math.cos(sa) * sr;
        const sy = cy - r * 0.2 + Math.sin(sa) * sr;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(t * 2 + i) * 0.3})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function interpolateColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 0xff;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;
  const br = (bh >> 16) & 0xff;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) & 0xff + amt);
  const G = Math.min(255, (num >> 8) & 0xff + amt);
  const B = Math.min(255, num & 0xff + amt);
  return `rgb(${R},${G},${B})`;
}
