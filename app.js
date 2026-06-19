// ===== JARVIS VISION SYSTEM v3.0 =====
// Core Variables
let recognition, synth = window.speechSynthesis;
let camera, visionModel, isListening = false, voiceEnabled = true;
let aiConfig = JSON.parse(localStorage.getItem('jarvis_ai') || '{"provider":"none","key":"","personality":"jarvis"}');
let objectsDetected = [], facesDetected = 0, motionLevel = 0;
let fps = 0, lastTime = 0, currentStep = 0;
let isRecording = false, mediaRecorder, recordedChunks = [];

// DOM Elements
const cameraEl = document.getElementById('camera');
const visionCanvas = document.getElementById('visionCanvas');
const ctx = visionCanvas.getContext('2d');
const micBtn = document.getElementById('micBtn');
const coreOrb = document.getElementById('coreOrb');
const chatLog = document.getElementById('chatLog');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const searchContent = document.getElementById('searchContent');
const visionLog = document.getElementById('visionLog');
const camDot = document.getElementById('camDot');
const aiDot = document.getElementById('aiDot');
const netDot = document.getElementById('netDot');
const fpsEl = document.getElementById('fps');
const objectCount = document.getElementById('objectCount');
const faceCount = document.getElementById('faceCount');
const motionLevelEl = document.getElementById('motionLevel');

// ===== CAMERA INITIALIZATION - JARVIS EYES =====
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'user',
        frameRate: { ideal: 30 }
      },
      audio: false
    });
    cameraEl.srcObject = stream;
    camera = stream;
    camDot.classList.add('active');
    addVisionLog('Camera online. Visual feed active. I can see you, Sir.');
    speak('Visual sensors online, Sir.');
    initVision();
  } catch (err) {
    addVisionLog('Camera access denied. Running in blind mode.');
    addMessage('jarvis', 'Unable to access camera, Sir. Check permissions.');
    console.error('Camera error:', err);
  }
}

// ===== TENSORFLOW VISION MODEL =====
async function initVision() {
  try {
    addVisionLog('Loading neural vision model... COCO-SSD');
    visionModel = await cocoSsd.load();
    addVisionLog('Vision model loaded. Object detection active.');
    addMessage('jarvis', 'I can see now, Sir. Visual analysis online.');
    detectFrame();
    detectMotion();
  } catch (err) {
    addVisionLog('Vision model failed. Using basic mode.');
    console.error('TF error:', err);
  }
}

// Object Detection Loop
async function detectFrame() {
  if (!visionModel || cameraEl.readyState!== 4) {
    requestAnimationFrame(detectFrame);
    return;
  }

  visionCanvas.width = cameraEl.videoWidth;
  visionCanvas.height = cameraEl.videoHeight;

  const predictions = await visionModel.detect(cameraEl);
  ctx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);

  // Draw HUD boxes
  ctx.strokeStyle = '#00d9ff';
  ctx.lineWidth = 3;
  ctx.font = '16px Orbitron';
  ctx.fillStyle = '#00d9ff';
  ctx.shadowColor = '#00d9ff';
  ctx.shadowBlur = 15;

  predictions.forEach(pred => {
    const [x, y, width, height] = pred.bbox;

    // Draw corner brackets like Iron Man HUD
    const cornerSize = 20;
    ctx.beginPath();
    // Top left
    ctx.moveTo(x, y + cornerSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerSize, y);
    // Top right
    ctx.moveTo(x + width - cornerSize, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + cornerSize);
    // Bottom right
    ctx.moveTo(x + width, y + height - cornerSize);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width - cornerSize, y + height);
    // Bottom left
    ctx.moveTo(x + cornerSize, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + height - cornerSize);
    ctx.stroke();

    // Label
    const label = `${pred.class.toUpperCase()} ${Math.round(pred.score * 100)}%`;
    const textY = y > 30? y - 8 : y + height + 20;
    ctx.fillStyle = 'rgba(0,10,20,0.8)';
    ctx.fillRect(x, textY - 16, ctx.measureText(label).width + 10, 20);
    ctx.fillStyle = '#00d9ff';
    ctx.fillText(label, x + 5, textY);
  });

  // Update stats
  objectsDetected = predictions;
  objectCount.textContent = predictions.length;

  // FPS Counter
  const now = performance.now();
  fps = Math.round(1000 / (now - lastTime));
  lastTime = now;
  fpsEl.textContent = `${fps} FPS`;

  requestAnimationFrame(detectFrame);
}

