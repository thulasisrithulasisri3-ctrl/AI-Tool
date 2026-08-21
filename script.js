"use strict";

// =========================================
// PLUS BUTTON
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const plusBtn = document.getElementById("plusBtn");
    const plusMenu = document.getElementById("plusMenu");

    if (!plusBtn) {
        console.error("Plus button not found: #plusBtn");
        return;
    }

    if (!plusMenu) {
        console.error("Plus menu not found: #plusMenu");
        return;
    }

    // Open / Close Plus Menu
    plusBtn.addEventListener("click", function (event) {

        event.preventDefault();
        event.stopPropagation();

        plusMenu.classList.toggle("show");

    });


    // Prevent menu click from closing immediately
    plusMenu.addEventListener("click", function (event) {

        event.stopPropagation();

    });


    // Close when clicking outside
    document.addEventListener("click", function () {

        plusMenu.classList.remove("show");

    });


    // =========================================
    // PLUS MENU BUTTONS
    // =========================================

    const plusButtons = plusMenu.querySelectorAll("button");

    plusButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const text = button.textContent.trim();

            console.log("Plus menu:", text);

            // Voice
            if (button.id === "plusVoiceBtn") {

                const voiceModal =
                    document.getElementById("voiceModal");

                if (voiceModal) {
                    voiceModal.classList.add("show");
                }

                plusMenu.classList.remove("show");

                return;
            }

            // Photo
            if (text.includes("Photo")) {

                console.log("Photo selected");

                plusMenu.classList.remove("show");

                return;
            }

            // Video
            if (text.includes("Video")) {

                console.log("Video selected");

                plusMenu.classList.remove("show");

                return;
            }

            // File
            if (text.includes("File")) {

                console.log("File selected");

                plusMenu.classList.remove("show");

                return;
            }

        });

    });

});
