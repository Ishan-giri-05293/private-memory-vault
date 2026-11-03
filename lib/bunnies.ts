// Everything the Ishan bunny says lives here. Rewrite these in your own words.

export const LINES = {
  morning: ["good morning Aru", "did you eat breakfast?", "morning, cutie"],
  afternoon: ["drink some water", "you're doing great today", "thinking about you"],
  evening: ["how was your day?", "I missed you today", "come here, hug"],
  lateNight: ["go to sleep, it's late", "sleep, cutie. I'll be here tomorrow"],
  anytime: ["I love you", "hi Baby girl :)", "you look cute today", "can I have a hug?", "you're my favourite person"],
  // shown when she's away for a few days
  missedYou: "missed you!! where were you?",
  // while they're asleep at night
  asleep: "shh, we're sleeping, cutie",
  // tap the Aru bunny and he runs over
  kiss: ["mwah", "my baby", "hehe, kiss", "love you, betu"],
  // tap the Ishan bunny
  silly: ["hehe", "Aree", "pareshan mat kro!", "wheee"],
  pages: {
    "/vault": "save today's moment?",
    "/goals": "you've got this",
    "/truth-or-dare": "truth or dare? your turn",
    "/notes": "pick one, I wrote them for you",
    "/promise": "I meant every word",
  } as Record<string, string>,
  // reactions to things she does on the site
  goalDone: ["proud of you!!", "you're doing great!", "I'm so proud of you, baby"],
  letterOpened: ["I love you", "I missed you", "you're my favourite person"],
  truth: ["no lying!", "bata", "answer honestly!", "hehe"],
  dare: ["you HAVE to do it", "you can't back out now", "hehe, do it!"],
  keptMoment: ["best round ever", "you're amazing!", "I love you, baby"],
  anniversary: "happy anniversary!!",
  birthday: ["happy birthday Aru!!", "Wishing you the best birthday ever", "I love you, happy birthday!", "Where are the party hats?"],

  // ---- waking up at night (3 taps) ----
  // first two taps on a sleeping bunny
  sleepyIshan: ["zzz...", "mmh...", "five more minutes..."],
  sleepyAru: ["mmh...", "zzz...", "shh..."],
  // third tap, they wake up
  wokeIshan: ["huh? I'm up, I'm up!", "who's poking me?", "hi baby... you're awake too?"],
  wokeAru: ["mmh... what?", "why are you waking me up?", "hi... I was sleeping"],
  // after 5 minutes awake, one calls the other back to bed
  bedtimeIshan: ["come to bed, sweety", "bedtime, cutie. come here", "it's cold without you"],
  bedtimeAru: ["come to bed, sweety", "Ishan. bed. now.", "can't sleep without you, come"],

  // ---- sharing a carrot (daytime, every minute or two) ----
  // whoever finds it
  carrotFound: ["ooh, a carrot!", "look what I found", "snack time!"],
  // passing it over
  carrotPass: ["here, your turn", "one bite for you", "share with me?"],
  // when it's all gone (Ishan says this)
  carrotDone: ["yum, thank you baby", "best snack ever", "more carrots please"],
};

// Her birthday. Month is 1-12. The whole birthday plan lives in lib/birthday.ts.
export const ARU_BIRTHDAY = { month: 1, day: 31 };

export type BunnyEvent =
  | { type: "celebrate" }
  | { type: "hug" }
  | { type: "say"; text: string; jump?: boolean }
  // birthday page: everyone jumps and shows the line
  | { type: "party"; text: string };

// Pages call this to make the bunnies react
export function bunnies(event: BunnyEvent) {
  window.dispatchEvent(new CustomEvent<BunnyEvent>("bunnies", { detail: event }));
}

export function specialDay(now = new Date()): "anniversary" | "birthday" | null {
  const m = now.getMonth() + 1;
  const d = now.getDate();
  if (ARU_BIRTHDAY.month === m && ARU_BIRTHDAY.day === d) return "birthday";
  if (m === 1 && d === 1) return "anniversary";
  return null;
}

export function pickLine(pathname: string, now = new Date()) {
  const h = now.getHours();
  const timed =
    h >= 23 || h < 5
      ? LINES.lateNight
      : h < 12
        ? LINES.morning
        : h < 17
          ? LINES.afternoon
          : LINES.evening;
  const page = Object.entries(LINES.pages).find(([p]) => pathname.startsWith(p))?.[1];
  const pool = [...timed, ...timed, ...LINES.anytime, ...(page ? [page, page] : [])];
  return pool[Math.floor(Math.random() * pool.length)];
}

export const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
