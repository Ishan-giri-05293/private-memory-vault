// All the words in this file are yours to change.
// Each paragraph is one string. Keep them short so they read well on her phone.

export const SIGNATURE = "Ishan";

export const PROMISE_LETTER = {
  greeting: "My Aru,",
  paragraphs: [
    "I made this little place for you. The internet is loud and busy, and I wanted you to have one corner of it that is quiet and only yours.",
    "Since the 1st of January 2025, you've been my favourite part of every day. The silly moments, the late night talks, the truth or dare rounds that went way too far. I want to keep all of it.",
    "I can't promise that every day will be easy. I can promise you won't go through the hard ones alone. I'll be there to listen, to make you laugh, and to hold your hand when you need it.",
    "I promise to keep choosing you. On the good days, on the boring ones, and on the days you're tired of everything, even me.",
    "Fill this place slowly. Keep what you love. And whenever you forget how loved you are, come back here and read this again.",
  ],
  closing: ["Always yours,"],
};

export type OpenWhenNote = {
  id: string;
  when: string;
  paragraphs: string[];
};

export const OPEN_WHEN: OpenWhenNote[] = [
  {
    id: "miss-me",
    when: "you miss me",
    paragraphs: [
      "Hi you. I miss you too, probably more.",
      "Close your eyes for a second and imagine me holding your hand. I'm doing it right now, from wherever I am.",
      "Now text me. I'm already smiling.",
    ],
  },
  {
    id: "bad-day",
    when: "you've had a bad day",
    paragraphs: [
      "Come here. One bad day doesn't get to decide who you are.",
      "Get a blanket, something warm to drink, and let yourself be soft for a bit.",
      "Tomorrow is a new page and I'll be right there on it with you. I'm proud of you for getting through today.",
    ],
  },
  {
    id: "cant-sleep",
    when: "you can't sleep",
    paragraphs: [
      "Look at the bunnies at the bottom of the screen. If it's late, they're already curled up together. That's us.",
      "Breathe in for four, hold for four, out for four. Think about your happiest day with me.",
      "Whatever is keeping you up can wait until morning. Goodnight, my love.",
    ],
  },
  {
    id: "doubt-yourself",
    when: "you doubt yourself",
    paragraphs: [
      "Let me tell you what I see. Someone kind, clever, funny, stubborn in the best way, and braver than she thinks.",
      "You are so much more than enough. You always have been.",
    ],
  },
  {
    id: "need-a-laugh",
    when: "you need a laugh",
    paragraphs: [
      "Remember that time I tried to look cool in front of you and failed completely? You saw it. You still stayed. That's love.",
      "Now go send me the worst meme you can find. I'll be waiting.",
    ],
  },
  {
    id: "we-fought",
    when: "we've had a fight",
    paragraphs: [
      "Whatever it was, I'm sorry for my part in it. You matter more to me than being right.",
      "We're on the same team, always. Even when it doesn't feel like it.",
      "Come find me when you're ready. I'll be the one with open arms and a very sorry face.",
    ],
  },
  {
    id: "happy",
    when: "you're really happy",
    paragraphs: [
      "YES. I love this for you.",
      "Stop reading and tell me everything, every detail, right now.",
      "Then save it in the Vault so it stays forever.",
    ],
  },
];
