const api = window.JUMPSHOT_API || 'http://localhost:8787';
const $ = selector => document.querySelector(selector);
let ticket = null;
let matchId = null;
let socket = null;
let poll = null;
let clock = null;
let state = null;
let serverOffset = 0;
let reconnectUntil = 0;
let lastReveal = -1;
let lastRoundMotion = -1;
const form = $('#versus-form');
const input = $('#versus-answer');
const sessionKey = 'jumpshot-versus-match';
function saveSession() {
  try { sessionStorage.setItem(sessionKey, JSON.stringify({ ticket, matchId })); } catch { /* Browser storage may be disabled. */ }
}
function clearSession() {
  try { sessionStorage.removeItem(sessionKey); } catch { /* Browser storage may be disabled. */ }
}
function setStatus(text) { $('#match-info').textContent = text; }
function setSearching(active) {
  $('#find-match').classList.toggle('hidden', active);
  $('#cancel-search').classList.toggle('hidden', !active);
  $('#match-info').classList.toggle('searching', active);
}
async function startQueue() {
  setSearching(true);
  setStatus('Searching for players');
  try {
    const response = await fetch(`${api}/api/queue`, { method: 'POST' });
    if (!response.ok) throw new Error('Matchmaking is unavailable.');
    const result = await response.json();
    ticket = result.ticket;
    if (result.match) connect(result.match);
    else poll = setInterval(checkQueue, 750);
  } catch (error) { setSearching(false); setStatus(error.message); }
}
async function checkQueue() {
  if (!ticket || matchId) return;
  try {
    const response = await fetch(`${api}/api/queue?ticket=${encodeURIComponent(ticket)}`);
    if (!response.ok) throw new Error('Search ended. Please try again.');
    const result = await response.json();
    if (result.match) connect(result.match);
  } catch (error) { clearInterval(poll); setSearching(false); setStatus(error.message); }
}
async function cancelQueue() {
  clearInterval(poll);
  if (ticket && !matchId) await fetch(`${api}/api/queue?ticket=${encodeURIComponent(ticket)}`, { method: 'DELETE' }).catch(() => {});
  ticket = null; setSearching(false); setStatus('Search cancelled.');
}
function connect(id) {
  clearInterval(poll); matchId = id; setSearching(false);
  if (!reconnectUntil) reconnectUntil = Date.now() + 15000;
  saveSession();
  const url = new URL(`${api}/api/match/${id}`);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('ticket', ticket);
  socket = new WebSocket(url);
  socket.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.error) { setStatus(data.error); return; }
    state = data; serverOffset = data.serverNow - Date.now(); reconnectUntil = Date.now() + 15000; render();
  };
  socket.onclose = () => {
    if (state?.phase === 'done') return;
    setStatus('Reconnecting…');
    if (Date.now() >= reconnectUntil) { clearSession(); matchId = null; setStatus('Match connection ended. Find a new match.'); $('#find-match').classList.remove('hidden'); return; }
    setTimeout(() => { if (matchId) connect(matchId); }, 1000);
  };
  socket.onerror = () => setStatus('Connection interrupted.');
  clearInterval(clock); clock = setInterval(updateClock, 200);
}
function updateClock() {
  if (!state) return;
  $('#clock').textContent = state.deadline ? String(Math.max(0, Math.ceil((state.deadline - Date.now() - serverOffset) / 1000))).padStart(2, '0') : '00';
}
function render() {
  const { seat, bot, phase, round, answers, submitted, scores, stealSeat, steal, winner } = state;
  $('#blue-name').textContent = seat === 0 ? 'YOU' : 'OPPONENT';
  $('#red-name').textContent = seat === 1 ? 'YOU' : bot ? 'BOT' : 'OPPONENT';
  $('#blue-score').textContent = String(scores[0]).padStart(3, '0');
  $('#red-score').textContent = String(scores[1]).padStart(3, '0');
  $('#period').textContent = phase === 'done' ? 'FINAL' : `Q${round + 1} / 7`;
  $('#round-label').textContent = phase === 'counter' ? 'STEAL CHANCE' : phase === 'reveal' ? 'RESULTS' : phase === 'done' ? 'FINAL BUZZER' : `QUESTION ${round + 1} OF 7`;
  $('#headline').textContent = phase === 'done' ? winner === -1 ? 'It’s a tie.' : winner === seat ? 'You win!' : 'Opponent wins.' : state.prompt;
  $('#hint').textContent = phase === 'done' ? 'Thanks for playing.' : state.hint || 'The deeper the cut, the bigger the bucket.';
  const canAnswer = phase === 'answer' && !submitted[seat] || phase === 'counter' && stealSeat === seat && !steal;
  form.classList.toggle('hidden', !canAnswer);
  if (phase === 'answer') setStatus(submitted[seat] ? 'Answer locked. Waiting for the other player and the shot clock.' : 'Submit one valid answer before the clock expires.');
  if (phase === 'answer' && lastRoundMotion !== round) { lastRoundMotion = round; animateVersusTeams(); }
  if (phase === 'counter') setStatus(stealSeat === seat ? `Beat their ${answers[1 - seat]?.points || 0}-point tier in 10 seconds to steal.` : 'Your opponent has 10 seconds to attempt a steal.');
  if (phase === 'reveal') {
    const summary = answers.map((answer, i) => `${i === seat ? 'You' : bot ? 'Bot' : 'Opponent'}: ${answer?.name || 'No answer'} (${answer?.points || 0})`).join(' · ');
    $('#reveal').textContent = `${summary}${steal ? ` · STEAL: ${steal.name}` : ''}`;
    setStatus(steal ? 'Shot blocked! A steal changed the score.' : 'Round complete.');
    if (lastReveal !== round) {
      lastReveal = round;
      const lead = scores[0] >= scores[1] ? 0 : 1;
      if (lead === 0 && answers[0]) playCourtShot(answers[0].tier, { miss: !!steal && stealSeat === 1 }).catch(() => {});
      else if (answers[1]) playRedFastBreak(RED_FINISHES[1]).catch(() => {});
    }
  } else if (phase !== 'done') $('#reveal').textContent = '';
  if (phase === 'done') { setStatus('Final score'); $('#find-match').textContent = 'PLAY AGAIN'; $('#find-match').classList.remove('hidden'); clearSession(); matchId = null; ticket = null; socket?.close(); }
  updateClock();
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!socket || socket.readyState !== WebSocket.OPEN || !input.value.trim()) return;
  socket.send(JSON.stringify({ answer: input.value.trim() }));
  input.value = '';
});
$('#find-match').addEventListener('click', startQueue);
$('#cancel-search').addEventListener('click', cancelQueue);
try {
  const saved = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
  if (saved?.ticket && saved?.matchId) { ticket = saved.ticket; connect(saved.matchId); }
} catch { clearSession(); }
