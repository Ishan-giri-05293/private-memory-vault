"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Envelope, Letter } from "@/components/Envelope";
import { PROMISE_LETTER } from "@/lib/letters";
import { bunnies } from "@/lib/bunnies";

export default function PromisePage() {
  const [open, setOpen] = useState(false);

  return (
    <main className="page">
      <header className="text-center">
        <h1 className="page-title">Promise</h1>
        <p className="page-sub">a letter, just for you</p>
      </header>

      <AnimatePresence mode="wait">
        {!open ? (
          <motion.div key="envelope" exit={{ opacity: 0, transition: { duration: 0.25 } }}>
            <Envelope
              onOpened={() => {
                setOpen(true);
                bunnies({ type: "hug" });
              }}
            />
          </motion.div>
        ) : (
          <motion.div key="letter" className="mx-auto mt-10 max-w-xl">
            <Letter {...PROMISE_LETTER} />
            <div className="mt-8 text-center">
              <button className="pixel-btn pixel-btn-paper" onClick={() => setOpen(false)}>
                Close the letter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
