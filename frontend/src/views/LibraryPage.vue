<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  BookOpen,
  SlidersHorizontal,
  ArrowUpDown,
} from "@lucide/vue";
import UiMenu from "../components/UiMenu.vue";
import UiModal from "../components/UiModal.vue";
import PublicationCover from "../components/PublicationCover.vue";
import {
  state,
  currentUser,
  usage,
  formatSize,
  formatDate,
  deleteDocument,
  notify,
  refreshLibrary,
} from "../services/store";
import type { Publication } from "../services/store";
const router = useRouter(),
  route = useRoute();
const query = ref(String(route.query.search || "")),
  format = ref("all"),
  status = ref("all"),
  sort = ref("recent"),
  view = ref(route.query.view === "list" ? "list" : "grid"),
  deleting = ref<Publication>();
const user = computed(currentUser);
const used = computed(() => usage(user.value?.id || ""));
const all = computed(() =>
  state.documents.filter(
    (d) => d.ownerId === user.value?.id && !["deleted", "removed"].includes(d.status)
  )
);
const docs = computed(() => {
  if (route.query.state === "empty") return [];
  return all.value
    .filter(
      (d) =>
        d.title.toLowerCase().includes(query.value.toLowerCase()) &&
        (format.value === "all" || format.value === d.format) &&
        (status.value === "all" || status.value === d.status)
    )
    .sort((a, b) =>
      sort.value === "title"
        ? a.title.localeCompare(b.title)
        : sort.value === "updated"
        ? b.updatedAt - a.updatedAt
        : b.createdAt - a.createdAt
    );
});
async function remove() {
  if (deleting.value) {
    try { await deleteDocument(deleting.value.id); } catch (e) { notify((e as Error).message); return; }
    notify("Publication deleted");
    deleting.value = undefined;
  }
}
function preview(d: Publication) {
  const link = state.links.find((l) => l.documentId === d.id);
  if (link) router.push("/share/" + link.token + "?preview=1");
  else router.push("/app/documents/" + d.id + "/read");
}
</script>
<template>
  <div class="page library">
    <div class="page-heading row between">
      <div>
        <h1>Your library</h1>
        <p class="muted">A home for the things you share.</p>
      </div>
      <RouterLink to="/upload" class="button"
        ><Plus :size="18" /> Upload a document</RouterLink
      >
    </div>
    <div class="storage row between">
      <span class="small muted"
        >{{ formatSize(used) }} of {{ formatSize(user?.quota || 0) }} used</span
      ><RouterLink to="/app/settings/storage" class="small">Manage storage</RouterLink
      ><progress :value="used" :max="user?.quota || 1" aria-label="Storage used" />
    </div>
    <div
      v-if="used >= (user?.quota || 1) || route.query.state === 'quota'"
      class="alert error"
    >
      Your storage is full. Remove a publication or ask your administrator for more space.
    </div>
    <div class="library-controls row wrap">
      <label class="search-box"
        ><Search :size="18" /><input
          v-model="query"
          placeholder="Search your library"
          aria-label="Search your library" /></label
      ><UiMenu label="Filters"
        ><div class="filter-fields" @click.stop>
          <label class="field"
            >Format<select v-model="format">
              <option value="all">All formats</option>
              <option value="pdf">PDF</option>
              <option value="epub">EPUB</option>
              <option value="album">Album</option>
            </select></label
          ><label class="field"
            >Status<select v-model="status">
              <option value="all">All statuses</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select></label
          ><button
            class="button secondary"
            @click="
              format = 'all';
              status = 'all';
            "
          >
            Clear filters
          </button>
        </div></UiMenu
      ><UiMenu label="Sort"
        ><button @click="sort = 'recent'">
          Recently added {{ sort === "recent" ? "✓" : "" }}</button
        ><button @click="sort = 'updated'">
          Recently updated {{ sort === "updated" ? "✓" : "" }}</button
        ><button @click="sort = 'title'">
          Title A–Z {{ sort === "title" ? "✓" : "" }}
        </button></UiMenu
      >
      <div class="segmented">
        <button
          :class="{ active: view === 'grid' }"
          aria-label="Grid view"
          :aria-pressed="view === 'grid'"
          @click="view = 'grid'"
        >
          <LayoutGrid :size="18" /></button
        ><button
          :class="{ active: view === 'list' }"
          aria-label="List view"
          :aria-pressed="view === 'list'"
          @click="view = 'list'"
        >
          <List :size="18" />
        </button>
      </div>
    </div>
    <div class="row between results">
      <p class="small muted">
        {{ docs.length }} publications<span v-if="format !== 'all' || status !== 'all'">
          · Filters applied</span
        >
      </p>
      <button
        v-if="query || format !== 'all' || status !== 'all'"
        class="button ghost"
        @click="
          query = '';
          format = 'all';
          status = 'all';
        "
      >
        Clear search and filters
      </button>
    </div>
    <div v-if="route.query.state === 'loading'" class="card empty" role="status">
      Loading your library…
      <RouterLink to="/app/library" class="button secondary">Retry</RouterLink>
    </div>
    <div v-else-if="!docs.length" class="card empty">
      <BookOpen :size="36" />
      <h2>
        {{
          all.length && route.query.state !== "empty"
            ? "No matching publications"
            : "Your next chapter starts here"
        }}
      </h2>
      <p class="muted">
        {{
          all.length && route.query.state !== "empty"
            ? "Try a different search or clear your filters."
            : "Upload a PDF, EPUB or collection of images to share."
        }}
      </p>
      <button
        v-if="all.length && route.query.state !== 'empty'"
        class="button secondary"
        @click="
          query = '';
          format = 'all';
          status = 'all';
        "
      >
        Clear filters</button
      ><RouterLink v-else to="/upload" class="button">Upload a document</RouterLink>
    </div>
    <div v-else :class="view === 'grid' ? 'grid' : 'document-list'">
      <article
        v-for="d in docs"
        :key="d.id"
        :class="['publication', view === 'grid' ? 'card' : 'publication-row']"
      >
        <RouterLink :to="'/app/documents/' + d.id" class="publication-cover"
          ><PublicationCover :document="d"
        /></RouterLink>
        <div class="publication-info">
          <div class="row between">
            <span class="mono"
              >{{ d.format.toUpperCase() }} · {{ formatSize(d.size) }}</span
            ><UiMenu :label="undefined"
              ><RouterLink :to="'/app/documents/' + d.id">Open</RouterLink
              ><RouterLink :to="'/app/documents/' + d.id + '/edit'"
                >Edit details</RouterLink
              ><RouterLink :to="'/app/documents/' + d.id + '/links'"
                >Manage links</RouterLink
              ><button @click="preview(d)">Preview as recipient</button
              ><button class="error" @click="deleting = d">Delete</button></UiMenu
            >
          </div>
          <RouterLink :to="'/app/documents/' + d.id"
            ><h3>{{ d.title }}</h3></RouterLink
          >
          <div class="row between">
            <span :class="['badge', d.status]">{{
              d.status === "ready"
                ? "✓ Ready"
                : d.status === "failed"
                ? "! Failed"
                : d.status === "deleting"
                ? "Deletion pending — retry delete"
                : "◷ Processing"
            }}</span
            ><span class="small muted"
              >{{
                state.links.filter((l) => l.documentId === d.id && !l.revoked).length
              }}
              links</span
            >
          </div>
          <RouterLink
            v-if="d.position > 1 && d.status === 'ready'"
            :to="'/app/documents/' + d.id + '/read'"
            class="resume"
            >Resume reading</RouterLink
          >
        </div>
      </article>
    </div>
    <UiModal v-if="deleting" title="Delete publication?" @close="deleting = undefined"
      ><p>
        “{{ deleting.title }}” and all its sharing links will become unavailable. This
        cannot be undone.
      </p>
      <div class="actions">
        <button class="button secondary" @click="deleting = undefined">Cancel</button
        ><button class="button danger" @click="remove">Delete publication</button>
      </div></UiModal
    >
  </div>
