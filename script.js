/* =====================================================
   VIGGO AI - SCRIPT.JS
   Blue + Black Design
   ===================================================== */


/* =====================================================
   SERVER URL
   ===================================================== */

const API_URL =
    "https://ai-tool-1-fgmc.onrender.com";


/* =====================================================
   ELEMENTS
   ===================================================== */

const sidebar =
    document.getElementById("sidebar");

const conversation =
    document.getElementById("conversation");

const messageInput =
    document.getElementById("message");

const sendButton =
    document.getElementById("send");

const micButton =
    document.getElementById("mic");

const currentTitle =
    document.getElementById("currentTitle");

const voiceToggle =
    document.getElementById("voiceToggle");

const voicePanel =
    document.getElementById("voicePanel");

const voiceSelect =
    document.getElementById("voiceSelect");

const pinnedList =
    document.getElementById("pinnedList");

const recentList =
    document.getElementById("recentList");


/* =====================================================
   VARIABLES
   ===================================================== */

let chatMessages = [];

let voiceEnabled = true;

let currentChatId =
    Date.now().toString();

let recognition = null;

let voices = [];


/* =====================================================
   TOAST MESSAGE
   ===================================================== */

function showToast(message) {

    let toast =
        document.getElementById("viggoToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "viggoToast";

        toast.style.position =
            "fixed";

        toast.style.bottom =
            "25px";

        toast.style.left =
            "50%";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.background =
            "#071a35";

        toast.style.color =
            "#ffffff";

        toast.style.border =
            "1px solid #238cff";

        toast.style.padding =
            "11px 20px";

        toast.style.borderRadius =
            "10px";

        toast.style.boxShadow =
            "0 0 20px rgba(20,130,255,.35)";

        toast.style.zIndex =
            "9999";

        document.body.appendChild(toast);

    }

    toast.textContent =
        message;

    toast.style.display =
        "block";

    clearTimeout(
        toast.timer
    );

    toast.timer =
        setTimeout(() => {

            toast.style.display =
                "none";

        }, 2200);
}


/* =====================================================
   REMOVE WELCOME
   ===================================================== */

function removeWelcome() {

    const welcome =
        document.querySelector(".welcome");

    if (welcome) {

        welcome.remove();

    }
}


/* =====================================================
   ADD MESSAGE
   ===================================================== */

function addMessage(
    role,
    text,
    saveToMemory = true
) {

    removeWelcome();


    const message =
        document.createElement("div");

    message.className =
        "message " + role;


    /* AVATAR */

    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";

    avatar.textContent =
        role === "user"
            ? "U"
            : "B";


    /* CONTENT */

    const content =
        document.createElement("div");

    content.className =
        "message-content";


    /* NAME */

    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        role === "user"
            ? "You"
            : "Viggo";


    /* TEXT */

    const textElement =
        document.createElement("div");

    textElement.className =
        "message-text";

    textElement.textContent =
        text;


    content.appendChild(name);

    content.appendChild(textElement);


    /* =================================================
       AI BUTTONS
       ================================================= */

    if (role === "ai") {

        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";


        /* COPY */

        const copyButton =
            document.createElement("button");

        copyButton.className =
            "msg-btn";

        copyButton.innerHTML =
            "📋 Copy";


        copyButton.onclick =
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        text
                    );

                    copyButton.innerHTML =
                        "✓ Copied";

                    setTimeout(() => {

                        copyButton.innerHTML =
                            "📋 Copy";

                    }, 1500);

                } catch {

                    showToast(
                        "Copy failed"
                    );

                }

            };


        /* SPEAKER */

        const speakerButton =
            document.createElement("button");

        speakerButton.className =
            "msg-btn";

        speakerButton.innerHTML =
            "🔊 Speak";


        speakerButton.onclick =
            () => {

                if (
                    speechSynthesis.speaking
                ) {

                    speechSynthesis.cancel();

                    speakerButton.innerHTML =
                        "🔊 Speak";

                    return;

                }

                speakText(
                    text
                );

                speakerButton.innerHTML =
                    "🔇 Stop";

            };


        /* LIKE */

        const likeButton =
            document.createElement("button");

        likeButton.className =
            "msg-btn";

        likeButton.innerHTML =
            "👍";


        /* DISLIKE */

        const dislikeButton =
            document.createElement("button");

        dislikeButton.className =
            "msg-btn";

        dislikeButton.innerHTML =
            "👎";


        likeButton.onclick =
            () => {

                likeButton.classList.toggle(
                    "active"
                );

                dislikeButton.classList.remove(
                    "active"
                );

                if (
                    likeButton.classList.contains(
                        "active"
                    )
                ) {

                    showToast(
                        "Thanks for your feedback 👍"
                    );

                }

            };


        dislikeButton.onclick =
            () => {

                dislikeButton.classList.toggle(
                    "active"
                );

                likeButton.classList.remove(
                    "active"
                );

                if (
                    dislikeButton.classList.contains(
                        "active"
                    )
                ) {

                    showToast(
                        "Thanks for your feedback 👎"
                    );

                }

            };


        actions.appendChild(
            copyButton
        );

        actions.appendChild(
            speakerButton
        );

        actions.appendChild(
            likeButton
        );

        actions.appendChild(
            dislikeButton
        );


        content.appendChild(
            actions
        );

    }


    message.appendChild(
        avatar
    );

    message.appendChild(
        content
    );


    conversation.appendChild(
        message
    );


    scrollToBottom();


    if (saveToMemory) {

        chatMessages.push({

            role: role,

            content: text

        });

    }

}


