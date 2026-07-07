/**
 * palettes.js
 * The 12-season color system. Color data (hex + match flags) is language-
 * neutral; display text (name, description, swatch labels, compare notes)
 * is per-language. Use localizeSeason(key, lang) to get a ready-to-render
 * season for the active language (Bulgarian falls back to English when a
 * bg entry is missing).
 */

import { SEASONS_BG } from "./seasons.bg.js";

export const SEASONS = {
  brightSpring: {
    swatchHex: ["#FF6F61", "#2EC4B6", "#FFD23F", "#5FAD41", "#F45B69"],
    compare: [
      { hex: "#FF6F61", match: true },
      { hex: "#8A8D8F", match: false },
      { hex: "#2EC4B6", match: true },
      { hex: "#6B4E71", match: false },
      { hex: "#FFD23F", match: true },
    ],
    text: {
      en: {
        name: "Bright Spring",
        desc: "Warm, clear, and vivid. Your best colors are fresh and saturated — think coral, turquoise, and warm greens with nothing muted about them.",
        swatchLabels: ["Coral", "Turquoise", "Sun", "Leaf", "Poppy"],
        compareNotes: [
          "Coral brightens instantly — your match.",
          "Grey dulls your natural clarity — not yours.",
          "Turquoise makes your eyes pop — your match.",
          "Muted plum drains your warmth — not yours.",
          "Warm yellow lifts your whole face — your match.",
        ],
      },
      bg: {},
    },
  },
  trueSpring: {
    swatchHex: ["#E8A33D", "#7CB342", "#FF7F50", "#40BFB4", "#D4593B"],
    compare: [
      { hex: "#E8A33D", match: true },
      { hex: "#3D5A80", match: false },
      { hex: "#FF7F50", match: true },
      { hex: "#C9CBCF", match: false },
      { hex: "#7CB342", match: true },
    ],
    text: {
      en: {
        name: "True Spring",
        desc: "Golden warmth with medium-bright clarity. Sunlit colors — warm greens, golden yellows, and lively corals — bring your skin to life.",
        swatchLabels: ["Marigold", "Spring", "Coral", "Lagoon", "Terra"],
        compareNotes: [
          "Marigold glows with your golden undertone — your match.",
          "Cool navy flattens your warmth — not yours.",
          "Coral warms your complexion — your match.",
          "Icy grey washes you out — not yours.",
          "Spring green freshens everything — your match.",
        ],
      },
      bg: {},
    },
  },
  lightSpring: {
    swatchHex: ["#F7C59F", "#9BD4C8", "#F5E6A8", "#E8A0A4", "#B7CE95"],
    compare: [
      { hex: "#F7C59F", match: true },
      { hex: "#1B1814", match: false },
      { hex: "#9BD4C8", match: true },
      { hex: "#7A1F3D", match: false },
      { hex: "#F5E6A8", match: true },
    ],
    text: {
      en: {
        name: "Light Spring",
        desc: "Delicate warmth, light and fresh. Soft peach, aqua, and buttery pastels flatter without overwhelming your gentle contrast.",
        swatchLabels: ["Peach", "Aqua", "Butter", "Blush", "Celery"],
        compareNotes: [
          "Peach melts into your coloring — your match.",
          "Stark black overwhelms your softness — not yours.",
          "Aqua keeps things light and fresh — your match.",
          "Deep burgundy is too heavy — not yours.",
          "Butter yellow is quietly radiant — your match.",
        ],
      },
      bg: {},
    },
  },
  lightSummer: {
    swatchHex: ["#A8C5DD", "#C3AED6", "#E8B4BC", "#9FD8CB", "#D6D2C4"],
    compare: [
      { hex: "#A8C5DD", match: true },
      { hex: "#E25822", match: false },
      { hex: "#E8B4BC", match: true },
      { hex: "#4A3728", match: false },
      { hex: "#C3AED6", match: true },
    ],
    text: {
      en: {
        name: "Light Summer",
        desc: "Cool, light, and airy. Powdery blues, soft lavenders, and rose tones echo your delicate, cool-toned coloring.",
        swatchLabels: ["Powder", "Lavender", "Rose", "Mist", "Oyster"],
        compareNotes: [
          "Powder blue is effortless on you — your match.",
          "Hot orange fights your cool undertone — not yours.",
          "Soft rose flatters gently — your match.",
          "Heavy brown mutes your lightness — not yours.",
          "Lavender complements beautifully — your match.",
        ],
      },
      bg: {},
    },
  },
  trueSummer: {
    swatchHex: ["#6E8FAF", "#5F9EA0", "#C08497", "#8E9AAF", "#B0C4B1"],
    compare: [
      { hex: "#6E8FAF", match: true },
      { hex: "#FF8C00", match: false },
      { hex: "#C08497", match: true },
      { hex: "#B8860B", match: false },
      { hex: "#5F9EA0", match: true },
    ],
    text: {
      en: {
        name: "True Summer",
        desc: "Cool and softly muted. Dusty blues, soft teals, and cool roses suit your gentle contrast and blue undertone best.",
        swatchLabels: ["Dusk", "Teal", "Rose", "Slate", "Eucalypt"],
        compareNotes: [
          "Dusty blue harmonizes perfectly — your match.",
          "Warm orange clashes with your coolness — not yours.",
          "Cool rose softens your features — your match.",
          "Mustard gold turns sallow on you — not yours.",
          "Soft teal is quietly striking — your match.",
        ],
      },
      bg: {},
    },
  },
  softSummer: {
    swatchHex: ["#A58E9C", "#8FA396", "#7D8CA3", "#B5A8A0", "#94766E"],
    compare: [
      { hex: "#A58E9C", match: true },
      { hex: "#FFD700", match: false },
      { hex: "#8FA396", match: true },
      { hex: "#E0115F", match: false },
      { hex: "#7D8CA3", match: true },
    ],
    text: {
      en: {
        name: "Soft Summer",
        desc: "Muted coolness with low contrast. Misty, greyed tones — mauve, sage, and slate — sit in perfect quiet harmony with your coloring.",
        swatchLabels: ["Mauve", "Sage", "Slate", "Fog", "Rosewood"],
        compareNotes: [
          "Muted mauve blends seamlessly — your match.",
          "Bright gold overpowers your softness — not yours.",
          "Grey-sage settles in gently — your match.",
          "Vivid pink is far too loud — not yours.",
          "Slate blue is understated elegance — your match.",
        ],
      },
      bg: {},
    },
  },
  softAutumn: {
    swatchHex: ["#B98D86", "#C9A88A", "#D9C0A3", "#8A7B62", "#6E8C82"],
    compare: [
      { hex: "#B98D86", match: true },
      { hex: "#E0529C", match: false },
      { hex: "#C9A88A", match: true },
      { hex: "#3D5A80", match: false },
      { hex: "#6E8C82", match: true },
    ],
    text: {
      en: {
        name: "Soft Autumn",
        desc: "Muted warmth with low-to-medium contrast. Your richest colors are golden, earthy, and gently faded — never stark or icy.",
        swatchLabels: ["Mauve", "Gold", "Honey", "Umber", "Sage"],
        compareNotes: [
          "Warm mauve softens and warms — your match.",
          "Bright pink overpowers — too sharp for you.",
          "Gold lifts your skin beautifully — your match.",
          "Cool navy flattens your warmth — not yours.",
          "Sage settles in gently — your match.",
        ],
      },
      bg: {},
    },
  },
  trueAutumn: {
    swatchHex: ["#B7410E", "#708238", "#C68E17", "#5E3023", "#317873"],
    compare: [
      { hex: "#B7410E", match: true },
      { hex: "#E6E6FA", match: false },
      { hex: "#708238", match: true },
      { hex: "#FF69B4", match: false },
      { hex: "#C68E17", match: true },
    ],
    text: {
      en: {
        name: "True Autumn",
        desc: "Rich, golden, and earthy. Rust, olive, and deep gold echo your warm depth — colors that look expensive on you and only you.",
        swatchLabels: ["Rust", "Olive", "Ochre", "Chestnut", "Pine"],
        compareNotes: [
          "Rust is unmistakably yours — your match.",
          "Icy lavender washes you out — not yours.",
          "Olive deepens your warmth — your match.",
          "Cool pink fights your golden tone — not yours.",
          "Ochre glows against your skin — your match.",
        ],
      },
      bg: {},
    },
  },
  darkAutumn: {
    swatchHex: ["#4A2C2A", "#6B2737", "#2C4A3B", "#9C6615", "#833500"],
    compare: [
      { hex: "#6B2737", match: true },
      { hex: "#F0E68C", match: false },
      { hex: "#2C4A3B", match: true },
      { hex: "#ADD8E6", match: false },
      { hex: "#9C6615", match: true },
    ],
    text: {
      en: {
        name: "Dark Autumn",
        desc: "Deep warmth with strong presence. Espresso, burgundy-brown, forest, and burnished gold match your depth and intensity.",
        swatchLabels: ["Espresso", "Garnet", "Forest", "Bronze", "Sienna"],
        compareNotes: [
          "Garnet is rich and commanding — your match.",
          "Pale pastel disappears on you — not yours.",
          "Forest green anchors your depth — your match.",
          "Baby blue has no presence here — not yours.",
          "Bronze burnishes beautifully — your match.",
        ],
      },
      bg: {},
    },
  },
  darkWinter: {
    swatchHex: ["#3B0918", "#1B3A4B", "#1B1814", "#0F5257", "#7B1E3B"],
    compare: [
      { hex: "#3B0918", match: true },
      { hex: "#F7C59F", match: false },
      { hex: "#1B1814", match: true },
      { hex: "#D9C0A3", match: false },
      { hex: "#0F5257", match: true },
    ],
    text: {
      en: {
        name: "Dark Winter",
        desc: "Deep, cool, and dramatic. Black-cherry, pine, and true black frame your high contrast with quiet power.",
        swatchLabels: ["Cherry", "Deep Sea", "Ink", "Pine", "Wine"],
        compareNotes: [
          "Black-cherry is pure drama — your match.",
          "Warm peach turns muddy on you — not yours.",
          "True black sharpens your contrast — your match.",
          "Beige simply vanishes — not yours.",
          "Deep pine is striking — your match.",
        ],
      },
      bg: {},
    },
  },
  trueWinter: {
    swatchHex: ["#0F52BA", "#C71585", "#046307", "#FBF9F6", "#6A0DAD"],
    compare: [
      { hex: "#0F52BA", match: true },
      { hex: "#C68E17", match: false },
      { hex: "#C71585", match: true },
      { hex: "#B5A8A0", match: false },
      { hex: "#046307", match: true },
    ],
    text: {
      en: {
        name: "True Winter",
        desc: "Cool, clear, and high-contrast. Pure jewel tones — sapphire, fuchsia, emerald — and true white were made for your coloring.",
        swatchLabels: ["Sapphire", "Fuchsia", "Emerald", "Pure", "Violet"],
        compareNotes: [
          "Sapphire is electric on you — your match.",
          "Warm ochre turns sallow — not yours.",
          "Fuchsia matches your intensity — your match.",
          "Muddy taupe dulls everything — not yours.",
          "Emerald is regal on you — your match.",
        ],
      },
      bg: {},
    },
  },
  brightWinter: {
    swatchHex: ["#FF1E56", "#00A8E8", "#FF66C4", "#01BF71", "#FBF9F6"],
    compare: [
      { hex: "#FF1E56", match: true },
      { hex: "#8A7B62", match: false },
      { hex: "#00A8E8", match: true },
      { hex: "#D9C0A3", match: false },
      { hex: "#FF66C4", match: true },
    ],
    text: {
      en: {
        name: "Bright Winter",
        desc: "Cool with brilliant clarity. Neon-adjacent brights — icy pink, electric blue, clear red — hold their own against your natural intensity.",
        swatchLabels: ["Clear Red", "Electric", "Ice Pink", "Vivid Green", "Pure"],
        compareNotes: [
          "Clear red meets your intensity — your match.",
          "Muted umber has no life on you — not yours.",
          "Electric blue is dazzling — your match.",
          "Soft honey fades into nothing — not yours.",
          "Icy pink sparkles — your match.",
        ],
      },
      bg: {},
    },
  },
};

/** Build a ready-to-render season in the given language (falls back to en). */
export function localizeSeason(key, lang) {
  const s = SEASONS[key];
  if (!s) return null;
  const bg = SEASONS_BG[key];
  const text = lang === "bg" && bg && bg.name ? bg : s.text.en;
  return {
    name: text.name,
    desc: text.desc,
    swatches: s.swatchHex.map((hex, i) => ({ hex, label: text.swatchLabels[i] })),
    compare: s.compare.map((c, i) => ({ hex: c.hex, match: c.match, note: text.compareNotes[i] })),
  };
}
