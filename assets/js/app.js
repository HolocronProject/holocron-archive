document.addEventListener("DOMContentLoaded", () => {
  const boot = document.querySelector(".boot-screen");
  if (boot) {
    const hasBooted = sessionStorage.getItem("holocron-booted");
    if (hasBooted) {
      boot.remove();
    } else {
      setTimeout(() => {
        boot.classList.add("hide");
        sessionStorage.setItem("holocron-booted", "1");
        setTimeout(() => boot.remove(), 800);
      }, 2400);
    }
  }
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
});
