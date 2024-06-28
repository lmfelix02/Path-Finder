const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Define the grid size and cell size
const cellSize = 40;
const rows = Math.floor(canvas.height / cellSize);
const cols = Math.floor(canvas.width / cellSize);

const goal = { x: cols - 2, y: 1 };
const initialDronePosition = { x: 1, y: rows - 2 };
let drone = { ...initialDronePosition };

let obstacles = [];
let movingObstacles = [];
let path = [];
let traveledPath = [];
let interval;
let moveInterval;
let isDrawing = false;
let droneColor = 'blue';
let obstacleColor = 'black';
let movingObstacleColor = 'red';
let pathSpeed = 100;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

function startDrawing(event) {
    isDrawing = true;
    addObstacle(event);
}

function draw(event) {
    if (isDrawing) {
        addObstacle(event);
    }
}

function stopDrawing() {
    isDrawing = false;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw goal
    ctx.fillStyle = 'green';
    ctx.fillRect(goal.x * cellSize, goal.y * cellSize, cellSize, cellSize);

    // Draw obstacles
    ctx.fillStyle = obstacleColor;
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x * cellSize, obstacle.y * cellSize, cellSize, cellSize);
    });

    // Draw moving obstacles
    ctx.fillStyle = movingObstacleColor;
    movingObstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x * cellSize, obstacle.y * cellSize, cellSize, cellSize);
    });

    // Draw traveled path
    ctx.fillStyle = 'yellow';
    traveledPath.forEach(step => {
        ctx.fillRect(step.x * cellSize, step.y * cellSize, cellSize, cellSize);
    });

    // Draw drone
    ctx.fillStyle = droneColor;
    ctx.fillRect(drone.x * cellSize, drone.y * cellSize, cellSize, cellSize);
}

function isValid(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows &&
        !obstacles.some(obs => obs.x === x && obs.y === y) &&
        !movingObstacles.some(obs => obs.x === x && obs.y === y);
}

function findPath() {
    let openSet = [];
    let closedSet = [];
    let start = { x: drone.x, y: drone.y, g: 0, h: heuristic(drone, goal), f: 0, parent: null };
    start.f = start.g + start.h;
    openSet.push(start);

    while (openSet.length > 0) {
        let current = openSet.reduce((a, b) => (a.f < b.f ? a : b));

        if (current.x === goal.x && current.y === goal.y) {
            let path = [];
            let temp = current;
            while (temp) {
                path.push(temp);
                temp = temp.parent;
            }
            return path.reverse();
        }

        openSet = openSet.filter(node => node !== current);
        closedSet.push(current);

        let neighbors = getNeighbors(current);
        for (let neighbor of neighbors) {
            if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) continue;

            let tentative_g = current.g + 1;
            let existingNode = openSet.find(node => node.x === neighbor.x && node.y === neighbor.y);

            if (!existingNode || tentative_g < existingNode.g) {
                neighbor.g = tentative_g;
                neighbor.h = heuristic(neighbor, goal);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = current;

                if (!existingNode) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return null;
}

function getNeighbors(node) {
    let neighbors = [];
    let directions = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 }
    ];
    for (let direction of directions) {
        let nx = node.x + direction.x;
        let ny = node.y + direction.y;
        if (isValid(nx, ny)) {
            neighbors.push({ x: nx, y: ny });
        }
    }
    return neighbors;
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function moveDrone() {
    if (path.length > 0) {
        let step = path.shift();
        traveledPath.push(step);
        drone.x = step.x;
        drone.y = step.y;

        if (isCollision(drone)) {
            alert("Drone collided with an obstacle! Restarting...");
            clearIntervals();
            resetDrone();
            return;
        }

        drawGrid();

        let futureObstacles = movingObstacles.map(obs => ({
            x: obs.x,
            y: obs.y + obs.direction
        }));

        let collisionPredicted = futureObstacles.some(obs => obs.x === drone.x && obs.y === drone.y);

        if (collisionPredicted) {
            path = findPath();
        }

        setTimeout(moveDrone, pathSpeed);
    } else {
        alert("Drone reached the goal!");
        clearIntervals();
    }
}

function isCollision(drone) {
    return obstacles.some(obs => obs.x === drone.x && obs.y === drone.y) ||
           movingObstacles.some(obs => obs.x === drone.x && obs.y === drone.y);
}

function clearIntervals() {
    clearInterval(interval);
    clearInterval(moveInterval);
    moveInterval = null;
}

function resetDrone() {
    drone = { ...initialDronePosition };
    traveledPath = [];
    drawGrid();
}

function randomizeObstacles() {
    clearIntervals();
    obstacles = [];
    movingObstacles = [];
    const maxObstacles = Math.floor((rows * cols) / 4);
    for (let i = 0; i < maxObstacles; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * cols);
            y = Math.floor(Math.random() * rows);
        } while ((x === initialDronePosition.x && y === initialDronePosition.y) || (x === goal.x && y === goal.y) || obstacles.some(obs => obs.x === x && obs.y === y));
        obstacles.push({ x, y });
    }
    drone = { ...initialDronePosition };
    traveledPath = [];
    path = findPath();
    drawGrid();
}

function startMovement() {
    clearIntervals();
    startMovingObstacles();
    path = findPath();
    traveledPath = [];
    if (path) {
        moveDrone();
    } else {
        alert("No possible solutions");
    }
}

function clearObstacles() {
    clearIntervals();
    obstacles = [];
    movingObstacles = [];
    drone = { ...initialDronePosition };
    traveledPath = [];
    path = [];
    drawGrid();
}

function addObstacle(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellSize);
    const y = Math.floor((event.clientY - rect.top) / cellSize);
    if (isValid(x, y) && !(x === initialDronePosition.x && y === goal.y) && !(x === goal.x && y === goal.y)) {
        if (!obstacles.some(obs => obs.x === x && obs.y === y)) {
            obstacles.push({ x, y });
            drawGrid();
        }
    }
}

function createMovingObstacles() {
    clearIntervals();
    obstacles = [];
    movingObstacles = [];
    const row = Math.floor(rows / 2);
    const numObstacles = 5;
    const spacing = Math.floor(cols / (numObstacles + 1));
    for (let i = 1; i <= numObstacles; i++) {
        let x = i * spacing;
        movingObstacles.push({ x, y: row, direction: 1 });
    }
    drone = { ...initialDronePosition };
    traveledPath = [];
    path = findPath();
    drawGrid();
    startMovingObstacles();
}

function startMovingObstacles() {
    if (moveInterval) return;
    moveInterval = setInterval(() => {
        movingObstacles.forEach(obstacle => {
            obstacle.y += obstacle.direction;
            if (obstacle.y <= 0 || obstacle.y >= rows - 1) {
                obstacle.direction *= -1;
            }
        });
        drawGrid();
    }, 100);
}

function resetDronePosition() {
    clearIntervals();
    drone = { ...initialDronePosition };
    traveledPath = [];
    drawGrid();
}

drawGrid();
