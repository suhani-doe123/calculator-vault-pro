// CONFIGURATION
const SECRET_PIN = "2580";
const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1GB Limit

// ELEMENTS
const calcApp = document.getElementById("calcApp");
const pinScreen = document.getElementById("pinScreen");
const pinScreenTitle = document.getElementById("pinScreenTitle");
const vaultScreen = document.getElementById("vaultScreen");

const display = document.getElementById("display");
const history = document.getElementById("history");
const calcButtons = document.querySelectorAll(".key");

const dots = document.querySelectorAll(".dot");
const pinButtons = document.querySelectorAll("[data-pin]");
const pinDelete = document.getElementById("pinDelete");
const pinSubmit = document.getElementById("pinSubmit");
const changePinBtn = document.getElementById("changePinBtn");
const lockVaultBtn = document.getElementById("lockVault");
const forgotPinLink = document.querySelector(".forgot-pin");

const openUpgradeModal = document.getElementById("openUpgradeModal");
const upgradeModal = document.getElementById("upgradeModal");
const closeModal = document.getElementById("closeModal");
const confirmSubscribe = document.getElementById("confirmSubscribe");

const storagePercent = document.getElementById("storagePercent");
const progressBar = document.getElementById("progressBar");
const storageUsedText = document.getElementById("storageUsed");

const tabPhotos = document.getElementById("tabPhotos");
const tabVideos = document.getElementById("tabVideos");

const photoInput = document.getElementById("photoInput");
const videoInput = document.getElementById("videoInput");
const mediaGrid = document.getElementById("mediaGrid");

const subTabAll = document.getElementById("subTabAll");
const subTabPhotos = document.getElementById("subTabPhotos");
const subTabVideos = document.getElementById("subTabVideos");

const previewModal = document.getElementById("previewModal");
const previewContainer = document.getElementById("previewContainer");
const closePreview = document.getElementById("closePreview");

let expression = "";
let currentPin = "";
let isVerifyingOldPinForChange = false;
let mediaFiles = [];
let currentFilter = "all";
let db = null;

// INDEXEDDB SETUP
const dbRequest = indexedDB.open("VaultMediaStorageDB", 2);

dbRequest.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media", { keyPath: "id" });
    }
};

dbRequest.onsuccess = (e) => {
    db = e.target.result;
    loadStoredMedia();
};

dbRequest.onerror = (e) => {
    console.error("IndexedDB error:", e);
};

function loadStoredMedia() {
    if (!db) return;
    const tx = db.transaction("media", "readonly");
    const store = tx.objectStore("media");
    const req = store.getAll();
    req.onsuccess = () => {
        mediaFiles = req.result || [];
        renderMedia();
        updateStorageUI();
    };
}

function saveMediaToDB(item) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("media", "readwrite");
        const store = tx.objectStore("media");
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
}

function deleteMediaFromDB(id) {
    if (!db) return;
    const tx = db.transaction("media", "readwrite");
    tx.objectStore("media").delete(id);
}

// CALCULATOR LOGIC (Supports both click and touchstart for APK compatibility)
function updateDisplay() {
    if (display) display.textContent = expression || "0";
}

function safeCalculate(exp) {
    exp = exp.replace(/%/g, "/100");
    if (!/^[0-9+\-*/().\s]+$/.test(exp)) throw new Error("Invalid");
    return Number(Function('"use strict"; return (' + exp + ')')().toFixed(8));
}

calcButtons.forEach(button => {
    ["click", "touchstart"].forEach(eventType => {
        button.addEventListener(eventType, (e) => {
            e.preventDefault(); // Prevents duplicate triggers on mobile taps
            const val = button.dataset.value;
            const key = button.dataset.key;

            if (val !== undefined) {
                if (expression === "Error") expression = "";
                expression += val;
                updateDisplay();
            } else if (key === "clear") {
                expression = "";
                if (history) history.textContent = "";
                updateDisplay();
            } else if (key === "delete") {
                expression = expression.slice(0, -1);
                updateDisplay();
            } else if (key === "sqrt") {
                try {
                    expression = String(Math.sqrt(safeCalculate(expression)));
                } catch {
                    expression = "Error";
                }
                updateDisplay();
            } else if (key === "equal") {
                if (expression === SECRET_PIN) {
                    expression = "";
                    updateDisplay();
                    openPinScreen(false);
                    return;
                }
                try {
                    if (history) history.textContent = expression + " =";
                    expression = String(safeCalculate(expression));
                } catch {
                    expression = "Error";
                }
                updateDisplay();
            }
        });
    });
});

