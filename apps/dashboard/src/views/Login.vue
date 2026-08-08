<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h1 class="text-center text-3xl font-bold text-gray-900">Chatwoot</h1>
        <h2 class="mt-2 text-center text-sm text-gray-600">
          Cloudflare-native customer support
        </h2>
      </div>

      <div class="bg-white rounded-lg shadow-md p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="isSignup">
            <label for="name" class="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div v-if="authStore.error" class="text-red-600 text-sm">
            {{ authStore.error }}
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {{ authStore.loading ? "Loading..." : isSignup ? "Sign Up" : "Sign In" }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm">
          <button
            @click="isSignup = !isSignup"
            class="text-primary-600 hover:text-primary-500"
          >
            {{ isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const isSignup = ref(false);
const form = reactive({
  name: "",
  email: "",
  password: "",
});

async function handleSubmit() {
  let success;

  if (isSignup.value) {
    success = await authStore.signup(form.name, form.email, form.password);
  } else {
    success = await authStore.signin(form.email, form.password);
  }

  if (success) {
    router.push("/");
  }
}
</script>
