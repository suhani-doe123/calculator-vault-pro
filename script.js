import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";


/* =====================================================
   YOUR FIREBASE PROJECT
===================================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyDBwMpqtx6bP452hoI1wbqWsTOzY83MTVM",

    authDomain:
        "sign-up-my.firebaseapp.com",

    projectId:
        "sign-up-my",

    storageBucket:
        "sign-up-my.firebasestorage.app",

    messagingSenderId:
        "430033722756",

    appId:
        "1:430033722756:web:3033ccae1c2113bbc6d1d1",

    measurementId:
        "G-FZM7MHT4BN"
};


/* =====================================================
   FIREBASE
===================================================== */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);

const storage =
    getStorage(app);

const provider =
    new GoogleAuthProvider();


/* =====================================================
   STORAGE LIMITS
===================================================== */

const FREE_LIMIT =
    1024 * 1024 * 1024;

const PREMIUM_LIMIT =
    10 * 1024 * 1024 * 1024;


/* =====================================================
   VARIABLES
===================================================== */

let currentUser = null;

let isPremium = false;

let vaultFiles = [];

let calculatorExpression = "";

let enteredPin = "";


/*
   Hidden calculator code.
*/
const HIDDEN_CODE = "2580";

/*
   Vault PIN.
   Change this before publishing.
*/
const VAULT_PIN = "2580";


/* =====================================================
   ELEMENTS
===================================================== */

const display =
    document.getElementById("display");

const calculator =
    document.getElementById("calculator");

const pinPage =
    document.getElementById("pinPage");

const vaultPage =
    document.getElementById("vaultPage");


/* =====================================================
   CALCULATOR
===================================================== */

document
    .querySelectorAll(".keys button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const value =
                    button.dataset.value;

                const action =
                    button.dataset.action;


                if (value) {

                    addCalculatorValue(
                        value
                    );

                    return;

                }


                if (action === "clear") {

                    calculatorExpression =
                        "";

                    display.textContent =
                        "0";

                }


                if (action === "delete") {

                    calculatorExpression =
                        calculatorExpression
                            .slice(0, -1);

                    display.textContent =
                        calculatorExpression ||
                        "0";

                }


                if (action === "sqrt") {

                    calculateSquareRoot();

                }


                if (action === "equal") {

                    calculate();

                }

            }
        );

    });


function addCalculatorValue(value) {

    calculatorExpression += value;

    display.textContent =
        calculatorExpression;

}


function calculateSquareRoot() {

    if (!calculatorExpression)
        return;


    try {

        const value =
            safeCalculate(
                calculatorExpression
            );

        if (value < 0)
            throw new Error();

        calculatorExpression =
            String(
                Math.sqrt(value)
            );

        display.textContent =
            calculatorExpression;

    }
    catch {

        calculatorError();

    }

}


function calculate() {

    if (!calculatorExpression)
        return;


    /*
       Hidden Vault access.

       Enter 2580 and press =
    */

    if (
        calculatorExpression ===
        HIDDEN_CODE
    ) {

        calculatorExpression =
            "";

        display.textContent =
            "0";

        openPin();

        return;

    }


    try {

        const result =
            safeCalculate(
                calculatorExpression
            );


        calculatorExpression =
            String(
                Number(
                    result.toFixed(10)
                )
            );


        display.textContent =
            calculatorExpression;

    }
    catch {

        calculatorError();

    }

}


function safeCalculate(expression) {

    /*
       Allow only calculator characters.
    */

    if (
        !/^[0-9+\-*/().%\s]+$/
            .test(expression)
    ) {

        throw new Error(
            "Invalid expression"
        );

    }


    const converted =
        expression.replace(
            /([0-9.]+)%/g,
            "($1/100)"
        );


    const result =
        Function(
            `"use strict";
             return (${converted})`
        )();


    if (
        typeof result !== "number" ||
        !Number.isFinite(result)
    ) {

        throw new Error(
            "Invalid result"
        );

    }


    return result;

}


