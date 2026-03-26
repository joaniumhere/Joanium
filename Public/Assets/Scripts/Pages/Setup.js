import { PROVIDERS } from './Setup/SetupProviders.js';
import { initStepController } from './Setup/SetupSteps.js';

/* ── State ── */
const state = {
  step: 0,              // 0=splash, 1=name, 2=providers, 3=done
  name: '',
  selectedProviders: new Set(),
  apiKeys: {},
};

/* ── DOM refs ── */
const stepSplash    = document.getElementById('step-splash');
const stepName      = document.getElementById('step-name');
const stepProviders = document.getElementById('step-providers');
const stepDone      = document.getElementById('step-done');

const tcCheck        = document.getElementById('tc-check');
const splashContinue = document.getElementById('splash-continue');

const nameInput    = document.getElementById('name-input');
const nameContinue = document.getElementById('name-continue');

const providerGrid  = document.getElementById('provider-grid');
const keysSection   = document.getElementById('keys-section');
const keysContinue  = document.getElementById('keys-continue');

const progressTrack = document.getElementById('progress-track');
const setupLogo     = document.getElementById('setup-logo');
const progressDots  = document.querySelectorAll('.dot'); // 4 dots
const doneTitle     = document.getElementById('done-title');

// Step elements in order (index = step number)
const STEP_ELS = [stepSplash, stepName, stepProviders, stepDone];

/* ── Step controller ── */
// Wrap the base controller to inject page-specific side-effects (buildProviderGrid on step 2).
const { goToStep: _baseGoToStep } = initStepController({
  state, STEP_ELS, setupLogo, progressTrack, progressDots, nameInput, doneTitle,
});
function goToStep(n) {
  _baseGoToStep(n);
  if (n === 2) buildProviderGrid();
}

/* ══════════════════════════════════════════
     Particles (splash background)
   ══════════════════════════════════════════ */
(function spawnParticles() {
  const canvas = document.getElementById('splash-canvas');
  if (!canvas) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      bottom:${Math.random() * 40}%;
      --dur:${4 + Math.random() * 6}s;
      --delay:-${Math.random() * 5}s;
    `;
    canvas.appendChild(p);
  }
})();

/* ══════════════════════════════════════════
     STEP 0 — Splash / T&C
   ══════════════════════════════════════════ */
tcCheck.addEventListener('change', () => {
  const checked = tcCheck.checked;
  splashContinue.disabled = !checked;
  splashContinue.classList.toggle('ready', checked);
});

splashContinue.addEventListener('click', () => {
  if (!tcCheck.checked) return;
  goToStep(1);
});

/* ══════════════════════════════════════════
     STEP 1 — Name
   ══════════════════════════════════════════ */
nameInput.addEventListener('input', () => {
  const val = nameInput.value.trim();
  nameContinue.classList.toggle('ready', val.length >= 2);
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tryAdvanceFromName();
});

nameContinue.addEventListener('click', tryAdvanceFromName);

function tryAdvanceFromName() {
  const val = nameInput.value.trim();
  if (val.length < 2) return;
  state.name = val;
  goToStep(2);
}

/* ══════════════════════════════════════════
     STEP 2 — Providers
   ══════════════════════════════════════════ */
function buildProviderGrid() {
  providerGrid.innerHTML = '';
  PROVIDERS.forEach(p => {
    const card = document.createElement('button');
    const isSelected = state.selectedProviders.has(p.id);

    card.type = 'button';
    card.className = 'provider-card';
    card.dataset.id = p.id;
    card.title = `${p.label}${p.company ? ` by ${p.company}` : ''}`;
    card.setAttribute('aria-label', card.title);
    card.setAttribute('aria-pressed', String(isSelected));
    card.style.setProperty('--p-color', p.color);
    card.innerHTML = `
      <span class="p-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12l5 5L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/>
        </svg>
      </span>
      <span class="p-icon" aria-hidden="true">
        <img class="p-icon-image" src="${p.iconPath}" alt="" />
        <span class="p-icon-fallback">${p.fallback}</span>
      </span>`;

    if (isSelected) card.classList.add('selected');

    const image = card.querySelector('.p-icon-image');
    image.addEventListener('error', () => card.classList.add('icon-missing'));
    image.addEventListener('load',  () => card.classList.remove('icon-missing'));
    if (image.complete && image.naturalWidth === 0) card.classList.add('icon-missing');

    card.addEventListener('click', () => toggleProvider(p.id, card));
    providerGrid.appendChild(card);
  });
}

function toggleProvider(id, card) {
  if (state.selectedProviders.has(id)) {
    state.selectedProviders.delete(id);
    card.classList.remove('selected');
    card.setAttribute('aria-pressed', 'false');
  } else {
    state.selectedProviders.add(id);
    card.classList.add('selected');
    card.setAttribute('aria-pressed', 'true');
  }
  renderKeyFields();
  updateKeysContinue();
}

function renderKeyFields() {
  keysSection.innerHTML = '';
  if (state.selectedProviders.size === 0) return;

  const heading = document.createElement('p');
  heading.className = 'keys-heading';
  heading.textContent = 'Enter your API keys';
  keysSection.appendChild(heading);

  PROVIDERS.filter(p => state.selectedProviders.has(p.id)).forEach(p => {
    const row = document.createElement('div');
    row.className = 'key-row';
    row.style.setProperty('--p-color', p.color);
    row.innerHTML = `
      <label class="key-label">
        <span class="key-dot"></span>
        ${p.label}
      </label>
      <div class="key-input-wrap">
        <input
          type="password"
          class="key-input"
          id="key-${p.id}"
          placeholder="${p.placeholder}"
          autocomplete="off"
          spellcheck="false"
        />
        <button type="button" class="key-eye" data-target="key-${p.id}" title="Show/hide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="1.8"/>
            <circle cx="12" cy="12" r="3" stroke-width="1.8"/>
          </svg>
        </button>
      </div>`;

    const input = row.querySelector('.key-input');
    input.value = state.apiKeys[p.id] || '';
    input.addEventListener('input', () => {
      state.apiKeys[p.id] = input.value.trim();
      updateKeysContinue();
    });

    const eye = row.querySelector('.key-eye');
    eye.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    keysSection.appendChild(row);
  });
}

function updateKeysContinue() {
  if (state.selectedProviders.size === 0) {
    keysContinue.classList.remove('ready');
    return;
  }
  const allFilled = [...state.selectedProviders].every(id => {
    const input = document.getElementById(`key-${id}`);
    return input && input.value.trim().length > 8;
  });
  keysContinue.classList.toggle('ready', allFilled);
}

keysContinue.addEventListener('click', async () => {
  if (!keysContinue.classList.contains('ready')) return;

  state.selectedProviders.forEach(id => {
    const input = document.getElementById(`key-${id}`);
    if (input) state.apiKeys[id] = input.value.trim();
  });

  await saveSetup();
  goToStep(3);
});

/* ══════════════════════════════════════════
     SAVE — write User.json + Models.json
   ══════════════════════════════════════════ */
async function saveSetup() {
  try {
    await window.electronAPI.saveUser({
      name: state.name,
      setup_complete: true,
      created_at: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        default_provider: [...state.selectedProviders][0] || null,
        default_model: null,
      },
    });

    await window.electronAPI.saveAPIKeys(
      Object.fromEntries(
        [...state.selectedProviders].map(id => [id, state.apiKeys[id]])
      )
    );
  } catch (err) {
    console.error('[setup] Save error:', err);
    // Graceful degradation: still advance
  }
}



// Dot 0 (splash) active on load
progressDots.forEach((dot, i) => {
  dot.classList.toggle('active', i === 0);
});