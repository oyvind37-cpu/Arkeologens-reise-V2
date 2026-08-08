(() => {
const $=id=>document.getElementById(id);
const screens=[...document.querySelectorAll(".screen")];

const storage={
  get(key){try{return localStorage.getItem(key)}catch(_){return null}},
  set(key,value){try{localStorage.setItem(key,value)}catch(_){}},
  remove(key){try{localStorage.removeItem(key)}catch(_){}}
};
const game=$("game"),world=$("world"),aurora=$("aurora"),dialogText=$("dialogText");
const plate=$("pressurePlate"),arrows=$("arrows"),eyeWall=$("eyeWall"),eyeGlow=$("eyeGlow"),wallDust=$("wallDust");
const door=$("door"),wow=$("wowLight"),nearHint=$("nearHint"),interact=$("interact"),enterChamberBtn=$("enterChamberBtn");
const state={x:180,left:false,right:false,jumping:false,stage:0,vision:false,camera:0,idle:0,last:0,nearEye:false,eyeOpened:false,floorHintShown:false};

function show(s){screens.forEach(x=>x.classList.remove("active"));s.classList.add("active")}
function say(t){dialogText.textContent=t;state.idle=performance.now()}
function objective(t,n){$("objective").textContent=t;$("progress").textContent=n+" / 4"}

const musicTrack=$("musicTrack");
const musicIntroBtn=$("musicIntroBtn");
const musicGameBtn=$("musicGameBtn");
let musicWanted=true;
let fallbackAudio=null;

musicTrack.volume=.38;

function startFallbackMusic(){
  if(fallbackAudio)return;
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    const ac=new AudioContext();
    const master=ac.createGain();
    master.gain.value=.055;
    master.connect(ac.destination);

    const frequencies=[55,82.41,110,164.81];
    const oscillators=[];
    frequencies.forEach((frequency,index)=>{
      const osc=ac.createOscillator();
      const gain=ac.createGain();
      osc.type=index%2===0?"sine":"triangle";
      osc.frequency.value=frequency;
      gain.gain.value=index===0?.75:.18;
      osc.connect(gain).connect(master);
      osc.start();
      oscillators.push({osc,gain});
    });

    const lfo=ac.createOscillator();
    const lfoGain=ac.createGain();
    lfo.frequency.value=.075;
    lfoGain.gain.value=.018;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    fallbackAudio={ac,master,oscillators,lfo};
  }catch(error){
    console.log("Reservemusikk kunne ikke starte:",error);
  }
}

async function startMusic(){
  if(!musicWanted)return;

  // Start reservemusikken direkte i brukerens klikk. Det gjør lyd robust i
  // Safari/iOS selv om den valgfrie MP3-filen ikke finnes på serveren.
  startFallbackMusic();
  if(fallbackAudio?.ac?.state==="suspended") fallbackAudio.ac.resume();

  const source=musicTrack.dataset.src;
  if(!source)return;

  try{
    if(!musicTrack.getAttribute("src")) musicTrack.src=source;
    musicTrack.currentTime=0;
    await musicTrack.play();
    if(fallbackAudio){
      fallbackAudio.master.gain.setTargetAtTime(0,fallbackAudio.ac.currentTime,.08);
    }
  }catch(error){
    console.log("Valgfri MP3 kunne ikke spilles. Reservemusikk fortsetter.",error);
    resumeFallback();
  }
}

function stopMusic(){
  musicTrack.pause();
  if(fallbackAudio){
    fallbackAudio.master.gain.setTargetAtTime(0,fallbackAudio.ac.currentTime,.08);
  }
}

function resumeFallback(){
  if(fallbackAudio){
    fallbackAudio.master.gain.setTargetAtTime(.055,fallbackAudio.ac.currentTime,.08);
    fallbackAudio.ac.resume();
  }else{
    startFallbackMusic();
  }
}

function updateMusicButtons(){
  musicIntroBtn.textContent=musicWanted?"♫ MUSIKK PÅ":"♫ MUSIKK AV";
  musicIntroBtn.classList.toggle("off",!musicWanted);
  musicGameBtn.textContent=musicWanted?"♫":"♪";
  musicGameBtn.classList.toggle("off",!musicWanted);
}

function toggleMusic(){
  musicWanted=!musicWanted;
  updateMusicButtons();

  if(musicWanted){
    startMusic();
  }else{
    stopMusic();
  }
}

musicIntroBtn.onclick=toggleMusic;
musicGameBtn.onclick=toggleMusic;
updateMusicButtons();

const resetGameBtn=$("resetGameBtn");
resetGameBtn.onclick=()=>{
  storage.remove("aurora_compass"); storage.remove("aurora_compass_v521"); storage.remove("aurora_prologue_seen");
  location.reload();
};

const startBtn=$("startBtn");
let gameStarted=false;

const prologue=$("prologue");
const prologueVideo=$("prologueVideo");
const prologueKicker=$("prologueKicker");
const prologueTitle=$("prologueTitle");
const prologueText=$("prologueText");
const prologueStep=$("prologueStep");
const prologueTotal=$("prologueTotal");
const prologueFade=$("prologueFade");
const storyOverlay=$("storyOverlay");
const threatLetter=$("threatLetter");
const watcherReveal=$("watcherReveal");
const prologueBack=$("prologueBack");
const prologueNext=$("prologueNext");
const prologueSkip=$("prologueSkip");
const scanOverlay=$("scanOverlay");
const scanStatus=$("scanStatus");
const scanCoordinates=$("scanCoordinates");
let scanComplete=false;
let scanRunning=false;


const prologueScenes=[
  {
    kicker:"OSLO · OLDSAKSSAMLINGEN",
    title:"En vanlig arbeidsdag – helt til telefonen vibrerer",
    video:"prologue_01_cinema.mp4",
    text:"Aurora Vale arbeider som professor ved Oldsakssamlingen. Mellom katalogisering, forskning og undervisning kommer det en melding som skal endre planene hennes."
  },
  {
    kicker:"MELDING FRA KAIRO",
    title:"«Kan du ringe meg når du har anledning?»",
    video:"prologue_02_cinema.mp4",
    text:"En kollega ved Det egyptiske museum i Kairo skriver at de har gjort et uvanlig funn i et eldre magasin i kjelleren."
  },
  {
    kicker:"TELEFONSAMTALE · KAIRO",
    title:"En eske bak to gamle sfinkser",
    video:"prologue_03_cinema.mp4",
    text:"Egyptologen forteller at en trekasse fra en utgraving på 1920-tallet har stått urørt bak to sfinksskulpturer. Ingen ser ut til å ha åpnet den på flere tiår."
  },
  {
    kicker:"FUNNET",
    title:"To forseglede pergamentruller",
    video:"prologue_04_cinema.mp4",
    text:"I esken ligger to gamle ruller, begge bundet med bånd og preget med seglet til en ukjent farao. Seglene er intakte – og ingen ønsker å bryte dem."
  },
  {
    kicker:"OSLO · KVELDEN FØR AVREISE",
    title:"Et brev uten avsender",
    video:"prologue_01_clean.mp4",
    overlay:"letter",
    text:"En konvolutt ligger innenfor døren. Ingen frimerker. Ingen avsender. Aurora leser advarselen, fotograferer det ukjente merket og legger brevet i feltdagboken. «Noen har levert dette personlig.»"
  },
  {
    kicker:"NOEN FØLGER MED",
    title:"En skikkelse i skyggene",
    video:"prologue_02_clean.mp4",
    overlay:"watcher",
    text:"Neste morgen forlater Aurora Oslo. På avstand følger en ukjent mann henne med blikket. Ansiktet er skjult. Han tar opp telefonen og sier bare to ord: «Hun dro.»"
  },
  {
    kicker:"DET EGYPTISKE MUSEUM · KAIRO",
    title:"Undersøk de forseglede rullene",
    video:"prologue_05_v537.mp4",
    interactive:"scan",
    text:"I Kairo venter den nye skanneren. Den kan lese lagene i rullen uten å bryte seglet. Start analysen og se om tegnene fortsatt kan gjenfinnes."
  },
  {
    kicker:"KOORDINATENE",
    title:"Analysen gir et resultat",
    video:"prologue_06_v538.mp4",
    text:"Blant tegnene dukker det opp lengde- og breddegrader. De peker mot et punkt langt ute i ørkenen, utenfor de kjente funnstedene. Aurora bestemmer seg for å undersøke stedet – og sier ingenting om brevet."
  },
  {
    kicker:"UT I ØRKENEN",
    title:"Reisen begynner",
    video:"prologue_07_cinema.mp4",
    text:"Museet skaffer en erfaren kamelfører de stoler på. Sammen forlater Aurora Kairo og setter kurs mot det ukjente punktet. Langt bak dem starter en annen reisende samme vei."
  }
];
let prologueIndex=0;

function setStoryOverlay(type){
  if(!storyOverlay)return;
  storyOverlay.classList.remove("active","show-letter","show-watcher");
  storyOverlay.setAttribute("aria-hidden","true");
  if(!type)return;
  storyOverlay.setAttribute("aria-hidden","false");
  storyOverlay.classList.add("active", type==="letter"?"show-letter":"show-watcher");
}

function playCurrentPrologueVideo(scene){
  prologueVideo.pause();
  prologueVideo.src=scene.video;
  prologueVideo.currentTime=0;
  const p=prologueVideo.play();
  if(p && p.catch) p.catch(()=>{});
}

function renderPrologue({transition=true}={}){
  const scene=prologueScenes[prologueIndex];
  const applyScene=()=>{
    prologueKicker.textContent=scene.kicker;
    prologueTitle.textContent=scene.title;
    prologueText.textContent=scene.text;
    prologueStep.textContent=String(prologueIndex+1);
    if(prologueTotal) prologueTotal.textContent=String(prologueScenes.length);
    prologueBack.disabled=prologueIndex===0;

    scanRunning=false;
    scanComplete=false;
    if(scanOverlay){
      scanOverlay.classList.remove("active","complete");
      scanOverlay.setAttribute("aria-hidden","true");
    }
    if(scanStatus) scanStatus.textContent="SKANNER LAGENE …";
    setStoryOverlay(scene.overlay || null);

    if(scene.interactive==="scan"){
      prologueNext.textContent="START SKANNING";
    }else{
      prologueNext.textContent=prologueIndex===prologueScenes.length-1?"REIS TIL EGYPT":"FORTSETT";
    }
    playCurrentPrologueVideo(scene);
  };

  if(!transition || !prologueFade){
    applyScene();
    return;
  }
  prologueFade.classList.add("active");
  setTimeout(()=>{
    applyScene();
    requestAnimationFrame(()=>setTimeout(()=>prologueFade.classList.remove("active"),80));
  },360);
}

function beginEgypt(){
  if(fullscreenBtn) fullscreenBtn.style.display="";
  if(prologueVideo){prologueVideo.pause(); prologueVideo.removeAttribute("src"); prologueVideo.load();}
  if(gameStarted)return;
  if(prologueVideo){prologueVideo.pause();}
  gameStarted=true;
  show($("game"));
  say("Vi er fremme. Gå mot høyre og se etter noe uvanlig.");
  requestAnimationFrame(loop);
}

function openPrologue(){
  if(fullscreenBtn) fullscreenBtn.style.display="none";
  show(prologue);
  prologueIndex=0;
  renderPrologue({transition:false});
  startMusic().catch(error=>console.log("Musikken kunne ikke starte, men introen fortsetter.",error));
}

startBtn.addEventListener("click",openPrologue);

prologueNext.onclick=()=>{
  const scene=prologueScenes[prologueIndex];

  if(scene.interactive==="scan"){
    if(scanRunning) return;

    if(!scanComplete){
      scanRunning=true;
      prologueNext.disabled=true;
      prologueNext.textContent="SKANNER …";
      prologueText.textContent="Røntgenlagene bygges opp digitalt. Tegnene ligger skjult inne i den forseglede rullen.";

      if(scanOverlay){
        scanOverlay.setAttribute("aria-hidden","false");
        scanOverlay.classList.add("active");
      }

      setTimeout(()=>{
        if(scanStatus) scanStatus.textContent="HIEROGLYFER IDENTIFISERT";
        prologueText.textContent="Der … tegnene er fortsatt bevart mellom lagene. Systemet rekonstruerer teksten uten at seglet brytes.";
      },1500);

      setTimeout(()=>{
        if(scanOverlay) scanOverlay.classList.add("complete");
        if(scanStatus) scanStatus.textContent="KOORDINATER FUNNET";
        scanComplete=true;
        scanRunning=false;
        prologueNext.disabled=false;
        prologueNext.textContent="SE RESULTATET";
        prologueText.textContent="Analysen finner et mønster i teksten — og to tallsekvenser som ser ut som geografiske koordinater.";
      },3200);
      return;
    }

    prologueIndex++;
    renderPrologue();
    return;
  }

  if(prologueIndex<prologueScenes.length-1){
    prologueIndex++;
    renderPrologue();
  }else{
    beginEgypt();
  }
};
prologueBack.onclick=()=>{
  if(prologueIndex>0){
    prologueIndex--;
    renderPrologue();
  }
};
prologueSkip.onclick=beginEgypt;

// v5.5.1: Safari must never auto-skip story cards when a background clip ends.
// Every prologue scene now stays visible until the player presses FORTSETT.
prologueVideo.addEventListener("ended",()=>{
  if(!prologue.classList.contains("active")) return;
  try {
    prologueVideo.pause();
    // Keep the final frame on screen. No automatic scene advance.
  } catch(e) {}
});


function bindHoldButton(id,onDown,onUp){
  const b=$(id);
  if(!b)return;
  const down=ev=>{ev.preventDefault();onDown();};
  const up=ev=>{ev.preventDefault();onUp();};
  if(window.PointerEvent){
    b.addEventListener("pointerdown",down,{passive:false});
    ["pointerup","pointercancel","pointerleave"].forEach(type=>b.addEventListener(type,up,{passive:false}));
  }else{
    b.addEventListener("touchstart",down,{passive:false});
    ["touchend","touchcancel"].forEach(type=>b.addEventListener(type,up,{passive:false}));
    b.addEventListener("mousedown",down);
    ["mouseup","mouseleave"].forEach(type=>b.addEventListener(type,up));
  }
}
function hold(id,key){
  bindHoldButton(id,()=>{state[key]=true;state.idle=performance.now()},()=>{state[key]=false});
}
hold("left","left");hold("right","right");

$("jump").onclick=()=>{
 if(state.jumping)return;
 state.jumping=true;
 aurora.classList.add("jump");
 setTimeout(()=>{aurora.classList.remove("jump");state.jumping=false},820);
};

$("vision").onclick=()=>{
 state.vision=!state.vision;
 plate.classList.toggle("glow",state.vision && state.stage<2);
 eyeWall.classList.toggle("ready",state.vision && state.stage>=2 && !state.eyeOpened);
 aurora.classList.add("observe");
 setTimeout(()=>aurora.classList.remove("observe"),1700);
 if(state.stage<2){
   say(state.vision?"Arkeologblikk: Den midterste steinen er mer slitt enn de andre.":"Arkeologblikk avsluttet.");
 }else{
   say(state.vision?"Arkeologblikk: Horus-øyet skjuler en mekanisk lås.":"Arkeologblikk avsluttet.");
 }
};

$("interact").onclick=()=>{
 aurora.classList.add("observe");
 setTimeout(()=>aurora.classList.remove("observe"),1700);

 if(state.stage===0){
   if(state.x<560){
     say("Jeg må gå nærmere den slitte steinen.");
     return;
   }
   state.stage=1;
   objective("Undersøk gulvet",2);
   plate.classList.add("glow");
   say("Her er noe risset inn i gulvet. Den midterste steinen er tydelig mer slitt.");
   return;
 }

 if(state.stage===1){
   if(state.x<640||state.x>880){
     say("Jeg må stå helt ved den slitte steinen før jeg undersøker.");
     return;
   }
   plate.classList.remove("glow");
   arrows.classList.add("show");
   setTimeout(()=>arrows.classList.remove("show"),1200);
   state.stage=2;
   objective("Finn Horus-øyet",3);
   eyeWall.classList.add("ready");
   say("Piler i veggen... men mekanismen fortsetter videre. Se etter Horus-øyet.");
   return;
 }

 if(state.stage===2){
   if(!state.nearEye){
     say("Horus-øyet er lenger mot høyre. Jeg må stå helt inntil veggen.");
     return;
   }
   state.eyeOpened=true;
   eyeWall.classList.add("ready");
   wallDust.classList.add("active");
   say("Fantastisk... mekanismen virker fortsatt etter over tre tusen år.");

   setTimeout(()=>{
     eyeWall.classList.add("open");
     nearHint.classList.add("hidden");
     interact.classList.remove("ready");
   },450);

   setTimeout(()=>{
     door.classList.add("open");
     wow.classList.add("show");
     state.stage=3;
     objective("Gå inn i gravkammeret",4);
     enterChamberBtn.classList.remove("hidden");
     say("Der åpnet den seg... Et større kammer ligger bak veggen.");
   },1500);
   return;
 }

 if(state.stage===3){
   say("Inngangen er åpen. Trykk GÅ INN I SKATTEKAMMERET.");
 }
};

function updateNearEye(){
 state.nearEye=state.stage===2 && !state.eyeOpened && state.x>=1210 && state.x<=1510;
 nearHint.classList.toggle("hidden",!state.nearEye);
 interact.classList.toggle("ready",state.nearEye);
 eyeWall.classList.toggle("ready",state.stage===2 && !state.eyeOpened);
}

function releaseMovement(){
  state.left=false;state.right=false;
  chamberLeft=false;chamberRight=false;
  desertLeft=false;desertRight=false;
}
window.addEventListener("blur",releaseMovement);
document.addEventListener("visibilitychange",()=>{if(document.hidden)releaseMovement()});
window.addEventListener("pointerup",releaseMovement);
window.addEventListener("touchend",releaseMovement,{passive:true});

// Desktop keyboard support for Chrome, Edge, Firefox and Safari.
window.addEventListener("keydown",e=>{
  if(["ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();
  if(game.classList.contains("active")){
    if(e.key==="ArrowLeft")state.left=true;
    if(e.key==="ArrowRight")state.right=true;
    if(e.key===" " && !e.repeat)$("jump").click();
    if((e.key==="e"||e.key==="E") && !e.repeat)$("interact").click();
  }else if(chamber.classList.contains("active")){
    if(e.key==="ArrowLeft")chamberLeft=true;
    if(e.key==="ArrowRight")chamberRight=true;
    if((e.key==="e"||e.key==="E") && !e.repeat)$("chamberInspect").click();
  }else if(desert.classList.contains("active")){
    if(e.key==="ArrowLeft")desertLeft=true;
    if(e.key==="ArrowRight")desertRight=true;
  }
});
window.addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft"){state.left=false;chamberLeft=false;desertLeft=false;}
  if(e.key==="ArrowRight"){state.right=false;chamberRight=false;desertRight=false;}
});

function loop(t){
 const dt=Math.min((t-state.last)/1000||0,.035);state.last=t;

 if(state.left){
   state.x-=225*dt;
   aurora.classList.add("face-left","walk");
 }
 if(state.right){
   state.x+=225*dt;
   aurora.classList.remove("face-left");
   aurora.classList.add("walk");
 }
 if(!state.left&&!state.right)aurora.classList.remove("walk");

 state.x=Math.max(60,Math.min(2180,state.x));
 aurora.style.left=state.x+"px";

 updateNearEye();

 const desired=Math.max(0,Math.min(2400-innerWidth,state.x-innerWidth*.36));
 state.camera+=(desired-state.camera)*.10;
 world.style.transform=`translateX(${-state.camera}px)`;

 if(state.stage===0&&state.x>560){
   objective("Undersøk gulvet",2);
   plate.classList.add("glow");
   if(!state.floorHintShown){
     state.floorHintShown=true;
     say("Ser du forskjellen i steinene? Stå ved den slitte steinen og trykk UNDERSØK.");
   }
 }

 if(performance.now()-state.idle>9000){
   state.idle=performance.now();
   if(state.stage===1)say("Se én gang til. Den slitte steinen er viktig.");
   else if(state.stage===2)say("Horus-øyet i veggen skjuler trolig den neste mekanismen.");
 }

 requestAnimationFrame(loop);
}

/* ---------- GRAVKAMMER 4.6 ---------- */
const chamber=$("chamber"),journal=$("journal"),desert=$("desert"),chamberAurora=$("chamberAurora"),chamberCamera=$("chamberCamera"),innerDoor=$("innerDoor"),cinematicBars=$("cinematicBars"),transitionFade=$("transitionFade"),chamberExitFade=$("chamberExitFade"),inventoryBadge=$("inventoryBadge");
const chamberText=$("chamberDialogText"),chamberObjective=$("chamberObjective"),chamberProgress=$("chamberProgress");
const sarcophagus=$("sarcophagus"),symbolPuzzle=$("symbolPuzzle"),treasureChest=$("treasureChest"),compassArtifact=$("compassArtifact");
let chamberX=7,chamberLeft=false,chamberRight=false,chamberStage=0,glyphs=[],compassCollected=storage.get("aurora_compass_v521")==="yes";

function chamberSay(text){chamberText.textContent=text}
function chamberGoal(text,n){chamberObjective.textContent=text;chamberProgress.textContent=n+" / 3"}

enterChamberBtn.onclick=()=>{
  enterChamberBtn.classList.add("hidden");
  cinematicBars.classList.remove("hidden");
  cinematicBars.classList.add("active");
  say("Vent... døren fortsetter å åpne seg.");

  setTimeout(()=>{innerDoor.classList.remove("passed");innerDoor.classList.add("open");},350);
  setTimeout(()=>{
    transitionFade.classList.remove("hidden");
    transitionFade.classList.add("active");
  },1100);

  setTimeout(()=>{
    show(chamber);
    chamberCamera.style.transform="";
    chamberCamera.style.filter="";
    chamberCamera.classList.remove("settled");
    chamberCamera.classList.add("entering");
    chamberX=3;
    chamberAurora.style.left=chamberX+"%";
    chamberAurora.classList.add("walk");
    chamberStage=0;
    glyphs=[];
    symbolPuzzle.classList.remove("solved");
    symbolPuzzle.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));
    sarcophagus.classList.remove("open");
    treasureChest.classList.remove("revealed","open");
    compassArtifact.classList.remove("show","collected");
  if(compassCollected){compassArtifact.style.display="none";}else{compassArtifact.style.display="block";}
    chamberGoal("Gå inn i kammeret",1);
    chamberSay("Luften er annerledes her inne... ingen har vært her på svært lenge.");
  },1850);

  let autoWalk=setInterval(()=>{
    chamberX+=1.25;
    chamberAurora.style.left=chamberX+"%";
    if(chamberX>=18){
      clearInterval(autoWalk);
      chamberAurora.classList.remove("walk");
      chamberAurora.classList.add("stop-step");
      setTimeout(()=>chamberAurora.classList.remove("stop-step"),250);
      chamberCamera.classList.remove("entering");
      chamberCamera.classList.add("settled");
      innerDoor.classList.add("passed");
      chamberGoal("Undersøk hieroglyfene",1);
      chamberSay("Utrolig... veggene er dekket av hieroglyfer. Ta deg tid til å se.");
      cinematicBars.classList.remove("active");
      setTimeout(()=>cinematicBars.classList.add("hidden"),700);
    }
  },70);
};

