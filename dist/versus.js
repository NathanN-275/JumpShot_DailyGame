const api = window.JUMPSHOT_API || 'http://localhost:8787';
const $ = selector => document.querySelector(selector);
let ticket = null;
let matchId = null;
let socket = null;
let poll = null;
let searchId = 0;
let clock = null;
let state = null;
let serverOffset = 0;
let reconnectUntil = 0;
let lastReveal = -1;
let lastRoundMotion = -1;
let lastPreparedRound = -1;
let lastReviewMatch = null;
const tiers = { half: ['HALF COURT', 200], three: ['THREE', 100], jumpshot: ['JUMP SHOT', 50], dunk: ['DUNK', 10] };
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
  $('#back-home').classList.toggle('hidden', active);
  $('#cancel-search').classList.toggle('hidden', !active);
  $('#match-info').classList.toggle('searching', active);
}
function removeQueueTicket(cancelledTicket) {
  return fetch(`${api}/api/queue?ticket=${encodeURIComponent(cancelledTicket)}`, {
    method: 'DELETE', keepalive: true,
  }).catch(() => {});
}
async function startQueue() {
  const currentSearch = ++searchId;
  state = null;
  lastReveal = -1; lastRoundMotion = -1; lastPreparedRound = -1; lastReviewMatch = null;
  $('#versus-final-score').classList.add('hidden');
  $('#versus-results').classList.add('hidden');
  $('#versus-results-list').replaceChildren();
  $('#find-match').textContent = 'FIND MATCH';
  setSearching(true);
  setStatus('Searching for players');
  try {
    const response = await fetch(`${api}/api/queue`, { method: 'POST' });
    if (!response.ok) throw new Error('Matchmaking is unavailable.');
    const result = await response.json();
    if (currentSearch !== searchId) {
      void removeQueueTicket(result.ticket);
      return;
    }
    ticket = result.ticket;
    if (result.match) connect(result.match);
    else poll = setTimeout(() => checkQueue(currentSearch), 750);
  } catch (error) {
    if (currentSearch !== searchId) return;
    setSearching(false);
    setStatus(error.message);
  }
}
async function checkQueue(currentSearch) {
  if (currentSearch !== searchId || !ticket || matchId) return;
  try {
    const response = await fetch(`${api}/api/queue?ticket=${encodeURIComponent(ticket)}`);
    if (!response.ok) throw new Error('Search ended. Please try again.');
    const result = await response.json();
    if (currentSearch !== searchId) return;
    if (result.match) connect(result.match);
    else poll = setTimeout(() => checkQueue(currentSearch), 750);
  } catch (error) {
    if (currentSearch !== searchId) return;
    setSearching(false);
    setStatus(error.message);
  }
}
function cancelQueue() {
  searchId++;
  clearTimeout(poll);
  if (ticket) void removeQueueTicket(ticket);
  ticket = null;
  setSearching(false);
  setStatus('Search cancelled.');
  $('#back-home').focus();
}
function connect(id) {
  clearTimeout(poll); matchId = id; setSearching(false);
  $('.versus-actions').classList.add('hidden');
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
    if (Date.now() >= reconnectUntil) {
      clearSession();
      matchId = null;
      setStatus('Match connection ended. Find a new match.');
      $('.versus-actions').classList.remove('hidden');
      return;
    }
    setTimeout(() => { if (matchId) connect(matchId); }, 1000);
  };
  socket.onerror = () => setStatus('Connection interrupted.');
  clearInterval(clock); clock = setInterval(updateClock, 200);
}
function updateClock() {
  if (!state) return;
  const remaining = state.deadline ? Math.max(0, Math.ceil((state.deadline - Date.now() - serverOffset) / 1000)) : 0;
  $('#clock').textContent = String(remaining).padStart(2, '0');
  const status = $('.versus-status');
  status.classList.toggle('is-warning', remaining <= 10 && remaining > 5 && state.phase !== 'done');
  status.classList.toggle('is-low', remaining <= 5 && state.phase !== 'done');
}
function renderFinalScore(scores, seat) {
  const final = $('#versus-final-score');
  final.replaceChildren();
  for (const [label, score] of [['YOUR SCORE', scores[seat]], ['OPPONENT', scores[1 - seat]]]) {
    const item = document.createElement('span');
    item.textContent = `${label} `;
    const value = document.createElement('strong');
    value.textContent = String(score).padStart(3, '0');
    item.append(value); final.append(item);
  }
  final.classList.remove('hidden');
}
function renderReview(review, seat) {
  const list = $('#versus-results-list');
  list.replaceChildren();
  review.questions.forEach((question, index) => {
    const details = document.createElement('details'); details.className = 'answer-review';
    const summary = document.createElement('summary');
    const prompt = document.createElement('span'); prompt.className = 'review-prompt';
    prompt.textContent = `${String(index + 1).padStart(2, '0')} · ${question.prompt}`;
    const played = document.createElement('span'); played.className = 'review-answer';
    const mine = question.played.answers[seat];
    const theirs = question.played.answers[1 - seat];
    played.textContent = `YOU · ${mine?.name || 'NO ANSWER'} (${mine?.points || 0}) · OPPONENT · ${theirs?.name || 'NO ANSWER'} (${theirs?.points || 0})`;
    summary.append(prompt, played); details.append(summary);
    const browser = document.createElement('div'); browser.className = 'answer-browser';
    const filters = document.createElement('div'); filters.className = 'tier-filters';
    filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', `Filter answers for question ${index + 1}`);
    const search = document.createElement('input'); search.type = 'search'; search.className = 'answer-search';
    search.placeholder = 'Search answers…'; search.setAttribute('aria-label', `Search answers for question ${index + 1}`);
    const answers = document.createElement('ul'); answers.className = 'answer-results';
    const status = document.createElement('p'); status.className = 'answer-list-status';
    const entries = [...new Map(question.answers.map(([name, tier]) => [name, { name, tier }])).values()]
      .sort((a, b) => tiers[b.tier][1] - tiers[a.tier][1] || a.name.localeCompare(b.name));
    let active = 'all';
    const show = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const matches = entries.filter(entry => (active === 'all' || entry.tier === active) && entry.name.toLocaleLowerCase().includes(query));
      answers.replaceChildren();
      for (const entry of matches) {
        const row = document.createElement('li');
        const name = document.createElement('span'); name.textContent = entry.name;
        const tier = document.createElement('span'); tier.className = 'answer-tier'; tier.dataset.tier = entry.tier;
        tier.textContent = `${tiers[entry.tier][0]} · ${tiers[entry.tier][1]} pts`;
        row.append(name, tier); answers.append(row);
      }
      status.textContent = matches.length ? `${matches.length.toLocaleString()} answers` : 'No matching answers.';
    };
    for (const key of ['all', ...Object.keys(tiers)]) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'tier-filter';
      if (key !== 'all') button.dataset.tier = key;
      button.textContent = `${key === 'all' ? 'ALL' : tiers[key][0]} ${key === 'all' ? entries.length : entries.filter(entry => entry.tier === key).length}`;
      button.setAttribute('aria-pressed', String(key === active));
      button.addEventListener('click', () => { active = key; for (const filter of filters.children) filter.setAttribute('aria-pressed', String(filter === button)); show(); });
      filters.append(button);
    }
    search.addEventListener('input', show); browser.append(filters, search, answers, status); details.append(browser);
    details.addEventListener('toggle', () => { if (details.open) { for (const other of list.querySelectorAll('.answer-review[open]')) if (other !== details) other.open = false; show(); } });
    list.append(details);
  });
  $('#versus-results').classList.remove('hidden');
}
async function loadReview(id, ticket, seat) {
  if (lastReviewMatch === id) return;
  lastReviewMatch = id;
  try {
    const response = await fetch(`${api}/api/match/${encodeURIComponent(id)}/review?ticket=${encodeURIComponent(ticket)}`);
    if (!response.ok) throw new Error('Could not load the answer bank.');
    renderReview(await response.json(), seat);
  } catch (error) { setStatus(error.message); lastReviewMatch = null; }
}
function render() {
  const { seat, bot, phase, round, answers, submitted, scores, stealSeat, steal, winner } = state;
  $('#blue-name').textContent = seat === 0 ? 'YOU' : 'OPPONENT';
  $('#red-name').textContent = seat === 1 ? 'YOU' : 'OPPONENT';
  $('#blue-score').textContent = String(scores[0]).padStart(3, '0');
  $('#red-score').textContent = String(scores[1]).padStart(3, '0');
  $('#period').textContent = phase === 'done' ? 'FINAL' : `Q${round + 1} / 7`;
  $('#round-label').textContent = phase === 'counter' ? 'STEAL CHANCE' : phase === 'reveal' ? 'RESULTS' : phase === 'done' ? 'FINAL BUZZER' : `QUESTION ${round + 1} OF 7`;
  $('#headline').textContent = phase === 'done' ? winner === -1 ? 'It’s a tie.' : winner === seat ? 'You win!' : 'Opponent wins.' : state.prompt;
  $('#hint').textContent = phase === 'done' ? 'Thanks for playing.' : state.hint || 'The deeper the cut, the bigger the bucket.';
  const canAnswer = phase === 'answer' && !submitted[seat] || phase === 'counter' && stealSeat === seat && !steal;
  form.classList.toggle('hidden', !canAnswer);
  $('.versus-actions').classList.toggle('hidden', phase !== 'done');
  $('#match-info').classList.toggle('is-steal', phase === 'counter');
  if (phase === 'answer' && lastPreparedRound !== round) { lastPreparedRound = round; resetCourtShot(); }
  if (phase === 'answer') setStatus(submitted[seat] ? 'Answer locked. Waiting for the other player and the shot clock.' : 'Submit one valid answer before the clock expires.');
  if (phase === 'answer' && submitted[seat] && lastRoundMotion !== round) { lastRoundMotion = round; animateVersusTeams(seat); }
  if (phase === 'counter') setStatus(stealSeat === seat ? `Beat their ${answers[1 - seat]?.points || 0}-point tier before the clock expires.` : 'Your opponent has a chance to steal.');
  if (phase === 'reveal') {
    const summary = answers.map((answer, i) => `${i === seat ? 'You' : 'Opponent'}: ${answer?.name || 'No answer'} (${answer?.points || 0})`).join(' · ');
    $('#reveal').textContent = `${summary}${steal ? ` · STEAL: ${steal.name}` : ''}`;
    setStatus(steal ? 'Shot blocked! A steal changed the score.' : 'Round complete.');
    if (lastReveal !== round) {
      lastReveal = round;
      const shooterSeat = answers[0]?.points >= (answers[1]?.points || 0) ? 0 : 1;
      if (shooterSeat === 0 && answers[0]) playCourtShot(answers[0].tier, { miss: !!steal && stealSeat === 1 }).catch(() => {});
      else if (answers[1]) playRedFastBreak(RED_FINISHES[1]).catch(() => {});
    }
  } else if (phase !== 'done') $('#reveal').textContent = '';
  if (phase === 'done') { setStatus('Final score'); renderFinalScore(scores, seat); loadReview(matchId, ticket, seat); $('#find-match').textContent = 'PLAY AGAIN'; clearSession(); matchId = null; ticket = null; socket?.close(); }
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
