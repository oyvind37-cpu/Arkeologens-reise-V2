(() => {
'use strict';
const canvas=document.getElementById('rigCanvas');
const gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true});
if(!gl){document.querySelector('.viewport-card').innerHTML='<p style="padding:30px">WebGL kunne ikke startes i denne nettleseren.</p>';return;}

const $=id=>document.getElementById(id);
const ui={motion:$('motionLabel'),angle:$('angleLabel'),distance:$('distanceLabel'),yaw:$('yawSlider'),yawValue:$('yawValue'),speed:$('speedSlider'),speedValue:$('speedValue'),bones:$('bonesToggle'),ref:$('referenceToggle'),refCard:$('referenceCard')};

const VS=`
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
uniform vec3 uColor;
varying vec3 vColor;
void main(){
  vec4 world=uModel*vec4(aPosition,1.0);
  mat3 normalMat=mat3(uModel[0].xyz,uModel[1].xyz,uModel[2].xyz);
  vec3 n=normalize(normalMat*aNormal);
  vec3 light=normalize(vec3(-0.45,0.85,0.65));
  float d=max(dot(n,light),0.0);
  float rim=pow(1.0-max(dot(n,normalize(vec3(0.0,0.25,1.0))),0.0),2.0)*0.12;
  vColor=uColor*(0.30+0.72*d)+rim;
  gl_Position=uProjection*uView*world;
}`;
const FS=`precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VS));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const loc={pos:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),proj:gl.getUniformLocation(program,'uProjection'),view:gl.getUniformLocation(program,'uView'),model:gl.getUniformLocation(program,'uModel'),color:gl.getUniformLocation(program,'uColor')};

function sphereMesh(lat=18,lon=24){const p=[],n=[],idx=[];for(let y=0;y<=lat;y++){const v=y/lat,phi=v*Math.PI;for(let x=0;x<=lon;x++){const u=x/lon,th=u*Math.PI*2;const sx=Math.sin(phi)*Math.cos(th),sy=Math.cos(phi),sz=Math.sin(phi)*Math.sin(th);p.push(sx,sy,sz);n.push(sx,sy,sz)}}for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){const a=y*(lon+1)+x,b=a+lon+1;idx.push(a,b,a+1,b,b+1,a+1)}return{p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)}}
const sphere=sphereMesh();
const vbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,sphere.p,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc.pos);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);
const nbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nbo);gl.bufferData(gl.ARRAY_BUFFER,sphere.n,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc.normal);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,0,0);
const ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,sphere.i,gl.STATIC_DRAW);

const lineVS=`attribute vec3 aPosition;uniform mat4 uProjection;uniform mat4 uView;uniform vec3 uColor;varying vec3 vColor;void main(){vColor=uColor;gl_Position=uProjection*uView*vec4(aPosition,1.0);}`;
const lineProgram=gl.createProgram();gl.attachShader(lineProgram,shader(gl.VERTEX_SHADER,lineVS));gl.attachShader(lineProgram,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(lineProgram);
const lineLoc={pos:gl.getAttribLocation(lineProgram,'aPosition'),proj:gl.getUniformLocation(lineProgram,'uProjection'),view:gl.getUniformLocation(lineProgram,'uView'),color:gl.getUniformLocation(lineProgram,'uColor')};
const lineBuffer=gl.createBuffer();

const C={skin:[0.53,0.33,0.22],jacket:[0.23,0.22,0.16],jacket2:[0.30,0.29,0.20],pants:[0.14,0.15,0.12],boot:[0.09,0.065,0.045],hair:[0.055,0.035,0.022],scarf:[0.20,0.25,0.14],pack:[0.13,0.12,0.085],gold:[0.92,0.67,0.22],joint:[0.98,0.75,0.27],grid:[0.29,0.22,0.13]};

const state={mode:'idle',yaw:0,speed:.85,phase:0,distance:0,x:0,z:0,showBones:false,lookStart:0};
let last=performance.now(),dragging=false,lastX=0;

function v3(x=0,y=0,z=0){return [x,y,z]}
function add(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function mul(a,s){return[a[0]*s,a[1]*s,a[2]*s]}
function len(a){return Math.hypot(a[0],a[1],a[2])||1}
function norm(a){const l=len(a);return[a[0]/l,a[1]/l,a[2]/l]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function rotateY(p,y){const c=Math.cos(y),s=Math.sin(y);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c]}
function world(p){const r=rotateY(p,state.yaw);return[r[0]+state.x,r[1],r[2]+state.z]}

function matPerspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0])}
function matLookAt(eye,center,up){const z=norm(sub(eye,center)),x=norm(cross(up,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1])}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function ellipsoidMatrix(center,scale,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return new Float32Array([c*scale[0],0,-s*scale[0],0,0,scale[1],0,0,s*scale[2],0,c*scale[2],0,center[0],center[1],center[2],1])}
function segmentMatrix(a,b,thick,depth=thick){const d=sub(b,a),L=len(d),y=norm(d),tmp=Math.abs(y[1])<.93?[0,1,0]:[1,0,0],x=norm(cross(tmp,y)),z=norm(cross(y,x)),m=mul(add(a,b),.5);return new Float32Array([x[0]*thick,x[1]*thick,x[2]*thick,0,y[0]*(L/2),y[1]*(L/2),y[2]*(L/2),0,z[0]*depth,z[1]*depth,z[2]*depth,0,m[0],m[1],m[2],1])}
function drawSphere(center,scale,color,yaw=0){gl.useProgram(program);gl.uniformMatrix4fv(loc.model,false,ellipsoidMatrix(center,scale,yaw));gl.uniform3fv(loc.color,color);gl.drawElements(gl.TRIANGLES,sphere.i.length,gl.UNSIGNED_SHORT,0)}
function drawSeg(a,b,t,color,depth=t){gl.useProgram(program);gl.uniformMatrix4fv(loc.model,false,segmentMatrix(a,b,t,depth));gl.uniform3fv(loc.color,color);gl.drawElements(gl.TRIANGLES,sphere.i.length,gl.UNSIGNED_SHORT,0)}

function pose(t){
  const walking=state.mode==='forward'||state.mode==='backward';
  const dir=state.mode==='backward'?-1:1;
  const p=state.phase;
  const bob=walking?(1-Math.cos(p*2))*.007:Math.sin(t*.0014)*.003;
  const weight=walking?Math.sin(p)*.012:0;
  let headTurn=0,bodyTurn=walking?Math.sin(p)*.022:Math.sin(t*.00042)*.012;
  if(state.mode==='look'){
    const u=Math.min(1,(performance.now()-state.lookStart)/1400);
    headTurn=Math.sin(u*Math.PI*2)*.22*(1-u*.25);
    bodyTurn=headTurn*.20;
    if(u>=1)state.mode='idle';
  }
  const root=v3(weight,.92+bob,0),chest=v3(weight*.35,1.35+bob,0),neck=v3(0,1.54+bob,0),head=v3(0,1.69+bob,0);
  const hipL=v3(-.105+weight,.94+bob,0),hipR=v3(.105+weight,.94+bob,0);
  const shoulderL=v3(-.22,1.45+bob,0),shoulderR=v3(.22,1.45+bob,0);
  const leg=(hip,offset)=>{const q=p+offset,s=Math.sin(q),a=(walking?s*.24*dir:0),bend=walking?Math.max(0,Math.sin(q+.35))*.34:0;const knee=add(hip,[0,-Math.cos(a)*.43,Math.sin(a)*.43]);const sa=a-bend*dir;let ankle=add(knee,[0,-Math.cos(sa)*.43,Math.sin(sa)*.43]);if(ankle[1]<.10)ankle[1]=.10;const foot=add(ankle,[0,-.015,.115*dir]);return{knee,ankle,foot}};
  const arm=(shoulder,offset,side)=>{const q=p+offset,s=Math.sin(q),a=walking?-s*.16*dir:0;const elbow=add(shoulder,[side*.01,-Math.cos(a)*.31,Math.sin(a)*.31]);const ea=a+(walking?.13*dir:.08);const hand=add(elbow,[side*.01,-Math.cos(ea)*.29,Math.sin(ea)*.29]);return{elbow,hand}};
  const LL=leg(hipL,0),RR=leg(hipR,Math.PI),AL=arm(shoulderL,Math.PI, -1),AR=arm(shoulderR,0,1);
  return{root,chest,neck,head,hipL,hipR,shoulderL,shoulderR,LL,RR,AL,AR,headTurn,bodyTurn};
}

function renderBody(P){
  const W=o=>world(o);
  const pelvis=W(v3(0,.98,0));
  const torso=W(v3(0,1.26,0));
  // backpack first (behind torso)
  drawSphere(W(v3(0,1.29,-.13)),[.19,.27,.105],C.pack,state.yaw+P.bodyTurn);
  // legs and boots
  drawSeg(W(P.hipL),W(P.LL.knee),.075,C.pants,.065);drawSeg(W(P.LL.knee),W(P.LL.ankle),.067,C.pants,.06);
  drawSeg(W(P.hipR),W(P.RR.knee),.075,C.pants,.065);drawSeg(W(P.RR.knee),W(P.RR.ankle),.067,C.pants,.06);
  drawSphere(W(P.LL.foot),[.078,.055,.145],C.boot,state.yaw);drawSphere(W(P.RR.foot),[.078,.055,.145],C.boot,state.yaw);
  // pelvis + torso keep silhouette connected
  drawSphere(pelvis,[.20,.16,.13],C.pants,state.yaw+P.bodyTurn*.6);
  drawSphere(torso,[.235,.30,.135],C.jacket,state.yaw+P.bodyTurn);
  drawSphere(W(v3(0,1.38,.005)),[.23,.12,.14],C.jacket2,state.yaw+P.bodyTurn);
  // arms
  drawSeg(W(P.shoulderL),W(P.AL.elbow),.060,C.jacket,.055);drawSeg(W(P.AL.elbow),W(P.AL.hand),.052,C.skin,.047);drawSphere(W(P.AL.hand),[.055,.072,.047],C.skin,state.yaw);
  drawSeg(W(P.shoulderR),W(P.AR.elbow),.060,C.jacket,.055);drawSeg(W(P.AR.elbow),W(P.AR.hand),.052,C.skin,.047);drawSphere(W(P.AR.hand),[.055,.072,.047],C.skin,state.yaw);
  // neck, scarf, head and hair
  drawSeg(W(P.neck),W(v3(0,1.61,0)),.055,C.skin,.05);
  drawSphere(W(v3(0,1.54,.002)),[.16,.055,.13],C.scarf,state.yaw+P.bodyTurn);
  const headYaw=state.yaw+P.headTurn;
  drawSphere(W(v3(-.005,1.72,-.035)),[.145,.175,.135],C.hair,headYaw);
  drawSphere(W(P.head),[.125,.158,.112],C.skin,headYaw);
  drawSphere(W(v3(-.08,1.71,-.13)),[.08,.12,.07],C.hair,headYaw);
  drawSphere(W(v3(-.13,1.60,-.10)),[.055,.10,.055],C.hair,headYaw);
  // headlamp + scarf tail
  drawSphere(W(v3(0,1.795,.108)),[.035,.026,.022],C.gold,headYaw);
  drawSeg(W(v3(.13,1.53,-.03)),W(v3(.19,1.37,-.08)),.027,C.scarf,.018);
  // belt
  drawSphere(W(v3(0,1.06,.002)),[.205,.035,.142],C.boot,state.yaw);

  if(state.showBones){
    const joints=[P.hipL,P.hipR,P.LL.knee,P.RR.knee,P.LL.ankle,P.RR.ankle,P.shoulderL,P.shoulderR,P.AL.elbow,P.AR.elbow,P.AL.hand,P.AR.hand,P.neck,P.head];
    joints.forEach(j=>drawSphere(W(j),[.024,.024,.024],C.joint,state.yaw));
  }
}

function drawGrid(proj,view){
  const verts=[];const span=9,step=.6;for(let i=-span;i<=span;i++){const v=i*step;verts.push(-span*step,0,v,span*step,0,v,v,0,-span*step,v,0,span*step)}
  gl.useProgram(lineProgram);gl.bindBuffer(gl.ARRAY_BUFFER,lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(lineLoc.pos);gl.vertexAttribPointer(lineLoc.pos,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(lineLoc.proj,false,proj);gl.uniformMatrix4fv(lineLoc.view,false,view);gl.uniform3fv(lineLoc.color,C.grid);gl.drawArrays(gl.LINES,0,verts.length/3);
  // restore sphere buffers
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,nbo);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);
}

function resize(){const dpr=Math.min(2,window.devicePixelRatio||1),r=canvas.getBoundingClientRect(),w=Math.max(2,Math.floor(r.width*dpr)),h=Math.max(2,Math.floor(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
function update(dt,t){const walking=state.mode==='forward'||state.mode==='backward';if(walking){const dir=state.mode==='backward'?-1:1;state.phase+=dt*5.1*state.speed;const travel=dt*.54*state.speed*dir;state.distance+=Math.abs(travel);state.x+=Math.sin(state.yaw)*travel;state.z+=Math.cos(state.yaw)*travel}}
function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;resize();update(dt,now);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(.025,.035,.028,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const aspect=canvas.width/canvas.height,proj=matPerspective(42*Math.PI/180,aspect,.05,50);const target=[state.x,.9,state.z],eye=[state.x,1.34,state.z+3.35],view=matLookAt(eye,target,[0,1,0]);
  gl.useProgram(program);gl.uniformMatrix4fv(loc.proj,false,proj);gl.uniformMatrix4fv(loc.view,false,view);drawGrid(proj,view);const P=pose(now);renderBody(P);
  ui.angle.textContent=Math.round(state.yaw*180/Math.PI)+'°';ui.distance.textContent=state.distance.toFixed(1).replace('.',',')+' m';requestAnimationFrame(frame)}

function setMode(mode){state.mode=mode;if(mode==='look')state.lookStart=performance.now();ui.motion.textContent=mode==='forward'?'GÅR FREM':mode==='backward'?'GÅR BAKOVER':mode==='look'?'BLIKK':'IDLE';document.querySelectorAll('.button-grid button').forEach(b=>b.classList.remove('active'));const map={forward:'walkForward',backward:'walkBackward',idle:'stopMotion',look:'lookMotion'};$(map[mode])?.classList.add('active')}
$('walkForward').onclick=()=>setMode('forward');$('walkBackward').onclick=()=>setMode('backward');$('stopMotion').onclick=()=>setMode('idle');$('lookMotion').onclick=()=>setMode('look');
ui.yaw.oninput=()=>{state.yaw=Number(ui.yaw.value)*Math.PI/180;ui.yawValue.textContent=ui.yaw.value+'°'};
ui.speed.oninput=()=>{state.speed=Number(ui.speed.value)/100;ui.speedValue.textContent=state.speed.toFixed(2).replace('.',',')+'×'};
ui.bones.onchange=()=>state.showBones=ui.bones.checked;ui.ref.onchange=()=>ui.refCard.classList.toggle('hidden',!ui.ref.checked);
$('resetRig').onclick=()=>{state.yaw=0;state.phase=0;state.distance=0;state.x=0;state.z=0;state.speed=.85;ui.yaw.value=0;ui.speed.value=85;ui.yawValue.textContent='0°';ui.speedValue.textContent='0,85×';setMode('idle')};

canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;lastX=e.clientX;state.yaw+=dx*.0105;while(state.yaw>Math.PI)state.yaw-=Math.PI*2;while(state.yaw<-Math.PI)state.yaw+=Math.PI*2;const deg=Math.round(state.yaw*180/Math.PI);ui.yaw.value=deg;ui.yawValue.textContent=deg+'°'});canvas.addEventListener('pointerup',e=>{dragging=false;try{canvas.releasePointerCapture(e.pointerId)}catch(_){}});canvas.addEventListener('pointercancel',()=>dragging=false);
window.addEventListener('resize',resize);setMode('idle');requestAnimationFrame(frame);
})();
