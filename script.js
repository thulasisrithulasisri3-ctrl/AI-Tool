"use strict";

/* =====================================================
   VIGGO AI - FULL SCRIPT
   LANGUAGE + VOICE + FILE + CHAT HISTORY
   CURRENT DATE/TIME SERVER SUPPORT
===================================================== */

/* =====================================================
   API
===================================================== */

const API_URL =
    "https://ai-tool-2-zpul.onrender.com/chat";


/* =====================================================
   ELEMENTS
===================================================== */

const sidebar =
    document.getElementById("sidebar");

const openSidebar =
    document.getElementById("openSidebar");

const closeSidebar =
    document.getElementById("closeSidebar");

const newChat =
    document.getElementById("newChat");

const searchChat =
    document.getElementById("searchChat");

const chatHistory =
    document.getElementById("chatHistory");

const conversation =
    document.getElementById("conversation");

const message =
    document.getElementById("message");

const send =
    document.getElementById("send");

const mic =
    document.getElementById("mic");

const plusBtn =
    document.getElementById("plusBtn");

const plusMenu =
    document.getElementById("plusMenu");

const shareBtn =
    document.getElementById("shareBtn");

const moreBtn =
    document.getElementById("moreBtn");

const moreMenu =
    document.getElementById("moreMenu");

const voiceMenuBtn =
    document.getElementById("voiceMenuBtn");

const languageBtn =
    document.getElementById("languageBtn");

const clearChatBtn =
    document.getElementById("clearChatBtn");

const savedChatsBtn =
    document.getElementById("savedChatsBtn");

const selectChatsBtn =
    document.getElementById("selectChatsBtn");

const deleteSelectedBtn =
    document.getElementById("deleteSelectedBtn");

const plusVoiceBtn =
    document.getElementById("plusVoiceBtn");


/* =====================================================
   VIEWPORT
===================================================== */

function fixViewportHeight() {

    const root =
        document.documentElement;

    const height =
        window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;

    root.style.setProperty(
        "--app-height",
        `${height}px`
    );
}

fixViewportHeight();

window.addEventListener(
    "resize",
    fixViewportHeight,
    { passive: true }
);

window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            fixViewportHeight,
            100
        );
    },
    { passive: true }
);

if (window.visualViewport) {

    window.visualViewport.addEventListener(
        "resize",
        fixViewportHeight,
        { passive: true }
    );
}


/* =====================================================
   FILE INPUTS
===================================================== */

const photoInput =
    document.createElement("input");

photoInput.type =
    "file";

photoInput.accept =
    "image/*";

photoInput.style.display =
    "none";

document.body.appendChild(
    photoInput
);


const videoInput =
    document.createElement("input");

videoInput.type =
    "file";

videoInput.accept =
    "video/*";

videoInput.style.display =
    "none";

document.body.appendChild(
    videoInput
);


const fileInput =
    document.createElement("input");

fileInput.type =
    "file";

fileInput.accept =
    "*/*";

fileInput.style.display =
    "none";

document.body.appendChild(
    fileInput
);


/* =====================================================
   CHAT STORAGE
===================================================== */

let chats = [];

try {

    chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );

    if (!Array.isArray(chats)) {
        chats = [];
    }

} catch (error) {

    console.error(
        "Chat storage error:",
        error
    );

    chats = [];
}


let currentChatId =
    localStorage.getItem(
        "viggoCurrentChatId"
    );


let selectingChats = false;


let pinnedChats = [];

try {

    pinnedChats =
        JSON.parse(
            localStorage.getItem(
                "viggoPinnedChats"
            ) || "[]"
        );

    if (!Array.isArray(pinnedChats)) {
        pinnedChats = [];
    }

} catch {

    pinnedChats = [];
}


/* =====================================================
   SPEAKER
===================================================== */

let speakerEnabled = true;


/* =====================================================
   SAVE CHATS
===================================================== */

function saveChats() {

    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );

    if (currentChatId) {

        localStorage.setItem(
            "viggoCurrentChatId",
            String(currentChatId)
        );

    } else {

        localStorage.removeItem(
            "viggoCurrentChatId"
        );
    }

    localStorage.setItem(
        "viggoPinnedChats",
        JSON.stringify(
            pinnedChats
        )
    );
}


/* =====================================================
   CREATE CHAT
===================================================== */

function createChat() {

    const id =
        Date.now().toString();

    const chat = {

        id: id,

        title: "New Chat",

        messages: [],

        createdAt: Date.now(),

        selected: false
    };

    chats.unshift(
        chat
    );

    currentChatId =
        id;

    saveChats();

    renderHistory();

    renderConversation();

    message?.focus();
}


/* =====================================================
   GET CURRENT CHAT
===================================================== */