/* =====================================================
   SCROLL
   ===================================================== */

function scrollToBottom() {

    const chatArea =
        document.querySelector(".chat-area");

    if (!chatArea) return;

    setTimeout(() => {

        chatArea.scrollTop =
            chatArea.scrollHeight;

    }, 50);

}


/* =====================================================
   SEND MESSAGE
   ===================================================== */

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {

        return;

    }


    addMessage(
        "user",
        text
    );


    messageInput.value =
        "";

    messageInput.style.height =
        "auto";


    sendButton.disabled =
        true;


    /* TITLE */

    if (
        chatMessages.length === 1
    ) {

        currentTitle.textContent =
            text.length > 32
                ? text.substring(0, 32) + "..."
                : text;

    }


    /* =================================================
       LOADING
       ================================================= */

    const loading =
        document.createElement("div");

    loading.className =
        "message ai";


    loading.innerHTML = `

        <div class="avatar">
            B
        </div>

        <div class="message-content">

            <div class="message-name">
                Viggo
            </div>

            <div class="message-text">
                Thinking...
            </div>

        </div>

    `;


    conversation.appendChild(
        loading
    );


    scrollToBottom();


    try {

        const response =
            await fetch(
                API_URL + "/api/chat",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        message:
                            text,

                        history:
                            chatMessages

                    })

                }
            );


        if (!response.ok) {

            throw new Error(
                "Server error"
            );

        }


        const data =
            await response.json();


        loading.remove();


        const reply =
            data.reply ||
            data.message ||
            "Sorry, Viggo could not generate a response.";


        addMessage(
            "ai",
            reply
        );


        /* AUTO VOICE */

        if (voiceEnabled) {

            speakText(
                reply
            );

        }


        saveCurrentChat();


    } catch (error) {

        console.error(
            "Viggo error:",
            error
        );


        loading.remove();


        addMessage(
            "ai",
            "Viggo server is not connected. Please start the server and try again."
        );

    }


    sendButton.disabled =
        false;

}


/* =====================================================
   SEND BUTTON
   ===================================================== */

sendButton.addEventListener(
    "click",
    sendMessage
);


/* =====================================================
   ENTER = SEND
   SHIFT + ENTER = NEW LINE
   ===================================================== */

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


/* =====================================================
   TEXTAREA AUTO HEIGHT
   ===================================================== */

messageInput.addEventListener(
    "input",
    function() {

        this.style.height =
            "auto";

        this.style.height =
            Math.min(
                this.scrollHeight,
                150
            ) + "px";

    }
);


/* =====================================================
   VOICE ON / OFF
   ===================================================== */

voiceToggle.addEventListener(
    "click",
    () => {

        voiceEnabled =
            !voiceEnabled;


        if (!voiceEnabled) {

            speechSynthesis.cancel();

            voiceToggle.textContent =
                "🔇 Voice OFF";

            showToast(
                "Viggo voice OFF"
            );

        } else {

            voiceToggle.textContent =
                "🔊 Voice ON";

            showToast(
                "Viggo voice ON"
            );

        }

    }
);


/* =====================================================
   TEXT TO SPEECH
   ===================================================== */

function speakText(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        showToast(
            "Voice is not supported"
        );

        return;

    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    /* SELECTED VOICE */

    const selectedName =
        voiceSelect.value;


    if (selectedName) {

        const selectedVoice =
            voices.find(
                voice =>
                    voice.name ===
                    selectedName
            );


        if (selectedVoice) {

            utterance.voice =
                selectedVoice;

        }

    }


    utterance.rate =
        1;

    utterance.pitch =
        1;

    utterance.volume =
        1;


    speechSynthesis.speak(
        utterance
    );

}