function calculatorError() {

    calculatorExpression =
        "";

    display.textContent =
        "Error";

}


/* =====================================================
   PIN
===================================================== */

function openPin() {

    calculator.classList.add(
        "hidden"
    );

    pinPage.classList.remove(
        "hidden"
    );

    enteredPin = "";

    updatePinDots();

    document.getElementById(
        "pinError"
    ).textContent = "";

}


document
    .querySelectorAll("[data-pin]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const value =
                    button.dataset.pin;


                if (
                    value === "delete"
                ) {

                    enteredPin =
                        enteredPin.slice(
                            0,
                            -1
                        );

                    updatePinDots();

                    return;

                }


                if (
                    value === "enter"
                ) {

                    checkPin();

                    return;

                }


                if (
                    enteredPin.length >= 4
                )
                    return;


                enteredPin += value;

                updatePinDots();


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

    document.getElementById(
        "dots"
    ).textContent = dots;

}


function checkPin() {

    if (
        enteredPin ===
        VAULT_PIN
    ) {

        pinPage.classList.add(
            "hidden"
        );

        vaultPage.classList.remove(
            "hidden"
        );

        document.getElementById(
            "pinError"
        ).textContent = "";

        loadFiles();

    }
    else {

        document.getElementById(
            "pinError"
        ).textContent =
            "Incorrect PIN";

        enteredPin = "";

        updatePinDots();

    }

}


/* =====================================================
   BACK TO CALCULATOR
===================================================== */

document.getElementById(
    "backCalculator"
).addEventListener(
    "click",
    () => {

        pinPage.classList.add(
            "hidden"
        );

        calculator.classList.remove(
            "hidden"
        );

        enteredPin = "";

    }
);


/* =====================================================
   GOOGLE LOGIN
===================================================== */

document.getElementById(
    "loginBtn"
).addEventListener(
    "click",
    async () => {

        try {

            await signInWithPopup(
                auth,
                provider
            );

        }
        catch (error) {

            console.error(error);

            alert(
                "Google Login failed:\n\n" +
                error.message
            );

        }

    }
);


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user;


        if (!user) {

            isPremium = false;

            vaultFiles = [];

            document.getElementById(
                "accountName"
            ).textContent =
                "Guest";

            document.getElementById(
                "accountEmail"
            ).textContent =
                "Not signed in";

            document.getElementById(
                "accountStatus"
            ).textContent =
                "Sign in to backup files";

            document.getElementById(
                "loginBtn"
            ).textContent =
                "Google";

            document.getElementById(
                "avatar"
            ).textContent =
                "G";

            updateStorage();

            renderFiles();

            return;

        }


        document.getElementById(
            "accountName"
        ).textContent =
            user.displayName ||
            "Google User";


        document.getElementById(
            "accountEmail"
        ).textContent =
            user.email ||
            "";


        document.getElementById(
            "accountStatus"
        ).textContent =
            "Checking account...";


        const avatar =
            document.getElementById(
                "avatar"
            );


        if (user.photoURL) {

            avatar.innerHTML =
                `<img src="${user.photoURL}" alt="">`;

        }
        else {

            avatar.textContent =
                (
                    user.displayName ||
                    "G"
                )
                .charAt(0)
                .toUpperCase();

        }


        document.getElementById(
            "loginBtn"
        ).textContent =
            "Connected";


        /*
           Read Firebase custom claim.

           Your Cloud Function will eventually
           set:

           premium: true
        */

        try {

            const tokenResult =
                await user.getIdTokenResult(
                    true
                );

            isPremium =
                tokenResult.claims
                    .premium === true;

        }
        catch {

            isPremium = false;

        }


        document.getElementById(
            "accountStatus"
        ).textContent =
            isPremium
                ? "⭐ Premium Active"
                : "Free Account";


        await loadFiles();

    }
);


/* =====================================================
   STORAGE
===================================================== */

