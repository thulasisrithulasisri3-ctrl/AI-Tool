
"use strict";

/* =====================================================
   VIGGO BUTTON + UPLOAD SYSTEM
===================================================== */

(function () {

    console.log("=================================");
    console.log("VIGGO BUTTON SYSTEM STARTING...");
    console.log("=================================");

    /* =================================================
       GET ELEMENT
    ================================================= */

    function get(id) {
        return document.getElementById(id);
    }

    /* =================================================
       CREATE INPUT IF MISSING
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

        /* INPUTS */

        const cameraInput =
            createInput(
                "cameraInput",
                "image/*",
                "environment"
            );

        const photoInput =
            createInput(
                "photoInput",
                "image/*"
            );

        const videoInput =
            createInput(
                "videoInput",
                "video/*"
            );

        const fileInput =
            createInput(
                "fileInput",
                ".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,video/*"
            );

        /* BUTTONS */

        const cameraButton =
            get("cameraButton");

        const photoButton =
            get("photoButton");

        const videoButton =
            get("videoButton");

        const fileButton =
            get("fileButton");

        console.log(
            "Camera button:",
            cameraButton
        );

        console.log(
            "Photo button:",
            photoButton
        );

        console.log(
            "Video button:",
            videoButton
        );

        console.log(
            "File button:",
            fileButton
        );

        /* =================================================
           CAMERA
        ================================================= */

        if (cameraButton) {

            cameraButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    console.log(
                        "📷 CAMERA BUTTON CLICKED"
                    );

                    cameraInput.value = "";

                    cameraInput.click();
                }
            );

        } else {

            console.warn(
                "⚠ cameraButton not found"
            );
        }

        /* =================================================
           PHOTO
        ================================================= */

        if (photoButton) {

            photoButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    console.log(
                        "🖼️ PHOTO BUTTON CLICKED"
                    );

                    photoInput.value = "";

                    photoInput.click();
                }
            );

        } else {

            console.warn(
                "⚠ photoButton not found"
            );
        }

        /* =================================================
           VIDEO
        ================================================= */

        if (videoButton) {

            videoButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    console.log(
                        "🎥 VIDEO BUTTON CLICKED"
                    );

                    videoInput.value = "";

                    videoInput.click();
                }
            );

        } else {

            console.warn(
                "⚠ videoButton not found"
            );
        }

        /* =================================================
           FILE
        ================================================= */

        if (fileButton) {

            fileButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    console.log(
                        "📁 FILE BUTTON CLICKED"
                    );

                    fileInput.value = "";

                    fileInput.click();
                }
            );

        } else {

            console.warn(
                "⚠ fileButton not found"
            );
        }

        /* =================================================
           FILE SELECTED
        ================================================= */

        cameraInput.addEventListener(
            "change",
            function () {

                if (!this.files || !this.files.length) {
                    return;
                }

                const file = this.files[0];

                console.log(
                    "📷 Camera file selected:",
                    file.name,
                    file.type,
                    file.size
                );

                handleSelectedFile(file, "camera");
            }
        );

        photoInput.addEventListener(
            "change",
            function () {

                if (!this.files || !this.files.length) {
                    return;
                }

                const file = this.files[0];

                console.log(
                    "🖼️ Photo selected:",
                    file.name,
                    file.type,
                    file.size
                );

                handleSelectedFile(file, "photo");
            }
        );

        videoInput.addEventListener(
            "change",
            function () {

                if (!this.files || !this.files.length) {
                    return;
                }

                const file = this.files[0];

                console.log(
                    "🎥 Video selected:",
                    file.name,
                    file.type,
                    file.size
                );

                handleSelectedFile(file, "video");
            }
        );

        fileInput.addEventListener(
            "change",
            function () {

                if (!this.files || !this.files.length) {
                    return;
                }

                const file = this.files[0];

                console.log(
                    "📁 File selected:",
                    file.name,
                    file.type,
                    file.size
                );

                handleSelectedFile(file, "file");
            }
        );

        console.log(
            "================================="
        );

        console.log(
            "✓ VIGGO BUTTON SYSTEM READY"
        );

        console.log(
            "================================="
        );
    }

    /* =================================================
       HANDLE SELECTED FILE
    ================================================= */

    function handleSelectedFile(file, source) {

        if (!file) {
            return;
        }

        console.log(
            "Processing:",
            source,
            file.name
        );

        /* =================================================
           SIZE CHECK
        ================================================= */

        const maxSize =
            20 * 1024 * 1024;

        if (file.size > maxSize) {

            alert(
                "File is too large. Please choose a file smaller than 20 MB."
            );

            return;
        }

        /* =================================================
           PREVIEW
        ================================================= */

        showLocalPreview(file);

        /* =================================================
           USE EXISTING UPLOAD FUNCTION
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

        /* =================================================
           ALTERNATIVE FUNCTION NAMES
        ================================================= */

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

        /* =================================================
           NO UPLOAD FUNCTION
        ================================================= */

        console.warn(
            "No upload function found."
        );

        console.log(
            "Selected file:",
            file
        );
    }

    /* =================================================
       LOCAL PREVIEW
    ================================================= */

    function showLocalPreview(file) {

        try {

            const oldPreview =
                document.getElementById(
                    "viggoUploadPreview"
                );

            if (oldPreview) {
                oldPreview.remove();
            }

            const preview =
                document.createElement("div");

            preview.id =
                "viggoUploadPreview";

            preview.style.cssText =
                `
                position:fixed;
                left:20px;
                right:20px;
                bottom:20px;
                z-index:99999;
                background:#111;
                border:1px solid #333;
                border-radius:14px;
                padding:12px;
                box-sizing:border-box;
                `;

            const title =
                document.createElement("div");

            title.textContent =
                "Selected: " + file.name;

            title.style.cssText =
                `
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

                img.style.cssText =
                    `
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

                video.style.cssText =
                    `
                    display:block;
                    width:100%;
                    max-height:280px;
                    border-radius:10px;
                    `;

                preview.appendChild(video);
            }

            document.body.appendChild(
                preview
            );

            setTimeout(() => {

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
       START AFTER DOM
    ================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeButtons
        );

    } else {

        initializeButtons();
    }

})();

