<template>
  <div class="col-12 text-center form-container">
    <form action="/login" @submit.stop.prevent="() => login(userStore!)">
      <div v-if="formMessages" :class="`messages ${(hasErrors ? 'error' : '')}`">
        <span> {{ formMessages }} </span>
      </div>
      <div class="form-floating">
        <input type="email" id="login-email" class="form-control email" placeholder="name@example.com" v-model="creds.email" required>
        <label for="login-email">Email address</label>
      </div>
      <div class="form-floating">
        <input type="password" id="login-password" class="form-control password" placeholder="Password" v-model="creds.password" required>
        <label for="login-password">Password</label>
      </div>
      <button class="btn btn-primary mt-2" type="submit">Login</button>
    </form>
    <IsLoadingComponent v-if="isLoading" />
  </div>
</template>

<script lang="ts">
import { authErrorMessage } from '~/utils/authErrors'
import type { PropType } from 'vue'
import type { UserStore } from '~/types/stores'

export default {
  name: "LoginFormComponent",
  data() {
    return {
      creds: {
        email: '',
        password: ''
      },
      formMessages: '',
      isLoading: false,
      hasErrors: false
    }
  },
  props: {
    userStore: Object as PropType<UserStore>
  },
  methods: {
    login(userStore: UserStore) {
      if (!this.isLoading) {
        this.isLoading = true;
        userStore.login(this.creds)
            .then((response) => {
              if (response.user) {
                this.isLoading = false;
                // Cierra el modal que contiene este formulario (no el primer .btn-close de la página)
                const modalEl = (this.$el as HTMLElement).closest('.modal');
                if (modalEl) {
                  this.$bootstrap.Modal.getOrCreateInstance(modalEl).hide();
                }
                this.formMessages = '';
                this.creds = {
                  email: '',
                  password: ''
                };
              } else {
                this.hasErrors = true;
                this.formMessages = authErrorMessage(response);
                this.isLoading = false;
              }
            })
            .catch((error) => {
              this.hasErrors = true;
              this.formMessages = authErrorMessage(error);
              this.isLoading = false;
            });
      }
    }
  }
}
</script>

<style scoped lang="scss">
.form-container {
  position: relative;

  .messages {
    font-size: 12px;
    padding: 0 10px 5px;

    &.error {
      color: #e71313;
    }
  }

  input.email {
    margin-bottom: -1px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  input.password {
    margin-top: -1px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
}
</style>