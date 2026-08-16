import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import net from "net";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const DB_PATH = path.join(process.cwd(), 'db.json');

// Clean Production Database Structure (Zero Mock Data)
const initialCleanDb: Record<string, any[]> = {
  projects: [],
  activities: [],
  reports: [],
  weatherLogs: [],
  labourLogs: [],
  labourAllocations: [],
  workerCheckIns: [],
  auditLogs: [],
  allocations: [],
  safetyIncidents: [],
  materials: [],
  materialReceipts: [],
  materialUsages: [],
  customFieldDefinitions: [],
  employees: [],
  teams: [],
  equipment: [],
  equipmentLogs: [],
  safetyRequirements: [],
  safetyPolicies: [],
  activityInspections: [],
  siteInspectionPhotos: [],
  ppeItems: [],
  qaInspections: [],
  documents: [],
  userProfiles: [],
  reminders: []
};

// Disk Persistence Helper Functions
function loadDbFromDisk(): Record<string, any[]> {
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileData = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(fileData);
      Object.keys(initialCleanDb).forEach(key => {
        if (!parsed[key]) parsed[key] = [];
      });
      return parsed;
    }
  } catch (err) {
    console.error('Error reading db.json from disk:', err);
  }
  saveDbToDisk(initialCleanDb);
  return initialCleanDb;
}

function saveDbToDisk(data: Record<string, any[]>) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json to disk:', err);
  }
}

