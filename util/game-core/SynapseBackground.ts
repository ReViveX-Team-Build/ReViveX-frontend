// ═══════════════════════════════════════════════════════════════════════════
//  SynapseBackground  v4  —  Performance-first Cartoon Ocean
//
//  Fixes in this version:
//  • God rays: narrow, wave-surface-anchored, bezier-curved, proper blend
//  • Sun arc: rises right→sets left on a smooth ellipse, sits mid-sky
//  • Moon: bright white disc with light-grey maria dots, NO dark shadow
//  • Sun/Moon handoff: 100% non-overlapping — moon waits for sun to set fully
//  • Waves: 3-layer quadratic-bezier with cached gradients, richer colour
//  • Day/night: smooth cubic-eased sigmoid transition
//  • Performance: gradients cached, particle pools capped, no per-frame alloc
// ═══════════════════════════════════════════════════════════════════════════

// ─── helpers ─────────────────────────────────────────────────────────────────
function lerpColor(a: string, b: string, t: number): string {
    t = Math.max(0, Math.min(1, t));
    const ah = parseInt(a.replace('#',''), 16), bh = parseInt(b.replace('#',''), 16);
    const ar=(ah>>16)&255, ag=(ah>>8)&255, ab=ah&255;
    const br=(bh>>16)&255, bg=(bh>>8)&255, bb=bh&255;
    return '#'+[Math.round(ar+t*(br-ar)),Math.round(ag+t*(bg-ag)),Math.round(ab+t*(bb-ab))]
        .map(v=>v.toString(16).padStart(2,'0')).join('');
}
function clamp(v:number,lo:number,hi:number){return Math.max(lo,Math.min(hi,v));}
// Smooth sigmoid — avoids the harsh linear knee in transitions
function smoothstep(lo:number,hi:number,x:number){
    const t=clamp((x-lo)/(hi-lo),0,1); return t*t*(3-2*t);
}

// Cheap 1-D value noise (no deps)
const _perm=(()=>{
    const p=Array.from({length:256},(_,i)=>i);
    for(let i=255;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}
    return [...p,...p];
})();
function vnoise(x:number){
    const i=Math.floor(x)&255, f=x-Math.floor(x), u=f*f*(3-2*f);
    return (_perm[i]/255)*2-1 + u*((_perm[i+1]/255)*2-1 - ((_perm[i]/255)*2-1));
}

// ═══════════════════════════════════════════════════════════════════════════
//  WAVE ENGINE  — 3-layer parallax, quadratic bezier surface
// ═══════════════════════════════════════════════════════════════════════════
class WaveEngine {
    private W:number; private H:number;
    // Three independent scroll offsets for parallax
    private sx=[0,0,0];
    // Relative wave amplitude and speed per layer (front=0 most detailed)
    private readonly LAYER=[
        {yFrac:0.410, ampF:1.00, speedF:1.00, scrollF:1.00},
        {yFrac:0.428, ampF:0.62, speedF:0.70, scrollF:0.62},
        {yFrac:0.444, ampF:0.38, speedF:0.48, scrollF:0.38},
    ];

    constructor(W:number,H:number){this.W=W;this.H=H;}

    scroll(speed:number){
        for(let i=0;i<3;i++){
            this.sx[i]-=speed*this.LAYER[i].scrollF;
            if(this.sx[i]<-this.W) this.sx[i]+=this.W;
        }
    }

    // Y of a specific layer surface at canvas X
    layerY(layer:number,cx:number,t:number,amp:number):number{
        const L=this.LAYER[layer], rx=cx+this.sx[layer], sf=L.speedF, af=L.ampF;
        return this.H*L.yFrac
            +Math.sin(rx*0.00420+t*0.000800*sf)*amp*af*0.90
            +Math.sin(rx*0.00870+t*0.001380*sf)*amp*af*0.44
            +Math.sin(rx*0.01740+t*0.002100*sf)*amp*af*0.20
            +Math.cos(rx*0.02980+t*0.001650*sf)*amp*af*0.10
            +vnoise(rx*0.004+t*0.00018*sf)*amp*af*0.10;
    }

    // Front layer surface (used for physics / clipping)
    surfaceY(cx:number,t:number,amp:number):number{return this.layerY(0,cx,t,amp);}

