"use strict";


/* =========================================
   RENDER URL
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

let currentChat =
    null;

let selectedLanguage =
    localStorage.getItem("viggoLanguage") || "en";

let selectedVoice =
    localStorage.getItem("viggoVoice") || "female";

let speakingButton =
    null;


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

const recentList =
    document.getElementById("recentList");

const recentCount =
    document.getElementById("recentCount");


/* =========================================
   STORAGE
========================================= */

function saveChats() {

    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );

}


/* =========================================
   NEW CHAT
========================================= */

function newChat() {

    currentChat = {

        id:
            Date.now().toString(),

        title:
            "New Chat",

        messages:
            []

    };

    chats.unshift(
        currentChat
    );

    saveChats();

    renderRecent();

    renderChat();

}


/* =========================================
   RENDER RECENT
========================================= */

function renderRecent() {

    recentList.innerHTML = "";

    recentCount.textContent =
        chats.length;


    chats.forEach(chat => {

        const item =
            document.createElement("div");

        item.className =
            "recent-item";


        const name =
            document.createElement("span");

        name.className =
            "recent-name";

        name.textContent =
            chat.title || "New Chat";


        const del =
            document.createElement("button");

        del.className =
            "recent-delete";

        del.textContent =
            "×";

        del.type =
            "button";


        del.onclick =
            function(event) {

                event.stopPropagation();

                deleteChat(
                    chat.id
                );

            };


        item.appendChild(name);

        item.appendChild(del);


        item.onclick =
            function() {

                currentChat =
                    chats.find(
                        c =>
                            c.id === chat.id
                    );

                renderChat();

            };


        recentList.appendChild(
            item
        );

    });

}


/* =========================================
   DELETE CHAT
========================================= */

function deleteChat(id) {

    chats =
        chats.filter(
            chat =>
                chat.id !== id
        );

    saveChats();

    if (
        !chats.length
    ) {

        newChat();

        return;

    }

    currentChat =
        chats[0];

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
        !currentChat.messages.length
    ) {

        const welcome =
            document.createElement("div");

        welcome.className =
            "welcome";

        welcome.innerHTML = `
            <div class="welcome-logo">V</div>
            <h1>Hello! I'm Viggo AI</h1>
            <p>Your friendly AI assistant</p>
        `;

        chatArea.appendChild(
            welcome
        );

        return;

    }


    currentChat.messages
        .forEach(message => {

            addMessageToScreen(
                message
            );

        });


    chatArea.scrollTop =
        chatArea.scrollHeight;

}


/* =========================================
   ADD MESSAGE
========================================= */

function addMessageToScreen(
    message
) {

    const row =
        document.createElement("div");

    row.className =
        "message-row " +
        (
            message.role === "user"
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
        message.text;


    wrapper.appendChild(
        bubble
    );


    /* ACTIONS ONLY FOR AI */

    if (
        message.role === "assistant"
    ) {

        const actions =
            createMessageActions(
                message.text
            );

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

function createMessageActions(
    text
) {

    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";


    /* VOICE */

    const voice =
        document.createElement("button");

    voice.type =
        "button";

    voice.className =
        "message-action";

    voice.textContent =
        "🔊";

    voice.title =
        "Voice";


    voice.onclick =
        function() {

            speakText(
                text,
                voice
            );

        };


    /* COPY */

    const copy =
        document.createElement("button");

    copy.type =
        "button";

    copy.className =
        "message-action";

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

    share.type =
        "button";

    share.className =
        "message-action";

    share.textContent =
        "🔗";

    share.title =
        "Share";


    share.onclick =
        function() {

            shareText(
                text
            );

        };


    /* LIKE */

    const like =
        document.createElement("button");

    like.type =
        "button";

    like.className =
        "message-action like-button";

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


    actions.appendChild(
        voice
    );

    actions.appendChild(
        copy
    );

    actions.appendChild(
        share
    );

    actions.appendChild(
        like
    );


    return actions;

}


/* =========================================
   VOICE
========================================= */

function speakText(
    text,
    button
) {

    if (
        !window.speechSynthesis
    ) {

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

        speakingButton =
            null;

        return;

    }


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    const languages = {

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


    utterance.lang =
        languages[selectedLanguage]
        || "en-IN";


    utterance.rate =
        0.95;


    utterance.pitch =
        selectedVoice === "female"
            ? 1.1
            : 0.85;


    speakingButton =
        button;

    button.textContent =
        "🔇";

    button.classList.add(
        "active"
    );


    utterance.onend =
        function() {

            button.textContent =
                "🔊";

            button.classList.remove(
                "active"
            );

            speakingButton =
                null;

        };


    utterance.onerror =
        function() {

            button.textContent =
                "🔊";

            button.classList.remove(
                "active"
            );

            speakingButton =
                null;

        };


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(
        utterance
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

        await navigator.clipboard
            .writeText(text);

    } catch {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        textarea.remove();

    }


    button.textContent =
        "✓";

    setTimeout(
        function() {

            button.textContent =
                "📋";

        },
        1200
    );

}


/* =========================================
   SHARE
========================================= */

async function shareText(
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
                    text

            });

        } catch {

            console.log(
                "Share cancelled"
            );

        }

        return;

    }


    await copyText(
        text,
        {
            textContent: ""
        }
    );

    alert(
        "Message copied. You can paste it anywhere."
    );

}