function getCurrentChat() {

    return chats.find(
        chat =>
            String(chat.id) ===
            String(currentChatId)
    );
}


/* =====================================================
   ENSURE CHAT
===================================================== */

function ensureChat() {

    if (
        !currentChatId ||
        !getCurrentChat()
    ) {

        createChat();
    }
}


/* =====================================================
   DELETE CHAT
===================================================== */

function deleteChat(
    chatId
) {

    const id =
        String(chatId);

    chats =
        chats.filter(
            chat =>
                String(chat.id) !== id
        );

    pinnedChats =
        pinnedChats.filter(
            pinnedId =>
                String(pinnedId) !== id
        );

    if (
        String(currentChatId) === id
    ) {

        currentChatId =
            chats.length
                ? chats[0].id
                : null;
    }

    saveChats();

    renderHistory();

    renderConversation();
}


/* =====================================================
   PIN CHAT
===================================================== */

function togglePinChat(
    chatId
) {

    const id =
        String(chatId);

    const index =
        pinnedChats.indexOf(
            id
        );

    if (index === -1) {

        pinnedChats.unshift(
            id
        );

    } else {

        pinnedChats.splice(
            index,
            1
        );
    }

    saveChats();

    renderHistory(
        searchChat?.value || ""
    );
}


/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory(
    filter = ""
) {

    if (!chatHistory) {
        return;
    }

    chatHistory.innerHTML =
        "";

    const search =
        String(filter)
            .toLowerCase()
            .trim();

    const filtered =
        chats.filter(
            chat =>
                String(
                    chat.title ||
                    "New Chat"
                )
                    .toLowerCase()
                    .includes(
                        search
                    )
        );

    filtered.sort(
        (a, b) => {

            const aPinned =
                pinnedChats.includes(
                    String(a.id)
                );

            const bPinned =
                pinnedChats.includes(
                    String(b.id)
                );

            if (
                aPinned &&
                !bPinned
            ) {
                return -1;
            }

            if (
                !aPinned &&
                bPinned
            ) {
                return 1;
            }

            return (
                Number(
                    b.createdAt || 0
                ) -
                Number(
                    a.createdAt || 0
                )
            );
        }
    );

    filtered.forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "history-item";

            if (
                String(chat.id) ===
                String(currentChatId)
            ) {

                item.classList.add(
                    "active"
                );
            }

            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "history-chat-title";

            title.textContent =
                chat.title ||
                "New Chat";


            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "history-actions";


            if (selectingChats) {

                const check =
                    document.createElement(
                        "button"
                    );

                check.type =
                    "button";

                check.className =
                    "history-action-btn";

                check.textContent =
                    chat.selected
                        ? "☑"
                        : "☐";

                check.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        chat.selected =
                            !chat.selected;

                        saveChats();

                        renderHistory(
                            searchChat?.value || ""
                        );
                    }
                );

                actions.appendChild(
                    check
                );
            }


            const pinBtn =
                document.createElement(
                    "button"
                );

            pinBtn.type =
                "button";

            pinBtn.className =
                "history-action-btn";

            const isPinned =
                pinnedChats.includes(
                    String(chat.id)
                );

            pinBtn.textContent =
                isPinned
                    ? "📍"
                    : "📌";

            pinBtn.title =
                isPinned
                    ? "Unpin"
                    : "Pin";

            pinBtn.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    togglePinChat(
                        chat.id
                    );
                }
            );

            actions.appendChild(
                pinBtn
            );


            const deleteBtn =
                document.createElement(
                    "button"
                );

            deleteBtn.type =
                "button";

            deleteBtn.className =
                "history-action-btn";

            deleteBtn.textContent =
                "🗑️";

            deleteBtn.title =
                "Delete";

            deleteBtn.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteChat(
                        chat.id
                    );
                }
            );

            actions.appendChild(
                deleteBtn
            );


            item.appendChild(
                title
            );

            item.appendChild(
                actions
            );


            item.addEventListener(
                "click",
                () => {

                    if (
                        selectingChats
                    ) {

                        chat.selected =
                            !chat.selected;

                        saveChats();

                        renderHistory(
                            searchChat?.value || ""
                        );

                        return;
                    }

                    currentChatId =
                        chat.id;

                    saveChats();

                    renderConversation();

                    if (
                        window.innerWidth <=
                        768
                    ) {

                        sidebar?.classList.remove(
                            "open"
                        );
                    }
                }
            );

            chatHistory.appendChild(
                item
            );
        }
    );
}


/* =====================================================
   SPEECH VOICE
===================================================== */

