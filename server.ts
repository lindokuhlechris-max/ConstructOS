import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import net from "net";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const DB_PATH = path.join(process.cwd(), 'db.json');

// Clean Production Database Structure (Zero Mock Data)
const initialCleanDb: Record<string, any[]> = {
  projects: [],
  activities: [],
  reports: [],
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
  ppeItems: [],
  qaInspections: [],
  userProfiles: []
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
  const PORT = process.env.PORT || 3000;

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

  // --- USER PROFILES ENDPOINTS ---
  app.get("/api/profiles", (req, res) => res.json(db.userProfiles || []));
  app.post("/api/profiles", (req, res) => {
    db.userProfiles.push(req.body);
    saveDbToDisk(db);
    res.status(201).json(req.body);
  });

  // --- AI GENERATE SUMMARY ---
  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { activities, labourLogs } = req.body;
      const completedActivities = (activities || []).filter((a: any) => a.status === 'Completed');
      const allPhotos = (activities || []).flatMap((a: any) => a.photos || []);

      const prompt = `You are a construction site manager assistant.
Please generate a text-based daily summary report based on the following data:
Completed Activities today: ${JSON.stringify(completedActivities.map((a: any) => a.name))}
Total Labour logs: ${JSON.stringify(labourLogs)}
Total progress photos captured: ${allPhotos.length}

Format the report with these sections:
- Executive Summary
- Completed Activities
- Labour Tracking Summary
- Visual Progress
Make it sound professional, clear, and concise.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({ summary: response.text });
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

      case 'init_state':
        Object.keys(data).forEach(key => {
          if (db[key] !== undefined && db[key].length === 0) {
            db[key] = data[key];
          }
        });
        break;
    }

    saveDbToDisk(db);
    res.json({ status: "ok", message: "Data synced and persisted to disk" });
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

  const requestedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const actualPort = await findAvailablePort(requestedPort);

  app.listen(actualPort, () => {
    const appUrl = `http://localhost:${actualPort}`;
    console.log(`==========================================`);
    console.log(` ConstructOS Desktop Server Running At:   `);
    console.log(` ${appUrl}                                 `);
    console.log(`==========================================`);

    if (isProd) {
      if (process.platform === "win32") {
        exec(`start ${appUrl}`);
      } else if (process.platform === "darwin") {
        exec(`open ${appUrl}`);
      } else {
        exec(`xdg-open ${appUrl}`);
      }
    }
  });
}

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

startServer();
