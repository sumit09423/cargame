let formattedTextInitialized = false; // Flag to track initialization
let formattedTEXT = "";
const backtoMenu = document.getElementById("back-to-menu");

let initText = function () {
  // fill text div with text
  let nr = 0;
  let textArray;

  if (difficulty === 0) {
    textArray = NOOB_TEXTS;
  } else if (difficulty === 1) {
    textArray = EASY_TEXTS;
  } else {
    textArray = TEXTS;
  }

  nr = Math.floor(Math.random() * textArray.length);
  textDiv.innerHTML = textArray[nr];

  TEXT = textDiv.textContent;
  index = 0;

  ih = textDiv.innerHTML;
  let token = '<span class="marked correct">';
  if (!gameState.correct) token = '<span class="marked incorrect">';
  ih = ih.replace(token, "");
  ih = ih.replace("</span>", "");
  ih =
    '<span class="marked correct">' +
    ih[index] +
    "</span>" +
    ih.substring(index + 1, ih.length);
  textDiv.innerHTML = ih;

  gameState.correct = true;

  // Initialize formattedText only once
  if (!formattedTextInitialized) {
    // Format the text and assign it to formattedTEXT
    formattedTEXT = formatText(TEXT);

    formattedTextInitialized = true;
  }
};

let initEndingScreen = function () {
  let time = car2.finishingTime / 1000; // in seconds
  let accuracy =
    100 -
    (gameState.stats.mistakes /
      (gameState.stats.characters + gameState.stats.mistakes)) *
      100; // in percents
  accuracy = Math.round(accuracy * 100) / 100;
  let GWAM = gameState.stats.characters / 5 / (time / 60); // 1 word = 5 characters
  GWAM = Math.round(GWAM * 100) / 100;

  statsPs[0].textContent = " Time: " + time + "s ";
  statsPs[1].textContent = " Accuracy: " + accuracy + "% ";
  statsPs[2].textContent = " GWAM: " + GWAM;
  // console.log( "Car1: " + car1.finishingTime );

  let token = "1st Place!";
  if (car1.finishingTime < car2.finishingTime) token = "2nd Place";
  endingDiv.children[0].textContent = token;
  endingDiv.style.display = "inline-block";
  backtoMenu.style.display = "none";
};

let countdownTimer; // Variable to store the countdown timer

let startCountdown = function () {
  const duration = 1500;
  backtoMenu.style.display = "block";
  car1.animations.drive.paused = true;

  // Reset countdown elements to their initial state
  countdownDiv.style.fontSize = "15.0rem";
  countdownDiv.style.opacity = 1.0;

  // Clear the previous countdown timer if it exists
  if (countdownTimer) {
    clearTimeout(countdownTimer);
  }

  // Show the countdown div
  countdownDiv.style.display = "inline-block";

  // Start the countdown
  countdownDiv.textContent = "3";
  countdownTimer = setTimeout(function () {
    countdownDiv.textContent = "2";

    countdownTimer = setTimeout(function () {
      countdownDiv.textContent = "1";

      countdownTimer = setTimeout(function () {
        countdownDiv.fontSize = "20.0rem";
        countdownDiv.textContent = "GO!";

        startRace();

        countdownDiv.style.opacity = 0.0;

        countdownTimer = setTimeout(function () {
          // Hide and reset properties back
          countdownDiv.style.display = "none";
          countdownDiv.style.opacity = 1.0;
          countdownDiv.fontSize = "15.0rem";
        }, 2000);
      }, duration);
    }, duration);
  }, duration);
};

let startRace = function () {
  car1.animations.drive.paused = false;
  gameState.START = true;
  gameState.typingAllowed = true;
  gameState.startingTime = Date.now(); // in miliseconds
  const fps = 30;
  car1.animations.drive.timeScale =
    DIFFICULTY_LEVELS[difficulty].ENEMY_STARTING_SPEED;
  let speedUp = setInterval(function () {
    if (
      car1.animations.drive.timeScale >=
      DIFFICULTY_LEVELS[difficulty].ENEMY_MAX_SPEED
    ) {
      clearInterval(speedUp);
      return;
    }
    car1.animations.drive.timeScale +=
      (DIFFICULTY_LEVELS[difficulty].ENEMY_MAX_SPEED -
        DIFFICULTY_LEVELS[difficulty].ENEMY_STARTING_SPEED) /
      (DIFFICULTY_LEVELS[difficulty].ENEMY_SPEEDING_UP_TIME * fps);
  }, 1000 / fps);
};

