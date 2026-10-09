<script setup lang="ts">
import { computed } from 'vue';
import { licenses } from '../services/licenses';
import type { Publication } from '../services/store';
const props = defineProps<{ publication: Publication }>();
const license = computed(() => licenses[props.publication.license ?? 'unspecified'] ?? licenses.unspecified);
</script>
<template>
  <p class="small muted">
    <a v-if="license.url" :href="license.url" target="_blank" rel="noopener noreferrer">{{ license.name }}</a>
    <span v-else>{{ license.name }}</span>
    <span v-if="license.url && publication.attribution"> · Author: {{ publication.attribution }}</span>
  </p>
</template>
