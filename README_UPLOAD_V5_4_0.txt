ARKEOLOGENS REISE v5.4.0 – STABILITETSUTGAVE

FIKSET:
- START REISEN går nå alltid til prologen 1/7–7/7.
- Den gamle nødscript-rutinen som hoppet rett til Egypt etter 120 ms er fjernet.
- Feilnestet Aurora-HTML er reparert i Egypt, gravkammeret og ørkenen.
- Mobilkontroller bruker én inputmodell om gangen (Pointer Events, med touch/mouse fallback).
- Bevegelse nullstilles ved fokusbytte slik at en knapp ikke kan bli hengende inne.
- Piltaster fungerer på desktop; E undersøker/interagerer og mellomrom hopper i Egypt.
- localStorage er sikret slik at spillet ikke stopper hvis lagring er blokkert.
- Fullscreen API prøves først med navigationUI og deretter uten parameter for bredere kompatibilitet.
- WebKit fullscreenchange støttes i tillegg til standardeventet.
- Versjon/cache-busting er oppdatert til 5.4.0.

NETTLESERE:
- Safari / iPhone Safari
- Chrome
- Microsoft Edge
- Firefox

IPHONE FULLSKJERM:
Safari på iPhone støtter ikke vanlig Fullscreen API for alle nettsider. Bruk Del → Legg til på Hjem-skjerm for ekte app-lignende fullskjerm.

MUSIKK:
Pakken kan brukes uten mystisk_musikk.mp3. Hvis filen ligger på GitHub Pages brukes den; hvis ikke starter spillet reservemusikk via Web Audio etter brukerens starttrykk.

GITHUB PAGES:
Last opp hele innholdet i denne mappen og overskriv eksisterende filer. Behold mystisk_musikk.mp3 hvis du allerede har den i repoet.
