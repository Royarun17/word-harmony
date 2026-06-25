const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const synonymEngine = require('./synonymEngine');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const sessions = {};
const turnTimers = {}; // sessionId -> timeout

const TURN_TIME_LIMIT = 10; // seconds

function clearTurnTimer(sessionId) {
  if (turnTimers[sessionId]) {
    clearTimeout(turnTimers[sessionId]);
    delete turnTimers[sessionId];
  }
}

function startTurnTimer(sessionId) {
  clearTurnTimer(sessionId);
  const s = getSession(sessionId);
  if (!s || s.phase !== 'playing') return;

  // Broadcast timer start to all players
  io.to(sessionId).emit('turn_timer', {
    playerId: currentTurnPlayerId(s),
    seconds: TURN_TIME_LIMIT
  });

  turnTimers[sessionId] = setTimeout(() => {
    const s = getSession(sessionId);
    if (!s || s.phase !== 'playing') return;

    const playerId = currentTurnPlayerId(s);
    const hand = s.cards[playerId];
    if (!hand || hand.length === 0) return;

    // Auto-pass a random card
    const randomCard = hand[Math.floor(Math.random() * hand.length)];
    s.cards[playerId] = hand.filter(c => c !== randomCard);

    const next = nextPlayerId(s, playerId);
    s.cards[next].push(randomCard);

    if (playerId === s.starterPlayerId && !s.firstRoundOver) s.firstRoundOver = true;

    advanceTurn(s);

    io.to(sessionId).emit('auto_passed', {
      playerId,
      playerName: s.players.find(p => p.id === playerId)?.name,
      card: randomCard
    });

    io.to(sessionId).emit('session_update', sanitize(s));
    broadcastHands(s);

    // Start timer for next player
    startTurnTimer(sessionId);
  }, TURN_TIME_LIMIT * 1000);
}

function createSession(hostId, hostName, rounds) {
  const id = Math.random().toString(36).substring(2, 7).toUpperCase();
  sessions[id] = { id, hostId, rounds: rounds || 5, currentRound: 0, phase: 'lobby',
    players: [], wordSubmissions: {}, synonymClusters: {}, cards: {},
    turnOrder: [], currentTurnIndex: 0, starterPlayerId: null, firstRoundOver: false,
    incomingCard: {}, buzzerLog: [], roundScores: [], totalScores: {} };
  return sessions[id];
}
function getSession(id) { return sessions[id]; }
function addPlayer(s, pid, name) {
  if (s.players.find(p => p.id === pid)) return;
  s.players.push({ id: pid, name, connected: true });
  s.totalScores[pid] = 0;
}
function currentTurnPlayerId(s) { return s.turnOrder[s.currentTurnIndex]; }
function advanceTurn(s) { s.currentTurnIndex = (s.currentTurnIndex + 1) % s.turnOrder.length; }
function nextPlayerId(s, cid) { const i = s.turnOrder.indexOf(cid); return s.turnOrder[(i+1)%s.turnOrder.length]; }
function isCompleteSet(hand, clusters) {
  if (!hand || hand.length < 3) return false;
  const h = hand.slice(0,3).map(w=>w.toLowerCase());
  for (const [,c] of Object.entries(clusters)) { if (h.every(w=>c.map(x=>x.toLowerCase()).includes(w))) return true; }
  return false;
}
function scoreRound(s) {
  const pts=[10,7,5,3,1]; const res=[]; let vi=0;
  s.buzzerLog.forEach((e,i)=>{
    const complete=isCompleteSet(s.cards[e.playerId],s.synonymClusters);
    const points=complete?(pts[vi]||1):0; if(complete)vi++;
    res.push({playerId:e.playerId,points,hasCompleteSet:complete,buzzerOrder:i+1});
    s.totalScores[e.playerId]=(s.totalScores[e.playerId]||0)+points;
  });
  s.roundScores=res; return res;
}

app.post('/session/create',(req,res)=>{
  const {playerName,rounds}=req.body; const playerId=uuidv4();
  const s=createSession(playerId,playerName,rounds); addPlayer(s,playerId,playerName);
  res.json({sessionId:s.id,playerId});
});
app.get('/session/:id',(req,res)=>{
  const s=getSession(req.params.id);
  if(!s) return res.status(404).json({error:'Not found'});
  res.json({id:s.id,phase:s.phase,playerCount:s.players.length,rounds:s.rounds});
});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../client/build','index.html')));

