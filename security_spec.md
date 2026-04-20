# Application Security Specification (Firestore)

## 1. Data Invariants
- A `User` document's `authUid` MUST match the anonymous `request.auth.uid`.
- A user can only read and update their own `User` document.
- Points, tonBalance, and referralsCount can be modified via specific atomic updates.
- A `Referral` document can only be created by the invited user (where `invitedId` matches their Telegram ID), and only if they are authenticated.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a user document for Telegram ID `12345` with `authUid` set to another user's UID.
2. **Path Poisoning**: Attempt to create a user document where ID is a 1.5MB script.
3. **Data Type Poisoning**: Attempt to update `points` to a boolean or massive string.
4. **Balance Manipulation**: Attempt to assign self 1,000,000 TON explicitly by wiping other fields.
5. **Orphaned Writes**: Creating a referral document where `invitedId` does not match the actual Telegram ID of the user creating it.
6. **Shadow Update**: Attempt to push a random field like `isAdmin: true` during a point update.
7. **Read Blanket Violation**: Attempting to read `/users` without `where` restriction, or reading someone else's document.
8. **Negative Balance Hack**: Try to decrement a balance below 0. (Though client sometimes handles checks, rules should ideally block unreasonable negative leaps, here we enforce type).
9. **Referral Spoofing**: Attempt to update `inviterId` after creation to steal a referral.
10. **Timestamp Forgery**: Passing a string for `createdAt` instead of a valid timestamp. (In this app it's an ISO string, we will strictly enforce it to be string).
11. **Array Overflow**: Appending 50,000 IDs into `completedTasks`.
12. **Null Bypass**: Sending `null` for `points` to break math operations.

## 3. Test Runner Definition
(Defined inside `firestore.rules.test.ts`)
