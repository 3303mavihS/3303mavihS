/* ===================================================================
 * Shivam Sharma — Portfolio v2
 * Vanilla JS: smooth scroll, preloader, reveals, cursor, previews,
 * magnetic buttons, modals. No dependencies.
 * =================================================================== */

(function () {

    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer   = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const lerp  = (a, b, t) => a + (b - a) * t;


    /* ---------------------------------------------------------------
     * Time-of-day theme (IST) — day / dusk / night
     * ------------------------------------------------------------- */
    const Theme = (function () {

        function currentTheme() {
            let hour;
            try {
                hour = parseFloat(new Date().toLocaleString("en-US", {
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }).replace(":", "."));
            } catch (err) {
                const d = new Date();
                hour = d.getHours() + d.getMinutes() / 60;
            }

            if (hour >= 6 && hour < 17)    return "day";
            if (hour >= 17 && hour < 19.5) return "dusk";
            return "night";
        }

        function apply() {
            document.documentElement.setAttribute("data-theme", currentTheme());
        }

        function init() {
            apply();
            // re-check every minute so the site morphs live across boundaries
            window.setInterval(apply, 60 * 1000);
        }

        return { init };

    })();


    /* ---------------------------------------------------------------
     * Resume viewer + owner console
     * ------------------------------------------------------------- */
    const Resume = (function () {

        const OVERRIDE_KEY = "resume_override_v1";
        const ADMIN_KEY    = "resume_admin_unlocked";
        const SECRET_HASH  = "ad72295cb9d1562222c74161b672387525335097f0bcdeefdee1b0d11f175306";

        async function digest(text) {
            const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
            return Array.from(new Uint8Array(buf))
                .map(function (b) { return b.toString(16).padStart(2, "0"); })
                .join("");
        }

        function config() {
            return window.RESUME_CONFIG || {};
        }

        function override() {
            try {
                const o = JSON.parse(localStorage.getItem(OVERRIDE_KEY));
                if (o && o.viewUrl) return o;
            } catch (e) { /* ignore */ }
            return null;
        }

        function active() {
            return override() || {
                viewUrl:     config().viewUrl,
                downloadUrl: config().downloadUrl
            };
        }

        /* --- visitor-facing viewer --- */

        function loadViewer() {
            const a     = active();
            const frame = document.getElementById("resume-frame");
            const dl    = document.getElementById("resume-download");
            const msg   = document.getElementById("resume-message");

            if (frame && frame.getAttribute("src") !== a.viewUrl) {
                frame.setAttribute("src", a.viewUrl);
            }
            if (dl) dl.href = a.downloadUrl || a.viewUrl;
            if (msg && !msg.textContent) msg.textContent = config().message || "";
        }

        function initViewer() {
            const trigger = document.querySelector('[data-modal-open="resume-modal"]');
            if (trigger) {
                trigger.addEventListener("click", loadViewer);
            }

            const waBtn = document.getElementById("resume-whatsapp");
            if (waBtn) {
                waBtn.addEventListener("click", function () {
                    const name  = document.getElementById("resume-name").value.trim();
                    const email = document.getElementById("resume-email").value.trim();

                    let text = "Hi Shivam! " +
                        (name ? "I'm " + name + " — " : "") +
                        "I just viewed your resume on your portfolio.";
                    if (email) {
                        text += " Let's have a talk. Here's my email: " + email;
                    }

                    window.open(
                        "https://wa.me/" + (config().whatsapp || "") +
                        "?text=" + encodeURIComponent(text),
                        "_blank",
                        "noopener"
                    );
                });
            }
        }

        /* --- owner console --- */

        // accepts any Google Drive share link and returns embeddable URLs
        function parseDriveUrl(url) {
            const match = String(url).match(/[-\w]{25,}/);
            if (!match || !/drive\.google\.com|docs\.google\.com/.test(url)) return null;
            const id = match[0];
            return {
                viewUrl:     "https://drive.google.com/file/d/" + id + "/preview",
                downloadUrl: "https://drive.google.com/uc?export=download&id=" + id
            };
        }

        function refreshOwnerFields() {
            const def = config();
            const ov  = override();
            document.getElementById("owner-default-url").textContent  = def.viewUrl || "—";
            document.getElementById("owner-override-url").textContent = ov ? ov.viewUrl : "none";

            const viewInput = document.getElementById("owner-view-url");
            const dlInput   = document.getElementById("owner-download-url");
            if (!viewInput.value) viewInput.value = (ov || def).viewUrl || "";
            if (!dlInput.value)   dlInput.value   = (ov && ov.downloadUrl) || def.downloadUrl || "";

            updateJsonSnippet();
        }

        function updateJsonSnippet() {
            const view = document.getElementById("owner-view-url").value.trim();
            const dl   = document.getElementById("owner-download-url").value.trim();
            document.getElementById("owner-json").value =
                'window.RESUME_CONFIG = {\n' +
                '    viewUrl:     "' + view + '",\n' +
                '    downloadUrl: "' + dl + '",\n' +
                '    whatsapp:    "' + (config().whatsapp || "") + '",\n' +
                '    message:     "' + (config().message || "").replace(/"/g, '\\"') + '"\n' +
                '};';
        }

        function initOwnerConsole() {
            // auto-transform Drive share links into embed/download URLs
            document.getElementById("owner-view-url").addEventListener("input", function () {
                const parsed = parseDriveUrl(this.value);
                if (parsed && this.value !== parsed.viewUrl) {
                    this.value = parsed.viewUrl;
                    document.getElementById("owner-download-url").value = parsed.downloadUrl;
                }
                updateJsonSnippet();
            });
            document.getElementById("owner-download-url").addEventListener("input", function () {
                const parsed = parseDriveUrl(this.value);
                if (parsed && this.value !== parsed.downloadUrl) {
                    this.value = parsed.downloadUrl;
                    document.getElementById("owner-view-url").value = parsed.viewUrl;
                }
                updateJsonSnippet();
            });

            document.getElementById("owner-preview").addEventListener("click", function () {
                const view = document.getElementById("owner-view-url").value.trim();
                const dl   = document.getElementById("owner-download-url").value.trim();
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
                const ta = document.getElementById("owner-json");
                ta.select();
                const done = function (btn) {
                    const label = btn.querySelector(".btn__label");
                    const old = label.textContent;
                    label.textContent = "Copied ✓";
                    window.setTimeout(function () { label.textContent = old; }, 1500);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(ta.value).then(() => done(this));
                } else {
                    document.execCommand("copy");
                    done(this);
                }
            });

            // owner access — the unlock phrase is stored only as a hash
            window.unlockResumeAdmin = async function (secret) {
                let ok = localStorage.getItem(ADMIN_KEY) === "1";
                if (!ok && secret) {
                    try {
                        ok = (await digest(secret)) === SECRET_HASH;
                    } catch (e) { ok = false; }
                }
                if (!ok) {
                    console.warn("Nice try.");
                    return;
                }
                localStorage.setItem(ADMIN_KEY, "1");
                refreshOwnerFields();
                Modals.open("owner-modal");
            };
        }

        function init() {
            if (!document.getElementById("resume-modal")) return;
            initViewer();
            initOwnerConsole();
        }

        return { init };

    })();
    const Smooth = (function () {

        const content = document.getElementById("smooth-content");
        let current = 0;
        let enabled = false;

        function setHeight() {
            document.body.style.height = content.getBoundingClientRect().height + "px";
        }

        function init() {
            if (reducedMotion || !content) return;

            content.style.position = "fixed";
            content.style.top = "0";
            content.style.left = "0";
            content.style.width = "100%";
            content.style.willChange = "transform";

            setHeight();
            enabled = true;

            window.addEventListener("resize", setHeight);
            window.addEventListener("load", setHeight);
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(setHeight);
            }
        }

        function update() {
            if (!enabled) return;
            const target = window.scrollY || window.pageYOffset;
            current = lerp(current, target, 0.085);
            if (Math.abs(target - current) < 0.05) current = target;
            content.style.transform = "translate3d(0," + -current + "px,0)";
        }

        function refresh() {
            if (enabled) setHeight();
        }

        function scrollToY(destination, duration) {
            const start = window.scrollY || window.pageYOffset;
            const change = destination - start;
            const startTime = performance.now();
            duration = duration || 1100;

            function easeInOutCubic(t) {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }

            function step(now) {
                const elapsed = clamp((now - startTime) / duration, 0, 1);
                window.scrollTo(0, start + change * easeInOutCubic(elapsed));
                if (elapsed < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        return { init, update, refresh, scrollToY };

    })();


    /* ---------------------------------------------------------------
     * Preloader — counter, name reveal, curtain lift
     * ------------------------------------------------------------- */
    const Preloader = (function () {

        const preloader = document.getElementById("preloader");
        const counter   = document.getElementById("preloader-count");
        let finished    = false;
        let cycleTimer  = null;

        function finish() {
            if (finished) return;
            finished = true;

            window.clearInterval(cycleTimer);
            preloader.classList.add("is-done");
            document.body.classList.add("is-loaded");

            window.setTimeout(function () {
                preloader.classList.add("is-gone");
                Smooth.refresh();
            }, 1150);
        }

        function cycleWords() {
            const words = preloader.querySelectorAll(".preloader__word");
            if (!words.length) return;

            let index = 0;
            // small delay so the first word slides in after the panel settles
            window.setTimeout(function () {
                words[0].classList.add("is-active");
            }, 80);

            cycleTimer = window.setInterval(function () {
                // stop on the last word ("Welcome") — no loop
                if (index >= words.length - 1) {
                    window.clearInterval(cycleTimer);
                    return;
                }
                const current = words[index];
                index = index + 1;
                const next = words[index];

                current.classList.remove("is-active");
                current.classList.add("is-exit");

                next.classList.remove("is-exit");
                void next.offsetWidth; // restart transition
                next.classList.add("is-active");
            }, 520);
        }

        function run() {
            if (!preloader) {
                document.body.classList.add("is-loaded");
                return;
            }

            cycleWords();

            const duration = reducedMotion ? 200 : 3300;
            const startTime = performance.now();

            function tick(now) {
                const t = clamp((now - startTime) / duration, 0, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                counter.textContent = String(Math.round(eased * 100)).padStart(3, "0");
                if (t < 1) {
                    requestAnimationFrame(tick);
                } else {
                    // hold on "Welcome" for a beat, then lift the curtain
                    window.setTimeout(finish, 950);
                }
            }
            requestAnimationFrame(tick);

            // safety net — never trap the user
            window.setTimeout(finish, 7000);
        }

        return { run };

    })();


    /* ---------------------------------------------------------------
     * Custom cursor
     * ------------------------------------------------------------- */
    const Cursor = (function () {

        function init() {
            if (!finePointer || reducedMotion) return;

            const root = document.querySelector(".cursor");
            const dot  = root.querySelector(".cursor__dot");
            const ring = root.querySelector(".cursor__ring");

            let mx = -100, my = -100;
            let rx = -100, ry = -100;
            let visible = false;

            document.addEventListener("mousemove", function (e) {
                mx = e.clientX;
                my = e.clientY;
                if (!visible) {
                    visible = true;
                    root.style.opacity = "1";
                }
                dot.style.transform =
                    "translate(" + (mx - 3) + "px," + (my - 3) + "px)";
            });

            document.addEventListener("mouseleave", function () {
                visible = false;
                root.style.opacity = "0";
            });

            document.addEventListener("mousedown", function () {
                root.classList.add("is-down");
            });
            document.addEventListener("mouseup", function () {
                root.classList.remove("is-down");
            });

            const hoverables = "a, button, [data-hover]";
            document.addEventListener("mouseover", function (e) {
                if (e.target.closest(hoverables)) root.classList.add("is-hovering");
            });
            document.addEventListener("mouseout", function (e) {
                if (e.target.closest(hoverables)) root.classList.remove("is-hovering");
            });

            (function loop() {
                rx = lerp(rx, mx, 0.16);
                ry = lerp(ry, my, 0.16);
                ring.style.transform =
                    "translate(" + (rx - 17) + "px," + (ry - 17) + "px)";
                requestAnimationFrame(loop);
            })();
        }

        return { init };

    })();


    /* ---------------------------------------------------------------
     * Scroll reveals (IntersectionObserver)
     * ------------------------------------------------------------- */
    const Reveals = (function () {

        function init() {
            const targets = document.querySelectorAll("[data-reveal], .section-head");

            if (!("IntersectionObserver" in window) || reducedMotion) {
                targets.forEach(function (el) { el.classList.add("is-inview"); });
                return;
            }

            const io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-inview");
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

            targets.forEach(function (el) { io.observe(el); });
        }

        return { init };

    })();


    /* ---------------------------------------------------------------
     * Word-by-word scrub paragraphs
     * ------------------------------------------------------------- */
    const Scrub = (function () {

        const blocks = [];

        function init() {
            document.querySelectorAll("[data-scrub]").forEach(function (el) {
                const words = el.textContent.trim().split(/\s+/);
                el.textContent = "";
                words.forEach(function (word, i) {
                    const span = document.createElement("span");
                    span.className = "word";
                    span.textContent = word;
                    el.appendChild(span);
                    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
                });
                blocks.push({ el: el, words: el.querySelectorAll(".word") });
            });
        }

        function update() {
            if (reducedMotion) return;
            const vh = window.innerHeight;
            blocks.forEach(function (block) {
                const rect = block.el.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > vh) return;
                const progress = clamp((vh * 0.92 - rect.top) / (vh * 0.6), 0, 1);
                const lit = Math.floor(progress * block.words.length);
                block.words.forEach(function (w, i) {
                    w.classList.toggle("is-lit", i < lit);
                });
            });
        }

        return { init, update };

    })();


    /* ---------------------------------------------------------------
     * Floating work preview
     * ------------------------------------------------------------- */
    const WorkPreview = (function () {

        function init() {
            if (!finePointer) return;

            const preview = document.getElementById("work-preview");
            const img     = document.getElementById("work-preview-img");
            const rows    = document.querySelectorAll(".work-item__row");
            if (!preview || !rows.length) return;

            let mx = 0, my = 0, px = 0, py = 0;
            let active = false;

            document.addEventListener("mousemove", function (e) {
                mx = e.clientX;
                my = e.clientY;
            });

            rows.forEach(function (row) {
                row.addEventListener("mouseenter", function () {
                    const src = row.getAttribute("data-preview");
                    if (img.getAttribute("src") !== src) img.setAttribute("src", src);
                    active = true;
                    preview.classList.add("is-visible");
                });
                row.addEventListener("mouseleave", function () {
                    active = false;
                    preview.classList.remove("is-visible");
                });
            });

            (function loop() {
                px = lerp(px, mx, 0.12);
                py = lerp(py, my, 0.12);
                const rotation = clamp((mx - px) * 0.06, -8, 8);
                preview.style.transform =
                    "translate(" + px + "px," + py + "px) rotate(" + (active ? rotation : 0) + "deg)";
                requestAnimationFrame(loop);
            })();
        }

        return { init };

    })();


    /* ---------------------------------------------------------------
     * Magnetic elements
     * ------------------------------------------------------------- */
    const Magnetic = (function () {

        function init() {
            if (!finePointer || reducedMotion) return;

            document.querySelectorAll("[data-magnetic]").forEach(function (el) {
                el.addEventListener("mouseenter", function () {
                    el.style.transition = "transform 0.1s linear";
                });
                el.addEventListener("mousemove", function (e) {
                    const rect = el.getBoundingClientRect();
                    const relX = e.clientX - (rect.left + rect.width / 2);
                    const relY = e.clientY - (rect.top + rect.height / 2);
                    el.style.transform =
                        "translate(" + relX * 0.28 + "px," + relY * 0.28 + "px)";
                });
                el.addEventListener("mouseleave", function () {
                    el.style.transition = "transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)";
                    el.style.transform = "translate(0, 0)";
                });
            });
        }

        return { init };

    })();


    /* ---------------------------------------------------------------
     * Modals
     * ------------------------------------------------------------- */
    const Modals = (function () {

        let openModal = null;
        let lastFocus = null;
        let settleTimer = null;

        function formatStat(el, value) {
            const prefix  = el.getAttribute("data-prefix") || "";
            const suffix  = el.getAttribute("data-suffix") || "";
            const rounded = Math.round(value);
            const text    = rounded >= 1000 ? rounded.toLocaleString("en-IN") : String(rounded);
            return prefix + text + suffix;
        }

        function animateStats(modal) {
            modal.querySelectorAll(".stat__num").forEach(function (el) {
                const target = parseFloat(el.getAttribute("data-count")) || 0;
                if (reducedMotion) {
                    el.textContent = formatStat(el, target);
                    return;
                }
                const duration = 1100;
                const startTime = performance.now();
                function tick(now) {
                    const t = Math.min((now - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - t, 3);
                    el.textContent = formatStat(el, target * eased);
                    if (t < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            });
        }

        function open(id) {
            const modal = document.getElementById(id);
            if (!modal || openModal) return;

            lastFocus = document.activeElement;
            openModal = modal;

            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.documentElement.classList.add("is-locked");

            animateStats(modal);

            // after the entrance stagger finishes, remove transition
            // delays so hover feedback feels instant
            window.clearTimeout(settleTimer);
            settleTimer = window.setTimeout(function () {
                if (openModal) openModal.classList.add("is-settled");
            }, 1150);

            const closeBtn = modal.querySelector(".modal__close");
            if (closeBtn) closeBtn.focus();
        }

        function close() {
            if (!openModal) return;

            openModal.classList.remove("is-open");
            openModal.classList.remove("is-settled");
            openModal.setAttribute("aria-hidden", "true");
            document.documentElement.classList.remove("is-locked");

            if (lastFocus && lastFocus.focus) lastFocus.focus();
            openModal = null;
        }

        function init() {
            document.querySelectorAll("[data-modal-open]").forEach(function (trigger) {
                trigger.addEventListener("click", function () {
                    open(trigger.getAttribute("data-modal-open"));
                });
            });

            document.querySelectorAll("[data-modal-close]").forEach(function (closer) {
                closer.addEventListener("click", close);
            });

            document.addEventListener("keydown", function (e) {
                if (e.key === "Escape") close();
            });

            // ghost numeral drifts against the cursor
            if (finePointer && !reducedMotion) {
                document.querySelectorAll(".modal").forEach(function (modal) {
                    const ghost = modal.querySelector(".modal__ghost");
                    const panel = modal.querySelector(".modal__panel");
                    if (!ghost || !panel) return;

                    modal.addEventListener("mousemove", function (e) {
                        const rect = panel.getBoundingClientRect();
                        const relX = (e.clientX - rect.left) / rect.width - 0.5;
                        const relY = (e.clientY - rect.top) / rect.height - 0.5;
                        ghost.style.transform =
                            "translate(" + relX * -26 + "px," + relY * -20 + "px)";
                    });
                });
            }
        }

        return { init, open, close };

    })();


    /* ---------------------------------------------------------------
     * Anchor scrolling + scrollspy + clock
     * ------------------------------------------------------------- */
    const Navigation = (function () {

        function init() {

            // smooth anchor scrolling (content is transform-driven,
            // so resolve positions against the live scroll position)
            document.querySelectorAll("[data-scroll]").forEach(function (link) {
                link.addEventListener("click", function (e) {
                    const id = link.getAttribute("href");
                    if (!id || id.charAt(0) !== "#") return;
                    e.preventDefault();

                    if (id === "#top") {
                        Smooth.scrollToY(0);
                        return;
                    }
                    const target = document.querySelector(id);
                    if (!target) return;
                    const y = target.getBoundingClientRect().top +
                              (window.scrollY || window.pageYOffset) - 20;
                    Smooth.scrollToY(Math.max(y, 0));
                });
            });

            const toTop = document.getElementById("to-top");
            if (toTop) {
                toTop.addEventListener("click", function () { Smooth.scrollToY(0); });
            }

            // reveal the brand only after the hero is scrolled past —
            // the name lives in the hero, no need to repeat it
            const header = document.getElementById("site-header");
            const hero   = document.getElementById("top");
            function brandCheck() {
                if (!header || !hero) return;
                const threshold = hero.offsetHeight * 0.65;
                header.classList.toggle(
                    "brand-visible",
                    (window.scrollY || window.pageYOffset) > threshold
                );
            }
            window.addEventListener("scroll", brandCheck, { passive: true });
            brandCheck();

            // scrollspy
            const navLinks = Array.prototype.slice.call(
                document.querySelectorAll(".site-nav a")
            );
            const sections = navLinks
                .map(function (link) { return document.querySelector(link.getAttribute("href")); })
                .filter(Boolean);

            function spy() {
                const y = (window.scrollY || window.pageYOffset) + window.innerHeight * 0.4;
                let activeId = null;
                sections.forEach(function (section) {
                    if (section.getBoundingClientRect().top +
                        (window.scrollY || window.pageYOffset) <= y) {
                        activeId = "#" + section.id;
                    }
                });
                navLinks.forEach(function (link) {
                    link.classList.toggle("is-active", link.getAttribute("href") === activeId);
                });
            }
            window.addEventListener("scroll", spy, { passive: true });
            spy();

            // IST clock
            const clockEl = document.getElementById("header-time");
            function tickClock() {
                try {
                    clockEl.textContent = new Date().toLocaleTimeString("en-GB", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
                } catch (err) {
                    clockEl.textContent = new Date().toLocaleTimeString("en-GB");
                }
            }
            tickClock();
            window.setInterval(tickClock, 1000);
        }

        return { init };

    })();


    /* ---------------------------------------------------------------
     * Main loop + boot
     * ------------------------------------------------------------- */
    function rafLoop() {
        Smooth.update();
        Scrub.update();
        requestAnimationFrame(rafLoop);
    }

    Theme.init();
    Smooth.init();
    Scrub.init();
    Reveals.init();
    Cursor.init();
    WorkPreview.init();
    Magnetic.init();
    Modals.init();
    Resume.init();
    Navigation.init();

    if (document.readyState === "complete") {
        Preloader.run();
    } else {
        window.addEventListener("load", Preloader.run);
    }

    rafLoop();

})();
