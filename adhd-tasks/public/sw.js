/* eslint-disable no-undef */
self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "ADHDTasks";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: data.tag || "adhd-tasks",
    data: {
      url: data.url || "/today",
      instanceId: data.instanceId || null,
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const d = event.notification.data || {};

  const openApp = function () {
    const path = d.url || "/today";
    const fullUrl = new URL(path, self.location.origin).href;
    return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    });
  };

  if (event.action === "done" && d.instanceId) {
    event.waitUntil(
      Promise.all([
        fetch("/api/tasks/done", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ instanceId: d.instanceId }),
        }).catch(function () {}),
        openApp(),
      ])
    );
    return;
  }

  event.waitUntil(openApp());
});