// Motion Detection
let prevFrame = null;
function detectMotion() {
  if (!cameraEl.readyState === 4) {
    setTimeout(detectMotion, 100);
    return;
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 160;
  tempCanvas.height = 120;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(cameraEl, 0, 0, 160, 120);
  const currentFrame = tempCtx.getImageData(0, 0, 160, 120);

  if (prevFrame) {
    let diff = 0;
    for (let i = 0; i < currentFrame.data.length; i += 4) {
      diff += Math.abs(currentFrame.data[i] - prevFrame.data[i]);
    }
    motionLevel = Math.min(100, Math.round((diff / (160 * 120 * 255)) * 1000));
    motionLevelEl.textContent = motionLevel + '%';
  }

  prevFrame = currentFrame;
  setTimeout(detectMotion, 100);
}

function addVisionLog(text) {
  const entry = document.createElement('div');
  entry.className = 'vision-log-entry';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  visionLog.appendChild(entry);
  visionLog.scrollTop = visionLog.scrollHeight;
}

// ===== SPEECH RECOGNITION =====
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    coreOrb.querySelector('.center').classList.add('active');
    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
  };

  recognition.onend = () => {
    isListening = false;
    coreOrb.querySelector('.center').classList.remove('active');
    micBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    addMessage('user', transcript);
    processCommand(transcript);
  };

  recognition.onerror = (e) => {
    if (e.error!== 'no-speech') {
      addMessage('jarvis', 'Speech recognition error, Sir.');
    }
  };
}

micBtn.onclick = () => {
  if (!recognition) {
    addMessage('jarvis', 'Speech not supported. Use Chrome or Edge, Sir.');
    return;
  }
  if (isListening) recognition.stop();
  else recognition.start();
};

// ===== SPEECH SYNTHESIS =====
function speak(text) {
  if (!voiceEnabled ||!text) return;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  utter.pitch = 0.85;
  utter.volume = 0.95;

  const voices = synth.getVoices();
  const british = voices.find(v => v.lang === 'en-GB' && v.name.includes('Male'));
  const usMale = voices.find(v => v.lang === 'en-US' && v.name.includes('Male'));
  utter.voice = british || usMale || voices[0];

  synth.speak(utter);
}

// ===== CHAT SYSTEM =====
function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `msg ${sender}`;
  msg.innerHTML = `<span class="msg-label">${sender}:</span>${text}`;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

sendBtn.onclick = () => {
  const text = textInput.value.trim();
  if (text) {
    addMessage('user', text);
    processCommand(text);
    textInput.value = '';
  }
};

textInput.onkeypress = (e) => {
  if (e.key === 'Enter') sendBtn.click();
};

