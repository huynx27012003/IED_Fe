<template>
  <div id="windows">
    <TopBar id="top-bar" />
    <section id="main-windows">
      <router-view ref="mainWindows" />
    </section>
    <LogBar id="log-bar" />
  </div>
</template>

<script>
/* eslint-disable */
import TopBar from "@/components/TopBar/index.vue";
import LogBar from "@/components/LogBar/index.vue";

export default {
  components: {
    TopBar,
    LogBar,
  },
  mounted() {
    this.$nextTick(() => {
      const mainSection =
        this.$refs.mainWindows?.$el || document.getElementById("main-windows");
      if (mainSection) {
        mainSection.style.height = "calc(100vh - 4vh - 2.5vh)";
      }
    });
  },
};
</script>

<style lang="scss">
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  font-family: Roboto, -apple-system, BlinkMacSystemFont, Helvetica, Arial,
    sans-serif;
  font-weight: 400;
}

#windows {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#top-bar {
  flex: 0 0 4vh;
  z-index: 9999;
}

#main-windows {
  flex: 1;
  height: calc(100vh - 4vh - 2.5vh);
  overflow: visible;
}
#log-bar {
  position: fixed;
  left: 48px;
  bottom: 0;
  width: calc(100% - 48px);
  height: 2.5vh !important;
  z-index: 9999;
  box-shadow: none;
  background: transparent;
}

[id] {
  scroll-margin-top: 80px;
}
</style>