function chamberHold(id,key){
  bindHoldButton(id,
    ()=>{if(key==="left")chamberLeft=true;else chamberRight=true},
    ()=>{if(key==="left")chamberLeft=false;else chamberRight=false}
  );
}
chamberHold("chamberLeft","left");
chamberHold("chamberRight","right");

symbolPuzzle.querySelectorAll("button").forEach(button=>{
  button.onclick=()=>{
    if(chamberStage!==1)return;
    glyphs.push(button.dataset.glyph);
    button.classList.add("selected");
    if(glyphs.length===3){
      if(glyphs.join(",")==="sun,eye,ankh"){
        chamberStage=2;
        symbolPuzzle.classList.add("solved");
        sarcophagus.classList.add("open");
        treasureChest.classList.add("revealed");
        chamberGoal("Undersøk gullkisten",3);
        chamberSay("Sol, øye og liv. Sarkofagen skjulte en ny sokkel... og en gullkiste.");
      }else{
        chamberSay("Rekkefølgen er feil. Les veggen fra soloppgang mot livstegnet.");
        glyphs=[];
        setTimeout(()=>symbolPuzzle.querySelectorAll("button").forEach(b=>b.classList.remove("selected")),450);
      }
    }
  };
});

$("chamberInspect").onclick=()=>{
  if(chamberStage===0){
    if(chamberX<30){
      chamberSay("Jeg må gå nærmere hieroglyfene i midten av kammeret.");
      return;
    }
    chamberStage=1;
    chamberGoal("Løs vokternes rekkefølge",2);
    chamberSay("Innskriften sier: Solen ser. Øyet vokter. Livet åpner.");
    return;
  }
  if(chamberStage===1){
    chamberSay("Trykk symbolene i denne rekkefølgen: sol, øye og ankh.");
    return;
  }
  if(chamberStage===2){
    if(chamberX<43){
      chamberSay("Jeg må stå nærmere gullkisten.");
      return;
    }
    chamberStage=3;
    treasureChest.classList.add("open");
    compassArtifact.classList.add("show");
    chamberGoal("Ta opp kompasset",3);
    chamberSay("Et kompass... men nålen peker ikke mot nord. Trykk på kompasset for å undersøke funnet.");
  }
};

