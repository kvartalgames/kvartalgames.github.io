import { siteConfig } from './config.js';
import { getCountdown, formatLaunch } from './countdown.js';

const title = siteConfig.title.trim();
document.querySelectorAll('[data-title]').forEach(node => { node.textContent = title; });
document.title = `${title} — зимний двор в Roblox`;
document.querySelectorAll('[data-studio]').forEach(node => {
  node.textContent = siteConfig.studio || '';
  node.hidden = !siteConfig.studio;
});
if (siteConfig.logoUrl) {
  const brand = document.querySelector('.header .brand');
  const logo = new Image();
  logo.src = siteConfig.logoUrl;
  logo.alt = title;
  brand.replaceChildren(logo);
}
const launchDate = formatLaunch(siteConfig.launchAt);
document.querySelectorAll('[data-launch-date]').forEach(node => {
  node.textContent = launchDate;
  if (node.tagName === 'TIME') node.dateTime = siteConfig.launchAt;
});
document.querySelector('meta[name="description"]').content = `${title} — зимняя социальная песочница в Roblox. Мороз, бутылки, своя комната и звонки таксофона. Плановый запуск: ${launchDate}.`;

function validLink(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}
const links = Object.fromEntries(Object.entries(siteConfig.links).map(([key, value]) => [key, validLink(value)]));
const officialLinks = document.querySelector('#official-links');
const linkLabels = { roblox: 'Страница в Roblox', community: 'Сообщество', news: 'Новости игры' };
for (const [key, url] of Object.entries(links)) {
  if (!url) continue;
  const link = document.createElement('a');
  link.className = 'button button-warm';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = `${linkLabels[key]} ↗`;
  officialLinks.append(link);
}
if (links.roblox) document.querySelector('#launch-note').textContent = siteConfig.released ? 'Игра вышла, ссылка выше.' : 'Страница игры уже здесь. Доступность запуска подтвердим отдельно.';
else if (links.news || links.community) document.querySelector('#launch-note').textContent = 'Официальная ссылка на игру появится после подтверждения. Следи за новостями.';

const counters = [...document.querySelectorAll('[data-countdown]')];
const units = [['days', 'дни'], ['hours', 'часы'], ['minutes', 'минуты'], ['seconds', 'секунды']];
for (const counter of counters) {
  for (const [key, label] of units) {
    const unit = document.createElement('span');
    unit.className = 'countdown-unit';
    const value = document.createElement('span');
    value.className = 'countdown-value';
    value.dataset.unit = key;
    value.textContent = '00';
    const name = document.createElement('span');
    name.className = 'countdown-name';
    name.textContent = label;
    unit.append(value, name);
    counter.append(unit);
  }
}
let reachedBefore;
function updateCountdown() {
  const state = getCountdown(siteConfig.launchAt);
  for (const counter of counters) {
    for (const [key] of units) {
      const value = String(state[key]).padStart(2, '0');
      const node = counter.querySelector(`[data-unit="${key}"]`);
      if (node.textContent !== value) node.textContent = value;
    }
    counter.hidden = state.reached;
  }
  if (reachedBefore !== state.reached) {
    document.querySelectorAll('[data-launch-status]').forEach(node => {
      node.hidden = !state.reached;
      node.textContent = siteConfig.released && links.roblox ? 'Игра доступна. Встретимся во дворе.' : 'Время запуска наступило. Следите за новостями';
    });
    document.querySelectorAll('.countdown-label, .hero-launch>div:first-child>.eyebrow').forEach(node => { node.hidden = state.reached; });
    reachedBefore = state.reached;
  }
}
let timer;
function startClock() { clearInterval(timer); updateCountdown(); timer = setInterval(updateCountdown, 1000); }
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('page-hidden', document.hidden);
  if (document.hidden) { clearInterval(timer); stopSound(); }
  else startClock();
});
window.addEventListener('pageshow', startClock);
startClock();

