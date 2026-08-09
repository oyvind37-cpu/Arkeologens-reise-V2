ARKEOLOGENS REISE v5.8.1
AURORA – COHESIVE MOTION + 3D RIG LAB

1. PRODUKSJONSSPILLET
- Reduserer marionette/sprellemann-effekten fra v5.8.0.
- Arm- og benutslag er kraftig redusert.
- BLIKK beveger hodet først, mens resten av kroppen følger svakt og føttene står plantet.
- Aurora beholder korrekt originalt høyde/bredde-forhold (277 x 891), spesielt i gravkammeret.
- Stopp, vending, bøying og rekke-bevegelse er roligere.
- Ekstern GSAP-avhengighet er fjernet fra produksjonssiden for mer forutsigbar Safari/iPhone-oppførsel.

2. EGEN AURORA-RIGG
Åpne aurora_rig_lab.html i nettleseren (på GitHub Pages blir adressen .../aurora_rig_lab.html).

Rigglaboratoriet er skilt fra selve spillet og brukes bare til Aurora-utvikling. Det inneholder:
- Prosedural 3D-kropp i native WebGL.
- 360 graders rotasjon med finger/mus eller slider.
- Gange fremover og bakover.
- Naturligere motbevegelse mellom hofter/skuldre, knebøy og armsving.
- BLIKK-test med hode + overkropp.
- Valgfri visning av ledd/bones.
- Referanse til den godkjente 2D-Auroraen.

VIKTIG:
3D-modellen er foreløpig en teknisk rigg/mannequin. Den er laget for å få kropp, proporsjoner, 360-graders vending og bevegelseslogikk riktig før vi eventuelt går videre til en detaljert, teksturert og fotorealistisk Aurora-mesh.