// PIN SCREEN LOGIC
function openPinScreen(forPinChange = false) {
    isVerifyingOldPinForChange = forPinChange;
    if (calcApp) calcApp.classList.add("hidden");
    if (vaultScreen) vaultScreen.classList.add("hidden");
    if (pinScreen) pinScreen.classList.remove("hidden");
    
    if (pinScreenTitle) {
        pinScreenTitle.textContent = isVerifyingOldPinForChange ? "Enter Old PIN" : "Enter PIN";
    }
    
    currentPin = "";
    updateDots();
}

function updateDots() {
    dots.forEach((dot, idx) => {
        dot.classList.toggle("filled", idx < currentPin.length);
    });
}

pinButtons.forEach(btn => {
    ["click", "touchstart"].forEach(eventType => {
        btn.addEventListener(eventType, (e) => {
            e.preventDefault();
            if (currentPin.length < 4) {
                currentPin += btn.dataset.pin;
                updateDots();
            }
        });
    });
});

if (pinDelete) {
    ["click", "touchstart"].forEach(eventType => {
        pinDelete.addEventListener(eventType, (e) => {
            e.preventDefault();
            currentPin = currentPin.slice(0, -1);
            updateDots();
        });
    });
}

if (pinSubmit) {
    ["click", "touchstart"].forEach(eventType => {
        pinSubmit.addEventListener(eventType, (e) => {
            e.preventDefault();
            if (currentPin === SECRET_PIN) {
                if (pinScreen) pinScreen.classList.add("hidden");
                if (vaultScreen) vaultScreen.classList.remove("hidden");

                if (isVerifyingOldPinForChange) {
                    if (upgradeModal) upgradeModal.classList.remove("hidden");
                    isVerifyingOldPinForChange = false;
                } else {
                    loadStoredMedia();
                }
            } else {
                alert("Incorrect PIN");
                currentPin = "";
                updateDots();
            }
        });
    });
}

if (changePinBtn) {
    changePinBtn.addEventListener("click", () => {
        openPinScreen(true);
    });
}

if (lockVaultBtn) {
    lockVaultBtn.addEventListener("click", () => {
        if (vaultScreen) vaultScreen.classList.add("hidden");
        if (calcApp) calcApp.classList.remove("hidden");
        expression = "";
        updateDisplay();
    });
}

if (forgotPinLink) {
    forgotPinLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (upgradeModal) {
            upgradeModal.classList.remove("hidden");
        }
    });
}

// DIRECT UPLOAD BUTTON CLICKS
if (tabPhotos && photoInput) {
    tabPhotos.addEventListener("click", () => photoInput.click());
}
if (tabVideos && videoInput) {
    tabVideos.addEventListener("click", () => videoInput.click());
}

if (photoInput) {
    photoInput.addEventListener("change", (e) => handleFileUpload(e.target.files));
}
if (videoInput) {
    videoInput.addEventListener("change", (e) => handleFileUpload(e.target.files));
}

async function handleFileUpload(files) {
    const fileList = Array.from(files);

    for (let file of fileList) {
        const totalUsed = mediaFiles.reduce((acc, f) => acc + f.size, 0);

        if (totalUsed + file.size > STORAGE_LIMIT_BYTES) {
            alert("1GB Storage limit reached! Upgrade space to continue.");
            break;
        }

        const isImage = file.type.startsWith("image/");
        const fileType = isImage ? "image" : "video";

        const item = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            fileBlob: file,
            type: fileType,
            size: file.size,
            name: file.name
        };

        try {
            await saveMediaToDB(item);
            mediaFiles.push(item);
        } catch (err) {
            console.error("Save error:", err);
            alert("Storage error! Media couldn't be saved.");
        }
    }

    renderMedia();
    updateStorageUI();
    if (photoInput) photoInput.value = "";
    if (videoInput) videoInput.value = "";
}

