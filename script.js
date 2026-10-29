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
    const moreBtn = get("moreBtn");
    const moreMenu = get("moreMenu");
    const clearChatBtn = get("clearChatBtn");
    const conversation = get("conversation");

    const plusBtn = get("plusBtn");
    const plusMenu = get("plusMenu");
    const cameraBtn = get("cameraBtn");
    const photoBtn = get("photoBtn");
    const videoBtn = get("videoBtn");
    const fileBtn = get("fileBtn");

    const cameraInput = get("cameraInput");
    const photoInput = get("photoInput");
    const videoInput = get("videoInput");
    const fileInput = get("fileInput");

    const messageInput = get("message");
    const micBtn = get("mic");
    const sendBtn = get("send");

    /* Modals */
    const voiceMenuBtn = get("voiceMenuBtn");
    const voiceModal = get("voiceModal");
    const closeVoice = get("closeVoice");
    const voiceSelect = get("voiceSelect");
    const voiceGender = get("voiceGender");
    const startVoice = get("startVoice");

    const languageBtn = get("languageBtn");
    const languageModal = get("languageModal");
    const closeLanguage = get("closeLanguage");
    const languageSelect = get("languageSelect");
    const saveLanguage = get("saveLanguage");

    let chats = [];
    let currentChatId = null;
    let attachedFile = null;
    let recognition = null;
    let isListening = false;

    let speakerEnabled = localStorage.getItem("viggoSpeakerEnabled") !== "false";
    let selectedLanguage = localStorage.getItem("viggoLanguage") || "en-IN";
    let selectedVoice = localStorage.getItem("viggoVoice") || "female";

    function saveChats() {
        try {
            localStorage.setItem("viggoChats", JSON.stringify(chats));
        } catch (e) {
            console.error("Failed to save chats:", e);
        }
    }

    function loadChats() {
        try {
            const saved = localStorage.getItem("viggoChats");
            chats = saved ? JSON.parse(saved) : [];
        } catch (e) {
            chats = [];
        }
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

    /* SPEECH SYNTHESIS (SPEAK / OFF) */
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

    /* COPY TEXT FUNCTION */
    async function copyMessageText(text) {
        try {
            await navigator.clipboard.writeText(text || "");
            alert("Copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy text:", err);
        }
    }

    /* RENDER MESSAGE WITH COPY, LIKE, SPEAKER BUTTONS BELOW CHAT */
    function addMessageToUI(msg) {
        if (!conversation) return;

        const role = msg.role === "assistant" ? "assistant" : "user";
        const wrapper = document.createElement("div");
        wrapper.className = role === "user" ? "message user" : "message ai";

        const content = document.createElement("div");
        content.className = "message-content";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        if (msg.media && msg.media.data && msg.media.type?.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = msg.media.data;
            img.style.maxWidth = "100%";
            img.style.borderRadius = "10px";
            img.style.display = "block";
            bubble.appendChild(img);
        }

        if (msg.text) {
            const textEl = document.createElement("div");
            textEl.textContent = msg.text;
            if (msg.media) textEl.style.marginTop = "8px";
            bubble.appendChild(textEl);
        }

        content.appendChild(bubble);

        /* AI சாட்டுகளுக்கு மட்டும் கீழே Action Buttons (Copy, Like, Speaker) */
        if (role === "assistant") {
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "message-actions";

            // Copy Button
            const copyBtn = document.createElement("button");
            copyBtn.type = "button";
            copyBtn.className = "action-btn";
            copyBtn.textContent = "📋 Copy";
            copyBtn.addEventListener("click", () => copyMessageText(msg.text));

            // Like Button
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

            // Speaker ON/OFF Button
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

    /* RENDER SIDEBAR HISTORY WITH BLACK THEME PIN/DELETE BUTTONS */
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

            // Pin Button
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

            // Delete Button
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

    /* Sidebar Controls */
    openSidebar?.addEventListener("click", () => sidebar?.classList.add("open"));
    closeSidebar?.addEventListener("click", () => sidebar?.classList.remove("open"));

    newChat?.addEventListener("click", () => {
        const chat = createChat();
        chats.unshift(chat);
        currentChatId = chat.id;
        attachedFile = null;
        if (messageInput) {
            messageInput.value = "";
            messageInput.placeholder = "Message Viggo AI...";
        }
        saveChats();
        renderHistory();
        renderConversation();
        sidebar?.classList.remove("open");
    });

    moreBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        moreMenu?.classList.toggle("show");
    });

    plusBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        plusMenu?.classList.toggle("show");
    });

    document.addEventListener("click", () => {
        plusMenu?.classList.remove("show");
        moreMenu?.classList.remove("show");
    });

    /* Modal Controls */
    voiceMenuBtn?.addEventListener("click", () => {
        if (voiceSelect) voiceSelect.value = selectedLanguage;
        if (voiceGender) voiceGender.value = selectedVoice;
        voiceModal?.classList.add("show");
    });
    closeVoice?.addEventListener("click", () => voiceModal?.classList.remove("show"));
    startVoice?.addEventListener("click", () => {
        if (voiceSelect) selectedLanguage = voiceSelect.value;
        if (voiceGender) selectedVoice = voiceGender.value;
        localStorage.setItem("viggoLanguage", selectedLanguage);
        localStorage.setItem("viggoVoice", selectedVoice);
        voiceModal?.classList.remove("show");
    });

    languageBtn?.addEventListener("click", () => {
        if (languageSelect) languageSelect.value = selectedLanguage;
        languageModal?.classList.add("show");
    });
    closeLanguage?.addEventListener("click", () => languageModal?.classList.remove("show"));
    saveLanguage?.addEventListener("click", () => {
        if (languageSelect) selectedLanguage = languageSelect.value;
        localStorage.setItem("viggoLanguage", selectedLanguage);
        languageModal?.classList.remove("show");
    });

    /* File Handlers */
    cameraBtn?.addEventListener("click", () => cameraInput?.click());
    photoBtn?.addEventListener("click", () => photoInput?.click());
    videoBtn?.addEventListener("click", () => videoInput?.click());
    fileBtn?.addEventListener("click", () => fileInput?.click());

    [cameraInput, photoInput, videoInput, fileInput].forEach((input) => {
        input?.addEventListener("change", () => {
            attachedFile = input.files?.[0];
            if (messageInput && attachedFile) {
                messageInput.placeholder = `Attached: ${attachedFile.name}`;
            }
            input.value = "";
        });
    });

    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /* Speech Recognition */
    function setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            micBtn?.classList.add("listening");
        };

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (messageInput) messageInput.value = transcript;
        };

        recognition.onerror = () => {
            isListening = false;
            micBtn?.classList.remove("listening");
        };

        recognition.onend = () => {
            isListening = false;
            micBtn?.classList.remove("listening");
        };
    }

    setupSpeechRecognition();

    micBtn?.addEventListener("click", () => {
        if (!recognition) {
            alert("Speech recognition is not supported on this browser.");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.lang = selectedLanguage;
            recognition.start();
        }
    });

    searchChat?.addEventListener("input", renderHistory);

    async function sendMessage() {
        const text = messageInput?.value.trim() || "";
        if (!text && !attachedFile) return;

        const chat = ensureChat();
        let mediaPayload = null;

        if (attachedFile) {
            try {
                const base64 = await fileToDataURL(attachedFile);
                mediaPayload = { name: attachedFile.name, type: attachedFile.type, data: base64 };
            } catch (err) {
                console.error("Error reading file:", err);
            }
        }

        chat.messages.push({ role: "user", text, media: mediaPayload });
        if (chat.title === "New Chat" && text) {
            chat.title = text.length > 25 ? text.substring(0, 25) + "..." : text;
        }

        if (messageInput) {
            messageInput.value = "";
            messageInput.placeholder = "Message Viggo AI...";
        }
        attachedFile = null;

        saveChats();
        renderHistory();
        renderConversation();

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    language: selectedLanguage,
                    voice: selectedVoice
                })
            });

            if (!res.ok) throw new Error("Server error");

            const data = await res.json();
            const reply = data.reply || data.message || "I'm here to help!";

            chat.messages.push({ role: "assistant", text: reply, liked: false });
            saveChats();
            renderHistory();
            renderConversation();

            if (speakerEnabled) speakText(reply);

        } catch (err) {
            chat.messages.push({
                role: "assistant",
                text: "Sorry, I couldn't reach the server. Please check your network connection."
            });
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

    clearChatBtn?.addEventListener("click", () => {
        const chat = getCurrentChat();
        if (chat) {
            chat.messages = [];
            saveChats();
            renderConversation();
        }
    });

    loadChats();
    ensureChat();
    renderHistory();
    renderConversation();
})();
