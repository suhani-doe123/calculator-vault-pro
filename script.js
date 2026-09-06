// --- DOM ELEMENTS ---
const calcApp = document.getElementById('calcApp');
const pinScreen = document.getElementById('pinScreen');
const vaultScreen = document.getElementById('vaultScreen');

const display = document.getElementById('display');
const historyDisplay = document.getElementById('history');
const keypad = document.querySelector('.keypad');

const pinDots = document.querySelectorAll('.dot');
const pinPad = document.querySelector('.pin-pad');
const pinDelete = document.getElementById('pinDelete');
const pinSubmit = document.getElementById('pinSubmit');
const pinScreenTitle = document.getElementById('pinScreenTitle');
const forgotPinBtn = document.querySelector('.forgot-pin');

const lockVaultBtn = document.getElementById('lockVault');
const changePinBtn = document.getElementById('changePinBtn');

const tabPhotos = document.getElementById('tabPhotos');
const tabVideos = document.getElementById('tabVideos');
const photoInput = document.getElementById('photoInput');
const videoInput = document.getElementById('videoInput');

const subTabAll = document.getElementById('subTabAll');
const subTabPhotos = document.getElementById('subTabPhotos');
const subTabVideos = document.getElementById('subTabVideos');

const mediaGrid = document.getElementById('mediaGrid');
const storagePercent = document.getElementById('storagePercent');
const progressBar = document.getElementById('progressBar');
const storageUsed = document.getElementById('storageUsed');

const previewModal = document.getElementById('previewModal');
const closePreviewBtn = document.getElementById('closePreview');
const previewContainer = document.getElementById('previewContainer');

const upgradeModal = document.getElementById('upgradeModal');
const openUpgradeModal = document.getElementById('openUpgradeModal');
const closeModalBtn = document.getElementById('closeModal');
const confirmSubscribeBtn = document.getElementById('confirmSubscribe');

// --- APP STATE ---
let currentInput = '0';
let calculationHistory = '';
let storedPin = localStorage.getItem('vault_pin') || '1234';
let enteredPin = '';
let pinState = 'verify'; // 'verify', 'set_new', 'confirm_new'
let tempNewPin = '';
let mediaFiles = JSON.parse(localStorage.getItem('vault_media')) || [];
let activeSubFilter = 'all'; // 'all', 'photos', 'videos'

// --- CALCULATOR LOGIC ---
keypad.addEventListener('click', (e) => {
    if (!e.target.classList.contains('key')) return;
    const value = e.target.dataset.value;
    const keyType = e.target.dataset.key;

    if (value !== undefined) {
        if (currentInput === '0' && value !== '.') {
            currentInput = value;
        } else {
            currentInput += value;
        }
    } else if (keyType === 'clear') {
        currentInput = '0';
        calculationHistory = '';
    } else if (keyType === 'delete') {
        currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
    } else if (keyType === 'sqrt') {
        try {
            let num = parseFloat(currentInput);
            if (num < 0) throw new Error();
            currentInput = Math.sqrt(num).toString();
        } catch {
            currentInput = 'Error';
        }
    } else if (keyType === 'equal') {
        try {
            let evalString = currentInput.replace(/×/g, '*').replace(/÷/g, '/');
            let result = eval(evalString);
            calculationHistory = currentInput + ' =';
            currentInput = result.toString();
        } catch {
            currentInput = 'Error';
        }
    }

    // Check PIN trigger (e.g., entering specific code like 1234= or long press logic if needed, 
    // Here let's hook up if someone types PIN and hits '=' or let's keep standard secret vault trigger:
    // If user inputs specific pattern or presses a secret trigger, e.g., typing PIN + '=')
    if (keyType === 'equal' && currentInput === storedPin) {
        openPinScreen('verify');
        currentInput = '0';
    }

    updateDisplay();
});

function updateDisplay() {
    display.textContent = currentInput;
    historyDisplay.textContent = calculationHistory;
}

// --- SECRET VAULT / PIN ENTRY LOGIC ---
// To test vault directly or via a trigger mechanism (e.g., long click on clear or entering PIN and hitting =)
// For demonstration, clicking the history screen or typing PIN can open PIN screen. 
// Let's attach an easy listener or maintain standard flow:
display.addEventListener('dblclick', () => {
    openPinScreen('verify');
});

function openPinScreen(state) {
    pinState = state;
    enteredPin = '';
    updatePinDots();
    calcApp.classList.add('hidden');
    vaultScreen.classList.add('hidden');
    pinScreen.classList.remove('hidden');

    if (state === 'verify') {
        pinScreenTitle.textContent = 'Enter Secret PIN';
    } else if (state === 'set_new') {
        pinScreenTitle.textContent = 'Set New PIN (4 Digits)';
    } else if (state === 'confirm_new') {
        pinScreenTitle.textContent = 'Confirm New PIN';
    }
}

pinPad.addEventListener('click', (e) => {
    if (!e.target.classList.contains('pin-btn')) return;
    const pinVal = e.target.dataset.pin;
    
    if (pinVal !== undefined) {
        if (enteredPin.length < 4) {
            enteredPin += pinVal;
            updatePinDots();
        }
    } else if (e.target.id === 'pinDelete') {
        enteredPin = enteredPin.slice(0, -1);
        updatePinDots();
    } else if (e.target.id === 'pinSubmit') {
        handlePinSubmit();
    }
});

