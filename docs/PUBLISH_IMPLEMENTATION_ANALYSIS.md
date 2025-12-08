# Publish Implementation Analysis

## Executive Summary

This document analyzes the current "Publish" card to directory implementation, identifies friction points, and outlines requirements for implementing a frictionless 30-day free publishing period with customer endorsement-based visibility extension.

**Status**: Current implementation allows immediate publishing with `subscription_tier: 'free'` but **lacks trial period tracking, expiration logic, and endorsement-based visibility system**.

**🔄 NEW BUSINESS MODEL**: 
- **30 days free publishing** - All cards get 30 days free visibility AND free updates
- **After 30 days (no endorsements/payment)**: 
  - Card **stays visible** in directory (no removal)
  - **Updates are locked** (no editing allowed) until payment OR endorsements received
  - Still **eligible to receive endorsements** (customers can still endorse)
  - Once endorsements received OR payment made, updates unlock for specified period
- **Two ways to unlock updates**:
  1. **Customer endorsement system** - Endorsements unlock FREE update periods:
     - **6 customer endorsements** = 6 months of FREE updates (starts when 6th endorsement received)
     - **10 customer endorsements** = 12 months of FREE updates (starts when 10th endorsement received)
  2. **Payment option** - Pay to unlock updates:
     - **$10 USD** (or equivalent in local currency) = Unlock updates
     - Payment unlocks updates immediately (no time limit, but may need renewal)
- **Visibility**: Cards remain visible regardless of endorsement/payment status (for endorsement collection)
- **Viral loop**: Customers "sponsor" professionals by endorsing them, creating organic growth

---

## Current Implementation Flow

### 1. Frontend Flow (`src/components/PublishButton.tsx`)

```
User clicks "Publish" button
  ↓
Shows browser prompt() for username (optional)
  ↓
Calls api.publish(card, username)
  ↓
Sets subscription_tier: 'free' (hardcoded)
  ↓
Saves published_card_id to localStorage
  ↓
Shows success message
```

**Key Code Locations:**
- `src/components/PublishButton.tsx` (lines 19-42)
- `src/lib/api.ts` (lines 50-67)
- `src/pages/ProfilePage.tsx` (lines 64-74)

### 2. Backend Flow (`workers/handlers/publish.ts`)

```
POST /api/publish
  ↓
Validates card data (full_name, whatsapp required)
  ↓
Checks username uniqueness (if provided)
  ↓
Generates card ID and referral code
  ↓
Sets is_active: true, subscription_tier: 'free'
  ↓
Inserts/updates card in database
  ↓
Returns published card
```

**Key Code Locations:**
- `workers/handlers/publish.ts` (lines 10-161)
- `workers/utils.ts` (validateCard function, lines 91-160)

### 3. Directory/Search Visibility

Cards appear immediately in:
- `/api/directory` - Lists all cards where `is_active = 1`
- `/api/search` - Searches all cards where `is_active = 1`
- `/api/card/:id` - Shows card if `is_active = 1`

**No expiration checks** - Cards remain visible indefinitely.

---

## Critical Issues & Friction Points

### 🔴 **Critical Issues**

1. **No Trial Period Tracking**
   - Database schema lacks fields for trial start/end dates
   - No way to determine if a user is on a free trial
   - No expiration logic implemented

2. **No Expiration Enforcement**
   - Cards published with `subscription_tier: 'free'` remain active forever
   - Directory/search queries don't filter expired trials
   - No background job or cron to deactivate expired cards

3. **Poor UX for Username Input**
   - Uses browser `prompt()` dialog (line 24 in PublishButton.tsx)
   - Not mobile-friendly
   - No validation feedback before submission
   - TODO comment indicates this is known issue

### ⚠️ **Friction Points**

4. **No Clear Trial Messaging**
   - Users don't see information about 30-day free trial
   - No indication when trial expires
   - No call-to-action for subscription after trial

