"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/Pixel";
import { SIGNATURE } from "@/lib/letters";

type Stage = "sealed" | "opening" | "rising" | "open";

// A pixel envelope: tap the heart, the flap opens, the letter rises out.
export function Envelope({
  onOpened,
  hint = "tap the heart",
}: {
  onOpened: () => void;
  hint?: string;
}) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("sealed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const open = () => {
    if (stage !== "sealed") return;
    if (reduce) {
      onOpened();
      return;
    }
    setStage("opening");
    timers.current.push(
      setTimeout(() => setStage("rising"), 550),
      setTimeout(() => {
        setStage("open");
        onOpened();
      }, 1500),
    );
  };

  const flapOpen = stage !== "sealed";
  const letterUp = stage === "rising" || stage === "open";

  return (
    <div className="flex flex-col items-center">
      <div className="relative mt-16 aspect-[10/7] w-full max-w-sm" style={{ perspective: 1200 }}>
        {/* inside of the envelope */}
        <div className="absolute inset-0 border-4 border-line bg-[#f28fbd]" />

        {/* the letter */}
        <motion.div
          className="absolute inset-x-[8%] top-[8%] h-[84%] border-4 border-line bg-paper p-4"
          style={{ zIndex: 2 }}
          initial={false}
          animate={{ y: letterUp ? "-58%" : "0%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-pixel text-lg text-pink-deep">My Aru,</p>
          <div className="mt-2 space-y-2">
            {[90, 100, 75].map((w, i) => (
              <div key={i} className="h-1 bg-line/20" style={{ width: `${w}%` }} />
            ))}
          </div>
        </motion.div>

        {/* front pocket */}
        <div
          className="absolute inset-[4px] bg-[#ffc4de]"
          style={{
            zIndex: 3,
            clipPath: "polygon(0 0, 50% 48%, 100% 0, 100% 100%, 0 100%)",
          }}
        >
          <p className="absolute bottom-[10%] left-0 right-0 text-center font-pixel text-xl text-ink">
            for Aru
          </p>
        </div>

        {/* flap */}
        <motion.div
          className="absolute inset-x-[4px] top-[4px] h-[50%] origin-top bg-[#ffb1d3]"
          style={{
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            zIndex: flapOpen ? 1 : 4,
          }}
          initial={false}
          animate={{ rotateX: flapOpen ? 180 : 0 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        />

        {/* heart seal (wrapper positions it, since motion owns the button's transform) */}
        <div className="absolute left-1/2 top-[50%] z-[5] -translate-x-1/2 -translate-y-1/2">
          <motion.button
            type="button"
            onClick={open}
            disabled={flapOpen}
            aria-label="Open the letter"
            className="block cursor-pointer p-2 text-pink-deep focus-visible:outline-3 focus-visible:outline-line"
            initial={false}
            animate={flapOpen ? { scale: 0, opacity: 0 } : { scale: [1, 1.12, 1], opacity: 1 }}
            transition={
              flapOpen ? { duration: 0.25 } : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <span className="relative block">
              <PixelIcon name="heart" size={6} className="absolute left-[3px] top-[3px] text-line" />
              <PixelIcon name="heart" size={6} className="relative" />
            </span>
          </motion.button>
        </div>
      </div>

      <p
        className={`mt-8 font-pixel text-xl text-ink transition-opacity ${
          stage === "sealed" ? "opacity-100" : "opacity-0"
        }`}
      >
        {hint}
      </p>
    </div>
  );
}

// The unfolded letter
export function Letter({
  greeting,
  paragraphs,
  closing,
}: {
  greeting: string;
  paragraphs: string[];
  closing?: string[];
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="pixel-card relative px-6 py-8 sm:px-9"
    >
      <PixelIcon name="heart" size={4} className="absolute right-5 top-5 text-pink" />

      <p className="font-pixel text-3xl text-pink-deep">{greeting}</p>

      <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink">
        {paragraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
          >
            {p}
          </motion.p>
        ))}
      </div>

      <div className="mt-8 text-right font-pixel text-2xl text-ink">
        {closing?.map((c) => (
          <p key={c} className="text-xl text-ink-soft">
            {c}
          </p>
        ))}
        <p className="mt-1 inline-flex items-center gap-2">
          {SIGNATURE}
          <PixelIcon name="heart" size={3} className="text-pink-deep" />
        </p>
      </div>
    </motion.article>
  );
}
