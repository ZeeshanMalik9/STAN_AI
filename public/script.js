document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const userIdSpan = document.getElementById('userId');

    // Get or create a unique user ID and store it
    let userId = localStorage.getItem('stanChatUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('stanChatUserId', userId);
    }
    userIdSpan.textContent = userId;

    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const sendMessage = async () => {
        const messageText = userInput.value.trim();
        if (messageText === '') return;

        addMessage(messageText, 'user');
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message: messageText }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            addMessage(data.reply, 'ai');

        } catch (error) {
            console.error('Error sending message:', error);
            addMessage('Sorry, something went wrong. Please try again.', 'ai');
        } finally {
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    };

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
});

// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    // ... (keep all the existing code at the top)
    const resetButton = document.getElementById('resetButton'); // <--- GET THE BUTTON

    // ... (keep the addMessage and sendMessage functions)

    // --- ADD THIS EVENT LISTENER FOR THE RESET BUTTON ---
    resetButton.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete all history and start a new conversation?')) {
            return;
        }

        try {
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                throw new Error('Failed to reset conversation.');
            }
            
            // This is the most important part!
            alert('Conversation has been reset.');
            localStorage.removeItem('stanChatUserId'); // 1. Remove the old user ID
            location.reload();                         // 2. Reload the page for a fresh start
            
        } catch (error) {
            console.error('Error resetting conversation:', error);
            alert('Could not reset the conversation. Please try again.');
        }
    });

    sendButton.addEventListener('click', sendMessage);
    // ... (keep the rest of the file)
});