(() => {
'use strict';
const canvas=document.getElementById('rigCanvas');
const gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true});
if(!gl){document.querySelector('.viewport-card').innerHTML='<p style="padding:30px">WebGL kunne ikke startes i denne nettleseren.</p>';return;}

const $=id=>document.getElementById(id);
const ui={
  motion:$('motionLabel'),angle:$('angleLabel'),distance:$('distanceLabel'),contact:$('contactLabel'),
  yaw:$('yawSlider'),yawValue:$('yawValue'),speed:$('speedSlider'),speedValue:$('speedValue'),
  bones:$('bonesToggle'),contacts:$('contactsToggle'),ref:$('referenceToggle'),refCard:$('referenceCard')
};

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
  vec3 light=normalize(vec3(-0.45,0.88,0.65));
  float d=max(dot(n,light),0.0);
  float rim=pow(1.0-max(dot(n,normalize(vec3(0.0,0.2,1.0))),0.0),2.0)*0.10;
  vColor=uColor*(0.28+0.74*d)+rim;
  gl_Position=uProjection*uView*world;
}`;
const FS=`precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VS));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const loc={pos:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),proj:gl.getUniformLocation(program,'uProjection'),view:gl.getUniformLocation(program,'uView'),model:gl.getUniformLocation(program,'uModel'),color:gl.getUniformLocation(program,'uColor')};

function sphereMesh(lat=20,lon=28){const p=[],n=[],idx=[];for(let y=0;y<=lat;y++){const v=y/lat,phi=v*Math.PI;for(let x=0;x<=lon;x++){const u=x/lon,th=u*Math.PI*2;const sx=Math.sin(phi)*Math.cos(th),sy=Math.cos(phi),sz=Math.sin(phi)*Math.sin(th);p.push(sx,sy,sz);n.push(sx,sy,sz)}}for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){const a=y*(lon+1)+x,b=a+lon+1;idx.push(a,b,a+1,b,b+1,a+1)}return{p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)}}
const sphere=sphereMesh();
const vbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,sphere.p,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc.pos);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);
const nbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nbo);gl.bufferData(gl.ARRAY_BUFFER,sphere.n,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc.normal);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,0,0);
const ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,sphere.i,gl.STATIC_DRAW);

