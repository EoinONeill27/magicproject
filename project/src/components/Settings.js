import React from "react";

function Settings() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Settings</h1>
      <p>Notification Preferences</p>
      <button style={{ padding: "10px" }}>Enable Notifications</button>
      <p>Theme</p>
      <button style={{ padding: "10px" }}>Toggle Dark Mode</button>
    </div>
  );
}

export default Settings;