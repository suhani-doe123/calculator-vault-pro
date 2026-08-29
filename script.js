/* =====================================================
   STORAGE LIMITS & STATE
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
let currentFilter = "all"; // State for Filter: "all", "photo", "video"

/* =====================================================
   INDEXEDDB STORAGE ENGINE
===================================================== */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("VaultStorageDB", 1);
        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("files")) {
                db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject(e.target.error);
    });
}

async function saveLocalFileDB(fileObj) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        const store = tx.objectStore("files");
        const req = store.add(fileObj);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function getLocalFilesDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function deleteLocalFileDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        const store = tx.objectStore("files");
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/* =====================================================
   INITIALIZE APPLICATION
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    localStorage.removeItem("is_premium");

    setupCalculatorEvents();
    setupPinEvents();
    setupVaultEvents();
    setupFilterEvents();

    try {
        localFiles = await getLocalFilesDB();
    } catch (err) {
        console.error("IndexedDB Error:", err);
        localFiles = [];
    }

    renderFiles();
    updateStorage();
});

/* =====================================================
   CALCULATOR ENGINE
===================================================== */
function setupCalculatorEvents() {
    const display = document.getElementById("display");

    document.querySelectorAll(".keys button").forEach(button => {
        button.addEventListener("click", () => {
            const value = button.dataset.value;
            const action = button.dataset.action;

            if (!display) return;
            if (display.textContent === "Error") calculatorExpression = "";

            if (value !== undefined) {
                calculatorExpression += value;
                display.textContent = calculatorExpression;
                return;
            }

            if (action === "clear") {
                calculatorExpression = "";
                display.textContent = "0";
                return;
            }

            if (action === "delete") {
                calculatorExpression = calculatorExpression.slice(0, -1);
                display.textContent = calculatorExpression || "0";
                return;
            }

            if (action === "sqrt") {
                try {
                    const val = safeCalculate(calculatorExpression || "0");
                    if (val < 0) throw new Error("Math Error");
                    calculatorExpression = String(Math.sqrt(val));
                    display.textContent = calculatorExpression;
                } catch {
                    display.textContent = "Error";
                    calculatorExpression = "";
                }
                return;
            }

            if (action === "equal") {
                if (calculatorExpression === SECRET_CODE) {
                    calculatorExpression = "";
                    display.textContent = "0";
                    openPin();
                    return;
                }

                try {
                    const result = safeCalculate(calculatorExpression);
                    if (isNaN(result) || !isFinite(result)) throw new Error("Error");
                    calculatorExpression = String(Number(result.toFixed(8)));
                    display.textContent = calculatorExpression;
                } catch {
                    display.textContent = "Error";
                    calculatorExpression = "";
                }
            }
        });
    });
}

function safeCalculate(exp) {
    if (!exp) return 0;
    let sanitized = exp
        .replace(/÷/g, "/")
        .replace(/×/g, "*")
        .replace(/−/g, "-");

    sanitized = sanitized.replace(/([0-9.]+)%/g, "($1/100)");

    if (/[^0-9+\-*/().%\s]/.test(sanitized)) {
        throw new Error("Invalid Input");
    }

    return Function(`"use strict"; return (${sanitized})`)();
}

/* =====================================================
   PIN CONTROLLER
===================================================== */
function setupPinEvents() {
    document.querySelectorAll("[data-pin]").forEach(button => {
        button.addEventListener("click", () => {
            const value = button.dataset.pin;

            if (value === "delete") {
                enteredPin = enteredPin.slice(0, -1);
                updatePinDots();
                return;
            }

            if (value === "enter") {
                checkPin();
                return;
            }

            if (enteredPin.length < 4) {
                enteredPin += value;
                updatePinDots();
            }

            if (enteredPin.length === 4) {
                setTimeout(checkPin, 150);
            }
        });
    });

    document.getElementById("forgotPinBtn")?.addEventListener("click", () => {
        alert("Please subscribe to use the PIN recovery feature.");
        window.location.href = "https://accounts.google.com";
    });
}

function openPin() {
    document.getElementById("calculator")?.classList.add("hidden");
    document.getElementById("vaultPage")?.classList.add("hidden");
    document.getElementById("pinPage")?.classList.remove("hidden");
    enteredPin = "";
    newPin = "";
    pinMode = "normal";

    const heading = document.getElementById("pinSubHeading");
    if (heading) heading.textContent = "Enter PIN";

    const error = document.getElementById("pinError");
    if (error) error.textContent = "";

    updatePinDots();
}

