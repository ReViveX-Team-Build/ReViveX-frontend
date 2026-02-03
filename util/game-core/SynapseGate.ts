export class SynapseGate {
    x: number;
    y: number;
    width: number = 60;
    height: number = 60;
    type:"top" | "bottom";
    label: string;
    isCorrect: boolean;
    markedForDeletion: boolean = false;

    color: string;

    constructor(gameWidth: number, y: number, type: "top" | "bottom", label: string, isCorrect: boolean) {
        this.x = gameWidth;
        this.y = y;
        this.type = type;
        this.label = label;
        this.isCorrect = isCorrect;

        //Green box for correct, red box for incorrect
        this.color = isCorrect? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)";

}
update(speed: number) {
        this.x -= speed;
        // Mark for deletion if it goes off screen
        if (this.x + this.width < 0) this.markedForDeletion = true;
}

draw(ctx: CanvasRenderingContext2D){
    //GREYBOX DRAWING
    ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw Border
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);


        //DRAW TEXT (THE COGNITIVE PART)
        ctx.fillStyle = "white";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.label, this.x + this.width/2, this.y + this.height/2 + 8);
    }
}
