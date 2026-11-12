// Service worker : reçoit les notifications push et ouvre l'élément concerné au toucher.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = typeof data.title === "string" && data.title ? data.title : "Veille Cyber";
  const jobs = [
    // iOS exige qu'une notification soit affichée pour chaque push reçu, sinon l'abonnement est révoqué.
    self.registration.showNotification(title, {
      body: typeof data.body === "string" ? data.body : "",
      tag: typeof data.tag === "string" ? data.tag : undefined,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/" },
    }),
  ];
  if (typeof data.badge === "number" && "setAppBadge" in navigator) {
    jobs.push(navigator.setAppBadge(data.badge).catch(() => {}));
  }
  event.waitUntil(Promise.all(jobs));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.postMessage({ type: "open", url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
