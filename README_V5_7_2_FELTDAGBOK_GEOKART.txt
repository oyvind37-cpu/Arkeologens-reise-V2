ARKEOLOGENS REISE v5.7.0 — AURORA MOTION

Bygger på stabil v5.6.6.

NYTT I DENNE TESTEN
- GSAP 3.15.0 kobles inn før game.js.
- Aurora har nytt bevegelseslag: rolig pust/idle, mer rytmisk gange,
  mykere brems/stopp, kroppsvending, se-seg-rundt, bøying, rekke-bevegelse og hopp.
- Samme godkjente Aurora v5.2.1-bilde brukes; karakterens utseende er ikke byttet.
- CSS-animasjon brukes automatisk som reserve dersom GSAP ikke kan lastes.
- Teksten sier ikke lenger at Aurora fotograferer når kamera ikke vises.
- Sluttknappen heter TILBAKE TIL VERDENSKARTET.
- Verdenskartet viser Egypt som fullført og Mykene som låst opp.
- Nytt world_map_v570.jpg er laget fra det eksisterende godkjente spillkartet.

TEST I SAFARI
1. Start spillet normalt og sjekk at intro og Egypt fortsatt fungerer.
2. Hold venstre/høyre og se på start, gangrytme, vending og stopp.
3. Test BLIKK, UNDERSØK og HOPP.
4. Test de samme bevegelsene inne i gravkammeret.
5. Fullfør kompass-sekvensen og gå ut i ørkenen.
6. Fullfør kapittel 1 og trykk TILBAKE TIL VERDENSKARTET.
7. Bekreft at Egypt står som fullført og Mykene som låst opp.

MERK
Dette er første GSAP-bevegelsespass. Fordi Aurora fortsatt er ett fotorealistisk
spritebilde kan vi ikke bøye albuer/knær uavhengig ennå. Neste nivå er spritesheet
eller rigget figur, men v5.7.0 skal først bevise at styring, timing og kroppsfølelse
kan forbedres uten å rive opp den stabile spillflyten.


V5.7.1:
- Nye filnavn style_571.css og game_571.js tvinger Safari til å hente ferske filer.
- Sluttknapp låst til TILBAKE TIL VERDENSKARTET.
- Horus-mekanismen ryddet: én Horus-relieff og én mørk passasje, ikke to store like paneler.


V5.7.2 – GODKJENT PLAN
- Siste prologknapp: REIS TIL KONGENES DAL.
- Horus-mekanismen: rektangulære museumspaneler fjernet; øyet er hugget i en steinnisje og gløder gyllent.
- Ørkenavslutning: SE TILBAKE fjernet; automatisk overgang til KAPITTEL 1 FULLFØRT når leiren nås.
- Verdenskart: nytt geografisk Robinson-kart med historiske reisemål plassert etter reelle koordinater. Oseberg er plassert ved funnstedet i Vestfold.
- Kartet åpner med et bredt Middelhavsutsnitt som viser Egypt og Mykene; HELE VERDEN viser alle planlagte steder.
- Feltdagbok: tilgjengelig underveis med fanene NOTATER, KART og FUNN. Kartet over graven fylles ut steg for steg.
