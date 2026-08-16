// ===============================
// HISTORY
// ===============================

function getChats() {
    try {
        return JSON.parse(
            localStorage.getItem("viggo_chats") || "[]"
        );
    } catch (error) {
        return [];
    }
}

function saveChats(chats) {
    localStorage.setItem(
        "viggo_chats",
        JSON.stringify(chats)
    );
}

function saveCurrentChat() {

    if (!messages || messages.length === 0) {
        return;
    }

    let chats = getChats();

    const firstUserMessage =
        messages.find(
            m => m.role === "user"
        );

    const title =
        firstUserMessage
            ? firstUserMessage.content.substring(0, 40)
            : "New Chat";

    if (!currentChatId) {
        currentChatId =
            Date.now().toString();
    }

    const chat = {
        id: currentChatId,
        title: title,
        messages: messages,
        pinned: false,
        time: new Date().toISOString()
    };

    const index =
        chats.findIndex(
            c => c.id === currentChatId
        );

    if (index >= 0) {

        chat.pinned =
            chats[index].pinned || false;

        chats[index] = chat;

    } else {

        chats.unshift(chat);
    }

    saveChats(chats);

    renderHistory();
}


// ===============================
// RENDER HISTORY
// ===============================

function renderHistory() {

    const chats = getChats();

    if (pinnedList) {
        pinnedList.innerHTML = "";
    }

    if (recentList) {
        recentList.innerHTML = "";
    }

    if (historyList) {
        historyList.innerHTML = "";
    }

    const pinned =
        chats.filter(
            chat => chat.pinned
        );

    const recent =
        chats.filter(
            chat => !chat.pinned
        );

    // PINNED
    if (pinned.length === 0) {

        pinnedList.innerHTML =
            `<div class="empty-sidebar">
                No pinned chats
            </div>`;

    } else {

        pinned.forEach(chat => {
            createSidebarChat(
                chat,
                pinnedList
            );
        });
    }

    // RECENT
    if (recent.length === 0) {

        recentList.innerHTML =
            `<div class="empty-sidebar">
                No recent chats
            </div>`;

    } else {

        recent.forEach(chat => {
            createSidebarChat(
                chat,
                recentList
            );
        });
    }

    // HISTORY MODAL
    if (chats.length === 0) {

        historyList.innerHTML =
            `<p>No chat history yet.</p>`;

        return;
    }

    chats.forEach(chat => {

        const card =
            document.createElement("div");

        card.className =
            "history-card";

        if (chat.pinned) {
            card.classList.add("pinned");
        }

        const title =
            document.createElement("div");

        title.className =
            "history-card-title";

        title.textContent =
            chat.title;

        const time =
            document.createElement("div");

        time.className =
            "history-card-time";

        time.textContent =
            new Date(
                chat.time
            ).toLocaleString();

        const actions =
            document.createElement("div");

        actions.className =
            "history-card-actions";


        // OPEN
        const openButton =
            document.createElement("button");

        openButton.textContent =
            "Open";

        openButton.onclick =
            function () {

                loadChat(chat);

                historyModal.style.display =
                    "none";
            };


        // PIN
        const pinButton =
            document.createElement("button");

        pinButton.className =
            "pin-button";

        pinButton.textContent =
            chat.pinned
                ? "📌 Unpin"
                : "📌 Pin";

        pinButton.onclick =
            function () {

                togglePin(chat.id);
            };


        // DELETE
        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "delete-button";

        deleteButton.textContent =
            "🗑 Delete";

        deleteButton.onclick =
            function () {

                deleteChat(chat.id);
            };


        actions.appendChild(
            openButton
        );

        actions.appendChild(
            pinButton
        );

        actions.appendChild(
            deleteButton
        );

        card.appendChild(title);
        card.appendChild(time);
        card.appendChild(actions);

        historyList.appendChild(card);
    });
}


// ===============================
// LOAD CHAT
// ===============================

function loadChat(chat) {

    currentChatId =
        chat.id;

    messages =
        Array.isArray(chat.messages)
            ? chat.messages
            : [];

    conversation.innerHTML =
        "";

    currentTitle.textContent =
        chat.title || "Chat";

    messages.forEach(message => {

        addMessage(
            message.role,
            message.content,
            false
        );
    });

    scrollToBottom();
}


// ===============================
// SIDEBAR CHAT
// ===============================

function createSidebarChat(
    chat,
    container
) {

    const button =
        document.createElement("button");

    button.className =
        "chat-item";

    const title =
        document.createElement("span");

    title.className =
        "chat-item-title";

    title.textContent =
        chat.title;

    const pin =
        document.createElement("span");

    pin.className =
        "pin-icon";

    pin.textContent =
        chat.pinned
            ? "📌"
            : "";

    button.appendChild(title);
    button.appendChild(pin);

    button.onclick =
        function () {

            loadChat(chat);
        };

    container.appendChild(button);
}


// ===============================
// PIN
// ===============================

function togglePin(id) {

    const chats =
        getChats();

    const chat =
        chats.find(
            c => c.id === id
        );

    if (!chat) {
        return;
    }

    chat.pinned =
        !chat.pinned;

    saveChats(chats);

    renderHistory();
}


// ===============================
// DELETE
// ===============================

function deleteChat(id) {

    const chats =
        getChats();

    const updated =
        chats.filter(
            c => c.id !== id
        );

    saveChats(updated);

    if (currentChatId === id) {

        currentChatId = null;

        messages = [];

        conversation.innerHTML =
            "";

        currentTitle.textContent =
            "New Chat";
    }

    renderHistory();
}


// ===============================
// HISTORY BUTTON
// ===============================

historyButton.addEventListener(
    "click",
    function () {

        renderHistory();

        historyModal.style.display =
            "block";
    }
);


// ===============================
// CLOSE HISTORY
// ===============================

closeHistory.addEventListener(
    "click",
    function () {

        historyModal.style.display =
            "none";
    }
);


// ===============================
// SAVE BUTTON
// ===============================

saveButton.addEventListener(
    "click",
    function () {

        saveCurrentChat();

        this.textContent =
            "✓ Saved";

        setTimeout(() => {

            this.textContent =
                "💾 Save";

        }, 1500);
    }
);


// ===============================
// CLEAR HISTORY
// ===============================

clearHistoryButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "viggo_chats"
        );

        currentChatId = null;

        messages = [];

        conversation.innerHTML =
            "";

        currentTitle.textContent =
            "New Chat";

        renderHistory();
    }
);


// ===============================
// LOAD ON START
// ===============================

renderHistory();
