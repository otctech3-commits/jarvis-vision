# jarvis-vision
MAIN WEB : https://mk-bots.blogspot.com/2026/05/mk-bots.html
# 👁️ J.A.R.V.I.S Vision System

Iron Man style AI with camera eyes, web search, Wikipedia, YouTube, and man-to-man AI chat.

**Live Demo:** https://yourusername.github.io/jarvis-vision/

## ✨ Features

- **Camera Vision** - Real-time object detection via TensorFlow.js
- **Web Search** - DuckDuckGo integration
- **Wikipedia** - Instant article summaries
- **YouTube** - Video search and embed
- **AI Chat** - Groq/OpenAI powered conversation
- **Voice Control** - Speech recognition + synthesis
- **Floating HUD** - Draggable windows like Iron Man
- **Motion Detection** - Track movement in frame
- **Photo Capture** - Save snapshots
- **100% Client-Side** - No backend, GitHub Pages ready

## 🚀 Deploy to GitHub Pages

1. Fork this repo
2. Settings → Pages → Source: main → Save
3. Visit `https://yourusername.github.io/jarvis-vision/`
4. Grant camera permission
5. Configure AI key in settings (optional)

## 🎤 Voice Commands

- "What do you see?" - Object detection report
- "Search for [topic]" - Web search
- "Wikipedia [topic]" - Wiki article
- "YouTube [topic]" - Video search
- "Take photo" - Capture frame
- "What time is it?" - Current time
- Natural conversation if AI configured

## 🧠 AI Setup (Optional)

1. Get free API key: https://console.groq.com/keys
2. Click brain icon in toolbar
3. Select Groq, paste key
4. Choose personality
5. Activate

**Personalities:**
- JARVIS - Formal, witty, "Sir"
- Casual - Chill friend vibe
- Technical - Engineer mode
- Sarcastic - Roast mode

## 📱 Controls

- **Mic Button** - Voice input
- **Camera Icon** - Toggle camera
- **Brain Icon** - AI settings
- **Volume Icon** - Toggle voice
- **Windows Icon** - Show all windows
- **Trash Icon** - Clear all

**Drag windows** by their headers to arrange HUD.

## 🔧 Tech Stack

- **TensorFlow.js** - Object detection (COCO-SSD)
- **Web Speech API** - Voice I/O
- **MediaDevices API** - Camera access
- **Groq API** - Fast LLM inference
- **DuckDuckGo API** - Web search
- **Wikipedia API** - Article data
- **Vanilla JS** - No frameworks

## 🎯 Browser Support

- Chrome/Edge - Full support
- Firefox - Full support
- Safari - Full support (iOS 14.5+)
- Mobile - Works with camera

## 📜 License

MIT - Build your own Jarvis

## ⚠️ Privacy

- Camera feed stays in browser
- No data sent to servers except API calls
- AI key stored in localStorage only
- Object detection runs locally via TensorFlow.js

---

**"Sometimes you gotta run before you can walk." - Tony Stark**

Built with 🤍 for the future
