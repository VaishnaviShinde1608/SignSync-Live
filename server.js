/*
================================================================
  server.js  –  SignSync Live · Week 5 Signaling Server
  Runtime:  Node.js
  Packages: express, socket.io, cors

  WHAT THIS FILE DOES (for your presentation):
  ─────────────────────────────────────────────
  WebRTC lets two browsers talk DIRECTLY to each other (peer-to-peer),
  but before that direct line is open, they need a "matchmaker" to
  pass three types of messages back and forth:

    1. OFFER      — Peer A says "here is what I can stream"
    2. ANSWER     — Peer B says "OK, I accept, here is what I can stream"
    3. ICE CANDIDATE — Both sides share network path info (IP/port) so
                       they can find the fastest route to each other

  This Node.js server is that matchmaker. It does NOT touch any audio
  or video — it only forwards those three small text messages between
  the two browsers using Socket.io's room system.

  Once both browsers have exchanged those messages, the server is
  completely out of the loop. All future video/audio flows directly
  peer-to-peer (or via Google's STUN/TURN servers for NAT traversal).

  HOW TO RUN:
  ─────────────────────────────────────────────
  1.  npm install          (first time only)
  2.  node server.js       (start the server)
  3.  Open http://localhost:3000 in TWO browser tabs/windows
  4.  Both tabs must enter the SAME Room ID

  FILE STRUCTURE:
  ─────────────────────────────────────────────
  your-project/
  ├── server.js          ← you are here
  ├── package.json       ← created by npm init
  ├── index.html
  ├── script.js
  ├── style.css
  └── my_model/
      ├── model.json
      └── *.bin
================================================================
*/

'use strict';

/* ============================================================
   DEPENDENCIES
============================================================ */

// express — lightweight HTTP server so we can serve our HTML files
// and also host the Socket.io upgrade endpoint
const express = require('express');

// http — Node's built-in HTTP module; we wrap express with it so
// Socket.io can attach to the same port (3000) as the web server
const http = require('http');

// socket.io — real-time bidirectional event-based communication.
// The browser connects with the socket.io-client script loaded in
// index.html; this is the matching server-side counterpart.
const { Server } = require('socket.io');

// path — Node.js built-in, used to build file paths safely across
// different operating systems (Windows vs Mac/Linux)
const path = require('path');


/* ============================================================
   SERVER SETUP
============================================================ */

const app    = express();                    // create Express app
const server = http.createServer(app);       // wrap it in an HTTP server

// Attach Socket.io to the HTTP server.
// cors: '*' allows connections from any origin — fine for local dev.
// For production you would restrict this to your actual domain.
const io = new Server(server, {
  cors: {
    origin: '*',              // allow all origins during development
    methods: ['GET', 'POST'],
  }
});

// Serve every file in the project folder as a static file.
// This means:  http://localhost:3000/          → index.html
//              http://localhost:3000/script.js → script.js
//              http://localhost:3000/my_model/ → your TF.js model files
// You do NOT need a separate Live Server extension when server.js is running.
app.use(express.static(path.join(__dirname)));

// Fallback route: any unrecognised URL serves index.html.
// This lets the single-page app handle its own navigation.
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});


/* ============================================================
   ROOM TRACKING
   ─────────────────────────────────────────────────────────────
   We track which socket IDs are in each room so we can:
     • Reject a third person trying to join an occupied room
     • Know who to forward messages to

   Structure:
     rooms = {
       'room-123456': [ 'socketId_A', 'socketId_B' ],
       'room-789012': [ 'socketId_C' ],
     }
============================================================ */
const rooms = {};


