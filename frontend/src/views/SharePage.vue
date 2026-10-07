<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BookOpen, LockKeyhole, Eye, EyeOff, Link2Off } from "@lucide/vue";
import {
  state,
  currentUser,
  getDocument,
  getManaged,
  linkDenial,
  activeSession,
  startSession,
  delay,
  formatSize,
  formatDate,
} from "../services/store";
const route = useRoute(),
  router = useRouter(),
  password = ref(""),
  show = ref(false),
  busy = ref(false),
  error = ref("");
const token = computed(() => String(route.params.token));
const link = computed(() => state.links.find((l) => l.token === token.value));
const publication = computed(() =>
  link.value ? getDocument(link.value.documentId) : undefined
);
const preview = computed(
  () =>
    route.query.preview === "1" &&
    !!publication.value &&
    (publication.value.ownerId === currentUser()?.id ||
      !!(
        route.query.manage &&
        getManaged(String(route.query.manage))?.id === publication.value.id
      ))
);
const denial = computed(() =>
  preview.value ? null : linkDenial(link.value, !!activeSession(token.value))
);
const privateGate = computed(
  () => !!link.value?.password && !preview.value && !activeSession(token.value)
);
async function start() {
  busy.value = true;
  error.value = "";
  try {
    await delay();
    if (!preview.value) startSession(token.value, password.value);
    await router.push({
      path: `/share/${token.value}/read`,
      query: preview.value ? route.query : {},
    });
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section class="access-page">
    <div class="access-card card">
      <template v-if="denial"
        ><Link2Off :size="40" stroke-width="1.3" />
        <h1>{{ denial }}</h1>
        <p class="muted">
          This link cannot open a publication right now. Ask the person who shared it for
          a new link.
        </p>
        <RouterLink to="/help/sharing-links" class="button secondary"
          >Help with access</RouterLink
        ></template
      ><template v-else
        ><div class="gate-symbol">
          <LockKeyhole v-if="privateGate" :size="32" stroke-width="1.4" /><BookOpen
            v-else
            :size="32"
            stroke-width="1.4"
          />
        </div>
        <p v-if="preview" class="badge">Author preview · no reading session used</p>
        <template v-if="privateGate"
          ><h1>A little privacy,<br />a shared read.</h1>
          <p class="muted">
            This publication is protected. Enter the password from the person who shared
            this link.
          </p></template
        ><template v-else
          ><span class="badge"
            >{{ publication?.format.toUpperCase() }} ·
            {{ formatSize(publication?.size || 0) }}</span
          >
          <h1>{{ publication?.title }}</h1>
          <p class="muted">{{ publication?.description }}</p></template
        >
        <form class="stack" @submit.prevent="start">
          <label v-if="privateGate" class="field"
            >Password
            <div class="password-row">
              <input
                v-model="password"
                :type="show ? 'text' : 'password'"
                required
                autocomplete="current-password"
                :aria-invalid="!!error"
                aria-describedby="access-error"
                autofocus
              /><button
                type="button"
                class="icon-button"
                :aria-label="show ? 'Hide password' : 'Show password'"
                @click="show = !show"
              >
                <EyeOff v-if="show" :size="18" /><Eye v-else :size="18" />
              </button></div
          ></label>
          <p v-if="error" id="access-error" class="alert error" role="alert">
            {{ error }}
          </p>
          <button class="button" :disabled="busy">
            {{
              busy
                ? "Opening…"
                : activeSession(token)
                ? "Continue reading"
                : "Start reading"
            }}
          </button>
        </form>
        <p class="small muted gate-note">
          {{
            preview
              ? "Explore the recipient experience. Your preview does not count toward the link’s session limit."
              : "No account needed. A reading session lasts up to 60 minutes."
          }}
        </p>
        <div v-if="!privateGate" class="gate-rules">
          <span v-if="link?.expiresAt"
            >Available until {{ formatDate(link.expiresAt) }}</span
          ><span>{{
            link?.allowDownload
              ? "Download available"
              : "Reading only · download is disabled"
          }}</span
          ><span v-if="!link?.allowDownload"
            >Disabling download does not prevent copying.</span
          >
        </div></template
      >
    </div>
    <p class="small muted">Shared with Framashare. Space for a good read.</p>
  </section>
</template>
<style scoped>
.access-page {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px 48px;
}
.access-card {
  width: 470px;
  max-width: 100%;
  padding: 40px;
  text-align: center;
}
.gate-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  border-radius: 16px;
  background: #e7ebe3;
}
.access-card h1 {
  font-size: 32px;
  letter-spacing: -1px;
  margin: 24px 0 16px;
  overflow-wrap: anywhere;
}
.access-card form {
  text-align: left;
  margin-top: 28px;
}
.password-row {
  display: flex;
  gap: 8px;
}
.password-row input {
  min-width: 0;
  flex: 1;
}
.password-row button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.gate-note {
  margin: 20px 0 0;
}
.gate-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--border);
  margin-top: 24px;
  padding-top: 20px;
  font-size: 12px;
  color: var(--secondary);
}
.access-page > p {
  margin-top: 24px;
}
@media (max-width: 480px) {
  .access-page {
    padding: 36px 16px;
  }
  .access-card {
    padding: 28px 22px;
  }
  .access-card h1 {
    font-size: 28px;
  }
}
</style>
