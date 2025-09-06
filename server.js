// server.js

import express from 'express';
import 'dotenv/config'; // Make sure this is at the top
import chatRoutes from './src/routes/chat.js';
import { initializeSqlite } from './src/config/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Initialize Database ---
initializeSqlite();

// --- Middleware ---
// To parse JSON bodies from incoming requests
app.use(express.json());
// To serve the static frontend files from the 'public' directory
app.use(express.static('public'));


// --- API Routes ---
// All routes defined in chat.js will be prefixed with /api
app.use('/api', chatRoutes);


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});