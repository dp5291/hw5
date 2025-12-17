/* File: main.js
GUI Assignment: Implementing a Bit of Scrabble with Drag-and-Drop
Dhruvkumar Patel, UMass Lowell Computer Science, Dhruvkumar_patel1@student.uml.edu
Copyright (c) 2025 by Dhruvkumar. All rights reserved. May be freely copied or
excerpted for educational purposes with credit to the author.
updated by DP on 12/17, 2025
Description: This file contains all game logic for the one Line Scrabblenassignment.
tile distribution, drag and drop functionality, real-time scoring, bonus square handling,
and game flow controls like word scoring, moving to the next word, and restarting the game.
citation:
drag and drop implemented : https://jqueryui.com/
https://jesseheines.com/~heines/91.461/91.461-2015-16f/461-assn/Scrabble_Pieces_AssociativeArray_Jesse.js

*/
"use strict";

const ScrabbleTiles = {
  "A": { value: 1,  remaining: 9 },
  "B": { value: 3,  remaining: 2 },
  "C": { value: 3,  remaining: 2 },
  "D": { value: 2,  remaining: 4 },
  "E": { value: 1,  remaining: 12 },
  "F": { value: 4,  remaining: 2 },
  "G": { value: 2,  remaining: 3 },
  "H": { value: 4,  remaining: 2 },
  "I": { value: 1,  remaining: 9 },
  "J": { value: 8,  remaining: 1 },
  "K": { value: 5,  remaining: 1 },
  "L": { value: 1,  remaining: 4 },
  "M": { value: 3,  remaining: 2 },
  "N": { value: 1,  remaining: 6 },
  "O": { value: 1,  remaining: 8 },
  "P": { value: 3,  remaining: 2 },
  "Q": { value: 10, remaining: 1 },
  "R": { value: 1,  remaining: 6 },
  "S": { value: 1,  remaining: 4 },
  "T": { value: 1,  remaining: 6 },
  "U": { value: 1,  remaining: 4 },
  "V": { value: 4,  remaining: 2 },
  "W": { value: 4,  remaining: 2 },
  "X": { value: 8,  remaining: 1 },
  "Y": { value: 4,  remaining: 2 },
  "Z": { value: 10, remaining: 1 },
  "_": { value: 0,  remaining: 2 }   // Blank tiles
};

/*Tile image helper function */
function TILE_IMG(letter) {
  const base = "graphics_data/graphics_data/Scrabble_Tiles/";
  if (letter === "_") {
    return base + "Scrabble_Tile_Blank.jpg";
  }
  return base + "Scrabble_Tile_" + letter + ".jpg";
}
  
/* Board Bonus Layout DL, DW */
const BOARD_BONUS = [
  null, null, "DW", null, null, null, "DL",
  null, "DL", null, null, "DW", null, null, null
];

const state = {
  bag: [],                     // tile bag
  rack: Array(7).fill(null),   // Player rack
  board: Array(15).fill(null), // one-line board
  totalScore: 0,
  lastWordScore: 0
};

// unique Id for each tile
let tileIdCounter = 1;

/* INITIALIZATION */

$(function () {
  buildBoardUI();
  buildRackUI();
  bindButtons();
  initializeBag();
  restartGame();
});

/* TILE BAG SETUP */