const lineVS=`attribute vec3 aPosition;uniform mat4 uProjection;uniform mat4 uView;uniform vec3 uColor;varying vec3 vColor;void main(){vColor=uColor;gl_Position=uProjection*uView*vec4(aPosition,1.0);}`;
const lineProgram=gl.createProgram();gl.attachShader(lineProgram,shader(gl.VERTEX_SHADER,lineVS));gl.attachShader(lineProgram,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(lineProgram);
const lineLoc={pos:gl.getAttribLocation(lineProgram,'aPosition'),proj:gl.getUniformLocation(lineProgram,'uProjection'),view:gl.getUniformLocation(lineProgram,'uView'),color:gl.getUniformLocation(lineProgram,'uColor')};
const lineBuffer=gl.createBuffer();

const C={skin:[0.56,0.35,0.23],jacket:[0.23,0.22,0.16],jacket2:[0.31,0.30,0.21],pants:[0.14,0.15,0.12],boot:[0.075,0.052,0.036],hair:[0.052,0.032,0.020],scarf:[0.20,0.25,0.14],pack:[0.13,0.12,0.085],gold:[0.92,0.67,0.22],joint:[0.98,0.75,0.27],bone:[0.82,0.68,0.40],grid:[0.29,0.22,0.13],contact:[0.42,0.72,0.28],shadow:[0.06,0.045,0.03]};
const state={
  mode:'idle',yaw:0,targetYaw:0,speed:.85,phase:0,distance:0,x:0,z:0,
  showBones:false,showContacts:true,lookYaw:0,lookPitch:0,targetLookYaw:0,targetLookPitch:0,
  actionStart:0,turnStart:0,turnFrom:0,turnTo:0,turnDir:0
};
let last=performance.now(),dragging=false,lastX=0;

function v3(x=0,y=0,z=0){return[x,y,z]}
function add(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function mul(a,s){return[a[0]*s,a[1]*s,a[2]*s]}
function len(a){return Math.hypot(a[0],a[1],a[2])||1}
function norm(a){const l=len(a);return[a[0]/l,a[1]/l,a[2]/l]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function mod(v,m){return((v%m)+m)%m}
function smoothstep(t){t=clamp(t,0,1);return t*t*(3-2*t)}
function easeInOut(t){return .5-.5*Math.cos(clamp(t,0,1)*Math.PI)}
function angleDelta(a,b){let d=mod(b-a+Math.PI,Math.PI*2)-Math.PI;return d}
function rotateY(p,y){const c=Math.cos(y),s=Math.sin(y);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c]}
function world(p){const r=rotateY(p,state.yaw);return[r[0]+state.x,r[1],r[2]+state.z]}
function localDir(yaw,pitch=0){const cp=Math.cos(pitch);return[Math.sin(yaw)*cp,Math.sin(pitch),Math.cos(yaw)*cp]}

function matPerspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0])}
function matLookAt(eye,center,up){const z=norm(sub(eye,center)),x=norm(cross(up,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1])}
function eulerScaleMatrix(center,scale,yaw=0,pitch=0,roll=0){
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch),cz=Math.cos(roll),sz=Math.sin(roll);
  const r00=cy*cz+sy*sx*sz, r01=-cy*sz+sy*sx*cz, r02=sy*cx;
  const r10=cx*sz,          r11=cx*cz,           r12=-sx;
  const r20=-sy*cz+cy*sx*sz,r21=sy*sz+cy*sx*cz,r22=cy*cx;
  return new Float32Array([
    r00*scale[0],r10*scale[0],r20*scale[0],0,
    r01*scale[1],r11*scale[1],r21*scale[1],0,
    r02*scale[2],r12*scale[2],r22*scale[2],0,
    center[0],center[1],center[2],1
  ])
}
function segmentMatrix(a,b,thick,depth=thick){const d=sub(b,a),L=len(d),y=norm(d),tmp=Math.abs(y[1])<.93?[0,1,0]:[1,0,0],x=norm(cross(tmp,y)),z=norm(cross(y,x)),m=mul(add(a,b),.5);return new Float32Array([x[0]*thick,x[1]*thick,x[2]*thick,0,y[0]*(L/2),y[1]*(L/2),y[2]*(L/2),0,z[0]*depth,z[1]*depth,z[2]*depth,0,m[0],m[1],m[2],1])}
function drawSphere(center,scale,color,yaw=0,pitch=0,roll=0){gl.useProgram(program);gl.uniformMatrix4fv(loc.model,false,eulerScaleMatrix(center,scale,yaw,pitch,roll));gl.uniform3fv(loc.color,color);gl.drawElements(gl.TRIANGLES,sphere.i.length,gl.UNSIGNED_SHORT,0)}
function drawSeg(a,b,t,color,depth=t){gl.useProgram(program);gl.uniformMatrix4fv(loc.model,false,segmentMatrix(a,b,t,depth));gl.uniform3fv(loc.color,color);gl.drawElements(gl.TRIANGLES,sphere.i.length,gl.UNSIGNED_SHORT,0)}

function twoBoneIK(hip,ankle,l1=.425,l2=.425,kneeForward=.10){
  const dy=ankle[1]-hip[1],dz=ankle[2]-hip[2];
  let d=Math.hypot(dy,dz);d=clamp(d,.08,l1+l2-.004);
  const uy=dy/d,uz=dz/d;
  const a=(l1*l1-l2*l2+d*d)/(2*d);
  const h=Math.sqrt(Math.max(0,l1*l1-a*a));
  const py=-uz,pz=uy;
  let ky=hip[1]+uy*a+py*h, kz=hip[2]+uz*a+pz*h;
  if(kz<Math.min(hip[2],ankle[2])+kneeForward){ky=hip[1]+uy*a-py*h;kz=hip[2]+uz*a-pz*h}
  return[hip[0],ky,kz];
}

function footCycle(phase,backward=false){
  const u=mod(phase/(Math.PI*2),1);
  const stance=backward?.66:.62;
  const stride=backward?.37:.44;
  let z,y=.085,contact=false;
  if(u<stance){
    const q=u/stance;
    z=(backward?-1:1)*(stride*.5-stride*q);
    contact=true;
  }else{
    const q=(u-stance)/(1-stance);
    z=(backward?-1:1)*(-stride*.5+stride*smoothstep(q));
    y+=Math.sin(Math.PI*q)*(backward?.055:.085);
  }
  return{z,y,contact};
}

