// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: false,
  srcDir: "src",
  runtimeConfig: {
    // local file path for cv-server directory
    pythonUtilPath:
      process.env.NODE_ENV === "production" ? "../cv-server" : "./cv-server",
  },

  modules: ["@pinia/nuxt", "@nuxt/ui", "@nuxt/icon"],
  ui: {
    global: true,
  },
  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.gstatic.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap",
        },
      ],
    },
  },
});
