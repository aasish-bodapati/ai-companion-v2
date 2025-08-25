# Frontend Debug Guide

## 🎯 **The Issue**
The backend is working perfectly - the AI chat is responding correctly. However, the frontend is still showing "Sorry — I couldn't generate a response just now. Please try again."

## 🔍 **Root Cause**
This is a **frontend authentication issue**, not a backend issue. The frontend is not properly sending the authentication token with API requests.

## 🛠️ **Debug Steps**

### **Step 1: Check Browser Console**
1. Open `http://localhost:3000` in your browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Look for error messages, especially:
   - Authentication errors
   - API call failures
   - CORS errors

### **Step 2: Check Network Tab**
1. In Developer Tools, go to the **Network** tab
2. Try to send a chat message
3. Look for the API call to `/conversation/chat`
4. Check:
   - **Request Headers**: Is `Authorization: Bearer <token>` present?
   - **Response Status**: What status code is returned?
   - **Response Body**: What error message is returned?

### **Step 3: Check Authentication State**
1. In the Console tab, run these commands:
   ```javascript
   // Check if user is logged in
   console.log('User:', window.localStorage.getItem('user'))
   
   // Check if token exists
   console.log('Token:', window.localStorage.getItem('token'))
   
   // Check if user is authenticated
   console.log('Is Authenticated:', window.localStorage.getItem('token') !== null)
   ```

### **Step 4: Manual Login Test**
1. Go to the login page (if available)
2. Login with: `test@example.com` / `testpassword123`
3. Check if the token is stored in localStorage
4. Try sending a chat message again

## 🚨 **Common Issues & Solutions**

### **Issue 1: Token Not Stored**
- **Symptom**: `localStorage.getItem('token')` returns `null`
- **Solution**: Check login flow, ensure token is saved after successful login

### **Issue 2: Token Not Sent**
- **Symptom**: API calls don't include `Authorization` header
- **Solution**: Check API client configuration, ensure token is attached to requests

### **Issue 3: Token Expired**
- **Symptom**: API returns 401 Unauthorized
- **Solution**: Re-login to get a fresh token

### **Issue 4: CORS Issues**
- **Symptom**: Browser blocks requests due to CORS policy
- **Solution**: Backend CORS is configured correctly, this shouldn't be the issue

## 🔧 **Quick Fixes to Try**

### **Fix 1: Clear Browser Data**
1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Login again

### **Fix 2: Check API Base URL**
1. Ensure frontend is calling `http://localhost:8000`
2. Check `NEXT_PUBLIC_API_URL` environment variable

### **Fix 3: Verify Backend Status**
1. Backend should be running on port 8000
2. Health check should return `{"status":"ok"}`

## 📋 **Expected Behavior**
- ✅ User logs in successfully
- ✅ Token is stored in localStorage
- ✅ API calls include `Authorization: Bearer <token>` header
- ✅ Chat messages get AI responses
- ✅ No "Sorry — I couldn't generate a response" errors

## 🆘 **If Still Not Working**
1. Check browser console for specific error messages
2. Verify the exact API endpoint being called
3. Check if the frontend is using the correct authentication flow
4. Ensure the frontend is properly handling the JWT token