/* ============================================================
   SOCKET.IO EVENT HANDLERS
   ─────────────────────────────────────────────────────────────
   Every time a browser opens the app, Socket.io fires a
   'connection' event and gives us a unique 'socket' object
   for that specific browser tab.
============================================================ */
io.on('connection', function(socket) {

  // Log every new browser connection so you can watch in your terminal
  console.log('[SignSync] 🔌 New connection:', socket.id);


  /* ----------------------------------------------------------
     EVENT: join-room
     ──────────────────────────────────────────────────────────
     Fired when a user clicks "Join" or "Start Meeting" in the
     SignSync UI.  The browser sends:
       { roomId: 'room-123456' }

     What we do:
       1. Create the room entry if it doesn't exist
       2. Reject if the room already has 2 people
       3. Add this socket to the room
       4. If this is the SECOND person to join, tell the FIRST
          person to start the WebRTC negotiation (createOffer)
  ---------------------------------------------------------- */
  socket.on('join-room', function(data) {
    var roomId = data.roomId;

    // Create the room array if this is the very first person
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // Reject a third person — WebRTC is peer-to-peer (2 people max)
    if (rooms[roomId].length >= 2) {
      socket.emit('room-full', { roomId: roomId });
      console.log('[SignSync] 🚫 Room full, rejected:', socket.id, '→', roomId);
      return;
    }

    // Add this person to the room and join the Socket.io room group
    // (Socket.io rooms let us broadcast to everyone in the room easily)
    rooms[roomId].push(socket.id);
    socket.join(roomId);

    // Remember which room this socket is in (used on disconnect)
    socket.roomId = roomId;

    console.log('[SignSync] 🚪 Joined room:', roomId, '| People:', rooms[roomId].length);

    // Tell the browser how many people are now in the room
    socket.emit('room-joined', {
      roomId:      roomId,
      peerCount:   rooms[roomId].length,
      isInitiator: rooms[roomId].length === 2, // true for the 2nd person
    });

    // If BOTH people are now in the room, tell the FIRST person
    // (the one who joined earlier) to kick off the WebRTC handshake
    // by calling createOffer(). This is the "you go first" signal.
    if (rooms[roomId].length === 2) {
      var firstPersonId = rooms[roomId][0]; // the person who joined first
      io.to(firstPersonId).emit('start-call', { roomId: roomId });
      console.log('[SignSync] 📡 Two peers ready — telling initiator to start:', firstPersonId);
    }
  });


  /* ----------------------------------------------------------
     EVENT: offer
     ──────────────────────────────────────────────────────────
     Peer A (the initiator) calls createOffer(), gets an SDP
     offer object, and sends it to the server with:
       { offer: <RTCSessionDescription>, roomId: '...' }

     We simply forward it to the OTHER person in the room.
     The server never reads or modifies the SDP — it just
     passes the envelope unopened.
  ---------------------------------------------------------- */
  socket.on('offer', function(data) {
    console.log('[SignSync] 📨 Forwarding OFFER from:', socket.id, '→ room:', data.roomId);

    // socket.to(roomId) means "send to everyone in this room EXCEPT
    // the sender" — which is exactly the other peer
    socket.to(data.roomId).emit('offer', { offer: data.offer });
  });


  /* ----------------------------------------------------------
     EVENT: answer
     ──────────────────────────────────────────────────────────
     Peer B receives the offer, calls createAnswer(), and sends
     the answer SDP back through the server:
       { answer: <RTCSessionDescription>, roomId: '...' }

     Again, we just forward it to the other person.
  ---------------------------------------------------------- */
  socket.on('answer', function(data) {
    console.log('[SignSync] 📨 Forwarding ANSWER from:', socket.id, '→ room:', data.roomId);
    socket.to(data.roomId).emit('answer', { answer: data.answer });
  });


  /* ----------------------------------------------------------
     EVENT: ice-candidate
     ──────────────────────────────────────────────────────────
     While WebRTC is figuring out the best network path, both
     peers continuously fire onicecandidate events. Each one
     gets sent here and forwarded to the other peer.

     ICE candidates are like "you can reach me at IP:port via
     this protocol". Multiple arrive over a few seconds and
     both peers collect them to find the optimal connection.
  ---------------------------------------------------------- */
  socket.on('ice-candidate', function(data) {
    console.log('[SignSync] 🧊 Forwarding ICE candidate from:', socket.id);
    socket.to(data.roomId).emit('ice-candidate', { candidate: data.candidate });
  });


  /* ----------------------------------------------------------
     EVENT: send-letter
     ──────────────────────────────────────────────────────────
     Fired by the Deaf user's browser each time a letter is
     confirmed by the smoothing algorithm (sameCount reaches
     SAME_THRESHOLD). The browser sends:
       { roomId: 'room-123456', letter: 'A', sentence: 'AB' }

     We relay the payload to the OTHER participant in the room
     so their UI updates in real-time without polling.

     letter   — the single character just confirmed ('A', 'SPACE', 'DEL')
     sentence — the full growing sentence up to this point
                (lets a late-joining peer catch up instantly)
  ---------------------------------------------------------- */
  socket.on('send-letter', function(data) {
    console.log('[SignSync] 💬 Relaying letter "' + data.letter + '" | sentence: "' + data.sentence + '" → room:', data.roomId);

    // socket.to(roomId) sends to everyone in the room EXCEPT
    // the sender — exactly the other peer watching the call.
    socket.to(data.roomId).emit('receive-letter', {
      letter:   data.letter,
      sentence: data.sentence,
    });
  });


  /* ----------------------------------------------------------
     EVENT: disconnect
     ──────────────────────────────────────────────────────────
     Fires automatically when a browser tab closes, refreshes,
     or loses the network connection.

     We clean up the room so the remaining person gets notified
     and a new person can join if they want.
  ---------------------------------------------------------- */
  socket.on('disconnect', function() {
    console.log('[SignSync] ❌ Disconnected:', socket.id);

    var roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    // Remove this socket from the room array
    rooms[roomId] = rooms[roomId].filter(function(id) {
      return id !== socket.id;
    });

    // Tell the remaining person their peer has left
    socket.to(roomId).emit('peer-disconnected', { socketId: socket.id });
    console.log('[SignSync] 👋 Peer left room:', roomId, '| Remaining:', rooms[roomId].length);

    // If the room is now empty, delete it to free memory
    if (rooms[roomId].length === 0) {
      delete rooms[roomId];
      console.log('[SignSync] 🗑️  Room deleted (empty):', roomId);
    }
  });

}); // end io.on('connection')


/* ============================================================
   START THE SERVER
============================================================ */
const PORT = process.env.PORT || 3000;

server.listen(PORT, function() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   SignSync Live · Signaling Server           ║');
  console.log('║   http://localhost:' + PORT + '                      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  HOW TO TEST:                                ║');
  console.log('║  1. Open http://localhost:' + PORT + ' in Tab 1     ║');
  console.log('║  2. Open http://localhost:' + PORT + ' in Tab 2     ║');
  console.log('║  3. Sign in as Deaf in Tab 1                 ║');
  console.log('║  4. Sign in as Hearing in Tab 2              ║');
  console.log('║  5. Both enter the SAME Room ID              ║');
  console.log('║  6. Watch the terminal for handshake logs    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
