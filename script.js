/* =====================================================
CALCULATOR PRO / VAULT PRO
Complete script.js
Default PIN: 2580
===================================================== */

/* =====================================================
STORAGE LIMITS & APP STATE
===================================================== */

const FREE_LIMIT = 1024 * 1024 * 1024; // 1 GB
const PREMIUM_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB

const SECRET_CODE = "2580";

let isPremium = false;

let localFiles = [];

let calculatorExpression = "";

let enteredPin = "";

let userPin = localStorage.getItem("vault_pin") || "2580";

let pinMode = "normal";

let newPin = "";

let currentFilter = "all";

/* =====================================================
INDEXEDDB
===================================================== */

const DB_NAME = "VaultStorageDB";
const DB_VERSION = 1;
const STORE_NAME = "files";

function openDB() {

return new Promise((resolve, reject) => {

    const request = indexedDB.open(DB_NAME, DB_VERSION);


    request.onupgradeneeded = function (event) {

        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {

            db.createObjectStore(STORE_NAME, {
                keyPath: "id",
                autoIncrement: true
            });

        }

    };


    request.onsuccess = function () {

        resolve(request.result);

    };


    request.onerror = function () {

        reject(request.error);

    };

});

}

/* =====================================================
SAVE FILE
===================================================== */

async function saveLocalFileDB(fileObj) {

const db = await openDB();

return new Promise((resolve, reject) => {

    const transaction = db.transaction(
        STORE_NAME,
        "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);

    const request = store.add(fileObj);


    request.onsuccess = function () {

        resolve(request.result);

    };


    request.onerror = function () {

        reject(request.error);

    };

});

}

/* =====================================================
GET ALL FILES
===================================================== */

async function getLocalFilesDB() {

const db = await openDB();

return new Promise((resolve, reject) => {

    const transaction = db.transaction(
        STORE_NAME,
        "readonly"
    );

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();


    request.onsuccess = function () {

        resolve(request.result || []);

    };


    request.onerror = function () {

        reject(request.error);

    };

});

}

/* =====================================================
DELETE FILE
===================================================== */

async function deleteLocalFileDB(id) {

const db = await openDB();

return new Promise((resolve, reject) => {

    const transaction = db.transaction(
        STORE_NAME,
        "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);


    request.onsuccess = function () {

        resolve();

    };


    request.onerror = function () {

        reject(request.error);

    };

});

}

/* =====================================================
APPLICATION INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {

setupCalculatorEvents();

setupPinEvents();

setupVaultEvents();

setupFilterEvents();


try {

    localFiles = await getLocalFilesDB();

} catch (error) {

    console.error(
        "IndexedDB loading error:",
        error
    );

    localFiles = [];

}


renderFiles();

updateStorage();

});

/* =====================================================
CALCULATOR
===================================================== */

function setupCalculatorEvents() {

const display =
    document.getElementById("display");


document
    .querySelectorAll(".keys button")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                if (!display) return;


                const value =
                    button.dataset.value;

                const action =
                    button.dataset.action;


                /* Error reset */

                if (
                    display.textContent === "Error"
                ) {

                    calculatorExpression = "";

                    display.textContent = "0";

                }


                /* Number / operator */

                if (value !== undefined) {

                    calculatorExpression += value;

                    display.textContent =
                        calculatorExpression;

                    return;

                }


                /* AC */

                if (action === "clear") {

                    calculatorExpression = "";

                    display.textContent = "0";

                    return;

                }


                /* DELETE */

                if (action === "delete") {

                    calculatorExpression =
                        calculatorExpression.slice(0, -1);

                    display.textContent =
                        calculatorExpression || "0";

                    return;

                }


                /* SQUARE ROOT */

                if (action === "sqrt") {

                    try {

                        const value =
                            safeCalculate(
                                calculatorExpression || "0"
                            );


                        if (value < 0) {

                            throw new Error(
                                "Math Error"
                            );

                        }


                        const result =
                            Math.sqrt(value);


                        calculatorExpression =
                            formatNumber(result);


                        display.textContent =
                            calculatorExpression;


                    } catch (error) {

                        display.textContent =
                            "Error";

                        calculatorExpression = "";

                    }

                    return;

                }


                /* EQUAL */

                if (action === "equal") {

                    /*
                       SECRET CODE
                       2580 =
                       opens vault PIN screen
                    */

                    if (
                        calculatorExpression === SECRET_CODE
                    ) {

                        calculatorExpression = "";

                        display.textContent = "0";

                        openPin();

                        return;

                    }


                    try {

                        const result =
                            safeCalculate(
                                calculatorExpression
                            );


                        if (
                            Number.isNaN(result) ||
                            !Number.isFinite(result)
                        ) {

                            throw new Error(
                                "Calculation Error"
                            );

                        }


                        calculatorExpression =
                            formatNumber(result);


                        display.textContent =
                            calculatorExpression;


                    } catch (error) {

                        display.textContent =
                            "Error";

                        calculatorExpression = "";

                    }

                }

            }

        );

    });

}

