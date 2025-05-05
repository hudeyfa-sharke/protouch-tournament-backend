const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();

// Middleware setup (using your installed packages)
app.use(cors());
app.use(bodyParser.json());

// File paths
const REGISTRATIONS_FILE = 'registrations.json';
const CONFIG_FILE = 'config.json';

// Initialize data
let registrations = [];
let config = {
  registrationOpen: true,
  maxTeams: 16,
  currentTeams: 0
};

// Load existing data
try {
  if (fs.existsSync(REGISTRATIONS_FILE)) {
    registrations = JSON.parse(fs.readFileSync(REGISTRATIONS_FILE));
  }
  if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE));
  }
} catch (err) {
  console.error("Error loading data files:", err);
}

// Registration endpoint
app.post('/register', (req, res) => {
  try {
    if (registrations.length >= config.maxTeams) {
      updateConfig(false);
      return res.status(400).json({ 
        error: "Registration closed - 16 team limit reached",
        remainingSlots: 0
      });
    }
    
    registrations.push(req.body);
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(registrations, null, 2));
    
    config.currentTeams = registrations.length;
    if (registrations.length >= config.maxTeams) {
      updateConfig(false);
    }
    
    res.json({ 
      success: true, 
      teamCount: registrations.length,
      remainingSlots: config.maxTeams - registrations.length
    });
    
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Status endpoint
app.get('/registration-status', (req, res) => {
  try {
    res.json({
      registeredTeams: registrations.length,
      remainingSlots: Math.max(0, config.maxTeams - registrations.length),
      status: registrations.length < config.maxTeams ? "OPEN" : "CLOSED",
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ error: "Could not check registration status" });
  }
});

// Helper function
function updateConfig(isOpen) {
  config.registrationOpen = isOpen;
  config.currentTeams = registrations.length;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Current registrations: ${registrations.length}/${config.maxTeams}`);
});