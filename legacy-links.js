// Preserve links already shared on note without changing the roulette's storage keys.
function routeLegacyRoulette() {
  if (location.hash === "#roulette") location.replace("roulette.html");
}
routeLegacyRoulette();
window.addEventListener("hashchange", routeLegacyRoulette);