function updatePinDots() {
    let dots = "";
    for (let i = 0; i < 4; i++) {
        dots += i < enteredPin.length ? "● " : "○ ";
    }
    const dotsElement = document.getElementById("dots");
    if (dotsElement) dotsElement.textContent = dots;
}

function pinError(message) {
    const error = document.getElementById("pinError");
    if (error) error.textContent = message;
    enteredPin = "";
    updatePinDots();
}

function checkPin() {
    const error = document.getElementById("pinError");

    if (pinMode === "normal") {
        if (enteredPin.length !== 4) {
            pinError("PIN must be 4 digits");
            return;
        }

        if (enteredPin === userPin) {
            document.getElementById("pinPage")?.classList.add("hidden");
            document.getElementById("vaultPage")?.classList.remove("hidden");
            if (error) error.textContent = "";
            enteredPin = "";
            updatePinDots();
            loadFiles();
        } else {
            pinError("Incorrect PIN");
        }
        return;
    }

    if (pinMode === "change-old") {
        if (enteredPin.length !== 4) {
            pinError("Please enter your current PIN");
            return;
        }

        if (enteredPin !== userPin) {
            pinError("Incorrect current PIN");
            return;
        }

        enteredPin = "";
        pinMode = "change-new";
        if (error) error.textContent = "";
        const heading = document.getElementById("pinSubHeading");
        if (heading) heading.textContent = "Enter New 4-Digit PIN";
        updatePinDots();
        return;
    }

    if (pinMode === "change-new") {
        if (enteredPin.length !== 4) {
            pinError("New PIN must be 4 digits");
            return;
        }
        newPin = enteredPin;
        enteredPin = "";
        pinMode = "change-confirm";
        if (error) error.textContent = "";
        const heading = document.getElementById("pinSubHeading");
        if (heading) heading.textContent = "Confirm New 4-Digit PIN";
        updatePinDots();
        return;
    }

    if (pinMode === "change-confirm") {
        if (enteredPin.length !== 4) {
            pinError("Please confirm your new PIN");
            return;
        }

        if (enteredPin !== newPin) {
            pinError("PINs do not match");
            newPin = "";
            pinMode = "change-new";
            const heading = document.getElementById("pinSubHeading");
            if (heading) heading.textContent = "Enter New 4-Digit PIN";
            return;
        }

        userPin = newPin;
        localStorage.setItem("vault_pin", userPin);
        enteredPin = "";
        newPin = "";
        pinMode = "normal";
        updatePinDots();
        if (error) error.textContent = "";
        alert("Your PIN has been changed successfully!");

        document.getElementById("pinPage")?.classList.add("hidden");
        document.getElementById("vaultPage")?.classList.remove("hidden");
        return;
    }
}

/* =====================================================
   VAULT CONTROLLER
===================================================== */
function setupVaultEvents() {
    document.getElementById("photoInput")?.addEventListener("change", handleUpload);
    document.getElementById("videoInput")?.addEventListener("change", handleUpload);

    document.getElementById("upgradeBtn")?.addEventListener("click", () => {
        document.getElementById("upgradeModal")?.classList.remove("hidden");
    });

    document.getElementById("closeModal")?.addEventListener("click", () => {
        document.getElementById("upgradeModal")?.classList.add("hidden");
    });

    document.getElementById("subscribeBtn")?.addEventListener("click", () => {
        document.getElementById("upgradeModal")?.classList.add("hidden");
        window.location.href = "https://accounts.google.com";
    });

    document.getElementById("lockBtn")?.addEventListener("click", () => {
        document.getElementById("vaultPage")?.classList.add("hidden");
        document.getElementById("calculator")?.classList.remove("hidden");
    });

    document.getElementById("changePinBtn")?.addEventListener("click", () => {
        pinMode = "change-old";
        enteredPin = "";
        newPin = "";
        document.getElementById("vaultPage")?.classList.add("hidden");
        document.getElementById("pinPage")?.classList.remove("hidden");
        const heading = document.getElementById("pinSubHeading");
        if (heading) heading.textContent = "Enter Current PIN";
        const error = document.getElementById("pinError");
        if (error) error.textContent = "";
        updatePinDots();
    });
}

// FILTER SYSTEM Setup (ALL / PHOTOS / VIDEOS)
function setupFilterEvents() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderFiles();
        });
    });
}

/* =====================================================
   STORAGE MANAGEMENT
===================================================== */
function getUsedBytes() {
    return localFiles.reduce((total, file) => total + Number(file.size || 0), 0);
}

