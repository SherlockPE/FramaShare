<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Maximize,
  Minimize,
  Flag,
  Link2Off,
  Eye,
} from "@lucide/vue";
import MupdfReader from "../components/readers/MupdfReader.vue";
import EpubReader from "../components/readers/EpubReader.vue";
import AlbumReader from "../components/readers/AlbumReader.vue";
import ReportDialog from "../components/readers/ReportDialog.vue";
import {
  state,
  currentUser,
  getDocument,
  getManaged,
  sessionDenial,
  files,
  imageSource,
  registerFiles,
  delay,
  notify,
} from "../services/store";
const route = useRoute(),
  router = useRouter(),
  shell = ref<HTMLElement>(),
  input = ref<HTMLInputElement>(),
  report = ref(false),
  full = ref(false),
  loading = ref(true),
  networkError = ref(""),
  fileError = ref("");
const token = computed(() => String(route.params.token || "")),
  isShare = computed(() => route.path.startsWith("/share/")),
  isManage = computed(() => route.path.startsWith("/manage/")),
  link = computed(() => state.links.find((l) => l.token === token.value));
const publication = computed(() =>
  isShare.value
    ? getDocument(link.value?.documentId || "")
    : isManage.value
    ? getManaged(token.value)
    : getDocument(String(route.params.id))
);
const moderation = computed(
  () => route.query.moderation === "true" && currentUser()?.role === "admin"
);
const authorized = computed(
  () =>
    !!publication.value &&
    (moderation.value ||
      !!(publication.value.ownerId && publication.value.ownerId === currentUser()?.id) ||
      !!(isManage.value && getManaged(token.value)?.id === publication.value.id) ||
      !!(
        isShare.value &&
        route.query.manage &&
        getManaged(String(route.query.manage))?.id === publication.value.id
      ))
);
const preview = computed(
  () => isShare.value && route.query.preview === "1" && authorized.value
);
const denial = computed(() => {
  if (isShare.value && !preview.value) return sessionDenial(token.value);
  if (!authorized.value)
    return isManage.value ? "Management link unavailable" : "Publication unavailable";
  const d = publication.value;
  if (
    !d ||
    ["deleted", "removed"].includes(d.status) ||
    (d.deleteAt && d.deleteAt <= state.now)
  )
    return "Publication unavailable";
  return null;
});
const fileVersion = ref(0);
const source = computed(() => {
  fileVersion.value;
  const d = publication.value;
  if (!d) return undefined;
  if (d.source && d.source.startsWith('/api/files/')) return d.source;
  return d.seed ? d.source : files.get(d.id)?.urls[0];
});
const missingFile = computed(() => {
  fileVersion.value;
  const d = publication.value;
  if (!d) return false;
  if (d.source && d.source.startsWith('/api/files/')) return false;
  return !d.seed && !files.has(d.id);
});
const back = computed(() => {
  if (typeof route.query.return === "string" && route.query.return.startsWith("/"))
    return route.query.return;
  if (preview.value)
    return route.query.manage
      ? `/manage/${route.query.manage}`
      : `/app/documents/${publication.value?.id}/links`;
  return isShare.value
    ? `/share/${token.value}`
    : isManage.value
    ? `/manage/${token.value}`
    : `/app/documents/${publication.value?.id}`;
});
const allowDownload = computed(
  () => !isShare.value || preview.value || !!link.value?.allowDownload
);
const accept = computed(() =>
  publication.value?.format === "album"
    ? "image/jpeg,image/png,image/webp"
    : publication.value?.format === "pdf"
    ? ".pdf,application/pdf"
    : ".epub,application/epub+zip"
);
async function load() {
  networkError.value = "";
  loading.value = true;
  try {
    await delay();
    if (publication.value?.status === "processing")
      throw Error("This publication is still processing. Try again in a moment.");
    if (publication.value?.status === "failed")
      throw Error(
        "This publication could not be processed. Ask its owner to upload it again."
      );
  } catch (e) {
    networkError.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
function position(value: number) {
  if (publication.value) publication.value.position = value;
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.value?.requestFullscreen();
  } catch {
    full.value = !full.value;
    notify(full.value ? "Expanded reading view" : "Returned to standard view");
  }
}
function fullscreenChange() {
  full.value = !!document.fullscreenElement;
}
function selectAgain() {
  input.value?.click();
}
function reselect(e: Event) {
  const selected = Array.from((e.target as HTMLInputElement).files || []),
    d = publication.value;
  if (!d || !selected.length) return;
  fileError.value = "";
  if (d.format === "album") {
    if (selected.length !== d.images.length) {
      fileError.value = `Select all ${d.images.length} images in their original order.`;
      return;
    }
    if (selected.some((f) => !/^image\/(jpeg|png|webp)$/.test(f.type))) {
      fileError.value = "Choose JPEG, PNG or WebP images.";
      return;
    }
  } else if (!selected[0]?.name.toLowerCase().endsWith("." + d.format)) {
    fileError.value = `Choose a ${d.format.toUpperCase()} file.`;
    return;
  }
  registerFiles(d.id, selected);
  fileVersion.value++;
  notify(d.format === "album" ? "Album files restored" : "File restored");
}
function download() {
  const d = publication.value;
  if (!d) return;
  const url =
    d.format === "album" ? imageSource(d, Math.max(0, d.position - 1)) : source.value;
  if (!url) {
    selectAgain();
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download =
    d.format === "album" ? `${d.title}-${d.position}` : `${d.title}.${d.format}`;
  a.click();
  notify("Download started");
}
function key(e: KeyboardEvent) {
  if (e.key === "Escape" && full.value && !document.fullscreenElement) full.value = false;
}
onMounted(() => {
  load();
  document.addEventListener("fullscreenchange", fullscreenChange);
  document.addEventListener("keydown", key);
});
onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", fullscreenChange);
  document.removeEventListener("keydown", key);
});
</script>
<template>
  <section ref="shell" class="reader-shell" :class="{ expanded: full }">
    <template v-if="denial"
      ><div class="access-denied">
        <RouterLink to="/" class="reader-brand"
          ><img src="/icons/newLogo.svg" alt="" width="48" height="48" />Framashare</RouterLink
        >
        <div class="card">
          <Link2Off :size="40" stroke-width="1.3" />
          <h1>{{ denial }}</h1>
          <p class="muted">
            {{
              denial === "Reading session ended"
                ? "Your reading session has ended. You can start again if this link still allows access."
                : "This publication is no longer accessible through this link. Ask the person who shared it for help."
            }}
          </p>
          <RouterLink
            v-if="isShare && denial === 'Reading session ended'"
            :to="`/share/${token}`"
            class="button"
            >Start a new session</RouterLink
          ><RouterLink v-else to="/help/sharing-links" class="button secondary"
            >Help with access</RouterLink
          >
        </div>
      </div></template
    ><template v-else
      ><header class="reader-header">
        <RouterLink
          :to="back"
          class="icon-button back-button"
          aria-label="Back from reader"
          ><ArrowLeft :size="19"
        /></RouterLink>
        <div class="reader-title">
          <span class="small muted">{{ publication?.format.toUpperCase() }} reader</span>
          <h1>{{ publication?.title }}</h1>
        </div>
        <div class="row reader-actions">
          <button
            v-if="allowDownload"
            class="icon-button"
            aria-label="Download publication"
            @click="download"
          >
            <Download :size="18" /></button
          ><button
            class="icon-button"
            :aria-label="full ? 'Exit fullscreen' : 'Enter fullscreen'"
            @click="fullscreen"
          >
            <Minimize v-if="full" :size="18" /><Maximize v-else :size="18" /></button
          ><button class="icon-button" aria-label="Report abuse" @click="report = true">
            <Flag :size="18" />
          </button>
        </div>
      </header>
      <div v-if="preview || moderation || !isShare" class="reader-preview">
        <Eye :size="15" /><span
          >{{
            moderation
              ? "Moderation preview"
              : preview
              ? "Author preview"
              : "Owner reading"
          }}
          · this view does not use recipient sessions<span
            v-if="preview && link && !link.allowDownload"
          >
            · recipient download is disabled</span
          ></span
        >
      </div>
      <div v-if="loading" class="reader-state" role="status">
        <BookOpen :size="32" />
        <p>Preparing your reading space…</p>
      </div>
      <div v-else-if="networkError" class="reader-state">
        <h2>Unable to open publication</h2>
        <p>{{ networkError }}</p>
        <button class="button" @click="load">Retry</button
        ><RouterLink :to="back" class="button secondary">Go back</RouterLink>
      </div>
      <div v-else-if="missingFile" class="reader-state">
        <h2>Select your file again</h2>
        <p>
          The publication details are saved, but the local file is not available after a
          browser reload.
        </p>
        <button class="button" @click="selectAgain">Select file again</button>
        <p v-if="fileError" class="error" role="alert">{{ fileError }}</p>
      </div>
      <MupdfReader
        v-else-if="publication?.format === 'pdf'"
        :key="fileVersion"
        :source="source || ''"
        :format="publication.format"
        :initial-page="publication.position"
        @position="position"
        @reselect="selectAgain" /><EpubReader
        v-else-if="publication?.format === 'epub'"
        :source="source || ''"
        :initial-page="publication.position"
        :sample="publication.seed"
        @position="position"
        @reselect="selectAgain" /><AlbumReader
        v-else-if="publication"
        :key="fileVersion"
        :publication="publication"
        @position="position"
        @reselect="selectAgain" />
      <p v-if="fileError && !missingFile" class="file-error alert error" role="alert">
        {{ fileError }}
      </p>
      <input
        ref="input"
        class="sr-only"
        type="file"
        :accept="accept"
        :multiple="publication?.format === 'album'"
        aria-label="Select original publication file again"
        @change="reselect" /><ReportDialog
        v-if="report && publication"
        :document-id="publication.id"
        @close="report = false"
    /></template>
  </section>
