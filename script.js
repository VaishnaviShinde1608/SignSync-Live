/*
================================================================
  script.js  –  SignSync Live (Vanilla JS)
  Pure HTML/CSS/JS — no React, no Tailwind, no frameworks.

  SCREENS:
    signin       → Sign In form
    signin-type  → Choose Deaf / Hearing (after sign-in)
    signup       → Create Account form
    forgot       → Forgot Password
    home         → Meeting Dashboard
    video        → Video Call Room
================================================================
*/

'use strict';

/* ============================================================
   SVG ICON HELPER
============================================================ */
const ICONS = {
  video:      `<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>`,
  videoOff:   `<line x1="1" y1="1" x2="23" y2="23"/><path d="M17 17H3a2 2 0 01-2-2V7m3.5-3.5L21 21"/>`,
  mic:        `<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>`,
  micOff:     `<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>`,
  phone:      `<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.09 2.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.35a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>`,
  eye:        `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  eyeOff:     `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`,
  arrowRight: `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
  arrowLeft:  `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`,
  mail:       `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`,
  send:       `<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`,
  user:       `<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  users:      `<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>`,
  plus:       `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  logout:     `<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
  sparkles:   `<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>`,
  zap:        `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  check:      `<polyline points="20 6 9 17 4 12"/>`,
  hand:       `<path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"/>`,
  ear:        `<path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>`,
  msgSq:      `<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>`,
  vol2:       `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/>`,
};

function icon(name, size, color) {
  size  = size  || 20;
  color = color || 'currentColor';
  return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" stroke="' + color + '" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

/* ============================================================
   APP STATE
============================================================ */
var App = {
  user:          null,   
  pendingEmail:  '',     
  roomId:        '',     
  localStream:   null,   
  remoteStream:  null,   
  micEnabled:    true,
  cameraEnabled: true,
  callStatus:    'waiting',
  peerConn:      null,
  socket:        null,   
};

var ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

/* ============================================================
   NAVIGATION SYSTEM
============================================================ */
function navigate(screen) {
  document.querySelectorAll('.screen').forEach(function(el) {
    el.classList.remove('active');
  });

  var target = document.getElementById('screen-' + screen);
  if (target) target.classList.add('active');

  if (screen === 'signin')      initSignIn();
  if (screen === 'signin-type') initSigninType();
  if (screen === 'signup')      initSignUp();
  if (screen === 'forgot')      initForgot();
  if (screen === 'home')        initHome();
  if (screen === 'video')       initVideo();
}

/* ============================================================
   VALIDATION & DOM HELPERS
============================================================ */
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isStrongPassword(v) { return /^[A-Z](?=.*\d)(?=.*[@$!%*?&]).{7,}$/.test(v); }

function showErr(wrapperId, msg) {
  var wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  var err = wrap.querySelector('.err-msg');
  if (!err) {
    err = document.createElement('p');
    err.className = 'err-msg';
    wrap.appendChild(err);
  }
  err.textContent = msg;
}

function clearErr(wrapperId) {
  var wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  var err = wrap.querySelector('.err-msg');
  if (err) err.textContent = '';
}

function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }

function onClick(id, handler) {
  var el = document.getElementById(id);
  if (!el) return;
  var clone = el.cloneNode(true);
  el.parentNode.replaceChild(clone, el);
  document.getElementById(id).addEventListener('click', handler);
}

function resetForm(formId) {
  var old = document.getElementById(formId);
  if (!old) return null;
  var fresh = old.cloneNode(true);
  old.parentNode.replaceChild(fresh, old);
  return document.getElementById(formId);
}

function setupPwToggle(eyeId, inputId) {
  var eye   = document.getElementById(eyeId);
  var input = document.getElementById(inputId);
  if (!eye || !input) return;
  eye.addEventListener('click', function() {
    var showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    this.innerHTML = icon(showing ? 'eye' : 'eyeOff', 18);
  });
}

function resetTypeCards(prefix) {
  var formId = prefix === 'ut' ? 'ut-form' : 'su-form';
  var form   = document.getElementById(formId);
  if (form) form.dataset.selected = '';
  ['deaf', 'hearing'].forEach(function(type) {
    var card  = document.getElementById(prefix + '-' + type);
    var check = document.getElementById(prefix + '-' + type + '-check');
    if (card)  { card.classList.remove('active-deaf', 'active-hearing'); }
    if (check) { check.style.display = 'none'; }
  });
}

