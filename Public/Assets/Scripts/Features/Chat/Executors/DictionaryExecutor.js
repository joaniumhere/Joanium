// openworld — Features/Chat/Executors/DictionaryExecutor.js
import { safeJson } from './utils.js';

const HANDLED = new Set(['define_word']);

export function handles(toolName) { return HANDLED.has(toolName); }

export async function execute(toolName, params, onStage = () => { }) {
    if (toolName !== 'define_word') throw new Error(`DictionaryExecutor: unknown tool "${toolName}"`);

    const { word } = params;
    if (!word) throw new Error('Missing required param: word');
    onStage(`📖 Looking up "${word}"…`);

    let data;
    try {
        data = await safeJson(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`
        );
    } catch (err) {
        if (err.message.includes('404')) {
            return `Word "${word}" not found. Check spelling or try a different word.`;
        }
        throw err;
    }

    if (!Array.isArray(data) || !data.length) {
        return `No definitions found for "${word}".`;
    }

    const entry = data[0];
    const lines = [`📖 ${entry.word}`];

    // Phonetics
    const phonetic = entry.phonetics?.find(p => p.text)?.text;
    if (phonetic) lines.push(`🔊 ${phonetic}`);
    lines.push(``);

    // Meanings (limit to 3 parts of speech for brevity)
    const meanings = (entry.meanings ?? []).slice(0, 3);
    for (const meaning of meanings) {
        lines.push(`**${meaning.partOfSpeech}**`);

        const defs = (meaning.definitions ?? []).slice(0, 3);
        defs.forEach((def, i) => {
            lines.push(`  ${i + 1}. ${def.definition}`);
            if (def.example) lines.push(`     _"${def.example}"_`);
        });

        const syns = (meaning.synonyms ?? []).slice(0, 5);
        if (syns.length) lines.push(`  Synonyms: ${syns.join(', ')}`);

        const ants = (meaning.antonyms ?? []).slice(0, 5);
        if (ants.length) lines.push(`  Antonyms: ${ants.join(', ')}`);

        lines.push(``);
    }

    // Source URL
    const sourceUrl = entry.sourceUrls?.[0];
    if (sourceUrl) lines.push(`🔗 ${sourceUrl}`);
    lines.push(`Source: Free Dictionary API (dictionaryapi.dev)`);

    return lines.join('\n');
}
