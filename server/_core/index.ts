import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { sql } from "drizzle-orm";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { seedDefaultAdmin, getDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function runMigration() {
  const db = await getDb();
  if (!db) {
    console.warn("[Migration] Database not available, skipping migration");
    return;
  }
  try {
    // Add password column if it doesn't exist
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" text`);
    console.log("[Migration] Password column ensured");
  } catch (error: any) {
    // Column might already exist, that's fine
    if (!error.message?.includes("already exists")) {
      console.warn("[Migration] Warning:", error.message);
    }
  }
  try {
    // Add deletedAt column to bots for soft-delete support
    await db.execute(sql`ALTER TABLE "bots" ADD COLUMN IF NOT EXISTS "deletedAt" timestamp`);
    console.log("[Migration] Bots deletedAt column ensured");
  } catch (error: any) {
    if (!error.message?.includes("already exists")) {
      console.warn("[Migration] Warning:", error.message);
    }
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Run migration and seed
  await runMigration();
  await seedDefaultAdmin();

  // Serve uploaded files
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use("/uploads", express.static(uploadsDir));

  // Audio proxy for Google Drive files (bypass CORS)
  app.get("/api/audio-proxy", async (req, res) => {
    const fileId = req.query.id as string;
    if (!fileId) {
      res.status(400).json({ error: "Missing file id" });
      return;
    }
    try {
      const axios = (await import("axios")).default;
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      // First try: direct download URL
      let driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Try to get the file - first as arraybuffer to check if it's HTML (confirmation page)
      let response = await axios.get(driveUrl, {
        responseType: "arraybuffer",
        maxRedirects: 10,
        timeout: 30000,
        headers: { "User-Agent": ua },
      });

      let contentType = response.headers["content-type"] || "";
      let data = response.data as Buffer;

      // If Google returned an HTML confirmation page, extract the confirm token and retry
      if (contentType.includes("text/html")) {
        const html = data.toString("utf-8");
        // Look for confirmation token in the HTML
        const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/) || html.match(/name="confirm" value="([^"]+)"/);
        const uuidMatch = html.match(/name="uuid" value="([^"]+)"/);

        let retryUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
        if (confirmMatch) {
          retryUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmMatch[1]}`;
          if (uuidMatch) retryUrl += `&uuid=${uuidMatch[1]}`;
        }

        response = await axios.get(retryUrl, {
          responseType: "arraybuffer",
          maxRedirects: 10,
          timeout: 30000,
          headers: {
            "User-Agent": ua,
            "Cookie": response.headers["set-cookie"]?.map((c: string) => c.split(";")[0]).join("; ") || "",
          },
        });

        contentType = response.headers["content-type"] || "";
        data = response.data as Buffer;

        // If still HTML, try the direct media link as last resort
        if (contentType.includes("text/html")) {
          const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
          response = await axios.get(directUrl, {
            responseType: "arraybuffer",
            maxRedirects: 10,
            timeout: 30000,
            headers: { "User-Agent": ua },
          });
          contentType = response.headers["content-type"] || "";
          data = response.data as Buffer;
        }
      }

      // Set appropriate content type - force audio if Drive returns generic binary
      const finalContentType = contentType.includes("text/html")
        ? "audio/ogg"
        : contentType.includes("octet-stream")
          ? "audio/ogg"
          : contentType || "audio/ogg";

      res.setHeader("Content-Type", finalContentType);
      res.setHeader("Content-Length", data.length);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(data);
    } catch (err: any) {
      console.error("[audio-proxy] Error:", err.message);
      res.status(502).json({ error: "Failed to fetch audio" });
    }
  });

  // Auth routes (login endpoint)
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