function getSelectedSpeechVoice() {

    const selectedVoice =
        localStorage.getItem(
            "viggoVoice"
        ) || "female";

    const voices =
        window.speechSynthesis
            ? window.speechSynthesis.getVoices()
            : [];

    if (!voices.length) {
        return null;
    }

    let matchingVoice =
        null;

    if (
        selectedVoice ===
        "female"
    ) {

        matchingVoice =
            voices.find(
                voice => {

                    const name =
                        voice.name.toLowerCase();

                    return (
                        name.includes("female") ||
                        name.includes("woman") ||
                        name.includes("zira") ||
                        name.includes("samantha") ||
                        name.includes("susan") ||
                        name.includes("hazel")
                    );
                }
            );
    }

    if (
        selectedVoice ===
        "male"
    ) {

        matchingVoice =
            voices.find(
                voice => {

                    const name =
                        voice.name.toLowerCase();

                    return (
                        name.includes("male") ||
                        name.includes("man") ||
                        name.includes("david") ||
                        name.includes("mark") ||
                        name.includes("daniel")
                    );
                }
            );
    }

    const language =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";

    return (
        matchingVoice ||
        voices.find(
            voice =>
                voice.lang ===
                language
        ) ||
        voices.find(
            voice =>
                voice.lang &&
                voice.lang.startsWith(
                    language.split("-")[0]
                )
        ) ||
        voices[0]
    );
}


/* =====================================================
   SPEAK
===================================================== */

function speakText(
    text,
    button
) {

    if (!speakerEnabled) {
        return;
    }

    if (
        !window.speechSynthesis ||
        !window.SpeechSynthesisUtterance
    ) {

        alert(
            "Speaker is not supported in this browser."
        );

        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            text
        );

    const language =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";

    speech.lang =
        language;

    speech.rate =
        1;

    speech.pitch =
        1;

    speech.volume =
        1;

    const voice =
        getSelectedSpeechVoice();

    if (voice) {
        speech.voice =
            voice;
    }

    if (button) {
        button.textContent =
            "🔊 Speaking...";
    }

    speech.onstart =
        () => {

            if (button) {
                button.textContent =
                    "🔊 Stop";
            }
        };

    speech.onend =
        () => {

            if (button) {
                button.textContent =
                    "🔊 Speaker";
            }
        };

    speech.onerror =
        error => {

            console.error(
                "Speech error:",
                error
            );

            if (button) {
                button.textContent =
                    "🔊 Speaker";
            }
        };

    window.speechSynthesis.speak(
        speech
    );
}


if (
    window.speechSynthesis
) {

    window.speechSynthesis.onvoiceschanged =
        () => {

            window.speechSynthesis.getVoices();
        };
}


/* =====================================================
   STOP SPEAKER
===================================================== */

function stopSpeaker(
    button
) {

    window.speechSynthesis?.cancel();

    if (button) {

        button.textContent =
            "🔇 Speaker OFF";

        setTimeout(
            () => {

                button.textContent =
                    "🔊 Speaker";

            },
            800
        );
    }
}


/* =====================================================
   ADD MESSAGE UI
===================================================== */