/* =====================================================
   LOAD VOICES
   ===================================================== */

function loadVoices() {

    voices =
        speechSynthesis.getVoices();


    voiceSelect.innerHTML =
        "";


    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value =
        "";

    defaultOption.textContent =
        "Default Voice";

    voiceSelect.appendChild(
        defaultOption
    );


    voices.forEach(
        voice => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                voice.name;

            option.textContent =
                voice.name +
                " (" +
                voice.lang +
                ")";


            voiceSelect.appendChild(
                option
            );

        }
    );

}


speechSynthesis.onvoiceschanged =
    loadVoices;


loadVoices();


/* =====================================================
   VOICE SETTINGS
   ===================================================== */

const voiceSettings =
    document.getElementById(
        "voiceSettings"
    );


if (voiceSettings) {

    voiceSettings.onclick =
        () => {

            voicePanel.classList.toggle(
                "show"
            );

        };

}


/* =====================================================
   TEST VOICE
   ===================================================== */

const testVoice =
    document.getElementById(
        "testVoice"
    );


if (testVoice) {

    testVoice.onclick =
        () => {

            speakText(
                "Hello friend! I am Viggo, your AI assistant."
            );

        };

}


/* =====================================================
   MICROPHONE
   ===================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    micButton.onclick =
        () => {

            try {

                recognition.start();

                micButton.textContent =
                    "🔴";

            } catch {

                console.log(
                    "Voice recognition already running."
                );

            }

        };


    recognition.onresult =
        event => {

            const transcript =
                event
                    .results[0][0]
                    .transcript;


            messageInput.value =
                transcript;


            messageInput.dispatchEvent(
                new Event("input")
            );


            micButton.textContent =
                "🎤";

        };


    recognition.onerror =
        event => {

            console.log(
                "Speech error:",
                event.error
            );


            micButton.textContent =
                "🎤";


            showToast(
                "Microphone permission required"
            );

        };


    recognition.onend =
        () => {

            micButton.textContent =
                "🎤";

        };

} else {

    micButton.onclick =
        () => {

            showToast(
                "Voice input is not supported in this browser"
            );

        };

}


/* =====================================================
   SHARE COMPLETE CHAT
   ===================================================== */

const shareChat =
    document.getElementById(
        "shareChat"
    );


if (shareChat) {

    shareChat.onclick =
        async () => {

            if (
                chatMessages.length === 0
            ) {

                showToast(
                    "No chat available to share"
                );

                return;

            }


            let shareText =
                "Viggo AI Chat\n\n";


            chatMessages.forEach(
                item => {

                    shareText +=
                        (
                            item.role === "user"
                                ? "You"
                                : "Viggo"
                        ) +
                        ":\n" +
                        item.content +
                        "\n\n";

                }
            );


            /* MOBILE / SUPPORTED SHARE */

            if (
                navigator.share
            ) {

                try {

                    await navigator.share({

                        title:
                            "Viggo AI Chat",

                        text:
                            shareText

                    });

                } catch {

                    console.log(
                        "Share cancelled"
                    );

                }

                return;

            }


            /* DESKTOP FALLBACK */

            try {

                await navigator.clipboard.writeText(
                    shareText
                );

                showToast(
                    "Complete chat copied!"
                );

            } catch {

                showToast(
                    "Sharing is not supported"
                );

            }

        };

}


/* =====================================================
   SAVE CHAT
   ===================================================== */

const saveButton =
    document.getElementById(
        "saveButton"
    );


if (saveButton) {

    saveButton.onclick =
        () => {

            saveCurrentChat();

            showToast(
                "Chat saved successfully 💾"
            );

        };

}


function saveCurrentChat() {

    if (
        chatMessages.length === 0
    ) {

        return;

    }


    let chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


    const firstUserMessage =
        chatMessages.find(
            item =>
                item.role === "user"
        );


    const title =
        firstUserMessage
            ? firstUserMessage.content
            : "New Chat";


    const chat = {

        id:
            currentChatId,

        title:
            title.substring(0, 40),

        messages:
            chatMessages,

        time:
            new Date().toLocaleString(),

        pinned:
            false

    };


    const index =
        chats.findIndex(
            item =>
                item.id ===
                currentChatId
        );


    if (index >= 0) {

        /* KEEP PIN STATUS */

        chat.pinned =
            chats[index].pinned;

        chats[index] =
            chat;

    } else {

        chats.unshift(
            chat
        );

    }


    localStorage.setItem(
        "viggoChats",
        JSON.stringify(chats)
    );


    renderSidebar();

}