function selectType(prefix, type) {
  resetTypeCards(prefix);
  var formId = prefix === 'ut' ? 'ut-form' : 'su-form';
  var form   = document.getElementById(formId);
  if (form) form.dataset.selected = type;
  var card  = document.getElementById(prefix + '-' + type);
  var check = document.getElementById(prefix + '-' + type + '-check');
  if (card)  { card.classList.add(type === 'deaf' ? 'active-deaf' : 'active-hearing'); }
  if (check) { check.style.display = 'flex'; }
}

/* ============================================================
   SCREENS SCHEDULING INTERFACES
============================================================ */
function initSignIn() {
  clearErr('signin-email-wrap'); clearErr('signin-pw-wrap');
  var form = resetForm('signin-form'); if (!form) return;
  setupPwToggle('signin-pw-eye', 'signin-pw');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var email = document.getElementById('signin-email').value.trim();
    var pw    = document.getElementById('signin-pw').value;
    if (isValidEmail(email) && isStrongPassword(pw)) {
      App.pendingEmail = email; navigate('signin-type');
    } else {
      if (!isValidEmail(email)) showErr('signin-email-wrap', 'Please enter a valid email address.');
      if (!isStrongPassword(pw)) showErr('signin-pw-wrap', 'Weak password structure applied.');
    }
  });
}

function initSigninType() {
  resetTypeCards('ut');
  onClick('ut-deaf',    function() { selectType('ut', 'deaf');    });
  onClick('ut-hearing', function() { selectType('ut', 'hearing'); });
  onClick('ut-continue', function() {
    var type = document.getElementById('ut-form').dataset.selected;
    if (!type) return;
    App.user = { email: App.pendingEmail, name: App.pendingEmail.split('@')[0], userType: type };
    navigate('home');
  });
}

function initSignUp() {
  resetTypeCards('su'); setText('su-error', '');
  var form = resetForm('signup-form'); if (!form) return;
  setupPwToggle('su-pw-eye', 'su-pw');
  onClick('su-deaf',    function() { selectType('su', 'deaf');    });
  onClick('su-hearing', function() { selectType('su', 'hearing'); });
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var type = document.getElementById('su-form').dataset.selected;
    var name = document.getElementById('su-name').value.trim();
    var email = document.getElementById('su-email').value.trim();
    var pw = document.getElementById('su-pw').value;
    if (!type || name.length < 3 || !isValidEmail(email) || !isStrongPassword(pw)) {
      setText('su-error', 'Please completely validate the fields.'); return;
    }
    App.user = { name: name, email: email, userType: type }; navigate('home');
  });
}

function initForgot() {
  var form = resetForm('forgot-form'); if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    document.getElementById('forgot-wrapper').style.display = 'none';
    document.getElementById('forgot-success').style.display = 'block';
    setTimeout(function() { navigate('signin'); }, 2000);
  });
}

function initHome() {
  if (!App.user) { navigate('signin'); return; }
  var isDeaf = App.user.userType === 'deaf';
  setText('home-username', 'Hello, ' + App.user.name);
  setText('home-userbadge', isDeaf ? 'Sign Language' : 'Hearing');
  document.getElementById('home-userbadge').className = 'badge ' + (isDeaf ? 'badge-blue' : 'badge-teal');
  setText('home-hero-desc', isDeaf ? 'Your signs will be translated to speech in real-time.' : 'Speech will appear as text for sign language users.');
  
  var roomInput = document.getElementById('home-room-input');
  if (roomInput) {
    roomInput.value = '';
    var newInput = roomInput.cloneNode(true);
    roomInput.parentNode.replaceChild(newInput, roomInput);
    document.getElementById('home-room-input').addEventListener('keydown', function(e) { if (e.key === 'Enter') joinRoom(); });
  }
  onClick('btn-join-room', joinRoom);
  onClick('btn-new-room',  startNewRoom);
  onClick('btn-sign-out',  signOut);
}

function joinRoom() {
  var id = document.getElementById('home-room-input').value.trim();
  if (!id) return; App.roomId = id; navigate('video');
}
function startNewRoom() { App.roomId = 'room-' + Date.now().toString().slice(-6); navigate('video'); }
function signOut() { stopStream(); App.user = null; App.roomId = ''; navigate('signin'); }