function pose(now){
  const walking=state.mode==='forward'||state.mode==='backward';
  const backward=state.mode==='backward';
  const p=state.phase;
  const breath=Math.sin(now*.00145)*.0027;
  const idleWeight=Math.sin(now*.00053)*.006;
  let rootX=walking?Math.sin(p)*.009:idleWeight;
  let rootY=.91+breath;
  let rootZ=0;
  let torsoLean=walking?(backward?-.012:.020):0;
  let bodyTwist=walking?Math.sin(p)*.035:Math.sin(now*.00042)*.010;
  let shoulderCounter=walking?-Math.sin(p)*.045:0;
  let lookYaw=state.lookYaw,lookPitch=state.lookPitch;
  let action=0;

  if(state.mode==='bend'||state.mode==='study'){
    action=clamp((now-state.actionStart)/(state.mode==='bend'?1900:1500),0,1);
    const wave=Math.sin(Math.PI*action);
    if(state.mode==='bend'){
      rootY-=.13*wave;rootZ+=.07*wave;torsoLean+=.22*wave;lookPitch-=.22*wave;
    }else{
      torsoLean+=.055*wave;lookPitch-=.18*wave;lookYaw+=.08*Math.sin(action*Math.PI*2);
    }
    if(action>=1){state.mode='idle';setActiveButton('idle')}
  }

  let turnLead=0;
  if(state.mode==='turn'){
    const t=clamp((now-state.turnStart)/760,0,1),e=easeInOut(t);
    state.targetYaw=state.turnFrom+angleDelta(state.turnFrom,state.turnTo)*e;
    turnLead=Math.sin(Math.PI*t)*state.turnDir;
    bodyTwist+=turnLead*.16;lookYaw+=turnLead*.30;
    if(t>=1){state.targetYaw=state.turnTo;state.mode='idle';setActiveButton('idle')}
  }

  const pelvis=v3(rootX,rootY+.04,rootZ);
  const hipL=v3(-.145+rootX,rootY,rootZ),hipR=v3(.145+rootX,rootY,rootZ);
  const waist=v3(rootX*.55,1.09+breath,rootZ+torsoLean*.20);
  const chest=v3(rootX*.30,1.28+breath,rootZ+torsoLean*.55);
  const shoulderY=1.405+breath;
  const shoulderL=v3(-.205,shoulderY,rootZ+torsoLean*.78),shoulderR=v3(.205,shoulderY,rootZ+torsoLean*.78);
  const neck=v3(0,1.485+breath,rootZ+torsoLean*.88);
  const head=v3(0,1.61+breath,rootZ+torsoLean*.98);

  let leftFoot=v3(-.115,.085,.02),rightFoot=v3(.115,.085,-.02),leftContact=true,rightContact=true;
  if(walking){
    const lf=footCycle(p,backward),rf=footCycle(p+Math.PI,backward);
    leftFoot=v3(-.115,lf.y,lf.z);rightFoot=v3(.115,rf.y,rf.z);leftContact=lf.contact;rightContact=rf.contact;
  }
  if(state.mode==='bend'){
    const w=Math.sin(Math.PI*action);leftFoot=v3(-.135,.085,.045);rightFoot=v3(.135,.085,-.015);leftContact=rightContact=true;
  }
  const leftAnkle=add(leftFoot,[0,.035,-.015]),rightAnkle=add(rightFoot,[0,.035,-.015]);
  let leftKnee=twoBoneIK(hipL,leftAnkle,.425,.425,.08),rightKnee=twoBoneIK(hipR,rightAnkle,.425,.425,.08);
  if(state.mode==='bend'){
    const w=Math.sin(Math.PI*action);leftKnee[2]+=.09*w;rightKnee[2]+=.12*w;
  }

  const armSwing=walking?(backward?.11:.16):0;
  const aL=walking?Math.sin(p+Math.PI)*armSwing:0,aR=walking?Math.sin(p)*armSwing:0;
  function arm(shoulder,a,side){
    const elbow=add(shoulder,[side*.012,-.285,Math.sin(a)*.17]);
    const hand=add(elbow,[side*.012,-.255,Math.sin(a+.10)*.13]);
    return{elbow,hand};
  }
  const AL=arm(shoulderL,aL,-1),AR=arm(shoulderR,aR,1);
  if(state.mode==='bend'){
    const w=Math.sin(Math.PI*action);AR.elbow[1]-=.10*w;AR.elbow[2]+=.12*w;AR.hand[1]-=.33*w;AR.hand[2]+=.29*w;AR.hand[0]-=.02*w;
  }
  if(state.mode==='study'){
    const w=Math.sin(Math.PI*action);AR.elbow[1]+=.07*w;AR.elbow[2]+=.11*w;AR.hand[1]+=.19*w;AR.hand[2]+=.13*w;AR.hand[0]-=.03*w;
  }

  return{pelvis,hipL,hipR,waist,chest,shoulderL,shoulderR,neck,head,leftFoot,rightFoot,leftAnkle,rightAnkle,leftKnee,rightKnee,AL,AR,leftContact,rightContact,bodyTwist,shoulderCounter,lookYaw,lookPitch,torsoLean};
}

