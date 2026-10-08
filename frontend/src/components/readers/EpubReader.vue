<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, shallowRef } from "vue";
import { ChevronLeft, ChevronRight, List, Settings2, X } from "@lucide/vue";
import { state, notify } from "../../services/store";
import ePub from "epubjs";

const props = defineProps<{ initialPage: number; sample?: boolean; source?: string }>();
const emit = defineEmits<{ position: [value: number]; reselect: [] }>();

const chapter = ref(props.initialPage || 1);
const panel = ref("");
const preferences = computed(() => state.preferences);

const stageRef = ref<HTMLElement>();
const book = shallowRef<any>(null);
const rendition = shallowRef<any>(null);
const chapters = ref<{ href: string; label: string; index: number }[]>([]);
const error = ref("");
const loading = ref(true);

let resize: ResizeObserver | undefined;

async function loadBook() {
  if (!props.source || !stageRef.value) return;
  
  if (book.value) {
    book.value.destroy();
  }
  
  error.value = "";
  loading.value = true;
  
  try {
    const response = await fetch(props.source);
    if (!response.ok) throw new Error("Failed to fetch EPUB file");
    const buffer = await response.arrayBuffer();
    
    book.value = ePub(buffer);
    
    rendition.value = book.value.renderTo(stageRef.value, {
      width: "100%",
      height: "100%",
      spread: "none",
      manager: "continuous",
      flow: "paginated"
    });
    
    applyTheme(preferences.value);
    
    await rendition.value.display();
    
    book.value.loaded.navigation.then((nav: any) => {
      chapters.value = (nav.toc || []).map((item: any, i: number) => ({
        href: item.href,
        label: item.label,
        index: i + 1
      }));
    });
    
    rendition.value.on("relocated", (location: any) => {
      // Just emit a position event to keep it consistent
      // epubjs uses cfi, we just use chapter numbers as a proxy if we can, or just emit 1
      emit("position", 1);
    });

    loading.value = false;
  } catch (err: any) {
    console.error(err);
    error.value = "Unable to open EPUB document.";
    loading.value = false;
  }
}

watch(() => props.source, () => {
  loadBook();
});

watch(preferences, (newPrefs) => {
  applyTheme(newPrefs);
}, { deep: true });

function applyTheme(prefs: any) {
  if (!rendition.value) return;
  rendition.value.themes.fontSize(prefs.fontSize + "px");
  rendition.value.themes.register("custom", {
    "body": {
      "line-height": prefs.lineHeight + " !important",
      "max-width": prefs.width === "narrow" ? "520px" : prefs.width === "wide" ? "850px" : "680px",
      "margin": "0 auto !important",
      "color": prefs.theme === "dark" ? "#e9ece4" : prefs.theme === "sepia" ? "#4e4434" : "#262323",
      "background": prefs.theme === "dark" ? "#252927" : prefs.theme === "sepia" ? "#efe6d4" : "transparent",
      "font-family": "Literata, Georgia, serif !important"
    },
    "p, h1, h2, h3, h4, div, span": {
      "color": "inherit !important",
      "font-family": "inherit !important"
    }
  });
  rendition.value.themes.select("custom");
}

function go(href: string, index: number) {
  chapter.value = index;
  if (rendition.value) {
    rendition.value.display(href);
  }
  panel.value = "";
}

function next() {
  if (rendition.value) rendition.value.next();
}

function prev() {
  if (rendition.value) rendition.value.prev();
}

function keyboard(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest("input,select,textarea,button")) return;
  if (e.key === "ArrowRight") { e.preventDefault(); next(); }
  if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  if (e.key === "Escape") panel.value = "";
}

onMounted(() => {
  if (props.source) {
    loadBook();
  }
  document.addEventListener("keydown", keyboard);
  
  resize = new ResizeObserver(() => { 
    if (rendition.value && stageRef.value && rendition.value.manager) {
       try { rendition.value.resize(); } catch(e) {}
    }
  });
  if (stageRef.value) resize.observe(stageRef.value);
});

onBeforeUnmount(() => {
  if (book.value) book.value.destroy();
  if (resize) resize.disconnect();
  document.removeEventListener("keydown", keyboard);
});
</script>