/* ============================================================
   SCREEN: VIDEO CALIBRATION SETUP
============================================================ */
function initVideo() {
  if (!App.user) { navigate('signin'); return; }
  var isDeaf = App.user.userType === 'deaf';

  setText('video-room-id',  'Room: ' + App.roomId);
  setText('video-nav-user', App.user.name);

  var typeBadge = document.getElementById('video-type-badge');
  if (typeBadge) {
    typeBadge.textContent = isDeaf ? 'Sign Language' : 'Hearing';
    typeBadge.style.background = isDeaf ? 'rgba(37,99,235,0.2)' : 'rgba(20,184,166,0.2)';
    typeBadge.style.color = isDeaf ? '#93c5fd' : '#5eead4';
  }

  setText('video-overlay-title', isDeaf ? 'Sign Translation' : 'Speech Recognition');
  setText('video-overlay-box',   isDeaf ? 'Waiting for signs…' : 'Listening to voice…');
  var overlayBox = document.getElementById('video-overlay-box');
  if (overlayBox) {
    overlayBox.style.borderColor = isDeaf ? '#4f46e5' : '#0d9488';
    overlayBox.style.background = isDeaf ? 'rgba(79,70,229,0.08)' : 'rgba(13,148,136,0.08)';
  }

  App.callStatus = 'waiting'; updateStatus(); updateControls();
  onClick('ctrl-mic', toggleMic); onClick('ctrl-camera', toggleCamera);
  onClick('ctrl-leave', leaveCall); onClick('video-back', leaveCall);

  startStream();
}

function updateStatus() {
  var dot = document.getElementById('video-status-dot');
  var label = document.getElementById('video-status-label');
  if (!dot || !label) return;
  var color = App.callStatus === 'two-sided' ? '#14b8a6' : '#f59e0b';
  dot.style.background = color;
  label.textContent = App.callStatus === 'two-sided' ? 'Both Connected' : 'Waiting for others';
}

function updateControls() {
  var micBtn = document.getElementById('ctrl-mic');
  var camBtn = document.getElementById('ctrl-camera');
  if (micBtn) micBtn.innerHTML = icon(App.micEnabled ? 'mic' : 'micOff', 20, App.micEnabled ? '#2563eb' : '#dc2626');
  if (camBtn) camBtn.innerHTML = icon(App.cameraEnabled ? 'video' : 'videoOff', 20, App.cameraEnabled ? '#2563eb' : '#dc2626');
}

function toggleMic() { if (App.localStream) { App.micEnabled = !App.micEnabled; App.localStream.getAudioTracks()[0].enabled = App.micEnabled; updateControls(); } }
function toggleCamera() { if (App.localStream) { App.cameraEnabled = !App.cameraEnabled; App.localStream.getVideoTracks()[0].enabled = App.cameraEnabled; updateControls(); } }

/* ============================================================
   WEBRTC PLATFORM INFRASTRUCTURE
============================================================ */
async function startStream() {
  try {
    var stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: true,
    });

    App.localStream = stream; App.micEnabled = true; App.cameraEnabled = true;
    var vid = document.getElementById('local-video');
    if (vid) {
      vid.srcObject = stream;
      vid.onloadedmetadata = function() {
        if (App.user && App.user.userType === 'deaf') {
          startAI(vid);
        } else if (App.user && App.user.userType === 'hearing') {
          startSpeechRecognition(); 
        }
      };
    }

    setupPeerConnection(stream);
    App.callStatus = 'one-sided'; updateStatus(); updateControls();

    // Small delay before joining room to let browser peer setup finish cleanly
    setTimeout(joinSignalingRoom, 500);

  } catch (err) {
    console.warn('[SignSync] Hardware configuration blocked:', err.message);
  }
}

function stopStream() {
  stopAI(); stopSpeechRecognition();
  if (App.localStream) { App.localStream.getTracks().forEach(t => t.stop()); App.localStream = null; }
  if (App.remoteStream) { App.remoteStream.getTracks().forEach(t => t.stop()); App.remoteStream = null; }
  if (App.peerConn) { App.peerConn.close(); App.peerConn = null; }
}

function setupPeerConnection(stream) {
  if (App.peerConn) App.peerConn.close();
  var pc = new RTCPeerConnection(ICE_CONFIG); App.peerConn = pc;
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.ontrack = function(event) {
    App.remoteStream = event.streams[0];
    var remVid = document.getElementById('remote-video');
    if (remVid) { remVid.srcObject = event.streams[0]; remVid.style.display = 'block'; }
    document.getElementById('remote-placeholder').style.display = 'none';
    App.callStatus = 'two-sided'; updateStatus();
  };

  pc.onicecandidate = function(event) {
    if (event.candidate && App.socket) {
      App.socket.emit('ice-candidate', { candidate: event.candidate, roomId: App.roomId });
    }
  };
}

