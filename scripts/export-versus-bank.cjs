const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const root = join(__dirname, '..');
const element = { addEventListener() {}, classList: { add() {}, remove() {} } };
const context = vm.createContext({ document: { querySelector: () => element, body: element }, localStorage: { getItem: () => null }, setInterval() {} });
for (const name of ['players', 'career-threes', 'record-questions', 'questions', 'game']) {
  vm.runInContext(readFileSync(join(root, 'dist', `${name}.js`), 'utf8'), context, { filename: name });
}
const data = JSON.parse(vm.runInContext(`JSON.stringify({
  names: allNameQuestions.map(({prompt, hint, answers, team}) => ({prompt, hint, answers, team: !!team})),
  history: allHistoryQuestions.map(({prompt, hint, answers, team, category}) => ({prompt, hint, answers, team: !!team, category})),
  aliases: NAME_ALIASES
})`, context));
writeFileSync(join(root, 'worker', 'bank.json'), JSON.stringify(data));
console.log(`Exported ${data.names.length + data.history.length} versus prompts`);
