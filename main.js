const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
const ctx = canvas.getContext("2d");

let debug = false;
let godmode = false;

// TODO: lisab key kombinatsiooni debug enablemiseks

// TODO: lisab sound effekte + background music vms

const playerDefaults = {
  x: 100, // esmane x asukoht
  y: 450, // esmane y asukoht
  size: 10, // mängija suurus
  speedX: 0, // hetkekiirus x-teljel
  speedY: 0, // hetkekiirus y-teljel
  jumpPower: 3, // hüppe tugevus
  speedMultiplier: 2, // kiiruse kordaja
  acceleration: 0.1, // vertikaalne
  isJumping: false, // kas mängijal on hetkel hüpe pooleli
  jumpkeyHeld: false, // kas hüppamis nuppu hoitakse all
};

let currLevel = 0;

let player = JSON.parse(JSON.stringify(playerDefaults));

const specialMeta = {
  door: {
    width: 20,
    height: 30,
  },
};

const levels = [
  {
    levelWidth: 3000,
    offsetX: 0,
    player: {
      x: 100,
      y: 450,
    },
    platforms: [
      { x: 0, y: 590, width: 3000, height: 10, color: "black" },
      { x: 50, y: 500, width: 300, height: 10 },
      { x: 220, y: 430, width: 120, height: 10 },
      { x: 280, y: 330, width: 100, height: 10 },
      { x: 120, y: 260, width: 100, height: 10 },
      { x: 300, y: 220, width: 80, height: 10 },
      { x: 90, y: 380, width: 80, height: 10 },
      { x: 440, y: 550, width: 40, height: 10 },
      { x: 500, y: 200, width: 70, height: 10, color: "red" },
      { x: 740, y: 200, width: 90, height: 10, color: "red" },
      { x: 1000, y: 240, width: 50, height: 10, color: "red" },
      { x: 1200, y: 320, width: 110, height: 10 },
      { x: 1400, y: 300, width: 100, height: 10 },
      { x: 1600, y: 350, width: 120, height: 10 },
      { x: 1820, y: 320, width: 80, height: 10 },
      { x: 2000, y: 280, width: 100, height: 10 },
      { x: 2200, y: 230, width: 70, height: 10 },
      { x: 2400, y: 250, width: 70, height: 10 },
      { x: 2600, y: 350, width: 300, height: 10, color: "#172461" },
    ],
    special: [{ x: 2740, y: 320, t: "door" }],
  },
  {
    levelWidth: 3000,
    offsetX: 0,
    player: {
      x: 200,
      y: 100,
    },
    platforms: [
      { x: 0, y: 590, width: 3000, height: 10, color: "black" },
      { x: 50, y: 520, width: 300, height: 10, color: "green" },
    ],
    special: [{ x: 2740, y: 320, t: "door" }],
  },
];

let currLevelInfo = (() => levels[currLevel])();

// iga kord võetakse muutujasse uus väärtus anonüümse funktsiooni kaudu, mida kohe jooksutatakse
let platforms = (() => levels[currLevel].platforms)();
let special = (() => levels[currLevel].special)();

let levelWidth = (() => levels[currLevel].levelWidth || 3000)(); // leveli laius
const levelHeight = 600; // leveli kõrgus

let offsetX = levels[currLevel].offsetX || 0; // horisontaalne offset

function drawTextAt({ textArr, x, y, font, fill }) {
  ctx.font = font || "20px Arial";
  ctx.fillStyle = fill || "black";

  for (let i = 0; i < textArr.length; i++) {
    const text = textArr[i];

    ctx.fillText(text, x - offsetX, y + i * 30);
  }
}

// TODO: lisab seisu (level ja player location) salvestamise + mängu reset nupp
function saveState() {
  const state = {
    debug,
    offsetX,
    currLevel,
    player,
    godmode,
  };
  localStorage.setItem("state", JSON.stringify(state));
}

function saveHandler() {
  setInterval(saveState, 200);
}

function loadState() {
  let prevState = localStorage.getItem("state");
  if (!prevState) return;

  prevState = JSON.parse(prevState);

  if (prevState.player) {
    const propertiesToRecover = ({ x, y } = prevState.player);
    player = { ...player, ...propertiesToRecover };
  }

  debug = prevState.debug || false;
  godmode = prevState.godmode || false;
  offsetX = prevState.offsetX || 0;
  currLevel = prevState.currLevel || 0;
}

// massiiv vajutatud klahvide jälgimiseks
let pressedKeys = [];
// massiiv, kuhu salvestatakse klahvid, mille funktsioon on ühe korra juba käivitatud
let heldKeys = [];

let lastPressedKey = "";

// talletab alla vajutatud nupud massiivi
function handleKeyDown(e) {
  if (!pressedKeys.includes(e.key)) {
    pressedKeys.push(e.key);
  }
  lastPressedKey = e.key;
}

