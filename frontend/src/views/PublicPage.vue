<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import {
  BookOpen,
  FileText,
  Images,
  Lock,
  Link,
  Upload,
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
} from "@lucide/vue";
const route = useRoute(),
  query = ref(""),
  category = ref("All topics");
const articles = [
  {
    slug: "supported-formats",
    category: "Publishing",
    title: "What can I publish?",
    summary: "PDFs, DRM-free EPUBs, and albums of images.",
    sections: [
      [
        "Three ways to share",
        "Upload a PDF to keep its original pages and layout. A DRM-free EPUB opens in a reading view with adjustable text. Select several JPEG, PNG or WebP images to create an album. Office files, encrypted ebooks and DRM-protected EPUBs are not supported.",
      ],
      [
        "Size and album limits",
        "The default limit is 100 MB per file, or 50 images and 100 MB for an album. Your account has 1 GB of space. The instance administrator can change these limits. The upload form always shows the current limits before you select files.",
      ],
      [
        "After you publish",
        "Give your publication a title and description, then create a sharing link. If processing fails, retry the upload. Uploaded files and metadata are stored on the server and remain available after refresh or sign-in on another device.",
      ],
    ],
  },
  {
    slug: "sharing-links",
    category: "Sharing",
    title: "Create the right link for each group",
    summary: "Independent links, individual rules, one publication.",
    sections: [
      [
        "A link for every audience",
        "Open a publication and choose Manage links, then Create sharing link. Give the link a useful name, such as Workshop participants. Each link has its own password, expiry, reading session limit and download preference. Changing one link does not change any other link.",
      ],
      [
        "Changing and revoking access",
        "You can edit a link without changing its URL. Revoke stops new access and any active reading through that link. Other links keep working. Deleting the publication stops every link to it. Expiring a sharing link does not delete the original publication.",
      ],
      [
        "Downloads and privacy",
        "Allow download is enabled by default. Turning it off hides the download option; it does not prevent copying or screenshots. Anyone with a working unprotected sharing link can open it. Recipients do not need an account.",
      ],
    ],
  },
  {
    slug: "password-protection",
    category: "Sharing",
    title: "Protect a link with a password",
    summary: "Keep a shared document behind an extra step.",
    sections: [
      [
        "Add a password",
        "In the sharing link form, enable password protection and enter a password. Send the URL and password separately if that suits your group. A sharing-link password is separate from an account password or any password inside a PDF.",
      ],
      [
        "What a reader sees",
        "Before the reader enters the correct password, the access screen does not show the title, description or cover. An incorrect password does not use a reading session. The reader must explicitly choose Start reading after entering the password.",
      ],
      [
        "Server access checks",
        "The server checks the link and reading session on each file request. Expiry, revocation and deletion stop further reads; already received content cannot be recalled.",
      ],
    ],
  },
  {
    slug: "reading-sessions",
    category: "Reading",
    title: "How reading sessions are counted",
    summary: "A session starts when someone chooses to read.",
    sections: [
      [
        "What counts as a session",
        "One successful Start reading uses one session. A wrong password, opening the access screen, moving between pages and refreshing an active reader do not increase the count. Sessions count successful visits, not unique people.",
      ],
      [
        "How long a session lasts",
        "A reading session lasts 60 minutes. Once the limit is reached, new sessions cannot start, but existing sessions can finish. If the session ends and the link still allows access, the reader can start again. Lowering the limit does not immediately stop existing sessions.",
      ],
      [
        "When access stops",
        "Revoking or expiring a link stops active reading immediately. Deleting a publication also stops access. Content already downloaded cannot be recalled. A link expiry is different from the removal date of an anonymous publication.",
      ],
    ],
  },
  {
    slug: "anonymous-publishing",
    category: "Publishing",
    title: "Publish without an account",
    summary: "Save your private management link before you leave.",
    sections: [
      [
        "Choose how long to keep it",
        "You can upload without signing in. Choose 1, 7 or 30 days; the default is 7 days. After this period, the anonymous publication is unavailable. The deadline is shown in your management view.",
      ],
      [
        "Keep your management link safe",
        "After publishing, copy the private management link. Anyone with it can edit or delete your document. Share a separate recipient link with readers. Without the management link, you cannot manage an anonymous publication; there is no email recovery route.",
      ],
      [
        "Add it to your library",
        "Open the management link and choose Add to my library. Sign in or create an account, then confirm. The publication no longer has an anonymous removal date. Your private management link stops working, and existing recipient links keep working. If your account has too little space, the publication remains anonymous and you can return to manage it.",
      ],
    ],
  },
  {
    slug: "reader-controls",
    category: "Reading",
    title: "Make yourself comfortable in the reader",
    summary: "Find a page, adjust a chapter, explore an album.",
    sections: [
      [
        "Reading PDFs",
        "Use the page field, thumbnails or contents to find a page. Search locates text in the document. Choose Fit width or Fit page, change zoom, rotate the page, or open fullscreen. The download action appears when the sharing link allows it.",
      ],
      [
        "Reading ebooks",
        "Open Contents to choose a chapter. Reading settings change font size, line spacing, column width and the light, dark or sepia theme. Reading preferences are saved in this browser. Uploaded EPUBs show their actual chapters and contents; unsupported fixed-layout or encrypted books are rejected.",
      ],
      [
        "Exploring albums",
        "Move between images with the arrows or thumbnails. The author’s captions appear below the image. Zoom in and drag the image to explore details. Images keep their original proportions. If something is inappropriate, use Report abuse; no account is required.",
      ],
    ],
  },
];
const article = computed(() => articles.find((a) => a.slug === route.params.slug)),
  filtered = computed(() =>
    articles.filter(
      (a) =>
        (category.value === "All topics" || a.category === category.value) &&
        `${a.title} ${a.summary} ${a.sections.flat().join(" ")}`
          .toLowerCase()
          .includes(query.value.toLowerCase())
    )
  ),
  home = computed(() => route.path === "/"),
  help = computed(() => route.path === "/help"),
  how = computed(() => route.path === "/how-it-works"),
  about = computed(() => route.path === "/about"),
  legal = computed(() => ["/privacy", "/terms"].includes(route.path));
