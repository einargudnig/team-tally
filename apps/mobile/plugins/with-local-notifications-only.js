const { withEntitlementsPlist } = require("expo/config-plugins");

// Team Tally only schedules *local* notifications (on-device fine reminders),
// which require no entitlement. expo-notifications' autolinked config plugin
// adds a remote-push `aps-environment` entitlement by default — pulling in a
// Push Notifications capability this app never uses and breaking signing against
// a profile that has no push capability. Strip it so the app stays local-only,
// in keeping with the no-server, offline-first design. Remove this plugin only
// if real remote push is ever added.
module.exports = function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
