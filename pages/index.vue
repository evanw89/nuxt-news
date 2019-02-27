<template>
  <div class="md-layout md-alignment-center" style="margin: 4rem 0;">
    
    <!-- App navigation -->
    <md-toolbar elevation="1" class="fixed-toolbar">

      <md-button @click="showLeftSidepanel = true" class="md-icon-button">
        <md-icon>menu</md-icon>
      </md-button>

      <nuxt-link class="md-primary md-title" to="/">
        NuxtNews
      </nuxt-link>

      <template v-if="isAuthenticated">
        <div class="md-toolbar-section-end">
          <md-button>
            <md-avatar>
              <img :src="user.avatar" alt="user.email">
            </md-avatar>
            {{ user.email }}
          </md-button>
          <md-button @click="logoutUser">Logout</md-button>
          <md-button class="md-primary" @click="showSearchDialog = true">Search</md-button>
          <md-button class="md-accent" @click="showRightSidepanel = true">Categories</md-button>
        </div>
      </template>

      <template v-else>
        <div class="md-toolbar-section-end">
          <md-button><nuxt-link to="/login">Login</nuxt-link></md-button>
          <md-button><nuxt-link to="/register">Register</nuxt-link></md-button>
          <md-button class="md-primary" @click="showSearchDialog = true">Search</md-button>
          <md-button class="md-accent" @click="showRightSidepanel = true">Categories</md-button>
        </div>
      </template>
    </md-toolbar>

    <!-- search dialog -->
    <md-dialog :md-active.sync="showSearchDialog">
      <md-dialog-title>Search Headlines</md-dialog-title>
      <div class="md-layout" style="padding: 1rem;">
        <md-field>
          <label>Search Term(s)</label>
          <md-input v-model="query" placeholder="Use quotes for exact matches, AND / OR / NOT for multiple terms" maxlength="30"></md-input>
        </md-field>
        <md-datepicker v-model="fromDate" md-immediately>
          <label>Select starting date (optional)</label>
        </md-datepicker>
        <md-datepicker v-model="toDate" md-immediately>
          <label>Select ending date (optional)</label>
        </md-datepicker>
        <md-field>
          <label for="sortBy">Sort search results by criteria (optional)</label>
          <md-select v-model="sortBy" name="sortBy" id="sortBy" md-dense>
            <md-option value="publishedAt">Newest (default)</md-option>
            <md-option value="relevancy">Relevant</md-option>
            <md-option value="popularity">Popular</md-option>
          </md-select>
        </md-field>
      </div>
      <md-dialog-actions>
        <md-button class="md-accent" @click="showSearchDialog = false">Cancel</md-button>
        <md-button class="md-primary" @click="searchHeadlines">Search</md-button>
      </md-dialog-actions>
    </md-dialog>

    <!-- News Category Sidepanel (Right Drawer) -->
    <md-drawer class="md-right" md-fixed :md-active.sync="showRightSidepanel">
      <md-toolbar :md-elevation="1">
        <span>News Categories</span>
      </md-toolbar>
      <md-progress-bar v-if="loading" md-mode='indeterminate'></md-progress-bar>
      <md-list>
        <md-subheader class="md-primary">Categories</md-subheader>
          <md-list-item 
            v-for="(newsCategory, i) in newsCategories" 
            :key="i"
            @click="loadCategory(newsCategory.path)">
            <md-icon :class="newsCategory.path === category ? 'md-primary': ''">{{ newsCategory.icon }}</md-icon>
            <span class="md-list-item-text">{{ newsCategory.name }}</span>
          </md-list-item>
      </md-list>
    </md-drawer>

    <!-- Personal News Feed (Left Drawer) -->
    <md-drawer md-fixed :md-active.sync="showLeftSidepanel">
      <md-toolbar md-elevation="1">
        <span class="md-title">Personal Feed</span>
      </md-toolbar>
      <md-progress-bar v-if="loading" md-mode='indeterminate'></md-progress-bar>
      <md-field>
        <label for="country">Country</label>
        <md-select name="country" id="country"
        :value="country"
          @input="changeCountry">
          <md-option value="us">United States</md-option>
          <md-option value="ca">Canada</md-option>
          <md-option value="de">Germany</md-option>
          <md-option value="ru">Russia</md-option>
        </md-select>
      </md-field>
      <!-- Default Markup -->
      <md-empty-state class="md-primary" 
        v-if="feed.length === 0 && !user"
        md-icon="bookmarks" 
        md-label="Nothing in Feed" 
        md-description="Login to bookmark headlines!">
        <nuxt-link to="/login"><md-button class="md-primary md-raised">Login</md-button></nuxt-link>
      </md-empty-state>
      <md-empty-state 
        class="md-accent"
        v-else-if="feed.length === 0" 
        md-icon="bookmark_outline" 
        md-label="Nothing in Feed" 
        md-description="Anything you bookmark will be safely stored here!">
      </md-empty-state>

      <!-- Feed Content -->
      <md-list class="md-triple-line" 
        v-else
        v-for="headline in feed" 
        :key="headline.id">
        <md-list-item>
          <md-avatar>
            <img :src="headline.urlToImage" :alt="headline.title">
          </md-avatar>
          <div class="md-list-item-text">
            <span><a :href="headline.url" target="_blank">{{ headline.title }}</a></span>
            <span>{{ headline.source.name }}</span>
            <span @click="saveHeadline(headline)" style="cursor: pointer">View Comments</span>
          </div>
          <md-button 
            class="md-icon-button md-list-action"
            @click="removeHeadlineFromFeed(headline)">
            <md-icon class="md-accent">delete</md-icon>
          </md-button>
        </md-list-item>
        <md-divider class="md-inset"></md-divider>
      </md-list>
    </md-drawer>

    <!-- App Content -->
    <div class="md-layout-item md-size-95">
      <md-content class="md-layout md-gutter" style="background-color: #007998; padding: 1rem;">
        <ul 
          class="md-layout-item md-large-size-25 md-medium-size-33 md-small-size-50 md-xsmall-size-100"
          v-for="headline in headlines" 
          :key="headline.id">
          
          <md-card style="margin-top: 1rem" md-with-hover>
            <md-ripple>
              <md-card-media md-ratio="16:9">
                <img :src="headline.urlToImage" :alt="headline.title">
              </md-card-media>

              <md-card-header>
                <div class="md-title">
                  <a :href="headline.url">{{ headline.title }}</a>
                </div>

                <div @click="loadSource(headline.source.id)">
                  {{headline.source.name}}
                  <md-icon class="small-icon">book</md-icon>
                </div>

                <div class="md-subhead" v-if="headline.author">
                  {{ headline.author }}
                  <md-icon class="small-icon">face</md-icon>
                </div>

                <div class="md-subhead" v-if="headline.publishedAt">
                  {{ headline.publishedAt | publishedTimeToNow }}
                  <md-icon class="small-icon">alarm</md-icon>
                </div>

              </md-card-header>

              <md-card-content>{{ headline.description }}</md-card-content>

              <md-card-actions>
                
                <md-button 
                  class="md-icon-button"
                  :class="isInFeed(headline.title)" 
                  @click="addHeadlineToFeed(headline)">
                  <md-icon>bookmark</md-icon>
                </md-button>

                <md-button 
                  class="md-icon-button"
                  @click="saveHeadline(headline)">
                  <md-icon>message</md-icon>
                </md-button>

              </md-card-actions>
            </md-ripple>
          </md-card>
        </ul>
      </md-content>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    showRightSidepanel: false,
    showLeftSidepanel: false,
    showSearchDialog: false,
    newsCategories: [
      { name: "Top Headlines", path: "", icon: "today" },
      { name: "Technology", path: "technology", icon: "keyboard" },
      { name: "Business", path: "business", icon: "business_center" },
      { name: "Entertainment", path: "entertainment", icon: "weekend" },
      { name: "Health", path: "health", icon: "fastfood" },
      { name: "Science", path: "science", icon: "fingerprint" },
      { name: "Sports", path: "sports", icon: "golf_course" }
    ],
    query: "",
    fromDate: "",
    toDate: "",
    sortBy: ""
  }),
  async fetch({ store }) {
    await store.dispatch(
      "loadHeadlines",
      `/api/top-headlines?country=${store.state.country}&category=${
        store.state.category
      }`
    );
    await store.dispatch("loadUserFeed");
  },
  computed: {
    headlines() {
      return this.$store.getters.headlines;
    },
    feed() {
      return this.$store.getters.feed;
    },
    category() {
      return this.$store.getters.category;
    },
    loading() {
      return this.$store.getters.loading;
    },
    country() {
      return this.$store.getters.country;
    },
    source() {
      return this.$store.getters.source;
    },
    user() {
      return this.$store.getters.user;
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    }
  },
  watch: {
    async country() {
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/top-headlines?country=${this.country}&category=${this.category}`
      );
    }
  },
  methods: {
    async loadCategory(category) {
      this.$store.commit("setCategory", category);
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/top-headlines?country=${this.country}&category=${this.category}`
      );
    },
    async addHeadlineToFeed(headline) {
      if (this.user) {
        this.$store.dispatch("addHeadlineToFeed", headline);
      }
    },
    async removeHeadlineFromFeed(headline) {
      await this.$store.dispatch("removeHeadlineFromFeed", headline);
    },
    async loadSource(sourceId) {
      if (sourceId) {
        this.$store.commit("setSource", sourceId);
        await this.$store.dispatch(
          "loadHeadlines",
          `/api/top-headlines?sources=${this.source}`
        );
      }
    },
    async searchHeadlines() {
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/everything?q=${this.query}&from=${this.dateToISOString(
          this.fromDate
        )}&to=${this.dateToISOString(this.toDate)}&sortBy=${this.sortBy}`
      );
      this.showSearchDialog = false;
    },
    changeCountry(country) {
      this.$store.commit("setCountry", country);
    },
    logoutUser() {
      this.$store.dispatch("logoutUser");
    },
    isInFeed(title) {
      const inFeed =
        this.feed.findIndex(headline => headline.title === title) > -1;
      return inFeed ? "md-primary" : "";
    },
    async saveHeadline(headline) {
      this.$store.dispatch("saveHeadline", headline).then(() => {
        this.$router.push(`/headlines/${headline.slug}`);
      });
    },
    dateToISOString(date) {
      if (date) {
        return new Date(date).toISOString();
      }
    }
  }
};
</script>

<style scoped>
.small-icon {
  font-size: 18px !important;
}
.fixed-toolbar {
  position: fixed;
  top: 0;
  z-index: 5;
}
</style>
