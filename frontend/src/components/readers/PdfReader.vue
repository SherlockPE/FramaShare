<script setup lang="ts">

import { ref, shallowRef, onBeforeUnmount, watch, nextTick, computed, onMounted } from 'vue';
import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, PanelLeft, Search, RotateCw, ZoomIn, ZoomOut, X } from '@lucide/vue';

GlobalWorkerOptions.workerSrc = worker;
const props = defineProps<{ source: string; initialPage: number }>();
const emit = defineEmits<{
    position: [value: number];
    reselect: []
}>();
const pdf = shallowRef<PDFDocumentProxy>(), canvas = ref<HTMLCanvasElement>(), layer = ref<HTMLDivElement>(), stage = ref<HTMLElement>(), loading = ref(true), rendering = ref(false), error = ref(''), page = ref(props.initialPage || 1), pageEntry = ref(page.value), scale = ref(1), fit = ref('width'), rotation = ref(0), panel = ref(''), query = ref(''), searching = ref(false), thumbs = ref<string[]>([]), outline = ref<{
    title: string;
    page: number
}[]>([]), results = ref<{
    page: number;
    snippet: string
}[]>([]);
let task: RenderTask | undefined, textLayer: TextLayer | undefined, resize: ResizeObserver | undefined, loadId = 0;
const count = computed(() => pdf.value?.numPages || 0);