function initializeBag() {
  state.bag = [];

  for (const letter in ScrabbleTiles) {
    for (let i = 0; i < ScrabbleTiles[letter].remaining; i++) {
      state.bag.push(letter);
    }
  }

  shuffle(state.bag);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* GAME RESET LOGIC LIKE: Resets scores, clears board, refills rack */

function restartGame() {
  state.totalScore = 0;
  state.lastWordScore = 0;
  state.board.fill(null);
  state.rack.fill(null);
  initializeBag();
  refillRack();
  render();
}

/* RACK REFILL*/

function refillRack() {
  for (let i = 0; i < 7; i++) {
    if (!state.rack[i] && state.bag.length > 0) {
      const letter = state.bag.pop();
      state.rack[i] = {
        id: tileIdCounter++,
        letter,
        value: ScrabbleTiles[letter].value
      };
    }
  }
}

/* Creates droppable board squares and rack slots using Jquery UI */

function buildBoardUI() {
  $("#board").empty();
  for (let i = 0; i < 15; i++) {
    const sq = $(`<div class="square" data-i="${i}"></div>`);
    sq.droppable({
      accept: ".tile",
      hoverClass: "dropHover",
      drop: (_, ui) => dropOnBoard(i, ui.draggable)
    });
    $("#board").append(sq);
  }
}

function buildRackUI() {
  $("#rack").empty();
  for (let i = 0; i < 7; i++) {
    const slot = $(`<div class="rackSlot" data-i="${i}"></div>`);
    slot.droppable({
      accept: ".tile",
      hoverClass: "dropHover",
      drop: (_, ui) => dropOnRack(i, ui.draggable)
    });
    $("#rack").append(slot);
  }
}

/* RENDERING */

function render() {
  $("#wordScore").text(state.lastWordScore);
  $("#totalScore").text(state.totalScore);
  $("#tilesRemaining").text(state.bag.length);

  $(".rackSlot").empty();
  $(".square").empty();

  state.rack.forEach((t, i) => {
    if (t) $(".rackSlot").eq(i).append(tileImg(t, "rack", i));
  });

  state.board.forEach((t, i) => {
    if (t) $(".square").eq(i).append(tileImg(t, "board", i));
  });

  $(".tile").draggable({
    revert: "invalid",
    zIndex: 1000
  });
  
}

function tileImg(t, from, i) {
  return $("<img>", {
    class: "tile",
    src: TILE_IMG(t.letter),
    "data-from": from,
    "data-i": i
  });
}
  
  

/* DRAG & DROP HANDLERS : Moves tiles between rack and board while updating score */

function dropOnBoard(i, tile) {
  if (state.board[i]) return;
  
  const from = tile.data("from");
  const idx = tile.data("i");
  const t = removeTile(from, idx);
  
  state.board[i] = t;
  updateLiveScore();
}
  
  
function dropOnRack(i, tile) {
  if (state.rack[i]) return;
  
  const from = tile.data("from");
  const idx = tile.data("i");
  const t = removeTile(from, idx);
  
  state.rack[i] = t;
  updateLiveScore();
}
  
  

function removeTile(from, i) {
  const arr = from === "rack" ? state.rack : state.board;
  const t = arr[i];
  arr[i] = null;
  return t;
}

function scoreCurrentWord() {
  $("#errorMsg").text("");
  
  if (hasGapsOnBoard()) {
    $("#errorMsg").text("Invalid word: tiles must be contiguous (no gaps).");
    state.lastWordScore = 0;
    render();
    return;
  }
  
  state.lastWordScore = calculatePreviewScore();
  render();
}
  
  
  
function updateLiveScore() {
  state.lastWordScore = calculatePreviewScore();
  render();
}
  
  
  
function hasGapsOnBoard() {
  const occupiedIndexes = [];
  
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== null) {
      occupiedIndexes.push(i);
    }
  }
  
  if (occupiedIndexes.length <= 1) return false;
  
  const min = Math.min(...occupiedIndexes);
  const max = Math.max(...occupiedIndexes);
  
  for (let i = min; i <= max; i++) {
    if (state.board[i] === null) {
      return true; 
    }
  }
  
  return false; 
}

/* SCORING & VALIDATION : prevents gaps and applies letter/word bonuses*/

function calculatePreviewScore() {
  $("#errorMsg").text("");
  let sum = 0;
  let wordMultiplier = 1;
  
  if (hasGapsOnBoard()) {
    $("#errorMsg").text("Invalid word: tiles must be contiguous (no gaps).");
    return 0;
    }
  
  for (let i = 0; i < state.board.length; i++) {
    const tile = state.board[i];
    if (!tile) continue;
  
    let letterScore = tile.value;
  
    if (BOARD_BONUS[i] === "DL") letterScore *= 2;
    if (BOARD_BONUS[i] === "DW") wordMultiplier *= 2;
  
    sum += letterScore;
  }
  
  return sum * wordMultiplier;
}
  
  
  

/* BUTTONS HANDLERS */

function bindButtons() {
  
  $("#btnNext").on("click", function () {
    if (state.board.every(sq => sq === null)) return;
  
    if (hasGapsOnBoard()) {
      $("#errorMsg").text("Invalid word: tiles must be contiguous (no gaps).");
        return;
    }
      
    state.totalScore += state.lastWordScore;
    state.board.fill(null);
    state.lastWordScore = 0;
    refillRack();
      
    render();
    });
      
  
  $("#btnRestart").on("click", function () {
    restartGame();
  });
}
  
