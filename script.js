"use strict";

/* =====================================================
   VIGGO AI - SCRIPT.JS
   Stable version
   - Continuous conversation
   - History
   - Send button
   - Enter key
   - Language
   - Speaker
   - File upload
   - API error handling
===================================================== */


/* =====================================================
   API
===================================================== */

const API_URL =
    "https://ai-tool-2-zpul.onrender.com/chat";


/* =====================================================
   GLOBAL STATE
===================================================== */

let conversations = JSON.parse(
    localStorage.getItem("viggoConversations") || "[]"
);

let currentChatId =
    localStorage.getItem("viggoCurrentChatId");

let selectedLanguage =
    localStorage.getItem("viggoLanguage") || "en-IN";

let speakerEnabled =
    localStorage.getItem("viggoSpeaker") === "true";

let isSending = false;


/* =====================================================
   LANGUAGE LIST
===================================================== */

const LANGUAGES = [
    ["en-IN", "English"],
    ["ta-IN", "Tamil"],
    ["hi-IN", "Hindi"],
    ["te-IN", "Telugu"],
    ["kn-IN", "Kannada"],
    ["ml-IN", "Malayalam"],
    ["bn-IN", "Bengali"],
    ["mr-IN", "Marathi"],
    ["gu-IN", "Gujarati"],
    ["pa-IN", "Punjabi"],
    ["ur-IN", "Urdu"],
    ["or-IN", "Odia"],
    ["as-IN", "Assamese"],

    ["fr-FR", "French"],
    ["de-DE", "German"],
    ["es-ES", "Spanish"],
    ["it-IT", "Italian"],
    ["pt-BR", "Portuguese"],
    ["ru-RU", "Russian"],
    ["ja-JP", "Japanese"],
    ["ko-KR", "Korean"],
    ["zh-CN", "Chinese"],
    ["ar-SA", "Arabic"],
    ["tr-TR", "Turkish"],
    ["nl-NL", "Dutch"],
    ["pl-PL", "Polish"],
    ["sv-SE", "Swedish"],
    ["da-DK", "Danish"],
    ["fi-FI", "Finnish"],
    ["no-NO", "Norwegian"],
    ["el-GR", "Greek"],
    ["he-IL", "Hebrew"],
    ["th-TH", "Thai"],
    ["vi-VN", "Vietnamese"],
    ["id-ID", "Indonesian"],
    ["ms-MY", "Malay"]
];


/* =====================================================
   ELEMENT FINDER
===================================================== */

function findElement(...ids) {

    for (const id of ids) {

        const element =
            document.getElementById(id);

        if (element) {
            return element;
        }
    }

    return null;
}


/* =====================================================
   ELEMENTS
===================================================== */

const messageInput = findElement(
    "messageInput",
    "chatInput",
    "userInput",
    "promptInput",
    "input"
);

const sendButton = findElement(
    "sendButton",
    "sendBtn",
    "sendMessageButton",
    "send"
);

const chatContainer = findElement(
    "chatContainer",
    "messagesContainer",
    "messages",
    "chatMessages",
    "conversation"
);

const newChatButton = findElement(
    "newChatButton",
    "newChatBtn",
    "newChat"
);

const historyContainer = findElement(
    "historyContainer",
    "historyList",
    "chatHistory",
    "history"
);

const languageButton = findElement(
    "languageButton",
    "languageBtn",
    "language"
);

const voiceButton = findElement(
    "voiceButton",
    "voiceBtn",
    "speakerButton",
    "speakerBtn"
);

const fileInput = findElement(
    "fileInput",
    "uploadInput",
    "attachmentInput"
);


/* =====================================================
   CHAT ID
===================================================== */