/* =====================================================
   RENDER SIDEBAR
   ===================================================== */

function renderSidebar() {

    const chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


    const pinned =
        chats.filter(
            chat =>
                chat.pinned
        );


    const recent =
        chats.filter(
            chat =>
                !chat.pinned
        );


    renderChatList(
        pinnedList,
        pinned
    );


    renderChatList(
        recentList,
        recent
    );

}


/* =====================================================
   RENDER CHAT LIST
   ===================================================== */

function renderChatList(
    container,
    chats
) {

    container.innerHTML =
        "";


    if (
        chats.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.style.color =
            "#506b8e";

        empty.style.fontSize =
            "12px";

        empty.style.padding =
            "8px";

        empty.textContent =
            "No chats";

        container.appendChild(
            empty
        );

        return;

    }


    chats.forEach(
        chat => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "chat-item";


            if (
                chat.id ===
                currentChatId
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.innerHTML =
                `
                    <span>
                        ${escapeHtml(chat.title)}
                    </span>

                    ${
                        chat.pinned
                            ? "<span>📌</span>"
                            : ""
                    }
                `;


            button.onclick =
                () => {

                    loadChat(
                        chat.id
                    );

                };


            container.appendChild(
                button
            );

        }
    );

}


/* =====================================================
   LOAD CHAT
   ===================================================== */

function loadChat(id) {

    const chats =
        JSON.parse(
            localStorage.getItem(
                "viggoChats"
            ) || "[]"
        );


    const chat =
        chats.find(
            item =>
                item.id === id
        );


    if (!chat) {

        return;

    }


    currentChatId =
        chat.id;


    chatMessages =
        [];


    conversation.innerHTML =
        "";


    chat.messages.forEach(
        item => {

            addMessage(
                item.role,
                item.content
            );

        }
    );


    currentTitle.textContent =
        chat.title;


    renderSidebar();


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    showToast(
        "Chat loaded"
    );

}


/* =====================================================
   NEW CHAT
   ===================================================== */

const newChat =
    document.getElementById(
        "newChat"
    );


if (newChat) {

    newChat.onclick =
        () => {

            speechSynthesis.cancel();


            currentChatId =
                Date.now().toString();


            chatMessages =
                [];


            currentTitle.textContent =
                "New Chat";


            conversation.innerHTML =
                `

                <div class="welcome">

                    <div>

                        <div class="welcome-b">
                            B
                        </div>

                        <h1>
                            Welcome to Viggo
                        </h1>

                        <p>
                            Your AI assistant is ready.
                        </p>

                    </div>

                </div>

                `;


            messageInput.value =
                "";


            renderSidebar();

        };

}


/* =====================================================
   HISTORY
   ===================================================== */

const historyButton =
    document.getElementById(
        "historyButton"
    );


if (historyButton) {

    historyButton.onclick =
        () => {

            const chats =
                JSON.parse(
                    localStorage.getItem(
                        "viggoChats"
                    ) || "[]"
                );


            if (
                chats.length === 0
            ) {

                showToast(
                    "No saved chats"
                );

                return;

            }


            let text =
                "Viggo Chat History\n\n";


            chats.forEach(
                chat => {

                    text +=
                        "• " +
                        chat.title +
                        "\n";

                }
            );


            alert(
                text
            );

        };

}


/* =====================================================
   CLEAR HISTORY
   ===================================================== */

const clearHistory =
    document.getElementById(
        "clearHistory"
    );


if (clearHistory) {

    clearHistory.onclick =
        () => {

            const confirmClear =
                confirm(
                    "Clear all saved chats?"
                );


            if (!confirmClear) {

                return;

            }


            localStorage.removeItem(
                "viggoChats"
            );


            renderSidebar();


            showToast(
                "Chat history cleared"
            );

        };

}


/* =====================================================
   MOBILE MENU
   ===================================================== */

const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );


if (mobileMenu) {

    mobileMenu.onclick =
        () => {

            sidebar.classList.toggle(
                "open"
            );

        };

}


/* =====================================================
   SERVER CONNECTION CHECK
   ===================================================== */

async function checkServer() {

    try {

        const response =
            await fetch(
                API_URL +
                "/api/health"
            );


        if (
            response.ok
        ) {

            console.log(
                "✓ Viggo server connected"
            );

        } else {

            console.log(
                "Viggo server returned an error"
            );

        }

    } catch (error) {

        console.log(
            "✕ Viggo server is not connected"
        );

    }

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;

}


/* =====================================================
   START VIGGO
   ===================================================== */

renderSidebar();

checkServer();