</template>
<style scoped>
.reader-shell {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--canvas);
}
.reader-shell.expanded {
  position: fixed;
  inset: 0;
  z-index: 80;
}
.reader-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.reader-title {
  flex: 1;
  min-width: 0;
}
.reader-title h1 {
  font-size: 18px;
  letter-spacing: -0.3px;
  line-height: 1.4;
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reader-actions {
  flex-shrink: 0;
}
.reader-actions .icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
}
.reader-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #eaf0e6;
  padding: 9px 16px;
  font-size: 12px;
  color: #405740;
  border-bottom: 1px solid #d5dece;
  flex-shrink: 0;
}
.reader-preview svg {
  flex-shrink: 0;
}
.reader-state {
  padding: 40px 24px;
  text-align: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.reader-state p {
  max-width: 440px;
  margin-bottom: 0;
}
.reader-state h2 {
  margin-bottom: 0;
}
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 24px;
  gap: 32px;
}
.access-denied .card {
  text-align: center;
  width: 480px;
  max-width: 100%;
  padding: 40px;
}
.access-denied h1 {
  font-size: 30px;
  letter-spacing: -0.6px;
  margin: 24px 0 16px;
}
.reader-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  letter-spacing: -0.7px;
}
.file-error {
  margin: 0;
  flex-shrink: 0;
}
@media (max-width: 600px) {
  .reader-header {
    padding: 12px;
    gap: 10px;
  }
  .reader-title h1 {
    font-size: 15px;
  }
  .reader-title > .small {
    font-size: 11px;
  }
  .reader-actions {
    gap: 6px;
  }
  .reader-actions .icon-button {
    min-width: 44px;
  }
  .reader-preview {
    font-size: 11px;
    line-height: 1.5;
    text-align: left;
    padding: 8px 12px;
  }
  .reader-header .back-button {
    min-width: 44px;
  }
  .access-denied .card {
    padding: 28px;
  }
}
@media (max-width: 360px) {
  .reader-header {
    gap: 7px;
    padding: 10px 8px;
  }
  .reader-actions .icon-button {
    min-width: 44px;
  }
  .reader-actions {
    gap: 4px;
  }
  .reader-title h1 {
    font-size: 14px;
  }
  .reader-title .small {
    font-size: 10px;
  }
}
</style>