async function createOffer() { var offer = await App.peerConn.createOffer(); await App.peerConn.setLocalDescription(offer); return offer; }
async function createAnswer(offer) { await App.peerConn.setRemoteDescription(new RTCSessionDescription(offer)); var ans = await App.peerConn.createAnswer(); await App.peerConn.setLocalDescription(ans); return ans; }
async function handleAnswer(answer) { await App.peerConn.setRemoteDescription(new RTCSessionDescription(answer)); }
async function addICECandidate(cand) { await App.peerConn.addIceCandidate(new RTCIceCandidate(cand)); }

/* ============================================================
   SIGN LANGUAGE AI DETECTION ENGINE (DEAF SIDE)
============================================================ */
var aiIntervalId = null, aiSending = false, detectedSentence = '', lastLetter = '', sameCount = 0;
var SAME_THRESHOLD = 1; // 🚀 CHANGED TO 1 FOR INSTANT SPEED DEMO TYPING
var mpHands = null, mpCamera = null, latestHandLandmarks = null;

function startHandTracking(videoElement) {
  var canvas = document.getElementById('local-canvas'); if (!canvas) return;
  var ctx = canvas.getContext('2d');
  mpHands = new Hands({ locateFile: file => 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file });
  mpHands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
  
  mpHands.onResults(function(results) {
    canvas.width = results.image.width; canvas.height = results.image.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      latestHandLandmarks = results.multiHandLandmarks[0];
      drawConnectors(ctx, latestHandLandmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
      drawLandmarks(ctx, latestHandLandmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
    } else { latestHandLandmarks = null; }
  });

  mpCamera = new Camera(videoElement, { onFrame: async () => { await mpHands.send({ image: videoElement }); }, width: 640, height: 480 });
  mpCamera.start();
}

function startAI(videoElement) {
  if (aiIntervalId) clearInterval(aiIntervalId);
  startHandTracking(videoElement);

  aiIntervalId = setInterval(async function() {
    if (!App.cameraEnabled || aiSending || !latestHandLandmarks) return;
    var landmarkArray = latestHandLandmarks.map(lm => [lm.x, lm.y, lm.z]);
    aiSending = true;
    try {
      var res = await fetch('http://127.0.0.1:5000/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ landmarks: landmarkArray }) });
      var data = await res.json(), letter = data.letter || '', confidence = data.confidence || 0;

      if (letter && confidence > 0.5) {
        if (letter === lastLetter) sameCount++; else { sameCount = 1; lastLetter = letter; }
        if (sameCount === SAME_THRESHOLD) {
          if (letter === 'SPACE') detectedSentence += ' ';
          else if (letter === 'DEL') detectedSentence = detectedSentence.slice(0, -1);
          else detectedSentence += letter;

          // 🚀 EMIT DEAF SIGN OUT TO HEARING USER OVER THE DATA CHANNEL INSTANTLY
          if (App.socket && App.roomId) {
            App.socket.emit('send-letter', { roomId: App.roomId, letter: letter, sentence: detectedSentence });
          }
        }
      }

      // Display what I sign on my OWN screen overlay box to track accuracy
      var overlayBox = document.getElementById('video-overlay-box');
      if (overlayBox && letter && confidence > 0.5) {
        overlayBox.textContent = letter + ' (' + Math.round(confidence * 100) + '%)';
      }
    } catch (err) {}
    aiSending = false;
  }, 400);
}

function stopAI() {
  if (aiIntervalId) { clearInterval(aiIntervalId); aiIntervalId = null; }
  if (mpCamera) { mpCamera.stop(); mpCamera = null; }
  if (mpHands)  { mpHands.close(); mpHands  = null; }
  detectedSentence = ''; lastLetter = ''; sameCount = 0;
}

/* ============================================================
   SPEECH RECOGNITION PIPELINE (HEARING SIDE)
============================================================ */
var recognition = null;

function startSpeechRecognition() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("[SignSync] Browser speech platform offline."); return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = function() {
    console.log("[SignSync] 🎙️ Microphone voice listener online.");
    var box = document.getElementById('video-overlay-box');
    if (box) box.textContent = "Speaking... Voice capture active.";
  };

  recognition.onresult = function(event) {
    var interimTranscript = ''; var finalTranscript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      else interimTranscript += event.results[i][0].transcript;
    }
    var liveText = finalTranscript || interimTranscript;

    // Display what I speak on my OWN video box container so I can see it track
    var box = document.getElementById('video-overlay-box');
    if (box) box.textContent = liveText;

    // 🚀 TRANSMIT VOICE CONTEXT ACROSS THE NETWORK ROOM DIRECTLY TO DEAF CLIENT
    if (App.socket && App.roomId && liveText.trim() !== "") {
      App.socket.emit('send-letter', {
        roomId:   App.roomId,
        letter:   '', 
        sentence: liveText
      });
    }
  };

  recognition.onend = function() {
    if (App.roomId && App.user && App.user.userType === 'hearing') {
      try { recognition.start(); } catch(e) {}
    }
  };

  try { recognition.start(); } catch (err) {}
}

