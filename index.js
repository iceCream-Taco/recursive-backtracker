/*
Begin license text.

Copyright 2021 iceCream_Taco

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

End license text.
 */

/*

Recursive Backtracker + Iterative implementation for generating mazes

This code is meant to be a relatively simple explanation of the algorithm(s) stated above. If you just want to know how
the algorithm works, look at the carveRecursive function near the bottom of the file. You can also enter details and
then press generate to instantly generate it, or press step to step through it to see how it works in action.

This software is written with p5.js, so make sure you have the correct file (libraries/p5.min.js). You also need the
html file.

Although this code works, this is most definitely NOT the most efficient, nor the most clean implementation, and
may not even obey the conventions for JS, so just beware about using this code directly.

If you do want to optimise it, removing two directions and just storing top/bottom and right/left (N & E) directions may
reduce the generation time. You can also do this when drawing.

Most of this is learnt and taken from the source below, so go check that out too:
https://weblog.jamisbuck.org/2010/12/27/maze-generation-recursive-backtracking

 */

// TODO Implement colours

// all the changing stuff
let mazeWidthInput, mazeHeightInput, step, generate; // buttons and text boxes
let mazeWidth, mazeHeight; // maze width and height as numerical values
let maze, cellSize; // maze and cell size
let isInitialised = false // whether the maze is initialised
let isDone = true; // are we ready to generate a new maze?
let carver; // generator used for stepping through
let drawTime, genTime = 0; // draw time, generation time

// constants
const [N, E, S, W] = [1, 2, 4, 8]; // directions, each direction uses a different bit => N:0001  E:0010  S:0100  W:1000
const OPPOSITE = {[N]: S, [E]: W, [S]: N, [W]: E}; // opposites for quick lookup
const DX = {[N]: 0, [E]: 1, [S]: 0, [W]: -1}; // movement for a given direction, x-axis
const DY = {[N]: 1, [E]: 0, [S]: -1, [W]: 0}; // movement for a given direction, y-axis

function setup() {
    // setup window
    createCanvas(windowWidth, windowHeight);

    // create inputs
    mazeWidthInput = createInput();
    mazeWidthInput.position(10, 10);
    mazeWidthInput.size(100);
    mazeWidthInput.value("Maze Width");

    mazeHeightInput = createInput();
    mazeHeightInput.position(120, 10);
    mazeHeightInput.size(100);
    mazeHeightInput.value("Maze Height");

    // create buttons
    generate = createButton("Generate");
    generate.position(230, 10);
    generate.size(100);
    // initialise the maze, then choose recursive or iterative depending on the size
    generate.mousePressed(() => {
        // start timer
        let initTime = millis();

        initMaze();
        if (mazeWidth * mazeHeight < 5000) {
            // carve with random starting cell, call next to execute generator
            carveRecursive(maze, randomInt(0, mazeWidth), randomInt(0, mazeHeight)).next();
        } else {
            // same as above, but with iterative
            carveIterative(maze, randomInt(0, mazeWidth), randomInt(0, mazeHeight)).next();
        }

        // end timer
        genTime = millis() - initTime;

        // we did everything now, so redraw the maze
        redraw();
    });

    step = createButton("Step");
    step.position(340, 10);
    step.size(100);
    step.mousePressed(() => {
        // start timer
        let initTime = millis();

        // initialise if needed
        if (isDone) {
            initMaze();
            isDone = false;
            if (mazeWidth * mazeHeight < 5000) {
                carver = carveRecursive(maze, randomInt(0, mazeWidth), randomInt(0, mazeHeight), true);
            } else {
                carver = carveIterative(maze, randomInt(0, mazeWidth), randomInt(0, mazeHeight), true);
            }
        } else {
            // or call the next step and redraw
            let result = carver.next();
            redraw();

            // if we are done, set done to true so that a new maze is generated next time on click
            if (result.done) isDone = true;
        }

        // end timer
        genTime = millis() - initTime;
    });

    // other setup
    textSize(20);
    textAlign(RIGHT, TOP);
    noLoop(); // big mazes are too performance intensive to continually draw, so just redraw them when needed
}

