import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import { router as apiRouter } from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database & default seed
initDb();

// Mount REST API
app.use("/api", apiRouter);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Vigil Indian Market Delta Engine",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Single-Service Deployment Architecture:
// Serve compiled React frontend if built
const clientDistPath = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static client files from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      message: "Vigil API is running. Frontend dev server runs on port 5173.",
      apiDocs: "/api/market/regime",
      watchlists: "/api/watchlists"
    });
  });
}

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Vigil (NSE/BSE) Backend running on http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});

