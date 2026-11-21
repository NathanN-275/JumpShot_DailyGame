const SHOT_MOTION = {
  dunk: { approach: 710, jump: 280, flight: 130, lift: 42, arc: 0 },
  jumpshot: { x: .74, y: .55, approach: 450, jump: 240, flight: 460, lift: 24, arc: .12 },
  three: { x: .59, y: .48, approach: 380, jump: 280, flight: 670, lift: 29, arc: .21 },
  half: { x: .48, y: .64, approach: 650, jump: 330, flight: 880, lift: 20, arc: .31 },
};

const RED_FINISHES = [
  { label: "LAYUP", points: 2, flight: 280, arc: .05 },
  { label: "PULL-UP", points: 2, x: .24, y: .56, flight: 460, arc: .13 },
  { label: "THREE POINTER", points: 3, x: .39, y: .55, flight: 650, arc: .22 },
];

const VERSUS_RED_FINISHES = {
  dunk: RED_FINISHES[0],
  jumpshot: RED_FINISHES[1],
  three: RED_FINISHES[2],
  half: { x: .48, y: .43, flight: 850, arc: .32 },
};

const BLUE_RETREAT_LANES = [
  { player: ".blue-one", behind: .07, lane: .06 },
  { player: ".blue-four", behind: .13, lane: .19 },
  { player: ".blue-two", behind: .11, lane: -.18 },
];

const BLUE_SPACING = {
  jumpshot: { player: ".blue-two", x: .73, y: .15 },
  three: { player: ".blue-four", x: .73, y: .78 },
  half: { player: ".blue-two", x: .63, y: .24 },
};

const court = document.querySelector(".court");
const shooter = court.querySelector(".blue-one");
const shootingArm = shooter.querySelector(".sprite-arm");
const shootingLegs = shooter.querySelector(".sprite-legs");
const heldBall = shooter.querySelector(".sprite-ball");
const flightBall = court.querySelector(".shot-ball");
const scoringRim = court.querySelector(".court-end-right .rim");
const scoringNet = scoringRim.querySelector(".net");
const redRunner = court.querySelector(".red-one");
const redHeldBall = redRunner.querySelector(".sprite-ball");
const redRebounder = court.querySelector(".red-five");
const redWing = court.querySelector(".red-four");
const redRim = court.querySelector(".court-end-left .rim");
const crowdSections = document.querySelectorAll(".crowd");
const shotAnimations = [];

function resetCourtShot() {
  court.classList.remove("is-blue-defending");
  for (const animation of shotAnimations) animation.cancel();
  shotAnimations.length = 0;
  flightBall.hidden = true;
}

function animateCourtPiece(element, frames, options) {
  const animation = element.animate(frames, options);
  shotAnimations.push(animation);
  return animation;
}

function courtSpace() {
  const view = court.getBoundingClientRect();
  return {
    width: view.width,
    height: view.height,
    center(element) {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - view.left, y: rect.top + rect.height / 2 - view.top };
    },
    position(x, y) {
      return { left: `${x / view.width * 100}%`, top: `${y / view.height * 100}%` };
    },
  };
}

function shotArc(position, from, to, height) {
  return Array.from({ length: 17 }, (_, index) => {
    const t = index / 16;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t - 4 * height * t * (1 - t);
    return position(x, y);
  });
}

