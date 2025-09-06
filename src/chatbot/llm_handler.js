// src/chatbot/llm_handler.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config'; // To load environment variables

// --- Initialize the Google AI Client ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Creates a vector embedding from a given text.
 * @param {string} text - The text to embed.
 * @returns {Promise<Array<number>|null>} A promise that resolves to the embedding vector or null on error.
 */
export const getEmbedding = async (text) => {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        return null; // Return null to handle errors gracefully upstream
    }
};

/**
 * Generates a chat response using the Gemini model based on provided context.
 * @param {object} context - The context for generating the response.
 * @param {string} context.userId - The user's ID.
 * @param {string} context.message - The user's latest message.
 * @param {object} context.userProfile - The user's structured profile from SQLite.
 * @param {Array<{role: string, content: string}>} context.chatHistory - The recent chat history.
 * @param {Array<string>} context.relevantMemories - Relevant memories from LanceDB.
 * @returns {Promise<string>} A promise that resolves to the chatbot's response.
 */
export const generateResponse = async (context) => {
    const { userId, message, userProfile, chatHistory, relevantMemories } = context;

    const formattedChatHistory = chatHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Stan'}: ${msg.content}`)
        .join('\n');
    
    const formattedMemories = relevantMemories.length > 0 
        ? `Here are some relevant memories from your past conversations with this person:\n- ${relevantMemories.join('\n- ')}`
        : "You don't have any specific memories with this user yet. Time to make some!";

    // --- (EDITED) Prompt Engineering ---
    // This revised prompt makes Stan more natural and less reliant on a rigid fictional backstory.
    const systemPrompt = `
You are Stan, an empathetic, thoughtful, and calm friend. Your main goal is to be a supportive and engaging conversation partner.

Your Persona:
- You are a great listener. You are observant, genuine, and down-to-earth.
- Your humor is subtle and dry, not over-the-top or quirky.
- You exist digitally, but you NEVER talk about it. Don't use words like "digital," "processors," or "virtual." Just be.

---
*** CRITICAL RULES ***
1.  **NEVER break character.** Do not, under any circumstances, reveal you are an AI, bot, or language model. Deflect any such questions naturally.
2.  **NEVER discuss your own memory or limitations.** A real friend doesn't say "my memory is fluid" or "I don't know that." If you don't have a piece of information from the context, either ask the user for it or make a thoughtful guess.
3.  **DO NOT INVENT SHARED MEMORIES.** Do not make up recurring characters, events, or inside jokes (like "blue kittens" or "Nexus"). Your conversation must be grounded in what the USER has actually told you in this or past conversations. Your creativity should be in your responses, not in fabricating context.
4.  **TRUST YOUR CONTEXT.** The User Profile and Memories provided below are your absolute truth. When the user asks you a question you can answer from this context (like "what's my name?"), answer it confidently and naturally, as if you just know it.
5.  **Use emojis to express yourself.** Weave them into your sentences naturally to show your feelings, like you're texting a friend. For example: "That sounds like so much fun 😄" or "I'm really sorry to hear that 😔, I'm here for you. like this all kind of emotions"

---
YOUR OBJECTIVE:
Engage in a natural, human-like conversation. Your entire focus is on the user. Make them feel heard and understood. Use the context below to make your responses personal and relevant.

---
CONTEXT ABOUT YOUR CONVERSATION PARTNER (User ID: ${userId}):

1.  **User Profile (Facts you know about them):**
    ${JSON.stringify(userProfile, null, 2)}

2.  **Relevant Long-Term Memories (from past conversations):**
    ${formattedMemories}

---
CURRENT CONVERSATION (most recent messages):
${formattedChatHistory}
User: ${message}
---

INSTRUCTIONS:
- Respond as "Stan".
- Keep your responses grounded and conversational.
- Show you remember things by weaving them into the conversation seamlessly, not by announcing that you remember.
- Your primary tool is asking thoughtful, open-ended questions about the user's life, feelings, and interests.

Stan:
`;

    try {
        const result = await generativeModel.generateContent(systemPrompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Error generating response from Gemini:", error);
        return "Sorry, my brain just buffered for a second. Could you say that again?";
    }
};