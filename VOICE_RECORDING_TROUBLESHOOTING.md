# Voice Recording Troubleshooting Guide

## 🎤 **How to Access Voice Recording**

### **Step 1: Navigate to AI Studio**
1. Go to the **Smart Prompt Studio** page (`/smart-studio`)
2. Look for the **mode toggle buttons** at the top of the interface
3. You should see three buttons: **Text**, **Voice**, and **Smart**

### **Step 2: Switch to Voice Mode**
1. Click the **"Voice"** button (green button with microphone icon)
2. If the button is grayed out, see troubleshooting steps below
3. Once in Voice Mode, you'll see the voice recording interface

### **Step 3: Start Recording**
1. Click the **red record button** to start recording
2. Speak clearly into your microphone
3. Click **stop** when finished
4. Your speech will be transcribed and can be enhanced into prompts

## 🔧 **Troubleshooting Common Issues**

### **Issue 1: Voice Button is Grayed Out**
**Possible Causes:**
- Browser doesn't support Web Speech API
- Microphone permissions not granted
- Using an unsupported browser

**Solutions:**
1. **Use a supported browser**: Chrome, Edge, or Safari (latest versions)
2. **Grant microphone permissions**:
   - Look for microphone icon in address bar
   - Click and select "Allow"
   - Refresh the page
3. **Check browser settings**:
   - Go to browser settings → Privacy & Security → Site Settings → Microphone
   - Ensure the site is allowed to use microphone

### **Issue 2: Can't See Mode Toggle Buttons**
**Possible Causes:**
- Mobile device with hidden interface
- Screen too small
- JavaScript disabled

**Solutions:**
1. **Scroll up** to the top of the AI Studio page
2. **Look for the green "Quick Voice Input" card** in Text Mode
3. **Try refreshing the page**
4. **Enable JavaScript** in your browser

### **Issue 3: Recording Doesn't Start**
**Possible Causes:**
- Microphone not connected
- Microphone permissions denied
- Browser security restrictions

**Solutions:**
1. **Check microphone connection**:
   - Test microphone in other apps
   - Ensure microphone is not muted
2. **Reset permissions**:
   - Clear site data and reload
   - Grant permissions again
3. **Try HTTPS**:
   - Voice recording requires secure connection
   - Ensure you're using https:// not http://

### **Issue 4: Poor Transcription Quality**
**Possible Causes:**
- Background noise
- Speaking too fast/slow
- Microphone quality issues

**Solutions:**
1. **Speak clearly and slowly**
2. **Reduce background noise**
3. **Use a better microphone** if possible
4. **Try the "Apply to Enhancer" button** after transcription

## 🌐 **Browser Compatibility**

### **✅ Fully Supported**
- **Chrome** (version 25+)
- **Microsoft Edge** (version 79+)
- **Safari** (version 14.1+)

### **⚠️ Limited Support**
- **Firefox** (limited Web Speech API support)
- **Opera** (depends on Chromium version)

### **❌ Not Supported**
- **Internet Explorer** (any version)
- **Older mobile browsers**

## 📱 **Mobile Device Tips**

### **iOS (iPhone/iPad)**
1. Use **Safari browser** (best support)
2. Ensure **microphone permissions** are granted
3. **Tap and hold** record button for best results
4. **Speak close to microphone**

### **Android**
1. Use **Chrome browser** (recommended)
2. Grant **microphone permissions** when prompted
3. **Disable battery optimization** for the browser
4. **Close other apps** using microphone

## 🔍 **Quick Diagnostic Steps**

### **Test 1: Check Browser Support**
1. Open browser console (F12)
2. Type: `'webkitSpeechRecognition' in window || 'SpeechRecognition' in window`
3. Should return `true` if supported

### **Test 2: Check Microphone Access**
1. Go to any video call website (Google Meet, Zoom)
2. Try to start a call and test microphone
3. If it works there, the issue is with our app

### **Test 3: Check Permissions**
1. Look for microphone icon in browser address bar
2. Click it to see permission status
3. Reset permissions if needed

## 🆘 **Still Having Issues?**

### **Alternative Options**
1. **Use Text Mode**: Type your prompt ideas instead
2. **Use Image Analysis**: Upload images for prompt generation
3. **Use AI Chat**: Conversational prompt creation

### **Report the Issue**
If voice recording still doesn't work:
1. Note your **browser and version**
2. Note your **operating system**
3. Check browser console for **error messages**
4. Try the **Test Page** (`/test`) for diagnostic information

## 💡 **Pro Tips**

### **For Best Voice Recording Experience**
1. **Use a quiet environment**
2. **Speak at normal pace**
3. **Pause between sentences**
4. **Use the "Apply to Enhancer" button** after transcription
5. **Try different languages** if supported

### **Voice Recording Workflow**
1. **Text Mode** → Quick voice input for simple prompts
2. **Voice Mode** → Full voice-to-prompt workflow
3. **Smart Mode** → Voice + AI analysis for complex projects

---

**🎯 Quick Access**: If you can't find voice recording, look for the green **"Quick Voice Input"** card in Text Mode, or try the **Voice** button in the mode toggle at the top of the AI Studio page.
