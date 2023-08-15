<template>
  <div class="d-flex fixed-top light-header justify-content-between px-2">
    <button class="btn btn-link text-white p-0 m-1" @click="toHome">
      <span class="material-symbols-outlined cursor-pointer">
        home
      </span>
    </button>
    <button class="btn btn-link text-white p-0 m-1" @click="$router.back()">
      <span class="material-symbols-outlined cursor-pointer">
        cancel
      </span>
    </button>
  </div>
</template>

<script>
export default {
  name: "LightHeader",
  methods: {
    toHome: async () => await navigateTo('/')
  }
}
</script>

<style scoped>
.light-header {
  background-color: #ffffff33;
}
</style>