function stopSpeechRecognition() {
  if (recognition) { try { recognition.stop(); } catch(e) {} recognition = null; }
}

/* ============================================================
   NETWORK SOCKET SIGNALING SYSTEM
============================================================ */
function initSignaling() {
  App.socket = io('http://localhost:3000');

  App.socket.on('connect', function() { console.log('[SignSync] Network channel active:', App.socket.id); });
  App.socket.on('room-joined', function(data) { if (data.peerCount === 1) { App.callStatus = 'one-sided'; updateStatus(); } });
  App.socket.on('start-call', function(data) { createAndSendOffer(data.roomId); });
  App.socket.on('offer', async function(data) { var ans = await createAnswer(data.offer); App.socket.emit('answer', { answer: ans, roomId: App.roomId }); });
  App.socket.on('answer', async function(data) { await handleAnswer(data.answer); });
  App.socket.on('ice-candidate', async function(data) { await addICECandidate(data.candidate); });

  // 🚀 FIXED: CROSS-ROUTING DATA DELAY RESOLUTION
  App.socket.on('receive-letter', function(data) {
    var letter   = data.letter   || '';
    var sentence = data.sentence || '';
    
    var isDeaf = App.user && App.user.userType === 'deaf';

    // 1. IF I AM DEAF: Render what the Hearing person is SPEAKING inside my output tray
    if (isDeaf) {
      var output = document.getElementById('translation-output');
      if (output) {
        output.innerHTML = sentence
          ? '<div style="font-size:1.1rem; font-weight:600; color:#e2e8f0;">' + icon('vol2', 15, '#14b8a6') + '&nbsp;Hearing Partner: "' + sentence + '"</div>'
          : '<div style="color:#64748b;">Waiting for partner to speak…</div>';
      }
      var overlayBox = document.getElementById('video-overlay-box');
      if (overlayBox && sentence) overlayBox.textContent = sentence;
    } 
    
    // 2. IF I AM HEARING: Render what the Deaf person is SIGNING inside my output tray
    else {
      var output = document.getElementById('translation-output');
      if (output) {
        output.innerHTML = sentence
          ? '<div style="font-size:1.1rem; font-weight:600; color:#e2e8f0;">' + icon('hand', 15, '#818cf8') + '&nbsp;Deaf Partner signed: ' + sentence + '</div>'
          : '<div style="color:#64748b;">Waiting for partner to sign…</div>';
      }
      var overlayBox = document.getElementById('video-overlay-box');
      if (overlayBox) {
        overlayBox.textContent = sentence || letter;
      }
    }
  });

  App.socket.on('peer-disconnected', function() {
    App.callStatus = 'one-sided'; updateStatus();
    var remVid = document.getElementById('remote-video'); if (remVid) { remVid.srcObject = null; remVid.style.display = 'none'; }
    document.getElementById('remote-placeholder').style.display = 'flex';
  });
}

function joinSignalingRoom() { if (App.socket && App.roomId) App.socket.emit('join-room', { roomId: App.roomId }); }
async function createAndSendOffer(roomId) { var off = await createOffer(); if (off) App.socket.emit('offer', { offer: off, roomId: roomId }); }

function leaveCall() {
  if (App.socket && App.roomId) App.socket.emit('leave-room', { roomId: App.roomId });
  stopStream(); App.roomId = ''; App.callStatus = 'waiting'; navigate(App.user ? 'home' : 'signin');
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', function() { navigate('signin'); initSignaling(); });