"use strict";


/* ==========================================
   VIGGO AI - NEW CLEAN FRONTEND
========================================== */


/* ==========================================
   CONFIG
========================================== */

const API_URL =
    "https://ai-tool-2-zpul.onrender.com";


/* ==========================================
   STATE
========================================== */

let chats =
    JSON.parse(
        localStorage.getItem("viggo_chats") || "[]"
    );

let currentChatId = null;

let selectedLanguage =
    localStorage.getItem(
        "viggo_language"
    ) || "en";

let selectedVoice =
    localStorage.getItem(
        "viggo_voice"
    ) || "female";


/* ==========================================
   ELEMENTS
========================================== */

const messageContainer =
    document.getElementById(
        "messageContainer"
    );

const historyContainer =
    document.getElementById(
        "historyContainer"
    );

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendButton =
    document.getElementById(
        "sendButton"
    );

const plusButton =
    document.getElementById(
        "plusButton"
    );

const plusMenu =
    document.getElementById(
        "plusMenu"
    );

const moreButton =
    document.getElementById(
        "moreButton"
    );

const moreMenu =
    document.getElementById(
        "moreMenu"
    );

const newChatButton =
    document.getElementById(
        "newChatButton"
    );

const voiceButton =
    document.getElementById(
        "voiceButton"
    );


/* ==========================================
   INITIALIZE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderHistory();

        createNewChat();

        setupEvents();

        console.log(
            "✓ Viggo AI script ready."
        );

    }
);


/* ==========================================
   EVENTS
========================================== */

function setupEvents() {


    /* SEND */

    sendButton.addEventListener(
        "click",
        sendMessage
    );


    /* ENTER */

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


    /* PLUS */

    plusButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            plusMenu.classList.toggle(
                "show"
            );

            moreMenu.classList.remove(
                "show"
            );

        }
    );


    /* MORE */

    moreButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            moreMenu.classList.toggle(
                "show"
            );

            plusMenu.classList.remove(
                "show"
            );

        }
    );


    /* NEW CHAT */

    newChatButton.addEventListener(
        "click",
        () => {

            createNewChat();

        }
    );


    /* VOICE */

    voiceButton.addEventListener(
        "click",
        startVoiceInput
    );


    /* PHOTO */

    document
        .getElementById("photoButton")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "photoInput"
                    )
                    .click();

                closeMenus();

            }
        );


    /* VIDEO */

    document
        .getElementById("videoButton")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "videoInput"
                    )
                    .click();

                closeMenus();

            }
        );


    /* FILE */

    document
        .getElementById("fileButton")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "fileInput"
                    )
                    .click();

                closeMenus();

            }
        );


    /* LANGUAGE */

    document
        .getElementById(
            "languageButton"
        )
        .addEventListener(
            "click",
            openLanguage
        );


    /* VOICE SETTINGS */

    document
        .getElementById(
            "voiceSettingsButton"
        )
        .addEventListener(
            "click",
            openVoiceSettings
        );


    /* CLEAR HISTORY */

    document
        .getElementById(
            "clearHistoryButton"
        )
        .addEventListener(
            "click",
            clearHistory
        );


    /* LANGUAGE CLOSE */

    document
        .getElementById(
            "closeLanguage"
        )
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "languageModal"
                    )
                    .classList.remove(
                        "show"
                    );

            }
        );


    /* VOICE CLOSE */

    document
        .getElementById(
            "closeVoice"
        )
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "voiceModal"
                    )
                    .classList.remove(
                        "show"
                    );

            }
        );


    /* LANGUAGE CHANGE */

    document
        .getElementById(
            "languageSelect"
        )
        .addEventListener(
            "change",
            event => {

                selectedLanguage =
                    event.target.value;

                localStorage.setItem(
                    "viggo_language",
                    selectedLanguage
                );

            }
        );


    /* VOICE SAVE */

    document
        .getElementById(
            "saveVoice"
        )
        .addEventListener(
            "click",
            () => {

                selectedVoice =
                    document
                        .getElementById(
                            "voiceSelect"
                        )
                        .value;

                localStorage.setItem(
                    "viggo_voice",
                    selectedVoice
                );

                document
                    .getElementById(
                        "voiceModal"
                    )
                    .classList.remove(
                        "show"
                    );

            }
        );


    /* MOBILE MENU */

    document
        .getElementById(
            "mobileMenuButton"
        )
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "sidebar"
                    )
                    .classList.toggle(
                        "open"
                    );

            }
        );


    /* CLOSE MENUS */

    document.addEventListener(
        "click",
        () => {

            closeMenus();

        }
    );

}


