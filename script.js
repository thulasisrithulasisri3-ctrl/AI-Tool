"use strict";

/* =====================================================
VIGGO BUTTON + UPLOAD SYSTEM
MATCHES CURRENT INDEX.HTML
===================================================== */

(function () {

```
console.log("=================================");
console.log("VIGGO BUTTON SYSTEM STARTING...");
console.log("=================================");

function get(id) {
    return document.getElementById(id);
}

/* =================================================
   CREATE FILE INPUT
================================================= */

function createInput(id, accept, capture) {

    let input = get(id);

    if (!input) {

        input = document.createElement("input");

        input.id = id;
        input.type = "file";
        input.accept = accept || "*/*";
        input.style.display = "none";

        if (capture) {
            input.setAttribute("capture", capture);
        }

        document.body.appendChild(input);

        console.log("Created input:", id);
    }

    return input;
}


/* =================================================
   INITIALIZE
================================================= */

function initializeButtons() {

    console.log("Initializing Viggo buttons...");


    /* =================================================
       INPUTS
    ================================================= */

    const cameraInput = createInput(
        "cameraInput",
        "image/*",
        "environment"
    );

    const photoInput = createInput(
        "photoInput",
        "image/*"
    );

    const videoInput = createInput(
        "videoInput",
        "video/*"
    );

    const fileInput = createInput(
        "fileInput",
        ".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,video/*"
    );


    /* =================================================
       CURRENT HTML BUTTONS
    ================================================= */

    const plusBtn = get("plusBtn");
    const plusMenu = get("plusMenu");

    const cameraBtn = get("cameraBtn");
    const photoBtn = get("photoBtn");
    const videoBtn = get("videoBtn");
    const fileBtn = get("fileBtn");

    const plusVoiceBtn = get("plusVoiceBtn");
    const mic = get("mic");

    const send = get("send");
    const message = get("message");


    console.log("plusBtn:", plusBtn);
    console.log("plusMenu:", plusMenu);
    console.log("cameraBtn:", cameraBtn);
    console.log("photoBtn:", photoBtn);
    console.log("videoBtn:", videoBtn);
    console.log("fileBtn:", fileBtn);


    /* =================================================
       PLUS BUTTON
    ================================================= */

    if (plusBtn && plusMenu) {

        plusBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            const isOpen =
                plusMenu.classList.contains("show") ||
                plusMenu.style.display === "block";

            if (isOpen) {

                plusMenu.classList.remove("show");
                plusMenu.style.display = "none";

            } else {

                plusMenu.classList.add("show");
                plusMenu.style.display = "flex";

            }

            console.log("PLUS MENU:", !isOpen);
        });

    }


    /* =================================================
       CLOSE PLUS MENU
    ================================================= */

    document.addEventListener("click", function (event) {

        if (
            plusMenu &&
            plusBtn &&
            !plusMenu.contains(event.target) &&
            event.target !== plusBtn
        ) {

            plusMenu.classList.remove("show");
            plusMenu.style.display = "none";
        }

    });


    /* =================================================
       CAMERA
    ================================================= */

    if (cameraBtn) {

        cameraBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            console.log("📷 CAMERA CLICKED");

            closePlusMenu();

            cameraInput.value = "";

            cameraInput.click();

        });

    }


    /* =================================================
       PHOTO
    ================================================= */

    if (photoBtn) {

        photoBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            console.log("🖼️ PHOTO CLICKED");

            closePlusMenu();

            photoInput.value = "";

            photoInput.click();

        });

    }


    /* =================================================
       VIDEO
    ================================================= */

    if (videoBtn) {

        videoBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            console.log("🎥 VIDEO CLICKED");

            closePlusMenu();

            videoInput.value = "";

            videoInput.click();

        });

    }


    /* =================================================
       FILE
    ================================================= */

    if (fileBtn) {

        fileBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            console.log("📎 FILE CLICKED");

            closePlusMenu();

            fileInput.value = "";

            fileInput.click();

        });

    }


    /* =================================================
       CLOSE PLUS MENU FUNCTION
    ================================================= */

    function closePlusMenu() {

        if (plusMenu) {

            plusMenu.classList.remove("show");
            plusMenu.style.display = "none";

        }
    }


    /* =================================================
       FILE CHANGE
    ================================================= */

    cameraInput.addEventListener("change", function () {

        if (!this.files || !this.files.length) {
            return;
        }

        handleSelectedFile(
            this.files[0],
            "camera"
        );

    });


    photoInput.addEventListener("change", function () {

        if (!this.files || !this.files.length) {
            return;
        }

        handleSelectedFile(
            this.files[0],
            "photo"
        );

    });


    videoInput.addEventListener("change", function () {

        if (!this.files || !this.files.length) {
            return;
        }

        handleSelectedFile(
            this.files[0],
            "video"
        );

    });


    fileInput.addEventListener("change", function () {

        if (!this.files || !this.files.length) {
            return;
        }

        handleSelectedFile(
            this.files[0],
            "file"
        );

    });


    /* =================================================
       HANDLE FILE
    ================================================= */

    function handleSelectedFile(file, source) {

        if (!file) {
            return;
        }

        console.log(
            "Selected:",
            source,
            file.name,
            file.type,
            file.size
        );


        /* 20 MB LIMIT */

        const maxSize =
            20 * 1024 * 1024;

        if (file.size > maxSize) {

            alert(
                "File is too large. Maximum size is 20 MB."
            );

            return;
        }


        /* PREVIEW */

        showLocalPreview(file);


        /* =================================================
           EXISTING VIGGO UPLOAD FUNCTION
        ================================================= */

        if (
            typeof window.sendUploadedFile ===
            "function"
        ) {

            console.log(
                "Using sendUploadedFile()"
            );

            window.sendUploadedFile(file);

            return;
        }


        if (
            typeof window.uploadFile ===
            "function"
        ) {

            console.log(
                "Using uploadFile()"
            );

            window.uploadFile(file);

            return;
        }


        if (
            typeof window.handleFileUpload ===
            "function"
        ) {

            console.log(
                "Using handleFileUpload()"
            );

            window.handleFileUpload(file);

            return;
        }

        console.warn(
            "No upload function found."
        );

    }


    /* =================================================
       LOCAL PREVIEW
    ================================================= */

    function showLocalPreview(file) {

        try {

            const old =
                get("viggoUploadPreview");

            if (old) {
                old.remove();
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
                z-index:99999;
                background:#101722;
                border:1px solid #26364d;
                border-radius:14px;
                padding:12px;
                box-sizing:border-box;
            `;


            const title =
                document.createElement("div");

            title.textContent =
                "Selected: " + file.name;

            title.style.cssText = `
                color:white;
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

                const img =
                    document.createElement("img");

                img.src =
                    URL.createObjectURL(file);

                img.style.cssText = `
                    display:block;
                    width:100%;
                    max-height:280px;
                    object-fit:contain;
                    border-radius:10px;
                `;

                preview.appendChild(img);
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


            setTimeout(function () {

                if (preview.parentNode) {
                    preview.remove();
                }

            }, 5000);

        } catch (error) {

            console.error(
                "Preview error:",
                error
            );

        }

    }


    /* =================================================
       VOICE BUTTON
    ================================================= */

    if (plusVoiceBtn) {

        plusVoiceBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                closePlusMenu();

                const voiceModal =
                    get("voiceModal");

                if (voiceModal) {

                    voiceModal.style.display =
                        "flex";

                }

            }
        );

    }


    /* =================================================
       MICROPHONE
    ================================================= */

    if (mic) {

        mic.addEventListener(
            "click",
            function () {

                console.log(
                    "🎤 MICROPHONE CLICKED"
                );

                const voiceModal =
                    get("voiceModal");

                if (voiceModal) {

                    voiceModal.style.display =
                        "flex";

                }

            }
        );

    }


    /* =================================================
       VOICE CLOSE
    ================================================= */

    const closeVoice =
        get("closeVoice");

    if (closeVoice) {

        closeVoice.addEventListener(
            "click",
            function () {

                const voiceModal =
                    get("voiceModal");

                if (voiceModal) {
                    voiceModal.style.display =
                        "none";
                }

            }
        );

    }


    /* =================================================
       LANGUAGE
    ================================================= */

    const languageBtn =
        get("languageBtn");

    const languageModal =
        get("languageModal");

    const closeLanguage =
        get("closeLanguage");

    if (languageBtn && languageModal) {

        languageBtn.addEventListener(
            "click",
            function () {

                languageModal.style.display =
                    "flex";

            }
        );

    }

    if (closeLanguage && languageModal) {

        closeLanguage.addEventListener(
            "click",
            function () {

                languageModal.style.display =
                    "none";

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

    if (saveLanguage && languageSelect) {

        saveLanguage.addEventListener(
            "click",
            function () {

                const language =
                    languageSelect.value;

                localStorage.setItem(
                    "viggoLanguage",
                    language
                );

                if (languageModal) {

                    languageModal.style.display =
                        "none";

                }

                console.log(
                    "Language saved:",
                    language
                );

            }
        );

    }


    /* =================================================
       SEND BUTTON
    ================================================= */

    if (send && message) {

        send.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                const text =
                    message.value.trim();

                if (!text) {
                    return;
                }


                if (
                    typeof window.sendMessage ===
                    "function"
                ) {

                    window.sendMessage(text);

                } else {

                    console.warn(
                        "sendMessage() not found"
                    );

                }

            }
        );

    }


    /* =================================================
       ENTER TO SEND
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

                    if (send) {
                        send.click();
                    }

                }

            }
        );

    }


    console.log("=================================");
    console.log("✓ VIGGO BUTTON SYSTEM READY");
    console.log("=================================");

}


/* =====================================================
   START AFTER DOM
===================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeButtons
    );

} else {

    initializeButtons();

}


})();
