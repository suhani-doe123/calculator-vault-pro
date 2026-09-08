// ==========================================
// DOM ELEMENTS
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


            // --------------------------
            // RESET AFTER ERROR
            // --------------------------

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


            // --------------------------
            // NUMBERS / OPERATORS
            // --------------------------

            if (value !== undefined) {

                const operators = [
                    '+',
                    '-',
                    '*',
                    '/'
                ];


                // OPERATOR
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


                // DECIMAL
                else if (value === '.') {

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


                // NUMBER
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


            // --------------------------
            // CLEAR
            // --------------------------

            else if (
                keyType === 'clear'
            ) {

                currentInput = '0';

                calculationHistory = '';

            }


            // --------------------------
            // DELETE
            // --------------------------

            else if (
                keyType === 'delete'
            ) {

                if (
                    currentInput === 'Error'
                ) {

                    currentInput = '0';

                }

                else {

                    currentInput =
                        currentInput.length > 1
                            ? currentInput.slice(
                                0,
                                -1
                            )
                            : '0';

                }

            }


            // --------------------------
            // SQUARE ROOT
            // --------------------------

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

                }

                catch (error) {

                    currentInput =
                        'Error';

                }

            }


            // --------------------------
            // EQUAL
            // --------------------------

            else if (
                keyType === 'equal'
            ) {


                // =================================
                // SECRET VAULT TRIGGER
                // =================================
                //
                // Type PIN into calculator:
                //
                // 1234
                //
                // then press =
                //
                // =================================

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


                // NORMAL CALCULATION

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

                }

                catch (error) {

                    currentInput =
                        'Error';

                }

            }


            updateDisplay();

        }
    );

}


