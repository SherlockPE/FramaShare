<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ChevronLeft, ChevronRight, List, Settings2, X } from "@lucide/vue";
import { state } from "../../services/store";
const props = defineProps<{ initialPage: number; sample: boolean; source?: string }>();
const emit = defineEmits<{ position: [value: number] }>();
const chapter = ref(Math.max(1, props.initialPage || 1)),
  panel = ref("");
const chapters = ref<{ title: string; html: string }[]>([]);
const loadError = ref('');
onMounted(async () => {
  try {
    if (!props.source) throw Error('EPUB unavailable.');
    const separator = props.source.includes('?') ? '&' : '?';
    const response = await fetch(props.source + separator + 'content=1', { credentials: 'same-origin' });
    if (!response.ok) throw Error('EPUB unavailable. Please reopen the publication.');
    const data = await response.json();
    chapters.value = data.chapters;
    chapter.value = Math.min(chapter.value, chapters.value.length);
  } catch (e) { loadError.value = (e as Error).message; }
});
const current = computed(() => chapters.value[chapter.value - 1] || { title: "", html: "" });
const preferences = computed(() => state.preferences);
function go(n: number) {
  chapter.value = Math.max(1, Math.min(chapters.value.length, n));
  emit("position", chapter.value);
  panel.value = "";
  document.querySelector(".epub-stage")?.scrollTo({ top: 0 });
}
function keyboard(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest("input,select,textarea,button")) return;
  if (e.key === "ArrowRight") go(chapter.value + 1);
  if (e.key === "ArrowLeft") go(chapter.value - 1);
  if (e.key === "Escape") panel.value = "";
}
onMounted(() => document.addEventListener("keydown", keyboard));
onBeforeUnmount(() => document.removeEventListener("keydown", keyboard));
</script>
<template>
  <p v-if="loadError" class="alert error" role="alert">{{ loadError }}</p>
  <div class="epub-reader" :class="preferences.theme">
    <div class="epub-toolbar">
      <button
        class="button secondary"
        aria-label="Contents"
        :aria-expanded="panel === 'contents'"
        @click="panel = panel === 'contents' ? '' : 'contents'"
      >
        <List :size="18" /><span>Contents</span></button
      ><span class="small muted">Chapter {{ chapter }} of {{ chapters.length }}</span
      ><button
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
            v-for="(item, index) in chapters"
            :key="index"
            class="chapter-link"
            :class="{ selected: chapter === index + 1 }"
            @click="go(index + 1)"
          >
            <span class="mono">{{ index + 1 }}</span
            >{{ item.title }}
          </button></template
        >
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
      <div class="epub-stage">
        <article
          :class="preferences.width"
          :style="{
            fontSize: preferences.fontSize + 'px',
            lineHeight: preferences.lineHeight,
          }"
        >
          <p class="chapter-number">{{ chapter }} / {{ chapters.length }}</p>
          <h1>{{ current.title }}</h1>
          <div v-html="current.html"></div>
          <div class="chapter-end">❧</div>
        </article>
      </div>
    </div>
    <footer class="epub-footer">
      <button class="button secondary" :disabled="chapter === 1" @click="go(chapter - 1)">
        <ChevronLeft :size="18" />Previous</button
      ><span class="small"
        >{{ Math.round((chapter / chapters.length) * 100) }}% complete</span
      ><button
        class="button secondary"
        :disabled="chapter === chapters.length"
        @click="go(chapter + 1)"
      >
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
.epub-stage {
  min-width: 0;
  flex: 1;
  overflow-y: auto;
  padding: 56px 40px;
}
.epub-stage article {
  font-family: Literata, Georgia, serif;
  max-width: 680px;
  margin: auto;
}
.epub-stage article.narrow {
  max-width: 520px;
}
.epub-stage article.wide {
  max-width: 850px;
}
.epub-stage article h1 {
  font-family: Literata, Georgia, serif;
  font-size: 2em;
  line-height: 1.3;
  letter-spacing: -0.7px;
  margin: 20px 0 32px;
}
.epub-stage article :deep(img) { max-width: 100%; height: auto; }
.epub-stage article :deep(p) {
  line-height: inherit;
  margin-bottom: 1.4em;
}
.chapter-number {
  font-family: Figtree, sans-serif;
  font-size: 13px;
  opacity: 0.7;
}
.chapter-end {
  text-align: center;
  padding: 32px;
  font-size: 32px;
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
.epub-demo {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  padding: 16px;
  max-width: 680px;
  margin: 0 auto 32px;
  border-radius: 8px;
}
@media (max-width: 800px) {
  .epub-panel {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 5;
    width: min(320px, 90%);
    box-shadow: 8px 0 20px #0001;
  }
  .epub-stage {
    padding: 36px 24px;
  }
  .epub-toolbar {
    padding: 10px 12px;
  }
  .epub-toolbar .button span {
    display: none;
  }
  .epub-stage article h1 {
    font-size: 1.6em;
  }
  .epub-footer {
    padding: 12px;
  }
  .epub-footer .button {
    padding: 10px 12px;
  }
}
@media (max-width: 360px) {
  .epub-stage {
    padding: 28px 18px;
  }
  .epub-footer {
    gap: 6px;
  }
  .epub-footer .button {
    font-size: 13px;
    padding: 10px;
  }
  .epub-footer .small {
    font-size: 12px;
  }
}
</style>
