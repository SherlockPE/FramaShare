<script setup lang="ts">
import { ref, computed } from "vue";
import UiModal from "./UiModal.vue";
import { state, saveLink, notify, formatDate, delay } from "../services/store";
import type { SharingLink } from "../services/store";
const props = defineProps<{ documentId: string; link?: SharingLink }>(),
  emit = defineEmits<{ close: []; saved: [link: SharingLink] }>();
const name = ref(props.link?.name || ""),
  protect = ref(!!props.link?.password),
  password = ref(""),
  show = ref(false),
  expiry = ref(props.link?.expiresAt ? "custom" : "none"),
  date = ref(
    props.link?.expiresAt
      ? new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/Warsaw",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(props.link.expiresAt)
      : new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).format(state.now + 86400000)
  ),
  time = ref(
    props.link?.expiresAt
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Warsaw",
          hour: "2-digit",
          minute: "2-digit",
        }).format(props.link.expiresAt)
      : "18:00"
  ),
  limited = ref(props.link?.limit != null),
  limit = ref(props.link?.limit || 30),
  download = ref(props.link?.allowDownload ?? true),
  error = ref(""),
  saving = ref(false);
function warsaw(day: string, hour: string) {
  const approx = new Date(day + "T" + hour + ":00Z").getTime();
  if (!Number.isFinite(approx)) return null;
  const localHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Warsaw",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(approx))
  );
  return approx - ((localHour - Number(hour.split(":")[0]) + 24) % 24) * 3600000;
}
const expiresAt = computed(() =>
  expiry.value === "none"
    ? null
    : expiry.value === "custom"
    ? warsaw(date.value, time.value)
    : state.now + Number(expiry.value) * 86400000
);
const summary = computed(() =>
  [
    protect.value ? "Password required" : "No password",
    formatDate(expiresAt.value),
    limited.value ? limit.value + " reading sessions" : "Unlimited sessions",
    download.value ? "Downloads on" : "Downloads off",
  ].join(" · ")
);
async function save() {
  error.value = "";
  if (protect.value && !password.value.trim() && !props.link?.password) {
    error.value = "Enter a password or turn password protection off.";
    return;
  }
  if (expiry.value === "custom" && (!date.value || !time.value)) {
    error.value = "Choose a date and time.";
    return;
  }
  saving.value = true;
  try {
    await delay();
    const link = await saveLink(
      props.documentId,
      {
        name: name.value,
        password: protect.value ? (password.value || undefined) : "",
        expiresAt: expiresAt.value,
        limit: limited.value ? Number(limit.value) : null,
        allowDownload: download.value,
      },
      props.link?.id
    );
    notify(props.link ? "Sharing link updated" : "Sharing link created");
    emit("saved", link);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <UiModal
    :title="link ? 'Edit sharing link' : 'Create a sharing link'"
    @close="emit('close')"
    ><form class="stack" @submit.prevent="save">
      <label class="field"
        >Link name<input
          v-model="name"
          placeholder="e.g. Workshop readers"
          required
          maxlength="100" /></label
      ><label class="checkbox"
        ><input v-model="protect" type="checkbox" />Require a password</label
      ><label v-if="protect" class="field"
        >Password
        <div class="row">
          <input
            aria-label="Password"
            :placeholder="link?.password ? 'Leave blank to keep the current password' : 'Password for readers'"
            v-model="password"
            :type="show ? 'text' : 'password'"
            required
            autocomplete="new-password"
          /><button type="button" class="button secondary" @click="show = !show">
            {{ show ? "Hide" : "Show" }}
          </button>
        </div></label
      ><label class="field"
        >Link expiry<select v-model="expiry">
          <option value="none">No expiry</option>
          <option value="1">In 1 day</option>
          <option value="7">In 7 days</option>
          <option value="custom">Custom date</option>
        </select></label
      >
      <div v-if="expiry === 'custom'" class="two-columns calendar">
        <label class="field">Date<input v-model="date" type="date" required /></label
        ><label class="field">Time<input v-model="time" type="time" required /></label
        ><small class="muted">Europe/Warsaw · Expiry stops active reading too.</small>
      </div>
      <label class="checkbox"
        ><input v-model="limited" type="checkbox" />Limit reading sessions</label
      ><label v-if="limited" class="field"
        >Number of sessions<input
          v-model="limit"
          type="number"
          min="1"
          step="1"
          required
        /><small
          >Counts successful reading sessions, not unique people or page views.</small
        ></label
      ><label class="checkbox"
        ><input v-model="download" type="checkbox" />Allow download</label
      >
      <p class="small muted" style="margin: 0">
        Hides the download option when off. It does not prevent copying or screenshots.
      </p>
      <div class="alert small">{{ summary }}</div>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <div class="actions">
        <button type="button" class="button secondary" @click="emit('close')">
          Cancel</button
        ><button class="button" :disabled="saving">
          {{ saving ? "Saving…" : link ? "Save changes" : "Create link" }}
        </button>
      </div>
    </form></UiModal
  >
</template>
<style scoped>
.calendar {
  gap: 12px;
}
.calendar small {
  grid-column: 1/-1;
}
.actions {
  margin-top: 0;
}
</style>