function getStorageLimit() {

    return isPremium
        ? PREMIUM_LIMIT
        : FREE_LIMIT;

}


function getUsedBytes() {

    return vaultFiles.reduce(
        (total, file) => {

            return total +
                Number(
                    file.size || 0
                );

        },
        0
    );

}


function updateStorage() {

    const used =
        getUsedBytes();

    const limit =
        getStorageLimit();

    const available =
        Math.max(
            0,
            limit - used
        );


    const percentage =
        limit === 0
            ? 0
            : Math.min(
                100,
                (
                    used / limit
                ) * 100
            );


    document.getElementById(
        "used"
    ).textContent =
        "Used: " +
        formatBytes(used);


    document.getElementById(
        "available"
    ).textContent =
        "Available: " +
        formatBytes(available);


    document.getElementById(
        "percent"
    ).textContent =
        percentage.toFixed(1) +
        "%";


    document.getElementById(
        "progressBar"
    ).style.width =
        percentage + "%";


    document.getElementById(
        "planBadge"
    ).textContent =
        isPremium
            ? "⭐ PREMIUM PLAN • 10 GB"
            : "FREE PLAN • 1 GB";

}


function formatBytes(bytes) {

    if (bytes < 1024 * 1024) {

        return (
            bytes / 1024
        ).toFixed(1) +
        " KB";

    }


    if (
        bytes <
        1024 * 1024 * 1024
    ) {

        return (
            bytes /
            (1024 * 1024)
        ).toFixed(1) +
        " MB";

    }


    return (
        bytes /
        (1024 * 1024 * 1024)
    ).toFixed(2) +
    " GB";

}


/* =====================================================
   LOAD FIREBASE FILES
===================================================== */

async function loadFiles() {

    if (!currentUser)
        return;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "files"
                )
            );


        vaultFiles =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        renderFiles();

        updateStorage();

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load vault files.\n\n" +
            error.message
        );

    }

}


/* =====================================================
   PHOTO UPLOAD
===================================================== */

document.getElementById(
    "photoInput"
).addEventListener(
    "change",
    event => {

        const selected =
            Array.from(
                event.target.files
            );

        uploadFiles(selected);

        event.target.value = "";

    }
);


/* =====================================================
   VIDEO UPLOAD
===================================================== */

document.getElementById(
    "videoInput"
).addEventListener(
    "change",
    event => {

        const selected =
            Array.from(
                event.target.files
            );

        uploadFiles(selected);

        event.target.value = "";

    }
);


/* =====================================================
   UPLOAD FILES
===================================================== */

async function uploadFiles(
    selectedFiles
) {

    if (!currentUser) {

        alert(
            "Please sign in with Google first."
        );

        return;

    }


    if (!selectedFiles.length)
        return;


    const used =
        getUsedBytes();


    const incoming =
        selectedFiles.reduce(
            (total, file) =>
                total + file.size,
            0
        );


    const limit =
        getStorageLimit();


    if (
        used + incoming >
        limit
    ) {

        if (!isPremium) {

            alert(
                "Your free 1 GB storage is full.\n\n" +
                "Upgrade to Premium for 10 GB."
            );

            openUpgrade();

        }
        else {

            alert(
                "Your Premium 10 GB storage is full."
            );

        }

        return;

    }


    try {

        for (
            const file of selectedFiles
        ) {

            await uploadOne(file);

        }


        await loadFiles();

        alert(
            "Upload completed."
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Upload failed:\n\n" +
            error.message
        );

    }

}


/* =====================================================
   UPLOAD ONE FILE
===================================================== */

async function uploadOne(file) {

    const uniqueName =
        Date.now() +
        "_" +
        crypto.randomUUID() +
        "_" +
        file.name;


    const path =
        "users/" +
        currentUser.uid +
        "/vault/" +
        uniqueName;


    const storageRef =
        ref(
            storage,
            path
        );


    await uploadBytes(
        storageRef,
        file
    );


    const url =
        await getDownloadURL(
            storageRef
        );


    await addDoc(
        collection(
            db,
            "users",
            currentUser.uid,
            "files"
        ),
        {

            name:
                file.name,

            size:
                file.size,

            type:
                file.type,

            path:
                path,

            url:
                url,

            created:
                serverTimestamp()

        }
    );

}


