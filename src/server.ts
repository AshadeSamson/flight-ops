import app from "./app";
import dotenv from "dotenv";
import { connectToDB } from "./config/db";
import http from "http";
import { startFidsSyncJob } from "./jobs/fidsSync.job";


dotenv.config();
const PORT = process.env.PORT || 3000;

async function startServer() {

    await connectToDB()

    startFidsSyncJob();

    const server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`Server is running and now listening on port ${PORT}`);
    });

    
}

startServer().catch((error) => {
    console.error("Error starting the server:", error);
    process.exit(1);
});

// Global process-level handlers to log and exit on unexpected errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Recommended: perform cleanup here, then exit
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
    // Recommended: perform cleanup here, then exit
    process.exit(1);
});
