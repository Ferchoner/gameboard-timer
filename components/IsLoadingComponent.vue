<template>
  <div class="loading-container">
    <div v-if="failed" class="loading-failed" role="alert">
      <p>Couldn't connect. Check your connection and reload.</p>
      <button type="button" class="btn btn-light" @click="reload">Reload</button>
    </div>
    <img v-else src="~/assets/images/loading_icon.svg" alt="Loading..." class="loading-img">
  </div>
</template>

<script lang="ts">
export default {
  name: "IsLoadingComponent",
  props: {
    failed: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    reload() {
      window.location.reload();
    }
  }
}
</script>

<style scoped lang="scss">
@keyframes loading {
  from {
    transform: translateY(-50%) rotate(0deg);
  }
  to {
    transform: translateY(-50%) rotate(359deg);
  }
}

.loading-container {
  background-color: #1d1d1b88;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  z-index: 990;

  .loading-failed {
    align-self: center;
    max-width: 90%;
    padding: 20px;
    border-radius: 8px;
    background-color: #1d1d1b;
    color: #ffffff;
    text-align: center;

    p {
      margin-bottom: 12px;
    }
  }

  img.loading-img {
    position: relative;
    width: 30%;
    top: 50%;
    animation: loading 2s infinite linear;

    @media screen and (min-width: 576px) {
      width: 50%;
    }
  }
}
</style>