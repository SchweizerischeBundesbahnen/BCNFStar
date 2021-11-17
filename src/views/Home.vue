<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <!-- <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" /> -->
    <button v-on:click="test()">Test</button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import { ipcRenderer } from "electron";

@Component({
  components: {
    HelloWorld,
  },
})
export default class Home extends Vue {
  private async test() {
    alert(await ipcRenderer.invoke("getDBConnection"));
  }
}
</script>
