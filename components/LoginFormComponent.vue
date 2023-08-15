<template>
  <div class="col-12 text-center form-container">
    <form action="/login" @submit.stop.prevent="() => login(userStore)">
      <div v-if="formMessages" :class="`messages ${(hasErrors ? 'error' : '')}`">
        <span> {{ formMessages }} </span>
      </div>
      <div class="form-floating">
        <input type="email" class="form-control email" placeholder="name@example.com" v-model="creds.email" required>
        <label for="floatingInput">Email address</label>
      </div>
      <div class="form-floating">
        <input type="password" class="form-control password" placeholder="Password" v-model="creds.password" required>
        <label for="floatingPassword">Password</label>
      </div>
      <button class="btn btn-primary mt-2" type="submit">Login</button>
    </form>
    <IsLoadingComponent v-if="isLoading" />
  </div>
</template>

<script>

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
    userStore: Object
  },
  methods: {
    login(userStore) {
      if (!this.isLoading) {
        this.isLoading = true;
        userStore.login(this.creds)
            .then((response) => {
              if (response.user) {
                this.isLoading = false;
                const closeIcon = document.querySelector('.btn-close')
                if (closeIcon) {
                  closeIcon.dispatchEvent(new Event('click'))
                }
                this.formMessages = '';
                this.creds = {
                  email: '',
                  password: ''
                };
              } else {
                this.hasErrors = true;
                this.formMessages = response.message.split(':')[1];
                this.isLoading = false;
              }
            })
            .catch((error) => {
              this.hasErrors = true;
              this.formMessages = error.message.split(':')[1];
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