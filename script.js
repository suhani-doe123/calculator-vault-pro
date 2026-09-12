// ==========================================
// DOM
// ==========================================

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
const pinDescription = document.getElementById('pinDescription');
const forgotPinBtn = document.querySelector('.forgot-pin');
const pinBackBtn = document.getElementById('pinBackBtn');

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
const emptyState = document.getElementById('emptyState');

const storagePercent = document.getElementById('storagePercent');
const progressBar = document.getElementById('progressBar');
const storageUsed = document.getElementById('storageUsed');
const storageTotal = document.getElementById('storageTotal');

const previewModal = document.getElementById('previewModal');
const closePreviewBtn = document.getElementById('closePreview');
const previewContainer = document.getElementById('previewContainer');

const upgradeModal = document.getElementById('upgradeModal');
const openUpgradeModal = document.getElementById('openUpgradeModal');
const closeModalBtn = document.getElementById('closeModal');
const confirmSubscribeBtn = document.getElementById('confirmSubscribe');

const premiumBannerTitle = document.getElementById('premiumBannerTitle');
const premiumBannerText = document.getElementById('premiumBannerText');
const upgradeBtn = document.getElementById('upgradeBtn');

const toast = document.getElementById('toast');


// ==========================================
// APP STATE
// ==========================================

let currentInput = '0';
let calculationHistory = '';

let storedPin =
    localStorage.getItem('vault_pin') || '1234';

let enteredPin = '';
let pinState = 'verify';
let tempNewPin = '';

let mediaFiles = [];
let activeSubFilter = 'all';

let premiumActive =
    localStorage.getItem('premium_active') === 'true';


// ==========================================
// STORAGE LIMIT
// Premium activate ஆனாலும் 1GB தான்
// ==========================================

const STORAGE_LIMIT_MB = 1024;


// ==========================================
// LOAD SAVED MEDIA
// ==========================================

try {

    const savedMedia =
        localStorage.getItem('vault_media');

    if (savedMedia) {

        mediaFiles =
            JSON.parse(savedMedia);

        if (!Array.isArray(mediaFiles)) {

            mediaFiles = [];

        }

    }

} catch (error) {

    console.error(
        'Could not load vault media:',
        error
    );

    mediaFiles = [];

}


// ==========================================
// TOAST
// ==========================================

function showToast(message) {

    if (!toast) {

        alert(message);

        return;

    }

    toast.textContent = message;

    toast.classList.remove('hidden');

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(
        function () {

            toast.classList.add('hidden');

        },
        2200
    );

}


// ==========================================
// SCREEN SWITCH
// ==========================================

function showScreen(screen) {

    [
        calcApp,
        pinScreen,
        vaultScreen
    ].forEach(
        function (item) {

            if (item) {

                item.classList.add('hidden');

            }

        }
    );

    if (screen) {

        screen.classList.remove('hidden');

    }

}


// ==========================================
// PREMIUM CHECK
// ==========================================

function isPremiumActive() {

    return (
        localStorage.getItem(
            'premium_active'
        ) === 'true'
    );

}


// ==========================================
// PREMIUM UI
// ==========================================

function updatePremiumUI() {

    premiumActive =
        isPremiumActive();

    if (premiumActive) {

        if (premiumBannerTitle) {

            premiumBannerTitle.textContent =
                'Pro+ Active';

        }

        if (premiumBannerText) {

            premiumBannerText.textContent =
                'Premium features active. Storage remains 1 GB.';

        }

        if (upgradeBtn) {

            upgradeBtn.textContent =
                'Active';

        }

    } else {

        if (premiumBannerTitle) {

            premiumBannerTitle.textContent =
                'Unlock Pro+ Features';

        }

        if (premiumBannerText) {

            premiumBannerText.textContent =
                'Activate premium features.';

        }

        if (upgradeBtn) {

            upgradeBtn.textContent =
                'Upgrade';

        }

    }

}


// ==========================================
// CALCULATOR
// ==========================================

