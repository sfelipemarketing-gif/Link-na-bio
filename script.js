"use strict";
(() => {
  const bio = window.BIO || {};
  const paths = {
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.1A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 9c1 3 2 4 5 5l2-2"/>',
    video: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3Z"/>',
    music: '<path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',
    arrow: '<path d="m7 17 10-10M7 7h10v10"/>'
  };
  const icon = name => { const el = document.createElementNS("http://www.w3.org/2000/svg", "svg"); el.setAttribute("viewBox", "0 0 24 24"); el.setAttribute("aria-hidden", "true"); el.innerHTML = paths[name] || paths.music; return el; };
  const $ = selector => document.querySelector(selector);
  const notify = message => { const toast = $("#toast"); toast.textContent = message; toast.classList.add("visible"); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove("visible"), 3400); };

  document.documentElement.style.setProperty("--accent", bio.accent || "#7df9ff");
  $("#name").textContent = bio.name || "SFelipe";
  $("#handle").textContent = bio.handle || "@SFelipeOficial";
  $("#year").textContent = new Date().getFullYear();
  document.title = `${bio.name || "SFelipe"} · Tech Landing`;
  const avatar = $("#avatar");
  avatar.textContent = String(bio.name || "SF").trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  if (bio.avatar) { const image = new Image(); image.alt = ""; image.onload = () => avatar.replaceChildren(image); image.src = bio.avatar; }

  const links = Array.isArray(bio.links) ? bio.links : [];
  links.forEach((item, index) => {
    let url; try { const candidate = new URL(item.url); if (["http:", "https:", "mailto:", "tel:"].includes(candidate.protocol)) url = candidate.href; } catch {}
    const link = document.createElement(url ? "a" : "button");
    link.className = `link magnetic${item.featured ? " featured" : ""}`;
    if (url) { link.href = url; if (url.startsWith("http")) { link.target = "_blank"; link.rel = "noopener noreferrer"; } } else { link.disabled = true; }
    const symbol = document.createElement("span"); symbol.className = "link-icon"; symbol.append(icon(item.icon));
    const number = document.createElement("span"); number.className = "link-number"; number.textContent = `0${index + 1}`;
    const copy = document.createElement("span"); copy.className = "link-copy";
    const tag = document.createElement("span"); tag.className = "link-tag"; tag.textContent = item.tag || "ACCESS POINT";
    const title = document.createElement("span"); title.className = "link-title"; title.textContent = item.title || "Meu link";
    const subtitle = document.createElement("span"); subtitle.className = "link-subtitle"; subtitle.textContent = item.subtitle || "Acessar canal";
    copy.append(tag, title, subtitle);
    const bottom = document.createElement("span"); bottom.className = "link-bottom";
    const status = document.createElement("span"); status.className = "link-tag"; status.textContent = item.featured ? "RECOMMENDED" : "OPEN CHANNEL"; status.style.margin = "0";
    const arrow = document.createElement("span"); arrow.className = "link-arrow"; arrow.append(icon("arrow")); bottom.append(status, arrow);
    link.append(symbol, number, copy, bottom); $("#links").append(link);
  });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  const effects = $("#effects");
  const renderEffects = () => { document.body.classList.toggle("effects-paused", paused || reduced.matches); effects.textContent = paused || reduced.matches ? "✦" : "◌"; effects.setAttribute("aria-label", paused ? "Ativar animações" : "Pausar animações"); };
  renderEffects(); effects.addEventListener("click", () => { paused = !paused; renderEffects(); });
  reduced.addEventListener?.("change", renderEffects);

  document.querySelectorAll("[data-scroll]").forEach(button => button.addEventListener("click", () => document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth" })));
  document.querySelectorAll(".magnetic").forEach(card => card.addEventListener("pointermove", event => { if (reduced.matches) return; const rect = card.getBoundingClientRect(); card.style.setProperty("--mx", `${event.clientX - rect.left}px`); card.style.setProperty("--my", `${event.clientY - rect.top}px`); }));
  document.addEventListener("pointerdown", event => { if (paused || reduced.matches) return; const layer = $("#ripples"); while (layer.children.length > 8) layer.firstElementChild.remove(); const ring = document.createElement("span"); ring.className = "ripple"; ring.style.left = `${event.clientX}px`; ring.style.top = `${event.clientY}px`; layer.append(ring); ring.addEventListener("animationend", () => ring.remove(), { once: true }); }, { passive: true });

  $("#share").addEventListener("click", async () => { try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); notify("Link copiado para a área de transferência."); } } catch (error) { if (error.name !== "AbortError") notify("Copie o endereço desta página para compartilhar."); } });

  if (bio.music) { const audio = new Audio(bio.music); audio.loop = true; audio.volume = .28; let musicOn = false; const musicButton = document.createElement("button"); musicButton.className = "mini-action"; musicButton.id = "music"; musicButton.type = "button"; musicButton.textContent = "♫"; musicButton.setAttribute("aria-label", "Ativar música"); $(".top-nav").insertBefore(musicButton, effects); musicButton.addEventListener("click", async () => { if (audio.paused) { try { await audio.play(); musicOn = true; musicButton.textContent = "Ⅱ"; musicButton.setAttribute("aria-label", "Pausar música"); } catch { notify("Toque novamente para ativar a música."); } } else { audio.pause(); musicOn = false; musicButton.textContent = "♫"; musicButton.setAttribute("aria-label", "Ativar música"); } }); }

  // Mini Snake: grid logic is deliberately dependency-free for GitHub Pages.
  const canvas = $("#snake"); const ctx = canvas.getContext("2d"); const grid = 18; const cell = canvas.width / grid; let snake, food, direction, queued, score, running, timer; let best = Number(sessionStorage.getItem("sfelipe-snake-best") || 0); $("#best-score").textContent = String(best).padStart(2, "0"); $("#session-best").textContent = String(best).padStart(2, "0");
  const randomFood = () => { let next; do { next = { x: Math.floor(Math.random() * grid), y: Math.floor(Math.random() * grid) }; } while (snake?.some(part => part.x === next.x && part.y === next.y)); return next; };
  const resetGame = () => { clearInterval(timer); snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }]; food = { x: 14, y: 9 }; direction = { x: 1, y: 0 }; queued = direction; score = 0; running = false; $("#score").textContent = "00"; $("#game-message").classList.remove("hidden"); $("#game-message strong").textContent = "READY?"; $("#game-message span").textContent = "Use as setas ou toque em PLAY"; drawGame(); };
  const drawGame = () => { ctx.fillStyle = "#050a14"; ctx.fillRect(0, 0, canvas.width, canvas.height); if (!snake) return; snake.forEach((part, index) => { ctx.fillStyle = index === 0 ? "#7df9ff" : `rgba(125,249,255,${Math.max(.25, 1 - index / snake.length)})`; ctx.shadowColor = "#7df9ff"; ctx.shadowBlur = index === 0 ? 14 : 4; ctx.fillRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4); }); ctx.shadowColor = "#ff74c8"; ctx.shadowBlur = 18; ctx.fillStyle = "#ff74c8"; ctx.beginPath(); ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * .3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; };
  const endGame = () => { clearInterval(timer); running = false; $("#game-message").classList.remove("hidden"); $("#game-message strong").textContent = "SIGNAL LOST"; $("#game-message span").textContent = `Score ${String(score).padStart(2, "0")} · tente de novo`; if (score > best) { best = score; sessionStorage.setItem("sfelipe-snake-best", String(best)); $("#best-score").textContent = String(best).padStart(2, "0"); $("#session-best").textContent = String(best).padStart(2, "0"); } };
  const step = () => { direction = queued; const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y }; if (head.x < 0 || head.y < 0 || head.x >= grid || head.y >= grid || snake.some(part => part.x === head.x && part.y === head.y)) return endGame(); snake.unshift(head); if (head.x === food.x && head.y === food.y) { score += 1; $("#score").textContent = String(score).padStart(2, "0"); food = randomFood(); } else snake.pop(); drawGame(); };
  const startGame = () => { if (running) return; running = true; $("#game-message").classList.add("hidden"); clearInterval(timer); timer = setInterval(step, 135); };
  const setDirection = value => { const next = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[value]; if (!next || (next.x === -direction.x && next.y === -direction.y)) return; queued = next; startGame(); };
  document.addEventListener("keydown", event => { const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" }; if (map[event.key]) { event.preventDefault(); setDirection(map[event.key]); } }); document.querySelectorAll("[data-direction]").forEach(button => button.addEventListener("click", () => setDirection(button.dataset.direction))); $("#play").addEventListener("click", startGame); $("#restart").addEventListener("click", resetGame); resetGame();
})();