const faqs = [
  [
    "Do readers need an account?",
    "No. Send a sharing link and the reader can open the document in their browser. If you set a password, they will need that too.",
  ],
  [
    "Can I upload without signing up?",
    "Yes. Choose a storage period and keep the private management link. You can add the publication to an account later.",
  ],
  [
    "Can I create different links to the same document?",
    "Yes. Each named link has independent access rules. You can revoke one without affecting the others.",
  ],
  [
    "What happens when a link expires?",
    "Access through that link stops, including active sessions. The publication stays in the author’s library.",
  ],
];
</script>
<template>
  <template v-if="home"
    ><section class="hero">
      <img
        class="hero-art"
        src="/samples/reading-garden.svg"
        alt="A pixel-art garden with books, trees and a quiet place to read"
      />
      <div class="hero-copy">
        <h1>Good things<br />are meant to be read.</h1>
        <p>
          A simple home for your PDFs, ebooks and photo albums.<br />Publish once. Share a
          link. Let everyone settle in.
        </p>
        <div class="row wrap">
          <RouterLink class="button hero-primary" to="/upload"
            ><Upload :size="17" />Upload a document</RouterLink
          ><RouterLink class="button secondary hero-secondary" to="/how-it-works"
            >See how it works</RouterLink
          >
        </div>
        <p class="hero-note">No account needed to upload or read.</p>
      </div>
      <RouterLink class="garden-callout" to="/share/garden"
        ><span class="callout-icon"><BookOpen :size="20" /></span
        ><span
          >A guide to shared gardens<small
            >Find a quiet moment. Open the example.</small
          ></span
        ><ChevronRight :size="18"
      /></RouterLink>
    </section>
    <section class="formats-band">
      <span>Bring the things you’ve made.</span>
      <div><FileText :size="20" />PDF documents</div>
      <div><BookOpen :size="20" />DRM-free ebooks</div>
      <div><Images :size="20" />Image albums</div>
    </section>
    <section class="marketing-section reader-section">
      <div class="section-heading">
        <h2>A good reading experience.<br />From the very first page.</h2>
        <p class="muted">
          No attachments to lose, no accounts for your readers to create.<br />Just your
          document and a little room to focus.
        </p>
      </div>
      <div class="reader-preview">
        <div class="preview-top">
          <span class="row"><BookOpen :size="17" />Community workshop handbook</span
          ><span class="preview-page">1 / 6</span
          ><RouterLink to="/share/workshop" class="button secondary"
            >Try the reader<ArrowRight :size="16"
          /></RouterLink>
        </div>
        <div class="preview-body">
          <aside>
            <div class="mini-page active">
              1
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div class="mini-page">
              2
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div class="mini-page">
              3
              <div></div>
              <div></div>
              <div></div>
            </div>
          </aside>
          <RouterLink to="/share/workshop" class="paper-preview"
            ><span class="paper-kicker">The neighbourhood library</span>
            <h3>Community<br />workshop handbook</h3>
            <div class="paper-rule"></div>
            <p>A practical collection of ideas<br />for bringing people together.</p>
            <div class="paper-garden">
              <img src="/samples/garden-1.svg" alt="Illustration of a shared garden" />
            </div>
            <small>Open notes. Shared possibilities.</small></RouterLink
          >
        </div>
      </div>
    </section>
    <section class="marketing-section sharing-section">
      <div>
        <span class="feature-symbol"><Link :size="25" /></span>
        <h2>One publication.<br />A link for every circle.</h2>
        <p class="muted">
          A workshop group. A few friends. The whole neighbourhood. Make a different link
          for each, with access that fits.
        </p>
        <RouterLink to="/help/sharing-links" class="text-link"
          >Learn about sharing links<ArrowRight :size="16"
        /></RouterLink>
      </div>
      <div class="link-examples card">
        <div class="sample-link">
          <span
            ><strong>Workshop participants</strong
            ><small>30 reading sessions · Password required</small></span
          ><span class="badge ready">Active</span>
        </div>
        <div class="sample-link">
          <span
            ><strong>Friends of the garden</strong
            ><small>No expiry · Downloads allowed</small></span
          ><span class="badge ready">Active</span>
        </div>
        <div class="sample-link">
          <span
            ><strong>Last season’s group</strong
            ><small>This link is no longer available</small></span
          ><span class="badge">Revoked</span>
        </div>
        <p class="small muted">
          <Lock :size="14" />Each link has its own settings. You stay in control.
        </p>
      </div>
    </section>
    <section class="marketing-section quiet-section">
      <div>
        <Lock :size="24" />
        <h3>Private by intention.</h3>
        <p>
          There is no public directory. Your documents reach the people you share your
          links with.
        </p>
      </div>
      <div>
        <BookOpen :size="24" />
        <h3>A library, when you need one.</h3>
        <p>
          Sign in to keep everything together. Or publish without an account and save a
          private management link.
        </p>
      </div>
      <div>
        <Images :size="24" />
        <h3>Made for what you make.</h3>
        <p>
          Keep the pages of a PDF, settle into an ebook, or let an album tell its story.
        </p>
      </div>
    </section>
    <section class="marketing-section faq-section">
      <h2>A few things you might be wondering.</h2>
      <details v-for="[question, answer] in faqs" :key="question">
        <summary>{{ question }}</summary>
        <p>{{ answer }}</p>
      </details>
    </section>
    <section class="closing-section">
      <h2>Make a little room<br />for your next good read.</h2>
      <RouterLink to="/upload" class="button">Upload a document</RouterLink>
      <p class="small muted">PDF, EPUB, JPEG, PNG and WebP.</p>
    </section></template
  >
  <div v-else-if="help" class="page help-page">
    <header class="help-heading">
      <h1>A little help, when you need it.</h1>
      <p class="muted">From your first upload to your next chapter.</p>
      <label class="help-search"
        ><Search :size="20" /><span class="sr-only">Search help articles</span
        ><input
          v-model="query"
          type="search"
          placeholder="Search articles, formats, sharing…"
      /></label>
    </header>
    <div class="help-categories" aria-label="Help categories">
      <button
        v-for="c in ['All topics', 'Publishing', 'Sharing', 'Reading']"
        :key="c"
        :class="{ active: category === c }"
        @click="category = c"
      >
        {{ c }}
      </button>
    </div>
    <div class="article-grid">
      <RouterLink
        v-for="a in filtered"
        :key="a.slug"
        :to="`/help/${a.slug}`"
        class="help-card"
        ><span class="small muted">{{ a.category }}</span>
        <h2>{{ a.title }}</h2>
        <p class="muted">{{ a.summary }}</p>
        <span class="text-link">Read article<ArrowRight :size="15" /></span
      ></RouterLink>
    </div>
    <div v-if="!filtered.length" class="empty">
      <h2>No articles found</h2>
      <p class="muted">Try a different word or browse all topics.</p>
      <button
        class="button secondary"
        @click="
          query = '';
          category = 'All topics';
        "
      >
        Clear search
      </button>
    </div>
  </div>
  <div v-else-if="article" class="page editorial-layout">
    <aside class="article-nav">
      <RouterLink to="/help" class="text-link"
        ><ArrowLeft :size="16" />All help articles</RouterLink
      >
      <p class="small muted">On this page</p>
      <a
        v-for="([heading], i) in article.sections"
        :key="heading"
        :href="`#section-${i}`"
        >{{ heading }}</a
      >
      <div class="divider"></div>
      <p class="small muted">Related reading</p>
      <RouterLink
        v-for="a in articles.filter((a) => a.slug !== article?.slug).slice(0, 3)"
        :key="a.slug"
        :to="`/help/${a.slug}`"
        >{{ a.title }}</RouterLink
      >
    </aside>
    <article class="editorial-content">
      <span class="badge">{{ article.category }}</span>
      <h1>{{ article.title }}</h1>
      <p class="article-lead">{{ article.summary }}</p>
      <section
        v-for="([heading, content], i) in article.sections"
        :key="heading"
        :id="`section-${i}`"
      >
        <h2>{{ heading }}</h2>
        <p>{{ content }}</p>
      </section>
      <div class="article-end">
        <Check :size="18" />
        <p>
          Ready to try it? <RouterLink to="/upload">Upload a document</RouterLink> or
          <RouterLink to="/overview">explore the prototype</RouterLink>.
        </p>
      </div>
    </article>
  </div>
  <div v-else-if="how" class="page editorial-layout">
    <aside class="article-nav">
      <p class="small muted">How Framashare works</p>
      <a href="#publish">Publish something worth reading</a
      ><a href="#share">Make a sharing link</a
      ><a href="#read">Let your readers settle in</a><a href="#keep">Keep it together</a
      ><RouterLink class="button" to="/upload">Upload a document</RouterLink>
    </aside>
    <article class="editorial-content">
      <span class="badge">A place for shared reading</span>
      <h1>From your document<br />to their next good read.</h1>
      <p class="article-lead">
        Framashare gives the things you make a simple place to live, and the people you
        share with a comfortable place to read.
      </p>
      <img
        class="article-art"
        src="/samples/reading-garden.svg"
        alt="Books and a quiet reading place in a pixel-art garden"
      />
      <section id="publish">
        <h2>1. Publish something worth reading</h2>
        <p>
          Select a PDF, a DRM-free EPUB, or a collection of JPEG, PNG or WebP images. Give
          it a title and a little context. You can sign in to keep it in your library or
          publish without an account.
        </p>
        <p>
          Without an account, choose a storage period of 1, 7 or 30 days. The default is
          7. Save the private management link immediately: it is the only way to edit,
          share or delete that publication.
        </p>
      </section>
      <section id="share">
        <h2>2. Make a sharing link</h2>
        <p>
          Name each link for the people who will use it. Add a password, an expiry date,
          or a limit on reading sessions if you need one. Choose whether readers can
          download the file.
        </p>
        <p>
          Each link works independently. You can close the workshop link while keeping the
          neighbourhood link open. Turning downloads off hides the download action; it
          does not prevent copying or screenshots.
        </p>
      </section>
      <section id="read">
        <h2>3. Let your readers settle in</h2>
        <p>
          Readers do not need an account. They choose Start reading and use a browser
          reader suited to the document: searchable pages, comfortable ebook chapters, or
          a navigable image album.
        </p>
        <p>
          A successful reading session lasts 60 minutes. Refreshing a page does not count
          as a new session. An expired or revoked link stops access, including an active
          session.
        </p>
      </section>
      <section id="keep">
        <h2>4. Keep it together</h2>
        <p>
          Your account library holds your publications and their links. An anonymous
          publication can be added to a library later: sign in from its management view
          and confirm the move. Existing reader links keep working, the removal date
          disappears, and the old management link becomes invalid.
        </p>
        <p>
          Lost an anonymous management link? Without an account, there is no way to
          recover it. Keep it private and somewhere safe.
        </p>
      </section>
      <RouterLink to="/upload" class="button">Upload a document</RouterLink>
    </article>
  </div>
  <div v-else-if="about" class="page editorial-layout">
    <aside class="article-nav">
      <p class="small muted">About Framashare</p>
      <a href="#purpose">A small, useful idea</a><a href="#privacy">Privacy and control</a
      ><a href="#open">Open possibilities</a><a href="#prototype">About this prototype</a>
    </aside>
    <article class="editorial-content">
      <h1>A little space<br />for shared reading.</h1>
      <p class="article-lead">
        Good documents deserve an easier journey from the person who made them to the
        people who need them.
      </p>
      <img
        class="article-art"
        src="/samples/reading-garden.svg"
        alt="An illustrated shared reading garden"
      />
      <section id="purpose">
        <h2>A small, useful idea</h2>
        <p>
          Workshop handbooks, community notes, short books and photo stories often travel
          as attachments. Framashare explores another option: publish a document once, and
          share a comfortable reading experience with a link.
        </p>
      </section>
      <section id="privacy">
        <h2>Privacy and control</h2>
        <p>
          No public catalogue or social feed. Readers do not need an account. Authors can
          create independent sharing links and revoke them separately. Anonymous authors
          get a private management link and choose how long their publication is kept.
        </p>
      </section>
      <section id="open">
        <h2>Open possibilities</h2>
        <p>
          This open project explores a service that organisations could host themselves.
          This prototype has no production infrastructure or deployment. The name does not
          imply endorsement, affiliation or official approval by Framasoft.
        </p>
      </section>
      <section id="prototype">
        <h2>About this prototype</h2>
        <p>
          Accounts, metadata, files and access rules are stored on the server. Recipient links work on another device without the author’s browser state. Browser storage holds reading preferences only.
        </p>
        <RouterLink class="button secondary" to="/upload"
          >Upload a publication</RouterLink
        >
      </section>
    </article>
  </div>
  <div v-else-if="legal" class="page narrow legal-page">
    <span class="badge">Prototype example · Non-binding</span>
    <p class="alert" role="status">Draft: these terms and privacy information require approval by the instance owner before public release.</p>
    <h1>{{ route.path === "/privacy" ? "Privacy notice" : "Terms of use" }}</h1>
    <div class="alert">
      This is sample content for a local prototype. It is not a legally binding policy or
      a ready-to-use legal document.
    </div>
    <template v-if="route.path === '/privacy'"
      ><section>
        <h2>What the instance stores</h2>
        <p>
          The server stores account names and email addresses, password hashes, publication files and metadata, sharing rules, sessions and reports. This browser stores reading preferences and uses HttpOnly cookies for authentication and reading sessions.
        </p>
      </section>
      <section>
        <h2>Email and operations</h2>
        <p>
          Password reset messages are delivered through the instance’s SMTP provider. The owner must identify that provider, the operator, contact details and any operational logging or backup retention before approving this notice.
        </p>
      </section>
      <section>
        <h2>Clearing your data</h2>
        <p>
          Delete a publication from its management page, or delete your account and its files in Account settings. Anonymous publications expire after their selected retention period. The owner must specify how these deletions affect retained backups.
        </p>
      </section></template
    ><template v-else
      ><section>
        <h2>Trying the prototype</h2>
        <p>
          Use documents you have permission to publish. These draft terms need the instance owner’s approval, operator details and release-specific availability commitments before public use.
        </p>
      </section>
      <section>
        <h2>Sharing responsibly</h2>
        <p>
          Only share material you are allowed to publish. Readers can report a concern
          without an account. The administrator can review a report and remove the
          publication on this instance.
        </p>
      </section>
      <section>
        <h2>Availability and access</h2>
        <p>
          Anonymous publications have a selected removal period. Sharing links can expire,
          be revoked or reach their reading-session limit. Hiding a download button does
          not prevent copying or screenshots. Keep anonymous management links private and
          safe.
        </p>
      </section></template
    ><RouterLink to="/overview" class="text-link"
      >See all prototype limitations<ArrowRight :size="16"
    /></RouterLink>
  </div>
  <div v-else class="page narrow empty">
    <h1>That page isn’t here.</h1>
    <p class="muted">Find your way back to a good read.</p>
    <RouterLink to="/" class="button">Back to home</RouterLink
    ><RouterLink to="/help" class="button secondary">Browse help</RouterLink>
  </div>