function addMessageToUI(
    role,
    text,
    media = null
) {

    if (!conversation) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message " +
        (
            role === "user"
                ? "user"
                : "ai"
        );


    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    if (text) {

        bubble.textContent =
            text;
    }


    /* IMAGE */

    if (
        media?.type?.startsWith(
            "image/"
        ) &&
        media.data
    ) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            media.data;

        image.alt =
            media.name ||
            "Uploaded image";

        image.style.maxWidth =
            "100%";

        image.style.maxHeight =
            "320px";

        image.style.display =
            "block";

        image.style.borderRadius =
            "12px";

        image.style.marginBottom =
            text
                ? "10px"
                : "0";

        bubble.appendChild(
            image
        );
    }


    /* VIDEO */

    if (
        media?.type?.startsWith(
            "video/"
        ) &&
        media.data
    ) {

        const video =
            document.createElement(
                "video"
            );

        video.src =
            media.data;

        video.controls =
            true;

        video.playsInline =
            true;

        video.preload =
            "metadata";

        video.style.maxWidth =
            "100%";

        video.style.width =
            "100%";

        video.style.maxHeight =
            "320px";

        video.style.display =
            "block";

        video.style.borderRadius =
            "12px";

        bubble.appendChild(
            video
        );
    }


    content.appendChild(
        bubble
    );


    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "message-actions";


    /* SAVE */

    const saveBtn =
        document.createElement(
            "button"
        );

    saveBtn.type =
        "button";

    saveBtn.textContent =
        "💾 Save";

    saveBtn.addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "viggoSavedMessage",
                text || ""
            );

            alert(
                "Message saved."
            );
        }
    );


    /* COPY */

    const copyBtn =
        document.createElement(
            "button"
        );

    copyBtn.type =
        "button";

    copyBtn.textContent =
        "📋 Copy";

    copyBtn.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    text || ""
                );

            } catch {

                const temp =
                    document.createElement(
                        "textarea"
                    );

                temp.value =
                    text || "";

                document.body.appendChild(
                    temp
                );

                temp.select();

                document.execCommand(
                    "copy"
                );

                temp.remove();
            }

            copyBtn.textContent =
                "✓ Copied";

            setTimeout(
                () => {

                    copyBtn.textContent =
                        "📋 Copy";

                },
                1200
            );
        }
    );


    /* LIKE */

    const likeBtn =
        document.createElement(
            "button"
        );

    likeBtn.type =
        "button";

    likeBtn.textContent =
        "👍 Like";

    likeBtn.addEventListener(
        "click",
        () => {

            likeBtn.textContent =
                likeBtn.textContent ===
                "👍 Like"
                    ? "👍 Liked"
                    : "👍 Like";
        }
    );


    /* SPEAKER */

    const speakerBtn =
        document.createElement(
            "button"
        );

    speakerBtn.type =
        "button";

    speakerBtn.textContent =
        "🔊 Speaker";

    speakerBtn.addEventListener(
        "click",
        () => {

            if (
                window.speechSynthesis?.speaking
            ) {

                stopSpeaker(
                    speakerBtn
                );

            } else {

                speakText(
                    text || "",
                    speakerBtn
                );
            }
        }
    );


    actions.appendChild(
        saveBtn
    );

    actions.appendChild(
        copyBtn
    );

    actions.appendChild(
        likeBtn
    );

    actions.appendChild(
        speakerBtn
    );

    content.appendChild(
        actions
    );

    wrapper.appendChild(
        content
    );

    conversation.appendChild(
        wrapper
    );


    requestAnimationFrame(
        () => {

            conversation.scrollTop =
                conversation.scrollHeight;
        }
    );
}


/* =====================================================
   RENDER CONVERSATION
===================================================== */

function renderConversation() {

    if (!conversation) {
        return;
    }

    conversation.innerHTML =
        "";

    const chat =
        getCurrentChat();

    if (!chat) {
        return;
    }

    chat.messages.forEach(
        msg => {

            addMessageToUI(
                msg.role,
                msg.text,
                msg.media || null
            );
        }
    );

    requestAnimationFrame(
        () => {

            conversation.scrollTop =
                conversation.scrollHeight;
        }
    );
}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(
    role,
    text,
    media = null
) {

    ensureChat();

    const chat =
        getCurrentChat();

    if (!chat) {
        return;
    }

    const msg = {

        role: role,

        text: text || "",

        time: Date.now()
    };

    if (media) {

        msg.media = {

            name:
                media.name || "",

            type:
                media.type || "",

            data:
                media.data || ""
        };
    }

    chat.messages.push(
        msg
    );


    if (
        role === "user" &&
        chat.title === "New Chat"
    ) {

        const titleText =
            text ||
            media?.name ||
            "Uploaded file";

        chat.title =
            titleText.substring(
                0,
                30
            );
    }

    saveChats();

    addMessageToUI(
        role,
        text,
        media
    );

    renderHistory();
}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

    if (!message) {
        return;
    }

    const text =
        message.value.trim();

    if (!text) {
        return;
    }

    ensureChat();

    addMessage(
        "user",
        text
    );

    message.value =
        "";

    if (send) {
        send.disabled =
            true;
    }


    const typing =
        document.createElement(
            "div"
        );

    typing.className =
        "message ai typing-message";

    typing.innerHTML =
        `
        <div class="message-content">
            <div class="message-bubble">
                Thinking...
            </div>
        </div>
        `;

    conversation?.appendChild(
        typing
    );


    requestAnimationFrame(
        () => {

            if (conversation) {

                conversation.scrollTop =
                    conversation.scrollHeight;
            }
        }
    );


    try {

        const selectedLanguage =
            localStorage.getItem(
                "viggoLanguage"
            ) || "en-IN";


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
                                text,

                            language:
                                selectedLanguage
                        })
                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            console.error(
                "Server response:",
                data
            );

            throw new Error(
                data.error ||
                "Server error: " +
                response.status
            );
        }


        typing.remove();


        const reply =
            data.reply ||
            data.response ||
            data.text ||
            data.message ||
            "Sorry, I couldn't get a response.";


        addMessage(
            "assistant",
            String(reply)
        );


    } catch (error) {

        console.error(
            "Viggo AI Error:",
            error
        );

        typing.remove();

        addMessage(
            "assistant",
            "Sorry friend, I couldn't connect to Viggo AI right now."
        );

    } finally {

        if (send) {

            send.disabled =
                false;
        }

        message.focus();
    }
}


