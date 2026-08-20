"use strict";

/* =========================================
   VIGGO CONFIG
========================================= */

const API_URL =
    "https://ai-tool-2-zpul.onrender.com";


/* =========================================
   STATE
========================================= */

let chats =
    JSON.parse(
        localStorage.getItem("viggoChats") || "[]"
    );

let currentChat = null;

let selectedLanguage =
    localStorage.getItem("viggoLanguage") || "en";

let selectedVoice =
    localStorage.getItem("viggoVoice") || "female";

let speakingButton = null;


/* =========================================
   ELEMENTS
========================================= */

const chatArea =
    document.getElementById("chatArea");

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const plusBtn =
    document.getElementById("plusBtn");

const plusMenu =
    document.getElementById("plusMenu");

const moreBtn =
    document.getElementById("moreBtn");

const moreMenu =
    document.getElementById("moreMenu");

const languageBtn =
    document.getElementById("languageBtn");

const languageMenu =
    document.getElementById("languageMenu");

const voiceBtn =
    document.getElementById("voiceBtn");

const voiceMenu =
    document.getElementById("voiceMenu");

const deleteBtn =
    document.getElementById("deleteBtn");

const deleteMenu =
    document.getElementById("deleteMenu");

const recentHistory =
    document.getElementById("recentHistory");

const recentCount =
    document.getElementById("recentCount");


/* =========================================
   SAVE
========================================= */

function saveChats() {

    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );

}


/* =========================================
   CLOSE MENUS
========================================= */

function closeMenus() {

    plusMenu.classList.remove("show");
    moreMenu.classList.remove("show");
    languageMenu.classList.remove("show");
    voiceMenu.classList.remove("show");
    deleteMenu.classList.remove("show");

}


/* =========================================
   NEW CHAT
========================================= */

function newChat() {

    currentChat = {

        id: Date.now().toString(),

        title: "New Chat",

        messages: []

    };

    chats.unshift(currentChat);

    saveChats();

    renderRecent();

    renderChat();

    messageInput.focus();

}


/* =========================================
   RECENT HISTORY
========================================= */

function renderRecent() {

    recentHistory.innerHTML = "";

    recentCount.textContent =
        chats.length;


    chats.forEach(chat => {

        const item =
            document.createElement("div");

        item.className =
            "recent-item";


        if (
            currentChat &&
            currentChat.id === chat.id
        ) {

            item.classList.add("active");

        }


        const title =
            document.createElement("div");

        title.className =
            "recent-title";

        title.textContent =
            chat.title || "New Chat";


        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "recent-delete";

        deleteButton.textContent =
            "×";

        deleteButton.title =
            "Delete chat";


        deleteButton.onclick =
            function(event) {

                event.stopPropagation();

                deleteSingleChat(
                    chat.id
                );

            };


        item.appendChild(title);

        item.appendChild(deleteButton);


        item.onclick =
            function() {

                currentChat =
                    chats.find(
                        c => c.id === chat.id
                    );

                renderRecent();

                renderChat();

            };


        recentHistory.appendChild(item);

    });

}


/* =========================================
   DELETE SINGLE
========================================= */

function deleteSingleChat(id) {

    const ok =
        confirm(
            "Delete this chat?"
        );

    if (!ok) return;


    chats =
        chats.filter(
            chat => chat.id !== id
        );


    saveChats();


    if (currentChat?.id === id) {

        currentChat =
            chats[0] || null;

    }


    renderRecent();

    renderChat();

}


/* =========================================
   RENDER CHAT
========================================= */

function renderChat() {

    chatArea.innerHTML = "";


    if (
        !currentChat ||
        currentChat.messages.length === 0
    ) {

        chatArea.innerHTML = `
            <div class="welcome">
                <div class="welcome-logo">V</div>
                <h1>Hello! I'm Viggo AI</h1>
                <p>Your friendly AI assistant</p>
            </div>
        `;

        return;

    }


    currentChat.messages.forEach(
        message => {

            addMessage(
                message.role,
                message.text
            );

        }
    );


    scrollChat();

}


/* =========================================
   ADD MESSAGE
========================================= */

function addMessage(
    role,
    text
) {

    const row =
        document.createElement("div");

    row.className =
        "message-row " +
        (
            role === "user"
                ? "user"
                : "ai"
        );


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message";


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        text;


    wrapper.appendChild(
        bubble
    );


    /* AI ACTION BUTTONS */

    if (role === "assistant") {

        const actions =
            createActions(text);

        wrapper.appendChild(
            actions
        );

    }


    row.appendChild(
        wrapper
    );

    chatArea.appendChild(
        row
    );

}


