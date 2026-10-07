<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BookOpen, Menu, X, Upload, Library, Shield, UserRound } from "lucide-vue-next";
import UiMenu from "./components/UiMenu.vue";
import { currentUser, state, ui, notify } from "./services/store";
const route = useRoute(),
  router = useRouter(),
  mobile = ref(false);
const user = computed(currentUser);
const isReader = computed(() => route.path.endsWith("/read"));
watch(
  () => route.fullPath,
  () => (mobile.value = false)
);
function key(e: KeyboardEvent) {
  if (e.key === "Escape") mobile.value = false;
}
onMounted(() => document.addEventListener("keydown", key));
onBeforeUnmount(() => document.removeEventListener("keydown", key));
function logout() {
  state.currentUserId = null;
  notify("Signed out");
  router.push("/");
}
</script>
<template>
  <template v-if="!isReader"
    ><header class="site-header">
      <RouterLink to="/" class="brand"
        ><BookOpen :size="23" stroke-width="1.5" />Framashare</RouterLink
      >
      <nav class="desktop-nav" aria-label="Main navigation">
        <template v-if="route.path.startsWith('/app') || route.path.startsWith('/admin')"
          ><RouterLink to="/app/library"><Library :size="16" /> Library</RouterLink
          ><RouterLink v-if="user?.role === 'admin'" to="/admin/reports"
            ><Shield :size="16" /> Administration</RouterLink
          ><RouterLink to="/help">Help</RouterLink></template
        ><template v-else
          ><RouterLink to="/how-it-works">How it works</RouterLink
          ><RouterLink to="/help">Help</RouterLink
          ><RouterLink to="/about">About</RouterLink></template
        >
      </nav>
      <div class="row header-actions">
        <UiMenu v-if="user" :label="user.name.split(' ')[0]"
          ><template #trigger
            ><UserRound class="profile-avatar" :size="18" /><span class="profile-name">{{
              user.name.split(" ")[0]
            }}</span></template
          ><RouterLink to="/app/library">My library</RouterLink
          ><RouterLink to="/app/settings/profile">Account settings</RouterLink
          ><RouterLink to="/help">Help</RouterLink
          ><button @click="logout">Sign out</button></UiMenu
        ><RouterLink v-else to="/sign-in" class="sign-in">Sign in</RouterLink
        ><RouterLink to="/upload" class="button"
          ><Upload :size="16" /><span>Upload</span></RouterLink
        ><button
          class="icon-button mobile-toggle"
          :aria-label="mobile ? 'Close navigation' : 'Open navigation'"
          :aria-expanded="mobile"
          @click="mobile = !mobile"
        >
          <X v-if="mobile" :size="20" /><Menu v-else :size="20" />
        </button>
      </div>
    </header>
    <nav v-if="mobile" class="mobile-nav" aria-label="Mobile navigation">
      <RouterLink to="/how-it-works">How it works</RouterLink
      ><RouterLink to="/help">Help</RouterLink><RouterLink to="/about">About</RouterLink
      ><RouterLink :to="user ? '/app/library' : '/sign-in'">{{
        user ? "My library" : "Sign in"
      }}</RouterLink
      ><RouterLink v-if="user" to="/app/settings/profile">Settings</RouterLink
      ><RouterLink to="/overview">Prototype overview</RouterLink>
    </nav></template
  >
  <main id="main">
    <RouterView :key="route.path.startsWith('/upload') ? 'upload' : route.path" />
  </main>
  <footer v-if="!isReader" class="site-footer">
    <RouterLink to="/" class="brand"><BookOpen :size="20" />Framashare</RouterLink>
    <p class="muted small">A little space for shared reading.</p>
    <div class="row wrap">
      <RouterLink to="/privacy">Privacy</RouterLink
      ><RouterLink to="/terms">Terms</RouterLink><RouterLink to="/help">Help</RouterLink
      ><RouterLink to="/overview">Prototype overview</RouterLink>
    </div>
  </footer>
  <div v-if="ui.toast" class="toast" role="status">{{ ui.toast }}</div>
  <div v-if="ui.storageError" class="storage-notice alert" role="alert">
    Local storage is unavailable. You can continue in memory; changes will be lost on
    reload.
    <button class="button secondary" @click="ui.storageError = false">
      Continue in memory
    </button>
  </div>
</template>
<style scoped>
.site-header {
  height: 88px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
  gap: 32px;
  background: var(--canvas);
}
.brand {
  font-size: 25px;
  font-weight: 500;
  letter-spacing: -0.8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-left: auto;
  font-size: 14px;
}
.desktop-nav a {
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-actions {
  margin-left: 16px;
  gap: 20px;
}
.sign-in {
  font-size: 14px;
}
.mobile-toggle,
.profile-avatar {
  display: none;
}
.mobile-nav {
  position: fixed;
  inset: 88px 0 0;
  background: var(--surface);
  z-index: 90;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  font-size: 28px;
  overflow: auto;
}
.site-footer {
  max-width: 1200px;
  margin: auto;
  padding: 40px 32px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}
.site-footer p {
  margin: 0;
  margin-right: auto;
}
.site-footer .row {
  gap: 20px;
  font-size: 13px;
}
.storage-notice {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 300;
  max-width: 400px;
}
@media (max-width: 800px) {
  .site-header {
    padding: 0 20px;
    gap: 12px;
    height: 76px;
  }
  .brand {
    font-size: 22px;
  }
  .desktop-nav,
  .sign-in {
    display: none;
  }
  .header-actions {
    margin-left: auto;
    gap: 8px;
  }
  .header-actions :deep(.dropdown > .button) {
    min-width: 44px;
    padding: 10px;
  }
  .header-actions :deep(.dropdown > .button > span),
  .profile-name {
    display: none;
  }
  .profile-avatar {
    display: block;
  }
  .mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mobile-nav {
    top: 76px;
  }
  .site-footer {
    padding: 32px 20px;
  }
  .site-footer .brand {
    width: 100%;
  }
}
@media (max-width: 360px) {
  .site-header {
    padding: 0 12px;
  }
  .brand {
    font-size: 19px;
    gap: 6px;
  }
  .brand svg {
    width: 18px;
  }
  .header-actions .button {
    padding: 10px;
  }
  .header-actions .button svg {
    display: none;
  }
  .header-actions :deep(.dropdown > .button) {
    padding: 10px 8px;
  }
}
</style>
