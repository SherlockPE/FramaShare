<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount, watch, nextTick, computed, onMounted } from 'vue';
import * as mupdf from "mupdf";
import { ChevronLeft, ChevronRight, PanelLeft, RotateCw, ZoomIn, ZoomOut, X, BookOpen, File } from '@lucide/vue';

const props = defineProps<{ source: string; initialPage: number; format: string }>();
const emit = defineEmits<{
    position: [value: number];
    reselect: []
}>();

const doc = shallowRef<mupdf.Document>(), canvas = ref<HTMLCanvasElement>(), stage = ref<HTMLElement>(), loading = ref(true), rendering = ref(false), error = ref(''), page = ref(props.initialPage || 1), pageEntry = ref(page.value), scale = ref(1), fit = ref('width'), rotation = ref(0), panel = ref(''), thumbs = ref<string[]>([]), outline = ref<{
    title: string;
    page: number
}[]>([]);
const viewMode = ref<'single' | 'double'>('single');
let resize: ResizeObserver | undefined, loadId = 0, lastRenderedPage = 0;
const count = computed(() => doc.value?.countPages() || 0);

async function load() {
    const id = ++loadId;
    loading.value = true;
    error.value = '';
    try {
        const response = await fetch(props.source);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const buffer = await response.arrayBuffer();

        if (id !== loadId) return;

        const magic = props.format === 'epub' ? 'epub' : 'pdf';
        const loaded = mupdf.Document.openDocument(new Uint8Array(buffer), magic);
        
        if (props.format === 'epub') {
            loaded.layout(800, 1000, 16);
        }
        
        doc.value = loaded;
        page.value = Math.min(Math.max(1, page.value), loaded.countPages());
        pageEntry.value = page.value;
        loading.value = false;
        
        await nextTick();
        await render();
        
        const toc = loaded.loadOutline();
        outline.value = [];
        
        const flatten = (items: any[], level = 0) => {
            for (const item of items) {
                outline.value.push({ title: "  ".repeat(level) + item.title, page: item.page + 1 });
                if (item.down) flatten(item.down, level + 1);
            }
        };
        if (toc) flatten(toc);
        if (!outline.value.length) outline.value = Array.from({ length: loaded.countPages() }, (_, i) => ({ title: i === 0 ? 'Start' : `Page ${i + 1}`, page: i + 1 }));
        
        const thumbnails = [];
        for (let n = 0; n < Math.min(loaded.countPages(), 30); n++) {
            if (id !== loadId) return;
            const p = loaded.loadPage(n);
            const pixmap = p.toPixmap(mupdf.Matrix.scale(0.2, 0.2), mupdf.ColorSpace.DeviceRGB, true, true);
            const c = document.createElement('canvas');
            const width = pixmap.getWidth();
            const height = pixmap.getHeight();
            c.width = width;
            c.height = height;
            const ctx = c.getContext('2d');
            if (ctx) {
                const imgData = new ImageData(pixmap.getPixels() as any, width, height);
                ctx.putImageData(imgData, 0, 0);
                thumbnails.push(c.toDataURL());
            }
            pixmap.destroy();
            p.destroy();
        }
        thumbs.value = thumbnails;
    } catch (e) {
        if (id !== loadId) return;
        error.value = 'The document could not be loaded. Check your connection or select the file again.';
        loading.value = false;
        console.error(e);
    }
}