/* =========================================
   MESSAGE ACTIONS
========================================= */

function createActions(text) {

    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";


    /* SPEAKER */

    const speaker =
        document.createElement("button");

    speaker.className =
        "message-action";

    speaker.type =
        "button";

    speaker.textContent =
        "🔊";

    speaker.title =
        "Read aloud";


    speaker.onclick =
        function() {

            speakText(
                text,
                speaker
            );

        };


    /* COPY */

    const copy =
        document.createElement("button");

    copy.className =
        "message-action";

    copy.type =
        "button";

    copy.textContent =
        "📋";

    copy.title =
        "Copy";


    copy.onclick =
        function() {

            copyText(
                text,
                copy
            );

        };


    /* SHARE */

    const share =
        document.createElement("button");

    share.className =
        "message-action";

    share.type =
        "button";

    share.textContent =
        "🔗";

    share.title =
        "Share";


    share.onclick =
        function() {

            shareText(text);

        };


    /* LIKE */

    const like =
        document.createElement("button");

    like.className =
        "message-action like-button";

    like.type =
        "button";

    like.textContent =
        "♡";

    like.title =
        "Like";


    like.onclick =
        function() {

            like.classList.toggle(
                "liked"
            );

            like.textContent =
                like.classList.contains("liked")
                    ? "♥"
                    : "♡";

        };


    actions.appendChild(speaker);
    actions.appendChild(copy);
    actions.appendChild(share);
    actions.appendChild(like);


    return actions;

}


/* =========================================
   SPEAKER
========================================= */

function speakText(
    text,
    button
) {

    if (!window.speechSynthesis) {

        alert(
            "Voice is not supported in this browser."
        );

        return;

    }


    if (
        window.speechSynthesis.speaking
    ) {

        window.speechSynthesis.cancel();

        if (speakingButton) {

            speakingButton.textContent =
                "🔊";

            speakingButton.classList.remove(
                "active"
            );

        }

        speakingButton = null;

        return;

    }


    const langMap = {

        en: "en-IN",
        ta: "ta-IN",
        hi: "hi-IN",
        ml: "ml-IN",
        te: "te-IN",
        kn: "kn-IN",
        bn: "bn-IN",
        mr: "mr-IN",
        gu: "gu-IN",
        pa: "pa-IN",
        ur: "ur-IN",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        ja: "ja-JP",
        ko: "ko-KR",
        zh: "zh-CN",
        ar: "ar-SA"

    };


    const speech =
        new SpeechSynthesisUtterance(text);


    speech.lang =
        langMap[selectedLanguage] ||
        "en-IN";


    speech.rate = 0.95;

    speech.pitch =
        selectedVoice === "female"
            ? 1.1
            : 0.85;


    speakingButton = button;

    button.textContent = "🔇";

    button.classList.add("active");


    speech.onend =
        function() {

            button.textContent = "🔊";

            button.classList.remove(
                "active"
            );

            speakingButton = null;

        };


    speech.onerror =
        function() {

            button.textContent = "🔊";

            button.classList.remove(
                "active"
            );

            speakingButton = null;

        };


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(
        speech
    );

}


/* =========================================
   COPY
========================================= */

async function copyText(
    text,
    button
) {

    try {

        await navigator.clipboard.writeText(
            text
        );

    } catch {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value = text;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        textarea.remove();

    }


    button.textContent = "✓";

    setTimeout(
        () => {
            button.textContent = "📋";
        },
        1200
    );

}


/* =========================================
   MESSAGE SHARE
========================================= */

async function shareText(text) {

    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title: "Viggo AI",

                text: text

            });

            return;

        } catch {

            return;

        }

    }


    await navigator.clipboard.writeText(
        text
    );

    alert(
        "Message copied. You can share it now."
    );

}


/* =========================================
   SEND
========================================= */

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) return;


    if (!currentChat) {

        newChat();

    }


    currentChat.messages.push({

        role: "user",

        text: text

    });


    if (
        currentChat.title === "New Chat"
    ) {

        currentChat.title =
            text.substring(0, 35);

    }


    messageInput.value = "";

    saveChats();

    renderRecent();

    renderChat();


    const loading =
        document.createElement("div");

    loading.className =
        "message-row ai";

    loading.innerHTML = `
        <div class="message">
            <div class="message-bubble">
                Viggo AI is thinking...
            </div>
        </div>
    `;

    chatArea.appendChild(
        loading
    );

    scrollChat();


    try {

        const history =
            currentChat.messages
                .slice(-14)
                .map(message => ({

                    role:
                        message.role,

                    content:
                        message.text

                }));


        const response =
            await fetch(
                API_URL + "/chat",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message:
                                text,

                            language:
                                selectedLanguage,

                            history:
                                history

                        })

                }
            );


        const data =
            await response.json();


        loading.remove();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.details ||
                data.error ||
                "Server error"
            );

        }


        currentChat.messages.push({

            role: "assistant",

            text:
                data.reply

        });


        saveChats();

        renderRecent();

        renderChat();


    } catch (error) {

        loading.remove();

        console.error(
            "Viggo connection error:",
            error
        );


        currentChat.messages.push({

            role: "assistant",

            text:
                "Sorry friend, I couldn't connect to Viggo AI right now."

        });


        saveChats();

        renderChat();

    }

}


