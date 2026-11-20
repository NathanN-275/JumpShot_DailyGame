const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const element = {
  addEventListener() {},
  classList: { add() {}, remove() {} },
};
const game = vm.createContext({
  document: { querySelector: () => element, body: element },
  localStorage: { getItem: () => null },
  setInterval() {},
});
for (const script of ["players", "career-threes", "record-questions", "questions", "game"]) {
  const path = join(__dirname, "..", "dist", `${script}.js`);
  vm.runInContext(readFileSync(path, "utf8"), game, { filename: path });
}

function read(expression) {
  return JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, game));
}

function answer(question, guess) {
  const result = read(`matchAnswer([...questionsByPrompt.values()].find(({ prompt }) =>
    prompt.includes(${JSON.stringify(question)})), ${JSON.stringify(guess)})`);
  if (result && !result.ambiguous) return [result.name, result.corrected];
  return result;
}

test("autocorrect accepts close guesses and preserves ambiguous or ineligible answers", () => {
  assert.deepEqual(answer("100+ career three-pointers", " sTePhEnCuRrY "), ["Stephen Curry", false]);
  assert.deepEqual(answer("100+ career three-pointers", "Curry"), ["Stephen Curry", false]);
  assert.deepEqual(answer("100+ career three-pointers", "Stcokton"), ["John Stockton", true]);
  assert.deepEqual(answer("100+ career three-pointers", "Cury"), { ambiguous: true });
  assert.deepEqual(answer("first name starts with M.", "Micheal Jordon"), ["Michael Jordan", true]);
  assert.deepEqual(answer("Pacific Division", "loSAngeleSClIpEPrS"), ["Los Angeles Clippers", true]);
  assert.deepEqual(answer("25,000 career points", "shaquille o neal"), ["Shaquille O'Neal", false]);
  assert.deepEqual(answer("200+ steals in one season", "Lafayette Lever"), ["Fat Lever", false]);
  assert.equal(answer("last name starts with B.", "Bam Adebayo"), null);
  assert.equal(answer("70+ points in a game", "LeBron James"), null);
  assert.equal(answer("Atlantic Division", "Los Angeles Lakers"), null);
});

test("the expanded daily rotation uses all 196 prompts with five distinct history categories per game", () => {
  const days = Array.from({ length: 29 }, (_, offset) =>
    new Date(Date.UTC(2026, 11, 11 + offset)).toISOString().slice(0, 10),
  );
  const decks = read(`${JSON.stringify(days)}.map(day => dailyQuestions(day).map(({ prompt, category }) => [prompt, category]))`);
  assert.deepEqual(decks.pop(), decks[0]);
  const prompts = [];
  for (const deck of decks) {
    assert.equal(deck.length, 7);
    assert.deepEqual(deck.slice(0, 2).map(([, category]) => category), [null, null]);
    const history = deck.slice(2).map(([, category]) => category);
    assert(history.every(Boolean));
    assert.equal(new Set(history).size, 5);
    prompts.push(...deck.map(([prompt]) => prompt));
  }
  assert.equal(new Set(prompts).size, 196);
  assert.deepEqual(answer("500+ games for the Miami Heat", "Dwyane Wade"), ["Dwyane Wade", false]);
  assert.equal(answer("500+ games for the Miami Heat", "LeBron James"), null);
});