if (keypad) {

    keypad.addEventListener(
        'click',
        function (event) {

            const key =
                event.target.closest('.key');

            if (!key) return;

            const value =
                key.dataset.value;

            const keyType =
                key.dataset.key;


            // ==================================
            // RESET AFTER ERROR
            // ==================================

            if (
                currentInput === 'Error' &&
                value !== undefined
            ) {

                currentInput =
                    value === '.'
                        ? '0.'
                        : value;

                calculationHistory = '';

                updateDisplay();

                return;

            }


            // ==================================
            // NUMBER / OPERATOR
            // ==================================

            if (value !== undefined) {

                const operators = [
                    '+',
                    '-',
                    '*',
                    '/'
                ];


                if (
                    operators.includes(value)
                ) {

                    if (
                        currentInput === 'Error'
                    ) {

                        currentInput = '0';

                    }

                    const lastCharacter =
                        currentInput.slice(-1);

                    if (
                        operators.includes(
                            lastCharacter
                        )
                    ) {

                        currentInput =
                            currentInput.slice(
                                0,
                                -1
                            ) + value;

                    } else {

                        currentInput += value;

                    }

                }

                else if (
                    value === '.'
                ) {

                    const currentNumber =
                        currentInput
                            .split(/[+\-*/]/)
                            .pop();

                    if (
                        !currentNumber.includes('.')
                    ) {

                        currentInput += '.';

                    }

                }

                else {

                    if (
                        currentInput === '0'
                    ) {

                        currentInput = value;

                    } else {

                        currentInput += value;

                    }

                }

            }


            // ==================================
            // CLEAR
            // ==================================

            else if (
                keyType === 'clear'
            ) {

                currentInput = '0';

                calculationHistory = '';

            }


            // ==================================
            // DELETE
            // ==================================

            else if (
                keyType === 'delete'
            ) {

                if (
                    currentInput === 'Error'
                ) {

                    currentInput = '0';

                } else {

                    currentInput =
                        currentInput.length > 1
                            ? currentInput.slice(
                                0,
                                -1
                            )
                            : '0';

                }

            }


            // ==================================
            // SQRT
            // ==================================

            else if (
                keyType === 'sqrt'
            ) {

                try {

                    const number =
                        Number(currentInput);

                    if (
                        !Number.isFinite(number) ||
                        number < 0
                    ) {

                        throw new Error(
                            'Invalid square root'
                        );

                    }

                    calculationHistory =
                        `√(${currentInput})`;

                    currentInput =
                        String(
                            Math.sqrt(number)
                        );

                } catch (error) {

                    currentInput =
                        'Error';

                }

            }


            // ==================================
            // EQUAL
            // ==================================

            else if (
                keyType === 'equal'
            ) {


                // ==================================
                // SECRET VAULT TRIGGER
                // PIN + =
                // ==================================

                if (
                    currentInput === storedPin
                ) {

                    openPinScreen(
                        'verify'
                    );

                    currentInput = '0';

                    calculationHistory = '';

                    updateDisplay();

                    return;

                }


                // ==================================
                // NORMAL CALCULATION
                // ==================================

                try {

                    if (
                        !/^[0-9+\-*/.() ]+$/
                            .test(currentInput)
                    ) {

                        throw new Error(
                            'Invalid expression'
                        );

                    }

                    const result =
                        Function(
                            `"use strict"; return (${currentInput})`
                        )();

                    if (
                        !Number.isFinite(result)
                    ) {

                        throw new Error(
                            'Invalid result'
                        );

                    }

                    calculationHistory =
                        currentInput + ' =';

                    currentInput =
                        String(result);

                } catch (error) {

                    currentInput =
                        'Error';

                }

            }

            updateDisplay();

        }
    );

}


// ==========================================
// UPDATE DISPLAY
// ==========================================

function updateDisplay() {

    if (display) {

        display.textContent =
            currentInput;

    }

    if (historyDisplay) {

        historyDisplay.textContent =
            calculationHistory;

    }

}


// ==========================================
// DOUBLE CLICK DISPLAY
// ==========================================

if (display) {

    display.addEventListener(
        'dblclick',
        function () {

            openPinScreen(
                'verify'
            );

        }
    );

}


// ==========================================
// OPEN PIN SCREEN
// ==========================================