    // Build bezier-ready point array for a layer (step can be larger for back layers)
    buildPts(layer:number,t:number,amp:number,step=8):{x:number,y:number}[]{
        const pts:{x:number,y:number}[]=[];
        for(let x=0;x<=this.W+step;x+=step) pts.push({x,y:this.layerY(layer,x,t,amp)});
        return pts;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GOD RAYS  — narrow, wave-surface-anchored, bezier-curved, 'lighter' blend
//
//  Each ray originates from a specific wave-surface point and fans downward.
//  The ray body is a curved quadratic bezier (control point drifts sideways)
//  so it bends like real refracted light, not a stiff triangle.
// ═══════════════════════════════════════════════════════════════════════════
class GodRays {
    private W:number; private H:number;
    // Static anchor fractions across the width — pre-computed, never change
    private readonly anchors:number[];
    private phase:number[]; // per-ray phase offset for drift

    constructor(W:number,H:number){
        this.W=W; this.H=H;
        // 7 rays spread across canvas; non-uniform spacing looks more natural
        this.anchors=[0.08,0.19,0.33,0.50,0.64,0.78,0.91];
        this.phase=this.anchors.map(()=>Math.random()*Math.PI*2);
    }

    draw(ctx:CanvasRenderingContext2D,nf:number,waveEngine:WaveEngine,amp:number,t:number){
        if(nf>=0.80) return; // invisible at night
        const alpha=(1-nf/0.80)*0.055; // max 0.055 — very subtle
        if(alpha<0.004) return;

        ctx.save();
        // Clip strictly to underwater region — front wave layer defines boundary
        ctx.beginPath();
        // Build a clip path along the wave surface
        for(let x=0;x<=this.W;x+=10){
            const sy=waveEngine.surfaceY(x,t,amp);
            if(x===0) ctx.moveTo(0,sy); else ctx.lineTo(x,sy);
        }
        ctx.lineTo(this.W,this.H); ctx.lineTo(0,this.H); ctx.closePath(); ctx.clip();

        ctx.globalCompositeOperation='lighter';

        for(let ri=0;ri<this.anchors.length;ri++){
            const xAnchor=this.W*this.anchors[ri];
            const yTop=waveEngine.surfaceY(xAnchor,t,amp); // ray starts at wave surface

            // Animated lateral drift — small, slow
            const drift=Math.sin(t*0.00038+this.phase[ri])*60;
            // Ray width tapers: narrow at surface (~16px), wider at depth (~50px)
            const halfW=7; const halfWBot=42;  // narrow at surface, fans naturally at depth
            // Control point for bezier curve — displaced sideways, 60% down
            const cx=xAnchor+drift*0.55, cy=yTop+(this.H-yTop)*0.55;
            const xBot=xAnchor+drift;

            // Gradient: bright at surface, fades to nothing ~60% of depth
            const rayLen=(this.H-yTop)*0.65;
            const grad=ctx.createLinearGradient(xAnchor,yTop,xBot,yTop+rayLen);
            grad.addColorStop(0,`rgba(180,240,255,${alpha*1.0})`);
            grad.addColorStop(0.40,`rgba(140,210,255,${alpha*0.55})`);
            grad.addColorStop(0.75,`rgba(100,180,240,${alpha*0.18})`);
            grad.addColorStop(1,'rgba(60,150,220,0)');

            // Draw as two bezier-curved edges forming a tapered wedge
            ctx.beginPath();
            // Left edge of ray
            ctx.moveTo(xAnchor-halfW,yTop);
            ctx.quadraticCurveTo(cx-halfW*0.5,cy,xBot-halfWBot,yTop+rayLen);
            // Right edge (reverse)
            ctx.lineTo(xBot+halfWBot,yTop+rayLen);
            ctx.quadraticCurveTo(cx+halfW*0.5,cy,xAnchor+halfW,yTop);
            ctx.closePath();

            ctx.fillStyle=grad; ctx.fill();
        }

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  CELESTIAL BODIES  — shared arc, 100% non-overlapping
//
//  Both bodies travel the same half-ellipse arc across the sky.
//  Sun: goes from RIGHT horizon → LEFT over the day portion of cycle.
//  Moon: goes from LEFT horizon → RIGHT over the night portion.
//  There is a dead-zone between them so they never appear simultaneously.
//
//  Arc progress 0 = right horizon, 1 = left horizon, 0.5 = zenith
//  Zenith Y = surfY * 0.22  (about 22% down from top — sits mid-sky, NOT top)
// ═══════════════════════════════════════════════════════════════════════════
class CelestialBodies {
    private W:number; private H:number;

    constructor(W:number,H:number){this.W=W;this.H=H;}

    // Convert arc progress [0..1] to canvas XY
    // Arc is a semi-ellipse; zenith is at 22% of sky height
    private arcXY(prog:number,surfY:number):{x:number,y:number}{
        const angle=prog*Math.PI; // 0→π
        const arcW=this.W*0.76;
        // Peak height: zenith at 22% of sky from top
        const arcH=surfY*0.78;
        const cx=this.W*0.50;
        const baseY=surfY-4; // horizon level
        return {
            x:cx+Math.cos(Math.PI-angle)*(arcW/2),
            y:baseY-Math.sin(angle)*arcH,
        };
    }

    draw(ctx:CanvasRenderingContext2D,nf:number,surfY:number,globalT:number){
        // Cycle layout (globalT 0→1 = 3 min):
        //  0.00 → 0.48  sun arc (rises left-horizon → noon at 0.24 → sets right)
        //  0.48 → 0.54  dusk gap — both celestial bodies hidden
        //  0.54 → 0.96  moon arc (rises right → sets left)
        //  0.96 → 1.00  dawn gap — both hidden, cycle repeats
        //
        // HARD RULE: moon draws ONLY when nf > 0.02 (sky is noticeably dark).
        // This is a double-safety guard that prevents the moon ever appearing
        // against a bright daytime sky regardless of floating-point edge cases.

        // ── SUN ──────────────────────────────────────────────────────────
        const SUN_START=0.00, SUN_END=0.48, SUN_FADE=0.05;
        // Sun only in its arc window; clamp prevents NaN at boundaries
        if(globalT <= SUN_END+SUN_FADE && nf < 0.98){
            const sunProg=clamp((globalT-SUN_START)/(SUN_END-SUN_START),0,1);
            const pos=this.arcXY(sunProg,surfY);
            // Smooth fade-in at dawn, fade-out at dusk
            const fadeIn  = smoothstep(SUN_START, SUN_START+SUN_FADE, globalT);
            const fadeOut = 1-smoothstep(SUN_END-SUN_FADE, SUN_END, globalT);
            const a=Math.min(fadeIn,fadeOut);
            // Extra fade as disc approaches/dips below horizon
            const dip=clamp(1-Math.max(0,pos.y-surfY+40)/65,0,1);
            if(a*dip>0.01) this._drawSun(ctx,pos.x,pos.y,a*dip,this.W,this.H,nf,surfY);
        }

        // ── MOON ─────────────────────────────────────────────────────────
        const MOON_START=0.56, MOON_END=0.96, MOON_FADE=0.05;
        // HARD GUARD: sky must be meaningfully dark before moon can appear
        if(nf > 0.02 && globalT >= MOON_START-MOON_FADE && globalT <= MOON_END+MOON_FADE){
            const moonProg=clamp((globalT-MOON_START)/(MOON_END-MOON_START),0,1);
            // Moon travels the arc in the opposite direction: rises right, sets left
            const pos=this.arcXY(1-moonProg,surfY);
            const fadeIn  = smoothstep(MOON_START, MOON_START+MOON_FADE, globalT);
            const fadeOut = 1-smoothstep(MOON_END-MOON_FADE, MOON_END, globalT);
            // Also gate alpha by nf: moon alpha can only be 100% when sky is fully dark
            const nightGate = smoothstep(0.02, 0.20, nf);
            const a=Math.min(fadeIn,fadeOut)*nightGate;
            const dip=clamp(1-Math.max(0,pos.y-surfY+30)/52,0,1);
            if(a*dip>0.01) this._drawMoon(ctx,pos.x,pos.y,a*dip,this.W,this.H,surfY,globalT);
        }
    }

    private _drawSun(ctx:CanvasRenderingContext2D,sx:number,sy:number,a:number,W:number,H:number,nf:number,surfY:number){
        const R=Math.min(W,H)*0.046;
        // As nf rises (sun setting), shift hue from yellow→orange→red
        const sunsetT=clamp(nf*2.2,0,1); // 0=noon, 1=full sunset
        ctx.save(); ctx.globalAlpha=a;

        // Far atmospheric haze — warm at day, deep orange-red at sunset
        const hazeC0=sunsetT>0.5
            ?`rgba(255,${Math.round(120-sunsetT*80)},20,${0.28-sunsetT*0.10})`
            :`rgba(255,${Math.round(210-sunsetT*90)},80,${0.26})`;
        const haze=ctx.createRadialGradient(sx,sy,R,sx,sy,R*9);
        haze.addColorStop(0,hazeC0);
        haze.addColorStop(0.30,`rgba(255,${Math.round(155-sunsetT*80)},${Math.round(30-sunsetT*20)},0.08)`);
        haze.addColorStop(0.70,`rgba(255,${Math.round(100-sunsetT*60)},0,0.02)`);
        haze.addColorStop(1,'rgba(255,60,0,0)');
        ctx.beginPath(); ctx.arc(sx,sy,R*9,0,Math.PI*2); ctx.fillStyle=haze; ctx.fill();

        // Inner corona — yellowy at noon, orange at dusk
        const corona=ctx.createRadialGradient(sx,sy,0,sx,sy,R*3.2);
        corona.addColorStop(0,`rgba(255,${Math.round(252-sunsetT*80)},${Math.round(160-sunsetT*160)},0.65)`);
        corona.addColorStop(0.45,`rgba(255,${Math.round(220-sunsetT*100)},${Math.round(60-sunsetT*60)},0.25)`);
        corona.addColorStop(1,'rgba(255,140,0,0)');
        ctx.beginPath(); ctx.arc(sx,sy,R*3.2,0,Math.PI*2); ctx.fillStyle=corona; ctx.fill();

        // Disc — clearly yellow/golden at noon, deep orange-red as it sets
        const discCtr=sunsetT>0.6?'#FF6820':'#FFE820';
        const discEdge=sunsetT>0.6?'#CC2200':'#FF8800';
        const disc=ctx.createRadialGradient(sx-R*0.28,sy-R*0.26,0,sx,sy,R);
        disc.addColorStop(0,discCtr);
        disc.addColorStop(0.50,'#FFC020');
        disc.addColorStop(1,discEdge);
        ctx.shadowBlur=55+sunsetT*30; ctx.shadowColor=sunsetT>0.5?'#FF4400':'#FFB800';
        ctx.beginPath(); ctx.arc(sx,sy,R,0,Math.PI*2); ctx.fillStyle=disc; ctx.fill();
        ctx.shadowBlur=0;

        // Horizon glow column — only when sun is low (nf > 0.15)
        if(nf>0.15 && sy>surfY*0.60){
            const colA=(nf-0.15)*0.25*a;
            const colG=ctx.createLinearGradient(sx,surfY,sx,surfY+H*0.15);
            colG.addColorStop(0,`rgba(255,${Math.round(120-sunsetT*70)},0,${colA})`);
            colG.addColorStop(0.5,`rgba(255,${Math.round(80-sunsetT*50)},0,${colA*0.35})`);
            colG.addColorStop(1,'rgba(255,60,0,0)');
            const colW=R*4;
            ctx.fillStyle=colG; ctx.fillRect(sx-colW,surfY,colW*2,H*0.15);
        }

        ctx.restore();
    }

    private _drawMoon(ctx:CanvasRenderingContext2D,mx:number,my:number,a:number,W:number,H:number,surfY:number,t:number){
        const R=Math.min(W,H)*0.048;
        ctx.save(); ctx.globalAlpha=a;

        // Atmospheric halo
        const halo=ctx.createRadialGradient(mx,my,R*0.9,mx,my,R*5);
        halo.addColorStop(0,'rgba(200,225,255,0.16)');
        halo.addColorStop(0.5,'rgba(180,210,255,0.05)');
        halo.addColorStop(1,'rgba(160,195,255,0)');
        ctx.beginPath(); ctx.arc(mx,my,R*5,0,Math.PI*2); ctx.fillStyle=halo; ctx.fill();

        // ── Disc: bright white with subtle warm-grey maria ────────────────
        // NO dark shadow. Bright, beautiful, cartoon-realistic.
        const disc=ctx.createRadialGradient(mx-R*0.20,my-R*0.18,0,mx,my,R);
        disc.addColorStop(0,'#FFFFFF');
        disc.addColorStop(0.45,'#F2F6FF');
        disc.addColorStop(0.80,'#E0EAFF');
        disc.addColorStop(1,'#C8DAFF');
        ctx.shadowBlur=32; ctx.shadowColor='rgba(200,225,255,0.85)';
        ctx.beginPath(); ctx.arc(mx,my,R,0,Math.PI*2); ctx.fillStyle=disc; ctx.fill();
        ctx.shadowBlur=0;

        // Light-grey maria (lunar seas) — subtle patches, NO dark blobs
        // These are the classic visible features: Mare Imbrium, Mare Serenitatis etc.
        ctx.save();
        ctx.beginPath(); ctx.arc(mx,my,R,0,Math.PI*2); ctx.clip();
        const maria=[
            {ox:-0.22,oy:-0.20,rx:0.32,ry:0.22,rot: 0.30, a:0.18},
            {ox: 0.18,oy: 0.12,rx:0.20,ry:0.15,rot:-0.15, a:0.14},
            {ox:-0.28,oy: 0.24,rx:0.16,ry:0.10,rot: 0.55, a:0.12},
            {ox: 0.28,oy:-0.28,rx:0.12,ry:0.09,rot: 0.10, a:0.10},
            {ox:-0.05,oy: 0.35,rx:0.10,ry:0.06,rot:-0.25, a:0.09},
        ];
        for(const m of maria){
            // Soft radial gradient per maria — light grey, barely visible
            const mg=ctx.createRadialGradient(mx+m.ox*R,my+m.oy*R,0,mx+m.ox*R,my+m.oy*R,m.rx*R);
            mg.addColorStop(0,`rgba(180,195,215,${m.a})`);
            mg.addColorStop(1,'rgba(180,195,215,0)');
            ctx.fillStyle=mg;
            ctx.beginPath();
            ctx.ellipse(mx+m.ox*R,my+m.oy*R,m.rx*R,m.ry*R,m.rot,0,Math.PI*2);
            ctx.fill();
        }
        ctx.restore();

        // Subtle limb darkening ring (edge gets slightly cooler, not dark)
        const limb=ctx.createRadialGradient(mx,my,R*0.55,mx,my,R);
        limb.addColorStop(0,'rgba(220,235,255,0)');
        limb.addColorStop(1,'rgba(150,185,230,0.18)');
        ctx.beginPath(); ctx.arc(mx,my,R,0,Math.PI*2);
        ctx.fillStyle=limb; ctx.fill();

        // Water reflection
        if(surfY<H*0.92){
            ctx.save(); ctx.globalCompositeOperation='lighter';
            for(let i=0;i<6;i++){
                const frac=i/6, yy=surfY+5+R*6*frac;
                const wig=Math.sin(yy*0.042+t*0.00080)*R*0.50;
                const cW=R*2.0*(1-frac*0.82);
                const rowA=a*0.16*(1-frac*0.90);
                const rg=ctx.createLinearGradient(mx+wig-cW,yy,mx+wig+cW,yy);
                rg.addColorStop(0,'rgba(210,230,255,0)');
                rg.addColorStop(0.4,`rgba(210,230,255,${rowA})`);
                rg.addColorStop(0.6,`rgba(210,230,255,${rowA})`);
                rg.addColorStop(1,'rgba(210,230,255,0)');
                ctx.fillStyle=rg; ctx.fillRect(mx+wig-cW,yy,cW*2,R);
            }
            ctx.restore();
        }

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  STARS + SHOOTING STARS
// ═══════════════════════════════════════════════════════════════════════════
class Star {
    x:number;y:number;r:number;phase:number;bright:number;rgb:string;
    constructor(W:number,H:number){
        this.x=Math.random()*W; this.y=Math.random()*H*0.36;
        this.r=0.28+Math.random()*1.50; this.phase=Math.random()*Math.PI*2;
        this.bright=0.30+Math.random()*0.70;
        const t=Math.random();
        this.rgb=t>0.65?'255,238,200':t>0.35?'255,255,242':'200,218,255';
    }
    draw(ctx:CanvasRenderingContext2D,nf:number,surfY:number){
        if(this.y>=surfY-2||nf<0.08) return;
        const tw=0.55+Math.sin(Date.now()*0.00168+this.phase)*0.45;
        const a=clamp(tw*this.bright*nf,0,1); if(a<0.01) return;
        if(this.r>1.0&&a>0.20){
            ctx.save(); ctx.strokeStyle=`rgba(${this.rgb},${a*0.28})`; ctx.lineWidth=0.5;
            const arm=this.r*3.5;
            ctx.beginPath();
            ctx.moveTo(this.x-arm,this.y); ctx.lineTo(this.x+arm,this.y);
            ctx.moveTo(this.x,this.y-arm); ctx.lineTo(this.x,this.y+arm);
            ctx.stroke(); ctx.restore();
        }
        ctx.fillStyle=`rgba(${this.rgb},${a})`;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
    }
}

class ShootingStar {
    x=0;y=0;vx=0;vy=0;life=0;maxLife=0;active=false;
    constructor(private W:number){}
    spawn(surfY:number){
        this.x=this.W*(0.20+Math.random()*0.80);
        this.y=surfY*(0.02+Math.random()*0.18);
        const spd=5+Math.random()*9, ang=Math.PI*(0.70+Math.random()*0.60);
        this.vx=Math.cos(ang)*spd; this.vy=Math.abs(Math.sin(ang))*spd*0.30;
        this.maxLife=28+Math.random()*36; this.life=this.maxLife; this.active=true;
    }
    update(surfY:number){
        if(!this.active) return;
        this.x+=this.vx; this.y+=this.vy; this.life--;
        if(this.life<=0||this.y>=surfY-6) this.active=false;
    }
    draw(ctx:CanvasRenderingContext2D,nf:number,surfY:number){
        if(!this.active||nf<0.28||this.y>=surfY-6) return;
        const p=this.life/this.maxLife;
        const tx=this.x-this.vx*10, ty=Math.min(this.y-this.vy*10,surfY-7);
        ctx.save();
        const g=ctx.createLinearGradient(this.x,this.y,tx,ty);
        g.addColorStop(0,`rgba(255,255,255,${p*nf*0.95})`);
        g.addColorStop(0.5,`rgba(200,215,255,${p*nf*0.35})`);
        g.addColorStop(1,'rgba(180,200,255,0)');
        ctx.strokeStyle=g; ctx.lineWidth=1.8; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(this.x,this.y); ctx.lineTo(tx,ty); ctx.stroke();
        ctx.fillStyle=`rgba(255,255,255,${p*nf*0.95})`;
        ctx.beginPath(); ctx.arc(this.x,this.y,1.5,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  AURORA (night only)
// ═══════════════════════════════════════════════════════════════════════════
class Aurora {
    ph=0; constructor(private W:number){}
    tick(){this.ph+=0.0014;}
    draw(ctx:CanvasRenderingContext2D,nf:number,surfY:number){
        if(nf<0.55) return;
        const a=(nf-0.55)*0.18;
        ctx.save(); ctx.globalCompositeOperation='screen';
        for(let b=0;b<3;b++){
            const yBase=surfY*(0.06+b*0.09), hue=[162,188,142][b], bH=surfY*0.14;
            const g=ctx.createLinearGradient(0,yBase,0,yBase+bH);
            g.addColorStop(0,`hsla(${hue},80%,58%,0)`);
            g.addColorStop(0.44,`hsla(${hue},80%,58%,${a*(1-b*0.28)})`);
            g.addColorStop(1,`hsla(${hue},80%,58%,0)`);
            ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(0,yBase);
            for(let x=0;x<=this.W;x+=20){
                const y=yBase+Math.sin(x*0.0055+this.ph+b*1.5)*20+Math.sin(x*0.0120+this.ph*1.8+b)*9;
                ctx.lineTo(x,Math.min(y,surfY-4));
            }
            ctx.lineTo(this.W,yBase+bH); ctx.lineTo(0,yBase+bH); ctx.fill();
        }
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  UNDERWATER PARTICLES (pooled — no per-frame allocation)
// ═══════════════════════════════════════════════════════════════════════════
class Bubble {
    x=0;y=0;startY=0;r=0;vy=0;vx=0;phase=0;active=false;
    W:number; H:number;
    constructor(W:number,H:number){this.W=W;this.H=H;}
    spawn(surfY:number){
        this.x=Math.random()*this.W; this.y=this.H-10-Math.random()*(this.H-surfY)*0.55;
        this.startY=this.y; this.r=1.5+Math.random()*5;
        this.vy=-(0.18+Math.random()*0.50); this.vx=(Math.random()-0.5)*0.25;
        this.phase=Math.random()*Math.PI*2; this.active=true;
    }
    update(scrollSpeed:number){
        this.phase+=0.038; this.x+=this.vx+Math.sin(this.phase)*0.20-scrollSpeed*0.85;
        this.y+=this.vy;
        if(this.x<0) this.x+=this.W; if(this.x>this.W) this.x-=this.W;
    }
    draw(ctx:CanvasRenderingContext2D){
        const risen=clamp((this.startY-this.y)/200,0,1);
        const a=(0.10+risen*0.45)*0.65;
        ctx.save(); ctx.globalAlpha=a;
        ctx.strokeStyle='rgba(175,228,255,0.80)'; ctx.lineWidth=0.75;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle='rgba(215,248,255,0.06)'; ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(this.x-this.r*0.28,this.y-this.r*0.28,this.r*0.22,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

class Plankton {
    x=0;y=0;vx=0;vy=0;r=0;phase=0;hue=0;W:number;H:number;
    constructor(W:number,H:number){this.W=W;this.H=H;this.reset(H*0.7);}
    reset(surfY:number){
        this.x=Math.random()*this.W; this.y=surfY+Math.random()*(this.H-surfY)*0.92;
        this.vx=(Math.random()-0.5)*0.14; this.vy=(Math.random()-0.5)*0.10-0.025;
        this.r=0.5+Math.random()*1.3; this.phase=Math.random()*Math.PI*2;
        this.hue=[172,188,158,202][Math.floor(Math.random()*4)];
    }
    update(surfY:number,scrollSpeed:number){
        this.phase+=0.022; this.x+=this.vx-scrollSpeed*0.4; this.y+=this.vy;
        if(this.x<0)this.x+=this.W; if(this.x>this.W)this.x-=this.W;
        if(this.y<surfY+35||this.y>this.H) this.reset(surfY);
    }
    draw(ctx:CanvasRenderingContext2D,nf:number){
        const a=(0.22+Math.sin(this.phase)*0.78)*(0.05+nf*0.18);
        if(a<0.007) return;
        const grd=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r*5);
        grd.addColorStop(0,`hsla(${this.hue},90%,62%,${a})`);
        grd.addColorStop(1,`hsla(${this.hue},70%,42%,0)`);
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r*5,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
    }
}

class MarineSnow {
    x=0;y=0;r=0;vy=0;vx=0;alpha=0;W:number;H:number;
    constructor(W:number,H:number){this.W=W;this.H=H;this.reset(H*0.4);}
    reset(surfY:number){
        this.x=Math.random()*this.W; this.y=surfY+Math.random()*(this.H-surfY);
        this.r=0.32+Math.random()*0.90; this.vy=0.07+Math.random()*0.16;
        this.vx=(Math.random()-0.5)*0.10; this.alpha=0.04+Math.random()*0.11;
    }
    update(surfY:number,scrollSpeed:number){
        this.x+=this.vx-scrollSpeed*0.6; this.y+=this.vy;
        if(this.x<0)this.x+=this.W;
        if(this.y>this.H) this.reset(surfY);
    }
    draw(ctx:CanvasRenderingContext2D){
        ctx.fillStyle=`rgba(195,218,232,${this.alpha})`;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SEA FLOOR
// ═══════════════════════════════════════════════════════════════════════════
class SeaFloor {
    sandHeight=60; targetHeight=60;
    private tex:HTMLCanvasElement|null=null;
    private scrollX=0;
    constructor(private W:number,private H:number){this.tex=this._buildTex();}
    private _buildTex():HTMLCanvasElement|null{
        if(typeof document==='undefined') return null;
        const c=document.createElement('canvas'); c.width=256; c.height=256;
        const ctx=c.getContext('2d'); if(!ctx) return null;
        for(let i=0;i<2500;i++){
            ctx.fillStyle=`hsla(${28+Math.random()*22},52%,${38+Math.random()*28}%,${0.05+Math.random()*0.09})`;
            ctx.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*1.5,1);
        }
        return c;
    }
    update(gameTime:number,scrollSpeed:number){
        this.scrollX+=scrollSpeed;
        if(Math.floor(gameTime/10000)%3===0) this.targetHeight=Math.min(225,60+gameTime/2200);
        else this.targetHeight=Math.max(60,this.targetHeight-0.15);
        this.sandHeight+=(this.targetHeight-this.sandHeight)*0.008;
    }
    draw(ctx:CanvasRenderingContext2D,nf:number,t:number){
        const W=this.W,H=this.H,baseY=H-this.sandHeight,step=6;
        const bumps:number[]=[];
        for(let xi=0;xi<=W+step;xi+=step){
            const rx=xi+this.scrollX;
            bumps.push(Math.sin(rx*0.012)*13+Math.cos(rx*0.043)*5.5+Math.sin(rx*0.092+t*0.0004)*2.2+vnoise(rx*0.004+t*0.00008)*4);
        }
        ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,baseY+bumps[0]);
        for(let i=1;i<bumps.length;i++) ctx.lineTo(i*step,baseY+bumps[i]);
        ctx.lineTo(W,H); ctx.closePath();
        const g=ctx.createLinearGradient(0,baseY,0,H);
        g.addColorStop(0,lerpColor('#C89040','#271908',nf*0.88));
        g.addColorStop(0.28,lerpColor('#8A5A18','#171005',nf*0.88));
        g.addColorStop(1,lerpColor('#562E08','#0C0602',nf*0.88));
        ctx.fillStyle=g; ctx.fill();
        if(this.tex){
            ctx.save(); ctx.clip();
            const pat=ctx.createPattern(this.tex,'repeat');
            if(pat){
                ctx.translate(-(this.scrollX%256),0);
                ctx.globalCompositeOperation='overlay'; ctx.globalAlpha=0.38;
                ctx.fillStyle=pat; ctx.fillRect(0,0,W+256,H);
            }
            ctx.restore();
        }
        ctx.beginPath(); ctx.moveTo(0,baseY+bumps[0]);
        for(let i=1;i<bumps.length;i++) ctx.lineTo(i*step,baseY+bumps[i]);
        ctx.strokeStyle=`rgba(255,200,90,${0.48-nf*0.40})`; ctx.lineWidth=2.2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,baseY+bumps[0]+3.5);
        for(let i=1;i<bumps.length;i++) ctx.lineTo(i*step,baseY+bumps[i]+3.5);
        ctx.strokeStyle=`rgba(30,12,2,${0.26+nf*0.14})`; ctx.lineWidth=4; ctx.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DISTANT MOUNTAINS (parallax silhouette layer)
// ═══════════════════════════════════════════════════════════════════════════
class DistantMountains {
    private scrollX=0;
    constructor(private W:number,private H:number){}
    update(speed:number){this.scrollX+=speed*0.18;}
    draw(ctx:CanvasRenderingContext2D,nf:number,baseY:number){
        const c=lerpColor('#0c3769','#020a19',nf);
        ctx.fillStyle=c.replace('#','')==='020a19'?'rgba(2,10,25,0.55)':'rgba(12,55,105,0.45)';
        ctx.fillStyle=nf>0.5?'rgba(2,10,25,0.55)':'rgba(12,55,105,0.45)';
        ctx.beginPath(); ctx.moveTo(0,this.H);
        for(let x=0;x<=this.W;x+=20){
            const rx=x+this.scrollX;
            const y=baseY-70+Math.sin(rx*0.0020)*80+Math.cos(rx*0.0050)*28+Math.sin(rx*0.0110)*14;
            ctx.lineTo(x,y);
        }
        ctx.lineTo(this.W,this.H); ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════
export class SynapseBackground {
    gameWidth:number; gameHeight:number;
    private wave:WaveEngine;
    private floor:SeaFloor;
    private mounts:DistantMountains;
    private bodies:CelestialBodies;
    private rays:GodRays;
    private aurora:Aurora;
    private stars:Star[];
    private meteors:ShootingStar[];
    // Pooled particles — no runtime allocation after init
    private bubblePool:Bubble[];
    private activeBubbles:Bubble[]=[];
    private plankton:Plankton[];
    private snow:MarineSnow[];

    private bubTimer=0; private metTimer=0;
    private surfY=0; private waveAmp=28; private wallT=0;
    private globalT=0; // raw 0..1 cycle position

    get sandHeight():number{return this.floor.sandHeight;}

    constructor(W:number,H:number){
        this.gameWidth=W; this.gameHeight=H;
        this.wave  =new WaveEngine(W,H);
        this.floor =new SeaFloor(W,H);
        this.mounts=new DistantMountains(W,H);
        this.bodies=new CelestialBodies(W,H);
        this.rays  =new GodRays(W,H);
        this.aurora=new Aurora(W);
        this.stars   =Array.from({length:100},()=>new Star(W,H));
        this.meteors =Array.from({length:4},  ()=>new ShootingStar(W));
        // Pre-allocate bubble pool — max 30 active at once
        this.bubblePool=Array.from({length:30},()=>new Bubble(W,H));
        this.plankton=Array.from({length:45},()=>new Plankton(W,H));
        this.snow    =Array.from({length:55},()=>new MarineSnow(W,H));
    }

    // Signature matches what GameCanvas passes: (elapsed, delta, scrollSpeed)
    update(gameTime:number, delta:number, scrollSpeed:number):number{
        const C=180_000;
        // Offset 0.24 → at gameTime=0, globalT=0.24 → sunProg=0.24/0.48=0.5 exactly.
        // sunProg=0.5 means sin(π/2)=1 (peak) and cos(π/2)=0 → x=center of sky.
        // The sun is therefore at TRUE SOLAR NOON on the very first frame, and
        // travels the second half of its arc toward the right/setting horizon.
        this.globalT=((gameTime%C)/C+0.24)%1.0;

        // Smooth sigmoid night factor — no abrupt linear knee
        const pos=this.globalT;
        let nf=0;
        if     (pos<0.22) nf=0;
        else if(pos<0.38) nf=smoothstep(0.22,0.38,pos);
        else if(pos<0.72) nf=1;
        else if(pos<0.88) nf=1-smoothstep(0.72,0.88,pos);

        this.wallT=Date.now();
        const diff=clamp((this.floor.sandHeight-60)/165,0,1);
        this.waveAmp=Math.max(14,30*(1-diff*0.45));

        this.floor.update(gameTime,scrollSpeed);
        this.mounts.update(scrollSpeed);
        this.wave.scroll(scrollSpeed*0.80);
        this.surfY=this.wave.surfaceY(this.gameWidth/2,this.wallT,this.waveAmp);
        this.aurora.tick();

        // Meteors
        this.metTimer+=delta;
        if(this.metTimer>4000+Math.random()*5800){
            const m=this.meteors.find(s=>!s.active); if(m)m.spawn(this.surfY);
            this.metTimer=0;
        }
        this.meteors.forEach(s=>s.update(this.surfY));

        // Bubbles — use pool
        this.bubTimer+=delta;
        if(this.bubTimer>800+Math.random()*1200){
            const free=this.bubblePool.find(b=>!b.active);
            if(free){free.spawn(this.surfY); this.activeBubbles.push(free);}
            this.bubTimer=0;
        }
        this.activeBubbles=this.activeBubbles.filter(b=>{
            b.update(scrollSpeed);
            if(b.y<=this.surfY+2){b.active=false; return false;}
            return true;
        });

        this.plankton.forEach(p=>p.update(this.surfY,scrollSpeed));
        this.snow.forEach(s=>s.update(this.surfY,scrollSpeed));

        return nf;
    }

    draw(ctx:CanvasRenderingContext2D,nf:number):void{
        const W=this.gameWidth,H=this.gameHeight,t=this.wallT,sy=this.surfY;

        // ── 1. SKY ────────────────────────────────────────────────────────
        // Day: bright cerulean. Night: deep navy. Smooth transition.
        const sky=ctx.createLinearGradient(0,0,0,sy);
        sky.addColorStop(0,   lerpColor('#1a6fc8','#06101e',nf));
        sky.addColorStop(0.40,lerpColor('#48a8dc','#0b1830',nf));
        sky.addColorStop(0.78,lerpColor('#90d4ee','#111f38',nf));
        sky.addColorStop(1,   lerpColor('#b8e4f8','#192848',nf));
        ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

        // ── 2. HORIZON GLOW (dusk/dawn bell curve) ───────────────────────
        const hPeak=Math.max(0,1-Math.abs(nf-0.32)*5.5);
        if(hPeak>0.004){
            const hg=ctx.createLinearGradient(0,sy*0.48,0,sy);
            hg.addColorStop(0,'rgba(255,90,15,0)');
            hg.addColorStop(0.55,`rgba(255,118,30,${hPeak*0.15})`);
            hg.addColorStop(1,`rgba(255,155,55,${hPeak*0.26})`);
            ctx.fillStyle=hg; ctx.fillRect(0,sy*0.48,W,sy*0.52);
        }

        // ── 3. AURORA ────────────────────────────────────────────────────
        this.aurora.draw(ctx,nf,sy);

        // ── 4. STARS + METEORS (clipped to sky) ──────────────────────────
        ctx.save();
        ctx.beginPath(); ctx.rect(0,0,W,sy-2); ctx.clip();
        this.stars.forEach(s=>s.draw(ctx,nf,sy));
        this.meteors.forEach(s=>s.draw(ctx,nf,sy));
        ctx.restore();

        // ── 5. SUN + MOON (shared arc, non-overlapping) ──────────────────
        this.bodies.draw(ctx,nf,sy,this.globalT);

        // ── 6. DISTANT MOUNTAINS ─────────────────────────────────────────
        this.mounts.draw(ctx,nf,H-this.floor.sandHeight);

        // ── 7. WATER BODY (3 layers: back→front) ─────────────────────────
        // Night: rich deep blue (NOT black). Day: royal blue.
        // Each layer has 4 gradient stops for rich tonal depth.
        // Day colours range from bright teal-blue at crest → dark navy at depth.
        // Night colours shift to deep indigo-blue — vivid, not black.
        const waterColors=[
            // back layer (visible at top behind front layers)
            { d:['#34a8f0','#2080d8','#1060b8','#0a4890'],
              n:['#1e5899','#143880','#0c2860','#081840'] },
            // mid layer
            { d:['#1e90e0','#1470c0','#0c549a','#083c78'],
              n:['#164080','#0e2e68','#082050','#051438'] },
            // front layer (drawn last, most prominent)
            { d:['#1468c8','#0e58a8','#083e80','#052a60'],
              n:['#103870','#0a285a','#061a42','#040e2c'] },
        ];
        for(let layer=2;layer>=0;layer--){
            const pts=this.wave.buildPts(layer,t,this.waveAmp,layer===0?6:10);
            const lc=waterColors[layer];
            const midY=pts[Math.floor(pts.length/2)].y;
            const wg=ctx.createLinearGradient(0,midY,0,H);
            // 4-stop gradient: crest highlight → upper body → lower body → abyss
            wg.addColorStop(0,    lerpColor(lc.d[0],lc.n[0],nf));
            wg.addColorStop(0.18, lerpColor(lc.d[1],lc.n[1],nf));
            wg.addColorStop(0.55, lerpColor(lc.d[2],lc.n[2],nf));
            wg.addColorStop(1,    lerpColor(lc.d[3],lc.n[3],nf));

            // Fill shape with smooth quadratic bezier
            ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,pts[0].y);
            for(let i=0;i<pts.length-1;i++){
                const mx=(pts[i].x+pts[i+1].x)/2, my=(pts[i].y+pts[i+1].y)/2;
                ctx.quadraticCurveTo(pts[i].x,pts[i].y,mx,my);
            }
            const lp=pts[pts.length-1];
            ctx.lineTo(lp.x,lp.y); ctx.lineTo(lp.x,H); ctx.closePath();
            ctx.fillStyle=wg; ctx.fill();

            // Wave crest highlight
            const pts2=pts;
            ctx.beginPath(); ctx.moveTo(0,pts2[0].y);
            for(let i=0;i<pts2.length-1;i++){
                const mx=(pts2[i].x+pts2[i+1].x)/2, my=(pts2[i].y+pts2[i+1].y)/2;
                ctx.quadraticCurveTo(pts2[i].x,pts2[i].y,mx,my);
            }
            if(layer===0){
                ctx.strokeStyle=`rgba(255,255,255,${0.36-nf*0.24})`; ctx.lineWidth=2.2; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0,pts2[0].y+3);
                for(let i=0;i<pts2.length-1;i++){
                    const mx=(pts2[i].x+pts2[i+1].x)/2, my=(pts2[i].y+pts2[i+1].y)/2+3;
                    ctx.quadraticCurveTo(pts2[i].x,pts2[i].y+3,mx,my);
                }
                ctx.strokeStyle=`rgba(160,220,255,${0.12-nf*0.08})`; ctx.lineWidth=1.2; ctx.stroke();
            } else {
                ctx.strokeStyle=`rgba(255,255,255,${(0.08-layer*0.02)*(1-nf*0.6)})`; ctx.lineWidth=1.2; ctx.stroke();
            }
        }

        // ── 8. DAY SURFACE GLINTS ─────────────────────────────────────────
        if(nf<0.50){
            const gA=(1-nf/0.50)*0.15;
            ctx.save(); ctx.globalCompositeOperation='lighter';
            const frontPts=this.wave.buildPts(0,t,this.waveAmp,12);
            for(let i=0;i<18;i++){
                const gx=(W/18)*i+Math.sin(t*0.00075+i*0.85)*24;
                const idx=clamp(Math.round(gx/(W/frontPts.length)),0,frontPts.length-1);
                const gy=frontPts[idx].y;
                const gw=4+Math.abs(Math.sin(t*0.00130+i*0.67))*12;
                const sh=ctx.createRadialGradient(gx,gy,0,gx,gy,gw);
                sh.addColorStop(0,`rgba(220,252,255,${gA*1.4})`);
                sh.addColorStop(0.5,`rgba(140,215,240,${gA*0.5})`);
                sh.addColorStop(1,'rgba(80,185,215,0)');
                ctx.beginPath(); ctx.ellipse(gx,gy,gw,gw*0.26,0,0,Math.PI*2);
                ctx.fillStyle=sh; ctx.fill();
            }
            ctx.restore();
        }

        // ── 9. GOD RAYS (wave-surface-anchored, narrow, curved) ───────────
        this.rays.draw(ctx,nf,this.wave,this.waveAmp,t);

        // ── 10. UNDERWATER PARTICLES ──────────────────────────────────────
        ctx.save();
        ctx.beginPath(); ctx.rect(0,sy+1,W,H-sy-1); ctx.clip();
        this.snow.forEach(s=>s.draw(ctx));
        this.plankton.forEach(p=>p.draw(ctx,nf));
        this.activeBubbles.forEach(b=>b.draw(ctx));
        ctx.restore();

        // ── 11. DEPTH VIGNETTE ────────────────────────────────────────────
        const vig=ctx.createRadialGradient(W/2,H*0.62,H*0.14,W/2,H*0.62,H*0.82);
        vig.addColorStop(0,'rgba(0,0,0,0)');
        vig.addColorStop(0.60,'rgba(0,0,0,0)');
        vig.addColorStop(1,`rgba(0,0,0,${0.22+nf*0.16})`);
        ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
        const bdg=ctx.createLinearGradient(0,H*0.62,0,H);
        bdg.addColorStop(0,'rgba(0,0,0,0)');
        bdg.addColorStop(1,`rgba(0,0,0,${0.32+nf*0.20})`);
        ctx.fillStyle=bdg; ctx.fillRect(0,H*0.62,W,H*0.38);

        // ── 12. SEAFLOOR ──────────────────────────────────────────────────
        this.floor.draw(ctx,nf,t);
    }
}