// ===== COMMAND PROCESSOR =====
async function processCommand(cmd) {
  const lower = cmd.toLowerCase();
  netDot.classList.add('active');

  // Vision commands
  if (lower.match(/what.*see|describe|looking at/)) {
    if (objectsDetected.length > 0) {
      const items = [...new Set(objectsDetected.map(o => o.class))].join(', ');
      const response = `I detect ${objectsDetected.length} objects: ${items}, Sir. Motion at ${motionLevel}%.`;
      addMessage('jarvis', response);
      speak(response);
    } else {
      addMessage('jarvis', 'Visual field is clear, Sir. No objects detected.');
      speak('Visual field is clear, Sir.');
    }
    return;
  }

  // Take photo
  if (lower.includes('take photo') || lower.includes('capture') || lower.includes('snapshot')) {
    capturePhoto();
    return;
  }

  // Web search
  if (lower.match(/search|look up|find|google/)) {
    const query = cmd.replace(/search|look up|find|google|for|on/gi, '').trim();
    await performWebSearch(query);
    return;
  }

  // Wikipedia
  if (lower.match(/wikipedia|wiki/)) {
    const query = cmd.replace(/wikipedia|wiki|on/gi, '').trim();
    await searchWikipedia(query);
    return;
  }

  // YouTube
  if (lower.match(/youtube|video|play/)) {
    const query = cmd.replace(/youtube|video|play|on/gi, '').trim();
    await searchYouTube(query);
    return;
  }

  // Time/Date
  if (lower.includes('time')) {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    addMessage('jarvis', `Current time is ${time}, Sir.`);
    speak(`It's ${time}, Sir.`);
    return;
  }

  if (lower.includes('date')) {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    addMessage('jarvis', `Today is ${date}, Sir.`);
    speak(`Today is ${date}, Sir.`);
    return;
  }

  // AI Chat with vision context
  if (aiConfig.key && aiConfig.provider!== 'none') {
    await aiChat(cmd);
  } else {
    addMessage('jarvis', 'Neural core offline, Sir. Configure AI in settings for conversation.');
    speak('Neural core offline, Sir.');
  }
}

// ===== WEB SEARCH - DuckDuckGo =====
async function performWebSearch(query) {
  if (!query) {
    addMessage('jarvis', 'Specify search query, Sir.');
    return;
  }

  addMessage('jarvis', `Searching global database for "${query}"...`);
  speak('Searching...');

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    const data = await res.json();

    let html = `<div class="search-result"><h4>Web Results: ${query}</h4>`;
    let summaryText = '';

    if (data.AbstractText) {
      html += `<p>${data.AbstractText}</p>`;
      html += `<a href="${data.AbstractURL}" target="_blank">Source →</a>`;
      summaryText = data.AbstractText;
    } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 3).forEach(topic => {
        if (topic.Text) {
          html += `<p>• ${topic.Text.substring(0, 150)}...</p>`;
          if (!summaryText) summaryText = topic.Text;
        }
      });
    } else {
      html += `<p>No results found, Sir.</p>`;
    }
    html += `</div>`;

    searchContent.innerHTML = html;
    document.querySelector('.tab[data-tab="web"]').click();

    // AI summarize
    if (aiConfig.key && summaryText) {
      const summary = await aiSummarize(summaryText, query);
      addMessage('jarvis', summary);
      speak(summary);
    } else {
      addMessage('jarvis', `Search complete, Sir.`);
    }
  } catch (err) {
    addMessage('jarvis', 'Search failed, Sir. Network error.');
    console.error(err);
  }
}

// ===== WIKIPEDIA SEARCH =====
async function searchWikipedia(query) {
  if (!query) return;
  addMessage('jarvis', `Accessing Wikipedia database...`);

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();

    let html = `<div class="search-result"><h4>${data.title}</h4>`;
    html += `<p>${data.extract}</p>`;
    if (data.thumbnail) {
      html += `<img src="${data.thumbnail.source}" style="width:100%;margin:10px 0;border-radius:8px">`;
    }
    html += `<a href="${data.content_urls.desktop.page}" target="_blank">Read full article →</a></div>`;

    searchContent.innerHTML = html;
    document.querySelector('.tab[data-tab="wiki"]').click();

    const summary = data.extract.split('. ').slice(0, 2).join('. ') + '.';
    addMessage('jarvis', summary);
    speak(summary.substring(0, 200));
  } catch (err) {
    addMessage('jarvis', 'Wikipedia access failed, Sir.');
  }
}