// eemaldab vabastatud nupud massiivist
function handleKeyUp(e) {
  pressedKeys = pressedKeys.filter((key) => key !== e.key);
  heldKeys = heldKeys.filter((key) => key !== e.key);
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

function pressed(key) {
  if (typeof key === "string") {
    if (pressedKeys.includes(key)) {
      if (!heldKeys.includes(key)) {
        heldKeys.push(key);
      }
      return true;
    }
  } else if (typeof key === "object") {
    for (let i = 0; i < key.length; i++) {
      const el = key[i];

      if (pressedKeys.includes(el)) {
        if (!heldKeys.includes(el)) {
          heldKeys.push(el);
        }
        return true;
      }
    }
  }
  return false;
}

function held(key) {
  if (typeof key === "string") {
    return heldKeys.includes(key);
  } else if (typeof key === "object") {
    for (let i = 0; i < key.length; i++) {
      const el = key[i];
      if (heldKeys.includes(el)) return true;
    }
  }
  return false;
}

let lastPressedKeysSequence = [];
let copyOfLastPressedKey = "";

function handleKeyCombinations() {
  if (lastPressedKey !== copyOfLastPressedKey) {
    lastPressedKeysSequence.push(lastPressedKey);
    if (lastPressedKeysSequence.length > 20) {
      lastPressedKeysSequence.splice(0, lastPressedKeysSequence.length - 20);
    }

    const keySequenceStr = lastPressedKeysSequence.join("");
    if (keySequenceStr.endsWith(atob("YW1vZ3Vz"))) {
      godmode = !godmode;
    }
    if (keySequenceStr.endsWith(atob("ZGVidWc="))) {
      debug = !debug;
    }

    copyOfLastPressedKey = lastPressedKey;
  }
}

function handleKeys() {
  handleKeyCombinations();

  // esialgu lähtestab mängija suuna
  player.speedX = 0;

  // hüppamine
  if (
    (!held(["ArrowUp", "w", " "]) &&
      pressed(["ArrowUp", "w", " "]) &&
      !player.isJumping) ||
    (godmode && pressed(["ArrowUp", "w", " "]))
  ) {
    player.speedY = -player.jumpPower;
    player.isJumping = true;
  }

  // vasakule paremale liikumine
  if (pressed(["ArrowLeft", "a"])) {
    player.speedX = -1 * player.speedMultiplier;
  }
  if (pressed(["ArrowRight", "d"])) {
    player.speedX = 1 * player.speedMultiplier;
  }

  if (pressed("p")) {
    clearInterval(saveState);
    localStorage.removeItem("state");
    location.reload();
  }
}

function refreshLevelData() {
  platforms = (() => levels[currLevel].platforms)();
  special = (() => levels[currLevel].special)();
  levelWidth = (() => levels[currLevel].levelWidth || 3000)();
}

function handleNextLevel() {
  currLevel++;
  offsetX = currLevelInfo.offsetX;
  player = { ...player, ...currLevelInfo.player };

  refreshLevelData();
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
      Math.max(levelWidth - canvas.width, 0)
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

  // tegeleb spetsiaalsete elementide funktsionaalsusega
  for (let i = 0; i < special.length; i++) {
    const el = special[i];

    const handleDoor = () => {
      if (isColliding(player, { ...el, ...specialMeta.door })) {
        drawTextAt({
          x: el.x - 100,
          y: el.y - 50,
          textArr: ["Vajuta 'E'", "et minna järgmisele levelile"],
        });

        if (!held("e") && pressed("e")) {
          handleNextLevel();
        }
      }
    };

    switch (el.t) {
      case "door":
        handleDoor();
        break;

      default:
        break;
    }
  }

  // joonistab platvormid vastavalt eelnevalt määratud array'le
  for (let i = 0; i < platforms.length; i++) {
    const plat = platforms[i];
    ctx.fillStyle = plat.color || "gray";
    const adjPlat = {
      x: plat.x - offsetX,
      y: plat.y,
      width: plat.width,
      height: plat.height,
    };

    ctx.fillRect(adjPlat.x, adjPlat.y, adjPlat.width, adjPlat.height);

    // debug funktsionaalsus lisainfo kuvamiseks
    if (debug) {
      ctx.font = "12px Arial";
      ctx.fillStyle = "black";
      ctx.fillText(
        `[${i}] X:${plat.x} Y:${plat.y} W:${adjPlat.width}`,
        adjPlat.x,
        adjPlat.y
      );
    }
  }

  // joonistab spetsiaalsed elemendid
  for (let i = 0; i < special.length; i++) {
    const el = special[i];

    const renderDoor = () => {
      ctx.fillStyle = "green";
      ctx.fillRect(el.x - offsetX, el.y, 20, 30);
      ctx.fillStyle = "black";
      ctx.fillRect(el.x - offsetX + 12, el.y + 14, 5, 2);
    };

    switch (el.t) {
      case "door":
        renderDoor();
        break;

      default:
        break;
    }
  }

  // joonistab mängija ruuduna
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x - offsetX, player.y, player.size, player.size);

  const instructionTexts = [
    "Liiguta mängijat vasakule-paremale nooltega",
    "Hüppa üles noolega või tühikuga",
    "Või klassikaline WASD",
  ];

  const instructionTexts2 = [
    "Mäng salvestab automaatselt sinu viimase state'i",
    "Mängu lähtestamiseks vajuta 'P' tähte",
  ];

  // joonista õpetuse tekst
  drawTextAt({ x: 10, y: 30, textArr: instructionTexts });
  drawTextAt({ x: 600, y: 30, textArr: instructionTexts2 });
  drawTextAt({
    x: 10,
    y: 650,
    textArr: [`Level ${currLevel + 1}`],
    font: "48px arial",
    fill: `rgb(${currLevel * 32}, ${currLevel * 20}, ${currLevel * 48})`,
  });

  // pärib brauserilt uut animatsioonikaadrit pildi värskendamiseks
  requestAnimationFrame(update);
}

function startGame() {
  // laeb eelmise state'i, kui eksisteerib
  loadState();

  refreshLevelData();

  // perioodiliselt salvestab mängu
  saveHandler();

  // alustab update tsükli
  update();
}

// alustab mänguga
startGame();
