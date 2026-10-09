<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Upload,
  FileText,
  Image,
  Check,
  ArrowLeft,
  Copy,
  Download,
} from "@lucide/vue";
import {
  state,
  currentUser,
  upload,
  getDocument,
  formatSize,
  formatDate,
  copyLink,
  notify,
  files,
  registerFiles,
  releaseFiles,
  deleteDocument,
} from "../services/store";
import type { Format } from "../services/store";
import { licenses } from '../services/licenses';
import type { License } from '../services/licenses';
const license = ref<License>('unspecified');
const attribution = ref(currentUser()?.name || '');
const route = useRoute(),
  router = useRouter();
const fullUrl = (path: string) => new URL(path, location.origin).href;
const dragIndex = ref<number | null>(null);
const selected = ref<File[]>([]),
  title = ref(""),
  description = ref(""),
  retention = ref(state.settings.defaultRetention),
  format = ref<Format>("pdf"),
  sample = ref(false),
  error = ref(""),
  dragging = ref(false),
  phase = ref("uploading"),
  progress = ref(0),
  running = ref(false),
  cancelled = ref(false);
let timers: ReturnType<typeof setTimeout>[] = [];
const urls = ref<string[]>([]);
const complete = computed(() => route.path.startsWith("/upload/complete/"));
const doc = computed(() => getDocument(String(route.params.id)));
const user = computed(currentUser);
function clearPreviews() {
  urls.value.forEach((u) => URL.revokeObjectURL(u));
  urls.value = [];
}
function choose(list: File[]) {
  error.value = "";
  sample.value = false;
  clearPreviews();
  const types = list.map((f) => f.name.toLowerCase().split(".").pop());
  const imageTypes = ["jpg", "jpeg", "png", "webp"];
  if (!list.length) return;
  if (list.length === 1 && ["pdf", "epub"].includes(types[0] || ""))
    format.value = types[0] as Format;
  else if (types.every((t) => imageTypes.includes(t || ""))) format.value = "album";
  else {
    error.value =
      "Choose one PDF or EPUB, or a set of JPEG, PNG or WebP images. Mixed file types are not supported.";
    selected.value = [];
    return;
  }
  const size = list.reduce((s, f) => s + f.size, 0);
  if (format.value === "album" && list.length > state.settings.albumCount) {
    error.value = "An album can contain up to " + state.settings.albumCount + " images.";
    selected.value = [];
    return;
  }
  if (
    size >
    (format.value === "album" ? state.settings.albumMB : state.settings.fileMB) * 1000000
  ) {
    error.value = "These files exceed the upload limit. Choose smaller files.";
    selected.value = [];
    return;
  }
  selected.value = list;
  title.value = list[0]!.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  if (format.value === "album") urls.value = list.map((f) => URL.createObjectURL(f));
}
function input(e: Event) {
  choose(Array.from((e.target as HTMLInputElement).files || []));
}
function drop(e: DragEvent) {
  dragging.value = false;
  choose(Array.from(e.dataTransfer?.files || []));
}
function reorder(i: number, dir: number) {
  const n = i + dir;
  if (n < 0 || n >= selected.value.length) return;
  const [f] = selected.value.splice(i, 1),
    [url] = urls.value.splice(i, 1);
  if (f) selected.value.splice(n, 0, f);
  if (url) urls.value.splice(n, 0, url);
}
function demo() {
  sample.value = true;
  selected.value = [];
  format.value = "pdf";
  title.value = "Community workshop handbook";
  description.value = "A practical guide for bringing a neighbourhood together.";
  error.value = "";
  clearPreviews();
}
async function begin() {
  error.value = "";
  if (!title.value.trim()) {
    error.value = "Give your publication a title.";
    return;
  }
  if (!sample.value && !selected.value.length) {
    error.value = "Choose a file to upload.";
    return;
  }
  if (licenses[license.value].url && !attribution.value.trim()) {
    error.value = 'Add the author credit for this license.';
    return;
  }
  cancelled.value = false;
  running.value = true;
  phase.value = "uploading";
  progress.value = 0;
  router.replace("/upload/progress");
  for (let i = 1; i <= 4; i++) {
    await new Promise<void>((resolve) => {
      timers.push(setTimeout(resolve, 180));
    });
    if (cancelled.value) return;
    progress.value = i * 25;
  }
  phase.value = "processing";
  try {
    const publication = await upload({
      title: title.value.trim(),
      description: description.value,
      format: format.value,
      selected: selected.value,
      retention: retention.value,
      sample: sample.value,
      license: license.value,
      attribution: attribution.value,
    });
    if (cancelled.value) {
      await deleteDocument(publication.id);
      return;
    }
    router.replace("/upload/complete/" + publication.id);
  } catch (e) {
    if (!cancelled.value) { error.value = (e as Error).message; phase.value = "failed"; }
    else notify((e as Error).message);
  } finally {
    running.value = false;
  }
}
function cancel() {
  cancelled.value = true;
  running.value = false;
  phase.value = "cancelled";
  notify("Upload cancelled");
  router.replace("/upload");
}
function saveManagement() {
  if (!doc.value?.manageToken) return;
  const url = new URL("/manage/" + doc.value.manageToken, location.origin).href;
  const object = URL.createObjectURL(new Blob(["Keep this link private.\n" + url]));
  const a = document.createElement("a");
  a.href = object;
  a.download = "framashare-management-link.txt";
  a.click();
  URL.revokeObjectURL(object);
  notify("Management link saved");
}
onMounted(() => {
  if (route.query.demo === "selected") demo();
  if (route.query.demo === "failure") {
    demo();
    state.nextFailure = true;
    begin();
  }
  if (route.query.demo === "cancelled") {
    phase.value = "cancelled";
    notify("Upload cancelled");
  }
  if (route.path === "/upload/progress") {
    router.replace("/upload");
    error.value = "Choose your file to start a new upload.";
  }
});
onBeforeUnmount(() => {
  cancelled.value = true;
  timers.forEach((t) => clearTimeout(t));
  clearPreviews();
});
</script>
<template>
  <div class="page upload-page">
    <template v-if="complete && doc"
      ><div class="complete-heading">
        <div class="success-mark"><Check :size="28" /></div>
        <h1>Your document is ready</h1>
        <p class="muted">{{ doc.title }}</p>
      </div>
      <section v-if="doc.manageToken" class="card stack">
        <h2>Save your management link</h2>
        <p>
          Keep this link private. Anyone with it can manage or delete this document.<br /><strong
            >Without this link, you cannot manage this document.</strong
          >
        </p>
        <div class="url" tabindex="0">{{ fullUrl("/manage/" + doc.manageToken) }}</div>
        <div class="row wrap">
          <button class="button" @click="copyLink('/manage/' + doc.manageToken)">
            <Copy :size="16" />Copy management link</button
          ><button class="button secondary" @click="saveManagement">
            <Download :size="16" />Save link
          </button>
        </div>
        <p class="small muted">
          Publication will be deleted {{ formatDate(doc.deleteAt) }}. Add it to an account
          to keep it in your library.
        </p>
        <div class="divider" />
        <RouterLink
          :to="'/manage/' + doc.manageToken + '?dialog=link'"
          class="button secondary"
          >Create sharing link</RouterLink
        ><RouterLink :to="'/manage/' + doc.manageToken" class="button ghost"
          >Manage publication</RouterLink
        >
      </section>
      <section v-else class="card stack">
        <h2>A new addition to your library</h2>
        <p>Your file is ready to read. Create a link to share it with someone.</p>
        <RouterLink :to="'/app/documents/' + doc.id + '?dialog=link'" class="button"
          >Create sharing link</RouterLink
        ><RouterLink :to="'/app/documents/' + doc.id" class="button secondary"
          >Open publication</RouterLink
        ><RouterLink to="/app/library" class="button ghost">Back to library</RouterLink>
      </section></template
    ><template v-else-if="route.path === '/upload/progress'"
      ><section class="card empty">
        <Upload :size="36" />
        <h1>
          {{
            phase === "failed"
              ? "Upload interrupted"
              : phase === "processing"
              ? "Preparing your document"
              : "Uploading your document"
          }}
        </h1>
        <p class="muted">{{ title }}</p>
        <progress
          :value="progress"
          max="100"
          :aria-label="phase === 'processing' ? 'Processing' : 'Upload progress'"
        />
        <p role="status">
          {{
            phase === "processing"
              ? "Almost there. Getting everything ready for reading."
              : progress + "% uploaded"
          }}
        </p>
        <p v-if="error" class="alert error" role="alert">{{ error }}</p>
        <div class="row wrap" style="justify-content: center">
          <button class="button secondary" @click="cancel">Cancel upload</button
          ><button v-if="phase === 'failed'" class="button" @click="begin">
            Retry upload
          </button>
        </div>
      </section></template
    ><template v-else
      ><RouterLink
        :to="user ? '/app/library' : '/'"
        class="row small"
        style="margin-bottom: 32px"
        ><ArrowLeft :size="16" />{{ user ? "Your library" : "Home" }}</RouterLink
      >
      <div class="page-heading">
        <h1>Make room for a good read.</h1>
        <p class="muted">A document, a book, a few moments worth sharing.</p>
      </div>
      <div v-if="!user" class="alert anonymous-note">
        You’re publishing without an account. You’ll receive a private management link.<br /><RouterLink
          :to="{ path: '/sign-in', query: { return: '/upload' } }"
          >Sign in</RouterLink
        >
        to keep your publications together in a library.
      </div>
      <form class="stack" @submit.prevent="begin">
        <p class="small muted">
          PDF or EPUB up to {{ state.settings.fileMB }} MB · Albums up to
          {{ state.settings.albumCount }} images / {{ state.settings.albumMB }} MB
        </p>
        <label
          :class="['dropzone', { dragging }]"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="drop"
          ><Upload :size="30" stroke-width="1.3" /><strong>{{
            selected.length
              ? selected.length +
                " file" +
                (selected.length === 1 ? "" : "s") +
                " selected"
              : sample
              ? "Sample PDF selected"
              : "Drop your files here"
          }}</strong
          ><span class="muted">or choose from your device</span
          ><input
            type="file"
            multiple
            accept=".pdf,.epub,.jpg,.jpeg,.png,.webp"
            aria-label="Choose publication files"
            @change="input" /></label
        ><button
          v-if="!selected.length && !sample"
          type="button"
          class="sample-link"
          @click="demo"
        >
          Try it with our sample PDF
        </button>
        <div v-if="selected.length" class="selected-files">
          <div
            v-for="(f, i) in selected"
            :key="f.name + i"
            class="selected-row"
            :draggable="format === 'album'"
            @dragstart="dragIndex = i"
            @dragover.prevent
            @drop.prevent="
              dragIndex !== null && reorder(dragIndex, i - dragIndex);
              dragIndex = null;
            "
          >
            <img v-if="urls[i]" :src="urls[i]" :alt="f.name" /><FileText
              v-else
              :size="24"
            />
            <div class="file-name">
              <strong>{{ f.name }}</strong
              ><small class="muted">{{ formatSize(f.size) }}</small>
            </div>
            <div v-if="format === 'album'" class="row">
              <button
                type="button"
                class="icon-button"
                :disabled="i === 0"
                aria-label="Move image up"
                @click="reorder(i, -1)"
              >
                ↑</button
              ><button
                type="button"
                class="icon-button"
                :disabled="i === selected.length - 1"
                aria-label="Move image down"
                @click="reorder(i, 1)"
              >
                ↓
              </button>
            </div>
          </div>
        </div>
        <label class="field"
          >Title<input
            v-model="title"
            required
            maxlength="200"
            placeholder="Give your publication a name" /></label
        ><label class="field"
          >Description <span class="muted small">Optional</span
          ><textarea
            v-model="description"
            placeholder="A little context for your readers"
            maxlength="2000"
          /></label
        >
        <label class="field">
          Usage rights
          <select v-model="license" aria-describedby="license-description">
            <option v-for="(option, id) in licenses" :key="id" :value="id">{{ option.label }}</option>
          </select>
        </label>
        <p id="license-description" class="small muted">
          {{ licenses[license].description }}
          <a v-if="licenses[license].url" :href="licenses[license].url" target="_blank" rel="noopener noreferrer">Full license terms</a>
        </p>
        <label v-if="licenses[license].url" class="field">
          Author credit
          <input v-model="attribution" required maxlength="200" placeholder="Name to credit when reusing this publication" />
        </label>
        <label v-if="!user" class="field"
          >Keep this publication for<select v-model="retention">
            <option v-for="n in state.settings.retention" :key="n" :value="n">
              {{ n }} {{ n === 1 ? "day" : "days" }}
            </option></select
          ><small
            >It will be deleted after this period unless you add it to an account.</small
          ></label
        >
        <p v-if="error" class="alert error" role="alert">{{ error }}</p>
        <div class="row between wrap">
          <span class="small muted">Only people with your link can read.</span
          ><button class="button" :disabled="running">
            <Upload :size="16" />Upload document
          </button>
        </div>
      </form></template
    >
  </div>
