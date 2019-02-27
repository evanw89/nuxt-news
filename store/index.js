import Vuex from "vuex";
import md5 from "md5";
import slugify from "slugify";
import db from "~/plugins/firestore";
import { saveUserData, clearUserData } from "~/utils";
import defaultImage from "~/assets/default-image.jpg";

export const state = () => ({
  headlines: [],
  headline: null,
  category: "",
  loading: false,
  country: "us",
  token: "",
  feed: [],
  source: "",
  user: null
});

// GETTERS
export const getters = {
  headlines(state) {
    return state.headlines;
  },
  headline(state) {
    return state.headline;
  },
  category: state => state.category,
  loading: state => state.loading,
  country: state => state.country,
  isAuthenticated: state => !!state.token,
  user: state => state.user,
  source: state => state.source,
  feed: state => state.feed
};

// MUTATIONS
export const mutations = {
  setHeadlines(state, headlines) {
    state.headlines = headlines;
  },
  setHeadline(state, headline) {
    state.headline = headline;
  },
  setCategory(state, category) {
    state.category = category;
  },
  setLoading(state, loading) {
    state.loading = loading;
  },
  setCountry(state, country) {
    state.country = country;
  },
  setToken(state, token) {
    state.token = token;
  },
  setUser(state, user) {
    state.user = user;
  },
  setFeed(state, headlines) {
    state.feed = headlines;
  },
  setSource(state, source) {
    state.source = source;
  },
  clearToken(state) {
    state.token = "";
  },
  clearUser: state => (state.user = null),
  clearFeed: state => (state.feed = [])
};

// ACTIONS
export const actions = {
  async loadHeadlines({ commit }, apiUrl) {
    commit("setLoading", true);
    const { articles } = await this.$axios.$get(apiUrl);
    const headlines = articles.map(article => {
      const slug = slugify(article.title, {
        replacement: "-",
        remove: /[^a-zA-Z0-9 -]/g,
        lower: true
      });
      if (!article.urlToImage) {
        article.urlToImage = defaultImage;
      }
      const headline = { ...article, slug };
      return headline;
    });
    commit("setLoading", false);
    commit("setHeadlines", headlines);
  },
  async authenticateUser({ commit }, userPayload) {
    try {
      commit("setLoading", true);

      const endpoint = () => {
        if (userPayload.action === "login")
          return "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyB1X99UPrNfDqMMNHK-S-udz9g_gTmS4T8";
        if (userPayload.action === "register")
          return "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyB1X99UPrNfDqMMNHK-S-udz9g_gTmS4T8";
      };
      const authUserData = await this.$axios.$post(endpoint, {
        email: userPayload.email,
        password: userPayload.password,
        returnSecureToken: userPayload.returnSecureToken
      });

      let user;
      if (userPayload.action == "register") {
        const avatar = `http://gravatar.com/avatar/${md5(
          authUserData.email
        )}?d=identicon`;
        user = { email: authUserData.email, avatar };
        //add user info using email ref to users collection on firestore DB
        await db
          .collection("users")
          .doc(userPayload.email)
          .set(user);
      } else {
        const loginRef = db.collection("users").doc(userPayload.email);
        const loggedInUser = await loginRef.get();
        user = loggedInUser.data();
      }
      commit("setUser", user);
      commit("setToken", authUserData.idToken);
      commit("setLoading", false);
      saveUserData(authUserData, user);
    } catch (err) {
      console.error(err);
      commit("setLoading", false);
    }
  },
  async removeHeadlineFromFeed({ state }, headline) {
    const headlineRef = db
      .collection(`users/${state.user.email}/feed`)
      .doc(headline.title);
    await headlineRef.delete();
  },
  async loadHeadline({ commit }, headlineSlug) {
    const headlineRef = db.collection("headlines").doc(headlineSlug);
    const commentsRef = db
      .collection(`headlines/${headlineSlug}/comments`)
      .orderBy("likes", "desc");

    let loadedHeadline = {};
    await headlineRef.get().then(async doc => {
      if (doc.exists) {
        loadedHeadline = doc.data();
        await commentsRef.get().then(querySnapshot => {
          if (querySnapshot.empty) {
            commit("setHeadline", loadedHeadline);
          }
          let loadedComments = [];
          querySnapshot.forEach(doc => {
            loadedComments.push(doc.data());
            loadedHeadline["comments"] = loadedComments;
            commit("setHeadline", loadedHeadline);
          });
        });
      }
    });
  },
  async likeComment({ state, commit }, commentId) {
    const commentsRef = db
      .collection(`headlines/${state.headline.slug}/comments`)
      .orderBy("likes", "desc");
    const likedCommentRef = db
      .collection("headlines")
      .doc(state.headline.slug)
      .collection("comments")
      .doc(commentId);
    await likedCommentRef.get().then(doc => {
      if (doc.exists) {
        const prevLikes = doc.data().likes;
        const currentLikes = prevLikes + 1;
        likedCommentRef.update({
          likes: currentLikes
        });
      }
    });
    await commentsRef.onSnapshot(querySnapshot => {
      let loadedComments = [];
      querySnapshot.forEach(doc => {
        loadedComments.push(doc.data());
        const updatedHeadline = {
          ...state.headline,
          comments: loadedComments
        };
        commit("setHeadline", updatedHeadline);
      });
    });
  },
  async saveHeadline(context, headline) {
    const headlineRef = db.collection("headlines").doc(headline.slug);
    let headlineId;
    await headlineRef.get().then(doc => {
      if (doc.exists) {
        headlineId = doc.id;
      }
    });

    if (!headlineId) {
      await headlineRef.set(headline);
    }
  },
  async sendComment({ state, commit }, comment) {
    const commentsRef = db.collection(
      `headlines/${state.headline.slug}/comments`
    );
    commit("setLoading", true);
    await commentsRef.doc(comment.id).set(comment);
    await commentsRef
      .orderBy("likes", "desc")
      .get()
      .then(querySnapshot => {
        let comments = [];
        querySnapshot.forEach(doc => {
          comments.push(doc.data());
          const updatedHeadline = { ...state.headline, comments };
          commit("setHeadline", updatedHeadline);
        });
      });
    commit("setLoading", false);
  },
  setLogoutTimer({ dispatch }, interval) {
    setTimeout(() => dispatch("logoutUser"), interval);
  },
  logoutUser({ commit }) {
    commit("clearToken");
    commit("clearUser");
    commit("clearFeed");
    clearUserData();
  },
  async addHeadlineToFeed({ state }, headline) {
    const feedRef = db
      .collection(`users/${state.user.email}/feed`)
      .doc(headline.title);
    await feedRef.set(headline);
  },
  async loadUserFeed({ state, commit }) {
    if (state.user) {
      const feedRef = db.collection(`users/${state.user.email}/feed`);
      await feedRef.onSnapshot(querySnapshot => {
        let headlines = [];
        querySnapshot.forEach(doc => {
          headlines.push(doc.data());
        });
        commit("setFeed", headlines);
        if (querySnapshot.empty) {
          headlines = [];
          commit("setFeed", headlines);
        }
      });
    }
  }
};

export const strict = false;
