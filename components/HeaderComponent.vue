<script setup>
import { useUserStore } from "@/stores/UserStore";
const userStore = useUserStore();
</script>
<template>
  <div class="container-fluid mx-0 px-0 mx-lg-auto header-container">
    <header class="d-flex flex-wrap align-items-center justify-content-evenly justify-content-md-between pt-3 pb-1 py-md-3 mb-2 mb-md-3 border-bottom">
      <NuxtLink to="/" class="d-flex align-items-center col-2 col-md-3 mb-2 mb-md-0 ms-md-3 text-dark text-decoration-none">
        <img src="~/assets/images/clock_logo.png" alt="Timer for friends" class="img-logo">
      </NuxtLink>

      <ul class="nav col-auto mb-2 justify-content-center mb-md-0">
        <li>
          <NuxtLink to="/" class="nav-link px-2 link-secondary">Home</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/timers" class="nav-link px-2 link-secondary">Timers</NuxtLink>
        </li>
      </ul>
      <div v-if="!userStore.usrChecked" class="col-4 col-md-3 text-end mb-2 mb-md-0 me-md-3 loadings-buttons">
        <button type="button" class="btn btn-primary me-1" data-bs-toggle="modal" data-bs-target="#login-backdrop">Loading</button>
      </div>
      <div v-else-if="!userStore.isLogged" class="col-4 col-md-3 text-end mb-2 mb-md-0 me-md-3 login-buttons">
        <button type="button" class="btn btn-outline-primary me-1" data-bs-toggle="modal" data-bs-target="#login-backdrop">Login</button>
        <button type="button" class="btn btn-primary" @click="toUserRegister">Sign-up</button>
      </div>
      <div v-else class="col-4 col-md-3 mb-2 mb-md-0 text-end me-md-3 my-accound-buttons">
        <button type="button" class="btn btn-secondary me-2" @click.once="userStore.logout()">Logout</button>
        <!-- <button type="button" class="btn btn-primary my-account-btn" @click="toUserIndex">My Account</button> Temporary blocked until we find useful -->
      </div>
    </header>
    <!-- Modal -->
    <div class="modal fade" id="login-backdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="Login" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropLabel">Login</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <loginFormComponent :user-store="userStore"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HeaderComponent",
  data() {
    return {
      modalOpen: false
    }
  },
  methods: {
    async toUserRegister() {
      return await navigateTo('/user/signup-form');
    },
    async toUserIndex() {
      return await navigateTo('/user');
    }
  }
}
</script>

<style scoped lang="scss">
.header-container {
  max-width: 1200px;

  header {
    font-size: 20px;
    line-height: 20px;

    button.btn {
      font-size: 15px;
      line-height: 15px;
      padding: 5px;
    }

    .img-logo {
      width: 80%;

      @media screen and (min-width: 576px) {
        width: 50px;
      }
    }
  }
}
</style>