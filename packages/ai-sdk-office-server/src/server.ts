import express from "express";
import { createServer, Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import { useEvents } from "ai-sdk-agentic";
import { officeRegistry, OfficeAgentEntry } from "./registry.js";

export interface OfficeServerOptions {
  port?: number;
  debug?: boolean;
  server?: HttpServer;
  cors?: any;
}

export class OfficeServer {
  public app?: express.Express;
  public httpServer: HttpServer;
  public io: SocketServer;
  private options: OfficeServerOptions;

  constructor(options: OfficeServerOptions = {}) {
    this.options = {
      port: options.port ?? 3010,
      debug: options.debug ?? false,
      server: options.server,
      cors: options.cors ?? { origin: "*", methods: ["GET", "POST"] },
    };

    if (this.options.server) {
      this.httpServer = this.options.server;
    } else {
      this.app = express();
      this.httpServer = createServer(this.app);
      this.setupApp();
    }

    this.io = new SocketServer(this.httpServer, {
      cors: this.options.cors,
    });

    this.setupRelay();
  }

  private setupApp() {
    if (!this.app) return;
    this.app.use(cors(this.options.cors));
    this.app.get("/", (req, res) => {
      res.send({
        status: "running",
        package: "ai-sdk-office-server",
        registry: officeRegistry.getSnapshot()
      });
    });
  }

  private setupRelay() {
    const events = useEvents();

    // Sync registry updates from the plugin
    events.on("office.agent.register", (agent: OfficeAgentEntry) => {
      officeRegistry.registerAgent(agent);
      this.io.emit("office.registry", officeRegistry.getSnapshot());
    });

    // Relay all agentic events to the UI
    events.onAny((event, payload) => {
      if (event === "agent.log") return;

      if (this.options.debug) {
        console.log(`[OfficeServer] Event: ${event}`);
      }
      this.io.emit(event, payload);
    });

    this.io.on("connection", (socket) => {
      // Sync full registry on connection
      socket.emit("office.registry", officeRegistry.getSnapshot());
    });
  }

  public listen(callback?: (port: number) => void) {
    const port = this.options.port || 3010;
    
    if (this.options.server) {
      console.log(`🚀 Office Server: Attached to existing HTTP server`);
      if (callback) callback(port);
      return this;
    }

    this.httpServer.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Office Server: http://localhost:${port}`);
      if (callback) callback(port);
    });
    return this;
  }
}

export function useOfficeServer(options?: OfficeServerOptions) {
  return new OfficeServer(options);
}
