<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { Publication } from "../services/store";
import { imageSource } from "../services/store";
import * as mupdf from "mupdf";

const props = defineProps<{ document: Publication }>();
const canvas = ref<HTMLCanvasElement>();
const loading = ref(true);

async function renderCover() {
  if ((props.document.format !== 'pdf' && props.document.format !== 'epub') || !props.document.source) return;
  if (!canvas.value) return;

  try {
    loading.value = true;
    
    // Fetch the file content
    const response = await fetch(props.document.source);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const buffer = await response.arrayBuffer();
    
    // Determine the magic format based on file extension or format
    const magic = props.document.format === 'epub' ? "application/epub+zip" : "application/pdf";

    // Open document
    const doc = mupdf.Document.openDocument(new Uint8Array(buffer), magic);
    
    // Load first page
    const page = doc.loadPage(0);
    
    // Render to a Pixmap. We use a base scale. 
    // We want a width of around 400px. Let's find the native size first.
    const bounds = page.getBounds();
    const nativeWidth = bounds[2] - bounds[0];
    const scale = 400 / nativeWidth;
    
    const pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, true, true);

    const ctx = canvas.value.getContext('2d');
    if (!ctx) return;

    const width = pixmap.getWidth();
    const height = pixmap.getHeight();

    canvas.value.width = width;
    canvas.value.height = height;

    const imageData = new ImageData(
      pixmap.getPixels(),
      width,
      height
    );
    ctx.putImageData(imageData, 0, 0);

    // Cleanup
    pixmap.destroy();
    page.destroy();
    doc.destroy();
  } catch (err) {
    console.error('Failed to render document cover', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  renderCover();
});

watch(() => props.document.source, () => {
  renderCover();
});
</script>

<template>
  <div :class="['cover', document.format]">
    <img
      v-if="document.format === 'album' && imageSource(document, 0)"
      :src="imageSource(document, 0)"
      :alt="document.images[0]?.alt"
    />
    <div v-else-if="document.format === 'pdf' || document.format === 'epub'" class="pdf-cover">
      <canvas ref="canvas" class="pdf-canvas" :style="{ opacity: loading ? 0 : 1 }"></canvas>
      <div v-if="loading" class="cover-book">
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
  background: white; /* Make sure transparent pages have a white background */
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
