/**
 * seasonDetails.js — the rich, premium content revealed after unlock:
 * per-season neutrals, best metals, colours to avoid, makeup, and styling.
 * Colour data (hex) is language-neutral; labels/phrases carry en + bg.
 * Use localizeDetails(key, lang) for a ready-to-render object.
 *
 * Content follows standard 12-season colour analysis. It is styling guidance,
 * not rules — see the Terms disclaimer.
 */

export const SEASON_DETAILS = {
  brightSpring: {
    neutrals: [
      { hex: "#F2E8D5", en: "Ivory", bg: "Слонова кост" },
      { hex: "#26355E", en: "Warm navy", bg: "Топло тъмносиньо" },
      { hex: "#C69A5B", en: "Camel", bg: "Камел" },
      { hex: "#B8AE9C", en: "Warm grey", bg: "Топло сиво" },
    ],
    avoid: [
      { hex: "#1C1C1C", en: "Black", bg: "Черно" },
      { hex: "#C3A6A0", en: "Dusty rose", bg: "Прашно розово" },
      { hex: "#6E6B4E", en: "Muted olive", bg: "Приглушено маслинено" },
    ],
    metals: { en: ["Bright gold", "Clear silver"], bg: ["Ярко злато", "Чисто сребро"] },
    makeup: {
      lips: { en: "Warm coral or clear watermelon", bg: "Топло коралово или ясно диня" },
      eyes: { en: "Golden bronze, teal", bg: "Златист бронз, тюркоаз" },
      cheeks: { en: "Warm peach", bg: "Топла праскова" },
    },
    styling: {
      en: [
        "Pair one bright with a clean neutral — not two brights at once.",
        "Swap black for warm navy or true grey near your face.",
        "Keep metals and accessories polished, never antiqued.",
      ],
      bg: [
        "Съчетавай един ярък цвят с чист неутрален — не два ярки наведнъж.",
        "Замени черното с топло тъмносиньо или чисто сиво до лицето.",
        "Дръж металите и аксесоарите полирани, не състарени.",
      ],
    },
  },

  trueSpring: {
    neutrals: [
      { hex: "#F4E7C9", en: "Cream", bg: "Кремаво" },
      { hex: "#7A5230", en: "Golden brown", bg: "Златисто кафяво" },
      { hex: "#CBA36A", en: "Warm tan", bg: "Топъл тен" },
      { hex: "#3B4C6B", en: "Soft navy", bg: "Меко тъмносиньо" },
    ],
    avoid: [
      { hex: "#1C1C1C", en: "Black", bg: "Черно" },
      { hex: "#8A8D8F", en: "Cool grey", bg: "Студено сиво" },
      { hex: "#5A1A2B", en: "Burgundy", bg: "Бордо" },
    ],
    metals: { en: ["Warm gold", "Copper"], bg: ["Топло злато", "Мед"] },
    makeup: {
      lips: { en: "Coral, peachy pink", bg: "Коралово, прасковено розово" },
      eyes: { en: "Warm brown, moss green", bg: "Топло кафяво, мъхесто зелено" },
      cheeks: { en: "Peach", bg: "Прасковено" },
    },
    styling: {
      en: [
        "Let one golden warm colour lead each outfit.",
        "Choose ivory or cream over stark white.",
        "Warm your denim with camel or coral, not grey.",
      ],
      bg: [
        "Нека един златисто топъл цвят води всяка визия.",
        "Избирай слонова кост или кремаво пред рязко бяло.",
        "Стопляй дънките с камел или коралово, не със сиво.",
      ],
    },
  },

  lightSpring: {
    neutrals: [
      { hex: "#F3EAD8", en: "Ivory", bg: "Слонова кост" },
      { hex: "#CBB79A", en: "Light camel", bg: "Светъл камел" },
      { hex: "#AEB4B0", en: "Light warm grey", bg: "Светло топло сиво" },
      { hex: "#8FA6C4", en: "Soft blue", bg: "Меко синьо" },
    ],
    avoid: [
      { hex: "#1C1C1C", en: "Black", bg: "Черно" },
      { hex: "#5A1A2B", en: "Deep burgundy", bg: "Наситено бордо" },
      { hex: "#2B2B2B", en: "Charcoal", bg: "Въглен" },
    ],
    metals: { en: ["Light gold", "Rose gold"], bg: ["Светло злато", "Розово злато"] },
    makeup: {
      lips: { en: "Soft coral, peach", bg: "Меко коралово, праскова" },
      eyes: { en: "Soft warm brown, aqua", bg: "Меко топло кафяво, аква" },
      cheeks: { en: "Soft peach", bg: "Мека праскова" },
    },
    styling: {
      en: [
        "Keep contrast low — blend lights with lights.",
        "Trade black basics for camel, ivory, or soft navy.",
        "Delicate jewellery suits you better than bold pieces.",
      ],
      bg: [
        "Дръж контраста нисък — съчетавай светли със светли тонове.",
        "Замени черните основи с камел, слонова кост или меко тъмносиньо.",
        "Деликатните бижута ти отиват повече от масивните.",
      ],
    },
  },

  lightSummer: {
    neutrals: [
      { hex: "#F1EEE9", en: "Soft white", bg: "Меко бяло" },
      { hex: "#B9BEC4", en: "Dove grey", bg: "Гълъбово сиво" },
      { hex: "#5C6B86", en: "Soft navy", bg: "Меко тъмносиньо" },
      { hex: "#C7B7AE", en: "Soft taupe", bg: "Меко таупе" },
    ],
    avoid: [
      { hex: "#1C1C1C", en: "Black", bg: "Черно" },
      { hex: "#E2571F", en: "Orange", bg: "Оранжево" },
      { hex: "#B8860B", en: "Mustard", bg: "Горчица" },
    ],
    metals: { en: ["Silver", "White gold", "Soft rose gold"], bg: ["Сребро", "Бяло злато", "Меко розово злато"] },
    makeup: {
      lips: { en: "Soft rose, cool pink", bg: "Меко розово, студено розово" },
      eyes: { en: "Cool taupe, soft plum", bg: "Студено таупе, меко сливово" },
      cheeks: { en: "Soft rose", bg: "Мека роза" },
    },
    styling: {
      en: [
        "Choose soft white over bright white — and never black.",
        "Blend gentle cool tones; skip anything harsh or warm.",
        "Silver and white gold flatter more than yellow gold.",
      ],
      bg: [
        "Избирай меко бяло пред ярко бяло — и никога черно.",
        "Съчетавай нежни студени тонове; избягвай резките и топли.",
        "Среброто и бялото злато ти отиват повече от жълтото злато.",
      ],
    },
  },

  trueSummer: {
    neutrals: [
      { hex: "#EDECEA", en: "Soft white", bg: "Меко бяло" },
      { hex: "#7C8794", en: "Cool grey", bg: "Студено сиво" },
      { hex: "#3C4A63", en: "Navy", bg: "Тъмносиньо" },
      { hex: "#9C8079", en: "Rose brown", bg: "Розово кафяво" },
    ],
    avoid: [
      { hex: "#1C1C1C", en: "Black", bg: "Черно" },
      { hex: "#E2571F", en: "Orange", bg: "Оранжево" },
      { hex: "#C68E17", en: "Gold ochre", bg: "Златна охра" },
    ],
    metals: { en: ["Silver", "White gold"], bg: ["Сребро", "Бяло злато"] },
    makeup: {
      lips: { en: "Rose, cool berry", bg: "Розово, студено горско" },
      eyes: { en: "Cool grey, soft plum", bg: "Студено сиво, меко сливово" },
      cheeks: { en: "Rose", bg: "Розово" },
    },
    styling: {
      en: [
        "Let cool, soft blues and roses do the work.",
        "Replace black with navy or cool grey near your face.",
        "Keep an even, gentle contrast head to toe.",
      ],
      bg: [
        "Нека студените, меки сини и розови тонове водят.",
        "Замени черното с тъмносиньо или студено сиво до лицето.",
        "Поддържай равен, мек контраст от глава до пети.",
      ],
    },
  },

  softSummer: {
    neutrals: [
      { hex: "#D8D2CB", en: "Soft taupe", bg: "Меко таупе" },
      { hex: "#8C8A8A", en: "Grey", bg: "Сиво" },
      { hex: "#6E6560", en: "Cocoa", bg: "Какао" },
      { hex: "#54617A", en: "Soft navy", bg: "Меко тъмносиньо" },
    ],
    avoid: [
      { hex: "#1C1C1C", en: "Black", bg: "Черно" },
      { hex: "#FF1E56", en: "Bright fuchsia", bg: "Ярка фуксия" },
      { hex: "#E2571F", en: "Orange", bg: "Оранжево" },
    ],
    metals: { en: ["Soft silver", "Matte pewter"], bg: ["Меко сребро", "Матов калай"] },
    makeup: {
      lips: { en: "Muted rose, soft mauve", bg: "Приглушено розово, меко мораво" },
      eyes: { en: "Soft taupe, greyed mauve", bg: "Меко таупе, посивяло мораво" },
      cheeks: { en: "Soft rose", bg: "Мека роза" },
    },
    styling: {
      en: [
        "Stay muted — clear, bright colours overwhelm you.",
        "Blend tones close together for a soft, elegant look.",
        "Matte, brushed metals suit you better than shine.",
      ],
      bg: [
        "Оставай в приглушеното — ясните, ярки цветове те натоварват.",
        "Съчетавай близки тонове за мек, елегантен вид.",
        "Матовите, брашнирани метали ти отиват повече от лъскавите.",
      ],
    },
  },

  softAutumn: {
    neutrals: [
      { hex: "#D7C3A5", en: "Soft camel", bg: "Мек камел" },
      { hex: "#A79683", en: "Warm taupe", bg: "Топло таупе" },
      { hex: "#EFE6D3", en: "Cream", bg: "Кремаво" },
      { hex: "#75765F", en: "Olive grey", bg: "Маслинено сиво" },
    ],
    avoid: [
      { hex: "#1C1C1C", en: "Black", bg: "Черно" },
      { hex: "#FF1E56", en: "Fuchsia", bg: "Фуксия" },
      { hex: "#FBF9F6", en: "Pure white", bg: "Чисто бяло" },
    ],
    metals: { en: ["Brushed gold", "Soft bronze"], bg: ["Брашнирано злато", "Мек бронз"] },
    makeup: {
      lips: { en: "Soft terracotta, rose brown", bg: "Мека теракота, розово кафяво" },
      eyes: { en: "Warm taupe, soft bronze", bg: "Топло таупе, мек бронз" },
      cheeks: { en: "Warm rose", bg: "Топла роза" },
    },
    styling: {
      en: [
        "Warm and muted is your lane — nothing icy or neon.",
        "Choose cream or camel over pure white.",
        "Keep contrast gentle; let earthy tones melt together.",
      ],
      bg: [
        "Топло и приглушено е твоята зона — нищо ледено или неоново.",
        "Избирай кремаво или камел пред чисто бяло.",
        "Дръж контраста мек; нека земните тонове се сливат.",
      ],
    },
  },

  trueAutumn: {
    neutrals: [
      { hex: "#5E3A24", en: "Chocolate", bg: "Шоколадово" },
      { hex: "#C29A63", en: "Camel", bg: "Камел" },
      { hex: "#EDE0C6", en: "Cream", bg: "Кремаво" },
      { hex: "#6B6A3C", en: "Olive", bg: "Маслинено" },
    ],
    avoid: [
      { hex: "#1C1C1C", en: "Black", bg: "Черно" },
      { hex: "#E6E6FA", en: "Icy lilac", bg: "Ледено люляково" },
      { hex: "#8A8D8F", en: "Cool grey", bg: "Студено сиво" },
    ],
    metals: { en: ["Gold", "Bronze", "Copper"], bg: ["Злато", "Бронз", "Мед"] },
    makeup: {
      lips: { en: "Brick, terracotta, warm brown", bg: "Тухлено, теракота, топло кафяво" },
      eyes: { en: "Copper, olive, warm bronze", bg: "Мед, маслинено, топъл бронз" },
      cheeks: { en: "Warm terracotta", bg: "Топла теракота" },
    },
    styling: {
      en: [
        "Rich, warm, and muted — think spice and forest, not neon.",
        "Trade black and grey for chocolate, olive, and camel.",
        "Gold, copper, and bronze finish the look; skip silver.",
      ],
      bg: [
        "Наситено, топло и приглушено — подправки и гора, не неон.",
        "Замени черното и сивото с шоколадово, маслинено и камел.",
        "Злато, мед и бронз завършват визията; пропусни среброто.",
      ],
    },
  },

  darkAutumn: {
    neutrals: [
      { hex: "#3A2A22", en: "Espresso", bg: "Еспресо" },
      { hex: "#B98A50", en: "Dark camel", bg: "Тъмен камел" },
      { hex: "#E3D6BC", en: "Cream", bg: "Кремаво" },
      { hex: "#2C3B2E", en: "Forest", bg: "Горско" },
    ],
    avoid: [
      { hex: "#F7C59F", en: "Pastel peach", bg: "Пастелна праскова" },
      { hex: "#E6E6FA", en: "Icy tones", bg: "Ледени тонове" },
      { hex: "#8A8D8F", en: "Cool grey", bg: "Студено сиво" },
    ],
    metals: { en: ["Antique gold", "Bronze", "Copper"], bg: ["Античо злато", "Бронз", "Мед"] },
    makeup: {
      lips: { en: "Deep brick, berry brown", bg: "Наситено тухлено, горско кафяво" },
      eyes: { en: "Deep bronze, forest, plum-brown", bg: "Наситен бронз, горско, сливово кафяво" },
      cheeks: { en: "Warm terracotta", bg: "Топла теракота" },
    },
    styling: {
      en: [
        "Go deep and warm — your colours have real weight.",
        "Pastels and icy tones wash you out; skip them.",
        "Antiqued gold and bronze suit you more than bright silver.",
      ],
      bg: [
        "Върви към наситено и топло — цветовете ти имат тежест.",
        "Пастелите и ледените тонове те обезцветяват; пропусни ги.",
        "Състареното злато и бронзът ти отиват повече от ярко сребро.",
      ],
    },
  },

  darkWinter: {
    neutrals: [
      { hex: "#1B1814", en: "Black", bg: "Черно" },
      { hex: "#2E3236", en: "Charcoal", bg: "Въглен" },
      { hex: "#F7F5F2", en: "True white", bg: "Чисто бяло" },
      { hex: "#1E2A44", en: "Dark navy", bg: "Тъмно тъмносиньо" },
    ],
    avoid: [
      { hex: "#D9C0A3", en: "Warm beige", bg: "Топло бежово" },
      { hex: "#E2571F", en: "Orange", bg: "Оранжево" },
      { hex: "#B5A8A0", en: "Muted taupe", bg: "Приглушено таупе" },
    ],
    metals: { en: ["Silver", "White gold", "Platinum"], bg: ["Сребро", "Бяло злато", "Платина"] },
    makeup: {
      lips: { en: "Deep berry, wine, true red", bg: "Наситено горско, вино, истинско червено" },
      eyes: { en: "Charcoal, deep plum", bg: "Въглен, наситено сливово" },
      cheeks: { en: "Cool berry", bg: "Студено горско" },
    },
    styling: {
      en: [
        "Own high contrast — pair deep colours with true white.",
        "Keep everything cool and clear; skip warm, dusty earth tones.",
        "Silver and platinum beat gold near your face.",
      ],
      bg: [
        "Приеми високия контраст — съчетавай наситени цветове с чисто бяло.",
        "Дръж всичко студено и ясно; избягвай топлите, прашни земни тонове.",
        "Среброто и платината печелят пред златото до лицето.",
      ],
    },
  },

  trueWinter: {
    neutrals: [
      { hex: "#1B1814", en: "Black", bg: "Черно" },
      { hex: "#FBFBF9", en: "Pure white", bg: "Чисто бяло" },
      { hex: "#33373B", en: "Charcoal", bg: "Въглен" },
      { hex: "#1B2F52", en: "Navy", bg: "Тъмносиньо" },
    ],
    avoid: [
      { hex: "#D9C0A3", en: "Beige", bg: "Бежово" },
      { hex: "#E2571F", en: "Orange", bg: "Оранжево" },
      { hex: "#8A7B62", en: "Warm brown", bg: "Топло кафяво" },
    ],
    metals: { en: ["Silver", "Platinum", "White gold"], bg: ["Сребро", "Платина", "Бяло злато"] },
    makeup: {
      lips: { en: "True red, fuchsia, cool berry", bg: "Истинско червено, фуксия, студено горско" },
      eyes: { en: "Cool grey, navy, black", bg: "Студено сиво, тъмносиньо, черно" },
      cheeks: { en: "Cool pink", bg: "Студено розово" },
    },
    styling: {
      en: [
        "Clear, cool, and high-contrast is your signature.",
        "Black and pure white are true friends — beige is not.",
        "Choose jewel tones over anything muted or earthy.",
      ],
      bg: [
        "Ясно, студено и с висок контраст е твоят почерк.",
        "Черното и чисто бялото са истински приятели — бежовото не е.",
        "Избирай скъпоценни тонове пред приглушеното или земното.",
      ],
    },
  },

  brightWinter: {
    neutrals: [
      { hex: "#1B1814", en: "Black", bg: "Черно" },
      { hex: "#FBFBF9", en: "Pure white", bg: "Чисто бяло" },
      { hex: "#2E3236", en: "Charcoal", bg: "Въглен" },
      { hex: "#123A6B", en: "Cobalt navy", bg: "Кобалтово тъмносиньо" },
    ],
    avoid: [
      { hex: "#D9C0A3", en: "Warm beige", bg: "Топло бежово" },
      { hex: "#8A7B62", en: "Muted brown", bg: "Приглушено кафяво" },
      { hex: "#E2571F", en: "Orange", bg: "Оранжево" },
    ],
    metals: { en: ["Silver", "Platinum", "Cool white gold"], bg: ["Сребро", "Платина", "Студено бяло злато"] },
    makeup: {
      lips: { en: "Bright fuchsia, true red, icy pink", bg: "Ярка фуксия, истинско червено, ледено розово" },
      eyes: { en: "Cool jewel tones, charcoal", bg: "Студени скъпоценни тонове, въглен" },
      cheeks: { en: "Cool bright pink", bg: "Студено ярко розово" },
    },
    styling: {
      en: [
        "Bright and icy-cool — the more vivid, the better.",
        "Pair a vivid colour with black or pure white for punch.",
        "Skip dusty, warm, or earthy tones entirely.",
      ],
      bg: [
        "Ярко и ледено-студено — колкото по-наситено, толкова по-добре.",
        "Съчетавай наситен цвят с черно или чисто бяло за акцент.",
        "Избягвай напълно прашните, топли или земни тонове.",
      ],
    },
  },
};

/** A ready-to-render, localized details object for a season (or null). */
export function localizeDetails(key, lang) {
  const d = SEASON_DETAILS[key];
  if (!d) return null;
  const L = lang === "bg" ? "bg" : "en";
  const pick = (o) => (o && (o[L] || o.en)) || "";
  return {
    neutrals: d.neutrals.map((n) => ({ hex: n.hex, label: n[L] || n.en })),
    avoid: d.avoid.map((a) => ({ hex: a.hex, label: a[L] || a.en })),
    metals: d.metals[L] || d.metals.en,
    makeup: {
      lips: pick(d.makeup.lips),
      eyes: pick(d.makeup.eyes),
      cheeks: pick(d.makeup.cheeks),
    },
    styling: d.styling[L] || d.styling.en,
  };
}
