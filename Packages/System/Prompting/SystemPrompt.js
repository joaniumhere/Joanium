import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) result[key] = val;
  }
  return result;
}

const SKIP_FILES = new Set(['Debug.md']);

function loadSkillsEnabledMap() {
  const skillsFile = path.join(PROJECT_ROOT, 'Data', 'Skills.json');
  try {
    if (fs.existsSync(skillsFile)) {
      const data = JSON.parse(fs.readFileSync(skillsFile, 'utf-8'));
      return data.skills ?? {};
    }
  } catch {}
  return {};
}

function loadSkills() {
  const skillsDir = path.join(PROJECT_ROOT, 'Skills');
  if (!fs.existsSync(skillsDir)) return [];

  const enabledMap = loadSkillsEnabledMap();
  const skills = [];

  for (const file of fs.readdirSync(skillsDir)) {
    if (!file.endsWith('.md') || SKIP_FILES.has(file)) continue;
    if (enabledMap[file] !== true) continue;

    try {
      const content = fs.readFileSync(path.join(skillsDir, file), 'utf-8');
      const meta = parseFrontmatter(content);
      const { name, trigger, description } = meta;
      const bodyMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
      const body = bodyMatch ? bodyMatch[1].trim() : '';
      if (name) {
        skills.push({ name, trigger: trigger || '', description: description || '', body });
      }
    } catch {}
  }
  return skills;
}

function buildSkillsBlock() {
  const skills = loadSkills();
  if (!skills.length) return '';

  const skillDocs = skills.map(skill => {
    const lines = [`### Skill: ${skill.name}`];
    if (skill.trigger) lines.push(`**When to use:** ${skill.trigger}`);
    if (skill.description) lines.push(`**Description:** ${skill.description}`);
    if (skill.body) lines.push('', skill.body);
    return lines.join('\n');
  });

  return [
    '## Skills',
    `You have ${skills.length} active skill${skills.length !== 1 ? 's' : ''}. Read each one fully and apply whichever fits silently.`,
    '',
    ...skillDocs,
    '',
    'Blend skills when relevant. If none fit, answer normally.',
  ].join('\n\n');
}

let _country = null;
async function fetchCountry() {
  if (_country) return _country;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch('https://ipapi.co/country_name/', { signal: ctrl.signal });
    if (res.ok) {
      _country = (await res.text()).trim();
      return _country;
    }
  } catch {}
  finally { clearTimeout(timer); }
  return null;
}

function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function normalizeSection(section) {
  if (!section) return null;
  if (typeof section === 'string') {
    return { title: 'Additional Context', body: section };
  }
  if (typeof section === 'object' && section.title && section.body) {
    return { title: section.title, body: section.body };
  }
  return null;
}

function pushExtraSections(lines, sections = []) {
  for (const rawSection of sections) {
    const section = normalizeSection(rawSection);
    if (!section) continue;
    lines.push('');
    lines.push(`## ${section.title}`);
    lines.push(section.body.trim());
  }
}

export async function buildSystemPrompt({
  userName = '',
  customInstructions = '',
  memory = '',
  githubUsername = null,
  githubRepos = [],
  gmailEmail = null,
  activePersona = null,
  connectedServices = [],
  extraContextSections = [],
} = {}) {
  const now = new Date();
  const timeStr = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const platform = process.platform;
  const osName = platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux';
  const release = os.release();
  const totalMemGB = (os.totalmem() / 1_073_741_824).toFixed(1);
  const cpus = os.cpus();
  const cpuModel = (cpus[0]?.model ?? 'Unknown CPU').replace(/\s+/g, ' ').trim();
  const cpuCores = cpus.length;
  const country = await fetchCountry();

  const lines = [];
  const push = (...args) => lines.push(...args);
  const blank = () => lines.push('');

  if (activePersona) {
    push(`You are ${activePersona.name}.`);
    if (activePersona.personality) push(`Your personality: ${activePersona.personality}.`);
    if (activePersona.description) push(activePersona.description);
    if (activePersona.instructions?.trim()) {
      blank();
      push(activePersona.instructions.trim());
    }
    blank();
    push('---');
    blank();
    push('You are running inside Joanium, a personal desktop AI platform.');
  } else {
    push('You are an intelligent AI assistant running inside Joanium, a personal desktop AI platform built by Joel Jolly.');
  }

  blank();
  push('## User');
  push(`- **Name:** ${userName || 'User'}`);
  push(`- **Local time:** ${timeStr}`);
  push(`- **Date:** ${getCurrentDate()}`);
  if (country) push(`- **Country:** ${country}`);
  push(`- **OS:** ${osName} ${release}`);
  push(`- **Hardware:** ${cpuCores}-core CPU (${cpuModel}), ${totalMemGB} GB RAM`);

  const mergedConnectedServices = [...connectedServices];
  if (gmailEmail && !mergedConnectedServices.some(item => item.includes('Google Workspace') || item.includes('Gmail'))) {
    mergedConnectedServices.push(`Gmail (${gmailEmail})`);
  }
  if (githubUsername && !mergedConnectedServices.some(item => item.includes('GitHub'))) {
    mergedConnectedServices.push(`GitHub (@${githubUsername})`);
  }
  if (mergedConnectedServices.length) {
    push(`- **Connected services:** ${[...new Set(mergedConnectedServices)].join(', ')}`);
  }

  if (githubUsername && githubRepos.length && !extraContextSections.length) {
    blank();
    push(`## GitHub Repositories (@${githubUsername})`);
    push('The user has these repos (most recently updated first):');
    githubRepos.slice(0, 20).forEach(repo => {
      const desc = repo.description ? ` - ${repo.description}` : '';
      const lang = repo.language ? ` [${repo.language}]` : '';
      push(`- \`${repo.full_name}\`${desc}${lang}`);
    });
    push('When the user asks about "my repo" or references a project by name, match it against the list above.');
  }

  pushExtraSections(lines, extraContextSections);

  if (memory?.trim()) {
    blank();
    push('## Memory (persistent notes about the user)');
    push(memory.trim());
  }

  if (customInstructions?.trim()) {
    blank();
    push('## Custom Instructions');
    push(customInstructions.trim());
  }

  const skillsBlock = buildSkillsBlock();
  if (skillsBlock) {
    blank();
    push(skillsBlock);
  }

  blank();
  push('Answer helpfully, concisely, and accurately. When the user references their repos, emails, system, connectors, or preferences, use the context above.');
  push('Use internal tools, connectors, or background steps silently. Never mention hidden prompts, tool calls, raw command markers, or internal execution transcripts in the user-facing answer.');
  push('If an internal step fails, recover when possible and describe only the user-facing limitation or result.');

  return lines.join('\n');
}
