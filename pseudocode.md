# Code Samples

## Pseudocode

Pseudocode for the recursive backtracking algorithm, assuming the grid is a 2D array of bitfields indicating which walls are open

```
func carve(GRID, CELL_X, CELL_Y)
  DIRECTIONS = shuffle [NORTH, EAST, SOUTH, WEST]
  
  for DIRECTION in DIRECTIONS do
    NEW_X = getNewCell( CELL_X, DIRECTION )
    NEW_Y = getNewCell( CELL_Y, DIRECTION )
    
    if DIRECTION is in bounds of GRID and GRID[CELL_Y][CELL_X] is empty then
      GRID[CELL_Y][CELL_X] |= DIRECTION
      GRID[NEW_Y][NEW_X] |= OPPOSITE of DIRECTION
      carve( GRID, NEW_X, NEW_Y )
    end
  end
end
```

## JavaScript

```js
let [N, E, S, W] = [1, 2, 4, 8]; // Equivalent to let N = 1; let E = 2; let S = 4; let W = 8;
let OPPOSITE = {[N]: S, [E]: W, [S]: N, [W]: E};
let DX = {[N]: 0, [E]: 1, [S]: 0, [W]: -1};
let DY = {[N]: 1, [E]: 0, [S]: -1, [W]: 0};

function carve(grid, cx, cy) {
  let dirs = shuffle( [N, E, S, W] ); // shuffle shuffles an array and returns it
  
  dirs.forEach(dir => {
    let nx = cx + DX[dir];
    let ny = cy + DY[dir];
    
    if (nx > -1 && ny > -1 && nx < grid[0].length && ny < grid.length && grid[ny][nx] === 0) {
      grid[cy][cx] |= dir;
      grid[ny][nx] |= OPPOSITE[dir];
    
      carve(grid, nx, ny);
    }
  });
}


/*
Example grid:

let grid = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0]
];

This can be done using:

let grid = Array.from(Array(height), _ => Array(width).fill(0));
*/
```