5. **No Payment Flow Integration**
   - Payment endpoints mentioned in docs but not implemented
   - No subscription upgrade path
   - No PIX payment integration (Brazilian requirement)

6. **No User Account System**
   - Cards are published anonymously
   - No way to track which user owns which card
   - No way to manage multiple cards per user
   - Relies on localStorage for card ID (fragile)

---

## Database Schema Analysis

### Current Schema (`migrations/0001_initial.sql`)

```sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  ...
);
```

### Missing Fields for Trial Implementation

```sql
-- Required for 30-day free trial:
trial_start INTEGER,           -- When trial started (timestamp)
trial_end INTEGER,             -- When trial expires (timestamp)
subscription_expires INTEGER,  -- When paid subscription expires
user_id TEXT,                  -- Optional: Link to user account
```

---

## Requirements for 30-Day Free Publishing + Customer Endorsement Model

### 1. **Database Migration Required**

Add fields to track free period and endorsement-based update permissions:
- `published_at` - Already exists (timestamp when card was published)
- `free_period_end` - When 30-day free period ends (published_at + 30 days)
- `updates_enabled_until` - When free updates expire (calculated from endorsements)
- `endorsement_count` - Total number of customer endorsements received
- `last_endorsement_at` - Timestamp of most recent endorsement
- `can_update` - Boolean flag: true if updates are currently allowed

**Important**: 
- **Visibility** = Cards ALWAYS stay visible (for endorsement collection)
- **Updates** = Locked after 30 days unless endorsements unlock them
- Cards remain visible regardless of endorsement status

**Note**: The existing `recommendations` system can be repurposed as "endorsements" - they're essentially the same thing (customers recommending/sponsoring professionals).

### 2. **Publish Handler Changes**

**Current behavior:**
```typescript
subscription_tier: cardData.subscription_tier || 'free'
is_active: true
published_at: new Date().toISOString()
```

**Required behavior:**
```typescript
const now = Date.now();
const freePeriodEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now

// All cards get 30 days free visibility AND free updates
const card: PublishedCard = {
  ...cardData,
  subscription_tier: 'free',
  is_active: true,
  published_at: new Date(now).toISOString(),
  free_period_end: new Date(freePeriodEnd).toISOString(),
  updates_enabled_until: new Date(freePeriodEnd).toISOString(), // Initially = free_period_end
  can_update: true, // Updates enabled during free period
  endorsement_count: 0,
};
```

**Key Points:**
- Cards ALWAYS stay visible (never hidden from directory)
- Updates are free for 30 days
- After 30 days: Updates locked unless endorsements unlock them

### 3. **Endorsement System (Using Existing Recommendations)**

**Current Recommendation Interface:**
```typescript
interface Recommendation {
  id: string;
  card_id: string;
  recommender_name?: string;
  recommender_whatsapp?: string;
  referral_code: string;
  shared_via: 'whatsapp' | 'instagram' | 'facebook' | 'link';
  shared_at: string;
  clicked_count: number;
  converted_count: number;
}
```

**Repurpose as Endorsement:**
- When customer clicks "Amei este profissional!" → Creates endorsement
- Track endorsement_count per card
- Calculate FREE UPDATE period (NOT visibility - cards always visible):
  - **6 endorsements** → 6 months of FREE updates (starts when 6th endorsement received)
  - **10 endorsements** → 12 months of FREE updates (starts when 10th endorsement received)
- Update `updates_enabled_until` when threshold is reached