function createChatId() {

    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


/* =====================================================
   GET CURRENT CHAT
===================================================== */

function getCurrentChat() {

    if (!currentChatId) {

        currentChatId =
            createChatId();

        localStorage.setItem(
            "viggoCurrentChatId",
            currentChatId
        );
    }

    let chat =
        conversations.find(
            item =>
                item.id === currentChatId
        );

    if (!chat) {

        chat = {

            id: currentChatId,

            title: "New Chat",

            messages: [],

            createdAt: Date.now(),

            updatedAt: Date.now()
        };

        conversations.unshift(chat);

        saveConversations();
    }

    return chat;
}


/* =====================================================
   SAVE CONVERSATIONS
===================================================== */

function saveConversations() {

    localStorage.setItem(
        "viggoConversations",
        JSON.stringify(conversations)
    );

    localStorage.setItem(
        "viggoCurrentChatId",
        currentChatId || ""
    );
}


/* =====================================================
   UPDATE CURRENT CHAT
===================================================== */

function updateCurrentChat() {

    const chat =
        getCurrentChat();

    chat.updatedAt =
        Date.now();

    saveConversations();
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   SIMPLE MARKDOWN
===================================================== */

function formatMessage(text) {

    let html =
        escapeHTML(text);

    html =
        html.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

    html =
        html.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );

    html =
        html.replace(
            /\n/g,
            "<br>"
        );

    return html;
}


/* =====================================================
   SCROLL
===================================================== */

function scrollToBottom() {

    if (!chatContainer) {
        return;
    }

    requestAnimationFrame(() => {

        chatContainer.scrollTop =
            chatContainer.scrollHeight;

    });
}


/* =====================================================
   ADD MESSAGE UI
===================================================== */

function addMessageToUI(
    role,
    text,
    options = {}
) {

    if (!chatContainer) {
        return null;
    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message-wrapper " +
        role;

    wrapper.dataset.role =
        role;

    const message =
        document.createElement("div");

    message.className =
        "message " + role;

    message.innerHTML =
        formatMessage(text);

    wrapper.appendChild(message);


    /* =================================================
       MEDIA
    ================================================= */

    if (options.media) {

        const media =
            options.media;

        if (
            media.type &&
            media.type.startsWith("image/") &&
            media.data
        ) {

            const image =
                document.createElement("img");

            image.src =
                media.data;

            image.style.maxWidth =
                "100%";

            image.style.maxHeight =
                "320px";

            image.style.borderRadius =
                "12px";

            image.style.marginTop =
                "8px";

            wrapper.appendChild(image);
        }


        if (
            media.type &&
            media.type.startsWith("video/") &&
            media.data
        ) {

            const video =
                document.createElement("video");

            video.src =
                media.data;

            video.controls =
                true;

            video.style.maxWidth =
                "100%";

            video.style.maxHeight =
                "320px";

            video.style.borderRadius =
                "12px";

            video.style.marginTop =
                "8px";

            wrapper.appendChild(video);
        }
    }


    /* =================================================
       ACTIONS
    ================================================= */

    if (role === "assistant") {

        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";


        /* COPY */

        const copyButton =
            document.createElement("button");

        copyButton.type =
            "button";

        copyButton.textContent =
            "Copy";

        copyButton.onclick =
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        text
                    );

                    copyButton.textContent =
                        "Copied";

                    setTimeout(() => {

                        copyButton.textContent =
                            "Copy";

                    }, 1200);

                } catch (error) {

                    console.error(
                        "Copy failed:",
                        error
                    );
                }
            };


        /* SAVE */

        const saveButton =
            document.createElement("button");

        saveButton.type =
            "button";

        saveButton.textContent =
            "Save";

        saveButton.onclick =
            () => {

                const blob =
                    new Blob(
                        [text],
                        {
                            type:
                                "text/plain"
                        }
                    );

                const url =
                    URL.createObjectURL(
                        blob
                    );

                const a =
                    document.createElement("a");

                a.href =
                    url;

                a.download =
                    "viggo-response.txt";

                a.click();

                URL.revokeObjectURL(
                    url
                );
            };


        /* LIKE */

        const likeButton =
            document.createElement("button");

        likeButton.type =
            "button";

        likeButton.textContent =
            "Like";

        likeButton.onclick =
            () => {

                likeButton.classList.toggle(
                    "active"
                );
            };


        /* SPEAKER */

        const speaker =
            document.createElement("button");

        speaker.type =
            "button";

        speaker.textContent =
            "🔊";

        speaker.onclick =
            () => {

                speakText(text);
            };


        actions.appendChild(
            saveButton
        );

        actions.appendChild(
            copyButton
        );

        actions.appendChild(
            likeButton
        );

        actions.appendChild(
            speaker
        );

        wrapper.appendChild(
            actions
        );
    }


    chatContainer.appendChild(
        wrapper
    );

    scrollToBottom();

    return wrapper;
}


