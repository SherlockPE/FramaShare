<script setup lang="ts">import type {Publication} from '../services/store';import {imageSource} from '../services/store';defineProps<{document:Publication}>();</script>
<template><div :class="['cover',document.format]"><img v-if="document.format==='album'&&imageSource(document,0)" :src="imageSource(document,0)" :alt="document.images[0]?.alt"/><div v-else class="cover-book"><div class="cover-title">{{document.title}}</div><div class="small" style="margin-top:12px;font-family:Figtree">Framashare<br>{{document.format.toUpperCase()}}</div></div></div></template>

<style scoped>.cover-title{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;max-height:60px}</style>
