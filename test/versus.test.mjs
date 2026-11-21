import assert from 'node:assert/strict';
import test from 'node:test';
import { Match, Queue } from '../worker/index.mjs';
import bank from '../worker/bank.json' with { type: 'json' };

function context() {
  const values = new Map();
  return {
    storage: { get: async key => values.get(key), put: async (key, value) => values.set(key, structuredClone(value)), setAlarm: async () => {} },
    getWebSockets: () => [],
  };
}

test('a six-second steal window closes on the first successful steal and prevents a steal back', async t => {
  const now = Date.now();
  t.mock.method(Date, 'now', () => now);
  const ctx = context();
  const match = new Match(ctx, {});
  const tickets = ['a', 'b'];
  await match.fetch(new Request('https://match/init', { method: 'POST', body: JSON.stringify({ id: 'one', tickets, bot: false }) }));
  const state = await ctx.storage.get('state');
  state.deck[0] = 0;
  state.answers = [{ name: 'Common', tier: 'dunk', points: 10 }, { name: 'Uncommon', tier: 'jumpshot', points: 50 }];
  state.deadline = now - 1;
  await ctx.storage.put('state', state);
  await match.alarm();
  const counter = await ctx.storage.get('state');
  assert.equal(counter.phase, 'counter');
  assert.equal(counter.stealSeat, 0);
  assert.equal(counter.deadline, now + 6000);

  const submit = (seat, answer) => match.webSocketMessage({ deserializeAttachment: () => ({ seat }), send() {} }, JSON.stringify({ answer }));
  const [stealAnswer] = bank.names[0].answers.find(([, tier]) => tier === 'three');
  const [rarerAnswer] = bank.names[0].answers.find(([, tier]) => tier === 'half');
  await submit(0, stealAnswer);
  const result = await ctx.storage.get('state');
  assert.equal(result.phase, 'reveal');
  assert.equal(result.steal.name, stealAnswer);
  assert.deepEqual(result.scores, [30, 0]);

  await submit(1, rarerAnswer);
  assert.deepEqual(await ctx.storage.get('state'), result);
});

test('a finished match returns the scored answer history and complete bank only to its players', async () => {
  const ctx = context();
  const match = new Match(ctx, {});
  await match.fetch(new Request('https://match/init', { method: 'POST', body: JSON.stringify({ id: 'review', tickets: ['a', 'b'], bot: false }) }));
  const state = await ctx.storage.get('state');
  assert.ok(state.deadline - Date.now() <= 25000 && state.deadline - Date.now() > 24000);
  assert.equal((await match.fetch(new Request('https://match/review?ticket=a'))).status, 409);
  state.phase = 'done';
  state.scores = [100, 50];
  state.history = [{ answers: [{ name: 'First', tier: 'three', points: 100 }, { name: 'Second', tier: 'jumpshot', points: 50 }], steal: null, stealSeat: null }];
  await ctx.storage.put('state', state);
  assert.equal((await match.fetch(new Request('https://match/review?ticket=outsider'))).status, 403);
  const review = await (await match.fetch(new Request('https://match/review?ticket=a'))).json();
  assert.deepEqual(review.scores, [100, 50]);
  assert.equal(review.questions.length, 7);
  assert.equal(review.questions[0].played.answers[0].name, 'First');
  assert.ok(review.questions[0].answers.length > 0);
});

test('one waiting player automatically gets a bot after ten seconds', async () => {
  const ctx = context();
  const created = [];
  const queue = new Queue(ctx, { MATCH: { getByName: id => ({ fetch: async () => { created.push(id); return new Response('ok'); } }) } });
  const joined = await (await queue.fetch(new Request('https://queue/join', { method: 'POST' }))).json();
  const entries = await ctx.storage.get('entries');
  entries[joined.ticket].at -= 10001;
  await ctx.storage.put('entries', entries);
  const status = await (await queue.fetch(new Request(`https://queue/status?ticket=${joined.ticket}`))).json();
  assert.equal(status.match, created[0]);
});

test('an abandoned search cannot take a new human opponent after ten seconds', async () => {
  const ctx = context();
  const created = [];
  const queue = new Queue(ctx, { MATCH: { getByName: id => ({ fetch: async (_url, options) => { created.push({ id, body: JSON.parse(options.body) }); return new Response('ok'); } }) } });
  const old = await (await queue.fetch(new Request('https://queue/join', { method: 'POST' }))).json();
  const entries = await ctx.storage.get('entries');
  entries[old.ticket].at -= 10001;
  await ctx.storage.put('entries', entries);
  const fresh = await (await queue.fetch(new Request('https://queue/join', { method: 'POST' }))).json();
  assert.equal(fresh.match, undefined);
  assert.equal(created.length, 1);
  assert.equal(created[0].body.bot, true);
  assert.equal((await ctx.storage.get('entries'))[old.ticket].match, created[0].id);
});
