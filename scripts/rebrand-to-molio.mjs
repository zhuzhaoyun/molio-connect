// One-shot rebrand: Obsidian -> Molio in user-visible strings only.
// - _locales/*/messages.json: replace within `message`/`description` VALUES
//   (keys untouched, so data-i18n / getMessage() references stay valid).
// - *.html: replace within text nodes (>...<), so attribute values and
//   lowercase URLs (help.obsidian.md) are preserved.
// Run: node scripts/rebrand-to-molio.mjs   (from repo root)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src';
let touched = 0;

function replaceInJsonValue(content) {
	// Only the value of "message" / "description", preserving file formatting.
	const repl = (m, _, val) => {
		const next = val.replace(/Obsidian/g, 'Molio');
		return next === val ? m : m.replace(val, next);
	};
	content = content.replace(/("message":\s")((?:[^"\\]|\\.)*)(")/g, repl);
	content = content.replace(/("description":\s")((?:[^"\\]|\\.)*)(")/g, repl);
	return content;
}

function replaceInHtmlText(content) {
	// Replace "Obsidian" inside text nodes only (> ... <), leaving
	// attribute values (data-i18n="addToObsidian", value="addToObsidian")
	// and URLs (help.obsidian.md) untouched.
	return content.replace(/>([^<]*?)</g, (m, text) =>
		text.includes('Obsidian') ? '>' + text.replace(/Obsidian/g, 'Molio') + '<' : m
	);
}

function walk(dir, fn) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) walk(p, fn);
		else fn(p);
	}
}

walk(join(ROOT, '_locales'), (file) => {
	if (!file.endsWith('messages.json')) return;
	const orig = readFileSync(file, 'utf8');
	const next = replaceInJsonValue(orig);
	if (next !== orig) { writeFileSync(file, next); touched++; console.log('locale:', file); }
});

walk(ROOT, (file) => {
	if (!file.endsWith('.html')) return;
	const orig = readFileSync(file, 'utf8');
	const next = replaceInHtmlText(orig);
	if (next !== orig) { writeFileSync(file, next); touched++; console.log('html  :', file); }
});

console.log(`\nDone. Files touched: ${touched}`);
