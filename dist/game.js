const RUN_LENGTH = 7;
const QUESTION_SECONDS = 30;
const BEST_SCORE_KEY = "jumpshot-best-score";
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
    hint: "Any era. A deeper cut is worth more.",
    answers: [
      ["Steph Curry", "dunk", ["Stephen Curry", "Steph", "Stephen Curry"]],
      ["LeBron James", "dunk", ["Lebron James", "LeBron"]],
      ["Klay Thompson", "dunk", ["Klay"]],
      ["Ray Allen", "dunk", ["Ray"]],
      ["Reggie Miller", "jumpshot", ["Reggie"]],
      ["Damian Lillard", "jumpshot", ["Dame Lillard", "Dame"]],
      ["Kyle Korver", "jumpshot"],
      ["J.J. Redick", "jumpshot", ["JJ Redick", "J.J Redick", "JJ"]],
      ["Steve Nash", "three"],
      ["Dell Curry", "three"],
      ["Dana Barros", "three"],
      ["Chauncey Billups", "three", ["Chauncey"]],
      ["Jason Kapono", "half"],
      ["Tim Legler", "half"],
      ["Voshon Lenard", "half"],
      ["Wesley Person", "half"],
    ],
    source: "https://www.nba.com/stats/alltime-leaders?StatCategory=FG3M",
  },
  {
    prompt: "Name an NBA player who scored 70+ points in a game.",
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
    hint: "There are ten multi-time winners in league history.",
    answers: [
      ["Michael Jordan", "dunk", ["Jordan", "MJ"]],
      ["Dwight Howard", "dunk", ["Dwight"]],
      ["Dennis Rodman", "dunk", ["Rodman"]],
      ["Rudy Gobert", "dunk", ["Gobert"]],
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
    hint: "Just three players have done it.",
    answers: [
      ["Russell Westbrook", "dunk", ["Westbrook", "Russ"]],
      ["Nikola Jokic", "jumpshot", ["Nikola Jokić", "Jokic", "Jokić"]],
      ["Oscar Robertson", "half", ["Oscar"]],
    ],
    source: "https://www.nba.com/news/nuggets-nikola-jokic-averages-triple-double-for-season",
  },
];

const $ = (selector) => document.querySelector(selector);
const form = $("#answer-form");
const answerInput = $("#answer");
const submitButton = $("#submit-button");
const scoreElement = $("#score");
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
    else { i += 1; j += 1; }
  }
  return edits + (i < left.length || j < right.length ? 1 : 0);
}

function matchAnswer(question, rawAnswer) {
  const typed = normalize(rawAnswer);
  if (!typed) return null;

  const choices = question.answers.map(([name, tier, aliases = []]) => ({
    name,
    tier,
    accepted: [name, ...aliases].map(normalize),
  }));
  const exact = choices.find((choice) => choice.accepted.includes(typed));
  if (exact) return { ...exact, corrected: false };

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
  document.body.classList.remove("anim-dunk", "anim-jumpshot", "anim-three", "anim-half", "is-miss", "is-corrected");
  $("#play-call").textContent = "";
  $("#shot-trail").style.animation = "none";
  requestAnimationFrame(() => { $("#shot-trail").style.animation = ""; });
}

function setResult(message, points = "", state = "") {
  resultStrip.classList.remove("is-good", "is-miss", "is-corrected");
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
  setTimer(QUESTION_SECONDS);
  timerId = setInterval(() => {
    setTimer(secondsLeft - 1);
    if (secondsLeft <= 0) resolveQuestion(null, "The shot clock expired. 0 points.");
  }, 1000);
}

function showQuestion() {
  if (questionIndex >= RUN_LENGTH) {
    finishRun();
    return;
  }
  clearPlayState();
  const question = runQuestions[questionIndex];
  questionNumberElement.textContent = String(questionIndex + 1).padStart(2, "0");
  $("#period").textContent = `Q${questionIndex + 1} · 30 SEC`;
  promptElement.textContent = question.prompt;
  $("#prompt-hint").textContent = question.hint;
  answerInput.value = "";
  setResult("Pick your answer. Make it count.");
  setFormEnabled(true);
  startClock();
}

function animateShot(tier) {
  const animation = { dunk: "anim-dunk", jumpshot: "anim-jumpshot", three: "anim-three", half: "anim-half" }[tier];
  const detail = TIERS[tier];
  document.body.classList.add(animation);
  $("#play-call").textContent = `${detail.label}  +${detail.points}`;
}

function resolveQuestion(match, missMessage = "") {
  if (locked) return;
  clearInterval(timerId);
  setFormEnabled(false);
  const question = runQuestions[questionIndex];
  const tier = match ? TIERS[match.tier] : null;

  if (match) {
    score += tier.points;
    scoreElement.textContent = formatScore(score);
    $("#red-score").textContent = "00";
    animateShot(match.tier);
    const correctedText = match.corrected ? `Spelling fixed to ${match.name}.` : `${match.name} is in the answer bank.`;
    setResult(`${correctedText} ${tier.rarity} · ${tier.label}`, `+${tier.points} pts`, "is-good");
    if (match.corrected) resultStrip.classList.add("is-corrected");
  } else {
    clearPlayState();
    document.body.classList.add("is-miss");
    const message = missMessage || "No match in the answer bank. 0 points.";
    setResult(message, "0", "is-miss");
  }

  questionIndex += 1;
  transitionId = setTimeout(showQuestion, 1900);
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
  questionNumberElement.textContent = "07";
  $("#period").textContent = "FINAL";
  setTimer(0);
  setResult(`Final score: ${formatScore(score)} points. Best: ${formatScore(best)}.`, "FINAL", "is-good");
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const pick = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[pick]] = [copy[pick], copy[index]];
  }
  return copy;
}

function startRun() {
  clearInterval(timerId);
  clearTimeout(transitionId);
  runQuestions = shuffle(QUESTION_BANK).slice(0, RUN_LENGTH);
  questionIndex = 0;
  score = 0;
  scoreElement.textContent = formatScore(score);
  $("#red-score").textContent = "00";
  finishCard.classList.add("hidden");
  introCard.classList.add("hidden");
  document.body.classList.remove("is-finished", "is-miss");
  document.body.classList.add("is-playing");
  showQuestion();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (locked) return;
  const match = matchAnswer(runQuestions[questionIndex], answerInput.value);
  resolveQuestion(match);
});

$("#start-button").addEventListener("click", startRun);
$("#replay-button").addEventListener("click", startRun);

const savedBest = readBestScore();
bestScoreElement.textContent = formatScore(savedBest);
setTimer(QUESTION_SECONDS);