/* =====================================================
   RENDER CONVERSATION
===================================================== */

function renderConversation() {

    if (!chatContainer) {
        return;
    }

    chatContainer.innerHTML =
        "";

    const chat =
        getCurrentChat();

    if (
        !chat.messages ||
        !chat.messages.length
    ) {

        return;
    }

    chat.messages.forEach(msg => {

        addMessageToUI(
            msg.role,
            msg.text,
            {
                media:
                    msg.media || null
            }
        );

    });

    scrollToBottom();
}


/* =====================================================
   TYPING MESSAGE
===================================================== */

function showTyping() {

    if (!chatContainer) {
        return null;
    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message-wrapper assistant typing-message";

    const message =
        document.createElement("div");

    message.className =
        "message assistant";

    message.textContent =
        "Thinking...";

    wrapper.appendChild(
        message
    );

    chatContainer.appendChild(
        wrapper
    );

    scrollToBottom();

    return wrapper;
}


/* =====================================================
   LANGUAGE
===================================================== */

function getLanguageName(code) {

    const found =
        LANGUAGES.find(
            item =>
                item[0] === code
        );

    return found
        ? found[1]
        : "English";
}


/* =====================================================
   CHANGE LANGUAGE
===================================================== */

function setLanguage(language) {

    selectedLanguage =
        language;

    localStorage.setItem(
        "viggoLanguage",
        selectedLanguage
    );

    console.log(
        "Viggo language:",
        selectedLanguage
    );
}


/* =====================================================
   LANGUAGE BUTTON
===================================================== */

function setupLanguageButton() {

    if (!languageButton) {
        return;
    }

    languageButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            showLanguageMenu();
        }
    );
}


/* =====================================================
   LANGUAGE MENU
===================================================== */

function showLanguageMenu() {

    const old =
        document.getElementById(
            "viggoLanguageMenu"
        );

    if (old) {

        old.remove();

        return;
    }

    const menu =
        document.createElement("div");

    menu.id =
        "viggoLanguageMenu";

    menu.style.position =
        "fixed";

    menu.style.zIndex =
        "99999";

    menu.style.background =
        "white";

    menu.style.color =
        "black";

    menu.style.padding =
        "8px";

    menu.style.borderRadius =
        "12px";

    menu.style.maxHeight =
        "400px";

    menu.style.overflowY =
        "auto";

    menu.style.boxShadow =
        "0 5px 25px rgba(0,0,0,.25)";


    LANGUAGES.forEach(
        ([code, name]) => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                name;

            button.style.display =
                "block";

            button.style.width =
                "100%";

            button.style.padding =
                "8px 12px";

            button.style.border =
                "0";

            button.style.background =
                "transparent";

            button.style.textAlign =
                "left";

            button.style.cursor =
                "pointer";

            button.onclick =
                () => {

                    setLanguage(
                        code
                    );

                    menu.remove();
                };

            menu.appendChild(
                button
            );
        }
    );


    document.body.appendChild(
        menu
    );


    const rect =
        languageButton.getBoundingClientRect();

    menu.style.left =
        rect.left + "px";

    menu.style.top =
        rect.bottom + 6 + "px";
}


