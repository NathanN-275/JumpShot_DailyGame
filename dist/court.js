const SHOT_MOTION = {
  dunk: { approach: 710, jump: 280, flight: 130, lift: 42, arc: 0 },
  jumpshot: { x: .74, y: .55, approach: 450, jump: 240, flight: 460, lift: 24, arc: .12 },
  three: { x: .59, y: .48, approach: 380, jump: 280, flight: 670, lift: 29, arc: .21 },
  half: { x: .48, y: .64, approach: 650, jump: 330, flight: 880, lift: 20, arc: .31 },
};

const court = document.querySelector(".court");
const shooter = court.querySelector(".blue-one");
const shootingArm = shooter.querySelector(".sprite-arm");
const shootingLegs = shooter.querySelector(".sprite-legs");
const heldBall = shooter.querySelector(".sprite-ball");
const flightBall = court.querySelector(".shot-ball");
const scoringRim = court.querySelector(".court-end-right .rim");
const scoringNet = scoringRim.querySelector(".net");
const redRunner = court.querySelector(".red-five");
const redWing = court.querySelector(".red-four");
const redRim = court.querySelector(".court-end-left .rim");
const shotAnimations = [];

function resetCourtShot() {
  for (const animation of shotAnimations) animation.cancel();
  shotAnimations.length = 0;
  flightBall.hidden = true;
}

function animateCourtPiece(element, frames, options) {
  const animation = element.animate(frames, options);
  shotAnimations.push(animation);
  return animation;
}

async function playCourtShot(tier, { miss = false } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !shooter.animate) return;

  const motion = SHOT_MOTION[tier];
  const view = court.getBoundingClientRect();
  const player = shooter.getBoundingClientRect();
  const rim = scoringRim.getBoundingClientRect();
  const scale = player.height / shooter.offsetHeight;
  const basketX = rim.left + rim.width / 2 - view.left;
  const basketY = rim.top + rim.height / 2 - view.top;
  const dunk = tier === "dunk";
  const plantX = dunk ? basketX - 29 * scale : view.width * motion.x;
  const plantY = dunk ? basketY + 54 * scale : view.height * motion.y;
  const jumpX = plantX + (dunk ? 9 * scale : 0);
  const jumpY = plantY - motion.lift * scale;
  const position = (x, y) => ({ left: `${x / view.width * 100}%`, top: `${y / view.height * 100}%` });
  const plant = position(plantX, plantY);
  const peak = position(jumpX, jumpY);
  const start = position(player.left + player.width / 2 - view.left, player.top + player.height / 2 - view.top);

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

  const launch = heldBall.getBoundingClientRect();
  const launchX = launch.left + launch.width / 2 - view.left;
  const launchY = launch.top + launch.height / 2 - view.top;
  animateCourtPiece(heldBall, [{ opacity: 0 }], { duration: 1, fill: "forwards" });
  animateCourtPiece(shooter, [peak, position(jumpX, plantY)], { duration: 290, easing: "ease-in", fill: "forwards" });
  animateCourtPiece(shootingArm, [{ rotate: dunk ? "-146deg" : "-161deg" }, { rotate: "-16deg" }], {
    duration: 340, easing: "ease-in", fill: "forwards",
  });

  const targetX = miss ? basketX - rim.width / 2 : basketX;
  const targetY = miss ? basketY - 4 * scale : basketY;
  const arcHeight = Math.min(launchY, targetY) * motion.arc * 2;
  const flight = Array.from({ length: 17 }, (_, index) => {
    const t = index / 16;
    const x = launchX + (targetX - launchX) * t;
    const y = launchY + (targetY - launchY) * t - 4 * arcHeight * t * (1 - t);
    return position(x, y);
  });

  flightBall.hidden = false;
  await animateCourtPiece(flightBall, flight, { duration: motion.flight, fill: "forwards" }).finished;
  if (miss) {
    animateCourtPiece(scoringRim, [{ rotate: "0deg" }, { rotate: "-7deg" }, { rotate: "4deg" }, { rotate: "0deg" }], { duration: 250 });
    await animateCourtPiece(flightBall, [
      { ...position(targetX, targetY), easing: "ease-out" },
      { ...position(targetX - 26 * scale, targetY - 22 * scale), offset: .38, easing: "ease-in" },
      position(targetX - 60 * scale, targetY + 48 * scale),
    ], { duration: 410, fill: "forwards" }).finished;
    return;
  }
  animateCourtPiece(scoringNet, [{ scale: "1" }, { scale: ".77 1.45" }, { scale: "1" }], { duration: 260 });
  await animateCourtPiece(flightBall, [position(basketX, basketY), { ...position(basketX, basketY + 22 * scale), opacity: 0 }], {
    duration: 180, easing: "ease-in", fill: "forwards",
  }).finished;
  flightBall.hidden = true;
}