async function startServer() {
  const app = express();
  const portNumber = 3000;

  // Initialize DB from disk
  let db = loadDbFromDisk();

  app.set("trust proxy", 1);

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests from this IP, please try again later."
  });
  
  app.use("/api/", limiter);
  app.use(express.json({ limit: "50mb" }));

  // --- HEALTH & STATE ENDPOINTS ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/state", (req, res) => {
    res.json(db);
  });

  // --- PROJECTS RESTFUL ENDPOINTS ---
  app.get("/api/projects", (req, res) => res.json(db.projects || []));
  app.post("/api/projects", (req, res) => {
    db.projects.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });
  app.put("/api/projects/:id", (req, res) => {
    db.projects = db.projects.map(p => p.id === req.params.id ? { ...p, ...req.body } : p);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });
  app.delete("/api/projects/:id", (req, res) => {
    db.projects = db.projects.filter(p => p.id !== req.params.id);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });

  // --- ACTIVITIES RESTFUL ENDPOINTS ---
  app.get("/api/activities", (req, res) => res.json(db.activities || []));
  app.post("/api/activities", (req, res) => {
    if (!db.activities.some(a => a.id === req.body.id)) {
      db.activities.push(req.body);
      saveDbToDisk(db);
    }
    res.status(201).json(req.body);
  });
  app.put("/api/activities/:id", (req, res) => {
    db.activities = db.activities.map(a => a.id === req.params.id ? { ...a, ...req.body } : a);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });
  app.delete("/api/activities/:id", (req, res) => {
    db.activities = db.activities.filter(a => a.id !== req.params.id);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });

  // --- EMPLOYEES RESTFUL ENDPOINTS ---
  app.get("/api/employees", (req, res) => res.json(db.employees || []));
  app.post("/api/employees", (req, res) => {
    db.employees.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });
  app.put("/api/employees/:id", (req, res) => {
    db.employees = db.employees.map(e => e.id === req.params.id ? { ...e, ...req.body } : e);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });
  app.delete("/api/employees/:id", (req, res) => {
    db.employees = db.employees.filter(e => e.id !== req.params.id);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });

  // --- TEAMS RESTFUL ENDPOINTS ---
  app.get("/api/teams", (req, res) => res.json(db.teams || []));
  app.post("/api/teams", (req, res) => {
    db.teams.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });
  app.put("/api/teams/:id", (req, res) => {
    db.teams = db.teams.map(t => t.id === req.params.id ? { ...t, ...req.body } : t);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });
  app.delete("/api/teams/:id", (req, res) => {
    db.teams = db.teams.filter(t => t.id !== req.params.id);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });

  // --- EQUIPMENT RESTFUL ENDPOINTS ---
  app.get("/api/equipment", (req, res) => res.json(db.equipment || []));
  app.post("/api/equipment", (req, res) => {
    db.equipment.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });
  app.put("/api/equipment/:id", (req, res) => {
    db.equipment = db.equipment.map(e => e.id === req.params.id ? { ...e, ...req.body } : e);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });
  app.delete("/api/equipment/:id", (req, res) => {
    db.equipment = db.equipment.filter(e => e.id !== req.params.id);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });

  // --- MATERIALS RESTFUL ENDPOINTS ---
  app.get("/api/materials", (req, res) => res.json(db.materials || []));
  app.post("/api/materials", (req, res) => {
    db.materials.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });
  app.put("/api/materials/:id", (req, res) => {
    db.materials = db.materials.map(m => m.id === req.params.id ? { ...m, ...req.body } : m);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });
  app.delete("/api/materials/:id", (req, res) => {
    db.materials = db.materials.filter(m => m.id !== req.params.id);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });

  // --- DOCUMENTS RESTFUL ENDPOINTS ---
  app.get("/api/documents", (req, res) => res.json(db.documents || []));
  app.post("/api/documents", (req, res) => {
    if (!db.documents) db.documents = [];
    db.documents.unshift(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });
  app.put("/api/documents/:id", (req, res) => {
    if (!db.documents) db.documents = [];
    db.documents = db.documents.map((d: any) => d.id === req.params.id ? { ...d, ...req.body } : d);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });
  app.delete("/api/documents/:id", (req, res) => {
    if (!db.documents) db.documents = [];
    db.documents = db.documents.filter((d: any) => d.id !== req.params.id);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });

  // --- SAFETY ENDPOINTS ---
  app.get("/api/safety/incidents", (req, res) => res.json(db.safetyIncidents || []));
  app.post("/api/safety/incidents", (req, res) => {
    db.safetyIncidents.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });

  app.get("/api/safety/requirements", (req, res) => res.json(db.safetyRequirements || []));
  app.post("/api/safety/requirements", (req, res) => {
    db.safetyRequirements.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });

  app.get("/api/safety/policies", (req, res) => res.json(db.safetyPolicies || []));
  app.post("/api/safety/policies", (req, res) => {
    db.safetyPolicies.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });

  // --- QA/QC ENDPOINTS ---
  app.get("/api/qa/inspections", (req, res) => res.json(db.qaInspections || []));
  app.post("/api/qa/inspections", (req, res) => {
    db.qaInspections.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });

  // --- WEATHER LOGS ENDPOINTS ---
  app.get("/api/weather-logs", (req, res) => res.json(db.weatherLogs || []));
  app.post("/api/weather-logs", (req, res) => {
    if (!db.weatherLogs) db.weatherLogs = [];
    db.weatherLogs.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });
  app.put("/api/weather-logs/:id", (req, res) => {
    if (!db.weatherLogs) db.weatherLogs = [];
    db.weatherLogs = db.weatherLogs.map(w => w.id === req.params.id ? { ...w, ...req.body } : w);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });
  app.delete("/api/weather-logs/:id", (req, res) => {
    if (!db.weatherLogs) db.weatherLogs = [];
    db.weatherLogs = db.weatherLogs.filter(w => w.id !== req.params.id);
    saveDbToDisk(db);
    res.json({ status: "ok" });
  });

  // --- LIVE WEATHER API (Free-Tier Open-Meteo with 1-Hour In-Memory Cache) ---
  const weatherCache: Record<string, { data: any; timestamp: number }> = {};
  const ONE_HOUR_MS = 60 * 60 * 1000;

  app.get("/api/weather/live", async (req, res) => {
    try {
      const location = (req.query.location as string) || "Johannesburg";
      let lat = req.query.lat ? parseFloat(req.query.lat as string) : -26.2041;
      let lon = req.query.lon ? parseFloat(req.query.lon as string) : 28.0473;
      let cityDisplayName = location;

      const cacheKey = req.query.lat && req.query.lon 
        ? `${lat.toFixed(2)}_${lon.toFixed(2)}` 
        : location.toLowerCase().trim();

      const now = Date.now();
      const existing = weatherCache[cacheKey];

      // Return cached weather data if refreshed within the past 1 hour
      if (existing && (now - existing.timestamp) < ONE_HOUR_MS) {
        return res.json({
          source: 'cache',
          cachedAt: new Date(existing.timestamp).toISOString(),
          nextUpdateInMinutes: Math.ceil((ONE_HOUR_MS - (now - existing.timestamp)) / 60000),
          data: existing.data
        });
      }

      // If location name provided without explicit lat/lon, geocode via Open-Meteo free geocoding API
      if (!req.query.lat || !req.query.lon) {
        try {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
              cityDisplayName = `${geoData.results[0].name}, ${geoData.results[0].country_code ? geoData.results[0].country_code.toUpperCase() : ''}`;
            }
          }
        } catch (geoErr) {
          console.warn("Geocoding lookup fallback to default coordinates:", geoErr);
        }
      }

      // Fetch live weather from Open-Meteo free tier
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation&timezone=auto`;
      const apiRes = await fetch(weatherUrl);

      if (!apiRes.ok) {
        throw new Error(`Open-Meteo API response status: ${apiRes.status}`);
      }

      const weatherData = await apiRes.json();
      const current = weatherData.current || {};

      // Map WMO Weather Codes
      const code = current.weather_code ?? 0;
      let condition = 'Sunny';
      if (code === 0) condition = 'Sunny';
      else if (code === 1 || code === 2) condition = 'Partly Cloudy';
      else if (code === 3) condition = 'Overcast';
      else if (code === 45 || code === 48) condition = 'Fog';
      else if ([51, 53, 55, 61, 63].includes(code)) condition = 'Light Rain';
      else if ([65, 80, 81, 82].includes(code)) condition = 'Heavy Rain';
      else if ([95, 96, 99].includes(code)) condition = 'Thunderstorm';

      const tempC = Math.round(current.temperature_2m ?? 22);
      const windKm = Math.round(current.wind_speed_10m ?? 12);
      const humidity = Math.round(current.relative_humidity_2m ?? 50);
      const rainfall = current.precipitation ?? 0;

      // Calculate Impact Level
      let impactLevel = 'Normal Operations';
      if (condition === 'Thunderstorm' || rainfall > 15 || windKm > 55 || tempC > 40) {
        impactLevel = 'Site Suspension';
      } else if (condition === 'Heavy Rain' || windKm > 35 || tempC > 35 || tempC < 2) {
        impactLevel = 'Work Package Delay';
      } else if (condition === 'Light Rain' || windKm > 25 || condition === 'Fog') {
        impactLevel = 'Caution / Monitoring';
      }

      // Calculate Wind Direction cardinal
      const degrees = current.wind_direction_10m ?? 180;
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const windDirection = directions[Math.round(degrees / 45) % 8];

      const mappedResult = {
        location: cityDisplayName,
        latitude: lat,
        longitude: lon,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        condition,
        temperature: tempC,
        humidity,
        windSpeed: windKm,
        windDirection,
        rainfall,
        impactLevel,
        provider: 'Open-Meteo (Free Hourly Tier)',
        fetchedAt: new Date().toISOString()
      };

      // Store in 1-hour cache
      weatherCache[cacheKey] = {
        data: mappedResult,
        timestamp: now
      };

      return res.json({
        source: 'live_api',
        cachedAt: new Date(now).toISOString(),
        nextUpdateInMinutes: 60,
        data: mappedResult
      });

    } catch (err: any) {
      console.error("Live weather fetch error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch live weather", 
        message: err.message || "Weather API service temporary error" 
      });
    }
  });

  // --- USER PROFILES ENDPOINTS ---
  app.get("/api/profiles", (req, res) => res.json(db.userProfiles || []));
  app.post("/api/profiles", (req, res) => {
    db.userProfiles.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });

  // --- DETERMINISTIC SUMMARY GENERATOR (ZERO EXTERNAL AI API COSTS) ---
  app.post("/api/generate-summary", (req, res) => {
    try {
      const { activities, labourLogs } = req.body;
      const completedActivities = (activities || []).filter((a: any) => a.status === 'Completed');
      const inProgressActivities = (activities || []).filter((a: any) => a.status === 'In Progress');
      const allPhotos = (activities || []).flatMap((a: any) => a.photos || []);

      const summary = `EXECUTIVE SUMMARY
Total Activities Tracked: ${(activities || []).length}
Completed Tasks: ${completedActivities.length} | In Progress: ${inProgressActivities.length}
Total Labour Records: ${(labourLogs || []).length}
Site Progress Photos Logged: ${allPhotos.length}

COMPLETED ACTIVITIES:
${completedActivities.length > 0 ? completedActivities.map((a: any) => `• ${a.name} (${a.discipline || 'General'})`).join('\n') : '• No activities marked completed today.'}

LABOUR & FIELD RECORDS:
${(labourLogs || []).length > 0 ? (labourLogs || []).map((l: any) => `• ${l.workerName || 'Worker'}: ${l.hoursWorked || 0} hrs (${l.activityName || 'General duties'})`).join('\n') : '• Normal crew deployment logged.'}

VISUAL PROGRESS:
${allPhotos.length > 0 ? `• ${allPhotos.length} site progress inspection photos recorded.` : '• Standard site inspections performed.'}`;

      res.json({ summary });
    } catch (error) {
      console.error('Error generating summary:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  // --- UNIFIED REAL-TIME SYNC ENDPOINT ---
  app.post("/api/sync", (req, res) => {
    const { type, data } = req.body;
    
    switch (type) {
      case 'add_project':
        db.projects.push(data);
        break;
      case 'update_project':
        db.projects = db.projects.map(p => p.id === data.id ? data : p);
        break;
      case 'delete_project':
        db.projects = db.projects.filter(p => p.id !== data.id);
        break;

      case 'add_activity':
        if (!db.activities.some(a => a.id === data.id)) {
          db.activities.push(data);
        }
        break;
      case 'update_activity':
        db.activities = db.activities.map(a => a.id === data.id ? data : a);
        break;
      case 'delete_activity':
        db.activities = db.activities.filter(a => a.id !== data.id);
        break;

      case 'add_report':
        db.reports.push(data);
        break;
      case 'update_report':
        db.reports = db.reports.map(r => r.id === data.id ? data : r);
        break;
      case 'delete_report':
        db.reports = db.reports.filter(r => r.id !== data.id);
        break;

      case 'add_weather_log':
        if (!db.weatherLogs) db.weatherLogs = [];
        db.weatherLogs.push(data);
        break;
      case 'update_weather_log':
        if (!db.weatherLogs) db.weatherLogs = [];
        db.weatherLogs = db.weatherLogs.map(w => w.id === data.id ? data : w);
        break;
      case 'delete_weather_log':
        if (!db.weatherLogs) db.weatherLogs = [];
        db.weatherLogs = db.weatherLogs.filter(w => w.id !== data.id);
        break;

      case 'add_labour_log':
        db.labourLogs.push(data);
        break;
      case 'add_labour_allocation':
        db.labourAllocations.push(data);
        break;
      case 'update_labour_allocation':
        db.labourAllocations = db.labourAllocations.map(a => a.id === data.id ? data : a);
        break;
      case 'delete_labour_allocation':
        db.labourAllocations = db.labourAllocations.filter(a => a.id !== data.id);
        break;

      case 'add_worker_checkin':
        db.workerCheckIns.push(data);
        break;
      case 'add_audit_log':
        db.auditLogs.push(data);
        break;

      case 'add_allocation':
        db.allocations.push(data);
        break;
      case 'update_allocation':
        db.allocations = db.allocations.map(a => a.id === data.id ? data : a);
        break;
      case 'delete_allocation':
        db.allocations = db.allocations.filter(a => a.id !== data.id);
        break;

      case 'add_safety_incident':
        db.safetyIncidents.push(data);
        break;
      case 'update_safety_incident':
        db.safetyIncidents = db.safetyIncidents.map(i => i.id === data.id ? data : i);
        break;
      case 'delete_safety_incident':
        db.safetyIncidents = db.safetyIncidents.filter(i => i.id !== data.id);
        break;

      case 'add_safety_requirement':
        if (!db.safetyRequirements) db.safetyRequirements = [];
        db.safetyRequirements.push(data);
        break;
      case 'update_safety_requirement':
        if (!db.safetyRequirements) db.safetyRequirements = [];
        db.safetyRequirements = db.safetyRequirements.map(r => r.id === data.id ? data : r);
        break;
      case 'delete_safety_requirement':
        if (!db.safetyRequirements) db.safetyRequirements = [];
        db.safetyRequirements = db.safetyRequirements.filter(r => r.id !== data.id);
        break;

      case 'add_safety_policy':
        if (!db.safetyPolicies) db.safetyPolicies = [];
        db.safetyPolicies.push(data);
        break;
      case 'update_safety_policy':
        if (!db.safetyPolicies) db.safetyPolicies = [];
        db.safetyPolicies = db.safetyPolicies.map(p => p.id === data.id ? data : p);
        break;
      case 'delete_safety_policy':
        if (!db.safetyPolicies) db.safetyPolicies = [];
        db.safetyPolicies = db.safetyPolicies.filter(p => p.id !== data.id);
        break;

      case 'add_activity_inspection':
        if (!db.activityInspections) db.activityInspections = [];
        db.activityInspections.push(data);
        break;
      case 'update_activity_inspection':
        if (!db.activityInspections) db.activityInspections = [];
        db.activityInspections = db.activityInspections.map(i => i.id === data.id ? data : i);
        break;
      case 'delete_activity_inspection':
        if (!db.activityInspections) db.activityInspections = [];
        db.activityInspections = db.activityInspections.filter(i => i.id !== data.id);
        break;

      case 'add_ppe_item':
        if (!db.ppeItems) db.ppeItems = [];
        db.ppeItems.push(data);
        break;
      case 'update_ppe_item':
        if (!db.ppeItems) db.ppeItems = [];
        db.ppeItems = db.ppeItems.map(i => i.id === data.id ? data : i);
        break;
      case 'delete_ppe_item':
        if (!db.ppeItems) db.ppeItems = [];
        db.ppeItems = db.ppeItems.filter(i => i.id !== data.id);
        break;

      case 'add_qa_inspection':
        if (!db.qaInspections) db.qaInspections = [];
        db.qaInspections.push(data);
        break;
      case 'update_qa_inspection':
        if (!db.qaInspections) db.qaInspections = [];
        db.qaInspections = db.qaInspections.map(i => i.id === data.id ? data : i);
        break;
      case 'delete_qa_inspection':
        if (!db.qaInspections) db.qaInspections = [];
        db.qaInspections = db.qaInspections.filter(i => i.id !== data.id);
        break;

      case 'add_material_receipt':
        db.materialReceipts.push(data);
        break;
      case 'add_material_usage':
        db.materialUsages.push(data);
        break;
      case 'add_material':
        if (!db.materials) db.materials = [];
        db.materials.push(data);
        break;
      case 'update_material':
        if (!db.materials) db.materials = [];
        db.materials = db.materials.map(m => m.id === data.id ? data : m);
        break;
      case 'delete_material':
        if (!db.materials) db.materials = [];
        db.materials = db.materials.filter(m => m.id !== data.id);
        break;

      case 'add_custom_field':
        db.customFieldDefinitions.push(data);
        break;
      case 'update_custom_field':
        db.customFieldDefinitions = db.customFieldDefinitions.map(f => f.id === data.id ? data : f);
        break;

      case 'add_employee':
        db.employees.push(data);
        break;
      case 'update_employee':
        db.employees = db.employees.map(e => e.id === data.id ? data : e);
        break;
      case 'delete_employee':
        db.employees = db.employees.filter(e => e.id !== data.id);
        break;

      case 'add_team':
        if (!db.teams) db.teams = [];
        db.teams.push(data);
        break;
      case 'update_team':
        if (!db.teams) db.teams = [];
        db.teams = db.teams.map(t => t.id === data.id ? data : t);
        break;
      case 'delete_team':
        if (!db.teams) db.teams = [];
        db.teams = db.teams.filter(t => t.id !== data.id);
        break;

      case 'add_equipment':
        if (!db.equipment) db.equipment = [];
        db.equipment.push(data);
        break;
      case 'update_equipment':
        if (!db.equipment) db.equipment = [];
        db.equipment = db.equipment.map(e => e.id === data.id ? data : e);
        break;
      case 'delete_equipment':
        if (!db.equipment) db.equipment = [];
        db.equipment = db.equipment.filter(e => e.id !== data.id);
        break;
      case 'add_equipment_log':
        if (!db.equipmentLogs) db.equipmentLogs = [];
        db.equipmentLogs.push(data);
        break;

      case 'add_reminder':
        if (!db.reminders) db.reminders = [];
        db.reminders.push(data);
        break;
      case 'update_reminder':
        if (!db.reminders) db.reminders = [];
        db.reminders = db.reminders.map(r => r.id === data.id ? data : r);
        break;
      case 'delete_reminder':
        if (!db.reminders) db.reminders = [];
        db.reminders = db.reminders.filter(r => r.id !== data.id);
        break;

      case 'add_document':
        if (!db.documents) db.documents = [];
        if (!db.documents.some((d: any) => d.id === data.id)) {
          db.documents.unshift(data);
        }
        break;
      case 'update_document':
        if (!db.documents) db.documents = [];
        db.documents = db.documents.map((d: any) => d.id === data.id ? data : d);
        break;
      case 'delete_document':
        if (!db.documents) db.documents = [];
        db.documents = db.documents.filter((d: any) => d.id !== data.id);
        break;

      case 'add_site_inspection_photo':
        if (!db.siteInspectionPhotos) db.siteInspectionPhotos = [];
        db.siteInspectionPhotos.push(data);
        break;
      case 'delete_site_inspection_photo':
        if (!db.siteInspectionPhotos) db.siteInspectionPhotos = [];
        db.siteInspectionPhotos = db.siteInspectionPhotos.filter((p: any) => p.id !== data.id);
        break;

      case 'sync_full_state':
      case 'init_state':
        if (data && typeof data === 'object') {
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
              db[key] = data[key];
            }
          });
        }
        break;
    }

    saveDbToDisk(db);
    res.json({ status: "ok", message: "Data synced and persisted to disk" });
  });

  app.post("/api/generate-report-from-audio", (req, res) => {
    try {
      const { textNotes } = req.body;
      res.json({
        weather: "Sunny",
        temperature: "24°C",
        siteConditions: "Normal site conditions",
        significantEvents: "",
        workersOnSite: 0,
        equipmentRunning: 0,
        incidents: 0,
        ncr: 0,
        activitiesLogged: [],
        supervisorNotes: textNotes || "Daily site field note recorded."
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const isProd = process.env.NODE_ENV === "production" || (process as any).pkg !== undefined;

  // Vite middleware for development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    let distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      distPath = path.join(__dirname, 'dist');
    }
    if (!fs.existsSync(distPath)) {
      distPath = path.join(__dirname, '../dist');
    }
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(portNumber, "0.0.0.0", () => {
    console.log(`Constructfield Server running at http://0.0.0.0:${portNumber}`);
  });
}

startServer();
