<script setup lang="ts">
import { ref } from "vue";
import UiModal from "../UiModal.vue";
import { addReport, delay } from "../../services/store";
const props = defineProps<{ documentId: string }>();
const emit = defineEmits<{ close: [] }>();
const reason = ref(""),
  description = ref(""),
  error = ref(""),
  busy = ref(false),
  success = ref(false);
async function submit() {
  error.value = "";
  busy.value = true;
  try {
    if (!reason.value || !description.value.trim())
      throw Error("Choose a reason and describe the concern.");
    await delay();
    await addReport(props.documentId, reason.value, description.value);
    success.value = true;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <UiModal :title="success ? 'Report received' : 'Report abuse'" @close="emit('close')"
    ><template v-if="success"
      ><p>Thank you for letting us know. A moderator will review this publication.</p>
      <button class="button" @click="emit('close')">Done</button></template
    >
    <form v-else class="stack" @submit.prevent="submit">
      <p class="muted">
        Tell us what needs a closer look. You do not need an account or an email address.
      </p>
      <label class="field"
        >Reason<select aria-label="Reason" v-model="reason" required>
          <option value="" disabled>Choose a reason</option>
          <option>Copyright concern</option>
          <option>Harmful content</option>
          <option>Personal information</option>
          <option>Spam</option>
          <option>Other</option>
        </select></label
      ><label class="field"
        >Description<textarea
          v-model="description"
          required
          maxlength="3000"
          placeholder="Describe the concern so we can review it."
        />
      </label>
      <p v-if="error" class="alert error" role="alert">{{ error }}</p>
      <div class="actions">
        <button type="button" class="button secondary" @click="emit('close')">
          Cancel</button
        ><button class="button" :disabled="busy">
          {{ busy ? "Submitting…" : "Submit report" }}
        </button>
      </div>
    </form></UiModal
  >
</template>
