// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/About.js
//  About modal — version info, sponsor link
// ─────────────────────────────────────────────

import Properties from '../../../Packages/System/Properties.js';
import { closeAvatarPanel } from './User.js';

/* ── DOM refs ── */
const aboutModalBackdrop = document.getElementById('about-modal-backdrop');
const aboutModalClose    = document.getElementById('about-modal-close');
const aboutVersionEl     = document.getElementById('about-version');
const aboutSponsorBtn    = document.getElementById('about-sponsor-btn');
const aboutAuthorLink    = document.getElementById('about-author-link');
const avatarAboutBtn     = document.getElementById('avatar-about-btn');

/* ── Hydrate static content from Properties ── */
if (aboutVersionEl)  aboutVersionEl.textContent  = `v${Properties.version}`;
if (aboutSponsorBtn) aboutSponsorBtn.href         = Properties.sponsorUrl;
if (aboutAuthorLink) aboutAuthorLink.href         = Properties.authorUrl;

/* ── Intercept external links — open in OS default browser via Electron ── */
function openExternal(url) {
  // In Electron the shell.openExternal is exposed via webContents.setWindowOpenHandler,
  // so we create a temporary anchor with target="_blank" which Electron routes externally.
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
}

if (aboutSponsorBtn) {
  aboutSponsorBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openExternal(Properties.sponsorUrl);
  });
}

if (aboutAuthorLink) {
  aboutAuthorLink.addEventListener('click', (e) => {
    e.preventDefault();
    openExternal(Properties.authorUrl);
  });
}

/* ── Open / Close ── */
export function openAboutModal() {
  closeAvatarPanel();
  aboutModalBackdrop?.classList.add('open');
  document.body.classList.add('modal-open');
}

export function closeAboutModal() {
  aboutModalBackdrop?.classList.remove('open');
  document.body.classList.remove('modal-open');
}

/* ── Event listeners ── */
avatarAboutBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  openAboutModal();
});

aboutModalClose?.addEventListener('click', closeAboutModal);

aboutModalBackdrop?.addEventListener('click', (e) => {
  if (e.target === aboutModalBackdrop) closeAboutModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && aboutModalBackdrop?.classList.contains('open')) {
    closeAboutModal();
  }
});
