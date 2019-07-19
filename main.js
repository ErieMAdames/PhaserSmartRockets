var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
const numRockets = 100;
const gameState = {};
class Rocket {
    constructor(genes) {
        this.genes = genes;
        this.curve = new Phaser.Curves.CubicBezier(genes, genes[50], genes[100], genes[149]);
        this.points = this.curve.getPoints(150);
        this.fitness = 0;
        this.crashed = false;
    }
}
function createGenes() {
    let genes = [];
    genes.push(new Phaser.Math.Vector2(400, 600));
    for (let i = 1; i<150; i++) {
        genes.push(new Phaser.Math.Vector2(Math.random() * 800, Math.random() * 600));
    }
    return genes;
}
function createRockets() {
    let rockets = [];
    for (let i = 0; i<numRockets; i++) {
        rockets.push(new Rocket(createGenes()));
    }
    return rockets;
}
function preload () {
    this.load.image('rocket', 'cohete_off.png');
    this.load.atlas('flares', 'flares.png', 'flares.json');
}

function create () {
    gameState.rocketVectors = createRockets();
    gameState.rockets = [];
    gameState.particles = [];
    this.add.circle(400, 100, 10, 0x6666ff);
    var graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(200, 200, 400, 50);
    for (let i = 0; i < numRockets; i++) {
        gameState.rockets.push(this.physics.add.sprite(400, 600, 'rocket').setScale(.1));
        gameState.particles[i] = this.add.particles('flares');
        gameState.particles[i].createEmitter({
            frame: 'blue',
            x: 0,
            y: 0,
            lifespan: 100,
            speed: { min: 400, max: 600 },
            angle: 90,
            gravityY: 300,
            scale: { start: 0.1, end: 0 },
            quantity: 1,
            blendMode: 'ADD'
        });
        gameState.rockets[i].setCollideWorldBounds(true);

    }
}
function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}
let p = 0;
function update() {
    p++;
    // if (p === 1) {
    //     graphics = this.add.graphics();
    //     for (let i = 0; i < numRockets; i++) {
    //         graphics.lineStyle(1, 0xffffff, 1);
    //         gameState.rocketVectors[i].curve.draw(graphics, 150);
    //     }
    // }
    // if (p===150) {
    //     graphics.destroy();
    // }
    if (p < 150) {
        // gameState.particles[0].x += 1;
        // gameState.particles[0].y += 1;
        for (let i = 0; i < numRockets; i++) {
            if (!gameState.rocketVectors[i].crashed) {
                let points = gameState.rocketVectors[i].points[p];
                gameState.rockets[i].x = points.x;
                gameState.rockets[i].y = points.y;
                let tempVec = new Phaser.Math.Vector2();
                let t = gameState.rocketVectors[i].curve.getUtoTmapping(p / 150);
                let tangent = gameState.rocketVectors[i].curve.getTangent(t);
                tempVec.copy(tangent).scale(32).add(points);
                gameState.rockets[i].angle = getAngle(tempVec.x, tempVec.y, points.x, points.y) - 90;
                gameState.particles[i].x = points.x;
                gameState.particles[i].y = points.y;
                gameState.particles[i].angle = getAngle(tempVec.x, tempVec.y, points.x, points.y) - 90;


            }
            if (!gameState.rocketVectors[i].crashed && insideBox(gameState.rockets[i])) {
                gameState.rocketVectors[i].fitness = fitness(gameState.rockets[i]);
                gameState.rocketVectors[i].fitness = gameState.rocketVectors[i].fitness/10;
                gameState.rocketVectors[i].crashed = true;
            }
        }
    } else {
        let max = 0;
        for (let i = 0; i < numRockets; i++) {
            if (!gameState.rocketVectors[i].crashed) {
                gameState.rocketVectors[i].fitness = fitness(gameState.rockets[i]);
                if (gameState.rocketVectors[i].fitness > max) {
                    max = gameState.rocketVectors[i].fitness;
                }
            }
        }
        for (let i = 0; i < numRockets ; i++) {
            gameState.rocketVectors[i].fitness /= max;
        }
        let matingPool = [];
        for (let i = 0; i < numRockets; i++) {
            let n = gameState.rocketVectors[i].fitness * 100;
            for (let j = 0; j < n; j++) {
                matingPool.push(gameState.rocketVectors[i]);
            }
        }
        let newRockets = [];
        for (let i = 0; i < numRockets; i++) {
            let r1 = matingPool[Math.floor(Math.random() * matingPool.length - 1)];
            let r2 = matingPool[Math.floor(Math.random() * matingPool.length - 1)];
            let r3 = matingPool[Math.floor(Math.random() * matingPool.length - 1)];
            if (r1 === undefined || r2 === undefined || r3 === undefined) {
                newRockets.push(matingPool[0]);
            } else {
                newRockets.push(mate(r1, r2, r3));
            }
        }
        gameState.rocketVectors = newRockets;
        p = 0;
        for (let i = 0; i < numRockets; i++) {
            gameState.rockets[i].x = 400;
            gameState.rockets[i].y = 600;
            gameState.rockets[i].visible = true;
        }
    }
}
function mutate(rocket) {
    let genes = rocket.genes;
    let rand = Math.floor(Math.random() * (genes.length - 1 ));
    let p1;
    let p2;
    for (let i = 1; i < genes.length; i++) {
        if (i <= rand + 10 && i >= rand - 10) {
            genes[i] = Phaser.Math.Vector2(Math.random() * 800, Math.random() * 600);
            rand = Math.floor(Math.random() * (genes.length - 1 ));
            p1 = Phaser.Math.Vector2(Math.random() * 800, Math.random() * 600);
            p2 = Phaser.Math.Vector2(Math.random() * 800, Math.random() * 600);
        }
    }
    if (p1 !== undefined && p2 !== undefined) {
        rocket.curve = new Phaser.Curves.CubicBezier(genes, p1, p2, genes[149]);
    }
}
let rateOfMutation = 10;
function mate(rocket1, rocket2, rocket3) {
    if (rocket1 === undefined || rocket2 === undefined || rocket3 === undefined) {
        return undefined;
    }
    let pos = Math.floor(Math.random() * 149);
    let pos2 = Math.floor(Math.random() * 149);
    let genes = rocket1.genes.slice(0,pos).concat(rocket2.genes.slice(pos, pos2)).concat(rocket3.genes.slice(pos2, 150));
    let rocket = new Rocket(genes);
    if ((Math.random() * 100) < rateOfMutation) {
        mutate(rocket);
    }
    return rocket;
}
function fitness(rocket) {
    return 806 - Math.floor(Math.sqrt((Math.pow(rocket.x - 400, 2)) + Math.pow(rocket.y - 100, 2)));
}
function insideBox(rocket) {
    let x = rocket.x;
    let y = rocket.y;
    return (x >= 200 && x <= 600 && y >= 200 && y <= 250)
        || (x < 0 && y < 0)
        || (x < 0 && y > 800)
        || (x > 800 && y < 0)
        || (x > 800 && y > 800);
}