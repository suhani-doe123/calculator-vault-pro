const {
  onRequest
} = require("firebase-functions/v2/https");

const admin =
  require("firebase-admin");

const {
  google
} = require("googleapis");

admin.initializeApp();

const db =
  admin.firestore();

const auth =
  admin.auth();


const FREE_STORAGE =
  1024 * 1024 * 1024;

const PREMIUM_STORAGE =
  10 * 1024 * 1024 * 1024;


const PACKAGE_NAME =
  "com.calculatorvault.app";

const PRODUCT_ID =
  "vault_premium";


/*
==================================================
VERIFY GOOGLE PLAY SUBSCRIPTION
==================================================
*/

exports.verifySubscription =
onRequest(

  {
    cors: true
  },

  async (req, res) => {

    try {

      if (req.method !== "POST") {

        return res
          .status(405)
          .json({
            error: "POST only"
          });

      }


      /*
      Firebase ID token
      */

      const header =
        req.headers.authorization || "";

      if (
        !header.startsWith("Bearer ")
      ) {

        return res
          .status(401)
          .json({
            error: "Unauthorized"
          });

      }


      const token =
        header.substring(7);


      const decoded =
        await auth.verifyIdToken(
          token
        );


      const uid =
        decoded.uid;


      const purchaseToken =
        req.body.purchaseToken;


      if (!purchaseToken) {

        return res
          .status(400)
          .json({
            error:
              "Purchase token required"
          });

      }


      /*
      Google Play Developer API
      */

      const androidPublisher =
        google.androidpublisher(
          "v3"
        );


      const result =
        await androidPublisher
          .purchases
          .subscriptionsv2
          .get({

            packageName:
              PACKAGE_NAME,

            token:
              purchaseToken

          });


      const subscription =
        result.data;


      /*
      Verify product
      */

      const item =
        subscription
          .lineItems
          ?.find(
            item =>
              item.productId ===
              PRODUCT_ID
          );


      if (!item) {

        return res
          .status(400)
          .json({
            error:
              "Invalid product"
          });

      }


      const state =
        subscription
          .subscriptionState;


      const active =
        state ===
        "SUBSCRIPTION_STATE_ACTIVE";


      /*
      IMPORTANT:
      Only grant 10 GB when Google
      says the subscription is active.
      */


      if (active) {

        await grantPremium(
          uid,
          purchaseToken,
          item
        );

      }
      else {

        await revokePremium(
          uid,
          state
        );

      }


      return res.json({

        success: true,

        premium: active,

        state: state

      });

    }
    catch (error) {

      console.error(error);

      return res
        .status(500)
        .json({

          error:
            "Subscription verification failed"

        });

    }

  }
);


/*
==================================================
GRANT PREMIUM
==================================================
*/

async function grantPremium(
  uid,
  purchaseToken,
  item
) {

  const expiry =
    item.expiryTime || null;


  await auth.setCustomUserClaims(
    uid,
    {
      premium: true
    }
  );


  await db
    .collection("users")
    .doc(uid)
    .set({

      premium: true,

      storageLimit:
        PREMIUM_STORAGE,

      subscriptionState:
        "ACTIVE",

      purchaseToken:
        purchaseToken,

      subscriptionExpiry:
        expiry,

      updatedAt:
        admin.firestore
          .FieldValue
          .serverTimestamp()

    }, {

      merge: true

    });

}


/*
==================================================
REMOVE PREMIUM
==================================================
*/

async function revokePremium(
  uid,
  state
) {

  await auth.setCustomUserClaims(
    uid,
    {
      premium: false
    }
  );


  await db
    .collection("users")
    .doc(uid)
    .set({

      premium: false,

      storageLimit:
        FREE_STORAGE,

      subscriptionState:
        state,

      updatedAt:
        admin.firestore
          .FieldValue
          .serverTimestamp()

    }, {

      merge: true

    });

}