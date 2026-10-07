<script setup lang="ts">
import { ref } from "vue";
import { Upload } from "lucide-vue-next";
const selected = ref(0);
const options = [
  {
    name: "A · Framasoft violet",
    note:
      "Closest to the original Framasoft identity. Calm accent on a light background.",
    color: "#725794",
    accent: "#dd6418",
    mode: "classic",
  },
  {
    name: "B · Forest green",
    note: "Monochromatic version matching the green accents and the garden on the site.",
    color: "#356447",
    accent: "#356447",
    mode: "forest",
  },
  {
    name: "C · Violet and orange",
    note: "Original Framasoft colors in a more expressive mark.",
    color: "#725794",
    accent: "#dd6418",
    mode: "dual",
  },
];
</script>
<template>
  <div class="logo-preview page">
    <header class="intro">
      <h1>Framashare Logo</h1>
      <p>
        Three proposals with the Framasoft symbol in the current page layout. Select a
        variant for deployment.
      </p>
    </header>
    <div class="options" role="group" aria-label="Logo variant">
      <button
        v-for="(option, i) in options"
        :key="option.name"
        :class="{ active: selected === i }"
        :aria-pressed="selected === i"
        @click="selected = i"
      >
        <span class="option-title">{{ option.name }}</span
        ><span>{{ option.note }}</span>
      </button>
    </div>
    <section
      class="mockup"
      :style="{'--mark':options[selected]!.color,'--accent':options[selected]!.accent}"
      aria-label="Logo preview on the home page"
    >
      <header class="mock-header">
        <div class="proposed-brand" :class="options[selected]!.mode">
          <span class="symbol" aria-hidden="true"></span><span>Framashare</span>
        </div>
        <nav aria-label="Navigation preview">
          <span>How it works</span><span>Help</span><span>About</span>
        </nav>
        <span class="mock-signin">Sign in</span
        ><span class="mock-upload"><Upload :size="15" />Upload</span>
      </header>
      <div class="mock-hero">
        <img src="/samples/reading-garden.svg" alt="" />
        <div class="mock-copy">
          <h2>Good things<br />are meant to be read.</h2>
          <p>
            A simple home for your PDFs, ebooks and photo albums.<br />Publish once. Share
            a link. Let everyone settle in.
          </p>
          <span>Upload a document</span>
        </div>
      </div>
    </section>
    <div
      class="detail"
      :style="{'--mark':options[selected]!.color,'--accent':options[selected]!.accent}"
    >
      <div class="proposed-brand large" :class="options[selected]!.mode">
        <span class="symbol" aria-hidden="true"></span><span>Framashare</span>
      </div>
      <div>
        <strong>Selected variant: {{options[selected]!.name}}</strong>
        <p>{{options[selected]!.note}}</p>
      </div>
    </div>
    <p class="source">
      The symbol comes from the
      <a
        href="https://framasoft.org/fr/graphics/"
        target="_blank"
        rel="noopener noreferrer"
        >official Framasoft identity</a
      >. This is a project preview; the current logo on other pages remains unchanged
      until a selection is made.
    </p>
  </div>
</template>
<style scoped>
.logo-preview {
  max-width: 1260px;
}
.intro {
  margin-bottom: 28px;
}
.intro h1 {
  margin-bottom: 10px;
}
.intro p {
  color: var(--secondary);
  max-width: 680px;
}
.options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 26px;
}
.options button {
  text-align: left;
  min-height: 112px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px;
  color: var(--secondary);
  font-size: 13px;
  line-height: 1.45;
}
.options button.active {
  border-color: #725794;
  box-shadow: 0 0 0 2px #72579422;
}
.option-title {
  display: block;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}
.mockup {
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  background: var(--canvas);
  box-shadow: 0 8px 30px #0000000d;
}
.mock-header {
  height: 82px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  gap: 28px;
  background: var(--canvas);
}
.proposed-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 25px;
  font-weight: 500;
  letter-spacing: -0.8px;
  color: #262323;
  white-space: nowrap;
}
.symbol {
  display: block;
  flex: none;
  width: 32px;
  height: 32px;
  background: var(--mark);
  mask: url("/framasoft-symbol.svg") center/contain no-repeat;
}
.dual .symbol {
  background: linear-gradient(130deg, var(--mark) 55%, var(--accent) 55%);
}
.forest .symbol {
  width: 30px;
  height: 30px;
}
.mock-header nav {
  display: flex;
  gap: 28px;
  margin-left: auto;
  font-size: 14px;
}
.mock-signin {
  font-size: 14px;
}
.mock-upload {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 16px;
  background: #262323;
  color: white;
  border-radius: 8px;
  font-size: 14px;
}
.mock-hero {
  height: 470px;
  position: relative;
  overflow: hidden;
  background: #7bc0dd;
}
.mock-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 62%;
  image-rendering: pixelated;
}
.mock-hero:after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #143b5055, transparent 65%);
}
.mock-copy {
  position: absolute;
  z-index: 1;
  top: 65px;
  left: 5.5%;
  color: white;
  text-shadow: 0 1px 3px #204f5266;
}
.mock-copy h2 {
  font-size: 54px;
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -2px;
  margin-bottom: 20px;
}
.mock-copy p {
  font-size: 16px;
  line-height: 1.6;
}
.mock-copy > span {
  display: inline-block;
  background: #fbfbf8;
  color: #262323;
  padding: 13px 18px;
  border-radius: 8px;
  text-shadow: none;
  margin-top: 10px;
}
.detail {
  display: flex;
  align-items: center;
  gap: 44px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-top: 20px;
}
.detail .large {
  font-size: 34px;
  min-width: 260px;
}
.detail .symbol {
  width: 44px;
  height: 44px;
}
.detail p {
  font-size: 14px;
  color: var(--secondary);
  margin: 5px 0 0;
}
.source {
  font-size: 13px;
  color: var(--secondary);
  margin: 20px 0 0;
}
.source a {
  text-decoration: underline;
}
@media (max-width: 760px) {
  .options {
    grid-template-columns: 1fr;
  }
  .options button {
    min-height: 0;
  }
  .mock-header {
    padding: 0 16px;
    height: 72px;
  }
  .mock-header nav,
  .mock-signin {
    display: none;
  }
  .mock-upload {
    margin-left: auto;
  }
  .proposed-brand {
    font-size: 20px;
  }
  .symbol {
    width: 27px;
    height: 27px;
  }
  .mock-hero {
    height: 480px;
  }
  .mock-copy {
    left: 22px;
    top: 50px;
    right: 20px;
  }
  .mock-copy h2 {
    font-size: 40px;
  }
  .mock-copy p {
    font-size: 14px;
  }
  .mock-copy p br {
    display: none;
  }
  .detail {
    display: block;
  }
  .detail .large {
    margin-bottom: 18px;
  }
  .detail .symbol {
    width: 38px;
    height: 38px;
  }
}
@media (max-width: 380px) {
  .mock-upload {
    display: none;
  }
  .mock-copy h2 {
    font-size: 34px;
  }
}
</style>
