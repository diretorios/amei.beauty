# 💚 Viral Strategy: "amei" Wordplay & Recommendation Engine

## The Brilliant Wordplay

### The Double Meaning
- **"amei"** = "loved" in Portuguese (past tense of "amar" = to love)
- **"a MEI"** = "A Micro Empreendedor Individual" (the MEI professional)
- **"amei a MEI"** = "I loved the MEI professional" = Perfect marketing hook!

### Why This Works
1. **Instant brand recognition**: The wordplay is memorable and shareable
2. **Emotional connection**: "amei" (loved) creates positive emotional association
3. **Cultural fit**: Brazilians love wordplay and clever marketing
4. **Viral potential**: Easy to say, easy to remember, easy to share
5. **Dual audience**: Appeals to both customers ("amei") and professionals ("a MEI")

---

## Viral Recommendation Engine

### Core Concept
**Make it dead simple for happy customers to recommend their loved professional.**

### The Flow

```
Happy Customer
    ↓
Views Professional's Card
    ↓
Clicks "Amei este profissional!" Button
    ↓
Chooses Share Method (WhatsApp, Instagram, Facebook)
    ↓
Pre-filled Message: "Amei este profissional! Confira: [card link]"
    ↓
Friend Clicks Link
    ↓
Sees Card + "Você também vai amar!" (You'll love it too!)
    ↓
Cycle Repeats
```

---

## Required Features

### 1. "Amei este profissional!" Button ⭐

**Placement:**
- Prominent on every published card
- Above the fold (visible without scrolling)
- Large, touch-friendly button
- Heart icon + "Amei este profissional!" text
- Vibrant color (green/yellow Brazilian palette)

**Behavior:**
- One-click recommendation
- No login required (reduce friction)
- Instant share options appear
- Tracks recommendation (counts toward social proof)

**Visual Design:**
```
┌─────────────────────────────┐
│  💚 Amei este profissional! │
│     (I loved this pro!)      │
└─────────────────────────────┘
```

### 2. Share Options

**WhatsApp** (Primary - 80% of shares)
- Deep link: `https://wa.me/?text=Amei este profissional! Confira: [card link]`
- Pre-filled message in Portuguese
- Opens WhatsApp chat directly

**Instagram Stories**
- Generate shareable image with card preview
- "Amei este profissional!" sticker
- Link to card in bio

**Facebook**
- Share to timeline or groups
- Pre-filled post with card link

**Copy Link**
- Generate shareable link with referral code
- `amei.beauty/@username?ref=[referral_code]`
- Tracks who shared and who clicked

### 3. Recommendation Tracking

**What to Track:**
- Total recommendation count
- Recent recommendations (last 10-20)
- Referral sources (WhatsApp, Instagram, etc.)
- Click-through rate on shared links
- Conversion rate (shared link → new client)

**Display:**
- "X pessoas recomendaram" (X people recommended)
- "Maria amou este profissional" (Maria loved this professional)
- "João recomendou" (João recommended)
- Show recent recommendations as social proof

### 4. Viral Loop Messaging

