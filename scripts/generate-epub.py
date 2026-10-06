from pathlib import Path
import html,json,subprocess,zipfile
root=Path(__file__).resolve().parent.parent
extract="const fs=require('fs'); const text=fs.readFileSync('src/components/readers/EpubReader.vue','utf8'); const literal=text.match(/const chapters=(\\[.*?\\]);const current/s)[1]; process.stdout.write(JSON.stringify(Function('return '+literal)()));"
chapters=json.loads(subprocess.check_output(['node','-e',extract],cwd=root,text=True))
with zipfile.ZipFile(root/'public/samples/gardens.epub','w') as z:
 z.writestr('mimetype','application/epub+zip',compress_type=zipfile.ZIP_STORED)
 z.writestr('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
 manifest=''.join(f'<item id="c{i}" href="chapter{i}.xhtml" media-type="application/xhtml+xml"/>' for i in range(len(chapters)))
 spine=''.join(f'<itemref idref="c{i}"/>' for i in range(len(chapters)))
 z.writestr('content.opf',f'<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book">framashare-gardens</dc:identifier><dc:title>A guide to shared gardens</dc:title><dc:language>en</dc:language><dc:creator>Framashare</dc:creator><meta property="dcterms:modified">2026-10-06T10:00:00Z</meta></metadata><manifest>{manifest}<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/></manifest><spine>{spine}</spine></package>')
 for i,c in enumerate(chapters):
  title=html.escape(c['title']);body=''.join('<p>'+html.escape(p)+'</p>' for p in c['paragraphs'])
  z.writestr(f'chapter{i}.xhtml',f'<html xmlns="http://www.w3.org/1999/xhtml"><head><title>{title}</title></head><body><h1>{title}</h1>{body}</body></html>')
 contents=''.join(f'<li><a href="chapter{i}.xhtml">{html.escape(c["title"])}</a></li>' for i,c in enumerate(chapters))
 z.writestr('nav.xhtml',f'<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title></head><body><nav epub:type="toc"><ol>{contents}</ol></nav></body></html>')
