const canvas = document.getElementById('can');
const ctx = canvas.getContext('2d');
const unit = 1;

//convenience class
//works with anything that has {x,y}
class vec2{
    static add(v,w){return {x: v.x+w.x, y: v.y+w.y};}
    static sub(v,w){return {x: v.x-w.x, y: v.y-w.y};}
    static scaleWith(v,c){return {x: v.x*c, y: v.y*c};}
    static dot(v,w){return v.x*w.x + v.y*w.y;}
    static mag(v){return Math.sqrt(v.x**2 + v.y**2);}
    static normalise(v){
        let mag = vec2.mag(v);
        return vec2.scaleWith(v,1/mag);
    }
    static direction(v){return Math.atan2(v.y,v.x);}
    static unitFromDir(dir){return {x: Math.cos(dir), y: Math.sin(dir)};}
    static Zero(){return {x:0,y:0};}
}
class GRID{
    constructor(cellsX, cellsY, width, height){
        this.cellsX = cellsX;
        this.cellsY = cellsY;
        this.width = width;
        this.height = height;
        this.cellH = height/cellsY;
        this.cellW = width/cellsX;
        this.resetHashMap();
    }
    debugDraw(){
        ctx.beginPath();
        //vertical lines
        for(let i = 1; i < this.cellsX; i++){
            ctx.moveTo(this.cellW*i,0);
            ctx.lineTo(this.cellW*i,this.height);
        }
        //horizontal lines
        for(let i = 1; i < this.cellsY; i++){
            ctx.moveTo(0, this.cellH*i);
            ctx.lineTo(this.width, this.cellH*i);
        }
        ctx.closePath();
        ctx.stroke();
        Object.keys(this.hashMap).forEach(k=>{ctx.fillText(`${k}: ${this.hashMap[k].length}`,parseInt(k.split(';')[0])*this.cellW, parseInt(k.split(';')[1])*this.cellH + 10)});
    }
    populateHashMap(members){
        this.resetHashMap();
        members.forEach(m=>{this.hashMap[`${Math.floor(m.position.x/this.cellW)};${Math.floor(m.position.y/this.cellH)}`].push(m);});
    }
    /**
     * resets or initialises hashMap
     */
    resetHashMap(){
        this.hashMap = {};
        for(let i = 0; i < this.cellsX; i++){
            for(let j = 0; j < this.cellsY; j++){
                this.hashMap[`${i};${j}`] = [];
            }
        }
    }
}
class PLANET{
    constructor(Pos,Store,visual){
        this.id = PLANET.planets.length;
        this.position = Pos;
        this.storage = Store;
        this.log = {};
		this.visualData = visual;
        this.velocity = vec2.Zero();
        PLANET.planets.push(this);
    }
    static planets = [];
    debugDraw(){
        ctx.beginPath();
        ctx.arc(this.position.x,this.position.y,this.position.r,0,Math.PI*2,false);
        ctx.closePath();
        ctx.stroke();
    }
    gravUpdate(){

    }
}
class SIGNAL{
    constructor(Pos,Dir,Probe,Payload,Freq,origin){
        this.position=Pos;
        this.direction=Dir;
        this.isProbe=Probe;
        this.payload=Payload;
        this.frequency=Freq;
        this.strength=1;
        this.origin=origin;
        SIGNAL.signals.push(this);
    }
    static signals=[];
    static sendSignal(Pos,Dir,Width,Density,Probe,Payload,Freq,Origin){
        for (let i = 0; i <= 2*Width; i+=2*Width/(Density-1))new SIGNAL(Pos,Dir-Width+i,Probe,Payload,Freq,Origin);
    }
	static debugStep(){
		SIGNAL.signals.forEach(signal=>{signal.update();signal.debugDrawPath();});
	}
    static debugUpdate(){
        ctx.clearRect(0,0,canvas.width, canvas.height);
        SIGNAL.debugStep();
    }
    static debugNoise(payload,strength){
        let full = payload.split('');
        return full.map(x => (Math.random()>strength)?'█':x).reduce((x,y)=> x+y,'');
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
    debugLogging(planet){
        if(planet.log[this.origin]!=undefined){
            let incoming = SIGNAL.debugNoise(this.payload,this.strength).split('');
            let inner = planet.log[this.origin].split('');
            ciklus: for (let i = 0; i < inner.length; i++) {
                if (inner[i]==undefined || incoming[i]==undefined) break ciklus;
                if (inner[i]=='█') inner[i]=incoming[i];
                else if(incoming!='█') inner[i]=(Math.random()<0.1)?incoming[i]:inner[i];
            }
            planet.log[this.origin]=inner.reduce((x,y)=> x+y,'');
            //console.log(planet.log);
        }
        else planet.log[this.origin]=SIGNAL.debugNoise(this.payload,this.strength);
    }
    update(){
        let collisionInfo = {};
        let coll = PLANET.planets.find(p=>intersect(p, this, collisionInfo));
        if(coll === undefined || coll.id==this.origin || this.frequency/1600>=Math.random()){
            //no collision
			ctx.strokeStyle = "black";
            if((this.frequency/1600)<Math.random()){
                this.strength-=Math.random()*0.009;
            }
            if(this.strength<=0){
                SIGNAL.signals[SIGNAL.signals.indexOf(this)] = SIGNAL.signals[SIGNAL.signals.length-1];
                SIGNAL.signals.pop();
            }
        }
        else{
           //collided with coll
			ctx.strokeStyle = "red";
			if(this.isProbe){
                let flipped = (this.direction + Math.PI)%(Math.PI*2);
                let agneDiff = vec2.direction(collisionInfo.normal) - flipped;
				SIGNAL.sendSignal(collisionInfo.position, (flipped + agneDiff*2)%(Math.PI*2), 0, 1, false, `${coll.visualData}\nAt X=${coll.position.x} Y=${coll.position.y}\nSignal Strength=${Math.round(this.strength*10000)/100}%`, this.frequency, coll.id);
			}
            //coll.log[`${this.origin}`]=SIGNAL.debugNoise(this.payload,this.strength);
            if(!this.isProbe)this.debugLogging(coll);
			SIGNAL.signals[SIGNAL.signals.indexOf(this)] = SIGNAL.signals[SIGNAL.signals.length-1];
			SIGNAL.signals.pop();
        }
		this.position = {x:this.position.x+unit*Math.cos(this.direction), y:this.position.y+unit*Math.sin(this.direction)};
    }
}
let SuperEarth = new PLANET({x:400,y:400,r:15},false,'I am Super Earth');
for(i = 0; i < 30; i++){
	new PLANET({x:Math.random()*800,y:Math.random()*800,r:Math.random()*10+5},false,`I am planet #${i+1}`);
}
SIGNAL.sendSignal(SuperEarth.position,0,Math.PI,10000,true,"",1100, SuperEarth.id);


function intersect(planet, signal, dataTarget){
    //lineDist = Math.abs(Math.cos(signal.direction)*(signal.position.x-planet.position.x)-Math.sin(signal.direction)*(signal.position.y - planet.position.y));
    let x1 = signal.position.x - planet.position.x;
    let y1 = signal.position.y - planet.position.y;
    let x2 = x1 + unit*Math.cos(signal.direction);
    let y2 = y1 + unit*Math.sin(signal.direction);
    let D = x1*y2 - y1*x2;
    let discriminant = planet.position.r**2 * unit**2 - D**2;
    if(discriminant < 0) return false;
    let normal, intersection;
    if(discriminant == 0){
        intersection = vec2.scaleWith({x:D*(y2-y1), y: -D*(x2-x1)},1/ unit**2);
        normal = vec2.normalise(vec2.sub(intersection, planet.position));
    }
    else{
        discriminant = Math.sqrt(discriminant);
        let intersection1 = vec2.scaleWith({
                x:D*(y2-y1) + (Math.sign(y2-y1)*(x2-x1)*discriminant),
                y: -D*(x2-x1) + (Math.abs(y2-y1)*discriminant)
            },
            1/ unit**2
        );
        let intersection2 = vec2.scaleWith({
                x:D*(y2-y1) - (Math.sign(y2-y1)*(x2-x1)*discriminant),
                y: -D*(x2-x1) - (Math.abs(y2-y1)*discriminant)
            },
            1/ unit**2
        );
        intersection1 = vec2.add(intersection1, planet.position);
        intersection2 = vec2.add(intersection2, planet.position);
        intersection = (vec2.mag(vec2.sub(intersection1, signal.position)) > vec2.mag(vec2.sub(intersection2, signal.position)))? intersection2 : intersection1;
        normal = vec2.normalise(vec2.sub(intersection, planet.position));
    }
    
    let v1 = vec2.sub(signal.position,planet.position);
    let v2 = vec2.sub(vec2.add(signal.position, {x: Math.cos(signal.direction)*unit, y: Math.sin(signal.direction)*unit}), planet.position);
    
    if(vec2.mag(v2) <= planet.position.r){
        dataTarget.normal = normal;
        dataTarget.position = intersection;
        return true;
    }
    
    if(vec2.dot(v1,v2) > 0) return false;

    dataTarget.normal = normal;
    dataTarget.position = intersection;
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

let a = new GRID(10,10,canvas.width,canvas.height);
a.populateHashMap(PLANET.planets);

document.onkeydown=(e)=>{
    let inter = 0;
    let update = setInterval(()=>{
        SIGNAL.debugUpdate();
        PLANET.planets.forEach(planet=>planet.debugDraw());
        a.debugDraw();
        inter++;
        if (inter>=50) clearInterval(update);
    },10);
}