/* =====================================================
   SPEAKER
===================================================== */

function speakText(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            text
        );

    utterance.lang =
        selectedLanguage;

    utterance.rate =
        1;

    utterance.pitch =
        1;

    speechSynthesis.speak(
        utterance
    );
}


/* =====================================================
   VOICE BUTTON
   IMPORTANT:
   Speaker button will NOT open microphone.
===================================================== */

function setupVoiceButton() {

    if (!voiceButton) {
        return;
    }

    voiceButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            speakerEnabled =
                !speakerEnabled;

            localStorage.setItem(
                "viggoSpeaker",
                speakerEnabled
            );

            voiceButton.classList.toggle(
                "active",
                speakerEnabled
            );

            console.log(
                "Speaker:",
                speakerEnabled
                    ? "ON"
                    : "OFF"
            );
        }
    );
}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

    if (isSending) {
        return;
    }

    if (!messageInput) {

        console.error(
            "Message input not found."
        );

        return;
    }

    const message =
        String(
            messageInput.value || ""
        ).trim();

    if (!message) {
        return;
    }

    isSending =
        true;


    if (sendButton) {

        sendButton.disabled =
            true;

        sendButton.style.pointerEvents =
            "none";
    }


    const chat =
        getCurrentChat();


    /* =================================================
       USER MESSAGE
    ================================================= */

    const userMessage = {

        role:
            "user",

        text:
            message,

        timestamp:
            Date.now()
    };


    chat.messages.push(
        userMessage
    );


    if (
        chat.title === "New Chat"
    ) {

        chat.title =
            message.substring(
                0,
                40
            );
    }


    addMessageToUI(
        "user",
        message
    );


    messageInput.value =
        "";

    updateCurrentChat();


    /* =================================================
       TYPING
    ================================================= */

    const typing =
        showTyping();


    try {

        /*
         * IMPORTANT:
         * Send previous conversation to server.
         * Exclude the current user message because
         * server receives it separately.
         */

        const history =
            chat.messages
                .slice(0, -1)
                .slice(-30)
                .map(msg => ({

                    role:
                        msg.role === "assistant"
                            ? "assistant"
                            : "user",

                    text:
                        String(
                            msg.text || ""
                        )
                }));


        console.log(
            "Sending to Viggo:",
            {
                message,
                language:
                    selectedLanguage,
                historyLength:
                    history.length
            }
        );


        const response =
            await fetch(
                API_URL,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message,

                            language:
                                selectedLanguage,

                            history
                        })
                }
            );


        let data =
            null;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                "Server returned an invalid response."
            );
        }


        if (!response.ok) {

            throw new Error(
                data?.error ||
                `Server error: ${response.status}`
            );
        }


        if (
            !data ||
            data.success !== true ||
            !data.reply
        ) {

            throw new Error(
                data?.error ||
                "Viggo did not return a reply."
            );
        }


        /* =================================================
           REMOVE TYPING
        ================================================= */

        if (typing) {
            typing.remove();
        }


        /* =================================================
           ASSISTANT MESSAGE
        ================================================= */

        const reply =
            String(
                data.reply
            ).trim();


        const assistantMessage = {

            role:
                "assistant",

            text:
                reply,

            timestamp:
                Date.now()
        };


        chat.messages.push(
            assistantMessage
        );


        addMessageToUI(
            "assistant",
            reply
        );


        updateCurrentChat();


        /* =================================================
           AUTO SPEAKER
        ================================================= */

        if (speakerEnabled) {

            speakText(
                reply
            );
        }


    } catch (error) {

        console.error(
            "Viggo send error:",
            error
        );


        if (typing) {
            typing.remove();
        }


        const errorText =
            getFriendlyError(
                error
            );


        addMessageToUI(
            "assistant",
            errorText
        );


        chat.messages.push({

            role:
                "assistant",

            text:
                errorText,

            timestamp:
                Date.now(),

            isError:
                true
        });


        updateCurrentChat();

    } finally {

        isSending =
            false;

        if (sendButton) {

            sendButton.disabled =
                false;

            sendButton.style.pointerEvents =
                "";
        }

        if (messageInput) {

            messageInput.focus();
        }

        scrollToBottom();
    }
}


