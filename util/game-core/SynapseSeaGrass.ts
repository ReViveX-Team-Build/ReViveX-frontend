interface GrassBlade {
    x: number;
    baseX: number;
    height: number;
    width: number;
    swaySpeed: number;
    swayOffset: number;
    lean: number;
    depth: number; // depth layer (parallax + color)
}

interface GrassCluster {
    x: number;
    blades: GrassBlade[];
    baseWidth: number;
}

export class SeaGrass {
    gameWidth: number;
    gameHeight: number;
    clusters: GrassCluster[] = [];

    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        const CLUSTER_COUNT = 8;

        for (let i = 0; i < CLUSTER_COUNT; i++) {
            const clusterX = Math.random() * gameWidth;
            const bladeCount = 6 + Math.floor(Math.random() * 6);

            const blades: GrassBlade[] = [];

            for (let j = 0; j < bladeCount; j++) {
                blades.push({
                    baseX: clusterX + (Math.random() * 40 - 20),
                    x: clusterX,
                    height: 120 + Math.random() * 140,
                    width: 10 + Math.random() * 6,
                    swaySpeed: 0.0015 + Math.random() * 0.002,
                    swayOffset: Math.random() * Math.PI * 2,
                    lean: 0,
                    depth: Math.random() // for color & parallax
                });
            }

            this.clusters.push({
                x: clusterX,
                blades,
                baseWidth: 50 + Math.random() * 40
            });
        }
    }

    update(playerX: number, playerY: number, speed: number): void {
        this.clusters.forEach(cluster => {
            cluster.x -= 2;

            if (cluster.x < -100) {
                cluster.x = this.gameWidth + 100;
            }

            cluster.blades.forEach(blade => {
                blade.x = cluster.x + (blade.baseX - cluster.x);

                const dist = playerX - blade.x;
                const nearBottom = playerY > this.gameHeight - blade.height - 40;

                if (Math.abs(dist) < 80 && nearBottom) {
                    blade.lean = Math.max(-50, Math.min(50, blade.lean - dist * 0.25));
                } else {
                    blade.lean *= 0.88;
                }
            });
        });
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const time = Date.now();

        this.clusters.forEach(cluster => {
            /* === SHARED ROOT BASE === */
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cluster.x - cluster.baseWidth, this.gameHeight);
            ctx.quadraticCurveTo(
                cluster.x,
                this.gameHeight - 20,
                cluster.x + cluster.baseWidth,
                this.gameHeight
            );
            ctx.closePath();

            ctx.fillStyle = "rgba(40, 120, 90, 0.35)";
            ctx.fill();
            ctx.restore();

            /* === BLADES === */
            cluster.blades.forEach(blade => {
                const sway =
                    Math.sin(time * blade.swaySpeed + blade.swayOffset) *
                    (12 + blade.depth * 10);

                const tipX = blade.x + sway + blade.lean;
                const tipY = this.gameHeight - blade.height;

                const gradient = ctx.createLinearGradient(
                    blade.x,
                    this.gameHeight,
                    tipX,
                    tipY
                );

                gradient.addColorStop(
                    0,
                    `rgba(30, ${100 + blade.depth * 50}, 80, 0.25)`
                );
                gradient.addColorStop(
                    1,
                    `rgba(80, ${180 + blade.depth * 40}, 140, 0.95)`
                );

                ctx.fillStyle = gradient;
                ctx.beginPath();

                ctx.moveTo(blade.x - blade.width * 0.5, this.gameHeight);

                ctx.quadraticCurveTo(
                    blade.x + blade.lean * 0.6,
                    this.gameHeight - blade.height * 0.5,
                    tipX,
                    tipY
                );

                ctx.quadraticCurveTo(
                    blade.x + blade.lean * 0.4,
                    this.gameHeight - blade.height * 0.5,
                    blade.x + blade.width * 0.5,
                    this.gameHeight
                );

                ctx.fill();
            });
        });
    }
}