function updatePinDots() {
    pinDots.forEach((dot, index) => {
        if (index < enteredPin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

function handlePinSubmit() {
    if (enteredPin.length !== 4) return;

    if (pinState === 'verify') {
        if (enteredPin === storedPin) {
            pinScreen.classList.add('hidden');
            vaultScreen.classList.remove('hidden');
            renderVaultMedia();
            updateStorageInfo();
        } else {
            alert('Incorrect PIN');
            enteredPin = '';
            updatePinDots();
        }
    } else if (pinState === 'set_new') {
        tempNewPin = enteredPin;
        openPinScreen('confirm_new');
    } else if (pinState === 'confirm_new') {
        if (enteredPin === tempNewPin) {
            storedPin = enteredPin;
            localStorage.setItem('vault_pin', storedPin);
            alert('PIN Successfully Changed!');
            pinScreen.classList.add('hidden');
            vaultScreen.classList.remove('hidden');
        } else {
            alert('PINs do not match. Try again.');
            openPinScreen('set_new');
        }
    }
}

forgotPinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Default PIN is 1234');
});

// --- VAULT SCREEN LOGIC ---
lockVaultBtn.addEventListener('click', () => {
    vaultScreen.classList.add('hidden');
    calcApp.classList.remove('hidden');
    currentInput = '0';
    calculationHistory = '';
    updateDisplay();
});

changePinBtn.addEventListener('click', () => {
    openPinScreen('set_new');
});

// File Upload Actions
tabPhotos.addEventListener('click', () => photoInput.click());
tabVideos.addEventListener('click', () => videoInput.click());

photoInput.addEventListener('change', (e) => handleFiles(e.target.files, 'image'));
videoInput.addEventListener('change', (e) => handleFiles(e.target.files, 'video'));

function handleFiles(files, type) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
            mediaFiles.push({
                id: Date.now() + Math.random(),
                type: type,
                url: uploadEvent.target.result,
                size: file.size
            });
            localStorage.setItem('vault_media', JSON.stringify(mediaFiles));
            renderVaultMedia();
            updateStorageInfo();
        };
        reader.readAsDataURL(file);
    });
}

// Sub-tabs filtering
subTabAll.addEventListener('click', () => setSubFilter('all'));
subTabPhotos.addEventListener('click', () => setSubFilter('image'));
subTabVideos.addEventListener('click', () => setSubFilter('video'));

function setSubFilter(filter) {
    activeSubFilter = filter;
    [subTabAll, subTabPhotos, subTabVideos].forEach(btn => btn.classList.remove('active'));
    if (filter === 'all') subTabAll.classList.add('active');
    if (filter === 'image') subTabPhotos.classList.add('active');
    if (filter === 'video') subTabVideos.classList.add('active');
    renderVaultMedia();
}

function renderVaultMedia() {
    mediaGrid.innerHTML = '';
    let filtered = mediaFiles.filter(item => {
        if (activeSubFilter === 'all') return true;
        return item.type === activeSubFilter;
    });

    if (filtered.length === 0) {
        mediaGrid.innerHTML = `<p style="grid-column: span 3; text-align: center; color: #8b949e; padding: 20px;">No files found</p>`;
        return;
    }

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'media-item';

        let mediaEl;
        if (item.type === 'image') {
            mediaEl = document.createElement('img');
            mediaEl.src = item.url;
        } else {
            mediaEl = document.createElement('video');
            mediaEl.src = item.url;
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = '&times;';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteMedia(item.id);
        };

        div.appendChild(mediaEl);
        div.appendChild(delBtn);

        div.onclick = () => openPreview(item, item.url);
        mediaGrid.appendChild(div);
    });
}

function deleteMedia(id) {
    mediaFiles = mediaFiles.filter(item => item.id !== id);
    localStorage.setItem('vault_media', JSON.stringify(mediaFiles));
    renderVaultMedia();
    updateStorageInfo();
}

function updateStorageInfo() {
    let totalBytes = mediaFiles.reduce((acc, curr) => acc + (curr.size || 500000), 0);
    let totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
    let maxMb = 1024; // 1 GB
    let percent = Math.min(Math.round((totalMb / maxMb) * 100), 100);

    storageUsed.textContent = `Used: ${totalMb} MB`;
    storagePercent.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;
}

// --- PREVIEW MODAL LOGIC (WITH BACK BUTTON FIX) ---
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
        el.muted = true;
        el.setAttribute("playsinline", "true");
    }
    previewContainer.appendChild(el);
    previewModal.classList.remove("hidden");

    // Push state so physical/system back button closes preview instead of exiting app
    history.pushState({ modalOpen: true }, "");
}

function closePreviewModal() {
    if (previewModal && !previewModal.classList.contains("hidden")) {
        previewModal.classList.add("hidden");
        if (previewContainer) {
            previewContainer.innerHTML = ""; 
        }
        if (window.history.state && window.history.state.modalOpen) {
            window.history.back();
        }
    }
}

closePreviewBtn.addEventListener('click', closePreviewModal);

// Listen to browser / phone physical back button
window.addEventListener("popstate", (e) => {
    if (previewModal && !previewModal.classList.contains("hidden")) {
        previewModal.classList.add("hidden");
        if (previewContainer) {
            previewContainer.innerHTML = "";
        }
    }
});

// --- UPGRADE MODAL LOGIC ---
openUpgradeModal.addEventListener('click', () => {
    upgradeModal.classList.remove("hidden");
});

closeModalBtn.addEventListener('click', () => {
    upgradeModal.classList.add("hidden");
});

confirmSubscribeBtn.addEventListener('click', () => {
    alert('Thank you for upgrading! (Demo Mode)');
    upgradeModal.classList.add("hidden");
});
