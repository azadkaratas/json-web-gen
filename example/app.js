const express = require('express');
const app = express();
const port = 8000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static('.'));

// API Endpoints for GET requests
app.get('/api/internet-status', (req, res) => {
  res.json({
    isConnected: true,
    isConnecting: false,
    isDslConnected: true,
    dslStatus: "M-net otomatik",
    receiveSpeed: 586.2,
    sendSpeed: 117.2
  });
});

app.get('/api/device-info', (req, res) => {
  res.json({ deviceCount: 3 });
});

app.get('/api/system-info', (req, res) => {
  res.json({ modelName: "SmartHome Hub", "osVersion": "2.1.0" });
});

app.get('/api/energy-stats', (req, res) => {
  res.json({ "total-consumption": 120.5, "power-status": true });
});

app.get('/api/lights', (req, res) => {
  res.json([
    { "light-name": "Living Room Light", "is-on": true, "brightness": 80 },
    { "light-name": "Kitchen Light", "is-on": false, "brightness": 50 }
  ]);
});

app.get('/api/thermostat', (req, res) => {
  res.json({
    temperature: 22,
    mode: "auto",
    "eco-mode": false,
    "fan-speed": "low"
  });
});

app.get('/api/camera-notes', (req, res) => {
  res.json({ "camera-notes": "No notes available." });
});

app.get('/api/device-logs', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(
    "[2025-04-24 10:00:00] System started\n" +
    "[2025-04-24 10:01:00] Light turned on"
  );
});

// API Endpoints for POST requests (action endpoints)
app.post('/api/reset-energy', (req, res) => {
  res.json({ success: true, message: "Energy data reset successfully." });
});

app.post('/api/update-lights', (req, res) => {
  console.log("Updated lights:", req.body);
  res.json({ success: true, message: "Light settings updated successfully." });
});

app.post('/api/save-thermostat', (req, res) => {
  console.log("Thermostat settings:", req.body);
  res.json({ success: true, message: "Thermostat settings saved successfully." });
});

app.post('/api/save-camera-settings', (req, res) => {
  console.log("Camera settings:", req.body);
  res.json({ success: true, message: "Camera settings saved successfully." });
});

app.post('/api/clear-logs', (req, res) => {
  res.json({ success: true, message: "Logs cleared successfully." });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});