/* ==========================================
   CLOSE MENUS
========================================== */

function closeMenus() {

    plusMenu.classList.remove(
        "show"
    );

    moreMenu.classList.remove(
        "show"
    );

}


/* ==========================================
   CREATE NEW CHAT
========================================== */

function createNewChat() {

    currentChatId =
        Date.now().toString();

    const chat = {

        id: currentChatId,

        title: "New Chat",

        messages: [],

        createdAt:
            new Date().toISOString()

    };


    chats.unshift(chat);

    saveChats();

    renderHistory();

    renderMessages();

}


/* ==========================================
   SAVE CHATS
========================================== */

function saveChats() {

    localStorage.setItem(
        "viggo_chats",
        JSON.stringify(chats)
    );

}


/* ==========================================
   CURRENT CHAT
========================================== */

function getCurrentChat() {

    return chats.find(
        chat =>
            chat.id === currentChatId
    );

}


/* ==========================================
   RENDER HISTORY
========================================== */

function renderHistory() {

    if (!historyContainer) {

        console.error(
            "History container missing"
        );

        return;

    }


    historyContainer.innerHTML = "";


    chats.forEach(chat => {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "history-item";


        if (
            chat.id === currentChatId
        ) {

            item.classList.add(
                "active"
            );

        }


        const text =
            document.createElement(
                "div"
            );

        text.className =
            "history-text";

        text.textContent =
            chat.title ||
            "New Chat";


        const more =
            document.createElement(
                "button"
            );

        more.className =
            "history-more";

        more.type = "button";

        more.textContent =
            "⋮";


        more.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteChat(
                    chat.id
                );

            }
        );


        item.appendChild(text);

        item.appendChild(more);


        item.addEventListener(
            "click",
            () => {

                currentChatId =
                    chat.id;

                renderHistory();

                renderMessages();

            }
        );


        historyContainer.appendChild(
            item
        );

    });

}


/* ==========================================
   RENDER MESSAGES
========================================== */

function renderMessages() {

    if (!messageContainer) {

        console.error(
            "Message container missing"
        );

        return;

    }


    const chat =
        getCurrentChat();


    messageContainer.innerHTML =
        "";


    if (
        !chat ||
        !chat.messages.length
    ) {

        messageContainer.innerHTML = `

            <div class="welcome">

                <div class="welcome-logo">
                    V
                </div>

                <h2>
                    Hi! I'm Viggo AI 👋
                </h2>

                <p>
                    Ask me anything. I'm here to help.
                </p>

            </div>

        `;

        return;

    }


    chat.messages.forEach(
        (message, index) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "message-row " +
                (
                    message.role === "user"
                        ? "user"
                        : "ai"
                );


            const box =
                document.createElement(
                    "div"
                );

            box.className =
                "message " +
                (
                    message.role === "user"
                        ? "user-message"
                        : "ai-message"
                );


            box.textContent =
                message.content;


            row.appendChild(box);


            /* ACTIONS */

            if (
                message.role ===
                "assistant"
            ) {

                const actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "message-actions";


                const like =
                    createActionButton(
                        "👍",
                        () => {

                            like.textContent =
                                "❤️";

                        }
                    );


                const copy =
                    createActionButton(
                        "📋",
                        () => {

                            navigator.clipboard
                                .writeText(
                                    message.content
                                );

                            copy.textContent =
                                "✓";

                            setTimeout(
                                () => {
                                    copy.textContent =
                                        "📋";
                                },
                                1000
                            );

                        }
                    );


                const share =
                    createActionButton(
                        "🔗",
                        () => {

                            shareMessage(
                                message.content
                            );

                        }
                    );


                actions.appendChild(
                    like
                );

                actions.appendChild(
                    copy
                );

                actions.appendChild(
                    share
                );


                box.appendChild(
                    actions
                );

            }


            messageContainer.appendChild(
                row
            );

        }
    );


    messageContainer.scrollTop =
        messageContainer.scrollHeight;

}


/* ==========================================
   ACTION BUTTON
========================================== */

function createActionButton(
    icon,
    callback
) {

    const button =
        document.createElement(
            "button"
        );

    button.type = "button";

    button.textContent =
        icon;

    button.addEventListener(
        "click",
        callback
    );

    return button;

}


