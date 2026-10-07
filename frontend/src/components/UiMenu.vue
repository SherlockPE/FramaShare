<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from "vue";
defineProps<{ label?: string }>();
const open = ref(false),
  root = ref<HTMLElement>(),
  offset = ref(0),
  above = ref(false);
async function toggle() {
  open.value = !open.value;
  offset.value = 0;
  above.value = false;
  if (!open.value) return;
  await nextTick();
  const panel = root.value?.querySelector<HTMLElement>(".dropdown-panel");
  if (!panel) return;
  const bounds = panel.getBoundingClientRect();
  offset.value =
    bounds.left < 12
      ? 12 - bounds.left
      : bounds.right > innerWidth - 12
      ? innerWidth - 12 - bounds.right
      : 0;
  above.value =
    bounds.bottom > innerHeight - 12 &&
    (root.value?.getBoundingClientRect().top || 0) > bounds.height + 12;
}
function close(e: Event) {
  if (!open.value) return;
  if (e instanceof KeyboardEvent && e.key !== "Escape") return;
  if (e instanceof MouseEvent && root.value?.contains(e.target as Node)) return;
  open.value = false;
  if (e instanceof KeyboardEvent) root.value?.querySelector("button")?.focus();
}
onMounted(() => {
  document.addEventListener("click", close);
  document.addEventListener("keydown", close);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", close);
  document.removeEventListener("keydown", close);
});
</script>
<template>
  <div ref="root" class="dropdown">
    <button
      class="button secondary"
      :aria-label="label || 'More actions'"
      :aria-expanded="open"
      @click="toggle"
    >
      <slot name="trigger">{{ label || "•••" }}</slot
      ><span v-if="label" aria-hidden="true">⌄</span>
    </button>
    <div
      v-if="open"
      class="dropdown-panel"
      :style="{
        transform: `translateX(${offset}px)`,
        top: above ? 'auto' : undefined,
        bottom: above ? 'calc(100% + 8px)' : undefined,
      }"
      @click="open = false"
    >
      <slot />
    </div>
  </div>
</template>
<style scoped>
.dropdown-panel {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
