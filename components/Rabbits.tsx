"use client";

import { useEffect, useRef } from "react";

type State = "idle" | "move" | "sleep" | "groom";

type Rabbit = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  hopUntil: number;
  facing: 1 | -1;
  state: State;
  stateUntil: number;
};

type Heart = { x: number; y: number; life: number };

export default function Rabbits() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hearts = useRef<Heart[]>([]);

  const r1 = useRef<Rabbit>({
    x: 150, y: 400, targetX: 150, targetY: 400,
    hopUntil: 0, facing: 1, state: "idle", stateUntil: 0
  });

  const r2 = useRef<Rabbit>({
    x: 350, y: 450, targetX: 350, targetY: 450,
    hopUntil: 0, facing: -1, state: "idle", stateUntil: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isNight = () => {
      const h = new Date().getHours();
      return h >= 21 || h <= 6;
    };

    const drawHeart = (h: Heart) => {
      ctx.save();
      ctx.globalAlpha = h.life;
      ctx.fillStyle = "#ff6b81";
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      ctx.bezierCurveTo(h.x - 6, h.y - 6, h.x - 12, h.y + 4, h.x, h.y + 10);
      ctx.bezierCurveTo(h.x + 12, h.y + 4, h.x + 6, h.y - 6, h.x, h.y);
      ctx.fill();
      ctx.restore();
    };

    const drawRabbit = (r: Rabbit, color: string, t: number) => {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.scale(r.facing, 1);

      const breathe = Math.sin(t / 800) * 1.2;
      const hop = t < r.hopUntil ? -3 * Math.sin((r.hopUntil - t) / 120) : 0;

      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.ellipse(0, breathe + hop, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(14, -10 + breathe + hop, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      let earOffset = Math.sin(t / 400) * 2;
      if (r.state === "sleep") earOffset = 6;
      if (r.state === "groom") earOffset = Math.sin(t / 150) * 4;

      ctx.beginPath();
      ctx.ellipse(18, -22 + earOffset + hop, 4, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(10, -22 - earOffset + hop, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const decideNextAction = (r: Rabbit, other: Rabbit, now: number) => {
      if (isNight()) {
        r.state = "sleep";
        r.stateUntil = now + 8000;
        r.targetX = other.x + (Math.random() * 40 - 20);
        r.targetY = other.y + (Math.random() * 20 - 10);
        return;
      }

      const roll = Math.random();

      // 🐇 Follow other rabbit
      if (roll < 0.2) {
        r.state = "move";
        r.stateUntil = now + 5000;
        r.targetX = other.x + (Math.random() * 60 - 30);
        r.targetY = other.y + (Math.random() * 40 - 20);
        return;
      }

      // 🌿 Groom
      if (roll < 0.4) {
        r.state = "groom";
        r.stateUntil = now + 2500;
        return;
      }

      // 💤 Idle
      if (roll < 0.65) {
        r.state = "idle";
        r.stateUntil = now + 3000;
        return;
      }

      // 🌍 Wander
      r.state = "move";
      r.stateUntil = now + 5000;
      r.targetX = Math.random() * canvas.width;
      r.targetY = Math.random() * canvas.height;
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rabbits = [r1.current, r2.current];

      rabbits.forEach((r, i) => {
        const other = rabbits[1 - i];
        if (time > r.stateUntil) decideNextAction(r, other, time);

        if (r.state === "move") {
          const dx = r.targetX - r.x;
          const dy = r.targetY - r.y;
          r.facing = dx > 0 ? 1 : -1;
          r.x += dx * 0.005;
          r.y += dy * 0.005;
        }
      });

      // 💞 Cuddle behavior
      const dist = Math.hypot(r1.current.x - r2.current.x, r1.current.y - r2.current.y);
      if (dist < 60) {
        r1.current.facing = 1;
        r2.current.facing = -1;

        if (Math.random() < 0.015) {
          hearts.current.push({
            x: (r1.current.x + r2.current.x) / 2,
            y: (r1.current.y + r2.current.y) / 2 - 20,
            life: 1,
          });
        }
      }

      drawRabbit(r1.current, "#dcdcdc", time);
      drawRabbit(r2.current, "#bfbfbf", time);

      hearts.current.forEach((h) => {
        h.y -= 0.3;
        h.life -= 0.02;
        drawHeart(h);
      });
      hearts.current = hearts.current.filter((h) => h.life > 0);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleTap = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = "touches" in e ? e.touches[0].clientX - rect.left : (e as MouseEvent).clientX - rect.left;
      const y = "touches" in e ? e.touches[0].clientY - rect.top : (e as MouseEvent).clientY - rect.top;

      [r1.current, r2.current].forEach((r) => {
        if (Math.abs(x - r.x) < 30 && Math.abs(y - r.y) < 30) {
          r.hopUntil = performance.now() + 600;
          hearts.current.push({ x: r.x, y: r.y - 20, life: 1 });
        }
      });
    };

    canvas.addEventListener("click", handleTap);
    canvas.addEventListener("touchstart", handleTap);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleTap);
      canvas.removeEventListener("touchstart", handleTap);
    };
  }, []);

//   return <canvas ref={canvasRef} className="fixed inset-0 z-10" style={{ pointerEvents: "auto" }} />;
  return <canvas ref={canvasRef} className="fixed inset-0 z-10 pointer-events-none" />;

}