function renderSkeleton(P){
  const W=world;
  const segs=[[P.hipL,P.leftKnee],[P.leftKnee,P.leftAnkle],[P.hipR,P.rightKnee],[P.rightKnee,P.rightAnkle],[P.pelvis,P.waist],[P.waist,P.chest],[P.chest,P.neck],[P.shoulderL,P.AL.elbow],[P.AL.elbow,P.AL.hand],[P.shoulderR,P.AR.elbow],[P.AR.elbow,P.AR.hand],[P.shoulderL,P.shoulderR]];
  segs.forEach(([a,b])=>drawSeg(W(a),W(b),.015,C.bone,.015));
  [P.hipL,P.hipR,P.leftKnee,P.rightKnee,P.leftAnkle,P.rightAnkle,P.shoulderL,P.shoulderR,P.AL.elbow,P.AR.elbow,P.AL.hand,P.AR.hand,P.waist,P.chest,P.neck,P.head].forEach(j=>drawSphere(W(j),[.025,.025,.025],C.joint,state.yaw));
}

function renderBody(P){
  const W=world;
  const yaw=state.yaw;
  const bodyYaw=yaw+P.bodyTwist;
  const shoulderYaw=bodyYaw+P.shoulderCounter;
  const headYaw=yaw+P.lookYaw+P.bodyTwist*.20;
  const headPitch=P.lookPitch;

  // soft ground shadow – part of the 3D world, never an image rectangle
  drawSphere(W(v3(0,.026,.01)),[.24,.018,.15],C.shadow,yaw);

  // backpack behind torso
  drawSphere(W(v3(0,1.27,-.125)),[.17,.235,.095],C.pack,bodyYaw,.02,0);
  // legs, ankles and boots
  drawSeg(W(P.hipL),W(P.leftKnee),.066,C.pants,.060);drawSeg(W(P.leftKnee),W(P.leftAnkle),.059,C.pants,.055);
  drawSeg(W(P.hipR),W(P.rightKnee),.066,C.pants,.060);drawSeg(W(P.rightKnee),W(P.rightAnkle),.059,C.pants,.055);
  drawSphere(W(P.leftFoot),[.073,.052,.145],C.boot,yaw);drawSphere(W(P.rightFoot),[.073,.052,.145],C.boot,yaw);
  // connected pelvis/waist/ribcage/shoulders
  drawSphere(W(P.pelvis),[.185,.145,.125],C.pants,bodyYaw,0,P.bodyTwist*.2);
  drawSphere(W(P.waist),[.158,.175,.110],C.jacket,bodyYaw,P.torsoLean,0);
  drawSphere(W(P.chest),[.205,.235,.125],C.jacket,bodyYaw,P.torsoLean,0);
  drawSphere(W(v3(0,1.39,P.torsoLean*.70)),[.220,.085,.130],C.jacket2,shoulderYaw,P.torsoLean*.5,0);
  // arms
  drawSeg(W(P.shoulderL),W(P.AL.elbow),.053,C.jacket,.050);drawSeg(W(P.AL.elbow),W(P.AL.hand),.044,C.skin,.041);drawSphere(W(P.AL.hand),[.050,.065,.041],C.skin,yaw);
  drawSeg(W(P.shoulderR),W(P.AR.elbow),.053,C.jacket,.050);drawSeg(W(P.AR.elbow),W(P.AR.hand),.044,C.skin,.041);drawSphere(W(P.AR.hand),[.050,.065,.041],C.skin,yaw);
  // neck and scarf
  drawSeg(W(P.neck),W(v3(0,1.535,P.torsoLean*.92)),.049,C.skin,.046);
  drawSphere(W(v3(0,1.49,P.torsoLean*.90)),[.145,.050,.118],C.scarf,shoulderYaw,P.torsoLean*.3,0);
  // head / hair / headlamp
  drawSphere(W(v3(-.004,1.625,P.torsoLean*.98-.028)),[.137,.154,.124],C.hair,headYaw,headPitch,0);
  drawSphere(W(P.head),[.118,.145,.105],C.skin,headYaw,headPitch,0);
  drawSphere(W(v3(-.075,1.62,P.torsoLean*.98-.125)),[.072,.110,.064],C.hair,headYaw,headPitch,0);
  drawSphere(W(v3(-.125,1.53,P.torsoLean*.98-.105)),[.050,.092,.050],C.hair,headYaw,headPitch,0);
  const lampOffset=rotateY(v3(0,.074,.103),P.lookYaw);
  drawSphere(W(add(P.head,lampOffset)),[.030,.022,.020],C.gold,headYaw,headPitch,0);
  // scarf tail, belt and utility pouch
  drawSeg(W(v3(.12,1.48,-.02)),W(v3(.17,1.34,-.075)),.023,C.scarf,.016);
  drawSphere(W(v3(0,1.02,0)),[.185,.030,.128],C.boot,yaw);
  drawSphere(W(v3(.155,1.00,.055)),[.045,.072,.035],C.boot,yaw);

  if(state.showContacts){
    if(P.leftContact)drawSphere(W(v3(P.leftFoot[0],.018,P.leftFoot[2])),[.085,.010,.105],C.contact,yaw);
    if(P.rightContact)drawSphere(W(v3(P.rightFoot[0],.018,P.rightFoot[2])),[.085,.010,.105],C.contact,yaw);
  }
  if(state.showBones)renderSkeleton(P);
}