function openPinScreen(state) {

    pinState = state;

    enteredPin = '';

    updatePinDots();

    showScreen(pinScreen);


    // VERIFY
    if (
        state === 'verify'
    ) {

        if (pinScreenTitle) {

            pinScreenTitle.textContent =
                'Enter Secret PIN';

        }

        if (pinDescription) {

            pinDescription.textContent =
                'Enter your 4-digit security PIN.';

        }

        if (forgotPinBtn) {

            forgotPinBtn.classList.remove(
                'hidden'
            );

        }

    }


    // SET NEW
    else if (
        state === 'set_new'
    ) {

        if (pinScreenTitle) {

            pinScreenTitle.textContent =
                'Set New PIN';

        }

        if (pinDescription) {

            pinDescription.textContent =
                'Enter your new 4-digit PIN.';

        }

        if (forgotPinBtn) {

            forgotPinBtn.classList.add(
                'hidden'
            );

        }

    }


    // CONFIRM
    else if (
        state === 'confirm_new'
    ) {

        if (pinScreenTitle) {

            pinScreenTitle.textContent =
                'Confirm New PIN';

        }

        if (pinDescription) {

            pinDescription.textContent =
                'Enter the same PIN again.';

        }

        if (forgotPinBtn) {

            forgotPinBtn.classList.add(
                'hidden'
            );

        }

    }

}


// ==========================================
// PIN KEYPAD
// ==========================================

if (pinPad) {

    pinPad.addEventListener(
        'click',
        function (event) {

            const button =
                event.target.closest(
                    '.pin-btn'
                );

            if (!button) return;

            const pinValue =
                button.dataset.pin;


            // NUMBER
            if (
                pinValue !== undefined
            ) {

                if (
                    enteredPin.length < 4
                ) {

                    enteredPin +=
                        pinValue;

                    updatePinDots();

                }

            }


            // DELETE
            else if (
                button.id ===
                'pinDelete'
            ) {

                enteredPin =
                    enteredPin.slice(
                        0,
                        -1
                    );

                updatePinDots();

            }


            // SUBMIT
            else if (
                button.id ===
                'pinSubmit'
            ) {

                handlePinSubmit();

            }

        }
    );

}


// ==========================================
// UPDATE DOTS
// ==========================================

function updatePinDots() {

    pinDots.forEach(
        function (dot, index) {

            if (
                index <
                enteredPin.length
            ) {

                dot.classList.add(
                    'filled'
                );

            } else {

                dot.classList.remove(
                    'filled'
                );

            }

        }
    );

}


// ==========================================
// PIN SUBMIT
// ==========================================

function handlePinSubmit() {

    if (
        enteredPin.length !== 4
    ) {

        showToast(
            'Enter all 4 digits'
        );

        return;

    }


    // ==================================
    // VERIFY
    // ==================================

    if (
        pinState === 'verify'
    ) {

        if (
            enteredPin === storedPin
        ) {

            enteredPin = '';

            updatePinDots();

            showScreen(
                vaultScreen
            );

            renderVaultMedia();

            updateStorageInfo();

            updatePremiumUI();

        } else {

            showToast(
                'Incorrect PIN'
            );

            enteredPin = '';

            updatePinDots();

        }

    }


    // ==================================
    // SET NEW
    // ==================================

    else if (
        pinState === 'set_new'
    ) {

        tempNewPin =
            enteredPin;

        openPinScreen(
            'confirm_new'
        );

    }


    // ==================================
    // CONFIRM NEW
    // ==================================

    else if (
        pinState === 'confirm_new'
    ) {

        if (
            enteredPin === tempNewPin
        ) {

            storedPin =
                enteredPin;

            localStorage.setItem(
                'vault_pin',
                storedPin
            );

            enteredPin = '';

            tempNewPin = '';

            updatePinDots();

            showToast(
                'PIN changed successfully'
            );

            showScreen(
                vaultScreen
            );

            renderVaultMedia();

            updateStorageInfo();

            updatePremiumUI();

        } else {

            showToast(
                'PINs do not match'
            );

            tempNewPin = '';

            openPinScreen(
                'set_new'
            );

        }

    }

}


