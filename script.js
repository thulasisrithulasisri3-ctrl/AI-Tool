"use strict";

/* =========================================================
   VIGGO AI - FULL PRODUCTION SCRIPT.JS
   Text + Camera + Photo + Video + File Uploads
   Chat History + Pinning + Selection + Deletion
   Voice Speech Recognition + Text-to-Speech Output
   PWA Service Worker Registration + Offline Support
   API Endpoint: Render /chat
========================================================= */

(() => {
    console.log("=================================");
    console.log("VIGGO AI ENGINE STARTING...");
    console.log("=================================");

    /* =====================================================
       API ENDPOINT
    ===================================================== */
    const API_URL = "https://ai-tool-2-zpul.onrender.com/chat";

    /* =====================================================
       DOM ELEMENT HELPERS
    ===================================================== */
    const get = (id) => document.getElementById(id);

    /* =====================================================
       HTML ELEMENTS
    ===================================================== */
    const sidebar = get("sidebar");
    const openSidebar = get("openSidebar");
    const closeSidebar = get("closeSidebar");
    const newChat = get("newChat");
    const searchChat = get("searchChat");
    const chatHistory = get("chatHistory");
    const moreBtn = get("moreBtn");
    const moreMenu = get("moreMenu");
    const voiceMenuBtn = get("voiceMenuBtn");
    const languageBtn = get("languageBtn");
    const selectChatsBtn = get("selectChatsBtn");
    const deleteSelectedBtn = get("deleteSelectedBtn");
    const clearChatBtn = get("clearChatBtn");
    const shareBtn = get("shareBtn");
    const conversation = get("conversation");

    /* Plus Menu & Inputs */
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

    /* Message Bar Controls */
    const messageInput = get("message");
    const micBtn = get("mic");
    const sendBtn = get("send");

    /* Modals */
    const voiceModal = get("voiceModal");
    const closeVoice = get("closeVoice");
    const voiceSelect = get("voiceSelect");
    const voiceGender = get("voiceGender");
    const startVoice = get("startVoice");

    const languageModal = get("languageModal");
    const closeLanguage = get("closeLanguage");
    const languageSelect = get("languageSelect");
    const saveLanguage = get("saveLanguage");

    /* =====================================================
       STATE MANAGEMENT
    ===================================================== */
    let chats = [];
    let currentChatId = null;
    let selectedChats = new Set();
    let selectMode = false;
    let attachedFile = null;
    let recognition = null;
    let isListening = false;

    let speakerEnabled = localStorage.getItem("viggoSpeakerEnabled") !== "false";
    let selectedLanguage = localStorage.getItem("viggoLanguage") || "en-IN";
    let selectedVoice = localStorage.getItem("viggoVoice") || "female";

    /* =====================================================
       INITIALIZE INPUT ATTRIBUTES
    ===================================================== */
    if (cameraInput) {
        cameraInput.accept = "image/*";
        cameraInput.setAttribute("capture", "environment");
    }
    if (photoInput) {
        photoInput.accept = "image/*";
        photoInput.removeAttribute("capture");
    }
    if (videoInput) {
        videoInput.accept = "video/*";
    }
    if (fileInput) {
        fileInput.accept = "*/*";
    }

    /* =====================================================
       MOBILE VIEWPORT FIX
    ===================================================== */
    function fixViewportHeight() {
        const height = window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;
        document.documentElement.style.setProperty("--app-height", `${height}px`);
    }

    fixViewportHeight();
    window.addEventListener("resize", fixViewportHeight);
    window.addEventListener("orientationchange", fixViewportHeight);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", fixViewportHeight);
    }

    /* =====================================================
       LOCAL STORAGE DATA ACCESS
    ===================================================== */
    function saveChats() {
        try {
            localStorage.setItem("viggoChats", JSON.stringify(chats));
        } catch (error) {
            console.error("Storage error:", error);
        }
    }

    function loadChats() {
        try {
            const saved = localStorage.getItem("viggoChats");
            if (!saved) {
                chats = [];
                return;
            }
            const parsed = JSON.parse(saved);
            chats = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Load chats error:", error);
            chats = [];
        }
    }

    function createId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    }

    function createChat() {
        return {
            id: createId(),
            title: "New Chat",
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };
    }

    function getCurrentChat() {
        return chats.find((chat) => chat.id === currentChatId);
    }

    function ensureChat() {
        if (!chats.length) {
            const chat = createChat();
            chats.push(chat);
            currentChatId = chat.id;
            saveChats();
            return chat;
        }

        if (!currentChatId) {
            currentChatId = chats[0].id;
        }

        let chat = getCurrentChat();
        if (!chat) {
            chat = chats[0];
            currentChatId = chat.id;
        }

        if (!Array.isArray(chat.messages)) {
            chat.messages = [];
        }
        return chat;
    }

    /* =====================================================
       SIDEBAR & MENU CONTROLS
    ===================================================== */
    function closeSidebarMobile() {
        if (sidebar) sidebar.classList.remove("open");
    }

    if (openSidebar) {
        openSidebar.addEventListener("click", () => sidebar?.classList.add("open"));
    }
    if (closeSidebar) {
        closeSidebar.addEventListener("click", closeSidebarMobile);
    }

    function createNewChat() {
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
        closeSidebarMobile();
        messageInput?.focus();
    }

    if (newChat) newChat.addEventListener("click", createNewChat);

    function closeMenus() {
        plusMenu?.classList.remove("show", "active");
        moreMenu?.classList.remove("show", "active");
    }

    if (moreBtn) {
        moreBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            moreMenu?.classList.toggle("show");
            moreMenu?.classList.toggle("active");
        });
    }

    if (plusBtn) {
        plusBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            plusMenu?.classList.toggle("show");
            plusMenu?.classList.toggle("active");
        });
    }

    document.addEventListener("click", (event) => {
        if (plusMenu && !plusMenu.contains(event.target) && event.target !== plusBtn) {
            plusMenu.classList.remove("show", "active");
        }
        if (moreMenu && !moreMenu.contains(event.target) && event.target !== moreBtn) {
            moreMenu.classList.remove("show", "active");
        }
    });

    /* =====================================================
       FILE SELECTION HANDLERS
    ===================================================== */
    if (cameraBtn) {
        cameraBtn.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation(); closeMenus();
            cameraInput?.click();
        });
    }
    if (photoBtn) {
        photoBtn.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation(); closeMenus();
            photoInput?.click();
        });
    }
    if (videoBtn) {
        videoBtn.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation(); closeMenus();
            videoInput?.click();
        });
    }
    if (fileBtn) {
        fileBtn.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation(); closeMenus();
            fileInput?.click();
        });
    }

    function handleSelectedFile(file) {
        if (!file) return;
        attachedFile = file;
        if (messageInput) {
            messageInput.placeholder = `Attached: ${file.name}`;
        }
    }

    [cameraInput, photoInput, videoInput, fileInput].forEach((input) => {
        if (input) {
            input.addEventListener("change", () => {
                const file = input.files?.[0];
                handleSelectedFile(file);
                input.value = "";
            });
        }
    });

    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    /* =====================================================
       UTILITIES & FORMATTING
    ===================================================== */
    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatMessage(text) {
        if (!text) return "";
        let html = escapeHTML(text);
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
        html = html.replace(/\n/g, "<br>");
        return html;
    }

    function createActionButton(text, title) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.title = title;
        return button;
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text || "");
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = text || "";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
        }
    }

    function saveMessage(text) {
        try {
            const saved = JSON.parse(localStorage.getItem("viggoSavedMessages") || "[]");
            saved.push({ text: text || "", savedAt: Date.now() });
            localStorage.setItem("viggoSavedMessages", JSON.stringify(saved));
        } catch (error) {
            console.error("Save message error:", error);
        }
    }

    /* =====================================================
       SPEECH SYNTHESIS (TTS)
    ===================================================== */
    function getSpeechLanguage() {
        return selectedLanguage || "en-IN";
    }

    function speakText(text) {
        if (!speakerEnabled || !("speechSynthesis" in window) || !text) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getSpeechLanguage();
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(
            (voice) =>
                voice.lang &&
                voice.lang.toLowerCase().startsWith(selectedLanguage.split("-")[0].toLowerCase())
        );

        if (matchingVoice) utterance.voice = matchingVoice;
        window.speechSynthesis.speak(utterance);
    }

    function toggleSpeaker() {
        speakerEnabled = !speakerEnabled;
        localStorage.setItem("viggoSpeakerEnabled", String(speakerEnabled));
        if (!speakerEnabled && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }

    function createSpeakerButton(text) {
        const button = createActionButton(
            speakerEnabled ? "🔊" : "🔇",
            speakerEnabled ? "Speaker ON" : "Speaker OFF"
        );
        button.className = "speaker-action-btn";

        button.addEventListener("click", () => {
            toggleSpeaker();
            button.textContent = speakerEnabled ? "🔊" : "🔇";
            button.title = speakerEnabled ? "Speaker ON" : "Speaker OFF";
            if (speakerEnabled) speakText(text);
        });
        return button;
    }

    /* =====================================================
       SPEECH RECOGNITION (STT)
    ===================================================== */
    function setupSpeechRecognition() {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API unavailable in this browser.");
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLanguage;

        recognition.onstart = () => {
            isListening = true;
            micBtn?.classList.add("listening");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (messageInput) messageInput.value = transcript;
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            isListening = false;
            micBtn?.classList.remove("listening");
        };

        recognition.onend = () => {
            isListening = false;
            micBtn?.classList.remove("listening");
        };
    }

    setupSpeechRecognition();

    if (micBtn) {
        micBtn.addEventListener("click", () => {
            if (!recognition) {
                alert("Speech recognition is not supported in this browser.");
                return;
            }
            if (isListening) {
                recognition.stop();
            } else {
                recognition.lang = selectedLanguage;
                recognition.start();
            }
        });
    }

    /* =====================================================
       RENDER MESSAGE TO CONVERSATION
    ===================================================== */
    function addMessageToUI(message) {
        if (!conversation) return;

        const role = message.role === "assistant" ? "assistant" : "user";
        const wrapper = document.createElement("div");
        wrapper.className = role === "user" ? "message user" : "message ai";

        const content = document.createElement("div");
        content.className = "message-content";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        /* Media Attachments */
        const media = message.media;
        if (media && media.data && media.type?.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = media.data;
            img.alt = media.name || "Uploaded image";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "350px";
            img.style.objectFit = "contain";
            img.style.borderRadius = "12px";
            img.style.display = "block";
            bubble.appendChild(img);
        }

        if (media && media.data && media.type?.startsWith("video/")) {
            const video = document.createElement("video");
            video.src = media.data;
            video.controls = true;
            video.style.maxWidth = "100%";
            video.style.maxHeight = "350px";
            video.style.borderRadius = "12px";
            bubble.appendChild(video);
        }

        if (
            media &&
            media.name &&
            !media.type?.startsWith("image/") &&
            !media.type?.startsWith("video/")
        ) {
            const fileBox = document.createElement("div");
            fileBox.textContent = `📎 ${media.name}`;
            bubble.appendChild(fileBox);
        }

        /* Message Text */
        if (message.text) {
            const textElement = document.createElement("div");
            textElement.innerHTML = formatMessage(message.text);
            if (media && media.data) textElement.style.marginTop = "8px";
            bubble.appendChild(textElement);
        }

        content.appendChild(bubble);

        /* Assistant Action Buttons */
        if (role === "assistant" && !message.loading) {
            const actions = document.createElement("div");
            actions.className = "message-actions";

            const copy = createActionButton("Copy", "Copy");
            copy.addEventListener("click", () => copyText(message.text));

            const save = createActionButton("Save", "Save");
            save.addEventListener("click", () => saveMessage(message.text));

            const like = createActionButton(
                message.liked ? "Liked" : "Like",
                "Like"
            );
            like.addEventListener("click", () => {
                message.liked = !message.liked;
                saveChats();
                like.textContent = message.liked ? "Liked" : "Like";
            });

            const speaker = createSpeakerButton(message.text);

            actions.appendChild(copy);
            actions.appendChild(save);
            actions.appendChild(like);
            actions.appendChild(speaker);

            content.appendChild(actions);
        }

        wrapper.appendChild(content);
        conversation.appendChild(wrapper);
    }

    /* =====================================================
       RENDER CONVERSATION & CHAT HISTORY
    ===================================================== */
    function renderConversation() {
        if (!conversation) return;
        conversation.innerHTML = "";

        const chat = getCurrentChat();
        if (!chat) return;

        if (!Array.isArray(chat.messages)) chat.messages = [];

        chat.messages.forEach((message) => addMessageToUI(message));
        conversation.scrollTop = conversation.scrollHeight;
    }

    function renderHistory() {
        if (!chatHistory) return;
        chatHistory.innerHTML = "";

        const query = searchChat?.value ? searchChat.value.toLowerCase() : "";
        const filtered = chats.filter((chat) => {
            if (!query) return true;
            return chat.title && chat.title.toLowerCase().includes(query);
        });

        filtered.forEach((chat) => {
            const item = document.createElement("div");
            item.className = "history-item";

            if (chat.id === currentChatId) item.classList.add("active");
            if (selectMode && selectedChats.has(chat.id)) item.classList.add("selected");

            const titleSpan = document.createElement("span");
            titleSpan.className = "history-title";
            titleSpan.textContent = chat.title || "New Chat";
            item.appendChild(titleSpan);

            item.addEventListener("click", () => {
                if (selectMode) {
                    if (selectedChats.has(chat.id)) {
                        selectedChats.delete(chat.id);
                    } else {
                        selectedChats.add(chat.id);
                    }
                    renderHistory();
                    return;
                }

                currentChatId = chat.id;
                attachedFile = null;
                if (messageInput) {
                    messageInput.value = "";
                    messageInput.placeholder = "Message Viggo AI...";
                }
                saveChats();
                renderHistory();
                renderConversation();
                closeSidebarMobile();
            });

            chatHistory.appendChild(item);
        });
    }

    if (searchChat) {
        searchChat.addEventListener("input", renderHistory);
    }

    /* =====================================================
       SEND MESSAGE & API EXECUTION
    ===================================================== */
    async function sendMessage() {
        const text = messageInput?.value.trim() || "";
        if (!text && !attachedFile) return;

        const chat = ensureChat();
        let mediaPayload = null;

        if (attachedFile) {
            try {
                const base64Data = await fileToDataURL(attachedFile);
                mediaPayload = {
                    name: attachedFile.name,
                    type: attachedFile.type,
                    data: base64Data
                };
            } catch (err) {
                console.error("File conversion error:", err);
            }
        }

        const userMessage = {
            role: "user",
            text: text,
            media: mediaPayload
        };

        chat.messages.push(userMessage);

        if (chat.title === "New Chat" && text) {
            chat.title = text.length > 25 ? text.substring(0, 25) + "..." : text;
        }

        chat.updatedAt = Date.now();

        if (messageInput) {
            messageInput.value = "";
            messageInput.placeholder = "Message Viggo AI...";
        }

        attachedFile = null;

        saveChats();
        renderHistory();
        renderConversation();

        /* Loading Indicator */
        const loadingMessage = {
            role: "assistant",
            text: "Thinking...",
            loading: true
        };
        chat.messages.push(loadingMessage);
        renderConversation();

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history: chat.messages.slice(0, -2),
                    language: selectedLanguage,
                    voice: selectedVoice
                })
            });

            if (!response.ok) {
                throw new Error(`Server status: ${response.status}`);
            }

            const data = await response.json();
            const aiReply = data.reply || data.message || "I'm here to help!";

            chat.messages.pop(); // Remove loading message

            const assistantMessage = {
                role: "assistant",
                text: aiReply,
                liked: false
            };
            chat.messages.push(assistantMessage);

            saveChats();
            renderHistory();
            renderConversation();

            if (speakerEnabled) speakText(aiReply);

        } catch (error) {
            console.error("API Fetch Error:", error);
            chat.messages.pop();

            const errorMessage = {
                role: "assistant",
                text: "Sorry, I couldn't reach the server. Please verify network connectivity."
            };
            chat.messages.push(errorMessage);

            saveChats();
            renderHistory();
            renderConversation();
        }
    }

    /* =====================================================
       EVENT LISTENERS
    ===================================================== */
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);

    if (messageInput) {
        messageInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    /* Clear Chat */
    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            const chat = getCurrentChat();
            if (chat) {
                chat.messages = [];
                saveChats();
                renderConversation();
                closeMenus();
            }
        });
    }

    /* =====================================================
       SERVICE WORKER REGISTRATION (PWA)
    ===================================================== */
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => console.log("SW registered on scope:", reg.scope))
                .catch((err) => console.error("SW registration failed:", err));
        });
    }

    /* =====================================================
       BOOTSTRAP APPLICATION
    ===================================================== */
    loadChats();
    ensureChat();
    renderHistory();
    renderConversation();

    console.log("=================================");
    console.log("VIGGO AI ENGINE READY.");
    console.log("=================================");
})();
