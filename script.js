const canvas = document.getElementById('can');
const ctx = canvas.getContext('2d');
const unit = 10;

//convenience class
//works with anything that has {x,y}
class vec2{
    static add(v,w){
        return {x: v.x+w.x, y: v.y+w.y};
    }
    static sub(v,w){
        return {x: v.x-w.x, y: v.y-w.y};
    }
    static scaleWith(v,c){
        return {x: v.x*c, y: v.y*c};
    }
    static dot(v,w){
        return v.x*w.x + v.y*w.y;
    }
    static mag(v){
        return Math.sqrt(v.x**2 + v.y**2);
    }
}
class PLANET{
    constructor(Pos,Store,visual){
        this.position = Pos;
        this.storage = Store;
		this.visualData  = visual;
        PLANET.planets.push(this);
    }
    static planets = [];
    debugDraw(){
        ctx.beginPath();
        ctx.arc(this.position.x,this.position.y,this.position.r,0,Math.PI*2,false);
        ctx.closePath();
        ctx.stroke();
    }
}
class SIGNAL{
    constructor(Pos,Dir,Probe,Payload,Freq){
        this.position=Pos;
        this.direction=Dir;
        this.isProbe=Probe;
        this.payload=Payload;
        this.frequency=Freq;
        this.strength=1;
        SIGNAL.signals.push(this);
    }
    static signals=[];
    static sendSignal(Pos,Dir,Width,Density,Probe,Payload,Freq){
        for (let i = 0; i <= 2*Width; i+=2*Width/(Density-1))new SIGNAL(Pos,Dir-Width+i,Probe,Payload,Freq);
    }
	static debugUpdate(){
		ctx.clearRect(0,0,canvas.width, canvas.height);
		SIGNAL.signals.forEach(signal=>{signal.update();signal.debugDrawPath()});
	}
    debugDrawPath(){
        ctx.beginPath();
        ctx.translate(this.position.x,this.position.y);
        ctx.moveTo(0,0);
        ctx.lineTo(unit*Math.cos(this.direction), unit*Math.sin(this.direction));
        ctx.resetTransform();
        ctx.closePath();
        ctx.stroke();
    }
    update(){
        let coll = PLANET.planets.find(p=>intersect(p,this));
        if(coll === undefined){
            //no collision
			ctx.strokeStyle = "black";
        }
        else{
           //collided with coll
			ctx.strokeStyle = "red";
			if(this.isProbe){
				SIGNAL.sendSignal(this.position, (this.direction+Math.PI)%(Math.PI*2), 0, 1, false, coll.visualData, this.frequency);
			}
			SIGNAL.signals[SIGNAL.signals.indexOf(this)] = SIGNAL.signals[SIGNAL.signals.length-1];
			SIGNAL.signals.pop();
        }
		this.position = {x:this.position.x+unit*Math.cos(this.direction), y:this.position.y+unit*Math.sin(this.direction)};
    }
}

for(i = 0; i < 20; i++){
	let p = new PLANET({x:Math.random()*800,y:Math.random()*800,r:Math.random()*9+1},false,"bichass");	
}
SIGNAL.sendSignal({x:400,y:400},0,Math.PI,360,true,"",100);


function intersect(planet, signal){
    //lineDist = Math.abs(Math.cos(signal.direction)*(signal.position.x-planet.position.x)-Math.sin(signal.direction)*(signal.position.y - planet.position.y));
    let x1 = signal.position.x - planet.position.x;
    let y1 = signal.position.y - planet.position.y;
    let x2 = x1 + unit*Math.cos(signal.direction);
    let y2 = y1 + unit*Math.sin(signal.direction);
    let D = x1*y2 - y1*x2;
    let discriminant = planet.position.r**2 * unit**2 - D**2;
    if(discriminant < 0) return false;
    
    let v1 = vec2.sub(signal.position,planet.position);
    if(vec2.mag(v1) <= planet.position.r) return true;
    let v2 = vec2.sub(vec2.add(signal.position, {x: Math.cos(signal.direction)*unit, y: Math.sin(signal.direction)*unit}), planet.position);
    if(vec2.mag(v2) <= planet.position.r) return true;
    if(vec2.dot(v1,v2) > 0) return false;
    return true;
}

function drawArc(planet){
    ctx.beginPath();
    ctx.arc(planet.position.x,planet.position.y,planet.position.r,0,Math.PI*2,false);
    ctx.closePath();
    ctx.stroke();
}

let mouseX = 0;
let mouseY = 0;
window.onmousemove = (e)=>{
    mouseX = e.clientX;
    mouseY = e.clientY;
}

document.onkeydown=(e)=>{
	SIGNAL.debugUpdate();
	PLANET.planets.forEach(planet=>planet.debugDraw());
}

setInterval(()=>{
},1000);
