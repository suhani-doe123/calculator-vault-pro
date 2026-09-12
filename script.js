// ============================================================
// CALCULATOR PRO - FULL SCRIPT
// IndexedDB Local Media Storage
// Premium PIN Recovery = $15/month
// Premium does NOT automatically unlock 10GB
// ============================================================


// ============================================================
// DOM ELEMENTS
// ============================================================

const calcApp = document.getElementById('calcApp');
const pinScreen = document.getElementById('pinScreen');
const vaultScreen = document.getElementById('vaultScreen');

const display = document.getElementById('display');
const historyDisplay = document.getElementById('history');
const keypad = document.querySelector('.keypad');

const pinDots = document.querySelectorAll('.dot');
const pinPad = document.querySelector('.pin-pad');

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


// ============================================================
// APP SETTINGS
// ============================================================

// FREE STORAGE DISPLAY LIMIT
// Premium does NOT change this automatically.
const FREE_STORAGE_LIMIT_MB = 1024;

// Separate 10GB purchase flag.
// Do NOT activate this from Premium subscription.
let storage10GBActive =
    localStorage.getItem('storage_10gb_active') === 'true';

function getStorageLimitMB() {

    return storage10GBActive
        ? 10240
        : FREE_STORAGE_LIMIT_MB;
}


// ============================================================
// PIN SETTINGS
// ============================================================

let storedPin =
    localStorage.getItem('vault_pin') || '1234';

let enteredPin = '';
let tempNewPin = '';
let pinState = 'verify';


// ============================================================
// CALCULATOR STATE
// ============================================================

let currentInput = '0';
let calculationHistory = '';


// ============================================================
// MEDIA STATE
// ============================================================

let mediaFiles = [];
let activeSubFilter = 'all';


// ============================================================
// PREMIUM STATE
// ============================================================

// IMPORTANT:
//
// Do not manually set:
//
// localStorage.setItem('premium_active', 'true')
//
// from Subscribe button.
//
// Premium should only become active after payment/server
// verification.
//
// This local value is only a cached verified entitlement.
let premiumActive =
    localStorage.getItem('premium_verified') === 'true';


// ============================================================
// INDEXEDDB SETTINGS
// ============================================================

const DB_NAME = 'CalculatorProVault';
const DB_VERSION = 1;
const STORE_NAME = 'media';

let vaultDB = null;


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

    if (!toast) {

        alert(message);
        return;
    }

    toast.textContent = message;

    toast.classList.remove('hidden');

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {

        toast.classList.add('hidden');

    }, 2300);
}


// ============================================================
// SCREEN SWITCH
// ============================================================

function showScreen(screen) {

    [
        calcApp,
        pinScreen,
        vaultScreen
    ].forEach(item => {

        if (item) {
            item.classList.add('hidden');
        }

    });

    if (screen) {
        screen.classList.remove('hidden');
    }
}


// ============================================================
// OPEN INDEXEDDB
// ============================================================

function openVaultDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

        request.onupgradeneeded = event => {

            const db =
                event.target.result;

            if (
                !db.objectStoreNames.contains(
                    STORE_NAME
                )
            ) {

                const store =
                    db.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: 'id',
                            autoIncrement: true
                        }
                    );

                store.createIndex(
                    'type',
                    'type',
                    {
                        unique: false
                    }
                );

                store.createIndex(
                    'createdAt',
                    'createdAt',
                    {
                        unique: false
                    }
                );
            }
        };

        request.onsuccess = event => {

            vaultDB =
                event.target.result;

            resolve(vaultDB);
        };

        request.onerror = event => {

            console.error(
                'IndexedDB open error:',
                event.target.error
            );

            reject(
                event.target.error
            );
        };
    });
}


// ============================================================
// ADD MEDIA TO INDEXEDDB
// ============================================================

