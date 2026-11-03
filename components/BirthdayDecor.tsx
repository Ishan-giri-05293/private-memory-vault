"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PixelIcon } from "@/components/Pixel";
import { bunnies, LINES, pick } from "@/lib/bunnies";
import { birthdayKey, isBirthday, syncPreviewFromUrl } from "@/lib/birthday";

const BALLOONS = [
  { left: 6, color: "#ff8fc0", dur: 19, delay: 0 },
  { left: 18, color: "#c3a9f7", dur: 23, delay: -9 },
  { left: 31, color: "#fff4ec", dur: 21, delay: -4 },
  { left: 47, color: "#ffd36e", dur: 25, delay: -14 },
  { left: 62, color: "#ff8fc0", dur: 20, delay: -6 },
  { left: 76, color: "#c3a9f7", dur: 24, delay: -17 },
  { left: 90, color: "#fff4ec", dur: 22, delay: -11 },
];

const FLAGS = ["#ff8fc0", "#fff4ec", "#c3a9f7", "#ffd36e"];

// On her birthday: balloons in the sky, bunting across the top, and a surprise
// screen the first time she opens the site that day.
export default function BirthdayDecor() {
  const pathname = usePathname();
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [splash, setSplash] = useState(false);

  useEffect(() => {
    syncPreviewFromUrl();
    const today = isBirthday();
    setOn(today);
    if (!today || pathname === "/login" || pathname.startsWith("/birthday")) return;
    const key = birthdayKey("splash");
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    setSplash(true);
    setTimeout(() => bunnies({ type: "party", text: pick(LINES.birthday) }), 600);
    // only decide once per page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!on) return null;

  return (
    <>
      {/* sky decorations, behind the page */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <svg
          className="absolute inset-x-0 top-[72px] h-8 w-full"
          viewBox="0 0 40 4"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
        >
          <rect x="0" y="0" width="40" height="0.3" fill="var(--line)" />
          {Array.from({ length: 20 }, (_, i) => (
            <path key={i} d={`M${i * 2} 0.3h2l-1 3z`} fill={FLAGS[i % FLAGS.length]} />
          ))}
        </svg>

        {BALLOONS.map((b, i) => (
          <div
            key={i}
            className="animate-balloon absolute bottom-0"
            style={
              {
                left: `${b.left}%`,
                color: b.color,
                "--dur": `${b.dur}s`,
                "--delay": `${b.delay}s`,
              } as React.CSSProperties
            }
          >
            <PixelIcon name="balloon" size={5} />
          </div>
        ))}
      </div>

      {/* surprise! */}
      <AnimatePresence>
        {splash && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Happy birthday"
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--sky-2)] px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.6, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 14, stiffness: 180 }}
            >
              <motion.div
                className="mx-auto w-fit text-pink-deep"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <PixelIcon name="cake" size={10} />
              </motion.div>
              <h1 className="page-title mt-6 text-6xl md:text-7xl">
                Happy
                <br />
                Birthday,
                <br />
                Aru!
              </h1>
              <p className="page-sub mx-auto max-w-xs">
                today is all yours. a new gift opens every few hours.
              </p>
              <div className="mt-8 flex flex-col items-center gap-2">
                <button
                  className="pixel-btn px-8 text-xl"
                  onClick={() => {
                    setSplash(false);
                    router.push("/birthday");
                  }}
                >
                  open my gifts
                </button>
                <button
                  className="cursor-pointer px-4 py-2 font-pixel text-base text-ink underline underline-offset-4"
                  onClick={() => setSplash(false)}
                >
                  later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