compassArtifact.onclick=()=>{
  if(chamberStage!==3 || compassCollected)return;
  compassArtifact.classList.add("collected");
  setTimeout(()=>show(journal),450);
};

$("closeJournal").onclick=()=>{
  if(!compassCollected){
    compassCollected=true;
    storage.set("aurora_compass_v521","yes");
  }
  show(chamber);
  compassArtifact.classList.add("collected");
  treasureChest.classList.add("finished");
  inventoryBadge.classList.remove("hidden");
  setTimeout(()=>inventoryBadge.classList.add("hidden"),2400);
  chamberSay("Funnet er registrert. Nå må vi tilbake til dagslyset.");
  chamberGoal("Forlat gravkammeret",3);

  chamberLeft=false;
  chamberRight=false;
  chamberVelocity=0;

  setTimeout(()=>{
    chamberAurora.classList.add("face-left","walk");
    const exitWalk=setInterval(()=>{
      chamberX-=1.05;
      chamberAurora.style.left=chamberX+"%";
      if(chamberX<=6){
        clearInterval(exitWalk);
        chamberAurora.classList.remove("walk");
        chamberExitFade.classList.add("active");
        setTimeout(()=>startDesertScene(),1250);
      }
    },55);
  },800);
};

let chamberVelocity=0;
function chamberLoop(){
  if(chamber.classList.contains("active")){
    const accelerating=chamberLeft||chamberRight;

    if(chamberLeft){
      chamberVelocity=Math.max(chamberVelocity-.07,-.56);
      chamberAurora.classList.add("face-left","walk","start-step");
    }else if(chamberRight){
      chamberVelocity=Math.min(chamberVelocity+.07,.56);
      chamberAurora.classList.remove("face-left");
      chamberAurora.classList.add("walk","start-step");
    }else{
      chamberVelocity*=.72;
      chamberAurora.classList.remove("start-step");
      if(Math.abs(chamberVelocity)<.025){
        chamberVelocity=0;
        if(chamberAurora.classList.contains("walk")){
          chamberAurora.classList.remove("walk");
          chamberAurora.classList.add("stop-step");
          setTimeout(()=>chamberAurora.classList.remove("stop-step"),220);
        }
      }
    }

    chamberX+=chamberVelocity;
    chamberX=Math.max(4,Math.min(83,chamberX));
    chamberAurora.style.left=chamberX+"%";
  }
  requestAnimationFrame(chamberLoop);
}
requestAnimationFrame(chamberLoop);


