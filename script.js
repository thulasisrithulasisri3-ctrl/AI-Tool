document.addEventListener("DOMContentLoaded", () => {
    console.log("VIGGO BUTTON SYSTEM LOADED");

    const cameraInput = document.getElementById("cameraInput");
    const photoInput = document.getElementById("photoInput");
    const videoInput = document.getElementById("videoInput");
    const fileInput = document.getElementById("fileInput");

    const cameraButton =
        document.getElementById("cameraButton");

    const photoButton =
        document.getElementById("photoButton");

    const videoButton =
        document.getElementById("videoButton");

    const fileButton =
        document.getElementById("fileButton");

    if (cameraButton && cameraInput) {
        cameraButton.onclick = () => {
            cameraInput.click();
        };
    }

    if (photoButton && photoInput) {
        photoButton.onclick = () => {
            photoInput.click();
        };
    }

    if (videoButton && videoInput) {
        videoButton.onclick = () => {
            videoInput.click();
        };
    }

    if (fileButton && fileInput) {
        fileButton.onclick = () => {
            fileInput.click();
        };
    }

    console.log("Camera:", !!cameraButton, !!cameraInput);
    console.log("Photo:", !!photoButton, !!photoInput);
    console.log("Video:", !!videoButton, !!videoInput);
    console.log("Files:", !!fileButton, !!fileInput);
});