</template>
<style scoped>
.hero {
  position: relative;
  min-height: 690px;
  overflow: hidden;
  background: #7bc0dd;
}
.hero-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  object-position: center 62%;
}
.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #143b5055, transparent 65%);
  pointer-events: none;
}
.hero-copy {
  position: relative;
  z-index: 1;
  padding: 84px 5.5% 140px;
  color: white;
  max-width: 760px;
  text-shadow: 0 1px 3px #204f5266;
}
.hero-copy h1 {
  font-size: 62px;
  font-weight: 400;
  letter-spacing: -2px;
  line-height: 1.08;
  margin-bottom: 24px;
}
.hero-copy p {
  font-size: 17px;
  line-height: 1.6;
}
.hero-copy .row {
  margin-top: 28px;
  gap: 12px;
}
.hero-primary,
.hero-secondary {
  text-shadow: none;
}
.hero-primary {
  background: #fbfbf8;
  color: #262323;
  border-color: #e3e3e0;
  box-shadow: 0 2px 4px #183c3825;
}
.hero-primary:hover {
  color: white;
}
.hero-secondary {
  background: #276381d9 !important;
  color: white !important;
  border-color: #ffffff55 !important;
}
.hero-note {
  font-size: 13px !important;
  margin-top: 18px;
}
.garden-callout {
  z-index: 1;
  position: absolute;
  right: 6%;
  bottom: 70px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fbfbf8ec;
  border: 1px solid white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 6px 20px #14372e18;
  max-width: calc(100% - 40px);
  font-size: 14px;
}
.garden-callout small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--secondary);
}
.callout-icon {
  padding: 10px;
  background: #e7ece2;
  border-radius: 8px;
  display: flex;
}
.formats-band {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 40px 24px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  color: var(--secondary);
}
.formats-band div {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
}
.marketing-section {
  max-width: 1080px;
  margin: 0 auto;
  padding: 96px 24px;
}
.section-heading {
  text-align: center;
  margin-bottom: 44px;
}
.section-heading h2 {
  font-size: 38px;
  line-height: 1.2;
  margin-bottom: 20px;
  letter-spacing: -1px;
}
.section-heading p {
  font-size: 16px;
}
.reader-preview {
  border: 1px solid var(--border);
  background: #eeefea;
  padding: 8px;
  border-radius: 16px;
  box-shadow: inset 0 1px 0 white, 0 8px 20px #00000003;
}
.preview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.preview-page {
  color: var(--secondary);
}
.preview-top .button {
  min-height: 36px;
  padding: 8px 14px;
  font-size: 12px;
}
.preview-body {
  height: 490px;
  display: flex;
  gap: 24px;
  justify-content: center;
  padding: 28px 60px;
}
.preview-body aside {
  width: 95px;
  position: absolute;
  align-self: flex-start;
  left: calc(50% - 450px);
}
.mini-page {
  width: 65px;
  height: 90px;
  background: #fbfbf8;
  border: 1px solid #d6d9d1;
  margin: 0 auto 18px;
  padding: 10px;
  font-size: 9px;
}
.mini-page.active {
  outline: 2px solid #b8c7d0;
}
.mini-page div {
  height: 3px;
  background: #dbded6;
  margin-top: 7px;
}
.paper-preview {
  background: #fffef7;
  width: 320px;
  box-shadow: 0 3px 16px #0000000d;
  padding: 30px;
  border: 1px solid #e4e2d9;
  min-height: 420px;
  display: block;
}
.paper-preview:hover {
  text-decoration: none;
}
.paper-kicker {
  font-size: 9px;
  letter-spacing: 1px;
  color: #486149;
}
.paper-preview h3 {
  font-family: Literata, serif;
  font-size: 27px;
  line-height: 1.4;
  margin: 18px 0;
  color: #354832;
}
.paper-rule {
  width: 32px;
  height: 3px;
  background: #9aa58b;
  margin: 16px 0;
}
.paper-preview p {
  font-size: 11px;
  color: #62645c;
}
.paper-garden {
  height: 102px;
  margin: 18px 0;
  overflow: hidden;
}
.paper-garden img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.paper-preview small {
  font-size: 9px;
  color: #5b6857;
}
.sharing-section {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 72px;
  align-items: center;
  padding-top: 20px;
}
.sharing-section h2 {
  font-size: 36px;
  line-height: 1.15;
  margin: 24px 0 20px;
}
.sharing-section > div > p {
  max-width: 370px;
}
.feature-symbol {
  background: #e6eae2;
  border: 1px solid #d5ddcf;
  display: inline-flex;
  padding: 12px;
  border-radius: 10px;
}
.text-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  min-height: 44px;
}
.link-examples {
  padding: 8px 24px;
}
.sample-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 24px 0;
  border-bottom: 1px solid var(--border);
}
.sample-link strong {
  display: block;
  font-size: 14px;
  font-weight: 500;
}
.sample-link small {
  display: block;
  color: var(--secondary);
  font-size: 12px;
  margin-top: 8px;
}
.link-examples > p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0;
}
.quiet-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  border-top: 1px solid var(--border);
  padding-top: 56px;
  padding-bottom: 56px;
}
.quiet-section h3 {
  margin: 20px 0 12px;
}
.quiet-section p {
  color: var(--secondary);
  font-size: 14px;
  margin-bottom: 0;
}
.faq-section {
  max-width: 780px;
  padding-top: 48px;
}
.faq-section h2 {
  font-size: 32px;
  margin-bottom: 36px;
}
.faq-section details {
  border-top: 1px solid var(--border);
}
.faq-section details:last-child {
  border-bottom: 1px solid var(--border);
}
summary {
  cursor: pointer;
  padding: 22px 24px 22px 0;
  font-size: 16px;
}
.faq-section details p {
  font-size: 14px;
  color: var(--secondary);
  margin-right: 24px;
}
.closing-section {
  text-align: center;
  padding: 64px 24px 88px;
}
.closing-section h2 {
  font-size: 40px;
  line-height: 1.2;
}
.closing-section p {
  margin: 18px 0 0;
}
.help-page {
  max-width: 1100px;
  padding-top: 72px;
}
.help-heading {
  max-width: 660px;
  margin: 0 auto 48px;
  text-align: center;
}
.help-search {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 16px;
  margin-top: 32px;
  text-align: left;
  color: var(--secondary);
}
.help-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  height: 54px;
  font-size: 15px;
}
.help-categories {
  display: flex;
  gap: 8px;
  margin: 0 0 32px;
  flex-wrap: wrap;
}
.help-categories button {
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--secondary);
  border-radius: 8px;
}
.help-categories .active {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text);
}
.article-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.help-card {
  display: flex;
  flex-direction: column;
  padding: 28px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: inset 0 2px 0 white;
  min-height: 270px;
}
.help-card:hover {
  text-decoration: none;
  border-color: #b8c3b4;
}
.help-card h2 {
  font-size: 22px;
  margin: 24px 0 12px;
  line-height: 1.25;
}
.help-card p {
  font-size: 14px;
  flex: 1;
  margin-bottom: 20px;
}
.help-card > .text-link {
  font-size: 12px;
}
.editorial-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 680px);
  gap: 100px;
  max-width: 1180px;
  padding-top: 64px;
}
.article-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: sticky;
  top: 24px;
  align-self: start;
}
.article-nav > p {
  margin: 24px 12px 8px;
}
.article-nav > a {
  padding: 10px 12px;
  min-height: 44px;
  font-size: 14px;
  color: #575e54;
}
.article-nav > a:hover {
  background: #e8ebe4;
  border-radius: 6px;
}
.article-nav > .button {
  color: white;
  margin: 16px 12px;
}
.editorial-content h1 {
  margin: 24px 0;
  font-size: 42px;
  line-height: 1.15;
}
.article-lead {
  font-size: 19px;
  line-height: 1.6;
  color: var(--secondary);
  margin-bottom: 48px;
}
.editorial-content section {
  scroll-margin-top: 32px;
  margin: 40px 0;
}
.editorial-content section h2 {
  font-size: 26px;
  margin-bottom: 20px;
}
.editorial-content section p {
  color: #575c55;
  font-size: 16px;
  line-height: 1.85;
}
.article-art {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border: 8px solid #fbfbf8;
  border-radius: 16px;
  box-shadow: 0 0 0 1px var(--border);
  image-rendering: pixelated;
}
.article-end {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--border);
  padding-top: 24px;
  margin-top: 48px;
  color: var(--secondary);
}
.article-end p {
  font-size: 14px;
  margin: 0;
}
.article-end a {
  text-decoration: underline;
}
.legal-page {
  padding-top: 64px;
}
.legal-page h1 {
  margin-top: 24px;
}
.legal-page section {
  margin: 40px 0;
}
.legal-page section p {
  color: var(--secondary);
  line-height: 1.8;
}
@media (max-width: 1000px) {
  .hero-copy h1 {
    font-size: 54px;
  }
  .hero {
    min-height: 620px;
  }
  .preview-body aside {
    position: static;
  }
  .reader-preview {
    overflow: hidden;
  }
  .editorial-layout {
    gap: 40px;
    grid-template-columns: 200px minmax(0, 1fr);
  }
  .sharing-section {
    gap: 40px;
  }
  .article-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .hero {
    min-height: 660px;
  }
  .hero-copy {
    padding: 54px 24px 220px;
  }
  .hero-copy h1 {
    font-size: 42px;
    letter-spacing: -1.3px;
  }
  .hero-copy p {
    font-size: 15px;
    max-width: 320px;
  }
  .hero-copy p br {
    display: none;
  }
  .hero-copy .row {
    gap: 10px;
  }
  .hero-primary,
  .hero-secondary {
    font-size: 13px;
    padding: 11px 12px;
  }
  .hero-art {
    object-position: 64% center;
  }
  .garden-callout {
    bottom: 32px;
    right: 20px;
    left: 20px;
    padding: 16px;
    justify-content: space-between;
  }
  .garden-callout small {
    max-width: 240px;
    line-height: 1.5;
  }
  .formats-band {
    flex-wrap: wrap;
    justify-content: center;
    padding: 28px 16px;
    gap: 20px;
  }
  .formats-band > span {
    width: 100%;
    text-align: center;
  }
  .formats-band div {
    font-size: 12px;
    gap: 7px;
  }
  .marketing-section {
    padding: 64px 20px;
  }
  .section-heading h2 {
    font-size: 29px;
  }
  .section-heading p {
    font-size: 14px;
  }
  .section-heading p br {
    display: none;
  }
  .preview-top {
    padding: 12px;
    flex-wrap: wrap;
    font-size: 12px;
  }
  .preview-top > .row {
    max-width: 220px;
  }
  .preview-top .preview-page {
    display: none;
  }
  .preview-body {
    height: 405px;
    padding: 22px 14px;
  }
  .preview-body aside {
    display: none;
  }
  .paper-preview {
    width: 270px;
    padding: 24px;
    min-height: 360px;
  }
  .paper-preview h3 {
    font-size: 23px;
  }
  .sharing-section {
    grid-template-columns: 1fr;
    gap: 32px;
    padding-top: 0;
  }
  .sharing-section h2 {
    font-size: 30px;
  }
  .sharing-section > div > p {
    max-width: none;
  }
  .link-examples {
    padding: 6px 18px;
  }
  .sample-link {
    padding: 20px 0;
  }
  .quiet-section {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .faq-section h2 {
    font-size: 29px;
  }
  .closing-section {
    padding: 32px 20px 64px;
  }
  .closing-section h2 {
    font-size: 32px;
  }
  .help-page {
    padding-top: 40px;
  }
  .help-heading h1 {
    font-size: 32px;
  }
  .article-grid {
    grid-template-columns: 1fr;
  }
  .help-card {
    min-height: 220px;
    padding: 24px;
  }
  .help-card h2 {
    margin-top: 20px;
  }
  .editorial-layout {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-top: 32px;
  }
  .article-nav {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
    gap: 4px;
  }
  .article-nav > p,
  .article-nav .divider,
  .article-nav .divider ~ a {
    display: none;
  }
  .article-nav > a {
    font-size: 12px;
    padding: 8px;
  }
  .article-nav > .button {
    margin: 0;
  }
  .editorial-content h1 {
    font-size: 34px;
  }
  .article-lead {
    font-size: 17px;
    margin-bottom: 32px;
  }
  .article-art {
    height: 220px;
  }
  .editorial-content section h2 {
    font-size: 24px;
  }
  .legal-page {
    padding-top: 40px;
  }
}
@media (max-width: 360px) {
  .hero-copy {
    padding-left: 16px;
    padding-right: 16px;
  }
  .hero-copy h1 {
    font-size: 38px;
  }
  .hero-copy .row {
    flex-direction: column;
    align-items: flex-start;
  }
  .hero {
    min-height: 700px;
  }
  .hero-note {
    max-width: 260px;
  }
  .formats-band {
    gap: 16px;
  }
  .formats-band div {
    font-size: 11px;
  }
  .garden-callout {
    right: 12px;
    left: 12px;
    gap: 10px;
  }
  .garden-callout > svg {
    display: none;
  }
  .callout-icon {
    padding: 8px;
  }
  .help-categories {
    gap: 4px;
  }
  .help-categories button {
    padding: 8px 11px;
    font-size: 13px;
  }
}
</style>