function addMediaToDB(file, type) {

    return new Promise((resolve, reject) => {

        if (!vaultDB) {

            reject(
                new Error(
                    'Database not ready'
                )
            );

            return;
        }

        const transaction =
            vaultDB.transaction(
                STORE_NAME,
                'readwrite'
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const record = {

            name:
                file.name,

            type:
                type,

            mimeType:
                file.type,

            size:
                file.size,

            blob:
                file,

            createdAt:
                Date.now()
        };

        const request =
            store.add(record);

        request.onsuccess = () => {

            resolve(
                request.result
            );
        };

        request.onerror = () => {

            reject(
                request.error
            );
        };
    });
}


// ============================================================
// GET ALL MEDIA
// ============================================================

function getAllMediaFromDB() {

    return new Promise((resolve, reject) => {

        if (!vaultDB) {

            reject(
                new Error(
                    'Database not ready'
                )
            );

            return;
        }

        const transaction =
            vaultDB.transaction(
                STORE_NAME,
                'readonly'
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.getAll();

        request.onsuccess = () => {

            resolve(
                request.result || []
            );
        };

        request.onerror = () => {

            reject(
                request.error
            );
        };
    });
}


// ============================================================
// DELETE MEDIA FROM INDEXEDDB
// ============================================================

function deleteMediaFromDB(id) {

    return new Promise((resolve, reject) => {

        if (!vaultDB) {

            reject(
                new Error(
                    'Database not ready'
                )
            );

            return;
        }

        const transaction =
            vaultDB.transaction(
                STORE_NAME,
                'readwrite'
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.delete(id);

        request.onsuccess = () => {

            resolve();
        };

        request.onerror = () => {

            reject(
                request.error
            );
        };
    });
}


// ============================================================
// LOAD MEDIA
// ============================================================

async function loadMediaFiles() {

    try {

        mediaFiles =
            await getAllMediaFromDB();

        mediaFiles.sort(
            (a, b) =>
                b.createdAt -
                a.createdAt
        );

        renderVaultMedia();
        updateStorageInfo();

    } catch (error) {

        console.error(
            'Load media error:',
            error
        );

        showToast(
            'Could not load local media'
        );
    }
}


// ============================================================
// CALCULATOR
// ============================================================

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


            // VALUE
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

                    const last =
                        currentInput.slice(-1);

                    if (
                        operators.includes(last)
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

                    const part =
                        currentInput
                            .split(
                                /[+\-*/]/
                            )
                            .pop();

                    if (
                        !part.includes('.')
                    ) {

                        currentInput += '.';
                    }

                }


                else {

                    if (
                        currentInput === '0'
                    ) {

                        currentInput =
                            value;

                    } else {

                        currentInput +=
                            value;
                    }
                }
            }


            // CLEAR
            else if (
                keyType === 'clear'
            ) {

                currentInput = '0';
                calculationHistory = '';
            }


            // DELETE
            else if (
                keyType === 'delete'
            ) {

                currentInput =
                    currentInput.length > 1
                        ? currentInput.slice(
                            0,
                            -1
                        )
                        : '0';
            }


            // SQRT
            else if (
                keyType === 'sqrt'
            ) {

                const number =
                    Number(currentInput);

                if (
                    Number.isFinite(number) &&
                    number >= 0
                ) {

                    calculationHistory =
                        `√(${currentInput})`;

                    currentInput =
                        String(
                            Math.sqrt(number)
                        );

                } else {

                    currentInput =
                        'Error';
                }
            }


            // EQUAL
            else if (
                keyType === 'equal'
            ) {


                // SECRET VAULT TRIGGER

                if (
                    currentInput === storedPin
                ) {

                    currentInput = '0';

                    calculationHistory = '';

                    updateDisplay();

                    openPinScreen(
                        'verify'
                    );

                    return;
                }


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


// ============================================================
// UPDATE DISPLAY
// ============================================================

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


// ============================================================
// DOUBLE CLICK DISPLAY
// ============================================================

if (display) {

    display.addEventListener(
        'dblclick',
        () => {

            openPinScreen(
                'verify'
            );
        }
    );
}


// ============================================================
// OPEN PIN SCREEN
// ============================================================

function openPinScreen(state) {

    pinState = state;

    enteredPin = '';

    updatePinDots();

    showScreen(
        pinScreen
    );


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


// ============================================================
// PIN KEYPAD
// ============================================================

if (pinPad) {

    pinPad.addEventListener(
        'click',
        function (event) {

            const button =
                event.target.closest(
                    '.pin-btn'
                );

            if (!button) return;

            const number =
                button.dataset.pin;


            if (
                number !== undefined
            ) {

                if (
                    enteredPin.length < 4
                ) {

                    enteredPin +=
                        number;

                    updatePinDots();
                }
            }


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


            else if (
                button.id ===
                'pinSubmit'
            ) {

                handlePinSubmit();
            }
        }
    );
}


// ============================================================
// UPDATE PIN DOTS
// ============================================================

function updatePinDots() {

    pinDots.forEach(
        (dot, index) => {

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


// ============================================================
// PIN SUBMIT
// ============================================================

async function handlePinSubmit() {

    if (
        enteredPin.length !== 4
    ) {

        showToast(
            'Enter all 4 digits'
        );

        return;
    }


    // VERIFY
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

            await loadMediaFiles();

            updatePremiumUI();

        } else {

            showToast(
                'Incorrect PIN'
            );

            enteredPin = '';

            updatePinDots();
        }
    }


    // SET NEW PIN
    else if (
        pinState === 'set_new'
    ) {

        tempNewPin =
            enteredPin;

        openPinScreen(
            'confirm_new'
        );
    }


    // CONFIRM NEW PIN
    else if (
        pinState ===
        'confirm_new'
    ) {

        if (
            enteredPin ===
            tempNewPin
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

            await loadMediaFiles();

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


// ============================================================
// FORGOT PIN
// ============================================================
//
// FREE USER:
//
// Forgot PIN
//     ↓
// Premium Required
// $15 / month
//
// DO NOT reveal PIN.
//
// DO NOT automatically activate Premium.
//
// ============================================================

if (forgotPinBtn) {

    forgotPinBtn.addEventListener(
        'click',
        function (event) {

            event.preventDefault();


            // Verified Premium User
            if (
                isPremiumVerified()
            ) {

                openPinScreen(
                    'set_new'
                );

                return;
            }


            // Free user
            showToast(
                'Premium Required - $15/month'
            );

            openPremiumModal();
        }
    );
}


// ============================================================
// PREMIUM VERIFIED CHECK
// ============================================================

function isPremiumVerified() {

    return (
        localStorage.getItem(
            'premium_verified'
        ) === 'true'
    );
}


// ============================================================
// OPEN PREMIUM MODAL
// ============================================================

function openPremiumModal() {

    if (!upgradeModal) {

        showToast(
            'Premium Required - $15/month'
        );

        return;
    }

    upgradeModal.classList.remove(
        'hidden'
    );
}


// ============================================================
// PREMIUM UI
// ============================================================

function updatePremiumUI() {

    premiumActive =
        isPremiumVerified();


    if (premiumActive) {

        if (premiumBannerTitle) {

            premiumBannerTitle.textContent =
                'Premium Active';
        }

        if (premiumBannerText) {

            premiumBannerText.textContent =
                'PIN Recovery active. Storage plan is separate.';
        }

        if (upgradeBtn) {

            upgradeBtn.textContent =
                'Active';
        }

    } else {

        if (premiumBannerTitle) {

            premiumBannerTitle.textContent =
                'Calculator Pro Premium';
        }

        if (premiumBannerText) {

            premiumBannerText.textContent =
                '$15/month • PIN Recovery & Premium Features';
        }

        if (upgradeBtn) {

            upgradeBtn.textContent =
                '$15 / Month';
        }
    }
}


// ============================================================
// OPEN PREMIUM BUTTON
// ============================================================

if (openUpgradeModal) {

    openUpgradeModal.addEventListener(
        'click',
        function () {

            if (
                isPremiumVerified()
            ) {

                showToast(
                    'Premium already active'
                );

                return;
            }

            openPremiumModal();
        }
    );
}


// ============================================================
// CLOSE PREMIUM MODAL
// ============================================================

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


// ============================================================
// SUBSCRIBE BUTTON
// ============================================================
//
// IMPORTANT:
//
// THIS BUTTON MUST NOT:
//
// localStorage.setItem(
//     'premium_verified',
//     'true'
// );
//
// Premium must only be activated after real payment
// verification.
//
// Replace PAYMENT_URL with your payment / Play Store flow.
//
// ============================================================

if (confirmSubscribeBtn) {

    confirmSubscribeBtn.addEventListener(
        'click',
        function () {

            startPremiumSubscription();
        }
    );
}


// ============================================================
// START PREMIUM SUBSCRIPTION
// ============================================================

function startPremiumSubscription() {

    showToast(
        'Opening $15/month subscription...'
    );


    /*
    ========================================================
    OPTION A - PAYMENT WEBSITE
    ========================================================

    Example:

    window.location.href =
        'https://yourwebsite.com/subscribe';

    ========================================================
    OPTION B - ANDROID / GOOGLE PLAY BILLING
    ========================================================

    Your Android WebView can expose a native bridge:

    window.Android.startPremiumSubscription();

    ========================================================
    */


    if (
        window.Android &&
        typeof window.Android
            .startPremiumSubscription ===
            'function'
    ) {

        window.Android
            .startPremiumSubscription();

        return;
    }


    // No payment system connected yet

    showToast(
        'Connect your payment system first'
    );
}


// ============================================================
// PAYMENT SUCCESS CALLBACK
// ============================================================
//
// Android / backend should call this function
// ONLY AFTER payment is successfully verified.
//
// Example from Android:
//
// webView.evaluateJavascript(
//   "premiumPaymentVerified('token')",
//   null
// );
//
// For real production:
// verify receipt/token with your backend first.
//
// ============================================================

window.premiumPaymentVerified =
    function (
        verificationToken
    ) {

        if (
            !verificationToken
        ) {

            showToast(
                'Payment verification failed'
            );

            return;
        }


        // This is only called AFTER external verification.

        localStorage.setItem(
            'premium_verified',
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
            'Premium Activated'
        );


        // IMPORTANT:
        // DO NOT enable 10GB here.
    };


// ============================================================
// PREMIUM EXPIRED CALLBACK
// ============================================================

window.premiumSubscriptionExpired =
    function () {

        localStorage.removeItem(
            'premium_verified'
        );

        premiumActive = false;

        updatePremiumUI();

        showToast(
            'Premium subscription expired'
        );
    };


// ============================================================
// PIN BACK
// ============================================================

if (pinBackBtn) {

    pinBackBtn.addEventListener(
        'click',
        function () {

            enteredPin = '';
            tempNewPin = '';

            updatePinDots();


            if (
                pinState === 'set_new' ||
                pinState ===
                    'confirm_new'
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


// ============================================================
// LOCK VAULT
// ============================================================

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


// ============================================================
// CHANGE PIN
// ============================================================

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


// ============================================================
// PHOTO UPLOAD
// ============================================================

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


// ============================================================
// VIDEO UPLOAD
// ============================================================

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


// ============================================================
// PHOTO INPUT
// ============================================================

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


// ============================================================
// VIDEO INPUT
// ============================================================

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


// ============================================================
// HANDLE FILES
// ============================================================

async function handleFiles(
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


    for (
        const file of selectedFiles
    ) {


        // IMAGE VALIDATION

        if (
            type === 'image' &&
            !file.type.startsWith(
                'image/'
            )
        ) {

            continue;
        }


        // VIDEO VALIDATION

        if (
            type === 'video' &&
            !file.type.startsWith(
                'video/'
            )
        ) {

            continue;
        }


        // STORAGE CHECK

        const usedBytes =
            calculateUsedBytes();

        const limitBytes =
            getStorageLimitMB() *
            1024 *
            1024;


        if (
            usedBytes +
            file.size >
            limitBytes
        ) {

            showToast(
                storage10GBActive
                    ? '10 GB storage limit reached'
                    : '1 GB storage limit reached'
            );

            continue;
        }


        try {

            await addMediaToDB(
                file,
                type
            );

            showToast(
                type === 'image'
                    ? 'Photo saved locally'
                    : 'Video saved locally'
            );

        } catch (error) {

            console.error(
                'Save error:',
                error
            );

            showToast(
                'Could not save file'
            );
        }
    }


    if (photoInput) {

        photoInput.value = '';
    }

    if (videoInput) {

        videoInput.value = '';
    }


    await loadMediaFiles();
}


// ============================================================
// USED STORAGE
// ============================================================

function calculateUsedBytes() {

    return mediaFiles.reduce(
        (total, item) => {

            return (
                total +
                Number(
                    item.size || 0
                )
            );
        },
        0
    );
}


// ============================================================
// FILTER BUTTONS
// ============================================================

if (subTabAll) {

    subTabAll.addEventListener(
        'click',
        () => {

            setSubFilter(
                'all'
            );
        }
    );
}


if (subTabPhotos) {

    subTabPhotos.addEventListener(
        'click',
        () => {

            setSubFilter(
                'image'
            );
        }
    );
}


if (subTabVideos) {

    subTabVideos.addEventListener(
        'click',
        () => {

            setSubFilter(
                'video'
            );
        }
    );
}


// ============================================================
// SET FILTER
// ============================================================

function setSubFilter(
    filter
) {

    activeSubFilter =
        filter;


    [
        subTabAll,
        subTabPhotos,
        subTabVideos
    ].forEach(button => {

        if (button) {

            button.classList.remove(
                'active'
            );
        }
    });


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


// ============================================================
// RENDER MEDIA
// ============================================================

function renderVaultMedia() {

    if (!mediaGrid) return;


    mediaGrid.innerHTML = '';


    const filtered =
        mediaFiles.filter(item => {

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
        });


    if (emptyState) {

        emptyState.style.display =
            filtered.length === 0
                ? 'flex'
                : 'none';
    }


    filtered.forEach(item => {

        const card =
            document.createElement(
                'div'
            );

        card.className =
            'media-item';


        // Create temporary object URL
        const objectURL =
            URL.createObjectURL(
                item.blob
            );


        let mediaElement;


        // IMAGE
        if (
            item.type === 'image'
        ) {

            mediaElement =
                document.createElement(
                    'img'
                );

            mediaElement.src =
                objectURL;

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
                objectURL;

            mediaElement.preload =
                'metadata';

            mediaElement.muted =
                true;

            mediaElement.setAttribute(
                'playsinline',
                'true'
            );
        }


        // DELETE BUTTON

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

        deleteButton.setAttribute(
            'aria-label',
            'Delete'
        );


        deleteButton.addEventListener(
            'click',
            async function (
                event
            ) {

                event.stopPropagation();

                const confirmed =
                    confirm(
                        'Delete this file from your vault?'
                    );

                if (!confirmed) return;


                try {

                    await deleteMediaFromDB(
                        item.id
                    );

                    URL.revokeObjectURL(
                        objectURL
                    );

                    showToast(
                        'File deleted'
                    );

                    await loadMediaFiles();

                } catch (error) {

                    console.error(
                        error
                    );

                    showToast(
                        'Could not delete file'
                    );
                }
            }
        );


        card.appendChild(
            mediaElement
        );

        card.appendChild(
            deleteButton
        );


        card.addEventListener(
            'click',
            function () {

                openPreview(
                    item
                );
            }
        );


        mediaGrid.appendChild(
            card
        );
    });
}


// ============================================================
// STORAGE UI
// ============================================================

function updateStorageInfo() {

    const totalBytes =
        calculateUsedBytes();

    const totalMB =
        totalBytes /
        (1024 * 1024);

    const limitMB =
        getStorageLimitMB();

    const percentage =
        Math.min(
            Math.round(
                (
                    totalMB /
                    limitMB
                ) * 100
            ),
            100
        );


    if (storageUsed) {

        if (totalMB >= 1024) {

            storageUsed.textContent =
                `${(
                    totalMB / 1024
                ).toFixed(2)} GB used`;

        } else {

            storageUsed.textContent =
                `${totalMB.toFixed(2)} MB used`;
        }
    }


    if (storagePercent) {

        storagePercent.textContent =
            `${percentage}%`;
    }


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;
    }


    if (storageTotal) {

        storageTotal.textContent =
            storage10GBActive
                ? '10 GB total'
                : '1 GB total';
    }
}


// ============================================================
// OPEN PREVIEW
// ============================================================

function openPreview(item) {

    if (
        !previewModal ||
        !previewContainer
    ) {

        return;
    }


    previewContainer.innerHTML =
        '';


    const objectURL =
        URL.createObjectURL(
            item.blob
        );


    let element;


    if (
        item.type === 'image'
    ) {

        element =
            document.createElement(
                'img'
            );

        element.src =
            objectURL;

        element.alt =
            item.name ||
            'Vault image';

    } else {

        element =
            document.createElement(
                'video'
            );

        element.src =
            objectURL;

        element.controls =
            true;

        element.autoplay =
            true;

        element.setAttribute(
            'playsinline',
            'true'
        );
    }


    element.dataset.objectUrl =
        objectURL;


    previewContainer.appendChild(
        element
    );


    previewModal.classList.remove(
        'hidden'
    );
}


// ============================================================
// CLOSE PREVIEW
// ============================================================

function closePreviewModal() {

    if (!previewModal) return;


    if (previewContainer) {

        const media =
            previewContainer.querySelector(
                'img, video'
            );

        if (media) {

            if (
                media.tagName ===
                'VIDEO'
            ) {

                media.pause();
            }


            const objectURL =
                media.dataset.objectUrl;

            if (objectURL) {

                URL.revokeObjectURL(
                    objectURL
                );
            }
        }


        previewContainer.innerHTML =
            '';
    }


    previewModal.classList.add(
        'hidden'
    );
}


// ============================================================
// CLOSE PREVIEW BUTTON
// ============================================================

if (closePreviewBtn) {

    closePreviewBtn.addEventListener(
        'click',
        closePreviewModal
    );
}


// ============================================================
// PREVIEW BACKDROP
// ============================================================

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


// ============================================================
// PREMIUM MODAL BACKDROP
// ============================================================

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


// ============================================================
// OPTIONAL SEPARATE 10GB ACTIVATION
// ============================================================
//
// IMPORTANT:
//
// Do NOT call this when Premium activates.
//
// Call only after a separate 10GB storage purchase is verified.
//
// Example:
//
// window.storage10GBPaymentVerified('valid-token')
//
// ============================================================

window.storage10GBPaymentVerified =
    function (
        verificationToken
    ) {

        if (
            !verificationToken
        ) {

            showToast(
                '10GB verification failed'
            );

            return;
        }


        localStorage.setItem(
            'storage_10gb_active',
            'true'
        );

        storage10GBActive = true;

        updateStorageInfo();

        showToast(
            '10GB Storage Activated'
        );
    };


// ============================================================
// APP START
// ============================================================

async function initializeApp() {

    updateDisplay();

    updatePremiumUI();

    updateStorageInfo();


    try {

        await openVaultDatabase();

        await loadMediaFiles();

    } catch (error) {

        console.error(
            'Database startup error:',
            error
        );

        showToast(
            'Local storage database unavailable'
        );
    }
}


initializeApp();