/* ---------- ØRKENSCENE 4.8 ---------- */
const desertAurora=$("desertAurora"),desertText=$("desertDialogText"),chapterComplete=$("chapterComplete");
let desertX=20,desertLeft=false,desertRight=false,desertVelocity=0,desertStarted=false;

function desertSay(text){desertText.textContent=text}
function startDesertScene(){
  show(desert);
  desertStarted=true;
  desertX=20;
  desertAurora.style.left=desertX+"%";
  desertSay("Mykene får vente. Først må funnet dokumenteres ordentlig.");
  setTimeout(()=>{
    chapterComplete.classList.remove("hidden");
    setTimeout(()=>chapterComplete.classList.add("hidden"),3200);
  },900);
}

function desertHold(id,key){
  bindHoldButton(id,
    ()=>{if(key==="left")desertLeft=true;else desertRight=true},
    ()=>{if(key==="left")desertLeft=false;else desertRight=false}
  );
}
desertHold("desertLeft","left");
desertHold("desertRight","right");

$("desertInspect").onclick=()=>{
  desertAurora.classList.add("face-left");
  desertSay("Historien har ventet i tre tusen år. Nå skal den dokumenteres med respekt.");
  setTimeout(()=>desertAurora.classList.remove("face-left"),1800);
};

function desertLoop(){
  if(desert.classList.contains("active")){
    if(desertLeft){
      desertVelocity=Math.max(desertVelocity-.06,-.48);
      desertAurora.classList.add("face-left","walk");
    }else if(desertRight){
      desertVelocity=Math.min(desertVelocity+.06,.48);
      desertAurora.classList.remove("face-left");
      desertAurora.classList.add("walk");
    }else{
      desertVelocity*=.72;
      if(Math.abs(desertVelocity)<.02){
        desertVelocity=0;
        desertAurora.classList.remove("walk");
      }
    }
    desertX+=desertVelocity;
    desertX=Math.max(7,Math.min(82,desertX));
    desertAurora.style.left=desertX+"%";

    if(desertX>70){
      $("desertObjective").textContent="Leiren er nådd";
      desertSay("Først fotografier, målinger og konservering. Deretter kan vi planlegge reisen videre.");
    }
  }
  requestAnimationFrame(desertLoop);
}
requestAnimationFrame(desertLoop);

})();

