# Fix: "Unknown error" When Publishing

## Problem

You're getting "Unknown error" when trying to publish a card. This usually means there's a validation error or server error that isn't being displayed properly.

## Quick Fix

I've updated the error handling to show more specific error messages. The most common causes are:

### 1. Missing Required Fields

The most common validation errors:
- **"Profile whatsapp is required"** - You need to provide a WhatsApp number
- **"Profile full_name is required"** - You need to provide a full name
- **"Referral code is required"** - This should be auto-generated, but if missing, it's a bug

### 2. Invalid Data Format

- **Invalid WhatsApp number** - Must be 10-15 digits, can include + prefix
- **Invalid username** - Must be 3-30 characters, alphanumeric with hyphens/underscores
- **Invalid website URL** - Must be a valid URL format

## How to See the Actual Error

### Option 1: Check Browser Console

1. Open your browser DevTools (F12)
2. Go to the **Console** tab
3. Try to publish a card
4. Look for `[API Error]` messages - these will show the actual error

### Option 2: Check Network Tab

1. Open DevTools (F12)
2. Go to the **Network** tab
3. Try to publish a card
4. Find the request to `/api/publish`
5. Click on it and check the **Response** tab
6. You'll see the actual error message from the server

### Option 3: Test with curl

```bash
# Replace with your actual card data
curl -X POST https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Content-Type: application/json" \
  -H "Origin: https://amei.beauty" \
  -d '{
    "profile": {
      "full_name": "Test User",
      "whatsapp": "+5511999999999",
      "profession": "Beauty Professional"
    }
  }'
```

## Common Validation Errors

### Missing WhatsApp Number
```json
{"error":"Validation failed","details":["Profile whatsapp is required"]}
```
**Fix**: Make sure you've entered a WhatsApp number in the profile form.

### Invalid WhatsApp Format
```json
{"error":"Validation failed","details":["Invalid WhatsApp number"]}
```
**Fix**: WhatsApp number must be 10-15 digits. Can include + prefix (e.g., `+5511999999999`).

### Missing Full Name
```json
{"error":"Validation failed","details":["Profile full_name is required"]}
```
**Fix**: Make sure you've entered your full name.

### Invalid Username
```json
{"error":"Validation failed","details":["Invalid username"]}
```
**Fix**: Username must be:
- 3-30 characters
- Alphanumeric, hyphens, underscores only
- Must start and end with letter or number

### Username Already Taken
```json
{"error":"Username already taken"}
```
**Fix**: Choose a different username.

## Server Errors (500)

If you see a 500 error, check:

1. **Workers Logs**:
   ```bash
   npx wrangler tail --config wrangler.workers.toml
   ```

2. **Database Issues**: Make sure migrations are applied:
   ```bash
   npm run d1:migrate
   ```

3. **Missing Secrets**: Check if `AUTH_SECRET` is set:
   ```bash
   npx wrangler secret list --config wrangler.workers.toml --env production
   ```

## After the Fix

The error handling has been improved to show specific validation errors instead of "Unknown error". After rebuilding and redeploying, you should see messages like:

- ✅ "Profile whatsapp is required"
- ✅ "Invalid WhatsApp number"
- ✅ "Username already taken"
- ✅ "Validation errors: Profile whatsapp is required; Invalid username"

Instead of:
- ❌ "Unknown error"

## Next Steps

1. **Rebuild the frontend** with the updated error handling:
   ```bash
   npm run build
   npm run deploy:pages
   ```

2. **Try publishing again** and check the browser console for specific error messages

3. **Fix any validation errors** shown in the error message

4. **If still getting "Unknown error"**, check the Network tab in DevTools to see the actual API response

