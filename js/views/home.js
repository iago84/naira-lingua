// js/views/home.js
import { esc } from "../util.js";
import { toHash } from "../router.js";

const MODES = [
  ["study", "nav.study", "🃏"],
  ["quiz", "nav.quiz", "❓"],
  ["lessons", "nav.lessons", "📖"],
  ["alphabet", "nav.alphabet", "🔤"],
  ["dictionary", "nav.dictionary", "🔎"],
  ["progress", "nav.progress", "📈"],
];

export function renderHome({ t }) {
  const cards = MODES.map(([route, key, icon]) => `
    <a class="card mode-card" href="${toHash(route)}">
      <span class="mode-icon" aria-hidden="true">${icon}</span>
      <h3>${esc(t(key))}</h3>
    </a>`).join("");
  return `
    <section class="hero">
      <h1>naira<span>·</span>lingua</h1>
      <p class="lead">${esc(t("home.lead"))}</p>
      <a class="btn primary" href="${toHash("pick")}">${esc(t("home.start"))}</a>
    </section>
    <section class="grid" style="margin-top:28px">${cards}</section>`;
}