/* =====================================================
SAFE CALCULATOR
===================================================== */

function safeCalculate(expression) {

if (!expression) {

    return 0;

}


let sanitized =
    expression
        .replace(/÷/g, "/")
        .replace(/×/g, "*")
        .replace(/−/g, "-");


/*
   Convert percentages

   Example:
   50% → (50/100)
*/

sanitized =
    sanitized.replace(
        /([0-9.]+)%/g,
        "($1/100)"
    );


/*
   Only allow calculator characters
*/

if (
    /[^0-9+\-*/().%\s]/.test(
        sanitized
    )
) {

    throw new Error(
        "Invalid Input"
    );

}


/*
   Prevent dangerous expressions
*/

if (
    sanitized.includes("++") ||
    sanitized.includes("--") ||
    sanitized.includes("**")
) {

    throw new Error(
        "Invalid Expression"
    );

}


return Function(
    '"use strict"; return (' +
    sanitized +
    ')'
)();

}

/* =====================================================
NUMBER FORMAT
===================================================== */

function formatNumber(number) {

if (!Number.isFinite(number)) {

    throw new Error(
        "Invalid Number"
    );

}


return String(
    Number(
        Number(number).toFixed(8)
    )
);

}

/* =====================================================
PIN SYSTEM
===================================================== */

function setupPinEvents() {

document
    .querySelectorAll("[data-pin]")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const value =
                    button.dataset.pin;


                /* DELETE */

                if (value === "delete") {

                    enteredPin =
                        enteredPin.slice(0, -1);

                    updatePinDots();

                    return;

                }


                /* ENTER */

                if (value === "enter") {

                    checkPin();

                    return;

                }


                /* DIGIT */

                if (
                    enteredPin.length < 4 &&
                    /^[0-9]$/.test(value)
                ) {

                    enteredPin += value;

                    updatePinDots();

                }


                /*
                   Automatically check after
                   entering 4 digits
                */

                if (
                    enteredPin.length === 4
                ) {

                    setTimeout(
                        checkPin,
                        150
                    );

                }

            }

        );

    });


/* FORGOT PIN */

const forgotButton =
    document.getElementById(
        "forgotPinBtn"
    );


if (forgotButton) {

    forgotButton.addEventListener(
        "click",
        function () {

            alert(
                "PIN recovery is not available yet."
            );

        }
    );

}

}

/* =====================================================
OPEN PIN PAGE
===================================================== */

function openPin() {

const calculator =
    document.getElementById(
        "calculator"
    );

const pinPage =
    document.getElementById(
        "pinPage"
    );

const vaultPage =
    document.getElementById(
        "vaultPage"
    );


calculator?.classList.add(
    "hidden"
);

vaultPage?.classList.add(
    "hidden"
);

pinPage?.classList.remove(
    "hidden"
);


enteredPin = "";

newPin = "";

pinMode = "normal";


const heading =
    document.getElementById(
        "pinSubHeading"
    );


if (heading) {

    heading.textContent =
        "Enter PIN";

}


const error =
    document.getElementById(
        "pinError"
    );


if (error) {

    error.textContent = "";

}


updatePinDots();

}

/* =====================================================
PIN DOTS
===================================================== */

