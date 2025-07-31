<template>
  <div v-if="appReady" id="app">
    <nav class="p-4 bg-green-600 text-white">
      <router-link to="/" class="mr-4" exact></router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "App",
  computed: {
    ...mapState(["isAuthenticated", "user"]),
    appReady() {
      return this.isAuthenticated === false || this.user !== null;
    },
  },
  mounted() {
    console.log("User from store (mounted):", this.user);
  },
};
</script>
