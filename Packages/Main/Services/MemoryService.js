import path from 'path';

import Paths from '../Core/Paths.js';
import { ensureDir, fileExists, loadText, persistText, scanFiles } from '../Core/FileSystem.js';

const MARKDOWN_FILE_REGEX = /\.md$/i;
const HIDDEN_FILE_PREFIXES = ['Archive-', 'Legacy-', '_'];
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]+/g;

const DEFAULT_MEMORY_FILES = [
  {
    filename: 'Memory.md',
    title: 'Pinned Memory',
    description: 'Manual catch-all personal notes that should stay easy to find.',
    content: '# Pinned Memory\n\nDurable personal notes that do not fit another file.\n',
  },
  {
    filename: 'User.md',
    title: 'User Profile',
    description: 'Stable background details about the user as a person.',
    content: '# User Profile\n\nStable background details about the user as a person.\n',
  },
  {
    filename: 'Likes.md',
    title: 'Likes',
    description: 'Favorite music, foods, hobbies, aesthetics, and recurring positive preferences.',
    content:
      '# Likes\n\nFavorite music, foods, hobbies, aesthetics, and recurring positive preferences.\n',
  },
  {
    filename: 'Dislikes.md',
    title: 'Dislikes',
    description: 'Clear dislikes, aversions, and recurring negative preferences.',
    content: '# Dislikes\n\nClear dislikes, aversions, and recurring negative preferences.\n',
  },
  {
    filename: 'Family.md',
    title: 'Family',
    description: 'Family members, family dynamics, and important family context.',
    content: '# Family\n\nFamily members, family dynamics, and important family context.\n',
  },
  {
    filename: 'Friends.md',
    title: 'Friends',
    description: 'Close friends, friend groups, and important friendship context.',
    content: '# Friends\n\nClose friends, friend groups, and important friendship context.\n',
  },
  {
    filename: 'Relationships.md',
    title: 'Relationships',
    description: 'Romantic history, relationship preferences, and dating context.',
    content: '# Relationships\n\nRomantic history, relationship preferences, and dating context.\n',
  },
  {
    filename: 'Education.md',
    title: 'Education',
    description: 'Schooling, teachers, subjects, studies, and learning background.',
    content: '# Education\n\nSchooling, teachers, subjects, studies, and learning background.\n',
  },
  {
    filename: 'Career.md',
    title: 'Career',
    description: 'Personal career goals, long-term aspirations, and non-project work background.',
    content:
      '# Career\n\nPersonal career goals, long-term aspirations, and non-project work background.\n',
  },
  {
    filename: 'Goals.md',
    title: 'Goals',
    description: 'Longer-term goals, aspirations, and recurring plans in life.',
    content: '# Goals\n\nLonger-term goals, aspirations, and recurring plans in life.\n',
  },
  {
    filename: 'Health.md',
    title: 'Health',
    description:
      'Health preferences, sensitivities, and stable wellness context the user wants remembered.',
    content:
      '# Health\n\nHealth preferences, sensitivities, and stable wellness context the user wants remembered.\n',
  },
  {
    filename: 'Wellbeing.md',
    title: 'Wellbeing',
    description: 'Mood patterns, stress triggers, and what tends to help emotionally.',
    content: '# Wellbeing\n\nMood patterns, stress triggers, and what tends to help emotionally.\n',
  },
  {
    filename: 'Support.md',
    title: 'Support',
    description: 'How to comfort, motivate, or cheer the user up when they are down.',
    content: '# Support\n\nHow to comfort, motivate, or cheer the user up when they are down.\n',
  },
  {
    filename: 'Communication.md',
    title: 'Communication',
    description: 'Tone preferences, communication style, and how the user likes the AI to respond.',
    content:
      '# Communication\n\nTone preferences, communication style, and how the user likes the AI to respond.\n',
  },
  {
    filename: 'Values.md',
    title: 'Values',
    description: 'Beliefs, values, principles, and priorities that show up repeatedly.',
    content: '# Values\n\nBeliefs, values, principles, and priorities that show up repeatedly.\n',
  },
  {
    filename: 'Habits.md',
    title: 'Habits',
    description: 'Routines, habits, and recurring behaviors the user wants remembered.',
    content: '# Habits\n\nRoutines, habits, and recurring behaviors the user wants remembered.\n',
  },
  {
    filename: 'ImportantDates.md',
    title: 'Important Dates',
    description: 'Birthdays, anniversaries, deadlines, and recurring dates that matter personally.',
    content:
      '# Important Dates\n\nBirthdays, anniversaries, deadlines, and recurring dates that matter personally.\n',
  },
  {
    filename: 'Finance.md',
    title: 'Finance',
    description: 'Personal finance preferences, constraints, and money-related goals.',
    content: '# Finance\n\nPersonal finance preferences, constraints, and money-related goals.\n',
  },
  {
    filename: 'Astrology.md',
    title: 'Astrology',
    description: 'Astrology, spirituality, or belief-system details the user cares about.',
    content:
      '# Astrology\n\nAstrology, spirituality, or belief-system details the user cares about.\n',
  },
];

