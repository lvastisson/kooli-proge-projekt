const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const player = {
  x: 50, // esmane x asukoht
  y: 200, // esmane y asukoht
  size: 10, // mängija suurus
  speedX: 0, // hetkekiirus x-teljel
  speedY: 0, // hetkekiirus y-teljel
  jumpPower: 3, // hüppe tugevus
  speedMultiplier: 2, // kiiruse kordaja
  acceleration: 0.1, // vertikaalne
  isJumping: false, // kas mängijal on hetkel hüpe pooleli
};

const platforms = [
  { x: 0, y: 500, width: 400, height: 10 },
  { x: 220, y: 430, width: 120, height: 10 },
  { x: 90, y: 380, width: 80, height: 10 },
];

const levelWidth = 800; // leveli laius
const levelHeight = canvas.height; // leveli kõrgus

let offsetX = 0; // horisontaalne offset

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

function handleKeyDown(e) {
  if (e.key === "ArrowUp" && !player.isJumping) {
    player.speedY = -player.jumpPower;
    player.isJumping = true;
  } else if (e.key === "ArrowDown") {
    player.speedY = 1;
  } else if (e.key === "ArrowLeft") {
    player.speedX = -1;
  } else if (e.key === "ArrowRight") {
    player.speedX = 1;
  }
}

function handleKeyUp(e) {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    player.speedY = 0;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    player.speedX = 0;
  }
}

// kontrollib kahe ristküliku kattuvust/collision
function isColliding(rect1, rect2) {
  return (
    rect1.x + rect1.size > rect2.x &&
    rect1.x < rect2.x + rect2.width &&
    rect1.y + rect1.size > rect2.y &&
    rect1.y < rect2.y + rect2.height
  );
}

function update() {
  // rakendab mängija Y asukohale gravitatsiooni
  player.speedY += player.acceleration;

  // uuendab mängija asukohta vastavalt sisendsuunale
  player.x += player.speedX * player.speedMultiplier;
  player.y += player.speedY * player.speedMultiplier;

  // limiteerib mängija leveli nähtavale osale, et ei läheks out of bounds
  if (player.x < offsetX) {
    player.x = offsetX;
  }
  if (player.x + player.size > offsetX + canvas.width) {
    player.x = offsetX + canvas.width - player.size;
  }

  // leveli horsiontaalselt nihutamine kui mängija hakkab ekraani äärele lähedale jõudma
  if (player.x > offsetX + canvas.width / 2) {
    offsetX = player.x - canvas.width / 2;
  } else if (player.x < offsetX + canvas.width / 4) {
    offsetX = Math.max(player.x - canvas.width / 4, 0);
  }

  // väldib mängija läbi leveli kukkumist
  if (player.y + player.size > canvas.height) {
    player.y = canvas.height - player.size;
    player.speedY = 0;
    player.isJumping = false;
  }

  // kontrollib mängija kokkupõrget platvormidega
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    const adjustedPlatform = {
      x: platform.x - offsetX,
      y: platform.y,
      width: platform.width,
      height: platform.height,
    };

    // kokkupõrke puhul korrektuurib mängija asukohta
    if (isColliding(player, adjustedPlatform)) {
      // kontrollib ülevalt alla kokkupõrget
      if (player.speedY > 0 && player.y < adjustedPlatform.y) {
        player.y = adjustedPlatform.y - player.size;
        player.speedY = 0;
        player.isJumping = false;
      } // kontrollib alt üles kokkupõrget
      else if (player.speedY < 0 && player.y > adjustedPlatform.y) {
        player.y = adjustedPlatform.y + adjustedPlatform.height;
        player.speedY = 0;
      }
    }
  }

  // puhastab ekraani enne uue seisu joonistamist
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // joonistab platvormid vastavalt eelnevalt määratud array'le
  ctx.fillStyle = "gray";
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    const adjustedPlatform = {
      x: platform.x - offsetX,
      y: platform.y,
      width: platform.width,
      height: platform.height,
    };

    ctx.fillRect(
      adjustedPlatform.x,
      adjustedPlatform.y,
      adjustedPlatform.width,
      adjustedPlatform.height
    );
  }

  // joonistab mängija ruuduna
  ctx.fillStyle = "black";
  ctx.fillRect(player.x - offsetX, player.y, player.size, player.size);

  // pärib brauserilt uut animatsioonikaadrit pildi värskendamiseks
  requestAnimationFrame(update);
}

update(); // alustab mänguga
