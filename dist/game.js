const RUN_LENGTH = 7;
const QUESTION_SECONDS = 30;
const BEST_SCORE_KEY = "jumpshot-best-score";
const DAILY_KEY = "jumpshot-day-";
const DAILY_TZ = "America/New_York";
const ROTATION_START = "2026-11-20";
const EXPANDED_ROTATION_START = "2026-12-11";
const NAME_QUESTIONS_PER_GAME = 2;
const dailyCalendar = new Intl.DateTimeFormat("en", { timeZone: DAILY_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const TIERS = {
  dunk: { label: "DUNK", points: 10 },
  jumpshot: { label: "JUMPSHOT", points: 50 },
  three: { label: "3 POINTER", points: 100 },
  half: { label: "HALF COURT", points: 200 },
};

// The first answer pack is curated by prompt. A new answer belongs in a question's bank before it can score.
const QUESTION_BANK = [
  {
    prompt: "Name an NBA player with 100+ career three-pointers.",
    category: "shooting-records",
    hint: "Regular-season totals through the end of 2025–26.",
    answers: THREE_POINT_ANSWERS,
    source: "https://www.nba.com/stats/alltime-leaders?StatCategory=FG3M",
  },
  {
    prompt: "Name an NBA player who scored 70+ points in a game.",
    category: "single-game-scoring",
    hint: "Eleven players have reached the 70-point club.",
    answers: [
      ["Wilt Chamberlain", "dunk", ["Wilt"]],
      ["Kobe Bryant", "dunk", ["Kobe"]],
      ["Devin Booker", "jumpshot"],
      ["Damian Lillard", "jumpshot", ["Dame Lillard", "Dame"]],
      ["Joel Embiid", "jumpshot"],
      ["Luka Doncic", "jumpshot", ["Luka Dončić", "Luka"]],
      ["Donovan Mitchell", "three"],
      ["Elgin Baylor", "three"],
      ["David Robinson", "three"],
      ["David Thompson", "half"],
      ["Bam Adebayo", "half", ["Bam"]],
    ],
    source: "https://www.nba.com/news/every-70-point-game-in-nba-history",
  },
  {
    prompt: "Name an NBA player with at least three regular-season MVP awards.",
    category: "season-mvp",
    hint: "Nine players have won three or more.",
    answers: [
      ["Kareem Abdul-Jabbar", "dunk", ["Kareem", "Kareem Abdul Jabbar"]],
      ["Michael Jordan", "dunk", ["Jordan", "MJ"]],
      ["LeBron James", "dunk", ["Lebron James", "LeBron"]],
      ["Magic Johnson", "jumpshot", ["Magic"]],
      ["Larry Bird", "jumpshot", ["Bird"]],
      ["Wilt Chamberlain", "three", ["Wilt"]],
      ["Nikola Jokic", "three", ["Nikola Jokić", "Jokic", "Jokić"]],
      ["Bill Russell", "half", ["Russell"]],
      ["Moses Malone", "half"],
    ],
    source: "https://www.nba.com/news/nba-players-with-at-least-3-mvps",
  },
  {
    prompt: "Name an NBA player who has won Defensive Player of the Year more than once.",
    category: "defense",
    hint: "There are ten multi-time winners in league history.",
    answers: [
      ["Dwight Howard", "dunk", ["Dwight"]],
      ["Dennis Rodman", "dunk", ["Rodman"]],
      ["Rudy Gobert", "dunk", ["Gobert"]],
      ["Kawhi Leonard", "jumpshot", ["Kawhi"]],
      ["Dikembe Mutombo", "jumpshot", ["Mutombo"]],
      ["Ben Wallace", "jumpshot"],
      ["Hakeem Olajuwon", "three", ["Hakeem"]],
      ["Alonzo Mourning", "three"],
      ["Mark Eaton", "half"],
      ["Sidney Moncrief", "half"],
    ],
    source: "https://www.nba.com/news/history-defensive-player-of-the-year-winners",
  },
  {
    prompt: "Name an NBA player with six or more championship rings.",
    category: "player-championships",
    hint: "The Celtics dynasty has some deep cuts.",
    answers: [
      ["Michael Jordan", "dunk", ["Jordan", "MJ"]],
      ["Kareem Abdul-Jabbar", "dunk", ["Kareem", "Kareem Abdul Jabbar"]],
      ["Scottie Pippen", "dunk", ["Pippen"]],
      ["Robert Horry", "dunk", ["Horry"]],
      ["Bill Russell", "jumpshot", ["Russell"]],
      ["Sam Jones", "jumpshot"],
      ["Bob Cousy", "jumpshot", ["Cousy"]],
      ["John Havlicek", "three", ["Havlicek"]],
      ["K.C. Jones", "three", ["KC Jones"]],
      ["Tom Heinsohn", "half", ["Heinsohn"]],
      ["Satch Sanders", "half", ["Tom Sanders", "Thomas Sanders", "Sanders"]],
      ["Jim Loscutoff", "half", ["Loscutoff"]],
      ["Frank Ramsey", "half", ["Ramsey"]],
    ],
    source: "https://www.nba.com/news/top-10-players-with-multiple-championships",
  },
  {
    prompt: "Name an NBA player who won four or more scoring titles.",
    category: "scoring-titles",
    hint: "Five players have reached that mark.",
    answers: [
      ["Michael Jordan", "dunk", ["Jordan", "MJ"]],
      ["Kevin Durant", "dunk", ["KD"]],
      ["Wilt Chamberlain", "jumpshot", ["Wilt"]],
      ["Allen Iverson", "jumpshot", ["AI"]],
      ["George Gervin", "three", ["Iceman"]],
    ],
    source: "https://www.nba.com/news/nba-players-with-multiple-scoring-titles",
  },
  {
    prompt: "Name an NBA player who scored 80+ points in a game.",
    category: "single-game-scoring",
    hint: "Only three players have done it.",
    answers: [
      ["Wilt Chamberlain", "dunk", ["Wilt"]],
      ["Kobe Bryant", "jumpshot", ["Kobe"]],
      ["Bam Adebayo", "half", ["Bam"]],
    ],
    source: "https://www.nba.com/news/every-70-point-game-in-nba-history",
  },
  {
    prompt: "Name an NBA player with at least 100 regular-season triple-doubles.",
    category: "triple-doubles",
    hint: "Six players have crossed the century mark.",
    answers: [
      ["Russell Westbrook", "dunk", ["Westbrook", "Russ"]],
      ["LeBron James", "dunk", ["Lebron James", "LeBron"]],
      ["Magic Johnson", "jumpshot", ["Magic"]],
      ["Jason Kidd", "jumpshot", ["Kidd"]],
      ["Nikola Jokic", "three", ["Nikola Jokić", "Jokic", "Jokić"]],
      ["Oscar Robertson", "half", ["Oscar"]],
    ],
    source: "https://www.nba.com/news/most-triple-doubles-in-nba-history",
  },
  {
    prompt: "Name an NBA player who averaged a triple-double for a full season.",
    category: "triple-doubles",
    hint: "Just three players have done it.",
    answers: [
      ["Russell Westbrook", "dunk", ["Westbrook", "Russ"]],
      ["Nikola Jokic", "jumpshot", ["Nikola Jokić", "Jokic", "Jokić"]],
      ["Oscar Robertson", "half", ["Oscar"]],
    ],
    source: "https://www.nba.com/news/nuggets-nikola-jokic-averages-triple-double-for-season",
  },
];

const originalHistoryQuestions = [...QUESTION_BANK, ...EXTRA_HISTORY_QUESTIONS];
const firstRotationNames = [...NAME_QUESTIONS, ...MORE_NAME_QUESTIONS];
const firstRotationHistory = [...originalHistoryQuestions, ...MORE_HISTORY_QUESTIONS];
const allNameQuestions = [...firstRotationNames, ...NEW_NAME_QUESTIONS];
const allHistoryQuestions = [...firstRotationHistory, ...NEW_HISTORY_QUESTIONS];
const legacyQuestionPrompts = new Map();

function renameQuestionPrompt(question, prompt) {
  legacyQuestionPrompts.set(question.prompt, question);
  question.prompt = prompt;
}

function mergeAnswerBanks(question, ...sources) {
  const answers = new Map(question.answers.map(([name, tier, aliases = []]) => [name, [name, tier, [...aliases]]]));
  for (const source of sources) {
    for (const [name, tier, aliases = []] of source.answers) {
      if (answers.has(name)) {
        const [savedName, savedTier, savedAliases] = answers.get(name);
        answers.set(name, [savedName, savedTier, [...new Set([...savedAliases, ...aliases])]]);
      } else {
        answers.set(name, [name, tier, [...aliases]]);
      }
    }
  }
  question.answers = [...answers.values()];
}

function widenDateRangeQuestions(questions) {
  const groups = new Map();
  for (const question of new Set(questions)) {
    const range = question.prompt.match(/\bfrom (\d{4}) through (\d{4})\b/);
    if (!range) continue;
    const key = `${question.category}:${question.prompt.slice(0, range.index)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ question, range, start: Number(range[1]), end: Number(range[2]) });
  }

  for (const group of groups.values()) {
    group.sort((left, right) => left.start - right.start);
    const plans = group.map((item, index) => {
      let sources = [item];
      if (item.end - item.start + 1 < 20) {
        const next = group[index + 1];
        const previous = group[index - 1];
        if (next && item.end + 1 === next.start) sources.push(next);
        else if (previous && previous.end + 1 === item.start) sources.unshift(previous);
      }
      return {
        ...item,
        item,
        originalStart: item.start,
        originalEnd: item.end,
        sources,
        start: Math.min(...sources.map(({ start }) => start)),
        end: Math.max(...sources.map(({ end }) => end)),
      };
    });
    const usedRanges = new Set();

    for (const plan of plans) {
      let rangeKey = `${plan.start}:${plan.end}`;
      while (usedRanges.has(rangeKey)) {
        const previous = group.find((item) => item.end + 1 === plan.start && !plan.sources.includes(item));
        if (!previous) break;
        plan.sources.unshift(previous);
        plan.start = previous.start;
        rangeKey = `${plan.start}:${plan.end}`;
      }
      if (usedRanges.has(rangeKey)) {
        // Avoid duplicate date prompts when the last short window already overlaps its predecessor.
        plan.start = plan.originalStart;
        plan.end = plan.originalEnd;
        plan.sources = [plan.item];
        rangeKey = `${plan.start}:${plan.end}`;
      }
      usedRanges.add(rangeKey);
      const additions = plan.sources.filter(({ question }) => question !== plan.question).map(({ question }) => question);
      mergeAnswerBanks(plan.question, ...additions);
      if (plan.start !== plan.originalStart || plan.end !== plan.originalEnd) {
        renameQuestionPrompt(plan.question, plan.question.prompt.replace(plan.range[0], `from ${plan.start} through ${plan.end}`));
      }
    }
  }
}

function widenBaaChampionshipRange(questions) {
  const baa = questions.find(({ prompt }) => prompt.includes("BAA championship from 1947 through 1949"));
  const nbaFifties = questions.find(({ prompt }) => prompt.includes("NBA team that won a championship from 1950 through 1959"));
  if (!baa || !nbaFifties) return;
  mergeAnswerBanks(baa, nbaFifties);
  renameQuestionPrompt(baa, baa.prompt.replace("BAA championship from 1947 through 1949", "BAA/NBA championship from 1947 through 1959"));
}

widenBaaChampionshipRange(allHistoryQuestions);
widenDateRangeQuestions(allHistoryQuestions);

const skillsChallenge2010s = allHistoryQuestions.find(({ prompt, category }) => category === "skills-challenge" && prompt.includes("2010 through 2019"));
const skillsChallengeEarlier = allHistoryQuestions.find(({ prompt, category }) => category === "skills-challenge" && prompt.includes("2003 through 2019"));
if (skillsChallenge2010s && skillsChallengeEarlier) {
  mergeAnswerBanks(skillsChallenge2010s, skillsChallengeEarlier);
  renameQuestionPrompt(skillsChallenge2010s, skillsChallenge2010s.prompt.replace("from 2010 through 2019", "from 2000 through 2019"));
}

const finalsLosses2020s = allHistoryQuestions.find(({ prompt }) => prompt.includes("lost in the Finals from 2020 through 2026"));
const finalsLosses2010s = allHistoryQuestions.find(({ prompt }) => prompt.includes("lost in the Finals from 2010 through 2019"));
if (finalsLosses2020s && finalsLosses2010s) {
  mergeAnswerBanks(finalsLosses2020s, finalsLosses2010s, {
    answers: [
      ["Los Angeles Lakers", "dunk", TEAM_ALIASES["Los Angeles Lakers"]],
      ["New Jersey Nets", "dunk", TEAM_ALIASES["New Jersey Nets"]],
      ["Indiana Pacers", "jumpshot", TEAM_ALIASES["Indiana Pacers"]],
      ["Philadelphia 76ers", "jumpshot", TEAM_ALIASES["Philadelphia 76ers"]],
      ["Detroit Pistons", "jumpshot", TEAM_ALIASES["Detroit Pistons"]],
      ["Orlando Magic", "jumpshot", TEAM_ALIASES["Orlando Magic"]],
      ["Dallas Mavericks", "three", TEAM_ALIASES["Dallas Mavericks"]],
      ["Cleveland Cavaliers", "three", TEAM_ALIASES["Cleveland Cavaliers"]],
    ],
  });
  renameQuestionPrompt(finalsLosses2020s, finalsLosses2020s.prompt.replace("from 2020 through 2026", "from 2000 through 2026"));
}

for (const question of allHistoryQuestions.filter(({ category }) => category === "nba-cup")) {
  renameQuestionPrompt(question, question.prompt.replace(/ from 2023 through 2025/, " since 2023"));
  question.hint = "The NBA Cup began in 2023.";
}

const questionsByPrompt = new Map([...allNameQuestions, ...allHistoryQuestions].map((question) => [question.prompt, question]));
for (const [prompt, question] of legacyQuestionPrompts) questionsByPrompt.set(prompt, question);

const $ = (selector) => document.querySelector(selector);
const form = $("#answer-form");
const answerInput = $("#answer");
const submitButton = $("#submit-button");
const scoreElement = $("#score");
const redScoreElement = $("#red-score");
const promptElement = $("#prompt");
const questionNumberElement = $("#question-number");
const timerElement = $("#timer");
const timerRing = $("#timer-progress");
const resultStrip = $("#result-strip");
const resultMessage = $("#result-message");
const resultPoints = $("#result-points");
const introCard = $("#intro-card");
const finishCard = $("#finish-card");
const bestScoreElement = $("#best-score");
const resultsPanel = $("#results-panel");
const resultsList = $("#results-list");

let runQuestions = [];
let runAnswers = [];
let questionIndex = 0;
let score = 0;
let redScore = 0;
let gameDay = "";
let homeDay = "";
let deadline = null;
let lastDailySave = null;
let secondsLeft = QUESTION_SECONDS;
let timerId = null;
let transitionId = null;
let locked = true;

function formatScore(value) {
  return String(value).padStart(3, "0");
}

function readBestScore() {
  try {
    const value = Number(localStorage.getItem(BEST_SCORE_KEY) || 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try { localStorage.setItem(BEST_SCORE_KEY, String(value)); } catch { /* Some private browser modes disable local storage. */ }
}

function dailyDate() {
  const parts = Object.fromEntries(dailyCalendar.formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function readDaily(day) {
  try {
    const saved = localStorage.getItem(DAILY_KEY + day);
    if (saved) return JSON.parse(saved);
  } catch { /* An in-memory save still works for the current tab. */ }
  return lastDailySave?.day === day ? lastDailySave : null;
}

function saveDaily(nextIndex, nextDeadline) {
  const saved = { day: gameDay, index: nextIndex, deadline: nextDeadline, score, redScore, prompts: runQuestions.map(({ prompt }) => prompt), answers: runAnswers };
  lastDailySave = saved;
  try { localStorage.setItem(DAILY_KEY + gameDay, JSON.stringify(saved)); } catch { /* Storage can be disabled in a private window. */ }
}

function answerKey(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]/g, "");
}

const knownPlayerAnswers = new Set([
  ...LAST_NAME_KEYS.keys(),
  ...aliasesByPlayer.keys(),
  ...Object.values(NAME_ALIASES).flat().map(answerKey),
]);
const knownLastNames = new Set(LAST_NAME_KEYS.values());
const knownTeamAnswers = new Set(Object.entries(TEAM_ALIASES).flatMap(([name, aliases]) => [name, ...aliases].map(answerKey)));

function editDistance(left, right, limit) {
  if (Math.abs(left.length - right.length) > limit) return Infinity;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  let beforePrevious = new Array(right.length + 1);
  let current = new Array(right.length + 1);
  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const same = left[row - 1] === right[column - 1];
      current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + Number(!same));
      if (row > 1 && column > 1 && left[row - 1] === right[column - 2] && left[row - 2] === right[column - 1]) {
        current[column] = Math.min(current[column], beforePrevious[column - 2] + 1);
      }
    }
    [beforePrevious, previous, current] = [previous, current, beforePrevious];
  }
  return previous[right.length] <= limit ? previous[right.length] : Infinity;
}

function matchAnswer(question, rawAnswer) {
  const typed = answerKey(rawAnswer);
  if (!typed) return null;

  const choicesByName = new Map();
  for (const [name, tier, aliases = []] of question.answers) {
    if (choicesByName.has(name)) continue;
    const key = letterKey(name);
    const sharedAliases = question.team ? [] : aliasesByPlayer.get(key) ?? [];
    const accepted = [name, ...aliases, ...sharedAliases].map(answerKey);
    const last = question.team ? "" : LAST_NAME_KEYS.get(key) ?? letterKey(name.split(" ").at(-1));
    choicesByName.set(name, { name, tier, accepted, last });
  }
  const choices = [...choicesByName.values()];

  const exact = choices.filter(({ accepted }) => accepted.includes(typed));
  if (exact.length > 1) return { ambiguous: true };
  if (exact.length === 1) return { ...exact[0], corrected: false };

  if (!question.team) {
    if (knownPlayerAnswers.has(typed)) return null;
    const matchingLastNames = choices.filter(({ last }) => last === typed);
    if (matchingLastNames.length > 1) return { ambiguous: true };
    if (matchingLastNames.length === 1) return { ...matchingLastNames[0], corrected: false };
    if (knownLastNames.has(typed)) return null;
  } else if (knownTeamAnswers.has(typed)) {
    return null;
  }

  if (typed.length < 4) return null;
  const canUseSurname = !question.team && !/\s/.test(rawAnswer.trim());
  let nearest = null;
  let closestDistance = Infinity;
  let tied = false;
  for (const choice of choices) {
    const fullName = choice.accepted[0];
    const limit = typed.length >= 9 && fullName.length >= 9 ? 2 : 1;
    let distance = editDistance(typed, fullName, limit);
    for (const alias of choice.accepted.slice(1)) {
      if (alias.length >= 4) distance = Math.min(distance, editDistance(typed, alias, 1));
    }
    if (canUseSurname && choice.last.length >= 5) {
      distance = Math.min(distance, editDistance(typed, choice.last, 1));
    }
    if (distance < closestDistance) {
      nearest = choice;
      closestDistance = distance;
      tied = false;
    } else if (nearest && distance === closestDistance) {
      tied = true;
    }
  }
  if (tied) return { ambiguous: true };
  return nearest ? { ...nearest, corrected: true } : null;
}

function setTimer(value) {
  secondsLeft = value;
  timerElement.textContent = String(value).padStart(2, "0");
  timerRing.style.strokeDashoffset = String(113.1 * (1 - value / QUESTION_SECONDS));
  timerElement.parentElement.classList.toggle("is-low", value <= 8);
}

function clearPlayState() {
  resetCourtShot();
  document.body.classList.remove("is-shooting", "shot-made", "shot-missed", "red-fast-break");
  $("#play-call").textContent = "";
}

function setResult(message = "", points = "", state = "") {
  resultStrip.classList.remove("is-good", "is-miss", "is-corrected");
  delete resultStrip.dataset.tier;
  resultStrip.classList.toggle("hidden", !message);
  if (state) resultStrip.classList.add(state);
  resultMessage.textContent = message;
  resultPoints.textContent = points;
  $(".result-icon").textContent = state === "is-good" ? "✦" : state === "is-miss" ? "×" : "●";
}

function setFormEnabled(enabled) {
  answerInput.disabled = !enabled;
  submitButton.disabled = !enabled;
  locked = !enabled;
  if (enabled) answerInput.focus({ preventScroll: true });
}

function startClock() {
  clearInterval(timerId);
  const tick = () => {
    setTimer(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    if (secondsLeft <= 0) resolveQuestion(null);
  };
  timerId = setInterval(tick, 200);
  tick();
}

function showQuestion(resumeDeadline = null) {
  clearPlayState();
  if (questionIndex >= RUN_LENGTH) {
    finishRun();
    return;
  }
  const question = runQuestions[questionIndex];
  questionNumberElement.textContent = String(questionIndex + 1).padStart(2, "0");
  $("#period").textContent = `Q${questionIndex + 1} · 30 SEC`;
  promptElement.textContent = question.prompt;
  $("#prompt-hint").textContent = question.hint;
  answerInput.placeholder = question.team ? "Type a team name…" : "Type a player name…";
  answerInput.value = "";
  setResult();
  setFormEnabled(true);
  deadline = resumeDeadline ?? Date.now() + QUESTION_SECONDS * 1000;
  saveDaily(questionIndex, deadline);
  startClock();
}

async function playTimeout(finish) {
  const callout = $("#play-call");
  if (!finish) {
    await playCourtShot("jumpshot", { miss: true });
    document.body.classList.add("shot-missed");
    callout.textContent = "BRICK";
    setResult("Shot clock expired. Red grabbed the rebound.", "0 pts", "is-miss");
    return;
  }

  document.body.classList.add("red-fast-break");
  callout.textContent = "TURNOVER";
  const calloutTime = new Promise((resolve) => setTimeout(resolve, 500));
  await Promise.all([playRedFastBreak(finish), calloutTime]);
  redScoreElement.textContent = String(redScore).padStart(2, "0");
  callout.textContent = `RED ${finish.label} +${finish.points}`;
  setResult("Shot clock expired. Red scored on the fast break.", "0 pts", "is-miss");
}

async function resolveQuestion(match) {
  if (locked) return;
  const saved = readDaily(gameDay);
  if (saved && (saved.index !== questionIndex || saved.deadline !== deadline)) {
    startRun(gameDay);
    return;
  }
  clearInterval(timerId);
  setFormEnabled(false);
  setResult();
  document.body.classList.add("is-shooting");
  const tier = match ? TIERS[match.tier] : null;
  const finish = !tier && Math.random() >= .5 ? RED_FINISHES[Math.floor(Math.random() * RED_FINISHES.length)] : null;
  if (tier) score += tier.points;
  if (finish) redScore += finish.points;
  runAnswers[questionIndex] = match ? [match.name, match.tier] : null;
  saveDaily(questionIndex + 1, null);
  if (match) {
    await playCourtShot(match.tier);
    scoreElement.textContent = formatScore(score);
    document.body.classList.add("shot-made");
    $("#play-call").textContent = `${tier.label} +${tier.points}`;
    const correctedText = match.corrected ? `Spelling fixed to ${match.name}.` : `${match.name} is in the answer bank.`;
    setResult(`${correctedText} ${tier.label}`, `+${tier.points} pts`, "is-good");
    resultStrip.dataset.tier = match.tier;
    if (match.corrected) resultStrip.classList.add("is-corrected");
  } else {
    await playTimeout(finish);
  }

  questionIndex += 1;
  transitionId = setTimeout(() => {
    const next = readDaily(gameDay);
    if (next && (next.index !== questionIndex || next.deadline !== null)) startRun(gameDay);
    else showQuestion();
  }, 1900);
}

function finishRun() {
  clearInterval(timerId);
  clearTimeout(transitionId);
  setFormEnabled(false);
  document.body.classList.remove("is-playing");
  document.body.classList.add("is-finished");
  const previousBest = readBestScore();
  const best = Math.max(previousBest, score);
  saveBestScore(best);
  $("#final-score").textContent = formatScore(score);
  bestScoreElement.textContent = formatScore(best);
  finishCard.classList.remove("hidden");
  introCard.classList.add("hidden");
  scoreElement.textContent = formatScore(score);
  redScoreElement.textContent = String(redScore).padStart(2, "0");
  questionNumberElement.textContent = "07";
  $("#period").textContent = "FINAL";
  setTimer(0);
  setResult(`Final score: ${formatScore(score)} points. Best: ${formatScore(best)}.`, "FINAL", "is-good");
  renderRunResults();
}

function renderRunResults() {
  resultsList.replaceChildren();
  const tierKeys = Object.keys(TIERS).sort((left, right) => TIERS[right].points - TIERS[left].points);

  runQuestions.forEach((question, index) => {
    const entries = [...new Map(question.answers.map(([name, tier, aliases = []]) => [name, { name, tier, aliases }])).values()]
      .sort((left, right) => tierKeys.indexOf(left.tier) - tierKeys.indexOf(right.tier) || left.name.localeCompare(right.name));
    const details = document.createElement("details");
    details.className = "answer-review";

    const summary = document.createElement("summary");
    const prompt = document.createElement("span");
    prompt.className = "review-prompt";
    prompt.textContent = `${String(index + 1).padStart(2, "0")} · ${question.prompt}`;
    const accepted = document.createElement("span");
    const recorded = runAnswers[index];
    const [answer, awardedTier] = Array.isArray(recorded) ? recorded : [recorded];
    accepted.className = answer === null ? "review-answer is-unanswered" : answer === false ? "review-answer is-unavailable" : "review-answer";
    accepted.textContent = typeof answer === "string" ? `YOUR ANSWER · ${answer}` : answer === null ? "NO ANSWER" : "ANSWER NOT RECORDED";
    if (awardedTier) accepted.dataset.tier = awardedTier;
    summary.append(prompt, accepted);
    details.append(summary);

    const browser = document.createElement("div");
    browser.className = "answer-browser";
    const filters = document.createElement("div");
    filters.className = "tier-filters";
    filters.setAttribute("role", "group");
    filters.setAttribute("aria-label", `Filter answers for question ${index + 1}`);
    const searchLabel = document.createElement("label");
    searchLabel.className = "sr-only";
    searchLabel.textContent = `Search answers for question ${index + 1}`;
    const search = document.createElement("input");
    search.type = "search";
    search.className = "answer-search";
    search.placeholder = "Search answers…";
    search.autocomplete = "off";
    searchLabel.append(search);
    const answerList = document.createElement("ul");
    answerList.className = "answer-results";
    answerList.setAttribute("aria-live", "polite");
    const listStatus = document.createElement("p");
    listStatus.className = "answer-list-status";
    let activeTier = "all";

    const renderAnswers = () => {
      const query = answerKey(search.value);
      const matches = entries.filter(({ name, tier, aliases }) => {
        if (activeTier !== "all" && tier !== activeTier) return false;
        if (!query) return true;
        const sharedAliases = question.team ? [] : aliasesByPlayer.get(letterKey(name)) ?? [];
        return [name, ...aliases, ...sharedAliases].some((candidate) => answerKey(candidate).includes(query));
      });
      answerList.replaceChildren();
      for (const entry of matches) {
        const row = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = entry.name;
        const tier = document.createElement("span");
        tier.className = "answer-tier";
        tier.dataset.tier = entry.tier;
        const scoringTier = TIERS[entry.tier];
        tier.textContent = `${scoringTier.label} · ${scoringTier.points} pts`;
        row.append(name, tier);
        answerList.append(row);
      }
      listStatus.textContent = matches.length ? `${matches.length.toLocaleString()} answers` : "No matching answers.";
    };

    for (const tierKey of ["all", ...tierKeys]) {
      const count = tierKey === "all" ? entries.length : entries.filter(({ tier }) => tier === tierKey).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tier-filter";
      if (tierKey !== "all") button.dataset.tier = tierKey;
      button.setAttribute("aria-pressed", String(tierKey === activeTier));
      button.textContent = `${tierKey === "all" ? "ALL" : TIERS[tierKey].label} ${count.toLocaleString()}`;
      button.addEventListener("click", () => {
        activeTier = tierKey;
        for (const filter of filters.children) filter.setAttribute("aria-pressed", String(filter === button));
        renderAnswers();
      });
      filters.append(button);
    }
    search.addEventListener("input", renderAnswers);
    browser.append(filters, searchLabel, answerList, listStatus);
    details.append(browser);
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      for (const other of resultsList.querySelectorAll(".answer-review[open]")) {
        if (other !== details) other.open = false;
      }
      renderAnswers();
    });
    resultsList.append(details);
  });

  resultsPanel.classList.remove("hidden");
}

function dailyShuffle(day) {
  let seed = Math.imul(Number(day.replaceAll("-", "")), 0x9e3779b1) >>> 0;
  return (questions) => {
    const copy = [...questions];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const pick = Math.floor(seed / 4294967296 * (index + 1));
      [copy[index], copy[pick]] = [copy[pick], copy[index]];
    }
    return copy;
  };
}

function dailyQuestions(day) {
  if (day >= ROTATION_START) {
    const expanded = day >= EXPANDED_ROTATION_START;
    const start = expanded ? EXPANDED_ROTATION_START : ROTATION_START;
    const rotation = expanded ? expandedDailyRotation : dailyRotation;
    // Subtract date-only values in UTC so daylight saving does not change the day index.
    const elapsedDays = (Date.parse(day) - Date.parse(start)) / 86_400_000;
    return rotation[elapsedDays % rotation.length];
  }

  // Keep the original daily questions available for dates before the expanded rotation.
  const shuffled = dailyShuffle(day);
  const starters = shuffled(NAME_QUESTIONS).slice(0, NAME_QUESTIONS_PER_GAME);
  const categories = new Set();
  const history = shuffled(originalHistoryQuestions).filter((question) => {
    const category = question.category ?? question.prompt;
    if (categories.has(category)) return false;
    categories.add(category);
    return true;
  });
  return [...starters, ...history.slice(0, RUN_LENGTH - starters.length)];
}

function buildDailyRotation(start, nameQuestions, historyQuestions) {
  const shuffled = dailyShuffle(start);
  const starters = shuffled(nameQuestions);
  const historyByCategory = new Map();
  for (const question of shuffled(historyQuestions)) {
    const category = question.category;
    if (!historyByCategory.has(category)) historyByCategory.set(category, []);
    historyByCategory.get(category).push(question);
  }

  const categories = [...historyByCategory.values()];
  const historyPerGame = RUN_LENGTH - NAME_QUESTIONS_PER_GAME;
  const days = starters.length / NAME_QUESTIONS_PER_GAME;
  const games = Array.from({ length: days }, (_, dayIndex) => {
    const first = dayIndex * NAME_QUESTIONS_PER_GAME;
    const names = starters.slice(first, first + NAME_QUESTIONS_PER_GAME);
    // Use the largest remaining categories first to spread them across the rotation.
    categories.sort((left, right) => right.length - left.length);
    const history = categories.slice(0, historyPerGame).map((questions) => questions.pop());
    return [...names, ...shuffled(history)];
  });
  return shuffled(games);
}

const dailyRotation = buildDailyRotation(ROTATION_START, firstRotationNames, firstRotationHistory);
const expandedDailyRotation = buildDailyRotation(EXPANDED_ROTATION_START, allNameQuestions, allHistoryQuestions);

function startRun(day) {
  clearInterval(timerId);
  clearTimeout(transitionId);
  gameDay = day;
  homeDay = gameDay;
  const saved = readDaily(gameDay);
  const savedQuestions = saved?.prompts?.map((prompt) => questionsByPrompt.get(prompt));
  runQuestions = savedQuestions?.length === RUN_LENGTH && savedQuestions.every(Boolean) ? savedQuestions : dailyQuestions(gameDay);
  runAnswers = Array.isArray(saved?.answers) && saved.answers.length === RUN_LENGTH
    ? saved.answers.map((answer, index) => {
      if (Array.isArray(answer) && typeof answer[0] === "string") {
        return [answer[0], Object.hasOwn(TIERS, answer[1]) ? answer[1] : null];
      }
      if (typeof answer !== "string") return answer === false ? false : null;
      const question = runQuestions[index];
      // Old saves only stored the name. Name prompts used the original directory tier.
      const tier = question.category
        ? question.answers.find(([name]) => name === answer)?.[1]
        : directoryTiers.get(letterKey(answer));
      return [answer, tier ?? null];
    })
    : Array(RUN_LENGTH).fill(saved?.index > 0 ? false : null);
  questionIndex = saved?.index ?? 0;
  score = saved?.score ?? 0;
  redScore = saved?.redScore ?? 0;
  scoreElement.textContent = formatScore(score);
  redScoreElement.textContent = String(redScore).padStart(2, "0");
  finishCard.classList.add("hidden");
  introCard.classList.add("hidden");
  document.body.classList.remove("is-finished");
  document.body.classList.add("is-playing");
  showQuestion(saved?.deadline ?? null);
}

function showDailyHome() {
  homeDay = dailyDate();
  const saved = readDaily(homeDay);
  if (saved?.index >= RUN_LENGTH) {
    startRun(homeDay);
    return;
  }

  document.body.classList.remove("is-finished");
  resultsPanel.classList.add("hidden");
  finishCard.classList.add("hidden");
  introCard.classList.remove("hidden");
  scoreElement.textContent = "000";
  redScoreElement.textContent = "00";
  $("#period").textContent = "TIP OFF";
  $("#start-label").textContent = saved ? "RESUME" : "TIP OFF";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (locked) return;
  if (Date.now() >= deadline) {
    setTimer(0);
    resolveQuestion(null);
    return;
  }
  const match = matchAnswer(runQuestions[questionIndex], answerInput.value);
  if (!match || match.ambiguous) {
    const message = match?.ambiguous ? "More than one answer matches. Type the full name." : "Answer not recognized. Try again.";
    setResult(message, "", "is-miss");
    answerInput.focus({ preventScroll: true });
    answerInput.select();
    return;
  }
  resolveQuestion(match);
});

$("#start-button").addEventListener("click", () => startRun(dailyDate()));
showDailyHome();
setInterval(() => {
  if (!document.body.classList.contains("is-playing") && homeDay !== dailyDate()) showDailyHome();
}, 15000);