async function playRedFastBreak() {
  if (flightBall.hidden) return;

  const view = court.getBoundingClientRect();
  const center = (element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - view.left, y: rect.top + rect.height / 2 - view.top };
  };
  const position = (x, y) => ({ left: `${x / view.width * 100}%`, top: `${y / view.height * 100}%` });
  const scale = redRunner.getBoundingClientRect().height / redRunner.offsetHeight;
  const runnerStart = center(redRunner);
  const rebound = center(flightBall);
  const basket = center(redRim);
  const handOffset = 18 * scale;
  const pickup = { x: rebound.x + handOffset, y: rebound.y - 8 * scale };
  const drive = { x: basket.x + 34 * scale, y: basket.y + 48 * scale };
  const jump = { x: basket.x + 20 * scale, y: basket.y + 12 * scale };
  const runnerAt = ({ x, y }) => position(x, y);

  await animateCourtPiece(redRunner, [runnerAt(runnerStart), runnerAt(pickup)], {
    duration: 200, easing: "ease-out", fill: "forwards",
  }).finished;

  const duration = 1160;
  const sprintPath = Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    return {
      x: pickup.x + (drive.x - pickup.x) * t,
      y: pickup.y + (drive.y - pickup.y) * t + 22 * scale * Math.sin(Math.PI * t),
    };
  });
  const dribbles = sprintPath.map(({ x, y }, i) => position(x - handOffset, y + (8 + 15 * Math.abs(Math.sin(i * Math.PI / 4))) * scale));
  const wingStart = center(redWing);
  animateCourtPiece(redWing, [runnerAt(wingStart), position(view.width * .28, view.height * .67)], {
    duration, fill: "forwards",
  });
  for (const player of [redRunner, redWing]) {
    animateCourtPiece(player.querySelector(".sprite-legs"), [{ rotate: "-20deg" }, { rotate: "20deg" }, { rotate: "-20deg" }], {
      duration: 180, iterations: duration / 180,
    });
  }
  animateCourtPiece(redRunner, sprintPath.map(runnerAt), { duration, fill: "forwards" });
  await animateCourtPiece(flightBall, dribbles, { duration, fill: "forwards" }).finished;

  animateCourtPiece(redRunner, [runnerAt(drive), { ...runnerAt(jump), offset: .45 }, runnerAt(drive)], {
    duration: 500, fill: "forwards",
  });
  animateCourtPiece(redRim.querySelector(".net"), [{ scale: "1" }, { scale: ".77 1.45" }, { scale: "1" }], {
    delay: 360, duration: 260,
  });
  await animateCourtPiece(flightBall, [
    dribbles.at(-1),
    { ...position(jump.x - handOffset, jump.y - 15 * scale), offset: .45 },
    { ...runnerAt(basket), offset: .72 },
    { ...position(basket.x, basket.y + 20 * scale), opacity: 0 },
  ], { duration: 500, fill: "forwards" }).finished;
  flightBall.hidden = true;
}
