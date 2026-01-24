export class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // Position: Start slightly to the left, middle height
        this.x = 100;
        this.y = gameHeight / 2;
        
        // Visuals
        this.radius = 30; 
        this.image = new Image();
        this.image.src = "/images/fish.png"; 

        // Physics: "Rhythmic Pumping" Mechanics
        this.velocity = 0;
        this.weight = 0.15;      // Light gravity for floaty feel
        this.buoyancy = -2.0;    // Strong burst for swimming up
        this.maxUpwardSpeed = -6; 

        // State Management
        this.isDead = false;
        this.deathReason = "";  
        this.status = "swimming"; 
        
        // Safety Timers (prevent instant death at start)
        this.airTime = 0;       
        this.floorTime = 0;     
        this.maxTime = 5000;    
    }
}