// FILTER SUB-TABS
if (subTabAll) subTabAll.addEventListener("click", (e) => setSubFilter("all", e.target));
if (subTabPhotos) subTabPhotos.addEventListener("click", (e) => setSubFilter("image", e.target));
if (subTabVideos) subTabVideos.addEventListener("click", (e) => setSubFilter("video", e.target));

function setSubFilter(filter, target) {
    currentFilter = filter;
    document.querySelectorAll(".sub-tab").forEach(t => t.classList.remove("active"));
    target.classList.add("active");
    renderMedia();
}

// RENDER GALLERY
function renderMedia() {
    if (!mediaGrid) return;
    mediaGrid.innerHTML = "";

    const filtered = mediaFiles.filter(item => {
        if (currentFilter === "all") return true;
        return item.type === currentFilter;
    });

    if (filtered.length === 0) {
        mediaGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #8b949e; padding: 20px; font-size: 13px;">No media found.</p>`;
        return;
    }

    filtered.forEach(item => {
        const div = document.createElement("div");
        div.className = "media-item";

        const mediaUrl = URL.createObjectURL(item.fileBlob);

        let mediaEl;
        if (item.type === "image") {
            mediaEl = document.createElement("img");
            mediaEl.src = mediaUrl;
        } else {
            mediaEl = document.createElement("video");
            mediaEl.src = mediaUrl;
            mediaEl.preload = "metadata";
        }

        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.innerHTML = "×";
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteMedia(item.id);
        };

        div.onclick = () => openPreview(item, mediaUrl);
        div.appendChild(mediaEl);
        div.appendChild(delBtn);
        mediaGrid.appendChild(div);
    });
}

function deleteMedia(id) {
    mediaFiles = mediaFiles.filter(item => item.id !== id);
    deleteMediaFromDB(id);
    renderMedia();
    updateStorageUI();
}

function updateStorageUI() {
    const totalBytes = mediaFiles.reduce((acc, item) => acc + item.size, 0);
    const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
    const percent = Math.min(((totalBytes / STORAGE_LIMIT_BYTES) * 100), 100).toFixed(1);

    if (storageUsedText) storageUsedText.textContent = `Used: ${usedMB} MB`;
    if (storagePercent) storagePercent.textContent = `${percent}%`;
    if (progressBar) progressBar.style.width = `${percent}%`;
}

// PREVIEW MODAL LOGIC WITH BACK BUTTON SUPPORT
function openPreview(item, mediaUrl) {
    if (!previewContainer || !previewModal) return;
    previewContainer.innerHTML = "";
    let el;
    if (item.type === "image") {
        el = document.createElement("img");
        el.src = mediaUrl;
    } else {
        el = document.createElement("video");
        el.src = mediaUrl;
        el.controls = true;
        el.autoplay = true;
    }
    previewContainer.appendChild(el);
    previewModal.classList.remove("hidden");

    // Push history state so Android back button closes preview instead of exiting app
    history.pushState({ previewOpen: true }, "");
}

function closePreviewModal() {
    if (previewModal) previewModal.classList.add("hidden");
    if (previewContainer) previewContainer.innerHTML = "";
}

window.addEventListener("popstate", (event) => {
    if (!previewModal.classList.contains("hidden")) {
        closePreviewModal();
    }
});

if (closePreview) {
    closePreview.addEventListener("click", () => {
        closePreviewModal();
        if (history.state && history.state.previewOpen) {
            history.back();
        }
    });
}

// MODAL & UPGRADE LOGIC
if (openUpgradeModal) {
    openUpgradeModal.addEventListener("click", () => {
        if (upgradeModal) upgradeModal.classList.remove("hidden");
    });
}
if (closeModal) {
    closeModal.addEventListener("click", () => {
        if (upgradeModal) upgradeModal.classList.add("hidden");
    });
}
if (confirmSubscribe) {
    confirmSubscribe.addEventListener("click", () => {
        alert("Payment gateway backend integration required to activate subscription and 10GB storage.");
    });
}

// REGISTER SERVICE WORKER FOR PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
