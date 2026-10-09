import { beforeEach, afterEach, expect, it, vi } from 'vitest';
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('MODE', 'development');
  vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'framashare-prototype-v1' ? JSON.stringify({ currentUserId: 'admin', accounts: [{ id: 'admin', role: 'admin' }] }) : null, setItem: vi.fn() });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const user = { id: 'server-user', name: 'Author', email: 'author@example.com', quota: 1000000000, role: 'author' as const };

it('ignores local account state and retries failed session loading', async () => {
  const fetch = vi.fn().mockRejectedValueOnce(Error('Offline')).mockResolvedValueOnce(response({ user })).mockResolvedValueOnce(response({ documents: [] }));
  vi.stubGlobal('fetch', fetch);
  const store = await import('../src/services/store');
  expect(store.currentUser()).toBeUndefined();
  expect(store.state.documents).toHaveLength(0);
  await expect(store.initializeSession()).rejects.toThrow('Offline');
  expect(store.currentUser()).toBeUndefined();
  await store.initializeSession();
  expect(store.currentUser()?.id).toBe('server-user');
  expect(store.ui.sessionError).toBe('');
});
it('sign-in sends the password and restores server IDs and metadata', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(response({ user })).mockResolvedValueOnce(response({ documents: [{ id: 'server-document', title: 'Stored title', description: 'Stored description', ownerId: user.id }] }));
  vi.stubGlobal('fetch', fetch);
  const store = await import('../src/services/store');
  await store.signIn(user.email, 'secret-password');
  expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({ email: user.email, password: 'secret-password' });
  expect(store.getDocument('server-document')?.description).toBe('Stored description');
});
it('failed logout retains the account; an empty POST has no JSON content type', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(response({ error: 'Offline' }, 503)).mockResolvedValueOnce(response({ success: true }));
  vi.stubGlobal('fetch', fetch);
  const store = await import('../src/services/store');
  store.state.accounts = [user]; store.state.currentUserId = user.id;
  await expect(store.signOut()).rejects.toThrow('Offline');
  expect(store.currentUser()?.id).toBe(user.id);
  await store.signOut();
  expect(fetch.mock.calls[1]![1].headers).toBeUndefined();
  expect(store.currentUser()).toBeUndefined();
});
it('failed deletion leaves the publication available for a retry', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(response({ error: 'Disk failure' }, 500)).mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetch);
  const store = await import('../src/services/store');
  const publication = store.seedState().documents[0]!;
  store.state.documents = [publication];
  await expect(store.deleteDocument(publication.id)).rejects.toThrow('Disk failure');
  expect(store.getDocument(publication.id)).toBeDefined();
  await store.deleteDocument(publication.id);
  expect(store.getDocument(publication.id)).toBeUndefined();
});

it('uploads license and credit as multipart fields and restores them from the server', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(response({ id: 'licensed-document', license: 'CC-BY-4.0', attribution: 'Author' }))
    .mockResolvedValueOnce(response({ documents: [{ id: 'licensed-document', license: 'CC-BY-4.0', attribution: 'Author' }] }));
  vi.stubGlobal('fetch', fetch);
  const store = await import('../src/services/store');
  store.state.accounts = [user]; store.state.currentUserId = user.id;
  await store.upload({ title: 'Licensed PDF', description: '', format: 'pdf', selected: [new File(['%PDF-'], 'test.pdf')], retention: 7, license: 'CC-BY-4.0', attribution: 'Author' });
  const form = fetch.mock.calls[0]![1].body as FormData;
  expect(form.get('license')).toBe('CC-BY-4.0');
  expect(form.get('attribution')).toBe('Author');
  await store.refreshLibrary();
  expect(store.getDocument('licensed-document')).toMatchObject({ license: 'CC-BY-4.0', attribution: 'Author' });
});