let mapAnimation = function () {
  openingCamera.animations.startingShow.play();
  primaryCamera = openingCamera;
};

let finishLoading = function () {
  requestAnimationFrame(animate);
  setTimeout(function () {
    loadingDiv.style.display = "none";
    gameState.loadingAssets = false;
    mapAnimation();
  }, 1500);
  setTimeout(function () {
    if (gameState.startAnimation) finishAnimation();
  }, openingCamera.animations.startingShow._clip.duration * 2000);
};

let finishAnimation = function () {
  openingCamera.animations.startingShow.paused = true;
  gameState.startAnimation = false;
  resetGame();
};

let resetGame = function () {
  primaryCamera = camera0;

  endingDiv.style.display = "none";
  textDiv.scrollTop = 0;

  gameState.stats.time = 0;
  gameState.stats.accuracy = 0;
  gameState.stats.GWAM = 0;
  gameState.stats.characters = 0;
  gameState.stats.mistakes = 0;
  gameState.startingTime = 0;

  car2.finishingTime = 0;
  car1.finishingTime = 0;
  car2.animations.drive.time = 0.0;
  car1.animations.drive.time = 0.0;
  car2.animations.drive.timeScale = 0.0;
  car1.animations.drive.timeScale = 0.0;
  car2.animations.drive.paused = false;
  car1.animations.drive.paused = false;
  car2.animations.drive.play();
  car1.animations.drive.play();
  car2.animationMixer.update(1 / 60);
  car1.animationMixer.update(1 / 60);
  if (shadows) updateShadowCamera();

  formattedTextInitialized = false;
  initText();
  startCountdown();
};

let checkIfFinished = function () {
  // Check times
  if (car2.animations.drive.time >= ANIMATION_END && car2.finishingTime === 0) {
    car2.finishingTime = Date.now() - gameState.startingTime;
    primaryCamera = finishCamera;
    gameState.typingAllowed = false;

    if (!car1.finishingTime) car1.finishingTime = car2.finishingTime + 0.01;
  }
  if (car1.animations.drive.time >= ANIMATION_END && car1.finishingTime === 0) {
    car1.finishingTime = Date.now() - gameState.startingTime;
  }

  if (car1.finishingTime !== 0 && car2.finishingTime !== 0) {
    setTimeout(function () {
      initEndingScreen();
    }, 2000);
    gameState.START = false;
  }
};

let checkIndexMarker = function () {
  if (formattedTEXT[index] == "#") {
    textDiv.scrollTop += 50;
  }
};

function formatText(text) {
  const maxCharsPerLine = 38;
  let currentLine = "";
  let formattedText = "";

  // Split the text into words
  const words = text.split(" ");

  for (const word of words) {
    // Check if adding the word exceeds the character limit
    if ((currentLine + word).length <= maxCharsPerLine) {
      // Add the word to the current line
      currentLine += word + " ";
    } else {
      // Start a new line with the current word
      if (formattedText.length > 0) {
        formattedText += currentLine.slice(0, -1) + "#";
      } else {
        formattedText += currentLine + "#";
      }
      currentLine = word + " ";
    }
  }

  // Add the remaining part of the last line
  formattedText += currentLine;

  return formattedText;
}

let chooseDifficultyLevel = function (difficulty_level) {
  difficulty = difficulty_level;

  if (gameState.loadingAssets == true) {
    loadingDiv.style.display = "inline-block";
    init();
  } else {
    resetGame();
  }
  mainMenuDiv.style.display = "none";
};

let goBackToMenu = function () {
  finishAnimation();
  mainMenuDiv.style.display = "inline-block";
};

if (document.fullscreenEnabled) {
  const fullscreen_button = document.createElement("button");
  fullscreen_button.setAttribute("id", "fullscreen-button");
  fullscreen_button.addEventListener("click", toggle_fullscreen);
  fullscreen_button.innerHTML = `
<svg viewBox="0 0 24 24">
<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 
7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
</svg>
<svg viewBox="0 0 24 24">
<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 
11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
</svg>
`;
  document.body.appendChild(fullscreen_button);
}

function toggle_fullscreen() {
  if (!document.fullscreenElement) {
    document.body.requestFullscreen();
    document.body.setAttribute("fullscreen", "");
  } else {
    document.exitFullscreen();
    document.body.removeAttribute("fullscreen");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  var myButton = document.getElementById("fullscreen-button");

  myButton.addEventListener("click", function () {
    // Remove focus from the button
    myButton.blur();
  });
});
