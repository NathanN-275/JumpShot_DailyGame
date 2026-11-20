const RUN_LENGTH = 7;
const QUESTION_SECONDS = 30;
const BEST_SCORE_KEY = "jumpshot-best-score";
const DAILY_KEY = "jumpshot-day-";
const DAILY_TZ = "America/New_York";
const dailyCalendar = new Intl.DateTimeFormat("en", { timeZone: DAILY_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const TIERS = {
  dunk: { label: "DUNK", rarity: "Common", points: 10 },
  jumpshot: { label: "JUMPSHOT", rarity: "Uncommon", points: 50 },
  three: { label: "THREE POINTER", rarity: "Epic", points: 100 },
  half: { label: "HALF-COURT SHOT", rarity: "Super niche", points: 200 },
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

const questionsByPrompt = new Map([...NAME_QUESTIONS, ...QUESTION_BANK, ...EXTRA_HISTORY_QUESTIONS].map((question) => [question.prompt, question]));

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

let runQuestions = [];
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
  const saved = { day: gameDay, index: nextIndex, deadline: nextDeadline, score, redScore, prompts: runQuestions.map(({ prompt }) => prompt) };
  lastDailySave = saved;
  try { localStorage.setItem(DAILY_KEY + gameDay, JSON.stringify(saved)); } catch { /* Storage can be disabled in a private window. */ }
}

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function distanceAtMostOne(left, right) {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > 1) return 2;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return 2;
    if (left.length > right.length) i += 1;
    else if (right.length > left.length) j += 1;
    else if (left[i] === right[j + 1] && left[i + 1] === right[j]) {
      i += 2;
      j += 2;
    } else {
      i += 1;
      j += 1;
    }
  }
  return edits + (i < left.length || j < right.length ? 1 : 0);
}

function matchAnswer(question, rawAnswer) {
  const typed = normalize(rawAnswer);
  if (!typed) return null;

  const choices = question.answers.map(([name, tier, aliases = []]) => {
    const key = letterKey(name);
    const sharedAliases = question.team ? [] : aliasesByPlayer.get(key) ?? [];
    return { name, tier, accepted: [name, ...aliases, ...sharedAliases].map(normalize) };
  });
  const exact = choices.find((choice) => choice.accepted.includes(typed));
  if (exact) return { ...exact, corrected: false };

  if (!question.team) {
    const key = letterKey(typed);
    if (LAST_NAME_KEYS.has(key)) return null;
    const matchingLastNames = choices.filter(({ name }) => {
      const last = LAST_NAME_KEYS.get(letterKey(name)) ?? letterKey(name.split(" ").at(-1));
      return last === key;
    });
    if (matchingLastNames.length > 1) return { ambiguous: true };
    if (matchingLastNames.length === 1) return { ...matchingLastNames[0], corrected: false };
  }
  if (typed.length < 5) return null;
  const near = choices.filter((choice) => choice.accepted.some((alias) => distanceAtMostOne(typed, alias) === 1));
  const unique = new Map(near.map((choice) => [choice.name, choice]));
  if (unique.size !== 1) return null;
  return { ...unique.values().next().value, corrected: true };
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
  saveDaily(questionIndex + 1, null);
  if (match) {
    await playCourtShot(match.tier);
    scoreElement.textContent = formatScore(score);
    document.body.classList.add("shot-made");
    $("#play-call").textContent = `${tier.label} +${tier.points}`;
    const correctedText = match.corrected ? `Spelling fixed to ${match.name}.` : `${match.name} is in the answer bank.`;
    setResult(`${correctedText} ${tier.rarity} · ${tier.label}`, `+${tier.points} pts`, "is-good");
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
}

function dailyQuestions(day) {
  let seed = Math.imul(Number(day.replaceAll("-", "")), 0x9e3779b1) >>> 0;
  function shuffled(questions) {
    const copy = [...questions];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const pick = Math.floor(seed / 4294967296 * (index + 1));
      [copy[index], copy[pick]] = [copy[pick], copy[index]];
    }
    return copy;
  }

  const starters = shuffled(NAME_QUESTIONS).slice(0, 2);
  const categories = new Set();
  const history = shuffled([...QUESTION_BANK, ...EXTRA_HISTORY_QUESTIONS]).filter((question) => {
    const category = question.category ?? question.prompt;
    if (categories.has(category)) return false;
    categories.add(category);
    return true;
  });
  return [...starters, ...history.slice(0, RUN_LENGTH - starters.length)];
}

function startRun(day) {
  clearInterval(timerId);
  clearTimeout(transitionId);
  gameDay = day;
  homeDay = gameDay;
  const saved = readDaily(gameDay);
  const savedQuestions = saved?.prompts?.map((prompt) => questionsByPrompt.get(prompt));
  runQuestions = savedQuestions?.length === RUN_LENGTH && savedQuestions.every(Boolean) ? savedQuestions : dailyQuestions(gameDay);
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
    score = saved.score;
    redScore = saved.redScore;
    finishRun();
    return;
  }

  document.body.classList.remove("is-finished");
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
    const message = match?.ambiguous ? "More than one player matches. Add a first name." : "Answer not recognized. Try again.";
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
