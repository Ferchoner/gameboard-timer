<template>
  <div class="loading-container">
    <img src="~/assets/images/loading_icon.svg" alt="Loading..." class="loading-img">
  </div>
</template>

<script>
export default {
  name: "IsLoadingComponent"
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