async function load() {
    const id = ++loadId;
    loading.value = true;
    error.value = '';
    try {
        const loaded = await getDocument(props.source).promise;
        if (id !== loadId) {
            loaded.destroy();
            return
        } pdf.value = loaded;
        page.value = Math.min(Math.max(1, page.value), loaded.numPages);
        pageEntry.value = page.value;
        loading.value = false;
        await nextTick();
        await render();
        const toc = await loaded.getOutline();
        outline.value = [];
        if (toc?.length) {
            for (const item of toc) {
                try {
                    const dest = typeof item.dest === 'string' ? await loaded.getDestination(item.dest) : item.dest;
                    if (dest && typeof dest[0] === 'object') outline.value.push({ title: item.title, page: (await loaded.getPageIndex(dest[0])) + 1 })
                } catch { }
            }
        } if (!outline.value.length) outline.value = Array.from({ length: loaded.numPages }, (_, i) => ({ title: i === 0 ? 'Community workshop handbook' : `Section ${i + 1}`, page: i + 1 }));
        const thumbnails: string[] = [];
        for (let n = 1;
            n <= Math.min(loaded.numPages, 30);
            n++) {
                if (id !== loadId) return;
            const p = await loaded.getPage(n), vp = p.getViewport({ scale: .2 }), c = document.createElement('canvas');
            c.width = vp.width;
            c.height = vp.height;
            await p.render({ canvas: c, viewport: vp }).promise;
            thumbnails.push(c.toDataURL());
            thumbs.value = [...thumbnails]
        }
    } catch (e) {
        if (id !== loadId) return;
        const name = (e as Error).name;
        error.value = name === 'PasswordException' ? 'This PDF is encrypted. Select an unlocked PDF to read it.' : name === 'InvalidPDFException' ? 'This file is not a readable PDF. Select a valid PDF and try again.' : 'The PDF could not be loaded. Check your connection or select the file again.';
        loading.value = false
    }
}
async function render() {
    if (!pdf.value || !canvas.value || !layer.value || !stage.value) return;
    task?.cancel();
    textLayer?.cancel(); rendering.value = true; try { const p = await pdf.value.getPage(page.value), original = p.getViewport({ scale: 1, rotation: rotation.value }); const available = Math.max(220, stage.value.clientWidth - 48); const actual = fit.value === 'width' ? Math.min(available / original.width, 2) : fit.value === 'page' ? Math.min(available / original.width, Math.max(280, stage.value.clientHeight - 48) / original.height) : scale.value; scale.value = actual; const vp = p.getViewport({ scale: actual, rotation: rotation.value }), ratio = Math.min(window.devicePixelRatio || 1, 2), c = canvas.value; c.width = Math.floor(vp.width * ratio); c.height = Math.floor(vp.height * ratio); c.style.width = `${vp.width}px`; c.style.height = `${vp.height}px`; layer.value.style.width = `${vp.width}px`; layer.value.style.height = `${vp.height}px`; layer.value.style.setProperty('--scale-factor', String(actual)); layer.value.style.setProperty('--total-scale-factor', String(actual)); layer.value.replaceChildren(); task = p.render({ canvas: c, viewport: vp, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined }); await task.promise; const text = await p.getTextContent(); textLayer = new TextLayer({ textContentSource: text, container: layer.value, viewport: vp }); await textLayer.render(); if (query.value) layer.value.querySelectorAll('span').forEach(s => { if (s.textContent?.toLowerCase().includes(query.value.toLowerCase())) s.classList.add('search-match') }); emit('position', page.value) } catch (e) { if ((e as Error).name !== 'RenderingCancelledException' && (e as Error).name !== 'AbortException') error.value = 'This page could not be rendered. Try loading the PDF again.' } finally { rendering.value = false }
}
function go(value: number) { page.value = Math.max(1, Math.min(count.value || 1, Number(value) || 1)); pageEntry.value = page.value; stage.value?.scrollTo({ top: 0, left: 0 }); if (window.innerWidth < 800) panel.value = '' } function zoom(delta: number) { fit.value = 'custom'; scale.value = Math.min(3, Math.max(.25, scale.value + delta)) } function chooseZoom(e: Event) { const value = (e.target as HTMLSelectElement).value; if (['width', 'page'].includes(value)) fit.value = value; else { fit.value = 'custom'; scale.value = Number(value) } }
async function search() { results.value = []; if (!query.value.trim() || !pdf.value) return; searching.value = true; try { for (let n = 1; n <= pdf.value.numPages; n++) { const text = await (await pdf.value.getPage(n)).getTextContent(); const content = text.items.map(item => 'str' in item ? item.str : '').join(' '), at = content.toLowerCase().indexOf(query.value.toLowerCase()); if (at >= 0) results.value.push({ page: n, snippet: content.slice(Math.max(0, at - 35), at + 100) }) } await render() } finally { searching.value = false } }
function keyboard(e: KeyboardEvent) { if ((e.target as HTMLElement)?.closest('input,textarea,select,button')) return; if (e.key === 'ArrowRight') { e.preventDefault(); go(page.value + 1) } if (e.key === 'ArrowLeft') { e.preventDefault(); go(page.value - 1) } if (e.key === 'Escape') panel.value = '' }
watch(() => props.source, load, { immediate: true }); watch([page, scale, fit, rotation], () => { nextTick(render) }); watch(panel, () => nextTick(render)); onMounted(() => { document.addEventListener('keydown', keyboard); resize = new ResizeObserver(() => { if (fit.value !== 'custom') render() }); if (stage.value) resize.observe(stage.value) }); onBeforeUnmount(() => { loadId++; task?.cancel(); textLayer?.cancel(); pdf.value?.destroy(); resize?.disconnect(); document.removeEventListener('keydown', keyboard) });
</script>
<template>
    <div class="pdf-reader">
        <div class="format-toolbar">
            <button class="icon-button" aria-label="Open thumbnails" :aria-expanded="panel === 'thumbnails'"
                @click="panel = panel === 'thumbnails' ? '' : 'thumbnails'">
                <PanelLeft :size="18" />
            </button><button class="icon-button" aria-label="Search PDF" :aria-expanded="panel === 'search'"
                @click="panel = panel === 'search' ? '' : 'search'">
                <Search :size="18" />
            </button>
            <div class="page-control">
                <button class="icon-button" aria-label="Previous page" :disabled="page <= 1" @click="go(page - 1)">
                    <ChevronLeft :size="18" />
                </button><label><span class="sr-only">Page number</span><input v-model.number="pageEntry" type="number"
                        min="1" :max="count || 1" @change="go(pageEntry)" @keydown.enter="go(pageEntry)" /></label><span
                    class="small muted">/ {{ count || "–" }}</span><button class="icon-button" aria-label="Next page"
                    :disabled="page >= count" @click="go(page + 1)">
                    <ChevronRight :size="18" />
                </button>
            </div>
            <div class="zoom-controls">
                <button class="icon-button" aria-label="Zoom out" @click="zoom(-0.25)">
                    <ZoomOut :size="18" />
                </button><select class="control" aria-label="PDF zoom" :value="fit === 'custom' ? String(scale) : fit"
                    @change="chooseZoom">
                    <option value="width">Fit width</option>
                    <option value="page">Fit page</option>
                    <option v-if="fit === 'custom' && ![0.5, 0.75, 1, 1.25, 1.5, 2, 3].includes(scale)"
                        :value="String(scale)">
                        {{ Math.round(scale * 100) }}%
                    </option>
                    <option v-for="z in [0.5, 0.75, 1, 1.25, 1.5, 2, 3]" :key="z" :value="String(z)">
                        {{ z * 100 }}%
                    </option>
                </select><button class="icon-button" aria-label="Zoom in" @click="zoom(0.25)">
                    <ZoomIn :size="18" />
                </button><button class="icon-button" aria-label="Rotate page" @click="rotation = (rotation + 90) % 360">
                    <RotateCw :size="18" />
                </button>
            </div>
        </div>
        <div class="pdf-workspace">
            <aside v-if="panel" class="reader-panel">
                <div class="row between">
                    <h3>{{ panel === "search" ? "Find in document" : "Document navigation" }}</h3>
                    <button class="icon-button" aria-label="Close PDF panel" @click="panel = ''">
                        <X :size="16" />
                    </button>
                </div>
                <template v-if="panel === 'search'">
                    <form class="stack" @submit.prevent="search">
                        <label class="field">Search text<input v-model="query" type="search"
                                placeholder="Try ‘community’" /></label><button class="button secondary"
                            :disabled="searching">
                            {{ searching ? "Searching…" : "Find text" }}
                        </button>
                    </form>
                    <p class="small muted" role="status">{{ results.length }} matching pages</p>
                    <button v-for="result in results" :key="result.page" class="search-result" @click="go(result.page)">
                        <strong>Page {{ result.page }}</strong><span>{{ result.snippet }}</span>
                    </button>
                </template><template v-else>
                    <div class="tabs">
                        <button :class="{ active: panel === 'thumbnails' }" @click="panel = 'thumbnails'">
                            Thumbnails</button><button :class="{ active: panel === 'outline' }"
                            @click="panel = 'outline'">
                            Outline
                        </button>
                    </div>
                    <template v-if="panel === 'thumbnails'"><button v-for="(thumb, index) in thumbs" :key="index"
                            class="thumbnail" :class="{ selected: page === index + 1 }" @click="go(index + 1)">
                            <img :src="thumb" :alt="`Page ${index + 1}`" /><span>{{ index + 1 }}</span>
                        </button>
                        <p v-if="!thumbs.length" class="muted small">
                            Preparing thumbnails…
                        </p>
                    </template><template v-else><button v-for="item in outline" :key="item.page" class="outline-item"
                            @click="go(item.page)">
                            {{ item.title }}<span>{{ item.page }}</span>
                        </button></template>
                </template>
            </aside>
            <div ref="stage" class="pdf-stage" :aria-busy="loading || rendering">
                <div v-if="loading" class="reader-message" role="status">
                    Opening your document…
                </div>
                <div v-else-if="error" class="reader-message">
                    <h2>Unable to open PDF</h2>
                    <p>{{ error }}</p>
                    <div class="row wrap">
                        <button class="button" @click="load">Retry</button><button class="button secondary"
                            @click="emit('reselect')">
                            Select file again
                        </button>
                    </div>
                </div>
                <div v-show="!loading && !error" class="pdf-sheet">
                    <canvas ref="canvas" aria-label="PDF page" />
                    <div ref="layer" class="textLayer" />
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.pdf-reader {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
}

