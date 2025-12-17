# 🔍 Debugging "API request failed" on Publish

## Quick Diagnosis Steps

### Step 1: Check Browser Console

1. Open your production site
2. Open DevTools (F12) → **Console** tab
3. Click the **Publish** button
4. Look for error messages starting with:
   - `[API Error]` - Shows the actual error details
   - `[Publish]` - Shows publish attempt details
   - `[API Config]` - Shows API URL configuration

### Step 2: Check Network Tab

1. Open DevTools (F12) → **Network** tab
2. Click the **Publish** button
3. Look for the request to `/api/publish`
4. Check:
   - **Status Code**: What HTTP status is returned?
   - **Response**: What does the response body say?
   - **Request URL**: Is it pointing to the correct API?

### Step 3: Common Error Patterns

#### Error: "API URL not configured" or localhost in URL
**Symptom**: Console shows `[API Config] ⚠️ WARNING: Using localhost URL in production!`

**Fix**: 
- Set `VITE_API_URL` in GitHub Actions secrets
- Value should be: `https://amei-beauty-api.adsventures.workers.dev/api`
- Trigger a new deployment

See: `docs/FIX_MISSING_VITE_API_URL.md`

#### Error: Status 500 (Internal Server Error)
**Symptom**: Network tab shows status 500, response might say "Database error" or "Failed to publish card"

**Possible Causes**:
1. **Database connection issue** - Check Cloudflare Workers logs
2. **Missing database columns** - Check if migrations are applied
3. **Invalid card data** - Check if required fields are present

**How to check**:
- Look at Cloudflare Workers logs (Workers & Pages → Your Worker → Logs)
- Check for error messages around the time you tried to publish

**Fix**: 
- Check `docs/DEBUG_500_ERROR.md` for detailed steps
- Verify database schema matches migrations

#### Error: Status 400 (Bad Request)
**Symptom**: Response says "Validation failed" or "Profile is required"

**Possible Causes**:
1. Missing required fields (e.g., `profile.full_name`)
2. Invalid data format
3. JSON parsing error

**How to check**:
- Look at the `[Publish] Attempting to publish card:` log in console
- Check if `hasProfile: true` and `profileName` is set

**Fix**: 
- Ensure all required fields are filled in the card form
- Check that profile data is properly structured

#### Error: Status 401 (Unauthorized)
**Symptom**: Response says "Unauthorized" or "Invalid authentication token"

**Possible Causes**:
1. Republishing an existing card without token
2. Invalid or expired token

**Fix**: 
- If republishing, ensure you have the owner token
- Try publishing as a new card (don't include card ID)

#### Error: Status 409 (Conflict)
**Symptom**: Response says "Username already taken"

**Fix**: 
- Choose a different username
- Leave username empty to auto-generate one

#### Error: Status 0 or CORS Error
**Symptom**: Console shows "Possible CORS issue" or "Failed to fetch"

**Possible Causes**:
1. CORS headers not configured on API
2. API URL is incorrect
3. Network connectivity issue

**Fix**: 
- Check API URL is correct
- Verify CORS headers are set in the API worker
- Check network connectivity

#### Error: Network Error / Failed to fetch
**Symptom**: Console shows "Network error" or "Unable to connect to server"

**Possible Causes**:
1. API URL is incorrect or not accessible
2. API server is down
3. Network connectivity issue

**Fix**: 
- Verify API URL is correct: `https://amei-beauty-api.adsventures.workers.dev/api`
- Test API endpoint directly: `curl https://amei-beauty-api.adsventures.workers.dev/api/health`
- Check if API worker is deployed and running

## Detailed Error Information

After clicking Publish, check the console for these logs:

### Successful Publish:
```
[Publish] Attempting to publish card: { hasId: false, username: "...", hasProfile: true, ... }
[Publish] Success: { cardId: "...", hasToken: true }
```

### Failed Publish:
```
[Publish] Attempting to publish card: { ... }
[API Error] Request failed: { status: 500, errorMessage: "...", ... }
[Publish] Failed to publish card: { error: ApiError, ... }
```

## Testing the API Directly

You can test the publish endpoint directly using curl:

```bash
curl -X POST https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "full_name": "Test User",
      "title": "Test Title"
    }
  }'
```

This will show you the exact error response from the server.

## Next Steps

1. **Check the console logs** - They now show detailed error information
2. **Check the network tab** - See the actual HTTP response
3. **Check Cloudflare Workers logs** - See server-side errors
4. **Test the API directly** - Use curl to isolate frontend vs backend issues

## Related Documentation

- `docs/FIX_MISSING_VITE_API_URL.md` - Fix API URL configuration
- `docs/DEBUG_500_ERROR.md` - Debug server errors
- `docs/TROUBLESHOOTING_PUBLISH_ISSUE.md` - General publish troubleshooting