/* =========================================
   ENTER
========================================= */

messageInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* SEND */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* NEW CHAT */

document
    .getElementById("newChatBtn")
    .addEventListener(
        "click",
        newChat
    );


/* =========================================
   PLUS
========================================= */

plusBtn.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        closeMenus();

        plusMenu.classList.toggle(
            "show"
        );

        positionPopup(
            plusMenu,
            plusBtn
        );

    }
);


/* FILES */

document
    .getElementById("photoBtn")
    .onclick =
    () => document
        .getElementById("photoInput")
        .click();


document
    .getElementById("videoBtn")
    .onclick =
    () => document
        .getElementById("videoInput")
        .click();


document
    .getElementById("fileBtn")
    .onclick =
    () => document
        .getElementById("fileInput")
        .click();


/* =========================================
   MORE
========================================= */

moreBtn.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        plusMenu.classList.remove("show");

        languageMenu.classList.remove("show");

        voiceMenu.classList.remove("show");

        deleteMenu.classList.remove("show");

        moreMenu.classList.toggle(
            "show"
        );

    }
);


/* =========================================
   LANGUAGE
========================================= */

languageBtn.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        closeMenus();

        languageMenu.classList.add(
            "show"
        );

        positionPopup(
            languageMenu,
            languageBtn
        );

    }
);


document
    .querySelectorAll("[data-language]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function() {

                    selectedLanguage =
                        this.dataset.language;

                    localStorage.setItem(
                        "viggoLanguage",
                        selectedLanguage
                    );

                    languageMenu.classList.remove(
                        "show"
                    );

                }
            );

        }
    );


document
    .getElementById("moreLanguageBtn")
    .addEventListener(
        "click",
        function() {

            document
                .getElementById("moreLanguages")
                .classList.toggle(
                    "show"
                );

        }
    );


/* =========================================
   VOICE MENU
========================================= */

voiceBtn.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        closeMenus();

        voiceMenu.classList.add(
            "show"
        );

        positionPopup(
            voiceMenu,
            voiceBtn
        );

    }
);


document
    .querySelectorAll("[data-voice]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function() {

                    selectedVoice =
                        this.dataset.voice;

                    localStorage.setItem(
                        "viggoVoice",
                        selectedVoice
                    );


                    document
                        .getElementById(
                            "voiceStatus"
                        )
                        .textContent =
                        selectedVoice === "female"
                            ? "👩 Female voice selected"
                            : "👨 Male voice selected";

                }
            );

        }
    );


/* =========================================
   DELETE
========================================= */

deleteBtn.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        closeMenus();

        deleteMenu.classList.add(
            "show"
        );

        positionPopup(
            deleteMenu,
            deleteBtn
        );

    }
);


/* CLEAR ALL */

document
    .getElementById("clearAllBtn")
    .addEventListener(
        "click",
        function() {

            if (
                !confirm(
                    "Are you sure you want to delete all chats?"
                )
            ) return;


            chats = [];

            currentChat = null;

            saveChats();

            renderRecent();

            renderChat();

            deleteMenu.classList.remove(
                "show"
            );

        }
    );


/* SELECT DELETE */

document
    .getElementById("selectDeleteBtn")
    .addEventListener(
        "click",
        function() {

            if (!chats.length) {

                alert(
                    "No chats available."
                );

                return;

            }


            const list =
                chats
                    .map(
                        (chat, index) =>
                            `${index + 1}. ${chat.title}`
                    )
                    .join("\n");


            const answer =
                prompt(
                    "Enter the chat number to delete:\n\n" +
                    list
                );


            if (!answer) return;


            const index =
                parseInt(answer, 10) - 1;


            if (
                index < 0 ||
                index >= chats.length
            ) {

                alert(
                    "Invalid selection."
                );

                return;

            }


            const deleted =
                chats[index];


            chats.splice(
                index,
                1
            );


            if (
                currentChat &&
                currentChat.id === deleted.id
            ) {

                currentChat =
                    chats[0] || null;

            }


            saveChats();

            renderRecent();

            renderChat();

        }
    );


