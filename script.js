"use strict";

(() => {
    const API_URL = "https://ai-tool-2-zpul.onrender.com/chat";
    const get = (id) => document.getElementById(id);

    const sidebar = get("sidebar");
    const openSidebar = get("openSidebar");
    const closeSidebar = get("closeSidebar");
    const newChat = get("newChat");
    const searchChat = get("searchChat");
    const chatHistory = get("chatHistory");
    const conversation = get("conversation");

    const messageInput = get("message");
    const sendBtn = get("send");

    let chats = [];
    let currentChatId = null;
    let speakerEnabled = localStorage.getItem("viggoSpeakerEnabled") !== "false";
    let selectedLanguage = localStorage.getItem("viggoLanguage") || "ta-IN";

    function saveChats() {
        localStorage.setItem("viggoChats", JSON.stringify(chats));
    }

    function loadChats() {
        const saved = localStorage.getItem("viggoChats");
        chats = saved ? JSON.parse(saved) : [];
    }

    function createId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    }

    function createChat() {
        return { id: createId(), title: "New Chat", pinned: false, messages: [] };
    }

    function getCurrentChat() {
        return chats.find((c) => c.id === currentChatId);
    }

    function ensureChat() {
        if (!chats.length) {
            const chat = createChat();
            chats.push(chat);
            currentChatId = chat.id;
            saveChats();
        }
        if (!currentChatId) currentChatId = chats[0].id;
        return getCurrentChat() || chats[0];
    }

    /* SPEECH SYNTHESIS */
    function speakText(text) {
        if (!speakerEnabled || !("speechSynthesis" in window) || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedLanguage;
        window.speechSynthesis.speak(utterance);
    }

    function toggleSpeaker(speakerBtn, text) {
        speakerEnabled = !speakerEnabled;
        localStorage.setItem("viggoSpeakerEnabled", String(speakerEnabled));

        if (speakerEnabled) {
            speakerBtn.textContent = "🔊 Speaker ON";
            speakerBtn.classList.add("speaker-active");
            speakText(text);
        } else {
            speakerBtn.textContent = "🔇 Speaker OFF";
            speakerBtn.classList.remove("speaker-active");
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        }
    }

    async function copyMessageText(text) {
        try {
            await navigator.clipboard.writeText(text || "");
            alert("Copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy text:", err);
        }
    }

    /* THINKING / LOADING INDICATOR */
    function showThinkingIndicator() {
        if (!conversation) return null;
        const wrapper = document.createElement("div");
        wrapper.className = "message ai thinking-wrapper";
        wrapper.id = "thinkingIndicator";

        const content = document.createElement("div");
        content.className = "message-content";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble thinking-bubble";
        bubble.innerHTML = `🤔 Viggo AI is thinking... <span class="dots"><span>.</span><span>.</span><span>.</span></span>`;

        content.appendChild(bubble);
        wrapper.appendChild(content);
        conversation.appendChild(wrapper);
        conversation.scrollTop = conversation.scrollHeight;
        return wrapper;
    }

    function removeThinkingIndicator() {
        const thinking = get("thinkingIndicator");
        if (thinking) thinking.remove();
    }

    /* RENDER MESSAGES */
    function addMessageToUI(msg) {
        if (!conversation) return;

        const role = msg.role === "assistant" ? "assistant" : "user";
        const wrapper = document.createElement("div");
        wrapper.className = role === "user" ? "message user" : "message ai";

        const content = document.createElement("div");
        content.className = "message-content";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = msg.text;

        content.appendChild(bubble);

        if (role === "assistant") {
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "message-actions";

            const copyBtn = document.createElement("button");
            copyBtn.type = "button";
            copyBtn.className = "action-btn";
            copyBtn.textContent = "📋 Copy";
            copyBtn.addEventListener("click", () => copyMessageText(msg.text));

            const likeBtn = document.createElement("button");
            likeBtn.type = "button";
            likeBtn.className = `action-btn ${msg.liked ? "liked" : ""}`;
            likeBtn.textContent = msg.liked ? "❤️ Liked" : "🤍 Like";
            likeBtn.addEventListener("click", () => {
                msg.liked = !msg.liked;
                saveChats();
                likeBtn.textContent = msg.liked ? "❤️ Liked" : "🤍 Like";
                likeBtn.classList.toggle("liked", msg.liked);
            });

            const speakerBtn = document.createElement("button");
            speakerBtn.type = "button";
            speakerBtn.className = `action-btn ${speakerEnabled ? "speaker-active" : ""}`;
            speakerBtn.textContent = speakerEnabled ? "🔊 Speaker ON" : "🔇 Speaker OFF";
            speakerBtn.addEventListener("click", () => toggleSpeaker(speakerBtn, msg.text));

            actionsDiv.appendChild(copyBtn);
            actionsDiv.appendChild(likeBtn);
            actionsDiv.appendChild(speakerBtn);

            content.appendChild(actionsDiv);
        }

        wrapper.appendChild(content);
        conversation.appendChild(wrapper);
    }

    function renderConversation() {
        if (!conversation) return;
        conversation.innerHTML = "";
        const chat = getCurrentChat();
        if (!chat) return;
        chat.messages.forEach(addMessageToUI);
        conversation.scrollTop = conversation.scrollHeight;
    }

    function renderHistory() {
        if (!chatHistory) return;
        chatHistory.innerHTML = "";

        const query = searchChat?.value ? searchChat.value.toLowerCase() : "";
        const sortedChats = [...chats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        const filtered = sortedChats.filter((c) => !query || (c.title && c.title.toLowerCase().includes(query)));

        filtered.forEach((chat) => {
            const item = document.createElement("div");
            item.className = `history-item ${chat.id === currentChatId ? "active" : ""}`;

            const titleSpan = document.createElement("span");
            titleSpan.className = "history-title-text";
            titleSpan.textContent = (chat.pinned ? "📌 " : "") + (chat.title || "New Chat");

            const actionsDiv = document.createElement("div");
            actionsDiv.className = "history-actions";

            const pinBtn = document.createElement("button");
            pinBtn.type = "button";
            pinBtn.className = `history-action-btn pin-btn ${chat.pinned ? "pinned" : ""}`;
            pinBtn.innerHTML = "📌";
            pinBtn.title = chat.pinned ? "Unpin Chat" : "Pin Chat";
            pinBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                chat.pinned = !chat.pinned;
                saveChats();
                renderHistory();
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "history-action-btn delete-btn";
            deleteBtn.innerHTML = "🗑️";
            deleteBtn.title = "Delete Chat";
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                chats = chats.filter((c) => c.id !== chat.id);
                if (currentChatId === chat.id) {
                    currentChatId = chats.length ? chats[0].id : null;
                }
                saveChats();
                ensureChat();
                renderHistory();
                renderConversation();
            });

            actionsDiv.appendChild(pinBtn);
            actionsDiv.appendChild(deleteBtn);

            item.appendChild(titleSpan);
            item.appendChild(actionsDiv);

            item.addEventListener("click", () => {
                currentChatId = chat.id;
                renderHistory();
                renderConversation();
                sidebar?.classList.remove("open");
            });

            chatHistory.appendChild(item);
        });
    }

    openSidebar?.addEventListener("click", () => sidebar?.classList.add("open"));
    closeSidebar?.addEventListener("click", () => sidebar?.classList.remove("open"));

    newChat?.addEventListener("click", () => {
        const chat = createChat();
        chats.unshift(chat);
        currentChatId = chat.id;
        if (messageInput) messageInput.value = "";
        saveChats();
        renderHistory();
        renderConversation();
        sidebar?.classList.remove("open");
    });

    /* SEND MESSAGE WITH CONTEXT MEMORY AND THINKING INDICATOR */
    async function sendMessage() {
        const text = messageInput?.value.trim() || "";
        if (!text) return;

        const chat = ensureChat();
        
        // User மெசேஜை சேர்த்தல்
        chat.messages.push({ role: "user", text });

        if (chat.title === "New Chat" && text) {
            chat.title = text.length > 25 ? text.substring(0, 25) + "..." : text;
        }

        if (messageInput) messageInput.value = "";

        saveChats();
        renderHistory();
        renderConversation();

        // Thinking Indicator ஐக் காட்டுதல்
        showThinkingIndicator();

        try {
            // முந்தைய உரையாடல்கள் அனைத்தையும் Context-ஆக அனுப்புதல்
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: text,
                    history: chat.messages, // முழு சாட் வரலாறும் சர்வருக்குச் செல்லும்
                    language: selectedLanguage 
                })
            });

            removeThinkingIndicator();

            const data = await res.json();
            const reply = data.reply || data.message || "I'm here to help!";

            chat.messages.push({ role: "assistant", text: reply, liked: false });
            saveChats();
            renderHistory();
            renderConversation();

            if (speakerEnabled) speakText(reply);

        } catch (err) {
            removeThinkingIndicator();
            chat.messages.push({ role: "assistant", text: "Error connecting to server. Please check your network or try again." });
            saveChats();
            renderHistory();
            renderConversation();
        }
    }

    sendBtn?.addEventListener("click", sendMessage);
    messageInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    loadChats();
    ensureChat();
    renderHistory();
    renderConversation();
})();