</template>
<style scoped>
.storage {
  flex-wrap: wrap;
  max-width: 400px;
  margin-bottom: 32px;
}
.storage progress {
  flex-basis: 100%;
  height: 5px;
}
.library-controls {
  padding: 20px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 220px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  padding: 0 14px;
}
.search-box input {
  border: 0;
  background: none;
  width: 100%;
  min-height: 44px;
  outline-offset: 0;
}
.results {
  margin: 16px 0;
}
.results p {
  margin: 0;
}
.publication {
  padding: 12px;
}
.publication-info {
  padding: 12px 8px;
}
.publication h3 {
  font-size: 19px;
  margin: 12px 0 24px;
  line-height: 1.35;
  overflow-wrap: anywhere;
  min-height: 50px;
}
.publication-info .row .dropdown :deep(.button) {
  min-height: 32px;
  padding: 0 9px;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.filter-fields {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.document-list {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}
.publication-row {
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid var(--border);
  padding: 20px;
}
.publication-row:last-child {
  border-bottom: 0;
}
.publication-row .publication-cover {
  width: 120px;
  flex-shrink: 0;
}
.publication-row :deep(.cover) {
  height: 130px;
}
.publication-row :deep(.cover-book) {
  transform: scale(0.7);
}
.publication-row .publication-info {
  flex: 1;
  min-width: 0;
}
.publication-row h3 {
  min-height: 0;
  margin: 8px 0 16px;
}
.resume {
  display: block;
  font-size: 13px;
  margin-top: 14px;
  text-decoration: underline;
}
@media (max-width: 600px) {
  .library-controls .search-box {
    flex-basis: 100%;
  }
  .library-controls {
    gap: 8px;
  }
  .publication-row {
    gap: 12px;
    padding: 12px;
  }
  .publication-row .publication-cover {
    width: 75px;
  }
  .publication-row :deep(.cover) {
    height: 104px;
  }
  .publication-row h3 {
    font-size: 17px;
  }
  .library-controls > .segmented {
    margin-left: auto;
  }
  .results {
    min-height: 32px;
  }
  .results .button {
    font-size: 12px;
    max-width: 145px;
  }
}
</style>