async function render() {
    if (!doc.value || !canvas.value || !stage.value) return;
    rendering.value = true;
    try {
        const pagesToLoad = viewMode.value === 'double' && page.value < doc.value.countPages() 
            ? [page.value - 1, page.value] 
            : [page.value - 1];
            
        let validPages = [];
        for (const pIdx of pagesToLoad) {
            try { validPages.push(doc.value.loadPage(pIdx)); } catch (e) { console.error('loadPage failed', e); }
        }
        if (validPages.length === 0) throw new Error('Failed to load any pages');

        let boundsList = validPages.map(p => p.getBounds());
        
        const nativeWidth = boundsList.reduce((acc, b) => acc + (b[2] - b[0]), 0);
        const nativeHeight = Math.max(...boundsList.map(b => b[3] - b[1]));
        
        const available = Math.max(220, stage.value.clientWidth - 48);
        const actual = fit.value === 'width' ? Math.min(available / nativeWidth, 2) : fit.value === 'page' ? Math.min(available / nativeWidth, Math.max(280, stage.value.clientHeight - 48) / nativeHeight) : scale.value;
        scale.value = actual;
        
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const totalScale = actual * ratio;
        
        let matrix = mupdf.Matrix.scale(totalScale, totalScale);
        if (rotation.value) {
            matrix = mupdf.Matrix.concat(matrix, mupdf.Matrix.rotate(rotation.value));
        }
        
        const pixmaps = validPages.map(p => p.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, true, true));
        
        const updateDOM = () => {
            const c = canvas.value;
            if (!c) return;
            const totalWidth = pixmaps.reduce((acc, pm) => acc + pm.getWidth(), 0);
            const maxHeight = Math.max(...pixmaps.map(pm => pm.getHeight()));
            
            c.width = totalWidth;
            c.height = maxHeight;
            c.style.width = `${totalWidth / ratio}px`;
            c.style.height = `${maxHeight / ratio}px`;
            
            const ctx = c.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, c.width, c.height);
                let currentX = 0;
                for (const pixmap of pixmaps) {
                    const width = pixmap.getWidth();
                    const height = pixmap.getHeight();
                    const pixels = pixmap.getPixels();
                    const imgData = new ImageData(pixels as any, width, height);
                    
                    const tempC = document.createElement('canvas');
                    tempC.width = width;
                    tempC.height = height;
                    tempC.getContext('2d')?.putImageData(imgData, 0, 0);
                    
                    ctx.drawImage(tempC, currentX, 0);
                    currentX += width;
                }
            }
            
            // Clean up wasm resources after drawing
            for (const pixmap of pixmaps) pixmap.destroy();
            for (const p of validPages) p.destroy();
        };
        
        updateDOM();
        
        emit('position', page.value);
    } catch (e) {
        error.value = (e as Error).message;
        console.error(e);
    } finally {
        rendering.value = false;
    }
}

function go(value: number) { page.value = Math.max(1, Math.min(count.value || 1, Number(value) || 1)); pageEntry.value = page.value; stage.value?.scrollTo({ top: 0, left: 0 }); if (window.innerWidth < 800) panel.value = '' }
function zoom(delta: number) { fit.value = 'custom'; scale.value = Math.min(3, Math.max(.25, scale.value + delta)) }
function chooseZoom(e: Event) { const value = (e.target as HTMLSelectElement).value; if (['width', 'page'].includes(value)) fit.value = value; else { fit.value = 'custom'; scale.value = Number(value) } }

function keyboard(e: KeyboardEvent) { if ((e.target as HTMLElement)?.closest('input,textarea,select,button')) return; if (e.key === 'ArrowRight') { e.preventDefault(); go(page.value + (viewMode.value === 'double' ? 2 : 1)) } if (e.key === 'ArrowLeft') { e.preventDefault(); go(page.value - (viewMode.value === 'double' ? 2 : 1)) } if (e.key === 'Escape') panel.value = '' }

watch(() => props.source, load, { immediate: true });
watch([page, scale, fit, rotation, viewMode], () => { nextTick(render) });
watch(panel, () => nextTick(render));

onMounted(() => {
    document.addEventListener('keydown', keyboard);
    resize = new ResizeObserver(() => { if (fit.value !== 'custom') render() });
    if (stage.value) resize.observe(stage.value);
});

