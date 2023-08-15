<script setup>
import { useUserStore } from "@/stores/UserStore";
const userStore = useUserStore();

useHead({
  title: 'Timer for friends | Register form'
})
</script>

<template>
  <div class="container user-register-page">
    <div class="row">
      <div class="col-12 text-center form-container">
        <form action="/register" @submit.stop.prevent="() => register(userStore)">
          <div v-if="formMessages" :class="`messages ${(hasErrors ? 'error' : '')}`">
            <span> {{ formMessages }} </span>
          </div>
          <div class="form-floating">
            <input type="text" class="form-control firstname" name="firstname" placeholder="Jhon" v-model="user.firstName" required>
            <label for="firstname">First Name</label>
          </div>
          <div class="form-floating">
            <input type="text" class="form-control lastname" name="lastname" placeholder="Doe" v-model="user.lastName" required>
            <label for="lastname">Last Name</label>
          </div>
          <div class="form-floating">
            <input type="email" class="form-control email"  name="email" placeholder="name@example.com" v-model="user.email" required>
            <label for="email">Email address</label>
          </div>
          <div class="form-floating">
            <input type="password" class="form-control password" placeholder="Password" v-model="user.password" required>
            <label for="password">Password</label>
          </div>
          <button class="btn btn-primary mt-2" type="submit">Sign In</button>
        </form>
        <is-loading-component v-if="isLoading"/>
      </div>
    </div>
  </div>
</template>

<script>
import IsLoadingComponent from "./../IsLoadingComponent";

export default {
  name: "UserRegisterForm",
  components: { IsLoadingComponent },
  data() {
    return {
      user: {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      },
      formMessages: '',
      isLoading: false,
      hasErrors: false
    }
  },
  methods: {
    register(userStore) {
      if(!this.isLoading) {
        this.hasErrors = false;
        this.isLoading = true;
        userStore.register(this.user)
            .then((response) => {
              if (response.user) {
                navigateTo('/');
              } else {
                this.hasErrors = true;
                this.formMessages = response.message.split(':')[1];
              }
              this.isLoading = false;
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
.user-register-page {
  margin-bottom: 30px;

  .form-container {
    position: relative;

    .messages {
      font-size: 12px;
      padding: 0 10px 5px;

      &.error {
        color: #e71313;
      }
    }

    .form-floating {
      input.form-control {
        font-size: 12px;
        line-height: 12px;
        min-height: 0;
        height: 50px;

        &.firstname, &.email, &.lastname {
          margin-bottom: -1;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }

        &.password, &.lastname, &.email {
          margin-top: -1;
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }
      }
      label {
        font-size: 12px;
        line-height: 12px;
      }

      > .form-control:not(:placeholder-shown) ~ label::after {
        background-color: transparent;
      }
    }
  }
}
</style>