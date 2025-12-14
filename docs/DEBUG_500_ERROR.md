# 🔍 Debugging 500 Internal Server Error on Publish

## Current Issue

The API is returning a 500 Internal Server Error when trying to publish a card:
```
POST https://amei-beauty-api.adsventures.workers.dev/api/publish 500 (Internal Server Error)
```

## What I've Fixed

I've improved error handling in the publish handler to:
1. ✅ Better JSON parsing error handling
2. ✅ Validation for required fields (like `profile`)
3. ✅ Enhanced database error logging
4. ✅ More detailed error messages in development mode

## Next Steps to Debug

### Step 1: Check Cloudflare Workers Logs

The error is now being logged with more details. Check your Cloudflare Workers logs:

1. Go to: [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to: **Workers & Pages** → **amei-beauty-api**
3. Click on **Logs** tab
4. Look for recent errors around the time you tried to publish
5. Check for:
   - `Publish error:` - Main error message
   - `Error details:` - Detailed error information
   - `Database insert/update error:` - If it's a database issue
   - `JSON parse error:` - If it's a request parsing issue

### Step 2: Common Causes of 500 Errors

1. **Missing Database Columns**:
   - The database schema might be missing required columns
   - Check if migrations have been run: `npx wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml`

2. **Database Connection Issues**:
   - D1 database might not be properly bound
   - Check `wrangler.workers.toml` for database binding

3. **Missing Required Fields**:
   - The request might be missing `profile` or other required fields
   - Check browser Network tab → Request payload

4. **JSON Serialization Issues**:
   - Large objects might fail to serialize
   - Check if any fields contain invalid data

### Step 3: Test the API Directly

You can test the publish endpoint directly to see the error:

```bash
curl -X POST https://amei-beauty-api.adsventures.workers.dev/api/publish \
  -H "Content-Type: application/json" \
  -H "Origin: https://amei.beauty" \
  -d '{
    "profile": {
      "name": "Test",
      "title": "Test Title"
    },
    "services": [],
    "social": [],
    "links": []
  }'
```

### Step 4: Check Database Schema

Verify your database has all required columns:

```bash
npx wrangler d1 execute amei-beauty-db --config wrangler.workers.toml --command "PRAGMA table_info(cards);"
```

Required columns include:
- `id`, `username`, `profile_json`, `services_json`, `social_json`, `links_json`
- `ratings_json`, `testimonials_json`, `client_photos_json`, `badges_json`
- `certifications_json`, `recommendations_json`, `location_json`
- `referral_code`, `published_at`, `updated_at`
- `is_active`, `is_featured`, `subscription_tier`
- `free_period_end`, `updates_enabled_until`, `endorsement_count`
- `can_update`, `payment_status`, `owner_token_hash`

### Step 5: Run Migrations

If the schema is missing columns, run migrations:

```bash
npx wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml
```

## What to Look For in Logs

After deploying the improved error handling, check logs for:

1. **"Publish error:"** - The main error
2. **"Error details:"** - Error name, message, and stack trace
3. **"Database insert/update error:"** - Specific database errors
4. **"Card data:"** - What data was being processed when it failed

## After Finding the Root Cause

Once you identify the issue from the logs:

1. **If it's a missing column**: Run migrations
2. **If it's invalid data**: Fix the frontend to send correct data
3. **If it's a database connection**: Check D1 binding in wrangler config
4. **If it's a serialization issue**: Check for circular references or invalid JSON

## Need More Help?

If the logs don't show enough information, you can:
1. Add more console.log statements in the publish handler
2. Check the request payload in browser DevTools → Network tab
3. Verify the database is accessible and has the correct schema
4. Test with a minimal card payload to isolate the issue

