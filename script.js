"use strict";
(() => {
  const bio = window.BIO || {};
  const paths = {
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.1A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 9c1 3 2 4 5 5l2-2"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z"/>',
    video: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
    moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    share: '<path d="M12 15V3m-4 4 4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    music: '<path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    arrow: '<path d="m7 17 10-10M7 7h10v10"/>',
    stars: '<path d="m9 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM19 2v6m-3-3h6M19 16v6m-3-3h6"/>'
  };
  const icon = name => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("viewBox", "0 0 24 24");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = paths[name] || paths.globe;
    return el;
  };
  const name = String(bio.name || "Meus links");
  document.title = `${name} · Meus links`;
  document.getElementById("name").textContent = name;
  document.getElementById("handle").textContent = bio.handle || "";
  document.getElementById("description").textContent = bio.description || "";
  if (/^#[0-9a-f]{6}$/i.test(bio.accent || "")) document.documentElement.style.setProperty("--accent", bio.accent);
  const avatar = document.getElementById("avatar");
  avatar.textContent = name.trim().split(/\s+/).slice(0, 2).map(s => Array.from(s)[0] || "").join("").toUpperCase();
  try { if (bio.avatar) {
    const photoUrl = new URL(bio.avatar, document.baseURI);
    if (["http:", "https:", "file:"].includes(photoUrl.protocol)) {
      const img = document.createElement("img");
      img.alt = "";
      img.addEventListener("load", () => avatar.replaceChildren(img));
      img.src = photoUrl.href;
    }
  } } catch { /* Se a foto não for válida, mantenha as iniciais. */ }
  let incomplete = false;
  const links = Array.isArray(bio.links) ? bio.links : [];
  for (const item of links) {
    let url;
    try {
      const candidate = new URL(item.url);
      if (["https:", "http:", "mailto:", "tel:"].includes(candidate.protocol)) url = candidate;
    } catch { /* Um link vazio aparece como botão desativado na prévia. */ }
    const link = document.createElement(url ? "a" : "button");
    link.className = `link${item.featured ? " featured" : ""}`;
    if (url) {
      link.href = url.href;
      if (["https:", "http:"].includes(url.protocol)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    } else {
      link.disabled = true;
      link.title = "Configure o destino em config.js";
      incomplete = true;
    }
    const symbol = document.createElement("span");
    symbol.className = "link-icon";
    symbol.append(icon(item.icon));
    const copy = document.createElement("span");
    copy.className = "link-copy";
    const title = document.createElement("span");
    title.className = "link-title";
    title.textContent = item.title || "Meu link";
    copy.append(title);
    if (item.subtitle) {
      const subtitle = document.createElement("span");
      subtitle.className = "link-subtitle";
      subtitle.textContent = item.subtitle;
      copy.append(subtitle);
    }
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.append(icon("arrow"));
    arrow.setAttribute("aria-hidden", "true");
    link.append(symbol, copy, arrow);
    document.getElementById("links").append(link);
  }
  document.getElementById("demo").hidden = !incomplete;
  let toastTimer;
  function notify(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 4000);
  }
  // Referência persistente para as mudanças de preferência em navegadores móveis.
  const reduced = window.bioMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const effects = document.getElementById("effects");
  let effectsPaused = false;
  const motionAllowed = () => !reduced.matches && !effectsPaused;
  function renderEffects() {
    document.body.classList.toggle("effects-paused", !motionAllowed());
    effects.replaceChildren(icon(motionAllowed() ? "pause" : "stars"));
    effects.disabled = reduced.matches;
    const label = reduced.matches ? "Animações reduzidas no dispositivo" : effectsPaused ? "Ativar animações" : "Pausar animações";
    effects.setAttribute("aria-label", label);
    effects.title = label;
  }
  renderEffects();
  effects.addEventListener("click", () => { effectsPaused = !effectsPaused; renderEffects(); });
  reduced.onchange = renderEffects;
  const share = document.getElementById("share");
  share.append(icon("share"));
  share.addEventListener("click", async () => {
    if (!/^https?:$/.test(location.protocol)) return notify("Publique a página para compartilhar seu endereço.");
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(url); notify("Link copiado! Agora é só compartilhar."); }
      else notify("Copie o endereço desta página na barra do navegador.");
    } catch (error) {
      if (error.name !== "AbortError") notify("Copie o endereço desta página na barra do navegador.");
    }
  });
  // Efeito de água em cada toque, sem impedir cliques ou rolagem.
  document.addEventListener("pointerdown", event => {
    if (!motionAllowed()) return;
    const layer = document.getElementById("ripples");
    while (layer.children.length >= 10) layer.firstElementChild.remove();
    const ring = document.createElement("span");
    ring.className = "ripple";
    ring.style.left = `${event.clientX}px`;
    ring.style.top = `${event.clientY}px`;
    layer.append(ring);
    ring.addEventListener("animationend", () => ring.remove(), { once: true });
  }, { passive: true });

  // Música é opcional. Não carrega áudio até haver um gesto do visitante.
  if (bio.music) {
    const control = document.getElementById("music");
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.volume = 0.35;
    try {
      const musicUrl = new URL(bio.music, document.baseURI);
      if (!["http:", "https:", "file:"].includes(musicUrl.protocol)) throw new Error("Invalid audio URL");
      audio.src = musicUrl.href;
      control.hidden = false;
      const update = () => {
        control.replaceChildren(icon(audio.paused ? "music" : "pause"));
        const label = audio.paused ? "Ativar música" : "Pausar música";
        control.setAttribute("aria-label", label);
        control.title = label;
        control.setAttribute("aria-pressed", String(!audio.paused));
      };
      const play = async () => {
        try { await audio.play(); } catch { notify("Não foi possível tocar a música. Tente pelo botão de som."); }
        update();
      };
      const firstGesture = event => {
        if (control.contains(event.target)) return;
        document.removeEventListener("click", firstGesture);
        void play();
      };
      document.addEventListener("click", firstGesture);
      control.addEventListener("click", () => {
        document.removeEventListener("click", firstGesture);
        if (audio.paused) void play(); else { audio.pause(); update(); }
      });
      audio.addEventListener("pause", update);
      audio.addEventListener("play", update);
      audio.addEventListener("error", () => { update(); notify("O arquivo de música não está disponível."); });
      update();
    } catch { control.hidden = true; }
  }

  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    let width, height, stars = [], meteors = [], frame = 0, last = 0;
    let lastMeteor = -3000, nextAmbient = 2400, targetX = 0, targetY = 0;
    const camera = { x: 0, y: 0, scroll: window.scrollY };
    const wrap = (value, size) => ((value % size) + size) % size;
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let seed = 8107;
      const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      stars = Array.from({ length: Math.min(580, Math.max(220, Math.floor(width * height / 1700))) }, (_, i) => ({
        x: random() * width, y: random() * height, r: i % 17 === 0 ? 1.25 : .35 + random() * .6,
        phase: random() * Math.PI * 2, depth: .2 + random() * .8, bright: i % 17 === 0, warm: i % 7 === 0
      }));
      meteors = [];
    };
    function meteor(time) {
      if (!motionAllowed() || time - lastMeteor < 1200 || meteors.length >= 2) return;
      meteors.push({ x: width * (.15 + Math.random() * .85), y: height * (.02 + Math.random() * .4), start: time, duration: 1100, length: 75 + Math.random() * 85 });
      lastMeteor = time;
    }
    const draw = time => {
      if (effects.disabled !== reduced.matches) renderEffects();
      if (time - last > 32 || !motionAllowed()) {
        camera.x += (targetX - camera.x) * .07;
        camera.y += (targetY - camera.y) * .07;
        camera.scroll += (window.scrollY - camera.scroll) * .1;
        ctx.clearRect(0, 0, width, height);
        for (const star of stars) {
          const x = wrap(star.x + camera.x * star.depth, width);
          const y = wrap(star.y - camera.scroll * star.depth * .3 + camera.y * star.depth, height);
          const alpha = .34 + .55 * (.5 + .5 * Math.sin((motionAllowed() ? time : 0) / 2200 + star.phase));
          if (star.bright) {
            const glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
            glow.addColorStop(0, `rgba(207,226,255,${alpha * .55})`);
            glow.addColorStop(1, "rgba(170,205,255,0)");
            ctx.fillStyle = glow; ctx.fillRect(x - 8, y - 8, 16, 16);
            ctx.strokeStyle = `rgba(220,232,255,${alpha * .4})`; ctx.lineWidth = .5;
            ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
          }
          ctx.fillStyle = star.warm ? `rgba(255,231,203,${alpha})` : `rgba(222,233,255,${alpha})`;
          ctx.beginPath(); ctx.arc(x, y, star.r, 0, Math.PI * 2); ctx.fill();
        }
        if (motionAllowed() && time > nextAmbient) { meteor(time); nextAmbient = time + 6500 + Math.random() * 4000; }
        meteors = meteors.filter(item => time - item.start < item.duration);
        if (motionAllowed()) for (const item of meteors) {
          const progress = (time - item.start) / item.duration;
          const x = item.x - progress * width * .8, y = item.y + progress * height * .5;
          const tailX = x + item.length, tailY = y - item.length * .65;
          const streak = ctx.createLinearGradient(x, y, tailX, tailY);
          streak.addColorStop(0, `rgba(245,249,255,${Math.sin(progress * Math.PI) * .9})`);
          streak.addColorStop(.2, `rgba(168,209,255,${Math.sin(progress * Math.PI) * .45})`);
          streak.addColorStop(1, "rgba(168,209,255,0)");
          ctx.strokeStyle = streak; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tailX, tailY); ctx.stroke();
        }
        last = time;
      }
      if (motionAllowed() && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const restart = () => { cancelAnimationFrame(frame); last = 0; if (!document.hidden) frame = requestAnimationFrame(draw); };
    resize(); restart();
    window.addEventListener("resize", () => { resize(); restart(); });
    document.addEventListener("visibilitychange", restart);
    reduced.onchange = () => { renderEffects(); restart(); };
    effects.addEventListener("click", () => { meteors = []; restart(); });
    window.addEventListener("scroll", () => meteor(performance.now()), { passive: true });
    window.addEventListener("wheel", () => meteor(performance.now()), { passive: true });
    window.addEventListener("touchmove", () => meteor(performance.now()), { passive: true });
    document.addEventListener("pointermove", event => {
      if (!motionAllowed()) return;
      targetX = (event.clientX / width - .5) * 22;
      targetY = (event.clientY / height - .5) * 16;
    }, { passive: true });
  }
})();