function drawGrid(proj,view){
  const verts=[],span=10,step=.55;for(let i=-span;i<=span;i++){const v=i*step;verts.push(-span*step,0,v,span*step,0,v,v,0,-span*step,v,0,span*step)}
  gl.useProgram(lineProgram);gl.bindBuffer(gl.ARRAY_BUFFER,lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(lineLoc.pos);gl.vertexAttribPointer(lineLoc.pos,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(lineLoc.proj,false,proj);gl.uniformMatrix4fv(lineLoc.view,false,view);gl.uniform3fv(lineLoc.color,C.grid);gl.drawArrays(gl.LINES,0,verts.length/3);
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,nbo);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);
}

function resize(){const dpr=Math.min(2,window.devicePixelRatio||1),r=canvas.getBoundingClientRect(),w=Math.max(2,Math.floor(r.width*dpr)),h=Math.max(2,Math.floor(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
function update(dt,now){
  // smooth 360-degree body rotation
  state.yaw+=angleDelta(state.yaw,state.targetYaw)*Math.min(1,dt*9.0);
  state.lookYaw+=(state.targetLookYaw-state.lookYaw)*Math.min(1,dt*7.2);
  state.lookPitch+=(state.targetLookPitch-state.lookPitch)*Math.min(1,dt*7.2);
  const walking=state.mode==='forward'||state.mode==='backward';
  if(walking){
    const backward=state.mode==='backward';
    const phaseSpeed=(backward?3.8:4.5)*state.speed;
    const travelSpeed=(backward?.36:.55)*state.speed;
    state.phase+=dt*phaseSpeed;
    const dir=backward?-1:1,travel=dt*travelSpeed*dir;
    state.distance+=Math.abs(travel);
    state.x+=Math.sin(state.yaw)*travel;state.z+=Math.cos(state.yaw)*travel;
  }
}
function frame(now){
  const dt=Math.min(.04,(now-last)/1000);last=now;resize();update(dt,now);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(.025,.035,.028,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const aspect=canvas.width/canvas.height,proj=matPerspective(41*Math.PI/180,aspect,.05,50);
  const target=[state.x,.88,state.z],eye=[state.x,1.28,state.z+3.15],view=matLookAt(eye,target,[0,1,0]);
  gl.useProgram(program);gl.uniformMatrix4fv(loc.proj,false,proj);gl.uniformMatrix4fv(loc.view,false,view);drawGrid(proj,view);
  const P=pose(now);renderBody(P);
  ui.angle.textContent=Math.round(state.yaw*180/Math.PI)+'°';ui.distance.textContent=state.distance.toFixed(1).replace('.',',')+' m';
  ui.contact.textContent='FOT: '+(P.leftContact?'V':'–')+'+'+(P.rightContact?'H':'–');
  requestAnimationFrame(frame);
}

function setActiveButton(mode,id=null){
  document.querySelectorAll('.button-grid button').forEach(b=>b.classList.remove('active'));
  if(id)$(id)?.classList.add('active');
  else if(mode==='forward')$('walkForward')?.classList.add('active');
  else if(mode==='backward')$('walkBackward')?.classList.add('active');
  else if(mode==='idle')$('stopMotion')?.classList.add('active');
}
function setMode(mode){
  state.mode=mode;
  if(mode==='bend'||mode==='study')state.actionStart=performance.now();
  ui.motion.textContent=mode==='forward'?'GÅR FREM':mode==='backward'?'GÅR BAKOVER':mode==='turn'?'VENDER':mode==='bend'?'BØY / PLUKK':mode==='study'?'STUDERER':'IDLE';
  setActiveButton(mode,mode==='bend'?'bendPickup':mode==='study'?'studyObject':null);
}
function startTurn(dir){
  state.mode='turn';state.turnDir=dir;state.turnStart=performance.now();state.turnFrom=state.targetYaw;state.turnTo=state.targetYaw+dir*Math.PI/2;ui.motion.textContent=dir<0?'SNU VENSTRE':'SNU HØYRE';setActiveButton('turn',dir<0?'turnLeft':'turnRight');
}
function setLook(kind){
  const yaw={left:-.48,right:.48,up:0,down:0,center:0}[kind]||0;
  const pitch={left:0,right:0,up:.26,down:-.25,center:0}[kind]||0;
  state.targetLookYaw=yaw;state.targetLookPitch=pitch;ui.motion.textContent=kind==='center'?'IDLE':'BLIKK '+kind.toUpperCase();
  document.querySelectorAll('[data-look]').forEach(b=>b.classList.toggle('active',b.dataset.look===kind));
}

$('walkForward').onclick=()=>setMode('forward');$('walkBackward').onclick=()=>setMode('backward');$('stopMotion').onclick=()=>setMode('idle');
$('turnLeft').onclick=()=>startTurn(-1);$('turnRight').onclick=()=>startTurn(1);
document.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>setLook(b.dataset.look));
$('bendPickup').onclick=()=>setMode('bend');$('studyObject').onclick=()=>setMode('study');
ui.yaw.oninput=()=>{state.targetYaw=Number(ui.yaw.value)*Math.PI/180;ui.yawValue.textContent=ui.yaw.value+'°'};
ui.speed.oninput=()=>{state.speed=Number(ui.speed.value)/100;ui.speedValue.textContent=state.speed.toFixed(2).replace('.',',')+'×'};
ui.bones.onchange=()=>state.showBones=ui.bones.checked;ui.contacts.onchange=()=>state.showContacts=ui.contacts.checked;ui.ref.onchange=()=>ui.refCard.classList.toggle('hidden',!ui.ref.checked);
$('resetRig').onclick=()=>{state.mode='idle';state.yaw=0;state.targetYaw=0;state.phase=0;state.distance=0;state.x=0;state.z=0;state.speed=.85;state.lookYaw=state.lookPitch=state.targetLookYaw=state.targetLookPitch=0;ui.yaw.value=0;ui.speed.value=85;ui.yawValue.textContent='0°';ui.speedValue.textContent='0,85×';setLook('center');setMode('idle')};

canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;lastX=e.clientX;state.targetYaw+=dx*.0105;while(state.targetYaw>Math.PI)state.targetYaw-=Math.PI*2;while(state.targetYaw<-Math.PI)state.targetYaw+=Math.PI*2;const deg=Math.round(state.targetYaw*180/Math.PI);ui.yaw.value=deg;ui.yawValue.textContent=deg+'°'});
canvas.addEventListener('pointerup',e=>{dragging=false;try{canvas.releasePointerCapture(e.pointerId)}catch(_){}});canvas.addEventListener('pointercancel',()=>dragging=false);
window.addEventListener('resize',resize);setLook('center');setMode('idle');requestAnimationFrame(frame);
})();