function updatePinDots() {

let dots = "";


for (
    let i = 0;
    i < 4;
    i++
) {

    dots +=
        i < enteredPin.length
            ? "● "
            : "○ ";

}


const element =
    document.getElementById(
        "dots"
    );


if (element) {

    element.textContent =
        dots.trim();

}

}

/* =====================================================
PIN ERROR
===================================================== */

function showPinError(message) {

const error =
    document.getElementById(
        "pinError"
    );


if (error) {

    error.textContent =
        message;

}


enteredPin = "";

updatePinDots();

}

/* =====================================================
CHECK PIN
===================================================== */

function checkPin() {

const error =
    document.getElementById(
        "pinError"
    );


/* NORMAL LOGIN */

if (pinMode === "normal") {

    if (
        enteredPin.length !== 4
    ) {

        showPinError(
            "PIN must be 4 digits"
        );

        return;

    }


    if (
        enteredPin === userPin
    ) {

        document
            .getElementById(
                "pinPage"
            )
            ?.classList.add(
                "hidden"
            );


        document
            .getElementById(
                "vaultPage"
            )
            ?.classList.remove(
                "hidden"
            );


        if (error) {

            error.textContent = "";

        }


        enteredPin = "";

        updatePinDots();

        loadFiles();

        return;

    }


    showPinError(
        "Incorrect PIN"
    );

    return;

}


/* CHANGE OLD PIN */

if (
    pinMode === "change-old"
) {

    if (
        enteredPin.length !== 4
    ) {

        showPinError(
            "Please enter your current PIN"
        );

        return;

    }


    if (
        enteredPin !== userPin
    ) {

        showPinError(
            "Incorrect current PIN"
        );

        return;

    }


    enteredPin = "";

    pinMode = "change-new";


    if (error) {

        error.textContent = "";

    }


    const heading =
        document.getElementById(
            "pinSubHeading"
        );


    if (heading) {

        heading.textContent =
            "Enter New 4-Digit PIN";

    }


    updatePinDots();

    return;

}


/* CHANGE NEW PIN */

if (
    pinMode === "change-new"
) {

    if (
        enteredPin.length !== 4
    ) {

        showPinError(
            "New PIN must be 4 digits"
        );

        return;

    }


    newPin = enteredPin;

    enteredPin = "";

    pinMode = "change-confirm";


    if (error) {

        error.textContent = "";

    }


    const heading =
        document.getElementById(
            "pinSubHeading"
        );


    if (heading) {

        heading.textContent =
            "Confirm New 4-Digit PIN";

    }


    updatePinDots();

    return;

}


/* CONFIRM NEW PIN */

if (
    pinMode === "change-confirm"
) {

    if (
        enteredPin.length !== 4
    ) {

        showPinError(
            "Please confirm your new PIN"
        );

        return;

    }


    if (
        enteredPin !== newPin
    ) {

        showPinError(
            "PINs do not match"
        );

        newPin = "";

        pinMode = "change-new";


        const heading =
            document.getElementById(
                "pinSubHeading"
            );


        if (heading) {

            heading.textContent =
                "Enter New 4-Digit PIN";

        }


        return;

    }


    userPin = newPin;


    localStorage.setItem(
        "vault_pin",
        userPin
    );


    enteredPin = "";

    newPin = "";

    pinMode = "normal";


    updatePinDots();


    if (error) {

        error.textContent = "";

    }


    alert(
        "Your PIN has been changed successfully!"
    );


    document
        .getElementById(
            "pinPage"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "vaultPage"
        )
        ?.classList.remove(
            "hidden"
        );

}

}

/* =====================================================
VAULT EVENTS
===================================================== */

function setupVaultEvents() {

/* PHOTO UPLOAD */

document
    .getElementById(
        "photoInput"
    )
    ?.addEventListener(
        "change",
        handleUpload
    );


/* VIDEO UPLOAD */

document
    .getElementById(
        "videoInput"
    )
    ?.addEventListener(
        "change",
        handleUpload
    );


/* UPGRADE */

document
    .getElementById(
        "upgradeBtn"
    )
    ?.addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "upgradeModal"
                )
                ?.classList.remove(
                    "hidden"
                );

        }
    );