/* ==========================================
   SEND MESSAGE
========================================== */

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (!message) {
        return;
    }


    const chat =
        getCurrentChat();


    if (!chat) {

        createNewChat();

    }


    const current =
        getCurrentChat();


    current.messages.push({

        role: "user",

        content: message

    });


    if (
        current.title ===
        "New Chat"
    ) {

        current.title =
            message.substring(
                0,
                30
            );

    }


    messageInput.value =
        "";


    saveChats();

    renderHistory();

    renderMessages();


    /* LOADING */

    current.messages.push({

        role: "assistant",

        content:
            "Thinking..."

    });


    renderMessages();


    try {

        const response =
            await fetch(
                API_URL + "/chat",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                message,

                            language:
                                selectedLanguage,

                            history:
                                current.messages
                                    .slice(
                                        0,
                                        -1
                                    )

                        })

                }
            );


        const data =
            await response.json();


        /* REMOVE LOADING */

        current.messages.pop();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Server error"
            );

        }


        current.messages.push({

            role: "assistant",

            content:
                data.reply

        });


        saveChats();

        renderMessages();


    }


    catch (error) {

        console.error(
            "Viggo error:",
            error
        );


        current.messages.pop();


        current.messages.push({

            role: "assistant",

            content:
                "Sorry friend, I couldn't connect to Viggo AI right now."

        });


        saveChats();

        renderMessages();

    }

}


/* ==========================================
   DELETE CHAT
========================================== */

function deleteChat(id) {

    const confirmed =
        confirm(
            "Delete this chat?"
        );


    if (!confirmed) {
        return;
    }


    chats =
        chats.filter(
            chat =>
                chat.id !== id
        );


    if (
        currentChatId === id
    ) {

        if (chats.length) {

            currentChatId =
                chats[0].id;

        } else {

            createNewChat();

            return;

        }

    }


    saveChats();

    renderHistory();

    renderMessages();

}


/* ==========================================
   CLEAR HISTORY
========================================== */

function clearHistory() {

    const confirmed =
        confirm(
            "Clear all chat history?"
        );


    if (!confirmed) {
        return;
    }


    chats = [];

    currentChatId = null;

    localStorage.removeItem(
        "viggo_chats"
    );


    createNewChat();

}


/* ==========================================
   PLUS MENU
========================================== */

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".input-box"
            )
        ) {

            plusMenu.classList.remove(
                "show"
            );

        }

    }
);


/* ==========================================
   FILE SELECT
========================================== */

[
    "photoInput",
    "videoInput",
    "fileInput"
].forEach(id => {

    document
        .getElementById(id)
        .addEventListener(
            "change",
            event => {

                const file =
                    event.target.files[0];


                if (!file) {
                    return;
                }


                messageInput.value =
                    `📎 ${file.name}`;

            }
        );

});


/* ==========================================
   LANGUAGE
========================================== */

function openLanguage() {

    closeMenus();

    const modal =
        document.getElementById(
            "languageModal"
        );

    const select =
        document.getElementById(
            "languageSelect"
        );

    select.value =
        selectedLanguage;

    modal.classList.add(
        "show"
    );

}


/* ==========================================
   VOICE SETTINGS
========================================== */

function openVoiceSettings() {

    closeMenus();

    const modal =
        document.getElementById(
            "voiceModal"
        );

    const select =
        document.getElementById(
            "voiceSelect"
        );

    select.value =
        selectedVoice;

    modal.classList.add(
        "show"
    );

}


/* ==========================================
   VOICE INPUT
========================================== */

function startVoiceInput() {

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


    recognition.lang =
        selectedLanguage === "ta"
            ? "ta-IN"
            : selectedLanguage === "hi"
                ? "hi-IN"
                : "en-US";


    recognition.interimResults =
        false;


    recognition.onstart =
        () => {

            voiceButton.textContent =
                "🔴";

        };


    recognition.onresult =
        event => {

            messageInput.value =
                event
                    .results[0][0]
                    .transcript;

        };


    recognition.onerror =
        () => {

            voiceButton.textContent =
                "🎤";

        };


    recognition.onend =
        () => {

            voiceButton.textContent =
                "🎤";

        };


    recognition.start();

}


/* ==========================================
   SHARE
========================================== */

async function shareMessage(
    text
) {

    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "Viggo AI",

                text:
                    text,

                url:
                    window.location.href

            });

            return;

        }

        catch (error) {

            console.log(
                "Share cancelled"
            );

        }

    }


    await navigator.clipboard
        .writeText(
            text
        );


    alert(
        "Message copied. You can share it now."
    );

}


/* ==========================================
   TEXTAREA AUTO HEIGHT
========================================== */

messageInput.addEventListener(
    "input",
    () => {

        messageInput.style.height =
            "auto";

        messageInput.style.height =
            Math.min(
                messageInput.scrollHeight,
                150
            ) + "px";

    }
);


console.log(
    "✓ Viggo script loaded."
);
