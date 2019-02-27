<template>
    <div class="md-layout md-alignment-center-center" style="height: 100vh;">
        <md-card class="md-layout-item md-size-50">
            <md-card-header>
                <div class="md-title">Register</div>
            </md-card-header>
            <!-- Register Form -->
            <form @submit.prevent="validateForm">
                <md-card-content>
                    <md-field md-clearable
                        :class="getValidationClass('email')">
                        <label for="email">Email</label>
                        <md-input type="email" name="email" id="email" autocomplete="email"
                            :disabled="loading"
                            v-model="form.email"></md-input>
                        <span class="md-error" v-if="!$v.form.email.required">The email is required</span>
                        <span class="md-error" v-else-if="!$v.form.email.email">Invalid email</span>
                    </md-field>
                    <md-field md-clearable
                        :class="getValidationClass('password')">
                        <label for="password">Password</label>
                        <md-input type="password" name="password" id="password" autocomplete="password"
                            :disabled="loading"
                            v-model="form.password"></md-input>
                        <span class="md-error" v-if="!$v.form.password.required">A password is required</span>
                        <span class="md-error" v-else-if="!$v.form.password.minLength">Password is too short</span>
                        <span class="md-error" v-else-if="!$v.form.password.maxLength">Password is too long</span>
                    </md-field>
                </md-card-content>
                <md-card-actions>
                    <md-button><nuxt-link to="/login">Go to Login</nuxt-link></md-button>
                    <md-button class="md-primary md-raised" type="submit"
                        :disabled="loading">Submit</md-button>
                </md-card-actions>
            </form>
            <md-snackbar :md-active.sync="isAuthenticated">
                {{ form.email }} was successfully registered!
            </md-snackbar>
        </md-card>
        <!-- back button -->
        <md-button 
            class="md-fab md-fab-bottom-right md-fab md-fixed md-primary"
            @click="$router.go(-1)">
            <md-icon>arrow_back</md-icon>
        </md-button>
    </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import {
  required,
  email,
  minLength,
  maxLength
} from "vuelidate/lib/validators";
export default {
  mixins: [validationMixin],
  middleware: "auth",
  data: () => ({
    form: {
      email: "",
      password: ""
    }
  }),
  validations: {
    form: {
      email: {
        required,
        email
      },
      password: {
        required,
        minLength: minLength(6),
        maxLength: maxLength(20)
      }
    }
  },
  computed: {
    loading() {
      return this.$store.getters.loading;
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    }
  },
  watch: {
    isAuthenticated(value) {
      if (value) {
        setTimeout(() => this.$router.push("/"), 2000);
      }
    }
  },
  methods: {
    validateForm() {
      this.$v.$touch();
      if (!this.$v.$invalid) {
        this.registerUser();
      }
    },
    getValidationClass(fieldName) {
      const field = this.$v.form[fieldName];
      if (field) {
        return {
          "md-invalid": field.$invalid && field.$dirty
        };
      }
    },
    async registerUser() {
      await this.$store.dispatch("authenticateUser", {
        action: "register",
        email: this.form.email,
        password: this.form.password,
        returnSecureToken: true
      });
    }
  }
};
</script>