/* CLOSE UPGRADE MODAL */

document
    .getElementById(
        "closeModal"
    )
    ?.addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "upgradeModal"
                )
                ?.classList.add(
                    "hidden"
                );

        }
    );


/* SUBSCRIBE */

document
    .getElementById(
        "subscribeBtn"
    )
    ?.addEventListener(
        "click",
        function () {

            alert(
                "Premium subscription is not connected yet."
            );

        }
    );


/* LOCK */

document
    .getElementById(
        "lockBtn"
    )
    ?.addEventListener(
        "click",
        function () {

            lockVault();

        }
    );


/* CHANGE PIN */

document
    .getElementById(
        "changePinBtn"
    )
    ?.addEventListener(
        "click",
        function () {

            startPinChange();

        }
    );

}

/* =====================================================
LOCK VAULT
===================================================== */

function lockVault() {

document
    .getElementById(
        "vaultPage"
    )
    ?.classList.add(
        "hidden"
    );


document
    .getElementById(
        "pinPage"
    )
    ?.classList.add(
        "hidden"
    );


document
    .getElementById(
        "calculator"
    )
    ?.classList.remove(
        "hidden"
    );


enteredPin = "";

newPin = "";

pinMode = "normal";

}

/* =====================================================
CHANGE PIN START
===================================================== */

function startPinChange() {

pinMode = "change-old";

enteredPin = "";

newPin = "";


document
    .getElementById(
        "vaultPage"
    )
    ?.classList.add(
        "hidden"
    );


document
    .getElementById(
        "pinPage"
    )
    ?.classList.remove(
        "hidden"
    );


const heading =
    document.getElementById(
        "pinSubHeading"
    );


if (heading) {

    heading.textContent =
        "Enter Current PIN";

}


const error =
    document.getElementById(
        "pinError"
    );


if (error) {

    error.textContent = "";

}


updatePinDots();

}

/* =====================================================
FILTER SYSTEM
===================================================== */

function setupFilterEvents() {

document
    .querySelectorAll(
        ".tab-btn"
    )
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(
                        ".tab-btn"
                    )
                    .forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                button.classList.add(
                    "active"
                );


                currentFilter =
                    button.dataset.filter ||
                    "all";


                renderFiles();

            }
        );

    });

}

/* =====================================================
STORAGE CALCULATION
===================================================== */

function getUsedBytes() {

return localFiles.reduce(
    function (total, file) {

        return total +
            Number(
                file.size || 0
            );

    },
    0
);

}

/* =====================================================
UPDATE STORAGE UI
===================================================== */

function updateStorage() {

const used =
    getUsedBytes();


const limit =
    isPremium
        ? PREMIUM_LIMIT
        : FREE_LIMIT;


const percentage =
    Math.min(
        100,
        (used / limit) * 100
    );


const usedElement =
    document.getElementById(
        "used"
    );


if (usedElement) {

    usedElement.textContent =
        "Used: " +
        formatStorageSize(
            used
        );

}


const availableBytes =
    Math.max(
        0,
        limit - used
    );


const availableElement =
    document.getElementById(
        "available"
    );


if (availableElement) {

    availableElement.textContent =
        "Available: " +
        formatGB(
            availableBytes
        );

}


const percentElement =
    document.getElementById(
        "percent"
    );


if (percentElement) {

    percentElement.textContent =
        percentage.toFixed(1) +
        "%";

}


const progress =
    document.getElementById(
        "progressBar"
    );


if (progress) {

    progress.style.width =
        percentage + "%";

}

}

/* =====================================================
STORAGE FORMAT
===================================================== */

function formatStorageSize(bytes) {

if (bytes <= 0) {

    return "0 MB";

}


const MB =
    bytes /
    (1024 * 1024);


if (MB < 1024) {

    return MB.toFixed(1) +
        " MB";

}


const GB =
    MB / 1024;


return GB.toFixed(2) +
    " GB";

}

function formatGB(bytes) {

return (
    bytes /
    (1024 * 1024 * 1024)
).toFixed(2) +
    " GB";

}

