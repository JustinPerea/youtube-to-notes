# 🧪 Testing Guide for YouTube-to-Notes

## **Testing Strategy Overview**

This guide provides comprehensive testing instructions for both local and Vercel deployment.

---

## **🔍 Phase 1: Local Testing**

### **1. Security Headers Test**

**Test: Verify Security Headers are Present**

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Visit `http://localhost:3003`
4. Click on any request and check the Response Headers
5. Verify these headers are present:
   - ✅ `X-Frame-Options: DENY`
   - ✅ `X-Content-Type-Options: nosniff`
   - ✅ `Strict-Transport-Security`
   - ✅ `Content-Security-Policy`
   - ✅ `X-XSS-Protection: 1; mode=block`

**Expected Result:** All security headers should be present.

### **2. Rate Limiting Test**

**Test: Verify Rate Limiting Prevents Abuse**

1. Open multiple browser tabs (or use a tool like Postman)
2. Send 15+ rapid requests to `/api/videos/process`
3. Check for 429 (Too Many Requests) responses
4. Verify rate limit headers are present:
   - ✅ `Retry-After`
   - ✅ `X-RateLimit-Limit`
   - ✅ `X-RateLimit-Remaining`

**Expected Result:** After 10+ requests, you should get 429 responses with rate limit headers.

### **3. Input Validation Test**

**Test: Verify Input Validation Prevents Malicious Input**

**Test 1: Invalid YouTube URL**
```bash
curl -X POST http://localhost:3003/api/videos/process \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://evil.com/script.js", "selectedTemplate": "basic-summary"}'
```

**Expected Result:** Should return 400 Bad Request

**Test 2: XSS Payload**
```bash
curl -X POST http://localhost:3003/api/notes/save \
  -H "Content-Type: application/json" \
  -d '{"title": "<script>alert(\"xss\")</script>", "content": "Test"}'
```

**Expected Result:** Should return 400 Bad Request or 401 Unauthorized

### **4. Authentication Test**

**Test: Verify Protected Endpoints Require Authentication**

1. Try to access `/api/notes/save` without being signed in
2. Try to access `/notes` page without authentication

**Expected Result:** Should be redirected to sign-in or return 401 Unauthorized

### **5. CORS Test**

**Test: Verify CORS Protection**

1. Open browser console
2. Try to make a cross-origin request:
```javascript
fetch('http://localhost:3003/api/videos/process', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({videoUrl: 'https://youtube.com/watch?v=test'})
})
```

**Expected Result:** Should be blocked by CORS policy

---

## **🚀 Phase 2: Vercel Testing**

### **1. Production Environment Test**

**Test: Verify All Environment Variables are Set**

1. Go to your Vercel dashboard
2. Check Environment Variables section
3. Verify all required variables are present:
   - ✅ `GOOGLE_GEMINI_API_KEY`
   - ✅ `GOOGLE_CLIENT_ID`
   - ✅ `GOOGLE_CLIENT_SECRET`
   - ✅ `NEXTAUTH_SECRET`
   - ✅ `NEXTAUTH_URL`
   - ✅ `DATABASE_URL`

### **2. HTTPS Security Test**

**Test: Verify HTTPS is Enforced**

1. Try to access your site with `http://` instead of `https://`
2. Check if you're automatically redirected to HTTPS

**Expected Result:** Should redirect to HTTPS automatically

### **3. Production Security Headers Test**

**Test: Verify Security Headers in Production**

1. Use online tools like:
   - https://securityheaders.com
   - https://observatory.mozilla.org
2. Enter your Vercel domain
3. Check the security score

**Expected Result:** Should get an A+ grade

### **4. Authentication Flow Test**

**Test: Verify Google Sign-In Works in Production**

1. Visit your Vercel deployment
2. Try to sign in with Google
3. Verify you can save notes
4. Check if session persists

**Expected Result:** Authentication should work seamlessly

### **5. Database Connection Test**

**Test: Verify Database Operations Work**

1. Sign in to your application
2. Try to save a note
3. Check if the note appears in your notes list
4. Verify data persistence

**Expected Result:** Notes should save and persist correctly

---

## **🛡️ Security Testing Checklist**

### **Local Testing Checklist**
- [ ] Security headers are present
- [ ] Rate limiting prevents abuse
- [ ] Input validation blocks malicious input
- [ ] Authentication protects sensitive endpoints
- [ ] CORS blocks unauthorized cross-origin requests
- [ ] Bot protection blocks suspicious requests

### **Vercel Testing Checklist**
- [ ] All environment variables are set
- [ ] HTTPS is enforced
- [ ] Security headers get A+ grade
- [ ] Authentication flow works
- [ ] Database operations work
- [ ] No console errors in browser

### **Manual Security Tests**
- [ ] Try to inject SQL in input fields
- [ ] Try to inject XSS in input fields
- [ ] Try to access protected routes without auth
- [ ] Try to make requests with malicious user agents
- [ ] Try to access admin-only features

---

## **🔧 Testing Tools**

### **Browser Extensions for Testing**
- **ModHeader**: Test custom headers
- **Postman**: Test API endpoints
- **OWASP ZAP**: Security testing
- **Burp Suite**: Advanced security testing

### **Online Security Testing Tools**
- **securityheaders.com**: Test security headers
- **observatory.mozilla.org**: Comprehensive security analysis
- **ssllabs.com**: SSL/TLS testing
- **hackertarget.com**: Security scanning

---

## **📊 Expected Results**

### **Security Score Targets**
- **Security Headers**: A+
- **Rate Limiting**: 100% effective
- **Input Validation**: 100% malicious input blocked
- **Authentication**: 100% protected endpoints
- **CORS**: Properly configured
- **Overall Security**: 85%+ score

### **Performance Targets**
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 2 seconds
- **Authentication Time**: < 5 seconds
- **Note Saving Time**: < 1 second

---

## **🚨 Troubleshooting**

### **Common Issues**

**Issue: Rate limiting not working**
- Check if the rate limiter is properly imported
- Verify the middleware is applied

**Issue: Security headers missing**
- Check `next.config.js` configuration
- Verify middleware.ts is working

**Issue: Authentication failing**
- Check environment variables
- Verify Google OAuth configuration
- Check database connection

**Issue: Database errors**
- Verify Supabase connection string
- Check environment variables
- Verify database tables exist

### **Debug Commands**

```bash
# Check environment variables
node -e "console.log(process.env.NODE_ENV)"

# Test database connection
curl http://localhost:3003/api/health/db

# Check security headers
curl -I http://localhost:3003

# Test rate limiting
for i in {1..15}; do curl -X POST http://localhost:3003/api/videos/process -H "Content-Type: application/json" -d '{"videoUrl":"test"}'; done
```

---

## **✅ Testing Complete Checklist**

Before proceeding to production launch:

- [ ] All local tests pass
- [ ] All Vercel tests pass
- [ ] Security score is 85%+
- [ ] No critical security issues found
- [ ] Performance meets targets
- [ ] Authentication works correctly
- [ ] Database operations work
- [ ] Error handling is working
- [ ] Rate limiting is effective
- [ ] Input validation is working

Once all tests pass, your application is ready for public deployment! 🎉
