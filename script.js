document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const slides = [
    $("slide1"),
    $("slide2"),
    $("slide3")
  ];

  const dots = [...document.querySelectorAll(".dot")];
  const prevBtn = $("prevBtn");
  const nextBtn = $("nextBtn");
  const autoBtn = $("autoBtn");
  const slideCounter = $("slideCounter");

  const enterBtn = $("enterBtn");
  const brandLink = $("brandLink");
  const replayBtn = $("replayBtn");

  const letterBtn = $("letterBtn");
  const letterContent = $("letterContent");

  const birthdaySong = $("birthdaySong");
  const musicBtn = $("musicBtn");
  const musicStatus = $("musicStatus");

  const fireworksBtn = $("fireworksBtn");
  const wishMessage = $("wishMessage");
  const revealBtn = $("revealBtn");
  const finalNote = $("finalNote");

  const heartsLayer = $("heartsLayer");
  const canvas = $("fireworksCanvas");
  const ctx = canvas.getContext("2d");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const SLIDE_DELAY = 15000;

  let currentSlide = 0;
  let autoplay = true;
  let timer = null;
  let remaining = SLIDE_DELAY;
  let deadline = 0;
  let musicPlaying = false;
  let heartTimer = null;
  let particles = [];
  let frame = null;
  let lastFrame = 0;
  let fireworkEndTime = 0;
  let wishCount = 0;

  // ----------------------------
  // 1. Slide navigation
  // ----------------------------

  function showSlide(index, options = {}) {
    const nextIndex = Math.max(0, Math.min(2, index));
    const changed = nextIndex !== currentSlide;

    currentSlide = nextIndex;

    slides.forEach((slide, i) => {
      const active = i === currentSlide;

      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", String(!active));

      // Inactive slides are removed from keyboard navigation.
      slide.inert = !active;
    });

    dots.forEach((dot, i) => {
      const active = i === currentSlide;
      dot.classList.toggle("active", active);

      if (active) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    slideCounter.textContent =
      `0${currentSlide + 1} / 03`;

    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === 2;
    nextBtn.textContent =
      currentSlide === 2 ? "Last Slide" : "Next →";

    if (changed || options.resetScroll) {
      slides[currentSlide].scrollTop = 0;
    }

    if (currentSlide === 0) {
      enterBtn.focus({ preventScroll: true });
    } else if (options.focusHeading) {
      const heading = slides[currentSlide].querySelector("h2");
      if (heading) heading.setAttribute("tabindex", "-1");
      if (heading) heading.focus({ preventScroll: true });
    }

    if (currentSlide === 2 && options.celebrate) {
      launchFireworks(4);
    }

    if (autoplay) {
      scheduleAutoplay();
    }
  }

  function goToSlide(index) {
    showSlide(index, { focusHeading: true });
  }

  prevBtn.addEventListener("click", () => {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (currentSlide < 2) goToSlide(currentSlide + 1);
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goToSlide(Number(dot.dataset.slide));
    });
  });

  enterBtn.addEventListener("click", () => {
    goToSlide(1);
    makeConfetti(30);
  });

  brandLink.addEventListener("click", (event) => {
    event.preventDefault();
    goToSlide(0);
  });

  // Keyboard navigation using left and right arrows.
  document.addEventListener("keydown", (event) => {
    if (
      event.altKey || event.ctrlKey || event.metaKey ||
      event.target.matches("input, textarea, select, audio, video")
    ) return;

    if (event.key === "ArrowRight" && currentSlide < 2) {
      goToSlide(currentSlide + 1);
    }

    if (event.key === "ArrowLeft" && currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  });

  // ----------------------------
  // 2. Automatic slideshow
  // ----------------------------

  function clearAutoplayTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function scheduleAutoplay() {
    clearAutoplayTimer();

    if (!autoplay || document.hidden) return;

    remaining = SLIDE_DELAY;
    deadline = Date.now() + remaining;

    timer = setTimeout(() => {
      timer = null;

      // Stop on the final slide instead of looping unexpectedly.
      if (currentSlide < 2) {
        showSlide(currentSlide + 1);
      } else {
        setAutoplay(false);
      }
    }, remaining);
  }

  function setAutoplay(enabled) {
    autoplay = enabled;
    autoBtn.textContent = autoplay ? "❚❚ Auto" : "▶ Auto";

    autoBtn.setAttribute(
      "aria-label",
      autoplay
        ? "Pause automatic slideshow"
        : "Resume automatic slideshow"
    );

    if (autoplay) {
      scheduleAutoplay();
    } else {
      clearAutoplayTimer();
    }
  }

  autoBtn.addEventListener("click", () => {
    setAutoplay(!autoplay);
  });

  // Pause while the browser tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (timer !== null) {
        remaining = Math.max(0, deadline - Date.now());
        clearAutoplayTimer();
      }
    } else if (autoplay) {
      timer = setTimeout(() => {
        timer = null;

        if (currentSlide < 2) {
          showSlide(currentSlide + 1);
        } else {
          setAutoplay(false);
        }
      }, remaining);
    }
  });

  // ----------------------------
  // 3. Floating hearts
  // ----------------------------

  function createHeart() {
    if (document.hidden || reducedMotion) return;

    const heart = document.createElement("span");
    const symbols = ["♥", "♡", "❤", "✧"];
    const colors = [
      "#f5a7cb", "#f3d69a", "#d8b9ff", "#ffcfdd"
    ];

    heart.className = "floating-heart";
    heart.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    heart.style.setProperty(
      "--left", `${Math.random() * 100}%`
    );

    heart.style.setProperty(
      "--heart-color",
      colors[Math.floor(Math.random() * colors.length)]
    );

    heart.style.setProperty(
      "--heart-size", `${12 + Math.random() * 22}px`
    );

    heart.style.setProperty(
      "--duration", `${5 + Math.random() * 5}s`
    );

    heartsLayer.appendChild(heart);

    heart.addEventListener("animationend", () => heart.remove(), {
      once: true
    });
  }

  function startHearts() {
    if (heartTimer || reducedMotion) return;

    for (let i = 0; i < 7; i++) {
      setTimeout(createHeart, i * 180);
    }

    heartTimer = setInterval(createHeart, 700);
  }

  startHearts();

  // ----------------------------
  // 4. Secret letter
  // ----------------------------

  letterBtn.addEventListener("click", () => {
    const opening = letterContent.classList.contains("hidden");

    letterContent.classList.toggle("hidden", !opening);

    letterBtn.textContent = opening
      ? "Close Your Letter ♡"
      : "Open Your Letter 💌";

    if (opening) {
      letterContent.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest"
      });

      makeConfetti(15);
    }
  });

  // ----------------------------
  // 5. Music player
  // ----------------------------

  birthdaySong.addEventListener("play", () => {
    musicPlaying = true;
    musicBtn.textContent = "❚❚ Pause Our Song";
    musicStatus.textContent = "Let the music play. ♡";
  });

  birthdaySong.addEventListener("pause", () => {
    musicPlaying = false;
    musicBtn.textContent = "▶ Play Our Song";
    musicStatus.textContent = "Your melody is waiting for you.";
  });

  musicBtn.addEventListener("click", async () => {
    if (musicPlaying) {
      birthdaySong.pause();
      return;
    }

    try {
      await birthdaySong.play();
    } catch (error) {
      musicStatus.textContent =
        "Music could not start. Check audio 1.mpeg and try again.";
    }
  });

  birthdaySong.addEventListener("error", () => {
    musicStatus.textContent =
      "Audio file not found. Check its name and location.";
  });

  // ----------------------------
  // 6. Fireworks animation
  // ----------------------------

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function createBurst(x, y, amount = 60) {
    const colors = [
      "#f7dfab", "#f5a7cb", "#ffffff",
      "#d8b9ff", "#ff8cbd"
    ];

    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.1 + Math.random() * 4.2;

      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.009 + Math.random() * 0.018,
        size: 1.1 + Math.random() * 2.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    if (particles.length > 1500) {
      particles = particles.slice(-1500);
    }
  }

  function launchFireworks(number = 5) {
    if (reducedMotion) number = Math.min(number, 2);

    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < number; i++) {
      setTimeout(() => {
        createBurst(
          width * (0.15 + Math.random() * 0.7),
          height * (0.12 + Math.random() * 0.43),
          reducedMotion ? 18 : 60
        );
      }, i * 280);
    }

    fireworkEndTime = Math.max(
      fireworkEndTime,
      performance.now() + number * 280 + 3500
    );

    if (frame === null) {
      frame = requestAnimationFrame(animateFireworks);
    }
  }

  function animateFireworks(timestamp) {
    frame = null;

    if (timestamp - lastFrame < 1000 / 45) {
      frame = requestAnimationFrame(animateFireworks);
      return;
    }

    lastFrame = timestamp;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = "lighter";

    particles = particles.filter((p) => p.alpha > 0.035);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.025;
      p.alpha -= p.decay;

      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (particles.length > 0 || timestamp < fireworkEndTime) {
      frame = requestAnimationFrame(animateFireworks);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  // ----------------------------
  // 7. Confetti
  // ----------------------------

  function makeConfetti(amount = 55) {
    if (reducedMotion) return;

    const colors = [
      "#f7dfab", "#f5a7cb", "#d8b9ff",
      "#ffffff", "#ff8cbd"
    ];

    for (let i = 0; i < amount; i++) {
      const piece = document.createElement("span");

      piece.className = "confetti-piece";
      piece.style.setProperty("--left", `${Math.random() * 100}%`);
      piece.style.setProperty(
        "--duration", `${2.2 + Math.random() * 2.5}s`
      );
      piece.style.setProperty(
        "--confetti-color",
        colors[Math.floor(Math.random() * colors.length)]
      );

      document.body.appendChild(piece);

      piece.addEventListener("animationend", () => piece.remove(), {
        once: true
      });
    }
  }

  // ----------------------------
  // 8. Make a Wish
  // ----------------------------

  const wishes = [
    "May every beautiful dream in your heart find its way to you. ✨",
    "May happiness find you in the smallest, unexpected moments. 💗",
    "May this new chapter bring you more love, laughter and magic. 🌙",
    "May you always remember how wonderfully special you are. ❤️"
  ];

  fireworksBtn.addEventListener("click", () => {
    wishCount++;

    wishMessage.textContent =
      wishes[(wishCount - 1) % wishes.length];

    launchFireworks(7);
    makeConfetti(55);
  });

  // ----------------------------
  // 9. Final reveal
  // ----------------------------

  let finalRevealed = false;

  revealBtn.addEventListener("click", () => {
    finalRevealed = !finalRevealed;
    finalNote.classList.toggle("hidden", !finalRevealed);

    revealBtn.textContent = finalRevealed
      ? "Hide Your Little Reminder ♡"
      : "Reveal Your Final Surprise ♡";

    if (finalRevealed) {
      $("finalTitle").textContent =
        "The world is a little brighter because of you. ✨";

      launchFireworks(10);
      makeConfetti(90);

      finalNote.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest"
      });
    }
  });

  // ----------------------------
  // 10. Replay the experience
  // ----------------------------

  replayBtn.addEventListener("click", () => {
    wishCount = 0;
    wishMessage.textContent = "";

    finalRevealed = false;
    finalNote.classList.add("hidden");
    revealBtn.textContent = "Reveal Your Final Surprise ♡";

    $("finalTitle").textContent =
      "Today, the universe celebrates you.";

    letterContent.classList.add("hidden");
    letterBtn.textContent = "Open Your Letter 💌";

    goToSlide(0);
    makeConfetti(30);
  });

  // Start on slide 1, with automatic slideshow enabled.
  showSlide(0, { resetScroll: true });
});