**Endorsement Handler Logic:**
```typescript
// POST /api/endorse (or reuse POST /api/recommend)
async function handleEndorse(cardId: string) {
  // Create endorsement record
  const endorsement = await createEndorsement(cardId, endorserInfo);
  
  // Update card endorsement count
  const card = await getCard(cardId);
  const newCount = card.endorsement_count + 1;
  
  // Calculate FREE UPDATE period extension
  // Updates unlock starts from NOW when threshold reached
  let updatesExtensionMonths = 0;
  if (newCount === 10) {
    // Just reached 10 endorsements = 12 months FREE updates
    updatesExtensionMonths = 12;
  } else if (newCount === 6) {
    // Just reached 6 endorsements = 6 months FREE updates
    updatesExtensionMonths = 6;
  }
  
  // If threshold reached, grant FREE update period starting NOW
  if (updatesExtensionMonths > 0) {
    const now = Date.now();
    const updatesEnabledUntil = now + (updatesExtensionMonths * 30 * 24 * 60 * 60 * 1000);
    
    // Update card with FREE update period
    const updateData: any = {
      endorsement_count: newCount,
      updates_enabled_until: new Date(updatesEnabledUntil).toISOString(),
      can_update: true, // Unlock updates
      last_endorsement_at: new Date().toISOString(),
    };
    
    // 10 endorsements = better search placement (same as payment)
    if (newCount === 10) {
      updateData.is_featured = true; // Better search placement
    }
    
    await updateCard(cardId, updateData);
  } else {
    // Just increment count, no update period change
    await updateCard(cardId, {
      endorsement_count: newCount,
      last_endorsement_at: new Date().toISOString(),
    });
  }
}
```

**Important Logic:**
- Updates unlock when threshold is reached (6th or 10th endorsement)
- Update period starts from the moment threshold is reached
- Cards remain visible regardless of update status
- If already have updates enabled, reaching 10 endorsements grants 12 months from that point
- **Payment is equivalent to 10 endorsements**: Payment unlocks 12 months of updates AND provides better search placement

### 3a. **Payment System (Alternative to Endorsements)**

**Payment Handler Logic:**
```typescript
// POST /api/payment/initiate
async function handlePaymentInitiate(cardId: string, amount: number, currency: string) {
  // Create payment intent with payment gateway (Stripe, PIX, etc.)
  const paymentIntent = await createPaymentIntent({
    amount: amount * 100, // Convert to cents
    currency: currency.toLowerCase(),
    metadata: { card_id: cardId },
  });
  
  return {
    payment_intent_id: paymentIntent.id,
    client_secret: paymentIntent.client_secret,
    amount,
    currency,
  };
}

// POST /api/payment/webhook (called by payment gateway)
async function handlePaymentWebhook(request: Request, env: Env) {
  const event = await verifyWebhookSignature(request);
  
  if (event.type === 'payment.succeeded') {
    const cardId = event.metadata.card_id;
    const amount = event.amount / 100; // Convert from cents
    const currency = event.currency;
    
    // Update card with payment status
    await updateCard(cardId, {
      payment_status: 'paid',
      payment_date: Date.now(),
      payment_amount: amount,
      payment_currency: currency,
      can_update: true, // Unlock updates
      // Optionally set updates_enabled_until for paid period
      // updates_enabled_until: Date.now() + (12 * 30 * 24 * 60 * 60 * 1000), // 12 months
    });
  }
  
  return new Response('OK', { status: 200 });
}
```

**Payment Flow:**
1. Professional clicks "Pay $10 USD to unlock updates"
2. Frontend calls `/api/payment/initiate` with card ID
3. Payment gateway returns payment intent/client secret
4. Frontend redirects to payment gateway checkout
5. Customer completes payment
6. Payment gateway sends webhook to `/api/payment/webhook`
7. Backend verifies payment and unlocks updates
8. Frontend shows success message

**Payment Gateway: Stripe**
- **Primary payment gateway**: Stripe (supports international cards and multiple currencies)
- **Stripe features**:
  - Supports PIX (Brazil) via Stripe Brazil
  - Supports credit/debit cards globally
  - Automatic currency conversion
  - Webhook support for payment verification
  - PCI compliance handled by Stripe

**Payment Benefits:**
- **$10 USD payment** = Equivalent to 10 endorsements
- Unlocks **12 months of updates** (same as 10 endorsements)
- Provides **better search placement** (`is_featured = true`)
- Immediate unlock (no waiting for endorsements)

