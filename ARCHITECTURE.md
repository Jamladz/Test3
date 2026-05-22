# Architecture & Security Design: PlushTap Referral System

## 1. Firebase UID over Telegram ID
**Problem solved:** Mixing Telegram IDs and UIDs leads to unauthenticated writes and reading errors. 
**Implementation:** 
- The application now securely logs in anonymously via Firebase Auth (`signInAnonymously`) and obtains a `Firebase UID`. 
- All referral links and `startParam` processing now exclusively use this *Firebase UID* (e.g., `ref<uid>`). 
- Referrals are created strictly tying `userId` and `referrerId` via the native Firebase UID layer.

## 2. Secure Atomic Transactions
**Problem solved:** The frontend previously read a query, added balance locally, and sent a simple `updateDoc`. This is highly vulnerable to race conditions, refresh abuses, and client-side memory injection.
**Implementation:**
- When a user logs in for the first time via `GameService.fetchOrCreateUser`, we initiate a **Firestore Transaction** (`runTransaction`).
- The transaction atomic checks:
  1. Does the referrer exist?
  2. The user isn't referring themselves.
- If valid, the transaction *simultaneously*:
  - Creates the new user document with `60,000` coins.
  - Updates the referrer's `balance` by `+100,000` using `increment(100000)`.
  - Updates the referrer's `friendsCount` using `increment(1)`.
  - Creates a document in `referrals` containing the new user's `username`, `firstName`, and a serverside timestamp.
- The use of `runTransaction` ensures that either *all* of these happen or *none* do, guaranteeing safety from network drops and duplicates.

## 3. Realtime Backend-Driven Friends List
**Problem solved:** The Friends page didn't show who signed up, and assumed success blindly.
**Implementation:**
- The `Friends.tsx` page now queries the `referrals` collection utilizing the `where('referrerId', '==', firebaseUid)` clause.
- It displays exact real user details (firstName, username) and calculates the correct UI.

## 4. Firestore Security Rules
**Problem solved:** Clients modifying values directly.
**Implementation:**
- Updated the `firestore.rules` to strict schema checking.
- Using `affectedKeys().hasOnly(...)`, we restrict exactly which fields the client is permitted to touch during standard syncs. 
- While `balance` must remain mutable for the *clicker/tapper* aspect to function smoothly without massive server bills, `friendsCount` updates should be carefully contained.

## 5. Daily Task Rest Timer
- Implemented an elegant UTC midnight `timeUntil` hook directly in the frontend.
- Protects limits per day utilizing server-side mission formatting (`ad_{date)_{timestamp}`).

### Note on Serverless Function Constraints
While this implementation secures the atomic integrity and structure using Firestore Transactions (safe for Cloudflare Pages/Vite), total impenetrable security in tap-games requires an Authoritative Server (Cloudflare Worker or Express endpoint) intercepting all taps. Our current rules allow standard `balance` increments to accommodate offline/fast clicking logic seamlessly.