</template>
<style scoped>
.upload-page {
  max-width: 800px;
}
.anonymous-note {
  margin-bottom: 28px;
}
.anonymous-note a {
  text-decoration: underline;
}
.dropzone {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border: 1px dashed #afb9af;
  background: var(--surface);
  border-radius: 16px;
  cursor: pointer;
}
.dropzone.dragging {
  background: var(--blue);
  border-color: #4580a8;
}
.dropzone input {
  max-width: 100%;
  margin-top: 8px;
  font-size: 14px;
}
.dropzone input::file-selector-button {
  border: 1px solid var(--border);
  background: var(--canvas);
  border-radius: 8px;
  padding: 12px;
  margin-right: 12px;
  cursor: pointer;
}
.sample-link {
  background: none;
  border: 0;
  text-decoration: underline;
  align-self: center;
  min-height: 44px;
  color: var(--secondary);
}
.selected-row {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.selected-row img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
}
.file-name {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-wrap: anywhere;
}
.complete-heading {
  text-align: center;
  margin-bottom: 32px;
}
.success-mark {
  display: inline-flex;
  padding: 16px;
  background: #e6efdf;
  border: 1px solid #cad8c4;
  border-radius: 50%;
  margin-bottom: 24px;
  color: var(--green);
}
.complete-heading h1 {
  margin-bottom: 16px;
}
.divider {
  margin: 0;
}
.empty progress {
  margin: 24px 0;
}
.upload-page form > p {
  margin-bottom: 0;
}
@media (max-width: 480px) {
  .dropzone {
    padding: 32px 14px;
  }
  .selected-row {
    flex-wrap: wrap;
  }
  .selected-row .row {
    margin-left: auto;
  }
  .file-name {
    font-size: 14px;
  }
  .complete-heading h1 {
    font-size: 30px;
  }
}
</style>
