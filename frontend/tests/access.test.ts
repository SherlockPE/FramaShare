import { beforeEach, describe, expect, it, vi } from 'vitest';
import { state, seedState, startSession, sessionDenial, activeSession, saveLink, claimDocument, getManaged, getDocument, deleteDocument, linkDenial, usage } from '../src/services/store';
vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{},removeItem:()=>{}});
beforeEach(()=>Object.assign(state,seedState()));
const HOUR=3600000,DAY=86400000;
describe('independent sharing links and explicit reading sessions',()=>{
  it('counts successful starts while wrong passwords leave the counter unchanged',()=>{
    const link=state.links.find(l=>l.token==='protected')!;
    expect(()=>startSession('protected','wrong')).toThrow('Incorrect password');
    expect(link.used).toBe(0); expect(state.sessions).toHaveLength(0);
    const session=startSession('protected','garden');
    expect(link.used).toBe(1);expect(session.expiresAt).toBe(state.now+HOUR);
    expect(startSession('protected','').id).toBe(session.id);
    expect(link.used).toBe(1); expect(sessionDenial('protected')).toBeNull();
  });
  it('permits the active session to finish when the session limit is reached',()=>{
    const link=state.links.find(l=>l.token==='protected')!;link.limit=1;
    startSession('protected','garden');
    expect(linkDenial(link)).toBe('Reading session limit reached');
    expect(sessionDenial('protected')).toBeNull();
    expect(startSession('protected','garden')).toBeDefined();expect(link.used).toBe(1);
    state.now+=HOUR;
    expect(activeSession('protected')).toBeUndefined();
    expect(sessionDenial('protected')).toBe('Reading session ended');
    expect(()=>startSession('protected','garden')).toThrow('Reading session limit reached');
  });
  it('starts a new session after 60 minutes if capacity remains',()=>{
    const first=startSession('workshop','');state.now+=HOUR;
    expect(sessionDenial('workshop')).toBe('Reading session ended');
    expect(startSession('workshop','').id).not.toBe(first.id);
    expect(state.links.find(l=>l.token==='workshop')!.used).toBe(2);
  });
  it('revocation interrupts active reading without changing another link',()=>{
    startSession('workshop','');startSession('protected','garden');
    state.links.find(l=>l.token==='workshop')!.revoked=true;
    expect(sessionDenial('workshop')).toBe('Link revoked');
    expect(()=>startSession('workshop','')).toThrow('Link revoked');
    expect(sessionDenial('protected')).toBeNull();
    expect(state.links.find(l=>l.token==='protected')!.revoked).toBe(false);
  });
  it('expiry interrupts active reading and preserves the publication',()=>{
    const link=state.links.find(l=>l.token==='workshop')!;link.expiresAt=state.now+100;
    startSession('workshop','');state.now+=100;
    expect(sessionDenial('workshop')).toBe('Link expired');
    expect(()=>startSession('workshop','')).toThrow('Link expired');
    expect(getDocument('doc1')!.status).toBe('ready');
  });
  it('editing one link leaves other rules independent and lowering limit preserves active sessions',()=>{
    const second=state.links.find(l=>l.token==='protected')!;const previous={...second};
    const first=state.links.find(l=>l.token==='workshop')!;startSession('workshop','');
    saveLink('doc1',{name:'Changed',password:'secret',limit:1,allowDownload:false},first.id);
    expect({...second}).toEqual(previous);expect(first.used).toBe(1);
    expect(sessionDenial('workshop')).toBeNull();
    expect(linkDenial(first)).toBe('Reading session limit reached');
  });
  it('does not consume a session before a publication is ready',()=>{
    for(const [id,status] of [['doc5','processing'],['doc6','failed']] as const){
      const link=saveLink(id,{name:'Not ready yet'});
      expect(()=>startSession(link.token,'')).toThrow();
      expect(link.used).toBe(0);expect(activeSession(link.token)).toBeUndefined();
      expect(linkDenial(link)?.toLowerCase()).toContain(status==='processing'?'processing':'failed');
    }
  });
  it('rejects zero, fractional and negative session limits and past expiry',()=>{
    for(const limit of [0,-1,1.5])expect(()=>saveLink('doc1',{name:'Bad',limit})).toThrow('positive whole number');
    expect(()=>saveLink('doc1',{name:'Bad',expiresAt:state.now})).toThrow('future');
    expect(()=>saveLink('doc1',{name:' '})).toThrow('name');
  });
});
describe('anonymous publication claim and removal',()=>{
  it('claims atomically, invalidates management and retention while keeping reader links',()=>{
    const recipient=state.links.find(l=>l.token==='anonymous')!;const original={...recipient};
    const result=claimDocument('private-garden','author');
    expect(result.ownerId).toBe('author');expect(result.manageToken).toBeNull();expect(result.deleteAt).toBeNull();
    expect(getManaged('private-garden')).toBeUndefined();expect({...recipient}).toEqual(original);
    expect(startSession('anonymous','')).toBeDefined();
    expect(()=>claimDocument('private-garden','author')).toThrow('Management link unavailable');
  });
  it('fails over quota without changing ownership, retention, token or links',()=>{
    const publication=getManaged('private-garden')!;const before={...publication};
    const links=state.links.map(l=>({...l}));const account=state.accounts.find(a=>a.id==='author')!;
    account.quota=usage('author')+publication.size-1;
    expect(()=>claimDocument('private-garden','author')).toThrow('Not enough storage');
    expect({...publication}).toEqual(before);expect(state.links.map(l=>({...l}))).toEqual(links);
    expect(getManaged('private-garden')?.id).toBe('anon1');
  });
  it('allows an exact quota boundary and excludes removed/deleted documents from usage',()=>{
    deleteDocument('doc1');deleteDocument('doc4',true);
    const publication=getManaged('private-garden')!;const account=state.accounts.find(a=>a.id==='author')!;
    account.quota=usage('author')+publication.size;
    claimDocument('private-garden','author');expect(usage('author')).toBe(account.quota);
  });
  it('prevents expired management access and recipient access',()=>{
    state.now+=7*DAY;
    expect(getManaged('private-garden')).toBeUndefined();
    expect(()=>claimDocument('private-garden','author')).toThrow('Management link unavailable');
    expect(()=>startSession('anonymous','')).toThrow('Publication deleted');
  });
  it('moderator removal resolves open reports and stops all publication links including active sessions',()=>{
    startSession('workshop','');startSession('protected','garden');deleteDocument('doc1',true);
    expect(getDocument('doc1')!.status).toBe('removed');
    expect(sessionDenial('workshop')).toBe('Publication removed by a moderator');
    expect(sessionDenial('protected')).toBe('Publication removed by a moderator');
    expect(state.reports.find(r=>r.id==='report1')).toMatchObject({status:'resolved',decision:'Publication removed'});
    expect(startSession('garden','')).toBeDefined();
  });
  it('ordinary deletion reports a separate denial and removes management access',()=>{
    startSession('anonymous','');deleteDocument('anon1');
    expect(getManaged('private-garden')).toBeUndefined();
    expect(sessionDenial('anonymous')).toBe('Publication deleted');
  });
});
