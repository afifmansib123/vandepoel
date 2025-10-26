# 🧪 Complete Testing Guide - Token Marketplace

## Issue: Buyer Can't See Token Offerings

### Root Cause:
Buyers can **ONLY** see "ACTIVE" token offerings. Draft offerings are not visible to buyers.

---

## ✅ Step-by-Step Solution

### **PART 1: Create & Activate Token Offering (As Landlord)**

#### Step 1: Create Token Offering
1. Sign in as **Landlord**
2. Go to: `/landlords/properties`
3. Click on any property
4. Click blue **"Tokenize Property"** button
5. Fill in the 3-step wizard:
   - **Step 1:** Token details (name, symbol, quantity, price)
   - **Step 2:** Investment terms (returns, dividends, risk)
   - **Step 3:** Offering period (dates, description)
6. Click **"Create Token Offering"**
7. ✅ Success! Offering created in **"DRAFT"** status

#### Step 2: Activate the Offering ⚠️ **IMPORTANT!**
1. Go to: `/landlords/token-offerings`
2. You'll see your offering with a **gray "DRAFT"** badge
3. Find the green **"Activate"** button
4. Click **"Activate"**
5. ✅ Status changes to **"ACTIVE"** (green badge)
6. **NOW buyers can see it!**

---

### **PART 2: Browse & Purchase (As Buyer)**

#### Step 3: Browse Token Marketplace
1. Sign in as **Buyer**
2. Go to: `/buyers/tokens`
3. ✅ You should now see the **active** offering!
4. See the token card with:
   - Property name
   - Token symbol
   - Funding progress
   - Expected return
   - "Invest Now" button

#### Step 4: Purchase Tokens
1. Click on the token offering card
2. You're taken to: `/buyers/tokens/[tokenId]`
3. Review all details
4. Click blue **"Invest Now"** button
5. **3-Step Purchase Modal Opens:**

   **Step 1: Token Selection**
   - Enter number of tokens (respects min/max)
   - Select payment method
   - See total cost calculation
   - Click "Continue to Confirmation"

   **Step 2: Confirmation**
   - Review all details
   - Click "Confirm Purchase"

   **Step 3: Success**
   - ✅ Purchase complete!
   - View portfolio

#### Step 5: View Portfolio
1. Go to: `/buyers/portfolio`
2. ✅ See your investment!
3. View statistics:
   - Total invested
   - Dividends earned
   - Current value
   - ROI

---

## 🔍 Troubleshooting

### "I still don't see any tokens as buyer"

**Check these things:**

1. ✅ **Is the offering ACTIVE?**
   - Go to `/landlords/token-offerings` (as landlord)
   - Badge should be **GREEN** and say "ACTIVE"
   - If it says "DRAFT", click "Activate"

2. ✅ **Are you signed in as a buyer?**
   - Check your user role
   - Should be "buyer" account

3. ✅ **Refresh the page**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

4. ✅ **Check the browser console**
   - Open DevTools (F12)
   - Look for errors in Console tab

---

## 📊 Status Flow Diagram

```
LANDLORD SIDE:
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Create     │      │   Offering   │      │   Click      │
│   Token      │ ---> │   Status:    │ ---> │  "Activate"  │
│   Offering   │      │   DRAFT      │      │   Button     │
└──────────────┘      └──────────────┘      └──────────────┘
                                                     │
                                                     ▼
                                            ┌──────────────┐
                                            │   Offering   │
                                            │   Status:    │
                                            │   ACTIVE     │
                                            └──────────────┘
                                                     │
                                                     │ Visible to buyers
                                                     ▼
BUYER SIDE:                                 ┌──────────────┐
                                            │   Appears    │
                                            │   in Token   │
                                            │  Marketplace │
                                            └──────────────┘
```

---

## 🎯 Quick Reference

### Who Can See What?

| Status | Landlord Sees | Buyer Sees | Can Purchase |
|--------|---------------|------------|--------------|
| **DRAFT** | ✅ Yes (in `/landlords/token-offerings`) | ❌ No | ❌ No |
| **ACTIVE** | ✅ Yes (in `/landlords/token-offerings`) | ✅ Yes (in `/buyers/tokens`) | ✅ Yes |
| **FUNDED** | ✅ Yes | ✅ Yes | ❌ No (fully funded) |
| **CLOSED** | ✅ Yes | ❌ No | ❌ No |

---

## 🚀 Expected URLs

### Landlord URLs:
- Properties: `/landlords/properties`
- Property Details: `/landlords/properties/[id]`
- Token Offerings: `/landlords/token-offerings` ⭐ **Activate here!**

### Buyer URLs:
- Token Marketplace: `/buyers/tokens` ⭐ **See offerings here!**
- Token Details: `/buyers/tokens/[id]`
- Portfolio: `/buyers/portfolio`

---

## ✅ Success Indicators

### You'll know it's working when:

**As Landlord:**
- ✅ See "DRAFT" badge turn to "ACTIVE" (green)
- ✅ "Activate" button disappears
- ✅ "Close" button appears instead

**As Buyer:**
- ✅ See token cards in marketplace grid
- ✅ Can click on cards
- ✅ "Invest Now" button appears
- ✅ Can complete purchase
- ✅ Investment appears in portfolio

---

## 💡 Pro Tips

1. **Always activate offerings** after creating them
2. **Check the status badge color:**
   - Gray = Draft (only landlord can see)
   - Green = Active (buyers can see)
3. **Buyers need active offerings** to purchase
4. **Use filters** in buyer marketplace to find specific offerings

---

## 🆘 Still Having Issues?

If you've activated the offering but still can't see it:

1. **Check browser console** for errors
2. **Verify API response:**
   - Open DevTools → Network tab
   - Look for `/api/tokens/offerings` request
   - Check if it returns data

3. **Try creating a new offering** and activate it immediately

4. **Clear browser cache** and reload

---

**Remember: The key step is clicking "Activate" in `/landlords/token-offerings`!**