/* =====================================================
FILE UPLOAD
===================================================== */

async function handleUpload(event) {

const files =
    Array.from(
        event.target.files || []
    );


if (!files.length) {

    return;

}


const limit =
    isPremium
        ? PREMIUM_LIMIT
        : FREE_LIMIT;


const currentUsed =
    getUsedBytes();


const selectedSize =
    files.reduce(
        function (sum, file) {

            return sum +
                file.size;

        },
        0
    );


/* STORAGE LIMIT */

if (
    currentUsed +
    selectedSize >
    limit
) {

    alert(
        isPremium
            ? "Storage limit of 10 GB has been reached."
            : "Storage limit of 1 GB has been reached."
    );


    event.target.value = "";

    return;

}


/* SAVE FILES */

for (
    const file of files
) {

    try {

        const fileObj = {

            name: file.name,

            size: file.size,

            type: file.type,

            blob: file,

            createdAt:
                Date.now()

        };


        await saveLocalFileDB(
            fileObj
        );


    } catch (error) {

        console.error(
            "File upload error:",
            error
        );


        alert(
            "Could not save " +
            file.name
        );

    }

}


event.target.value = "";


await loadFiles();

}

/* =====================================================
LOAD FILES
===================================================== */

async function loadFiles() {

try {

    localFiles =
        await getLocalFilesDB();

} catch (error) {

    console.error(
        "Error loading files:",
        error
    );

    localFiles = [];

}


renderFiles();

updateStorage();

}

/* =====================================================
RENDER GALLERY
===================================================== */

function renderFiles() {

const gallery =
    document.getElementById(
        "gallery"
    );


if (!gallery) {

    return;

}


gallery.innerHTML = "";


let photoCount = 0;

let videoCount = 0;


localFiles.forEach(
    function (file) {

        const isPhoto =
            file.type &&
            file.type.startsWith(
                "image/"
            );


        const isVideo =
            file.type &&
            file.type.startsWith(
                "video/"
            );


        if (isPhoto) {

            photoCount++;

        }


        if (isVideo) {

            videoCount++;

        }


        /* FILTER */

        if (
            currentFilter === "photo" &&
            !isPhoto
        ) {

            return;

        }


        if (
            currentFilter === "video" &&
            !isVideo
        ) {

            return;

        }


        const box =
            document.createElement(
                "div"
            );


        box.className =
            "file-box";


        /* MEDIA */

        let mediaElement = null;

        let fileUrl = "";


        if (
            file.blob instanceof Blob
        ) {

            fileUrl =
                URL.createObjectURL(
                    file.blob
                );

        }


        if (
            isPhoto &&
            fileUrl
        ) {

            mediaElement =
                document.createElement(
                    "img"
                );


            mediaElement.src =
                fileUrl;


            mediaElement.alt =
                file.name ||
                "Photo";


            mediaElement.loading =
                "lazy";


            mediaElement.addEventListener(
                "click",
                function () {

                    openMediaModal(
                        fileUrl,
                        file.type
                    );

                }
            );

        }


        if (
            isVideo &&
            fileUrl
        ) {

            mediaElement =
                document.createElement(
                    "video"
                );


            mediaElement.src =
                fileUrl;


            mediaElement.controls =
                false;


            mediaElement.playsInline =
                true;


            mediaElement.preload =
                "metadata";


            mediaElement.addEventListener(
                "click",
                function () {

                    openMediaModal(
                        fileUrl,
                        file.type
                    );

                }
            );

        }


        if (mediaElement) {

            box.appendChild(
                mediaElement
            );

        }


        /* FILE NAME */

        const nameElement =
            document.createElement(
                "div"
            );


        nameElement.className =
            "file-name";


        nameElement.textContent =
            file.name ||
            "File";


        box.appendChild(
            nameElement
        );


        /* DELETE BUTTON */

        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.className =
            "delete-btn";


        deleteButton.textContent =
            "✕";


        deleteButton.setAttribute(
            "aria-label",
            "Delete file"
        );


        /*
           IMPORTANT:
           Delete using IndexedDB ID,
           NOT array index.
        */

        deleteButton.addEventListener(
            "click",
            async function (event) {

                event.stopPropagation();


                await deleteFile(
                    file.id
                );

            }
        );


        box.appendChild(
            deleteButton
        );


        gallery.appendChild(
            box
        );

    }
);


/* PHOTO COUNT */

const photoElement =
    document.getElementById(
        "photoCount"
    );


if (photoElement) {

    photoElement.textContent =
        "📷 " +
        photoCount +
        " Photos";

}


/* VIDEO COUNT */

const videoElement =
    document.getElementById(
        "videoCount"
    );


if (videoElement) {

    videoElement.textContent =
        "🎥 " +
        videoCount +
        " Videos";

}

}