/* =====================================================
   RENDER FILES
===================================================== */

function renderFiles() {

    const gallery =
        document.getElementById(
            "gallery"
        );


    gallery.innerHTML = "";


    let photos = 0;

    let videos = 0;


    vaultFiles.forEach(
        file => {

            const box =
                document.createElement(
                    "div"
                );

            box.className =
                "file";


            if (
                file.type &&
                file.type.startsWith(
                    "image/"
                )
            ) {

                photos++;


                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    file.url;

                img.loading =
                    "lazy";

                box.appendChild(
                    img
                );

            }


            else if (
                file.type &&
                file.type.startsWith(
                    "video/"
                )
            ) {

                videos++;


                const video =
                    document.createElement(
                        "video"
                    );

                video.src =
                    file.url;

                video.controls =
                    true;

                box.appendChild(
                    video
                );

            }


            box.addEventListener(
                "contextmenu",
                event => {

                    event.preventDefault();

                    deleteFile(file);

                }
            );


            gallery.appendChild(
                box
            );

        }
    );


    document.getElementById(
        "photoCount"
    ).textContent =
        "📷 " +
        photos +
        " Photos";


    document.getElementById(
        "videoCount"
    ).textContent =
        "🎥 " +
        videos +
        " Videos";


    if (
        vaultFiles.length === 0
    ) {

        gallery.innerHTML =
            `
            <div class="empty">
                🔐<br>
                Your private vault is empty
            </div>
            `;

    }

}


/* =====================================================
   DELETE
===================================================== */

async function deleteFile(file) {

    if (
        !confirm(
            "Delete this file?"
        )
    )
        return;


    try {

        await deleteObject(
            ref(
                storage,
                file.path
            )
        );


        await deleteDoc(
            doc(
                db,
                "users",
                currentUser.uid,
                "files",
                file.id
            )
        );


        await loadFiles();

    }
    catch (error) {

        console.error(error);

        alert(
            "Delete failed:\n\n" +
            error.message
        );

    }

}


/* =====================================================
   PREMIUM MODAL
===================================================== */

function openUpgrade() {

    document
        .getElementById(
            "upgradeModal"
        )
        .classList.remove(
            "hidden"
        );

}


document.getElementById(
    "upgradeBtn"
).addEventListener(
    "click",
    openUpgrade
);


document.getElementById(
    "closeModal"
).addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "upgradeModal"
            )
            .classList.add(
                "hidden"
            );

    }
);


/* =====================================================
   GOOGLE PLAY SUBSCRIPTION
===================================================== */

document.getElementById(
    "subscribeBtn"
).addEventListener(
    "click",
    () => {

        /*
           This button is intentionally not
           pretending that a web browser
           completed a Google Play purchase.

           In the Capacitor Android version,
           this button should call the native
           Google Play Billing implementation.
        */

        alert(
            "Google Play Billing is available " +
            "in the Android app version.\n\n" +
            "Install the Calculator Vault Android " +
            "app from Google Play to subscribe."
        );

    }
);


/* =====================================================
   LOCK VAULT
===================================================== */

document.getElementById(
    "lockBtn"
).addEventListener(
    "click",
    () => {

        vaultPage.classList.add(
            "hidden"
        );

        calculator.classList.remove(
            "hidden"
        );

    }
);


/* =====================================================
   LOGOUT
===================================================== */

document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            vaultPage.classList.add(
                "hidden"
            );

            calculator.classList.remove(
                "hidden"
            );

        }
        catch (error) {

            alert(
                "Sign out failed:\n\n" +
                error.message
            );

        }

    }
);