**When Someone Clicks Shared Link:**
- Show card prominently
- Display: "Você também vai amar!" (You'll love it too!)
- Show recommendation count
- Show who recommended: "Recomendado por Maria" (Recommended by Maria)
- Make it easy to recommend again

**Incentivize Sharing:**
- "Compartilhe com quem você ama!" (Share with those you love!)
- "Ajude este profissional a crescer!" (Help this professional grow!)
- "Espalhe o amor!" (Spread the love!)

### 5. Professional Rewards

**Badges for High Recommendations:**
- "Mais amada" (Most loved) - Top 10% recommendations
- "Recomendada por muitos" (Recommended by many) - 50+ recommendations
- "Viral" - 100+ recommendations
- "Favorita da comunidade" (Community favorite) - 500+ recommendations

**Display on Card:**
- Badge next to professional's name
- "Este profissional é muito amado!" (This professional is very loved!)
- Increases credibility and trust

---

## Marketing Messaging

### Taglines That Leverage Wordplay

**For Customers:**
- "Amei este profissional!" (I loved this professional!)
- "Você também vai amar!" (You'll love it too!)
- "Compartilhe o amor!" (Share the love!)
- "Espalhe o amor pelos profissionais que você ama!" (Spread love for professionals you love!)

**For Professionals:**
- "Seja amada pelos seus clientes" (Be loved by your clients)
- "Deixe seus clientes te amarem" (Let your clients love you)
- "Amei a MEI" (I loved the MEI) - Perfect for professionals
- "Seja a MEI mais amada" (Be the most loved MEI)

### Social Media Campaigns

**Hashtags:**
- `#amei` (loved)
- `#ameiamei` (I loved the MEI)
- `#profissionalamei` (loved professional)
- `#compartilheoamor` (share the love)
- `#ameiabeauty` (loved beauty)

**Content Ideas:**
- "Amei este profissional!" testimonials
- Before/after photos with "amei" messaging
- Customer stories: "Amei a experiência!"
- Professional spotlights: "A MEI mais amada"

---

## Implementation Details

### Data Model

```typescript
interface Recommendation {
  id: string;
  card_id: string;
  recommender_name?: string; // Optional, can be anonymous
  recommender_whatsapp?: string; // For tracking
  referral_code: string;
  shared_via: 'whatsapp' | 'instagram' | 'facebook' | 'link';
  shared_at: string; // ISO-8601
  clicked_count: number; // How many times shared link was clicked
  converted_count: number; // How many became clients
}

interface CardRecommendations {
  card_id: string;
  total_count: number;
  recent: Recommendation[]; // Last 20
  referral_codes: Map<string, Recommendation>; // Track by code
}
```

### API Endpoints

```typescript
// Recommend a professional
POST /api/recommend
Body: {
  card_id: string;
  recommender_name?: string;
  recommender_whatsapp?: string;
  share_method: 'whatsapp' | 'instagram' | 'facebook' | 'link';
}

// Get recommendations for a card
GET /api/card/:id/recommendations
Response: {
  total_count: number;
  recent: Recommendation[];
  badges: Badge[];
}

// Track referral click
GET /api/referral/:code
Response: {
  card_id: string;
  recommender_name?: string;
  message: "Você também vai amar!";
  card: PublishedCard;
}

// Generate shareable link
POST /api/share
Body: {
  card_id: string;
  method: 'whatsapp' | 'instagram' | 'facebook' | 'link';
}
Response: {
  share_url: string;
  referral_code: string;
  pre_filled_message: string;
}
```

### UI Components

**"Amei este profissional!" Button:**
```tsx
<RecommendButton 
  cardId={card.id}
  onShare={(method) => handleShare(method)}
  recommendationCount={card.recommendations.count}
/>
```

**Share Modal:**
```tsx
<ShareModal
  card={card}
  referralCode={referralCode}
  onShare={(method) => shareViaMethod(method)}
/>
```

**Recommendation Display:**
```tsx
<RecommendationBadge 
  count={card.recommendations.count}
  recent={card.recommendations.recent}
/>
```

---

## Growth Hacking Tactics

### 1. Gamification
- Show recommendation leaderboard
- "MEI mais amada da semana" (Most loved MEI of the week)
- Monthly contests: "Quem será a mais amada?"

### 2. Social Proof Amplification
- "X pessoas recomendaram este profissional"
- "Recomendado por Maria, João, Ana..."
- "Este profissional é muito amado!"

### 3. Incentivize Sharing
- Professionals can offer discounts for recommendations
- "Indique um amigo e ganhe 10% de desconto"
- Track referrals and reward both parties

### 4. Viral Moments
- Celebrate milestones: "100 pessoas amaram este profissional!"
- Share success stories: "Como Maria se tornou a MEI mais amada"
- Create shareable content: "Amei este profissional!" templates

---

## Success Metrics

### Viral Metrics
1. **Viral Coefficient (K)**: Recommendations per card
   - Target: K > 2.0 (each card generates 2+ recommendations)
   - Formula: Total recommendations / Total cards

2. **Recommendation Rate**: % of card views that result in recommendation
   - Target: > 5% (5% of viewers recommend)

3. **Click-Through Rate**: % of shared links that are clicked
   - Target: > 15% (15% of shared links get clicked)

4. **Conversion Rate**: % of shared link clicks that become clients
   - Target: > 10% (10% of clicks convert to clients)

5. **Share Distribution**: Which platforms drive most shares
   - Expected: WhatsApp 80%, Instagram 15%, Facebook 5%

### Growth Metrics
- **Organic Growth Rate**: % of new users from recommendations
- **Retention**: Do recommended professionals stay longer?
- **Engagement**: Do recommended cards get more views?

---

## Marketing Campaign Ideas

### Launch Campaign: "Amei a MEI"
- Tagline: "Amei a MEI" (I loved the MEI)
- Focus: Celebrate MEI professionals
- Content: Customer testimonials, professional spotlights
- Hashtag: `#ameiamei`

### Ongoing Campaign: "Compartilhe o Amor"
- Tagline: "Compartilhe o amor pelos profissionais que você ama"
- Focus: Encourage recommendations
- Content: Success stories, viral moments
- Hashtag: `#compartilheoamor`

### Seasonal Campaign: "MEI Mais Amada"
- Tagline: "Quem será a MEI mais amada?"
- Focus: Gamification, contests
- Content: Leaderboards, winners, celebrations
- Hashtag: `#meimaisamada`

---

## Why This Will Go Viral

1. **Emotional Connection**: "amei" (loved) creates positive emotion
2. **Easy to Share**: One-click recommendation, pre-filled messages
3. **Word-of-Mouth**: Brazilians trust recommendations from friends
4. **Social Proof**: Seeing others recommend increases likelihood to recommend
5. **Gamification**: Badges and leaderboards create competition
6. **Low Friction**: No login required, instant sharing
7. **Cultural Fit**: Wordplay resonates with Brazilian culture
8. **Dual Value**: Benefits both customers (easy sharing) and professionals (more clients)

---

## Final Thoughts

The "amei" wordplay is **pure gold**. It's:
- ✅ Memorable
- ✅ Shareable
- ✅ Emotional
- ✅ Culturally relevant
- ✅ Brand-defining

**This is how you "take the professional beauty industry in Brazil by storm."**

Make it dead simple for happy customers to say "Amei este profissional!" and share it. The wordplay will do the rest.

---

*This viral strategy complements the core product features and is essential for explosive growth.*