// ==========================================
// FORGOT PIN
// ==========================================
//
// IMPORTANT:
// Forgot PIN click:
// 1. PIN காட்டாது
// 2. Reset screen open ஆகாது
// 3. "Please Activate Pro" வரும்
// 4. Pro modal open ஆகும்
//
// ==========================================

if (forgotPinBtn) {

    forgotPinBtn.addEventListener(
        'click',
        function (event) {

            event.preventDefault();


            showToast(
                'Please Activate Pro'
            );


            if (upgradeModal) {

                upgradeModal.classList.remove(
                    'hidden'
                );

            }

        }
    );

}


// ==========================================
// PIN BACK
// ==========================================

if (pinBackBtn) {

    pinBackBtn.addEventListener(
        'click',
        function () {

            enteredPin = '';

            tempNewPin = '';

            updatePinDots();


            if (
                pinState === 'set_new' ||
                pinState === 'confirm_new'
            ) {

                showScreen(
                    vaultScreen
                );

            } else {

                showScreen(
                    calcApp
                );

            }

        }
    );

}


// ==========================================
// LOCK VAULT
// ==========================================

if (lockVaultBtn) {

    lockVaultBtn.addEventListener(
        'click',
        function () {

            currentInput = '0';

            calculationHistory = '';

            enteredPin = '';

            updateDisplay();

            updatePinDots();

            showScreen(
                calcApp
            );

        }
    );

}


// ==========================================
// CHANGE PIN
// ==========================================

if (changePinBtn) {

    changePinBtn.addEventListener(
        'click',
        function () {

            openPinScreen(
                'set_new'
            );

        }
    );

}


// ==========================================
// PHOTO BUTTON
// ==========================================

if (
    tabPhotos &&
    photoInput
) {

    tabPhotos.addEventListener(
        'click',
        function () {

            photoInput.click();

        }
    );

}


// ==========================================
// VIDEO BUTTON
// ==========================================

if (
    tabVideos &&
    videoInput
) {

    tabVideos.addEventListener(
        'click',
        function () {

            videoInput.click();

        }
    );

}


// ==========================================
// PHOTO INPUT
// ==========================================

if (photoInput) {

    photoInput.addEventListener(
        'change',
        function (event) {

            handleFiles(
                event.target.files,
                'image'
            );

        }
    );

}


// ==========================================
// VIDEO INPUT
// ==========================================

if (videoInput) {

    videoInput.addEventListener(
        'change',
        function (event) {

            handleFiles(
                event.target.files,
                'video'
            );

        }
    );

}


// ==========================================
// HANDLE FILES
// ==========================================