onBeforeUnmount(() => {
    loadId++;
    doc.value?.destroy();
    resize?.disconnect();
    document.removeEventListener('keydown', keyboard);
});
</script>
<template>
    <div class="mupdf-reader">
        <div class="format-toolbar">
            <button class="icon-button" aria-label="Open panel" :aria-expanded="panel === 'thumbnails'"
                @click="panel = panel === 'thumbnails' ? '' : 'thumbnails'">
                <PanelLeft :size="18" />
            </button>
            <div class="page-control">
                <button class="icon-button" aria-label="Previous page" :disabled="page <= 1" @click="go(page - (viewMode === 'double' ? 2 : 1))">
                    <ChevronLeft :size="18" />
                </button><label><span class="sr-only">Page number</span><input v-model.number="pageEntry" type="number"
                        min="1" :max="count || 1" @change="go(pageEntry)" @keydown.enter="go(pageEntry)" /></label><span
                    class="small muted">/ {{ count || "–" }}</span><button class="icon-button" aria-label="Next page"
                    :disabled="page >= count" @click="go(page + (viewMode === 'double' ? 2 : 1))">
                    <ChevronRight :size="18" />
                </button>
            </div>
            <div class="zoom-controls">
                <button class="icon-button" aria-label="Zoom out" @click="zoom(-0.25)">
                    <ZoomOut :size="18" />
                </button><select class="control" aria-label="Document zoom" :value="fit === 'custom' ? String(scale) : fit"
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
                </button><button class="icon-button" aria-label="Toggle two-page view" @click="viewMode = viewMode === 'single' ? 'double' : 'single'">
                    <BookOpen v-if="viewMode === 'single'" :size="18" />
                    <File v-else :size="18" />
                </button>
            </div>
        </div>
        <div class="document-workspace">
            <aside v-if="panel" class="reader-panel">
                <div class="row between">
                    <h3>Document navigation</h3>
                    <button class="icon-button" aria-label="Close panel" @click="panel = ''">
                        <X :size="16" />
                    </button>
                </div>
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
                        <span style="white-space: pre;">{{ item.title }}</span><span style="margin-left:auto">{{ item.page }}</span>
                    </button></template>
            </aside>
            <div ref="stage" class="document-stage" :aria-busy="loading || rendering">
                <button v-show="!loading && !error && page > 1" class="side-nav-button prev-button" aria-label="Previous page" @click="go(page - (viewMode === 'double' ? 2 : 1))">
                    <ChevronLeft :size="32" />
                </button>
                <button v-show="!loading && !error && page < count" class="side-nav-button next-button" aria-label="Next page" @click="go(page + (viewMode === 'double' ? 2 : 1))">
                    <ChevronRight :size="32" />
                </button>
                <div v-if="loading" class="reader-message" role="status">
                    Opening your document…
                </div>
                <div v-else-if="error" class="reader-message">
                    <h2>Unable to open document</h2>
                    <p>{{ error }}</p>
                    <div class="row wrap">
                        <button class="button" @click="load">Retry</button><button class="button secondary"
                            @click="emit('reselect')">
                            Select file again
                        </button>
                    </div>
                </div>
                <div v-show="!loading && !error" class="document-sheet">
                    <canvas ref="canvas" aria-label="Document page" />
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.mupdf-reader {
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

.document-workspace {
    display: flex;
    min-height: 0;
    flex: 1;
    position: relative;
}

.document-stage {
    flex: 1;
    min-width: 0;
    overflow: auto;
    background: #e7e9e3;
    padding: 24px;
    position: relative;
    display: flex;
    align-items: flex-start;
}

.document-sheet {
    position: relative;
    margin: 0 auto;
    flex-shrink: 0;
    box-shadow: 0 2px 8px #00000013;
    background: white;
    line-height: 0;
    view-transition-name: document-page;
}

.document-sheet canvas {
    display: block;
    max-width: none;
}

.side-nav-button {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: opacity 0.2s, background 0.2s;
    color: var(--text);
}

.side-nav-button:hover {
    background: #f0f0f0;
}

.prev-button {
    left: 24px;
}

.next-button {
    right: 24px;
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

.outline-item {
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

@media (max-width: 800px) {
    .side-nav-button {
        width: 44px;
        height: 44px;
    }
    .prev-button {
        left: 12px;
    }
    .next-button {
        right: 12px;
    }
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

    .document-stage {
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

    .document-stage {
        padding: 12px;
    }

    .reader-message {
        padding: 24px;
    }
}
</style>


