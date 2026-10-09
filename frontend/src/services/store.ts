import type { License } from './licenses';
import { reactive, watch } from 'vue';
export type Format = 'pdf' | 'epub' | 'album';
export interface ImageItem { id: string; src: string; caption: string; alt: string }
export interface Publication { id: string; title: string; description: string; license?: License; attribution?: string; format: Format; size: number; ownerId: string | null; manageToken: string | null; deleteAt: number | null; status: 'ready' | 'processing' | 'failed' | 'deleting' | 'deleted' | 'removed'; createdAt: number; updatedAt: number; source: string; images: ImageItem[]; seed: boolean; position: number }
export interface SharingLink { id: string; token: string; documentId: string; name: string; password: string; expiresAt: number | null; limit: number | null; used: number; allowDownload: boolean; revoked: boolean }
export interface ReadingSession { id: string; token: string; expiresAt: number }
export interface Account { id: string; name: string; email: string; quota: number; role: 'author' | 'admin' }
export interface Report { id: string; documentId: string; reason: string; description: string; createdAt: number; status: 'open' | 'resolved'; decision?: string }
export interface State { documents: Publication[]; links: SharingLink[]; sessions: ReadingSession[]; accounts: Account[]; reports: Report[]; currentUserId: string | null; now: number; settings: { fileMB: number; albumMB: number; albumCount: number; quotaMB: number; retention: number[]; defaultRetention: number }; preferences: { fontSize: number; lineHeight: number; width: string; theme: string }; nextFailure: boolean }
const DAY = 86400000; export const STORAGE_KEY = 'framashare-prototype-v1';
export function seedState(): State { const now = Date.UTC(2026, 9, 6, 10); const doc = (id: string, title: string, format: Format, status: Publication['status'] = 'ready', ownerId: string | null = 'author'): Publication => ({ id, title, description: 'Open notes for people making good things together. A small collection to read, keep and share.', format, status, ownerId, manageToken: ownerId ? null : 'private-garden', deleteAt: ownerId ? null : now + 7 * DAY, size: format === 'album' ? 8500000 : format === 'pdf' ? 2400000 : 680000, createdAt: now - Number(id.replace(/\D/g, '')) * DAY, updatedAt: now, source: format === 'pdf' ? '/samples/workshop.pdf' : format === 'epub' ? '/samples/gardens.epub' : '', images: format === 'album' ? [1, 2, 3, 4].map(n => ({ id: 'image-' + n, src: '/samples/garden-' + n + '.svg', caption: ['A place to begin', 'Seeds for everyone', 'The reading corner', 'An afternoon together'][n - 1], alt: ['A community garden with raised beds', 'Seed packets on a wooden table', 'A bench under a leafy tree', 'A shared garden at sunset'][n - 1] })) : [], seed: true, position: 1 }); const documents = [doc('doc1', 'Community workshop handbook', 'pdf'), doc('doc2', 'A guide to shared gardens', 'epub'), doc('doc3', 'Field notes from the reading room', 'album'), doc('doc4', 'Making space for everyone: a practical collection of ideas for our next neighbourhood gathering', 'pdf'), doc('doc5', 'The neighbourhood archive', 'pdf', 'processing'), doc('doc6', 'Spring planting notes', 'epub', 'failed'), doc('anon1', 'A garden, shared', 'album', 'ready', null)]; const link = (token: string, documentId: string, extra: Partial<SharingLink> = {}): SharingLink => ({ id: token, token, documentId, name: 'Workshop readers', password: '', expiresAt: null, limit: null, used: 0, allowDownload: true, revoked: false, ...extra }); return { documents, links: [link('workshop', 'doc1'), link('protected', 'doc1', { name: 'Private reading group', password: 'garden', limit: 3, allowDownload: false }), link('garden', 'doc2'), link('album', 'doc3'), link('anonymous', 'anon1'), link('expired', 'doc1', { name: 'Last season’s workshop', expiresAt: now - DAY }), link('revoked', 'doc1', { name: 'Closed invitation', revoked: true }), link('exhausted', 'doc1', { name: 'One-session preview', limit: 1, used: 1 })], sessions: [], accounts: [{ id: 'author', name: 'Alex Morgan', email: 'alex@example.com', quota: 1000 * 1000000, role: 'author' }, { id: 'admin', name: 'Robin Ellis', email: 'admin@example.com', quota: 1000 * 1000000, role: 'admin' }], reports: [{ id: 'report1', documentId: 'doc1', reason: 'Copyright concern', description: 'Please review whether the workshop notes can be shared.', createdAt: now, status: 'open' }, { id: 'report2', documentId: 'doc3', reason: 'Other', description: 'A caption needed checking.', createdAt: now - DAY, status: 'resolved', decision: 'Dismissed' }], currentUserId: null, now, settings: { fileMB: 100, albumMB: 100, albumCount: 50, quotaMB: 1000, retention: [1, 7, 30], defaultRetention: 7 }, preferences: { fontSize: 18, lineHeight: 1.8, width: 'medium', theme: 'light' }, nextFailure: false }; }
const testDemo = import.meta.env.MODE === 'test';
function restore(): State {
  const initial = seedState();
  if (testDemo) return initial;
  initial.documents = []; initial.links = []; initial.sessions = [];
  initial.accounts = []; initial.reports = []; initial.now = Date.now();
  try { initial.preferences = JSON.parse(localStorage.getItem('framashare-preferences') || 'null') || initial.preferences; } catch { /* Ignore invalid preferences. */ }
  return initial;
}
export const state = reactive<State>(restore());
export const ui = reactive({ toast: '', storageError: false, sessionError: '', accessError: '' });
function persist() { try { localStorage.setItem('framashare-preferences', JSON.stringify(state.preferences)) } catch { ui.storageError = true } }
watch(() => state.preferences, persist, { deep: true });
export function advanceClock(milliseconds: number) { if (testDemo) state.now += milliseconds }
export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const managed = /^\/files\/([^/?]+)/.exec(path);
  const managementToken = managed ? getDocument(managed[1]!)?.manageToken : null;
  if (managementToken) options.headers = { ...options.headers, 'X-Manage-Token': managementToken };
  const response = await fetch('/api' + path, { ...options, credentials: 'same-origin', headers: options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json', ...options.headers } : options.headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw Error(body?.error || `Request failed (${response.status}). Please try again.`);
  }
  return response.status === 204 ? undefined as T : response.json();
}
function setAccount(user: Account | null) {
  state.accounts = user ? [user] : []; state.currentUserId = user?.id ?? null;
  state.documents = []; state.links = []; state.sessions = []; state.reports = [];
}
export async function refreshLibrary() {
  const result = await api<{ documents: Publication[] }>('/files');
  state.documents = result.documents;
  state.links = (await api<{ links: SharingLink[] }>('/links')).links;
}
let initialized = false;
export async function initializeSession() {
  if (initialized) return;
  try {
    const { user } = await api<{ user: Account | null }>('/auth/me');
    setAccount(user);
    state.settings = await api<State['settings']>('/settings');
    if (user) await refreshLibrary();
    initialized = true; ui.sessionError = '';
  } catch (error) { ui.sessionError = (error as Error).message; throw error }
}
export async function signOut() {
  await api('/auth/logout', { method: 'POST' });
  setAccount(null);
}
export async function updateProfile(name: string, email: string) {
  const { user } = await api<{ user: Account }>('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name, email }) });
  state.accounts = [user];
}
export async function changePassword(oldPassword: string, newPassword: string) {
  await api('/auth/password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) });
  setAccount(null);
}
export async function updateDocument(id: string, title: string, description: string, images?: ImageItem[]) {
  const document = await api<Publication>('/files/' + id, { method: 'PATCH', body: JSON.stringify({ title, description, ...(images ? { images: images.map(({ id, caption, alt }) => ({ id, caption, alt })) } : {}) }) });
  const index = state.documents.findIndex(d => d.id === id);
  if (index >= 0) {
    const managementToken = state.documents[index]?.manageToken;
    if (managementToken) {
      document.manageToken = managementToken;
      document.source += '?manage=' + managementToken;
      document.images = document.images.map(a => ({ ...a, src: a.src + '&manage=' + managementToken }));
    }
    state.documents[index] = document;
  }
}
export function notify(message: string) { ui.toast = message; setTimeout(() => { if (ui.toast === message) ui.toast = '' }, 4000) }
export const currentUser = () => state.accounts.find(a => a.id === state.currentUserId);
export const uid = (prefix = 'id') => prefix + '-' + crypto.randomUUID().slice(0, 8);
export function formatDate(time: number | null) { return time ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Warsaw' }).format(time) : 'No expiry' }
export function formatSize(bytes: number) { return bytes >= 1000000 ? (bytes / 1000000).toFixed(1) + ' MB' : Math.round(bytes / 1000) + ' KB' }
export function usage(id: string) { return state.documents.filter(d => d.ownerId === id && !['deleted', 'removed'].includes(d.status)).reduce((n, d) => n + d.size, 0) }
export const files = reactive(new Map<string, { files: File[]; urls: string[] }>());
export function registerFiles(id: string, selected: File[]) { releaseFiles(id); files.set(id, { files: selected, urls: selected.map(f => URL.createObjectURL(f)) }) }
export function releaseFiles(id: string) { files.get(id)?.urls.forEach(url => URL.revokeObjectURL(url)); files.delete(id) }
export function resetDemo() { if (!testDemo) return; files.forEach((_, id) => releaseFiles(id)); Object.assign(state, seedState()); persist(); notify('Demo data reset') }
export function getDocument(id: string) { return state.documents.find(d => d.id === id) }
export function getManaged(token: string) { return state.documents.find(d => d.manageToken === token && !['deleted', 'removed'].includes(d.status) && (!d.deleteAt || d.deleteAt > state.now)) }
export function linkDenial(link: SharingLink | undefined, active = false): string | null { if (!link) return 'Link unavailable'; const d = getDocument(link.documentId); if (!d || d.status === 'deleted') return 'Publication deleted'; if (d.status === 'removed') return 'Publication removed by a moderator'; if (d.deleteAt && d.deleteAt <= state.now) return 'Publication deleted'; if (d.status === 'processing') return 'Publication processing'; if (d.status === 'failed') return 'Publication processing failed'; if (link.revoked) return 'Link revoked'; if (link.expiresAt && link.expiresAt <= state.now) return 'Link expired'; if (!active && link.limit !== null && link.used >= link.limit) return 'Reading session limit reached'; return null }
export function activeSession(token: string) { return state.sessions.find(s => s.token === token && s.expiresAt > state.now) }
export function sessionDenial(token: string) { const link = state.links.find(l => l.token === token); return linkDenial(link, true) || (!activeSession(token) ? 'Reading session ended' : null) }
export function startSession(token: string, password: string): ReadingSession | Promise<ReadingSession> { if (!testDemo) return api<ReadingSession>('/share/' + token + '/session', { method: 'POST', body: JSON.stringify({ password }) }).then(session => { state.sessions = state.sessions.filter(s => s.token !== token); state.sessions.push(session); return session; }); const link = state.links.find(l => l.token === token); const denial = linkDenial(link, !!activeSession(token)); if (denial) throw Error(denial); if (!link) throw Error('Link unavailable'); const existing = activeSession(token); if (existing) return existing; if (link.password && link.password !== password) throw Error('Incorrect password. Try again.'); const session = { id: uid('session'), token, expiresAt: state.now + 3600000 }; link.used++; state.sessions.push(session); return session }
export function claimDocument(token: string, accountId: string): Publication | Promise<Publication> { if (!testDemo) return api<Publication>('/manage/' + token + '/claim', { method: 'POST' }).then(d => { state.documents = state.documents.filter(p => p.id !== d.id); state.documents.unshift(d); return d; }); const d = getManaged(token), a = state.accounts.find(a => a.id === accountId); if (!d || !a) throw Error('Management link unavailable'); if (usage(accountId) + d.size > a.quota) throw Error('Not enough storage. Free up space before adding this publication.'); d.ownerId = accountId; d.manageToken = null; d.deleteAt = null; d.updatedAt = state.now; return d }
function deleteDemoDocument(id: string, moderated = false) { const d = getDocument(id); if (d) { d.status = moderated ? 'removed' : 'deleted'; d.manageToken = null; releaseFiles(id); state.reports.filter(r => r.documentId === id && r.status === 'open').forEach(r => { r.status = 'resolved'; r.decision = moderated ? 'Publication removed' : 'Publication deleted' }) } }
export async function delay() { await new Promise(r => setTimeout(r, 350)); if (state.nextFailure) { state.nextFailure = false; throw Error('Connection interrupted. Please try again.') } }
export function deleteDocument(id: string, moderated = false): void | Promise<void> {
  if (testDemo) return deleteDemoDocument(id, moderated);
  return api('/files/' + id, { method: 'DELETE' }).then(() => {
    state.documents = state.documents.filter(d => d.id !== id); releaseFiles(id);
  });
}
export async function upload(input: { title: string; description: string; format: Format; selected: File[]; retention: number; sample?: boolean; license?: License; attribution?: string }) {

  let selected = input.selected;
  if (input.sample) {
    const response = await fetch('/samples/workshop.pdf');
    if (!response.ok) throw Error('Sample file unavailable.');
    selected = [new File([await response.blob()], 'workshop.pdf', { type: 'application/pdf' })];
  }
  if (!selected.length || (input.format !== 'album' && selected.length !== 1)) throw Error('Choose publication files.');
  const form = new FormData();
  form.append('title', input.title); form.append('description', input.description);
  form.append('license', input.license ?? 'unspecified');
  form.append('attribution', input.attribution ?? '');
  form.append('retention', String(input.retention));
  for (const file of selected) form.append('file', file);
  const publication = await api<Publication>('/files/upload', { method: 'POST', body: form });
  state.documents.unshift(publication);
  return publication;
}
export function saveLink(documentId: string, input: Partial<SharingLink>, id?: string): SharingLink | Promise<SharingLink> { if (!testDemo) return api<SharingLink>('/files/' + documentId + '/links' + (id ? '/' + id : ''), { method: id ? 'PATCH' : 'POST', body: JSON.stringify({ name: input.name, password: input.password, expiresAt: input.expiresAt, limit: input.limit, allowDownload: input.allowDownload, revoked: input.revoked }) }).then(link => { state.links = state.links.filter(l => l.id !== link.id); state.links.push(link); return link; }); if (!input.name?.trim()) throw Error('Give this link a name.'); if (input.limit != null && (!Number.isInteger(input.limit) || input.limit < 1)) throw Error('Session limit must be a positive whole number.'); if (input.expiresAt != null && (!Number.isFinite(input.expiresAt) || input.expiresAt <= state.now)) throw Error('Choose a date in the future.'); const old = state.links.find(l => l.id === id); if (old) { Object.assign(old, input); return old } const link: SharingLink = { id: uid('link'), token: uid('read'), documentId, name: input.name, password: '', expiresAt: null, limit: null, used: 0, allowDownload: true, revoked: false, ...input }; state.links.push(link); return link }
export function addReport(documentId: string, reason: string, description: string) { if (!testDemo) return api('/reports', { method: 'POST', body: JSON.stringify({ documentId, reason, description }) }).then(() => { notify('Report submitted'); }); if (!reason || !description.trim()) throw Error('Choose a reason and describe the concern.'); state.reports.unshift({ id: uid('report'), documentId, reason, description, createdAt: state.now, status: 'open' }); notify('Report submitted') }
export async function copyLink(path: string) { const url = new URL(path, location.origin).href; try { await navigator.clipboard.writeText(url); notify('Link copied') } catch { const field = Array.from(document.querySelectorAll<HTMLElement>('.url')).find(node => node.textContent?.trim() === url); if (field) { field.focus(); const range = document.createRange(); range.selectNodeContents(field); const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range) } notify('Copy unavailable. Select the link and copy it manually.') } return url }
export async function signIn(email: string, password: string, name?: string) {
  const { user } = await api<{ user: Account }>(name === undefined ? '/auth/login' : '/auth/register', { method: 'POST', body: JSON.stringify({ email, password, ...(name === undefined ? {} : { name }) }) });
  setAccount(user);
  await refreshLibrary();
  return user;
}
export function imageSource(d: Publication, index: number) { const item = d.images[index]; return item?.src.startsWith('/api/') || d.seed ? item?.src : files.get(d.id)?.urls[Number(item?.src)] }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => files.forEach((_, id) => releaseFiles(id)));
  setInterval(() => { state.now = Date.now() }, 1000);
}

