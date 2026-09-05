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
const forgotPinLink = document.querySelector(".forgot-pin"); // Forgot PIN Link Element

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
    const tx = db.transaction("media", "readwrite");
    tx.objectStore("media").delete(id);
}

// CALCULATOR LOGIC
function updateDisplay() {
    display.textContent = expression || "0";
}

function safeCalculate(exp) {
    exp = exp.replace(/%/g, "/100");
    if (!/^[0-9+\-*/().\s]+$/.test(exp)) throw new Error("Invalid");
    return Number(Function('"use strict"; return (' + exp + ')')().toFixed(8));
}

calcButtons.forEach(button => {
    button.addEventListener("click", () => {
        const val = button.dataset.value;
        const key = button.dataset.key;

        if (val !== undefined) {
            if (expression === "Error") expression = "";
            expression += val;
            updateDisplay();
        } else if (key === "clear") {
            expression = "";
            history.textContent = "";
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
                history.textContent = expression + " =";
                expression = String(safeCalculate(expression));
            } catch {
                expression = "Error";
            }
            updateDisplay();
        }
    });
});

// PIN SCREEN LOGIC
function openPinScreen(forPinChange = false) {
    isVerifyingOldPinForChange = forPinChange;
    calcApp.classList.add("hidden");
    vaultScreen.classList.add("hidden");
    pinScreen.classList.remove("hidden");
    
    if (isVerifyingOldPinForChange) {
        pinScreenTitle.textContent = "Enter Old PIN";
    } else {
        pinScreenTitle.textContent = "Enter PIN";
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
    btn.addEventListener("click", () => {
        if (currentPin.length < 4) {
            currentPin += btn.dataset.pin;
            updateDots();
        }
    });
});

pinDelete.addEventListener("click", () => {
    currentPin = currentPin.slice(0, -1);
    updateDots();
});

pinSubmit.addEventListener("click", () => {
    if (currentPin === SECRET_PIN) {
        if (isVerifyingOldPinForChange) {
            pinScreen.classList.add("hidden");
            vaultScreen.classList.remove("hidden");
            upgradeModal.classList.remove("hidden");
            isVerifyingOldPinForChange = false;
        } else {
            pinScreen.classList.add("hidden");
            vaultScreen.classList.remove("hidden");
            loadStoredMedia();
        }
    } else {
        alert("Incorrect PIN");
        currentPin = "";
        updateDots();
    }
});

changePinBtn.addEventListener("click", () => {
    openPinScreen(true);
});

lockVaultBtn.addEventListener("click", () => {
    vaultScreen.classList.add("hidden");
    calcApp.classList.remove("hidden");
});

// FORGET PIN LINK LOGIC (Auto-subscribe aagathu, popup mattum kaattum)
if (forgotPinLink) {
    forgotPinLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (upgradeModal) {
            upgradeModal.classList.remove("hidden");
        }
    });
}

// DIRECT UPLOAD BUTTON CLICKS
tabPhotos.addEventListener("click", () => photoInput.click());
tabVideos.addEventListener("click", () => videoInput.click());

photoInput.addEventListener("change", (e) => handleFileUpload(e.target.files));
videoInput.addEventListener("change", (e) => handleFileUpload(e.target.files));

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
    photoInput.value = "";
    videoInput.value = "";
}

// FILTER SUB-TABS
subTabAll.addEventListener("click", (e) => setSubFilter("all", e.target));
subTabPhotos.addEventListener("click", (e) => setSubFilter("image", e.target));
subTabVideos.addEventListener("click", (e) => setSubFilter("video", e.target));

function setSubFilter(filter, target) {
    currentFilter = filter;
    document.querySelectorAll(".sub-tab").forEach(t => t.classList.remove("active"));
    target.classList.add("active");
    renderMedia();
}

// RENDER GALLERY
function renderMedia() {
    mediaGrid.innerHTML = "";

    const filtered = mediaFiles.filter(item => {
        if (currentFilter === "all") return true;
        return item.type === currentFilter;
    });

    if (filtered.length === 0) {
        mediaGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #62748e; padding: 20px;">No media found.</p>`;
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
    const percent = ((totalBytes / STORAGE_LIMIT_BYTES) * 100).toFixed(1);

    storageUsedText.textContent = `Used: ${usedMB} MB`;
    storagePercent.textContent = `${percent}%`;
    progressBar.style.width = `${Math.min(percent, 100)}%`;
}

// PREVIEW MODAL LOGIC
function openPreview(item, mediaUrl) {
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
}

closePreview.addEventListener("click", () => {
    previewModal.classList.add("hidden");
    previewContainer.innerHTML = "";
});

// MODAL & UPGRADE LOGIC
if (openUpgradeModal) {
    openUpgradeModal.addEventListener("click", () => upgradeModal.classList.remove("hidden"));
}
if (closeModal) {
    closeModal.addEventListener("click", () => upgradeModal.classList.add("hidden"));
}
if (confirmSubscribe) {
    confirmSubscribe.addEventListener("click", () => {
        alert("Payment gateway backend integration required to activate subscription and 10GB storage.");
    });
}

// REGISTER SERVICE WORKER FOR PWA (ADDED FIX)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
