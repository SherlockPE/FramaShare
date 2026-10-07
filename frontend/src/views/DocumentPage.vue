<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BookOpen, Plus, Copy, ArrowLeft, Link, Download } from "@lucide/vue";
import UiModal from "../components/UiModal.vue";
import UiMenu from "../components/UiMenu.vue";
import LinkEditor from "../components/LinkEditor.vue";
import PublicationCover from "../components/PublicationCover.vue";
import {
  state,
  currentUser,
  getDocument,
  getManaged,
  claimDocument,
  deleteDocument,
  formatSize,
  formatDate,
  notify,
  copyLink,
  delay,
  files,
  registerFiles,
  linkDenial,
} from "../services/store";
import type { SharingLink } from "../services/store";
const route = useRoute(),
  router = useRouter();
const fullUrl = (path: string) => new URL(path, location.origin).href;
const managed = computed(() => route.path.startsWith("/manage/"));
const doc = computed(() => {
  if (managed.value) return getManaged(String(route.params.token));
  const d = getDocument(String(route.params.id));
  return d &&
    d.ownerId === currentUser()?.id &&
    !["deleted", "removed"].includes(d.status)
    ? d
    : undefined;
});
const base = computed(() =>
  managed.value ? "/manage/" + route.params.token : "/app/documents/" + route.params.id
);
const editing = computed(() => route.path.endsWith("/edit") || route.query.edit === "1");
const claiming = computed(() => route.path.endsWith("/claim"));
const dragIndex = ref<number | null>(null);
const title = ref(doc.value?.title || ""),
  description = ref(doc.value?.description || ""),
  images = ref(doc.value?.images.map((i) => ({ ...i })) || []),
  error = ref(""),
  saving = ref(false),
  create = ref(route.query.dialog === "link"),
  editLink = ref<SharingLink>(),
  revoke = ref<SharingLink>(),
  deleting = ref(false),
  claimConfirm = ref(false);