io.on('connection',(socket)=>{
  socket.on('join_session',({sessionId,playerId,playerName})=>{
    const s=getSession(sessionId); if(!s){socket.emit('error',{message:'Session not found'});return;}
    addPlayer(s,playerId,playerName); socket.join(sessionId); socket.data={sessionId,playerId};
    io.to(sessionId).emit('session_update',sanitize(s));
  });
  socket.on('start_submission',({sessionId})=>{
    const s=getSession(sessionId); if(!s)return; s.phase='submit';
    io.to(sessionId).emit('session_update',sanitize(s));
  });
  socket.on('submit_word',async({sessionId,playerId,word})=>{
    const s=getSession(sessionId); if(!s||s.phase!=='submit')return;
    const cleaned=word.trim().toLowerCase();
    if(Object.values(s.wordSubmissions).map(w=>w.toLowerCase()).includes(cleaned)){
      socket.emit('word_error',{message:'Word already submitted. Try another.'});return;
    }
    s.wordSubmissions[playerId]=cleaned;
    io.to(sessionId).emit('session_update',sanitize(s));
    if(Object.keys(s.wordSubmissions).length===s.players.length){
      s.phase='loading'; io.to(sessionId).emit('session_update',sanitize(s));
      try{
        await dealCards(s); s.currentRound=1; s.firstRoundOver=false;
        buildTurnOrder(s); s.phase='playing';
        io.to(sessionId).emit('session_update',sanitize(s)); broadcastHands(s);
      }catch(err){
        s.phase='submit'; io.to(sessionId).emit('error',{message:'Synonym error. Try again.'});
        io.to(sessionId).emit('session_update',sanitize(s));
      }
    }
  });
  socket.on('pass_card',({sessionId,playerId,cardToPass})=>{
    const s=getSession(sessionId); if(!s||s.phase!=='playing')return;
    if(currentTurnPlayerId(s)!==playerId){socket.emit('error',{message:"Not your turn."});return;}
    // Player's hand already includes the incoming card (added immediately on arrival)
    const hand=s.cards[playerId];
    if(!hand||!hand.includes(cardToPass)){socket.emit('error',{message:'Card not in hand.'});return;}
    // Remove passed card from hand
    s.cards[playerId]=hand.filter(c=>c!==cardToPass);
    // Add passed card immediately to next player's hand (they now have 4)
    const next=nextPlayerId(s,playerId);
    s.cards[next].push(cardToPass);
    // Clear any pending incoming since we now add immediately
    delete s.incomingCard[next];
    if(playerId===s.starterPlayerId&&!s.firstRoundOver) s.firstRoundOver=true;
    advanceTurn(s); io.to(sessionId).emit('session_update',sanitize(s)); broadcastHands(s);
    io.to(sessionId).emit('card_incoming',{toPlayerId:next,fromPlayerName:s.players.find(p=>p.id===playerId)?.name});
    startTurnTimer(sessionId);
  });
  socket.on('press_buzzer',({sessionId,playerId})=>{
    const s=getSession(sessionId); if(!s)return;
    if(s.phase!=='playing'&&s.phase!=='buzzing')return;
    if(!s.firstRoundOver){socket.emit('error',{message:'Buzzer locked! Wait for starter to pass.'});return;}
    if(currentTurnPlayerId(s)!==playerId&&s.phase==='playing'){socket.emit('error',{message:'Wait for your turn.'});return;}
    if(s.buzzerLog.find(b=>b.playerId===playerId))return;
    if(s.phase==='playing'){s.phase='buzzing';s.buzzerLog=[];clearTurnTimer(sessionId);}
    s.buzzerLog.push({playerId,timestamp:Date.now()});
    io.to(sessionId).emit('buzzer_pressed',{playerId,playerName:s.players.find(p=>p.id===playerId)?.name,buzzerLog:s.buzzerLog});
    if(s.buzzerLog.length===s.players.length){
      const res=scoreRound(s); s.phase='scoring';
      io.to(sessionId).emit('round_scored',{
        roundScores:res.map(r=>({...r,playerName:s.players.find(p=>p.id===r.playerId)?.name,hand:s.cards[r.playerId]})),
        totalScores:s.players.map(p=>({playerId:p.id,playerName:p.name,total:s.totalScores[p.id]||0})),
        synonymClusters:s.synonymClusters,round:s.currentRound
      });
      io.to(sessionId).emit('session_update',sanitize(s));
    }
  });
  socket.on('next_round',({sessionId})=>{
    const s=getSession(sessionId); if(!s||s.phase!=='scoring')return;
    if(s.currentRound>=s.rounds){
      clearTurnTimer(sessionId);
      s.phase='ended';
      io.to(sessionId).emit('game_ended',{finalScores:s.players.map(p=>({playerId:p.id,playerName:p.name,total:s.totalScores[p.id]||0})).sort((a,b)=>b.total-a.total)});
      io.to(sessionId).emit('session_update',sanitize(s));
    }else{
      clearTurnTimer(sessionId);
      s.currentRound++; s.phase='submit'; s.wordSubmissions={}; s.synonymClusters={}; s.cards={};
      s.incomingCard={}; s.buzzerLog=[]; s.roundScores=[]; s.starterPlayerId=null; s.firstRoundOver=false;
      io.to(sessionId).emit('session_update',sanitize(s));
    }
  });
  socket.on('disconnect',()=>{
    const {sessionId,playerId}=socket.data||{};
    if(sessionId&&playerId){const s=getSession(sessionId);if(s){const p=s.players.find(x=>x.id===playerId);if(p)p.connected=false;io.to(sessionId).emit('session_update',sanitize(s));}}
  });
});