<template>
  <div class="epub-reader" :class="preferences.theme">
    <div class="epub-toolbar">
      <button
        class="button secondary"
        aria-label="Contents"
        :aria-expanded="panel === 'contents'"
        @click="panel = panel === 'contents' ? '' : 'contents'"
      >
        <List :size="18" /><span>Contents</span></button
      ><span class="small muted">EPUB Reader</span><button
        class="button secondary"
        aria-label="Reading settings"
        :aria-expanded="panel === 'settings'"
        @click="panel = panel === 'settings' ? '' : 'settings'"
      >
        <Settings2 :size="18" /><span>Reading settings</span>
      </button>
    </div>
    <div class="epub-workspace">
      <aside v-if="panel" class="epub-panel">
        <div class="row between">
          <h3>{{ panel === "contents" ? "Contents" : "Reading settings" }}</h3>
          <button
            class="icon-button"
            aria-label="Close reading panel"
            @click="panel = ''"
          >
            <X :size="18" />
          </button>
        </div>
        <template v-if="panel === 'contents'"
          ><button
            v-for="item in chapters"
            :key="item.href"
            class="chapter-link"
            :class="{ selected: chapter === item.index }"
            @click="go(item.href, item.index)"
          >
            <span class="mono">{{ item.index }}</span
            >{{ item.label }}
          </button>
          <p v-if="chapters.length === 0" class="muted small">No chapters found.</p>
        </template>
        <div v-else class="stack">
          <label class="field"
            >Text size<select
              aria-label="Text size"
              v-model.number="state.preferences.fontSize"
            >
              <option v-for="size in [16, 18, 20, 24]" :key="size" :value="size">
                {{ size }} px
              </option>
            </select></label
          ><label class="field"
            >Line spacing<select
              aria-label="Line spacing"
              v-model.number="state.preferences.lineHeight"
            >
              <option v-for="spacing in [1.5, 1.8, 2]" :key="spacing" :value="spacing">
                {{ spacing }}
              </option>
            </select></label
          ><label class="field"
            >Text width<select aria-label="Text width" v-model="state.preferences.width">
              <option value="narrow">Narrow</option>
              <option value="medium">Medium</option>
              <option value="wide">Wide</option>
            </select></label
          ><label class="field"
            >Theme<select aria-label="Theme" v-model="state.preferences.theme">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="sepia">Sepia</option>
            </select></label
          >
          <p class="small muted">Your reading preferences are saved for next time.</p>
        </div>
      </aside>
      
      <div class="epub-stage-container">
        <div v-if="loading" class="reader-message">
            Opening your document...
        </div>
        <div v-else-if="error" class="reader-message">
            <h2>Unable to open document</h2>
            <p>{{ error }}</p>
            <div class="row wrap">
                <button class="button" @click="loadBook">Retry</button>
                <button class="button secondary" @click="emit('reselect')">Select file again</button>
            </div>
        </div>
        
        <div ref="stageRef" class="epub-stage" :style="{ display: loading || error ? 'none' : 'block' }"></div>
      </div>
    </div>
    <footer class="epub-footer">
      <button class="button secondary" @click="prev">
        <ChevronLeft :size="18" />Previous</button
      ><button class="button secondary" @click="next">
        Next<ChevronRight :size="18" />
      </button>
    </footer>
  </div>
</template>
<style scoped>
.epub-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #fbfbf8;
  color: #262323;
}
.epub-reader.dark {
  background: #252927;
  color: #e9ece4;
}
.epub-reader.sepia {
  background: #efe6d4;
  color: #4e4434;
}
.epub-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  color: var(--text);
}
.epub-workspace {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}
.epub-stage-container {
  min-width: 0;
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}
.epub-stage {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.epub-panel {
  width: 285px;
  flex-shrink: 0;
  background: var(--surface);
  color: var(--text);
  padding: 24px;
  border-right: 1px solid var(--border);
  overflow: auto;
}
.epub-panel > .row {
  margin-bottom: 24px;
}
.epub-panel h3 {
  font-size: 18px;
  margin: 0;
}
.chapter-link {
  padding: 16px 10px;
  display: flex;
  gap: 16px;
  text-align: left;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--border);
  width: 100%;
  line-height: 1.5;
  min-height: 44px;
}
.chapter-link.selected {
  background: #e9efe4;
}
.epub-footer {
  padding: 16px 24px;
  border-top: 1px solid #a9ada866;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.reader-message {
  margin: auto;
  max-width: 440px;
  padding: 32px;
  line-height: 1.5;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  text-align: center;
}
@media (max-width: 800px) {
  .epub-panel {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 5;
    width: min(320px, 90%);
    box-shadow: 8px 0 20px #0001;
  }
  .epub-toolbar {
    padding: 10px 12px;
  }
  .epub-toolbar .button span {
    display: none;
  }
  .epub-footer {
    padding: 12px;
  }
  .epub-footer .button {
    padding: 10px 12px;
  }
}
@media (max-width: 360px) {
  .epub-footer {
    gap: 6px;
  }
  .epub-footer .button {
    font-size: 13px;
    padding: 10px;
  }
}
</style>