let audioContext;
const activeTones = new Set();
const soundButton = document.querySelector('#sound-toggle');
function stopSound() {
  for (const tone of activeTones) { try { tone.stop(); } catch {} }
  activeTones.clear();
}
function playReceiver() {
  if (soundButton.getAttribute('aria-pressed') !== 'true' || document.hidden) return;
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  audioContext.resume();
  stopSound();
  // A quiet, brief receiver tone, generated locally after explicit opt-in.
  const now = audioContext.currentTime;
  for (const frequency of [425, 450]) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.018, now + 0.06);
    gain.gain.setValueAtTime(0.018, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.55);
    oscillator.connect(gain).connect(audioContext.destination);
    activeTones.add(oscillator);
    oscillator.onended = () => { activeTones.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + 0.6);
  }
}
if (!(window.AudioContext || window.webkitAudioContext)) soundButton.hidden = true;
soundButton.addEventListener('click', () => {
  const enabled = soundButton.getAttribute('aria-pressed') !== 'true';
  soundButton.setAttribute('aria-pressed', String(enabled));
  soundButton.replaceChildren(document.createTextNode(enabled ? 'Звук: включён ' : 'Звук: выключен '));
  const icon = document.createElement('span'); icon.textContent = '♪'; icon.ariaHidden = 'true'; soundButton.append(icon);
  if (enabled) playReceiver(); else stopSound();
});
document.querySelector('#answer-phone').addEventListener('click', event => {
  const button = event.currentTarget;
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  document.querySelector('#phone-message').hidden = !expanded;
  button.textContent = expanded ? 'Положить трубку ↙' : 'Снять трубку · 2 коп. ↗';
  if (expanded) playReceiver(); else stopSound();
});
document.querySelector('#light-toggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const lightsOff = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(lightsOff));
  document.querySelector('#night-on').hidden = lightsOff;
  document.querySelector('#night-off').hidden = !lightsOff;
  document.querySelector('#light-label').textContent = lightsOff ? 'Света нет' : 'Свет есть';
});

const frames = [
  ['yard', 'Двор ночью', 1920, 1080],
  ['stop', 'Конечная', 1280, 720],
  ['phone', 'Таксофон', 1920, 1080],
  ['entrance', 'Подъезд', 1280, 720],
  ['attic', 'Чердак', 1280, 720],
  ['garages', 'Гаражи', 1280, 720],
  ['station', 'Опорный пункт ночью', 1280, 720],
  ['duty-room', 'Комната дежурного', 1280, 720],
  ['station-window', 'Окошко дежурного', 1280, 720],
  ['playground', 'Детская площадка', 1280, 720],
  ['stove', 'Буржуйка в бытовке', 1280, 720],
];
document.querySelector('[data-gallery-total]').textContent = `${String(frames.length).padStart(2, '0')} кадров / Один двор`;
const dialog = document.querySelector('#gallery-dialog');
const fullImage = document.querySelector('#gallery-full');
let frameIndex = 0;
let galleryOpener;
function showFrame(index) {
  frameIndex = (index + frames.length) % frames.length;
  const [name, caption, width, height] = frames[frameIndex];
  fullImage.src = `/assets/${name}-${width}.webp`;
  fullImage.alt = caption;
  // Cap at the actual derivative size; never enlarge tiny previews.
  fullImage.style.maxWidth = `min(100%, ${width}px)`;
  fullImage.style.maxHeight = `min(100%, ${height}px)`;
  document.querySelector('#gallery-caption').textContent = caption;
  document.querySelector('#gallery-count').textContent = `${String(frameIndex + 1).padStart(2, '0')} / ${String(frames.length).padStart(2, '0')} · Кадры из двора`;
}
document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => {
  galleryOpener = button;
  showFrame(Number(button.dataset.gallery));
  dialog.showModal();
  document.body.classList.add('modal-open');
  document.querySelector('#gallery-close').focus();
}));
document.querySelector('#gallery-close').addEventListener('click', () => dialog.close());
document.querySelector('#gallery-prev').addEventListener('click', () => showFrame(frameIndex - 1));
document.querySelector('#gallery-next').addEventListener('click', () => showFrame(frameIndex + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); showFrame(frameIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  galleryOpener?.focus({ preventScroll: true });
});
