"use strict";

/* =====================================================
VIGGO AI
COMPLETE BUTTON + MOBILE + UPLOAD SYSTEM
===================================================== */

(function () {

```
console.log("=================================");
console.log("VIGGO AI SYSTEM STARTING...");
console.log("=================================");


/* =================================================
   GET ELEMENT
================================================= */

function get(id) {
    return document.getElementById(id);
}


/* =================================================
   ELEMENTS
================================================= */

let plusBtn;
let plusMenu;

let cameraBtn;
let photoBtn;
let videoBtn;
let fileBtn;

let plusVoiceBtn;

let cameraInput;
let photoInput;
let videoInput;
let fileInput;

let message;
let send;
let mic;

let sidebar;
let openSidebar;
let closeSidebar;

let moreBtn;
let moreMenu;

let voiceModal;
let languageModal;


/* =================================================
   SAFE CLICK
================================================= */

function clickElement(element) {

    if (!element) {
        console.warn("Element not found");
        return;
    }

    element.click();
}


/* =================================================
   PLUS MENU CLOSE
================================================= */

function closePlusMenu() {

    if (!plusMenu) {
        return;
    }

    plusMenu.classList.remove("show");

    plusMenu.style.display = "none";
}


/* =================================================
   PLUS MENU OPEN
================================================= */

function openPlusMenu() {

    if (!plusMenu) {
        return;
    }

    plusMenu.classList.add("show");

    plusMenu.style.display = "flex";
}


/* =================================================
   TOGGLE PLUS
================================================= */

function togglePlusMenu() {

    if (!plusMenu) {
        return;
    }

    const visible =
        plusMenu.classList.contains("show") ||
        plusMenu.style.display === "flex" ||
        plusMenu.style.display === "block";

    if (visible) {

        closePlusMenu();

    } else {

        openPlusMenu();

    }
}


/* =================================================
   OPEN CAMERA
================================================= */

function openCamera() {

    console.log("📷 Camera button clicked");

    closePlusMenu();

    if (!cameraInput) {
        console.error("cameraInput missing");
        return;
    }

    cameraInput.value = "";

    clickElement(cameraInput);
}


/* =================================================
   OPEN PHOTO
================================================= */

function openPhoto() {

    console.log("🖼️ Photo button clicked");

    closePlusMenu();

    if (!photoInput) {
        console.error("photoInput missing");
        return;
    }

    photoInput.value = "";

    clickElement(photoInput);
}


/* =================================================
   OPEN VIDEO
================================================= */

function openVideo() {

    console.log("🎥 Video button clicked");

    closePlusMenu();

    if (!videoInput) {
        console.error("videoInput missing");
        return;
    }

    videoInput.value = "";

    clickElement(videoInput);
}


/* =================================================
   OPEN FILE
================================================= */

function openFile() {

    console.log("📎 File button clicked");

    closePlusMenu();

    if (!fileInput) {
        console.error("fileInput missing");
        return;
    }

    fileInput.value = "";

    clickElement(fileInput);
}


/* =================================================
   HANDLE SELECTED FILE
================================================= */

function handleSelectedFile(file, source) {

    if (!file) {
        return;
    }

    console.log(
        "================================="
    );

    console.log(
        "UPLOAD:",
        source
    );

    console.log(
        "NAME:",
        file.name
    );

    console.log(
        "TYPE:",
        file.type
    );

    console.log(
        "SIZE:",
        file.size
    );

    console.log(
        "================================="
    );


    /* 20 MB */

    const maxSize =
        20 * 1024 * 1024;

    if (file.size > maxSize) {

        alert(
            "File is too large.\nMaximum size is 20 MB."
        );

        return;
    }


    /* PREVIEW */

    showPreview(file);


    /* =================================================
       EXISTING UPLOAD FUNCTION
    ================================================= */

    if (
        typeof window.sendUploadedFile ===
        "function"
    ) {

        console.log(
            "Using existing sendUploadedFile()"
        );

        try {

            window.sendUploadedFile(file);

        } catch (error) {

            console.error(
                "sendUploadedFile error:",
                error
            );

        }

        return;
    }


    /* =================================================
       OTHER EXISTING FUNCTION
    ================================================= */

    if (
        typeof window.uploadFile ===
        "function"
    ) {

        console.log(
            "Using existing uploadFile()"
        );

        try {

            window.uploadFile(file);

        } catch (error) {

            console.error(
                "uploadFile error:",
                error
            );

        }

        return;
    }


    if (
        typeof window.handleFileUpload ===
        "function"
    ) {

        console.log(
            "Using existing handleFileUpload()"
        );

        try {

            window.handleFileUpload(file);

        } catch (error) {

            console.error(
                "handleFileUpload error:",
                error
            );

        }

        return;
    }


    console.warn(
        "No existing upload function found."
    );

}


/* =================================================
   FILE PREVIEW
================================================= */

function showPreview(file) {

    const oldPreview =
        get("viggoUploadPreview");

    if (oldPreview) {
        oldPreview.remove();
    }


    const preview =
        document.createElement("div");

    preview.id =
        "viggoUploadPreview";


    preview.style.cssText = `
        position:fixed;
        left:12px;
        right:12px;
        bottom:80px;
        z-index:999999;
        background:#101722;
        border:1px solid #26364d;
        border-radius:14px;
        padding:12px;
        box-sizing:border-box;
        color:white;
        max-width:700px;
        margin:auto;
    `;


    const title =
        document.createElement("div");

    title.textContent =
        "Selected: " + file.name;

    title.style.cssText = `
        font-size:14px;
        margin-bottom:8px;
        word-break:break-word;
    `;

    preview.appendChild(title);


    /* IMAGE */

    if (
        file.type &&
        file.type.startsWith("image/")
    ) {

        const image =
            document.createElement("img");

        image.src =
            URL.createObjectURL(file);

        image.alt =
            file.name;

        image.style.cssText = `
            display:block;
            width:100%;
            max-height:280px;
            object-fit:contain;
            border-radius:10px;
        `;

        preview.appendChild(image);
    }


    /* VIDEO */

    if (
        file.type &&
        file.type.startsWith("video/")
    ) {

        const video =
            document.createElement("video");

        video.src =
            URL.createObjectURL(file);

        video.controls = true;

        video.playsInline = true;

        video.style.cssText = `
            display:block;
            width:100%;
            max-height:280px;
            border-radius:10px;
        `;

        preview.appendChild(video);
    }


    document.body.appendChild(preview);


    /* REMOVE AFTER 5 SEC */

    setTimeout(function () {

        if (preview.parentNode) {
            preview.remove();
        }

    }, 5000);

}


/* =================================================
   SEND MESSAGE
================================================= */

function sendCurrentMessage() {

    if (!message) {
        return;
    }

    const text =
        message.value.trim();

    if (!text) {
        return;
    }


    console.log(
        "Sending message:",
        text
    );


    /* USE EXISTING FUNCTION */

    if (
        typeof window.sendMessage ===
        "function"
    ) {

        try {

            /*
               If existing sendMessage()
               expects no argument,
               it will still work.
            */

            window.sendMessage(text);

        } catch (error) {

            console.error(
                "sendMessage error:",
                error
            );

        }

        return;
    }


    console.warn(
        "sendMessage() not found in current project."
    );

}


/* =================================================
   VOICE MODAL
================================================= */

function openVoiceModal() {

    if (!voiceModal) {
        return;
    }

    voiceModal.style.display =
        "flex";

}


function closeVoiceModal() {

    if (!voiceModal) {
        return;
    }

    voiceModal.style.display =
        "none";

}


/* =================================================
   LANGUAGE MODAL
================================================= */

function openLanguageModal() {

    if (!languageModal) {
        return;
    }

    languageModal.style.display =
        "flex";

}


function closeLanguageModal() {

    if (!languageModal) {
        return;
    }

    languageModal.style.display =
        "none";

}


/* =================================================
   MICROPHONE
================================================= */

function startMicrophone() {

    console.log(
        "🎤 Microphone clicked"
    );


    /*
       Existing voice function
    */

    if (
        typeof window.startVoiceRecognition ===
        "function"
    ) {

        window.startVoiceRecognition();

        return;
    }


    if (
        typeof window.startVoice ===
        "function"
    ) {

        window.startVoice();

        return;
    }


    /*
       Browser Speech Recognition
    */

    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!Recognition) {

        openVoiceModal();

        return;
    }


    const recognition =
        new Recognition();

    recognition.lang =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";

    recognition.interimResults =
        false;

    recognition.continuous =
        false;


    recognition.onstart =
        function () {

            console.log(
                "🎤 Listening..."
            );

        };


    recognition.onresult =
        function (event) {

            const result =
                event.results[0][0].transcript;

            console.log(
                "Voice result:",
                result
            );


            if (message) {

                message.value =
                    result;

            }

        };


    recognition.onerror =
        function (error) {

            console.error(
                "Speech recognition error:",
                error
            );

        };


    recognition.onend =
        function () {

            console.log(
                "🎤 Voice ended"
            );

        };


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Could not start microphone:",
            error
        );

    }

}


/* =================================================
   SPEAK
================================================= */

function speakText(text) {

    if (
        !text ||
        !("speechSynthesis" in window)
    ) {
        return;
    }


    window.speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.lang =
        localStorage.getItem(
            "viggoLanguage"
        ) || "en-IN";


    window.speechSynthesis.speak(
        utterance
    );

}


/* =================================================
   SIDEBAR
================================================= */

function openSideBar() {

    if (!sidebar) {
        return;
    }

    sidebar.classList.add("open");

    sidebar.style.transform =
        "translateX(0)";

}


function closeSideBar() {

    if (!sidebar) {
        return;
    }

    sidebar.classList.remove("open");

    /*
       Let existing CSS control it
       when possible.
    */

    if (
        window.innerWidth <= 768
    ) {

        sidebar.style.transform =
            "translateX(-100%)";

    }

}


/* =================================================
   MORE MENU
================================================= */

function toggleMoreMenu() {

    if (!moreMenu) {
        return;
    }

    const visible =
        moreMenu.classList.contains("show") ||
        moreMenu.style.display === "block" ||
        moreMenu.style.display === "flex";


    if (visible) {

        moreMenu.classList.remove("show");

        moreMenu.style.display =
            "none";

    } else {

        moreMenu.classList.add("show");

        moreMenu.style.display =
            "block";

    }

}


/* =================================================
   SHARE
================================================= */

async function shareViggo() {

    const text =
        "Viggo AI";


    if (
        navigator.share
    ) {

        try {

            await navigator.share({
                title: "Viggo AI",
                text: text,
                url: window.location.href
            });

        } catch (error) {

            console.log(
                "Share cancelled"
            );

        }

        return;
    }


    try {

        await navigator.clipboard.writeText(
            window.location.href
        );

        alert(
            "Viggo AI link copied."
        );

    } catch (error) {

        alert(
            "Share is not supported on this device."
        );

    }

}


/* =================================================
   NEW CHAT
================================================= */

function newChat() {

    console.log(
        "＋ New Chat clicked"
    );


    /*
       Use existing function if available.
    */

    if (
        typeof window.createNewChat ===
        "function"
    ) {

        window.createNewChat();

        return;
    }


    if (
        typeof window.newChat ===
        "function"
    ) {

        window.newChat();

        return;
    }


    /*
       Basic fallback
    */

    if (message) {
        message.value = "";
    }

    const conversation =
        get("conversation");

    if (conversation) {
        conversation.innerHTML = "";
    }

}


/* =================================================
   SEARCH
================================================= */

function searchChats() {

    const input =
        get("searchChat");

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();


    const history =
        get("chatHistory");

    if (!history) {
        return;
    }


    const items =
        history.children;


    for (
        let i = 0;
        i < items.length;
        i++
    ) {

        const item =
            items[i];

        const text =
            item.textContent
                .toLowerCase();


        item.style.display =
            !query ||
            text.includes(query)
                ? ""
                : "none";

    }

}


/* =================================================
   INITIALIZE
================================================= */

function initialize() {

    console.log(
        "Initializing all Viggo buttons..."
    );


    /* ELEMENTS */

    plusBtn =
        get("plusBtn");

    plusMenu =
        get("plusMenu");

    cameraBtn =
        get("cameraBtn");

    photoBtn =
        get("photoBtn");

    videoBtn =
        get("videoBtn");

    fileBtn =
        get("fileBtn");

    plusVoiceBtn =
        get("plusVoiceBtn");


    cameraInput =
        get("cameraInput");

    photoInput =
        get("photoInput");

    videoInput =
        get("videoInput");

    fileInput =
        get("fileInput");


    message =
        get("message");

    send =
        get("send");

    mic =
        get("mic");


    sidebar =
        get("sidebar");

    openSidebar =
        get("openSidebar");

    closeSidebar =
        get("closeSidebar");


    moreBtn =
        get("moreBtn");

    moreMenu =
        get("moreMenu");


    voiceModal =
        get("voiceModal");

    languageModal =
        get("languageModal");


    /* =================================================
       PLUS
    ================================================= */

    if (plusBtn) {

        plusBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                togglePlusMenu();

            }
        );

    }


    /* =================================================
       CAMERA
    ================================================= */

    if (cameraBtn) {

        cameraBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                openCamera();

            }
        );

    }


    /* =================================================
       PHOTO
    ================================================= */

    if (photoBtn) {

        photoBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                openPhoto();

            }
        );

    }


    /* =================================================
       VIDEO
    ================================================= */

    if (videoBtn) {

        videoBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                openVideo();

            }
        );

    }


    /* =================================================
       FILE
    ================================================= */

    if (fileBtn) {

        fileBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                openFile();

            }
        );

    }


    /* =================================================
       CAMERA INPUT
    ================================================= */

    if (cameraInput) {

        cameraInput.addEventListener(
            "change",
            function () {

                if (
                    this.files &&
                    this.files.length
                ) {

                    handleSelectedFile(
                        this.files[0],
                        "camera"
                    );

                }

            }
        );

    }


    /* =================================================
       PHOTO INPUT
    ================================================= */

    if (photoInput) {

        photoInput.addEventListener(
            "change",
            function () {

                if (
                    this.files &&
                    this.files.length
                ) {

                    handleSelectedFile(
                        this.files[0],
                        "photo"
                    );

                }

            }
        );

    }


    /* =================================================
       VIDEO INPUT
    ================================================= */

    if (videoInput) {

        videoInput.addEventListener(
            "change",
            function () {

                if (
                    this.files &&
                    this.files.length
                ) {

                    handleSelectedFile(
                        this.files[0],
                        "video"
                    );

                }

            }
        );

    }


    /* =================================================
       FILE INPUT
    ================================================= */

    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {

                if (
                    this.files &&
                    this.files.length
                ) {

                    handleSelectedFile(
                        this.files[0],
                        "file"
                    );

                }

            }
        );

    }


    /* =================================================
       VOICE MENU
    ================================================= */

    if (plusVoiceBtn) {

        plusVoiceBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                closePlusMenu();

                openVoiceModal();

            }
        );

    }


    /* =================================================
       MICROPHONE
    ================================================= */

    if (mic) {

        mic.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                startMicrophone();

            }
        );

    }


    /* =================================================
       SEND
    ================================================= */

    if (send) {

        send.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                sendCurrentMessage();

            }
        );

    }


    /* =================================================
       ENTER SEND
    ================================================= */

    if (message) {

        message.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendCurrentMessage();

                }

            }
        );


        /*
           Auto height
        */

        message.addEventListener(
            "input",
            function () {

                this.style.height =
                    "auto";

                this.style.height =
                    Math.min(
                        this.scrollHeight,
                        140
                    ) + "px";

            }
        );

    }


    /* =================================================
       OPEN SIDEBAR
    ================================================= */

    if (openSidebar) {

        openSidebar.addEventListener(
            "click",
            function () {

                openSideBar();

            }
        );

    }


    /* =================================================
       CLOSE SIDEBAR
    ================================================= */

    if (closeSidebar) {

        closeSidebar.addEventListener(
            "click",
            function () {

                closeSideBar();

            }
        );

    }


    /* =================================================
       MORE
    ================================================= */

    if (moreBtn) {

        moreBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                toggleMoreMenu();

            }
        );

    }


    /* =================================================
       VOICE MENU
    ================================================= */

    const voiceMenuBtn =
        get("voiceMenuBtn");

    if (voiceMenuBtn) {

        voiceMenuBtn.addEventListener(
            "click",
            function () {

                if (moreMenu) {

                    moreMenu.style.display =
                        "none";

                }

                openVoiceModal();

            }
        );

    }


    /* =================================================
       LANGUAGE
    ================================================= */

    const languageBtn =
        get("languageBtn");

    if (languageBtn) {

        languageBtn.addEventListener(
            "click",
            function () {

                if (moreMenu) {

                    moreMenu.style.display =
                        "none";

                }

                openLanguageModal();

            }
        );

    }


    /* =================================================
       CLOSE VOICE
    ================================================= */

    const closeVoice =
        get("closeVoice");

    if (closeVoice) {

        closeVoice.addEventListener(
            "click",
            function () {

                closeVoiceModal();

            }
        );

    }


    /* =================================================
       START VOICE
    ================================================= */

    const startVoice =
        get("startVoice");

    if (startVoice) {

        startVoice.addEventListener(
            "click",
            function () {

                closeVoiceModal();

                startMicrophone();

            }
        );

    }


    /* =================================================
       CLOSE LANGUAGE
    ================================================= */

    const closeLanguage =
        get("closeLanguage");

    if (closeLanguage) {

        closeLanguage.addEventListener(
            "click",
            function () {

                closeLanguageModal();

            }
        );

    }


    /* =================================================
       SAVE LANGUAGE
    ================================================= */

    const saveLanguage =
        get("saveLanguage");

    const languageSelect =
        get("languageSelect");

    if (
        saveLanguage &&
        languageSelect
    ) {

        saveLanguage.addEventListener(
            "click",
            function () {

                const language =
                    languageSelect.value;


                localStorage.setItem(
                    "viggoLanguage",
                    language
                );


                closeLanguageModal();


                console.log(
                    "Language saved:",
                    language
                );

            }
        );

    }


    /* =================================================
       NEW CHAT
    ================================================= */

    const newChatBtn =
        get("newChat");

    if (newChatBtn) {

        newChatBtn.addEventListener(
            "click",
            function () {

                newChat();

            }
        );

    }


    /* =================================================
       SEARCH
    ================================================= */

    const searchChat =
        get("searchChat");

    if (searchChat) {

        searchChat.addEventListener(
            "input",
            searchChats
        );

    }


    /* =================================================
       SHARE
    ================================================= */

    const shareBtn =
        get("shareBtn");

    if (shareBtn) {

        shareBtn.addEventListener(
            "click",
            function () {

                shareViggo();

            }
        );

    }


    /* =================================================
       SELECT CHATS
    ================================================= */

    const selectChatsBtn =
        get("selectChatsBtn");

    if (selectChatsBtn) {

        selectChatsBtn.addEventListener(
            "click",
            function () {

                if (
                    typeof window.selectChats ===
                    "function"
                ) {

                    window.selectChats();

                } else {

                    alert(
                        "Chat selection mode"
                    );

                }

            }
        );

    }


    /* =================================================
       DELETE SELECTED
    ================================================= */

    const deleteSelectedBtn =
        get("deleteSelectedBtn");

    if (deleteSelectedBtn) {

        deleteSelectedBtn.addEventListener(
            "click",
            function () {

                if (
                    typeof window.deleteSelectedChats ===
                    "function"
                ) {

                    window.deleteSelectedChats();

                } else {

                    console.warn(
                        "deleteSelectedChats() not found"
                    );

                }

            }
        );

    }


    /* =================================================
       CLEAR CHAT
    ================================================= */

    const clearChatBtn =
        get("clearChatBtn");

    if (clearChatBtn) {

        clearChatBtn.addEventListener(
            "click",
            function () {

                if (
                    typeof window.clearChat ===
                    "function"
                ) {

                    window.clearChat();

                } else {

                    const conversation =
                        get("conversation");

                    if (conversation) {

                        conversation.innerHTML =
                            "";

                    }

                }

            }
        );

    }


    /* =================================================
       CLOSE MENUS WHEN CLICK OUTSIDE
    ================================================= */

    document.addEventListener(
        "click",
        function (event) {

            if (
                plusMenu &&
                plusBtn &&
                !plusMenu.contains(
                    event.target
                ) &&
                event.target !== plusBtn
            ) {

                closePlusMenu();

            }


            if (
                moreMenu &&
                moreBtn &&
                !moreMenu.contains(
                    event.target
                ) &&
                event.target !== moreBtn
            ) {

                moreMenu.classList.remove(
                    "show"
                );

                moreMenu.style.display =
                    "none";

            }

        }
    );


    /* =================================================
       MOBILE SIDEBAR
    ================================================= */

    window.addEventListener(
        "resize",
        function () {

            if (
                window.innerWidth > 768 &&
                sidebar
            ) {

                sidebar.style.transform =
                    "";

            }

        }
    );


    /* =================================================
       ESCAPE
    ================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closePlusMenu();

                closeVoiceModal();

                closeLanguageModal();

                if (moreMenu) {

                    moreMenu.style.display =
                        "none";

                }

            }

        }
    );


    /* =================================================
       READY
    ================================================= */

    console.log(
        "================================="
    );

    console.log(
        "✓ ALL VIGGO BUTTONS CONNECTED"
    );

    console.log(
        "✓ MOBILE CAMERA READY"
    );

    console.log(
        "✓ PHOTO READY"
    );

    console.log(
        "✓ VIDEO READY"
    );

    console.log(
        "✓ FILE READY"
    );

    console.log(
        "✓ VOICE READY"
    );

    console.log(
        "✓ SEND READY"
    );

    console.log(
        "================================="
    );

}


/* =====================================================
   DOM READY
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

} else {

    initialize();

}


})();
