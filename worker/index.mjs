import bank from './bank.json' with { type: 'json' };

const points = { dunk: 10, jumpshot: 50, three: 100, half: 200 };
const bonus = { jumpshot: 15, three: 20, half: 30 };
const STEAL_WINDOW_MS = 6000;
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const all = [...bank.names, ...bank.history];
const random = size => crypto.getRandomValues(new Uint32Array(1))[0] % size;
function deck() {
  const names = bank.names.map((_, i) => i);
  const categories = [...new Set(bank.history.map(q => q.category))];
  const draw = list => list.splice(random(list.length), 1)[0];
  const selected = [draw(names), draw(names)];
  for (let i = 0; i < 5; i++) {
    const category = draw(categories);
    const possible = bank.history.map((q, index) => q.category === category ? bank.names.length + index : -1).filter(i => i >= 0);
    selected.push(draw(possible));
  }
  return selected;
}
function accepted(question, text) {
  const key = normalize(text);
  if (!key || key.length > 64) return null;
  for (const [name, tier, aliases = []] of question.answers) {
    const shared = question.team ? [] : bank.aliases[name] || [];
    if ([name, ...aliases, ...shared].some(value => normalize(value) === key)) return { name, tier, points: points[tier] };
  }
  return null;
}
function publicState(state, seat) {
  const q = all[state.deck[state.round]];
  const reveal = state.phase === 'reveal' || state.phase === 'done';
  return {
    matchId: state.id, seat, bot: state.bot, phase: state.phase, round: state.round, serverNow: Date.now(),
    deadline: state.deadline, scores: state.scores, prompt: q?.prompt, hint: q?.hint,
    team: !!q?.team, submitted: state.answers.map(Boolean),
    answers: state.answers.map((a, i) => reveal || i === seat ? a : state.phase === 'counter' ? a && { tier: a.tier, points: a.points } : null),
    stealSeat: state.stealSeat, steal: reveal ? state.steal : null, winner: state.winner ?? null,
  };
}
function chooseBot(state) {
  if (!state.bot) return;
  const q = all[state.deck[state.round]];
  const [name, tier] = q.answers[random(q.answers.length)];
  state.answers[1] = { name, tier, points: points[tier] };
}
export class Match {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/init') {
      if (await this.ctx.storage.get('state')) return new Response('exists', { status: 409 });
      const { id, tickets, bot } = await request.json();
      const state = { id, tickets, bot, deck: deck(), history: [], round: 0, phase: 'answer', deadline: Date.now() + 25000, scores: [0, 0], answers: [null, null], steal: null, stealSeat: null, disconnectedUntil: [Date.now() + 15000, bot ? null : Date.now() + 15000] };
      chooseBot(state);
      await this.save(state);
      return Response.json({ ok: true });
    }
    const state = await this.ctx.storage.get('state');
    if (!state) return new Response('match missing', { status: 404 });
    const ticket = url.searchParams.get('ticket');
    const seat = state.tickets.indexOf(ticket);
    if (seat < 0) return new Response('forbidden', { status: 403 });
    if (request.method === 'GET' && url.pathname === '/review') {
      if (state.phase !== 'done') return new Response('match in progress', { status: 409 });
      return Response.json({ scores: state.scores, winner: state.winner, questions: state.deck.map((index, round) => {
        const question = all[index];
        return {
          prompt: question.prompt,
          answers: question.answers.map(([name, tier]) => [name, tier]),
          played: state.history?.[round] || { answers: [null, null], steal: null, stealSeat: null },
        };
      }) });
    }
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ seat });
      state.disconnectedUntil[seat] = null;
      await this.save(state);
      server.send(JSON.stringify(publicState(state, seat)));
      return new Response(null, { status: 101, webSocket: client });
    }
    return Response.json(publicState(state, seat));
  }
  async save(state) {
    await this.ctx.storage.put('state', state);
    const next = [state.deadline, ...state.disconnectedUntil.filter(Boolean)].filter(Boolean);
    if (next.length) await this.ctx.storage.setAlarm(Math.min(...next));
  }
  broadcast(state) {
    for (const ws of this.ctx.getWebSockets()) {
      const seat = ws.deserializeAttachment()?.seat;
      if (seat !== undefined) try { ws.send(JSON.stringify(publicState(state, seat))); } catch { /* reconnect will resync */ }
    }
  }
  async webSocketMessage(ws, message) {
    const seat = ws.deserializeAttachment()?.seat;
    const state = await this.ctx.storage.get('state');
    if (!state || !['answer', 'counter'].includes(state.phase) || seat === undefined) return;
    let payload; try { payload = JSON.parse(message); } catch { return; }
    const now = Date.now();
    if (now >= state.deadline || typeof payload.answer !== 'string') return;
    const match = accepted(all[state.deck[state.round]], payload.answer);
    if (!match) { ws.send(JSON.stringify({ error: 'Answer not in the bank. Try again.' })); return; }
    const canSteal = state.phase === 'counter' && state.stealSeat === seat && !state.steal
      && match.points > (state.answers[1 - seat]?.points || 0)
      && !state.answers.some(answer => answer?.name === match.name);
    if (state.phase === 'answer' && !state.answers[seat]) {
      state.answers[seat] = match;
    } else if (canSteal) {
      state.steal = match;
      this.settle(state, now);
    } else {
      ws.send(JSON.stringify({ error: 'That answer cannot steal this shot.' }));
      return;
    }
    await this.save(state); this.broadcast(state);
  }
  async webSocketClose(ws) {
    const seat = ws.deserializeAttachment()?.seat;
    const state = await this.ctx.storage.get('state');
    if (!state || state.phase === 'done' || seat === undefined) return;
    if (this.ctx.getWebSockets().some(other => other !== ws && other.deserializeAttachment()?.seat === seat)) return;
    state.disconnectedUntil[seat] = Date.now() + 15000;
    await this.save(state); this.broadcast(state);
  }
  async alarm() {
    const state = await this.ctx.storage.get('state');
    if (!state || state.phase === 'done') return;
    const now = Date.now();
    const forfeiter = state.disconnectedUntil.findIndex(until => until && until <= now);
    if (forfeiter >= 0) { state.phase = 'done'; state.winner = 1 - forfeiter; state.deadline = null; }
    else if (now >= state.deadline && state.phase === 'answer') {
      const a = state.answers.map(answer => answer?.points || 0);
      state.stealSeat = a[0] === a[1] || Math.max(...a) === 200 ? null : a[0] < a[1] ? 0 : 1;
      if (state.stealSeat !== null) {
        state.phase = 'counter'; state.deadline = now + STEAL_WINDOW_MS;
        if (state.bot && state.stealSeat === 1) {
          const q = all[state.deck[state.round]];
          const [name, tier] = q.answers[random(q.answers.length)];
          if (points[tier] > a[0] && !state.answers.some(answer => answer?.name === name)) {
            state.steal = { name, tier, points: points[tier] };
            this.settle(state, now);
          }
        }
      } else this.settle(state, now);
    } else if (now >= state.deadline && state.phase === 'counter') this.settle(state, now);
    else if (now >= state.deadline && state.phase === 'reveal') {
      if (++state.round === 7) { state.phase = 'done'; state.winner = state.scores[0] === state.scores[1] ? -1 : state.scores[0] > state.scores[1] ? 0 : 1; state.deadline = null; }
      else { state.phase = 'answer'; state.deadline = now + 25000; state.answers = [null, null]; state.steal = null; state.stealSeat = null; chooseBot(state); }
    }
    await this.save(state); this.broadcast(state);
  }
  settle(state, now) {
    state.answers.forEach((answer, seat) => { state.scores[seat] += answer?.points || 0; });
    if (state.steal && state.stealSeat !== null) {
      state.scores[1 - state.stealSeat] -= state.answers[1 - state.stealSeat]?.points || 0;
      state.scores[state.stealSeat] += bonus[state.steal.tier] || 0;
    }
    state.history ||= [];
    state.history[state.round] = { answers: state.answers, steal: state.steal, stealSeat: state.stealSeat };
    state.phase = 'reveal'; state.deadline = now + 3500;
  }
}
export class Queue {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async start(tickets, bot) {
    const id = crypto.randomUUID();
    const stub = this.env.MATCH.getByName(id);
    await stub.fetch('https://match/init', { method: 'POST', body: JSON.stringify({ id, tickets, bot }) });
    return id;
  }
  async fetch(request) {
    let queue = await this.ctx.storage.get('queue') || [];
    let entries = await this.ctx.storage.get('entries') || {};
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/join') {
      const now = Date.now();
      entries = Object.fromEntries(Object.entries(entries).filter(([, entry]) => now - entry.at < 86400000));
      const expired = queue.filter(item => entries[item] && now - entries[item].at >= 10000);
      queue = queue.filter(item => entries[item] && now - entries[item].at < 10000);
      for (const oldTicket of expired) entries[oldTicket].match = await this.start([oldTicket, null], true);
      const ticket = crypto.randomUUID();
      const other = queue.shift();
      if (other) {
        const id = await this.start([other, ticket], false);
        entries[other].match = id;
        entries[ticket] = { match: id, at: Date.now() };
      } else { queue.push(ticket); entries[ticket] = { at: Date.now() }; }
      await this.ctx.storage.put('queue', queue); await this.ctx.storage.put('entries', entries);
      return Response.json({ ticket, ...entries[ticket] });
    }
    const ticket = url.searchParams.get('ticket');
    if (!ticket || !entries[ticket]) return new Response('missing ticket', { status: 404 });
    if (request.method === 'DELETE') {
      queue = queue.filter(item => item !== ticket); delete entries[ticket];
      await this.ctx.storage.put('queue', queue); await this.ctx.storage.put('entries', entries);
      return Response.json({ cancelled: true });
    }
    const entry = entries[ticket];
    if (!entry.match && Date.now() - entry.at >= 10000) {
      queue = queue.filter(item => item !== ticket);
      entry.match = await this.start([ticket, null], true);
      await this.ctx.storage.put('queue', queue); await this.ctx.storage.put('entries', entries);
    }
    return Response.json({ ticket, ...entry });
  }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowed = env.FRONTEND_ORIGIN || 'http://localhost:8000';
    if (origin && origin !== allowed) return new Response('origin denied', { status: 403 });
    const headers = { 'Access-Control-Allow-Origin': allowed, 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    const route = url.pathname.startsWith('/api/queue') ? env.QUEUE.getByName('global') : url.pathname.startsWith('/api/match/') ? env.MATCH.getByName(url.pathname.split('/')[3]) : null;
    if (!route) return new Response('not found', { status: 404, headers });
    const target = url.pathname.startsWith('/api/queue') ? `https://queue/${request.method === 'POST' ? 'join' : 'status'}${url.search}` : `https://match/${url.pathname.endsWith('/review') ? 'review' : ''}${url.search}`;
    const response = await route.fetch(new Request(target, request));
    if (response.status === 101) return response;
    const result = new Response(response.body, response);
    for (const [key, value] of Object.entries(headers)) result.headers.set(key, value);
    return result;
  }
};