function handleFiles(
    files,
    type
) {

    const selectedFiles =
        Array.from(files);

    if (
        selectedFiles.length === 0
    ) {

        return;

    }


    selectedFiles.forEach(
        function (file) {


            if (
                type === 'image' &&
                !file.type.startsWith(
                    'image/'
                )
            ) {

                return;

            }


            if (
                type === 'video' &&
                !file.type.startsWith(
                    'video/'
                )
            ) {

                return;

            }


            // ==================================
            // STORAGE CHECK
            // ==================================

            const currentBytes =
                mediaFiles.reduce(
                    function (
                        total,
                        item
                    ) {

                        return (
                            total +
                            Number(
                                item.size || 0
                            )
                        );

                    },
                    0
                );


            const maxBytes =
                STORAGE_LIMIT_MB *
                1024 *
                1024;


            if (
                currentBytes +
                file.size >
                maxBytes
            ) {

                showToast(
                    '1 GB storage limit reached'
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function (
                    uploadEvent
                ) {

                    const newFile = {

                        id:
                            Date.now() +
                            Math.random(),

                        type:
                            type,

                        url:
                            uploadEvent
                                .target
                                .result,

                        size:
                            file.size,

                        name:
                            file.name

                    };


                    mediaFiles.push(
                        newFile
                    );


                    try {

                        localStorage.setItem(
                            'vault_media',
                            JSON.stringify(
                                mediaFiles
                            )
                        );

                    } catch (error) {

                        mediaFiles.pop();

                        showToast(
                            'Browser storage is full'
                        );

                        console.error(
                            error
                        );

                        return;

                    }


                    renderVaultMedia();

                    updateStorageInfo();

                };


            reader.onerror =
                function () {

                    showToast(
                        'Could not read file'
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );


    if (photoInput) {

        photoInput.value = '';

    }


    if (videoInput) {

        videoInput.value = '';

    }

}


// ==========================================
// FILTERS
// ==========================================

if (subTabAll) {

    subTabAll.addEventListener(
        'click',
        function () {

            setSubFilter(
                'all'
            );

        }
    );

}


if (subTabPhotos) {

    subTabPhotos.addEventListener(
        'click',
        function () {

            setSubFilter(
                'image'
            );

        }
    );

}


if (subTabVideos) {

    subTabVideos.addEventListener(
        'click',
        function () {

            setSubFilter(
                'video'
            );

        }
    );

}


// ==========================================
// SET FILTER
// ==========================================

function setSubFilter(
    filter
) {

    activeSubFilter =
        filter;


    [
        subTabAll,
        subTabPhotos,
        subTabVideos
    ].forEach(
        function (button) {

            if (button) {

                button.classList.remove(
                    'active'
                );

            }

        }
    );


    if (
        filter === 'all' &&
        subTabAll
    ) {

        subTabAll.classList.add(
            'active'
        );

    }


    if (
        filter === 'image' &&
        subTabPhotos
    ) {

        subTabPhotos.classList.add(
            'active'
        );

    }


    if (
        filter === 'video' &&
        subTabVideos
    ) {

        subTabVideos.classList.add(
            'active'
        );

    }


    renderVaultMedia();

}


// ==========================================
// RENDER MEDIA
// ==========================================

function renderVaultMedia() {

    if (!mediaGrid) return;


    mediaGrid.innerHTML = '';


    const filtered =
        mediaFiles.filter(
            function (item) {

                if (
                    activeSubFilter ===
                    'all'
                ) {

                    return true;

                }

                return (
                    item.type ===
                    activeSubFilter
                );

            }
        );


    if (emptyState) {

        emptyState.style.display =
            filtered.length === 0
                ? 'flex'
                : 'none';

    }


    if (
        filtered.length === 0
    ) {

        return;

    }


    filtered.forEach(
        function (item) {


            const div =
                document.createElement(
                    'div'
                );


            div.className =
                'media-item';


            let mediaElement;


            // IMAGE
            if (
                item.type ===
                'image'
            ) {

                mediaElement =
                    document.createElement(
                        'img'
                    );


                mediaElement.src =
                    item.url;


                mediaElement.alt =
                    item.name ||
                    'Vault photo';


                mediaElement.loading =
                    'lazy';

            }


            // VIDEO
            else {

                mediaElement =
                    document.createElement(
                        'video'
                    );


                mediaElement.src =
                    item.url;


                mediaElement.preload =
                    'metadata';


                mediaElement.muted =
                    true;


                mediaElement.setAttribute(
                    'playsinline',
                    'true'
                );

            }


            // DELETE
            const deleteButton =
                document.createElement(
                    'button'
                );


            deleteButton.className =
                'delete-btn';


            deleteButton.type =
                'button';


            deleteButton.innerHTML =
                '&times;';


            deleteButton.addEventListener(
                'click',
                function (event) {

                    event.stopPropagation();


                    const shouldDelete =
                        confirm(
                            'Delete this file?'
                        );


                    if (
                        shouldDelete
                    ) {

                        deleteMedia(
                            item.id
                        );

                    }

                }
            );


            div.appendChild(
                mediaElement
            );


            div.appendChild(
                deleteButton
            );


            div.addEventListener(
                'click',
                function () {

                    openPreview(
                        item
                    );

                }
            );


            mediaGrid.appendChild(
                div
            );

        }
    );

}


// ==========================================
// DELETE MEDIA
// ==========================================

function deleteMedia(id) {

    mediaFiles =
        mediaFiles.filter(
            function (item) {

                return (
                    item.id !== id
                );

            }
        );


    try {

        localStorage.setItem(
            'vault_media',
            JSON.stringify(
                mediaFiles
            )
        );

    } catch (error) {

        console.error(
            error
        );

    }


    renderVaultMedia();

    updateStorageInfo();

}


// ==========================================
// STORAGE INFO
// ==========================================

function updateStorageInfo() {

    const totalBytes =
        mediaFiles.reduce(
            function (
                total,
                item
            ) {

                return (
                    total +
                    Number(
                        item.size || 0
                    )
                );

            },
            0
        );


    const totalMb =
        totalBytes /
        (1024 * 1024);


    const percent =
        Math.min(
            Math.round(
                (
                    totalMb /
                    STORAGE_LIMIT_MB
                ) * 100
            ),
            100
        );


    if (storageUsed) {

        storageUsed.textContent =
            `${totalMb.toFixed(2)} MB used`;

    }


    if (storagePercent) {

        storagePercent.textContent =
            `${percent}%`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${percent}%`;

    }


    if (storageTotal) {

        storageTotal.textContent =
            '1 GB total';

    }

}


// ==========================================
// PREVIEW
// ==========================================

function openPreview(item) {

    if (
        !previewContainer ||
        !previewModal
    ) {

        return;

    }


    previewContainer.innerHTML =
        '';


    let element;


    if (
        item.type === 'image'
    ) {

        element =
            document.createElement(
                'img'
            );


        element.src =
            item.url;


        element.alt =
            item.name ||
            'Vault image';

    } else {

        element =
            document.createElement(
                'video'
            );


        element.src =
            item.url;


        element.controls =
            true;


        element.autoplay =
            true;


        element.muted =
            false;


        element.setAttribute(
            'playsinline',
            'true'
        );

    }


    previewContainer.appendChild(
        element
    );


    previewModal.classList.remove(
        'hidden'
    );

}


// ==========================================
// CLOSE PREVIEW
// ==========================================

function closePreviewModal() {

    if (!previewModal) return;


    const video =
        previewContainer
            ? previewContainer.querySelector(
                'video'
            )
            : null;


    if (video) {

        video.pause();

    }


    previewModal.classList.add(
        'hidden'
    );


    if (previewContainer) {

        previewContainer.innerHTML =
            '';

    }

}


// ==========================================
// PREVIEW BUTTON
// ==========================================

if (closePreviewBtn) {

    closePreviewBtn.addEventListener(
        'click',
        closePreviewModal
    );

}


// ==========================================
// PREVIEW OUTSIDE
// ==========================================

if (previewModal) {

    previewModal.addEventListener(
        'click',
        function (event) {

            if (
                event.target ===
                previewModal
            ) {

                closePreviewModal();

            }

        }
    );

}


// ==========================================
// OPEN PREMIUM MODAL
// ==========================================

if (
    openUpgradeModal &&
    upgradeModal
) {

    openUpgradeModal.addEventListener(
        'click',
        function () {

            if (
                isPremiumActive()
            ) {

                showToast(
                    'Pro+ Already Active'
                );

                return;

            }


            upgradeModal.classList.remove(
                'hidden'
            );

        }
    );

}


// ==========================================
// CLOSE PREMIUM MODAL
// ==========================================

if (
    closeModalBtn &&
    upgradeModal
) {

    closeModalBtn.addEventListener(
        'click',
        function () {

            upgradeModal.classList.add(
                'hidden'
            );

        }
    );

}


// ==========================================
// MODAL OUTSIDE CLICK
// ==========================================

if (upgradeModal) {

    upgradeModal.addEventListener(
        'click',
        function (event) {

            if (
                event.target ===
                upgradeModal
            ) {

                upgradeModal.classList.add(
                    'hidden'
                );

            }

        }
    );

}


// ==========================================
// ACTIVATE PRO
// ==========================================
//
// IMPORTANT:
//
// Pro active ஆகும்
// BUT
// 10GB active ஆகாது
//
// ==========================================

if (confirmSubscribeBtn) {

    confirmSubscribeBtn.addEventListener(
        'click',
        function () {


            localStorage.setItem(
                'premium_active',
                'true'
            );


            premiumActive = true;


            if (upgradeModal) {

                upgradeModal.classList.add(
                    'hidden'
                );

            }


            updatePremiumUI();


            showToast(
                'Pro+ Activated'
            );

        }
    );

}


// ==========================================
// INITIAL SETUP
// ==========================================

updateDisplay();

renderVaultMedia();

updateStorageInfo();

updatePremiumUI();