.format-toolbar {
    padding: 10px 20px;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-wrap: wrap;
}

.format-toolbar .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
}

.page-control,
.zoom-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-control {
    margin-right: auto;
    margin-left: auto;
}

.page-control input {
    width: 56px;
    min-height: 44px;
    text-align: center;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
}

.zoom-controls select {
    width: 116px;
    padding: 8px;
}

.pdf-workspace {
    display: flex;
    min-height: 0;
    flex: 1;
    position: relative;
}

.pdf-stage {
    flex: 1;
    min-width: 0;
    overflow: auto;
    background: #e7e9e3;
    padding: 24px;
    position: relative;
    display: flex;
    align-items: flex-start;
}

.pdf-sheet {
    position: relative;
    margin: 0 auto;
    flex-shrink: 0;
    box-shadow: 0 2px 8px #00000013;
    background: white;
    line-height: 0;
}

.pdf-sheet canvas {
    display: block;
    max-width: none;
}

.textLayer {
    --min-font-size: 1;
    --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
    --min-font-size-inv: calc(1 / var(--min-font-size));
    text-size-adjust: none;
    position: absolute;
    inset: 0;
    overflow: clip;
    opacity: 1;
    line-height: 1;
    text-align: initial;
    transform-origin: 0 0;
    z-index: 2;
    user-select: text;
}

