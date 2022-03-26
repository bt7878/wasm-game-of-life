import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg.wasm";

const CELL_SIZE = 10;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const universe = Universe.new();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error(
    "Could not find game-of-life-canvas of type HTMLCanvasElement"
  );
}

canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext("2d");

if (ctx === null) {
  throw new Error("Failed to get rendering context");
}

let animationID: number | null = null;

const isPaused = () => {
  return animationID === null;
};

const playPauseButton = document.getElementById("play-pause");
const clearButton = document.getElementById("clear");

if (playPauseButton === null) {
  throw new Error("Could not find play-pause button");
}

if (clearButton === null) {
  throw new Error("Could not find clear button");
}

const play = () => {
  playPauseButton.textContent = "⏸";
  renderLoop();
};

const pause = () => {
  if (animationID !== null) {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animationID);
    animationID = null;
  }
};

playPauseButton.addEventListener("click", (_) => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

clearButton.addEventListener("click", (_) => {
  universe.clear();
  drawGrid();
  drawCells();
});

const renderLoop = () => {
  universe.tick();

  drawGrid();
  drawCells();

  animationID = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const getIndex = (row: number, column: number) => {
  return row * width + column;
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  ctx.beginPath();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);

      ctx.fillStyle = cells[idx] === Cell.Dead ? DEAD_COLOR : ALIVE_COLOR;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

canvas.addEventListener("click", (event) => {
  const boundingRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;
  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;
  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  universe.toggle_cell(row, col);
  drawGrid();
  drawCells();
});

drawGrid();
drawCells();
play();
