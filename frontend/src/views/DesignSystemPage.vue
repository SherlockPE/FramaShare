<script setup lang="ts">
import { ref } from "vue";
import UiModal from "../components/UiModal.vue";
import UiMenu from "../components/UiMenu.vue";
import { notify } from "../services/store";
const modal = ref(false),
  tab = ref("PDF");
const colors = [
  ["Canvas", "#F5F5F2"],
  ["Surface", "#FBFBF8"],
  ["Border", "#DEE2DE"],
  ["Muted", "#E7E7E3"],
  ["Text", "#262323"],
  ["Button", "#202020"],
];
</script>
<template>
  <div class="page stack">
    <div>
      <h1>A quiet place for content.</h1>
      <p class="muted">Framashare design system</p>
    </div>
    <section class="card">
      <h2>Colour & surface</h2>
      <div class="grid">
        <div v-for="[name, color] in colors" :key="name">
          <div
            :style="{
              background: color,
              height: '80px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }"
          />
          <p>
            {{ name }} <span class="mono">{{ color }}</span>
          </p>
        </div>
      </div>
    </section>
    <section class="card">
      <h2>Typography</h2>
      <h1>Sharing starts with a good read.</h1>
      <h2>Your library</h2>
      <h3>Community workshop handbook</h3>
      <p>
        Figtree brings a friendly, clear voice to every screen. Locally hosted, with a 16
        px body.
      </p>
      <p class="mono">IBM Plex Mono · Technical metadata · 12 px</p>
      <p style="font-family: Literata; font-size: 20px">
        Literata gives long reading a little breathing room.
      </p>
    </section>
    <section class="card stack">
      <h2>Actions & states</h2>
      <div class="row wrap">
        <button class="button" @click="notify('Primary action completed')">
          Primary action</button
        ><button class="button secondary" @click="notify('Secondary action completed')">
          Secondary action</button
        ><button class="button ghost" @click="notify('Quiet action completed')">
          Quiet action</button
        ><button class="button danger" @click="modal = true">Destructive action</button
        ><button class="button" disabled>Disabled</button
        ><button class="button" disabled>Loading…</button
        ><UiMenu label="Open menu"
          ><button @click="notify('Menu action selected')">Menu action</button
          ><button @click="modal = true">Open dialog</button></UiMenu
        >
      </div>
      <div class="row wrap">
        <span class="badge ready">✓ Ready</span
        ><span class="badge processing">◷ Processing</span
        ><span class="badge failed">! Failed</span><span class="badge">Revoked</span>
      </div>
      <div class="segmented">
        <button
          v-for="t in ['PDF', 'EPUB', 'Album']"
          :key="t"
          :class="{ active: tab === t }"
          @click="tab = t"
        >
          {{ t }}
        </button>
      </div>
      <div class="alert">A clear message gives the reader a useful next step.</div>
      <div class="alert error" role="alert">
        Something went wrong. Try the operation again.
      </div>
      <progress value="60" max="100" aria-label="Example upload progress" />
    </section>
    <section class="card two-columns">
      <label class="field">Text field<input placeholder="Publication title" /></label
      ><label class="field"
        >Select<select>
          <option>No expiry</option>
          <option>In 7 days</option>
        </select></label
      ><label class="field">Description<textarea placeholder="Add some context" /></label
      ><label class="field error"
        >Field error<input
          aria-invalid="true"
          aria-describedby="example-error"
          value=""
        /><small id="example-error" class="error"
          >Give your publication a title.</small
        ></label
      ><label class="checkbox"><input type="checkbox" />Allow download</label
      ><label class="checkbox"
        ><input type="checkbox" role="switch" />Password protection</label
      >
    </section>
    <UiModal v-if="modal" title="A clear confirmation" @close="modal = false"
      ><p>Describe the consequences before the reader takes an irreversible action.</p>
      <div class="actions">
        <button class="button secondary" @click="modal = false">Cancel</button
        ><button
          class="button danger"
          @click="
            modal = false;
            notify('Example confirmed');
          "
        >
          Confirm action
        </button>
      </div></UiModal
    >
  </div>
</template>
