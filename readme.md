````markdown
# STAN Conversational AI Agent

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js Version](https://img.shields.io/badge/node-v18%2B-green.svg)
![Platform](https://img.shields.io/badge/platform-Node.js%2FExpress-lightgrey)

A human-like, empathetic, and context-aware conversational AI agent built for the STAN Internship Challenge. This chatbot incorporates personalized long-term memory and emotional adaptability to create an engaging and authentic user experience.

**[🎥 Watch the Demo Video Here](https://your-video-link-here.com)**

---

## 🚀 Key Features

* 🧠 **Personalized Long-Term Memory**: Remembers key details from past conversations to personalize future interactions.
* 💬 **Human-Like Interaction**: Employs a carefully crafted persona and dynamic prompt engineering to avoid robotic responses.
* 💡 **Contextual Awareness**: Leverages both short-term conversational flow and long-term semantic memories for coherent replies.
* 🔧 **Modular & Scalable Design**: Built with a decoupled architecture for easy integration and low operational overhead.

---

## 🏛️ Architecture Overview

The chatbot's architecture is centered around a **dual-memory system** to effectively mimic human conversational memory, separating factual data from contextual understanding.

* **Structured Memory (The "Facts")**: Stored in **SQLite**, this handles concrete data like user profiles and conversation logs.
* **Semantic Memory (The "Vibes")**: Stored in **LanceDB**, this uses vector embeddings to store the *meaning* of conversations, enabling recall of related topics and feelings.

```mermaid
graph TD
    subgraph "User Interface"
        A[Browser Client]
    end

    subgraph "Backend Server (Node.js/Express.js)"
        B[API Endpoint /api/chat];
        C{Orchestrator};
        D[Prompt Engineering];
        E[Async Memory Update];
    end

    subgraph "Dual-Memory System"
        F[SQLite DB <br/>(Profiles & Chat History)];
        G[LanceDB <br/>(Semantic Vector Memory)];
    end

    subgraph "Google Gemini APIs"
        H[Generative Model <br/>(gemini-1.5-flash)];
        I[Embedding Model <br/>(embedding-001)];
    end

    %% Request Flow
    A -- 1. User sends message --> B;
    B -- 2. Triggers logic --> C;
    C -- "3a. Fetch Profile & History" --> F;
    C -- "3b. Get Query Vector" --> I;
    I -- "Vector" --> C;
    C -- "3c. Search Relevant Memories" --> G;
    C -- 4. Gathers context --> D;
    D -- 5. Sends Master Prompt --> H;
    H -- 6. Returns AI Response --> D;
    D -- 7. Sends reply to client --> A;

    %% Async Update Flow (Dotted Lines)
    D -.-> E;
    E -- "8a. Save Conversation Turn" .-> F;
    E -- "8b. Create Memory Vector" .-> I;
    I -- "Vector" .-> E;
    E -- "8c. Store New Memory" .-> G;

    style E fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
````

-----

## 🛠️ Technology Stack

  * **Backend**: Node.js, Express.js
  * **Language Model (LLM)**: Google Gemini 1.5 Flash
  * **Structured Database**: SQLite
  * **Vector Database**: LanceDB
  * **Environment**: dotenv

-----

## ⚙️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You will need the following software installed on your machine:

  * Node.js (v18 or higher)
  * npm (Node Package Manager)
  * Git

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/stan-chatbot-node.git](https://github.com/your-username/stan-chatbot-node.git)
    ```

2.  **Navigate to the project directory:**

    ```bash
    cd stan-chatbot-node
    ```

3.  **Install dependencies:**

    ```bash
    npm install
    ```

4.  **Configure environment variables:**

      * Create a `.env` file in the root of the project.
      * Add your Google Generative AI API key to this file:
        ```env
        GOOGLE_API_KEY="your_api_key_here"
        ```

### Running the Application

1.  **Start the server:**
    ```bash
    node server.js
    ```
2.  Open your web browser and navigate to `http://localhost:3000`.

-----

## 📁 Project Structure

```
stan-chatbot-node/
│
├── .env                  # Store API keys (e.g., GOOGLE_API_KEY)
├── package.json          # Project dependencies and scripts
├── server.js             # Main server entry point (initializes Express)
│
├── src/                  # Core application logic
│   ├── chatbot/
│   │   ├── llm_handler.js    # Manages prompt creation and Gemini API calls
│   │   └── memory.js         # Handles all interactions with SQLite and LanceDB
│   │
│   ├── routes/
│   │   └── chat.js           # Defines the API routes (e.g., POST /api/chat)
│   │
│   └── config/
│       └── database.js       # Database connection and initialization logic
│
├── database/             # Database files will be created here
│   ├── chatbot_memory.db # SQLite database file
│   └── lancedb/          # Folder for LanceDB's local storage
│
├── public/               # Simple frontend demo (served by Express)
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── README.md
```

-----

## 📜 API Endpoints

| Method | Endpoint      | Body                      | Description                                |
| :----- | :------------ | :------------------------ | :----------------------------------------- |
| `POST` | `/api/chat`   | `{ "userId", "message" }` | Sends a message and receives an AI reply.  |
| `POST` | `/api/reset`  | `{ "userId" }`            | Deletes all history for a user.            |

-----

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

-----

## 👤 Author

**Zeeshan Malik**

  * GitHub: [@your-github-username](https://github.com/your-github-username)

<!-- end list -->

```
```