/* =====================================================
   FILE READER
===================================================== */

function readFileAsDataURL(
    file
) {

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
   UPLOAD FILE
===================================================== */

async function sendUploadedFile(
    file,
    type
) {

    if (!file) {
        return;
    }

    ensureChat();

    const mediaData =
        await readFileAsDataURL(
            file
        );


    const label =
        type === "photo"
            ? "📷 Photo"
            : type === "video"
                ? "🎥 Video"
                : "📎 File";


    addMessage(
        "user",
        `${label}: ${file.name}`,
        {

            name:
                file.name,

            type:
                file.type,

            data:
                mediaData
        }
    );


    const typing =
        document.createElement(
            "div"
        );

    typing.className =
        "message ai typing-message";

    typing.innerHTML =
        `
        <div class="message-content">
            <div class="message-bubble">
                Analyzing your upload...
            </div>
        </div>
        `;

    conversation?.appendChild(
        typing
    );


    try {

        const language =
            localStorage.getItem(
                "viggoLanguage"
            ) || "en-IN";


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
                                type === "photo"
                                    ? "Please analyze the uploaded photo."
                                    : type === "video"
                                        ? "Please analyze the uploaded video."
                                        : "Please analyze the uploaded file.",

                            language:

                                language,

                            file: {

                                name:
                                    file.name,

                                type:
                                    file.type,

                                size:
                                    file.size,

                                data:
                                    mediaData
                            }
                        })
                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Server error"
            );
        }


        typing.remove();


        const reply =
            data.reply ||
            data.response ||
            data.text ||
            data.message ||
            "The file was uploaded successfully.";


        addMessage(
            "assistant",
            String(reply)
        );


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        typing.remove();

        addMessage(
            "assistant",
            "The upload was successful, but I couldn't get an AI response."
        );
    }
}


/* =====================================================
   SIDEBAR
===================================================== */

openSidebar?.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        sidebar?.classList.add(
            "open"
        );
    }
);


closeSidebar?.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        sidebar?.classList.remove(
            "open"
        );
    }
);


/* =====================================================
   NEW CHAT
===================================================== */

newChat?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        createChat();
    }
);


/* =====================================================
   SEND
===================================================== */

send?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        sendMessage();
    }
);


/* =====================================================
   ENTER
===================================================== */

message?.addEventListener(
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


/* =====================================================
   SEARCH
===================================================== */

searchChat?.addEventListener(
    "input",
    () => {

        renderHistory(
            searchChat.value
        );
    }
);


/* =====================================================
   PLUS
===================================================== */

plusBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        event.stopPropagation();

        const open =
            plusMenu?.classList.contains(
                "show"
            );

        plusMenu?.classList.toggle(
            "show",
            !open
        );

        plusMenu?.classList.toggle(
            "open",
            !open
        );
    }
);


/* =====================================================
   MORE
===================================================== */

moreBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        event.stopPropagation();

        const open =
            moreMenu?.classList.contains(
                "show"
            );

        moreMenu?.classList.toggle(
            "show",
            !open
        );

        moreMenu?.classList.toggle(
            "open",
            !open
        );
    }
);


/* =====================================================
   DOCUMENT CLICK
===================================================== */

document.addEventListener(
    "click",
    event => {

        if (
            plusMenu &&
            plusBtn &&
            !plusMenu.contains(
                event.target
            ) &&
            !plusBtn.contains(
                event.target
            )
        ) {

            plusMenu.classList.remove(
                "show"
            );

            plusMenu.classList.remove(
                "open"
            );
        }


        if (
            moreMenu &&
            moreBtn &&
            !moreMenu.contains(
                event.target
            ) &&
            !moreBtn.contains(
                event.target
            )
        ) {

            moreMenu.classList.remove(
                "show"
            );

            moreMenu.classList.remove(
                "open"
            );
        }
    }
);


/* =====================================================
   PHOTO
===================================================== */

photoInput.addEventListener(
    "change",
    async () => {

        const file =
            photoInput.files[0];

        if (!file) {
            return;
        }

        try {

            await sendUploadedFile(
                file,
                "photo"
            );

        } finally {

            photoInput.value =
                "";
        }
    }
);


/* =====================================================
   VIDEO
===================================================== */

videoInput.addEventListener(
    "change",
    async () => {

        const file =
            videoInput.files[0];

        if (!file) {
            return;
        }

        try {

            await sendUploadedFile(
                file,
                "video"
            );

        } finally {

            videoInput.value =
                "";
        }
    }
);


/* =====================================================
   FILE
===================================================== */

