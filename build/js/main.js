/* ==========================================================================
   SHIVAM SHARMA — CASE FILES (v2 · revamp) · main.js
   Vanilla JS, no dependencies. Modules:
   Preloader · Smooth · Tape · Reveals · Words · Dossiers
   Preview · Modals · Copy · Annotator · Nav · EasterEggs · Tick
   ========================================================================== */
(function () {
    "use strict";

    var clamp = function (v, min, max) { return Math.min(Math.max(v, min), max); };
    var lerp  = function (a, b, t) { return a + (b - a) * t; };
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isDesktop = function () { return window.matchMedia("(min-width: 64rem)").matches; };

    /* ---------------------------------------------------------- Preloader */
    var Preloader = (function () {
        var el, count, stamp, word, done;
        function finish() {
            if (done) return;
            done = true;
            stamp.classList.add("is-slammed");
            setTimeout(function () {
                el.classList.add("is-done");
                document.body.classList.remove("is-locked");
                document.body.classList.add("is-loaded");
                Smooth.refresh();
                setTimeout(function () { el.remove(); }, 1000);
            }, reducedMotion ? 0 : 550);
        }
        function run() {
            var start = null;
            var duration = reducedMotion ? 50 : 1400;
            function step(ts) {
                if (!start) start = ts;
                var p = clamp((ts - start) / duration, 0, 1);
                // ease-out for a "loading" feel
                var eased = 1 - Math.pow(1 - p, 3);
                count.textContent = String(Math.round(eased * 100)).padStart(3, "0");
                if (p < 1) requestAnimationFrame(step);
                else finish();
            }
            requestAnimationFrame(step);
        }
        return {
            init: function () {
                el = document.getElementById("preloader");
                if (!el) { document.body.classList.add("is-loaded"); document.body.classList.remove("is-locked"); return; }
                count = document.getElementById("preloader-count");
                stamp = document.getElementById("preloader-stamp");
                word = document.getElementById("preloader-word");
                try {
                    if (localStorage.getItem("cf-visited")) {
                        word.textContent = "Back again? File № 001 reopened.";
                    }
                    localStorage.setItem("cf-visited", "1");
                } catch (e) {}
                if (document.readyState === "complete") run();
                else window.addEventListener("load", run);
                // failsafe
                setTimeout(finish, 6000);
            }
        };
    })();

    /* ------------------------------------------------------------- Smooth */
    var Smooth = (function () {
        var wrapper, content, target = 0, current = 0, raf = null;
        var disabled = reducedMotion || window.matchMedia("(max-width: 47.99rem)").matches;
        function setHeight() {
            document.body.style.height = content.getBoundingClientRect().height + "px";
        }
        function update() {
            target = window.scrollY;
            current = lerp(current, target, 0.09);
            if (Math.abs(target - current) < 0.05) current = target;
            content.style.transform = "translate3d(0," + -current + "px,0)";
            raf = requestAnimationFrame(update);
        }
        return {
            init: function () {
                wrapper = document.getElementById("smooth-wrapper");
                content = document.getElementById("smooth-content");
                if (disabled || !wrapper) {
                    wrapper && wrapper.classList.add("is-native");
                    if (wrapper) { wrapper.style.position = "static"; wrapper.style.overflow = "visible"; }
                    document.documentElement.classList.add("lenis-off");
                    return;
                }
                setHeight();
                window.addEventListener("resize", setHeight);
                window.addEventListener("load", setHeight);
                // content can grow after load (webfonts, images) — keep the
                // scrollable height honest or the page bottom gets clipped
                if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeight);
                if ("ResizeObserver" in window) {
                    new ResizeObserver(setHeight).observe(content);
                }
                raf = requestAnimationFrame(update);
            },
            refresh: function () { if (!disabled && content) setHeight(); },
            isActive: function () { return !disabled; },
            to: function (y) {
                if (disabled) { window.scrollTo({ top: y, behavior: "smooth" }); return; }
                var start = window.scrollY, change = y - start, t0 = null, dur = 900;
                function step(ts) {
                    if (!t0) t0 = ts;
                    var p = clamp((ts - t0) / dur, 0, 1);
                    var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                    window.scrollTo(0, start + change * e);
                    if (p < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            }
        };
    })();

    /* --------------------------------------------------------------- Tape */
    var Tape = (function () {
        return {
            init: function () {
                var track = document.getElementById("tape-track");
                if (!track) return;
                track.innerHTML += track.innerHTML; // seamless -50% loop
            }
        };
    })();

    /* ------------------------------------------------------------ Reveals */
    var Reveals = (function () {
        return {
            init: function () {
                var els = document.querySelectorAll("[data-reveal]");
                if (!("IntersectionObserver" in window)) {
                    els.forEach(function (el) { el.classList.add("is-revealed"); });
                    return;
                }
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (en) {
                        if (en.isIntersecting) { en.target.classList.add("is-revealed"); io.unobserve(en.target); }
                    });
                }, { threshold: 0.12 });
                els.forEach(function (el) { io.observe(el); });
            }
        };
    })();

    /* ------------------------------------------- Word-by-word highlighting */
    var Words = (function () {
        var blocks = [];
        function split(el) {
            var words = el.textContent.trim().split(/\s+/);
            el.innerHTML = words.map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
            return Array.prototype.slice.call(el.querySelectorAll(".w"));
        }
        function update() {
            var vh = window.innerHeight;
            blocks.forEach(function (b) {
                var r = b.el.getBoundingClientRect();
                // progress: 0 when block enters bottom, 1 when its top passes 35% vh
                var p = clamp((vh * 0.9 - r.top) / (vh * 0.55), 0, 1);
                var lit = Math.floor(p * b.words.length);
                b.words.forEach(function (w, i) { w.classList.toggle("is-lit", i < lit); });
            });
        }
        return {
            init: function () {
                document.querySelectorAll("[data-words]").forEach(function (el) {
                    blocks.push({ el: el, words: split(el) });
                });
                if (reducedMotion) {
                    blocks.forEach(function (b) { b.words.forEach(function (w) { w.classList.add("is-lit"); }); });
                    return;
                }
            },
            update: update
        };
    })();

    /* ------------------------------------------------------------ Dossiers */
    var Dossiers = (function () {
        var items = [];
        function update() {
            var vh = window.innerHeight;
            var pinWithJS = Smooth.isActive() && isDesktop();
            items.forEach(function (d) {
                var r = d.el.getBoundingClientRect();
                var total = r.height - vh;
                var p = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
                if (d.bar) d.bar.style.transform = "scaleX(" + p + ")";
                // JS pin: inside the translated smooth-scroll rig, position:sticky
                // has no live scrollport — counter-translate the inner stage instead.
                if (d.inner) {
                    d.inner.style.transform = pinWithJS
                        ? "translate3d(0," + clamp(-r.top, 0, Math.max(total, 0)) + "px,0)"
                        : "";
                }
                var idx = clamp(Math.floor(p * d.beats.length), 0, d.beats.length - 1);
                d.beats.forEach(function (b, i) { b.classList.toggle("is-current", !isDesktop() || i <= idx); });
            });
        }
        return {
            init: function () {
                document.querySelectorAll("[data-dossier]").forEach(function (el) {
                    items.push({
                        el: el,
                        inner: el.querySelector(".chapter__stage"),
                        bar: el.querySelector("[data-progress]"),
                        beats: Array.prototype.slice.call(el.querySelectorAll("[data-beat]"))
                    });
                });
                window.addEventListener("resize", update);
            },
            update: update
        };
    })();

    /* shared rAF loop — runs every frame so scroll-driven effects stay
       in sync with the lerped smooth-scroll transform */
    var Tick = (function () {
        function loop() {
            Words.update();
            Dossiers.update();
            requestAnimationFrame(loop);
        }
        return { init: function () { if (!reducedMotion) requestAnimationFrame(loop); } };
    })();

    /* ------------------------------------- Floating exhibit preview (index) */
    var Preview = (function () {
        var box, img, no, file, x = 0, y = 0, cx = 0, cy = 0, on = false, raf = null;
        function loop() {
            cx = lerp(cx, x, 0.14); cy = lerp(cy, y, 0.14);
            box.style.left = cx + "px"; box.style.top = cy + "px";
            if (on) raf = requestAnimationFrame(loop);
        }
        return {
            init: function () {
                box = document.getElementById("exhibit-preview");
                if (!box || !window.matchMedia("(min-width: 48rem)").matches) return;
                img = document.getElementById("exhibit-preview-img");
                no = document.getElementById("exhibit-preview-no");
                file = document.getElementById("exhibit-preview-file");
                document.querySelectorAll("[data-preview]").forEach(function (row) {
                    row.addEventListener("mouseenter", function () {
                        var src = row.getAttribute("data-preview");
                        img.src = src;
                        no.textContent = "Exhibit " + row.querySelector(".case-row__no").textContent.replace("№ ", "").replace(/^0/, "");
                        file.textContent = src.split("/").pop();
                        box.classList.add("is-on");
                        if (!on) { on = true; raf = requestAnimationFrame(loop); }
                    });
                    row.addEventListener("mouseleave", function () {
                        box.classList.remove("is-on");
                        on = false;
                        if (raf) cancelAnimationFrame(raf);
                    });
                });
                document.addEventListener("mousemove", function (e) {
                    x = clamp(e.clientX + 28, 0, window.innerWidth - box.offsetWidth - 16);
                    y = clamp(e.clientY - box.offsetHeight / 2, 8, window.innerHeight - box.offsetHeight - 8);
                });
            }
        };
    })();

    /* -------------------------------------------------------------- Modals */
    var Modals = (function () {
        var openEl = null, lastFocus = null;
        function open(id) {
            var m = document.getElementById(id);
            if (!m) return;
            lastFocus = document.activeElement;
            openEl = m;
            m.classList.add("is-open");
            m.setAttribute("aria-hidden", "false");
            document.body.classList.add("is-locked");
            var btn = m.querySelector(".modal__close");
            if (btn) btn.focus();
        }
        function close() {
            if (!openEl) return;
            openEl.classList.remove("is-open");
            openEl.setAttribute("aria-hidden", "true");
            document.body.classList.remove("is-locked");
            if (lastFocus) lastFocus.focus();
            openEl = null;
        }
        return {
            init: function () {
                document.querySelectorAll("[data-modal-open]").forEach(function (t) {
                    t.addEventListener("click", function () { open(t.getAttribute("data-modal-open")); });
                });
                document.querySelectorAll("[data-modal-close]").forEach(function (t) {
                    t.addEventListener("click", close);
                });
                // delegated fallback — any close control inside an open modal,
                // regardless of binding order or dynamic content
                document.querySelectorAll(".modal").forEach(function (m) {
                    m.addEventListener("click", function (e) {
                        if (e.target.closest("[data-modal-close]")) close();
                    });
                });
                document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
            },
            open: open,
            close: close
        };
    })();

    /* ---------------------------------------------------------------- Copy */
    var Copy = (function () {
        return {
            init: function () {
                document.querySelectorAll("[data-copy]").forEach(function (btn) {
                    btn.addEventListener("click", function () {
                        var text = btn.getAttribute("data-copy");
                        function ok() { Annotator.say("copy", true); }
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(text).then(ok, function () {});
                        } else {
                            var ta = document.createElement("textarea");
                            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
                            document.body.appendChild(ta); ta.select();
                            try { document.execCommand("copy"); ok(); } catch (e) {}
                            ta.remove();
                        }
                    });
                });
            }
        };
    })();

    /* ----------------------------------------------------------- Annotator */
    var Annotator = (function () {
        var el, text, hideTimer = null, dismissals = 0;
        var seen = {};
        var MESSAGES = {
            scroll:  "Nice pace. The evidence is below.",
            copy:    "Copied. Talk soon.",
            narrow:  "Mobile mode. The files still read fine.",
            wide:    "Back to the big screen.",
            idle:    "The button's right there ↗",
            konami:  "Clearance granted. Don't tell anyone.",
            hover3:  "That one's a personal favourite."
        };
        function say(key, force) {
            if (!el || dismissals >= 2) return;
            if (!force && seen[key]) return;
            seen[key] = true;
            text.textContent = MESSAGES[key] || key;
            el.hidden = false;
            // restart entrance
            el.classList.remove("is-on");
            void el.offsetWidth;
            el.classList.add("is-on");
            clearTimeout(hideTimer);
            hideTimer = setTimeout(function () { el.classList.remove("is-on"); }, 5200);
        }
        return {
            init: function () {
                el = document.getElementById("annotator");
                text = document.getElementById("annotator-text");
                if (!el) return;
                document.getElementById("annotator-dismiss").addEventListener("click", function () {
                    dismissals++;
                    el.classList.remove("is-on");
                });

                // first scroll past hero
                var scrolled = false;
                window.addEventListener("scroll", function () {
                    if (!scrolled && window.scrollY > window.innerHeight * 0.6) {
                        scrolled = true;
                        setTimeout(function () { say("scroll"); }, 800);
                    }
                }, { passive: true });

                // (chapter notes come from the mascot's zone voice lines)

                // third case row hover
                var rows = document.querySelectorAll(".case-row");
                if (rows[2]) rows[2].addEventListener("mouseenter", function () { say("hover3"); });

                // resize
                var wasNarrow = window.innerWidth < 768;
                var rz;
                window.addEventListener("resize", function () {
                    clearTimeout(rz);
                    rz = setTimeout(function () {
                        var narrow = window.innerWidth < 768;
                        if (narrow !== wasNarrow) { say(narrow ? "narrow" : "wide"); wasNarrow = narrow; }
                    }, 500);
                });
            },
            say: say
        };
    })();

    /* ----------------------------------------------------------------- Nav */
    var Nav = (function () {
        return {
            init: function () {
                var header = document.getElementById("site-header");
                var lastY = 0;
                window.addEventListener("scroll", function () {
                    var y = window.scrollY;
                    header.classList.toggle("is-stuck", y > 40);
                    header.classList.toggle("is-tucked", y > 300 && y > lastY && !document.body.classList.contains("is-locked"));
                    lastY = y;
                }, { passive: true });

                // header switches to white text while a dark section is under it
                var darkZones = document.querySelectorAll("[data-dark]");
                if ("IntersectionObserver" in window && darkZones.length) {
                    var visible = new Set();
                    var io = new IntersectionObserver(function (entries) {
                        entries.forEach(function (en) {
                            if (en.isIntersecting) visible.add(en.target);
                            else visible.delete(en.target);
                        });
                        header.classList.toggle("on-dark", visible.size > 0);
                    }, { rootMargin: "0px 0px -94% 0px", threshold: 0 });
                    darkZones.forEach(function (z) { io.observe(z); });
                }

                document.querySelectorAll("[data-scroll]").forEach(function (a) {
                    a.addEventListener("click", function (e) {
                        var id = a.getAttribute("href");
                        if (!id || id.charAt(0) !== "#") return;
                        var target = document.querySelector(id);
                        if (!target) return;
                        e.preventDefault();
                        Smooth.to(target.getBoundingClientRect().top + window.scrollY);
                    });
                });

                var toTop = document.getElementById("to-top");
                if (toTop) toTop.addEventListener("click", function () { Smooth.to(0); });

                // footer stamp slam — fires every time the cover scrolls into view
                var footer = document.getElementById("footer");
                if (footer) {
                    if ("IntersectionObserver" in window) {
                        new IntersectionObserver(function (entries) {
                            entries.forEach(function (en) {
                                footer.classList.toggle("is-in", en.isIntersecting);
                            });
                        }, { threshold: 0.25 }).observe(footer);
                    } else {
                        footer.classList.add("is-in");
                    }
                }
            }
        };
    })();

    /* -------------------------------------------------------------- Mascot
       "The Filer" — a pixel detective. Gestures per section, blinks,
       does tricks on click, can be picked up and dropped. */
    var Mascot = (function () {
        var PAL = { k: "#141412", p: "#FBFAF4", b: "#2B4CE1", f: "#E8B93E" };
        // 16 x 20 pixel maps. k=ink p=paper b=blue f=folder .=transparent
        var BODY_LEGS = [
            "....kkkkkkkk....",
            "....kkk..kkk....",
            "...kkk....kkk..."
        ];
        var LEGS_WALK_A = [
            "....kkkkkkkk....",
            "...kkk....kkk...",
            "..kkk......kkk.."
        ];
        var LEGS_WALK_B = [
            "....kkkkkkkk....",
            "....kkkkkkk.....",
            "....kkk.kkk....."
        ];
        var HEAD = [
            "................",
            ".....kkkkkk.....",
            "....kkkkkkkk....",
            "....kbbbbbbk....",
            "..kkkkkkkkkkkk..",
            "....kppppppk....",
            "....kpkppkpk....", // eyes — swapped out for blink
            "....kppppppk....",
            "....kpkkkkpk....",
            ".....kppppk....."
        ];
        var TORSO = [
            "....kbbbbbbk....",
            "...kbbbbbbbbk...",
            "..kbbbkbbkbbbk..",
            "..kpkbbbbbbkpk..",
            "..kbbbffffbbbk..",
            "..kbbbffffbbbk..",
            "...kbbffffbbk..."
        ];
        var FRAMES = {
            idle:  HEAD.concat(TORSO, BODY_LEGS),
            blink: HEAD.slice(0, 6).concat(["....kppppppk...."], HEAD.slice(7)).concat(TORSO, BODY_LEGS),
            wave:  HEAD.concat([
                "....kbbbbbbk....",
                "...kbbbbbbbbkp..",
                "..kbbbkbbkbbkp..",
                "..kpkbbbbbbkbk..",
                "..kbbbffffbbbk..",
                "..kbbbffffbbbk..",
                "...kbbffffbbk..."
            ], BODY_LEGS),
            point: HEAD.concat([
                "....kbbbbbbk....",
                "...kbbbbbbbbk...",
                "..kbbbkbbbbkpp..",
                "..kpkbbbbbbkbk..",
                "..kbbbffffbbbk..",
                "..kbbbffffbbbk..",
                "...kbbffffbbk..."
            ], BODY_LEGS),
            think: HEAD.concat([
                "....kbbbbbbk....",
                "...kbbbbbbbbk...",
                "..kbbbkbbkbbbk..",
                "..kpkbbbbkppk...",
                "..kbbbffffbbk...",
                "..kbbbffffbbbk..",
                "...kbbffffbbk..."
            ], BODY_LEGS),
            cheer: HEAD.slice(0, 9).concat([
                "..p..kppppk..p..",
                "..kpkbbbbbbkpk..",
                "...kbbbbbbbbk...",
                "..kbbbkbbkbbbk..",
                "..kbbbbbbbbbbk..",
                "..kbbbffffbbbk..",
                "..kbbbffffbbbk..",
                "...kbbffffbbk..."
            ], BODY_LEGS),
            walkA: HEAD.concat(TORSO, LEGS_WALK_A),
            walkB: HEAD.concat(TORSO, LEGS_WALK_B)
        };

        /* per-section perch: [selector, gesture, x-frac, y-frac, voice line]
           (x is fixed at the right edge — he only travels vertically) */
        var ZONES = [
            [".hero",       "wave",  1.00, 0.02, "I'm the Filer. I keep these files."],
            ["#about",      "think", 1.00, 0.10, "Hmm. Strong alibi."],
            ["#record",     "point", 1.00, 0.32, "Four assignments. All verified."],
            ["#chapter-01", "point", 1.00, 0.12, "Exhibit A — he grills you gently."],
            ["#chapter-02", "point", 1.00, 0.42, "Exhibit B — mind the depth."],
            ["#chapter-03", "point", 1.00, 0.18, "Exhibit C — three million base pairs, browsable."],
            ["#chapter-04", "point", 1.00, 0.38, "Exhibit D — find the good cafés."],
            ["#case-index", "idle",  1.00, 0.06, "Four more in the drawer."],
            ["#contact",    "cheer", 1.00, 0.10, null]  /* big finale — lines rotate, stays right */
        ];

        /* finale lines — rotate while he's big at the footer */
        var BIG_LINES = [
            "You've reached the end of the file.",
            "One blank page left. It's yours.",
            "Go on — say hello ↗",
            "I'll be here. Filing."
        ];
        var bigTimer = null, bigIdx = 0;
        function startBigLines() {
            if (bigTimer) return;
            bigIdx = 0;
            setTimeout(function () {
                if (!layer.classList.contains("is-big")) return;
                Annotator.say(BIG_LINES[0], true);
                bigTimer = setInterval(function () {
                    bigIdx = (bigIdx + 1) % BIG_LINES.length;
                    Annotator.say(BIG_LINES[bigIdx], true);
                }, 5200);
            }, 900);
        }
        function stopBigLines() {
            clearInterval(bigTimer); bigTimer = null;
        }

        var host, layer, svgEl, frameEls = {}, current = "idle", held = false;
        var dragOffsetX = 0, downAt = null, moved = false;
        var cx = 8, tx = 8, cy = 16, ty = 16, walking = false, walkPhase = "walkA", lastWalk = 0;
        var activeGesture = "idle";

        function build() {
            var NS = "http://www.w3.org/2000/svg";
            var svg = document.createElementNS(NS, "svg");
            svg.setAttribute("viewBox", "0 0 16 20");
            svg.setAttribute("aria-hidden", "true");
            Object.keys(FRAMES).forEach(function (name) {
                var g = document.createElementNS(NS, "g");
                g.style.display = name === "idle" ? "" : "none";
                FRAMES[name].forEach(function (row, y) {
                    for (var x = 0; x < row.length; x++) {
                        var ch = row.charAt(x);
                        if (ch === "." || !PAL[ch]) continue;
                        var r = document.createElementNS(NS, "rect");
                        r.setAttribute("x", x); r.setAttribute("y", y);
                        r.setAttribute("width", 1); r.setAttribute("height", 1);
                        r.setAttribute("fill", PAL[ch]);
                        g.appendChild(r);
                    }
                });
                frameEls[name] = g;
                svg.appendChild(g);
            });
            host.appendChild(svg);
            svgEl = svg;
        }

        function setFrame(name) {
            if (!frameEls[name] || name === current) return;
            frameEls[current].style.display = "none";
            frameEls[name].style.display = "";
            current = name;
        }

        function blinkLoop() {
            if (reducedMotion) return;
            setTimeout(function () {
                if (current === "idle" && !held) {
                    setFrame("blink");
                    setTimeout(function () { if (current === "blink") setFrame("idle"); }, 160);
                }
                blinkLoop();
            }, 2600 + Math.random() * 3200);
        }

        /* ---- movement engine: he walks to his perch as the page scrolls ---- */
        function spotX(frac) {
            var margin = 8;
            var track = window.innerWidth - host.offsetWidth - margin * 2;
            return margin + frac * Math.max(track, 0);
        }
        function spotY(frac) {
            // distance from viewport bottom; keep him + bubble fully on screen
            var big = layer.classList.contains("is-big");
            var reserve = big ? 440 : 240; // bubble + headroom (big: scaled body + raised bubble)
            var maxB = window.innerHeight - host.offsetHeight - reserve;
            return 12 + frac * Math.max(maxB - 12, 0);
        }
        function applyX() {
            layer.style.left = cx + "px";
            // bubble opens away from the nearest edge
            layer.classList.toggle("bubble-left", cx < 320);
        }
        function applyY() { layer.style.bottom = cy + "px"; }
        function flip(dx) {
            if (!svgEl) return;
            svgEl.style.transform = dx < -0.5 ? "scaleX(-1)" : "";
        }
        function engine() {
            requestAnimationFrame(engine);
            if (!layer || held) return;
            var dx = tx - cx, dy = ty - cy;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                var k = reducedMotion ? 1 : 0.045;
                cx = lerp(cx, tx, k);
                cy = lerp(cy, ty, k);
                applyX(); applyY();
                if (!reducedMotion && (Math.abs(dx) > 6 || Math.abs(dy) > 10)) {
                    walking = true;
                    if (Math.abs(dx) > 2) flip(dx);
                    var now = performance.now();
                    if (now - lastWalk > 170) {
                        lastWalk = now;
                        walkPhase = walkPhase === "walkA" ? "walkB" : "walkA";
                        setFrame(walkPhase);
                    }
                }
            } else if (walking) {
                walking = false;
                setFrame(activeGesture);
            }
        }

        /* section gestures + perches + voice lines */
        function watchSections() {
            if (!("IntersectionObserver" in window)) return;
            ZONES.forEach(function (z) {
                var el = document.querySelector(z[0]);
                if (!el) return;
                new IntersectionObserver(function (entries) {
                    entries.forEach(function (en) {
                        if (en.isIntersecting) {
                            activeGesture = z[1];
                            if (z[0] === "#contact") layer.classList.add("is-big"); // before spotY: bigger reserve
                            tx = spotX(z[2]);
                            ty = spotY(z[3]);
                            if (z[0] === "#contact") startBigLines();
                            if (!walking && !held) setFrame(z[1]);
                            // voice lines re-fire on re-entry — the tour repeats
                            if (z[4]) {
                                setTimeout(function () {
                                    if (activeGesture === z[1]) Annotator.say(z[4], true);
                                }, z[0] === ".hero" ? 2800 : 700);
                            }
                        } else {
                            if (z[0] === "#contact") {
                                layer.classList.remove("is-big");
                                stopBigLines();
                            }
                            if (current === z[1] && !walking && !held) {
                                if (activeGesture === z[1]) activeGesture = "idle";
                                setFrame("idle");
                            }
                        }
                    });
                }, { threshold: 0.3 }).observe(el);
            });
        }

        /* tricks */
        var TRICKS = [
            ["trick-jump", "Wheee."],
            ["trick-spin", "Dizzy filing."],
            ["trick-dance", "Nobody's watching, right?"],
            ["trick-vanish", "Now you see me…"]
        ];
        var trickIdx = 0, tricking = false;
        function trick() {
            if (tricking || reducedMotion) return;
            tricking = true;
            var t = TRICKS[trickIdx % TRICKS.length];
            trickIdx++;
            host.classList.add(t[0]);
            Annotator.say(t[1], true);
            setTimeout(function () {
                host.classList.remove(t[0]);
                tricking = false;
                if (t[0] === "trick-vanish") Annotator.say("…still here.", true);
            }, 950);
        }

        /* pick up & drop */
        function onDown(e) {
            held = true; moved = false;
            downAt = { x: e.clientX, y: e.clientY };
            dragOffsetX = e.clientX - layer.getBoundingClientRect().left;
            host.classList.add("is-held");
            host.setPointerCapture && host.setPointerCapture(e.pointerId);
            Annotator.say("Easy — I'm evidence.", true);
        }
        function onMove(e) {
            if (!held) return;
            if (Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y) > 6) moved = true;
            cx = clamp(e.clientX - dragOffsetX, 8, window.innerWidth - host.offsetWidth - 8);
            tx = cx; // parked until the next section calls him
            applyX();
        }
        function onUp() {
            if (!held) return;
            held = false;
            host.classList.remove("is-held");
            if (moved) {
                host.classList.add("is-dropped");
                Annotator.say("Phew. Filed safely.", true);
                setTimeout(function () { host.classList.remove("is-dropped"); }, 550);
            } else {
                trick();
            }
        }

        return {
            init: function () {
                host = document.getElementById("mascot");
                layer = document.getElementById("mascot-layer");
                if (!host || !layer) return;
                build();

                // start at the hero perch (bottom-left), waving
                requestAnimationFrame(function () {
                    cx = tx = spotX(ZONES[0][2]);
                    cy = ty = spotY(ZONES[0][3]);
                    applyX(); applyY();
                });
                setFrame("wave");
                activeGesture = "wave";
                setTimeout(function () {
                    if (current === "wave" && activeGesture === "wave") { setFrame("idle"); activeGesture = "idle"; }
                }, 2600);

                blinkLoop();
                watchSections();
                requestAnimationFrame(engine);

                window.addEventListener("resize", function () {
                    cx = clamp(cx, 8, window.innerWidth - host.offsetWidth - 8);
                    tx = clamp(tx, 8, window.innerWidth - host.offsetWidth - 8);
                    cy = clamp(cy, 12, Math.max(window.innerHeight - host.offsetHeight - 240, 12));
                    ty = clamp(ty, 12, Math.max(window.innerHeight - host.offsetHeight - 240, 12));
                    applyX(); applyY();
                });

                host.addEventListener("pointerdown", onDown);
                host.addEventListener("pointermove", onMove);
                host.addEventListener("pointerup", onUp);
                host.addEventListener("pointercancel", onUp);
                host.addEventListener("keydown", function (e) {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trick(); }
                });

                // grab hint after a while
                setTimeout(function () {
                    if (!held) Annotator.say("Psst. Click me for a trick. Or hold to pick me up.", true);
                }, 20000);
            }
        };
    })();

    /* -------------------------------------------------------------- Resume
       Visitor viewer (iframe + download + WhatsApp hello) and an owner
       console unlocked from the browser console. URLs: js/resume.config.js */
    var Resume = (function () {
        var OVERRIDE_KEY = "resume_override_v1";
        var ADMIN_KEY    = "resume_admin_unlocked";
        var SECRET_HASH  = "ad72295cb9d1562222c74161b672387525335097f0bcdeefdee1b0d11f175306";

        function digest(text) {
            return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
                return Array.from(new Uint8Array(buf))
                    .map(function (b) { return b.toString(16).padStart(2, "0"); })
                    .join("");
            });
        }
        function config() { return window.RESUME_CONFIG || {}; }
        function override() {
            try {
                var o = JSON.parse(localStorage.getItem(OVERRIDE_KEY));
                if (o && o.viewUrl) return o;
            } catch (e) { /* ignore */ }
            return null;
        }
        function active() {
            return override() || { viewUrl: config().viewUrl, downloadUrl: config().downloadUrl };
        }

        /* --- visitor-facing viewer --- */
        function loadViewer() {
            var a     = active();
            var frame = document.getElementById("resume-frame");
            var dl    = document.getElementById("resume-download");
            var msg   = document.getElementById("resume-message");
            if (frame && frame.getAttribute("src") !== a.viewUrl) frame.setAttribute("src", a.viewUrl);
            if (dl) dl.href = a.downloadUrl || a.viewUrl;
            if (msg && !msg.textContent) msg.textContent = config().message || "";
        }
        function initViewer() {
            var trigger = document.querySelector('[data-modal-open="resume-modal"]');
            if (trigger) trigger.addEventListener("click", loadViewer);

            var waBtn = document.getElementById("resume-whatsapp");
            if (waBtn) {
                waBtn.addEventListener("click", function () {
                    var name  = document.getElementById("resume-name").value.trim();
                    var email = document.getElementById("resume-email").value.trim();
                    var text = "Hi Shivam! " +
                        (name ? "I'm " + name + " — " : "") +
                        "I just viewed your resume on your portfolio.";
                    if (email) text += " Let's have a talk. Here's my email: " + email;
                    window.open(
                        "https://wa.me/" + (config().whatsapp || "") + "?text=" + encodeURIComponent(text),
                        "_blank", "noopener"
                    );
                });
            }
        }

        /* --- owner console --- */
        function parseDriveUrl(url) {
            var match = String(url).match(/[-\w]{25,}/);
            if (!match || !/drive\.google\.com|docs\.google\.com/.test(url)) return null;
            var id = match[0];
            return {
                viewUrl:     "https://drive.google.com/file/d/" + id + "/preview",
                downloadUrl: "https://drive.google.com/uc?export=download&id=" + id
            };
        }
        function updateJsonSnippet() {
            var view = document.getElementById("owner-view-url").value.trim();
            var dl   = document.getElementById("owner-download-url").value.trim();
            document.getElementById("owner-json").value =
                'window.RESUME_CONFIG = {\n' +
                '    viewUrl:     "' + view + '",\n' +
                '    downloadUrl: "' + dl + '",\n' +
                '    whatsapp:    "' + (config().whatsapp || "") + '",\n' +
                '    message:     "' + (config().message || "").replace(/"/g, '\\"') + '"\n' +
                '};';
        }
        function refreshOwnerFields() {
            var def = config();
            var ov  = override();
            document.getElementById("owner-default-url").textContent  = def.viewUrl || "—";
            document.getElementById("owner-override-url").textContent = ov ? ov.viewUrl : "none";
            var viewInput = document.getElementById("owner-view-url");
            var dlInput   = document.getElementById("owner-download-url");
            if (!viewInput.value) viewInput.value = (ov || def).viewUrl || "";
            if (!dlInput.value)   dlInput.value   = (ov && ov.downloadUrl) || def.downloadUrl || "";
            updateJsonSnippet();
        }
        function initOwnerConsole() {
            document.getElementById("owner-view-url").addEventListener("input", function () {
                var parsed = parseDriveUrl(this.value);
                if (parsed && this.value !== parsed.viewUrl) {
                    this.value = parsed.viewUrl;
                    document.getElementById("owner-download-url").value = parsed.downloadUrl;
                }
                updateJsonSnippet();
            });
            document.getElementById("owner-download-url").addEventListener("input", function () {
                var parsed = parseDriveUrl(this.value);
                if (parsed && this.value !== parsed.downloadUrl) {
                    this.value = parsed.downloadUrl;
                    document.getElementById("owner-view-url").value = parsed.viewUrl;
                }
                updateJsonSnippet();
            });
            document.getElementById("owner-preview").addEventListener("click", function () {
                var view = document.getElementById("owner-view-url").value.trim();
                var dl   = document.getElementById("owner-download-url").value.trim();
                if (!view) return;
                localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ viewUrl: view, downloadUrl: dl || view }));
                Modals.close();
                window.setTimeout(function () {
                    loadViewer();
                    Modals.open("resume-modal");
                }, 350);
            });
            document.getElementById("owner-clear").addEventListener("click", function () {
                localStorage.removeItem(OVERRIDE_KEY);
                refreshOwnerFields();
            });
            document.getElementById("owner-copy").addEventListener("click", function () {
                var ta = document.getElementById("owner-json");
                ta.select();
                var btn = this;
                var done = function () {
                    var old = btn.textContent;
                    btn.textContent = "Copied ✓";
                    window.setTimeout(function () { btn.textContent = old; }, 1500);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(ta.value).then(done, done);
                } else {
                    try { document.execCommand("copy"); } catch (e) {}
                    done();
                }
            });

            // owner access — the unlock phrase is stored only as a hash
            window.unlockResumeAdmin = async function (secret) {
                var ok = localStorage.getItem(ADMIN_KEY) === "1";
                if (!ok && secret) {
                    try { ok = (await digest(secret)) === SECRET_HASH; } catch (e) { ok = false; }
                }
                if (!ok) { console.warn("Nice try."); return; }
                localStorage.setItem(ADMIN_KEY, "1");
                refreshOwnerFields();
                Modals.open("owner-modal");
            };
        }

        return {
            init: function () {
                if (!document.getElementById("resume-modal")) return;
                initViewer();
                initOwnerConsole();
            }
        };
    })();

    /* --------------------------------------------------------- Easter eggs */
    var EasterEggs = (function () {
        function consoleEgg() {
            try {
                console.log(
                    "%c FILE № 001 — APPENDIX %c You found the console. Curious — good trait. %c github.com/3303mavihS ",
                    "background:#17140E;color:#EDEAE2;font-family:monospace;padding:4px 8px;",
                    "background:#B23E17;color:#EDEAE2;font-family:monospace;padding:4px 8px;",
                    "background:#EDEAE2;color:#17140E;font-family:monospace;padding:4px 8px;"
                );
            } catch (e) {}
        }
        function konami() {
            var seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
            var pos = 0;
            var veil = document.getElementById("classified-veil");
            document.addEventListener("keydown", function (e) {
                pos = (e.key === seq[pos]) ? pos + 1 : (e.key === seq[0] ? 1 : 0);
                if (pos === seq.length) {
                    pos = 0;
                    veil.classList.add("is-on");
                    Annotator.say("konami", true);
                    setTimeout(function () { veil.classList.remove("is-on"); }, 2600);
                }
            });
        }
        return { init: function () { consoleEgg(); konami(); } };
    })();

    /* --------------------------------------------------------------- boot */
    Tape.init();
    Smooth.init();
    Reveals.init();
    Words.init();
    Dossiers.init();
    Tick.init();
    Preview.init();
    Modals.init();
    Copy.init();
    Resume.init();
    Annotator.init();
    Mascot.init();
    Nav.init();
    EasterEggs.init();
    Preloader.init();

    // keep layout honest after images load
    window.addEventListener("load", function () { Smooth.refresh(); });
})();
