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
    const micBtn = get("mic");

    /* Plus Menu & File Inputs */
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

    let chats = [];
    let currentChatId = null;
    let attachedFile = null;
    let recognition = null;
    let isListening = false;

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

    /* SPEECH RECOGNITION (MOBILE MIC SUPPORT) */
    function setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            if (micBtn) {
                micBtn.style.color = "#1683ff";
                micBtn.style.background = "#0a1829";
            }
        };

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (messageInput) messageInput.value = transcript;
        };

        recognition.onerror = (err) => {
            console.error("Speech recognition error", err);
            isListening = false;
            if (micBtn) {
                micBtn.style.color = "#ffffff";
                micBtn.style.background = "#1b1b1b";
            }
        };

        recognition.onend = () => {
            isListening = false;
            if (micBtn) {
                micBtn.style.color = "#ffffff";
                micBtn.style.background = "#1b1b1b";
            }
        };
    }

    setupSpeechRecognition();

    micBtn?.addEventListener("click", () => {
        if (!recognition) {
            alert("Microphone is not supported on this browser or requires HTTPS.");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.lang = selectedLanguage;
            try {
                recognition.start();
            } catch (e) {
                console.error("Mic start error:", e);
            }
        }
    });

    /* PLUS MENU & FILE HANDLERS */
    plusBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        plusMenu?.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!plusMenu?.contains(e.target) && e.target !== plusBtn) {
            plusMenu?.classList.remove("show");
        }
    });

    cameraBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        plusMenu?.classList.remove("show");
        cameraInput?.click();
    });

    photoBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        plusMenu?.classList.remove("show");
        photoInput?.click();
    });

    videoBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        plusMenu?.classList.remove("show");
        videoInput?.click();
    });

    fileBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        plusMenu?.classList.remove("show");
        fileInput?.click();
    });

    [cameraInput, photoInput, videoInput, fileInput].forEach((input) => {
        input?.addEventListener("change", () => {
            if (input.files && input.files[0]) {
                attachedFile = input.files[0];
                if (messageInput) {
                    messageInput.placeholder = `Attached: ${attachedFile.name}`;
                }
            }
            input.value = "";
        });
    });

    /* COMPRESSED FILE TO DATA URL (SERVER TIMEOUT FIX) */
    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 600; // Optimized size for Render server safety
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.6)); // 60% Quality compression
                };
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /* THINKING INDICATOR */
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

            chatHistory.