const links = computed(() => state.links.filter((l) => l.documentId === doc.value?.id));
const managementUrl = computed(() => new URL(base.value, location.origin).href);
watch(
  () => route.query.dialog,
  (v) => {
    if (v === "link") create.value = true;
  }
);
async function save() {
  if (!doc.value) return;
  saving.value = true;
  try {
    await delay();
    if (!title.value.trim()) throw Error("Add a title.");
    doc.value.title = title.value.trim();
    doc.value.description = description.value;
    doc.value.images = images.value.map((i) => ({ ...i }));
    doc.value.updatedAt = state.now;
    notify("Publication updated");
    router.push(base.value);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}
function reorder(i: number, direction: number) {
  const next = i + direction;
  if (next < 0 || next >= images.value.length) return;
  const [item] = images.value.splice(i, 1);
  if (item) images.value.splice(next, 0, item);
}
async function claim() {
  if (!doc.value) return;
  if (!currentUser()) {
    router.push({ path: "/sign-in", query: { return: base.value + "/claim" } });
    return;
  }
  try {
    await delay();
    const d = claimDocument(String(route.params.token), currentUser()!.id);
    notify("Publication added to your library");
    router.push("/app/documents/" + d.id);
  } catch (e) {
    error.value = (e as Error).message;
  }
  claimConfirm.value = false;
}
function remove() {
  if (doc.value) {
    deleteDocument(doc.value.id);
    notify("Publication deleted");
    router.push(managed.value ? "/" : "/app/library");
  }
}
function saved(link: SharingLink) {
  create.value = false;
  editLink.value = undefined;
  copyLink("/share/" + link.token);
}
function relink(event: Event) {
  const chosen = Array.from((event.target as HTMLInputElement).files || []);
  if (doc.value && chosen.length) {
    const d = doc.value;
    const valid =
      d.format === "pdf"
        ? chosen.length === 1 && chosen[0]?.name.toLowerCase().endsWith(".pdf")
        : d.format === "epub"
        ? chosen.length === 1 && chosen[0]?.name.toLowerCase().endsWith(".epub")
        : chosen.length === d.images.length &&
          chosen.every((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    if (!valid) {
      error.value =
        "Choose the original publication file, or the same number of album images in their original order.";
      return;
    }
    registerFiles(d.id, chosen);
    notify("File available for this session");
  }
}
function downloadManagement() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([
      "Framashare management link\n" + managementUrl.value + "\nKeep this link private.",
    ])
  );
  a.download = "framashare-management-link.txt";
  a.click();
  URL.revokeObjectURL(a.href);
  notify("Management link saved");
}
</script>
<template>
  <div class="page">
    <div v-if="!doc" class="card empty">
      <BookOpen :size="36" />
      <h1>Management unavailable</h1>
      <p class="muted">
        This private link is invalid, expired or has already been used to add the
        publication to an account.
      </p>
      <p>
        Without the original management link, an anonymous publication cannot be
        recovered.
      </p>
      <RouterLink to="/upload" class="button">Upload a document</RouterLink>
    </div>
    <template v-else
      ><RouterLink :to="managed ? '/' : '/app/library'" class="row small back"
        ><ArrowLeft :size="16" />{{ managed ? "Home" : "Your library" }}</RouterLink
      >
      <div class="page-heading row between">
        <div class="document-heading">
          <h1>
            {{ editing ? "Edit details" : claiming ? "Add to your library" : doc.title }}
          </h1>
          <p class="muted">
            {{ doc.format.toUpperCase() }} · {{ formatSize(doc.size) }} · Updated
            {{ formatDate(doc.updatedAt) }}
          </p>
        </div>
        <UiMenu label="Document actions"
          ><RouterLink :to="base + '/read'">Open reader</RouterLink
          ><RouterLink :to="managed ? base + '?edit=1' : base + '/edit'"
            >Edit details</RouterLink
          ><RouterLink :to="managed ? base + '#links' : base + '/links'"
            >Manage links</RouterLink
          ><RouterLink
            v-if="links[0]"
            :to="
              '/share/' +
              links[0].token +
              '?preview=1' +
              (managed ? '&manage=' + route.params.token : '')
            "
            >Preview as recipient</RouterLink
          ><button @click="deleting = true">Delete publication</button></UiMenu
        >
      </div>
      <div v-if="managed" class="management-banner alert">
        <h3>Your private management link</h3>
        <p class="small">
          Keep this link private. Anyone with it can manage or delete this document.<br />Without
          this link, you cannot manage this document.
        </p>
        <div class="url" tabindex="0">{{ managementUrl }}</div>
        <div class="row wrap" style="margin-top: 12px">
          <button class="button secondary" @click="copyLink(base)">
            <Copy :size="16" />Copy management link</button
          ><button class="button secondary" @click="downloadManagement">
            <Download :size="16" />Save link</button
          ><RouterLink :to="base + '/claim'" class="button">Add to my library</RouterLink>
        </div>
        <p class="small muted" style="margin: 16px 0 0">
          Publication will be deleted {{ formatDate(doc.deleteAt) }}. Adding it to an
          account removes this deadline.
        </p>
      </div>
      <p v-if="error" class="alert error" role="alert">{{ error }}</p>
      <div v-if="claiming" class="card narrow stack">
        <h2>Keep this publication in your library</h2>
        <p>
          The anonymous storage deadline will be removed. This management link will stop
          working; your recipient links will stay the same.
        </p>
        <p v-if="!currentUser()">Sign in or create an account to continue.</p>
        <p v-else>Adding to {{ currentUser()?.name }}’s library.</p>
        <div class="row wrap">
          <RouterLink :to="base" class="button secondary">Back to management</RouterLink
          ><button
            class="button"
            @click="currentUser() ? (claimConfirm = true) : claim()"
          >
            {{ currentUser() ? "Add to my library" : "Sign in to continue" }}
          </button>
        </div>
      </div>
      <form v-else-if="editing" class="card narrow stack" @submit.prevent="save">
        <label class="field"
          >Title<input v-model="title" required maxlength="200" /></label
        ><label class="field"
          >Description<textarea v-model="description" maxlength="2000" /></label
        ><template v-if="doc.format === 'album'"
          ><h2>Album order and captions</h2>
          <p class="small muted">Drag an image to reorder it, or use the move buttons.</p>
          <div
            v-for="(image, i) in images"
            :key="image.id"
            class="album-edit"
            draggable="true"
            @dragstart="dragIndex = i"
            @dragover.prevent
            @drop.prevent="
              dragIndex !== null && reorder(dragIndex, i - dragIndex);
              dragIndex = null;
            "
          >
            <img
              :src="doc.seed ? image.src : files.get(doc.id)?.urls[Number(image.src)]"
              :alt="image.alt"
            />
            <div class="stack">
              <label class="field">Caption<input v-model="image.caption" /></label
              ><label class="field"
                >Alternative text<input v-model="image.alt" required
              /></label>
              <div class="row">
                <button
                  type="button"
                  class="button secondary"
                  :disabled="i === 0"
                  @click="reorder(i, -1)"
                >
                  Move up</button
                ><button
                  type="button"
                  class="button secondary"
                  :disabled="i === images.length - 1"
                  @click="reorder(i, 1)"
                >
                  Move down
                </button>
              </div>
            </div>
          </div></template
        >
        <div class="row">
          <RouterLink :to="base" class="button secondary">Cancel</RouterLink
          ><button class="button" :disabled="saving">
            {{ saving ? "Saving…" : "Save changes" }}
          </button>
        </div>
      </form>
      <template v-else
        ><div class="detail-layout">
          <div class="card preview-card">
            <PublicationCover :document="doc" /><span :class="['badge', doc.status]">{{
              doc.status
            }}</span>
            <h2>A little space to read</h2>
            <p class="muted">{{ doc.description || "No description added yet." }}</p>
            <RouterLink v-if="doc.status === 'ready'" :to="base + '/read'" class="button"
              ><BookOpen :size="18" />Open reader</RouterLink
            >
            <div v-else class="alert">
              <p>
                {{
                  doc.status === "processing"
                    ? "Your publication is being prepared."
                    : "Processing failed. You can try preparing this publication again."
                }}
              </p>
              <button
                class="button secondary"
                @click="
                  doc.status = 'ready';
                  notify('Publication prepared');
                "
              >
                {{ doc.status === "processing" ? "Check status" : "Retry processing" }}
              </button>
            </div>
            <div
              v-if="!doc.seed && !files.has(doc.id)"
              class="alert"
              style="margin-top: 16px"
            >
              The selected file is unavailable after reload.<label class="field"
                >Select file again<input
                  type="file"
                  :multiple="doc.format === 'album'"
                  @change="relink"
              /></label>
            </div>
            <RouterLink
              :to="managed ? base + '?edit=1' : base + '/edit'"
              class="button secondary"
              style="margin-top: 12px"
              >Edit details</RouterLink
            >
          </div>
          <section id="links" class="sharing-panel">
            <div class="row between" style="margin-bottom: 20px">
              <div>
                <h2 style="margin-bottom: 8px">Sharing links</h2>
                <p class="muted small" style="margin: 0">
                  Different doors to the same publication.
                </p>
              </div>
              <button class="button" @click="create = true">
                <Plus :size="16" />Create link
              </button>
            </div>
            <div v-if="!links.length" class="card empty">
              <Link :size="28" />
              <h3>No sharing links yet</h3>
              <p class="muted">Create a link with its own access rules.</p>
              <button class="button" @click="create = true">Create sharing link</button>
            </div>
            <article v-for="link in links" :key="link.id" class="link-row card">
              <div class="row between">
                <h3>{{ link.name }}</h3>
                <UiMenu
                  ><button @click="copyLink('/share/' + link.token)">Copy link</button
                  ><button @click="editLink = link">Edit link</button
                  ><RouterLink
                    :to="
                      '/share/' +
                      link.token +
                      '?preview=1' +
                      (managed ? '&manage=' + route.params.token : '')
                    "
                    >Preview</RouterLink
                  ><button v-if="!link.revoked" @click="revoke = link">
                    Revoke link
                  </button></UiMenu
                >
              </div>
              <span :class="['badge', linkDenial(link) ? 'failed' : 'ready']">{{
                linkDenial(link) || "✓ Active"
              }}</span>
              <p class="small muted">
                {{ link.password ? "Password required" : "No password" }} ·
                {{ formatDate(link.expiresAt) }}<br />{{ link.used }}
                {{ link.limit ? "of " + link.limit : "used · Unlimited" }} sessions ·
                Downloads {{ link.allowDownload ? "on" : "off" }}
              </p>
              <div class="url" tabindex="0">{{ fullUrl("/share/" + link.token) }}</div>
              <div class="row wrap" style="margin-top: 12px">
                <button
                  class="button secondary"
                  @click="copyLink('/share/' + link.token)"
                >
                  <Copy :size="15" />Copy link</button
                ><RouterLink
                  :to="
                    '/share/' +
                    link.token +
                    '?preview=1' +
                    (managed ? '&manage=' + route.params.token : '')
                  "
                  class="button ghost"
                  >Preview</RouterLink
                >
              </div>
            </article>
            <p class="small muted" style="margin: 20px 0">
              Session limits count successful starts, not page views. Expiring a link does
              not delete your publication.
            </p>
          </section>
        </div></template
      ><LinkEditor
        v-if="create || editLink"
        :document-id="doc.id"
        :link="editLink"
        @close="
          create = false;
          editLink = undefined;
        "
        @saved="saved"
      /><UiModal v-if="revoke" title="Revoke this link?" @close="revoke = undefined"
        ><p>
          New and active readers using “{{ revoke.name }}” will lose access. Other links
          will keep working.
        </p>
        <div class="actions">
          <button class="button secondary" @click="revoke = undefined">Cancel</button
          ><button
            class="button danger"
            @click="
              revoke.revoked = true;
              revoke = undefined;
              notify('Sharing link revoked');
            "
          >
            Revoke link
          </button>
        </div></UiModal
      ><UiModal v-if="deleting" title="Delete publication?" @close="deleting = false"
        ><p>
          The publication and all its links will become unavailable. This cannot be
          undone.
        </p>
        <div class="actions">
          <button class="button secondary" @click="deleting = false">Cancel</button
          ><button class="button danger" @click="remove">Delete publication</button>
        </div></UiModal
      ><UiModal
        v-if="claimConfirm"
        title="Add to your library?"
        @close="claimConfirm = false"
        ><p>
          Your private management link will stop working. All recipient links will remain
          available.
        </p>
        <div class="actions">
          <button class="button secondary" @click="claimConfirm = false">Cancel</button
          ><button class="button" @click="claim">Add publication</button>
        </div></UiModal
      ></template
    >
  </div>
</template>
<style scoped>
.back {
  margin-bottom: 28px;
}
.document-heading {
  min-width: 0;
  max-width: 850px;
}
.document-heading h1 {
  overflow-wrap: anywhere;
  font-size: 36px;
}
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
  gap: 40px;
}
.preview-card {
  align-self: start;
}
.preview-card :deep(.cover) {
  height: 290px;
  margin-bottom: 24px;
}
.preview-card > .badge {
  margin-bottom: 20px;
}
.preview-card > .button {
  display: flex;
}
.link-row {
  margin-bottom: 16px;
  padding: 20px;
}
.link-row h3 {
  margin: 0;
  overflow-wrap: anywhere;
}
.link-row > .badge {
  margin-top: 12px;
}
.link-row p {
  line-height: 1.8;
  margin: 12px 0;
}
.management-banner {
  margin-bottom: 32px;
  padding: 24px;
}
.management-banner h3 {
  margin-bottom: 12px;
}
.album-edit {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}
.album-edit img {
  cursor: grab;
  height: 100px;
  width: 100px;
  object-fit: cover;
  border-radius: 8px;
}
.album-edit .stack {
  gap: 12px;
}
@media (max-width: 800px) {
  .detail-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .preview-card :deep(.cover) {
    height: 240px;
  }
  .sharing-panel > .row {
    flex-wrap: wrap;
    gap: 16px;
  }
  .document-heading h1 {
    font-size: 30px;
  }
  .management-banner {
    padding: 16px;
  }
  .album-edit {
    grid-template-columns: 1fr;
  }
  .album-edit img {
    width: 100%;
    height: 180px;
  }
  .page-heading :deep(.dropdown) {
    margin-top: 8px;
  }
}
</style>