/* =========================================
   SEND
========================================= */

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


    if (!currentChat) {
        newChat();
    }


    currentChat.messages.push({

        role:
            "user",

        text:
            text

    });


    if (
        currentChat.title === "New Chat"
    ) {

        currentChat.title =
            text.substring(0, 35);

    }


    messageInput.value =
        "";

    renderChat();

    renderRecent();

    saveChats();


    /* LOADING */

    const loading =
        document.createElement(
            "div"
        );

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

    chatArea.scrollTop =
        chatArea.scrollHeight;


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

            role:
                "assistant",

            text:
                data.reply

        });


        saveChats();

        renderChat();

        renderRecent();


    } catch (error) {

        loading.remove();

        currentChat.messages.push({

            role:
                "assistant",

            text:
                "Sorry friend, I couldn't connect to Viggo AI right now."

        });

        saveChats();

        renderChat();

        console.error(
            "Viggo error:",
            error
        );

    }

}


/* =========================================
   ENTER TO SEND
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


/* =========================================
   SEND BUTTON
========================================= */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =========================================
   NEW CHAT
========================================= */

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

        closePopups();

        plusMenu.classList.toggle(
            "show"
        );

    }
);


/* FILE BUTTONS */

document
    .getElementById("photoBtn")
    .onclick =
    function() {

        document
            .getElementById("photoInput")
            .click();

    };


document
    .getElementById("videoBtn")
    .onclick =
    function() {

        document
            .getElementById("videoInput")
            .click();

    };


document
    .getElementById("fileBtn")
    .onclick =
    function() {

        document
            .getElementById("fileInput")
            .click();

    };


/* =========================================
   MORE
========================================= */

moreBtn.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        closePopups();

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
    function() {

        closePopups();

        languageMenu.classList.add(
            "show"
        );

    }
);


document
    .querySelectorAll(
        "[data-language]"
    )
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


/* MORE LANGUAGES */

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
    function() {

        closePopups();

        voiceMenu.classList.add(
            "show"
        );

    }
);


document
    .querySelectorAll(
        "[data-voice]"
    )
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
    function() {

        closePopups();

        deleteMenu.classList.add(
            "show"
        );

    }
);


/* CLEAR ALL */

document
    .getElementById("clearAllBtn")
    .addEventListener(
        "click",
        function() {

            const ok =
                confirm(
                    "Delete all chats?"
                );

            if (!ok) {
                return;
            }

            chats = [];

            saveChats();

            currentChat =
                null;

            renderRecent();

            renderChat();

            deleteMenu.classList.remove(
                "show"
            );

        }
    );


/* =========================================
   SELECT CHAT DELETE
========================================= */

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


            const names =
                chats
                    .map(
                        (chat, index) =>
                            `${index + 1}. ${chat.title}`
                    )
                    .join("\n");


            const answer =
                prompt(
                    "Enter chat number to delete:\n\n" +
                    names
                );


            if (!answer) {
                return;
            }


            const index =
                Number(answer) - 1;


            if (
                index < 0 ||
                index >= chats.length
            ) {

                alert(
                    "Invalid chat number."
                );

                return;

            }


            chats.splice(
                index,
                1
            );


            saveChats();


            if (chats.length) {

                currentChat =
                    chats[0];

            } else {

                currentChat =
                    null;

            }


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

            const popup =
                document.getElementById(
                    "sharePopup"
                );

            const link =
                window.location.href +
                "#chat=" +
                (
                    currentChat?.id ||
                    "new"
                );


            document
                .getElementById(
                    "shareLink"
                )
                .value =
                link;


            popup.classList.add(
                "show"
            );

        }
    );


document
    .getElementById("closeShareBtn")
    .onclick =
    function() {

        document
            .getElementById(
                "sharePopup"
            )
            .classList.remove(
                "show"
            );

    };


document
    .getElementById("copyLinkBtn")
    .onclick =
    async function() {

        const input =
            document.getElementById(
                "shareLink"
            );

        await navigator.clipboard
            .writeText(
                input.value
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

    };


document
    .getElementById("nativeShareBtn")
    .onclick =
    async function() {

        const link =
            document.getElementById(
                "shareLink"
            ).value;


        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "Viggo AI Chat",

                url:
                    link

            });

        } else {

            await navigator.clipboard
                .writeText(
                    link
                );

            alert(
                "Share link copied."
            );

        }

    };


/* =========================================
   SIDEBAR MOBILE
========================================= */

document
    .getElementById("menuBtn")
    .onclick =
    function() {

        document
            .getElementById("sidebar")
            .classList.add(
                "open"
            );

    };


document
    .getElementById("closeSidebar")
    .onclick =
    function() {

        document
            .getElementById("sidebar")
            .classList.remove(
                "open"
            );

    };


/* =========================================
   CLOSE POPUPS
========================================= */

function closePopups() {

    plusMenu.classList.remove(
        "show"
    );

    moreMenu.classList.remove(
        "show"
    );

    languageMenu.classList.remove(
        "show"
    );

    voiceMenu.classList.remove(
        "show"
    );

    deleteMenu.classList.remove(
        "show"
    );

}


document.addEventListener(
    "click",
    function(event) {

        if (
            !event.target.closest(
                ".popup"
            ) &&
            !event.target.closest(
                ".input-btn"
            ) &&
            !event.target.closest(
                ".more-button"
            )
        ) {

            closePopups();

        }

    }
);


/* =========================================
   INITIAL LOAD
========================================= */

renderRecent();

if (chats.length) {

    currentChat =
        chats[0];

}

renderChat();
