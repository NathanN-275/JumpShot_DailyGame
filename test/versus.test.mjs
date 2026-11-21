import assert from 'node:assert/strict';
import test from 'node:test';
import { Match, Queue } from '../worker/index.mjs';

function context() {
  const values = new Map();
  return {
    storage: { get: async key => values.get(key), put: async (key, value) => values.set(key, structuredClone(value)), setAlarm: async () => {} },
    getWebSockets: () => [],
  };
}

test('a rarer steal removes the opponent base score and grants only the steal bonus', async () => {
  const ctx = context();
  const match = new Match(ctx, {});
  const tickets = ['a', 'b'];
  await match.fetch(new Request('https://match/init', { method: 'POST', body: JSON.stringify({ id: 'one', tickets, bot: false }) }));
  const state = await ctx.storage.get('state');
  state.answers = [{ name: 'Common', tier: 'dunk', points: 10 }, { name: 'Uncommon', tier: 'jumpshot', points: 50 }];
  state.deadline = Date.now() - 1;
  await ctx.storage.put('state', state);
  await match.alarm();
  const counter = await ctx.storage.get('state');
  assert.equal(counter.phase, 'counter');
  assert.equal(counter.stealSeat, 0);
  counter.steal = { name: 'Rare', tier: 'three', points: 100 };
  counter.deadline = Date.now() - 1;
  await ctx.storage.put('state', counter);
  await match.alarm();
  const result = await ctx.storage.get('state');
  assert.equal(result.phase, 'reveal');
  assert.deepEqual(result.scores, [30, 0]);
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