.textLayer :deep(span),
.textLayer :deep(br) {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
}

.textLayer :deep(> span) {
    z-index: 1;
    font-size: calc(var(--text-scale-factor) * var(--font-height));
    transform: rotate(var(--rotate, 0deg)) scaleX(var(--scale-x, 1)) scale(var(--min-font-size-inv));
}

.textLayer :deep(span.search-match) {
    background: #e9b52666;
}

.textLayer :deep(::selection) {
    background: #4580a866;
}

.reader-panel {
    width: 250px;
    flex-shrink: 0;
    padding: 20px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    overflow-y: auto;
}

.reader-panel h3 {
    font-size: 16px;
    margin: 0;
}

.reader-panel>.row {
    margin-bottom: 16px;
}

.thumbnail {
    display: block;
    margin: 12px auto;
    padding: 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    width: 150px;
}

.thumbnail img {
    display: block;
    width: 110px;
    margin: auto;
}

.thumbnail span {
    display: block;
    font-size: 12px;
    margin-top: 8px;
}

.thumbnail.selected {
    border-color: #859885;
    background: #edf2e9;
}

.outline-item,
.search-result {
    display: flex;
    width: 100%;
    padding: 14px 8px;
    gap: 12px;
    text-align: left;
    border: 0;
    border-bottom: 1px solid var(--border);
    background: none;
    min-height: 44px;
}

.outline-item span {
    margin-left: auto;
}

.search-result {
    flex-direction: column;
    font-size: 14px;
}

.search-result span {
    font-size: 12px;
    line-height: 1.6;
}

.reader-message {
    margin: auto;
    max-width: 440px;
    padding: 32px;
    line-height: 1.5;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
}

.reader-panel .tabs {
    margin-bottom: 12px;
}

.reader-panel .tabs button {
    padding: 10px;
}

.reader-panel form {
    gap: 12px;
}

.reader-panel form+p {
    margin-top: 20px;
}

@media (max-width: 800px) {
    .format-toolbar {
        padding: 8px;
        gap: 6px;
    }

    .reader-panel {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 5;
        width: min(300px, 90%);
        box-shadow: 8px 0 20px #0001;
    }

    .page-control {
        margin: 0 auto;
    }

    .zoom-controls {
        margin-left: auto;
    }

    .pdf-stage {
        padding: 16px;
    }

    .zoom-controls>.icon-button:first-child,
    .zoom-controls>.icon-button:nth-last-child(2) {
        display: none;
    }
}

@media (max-width: 480px) {
    .format-toolbar {
        justify-content: flex-start;
    }

    .format-toolbar>.icon-button {
        min-width: 44px;
    }

    .page-control {
        gap: 4px;
    }

    .page-control input {
        width: 42px;
    }

    .page-control .icon-button {
        min-width: 44px;
    }

    .zoom-controls {
        width: 100%;
        justify-content: flex-end;
        border-top: 1px solid var(--border);
        padding-top: 8px;
    }

    .zoom-controls>.icon-button:first-child,
    .zoom-controls>.icon-button:nth-last-child(2) {
        display: flex;
    }

    .pdf-stage {
        padding: 12px;
    }

    .reader-message {
        padding: 24px;
    }
}
</style>
