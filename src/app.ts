import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import flightOperationRoutes from "./routes/flightOperation.route";
import referenceRoutes from "./routes/reference.route";
import dashboardRoutes from "./routes/dashboard.route";
import errorHandler from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import archiveRoutes from './routes/archive.routes';
import syncOperationsRoutes from './routes/syncOperations.routes';

const app = express();

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});



// Routes
app.use("/api/v1", (req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  return generalLimiter(req, res, next);
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/flight-operations", flightOperationRoutes);
app.use("/api/v1/ref", referenceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/archive-operations", archiveRoutes);
app.use("/api/v1/operations/sync-day", syncOperationsRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;