fileInput.addEventListener(
    "change",
    async () => {

        const file =
            fileInput.files[0];

        if (!file) {
            return;
        }

        try {

            await sendUploadedFile(
                file,
                "file"
            );

        } finally {

            fileInput.value =
                "";
        }
    }
);


/* =====================================================
   PLUS ACTIONS
===================================================== */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-action]"
            );

        if (!target) {
            return;
        }

        const action =
            target.dataset.action;


        if (
            action === "photo"
        ) {

            photoInput.click();
        }


        if (
            action === "video"
        ) {

            videoInput.click();
        }


        if (
            action === "file"
        ) {

            fileInput.click();
        }


        if (
            action === "voice"
        ) {

            openVoiceSelectionMenu(
                target
            );
        }


        if (
            action === "new-chat"
        ) {

            createChat();
        }


        plusMenu?.classList.remove(
            "show"
        );

        plusMenu?.classList.remove(
            "open"
        );
    }
);


/* =====================================================
   MICROPHONE
===================================================== */

let recognition =
    null;


function startVoiceRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported in this browser."
        );

        return;
    }


    if (recognition) {

        try {
            recognition.stop();
        } catch {}
    }


    recognition =
        new SpeechRecognition();


    recognition.lang =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    recognition.interimResults =
        false;

    recognition.continuous =
        false;


    recognition.onstart =
        () => {

            mic?.classList.add(
                "active"
            );
        };


    recognition.onresult =
        event => {

            const result =
                event.results[0][0]
                    .transcript;

            if (message) {

                message.value =
                    result;

                message.focus();
            }
        };


    recognition.onerror =
        error => {

            console.error(
                "Voice recognition:",
                error
            );
        };


    recognition.onend =
        () => {

            mic?.classList.remove(
                "active"
            );
        };


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Recognition start:",
            error
        );
    }
}


/* =====================================================
   MIC BUTTON ONLY
===================================================== */

mic?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        startVoiceRecognition();
    }
);


/* =====================================================
   VOICE MENU
===================================================== */

function openVoiceSelectionMenu(
    anchorElement
) {

    document.getElementById(
        "viggoVoiceMenu"
    )?.remove();


    const menu =
        document.createElement(
            "div"
        );

    menu.id =
        "viggoVoiceMenu";


    menu.style.position =
        "fixed";

    menu.style.zIndex =
        "10000";

    menu.style.background =
        "#111";

    menu.style.border =
        "1px solid #333";

    menu.style.borderRadius =
        "12px";

    menu.style.padding =
        "8px";

    menu.style.minWidth =
        "190px";


    const title =
        document.createElement(
            "div"
        );

    title.textContent =
        "🎙️ Select Voice";

    title.style.color =
        "#fff";

    title.style.fontWeight =
        "600";

    title.style.padding =
        "8px";

    menu.appendChild(
        title
    );


    const voices = [

        {
            id: "female",
            name: "👩 Female Voice"
        },

        {
            id: "male",
            name: "👨 Male Voice"
        }

    ];


    const currentVoice =
        localStorage.getItem(
            "viggoVoice"
        ) || "female";


    voices.forEach(
        voice => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                voice.name;

            button.style.display =
                "block";

            button.style.width =
                "100%";

            button.style.padding =
                "10px";

            button.style.margin =
                "2px 0";

            button.style.border =
                "none";

            button.style.borderRadius =
                "8px";

            button.style.background =
                voice.id === currentVoice
                    ? "#2563eb"
                    : "transparent";

            button.style.color =
                "#fff";

            button.style.textAlign =
                "left";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    localStorage.setItem(
                        "viggoVoice",
                        voice.id
                    );

                    menu.remove();
                }
            );


            menu.appendChild(
                button
            );
        }
    );


    document.body.appendChild(
        menu
    );


    const rect =
        anchorElement.getBoundingClientRect();


    menu.style.left =
        `${Math.min(
            rect.left,
            window.innerWidth - 210
        )}px`;


    menu.style.top =
        `${Math.min(
            rect.bottom + 8,
            window.innerHeight - 150
        )}px`;
}


/* =====================================================
   VOICE BUTTONS
===================================================== */

voiceMenuBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        event.stopPropagation();

        openVoiceSelectionMenu(
            voiceMenuBtn
        );

        moreMenu?.classList.remove(
            "show"
        );
    }
);


plusVoiceBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        event.stopPropagation();

        openVoiceSelectionMenu(
            plusVoiceBtn
        );

        plusMenu?.classList.remove(
            "show"
        );
    }
);


/* =====================================================
   LANGUAGE LIST
===================================================== */