function draw() {
    // clear screen
    background(255);

    // offset drawing by 40px down to make space for text boxes
    translate(0, 40);

    // start drawTime timer
    let initTime = millis();

    // draw maze if initialised
    if (isInitialised) {
        maze.forEach((row, y) => {
            row.forEach((cell, x) => {
                // fill square
                noStroke();
                fill(cell === 0 ? 128 : 255);
                square(x * cellSize, y * cellSize, cellSize);

                // draw walls
                stroke(0);
                if (!isOpen(cell, N)) {
                    // draw north wall (north and south are reversed as we are working from the top down)
                    line(x * cellSize, (y + 1) * cellSize, (x + 1) * cellSize, (y + 1) * cellSize);
                }
                if (!isOpen(cell, E)) {
                    // draw east wall
                    line((x + 1) * cellSize, y * cellSize, (x + 1) * cellSize, (y + 1) * cellSize);
                }
                if (!isOpen(cell, S)) {
                    // draw south wall
                    line(x * cellSize, y * cellSize, (x + 1) * cellSize, y * cellSize);
                }
                if (!isOpen(cell, W)) {
                    // draw west wall
                    line(x * cellSize, (y + 1) * cellSize, x * cellSize, (y + 1) * cellSize);
                }
            });
        });
    }

    // record draw time
    drawTime = millis() - initTime;

    // draw fps, other performance values
    stroke(0);
    fill(0);
    text(`${frameRate().toFixed(1)} fps`, width - 20, 0); // -20 offsets text outside of scrollbar
    text(`Gen time: ${genTime.toFixed(2)} ms`, width - 20, 20);
    text(`Draw time: ${drawTime.toFixed(2)} ms`, width - 20, 40);
}

function initMaze() {
    // set the maze width and height using the text boxes
    mazeWidth = Number(mazeWidthInput.value());
    mazeHeight = Number(mazeHeightInput.value());

    // initialise the maze as a 2D array of zeroes, with the correct dimensions, set correct cell size
    maze = Array.from(Array(mazeHeight), _ => Array(mazeWidth).fill(0));
    cellSize = min(width / mazeWidth, (height - 60) / mazeHeight); // the -60 accounts for the scrollbar that shows up plus the 40px offset we did earlier
    isInitialised = true;
}

function* carveRecursive(grid, cx, cy, step = false) {
    // 'carve' a wall out of the grid. This is by no means the most efficient way to do so.
    // this is the main worker function, and is usually recursive, hence the name recursive backtracking

    // first, randomise an array of directions. The constants used can be found at the top of the file
    let directions = shuffle([N, E, S, W]);

    // next, for each direction, check if its valid and unvisited, and if so, open the walls to that cell, then call the
    // same function on that cell
    for (let direction of directions) {
        // get the new cell x and y
        let nx = cx + DX[direction];
        let ny = cy + DY[direction];

        // check if valid and unvisited
        if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length && grid[ny][nx] === 0) {
            // if so, open up the walls and then carve using that cell
            grid[cy][cx] |= direction;
            grid[ny][nx] |= OPPOSITE[direction];

            if (step) { yield; }
            yield* carveRecursive(grid, nx, ny, step);
        } else if (step) {
            yield;
        }
    }
}

function* carveIterative(grid, cx, cy, step = false) {
    // iterative version of carveRecursive, used for bigger mazes

    // each 'step' gets stored in the array as the coordinates and directions to do
    let cells = [{x: cx, y: cy, directions: shuffle([N, E, S, W])}];

    // while there are still empty cells
    while (cells.length !== 0) {
        // first, check if there are any directions left for that cell
        // if not, remove it and if there are now no cells left, break
        let cell = cells[0];
        if (cell.directions.length === 0) {
            cells.shift();
            if (cells.length === 0) break;
        }

        // otherwise, get the next direction, and do the same thing as in the recursive algorithm
        let direction = cell.directions.shift();
        let nx = cell.x + DX[direction];
        let ny = cell.y + DY[direction];

        if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length && grid[ny][nx] === 0) {
            grid[cell.y][cell.x] |= direction;
            grid[ny][nx] |= OPPOSITE[direction];
            // instead of recursing, add the new cell to the front of the array
            cells.unshift({x: nx, y: ny, directions: shuffle([N, E, S, W])});
        }

        if (step) { yield; }
    }
}

// utility functions
function randomInt(min, max) {
    // generate a random integer between min and max, lower bound is inclusive, upper is exclusive
    return min + Math.floor(Math.random() * (max - min));
}

function shuffle(arr) {
    // shuffle an array and return it
    for (let i = arr.length - 1; i > 0; i--) {
        let j = randomInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function isOpen(value, direction) {
    return Boolean(value & direction);
}
