// src/chatbot/memory.js

import { sqliteDb, getLanceDb } from '../config/database.js';
// We will create the getEmbedding function in the next step (llm_handler.js)
// For now, we'll import a placeholder.
import { getEmbedding } from './llm_handler.js';

// --- Promise-based wrappers for SQLite operations ---
const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        sqliteDb.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        sqliteDb.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        sqliteDb.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// ===============================================
// == STRUCTURED MEMORY (SQLite) FUNCTIONS      ==
// ===============================================

/**
 * Gets a user's profile or creates a new one if it doesn't exist.
 * @param {string} userId - The unique identifier for the user.
 * @returns {Promise<object>} The user's profile object.
 */
export const getOrCreateUser = async (userId) => {
    const user = await dbGet('SELECT profile FROM users WHERE user_id = ?', [userId]);
    if (user) {
        return JSON.parse(user.profile);
    } else {
        const newUserProfile = {}; // Start with an empty profile
        await dbRun('INSERT INTO users (user_id, profile) VALUES (?, ?)', [
            userId,
            JSON.stringify(newUserProfile),
        ]);
        return newUserProfile;
    }
};

/**
 * Updates a user's profile with new data.
 * @param {string} userId - The user's ID.
 * @param {object} newProfileData - An object with new key-value pairs to add/update.
 */
export const updateUserProfile = async (userId, newProfileData) => {
    const currentProfile = await getOrCreateUser(userId);
    const updatedProfile = { ...currentProfile, ...newProfileData };
    await dbRun('UPDATE users SET profile = ? WHERE user_id = ?', [
        JSON.stringify(updatedProfile),
        userId,
    ]);
    console.log(`Updated profile for user ${userId}:`, updatedProfile);
};

/**
 * Adds a message to the user's chat history.
 * @param {string} userId - The user's ID.
 * @param {'user' | 'ai'} role - The role of the message sender.
 * @param {string} content - The message content.
 */
export const addMessageToHistory = async (userId, role, content) => {
    await dbRun(
        'INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)',
        [userId, role, content]
    );
};

/**
 * Retrieves the most recent chat history for a user.
 * @param {string} userId - The user's ID.
 * @param {number} limit - The number of recent messages to retrieve.
 * @returns {Promise<Array<{role: string, content: string}>>} The chat history.
 */
export const getChatHistory = async (userId, limit = 200) => {
    const rows = await dbAll(
        'SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
        [userId, limit]
    );
    // Reverse the order to be chronological for the LLM context
    return rows.reverse();
};

// ===============================================
// == SEMANTIC MEMORY (LanceDB) FUNCTIONS       ==
// ===============================================

const MEMORY_TABLE_NAME = 'user_memories';

/**
 * Adds a text chunk to the user's long-term semantic memory.
 * @param {string} userId - The user's ID.
 * @param {string} textChunk - The piece of information to remember.
 */
export const addMemory = async (userId, textChunk) => {
    try {
        const embedding = await getEmbedding(textChunk);
        if (!embedding) throw new Error("Failed to generate embedding.");

        const db = await getLanceDb();
        const tableNames = await db.tableNames();

        let table;
        if (!tableNames.includes(MEMORY_TABLE_NAME)) {
            console.log(`Creating LanceDB table: ${MEMORY_TABLE_NAME}`);
            table = await db.createTable(MEMORY_TABLE_NAME, [
                { vector: embedding, text: textChunk, user_id: userId, timestamp: new Date() },
            ]);
        } else {
            table = await db.openTable(MEMORY_TABLE_NAME);
            await table.add([{ vector: embedding, text: textChunk, user_id: userId, timestamp: new Date() }]);
        }
        console.log(`Added memory for user ${userId}: "${textChunk}"`);
    } catch (error) {
        console.error("Error adding memory to LanceDB:", error);
    }
};

/**
 * Fetches relevant memories for a user based on a query text.
 * @param {string} userId - The user's ID.
 * @param {string} queryText - The text to find similar memories for.
 * @param {number} nResults - The number of memories to return.
 * @returns {Promise<Array<string>>} An array of relevant memory texts.
 */
export const fetchRelevantMemories = async (userId, queryText, nResults = 3) => {
    try {
        const db = await getLanceDb();
        const tableNames = await db.tableNames();
        if (!tableNames.includes(MEMORY_TABLE_NAME)) {
            return []; // No memories yet
        }

        const queryEmbedding = await getEmbedding(queryText);
        if (!queryEmbedding) return [];

        const table = await db.openTable(MEMORY_TABLE_NAME);
        const results = await table
            .search(queryEmbedding)
            .where(`user_id = '${userId}'`) // Filter by user
            .limit(nResults)
            .execute();

        return results.map(r => r.text);
    } catch (error) {
        console.error("Error fetching memories from LanceDB:", error);
        return []; // Return empty on error
    }
};

// src/chatbot/memory.js
// ... (keep all existing code)

// --- ADD THE FOLLOWING FUNCTIONS AT THE END ---

/**
 * Deletes all data for a specific user from SQLite.
 * @param {string} userId The user's ID.
 */
export const deleteUserHistory = async (userId) => {
    console.log(`Deleting SQLite data for user: ${userId}`);
    // The `dbRun` function is our promise-based wrapper from before
    await dbRun('DELETE FROM chat_history WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM users WHERE user_id = ?', [userId]);
};

/**
 * Deletes all memories for a specific user from LanceDB.
 * @param {string} userId The user's ID.
 */
export const deleteUserMemories = async (userId) => {
    try {
        console.log(`Deleting LanceDB data for user: ${userId}`);
        const db = await getLanceDb();
        const table = await db.openTable(MEMORY_TABLE_NAME);
        await table.delete(`user_id = '${userId}'`);
    } catch (error) {
        // It's okay if the table doesn't exist, just log other errors
        if (!error.message.includes("was not found")) {
            console.error("Error deleting memories from LanceDB:", error);
        }
    }
};