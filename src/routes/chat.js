// src/routes/chat.js

import { Router } from 'express';
import {
    getOrCreateUser,
    getChatHistory,
    addMessageToHistory,
    fetchRelevantMemories,
    deleteUserHistory,  
    deleteUserMemories, 
    // We can add functions here later to update profiles, etc.
} from '../chatbot/memory.js';
import { generateResponse } from '../chatbot/llm_handler.js';


const router = Router();

// Define the main chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { userId, message } = req.body;

        // Input validation
        if (!userId || !message) {
            return res.status(400).json({ error: 'userId and message are required.' });
        }

        // --- The Core Logic ---

        // 1. Retrieve all necessary context from memory
        const userProfile = await getOrCreateUser(userId);
        const chatHistory = await getChatHistory(userId);
        const relevantMemories = await fetchRelevantMemories(userId, message);

        // 2. Log the user's new message to history
        await addMessageToHistory(userId, 'user', message);

        // 3. Prepare the full context for the LLM
        const context = {
            userId,
            message,
            userProfile,
            chatHistory,
            relevantMemories,
        };

        // 4. Generate a response from the LLM
        const aiResponse = await generateResponse(context);

        // 5. Log the AI's response to history
        await addMessageToHistory(userId, 'ai', aiResponse);

        // 6. Send the response back to the client
        res.json({ reply: aiResponse });

        // --- Post-response async tasks (optional but good practice) ---
        // Here you could add logic to analyze the conversation and
        // update the user's profile with new facts without making the user wait.
        // For example: await updateUserProfileBasedOnConversation(...)

    } catch (error) {
        console.error('Error in /chat endpoint:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

router.post('/reset', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required.' });
        }

        // Call the deletion functions
        await deleteUserHistory(userId);
        await deleteUserMemories(userId);
        
        res.status(200).json({ message: 'User data cleared successfully.' });

    } catch (error) {
        console.error('Error in /reset endpoint:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});


export default router;