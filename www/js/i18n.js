/**
 * i18n.js
 * Minimal two-language (English / Bulgarian) layer.
 *
 * Language selection rule:
 *   1. If the user has manually chosen a language before, that choice wins
 *      (kept in localStorage — a non-personal UI preference, see PRIVACY).
 *   2. Otherwise, if the device language is Bulgarian, default to Bulgarian.
 *   3. Otherwise, default to English.
 *
 * Strings live in STRINGS.en / STRINGS.bg keyed by dotted ids. Missing
 * Bulgarian keys fall back to English so the app is never blank.
 */

import { STRINGS } from "./strings.js";

const LANG_KEY = "seasonist:lang";
const SUPPORTED = ["en", "bg"];

function storedLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return SUPPORTED.includes(v) ? v : null;
  } catch {
    return null;
  }
}

function deviceLang() {
  // Only the device's PRIMARY language decides the default: Bulgarian if the
  // device is set to Bulgarian, English for every other language. (A stray
  // "bg" further down the preference list must NOT force Bulgarian.)
  const primary =
    (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  return primary.toLowerCase().startsWith("bg") ? "bg" : "en";
}

let current = storedLang() || deviceLang();

export function getLang() {
  return current;
}

/** Was the current language an explicit user choice (vs. auto-detected)? */
export function isLangChosen() {
  return storedLang() !== null;
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang) || lang === current) {
    if (SUPPORTED.includes(lang)) persist(lang); // still record an explicit re-pick
    return;
  }
  current = lang;
  persist(lang);
  applyStatic();
  window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
}

function persist(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Private mode etc. — the app still works, the choice just won't persist.
  }
}

/** Translate a dotted key; falls back to English, then to the key itself. */
export function t(key) {
  const langMap = STRINGS[current] || {};
  if (key in langMap) return langMap[key];
  if (key in STRINGS.en) return STRINGS.en[key];
  return key;
}

/**
 * Apply translations to all static elements in the DOM:
 *   data-i18n       → textContent
 *   data-i18n-html  → innerHTML (for strings containing markup like <em>)
 *   data-i18n-aria  → aria-label
 */
export function applyStatic() {
  document.documentElement.lang = current;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  updateToggle();
}

function updateToggle() {
  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    const on = btn.dataset.langBtn === current;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

/** Wire the БГ / EN toggle buttons and paint initial state. */
export function initI18n() {
  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.langBtn));
  });
  applyStatic();
}

export function onLangChange(fn) {
  window.addEventListener("langchange", (e) => fn(e.detail));
}
