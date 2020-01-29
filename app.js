const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellRows = 10;
const cellCols = 2* cellRows;
// const cellCols = 30;
const wallThickness = 3;
const w = window.innerWidth;
const h = window.innerHeight;
const cellWidth = (w / cellCols);
const cellHeight = (h / cellRows);
const engine = Engine.create();
engine.world.gravity.y = 0;
const {world} = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width: w,
        height: h
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);


// Create outside walls of canvas
const createBoundaryWalls = () => {
    const borderWidth = wallThickness*2;

    const borderTop = Bodies.rectangle(w/2, 0, w, borderWidth, { isStatic: true });
    const borderBottom = Bodies.rectangle(w/2, h, w, borderWidth, { isStatic: true });
    const borderLeft = Bodies.rectangle(0, h/2, borderWidth, h, { isStatic: true });
    const borderRight = Bodies.rectangle(w, h/2, borderWidth, h, { isStatic: true });
    
    World.add(world, [borderTop, borderBottom, borderRight, borderLeft]);
}

// Create a 2D matrix of appropriate size with all false values
const generateFalseMatrix = (rows, cols) => {
    let matrix = Array(rows)
    for (let i=0; i<rows; i++){
        matrix[i] = Array(cols).fill(false);
    }
    return matrix
}

// step through spanning tree of grid to create maze
const stepThroughCell = (row, col) => {
    // if already visited, return
    if (grid[row][col]){
        return
    }
    // mark cell as visited
    grid[row][col] = true;

    // Assemble randomly ordered list of neighbors
    let neighbors = shuffle([
        [row-1, col, 'up'], 
        [row+1, col, 'down'], 
        [row, col-1, 'left'], 
        [row, col+1, 'right']]);
    // for each neighbor...
    for (let neighbor of neighbors){
    // see if neighbor is out of bounds
        const [nextRow, nextCol, dir] = neighbor;
        if (nextRow < 0 || nextRow >= cellRows || nextCol < 0 || nextCol >= cellCols){
            continue
        }
    // if we have visited that neighbor, continue to next neighbor
        if (grid[nextRow][nextCol]){
            continue
        }
    // remove appropriate horizontal/vertical wall

        if (dir === 'up'){
            horizontals[row-1][col] = true;
            // console.log('hu',JSON.parse(JSON.stringify(horizontals)))
        } else if (dir === 'down'){
            horizontals[row][col] = true;
            // console.log('hd',JSON.parse(JSON.stringify(horizontals)))
        } else if (dir === 'left'){
            verticals[row][col-1] = true;
            // console.log('vl',JSON.parse(JSON.stringify(verticals)))
        } else if (dir === 'right'){
            verticals[row][col] = true;
            // console.log('vr',JSON.parse(JSON.stringify(verticals)))
        }
    // visit next cell
        stepThroughCell(nextRow, nextCol)
    }
}

// Use results of stepThroughCell to create maze walls
const createMazeWalls = () => {
    // Create single vertical wall based on verticals entry
    const createVerticalCellWall = (vertRow, vertCol) => {
        const px = Math.floor((w / cellCols) * (vertCol + 1));
        const py = Math.floor((h / (2*cellRows)) * (2*vertRow + 1));
        const wall = Bodies.rectangle(
            px, 
            py, 
            wallThickness, 
            Math.floor(cellHeight), 
            { isStatic: true, 
                label: 'wall',
                render: {
                    fillStyle: '#ad0707'
                }
            });
        World.add(world, wall);
    
    }
    // Create single horizontal wall based on horizontals entry
    const createHorizontalCellWall = (horRow, horCol) => {
        const px = Math.floor((w / (2*cellCols)) * (2*horCol + 1));
        // const px = Math.floor((w / cellCols) * (vertCol + 1));
        const py = Math.floor(h/ cellRows) * (horRow + 1);
        // const py = Math.floor((h / (2*cellRows)) * (2*vertRow + 1));
        const wall = Bodies.rectangle(
            px, 
            py, 
            Math.floor(cellWidth), 
            wallThickness, 
            { isStatic: true,
                label: 'wall',
                render: {
                    fillStyle: '#ad0707'
                }
            });
        World.add(world, wall);
    }

    // loop through vertical walls and render them
    for (i=0;i<verticals.length;i++){
        for (j=0;j<verticals[0].length;j++){
            if (!verticals[i][j]){
                createVerticalCellWall(i,j);
            }
        }
    }
    // loop through horizontal walls and render them
    for (i=0;i<horizontals.length;i++){
        for (j=0;j<horizontals[0].length;j++){
            if (!horizontals[i][j]){
                createHorizontalCellWall(i,j);
            }
        }
    }
}

// Create the goal object in bottom right cell
const createGoal = () => {
    const goalX = Math.floor(((cellWidth/2) * (2*cellCols - 1)));
    const goalY = Math.floor(((cellHeight/2) * (2*cellRows -1 )));
    
    const goalWidth = Math.floor(0.75*cellWidth);
    const goalHeight = Math.floor(0.75*cellHeight);
    
    const goal = Bodies.rectangle(
        goalX,
        goalY, 
        goalWidth, 
        goalHeight, 
        { isStatic: true, 
            render: {fillStyle: '#3a6e1d'}
        }
        );
    World.add(world, goal);
    return goal
}

// Create player object in top left cell
const createPlayer = () => {
    const player = Bodies.circle(
        cellWidth/2,
        cellHeight/2,
        0.5*0.5*Math.min(cellWidth, cellHeight),
        {render: {fillStyle: '#3a68e8'}}
    )
    World.add(world, player);
    return player
}

createBoundaryWalls();

let grid = generateFalseMatrix(cellRows, cellCols);
let horizontals = generateFalseMatrix(cellRows-1, cellCols);
let verticals = generateFalseMatrix(cellRows, cellCols-1);

const startRow = Math.floor(Math.random() * cellRows);
const startCol = Math.floor(Math.random() * cellCols);

stepThroughCell(startRow, startCol);

createMazeWalls();

const goal = createGoal();
const player = createPlayer();

document.addEventListener('keydown', (e) => {
    const {x,y} = player.velocity;
    const stepV = 5
    if(e.key === 'ArrowLeft'){
        Body.setVelocity(player, {x: x-stepV, y});
    } 
    if (e.key === 'ArrowUp'){
        Body.setVelocity(player, {x, y: y-stepV});
    }
    if (e.key === 'ArrowDown'){
        Body.setVelocity(player, {x, y: y+stepV});
    }
    if (e.key === 'ArrowRight'){
        Body.setVelocity(player, {x: x+stepV, y});
    }
})

// Win Conditions
Events.on(engine, 'collisionStart', (e) => {
    e.pairs.forEach((collision) => {
        if (collision.id === `A${goal.id}B${player.id}`
        || collision.id === `A${player.id}B${goal.id}`){
            console.log('goal!')
            world.gravity.y = 1;
            for (let body of world.bodies){
                if (body.label === 'wall'){
                    Body.setStatic(body, false);
                }
            }
            document.querySelector('.winner').classList.remove('hidden');
        }
    })
})