function updateStorage() {
    const used = getUsedBytes();
    const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
    const percentage = Math.min(100, (used / limit) * 100);

    const usedElement = document.getElementById("used");
    if (usedElement) usedElement.textContent = "Used: " + (used / (1024 * 1024)).toFixed(1) + " MB";

    const available = document.getElementById("available");
    if (available) available.textContent = "Available: " + ((limit - used) / (1024 * 1024 * 1024)).toFixed(2) + " GB";

    const percent = document.getElementById("percent");
    if (percent) percent.textContent = percentage.toFixed(1) + "%";

    const progress = document.getElementById("progressBar");
    if (progress) progress.style.width = percentage + "%";
}

/* =====================================================
   FILE UPLOADER & RENDER WITH FILTER & PREVIEW
===================================================== */
async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
    const currentUsed = getUsedBytes();
    let selectedSize = files.reduce((sum, f) => sum + f.size, 0);

    if (currentUsed + selectedSize > limit) {
        alert(isPremium ? "Storage limit of 10 GB has been reached." : "Storage limit of 1 GB has been reached.");
        e.target.value = "";
        return;
    }

    for (const file of files) {
        try {
            const fileObj = {
                name: file.name,
                size: file.size,
                type: file.type,
                blob: file
            };
            await saveLocalFileDB(fileObj);
        } catch (err) {
            console.error("Upload error:", err);
        }
    }

    e.target.value = "";
    await loadFiles();
}

async function loadFiles() {
    try {
        localFiles = await getLocalFilesDB();
    } catch (err) {
        console.error("Error loading files:", err);
    }
    renderFiles();
    updateStorage();
}

function renderFiles() {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    gallery.innerHTML = "";
    let photoCount = 0;
    let videoCount = 0;

    localFiles.forEach((file, index) => {
        const isPhoto = file.type?.startsWith("image/");
        const isVideo = file.type?.startsWith("video/");

        if (isPhoto) photoCount++;
        if (isVideo) videoCount++;

        // Filter Logic
        if (currentFilter === "photo" && !isPhoto) return;
        if (currentFilter === "video" && !isVideo) return;

        const box = document.createElement("div");
        box.className = "file-box";

        const fileUrl = file.blob ? URL.createObjectURL(file.blob) : "";
        let mediaElement;

        if (isPhoto) {
            mediaElement = document.createElement("img");
            mediaElement.src = fileUrl;
        } else if (isVideo) {
            mediaElement = document.createElement("video");
            mediaElement.src = fileUrl;
        }

        if (mediaElement) {
            box.appendChild(mediaElement);
            mediaElement.addEventListener("click", () => openMediaModal(fileUrl, file.type));
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            await deleteFile(index);
        });

        box.appendChild(deleteBtn);
        gallery.appendChild(box);
    });

    const photoElement = document.getElementById("photoCount");
    if (photoElement) photoElement.textContent = `📷 ${photoCount} Photos`;

    const videoElement = document.getElementById("videoCount");
    if (videoElement) videoElement.textContent = `🎥 ${videoCount} Videos`;
}

// FULLSCREEN MEDIA VIEW MODAL
function openMediaModal(url, type) {
    let previewModal = document.getElementById("previewModal");
    
    if (!previewModal) {
        previewModal = document.createElement("div");
        previewModal.id = "previewModal";
        previewModal.className = "modal";
        previewModal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:100;";
        previewModal.innerHTML = `
            <button id="closePreview" style="position:absolute; top:20px; right:20px; font-size:24px; color:white; background:transparent; border:none; cursor:pointer;">✕</button>
            <div id="mediaContainer" style="max-width:90%; max-height:80%;"></div>
        `;
        document.body.appendChild(previewModal);

        document.getElementById("closePreview").addEventListener("click", () => {
            previewModal.classList.add("hidden");
            document.getElementById("mediaContainer").innerHTML = "";
        });
    }

    const container = document.getElementById("mediaContainer");
    container.innerHTML = "";

    if (type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = url;
        img.style.cssText = "max-width:100%; max-height:80vh; border-radius:12px; object-fit:contain;";
        container.appendChild(img);
    } else if (type.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        video.style.cssText = "max-width:100%; max-height:80vh; border-radius:12px;";
        container.appendChild(video);
    }

    previewModal.classList.remove("hidden");
}

async function deleteFile(index) {
    if (!confirm("Are you sure you want to delete this file?")) return;
    const fileObj = localFiles[index];
    if (fileObj && fileObj.id) {
        await deleteLocalFileDB(fileObj.id);
    }
    await loadFiles();
}
