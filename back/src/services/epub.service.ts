import sharp from 'sharp';
import yauzl from 'yauzl';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import sanitize from 'sanitize-html';
import path from 'node:path';
const invalid = () => Object.assign(Error('Choose a valid reflowable EPUB without DRM (maximum 50 MB expanded and 1000 entries).'), { statusCode: 400 });
const list = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
export async function parseEpub(filename: string) {
  const entries = await new Promise<Map<string, Buffer>>((resolve, reject) => {
    yauzl.open(filename, { lazyEntries: true, strictFileNames: true, validateEntrySizes: true }, (error, zip) => {
      if (error || !zip) return reject(invalid());
      const files = new Map<string, Buffer>(); let count = 0, expanded = 0;
      const stop = () => { zip.close(); reject(invalid()); };
      zip.on('error', stop); zip.on('end', () => resolve(files));
      zip.on('entry', entry => {
        if (++count > 1000 || (expanded += entry.uncompressedSize) > 50000000 || entry.uncompressedSize > 10000000 || (entry.generalPurposeBitFlag & 1) || entry.fileName.includes('\0') || entry.fileName.split('/').includes('..') || files.has(entry.fileName)) return stop();
        if (entry.fileName.endsWith('/')) return zip.readEntry();
        zip.openReadStream(entry, (error, stream) => {
          if (error || !stream) return stop();
          const chunks: Buffer[] = []; let size = 0;
          stream.on('data', chunk => { size += chunk.length; if (size > entry.uncompressedSize || size > 10000000) { stream.destroy(); stop(); } else chunks.push(chunk); });
          stream.on('error', stop);
          stream.on('end', () => { files.set(entry.fileName, Buffer.concat(chunks)); zip.readEntry(); });
        });
      });
      zip.readEntry();
    });
  });
  if (entries.get('mimetype')?.toString() !== 'application/epub+zip' || entries.has('META-INF/encryption.xml')) throw invalid();
  const xml = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, processEntities: false });
  const parse = (name: string) => {
    const text = entries.get(name)?.toString('utf8');
    if (!text || /<!DOCTYPE|<!ENTITY/i.test(text) || XMLValidator.validate(text) !== true) throw invalid();
    return xml.parse(text);
  };
  const container = parse('META-INF/container.xml');
  const packagePath = list<any>(container.container?.rootfiles?.rootfile)[0]?.['@_full-path'];
  if (typeof packagePath !== 'string' || packagePath.startsWith('/') || packagePath.split('/').includes('..')) throw invalid();
  const opf = parse(packagePath).package;
  if (!opf || list<any>(opf.metadata?.meta).some(m => m['@_property'] === 'rendition:layout' && m['#text'] === 'pre-paginated')) throw invalid();
  if (list<any>(opf.metadata?.meta).some(m => m['@_name'] === 'fixed-layout' && m['@_content'] === 'true')) throw invalid();
  const items = new Map(list<any>(opf.manifest?.item).map(i => [i['@_id'], i]));
  const toc = new Map<string, string>();
  const collect = (node: any, directory: string) => {
    if (!node || typeof node !== 'object') return;
    for (const a of list<any>(node.a)) if (typeof a['@_href'] === 'string' && typeof a['#text'] === 'string') toc.set(path.posix.normalize(path.posix.join(directory, a['@_href'].split('#')[0]!)), a['#text']);
    if (node.content?.['@_src'] && node.navLabel?.text) toc.set(path.posix.normalize(path.posix.join(directory, node.content['@_src'].split('#')[0])), String(node.navLabel.text));
    for (const value of Object.values(node)) if (Array.isArray(value)) for (const child of value) collect(child, directory); else if (typeof value === 'object') collect(value, directory);
  };
  for (const item of items.values()) if (item['@_properties']?.split(' ').includes('nav') || item['@_media-type'] === 'application/x-dtbncx+xml') {
    const entry = path.posix.normalize(path.posix.join(path.posix.dirname(packagePath), item['@_href']));
    collect(parse(entry), path.posix.dirname(entry));
  }
  const imageData = new Map<string, string>();
  for (const item of items.values()) if (['image/png', 'image/jpeg', 'image/webp'].includes(item['@_media-type'])) {
    const entry = path.posix.normalize(path.posix.join(path.posix.dirname(packagePath), item['@_href']));
    const buffer = entries.get(entry); if (!buffer) throw invalid();
    const image = sharp(buffer, { limitInputPixels: 20000000 });
    const metadata = await image.metadata();
    if (!['png', 'jpeg', 'webp'].includes(metadata.format || '')) throw invalid();
    await image.stats();
    imageData.set(entry, `data:${item['@_media-type']};base64,${buffer.toString('base64')}`);
  }
  let outputSize = 0;
  const chapters = list<any>(opf.spine?.itemref).map((ref, index) => {
    const item = items.get(ref['@_idref']);
    if (item?.['@_properties']?.includes('pre-paginated')) throw invalid();
    if (!item || item['@_media-type'] !== 'application/xhtml+xml' || typeof item['@_href'] !== 'string' || /[:\\]/.test(item['@_href'])) throw invalid();
    const entry = path.posix.normalize(path.posix.join(path.posix.dirname(packagePath), decodeURIComponent(item['@_href'])));
    if (entry.startsWith('../') || entry.startsWith('/')) throw invalid();
    const source = entries.get(entry)?.toString('utf8');
    if (!source) throw invalid();
    const html = sanitize(source, { allowedTags: ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u', 's', 'blockquote', 'pre', 'code', 'ul', 'ol', 'li', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub', 'section', 'a', 'img'], allowedAttributes: { img: ['src', 'alt'], a: ['href'], '*': ['id', 'lang'] }, allowedSchemes: [], allowedSchemesByTag: { img: ['data'] }, allowProtocolRelative: false, transformTags: { img: (tagName, attrs) => { const local = typeof attrs.src === 'string' && !/[:\\]/.test(attrs.src) ? path.posix.normalize(path.posix.join(path.posix.dirname(entry), attrs.src.split('#')[0]!)) : ''; const src = imageData.get(local); return { tagName, attribs: src ? { src, alt: attrs.alt || '' } : {} }; }, a: (tagName, attrs) => ({ tagName, attribs: attrs.href?.startsWith('#') ? { href: attrs.href } : {} }) } });
    outputSize += Buffer.byteLength(html); if (outputSize > 50000000) throw invalid();
    const heading = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/.exec(html)?.[1];
    return { title: toc.get(entry) || (heading ? sanitize(heading, { allowedTags: [], allowedAttributes: {} }) : `Chapter ${index + 1}`), html };
  });
  if (!chapters.length || chapters.length > 500) throw invalid();
  return chapters;
}
