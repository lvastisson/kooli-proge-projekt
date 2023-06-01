const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
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
  jumpkeyHeld: false, // kas hüppamis nuppu hoitakse all
};

const platforms = [
  { x: 0, y: 590, width: 1200, height: 10, color: "black" },
  { x: 0, y: 500, width: 400, height: 10 },
  { x: 220, y: 430, width: 120, height: 10 },
  { x: 280, y: 330, width: 100, height: 10 },
  { x: 120, y: 260, width: 100, height: 10 },
  { x: 300, y: 220, width: 80, height: 10 },
  { x: 90, y: 380, width: 80, height: 10 },
  { x: 440, y: 550, width: 40, height: 10 },
  { x: 500, y: 200, width: 70, height: 10, color: "red" },
  { x: 740, y: 200, width: 90, height: 10, color: "red" },
  { x: 1000, y: 240, width: 50, height: 10, color: "red" },
];

const levelWidth = 1200; // leveli laius
const levelHeight = 600; // leveli kõrgus

let offsetX = 0; // horisontaalne offset

// massiiv vajutatud klahvide jälgimiseks
let pressedKeys = [];

// talletab alla vajutatud nupud massiivi
function handleKeyDown(e) {
  if (!pressedKeys.includes(e.key)) {
    pressedKeys.push(e.key);
  }
}

// eemaldab vabastatud nupud massiivist
function handleKeyUp(e) {
  pressedKeys = pressedKeys.filter((key) => key !== e.key);
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

// kontrollib kahe ristküliku kattuvust/collision
function isColliding(rect1, rect2) {
  return (
    rect1.x + rect1.size > rect2.x &&
    rect1.x < rect2.x + rect2.width &&
    rect1.y + rect1.size > rect2.y &&
    rect1.y < rect2.y + rect2.height
  );
}

function handleKeys() {
  // esialgu lähtestab mängija suuna
  player.speedX = 0;

  // hüppamine
  if (
    pressedKeys.includes("ArrowUp") &&
    !player.isJumping &&
    !player.jumpkeyHeld
  ) {
    player.speedY = -player.jumpPower;
    player.isJumping = true;
    player.jumpkeyHeld = true;
  }

  // tegeleb sellega, et mängija lõpmatuseni
  // hüppama ei jääks kui nuppu all hoida
  if (pressedKeys.includes("ArrowUp")) {
    player.jumpkeyHeld = true;
  } else {
    player.jumpkeyHeld = false;
  }

  // vasakule paremale liikumine
  if (pressedKeys.includes("ArrowLeft")) {
    player.speedX = -1 * player.speedMultiplier;
  }
  if (pressedKeys.includes("ArrowRight")) {
    player.speedX = 1 * player.speedMultiplier;
  }
}

function update() {
  // tegeleb vajutatud nuppudega
  handleKeys();

  // rakendab mängija Y asukohale gravitatsiooni
  player.speedY += player.acceleration;

  // uuendab mängija asukohta vastavalt sisendsuunale
  player.x += player.speedX * player.speedMultiplier;
  player.y += player.speedY * player.speedMultiplier;

  // limiteerib mängija leveli nähtavale osale, et ei läheks out of bounds
  if (player.x < 0) {
    player.x = 0;
  }
  if (player.x + player.size > levelWidth) {
    player.x = levelWidth - player.size;
  }

  // leveli horsiontaalselt nihutamine kui mängija hakkab ekraani äärele lähedale jõudma
  if (player.x > offsetX + (canvas.width / 2 + canvas.width / 4)) {
    offsetX = Math.min(
      player.x - (canvas.width / 2 + canvas.width / 4),
      levelWidth - canvas.width
    );
  } else if (player.x < offsetX + canvas.width / 4) {
    offsetX = Math.max(player.x - canvas.width / 4, 0);
  }

  // väldib mängija läbi leveli kukkumist
  if (player.y + player.size > levelHeight) {
    player.y = levelHeight - player.size;
    player.speedY = 0;
    player.isJumping = false;
  }

  // kontrollib mängija kokkupõrget platvormidega
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    const adjustedPlatform = {
      x: platform.x,
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
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    ctx.fillStyle = platform.color || "gray";
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
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x - offsetX, player.y, player.size, player.size);

  // pärib brauserilt uut animatsioonikaadrit pildi värskendamiseks
  requestAnimationFrame(update);
}

update(); // alustab mänguga
