const pkg = require("./package");

module.exports = {
  mode: "spa",
  router: {
    middleware: "check-auth"
  },
  /*
   ** Headers of the page
   */
  head: {
    title: pkg.name,
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: pkg.description }
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      {
        rel: "stylesheet",
        href:
          "//fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons"
      }
    ]
  },

  /*
   ** Customize the progress-bar color
   */
  loading: false,
  // loading: { color: "#9ccc65", height: "10px" },

  /*
   ** Global CSS
   */
  css: [
    { src: "vue-material/dist/vue-material.min.css", lang: "css" },
    { src: "~/assets/theme.scss", lang: "scss" }
  ],

  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    { src: "~/plugins/vue-material" },
    { src: "~/plugins/axios" },
    { src: "~/plugins/firestore" },
    { src: "~/plugins/time-filters" }
  ],

  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    "@nuxtjs/axios",
    "@nuxtjs/proxy"
  ],
  /*
   ** Axios module configuration
   */
  axios: {
    credentials: true,
    proxy: true
  },
  // PROXIES NOT COMPILING CORRECTLY WITH NETLIFY--DON'T KNOW WHY!
  // proxy: {
  //   "/api/": {
  //     target: "https://newsapi.org/v2/",
  //     pathRewrite: { "^/api/": "" }
  //   },
  //   "/register/": {
  //     target:
  //       "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyB1X99UPrNfDqMMNHK-S-udz9g_gTmS4T8",
  //     pathRewrite: { "^/register/": "" }
  //   },
  //   "/login/": {
  //     target:
  //       "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyB1X99UPrNfDqMMNHK-S-udz9g_gTmS4T8",
  //     pathRewrite: { "^/login/": "" }
  //   }
  // },
  env: {
    NEWS_API_KEY: "eb85487dcf1d45d5aa52c973e59ad105"
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {}
  }
};
