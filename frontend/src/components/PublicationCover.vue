<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { getDocument, type PDFDocumentLoadingTask, type RenderTask } from "pdfjs-dist";
import { pdfWorker } from "../services/pdf";
import type { Publication } from "../services/store";
import { imageSource } from "../services/store";

const props = defineProps<{ document: Publication }>();
const canvas = ref<HTMLCanvasElement>();
const rendered = ref(false);
let observer: IntersectionObserver | undefined, loading: PDFDocumentLoadingTask | undefined, render: RenderTask | undefined, version = 0;
function stop() { version++; render?.cancel(); void loading?.destroy(); loading = undefined; rendered.value = false; }
async function renderCover() {
  stop();
  const id = version;
  if (props.document.format !== 'pdf' || !props.document.source || !canvas.value) return;
  const task = getDocument({ url: props.document.source, worker: pdfWorker(), disableAutoFetch: true, disableStream: true });
  loading = task;
  try {
    const doc = await task.promise;
    const page = await doc.getPage(1);
    if (id !== version || !canvas.value) return;
    const bounds = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(400 / bounds.width, 600 / bounds.height) });
    canvas.value.width = Math.ceil(viewport.width); canvas.value.height = Math.ceil(viewport.height);
    render = page.render({ canvas: canvas.value, viewport });
    await render.promise;
    if (id === version) rendered.value = true;
  } catch { /* Keep the title cover when the file is unavailable or invalid. */ }
  finally { await task.destroy(); if (loading === task) loading = undefined; }
}
function observe() {
  stop(); observer?.disconnect();
  if (!canvas.value) return;
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer?.disconnect(); void renderCover(); }
  });
  observer.observe(canvas.value);
}
onMounted(observe);
watch(() => props.document.source, observe, { flush: 'post' });
onBeforeUnmount(() => { observer?.disconnect(); stop(); });
</script>

<template>
  <div :class="['cover', document.format]">
    <img
      v-if="document.format === 'album' && imageSource(document, 0)"
      :src="imageSource(document, 0)"
      :alt="document.images[0]?.alt"
    />
    <div v-else-if="document.format === 'pdf'" class="pdf-cover">
      <canvas ref="canvas" class="pdf-canvas" :style="{ opacity: rendered ? 1 : 0 }" aria-hidden="true"></canvas>
      <div v-if="!rendered" class="cover-book">
        <div class="cover-title">{{ document.title }}</div>
        <div class="small" style="margin-top: 12px; font-family: Figtree">
          Framashare<br />{{ document.format.toUpperCase() }}
        </div>
      </div>
    </div>
    <div v-else class="cover-book">
      <div class="cover-title">{{ document.title }}</div>
      <div class="small" style="margin-top: 12px; font-family: Figtree">
        Framashare<br />{{ document.format.toUpperCase() }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cover-title {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 60px;
}
.pdf-cover {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: white;
}
.pdf-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}
.cover-book {
  position: absolute;
  inset: 0;
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  text-align: center;
}
</style>
