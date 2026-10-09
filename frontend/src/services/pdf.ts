import { GlobalWorkerOptions, PDFWorker } from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = worker;
let sharedWorker: PDFWorker | undefined;
// Library covers share one worker instead of starting a worker per publication.
export function pdfWorker() { return sharedWorker ??= PDFWorker.create({}); }
