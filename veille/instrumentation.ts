export async function register() {
  // Le collecteur tourne dans le serveur Node lui-même : pas de cron ni de second conteneur à gérer.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.VEILLE_DISABLE_COLLECTOR !== "1") {
    const { startScheduler } = await import("./lib/collect");
    startScheduler();
  }
}