/* =========================================
   SHARE CHAT
========================================= */

document
    .getElementById("shareChatBtn")
    .addEventListener(
        "click",
        function() {

            const overlay =
                document.getElementById(
                    "shareOverlay"
                );


            const chatId =
                currentChat?.id ||
                "new";


            const link =
                window.location.origin +
                window.location.pathname +
                "?chat=" +
                encodeURIComponent(
                    chatId
                );


            document
                .getElementById(
                    "shareLink"
                )
                .value =
                link;


            overlay.classList.add(
                "show"
            );

        }
    );


/* COPY SHARE LINK */

document
    .getElementById("copyShareLink")
    .addEventListener(
        "click",
        async function() {

            const link =
                document
                    .getElementById(
                        "shareLink"
                    )
                    .value;


            await navigator.clipboard.writeText(
                link
            );


            this.textContent =
                "✓ Copied";

            setTimeout(
                () => {

                    this.textContent =
                        "📋 Copy Link";

                },
                1200
            );

        }
    );


/* NATIVE SHARE */

document
    .getElementById("nativeShare")
    .addEventListener(
        "click",
        async function() {

            const link =
                document
                    .getElementById(
                        "shareLink"
                    )
                    .value;


            if (
                navigator.share
            ) {

                try {

                    await navigator.share({

                        title:
                            "Viggo AI Chat",

                        url:
                            link

                    });

                } catch {}

            } else {

                await navigator.clipboard.writeText(
                    link
                );

                alert(
                    "Share link copied."
                );

            }

        }
    );


/* CLOSE SHARE */

document
    .getElementById("closeShare")
    .addEventListener(
        "click",
        function() {

            document
                .getElementById(
                    "shareOverlay"
                )
                .classList.remove(
                    "show"
                );

        }
    );


/* =========================================
   MOBILE SIDEBAR
========================================= */

document
    .getElementById("menuBtn")
    .addEventListener(
        "click",
        function() {

            document
                .getElementById("sidebar")
                .classList.add(
                    "open"
                );

        }
    );


document
    .getElementById("closeSidebar")
    .addEventListener(
        "click",
        function() {

            document
                .getElementById("sidebar")
                .classList.remove(
                    "open"
                );

        }
    );


/* =========================================
   VOICE INPUT
========================================= */

document
    .getElementById("voiceInputBtn")
    .addEventListener(
        "click",
        function() {

            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;


            if (!SpeechRecognition) {

                alert(
                    "Voice input is not supported in this browser."
                );

                return;

            }


            const recognition =
                new SpeechRecognition();


            const recognitionLang = {

                en: "en-IN",
                ta: "ta-IN",
                hi: "hi-IN",
                ml: "ml-IN",
                te: "te-IN",
                kn: "kn-IN"

            };


            recognition.lang =
                recognitionLang[
                    selectedLanguage
                ] || "en-IN";


            recognition.interimResults =
                false;


            recognition.start();


            this.textContent =
                "🔴";


            recognition.onresult =
                function(event) {

                    const result =
                        event.results[0][0].transcript;

                    messageInput.value =
                        result;

                };


            recognition.onend =
                () => {

                    document
                        .getElementById(
                            "voiceInputBtn"
                        )
                        .textContent =
                        "🎤";

                };


            recognition.onerror =
                () => {

                    document
                        .getElementById(
                            "voiceInputBtn"
                        )
                        .textContent =
                        "🎤";

                };

        }
    );


/* =========================================
   POPUP POSITION
========================================= */

function positionPopup(
    popup,
    button
) {

    const rect =
        button.getBoundingClientRect();


    popup.style.left =
        Math.max(
            10,
            rect.left
        ) + "px";


    popup.style.top =
        Math.max(
            10,
            rect.top - 220
        ) + "px";

}


/* =========================================
   SCROLL
========================================= */

function scrollChat() {

    chatArea.scrollTop =
        chatArea.scrollHeight;

}


/* =========================================
   OUTSIDE CLICK
========================================= */

document.addEventListener(
    "click",
    function(event) {

        if (
            !event.target.closest(".popup") &&
            !event.target.closest(".more-menu") &&
            !event.target.closest("#plusBtn") &&
            !event.target.closest("#moreBtn") &&
            !event.target.closest("#languageBtn") &&
            !event.target.closest("#voiceBtn") &&
            !event.target.closest("#deleteBtn")
        ) {

            closeMenus();

        }

    }
);


/* =========================================
   START
========================================= */

if (chats.length > 0) {

    currentChat =
        chats[0];

}

renderRecent();

renderChat();
