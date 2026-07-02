import { sanitizeFileName } from '../utils/string-utils';
import { generateFrontmatter as generateFrontmatterCore } from './shared';
import { Template, Property } from '../types/types';
import { generalSettings } from './storage-utils';
import browser from './browser-polyfill';

export async function generateFrontmatter(properties: Property[]): Promise<string> {
	const typeMap: Record<string, string> = {};
	for (const pt of generalSettings.propertyTypes) {
		typeMap[pt.name] = pt.type;
	}
	return generateFrontmatterCore(properties, typeMap);
}

// ─── Molio daemon integration ──────────────────────────────────────────────
// The Molio Web Clipper saves clips straight into the user's currently-open
// Molio knowledge base via the local Molio daemon, instead of routing through
// the obsidian:// protocol. The target vault is the daemon's "active vault" —
// whichever vault the user has open in Molio right now — so clips always land
// where the user is looking, with zero configuration.
//
// Requires the Molio daemon (default http://localhost:3100) to be running and
// at least one knowledge base to exist. The daemon auto-creates parent
// directories when writing files, and its VaultWatcher picks up the landed
// file so the Molio UI refreshes without a manual refocus.

const DEFAULT_DAEMON_URL = 'http://localhost:3100';

interface ActiveVaultResponse {
	vaultId: string | null;
	vault: { id: string; name: string; path: string } | null;
}

interface VaultsResponse {
	vaults: Array<{ id: string; name: string; path: string }>;
}

interface FileContentResponse {
	content?: string;
}

/** Build the URL-safe file path segment (slashes preserved, other chars encoded). */
function encodeFilePath(relPath: string): string {
	return encodeURIComponent(relPath).replace(/%2F/g, '/');
}

/** Today's date as YYYY-MM-DD, for daily-note file names. */
function todayDateStamp(): string {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

/**
 * Resolve the vault id the clip should land in.
 *
 * Primary source: the daemon's active vault (the one the user has open in
 * Molio). If none is set — e.g. the user never opened Molio, or the daemon
 * was just started — fall back to the first vault in the list. This keeps
 * the common path zero-config while still doing something sensible when the
 * active-vault pointer is missing.
 */
async function resolveTargetVaultId(): Promise<string> {
	const base = DEFAULT_DAEMON_URL;

	const activeRes = await fetch(`${base}/api/knowledge/active-vault`);
	if (activeRes.ok) {
		const data = (await activeRes.json()) as ActiveVaultResponse;
		if (data.vaultId && data.vault) {
			return data.vault.id;
		}
	}

	// No active vault — fall back to the first vault, if any.
	const listRes = await fetch(`${base}/api/knowledge/vaults`);
	if (!listRes.ok) {
		throw new Error(`Molio daemon unreachable (HTTP ${listRes.status}). Is Molio running on ${base}?`);
	}
	const list = (await listRes.json()) as VaultsResponse;
	if (!list.vaults || list.vaults.length === 0) {
		throw new Error('No Molio knowledge base found. Create one in Molio first, then try clipping again.');
	}
	return list.vaults[0].id;
}

/** Read an existing note's content, or null if it doesn't exist yet. */
async function readVaultFile(vaultId: string, relPath: string): Promise<string | null> {
	const base = DEFAULT_DAEMON_URL;
	const res = await fetch(`${base}/api/knowledge/vaults/${vaultId}/files/${encodeFilePath(relPath)}`);
	if (res.status === 404) return null;
	if (!res.ok) {
		throw new Error(`Failed to read existing note "${relPath}" (HTTP ${res.status}).`);
	}
	const data = (await res.json()) as FileContentResponse;
	return typeof data.content === 'string' ? data.content : null;
}

/** Create or overwrite a note in the vault. Parent directories are auto-created by the daemon. */
async function writeVaultFile(vaultId: string, relPath: string, content: string): Promise<void> {
	const base = DEFAULT_DAEMON_URL;
	const res = await fetch(`${base}/api/knowledge/vaults/${vaultId}/files/${encodeFilePath(relPath)}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ content }),
	});
	if (!res.ok) {
		const errText = await res.text().catch(() => '');
		throw new Error(`Failed to save clip to Molio (HTTP ${res.status}): ${errText}`);
	}
}

/**
 * Bring the Molio desktop app to the front and open the just-saved file,
 * mirroring the obsidian:// behavior where saving a clip also opens the note.
 *
 * Delegates to the background script, which injects a hidden iframe into the
 * active tab to trigger the molio:// OS protocol handler without navigating
 * the page away. Non-fatal: the clip is already saved by the time this runs,
 * so a failure here only means Molio doesn't auto-focus.
 */
async function triggerMolioOpen(vaultId: string, relPath: string): Promise<void> {
	const protocolUrl = `molio://open/vault/${encodeURIComponent(vaultId)}/file/${encodeURIComponent(relPath)}`;
	try {
		await browser.runtime.sendMessage({ action: 'openMolioProtocolUrl', url: protocolUrl });
	} catch (err) {
		console.warn('[molio] failed to trigger molio:// open (file is still saved):', err);
	}
}

/**
 * Save a clip to the user's currently-open Molio knowledge base.
 *
 * Replaces the upstream obsidian:// protocol flow. The `vault` parameter is
 * intentionally ignored: clips always target the Molio daemon's active vault
 * so the destination follows whatever the user has open in Molio.
 *
 * Behaviors map as follows:
 *  - create / overwrite      → write the file (replacing any existing content)
 *  - append / append-daily   → append to the existing file, or write if new
 *  - prepend / prepend-daily → prepend to the existing file, or write if new
 *  - daily variants          → target `daily/<YYYY-MM-DD>.md`
 *
 * After saving, triggers molio://open so the Molio desktop app opens the file
 * and selects it in the vault tree (same UX as obsidian://new).
 */
export async function saveToObsidian(
	fileContent: string,
	noteName: string,
	path: string,
	_vault: string,
	behavior: Template['behavior'],
): Promise<void> {
	const isDailyNote = behavior === 'append-daily' || behavior === 'prepend-daily';

	let relPath: string;
	if (isDailyNote) {
		relPath = `daily/${todayDateStamp()}.md`;
	} else {
		if (path && !path.endsWith('/')) {
			path += '/';
		}
		const formattedNoteName = sanitizeFileName(noteName);
		if (!formattedNoteName) {
			throw new Error('Note name is required.');
		}
		relPath = `${path}${formattedNoteName}.md`;
	}

	const vaultId = await resolveTargetVaultId();

	const isAppend = behavior.startsWith('append');
	const isPrepend = behavior.startsWith('prepend');

	if (isAppend || isPrepend) {
		const existing = await readVaultFile(vaultId, relPath);
		if (existing !== null) {
			const merged = isAppend
				? `${existing}\n\n${fileContent}`
				: `${fileContent}\n\n${existing}`;
			await writeVaultFile(vaultId, relPath, merged);
			await triggerMolioOpen(vaultId, relPath);
			return;
		}
		// File doesn't exist yet — append/prepend to nothing, just write the content.
	}

	await writeVaultFile(vaultId, relPath, fileContent);
	await triggerMolioOpen(vaultId, relPath);
}