// v5.3.2 mobile fullscreen / standalone
const fullscreenBtn=document.getElementById("fullscreenBtn");
const fullscreenHelp=document.getElementById("fullscreenHelp");
const fullscreenHelpClose=document.getElementById("fullscreenHelpClose");

function isStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone === true;
}
function syncFullscreenButton(){
  if(!fullscreenBtn)return;
  fullscreenBtn.textContent = (document.fullscreenElement || isStandalone())
    ? "⛶ FULLSKJERM"
    : "⛶ FULLSKJERM";
  if(isStandalone()) fullscreenBtn.classList.add("standalone");
}
async function enterGameFullscreen(){
  const root=document.documentElement;
  if(root.requestFullscreen){
    try{
      await root.requestFullscreen({navigationUI:"hide"});
      return;
    }catch(_){
      try{await root.requestFullscreen();return;}catch(__){}
    }
  }
  if(root.webkitRequestFullscreen){
    try{root.webkitRequestFullscreen();return;}catch(_){}
  }
  // iPhone Safari may not expose document fullscreen for general elements.
  if(!isStandalone() && fullscreenHelp){
    fullscreenHelp.hidden=false;
  }
}
fullscreenBtn?.addEventListener("click", enterGameFullscreen);
fullscreenHelpClose?.addEventListener("click",()=>fullscreenHelp.hidden=true);
document.addEventListener("fullscreenchange",syncFullscreenButton);
document.addEventListener("webkitfullscreenchange",syncFullscreenButton);
window.addEventListener("load",syncFullscreenButton);
