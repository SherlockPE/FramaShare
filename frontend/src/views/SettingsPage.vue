<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { User, Lock, HardDrive, LogOut, Trash2, Eye, EyeOff } from "lucide-vue-next";
import UiModal from "../components/UiModal.vue";
import {
  state,
  currentUser,
  usage,
  formatSize,
  delay,
  notify,
  deleteDocument,
} from "../services/store";
const route = useRoute(),
  router = useRouter(),
  user = computed(currentUser),
  section = computed(() => String(route.params.section)),
  name = ref(user.value?.name || ""),
  email = ref(user.value?.email || ""),
  oldPassword = ref(""),
  password = ref(""),
  confirm = ref(""),
  show = ref(false),
  busy = ref(false),
  error = ref(""),
  deleting = ref(false),
  deletionText = ref("");
const used = computed(() => (user.value ? usage(user.value.id) : 0)),
  percent = computed(() => Math.min(100, (used.value / (user.value?.quota || 1)) * 100)),
  documents = computed(() =>
    state.documents
      .filter(
        (d) => d.ownerId === user.value?.id && !["deleted", "removed"].includes(d.status)
      )
      .sort((a, b) => b.size - a.size)
  ),
  initials = computed(() =>
    user.value?.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
  );
async function saveProfile() {
  error.value = "";
  if (!name.value.trim()) {
    error.value = "Enter your name.";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = "Enter a valid email address.";
    return;
  }
  if (
    state.accounts.some(
      (a) => a.id !== user.value?.id && a.email === email.value.trim().toLowerCase()
    )
  ) {
    error.value = "This email address belongs to another account.";
    return;
  }
  busy.value = true;
  try {
    await delay();
    if (user.value) {
      user.value.name = name.value.trim();
      user.value.email = email.value.trim().toLowerCase();
      notify("Profile saved");
    }
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
async function savePassword() {
  error.value = "";
  if (oldPassword.value.length < 8) {
    error.value = "Enter your current password (at least 8 characters in this demo).";
    return;
  }
  if (password.value.length < 8) {
    error.value = "Use at least 8 characters for your new password.";
    return;
  }
  if (password.value !== confirm.value) {
    error.value = "The new passwords do not match.";
    return;
  }
  busy.value = true;
  try {
    await delay();
    oldPassword.value = "";
    password.value = "";
    confirm.value = "";
    notify("Password change simulated");
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
function logout() {
  state.currentUserId = null;
  notify("Signed out");
  router.push("/sign-in");
}
async function deleteAccount() {
  if (deletionText.value !== "DELETE" || !user.value) return;
  busy.value = true;
  try {
    await delay();
    const id = user.value.id;
    state.documents.filter((d) => d.ownerId === id).forEach((d) => deleteDocument(d.id));
    state.accounts = state.accounts.filter((a) => a.id !== id);
    state.currentUserId = null;
    deleting.value = false;
    notify("Account and its publications deleted");
    router.push("/");
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="page settings-page">
    <header class="page-heading">
      <h1>Account settings</h1>
      <p class="muted">A few things that make this space yours.</p>
    </header>
    <div class="settings-layout">
      <nav class="settings-nav" aria-label="Account settings">
        <RouterLink to="/app/settings/profile"><User :size="18" />Profile</RouterLink
        ><RouterLink to="/app/settings/security"><Lock :size="18" />Security</RouterLink
        ><RouterLink to="/app/settings/storage"
          ><HardDrive :size="18" />Storage</RouterLink
        >
      </nav>
      <div class="settings-content">
        <section v-if="section === 'profile'" class="card">
          <h2>Your profile</h2>
          <div class="avatar-row">
            <span class="avatar">{{ initials }}</span>
            <div>
              <strong>{{ user?.name }}</strong>
              <p class="muted small">Your avatar uses your initials.</p>
            </div>
          </div>
          <form class="stack" @submit.prevent="saveProfile" novalidate>
            <label class="field">Name<input v-model="name" autocomplete="name" /></label
            ><label class="field"
              >Email address<input
                aria-label="Email address"
                v-model="email"
                type="email"
                autocomplete="email"
              /><small>This is the address you use to sign in.</small></label
            >
            <p v-if="error" class="alert error" role="alert">{{ error }}</p>
            <div>
              <button class="button" :disabled="busy">
                {{ busy ? "Saving…" : "Save changes" }}
              </button>
            </div>
          </form>
        </section>
        <template v-else-if="section === 'security'"
          ><section class="card">
            <div class="row between">
              <h2>Change password</h2>
              <button
                class="icon-button"
                :aria-label="show ? 'Hide passwords' : 'Show passwords'"
                @click="show = !show"
              >
                <EyeOff v-if="show" :size="18" /><Eye v-else :size="18" />
              </button>
            </div>
            <form class="stack" @submit.prevent="savePassword" novalidate>
              <label class="field"
                >Current password<input
                  v-model="oldPassword"
                  :type="show ? 'text' : 'password'"
                  autocomplete="current-password" /></label
              ><label class="field"
                >New password<input
                  aria-label="New password"
                  v-model="password"
                  :type="show ? 'text' : 'password'"
                  autocomplete="new-password"
                /><small>Use at least 8 characters.</small></label
              ><label class="field"
                >Confirm new password<input
                  v-model="confirm"
                  :type="show ? 'text' : 'password'"
                  autocomplete="new-password"
              /></label>
              <p v-if="error && !deleting" class="alert error" role="alert">
                {{ error }}
              </p>
              <div>
                <button class="button" :disabled="busy">
                  {{ busy ? "Saving…" : "Change password" }}
                </button>
              </div>
            </form>
          </section>
          <section class="card">
            <h2>Your session</h2>
            <p class="muted">
              Sign out of this browser. Your publications stay in your library.
            </p>
            <button class="button secondary" @click="logout">
              <LogOut :size="16" />Sign out
            </button>
          </section>
          <section class="card danger-zone">
            <h2>Delete account</h2>
            <p class="muted">
              Permanently delete this account and all of its publications. Every sharing
              link to those publications will stop working.
            </p>
            <button
              class="button secondary error"
              @click="
                deleting = true;
                error = '';
              "
            >
              Delete account
            </button>
          </section></template
        ><template v-else-if="section === 'storage'"
          ><section class="card">
            <h2>Your storage</h2>
            <div class="row between storage-heading">
              <strong>{{ formatSize(used) }}</strong
              ><span class="muted small">of {{ formatSize(user?.quota || 0) }}</span>
            </div>
            <progress
              :value="percent"
              max="100"
              :aria-label="`${percent.toFixed(1)}% of storage used`"
            />
            <p class="small muted">
              {{ percent.toFixed(1) }}% used. Deleting a publication frees its space.
            </p>
            <p v-if="used >= (user?.quota || Infinity)" class="alert error">
              Your storage is full. Remove a publication before uploading another one.
            </p>
          </section>
          <section class="card">
            <h2>Largest publications</h2>
            <div v-if="!documents.length" class="empty">
              <h3>Your library has room to grow.</h3>
              <RouterLink class="button" to="/upload">Upload a document</RouterLink>
            </div>
            <RouterLink
              v-for="d in documents"
              :key="d.id"
              :to="`/app/documents/${d.id}`"
              class="storage-item"
              ><span class="format-tag">{{ d.format.toUpperCase() }}</span
              ><span class="storage-title"
                >{{ d.title
                }}<small class="muted">Open publication to manage or delete</small></span
              ><span class="small">{{ formatSize(d.size) }}</span></RouterLink
            >
          </section></template
        >
        <section v-else class="card">
          <h2>Choose a setting</h2>
          <RouterLink to="/app/settings/profile" class="button">Open profile</RouterLink>
        </section>
      </div>
    </div>
    <UiModal v-if="deleting" title="Delete your account?" @close="deleting = false"
      ><p>
        This permanently deletes <strong>{{ documents.length }} publications</strong> and
        stops all their sharing links. Readers will lose access.
      </p>
      <p class="muted small">
        This action is a local simulation and cannot be undone without resetting the demo.
      </p>
      <label class="field"
        >Type DELETE to confirm<input v-model="deletionText" autocomplete="off"
      /></label>
      <p v-if="error" class="alert error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="button secondary" @click="deleting = false">Cancel</button
        ><button
          class="button danger"
          :disabled="deletionText !== 'DELETE' || busy"
          @click="deleteAccount"
        >
          <Trash2 :size="16" />{{ busy ? "Deleting…" : "Delete account" }}
        </button>
      </div></UiModal
    >
  </div>
</template>
<style scoped>
.settings-page {
  max-width: 1080px;
}
.settings-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 64px;
}
.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.settings-nav a {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--secondary);
}
.settings-nav .router-link-exact-active {
  background: #e8ebe4;
  color: var(--text);
}
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.settings-content .card {
  padding: 32px;
}
.avatar-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin: 28px 0;
}
.avatar-row p {
  margin: 6px 0 0;
}
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e4e9df;
  border: 1px solid #cfd7c9;
  font-size: 23px;
}
.danger-zone {
  border-color: #e3ccc6;
}
.storage-heading {
  margin: 28px 0 14px;
}
.storage-heading strong {
  font-size: 30px;
  font-weight: 500;
}
.storage-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid var(--border);
}
.format-tag {
  font-size: 11px;
  min-width: 47px;
  padding: 8px 4px;
  background: var(--muted);
  border-radius: 4px;
  text-align: center;
}
.storage-title {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 14px;
}
.storage-title small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
}
.storage-item > .small {
  flex-shrink: 0;
}
.settings-content .row h2 {
  margin-bottom: 0;
}
.settings-content .row + form {
  margin-top: 24px;
}
@media (max-width: 800px) {
  .settings-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .settings-nav {
    flex-direction: row;
    border-bottom: 1px solid var(--border);
    overflow: auto;
  }
  .settings-nav a {
    flex: 1;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
  }
  .settings-content .card {
    padding: 24px;
  }
}
@media (max-width: 420px) {
  .settings-nav a {
    padding: 12px 8px;
  }
  .settings-content .card {
    padding: 20px;
  }
  .storage-item {
    gap: 10px;
  }
  .storage-title small {
    display: none;
  }
}
</style>