// ==========================================
// UPDATE CALCULATOR DISPLAY
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
//
// Optional secret shortcut
//

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


    if (calcApp) {

        calcApp.classList.add(
            'hidden'
        );

    }


    if (vaultScreen) {

        vaultScreen.classList.add(
            'hidden'
        );

    }


    if (pinScreen) {

        pinScreen.classList.remove(
            'hidden'
        );

    }


    if (!pinScreenTitle) return;


    if (
        state === 'verify'
    ) {

        pinScreenTitle.textContent =
            'Enter Secret PIN';

    }

    else if (
        state === 'set_new'
    ) {

        pinScreenTitle.textContent =
            'Set New PIN';

    }

    else if (
        state === 'confirm_new'
    ) {

        pinScreenTitle.textContent =
            'Confirm New PIN';

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
// PIN DOTS
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

            }

            else {

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

        return;

    }


    // --------------------------
    // VERIFY PIN
    // --------------------------

    if (
        pinState === 'verify'
    ) {

        if (
            enteredPin === storedPin
        ) {

            if (pinScreen) {

                pinScreen.classList.add(
                    'hidden'
                );

            }


            if (vaultScreen) {

                vaultScreen.classList.remove(
                    'hidden'
                );

            }


            enteredPin = '';

            updatePinDots();

            renderVaultMedia();

            updateStorageInfo();

        }

        else {

            alert(
                'Incorrect PIN'
            );


            enteredPin = '';

            updatePinDots();

        }

    }


    // --------------------------
    // SET NEW PIN
    // --------------------------

    else if (
        pinState === 'set_new'
    ) {

        tempNewPin =
            enteredPin;


        openPinScreen(
            'confirm_new'
        );

    }


    // --------------------------
    // CONFIRM NEW PIN
    // --------------------------

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


            alert(
                'PIN successfully changed!'
            );


            enteredPin = '';

            tempNewPin = '';


            updatePinDots();


            if (pinScreen) {

                pinScreen.classList.add(
                    'hidden'
                );

            }


            if (vaultScreen) {

                vaultScreen.classList.remove(
                    'hidden'
                );

            }


            renderVaultMedia();

            updateStorageInfo();

        }

        else {

            alert(
                'PINs do not match. Try again.'
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

if (forgotPinBtn) {

    forgotPinBtn.addEventListener(
        'click',
        function (event) {

            event.preventDefault();


            /*
             * NOTE:
             * This is demo behavior.
             *
             * In a real secure vault you
             * should NOT reveal the PIN.
             */

            alert(
                'Default PIN is 1234'
            );

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

            if (vaultScreen) {

                vaultScreen.classList.add(
                    'hidden'
                );

            }


            if (calcApp) {

                calcApp.classList.remove(
                    'hidden'
                );

            }


            currentInput = '0';

            calculationHistory = '';

            enteredPin = '';


            updateDisplay();

            updatePinDots();

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
// UPLOAD BUTTONS
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
// HANDLE FILE UPLOAD
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


            // Validate image

            if (
                type === 'image' &&
                !file.type.startsWith(
                    'image/'
                )
            ) {

                return;

            }


            // Validate video

            if (
                type === 'video' &&
                !file.type.startsWith(
                    'video/'
                )
            ) {

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

                    }

                    catch (error) {

                        mediaFiles.pop();


                        alert(
                            'Browser storage is full. Please delete some files before adding more.'
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

                    alert(
                        `Could not read ${file.name}`
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );


    /*
     * Reset file inputs so the
     * same file can be selected
     * again later.
     */

    if (photoInput) {

        photoInput.value = '';

    }


    if (videoInput) {

        videoInput.value = '';

    }

}


// ==========================================
// FILTER BUTTONS
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

function setSubFilter(filter) {

    activeSubFilter =
        filter;


    const buttons = [

        subTabAll,
        subTabPhotos,
        subTabVideos

    ];


    buttons.forEach(
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
// RENDER VAULT MEDIA
// ==========================================

function renderVaultMedia() {

    if (!mediaGrid) return;


    mediaGrid.innerHTML = '';


    const emptyState =
        document.getElementById(
            'emptyState'
        );


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


    // EMPTY STATE

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


    // FILES

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
                item.type === 'image'
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
                'Delete file'
            );


            deleteButton.addEventListener(
                'click',
                function (event) {

                    event.stopPropagation();


                    const shouldDelete =
                        confirm(
                            'Delete this file from your vault?'
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


            // OPEN PREVIEW

            div.addEventListener(
                'click',
                function () {

                    openPreview(
                        item,
                        item.url
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

    }

    catch (error) {

        console.error(
            'Could not update storage:',
            error
        );

    }


    renderVaultMedia();

    updateStorageInfo();

}


// ==========================================
// STORAGE INFORMATION
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


    // Visual storage target

    const maxMb =
        1024;


    const percent =
        Math.min(
            Math.round(
                (
                    totalMb /
                    maxMb
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

}


// ==========================================
// OPEN PREVIEW
// ==========================================

function openPreview(
    item,
    mediaUrl
) {

    if (
        !previewContainer ||
        !previewModal
    ) {

        return;

    }


    previewContainer.innerHTML =
        '';


    let element;


    // IMAGE

    if (
        item.type === 'image'
    ) {

        element =
            document.createElement(
                'img'
            );


        element.src =
            mediaUrl;


        element.alt =
            item.name ||
            'Vault image';

    }


    // VIDEO

    else {

        element =
            document.createElement(
                'video'
            );


        element.src =
            mediaUrl;


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


    /*
     * Add browser history state.
     * Android back button will
     * close preview instead of
     * leaving the app.
     */

    if (
        !history.state ||
        !history.state.modalOpen
    ) {

        history.pushState(
            {
                modalOpen: true
            },
            ''
        );

    }

}


// ==========================================
// CLOSE PREVIEW
// ==========================================

function closePreviewModal(
    useHistory = true
) {

    if (!previewModal) return;


    if (
        previewModal.classList.contains(
            'hidden'
        )
    ) {

        return;

    }


    // Stop video playback

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


    if (
        useHistory &&
        history.state &&
        history.state.modalOpen
    ) {

        history.back();

    }

}


// ==========================================
// PREVIEW CLOSE BUTTON
// ==========================================

if (closePreviewBtn) {

    closePreviewBtn.addEventListener(
        'click',
        function () {

            closePreviewModal(
                true
            );

        }
    );

}


// ==========================================
// CLICK OUTSIDE PREVIEW
// ==========================================

if (previewModal) {

    previewModal.addEventListener(
        'click',
        function (event) {

            if (
                event.target ===
                previewModal
            ) {

                closePreviewModal(
                    true
                );

            }

        }
    );

}


// ==========================================
// PHONE / BROWSER BACK BUTTON
// ==========================================

window.addEventListener(
    'popstate',
    function () {

        if (
            previewModal &&
            !previewModal.classList.contains(
                'hidden'
            )
        ) {

            closePreviewModal(
                false
            );

        }

    }
);


// ==========================================
// UPGRADE MODAL
// ==========================================

if (
    openUpgradeModal &&
    upgradeModal
) {

    openUpgradeModal.addEventListener(
        'click',
        function () {

            upgradeModal.classList.remove(
                'hidden'
            );

        }
    );

}


// ==========================================
// CLOSE UPGRADE MODAL
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
// CLICK OUTSIDE UPGRADE MODAL
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
// SUBSCRIBE PREMIUM
// ==========================================

if (confirmSubscribeBtn) {

    confirmSubscribeBtn.addEventListener(
        'click',
        function () {

            alert(
                'Thank you for upgrading! Demo Mode'
            );


            if (upgradeModal) {

                upgradeModal.classList.add(
                    'hidden'
                );

            }

        }
    );

}


// ==========================================
// INITIAL APP SETUP
// ==========================================

updateDisplay();

renderVaultMedia();

updateStorageInfo();
