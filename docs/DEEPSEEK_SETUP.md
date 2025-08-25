# 🚀 Switching to DeepSeek R1 Free - Setup Guide

## Overview

This guide will help you switch your AI Companion V2 from local Llama (Ollama) to DeepSeek R1 Free, which provides:

- **Higher Quality**: Better conversation understanding and response generation
- **Vision Capabilities**: Advanced image analysis with `deepseek-vision`
- **Free Tier**: Generous free usage limits
- **No Local Setup**: No need to run Ollama locally

## 🔑 Step 1: Get DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

## ⚙️ Step 2: Configure Environment

1. **Copy the template file:**
   ```bash
   cd backend
   cp env_template.txt .env
   ```

2. **Edit `.env` file:**
   ```bash
   # Replace this line with your actual API key
   LLM_KEY=sk-your-actual-api-key-here
   
   # Ensure these settings are correct
   LLM_BASE_URL=https://api.deepseek.com/v1
   LLM_MODEL_DEFAULT=deepseek-chat
   LLM_MODEL_VISION=deepseek-vision
   LLM_MODEL_SUMMARY=deepseek-chat
   ```

## 🔄 Step 3: Restart Backend

After updating the `.env` file, restart your backend server:

```bash
# Stop current server (Ctrl+C)
# Then restart
cd backend
python -m uvicorn app.main:app --reload
```

## ✅ Step 4: Verify Configuration

Check your backend logs for these messages:

```
INFO: DeepSeek R1 Free API key detected from env file.
```

If you see warnings about missing API keys, double-check your `.env` file.

## 🧪 Step 5: Test the Setup

Run your testing framework to verify everything works:

```bash
python test_individual_components.py
```

You should see improved performance and no LLM-related errors.

## 🔍 Step 6: Test Vision Capabilities

Test the new vision capabilities:

```bash
# Upload an image and ask the AI to analyze it
# The system will now use deepseek-vision for better image understanding
```

## 📊 Expected Improvements

### **Conversation Quality**
- Better context understanding
- More natural responses
- Improved domain detection (fitness, nutrition, scheduling)

### **Vision Capabilities**
- Enhanced image analysis
- Better document understanding
- Improved OCR results

### **Performance**
- Faster response times (no local model loading)
- More consistent quality
- Better error handling

## 🔧 Troubleshooting

### **API Key Issues**
```
ERROR: DeepSeek R1 Free requires API key
```
**Solution**: Check your `.env` file and ensure `LLM_KEY` is set correctly.

### **Rate Limiting**
```
ERROR: Rate limit exceeded
```
**Solution**: DeepSeek has generous free limits, but you can implement request pacing if needed.

### **Vision Not Working**
```
ERROR: Vision generation failed
```
**Solution**: Ensure `LLM_MODEL_VISION=deepseek-vision` is set in your `.env`.

## 🔄 Switching Back to Local Llama

If you want to switch back to local Llama:

1. **Update `.env`:**
   ```bash
   LLM_KEY=
   LLM_BASE_URL=http://localhost:11434/v1
   LLM_MODEL_DEFAULT=llama3.1:8b
   LLM_MODEL_VISION=llama3.1:8b
   LLM_MODEL_SUMMARY=llama3.1:8b
   ```

2. **Ensure Ollama is running:**
   ```bash
   ollama serve
   ```

3. **Restart backend**

## 📈 Performance Comparison

| Aspect | Local Llama | DeepSeek R1 Free |
|--------|-------------|------------------|
| **Setup** | Requires Ollama | API key only |
| **Quality** | Good | Excellent |
| **Speed** | Variable | Consistent |
| **Vision** | Basic | Advanced |
| **Cost** | Free | Free tier |
| **Reliability** | Local dependent | Cloud-based |

## 🎯 Next Steps

1. **Test all features** to ensure smooth operation
2. **Monitor API usage** in your DeepSeek dashboard
3. **Explore advanced features** like better vision analysis
4. **Optimize prompts** for the new model's capabilities

## 📚 Additional Resources

- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [Model Comparison](https://platform.deepseek.com/models)
- [Rate Limits](https://platform.deepseek.com/pricing)

---

**Need Help?** Check the backend logs for detailed error messages or refer to the project documentation.