/* =====================================================
   FRIENDLY ERROR
===================================================== */

function getFriendlyError(error) {

    const text =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    if (
        text.includes("failed to fetch") ||
        text.includes("network")
    ) {

        return (
            "Viggo AI server-ஐ connect செய்ய முடியவில்லை. " +
            "சிறிது நேரம் கழித்து மீண்டும் முயற்சி செய்யுங்கள்."
        );
    }


    if (
        text.includes("quota") ||
        text.includes("429")
    ) {

        return (
            "Gemini API quota முடிந்துவிட்டது. " +
            "API quota reset ஆன பிறகு மீண்டும் முயற்சி செய்யுங்கள்."
        );
    }


    if (
        text.includes("model") &&
        (
            text.includes("not found") ||
            text.includes("404")
        )
    ) {

        return (
            "Gemini model கிடைக்கவில்லை. " +
            "Server-ல் பயன்படுத்தும் model name-ஐ சரிபார்க்க வேண்டும்."
        );
    }


    return (
        "Sorry friend, Viggo AI-ல் ஒரு பிரச்சனை ஏற்பட்டுள்ளது.\n\n" +
        error.message
    );
}


/* =====================================================
   ENTER KEY
===================================================== */

function setupInput() {

    if (!messageInput) {
        return;
    }

    messageInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


/* =====================================================
   SEND BUTTON
===================================================== */

function setupSendButton() {

    if (!sendButton) {

        console.warn(
            "Send button not found."
        );

        return;
    }

    sendButton.type =
        "button";

    sendButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            sendMessage();
        }
    );
}


/* =====================================================
   NEW CHAT
===================================================== */

function createNewChat() {

    currentChatId =
        createChatId();

    const chat = {

        id:
            currentChatId,

        title:
            "New Chat",

        messages:
            [],

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()
    };


    conversations.unshift(
        chat
    );


    saveConversations();

    renderConversation();

    renderHistory();


    if (messageInput) {

        messageInput.value =
            "";

        messageInput.focus();
    }
}


/* =====================================================
   NEW CHAT BUTTON
===================================================== */

function setupNewChatButton() {

    if (!newChatButton) {
        return;
    }

    newChatButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            createNewChat();
        }
    );
}


/* =====================================================
   HISTORY
===================================================== */

function renderHistory() {

    if (!historyContainer) {
        return;
    }

    historyContainer.innerHTML =
        "";


    conversations
        .slice()
        .sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
        )
        .forEach(chat => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "history-item";

            item.dataset.chatId =
                chat.id;


            const title =
                document.createElement(
                    "span"
                );

            title.textContent =
                chat.title ||
                "New Chat";


            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.type =
                "button";

            deleteButton.textContent =
                "🗑";


            deleteButton.onclick =
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    deleteChat(
                        chat.id
                    );
                };


            item.appendChild(
                title
            );

            item.appendChild(
                deleteButton
            );


            item.addEventListener(
                "click",
                () => {

                    loadChat(
                        chat.id
                    );
                }
            );


            historyContainer.appendChild(
                item
            );
        });
}


/* =====================================================
   LOAD CHAT
===================================================== */

function loadChat(chatId) {

    const exists =
        conversations.some(
            chat =>
                chat.id === chatId
        );

    if (!exists) {
        return;
    }

    currentChatId =
        chatId;

    localStorage.setItem(
        "viggoCurrentChatId",
        currentChatId
    );

    renderConversation();

    renderHistory();
}


/* =====================================================
   DELETE CHAT
===================================================== */