const languages = [

    {
        code: "en-IN",
        name: "🇬🇧 English"
    },

    {
        code: "ta-IN",
        name: "🇮🇳 தமிழ்"
    },

    {
        code: "hi-IN",
        name: "🇮🇳 हिन्दी"
    },

    {
        code: "te-IN",
        name: "🇮🇳 తెలుగు"
    },

    {
        code: "kn-IN",
        name: "🇮🇳 ಕನ್ನಡ"
    },

    {
        code: "ml-IN",
        name: "🇮🇳 മലയാളം"
    },

    {
        code: "bn-IN",
        name: "🇮🇳 বাংলা"
    },

    {
        code: "mr-IN",
        name: "🇮🇳 मराठी"
    },

    {
        code: "gu-IN",
        name: "🇮🇳 ગુજરાતી"
    },

    {
        code: "pa-IN",
        name: "🇮🇳 ਪੰਜਾਬੀ"
    },

    {
        code: "ur-IN",
        name: "🇮🇳 اردو"
    },

    {
        code: "or-IN",
        name: "🇮🇳 ଓଡ଼ିଆ"
    },

    {
        code: "as-IN",
        name: "🇮🇳 অসমীয়া"
    },

    {
        code: "fr-FR",
        name: "🇫🇷 Français"
    },

    {
        code: "de-DE",
        name: "🇩🇪 Deutsch"
    },

    {
        code: "es-ES",
        name: "🇪🇸 Español"
    },

    {
        code: "it-IT",
        name: "🇮🇹 Italiano"
    },

    {
        code: "pt-BR",
        name: "🇧🇷 Português"
    },

    {
        code: "ru-RU",
        name: "🇷🇺 Русский"
    },

    {
        code: "ja-JP",
        name: "🇯🇵 日本語"
    },

    {
        code: "ko-KR",
        name: "🇰🇷 한국어"
    },

    {
        code: "zh-CN",
        name: "🇨🇳 中文"
    },

    {
        code: "ar-SA",
        name: "🇸🇦 العربية"
    },

    {
        code: "tr-TR",
        name: "🇹🇷 Türkçe"
    },

    {
        code: "nl-NL",
        name: "🇳🇱 Nederlands"
    },

    {
        code: "pl-PL",
        name: "🇵🇱 Polski"
    },

    {
        code: "sv-SE",
        name: "🇸🇪 Svenska"
    },

    {
        code: "da-DK",
        name: "🇩🇰 Dansk"
    },

    {
        code: "fi-FI",
        name: "🇫🇮 Suomi"
    },

    {
        code: "no-NO",
        name: "🇳🇴 Norsk"
    },

    {
        code: "el-GR",
        name: "🇬🇷 Ελληνικά"
    },

    {
        code: "he-IL",
        name: "🇮🇱 עברית"
    },

    {
        code: "th-TH",
        name: "🇹🇭 ไทย"
    },

    {
        code: "vi-VN",
        name: "🇻🇳 Tiếng Việt"
    },

    {
        code: "id-ID",
        name: "🇮🇩 Bahasa Indonesia"
    },

    {
        code: "ms-MY",
        name: "🇲🇾 Bahasa Melayu"
    }
];


/* =====================================================
   LANGUAGE MENU
===================================================== */

function openLanguageSelectionMenu(
    anchorElement
) {

    document.getElementById(
        "viggoLanguageMenu"
    )?.remove();


    const menu =
        document.createElement(
            "div"
        );

    menu.id =
        "viggoLanguageMenu";


    menu.style.position =
        "fixed";

    menu.style.zIndex =
        "10000";

    menu.style.background =
        "#111";

    menu.style.border =
        "1px solid #333";

    menu.style.borderRadius =
        "12px";

    menu.style.padding =
        "8px";

    menu.style.minWidth =
        "190px";

    menu.style.maxHeight =
        "300px";

    menu.style.overflowY =
        "auto";

    menu.style.overflowX =
        "hidden";


    const title =
        document.createElement(
            "div"
        );

    title.textContent =
        "🌐 Select Language";

    title.style.color =
        "#fff";

    title.style.fontWeight =
        "600";

    title.style.padding =
        "8px";

    title.style.position =
        "sticky";

    title.style.top =
        "0";

    title.style.background =
        "#111";

    menu.appendChild(
        title
    );


    const current =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    languages.forEach(
        language => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                language.name;

            button.style.display =
                "block";

            button.style.width =
                "100%";

            button.style.padding =
                "10px";

            button.style.margin =
                "2px 0";

            button.style.border =
                "none";

            button.style.borderRadius =
                "8px";

            button.style.background =
                language.code === current
                    ? "#2563eb"
                    : "transparent";

            button.style.color =
                "#fff";

            button.style.textAlign =
                "left";

            button.style.cursor =
                "pointer";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    localStorage.setItem(
                        "viggoLanguage",
                        language.code
                    );


                    menu.remove();


                    console.log(
                        "Language:",
                        language.code
                    );
                }
            );


            menu.appendChild(
                button
            );
        }
    );


    document.body.appendChild(
        menu
    );


    const rect =
        anchorElement.getBoundingClientRect();


    let left =
        rect.left;

    let top =
        rect.bottom + 8;


    if (
        left + 210 >
        window.innerWidth
    ) {

        left =
            window.innerWidth - 210;
    }


    if (
        top + 310 >
        window.innerHeight
    ) {

        top =
            rect.top - 310;
    }


    left =
        Math.max(
            5,
            left
        );

    top =
        Math.max(
            5,
            top
        );


    menu.style.left =
        `${left}px`;

    menu.style.top =
        `${top}px`;
}


