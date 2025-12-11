# Backend CORS Update for vanta.lautrec.kr

Before deploying the frontend, you need to update the backend CORS configuration to allow requests from `vanta.lautrec.kr`.

---

## Update Backend CORS Configuration

### If using Railway (Current Setup)

1. Go to [Railway Dashboard](https://railway.app)
2. Select your backend project
3. Go to **Variables** tab
4. Find or add `ALLOWED_ORIGINS`
5. Update the value to include your new domain:

```
https://vanta.lautrec.kr,https://vanta-production-9f79.up.railway.app
```

**Important**: Keep the Railway URL in the list for API documentation access.

6. Save the variable
7. The backend will automatically restart with the new CORS settings

---

### If using Environment File

If you're running the backend locally or on a VPS, update the `.env` file:

```bash
ALLOWED_ORIGINS=https://vanta.lautrec.kr,https://vanta-production-9f79.up.railway.app
```

Then restart the backend server.

---

### Verify CORS is Working

After updating, test the CORS configuration:

1. Open browser console on `https://vanta.lautrec.kr`
2. Try to make an API request (e.g., login)
3. Check for CORS errors in the console
4. If you see CORS errors, verify:
   - The domain is exactly `https://vanta.lautrec.kr` (with https, no trailing slash)
   - Backend has been restarted after the change
   - No typos in the `ALLOWED_ORIGINS` variable

---

## Current Backend CORS Code

The backend CORS is configured in `myapp-backend/config.py`:

```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
```

And used in `myapp-backend/main.py` for CORS middleware.

---

## Quick Checklist

- [ ] Updated `ALLOWED_ORIGINS` in Railway/environment
- [ ] Included both `https://vanta.lautrec.kr` and Railway URL
- [ ] Backend restarted (automatic on Railway)
- [ ] Tested API connection from new domain
- [ ] No CORS errors in browser console

---

## Troubleshooting

### CORS Error: "Access-Control-Allow-Origin"

- Verify the domain in `ALLOWED_ORIGINS` matches exactly (including `https://`)
- Check for trailing slashes (should be none)
- Ensure backend has restarted
- Check browser console for the exact error message

### Still Getting CORS Errors

1. Check the exact origin in browser console error
2. Verify it matches what's in `ALLOWED_ORIGINS`
3. Try adding both `https://vanta.lautrec.kr` and `http://vanta.lautrec.kr` (if testing HTTP)
4. Clear browser cache and try again