const DEFAULT_FILE_ORDER = new Map(
  DEFAULT_MEMORY_FILES.map((entry, index) => [entry.filename.toLowerCase(), index]),
);
const DEFAULT_FILE_META = new Map(
  DEFAULT_MEMORY_FILES.map((entry) => [entry.filename.toLowerCase(), entry]),
);

function normalizeFilename(value, fallback = '') {
  const raw = String(value ?? '')
    .trim()
    .replace(/\.md$/i, '');
  const cleaned = raw
    .replace(INVALID_FILENAME_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');

  if (!cleaned && !fallback) {
    throw new Error('Memory filename is required.');
  }

  const baseName = cleaned || String(fallback).replace(/\.md$/i, '');
  const filename = `${baseName}.md`;

  if (!MARKDOWN_FILE_REGEX.test(filename)) {
    throw new Error('Memory filename must end with .md');
  }

  if (HIDDEN_FILE_PREFIXES.some((prefix) => filename.startsWith(prefix))) {
    throw new Error('Hidden memory filenames are reserved.');
  }

  return filename;
}

function buildMemoryPath(filename) {
  initializePersonalMemoryLibrary();
  return path.join(Paths.MEMORIES_DIR, normalizeFilename(filename));
}

function isVisibleMemoryFilename(filename) {
  return (
    MARKDOWN_FILE_REGEX.test(filename) &&
    !HIDDEN_FILE_PREFIXES.some((prefix) => filename.startsWith(prefix))
  );
}

function getTemplateMeta(filename) {
  const normalized = String(filename ?? '').toLowerCase();
  return DEFAULT_FILE_META.get(normalized) ?? null;
}

function countBulletLines(content = '') {
  return String(content)
    .split('\n')
    .filter((line) => /^\s*[-*]\s+/.test(line)).length;
}

function buildTitleFromFilename(filename) {
  return String(filename ?? '')
    .replace(/\.md$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function normalizeForComparison(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collapseBlankLines(lines = []) {
  const next = [];
  let previousBlank = false;

  for (const line of lines) {
    const isBlank = !line.trim();
    if (isBlank && previousBlank) continue;
    next.push(line);
    previousBlank = isBlank;
  }

  return next;
}

function dedupeBulletLines(lines = []) {
  const seen = new Set();
  const next = [];

  for (const line of lines) {
    const match = line.match(/^(\s*[-*]\s+)(.+)$/);
    if (!match) {
      next.push(line);
      continue;
    }

    const normalized = normalizeForComparison(match[2]);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(`${match[1]}${match[2].trim()}`);
  }

  return next;
}

function finalizeMemoryContent(content, filename) {
  const meta = getTemplateMeta(filename);
  const fallbackHeading = `# ${meta?.title ?? buildTitleFromFilename(filename)}`;
  const normalized = String(content ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
  const base =
    normalized ||
    String(meta?.content ?? `${fallbackHeading}\n\n`)
      .replace(/\r\n/g, '\n')
      .trim();
  const withHeading = base.startsWith('#') ? base : `${fallbackHeading}\n\n${base}`;
  const lines = withHeading.split('\n');
  const deduped = dedupeBulletLines(lines);
  return `${collapseBlankLines(deduped).join('\n').trim()}\n`;
}

function getAllMarkdownFilenames() {
  initializePersonalMemoryLibrary();
  return scanFiles(Paths.MEMORIES_DIR, (entry) => MARKDOWN_FILE_REGEX.test(entry.name)).map(
    (fullPath) => path.basename(fullPath),
  );
}

function getVisibleMemoryEntries() {
  const filenames = getAllMarkdownFilenames().filter(isVisibleMemoryFilename);
  const uniqueNames = [...new Set(filenames)];

  return uniqueNames
    .map((filename) => {
      const meta = getTemplateMeta(filename);
      const content = loadText(path.join(Paths.MEMORIES_DIR, filename), '');
      const trimmed = content.trim();
      return {
        filename,
        title: meta?.title ?? buildTitleFromFilename(filename),
        description: meta?.description ?? 'Custom personal memory file.',
        content,
        empty: !trimmed,
        bulletCount: countBulletLines(trimmed),
        lineCount: trimmed ? trimmed.split(/\r?\n/).length : 0,
      };
    })
    .sort((left, right) => {
      const leftOrder =
        DEFAULT_FILE_ORDER.get(left.filename.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder =
        DEFAULT_FILE_ORDER.get(right.filename.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.filename.localeCompare(right.filename);
    });
}

function buildQueryTerms(query = '') {
  return normalizeForComparison(query)
    .split(' ')
    .map((term) => term.trim())
    .filter(Boolean);
}

function findMatchingLines(content = '', terms = []) {
  if (!terms.length) return [];
  const matches = [];

  for (const line of String(content).split(/\r?\n/)) {
    const normalized = normalizeForComparison(line);
    if (!normalized) continue;
    if (terms.some((term) => normalized.includes(term))) {
      matches.push(line.trim());
    }
    if (matches.length >= 3) break;
  }

  return matches;
}

export function initializePersonalMemoryLibrary() {
  ensureDir(Paths.MEMORIES_DIR);

  for (const entry of DEFAULT_MEMORY_FILES) {
    const filePath = path.join(Paths.MEMORIES_DIR, entry.filename);
    if (fileExists(filePath)) continue;
    persistText(filePath, entry.content, {
      normalizeLineEndings: true,
      finalNewline: true,
    });
  }
}

export function listPersonalMemoryFiles() {
  return getVisibleMemoryEntries().map(({ content, ...entry }) => entry);
}

export function searchPersonalMemory(query, limit = 5) {
  const terms = buildQueryTerms(query);
  if (!terms.length) return [];

  return getVisibleMemoryEntries()
    .map((entry) => {
      const haystacks = [
        normalizeForComparison(entry.filename),
        normalizeForComparison(entry.title),
        normalizeForComparison(entry.description),
      ];

      let score = 0;
      for (const term of terms) {
        if (haystacks[0].includes(term)) score += 6;
        if (haystacks[1].includes(term)) score += 5;
        if (haystacks[2].includes(term)) score += 4;
      }

      const matchingLines = findMatchingLines(entry.content, terms);
      score += matchingLines.length * 3;

      return {
        filename: entry.filename,
        title: entry.title,
        description: entry.description,
        score,
        matches: matchingLines,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.filename.localeCompare(right.filename))
    .slice(0, Math.min(Math.max(Number(limit) || 5, 1), 12));
}

export function readPersonalMemoryFiles(filenames = []) {
  const requested = Array.isArray(filenames) ? filenames : [filenames];
  const uniqueNames = [...new Set(requested.map((filename) => normalizeFilename(filename)))];

  return uniqueNames.map((filename) => {
    const filePath = buildMemoryPath(filename);
    const meta = getTemplateMeta(filename);
    return {
      filename,
      title: meta?.title ?? buildTitleFromFilename(filename),
      description: meta?.description ?? 'Custom personal memory file.',
      content: loadText(filePath, ''),
    };
  });
}

export function readPersonalMemoryCatalog() {
  return getVisibleMemoryEntries();
}

export function applyPersonalMemoryUpdates(payload = {}) {
  const entries = [
    ...(Array.isArray(payload.updates) ? payload.updates : []),
    ...(Array.isArray(payload.newFiles) ? payload.newFiles : []),
  ];

  const touched = [];

  for (const entry of entries) {
    const filename = normalizeFilename(entry?.filename);
    const filePath = buildMemoryPath(filename);
    const created = !fileExists(filePath);
    const nextContent = finalizeMemoryContent(entry?.content, filename);

    persistText(filePath, nextContent, {
      normalizeLineEndings: true,
      finalNewline: true,
    });

    const meta = getTemplateMeta(filename);
    touched.push({
      filename,
      title: meta?.title ?? buildTitleFromFilename(filename),
      created,
    });
  }

  return touched;
}

export function readPinnedMemory() {
  initializePersonalMemoryLibrary();
  return loadText(Paths.MEMORY_FILE, '');
}

export function writePinnedMemory(content) {
  initializePersonalMemoryLibrary();
  persistText(Paths.MEMORY_FILE, finalizeMemoryContent(content, 'Memory.md'), {
    normalizeLineEndings: true,
    finalNewline: true,
  });
}
