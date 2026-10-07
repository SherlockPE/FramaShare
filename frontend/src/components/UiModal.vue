<script setup lang="ts">
import {ref,onMounted,onBeforeUnmount,nextTick} from 'vue';
defineProps<{title:string}>();const emit=defineEmits<{close:[]}>();const panel=ref<HTMLElement>();const previous=document.activeElement as HTMLElement;
function key(e:KeyboardEvent){if(e.key==='Escape')emit('close');if(e.key==='Tab'){const items=panel.value?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex="0"]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}
onMounted(async()=>{document.addEventListener('keydown',key);await nextTick();panel.value?.querySelector<HTMLElement>('input,button')?.focus()});onBeforeUnmount(()=>{document.removeEventListener('keydown',key);previous?.focus()});
</script>
<template><Teleport to="body"><div class="modal-backdrop" @mousedown.self="emit('close')"><section ref="panel" class="modal" role="dialog" aria-modal="true" :aria-label="title"><header class="row between"><h2>{{ title }}</h2><button class="icon-button" aria-label="Close dialog" @click="emit('close')">×</button></header><slot /></section></div></Teleport></template>
