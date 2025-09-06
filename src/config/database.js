// src/config/database.js

import sqlite3 from 'sqlite3';
import { connect } from 'vectordb';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../database/chatbot_memory.db');
const lanceDbPath = path.resolve(__dirname, '../../database/lancedb');

// --- SQLite Setup ---
// We use a singleton pattern to ensure only one database connection is opened.
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening SQLite database", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

/**
 * Initializes the SQLite database, creating tables if they don't exist.
 */
export const initializeSqlite = () => {
    db.serialize(() => {
        // Create the 'users' table to store user profiles
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                profile TEXT
            )
        `, (err) => {
            if (err) console.error("Error creating users table", err.message);
            else console.log("Users table is ready.");
        });

        // Create the 'chat_history' table to log all messages
        db.run(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL, -- 'user' or 'ai'
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Error creating chat_history table", err.message);
            else console.log("Chat history table is ready.");
        });
    });
};

// --- LanceDB Setup ---

/**
 * Connects to LanceDB.
 * @returns {Promise<import('vectordb').Connection>} A promise that resolves to the LanceDB connection object.
 */
export const getLanceDb = async () => {
    try {
        const db = await connect(lanceDbPath);
        console.log("Connected to the LanceDB database.");
        return db;
    } catch (error) {
        console.error("Error connecting to LanceDB:", error);
        throw error;
    }
};

export { db as sqliteDb }; // Export the SQLite db instance