async function dealCards(s){
  for(const[,word]of Object.entries(s.wordSubmissions)){const syn=await synonymEngine.getSynonyms(word);s.synonymClusters[word]=syn;}
  const pids=s.players.map(p=>p.id);
  pids.forEach(pid=>{s.cards[pid]=[];s.incomingCard[pid]=null;});
  pids.forEach((pid,i)=>{const word=s.wordSubmissions[pid];const cluster=s.synonymClusters[word];cluster.forEach((syn,j)=>{s.cards[pids[(i+j)%pids.length]].push(syn);});});
  pids.forEach(pid=>{s.cards[pid]=s.cards[pid].slice(0,3);});
  const si=Math.floor(Math.random()*pids.length);const sid=pids[si];s.starterPlayerId=sid;
  const sw=s.wordSubmissions[sid];const ow=Object.keys(s.synonymClusters).filter(w=>w!==sw);
  let fc;
  if(Math.random()<0.5&&ow.length>0){const rw=ow[Math.floor(Math.random()*ow.length)];const rc=s.synonymClusters[rw];fc=rc[Math.floor(Math.random()*rc.length)];}
  else{const oc=s.synonymClusters[sw];fc=oc[Math.floor(Math.random()*oc.length)];}
  s.cards[sid].push(fc);
}
function buildTurnOrder(s){
  const st=s.players.filter(p=>p.id===s.starterPlayerId);const rest=s.players.filter(p=>p.id!==s.starterPlayerId);
  s.turnOrder=[...st,...rest].map(p=>p.id);s.currentTurnIndex=0;
}
function broadcastHands(s){
  s.players.forEach(p=>{
    io.to(s.id).emit(`hand_update_${p.id}`,{hand:s.cards[p.id]||[],incomingCard:s.incomingCard[p.id]||null,isStarter:p.id===s.starterPlayerId});
  });
}
function sanitize(s){
  return{id:s.id,hostId:s.hostId,phase:s.phase,currentRound:s.currentRound,rounds:s.rounds,
    players:s.players,wordSubmissions:s.wordSubmissions,turnOrder:s.turnOrder,
    currentTurnIndex:s.currentTurnIndex,starterPlayerId:s.starterPlayerId,firstRoundOver:s.firstRoundOver,
    incomingCardFor:Object.keys(s.incomingCard||{}).filter(k=>s.incomingCard[k]),
    buzzerLog:s.buzzerLog,totalScores:s.totalScores};
}

const PORT=process.env.PORT||4000;
server.listen(PORT,()=>console.log(`Word Harmony running on port ${PORT}`));
