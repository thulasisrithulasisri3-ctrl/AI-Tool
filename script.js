/* PLUS → IMAGE UPLOAD */

$("plusBtn")?.addEventListener(
    "click",
    () => {

        $("imageInput")?.click();

    }
);


/* IMAGE SELECTED */

$("imageInput")?.addEventListener(
    "change",
    event => {

        const files =
            Array.from(
                event.target.files || []
            );

        if (!files.length) return;

        showToast(
            `📷 ${files.length} image${files.length > 1 ? "s" : ""} selected`
        );

        files.forEach(file => {

            console.log(
                "Selected image:",
                file.name
            );

        });

    }
);
