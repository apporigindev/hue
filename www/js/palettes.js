/**
 * palettes.js
 * The 12-season color system: display data for each season.
 * Each season: name, description, 5 signature swatches, and
 * compare-shades (mix of matches and deliberate mismatches to
 * illustrate the difference on the user's own photo).
 */

export const SEASONS = {
  brightSpring: {
    name: "Bright Spring",
    desc: "Warm, clear, and vivid. Your best colors are fresh and saturated — think coral, turquoise, and warm greens with nothing muted about them.",
    swatches: [
      { hex: "#FF6F61", label: "Coral" },
      { hex: "#2EC4B6", label: "Turquoise" },
      { hex: "#FFD23F", label: "Sun" },
      { hex: "#5FAD41", label: "Leaf" },
      { hex: "#F45B69", label: "Poppy" },
    ],
    compare: [
      { hex: "#FF6F61", match: true,  note: "Coral brightens instantly — your match." },
      { hex: "#8A8D8F", match: false, note: "Grey dulls your natural clarity — not yours." },
      { hex: "#2EC4B6", match: true,  note: "Turquoise makes your eyes pop — your match." },
      { hex: "#6B4E71", match: false, note: "Muted plum drains your warmth — not yours." },
      { hex: "#FFD23F", match: true,  note: "Warm yellow lifts your whole face — your match." },
    ],
  },
  trueSpring: {
    name: "True Spring",
    desc: "Golden warmth with medium-bright clarity. Sunlit colors — warm greens, golden yellows, and lively corals — bring your skin to life.",
    swatches: [
      { hex: "#E8A33D", label: "Marigold" },
      { hex: "#7CB342", label: "Spring" },
      { hex: "#FF7F50", label: "Coral" },
      { hex: "#40BFB4", label: "Lagoon" },
      { hex: "#D4593B", label: "Terra" },
    ],
    compare: [
      { hex: "#E8A33D", match: true,  note: "Marigold glows with your golden undertone — your match." },
      { hex: "#3D5A80", match: false, note: "Cool navy flattens your warmth — not yours." },
      { hex: "#FF7F50", match: true,  note: "Coral warms your complexion — your match." },
      { hex: "#C9CBCF", match: false, note: "Icy grey washes you out — not yours." },
      { hex: "#7CB342", match: true,  note: "Spring green freshens everything — your match." },
    ],
  },
  lightSpring: {
    name: "Light Spring",
    desc: "Delicate warmth, light and fresh. Soft peach, aqua, and buttery pastels flatter without overwhelming your gentle contrast.",
    swatches: [
      { hex: "#F7C59F", label: "Peach" },
      { hex: "#9BD4C8", label: "Aqua" },
      { hex: "#F5E6A8", label: "Butter" },
      { hex: "#E8A0A4", label: "Blush" },
      { hex: "#B7CE95", label: "Celery" },
    ],
    compare: [
      { hex: "#F7C59F", match: true,  note: "Peach melts into your coloring — your match." },
      { hex: "#1B1814", match: false, note: "Stark black overwhelms your softness — not yours." },
      { hex: "#9BD4C8", match: true,  note: "Aqua keeps things light and fresh — your match." },
      { hex: "#7A1F3D", match: false, note: "Deep burgundy is too heavy — not yours." },
      { hex: "#F5E6A8", match: true,  note: "Butter yellow is quietly radiant — your match." },
    ],
  },
  lightSummer: {
    name: "Light Summer",
    desc: "Cool, light, and airy. Powdery blues, soft lavenders, and rose tones echo your delicate, cool-toned coloring.",
    swatches: [
      { hex: "#A8C5DD", label: "Powder" },
      { hex: "#C3AED6", label: "Lavender" },
      { hex: "#E8B4BC", label: "Rose" },
      { hex: "#9FD8CB", label: "Mist" },
      { hex: "#D6D2C4", label: "Oyster" },
    ],
    compare: [
      { hex: "#A8C5DD", match: true,  note: "Powder blue is effortless on you — your match." },
      { hex: "#E25822", match: false, note: "Hot orange fights your cool undertone — not yours." },
      { hex: "#E8B4BC", match: true,  note: "Soft rose flatters gently — your match." },
      { hex: "#4A3728", match: false, note: "Heavy brown mutes your lightness — not yours." },
      { hex: "#C3AED6", match: true,  note: "Lavender complements beautifully — your match." },
    ],
  },
  trueSummer: {
    name: "True Summer",
    desc: "Cool and softly muted. Dusty blues, soft teals, and cool roses suit your gentle contrast and blue undertone best.",
    swatches: [
      { hex: "#6E8FAF", label: "Dusk" },
      { hex: "#5F9EA0", label: "Teal" },
      { hex: "#C08497", label: "Rose" },
      { hex: "#8E9AAF", label: "Slate" },
      { hex: "#B0C4B1", label: "Eucalypt" },
    ],
    compare: [
      { hex: "#6E8FAF", match: true,  note: "Dusty blue harmonizes perfectly — your match." },
      { hex: "#FF8C00", match: false, note: "Warm orange clashes with your coolness — not yours." },
      { hex: "#C08497", match: true,  note: "Cool rose softens your features — your match." },
      { hex: "#B8860B", match: false, note: "Mustard gold turns sallow on you — not yours." },
      { hex: "#5F9EA0", match: true,  note: "Soft teal is quietly striking — your match." },
    ],
  },
  softSummer: {
    name: "Soft Summer",
    desc: "Muted coolness with low contrast. Misty, greyed tones — mauve, sage, and slate — sit in perfect quiet harmony with your coloring.",
    swatches: [
      { hex: "#A58E9C", label: "Mauve" },
      { hex: "#8FA396", label: "Sage" },
      { hex: "#7D8CA3", label: "Slate" },
      { hex: "#B5A8A0", label: "Fog" },
      { hex: "#94766E", label: "Rosewood" },
    ],
    compare: [
      { hex: "#A58E9C", match: true,  note: "Muted mauve blends seamlessly — your match." },
      { hex: "#FFD700", match: false, note: "Bright gold overpowers your softness — not yours." },
      { hex: "#8FA396", match: true,  note: "Grey-sage settles in gently — your match." },
      { hex: "#E0115F", match: false, note: "Vivid pink is far too loud — not yours." },
      { hex: "#7D8CA3", match: true,  note: "Slate blue is understated elegance — your match." },
    ],
  },
  softAutumn: {
    name: "Soft Autumn",
    desc: "Muted warmth with low-to-medium contrast. Your richest colors are golden, earthy, and gently faded — never stark or icy.",
    swatches: [
      { hex: "#B98D86", label: "Mauve" },
      { hex: "#C9A88A", label: "Gold" },
      { hex: "#D9C0A3", label: "Honey" },
      { hex: "#8A7B62", label: "Umber" },
      { hex: "#6E8C82", label: "Sage" },
    ],
    compare: [
      { hex: "#B98D86", match: true,  note: "Warm mauve softens and warms — your match." },
      { hex: "#E0529C", match: false, note: "Bright pink overpowers — too sharp for you." },
      { hex: "#C9A88A", match: true,  note: "Gold lifts your skin beautifully — your match." },
      { hex: "#3D5A80", match: false, note: "Cool navy flattens your warmth — not yours." },
      { hex: "#6E8C82", match: true,  note: "Sage settles in gently — your match." },
    ],
  },
  trueAutumn: {
    name: "True Autumn",
    desc: "Rich, golden, and earthy. Rust, olive, and deep gold echo your warm depth — colors that look expensive on you and only you.",
    swatches: [
      { hex: "#B7410E", label: "Rust" },
      { hex: "#708238", label: "Olive" },
      { hex: "#C68E17", label: "Ochre" },
      { hex: "#5E3023", label: "Chestnut" },
      { hex: "#317873", label: "Pine" },
    ],
    compare: [
      { hex: "#B7410E", match: true,  note: "Rust is unmistakably yours — your match." },
      { hex: "#E6E6FA", match: false, note: "Icy lavender washes you out — not yours." },
      { hex: "#708238", match: true,  note: "Olive deepens your warmth — your match." },
      { hex: "#FF69B4", match: false, note: "Cool pink fights your golden tone — not yours." },
      { hex: "#C68E17", match: true,  note: "Ochre glows against your skin — your match." },
    ],
  },
  darkAutumn: {
    name: "Dark Autumn",
    desc: "Deep warmth with strong presence. Espresso, burgundy-brown, forest, and burnished gold match your depth and intensity.",
    swatches: [
      { hex: "#4A2C2A", label: "Espresso" },
      { hex: "#6B2737", label: "Garnet" },
      { hex: "#2C4A3B", label: "Forest" },
      { hex: "#9C6615", label: "Bronze" },
      { hex: "#833500", label: "Sienna" },
    ],
    compare: [
      { hex: "#6B2737", match: true,  note: "Garnet is rich and commanding — your match." },
      { hex: "#F0E68C", match: false, note: "Pale pastel disappears on you — not yours." },
      { hex: "#2C4A3B", match: true,  note: "Forest green anchors your depth — your match." },
      { hex: "#ADD8E6", match: false, note: "Baby blue has no presence here — not yours." },
      { hex: "#9C6615", match: true,  note: "Bronze burnishes beautifully — your match." },
    ],
  },
  darkWinter: {
    name: "Dark Winter",
    desc: "Deep, cool, and dramatic. Black-cherry, pine, and true black frame your high contrast with quiet power.",
    swatches: [
      { hex: "#3B0918", label: "Cherry" },
      { hex: "#1B3A4B", label: "Deep Sea" },
      { hex: "#1B1814", label: "Ink" },
      { hex: "#0F5257", label: "Pine" },
      { hex: "#7B1E3B", label: "Wine" },
    ],
    compare: [
      { hex: "#3B0918", match: true,  note: "Black-cherry is pure drama — your match." },
      { hex: "#F7C59F", match: false, note: "Warm peach turns muddy on you — not yours." },
      { hex: "#1B1814", match: true,  note: "True black sharpens your contrast — your match." },
      { hex: "#D9C0A3", match: false, note: "Beige simply vanishes — not yours." },
      { hex: "#0F5257", match: true,  note: "Deep pine is striking — your match." },
    ],
  },
  trueWinter: {
    name: "True Winter",
    desc: "Cool, clear, and high-contrast. Pure jewel tones — sapphire, fuchsia, emerald — and true white were made for your coloring.",
    swatches: [
      { hex: "#0F52BA", label: "Sapphire" },
      { hex: "#C71585", label: "Fuchsia" },
      { hex: "#046307", label: "Emerald" },
      { hex: "#FBF9F6", label: "Pure" },
      { hex: "#6A0DAD", label: "Violet" },
    ],
    compare: [
      { hex: "#0F52BA", match: true,  note: "Sapphire is electric on you — your match." },
      { hex: "#C68E17", match: false, note: "Warm ochre turns sallow — not yours." },
      { hex: "#C71585", match: true,  note: "Fuchsia matches your intensity — your match." },
      { hex: "#B5A8A0", match: false, note: "Muddy taupe dulls everything — not yours." },
      { hex: "#046307", match: true,  note: "Emerald is regal on you — your match." },
    ],
  },
  brightWinter: {
    name: "Bright Winter",
    desc: "Cool with brilliant clarity. Neon-adjacent brights — icy pink, electric blue, clear red — hold their own against your natural intensity.",
    swatches: [
      { hex: "#FF1E56", label: "Clear Red" },
      { hex: "#00A8E8", label: "Electric" },
      { hex: "#FF66C4", label: "Ice Pink" },
      { hex: "#01BF71", label: "Vivid Green" },
      { hex: "#FBF9F6", label: "Pure" },
    ],
    compare: [
      { hex: "#FF1E56", match: true,  note: "Clear red meets your intensity — your match." },
      { hex: "#8A7B62", match: false, note: "Muted umber has no life on you — not yours." },
      { hex: "#00A8E8", match: true,  note: "Electric blue is dazzling — your match." },
      { hex: "#D9C0A3", match: false, note: "Soft honey fades into nothing — not yours." },
      { hex: "#FF66C4", match: true,  note: "Icy pink sparkles — your match." },
    ],
  },
};
