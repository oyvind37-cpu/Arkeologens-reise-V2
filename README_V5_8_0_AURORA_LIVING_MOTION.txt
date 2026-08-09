ARKEOLOGENS REISE v5.8.0 – AURORA LIVING MOTION / RIG PASS 1
================================================================

BYGGER PÅ
- v5.7.2 FELTDAGBOK / GEOGRAFISK VERDENSKART
- Eksisterende Egypt-flyt og verdenskart er beholdt.

NYTT I v5.8.0
1. Aurora er ikke lenger bare én rigid bildeflate i animasjonssystemet.
   Den godkjente Aurora-modellen er delt i seks lag:
   - hode
   - torso
   - venstre/høyre arm
   - venstre/høyre bein

2. GSAP styrer nå delene separat ved:
   - idle/pusting
   - gange
   - myk stopp
   - vending
   - se seg rundt
   - bøye seg
   - rekke mot objekt
   - hopp

3. CSS-fallback har også separat arm/bein-bevegelse dersom GSAP-CDN ikke lastes.

4. FELTDAGBOK-knappen er flyttet til fast UI-sone og skal ikke ligge oppå
   Auroras hode i gameplay.

5. Nytt spill starter med blank feltdagbok (0/7). Første loggpunkt registreres
   først når Aurora faktisk begynner å bevege seg inn i ekspedisjonen.

6. Scene 5/9 tekst:
   "Et brev uten avsender ligger og venter på dørmatta når hun kommer hjem …"

7. Verdenskartet fra v5.7.2 er beholdt.

VIKTIG
Dette er første rig-pass. Det gir reell separat kroppsbevegelse i 2D, men er
fortsatt HTML/JS og ikke en full 3D-skjelettmodell. Neste v5.8-pass kan bygge
videre med egne filmsekvenser, flere handlinger og finere frame-assets.