/* =====================================================
MEDIA PREVIEW MODAL
===================================================== */

function openMediaModal(
url,
type
) {

let previewModal =
    document.getElementById(
        "previewModal"
    );


/* CREATE MODAL ON FIRST USE */

if (!previewModal) {

    previewModal =
        document.createElement(
            "div"
        );


    previewModal.id =
        "previewModal";


    previewModal.className =
        "modal";


    previewModal.innerHTML = `

        <button
            id="closePreview"
            class="preview-close"
            aria-label="Close preview">
            ✕
        </button>

        <div
            id="mediaContainer"
            class="media-container">
        </div>

    `;


    document.body.appendChild(
        previewModal
    );


    document
        .getElementById(
            "closePreview"
        )
        .addEventListener(
            "click",
            closeMediaModal
        );


    previewModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                previewModal
            ) {

                closeMediaModal();

            }

        }
    );

}


const container =
    document.getElementById(
        "mediaContainer"
    );


if (!container) {

    return;

}


container.innerHTML = "";


/* IMAGE */

if (
    type &&
    type.startsWith(
        "image/"
    )
) {

    const img =
        document.createElement(
            "img"
        );


    img.src = url;


    img.alt =
        "Preview";


    img.className =
        "preview-image";


    container.appendChild(
        img
    );

}


/* VIDEO */

else if (
    type &&
    type.startsWith(
        "video/"
    )
) {

    const video =
        document.createElement(
            "video"
        );


    video.src = url;


    video.controls = true;

    video.autoplay = true;

    video.playsInline = true;


    video.className =
        "preview-video";


    container.appendChild(
        video
    );

}


previewModal.classList.remove(
    "hidden"
);


document.body.style.overflow =
    "hidden";

}

/* =====================================================
CLOSE MEDIA MODAL
===================================================== */

function closeMediaModal() {

const modal =
    document.getElementById(
        "previewModal"
    );


const container =
    document.getElementById(
        "mediaContainer"
    );


if (container) {

    const video =
        container.querySelector(
            "video"
        );


    if (video) {

        video.pause();

        video.removeAttribute(
            "src"
        );

        video.load();

    }


    container.innerHTML = "";

}


if (modal) {

    modal.classList.add(
        "hidden"
    );

}


document.body.style.overflow =
    "";

}

/* =====================================================
DELETE FILE
===================================================== */

async function deleteFile(id) {

if (!id) {

    return;

}


const file =
    localFiles.find(
        function (item) {

            return item.id === id;

        }
    );


if (!file) {

    return;

}


const confirmed =
    confirm(
        "Are you sure you want to delete this file?"
    );


if (!confirmed) {

    return;

}


try {

    await deleteLocalFileDB(
        id
    );


    /*
       Remove from memory immediately
    */

    localFiles =
        localFiles.filter(
            function (item) {

                return item.id !== id;

            }
        );


    renderFiles();

    updateStorage();


} catch (error) {

    console.error(
        "Delete error:",
        error
    );


    alert(
        "Could not delete the file."
    );

}

}

/* =====================================================
ESC KEY SUPPORT
===================================================== */

document.addEventListener(
"keydown",
function (event) {

    if (
        event.key === "Escape"
    ) {

        closeMediaModal();

        document
            .getElementById(
                "upgradeModal"
            )
            ?.classList.add(
                "hidden"
            );

    }

}

);