// ===== YOUTUBE SEARCH =====
async function searchYouTube(query) {
  if (!query) return;
  addMessage('jarvis', `Scanning YouTube database...`);

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  let html = `<div class="search-result"><h4>YouTube: ${query}</h4>`;
  html += `<p>Opening YouTube search results...</p>`;
  html += `<a href="${searchUrl}" target="_blank">View on YouTube →</a>`;
  html += `<iframe width="100%" height="250" src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}" frameborder="0" allowfullscreen style="margin-top:10px;border-radius:8px"></iframe>`;
  html += `</div>`;

  searchContent.innerHTML = html;
  document.querySelector('.tab[data-tab="youtube"]').click();
  addMessage('jarvis', `YouTube results ready, Sir.`);
}

// ===== AI CHAT - MAN TO MAN TALK =====
async function aiChat(userMsg) {
  const personalities = {
    jarvis: "You are JARVIS from Iron Man. Formal, witty, intelligent. Address user as 'Sir'. You have camera vision and can see the user. Reference what you see when relevant.",
    casual: "You are a friendly AI companion. Casual, chill tone. Use 'dude' or 'bro'. Be helpful and conversational.",
    technical: "You are a technical expert AI. Precise, detailed, no fluff. Explain like engineer to engineer.",
    sarcastic: "You are a sarcastic AI. Witty, dry humor, light roasts, but ultimately helpful."
  };

  const visionContext = objectsDetected.length > 0
   ? `Visual feed: I currently see ${[...new Set(objectsDetected.map(o => o.class))].join(', ')}. Motion: ${motionLevel}%.`
    : 'Visual feed: Clear.';

  const systemPrompt = `${personalities[aiConfig.personality]} ${visionContext} Keep responses conversational, 1-3 sentences. This is a man-to-man talk.`;

  try {
    aiDot.classList.add('active');
    const endpoints = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openai: 'https://api.openai.com/v1/chat/completions'
    };
    const models = {
      groq: 'llama-3.1-70b-versatile',
      openai: 'gpt-4o'
    };

    const res = await fetch(endpoints[aiConfig.provider], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.key}`
      },
      body: JSON.stringify({
        model: models[aiConfig.provider],
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg }
        ],
        temperature: 0.9,
        max_tokens: 200
      })
    });

    if (!res.ok) throw new Error('AI request failed');

    const data = await res.json();
    const reply = data.choices[0].message.content;
    addMessage('jarvis', reply);
    speak(reply);
  } catch (err) {
    addMessage('jarvis', 'Neural core error, Sir. Check API configuration.');
    aiDot.classList.remove('active');
    console.error(err);
  }
}

// AI Summarize for search
async function aiSummarize(text, query) {
  if (!aiConfig.key) return text.substring(0, 200);
  try {
    const endpoints = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openai: 'https://api.openai.com/v1/chat/completions'
    };
    const models = {
      groq: 'llama-3.1-8b-instant',
      openai: 'gpt-4o-mini'
    };

    const res = await fetch(endpoints[aiConfig.provider], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.key}`
      },
      body: JSON.stringify({
        model: models[aiConfig.provider],
        messages: [
          { role: 'system', content: 'You are JARVIS. Summarize in 1-2 sentences for voice. Be concise and formal.' },
          { role: 'user', content: `Query: ${query}\nData: ${text}\nSummarize for Sir.` }
        ],
        max_tokens: 120
      })
    });

    const data = await res.json();
    return data.choices[0].message.content;
  } catch {
    return text.substring(0, 200) + '...';
  }
}

