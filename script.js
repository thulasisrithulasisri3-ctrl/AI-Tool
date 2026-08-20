function addMessage(message, index) {

    const row = document.createElement("div");

    row.className =
        "message-row " +
        (message.role === "user" ? "user" : "ai");


    const wrapper =
        document.createElement("div");

    wrapper.className = "message";


    /* MESSAGE */

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message.text;

    wrapper.appendChild(bubble);


    /* ACTION BAR */

    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";


    /* =========================
       SPEAKER
    ========================= */

    const speaker =
        document.createElement("button");

    speaker.className =
        "message-action speaker-button";

    speaker.type = "button";

    speaker.textContent =
        "🔊 Voice";


    speaker.addEventListener(
        "click",
        function () {

            /* STOP */

            if (
                window.speechSynthesis.speaking
            ) {

                window.speechSynthesis.cancel();

                speaker.textContent =
                    "🔊 Voice";

                speaker.classList.remove(
                    "active"
                );

                return;
            }


            /* START */

            const utterance =
                new SpeechSynthesisUtterance(
                    message.text
                );


            /* LANGUAGE */

            const voiceLanguages = {

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
                voiceLanguages[
                    selectedLanguage
                ] || "en-IN";


            /* MALE / FEMALE */

            const voices =
                window.speechSynthesis
                    .getVoices();


            const matching =
                voices.filter(
                    voice =>
                        voice.lang
                            .toLowerCase()
                            .startsWith(
                                utterance.lang
                                    .split("-")[0]
                                    .toLowerCase()
                            )
                );


            if (matching.length) {

                const female =
                    matching.find(
                        voice =>
                            /female|zira|samantha|google uk english female|google हिन्दी female/i
                                .test(
                                    voice.name
                                )
                    );


                const male =
                    matching.find(
                        voice =>
                            /male|david|alex|google uk english male/i
                                .test(
                                    voice.name
                                )
                    );


                if (
                    selectedVoice === "female" &&
                    female
                ) {

                    utterance.voice =
                        female;

                } else if (
                    selectedVoice === "male" &&
                    male
                ) {

                    utterance.voice =
                        male;

                } else {

                    utterance.voice =
                        matching[0];

                }

            }


            /* SPEED */

            utterance.rate =
                0.95;

            utterance.pitch =
                selectedVoice === "female"
                    ? 1.05
                    : 0.85;


            /* START EVENT */

            utterance.onstart =
                function () {

                    speaker.textContent =
                        "🔇 Stop";

                    speaker.classList.add(
                        "active"
                    );

                };


            /* END EVENT */

            utterance.onend =
                function () {

                    speaker.textContent =
                        "🔊 Voice";

                    speaker.classList.remove(
                        "active"
                    );

                };


            /* ERROR */

            utterance.onerror =
                function () {

                    speaker.textContent =
                        "🔊 Voice";

                    speaker.classList.remove(
                        "active"
                    );

                };


            window.speechSynthesis
                .cancel();


            window.speechSynthesis
                .speak(
                    utterance
                );

        }
    );


    /* =========================
       COPY
    ========================= */

    const copy =
        document.createElement("button");

    copy.className =
        "message-action";

    copy.type = "button";

    copy.textContent =
        "📋 Copy";


    copy.addEventListener(
        "click",
        async function () {

            try {

                await navigator.clipboard
                    .writeText(
                        message.text
                    );

                copy.textContent =
                    "✓ Copied";

                setTimeout(
                    function () {

                        copy.textContent =
                            "📋 Copy";

                    },
                    1200
                );

            } catch {

                alert(
                    "Copy failed."
                );

            }

        }
    );


    /* =========================
       SHARE
    ========================= */

    const share =
        document.createElement("button");

    share.className =
        "message-action";

    share.type = "button";

    share.textContent =
        "🔗 Share";


    share.addEventListener(
        "click",
        function () {

            shareMessage(
                message.text
            );

        }
    );


    /* =========================
       LIKE
    ========================= */

    const like =
        document.createElement("button");

    like.className =
        "like-button";

    like.type = "button";


    updateLikeButton(
        like,
        message.liked === true
    );


    like.addEventListener(
        "click",
        function () {

            message.liked =
                !message.liked;


            updateLikeButton(
                like,
                message.liked
            );


            saveChats();

        }
    );


    /* ADD BUTTONS */

    actions.appendChild(
        speaker
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


    wrapper.appendChild(
        actions
    );


    row.appendChild(
        wrapper
    );


    chatArea.appendChild(
        row
    );

}
