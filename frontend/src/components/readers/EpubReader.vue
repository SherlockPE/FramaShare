<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ChevronLeft, ChevronRight, List, Settings2, X } from "@lucide/vue";
import { state } from "../../services/store";
const props = defineProps<{ initialPage: number; sample: boolean }>();
const emit = defineEmits<{ position: [value: number] }>();
const chapter = ref(Math.max(1, Math.min(4, props.initialPage || 1))),
  panel = ref("");
const chapters = [
  {
    title: "A garden begins with a conversation",
    paragraphs: [
      "Before there is a garden, there is an invitation. Perhaps it is a note pinned to the library door, a conversation at the market, or a question asked across a fence: what could we grow here together? The first useful thing to plant is a reason for people to return.",
      "Walk around your neighbourhood with someone whose daily route is different from yours. Notice the corners that catch the morning sun, the benches where people pause, and the places where water collects after rain. A shared garden takes its shape from these small observations.",
      "Bring a notebook rather than a finished plan. Ask what people would like to do in the space. A quiet place to read can matter as much as a bed of vegetables. Someone may want to teach a child how beans climb; someone else may simply need a place to sit outside.",
      "Make the first meeting easy to join. Choose an accessible location, offer a clear start and finish time, and explain that no gardening experience is needed. People bring many kinds of knowledge. The person who can mend a gate is as welcome as the person who knows every seed.",
      "At the end, agree on one small task for the coming week. A plan becomes a shared project when people can see what they have helped change. Keep a record of the decisions and share it with anyone who could not attend.",
    ],
  },
  {
    title: "Making room for everyone",
    paragraphs: [
      "A path is an invitation when it is wide enough to travel comfortably. Check the entrance, the surfaces and the turning spaces before deciding where the beds will go. A garden should not ask people to explain why they cannot use it.",
      "Raise some beds to a comfortable working height and leave clear space beside them. Offer tools with different handles. Label plants in large, readable text, using both words and simple pictures where possible. These choices help visitors find their own way into the work.",
      "Share responsibilities in pieces that fit real lives. Watering on Tuesday evening is easier to understand than being in charge of everything for a month. Leave room for people whose time or energy changes from week to week.",
      "A welcome is made by actions repeated over time. Greet a new visitor, show where the tools live, and ask what they would enjoy doing. Keep a shaded seat available. Let people watch before they join.",
      "Review the arrangement together after the first month. What has become awkward? Which small adjustment would make the next visit easier? A shared place remains welcoming because its users keep paying attention.",
    ],
  },
  {
    title: "The patient work of growing",
    paragraphs: [
      "The soil is never empty. It holds the history of the place, the work of living organisms, and the traces of what came before. Learn about it slowly. If the ground has an uncertain past, use safe raised beds and seek local guidance before growing food directly in it.",
      "Begin with a few crops that people want to eat or share. Choose plants suited to your seasons and the light available. Keep notes about planting dates, rainfall and what worked. Next year these modest records will be more useful than a perfect diagram.",
      "Water close to the roots, in the cooler hours when possible. A simple rota makes the task predictable. Leave a clear way to tell the next person what has been done. Check the weather together rather than watering by habit.",
      "Let some flowers remain for insects, and welcome the untidy edges that offer shelter. A garden is a living place, not a picture that must stay unchanged. Watch before you intervene.",
      "When a crop fails, write down what you noticed. Share the lesson without assigning blame. The most durable thing a garden produces may be the confidence to try again.",
    ],
  },
  {
    title: "Keeping the story open",
    paragraphs: [
      "At harvest, decide together how the produce will be shared. Clear agreements prevent misunderstandings. Save a few seeds where appropriate, and label them with the name, the date and the person who collected them.",
      "Make a small record of the season. A photograph, a recipe, a map, a caption written by a child: each tells a different part of the story. Ask permission before sharing photographs of people, and offer a way to take part without appearing in them.",
      "The reading corner can hold these records alongside borrowed books and local notes. Give each item a title and a short description. Make it easy for a new visitor to understand what they are looking at.",
      "Before winter, thank the people who kept returning and the people who helped just once. Invite everyone to choose one thing to keep and one thing to change. Leave a clear note about how to join the next gathering.",
      "A shared garden is never quite finished. Its boundaries, habits and stories shift with the people who use it. What matters is that the invitation remains legible: there is room here, and you can help decide what grows.",
    ],
  },
];
const current = computed(() => chapters[chapter.value - 1]!);
const preferences = computed(() => state.preferences);
function go(n: number) {
  chapter.value = Math.max(1, Math.min(chapters.length, n));
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
        <p v-if="!sample" class="epub-demo small">
          Sample chapter preview. Your EPUB file is stored for this session; this reader
          demonstrates its reading settings using the included text.
        </p>
        <article
          :class="preferences.width"
          :style="{
            fontSize: preferences.fontSize + 'px',
            lineHeight: preferences.lineHeight,
          }"
        >
          <p class="chapter-number">{{ chapter }} / {{ chapters.length }}</p>
          <h1>{{ current.title }}</h1>
          <p v-for="(paragraph, index) in current.paragraphs" :key="index">
            {{ paragraph }}
          </p>
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
.epub-stage article p {
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
