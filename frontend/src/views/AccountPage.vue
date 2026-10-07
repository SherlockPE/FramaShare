<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BookOpen, Eye, EyeOff, ArrowLeft, Check, Mail } from "@lucide/vue";
import { delay, signIn, notify } from "../services/store";
const route = useRoute(),
  router = useRouter(),
  email = ref(""),
  name = ref(""),
  password = ref(""),
  confirm = ref(""),
  show = ref(false),
  busy = ref(false),
  error = ref(""),
  done = ref(false),
  submitted = ref(false);
const mode = computed(() => route.path.slice(1)),
  signup = computed(() => mode.value === "sign-up"),
  forgot = computed(() => mode.value === "forgot-password"),
  reset = computed(() => mode.value === "reset-password");
const title = computed(() =>
  forgot.value
    ? "A fresh start."
    : reset.value
    ? "Choose a new password."
    : signup.value
    ? "Make room for your documents."
    : "Good to see you again."
);
const emailError = computed(() =>
  submitted.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    ? "Enter a valid email address."
    : ""
);
const passwordError = computed(() =>
  submitted.value && password.value.length < 8 ? "Use at least 8 characters." : ""
);
const target = computed(() =>
  typeof route.query.return === "string" &&
  route.query.return.startsWith("/") &&
  !route.query.return.startsWith("//")
    ? route.query.return
    : "/app/library"
);
function link(path: string) {
  return { path, query: route.query.return ? { return: route.query.return } : undefined };
}
watch(
  () => route.path,
  () => {
    done.value = false;
    error.value = "";
    submitted.value = false;
    password.value = "";
    confirm.value = "";
  }
);
async function submit() {
  submitted.value = true;
  error.value = "";
  if ((!reset.value && emailError.value) || (!forgot.value && passwordError.value))
    return;
  if (signup.value && !name.value.trim()) {
    error.value = "Enter your name.";
    return;
  }
  if (reset.value && password.value !== confirm.value) {
    error.value = "The passwords do not match.";
    return;
  }
  busy.value = true;
  try {
    await delay();
    if (forgot.value || reset.value) {
      done.value = true;
      password.value = "";
      confirm.value = "";
      if (reset.value) notify("Password reset simulated");
    } else {
      signIn(
        email.value.trim().toLowerCase(),
        signup.value ? name.value.trim() : undefined
      );
      password.value = "";
      notify(signup.value ? "Account created" : "Signed in");
      await router.push(target.value);
    }
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="account-layout">
    <aside class="account-art">
      <img
        src="/samples/reading-garden.svg"
        alt="Pixel art of a quiet garden with a reading corner"
      />
      <div class="art-copy">
        <BookOpen :size="34" stroke-width="1.4" />
        <h2>A little space<br />for shared reading.</h2>
        <p>
          Your workshop notes, favourite stories,<br />and everything worth passing on.
        </p>
        <div class="art-note">
          <BookOpen :size="18" /><span>One document. A world of readers.</span>
        </div>
      </div>
    </aside>
    <section class="account-form">
      <div class="form-inner">
        <RouterLink class="form-brand" to="/"
          ><BookOpen :size="28" stroke-width="1.4" />Framashare</RouterLink
        >
        <h1>{{ title }}</h1>
        <p class="muted">
          {{
            forgot
              ? "We’ll help you get back to your library."
              : reset
              ? "Give your library a new key."
              : signup
              ? "Keep your publications together, ready to share."
              : "Your reading room is right where you left it."
          }}
        </p>
        <template v-if="!forgot && !reset"
          ><nav class="auth-tabs" aria-label="Account access">
            <RouterLink :class="{ selected: !signup }" :to="link('/sign-in')"
              >Sign in</RouterLink
            ><RouterLink :class="{ selected: signup }" :to="link('/sign-up')"
              >Sign up</RouterLink
            >
          </nav></template
        >
        <div v-if="done" class="confirmation" role="status">
          <span class="confirmation-icon"><Check /></span>
          <h2>{{ forgot ? "Check your inbox" : "You’re all set" }}</h2>
          <p>
            {{
              forgot
                ? `A reset message for ${email} has been simulated. No email was sent.`
                : "Your new password has been accepted in this local demonstration."
            }}
          </p>
          <RouterLink v-if="forgot" class="button" :to="link('/reset-password')"
            >Open demo reset link</RouterLink
          ><RouterLink v-else class="button" :to="link('/sign-in')"
            >Back to sign in</RouterLink
          >
        </div>
        <form v-else @submit.prevent="submit" class="stack" novalidate>
          <label v-if="signup" class="field"
            >Your name<input
              v-model="name"
              autocomplete="name"
              placeholder="Alex Morgan"
              required /></label
          ><label v-if="!reset" class="field"
            >Email address<input
              aria-label="Email address"
              v-model="email"
              autocomplete="email"
              type="email"
              placeholder="you@example.com"
              :aria-invalid="!!emailError"
              :aria-describedby="emailError ? 'email-error' : undefined"
              required
            /><span v-if="emailError" id="email-error" class="error small">{{
              emailError
            }}</span></label
          ><label v-if="!forgot" class="field"
            >{{ reset ? "New password" : "Password"
            }}<span class="password-input"
              ><input
                :aria-label="reset ? 'New password' : 'Password'"
                v-model="password"
                :type="show ? 'text' : 'password'"
                :autocomplete="signup || reset ? 'new-password' : 'current-password'"
                placeholder="At least 8 characters"
                :aria-invalid="!!passwordError"
                :aria-describedby="passwordError ? 'password-error' : undefined"
                required /><button
                type="button"
                :aria-label="show ? 'Hide password' : 'Show password'"
                @click="show = !show"
              >
                <EyeOff v-if="show" :size="19" /><Eye v-else :size="19" /></button></span
            ><span v-if="passwordError" id="password-error" class="error small">{{
              passwordError
            }}</span></label
          ><label v-if="reset" class="field"
            >Confirm new password<input
              v-model="confirm"
              :type="show ? 'text' : 'password'"
              autocomplete="new-password"
              required /></label
          ><RouterLink
            v-if="!signup && !forgot && !reset"
            class="forgot-link"
            :to="link('/forgot-password')"
            >Forgot your password?</RouterLink
          >
          <p v-if="error" class="alert error" role="alert">{{ error }}</p>
          <button class="button account-submit" :disabled="busy">
            {{
              busy
                ? "Please wait…"
                : forgot
                ? "Send reset link"
                : reset
                ? "Save new password"
                : signup
                ? "Create account"
                : "Sign in"
            }}<Mail v-if="forgot" :size="17" />
          </button>
        </form>
        <p class="terms-note" v-if="!done && !forgot && !reset">
          By continuing, you agree to our<br /><RouterLink to="/privacy"
            >Privacy notice</RouterLink
          >
          and <RouterLink to="/terms">Terms of use</RouterLink>.
        </p>
        <RouterLink v-if="forgot || reset" class="back-link" :to="link('/sign-in')"
          ><ArrowLeft :size="16" /> Back to sign in</RouterLink
        >
        <p class="demo-note">
          Local prototype. Accounts and emails are simulated.<br />Demo: alex@example.com
          / readingroom
        </p>
      </div>
    </section>
  </div>
</template>
<style scoped>
.account-layout {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  min-height: 780px;
  padding: 28px;
  gap: 32px;
}
.account-art {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  min-height: 720px;
  background: #87c6df;
  box-shadow: 0 3px 20px #183f3020;
}
.account-art > img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  object-position: 65% center;
}
.account-art::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(#15465a33, #15465a55, transparent);
  pointer-events: none;
}
.art-copy {
  position: relative;
  text-align: center;
  padding: 135px 24px 0;
  z-index: 1;
  color: #fff;
  text-shadow: 0 1px 2px #214a4c55;
}
.art-copy h2 {
  font-size: 36px;
  line-height: 1.15;
  margin: 24px 0 16px;
}
.art-copy p {
  font-size: 16px;
}
.art-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 40px auto;
  background: #fbfbf8e8;
  color: #262323;
  border: 1px solid white;
  border-radius: 10px;
  max-width: 310px;
  padding: 18px;
  text-shadow: none;
  font-size: 14px;
}
.account-form {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}
.form-inner {
  width: 100%;
  max-width: 385px;
}
.form-brand {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  letter-spacing: -1px;
  margin-bottom: 32px;
}
.account-form h1 {
  font-size: 26px;
  text-align: center;
  letter-spacing: -0.6px;
  margin-bottom: 12px;
}
.account-form > .form-inner > p {
  text-align: center;
  font-size: 14px;
}
.auth-tabs {
  display: flex;
  max-width: 245px;
  margin: 30px auto;
  border: 1px solid var(--border);
  border-radius: 30px;
  padding: 3px;
  background: #edeee9;
}
.auth-tabs a {
  width: 50%;
  padding: 8px;
  text-align: center;
  font-size: 13px;
  color: var(--secondary);
}
.auth-tabs .selected {
  border-radius: 30px;
  background: var(--surface);
  box-shadow: 0 1px 3px #0002;
  color: var(--text);
}
.password-input {
  position: relative;
  display: block;
}
.password-input input {
  padding-right: 50px;
}
.password-input button {
  position: absolute;
  right: 2px;
  top: 2px;
  height: 42px;
  width: 44px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.forgot-link {
  text-align: right;
  font-size: 13px;
  margin-top: -8px;
}
.account-submit {
  border-radius: 30px;
  min-height: 48px;
}
.terms-note {
  margin-top: 28px;
  font-size: 12px !important;
  color: var(--secondary);
}
.terms-note a {
  text-decoration: underline;
}
.demo-note {
  margin-top: 36px;
  font-size: 12px !important;
  line-height: 1.7;
}
.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 14px;
}
.confirmation {
  text-align: center;
  padding: 24px 0;
}
.confirmation-icon {
  display: inline-flex;
  padding: 14px;
  background: #e6eee4;
  border-radius: 50%;
  margin-bottom: 20px;
}
.confirmation p {
  font-size: 14px;
  overflow-wrap: anywhere;
}
@media (max-width: 900px) {
  .account-layout {
    padding: 20px;
    gap: 16px;
    min-height: 720px;
  }
  .account-art {
    min-height: 650px;
  }
  .art-copy {
    padding: 100px 20px 0;
  }
  .art-copy h2 {
    font-size: 29px;
  }
  .account-form {
    padding: 32px 12px;
  }
}
@media (max-width: 650px) {
  .account-layout {
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 0;
    min-height: 0;
  }
  .account-art {
    height: 165px;
    min-height: 165px;
  }
  .account-art > img {
    object-position: center 42%;
  }
  .art-copy {
    padding: 38px 12px;
  }
  .art-copy > svg,
  .art-copy p,
  .art-note {
    display: none;
  }
  .art-copy h2 {
    font-size: 25px;
    margin: 0;
  }
  .account-form {
    padding: 36px 12px 20px;
  }
  .form-brand {
    font-size: 28px;
    margin-bottom: 24px;
  }
  .account-form h1 {
    font-size: 24px;
  }
  .demo-note {
    margin-top: 24px;
  }
}
</style>