### 4. **Directory/Search Filtering**

**Current query:**
```sql
SELECT * FROM cards WHERE is_active = 1
```

**Required query:**
```sql
SELECT * FROM cards 
WHERE is_active = 1 
ORDER BY published_at DESC
```

**Visibility Policy:**
- **ALL cards remain visible** in directory/search (never hidden)
- Cards stay visible to allow endorsement collection
- No filtering by visibility expiration needed

**Update Permission Check:**
- Check `can_update` flag OR `updates_enabled_until > now()` OR `payment_status = 'paid'`
- If false: Show "Updates locked - Get endorsements OR pay $10 to unlock" message
- If true: Allow editing/updates

### 5. **Update Permission Enforcement**

**Update Handler Check** (`workers/handlers/update-card.ts`):
```typescript
async function handleUpdateCard(id: string, request: Request, env: Env) {
  const card = await getCard(id);
  const now = Date.now();
  
  // Check if updates are allowed
  const freePeriodEnd = new Date(card.free_period_end).getTime();
  const updatesEnabledUntil = card.updates_enabled_until 
    ? new Date(card.updates_enabled_until).getTime() 
    : 0;
  const hasPaid = card.payment_status === 'paid';
  
  const canUpdate = now <= freePeriodEnd || now <= updatesEnabledUntil || hasPaid;
  
  if (!canUpdate) {
    return new Response(
      JSON.stringify({ 
        error: 'Updates locked',
        message: 'Get 6 endorsements for 6 months free updates, 10 for 12 months, OR pay $10 USD to unlock',
        endorsement_count: card.endorsement_count,
        needed: card.endorsement_count < 6 ? 6 : 10,
        payment_option: true,
        payment_amount: 10,
        payment_currency: 'USD'
      }),
      { status: 403 }
    );
  }
  
  // Proceed with update...
}
```

**Frontend Check:**
- Before showing edit button, check `can_update` or `updates_enabled_until`
- Show lock icon and endorsement CTA if updates locked
- Cards remain visible for endorsement collection

### 6. **Frontend: Update Lock & Endorsement Request Flow**

**During 30-day free period:**
1. Show countdown: "X days remaining - updates free"
2. Show endorsement progress: "3/6 endorsements needed for 6 months free updates"
3. Display CTA: "Ask your customers to endorse you for free updates!"
4. Provide shareable link/QR code for customers to endorse

**After 30 days (no endorsements yet):**
1. Show lock icon on edit button: "Updates locked"
2. Show message: "Get 6 endorsements for 6 months free updates"
3. Show endorsement progress: "0/6 endorsements"
4. Card remains visible in directory (for endorsement collection)
5. Provide tools to request endorsements from customers

**When endorsements unlock updates:**
1. Show success message: "Updates unlocked! 6 months free updates"
2. Show countdown: "X months remaining"
3. Edit button enabled
4. Show endorsement count: "6 endorsements received"

**Update Lock UI:**
- Disable edit button when `can_update = false`
- Show lock icon with tooltip: "Get endorsements to unlock updates"
- Show endorsement progress bar
- Display CTA: "Share with customers to get endorsements"

---

## Mapping Existing Recommendation System to Endorsements

### Current Recommendation System

The codebase already has a `Recommendation` interface and tracking system designed for the viral "Amei este profissional!" feature. This can be **repurposed as the endorsement system** with minimal changes.

**Existing Code:**
- `src/models/types.ts` - `Recommendation` interface (lines 85-95)
- `workers/handlers/publish.ts` - Sets `recommendations: { count: 0, recent: [] }`
- Database stores `recommendations_json` in cards table
- Referral code system already exists

