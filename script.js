```html
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Viggo AI</title>

    <link
        rel="stylesheet"
        href="style.css"
    >

</head>


<body>

<!-- =====================================================
     APP
===================================================== -->

<div id="app">


    <!-- =================================================
         SIDEBAR
    ================================================== -->

    <aside
        id="sidebar"
        class="sidebar"
    >

        <!-- SIDEBAR HEADER -->

        <div class="sidebar-header">

            <div class="brand">

                <div class="brand-logo">
                    V
                </div>

                <span>
                    Viggo
                </span>

            </div>


            <!-- CLOSE BUTTON -->

            <button
                id="closeSidebarBtn"
                class="icon-btn"
                type="button"
                title="Close sidebar"
                aria-label="Close sidebar"
            >
                ×
            </button>

        </div>


        <!-- NEW CHAT -->

        <button
            id="newChatBtn"
            class="new-chat-btn"
            type="button"
        >

            <span>
                ＋
            </span>

            <span>
                New Chat
            </span>

        </button>


        <!-- HISTORY -->

        <div
            id="historyList"
            class="history-list"
        >
        </div>


        <!-- SIDEBAR BOTTOM -->

        <div class="sidebar-bottom">

            <button
                id="selectChatsBtn"
                class="sidebar-btn"
                type="button"
            >
                ☑ Select Chats
            </button>


            <button
                id="deleteSelectedBtn"
                class="sidebar-btn delete-selected"
                type="button"
                style="display:none;"
            >
                🗑 Delete Selected
            </button>

        </div>

    </aside>



    <!-- =================================================
         MAIN
    ================================================== -->

    <main class="main">


        <!-- =================================================
             TOP BAR
        ================================================== -->

        <header class="topbar">


            <!-- MOBILE MENU -->

            <button
                id="mobileMenuBtn"
                class="icon-btn"
                type="button"
                title="Menu"
                aria-label="Open sidebar"
            >
                ☰
            </button>


            <!-- TITLE -->

            <div class="top-title">

                <span id="chatTitle">
                    New Chat
                </span>

            </div>


            <!-- TOP ACTIONS -->

            <div class="top-actions">


                <!-- SHARE -->

                <button
                    id="shareBtn"
                    class="icon-btn"
                    type="button"
                    title="Share"
                    aria-label="Share chat"
                >
                    ↗
                </button>


                <!-- MORE -->

                <div class="sidebar-more">

                    <button
                        id="moreBtn"
                        class="icon-btn"
                        type="button"
                        title="More"
                        aria-label="More options"
                    >
                        ⋮
                    </button>


                    <!-- MORE MENU -->

                    <div
                        id="moreMenu"
                        class="more-menu"
                    >

                        <button
                            id="saveBtn"
                            type="button"
                            class="menu-item"
                        >
                            💾 Save Chat
                        </button>


                        <button
                            id="clearHistoryBtn"
                            type="button"
                            class="menu-item"
                        >
                            🗑 Clear History
                        </button>


                        <div class="language-title">
                            Language
                        </div>


                        <button
                            type="button"
                            class="menu-item"
                            data-language="en"
                        >
                            🇬🇧 English
                        </button>


                        <button
                            type="button"
                            class="menu-item"
                            data-language="ta"
                        >
                            தமிழ்
                        </button>


                        <button
                            type="button"
                            class="menu-item"
                            data-language="hi"
                        >
                            हिन्दी
                        </button>


                        <button
                            type="button"
                            class="menu-item"
                            data-language="ml"
                        >
                            മലയാളം
                        </button>


                        <button
                            type="button"
                            class="menu-item"
                            data-language="te"
                        >
                            తెలుగు
                        </button>


                        <button
                            type="button"
                            class="menu-item"
                            data-language="kn"
                        >
                            ಕನ್ನಡ
                        </button>

                    </div>

                </div>

            </div>

        </header>



        <!-- =================================================
             MESSAGES
        ================================================== -->

        <section
            id="messages"
            class="messages"
        >
        </section>



        <!-- =================================================
             INPUT AREA
        ================================================== -->

        <footer class="input-container">


            <div class="chat-input-area">


                <!-- =========================================
                     LEFT SIDE
                ========================================== -->

                <div class="input-left">


                    <!-- PLUS BUTTON -->

                    <button
                        id="attachBtn"
                        class="input-icon-btn"
                        type="button"
                        title="Attach"
                        aria-label="Attach"
                    >
                        +
                    </button>



                    <!-- =====================================
                         ATTACHMENT MENU
                    ====================================== -->

                    <div
                        id="attachmentMenu"
                        class="attachment-menu"
                    >


                        <!-- PHOTO -->

                        <button
                            id="photoBtn"
                            class="attachment-option"
                            type="button"
                        >

                            <span
                                class="attachment-icon"
                            >
                                📷
                            </span>

                            <span>
                                Photo
                            </span>

                        </button>



                        <!-- VIDEO -->

                        <button
                            id="videoBtn"
                            class="attachment-option"
                            type="button"
                        >

                            <span
                                class="attachment-icon"
                            >
                                🎥
                            </span>

                            <span>
                                Video
                            </span>

                        </button>



                        <!-- FILE -->

                        <button
                            id="fileBtn"
                            class="attachment-option"
                            type="button"
                        >

                            <span
                                class="attachment-icon"
                            >
                                📎
                            </span>

                            <span>
                                File
                            </span>

                        </button>


                    </div>



                    <!-- =====================================
                         HIDDEN FILE INPUTS
                    ====================================== -->

                    <input
                        id="photoInput"
                        type="file"
                        accept="image/*"
                        hidden
                    >


                    <input
                        id="videoInput"
                        type="file"
                        accept="video/*"
                        hidden
                    >


                    <input
                        id="fileInput"
                        type="file"
                        hidden
                    >



                    <!-- =====================================
                         MESSAGE INPUT
                    ====================================== -->

                    <textarea
                        id="messageInput"
                        class="message-input"
                        rows="1"
                        placeholder="Message Viggo..."
                        autocomplete="off"
                    ></textarea>


                </div>



                <!-- =========================================
                     RIGHT SIDE
                ========================================== -->

                <div class="input-right">


                    <!-- VOICE -->

                    <button
                        id="voiceBtn"
                        class="input-icon-btn"
                        type="button"
                        title="Voice"
                        aria-label="Voice input"
                    >
                        🎤
                    </button>



                    <!-- SEND -->

                    <button
                        id="sendBtn"
                        class="send-btn"
                        type="button"
                        title="Send"
                        aria-label="Send message"
                    >
                        ➤
                    </button>


                </div>


            </div>


            <!-- FOOTER TEXT -->

            <div class="input-note">
                Viggo AI can make mistakes. Check important information.
            </div>


        </footer>


    </main>

</div>



<!-- =====================================================
     ATTACHMENT SCRIPT
===================================================== -->

<script>

"use strict";


document.addEventListener(
    "DOMContentLoaded",
    function () {


        const attachBtn =
            document.getElementById(
                "attachBtn"
            );


        const attachmentMenu =
            document.getElementById(
                "attachmentMenu"
            );


        const photoBtn =
            document.getElementById(
                "photoBtn"
            );


        const videoBtn =
            document.getElementById(
                "videoBtn"
            );


        const fileBtn =
            document.getElementById(
                "fileBtn"
            );


        const photoInput =
            document.getElementById(
                "photoInput"
            );


        const videoInput =
            document.getElementById(
                "videoInput"
            );


        const fileInput =
            document.getElementById(
                "fileInput"
            );



        /* ===============================================
           PLUS
        =============================================== */

        attachBtn?.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                attachmentMenu?.classList.toggle(
                    "show"
                );

            }
        );



        /* ===============================================
           PHOTO
        =============================================== */

        photoBtn?.addEventListener(
            "click",
            function () {

                photoInput?.click();

            }
        );



        /* ===============================================
           VIDEO
        =============================================== */

        videoBtn?.addEventListener(
            "click",
            function () {

                videoInput?.click();

            }
        );



        /* ===============================================
           FILE
        =============================================== */

        fileBtn?.addEventListener(
            "click",
            function () {

                fileInput?.click();

            }
        );



        /* ===============================================
           FILE SELECTED
        =============================================== */

        function handleFile(
            input,
            type
        ) {

            input?.addEventListener(
                "change",
                function () {

                    const file =
                        input.files?.[0];

                    if (!file)
                        return;


                    const messageInput =
                        document.getElementById(
                            "messageInput"
                        );


                    if (messageInput) {

                        messageInput.value =
                            "📎 " +
                            type +
                            ": " +
                            file.name;

                        messageInput.focus();

                    }


                    attachmentMenu?.classList.remove(
                        "show"
                    );

                }
            );

        }


        handleFile(
            photoInput,
            "Photo"
        );


        handleFile(
            videoInput,
            "Video"
        );


        handleFile(
            fileInput,
            "File"
        );



        /* ===============================================
           OUTSIDE CLICK
        =============================================== */

        document.addEventListener(
            "click",
            function (event) {

                if (
                    !event.target.closest(
                        ".input-left"
                    )
                ) {

                    attachmentMenu?.classList.remove(
                        "show"
                    );

                }

            }
        );


    }
);

</script>



<!-- =====================================================
     MAIN SCRIPT
===================================================== -->

<script src="script.js"></script>


</body>

</html>
```