/* =====================================================
   LANGUAGE BUTTON
===================================================== */

languageBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        event.stopPropagation();

        openLanguageSelectionMenu(
            languageBtn
        );
    }
);


/* =====================================================
   CLEAR CHAT
===================================================== */

clearChatBtn?.addEventListener(
    "click",
    () => {

        const chat =
            getCurrentChat();

        if (!chat) {
            return;
        }

        chat.messages =
            [];

        chat.title =
            "New Chat";

        saveChats();

        renderHistory();

        renderConversation();

        moreMenu?.classList.remove(
            "show"
        );
    }
);


/* =====================================================
   SAVED MESSAGE
===================================================== */

savedChatsBtn?.addEventListener(
    "click",
    () => {

        const saved =
            localStorage.getItem(
                "viggoSavedMessage"
            );

        alert(
            saved
                ? "Saved message:\n\n" + saved
                : "No saved messages."
        );
    }
);


/* =====================================================
   SELECT CHATS
===================================================== */

selectChatsBtn?.addEventListener(
    "click",
    () => {

        selectingChats =
            !selectingChats;

        renderHistory();

        moreMenu?.classList.remove(
            "show"
        );
    }
);


/* =====================================================
   DELETE SELECTED
===================================================== */

deleteSelectedBtn?.addEventListener(
    "click",
    () => {

        const selected =
            chats.filter(
                chat =>
                    chat.selected
            );


        if (!selected.length) {

            alert(
                "No chats selected."
            );

            return;
        }


        const ids =
            selected.map(
                chat =>
                    String(chat.id)
            );


        chats =
            chats.filter(
                chat =>
                    !ids.includes(
                        String(chat.id)
                    )
            );


        pinnedChats =
            pinnedChats.filter(
                id =>
                    !ids.includes(
                        String(id)
                    )
            );


        if (
            currentChatId &&
            ids.includes(
                String(currentChatId)
            )
        ) {

            currentChatId =
                chats[0]?.id ||
                null;
        }


        selectingChats =
            false;


        if (!chats.length) {

            saveChats();

            createChat();

            return;
        }


        saveChats();

        renderHistory();

        renderConversation();
    }
);


/* =====================================================
   SHARE
===================================================== */

shareBtn?.addEventListener(
    "click",
    async () => {

        const chat =
            getCurrentChat();

        if (
            !chat ||
            !chat.messages.length
        ) {

            alert(
                "There are no messages to share."
            );

            return;
        }


        const text =
            chat.messages
                .map(
                    msg =>
                        (
                            msg.role === "user"
                                ? "You: "
                                : "Viggo: "
                        ) +
                        msg.text
                )
                .join(
                    "\n\n"
                );


        try {

            if (
                navigator.share
            ) {

                await navigator.share({

                    title:
                        chat.title ||
                        "Viggo AI",

                    text:
                        text
                });

            } else {

                await navigator.clipboard.writeText(
                    text
                );

                alert(
                    "Chat copied. You can share it now."
                );
            }

        } catch (error) {

            console.error(
                "Share error:",
                error
            );
        }
    }
);


/* =====================================================
   INITIALIZE
===================================================== */

function initializeViggo() {

    fixViewportHeight();


    if (!chats.length) {

        createChat();

    } else {

        if (
            !currentChatId ||
            !getCurrentChat()
        ) {

            currentChatId =
                chats[0].id;

            saveChats();
        }


        renderHistory();

        renderConversation();
    }
}


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


/* =====================================================
   CONSOLE
===================================================== */

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
    "Language:",
    localStorage.getItem(
        "viggoLanguage"
    ) || "en-IN"
);

console.log(
    "Voice:",
    localStorage.getItem(
        "viggoVoice"
    ) || "female"
);

console.log(
    "Speech Synthesis:",
    "speechSynthesis" in window
);

console.log(
    "Speech Recognition:",
    (
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
    )
);

console.log(
    "================================="
);
