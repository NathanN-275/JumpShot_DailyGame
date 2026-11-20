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

async function playCourtShot(tier) {
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

  const arcHeight = Math.min(launchY, basketY) * motion.arc * 2;
  const flight = Array.from({ length: 17 }, (_, index) => {
    const t = index / 16;
    const x = launchX + (basketX - launchX) * t;
    const y = launchY + (basketY - launchY) * t - 4 * arcHeight * t * (1 - t);
    return position(x, y);
  });

  flightBall.hidden = false;
  await animateCourtPiece(flightBall, flight, { duration: motion.flight, fill: "forwards" }).finished;
  animateCourtPiece(scoringNet, [{ scale: "1" }, { scale: ".77 1.45" }, { scale: "1" }], { duration: 260 });
  await animateCourtPiece(flightBall, [position(basketX, basketY), { ...position(basketX, basketY + 22 * scale), opacity: 0 }], {
    duration: 180, easing: "ease-in", fill: "forwards",
  }).finished;
  flightBall.hidden = true;
}