function canAnimateCourt() {
  return Boolean(shooter.animate) && !matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cheerCrowd() {
  const frames = ["0%", "50%", "100%", "50%", "0%"].map((backgroundPositionY) => ({
    backgroundPositionY, easing: "steps(1, end)",
  }));
  crowdSections.forEach((section, index) => {
    animateCourtPiece(section, frames, { duration: 840, delay: index * 95 });
  });
}

function swingLegs(player, duration) {
  animateCourtPiece(player.querySelector(".sprite-legs"), [{ rotate: "-20deg" }, { rotate: "20deg" }, { rotate: "-20deg" }], {
    duration: 180, iterations: duration / 180,
  });
}

function movePlayer(player, space, x, y, duration) {
  const start = space.center(player);
  swingLegs(player, duration);
  return animateCourtPiece(player, [space.position(start.x, start.y), space.position(x, y)], {
    duration, easing: "ease-out", fill: "forwards",
  });
}

function retreatBlueDefenders(space, ballX, ballY, duration, count) {
  BLUE_RETREAT_LANES.slice(0, count).forEach(({ player, behind, lane }, index) => {
    movePlayer(court.querySelector(player), space,
      ballX + Math.max(26, space.width * behind), ballY + space.height * lane,
      duration + index * 90);
  });
}

function reactToBlueShot(tier, space, plantX, plantY, motion) {
  if (tier === "dunk") {
    movePlayer(court.querySelector(".blue-five"), space, space.width * .87, space.height * .74, 490);
    movePlayer(redRebounder, space, space.width * .91, space.height * .31, 550);
    return;
  }

  // Lift a wing to make room for the drive or give the ball handler an outlet.
  const spacing = BLUE_SPACING[tier];
  movePlayer(court.querySelector(spacing.player), space, space.width * spacing.x, space.height * spacing.y, motion.approach + 150);

  const gap = Math.max(25, space.width * .026);
  movePlayer(redRunner, space, plantX + gap, plantY - 8, motion.approach + 55);
  animateCourtPiece(redRunner, [{ translate: "0 0" }, { translate: "0 -15px" }, { translate: "0 0" }], {
    delay: motion.approach + 55, duration: motion.jump + 155, easing: "ease-out",
  });
  animateCourtPiece(redRunner.querySelector(".sprite-arm"), [{ rotate: "0deg" }, { rotate: "-115deg" }, { rotate: "0deg" }], {
    delay: motion.approach, duration: motion.jump + 275,
  });
}

async function playCourtShot(tier, { miss = false } = {}) {
  court.classList.remove("is-blue-defending");
  if (!canAnimateCourt()) return;

  const motion = SHOT_MOTION[tier];
  const space = courtSpace();
  const player = shooter.getBoundingClientRect();
  const rim = scoringRim.getBoundingClientRect();
  const scale = player.height / shooter.offsetHeight;
  const { x: basketX, y: basketY } = space.center(scoringRim);
  const dunk = tier === "dunk";
  const plantX = dunk ? basketX - 29 * scale : space.width * motion.x;
  const plantY = dunk ? basketY + 54 * scale : space.height * motion.y;
  const jumpX = plantX + (dunk ? 9 * scale : 0);
  const jumpY = plantY - motion.lift * scale;
  const { position } = space;
  const plant = position(plantX, plantY);
  const peak = position(jumpX, jumpY);
  const origin = space.center(shooter);
  const start = position(origin.x, origin.y);

  reactToBlueShot(tier, space, plantX, plantY, motion);

  animateCourtPiece(shootingLegs, [{ rotate: "-20deg" }, { rotate: "20deg" }, { rotate: "-20deg" }], {
    duration: 200, iterations: motion.approach / 200,
  });
  animateCourtPiece(heldBall, [{ translate: "0 0" }, { translate: "3px 15px" }, { translate: "0 0" }], {
    duration: 250, iterations: motion.approach / 250, easing: "ease-in-out",
  });
  await animateCourtPiece(shooter, [start, plant], {
    duration: motion.approach, easing: "ease-out", fill: "forwards",
  }).finished;

  animateCourtPiece(shootingArm, [{ rotate: "-16deg" }, { rotate: dunk ? "-146deg" : "-161deg" }], {
    duration: motion.jump, fill: "forwards",
  });
  animateCourtPiece(heldBall, [{ translate: "0 0" }, { translate: "1px -25px" }], {
    duration: motion.jump, fill: "forwards",
  });
  await animateCourtPiece(shooter, [plant, { ...position(plantX, plantY + 5 * scale), offset: .24 }, peak], {
    duration: motion.jump, easing: "ease-out", fill: "forwards",
  }).finished;

  const launch = space.center(heldBall);
  animateCourtPiece(heldBall, [{ opacity: 0 }], { duration: 1, fill: "forwards" });
  animateCourtPiece(shooter, [peak, position(jumpX, plantY)], { duration: 290, easing: "ease-in", fill: "forwards" });
  animateCourtPiece(shootingArm, [{ rotate: dunk ? "-146deg" : "-161deg" }, { rotate: "-16deg" }], {
    duration: 340, easing: "ease-in", fill: "forwards",
  });

  const targetX = miss ? basketX - rim.width / 2 : basketX;
  const targetY = miss ? basketY - 4 * scale : basketY;
  const arcHeight = Math.min(launch.y, targetY) * motion.arc * 2;
  const flight = shotArc(position, launch, { x: targetX, y: targetY }, arcHeight);

  flightBall.hidden = false;
  cheerCrowd();
  await animateCourtPiece(flightBall, flight, { duration: motion.flight, fill: "forwards" }).finished;
  if (miss) {
    const reboundX = targetX - 60 * scale;
    const reboundY = targetY + 48 * scale;
    animateCourtPiece(scoringRim, [{ rotate: "0deg" }, { rotate: "-7deg" }, { rotate: "4deg" }, { rotate: "0deg" }], { duration: 250 });
    movePlayer(redRebounder, space, reboundX + 18 * scale, reboundY - 8 * scale, 410);
    await animateCourtPiece(flightBall, [
      { ...position(targetX, targetY), easing: "ease-out" },
      { ...position(targetX - 26 * scale, targetY - 22 * scale), offset: .38, easing: "ease-in" },
      position(reboundX, reboundY),
    ], { duration: 410, fill: "forwards" }).finished;
    return;
  }
  animateCourtPiece(scoringNet, [{ scale: "1" }, { scale: ".77 1.45" }, { scale: "1" }], { duration: 260 });
  await animateCourtPiece(flightBall, [position(basketX, basketY), { ...position(basketX, basketY + 22 * scale), opacity: 0 }], {
    duration: 180, easing: "ease-in", fill: "forwards",
  }).finished;
  flightBall.hidden = true;
}

async function playRedFastBreak(finish, { defenderCount, miss = false } = {}) {
  if (!canAnimateCourt()) {
    court.classList.add("is-blue-defending");
    return;
  }

  const space = courtSpace();
  const { position, center } = space;
  const scale = redRunner.getBoundingClientRect().height / redRunner.offsetHeight;
  const redHasBall = Boolean(redHeldBall) && court.classList.contains("is-blue-defending");
  const steal = redHasBall ? null : center(heldBall);
  const basket = center(redRim);
  const handOffset = 18 * scale;
  const pickup = redHasBall ? center(redRunner) : { x: steal.x + handOffset, y: steal.y - 8 * scale };
  const layup = finish.x === undefined;
  const drive = layup
    ? { x: basket.x + 34 * scale, y: basket.y + 48 * scale }
    : { x: space.width * finish.x, y: space.height * finish.y };
  const jump = { x: drive.x - (layup ? 14 * scale : 0), y: drive.y - 30 * scale };
  const runnerAt = ({ x, y }) => position(x, y);

  if (!redHasBall) {
    animateCourtPiece(redRunner.querySelector(".sprite-arm"), [{ rotate: "0deg" }, { rotate: "-45deg" }, { rotate: "0deg" }], { duration: 390 });
    await movePlayer(redRunner, space, pickup.x, pickup.y, 310).finished;
  }
  court.classList.add("is-blue-defending");
  animateCourtPiece(redHeldBall ?? heldBall, [{ opacity: 0 }], { duration: 1, fill: "forwards" });
  flightBall.hidden = false;

  const duration = 1160;
  const sprintPath = Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    return {
      x: pickup.x + (drive.x - pickup.x) * t,
      y: pickup.y + (drive.y - pickup.y) * t + 22 * scale * Math.sin(Math.PI * t),
    };
  });
  const dribbles = sprintPath.map(({ x, y }, i) => position(x - handOffset, y + (8 + 15 * Math.abs(Math.sin(i * Math.PI / 4))) * scale));
  movePlayer(redWing, space, space.width * .28, space.height * .69, duration);
  if (defenderCount === undefined) {
    movePlayer(court.querySelector(".blue-four"), space, space.width * .45, space.height * .68, duration + 100);
  } else {
    retreatBlueDefenders(space, drive.x, drive.y, duration, defenderCount);
  }
  swingLegs(redRunner, duration);
  animateCourtPiece(redRunner, sprintPath.map(runnerAt), { duration, fill: "forwards" });
  await animateCourtPiece(flightBall, dribbles, { duration, fill: "forwards" }).finished;

  animateCourtPiece(redRunner, [runnerAt(drive), { ...runnerAt(jump), offset: .45 }, runnerAt(drive)], {
    duration: 500, fill: "forwards",
  });
  animateCourtPiece(redRunner.querySelector(".sprite-arm"), [{ rotate: "0deg" }, { rotate: "-108deg" }, { rotate: "0deg" }], {
    duration: 500,
  });
  const release = { x: jump.x - handOffset, y: jump.y - 15 * scale };
  await animateCourtPiece(flightBall, [dribbles.at(-1), runnerAt(release)], { duration: 225, fill: "forwards" }).finished;
  const target = miss ? { x: basket.x + 12 * scale, y: basket.y - 5 * scale } : basket;
  const arcHeight = Math.min(release.y, target.y) * finish.arc * 2;
  cheerCrowd();
  await animateCourtPiece(flightBall, shotArc(position, release, target, arcHeight), { duration: finish.flight, fill: "forwards" }).finished;
  if (miss) {
    await animateCourtPiece(flightBall, [
      runnerAt(target),
      { ...position(target.x + 22 * scale, target.y - 18 * scale), offset: .4 },
      { ...position(target.x + 54 * scale, target.y + 46 * scale), opacity: 0 },
    ], { duration: 380, fill: "forwards" }).finished;
    flightBall.hidden = true;
    return;
  }
  animateCourtPiece(redRim.querySelector(".net"), [{ scale: "1" }, { scale: ".77 1.45" }, { scale: "1" }], {
    duration: 260,
  });
  await animateCourtPiece(flightBall, [
    runnerAt(basket),
    { ...position(basket.x, basket.y + 20 * scale), opacity: 0 },
  ], { duration: 180, fill: "forwards" }).finished;
  flightBall.hidden = true;
}

function animateVersusTeams(seat, defenderCount) {
  court.classList.toggle("is-blue-defending", seat === 1);
  if (!canAnimateCourt()) return;
  const space = courtSpace();
  if (seat === 0) {
    movePlayer(shooter, space, space.width * .72, space.height * .47, 850);
    movePlayer(redRunner, space, space.width * .79, space.height * .46, 850);
    movePlayer(court.querySelector('.blue-three'), space, space.width * .66, space.height * .2, 900);
    movePlayer(court.querySelector('.red-three'), space, space.width * .7, space.height * .22, 900);
  } else {
    const ballX = space.width * .46;
    const ballY = space.height * .55;
    movePlayer(redRunner, space, ballX, ballY, 850);
    movePlayer(court.querySelector('.red-four'), space, space.width * .35, space.height * .74, 900);
    retreatBlueDefenders(space, ballX, ballY, 850, defenderCount);
  }
}
