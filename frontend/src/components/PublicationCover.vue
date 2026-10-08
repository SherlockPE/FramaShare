<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { Publication } from "../services/store";
import { imageSource } from "../services/store";
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = worker;

const props = defineProps<{ document: Publication }>();
const canvas = ref<HTMLCanvasElement>();
const loading = ref(true);

async function renderPdfCover() {
  if (props.document.format !== 'pdf' || !props.document.source) return;
  if (!canvas.value) return;

  try {
    loading.value = true;
    const pdf = await getDocument(props.document.source).promise;
    const page = await pdf.getPage(1);
    
    // Scale viewport to a reasonable thumbnail resolution
    const viewport = page.getViewport({ scale: 1 });
    const scale = 400 / viewport.width; 
    const scaledViewport = page.getViewport({ scale });

    const ctx = canvas.value.getContext('2d');
    if (!ctx) return;

    canvas.value.width = scaledViewport.width;
    canvas.value.height = scaledViewport.height;

    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport
    }).promise;
  } catch (err) {
    console.error('Failed to render PDF cover', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  renderPdfCover();
});

watch(() => props.document.source, () => {
  renderPdfCover();
});
</script>

<template>
  <div :class="['cover', document.format]">
    <img
      v-if="document.format === 'album' && imageSource(document, 0)"
      :src="imageSource(document, 0)"
      :alt="document.images[0]?.alt"
    />
    <div v-else-if="document.format === 'pdf'" class="pdf-cover">
      <canvas ref="canvas" class="pdf-canvas" :style="{ opacity: loading ? 0 : 1 }"></canvas>
      <div v-if="loading" class="cover-book">
        <div class="cover-title">{{ document.title }}</div>
        <div class="small" style="margin-top: 12px; font-family: Figtree">
          Framashare<br />PDF
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
  background: white; /* Make sure transparent PDFs have a white background */
}
.pdf-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  transition: opacity 0.3s ease;
}
.cover-book {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  text-align: center;
}
</style>