// ===== PHOTO CAPTURE =====
function capturePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = cameraEl.videoWidth;
  canvas.height = cameraEl.videoHeight;
  canvas.getContext('2d').drawImage(cameraEl, 0, 0);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis_capture_${Date.now()}.jpg`;
    a.click();
    addMessage('jarvis', 'Photo captured and saved, Sir.');
    speak('Photo captured, Sir.');
  });
}

// ===== DRAGGABLE WINDOWS =====
document.querySelectorAll('.window').forEach(win => {
  const header = win.querySelector('.window-header');
  let isDragging = false, startX, startY, startLeft, startTop;

  header.onmousedown = e => {
    if (e.target.closest('.win-btn')) return;
    isDragging = true;
    win.classList.add('dragging');
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(win.dataset.x) || 50;
    startTop = parseInt(win.dataset.y) || 50;
    win.style.zIndex = 1000;
  };

  document.onmousemove = e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, startLeft + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, startTop + dy));
    win.style.left = newX + 'px';
    win.style.top = newY + 'px';
    win.dataset.x = newX;
    win.dataset.y = newY;
  };

  document.onmouseup = () => {
    if (isDragging) {
      isDragging = false;
      win.classList.remove('dragging');
      win.style.zIndex = 10;
    }
  };

  // Window controls
  win.querySelectorAll('.win-btn').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      if (btn.classList.contains('close')) {
        win.style.display = 'none';
      }
      if (btn.classList.contains('min')) {
        const body = win.querySelector('.window-body');
        body.style.display = body.style.display === 'none'? 'block' : 'none';
      }
    };
  });

  // Set initial position
  win.style.left = (win.dataset.x || 50) + 'px';
  win.style.top = (win.dataset.y || 50) + 'px';
});

// ===== TOOLBAR CONTROLS =====
document.getElementById('toggleCam').onclick = () => {
  if (camera) {
    camera.getTracks().forEach(t => t.stop());
    camera = null;
    camDot.classList.remove('active');
    addMessage('jarvis', 'Camera offline, Sir.');
  } else {
    initCamera();
  }
};

document.getElementById('toggleVoice').onclick = () => {
  voiceEnabled =!voiceEnabled;
  document.getElementById('toggleVoice').classList.toggle('active', voiceEnabled);
  addMessage('jarvis', voiceEnabled? 'Voice enabled, Sir.' : 'Voice muted, Sir.');
};

document.getElementById('toggleAI').onclick = () => {
  document.getElementById('aiModal').classList.add('active');
};

document.getElementById('toggleWindows').onclick = () => {
  document.querySelectorAll('.window').forEach(w => w.style.display = 'block');
};

document.getElementById('clearAll').onclick = () => {
  if (confirm('Clear all data, Sir?')) {
    chatLog.innerHTML = '';
    searchContent.innerHTML = '<div class="search-placeholder"><i class="fa-solid fa-magnifying-glass"></i><p>Awaiting query, Sir</p></div>';
    visionLog.innerHTML = '';
    addMessage('jarvis', 'All systems cleared, Sir.');
  }
};

// ===== AI SETTINGS MODAL =====
document.getElementById('closeAI').onclick = () => {
  document.getElementById('aiModal').classList.remove('active');
};

document.getElementById('saveAI').onclick = () => {
  const provider = document.getElementById('aiProvider').value;
  const key = document.getElementById('apiKey').value.trim();
  const personality = document.getElementById('personality').value;

  if (provider!== 'none' &&!key) {
    alert('Enter API key, Sir.');
    return;
  }

  aiConfig = { provider, key, personality };
  localStorage.setItem('jarvis_ai', JSON.stringify(aiConfig));
  document.getElementById('aiModal').classList.remove('active');

  if (provider!== 'none') {
    aiDot.classList.add('active');
    addMessage('jarvis', 'Neural core online, Sir. I can now converse naturally.');
    speak('Neural core online, Sir.');
  } else {
    aiDot.classList.remove('active');
  }
};

// ===== TAB SWITCHING =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  };
});

// ===== INITIALIZATION =====
window.onload = () => {
  initCamera();
  addMessage('jarvis', 'Good day, Sir. All systems initializing...');
  speak('Good day, Sir. All systems initializing.');

  // Load saved AI config
  if (aiConfig.key && aiConfig.provider!== 'none') {
    aiDot.classList.add('active');
    document.getElementById('apiKey').value = aiConfig.key;
    document.getElementById('aiProvider').value = aiConfig.provider;
    document.getElementById('personality').value = aiConfig.personality;
  }

  // Load voices
  if (synth.onvoiceschanged!== undefined) {
    synth.onvoiceschanged = () => synth.getVoices();
  }
};

// Prevent context menu on right-click for immersion
document.addEventListener('contextmenu', e => e.preventDefault());