**Key Insight**: A "recommendation" (customer clicking "Amei este profissional!") is essentially an "endorsement" (customer sponsoring professional's visibility).

### Repurposing Strategy

1. **Rename for clarity** (optional):
   - Keep `Recommendation` interface but add `is_endorsement: boolean` flag
   - Or create `Endorsement` interface that extends `Recommendation`
   - Or use `Recommendation` as-is and treat all recommendations as endorsements

2. **Track endorsement count**:
   - Use `recommendations.count` as `endorsement_count`
   - Each new recommendation increments the count
   - When count reaches 6 or 10, extend visibility

3. **Calculate visibility**:
   - On each endorsement, check if threshold reached
   - Update `visibility_expires` accordingly
   - Store calculation logic in endorsement handler

### Implementation Approach

**Option A: Minimal Changes (Recommended)**
- Use existing `recommendations` system as-is
- Add `visibility_expires` field to cards
- Add logic to calculate visibility extension on recommendation creation
- No need to change Recommendation interface

**Option B: Explicit Endorsement System**
- Create separate `Endorsement` interface
- Add `endorsements_json` field to database
- Keep recommendations separate from endorsements
- More complex but clearer separation

**Recommendation**: Use **Option A** - repurpose existing recommendation system. It's simpler and the concepts are essentially the same.

---

## Recommended Implementation Plan

### Phase 1: Database & Backend (Critical)

1. **Create migration** to add visibility tracking fields:
   - `free_period_end` INTEGER
   - `visibility_expires` INTEGER
   - `endorsement_count` INTEGER DEFAULT 0
   - `last_endorsement_at` INTEGER
2. **Update publish handler** to:
   - Set `free_period_end` = published_at + 30 days
   - Set `updates_enabled_until` = free_period_end initially
   - Set `can_update` = 1 (updates enabled during free period)
   - Initialize `endorsement_count` = 0
3. **Create/update endorsement handler**:
   - Reuse existing recommendation system
   - Track endorsement_count per card
   - When 6 endorsements reached: Set `updates_enabled_until` = now + 6 months, `can_update` = 1
   - When 10 endorsements reached: Set `updates_enabled_until` = now + 12 months, `can_update` = 1, `is_featured` = 1 (better search placement)
   - Update period starts from moment threshold is reached
4. **Update directory/search handlers**: 
   - NO filtering needed - all cards stay visible
   - Cards remain visible for endorsement collection
5. **Add update permission check** in update-card handler:
   - Check `can_update` flag OR `updates_enabled_until > now()`
   - Return 403 error if updates locked
   - Include endorsement count and needed count in error message
6. **Add update permission check** in get-card handler:
   - Return `can_update` status in response
   - Include endorsement progress information

### Phase 2: Frontend UX Improvements

1. **Replace prompt() with modal** for username input
2. **Add visibility countdown** display:
   - "X days remaining in free period"
   - "Get 6 endorsements for 6 months visibility"
3. **Add endorsement progress indicator**:
   - "3/6 endorsements" or "7/10 endorsements"
   - Visual progress bar
4. **Add endorsement request tools**:
   - Shareable link/QR code
   - Pre-filled WhatsApp message: "Apoie meu perfil! [link]"
   - Social media share buttons
5. **Improve success messaging** with visibility information

### Phase 3: Endorsement Flow Enhancement

1. **Enhance "Amei este profissional!" button**:
   - Make it clear this is an "endorsement"
   - Show impact: "Your endorsement gives 6 months visibility!"
   - Track and display endorsement count
2. **Add endorsement confirmation**:
   - Thank you message after endorsement
   - Show current endorsement count
   - Encourage sharing
3. **Add professional dashboard**:
   - View endorsement count
   - See who endorsed (if public)
   - Track visibility expiration
   - Request more endorsements

### Phase 4: Visibility Management (Optional Enhancements)

1. **Add notification system**:
   - Email/WhatsApp when visibility expires
   - Reminder 7 days before expiration
   - Alert when endorsement threshold reached
2. **Add analytics**:
   - Track endorsement sources
   - Show conversion from endorsements to clients
   - Display social proof metrics

---

## Code Locations Reference

### Frontend
- **Publish Button**: `src/components/PublishButton.tsx`
- **API Client**: `src/lib/api.ts` (publish function)
- **Profile Page**: `src/pages/ProfilePage.tsx`
- **Types**: `src/models/types.ts` (PublishedCard interface)

### Backend
- **Publish Handler**: `workers/handlers/publish.ts`
- **Directory Handler**: `workers/handlers/directory.ts`
- **Search Handler**: `workers/handlers/search.ts`
- **Get Card Handler**: `workers/handlers/get-card.ts`
- **Utils**: `workers/utils.ts` (validation, conversion)
- **Types**: `workers/types.ts` (CardRow interface)

### Database
- **Schema**: `migrations/0001_initial.sql`

---

## Key Decisions Needed

1. **Endorsement Eligibility**: 
   - Can customers endorse multiple times? (Probably no - one per customer)
   - How to prevent duplicate endorsements? (By WhatsApp number? IP? Cookie?)
   - Can professionals endorse themselves? (Probably no)

2. **Visibility Extension Logic**:
   - When 6 endorsements reached: Extend by 6 months from current expiration or from now?
   - When 10 endorsements reached: Replace 6-month extension or add to it?
   - Can visibility be extended multiple times? (Yes, if they get more endorsements)

3. **Locked Update Behavior**:
   - Cards with locked updates remain visible in directory (always)
   - Cards can be accessed via direct URL (for endorsement collection)
   - Should show prominent endorsement request CTA when updates are locked
   - Edit/update buttons should be disabled with clear messaging
   - Professional can still view their card but cannot edit

4. **Endorsement Verification**:
   - Require customer WhatsApp verification?
   - Require customer name?
   - Allow anonymous endorsements?
   - Prevent spam/fake endorsements?

5. **Endorsement Thresholds**:
   - Current: 6 = 6 months, 10 = 12 months
   - Should there be intermediate thresholds? (e.g., 3 = 3 months?)
   - Should there be a maximum visibility period? (e.g., cap at 12 months?)

6. **Legacy Cards** (Cards published before new system):
   - Grandfather existing cards?
   - Give them 30 days from migration date?
   - Require immediate endorsements?

7. **Payment vs. Endorsements** (DECIDED):
   - **Payment = 10 endorsements**: Payment is equivalent to receiving 10 endorsements
   - **Benefits**: 12 months updates + better search placement (`is_featured = true`)
   - **Payment duration**: $10 USD unlocks updates for **12 months**
   - **Payment gateway**: **Stripe** (supports international cards + PIX via Stripe Brazil)
   - **Can still receive endorsements**: Yes, but they don't stack with payment
   - **If paid + endorsements**: Endorsements can extend period after payment expires, but payment already provides maximum benefits (12 months + featured)
   - **Search placement**: Both payment and 10 endorsements set `is_featured = true` for better placement

---

## Success Metrics

To measure frictionless publishing success:

1. **Time to Publish**: < 2 minutes from card creation to published
2. **Trial Conversion**: % of trial users who convert to paid
3. **Publish Success Rate**: % of publish attempts that succeed
4. **User Drop-off**: Points where users abandon publish flow

---

## Next Steps - Implementation Checklist

### Phase 1: Database & Core Logic (Critical)
- [ ] **Create database migration**:
  - Add `free_period_end INTEGER` - When 30-day free period ends
  - Add `updates_enabled_until INTEGER` - When free updates expire
  - Add `endorsement_count INTEGER DEFAULT 0` - Total endorsements
  - Add `last_endorsement_at INTEGER` - Last endorsement timestamp
  - Add `can_update INTEGER DEFAULT 1` - Update permission flag
- [ ] **Update publish handler** (`workers/handlers/publish.ts`):
  - Set `free_period_end` = published_at + 30 days
  - Set `updates_enabled_until` = free_period_end initially
  - Set `can_update` = 1 (updates enabled during free period)
  - Initialize `endorsement_count` = 0
- [ ] **Create/update endorsement handler**:
  - Reuse existing recommendation endpoint or create `/api/endorse`
  - Increment `endorsement_count` on each endorsement
  - When 6 endorsements reached: Set `updates_enabled_until` = now + 6 months, `can_update` = 1
  - When 10 endorsements reached: Set `updates_enabled_until` = now + 12 months, `can_update` = 1
  - Update period starts from moment threshold is reached
- [ ] **Update directory handler** (`workers/handlers/directory.ts`):
  - NO filtering needed - all cards stay visible
  - Cards remain visible for endorsement collection
- [ ] **Update search handler** (`workers/handlers/search.ts`):
  - NO filtering needed - all cards stay visible
- [ ] **Update update-card handler** (`workers/handlers/update-card.ts`):
  - Check `can_update` flag OR `updates_enabled_until > now()` OR `payment_status = 'paid'`
  - Return 403 error if updates locked
  - Include endorsement count, needed count, AND payment option in error message
- [ ] **Create payment handler** (`workers/handlers/payment.ts`):
  - Handle payment initiation (create Stripe payment intent)
  - Handle Stripe webhook (verify payment completion)
  - Update card with payment status and unlock updates for 12 months
  - Set `is_featured = true` when payment succeeds (better search placement)
  - Set `updates_enabled_until` = now + 12 months
  - Support Stripe (international cards + PIX via Stripe Brazil)
- [ ] **Update get-card handler** (`workers/handlers/get-card.ts`):
  - Return `can_update` status in response
  - Include endorsement progress information

### Phase 2: Frontend Updates
- [ ] **Replace prompt() with modal** (`src/components/PublishButton.tsx`):
  - Create UsernameInputModal component
  - Better mobile UX
- [ ] **Add update lock UI** component:
  - Show lock icon when `can_update = false`
  - Show "Updates locked" message
  - Show endorsement progress (X/6 or X/10)
  - Visual progress bar
- [ ] **Add update countdown** component:
  - Show days/months remaining in free update period
  - Show when updates will lock (if no endorsements)
  - Show when updates unlock (if endorsements received)
- [ ] **Add endorsement request UI**:
  - Shareable link/QR code generator
  - Pre-filled WhatsApp message: "Apoie meu perfil! [link]"
  - Social media share buttons
- [ ] **Update card display** (`src/components/CardDisplay.tsx`):
  - Show endorsement count prominently
  - Show update lock status
  - Add "Request Endorsements" CTA when updates locked
- [ ] **Update edit page** (`src/pages/EditPage.tsx`):
  - Check `can_update` before allowing edits
  - Show lock message with endorsement CTA if locked
  - Disable save button if updates locked

### Phase 3: Endorsement Flow
- [ ] **Enhance "Amei este profissional!" button**:
  - Make it clear this creates an endorsement
  - Show impact message
  - Prevent duplicate endorsements (by WhatsApp/IP)
- [ ] **Add endorsement confirmation**:
  - Thank you message
  - Show updated endorsement count
  - Encourage sharing
- [ ] **Add professional dashboard** (optional):
  - View endorsement count and list
  - Track update lock status
  - Track `updates_enabled_until` expiration
  - Request more endorsements

### Phase 4: Testing & Polish
- [ ] **Test 30-day free period** expiration (updates should lock after 30 days)
- [ ] **Test endorsement thresholds** (6 and 10) - updates should unlock
- [ ] **Test update lock** enforcement (403 error when locked, edit button disabled)
- [ ] **Test update unlock** when thresholds reached (6th and 10th endorsement)
- [ ] **Test card visibility** (should always be visible in directory)
- [ ] **Test update period calculation** (starts from threshold moment, not from now)
- [ ] **Test duplicate endorsement** prevention
- [ ] **Mobile responsiveness** testing
- [ ] **Add analytics** tracking (optional)

---

## Summary

✅ **Analysis Complete** - This document provides comprehensive analysis of the publish implementation with the new customer endorsement model.

**Key Changes Required:**
1. Database migration for update permission tracking fields (`updates_enabled_until`, `can_update`)
2. Publish handler updates for 30-day free period (visibility + updates)
3. Endorsement handler for tracking and update period extension
4. Update-card handler to enforce update locks (403 when locked)
5. Frontend UX improvements for update lock UI and endorsement requests

**Business Model:**
- **30 days free**: All cards get 30 days free visibility AND free updates
- **After 30 days (no endorsements/payment)**: Card stays visible but updates are LOCKED
- **Two ways to unlock updates**:
  1. **6 endorsements**: Unlocks 6 months of FREE updates (starts when 6th received)
  2. **10 endorsements**: Unlocks 12 months of FREE updates (starts when 10th received)
  3. **Pay $10 USD**: Unlocks updates immediately (or for specified period)
- **Visibility**: Cards ALWAYS stay visible (for endorsement collection)
- **Updates**: Locked after 30 days unless endorsements OR payment unlock them
- **Viral loop**: Customers sponsor professionals they love (free path)
- **Monetization**: Professionals can pay $10 USD as alternative to endorsements

---

## Notes

- Current implementation is **functional but incomplete** for endorsement-based visibility
- **No breaking changes needed** - can add endorsement logic incrementally
- **Backward compatibility**: Existing cards can be grandfathered with 30-day free period from migration date
- **Viral loop**: Endorsement system creates organic growth - customers sponsor professionals they love
- **Lower friction**: No payment required - customers provide visibility through endorsements
- **Gamification**: Endorsement thresholds create goals and engagement
- Consider adding analytics to track:
  - Publish flow drop-offs
  - Endorsement conversion rates
  - Visibility extension success rates
  - Customer-to-endorsement conversion

## Business Model Benefits

### For Professionals:
- **Free to start**: 30 days free visibility
- **No upfront cost**: No payment required
- **Customer-driven**: Visibility earned through customer satisfaction
- **Viral growth**: Each endorsement potentially brings new customers

### For Customers:
- **Empowerment**: Customers can support professionals they love
- **Social proof**: Endorsement count shows professional quality
- **Community building**: Creates connection between customers and professionals

### For Platform:
- **Viral growth**: Endorsement system encourages sharing
- **Quality filter**: Only professionals with satisfied customers stay visible
- **Organic marketing**: Each endorsement is a share/recommendation
- **Lower churn**: Professionals invested in getting endorsements stay engaged

## Documentation References

### Pricing Model (from docs/IMPLEMENTATION_RECOMMENDATIONS.md & docs/SUCCESS_FACTORS.md)

- **Free Tier**: "Local editing only (no publish)" - Currently NOT enforced
- **Basic Tier**: R$29/ano (~$6/year) - Publish 1 card, basic directory listing
- **Pro Tier**: R$49/ano (~$10/year) - Multiple cards (up to 3), featured listing, custom domain

### Payment Requirements

- **PIX payment integration** required (Brazilian instant payment)
- Payment gateways: Mercado Pago, Stripe Brazil, or Asaas
- Annual subscription model (not monthly)
- Transaction fee: ~3-5% (standard in Brazil)

### Current vs. Intended Behavior

| Feature | Documentation Intent | Current Implementation | Gap |
|---------|---------------------|------------------------|-----|
| Free Tier Publishing | ❌ Not allowed | ✅ Allowed | **MISMATCH** |
| Trial Period | ✅ 30 days for new users | ❌ Not implemented | **MISSING** |
| Subscription Tiers | ✅ free/basic/pro | ✅ free/basic/pro | ✅ Match |
| Payment Integration | ✅ PIX required | ❌ Not implemented | **MISSING** |
| Expiration Logic | ✅ Required | ❌ Not implemented | **MISSING** |