function deleteChat(chatId) {

    conversations =
        conversations.filter(
            chat =>
                chat.id !== chatId
        );


    if (
        currentChatId === chatId
    ) {

        if (
            conversations.length
        ) {

            currentChatId =
                conversations[0].id;

        } else {

            currentChatId =
                createChatId();

            conversations.push({

                id:
                    currentChatId,

                title:
                    "New Chat",

                messages:
                    [],

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()
            });
        }
    }


    saveConversations();

    renderConversation();

    renderHistory();
}


/* =====================================================
   FILE UPLOAD
===================================================== */

function setupFileInput() {

    if (!fileInput) {
        return;
    }

    fileInput.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }

            await sendUploadedFile(
                file
            );

            fileInput.value =
                "";
        }
    );
}


/* =====================================================
   SEND UPLOADED FILE
===================================================== */

async function sendUploadedFile(file) {

    if (isSending) {
        return;
    }


    isSending =
        true;


    const chat =
        getCurrentChat();


    let dataURL =
        null;


    try {

        dataURL =
            await readFileAsDataURL(
                file
            );


        const userText =
            `Uploaded file: ${file.name}`;


        chat.messages.push({

            role:
                "user",

            text:
                userText,

            media: {

                name:
                    file.name,

                type:
                    file.type,

                size:
                    file.size,

                data:
                    dataURL
            },

            timestamp:
                Date.now()
        });


        addMessageToUI(
            "user",
            userText,
            {
                media: {

                    name:
                        file.name,

                    type:
                        file.type,

                    data:
                        dataURL
                }
            }
        );


        updateCurrentChat();


        const typing =
            showTyping();


        const history =
            chat.messages
                .slice(0, -1)
                .slice(-30)
                .map(msg => ({

                    role:
                        msg.role === "assistant"
                            ? "assistant"
                            : "user",

                    text:
                        String(
                            msg.text || ""
                        )
                }));


        const response =
            await fetch(
                API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message:
                                `Please analyze this uploaded file: ${file.name}`,

                            language:
                                selectedLanguage,

                            history,

                            file: {

                                name:
                                    file.name,

                                type:
                                    file.type,

                                size:
                                    file.size,

                                data:
                                    dataURL
                            }
                        })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result?.error ||
                `Server error: ${response.status}`
            );
        }


        if (
            !result.success ||
            !result.reply
        ) {

            throw new Error(
                result?.error ||
                "No reply received."
            );
        }


        if (typing) {
            typing.remove();
        }


        chat.messages.push({

            role:
                "assistant",

            text:
                result.reply,

            timestamp:
                Date.now()
        });


        addMessageToUI(
            "assistant",
            result.reply
        );


        updateCurrentChat();


    } catch (error) {

        console.error(
            "File upload error:",
            error
        );


        addMessageToUI(
            "assistant",
            getFriendlyError(
                error
            )
        );

    } finally {

        isSending =
            false;
    }
}


/* =====================================================
   READ FILE
===================================================== */

function readFileAsDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );
                };

            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Unable to read file."
                        )
                    );
                };

            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =====================================================
   INIT
===================================================== */

function initializeViggo() {

    console.log(
        "================================="
    );

    console.log(
        "VIGGO AI SCRIPT LOADED"
    );

    console.log(
        "API:",
        API_URL
    );

    console.log(
        "LANGUAGE:",
        selectedLanguage,
        getLanguageName(
            selectedLanguage
        )
    );

    console.log(
        "SPEAKER:",
        speakerEnabled
    );

    console.log(
        "================================="
    );


    getCurrentChat();

    renderConversation();

    renderHistory();

    setupSendButton();

    setupInput();

    setupNewChatButton();

    setupLanguageButton();

    setupVoiceButton();

    setupFileInput();


    if (
        messageInput
    ) {

        messageInput.focus();
    }
}


/* =====================================================
   START
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeViggo
    );

} else {

    initializeViggo();
}