export async function removeAccount() {
  await api('/auth/account', { method: 'DELETE' });
  setAccount(null);
}

export async function loadPublicationRoute(path: string, id: string, managementToken?: string) {
  ui.accessError = '';
  if (path.startsWith('/share/')) {
    state.links = state.links.filter(l => l.token !== id);
    state.sessions = state.sessions.filter(s => s.token !== id);
    const data = await api<{ document: Publication; link: SharingLink; session: ReadingSession | null }>('/share/' + id, managementToken ? { headers: { 'X-Manage-Token': managementToken } } : {});
    state.documents = state.documents.filter(d => d.id !== data.document.id); state.documents.push(data.document);
    state.links = state.links.filter(l => l.id !== data.link.id); state.links.push(data.link);
    state.sessions = state.sessions.filter(s => s.token !== id); if (data.session) state.sessions.push(data.session);
  } else if (path.startsWith('/manage/')) {
    const d = await api<Publication>('/manage/' + id);
    state.documents = state.documents.filter(p => p.id !== d.id); state.documents.push(d);
    const result = await api<{ links: SharingLink[] }>('/files/' + d.id + '/links');
    state.links = state.links.filter(l => l.documentId !== d.id).concat(result.links);
  }
}

export async function loadAdmin() {
  const data = await api<Pick<State, 'accounts' | 'documents' | 'reports' | 'settings'>>('/admin/state');
  Object.assign(state, data);
}
