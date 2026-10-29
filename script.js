"use strict";

const $ = (selector) => document.querySelector(selector);

const FONT_LIBRARY_KEY = "samofont_ttf_library_v1";

const fontData = [
  {
    name: "Playfair Display",
    category: "Elegant",
    family: "'Playfair Display', Georgia, serif",
    style: "serif",
    description: "Elegant editorial style"
  },
  {
    name: "DM Sans",
    category: "Modern",
    family: "'DM Sans', Arial, sans-serif",
    style: "sans-serif",
    description: "Clean modern lettering"
  },
  {
    name: "Georgia",
    category: "Elegant",
    family: "Georgia, serif",
    style: "serif",
    description: "Classic serif style"
  },
  {
    name: "Arial",
    category: "Modern",
    family: "Arial, sans-serif",
    style: "sans-serif",
    description: "Simple and readable"
  },
  {
    name: "Courier New",
    category: "Mono",
    family: "'Courier New', monospace",
    style: "monospace",
    description: "Typewriter appearance"
  },
  {
    name: "Trebuchet MS",
    category: "Modern",
    family: "'Trebuchet MS', sans-serif",
    style: "sans-serif",
    description: "Friendly modern style"
  },
  {
    name: "Times New Roman",
    category: "Elegant",
    family: "'Times New Roman', serif",
    style: "serif",
    description: "Traditional typography"
  },
  {
    name: "Impact",
    category: "Bold",
    family: "Impact, sans-serif",
    style: "sans-serif",
    description: "Strong display lettering"
  },
  {
    name: "Brush Script",
    category: "Handwritten",
    family: "'Brush Script MT', cursive",
    style: "cursive",
    description: "Handwritten appearance"
  },
  {
    name: "Lucida Console",
    category: "Mono",
    family: "'Lucida Console', monospace",
    style: "monospace",
    description: "Console-style lettering"
  },
  {
    name: "Palatino",
    category: "Elegant",
    family: "Palatino, serif",
    style: "serif",
    description: "Classic literary style"
  },
  {
    name: "Verdana",
    category: "Modern",
    family: "Verdana, sans-serif",
    style: "sans-serif",
    description: "Clear and spacious"
  },
  {
    name: "Garamond",
    category: "Elegant",
    family: "Garamond, serif",
    style: "serif",
    description: "Traditional elegant style"
  },
  {
    name: "Monaco",
    category: "Mono",
    family: "Monaco, monospace",
    style: "monospace",
    description: "Compact coding style"
  },
  {
    name: "Comic Sans MS",
    category: "Handwritten",
    family: "'Comic Sans MS', cursive",
    style: "cursive",
    description: "Casual rounded lettering"
  },
  {
    name: "Fantasy Display",
    category: "Creative",
    family: "fantasy",
    style: "fantasy",
    description: "Decorative display style"
  }
];

let activeCategory = "All";
let searchTerm = "";
let customFonts = [];
let loadedFontFaces = new Map();
let selectedFont = null;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeFilename(name) {
  return String(name || "SamoFont")
    .replace(/[^a-z0-9_-]/gi, "-")
    .slice(0, 60) || "SamoFont";
}

function getCustomFonts() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(FONT_LIBRARY_KEY) || "[]"
    );

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((font) =>
      font &&
      typeof font.id === "string" &&
      typeof font.name === "string" &&
      typeof font.data === "string" &&
      font.data.length > 0
    );
  } catch (error) {
    console.warn("Could not read SamoFont custom library.", error);
    return [];
  }
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function loadCustomFont(font) {
  if (loadedFontFaces.has(font.id)) {
    return Promise.resolve(loadedFontFaces.get(font.id));
  }

  if (!("FontFace" in window) || !document.fonts) {
    return Promise.reject(
      new Error("Custom font preview is not supported in this browser.")
    );
  }

  let bytes;

  try {
    bytes = base64ToBytes(font.data);
  } catch (error) {
    return Promise.reject(new Error("Saved font data is invalid."));
  }

  const family = "SamoCustom_" + font.id.replace(/[^a-zA-Z0-9_-]/g, "");

  const face = new FontFace(
    family,
    bytes.buffer,
    { style: "normal", weight: "400" }
  );

  return face.load().then((loadedFace) => {
    document.fonts.add(loadedFace);

    const result = {
      family,
      face: loadedFace
    };

    loadedFontFaces.set(font.id, result);
    return result;
  });
}

function downloadCustomFont(font) {
  try {
    const bytes = base64ToBytes(font.data);
    const blob = new Blob([bytes], { type: "font/ttf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = safeFilename(font.name) + ".ttf";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (error) {
    alert("Font download nahi ho paya. Font Studio mein dobara try karo.");
  }
}

function getVisibleFonts() {
  const normalFonts = fontData.map((font) => ({
    ...font,
    isCustom: false
  }));

  const personalFonts = customFonts.map((font) => ({
    name: font.name,
    category: "My Fonts",
    family: "sans-serif",
    style: "custom",
    description: "Created with SamoFont Studio",
    isCustom: true,
    customId: font.id,
    customData: font.data
  }));

  return [...personalFonts, ...normalFonts].filter((font) => {
    const matchesCategory =
      activeCategory === "All" ||
      font.category.toLowerCase() === activeCategory.toLowerCase();

    const matchesSearch = [
      font.name,
      font.category,
      font.description
    ].join(" ").toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });
}

function ensureCustomFontsFilter() {
  const filterContainers = new Set();

  document.querySelectorAll("[data-category]").forEach((button) => {
    const parent = button.parentElement;
    if (parent) filterContainers.add(parent);
  });

  filterContainers.forEach((container) => {
    if (container.querySelector('[data-category="My Fonts"]')) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter";
    button.dataset.category = "My Fonts";
    button.textContent = "My Fonts";

    container.appendChild(button);
  });
}

function renderFonts() {
  const grid = $("#fontGrid");
  if (!grid) return;

  const visibleFonts = getVisibleFonts();
  const count = $("#fontCount");
  const emptyState = $("#emptyState");

  grid.innerHTML = visibleFonts.map((font) => {
    const safeName = escapeHTML(font.name);
    const safeCategory = escapeHTML(font.category);
    const safeDescription = escapeHTML(font.description);

    if (font.isCustom) {
      return `
        <article class="font-card custom-font-card">
          <div class="font-card-top">
            <span class="font-category">${safeCategory}</span>
            <span class="custom-badge">YOUR FONT</span>
          </div>

          <h3>${safeName}</h3>

          <p class="font-description">${safeDescription}</p>

          <div
            class="font-preview custom-font-preview"
            data-custom-preview="${escapeHTML(font.customId)}"
            style="font-family:sans-serif"
          >SamoFont Aa 123</div>

          <div class="font-card-actions">
            <button
              type="button"
              class="preview-button"
              data-custom-preview-button="${escapeHTML(font.customId)}"
            >Preview</button>

            <button
              type="button"
              class="download-font-button"
              data-download-font="${escapeHTML(font.customId)}"
            >Download TTF</button>
          </div>
        </article>
      `;
    }

    return `
      <article class="font-card">
        <div class="font-card-top">
          <span class="font-category">${safeCategory}</span>
        </div>

        <h3>${safeName}</h3>

        <p class="font-description">${safeDescription}</p>

        <div
          class="font-preview"
          style="font-family:${escapeHTML(font.family)}"
        >SamoFont Aa 123</div>

        <div class="font-card-actions">
          <button
            type="button"
            class="preview-button"
            data-font="${safeName}"
          >Try This Font</button>
        </div>
      </article>
    `;
  }).join("");

  if (count) {
    count.textContent = `${visibleFonts.length} fonts`;
  }

  if (emptyState) {
    emptyState.hidden = visibleFonts.length > 0;
  }

  customFonts.forEach((font) => {
    const sample = grid.querySelector(
      `[data-custom-preview="${CSS.escape(font.id)}"]`
    );

    if (!sample) return;

    loadCustomFont(font)
      .then((loaded) => {
        sample.style.fontFamily = `"${loaded.family}", sans-serif`;
      })
      .catch((error) => {
        console.warn("Custom font preview failed:", error);
        sample.textContent = "Preview unavailable — download the TTF";
      });
  });
}

function selectCategory(category) {
  activeCategory = category || "All";

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.category.toLowerCase() === activeCategory.toLowerCase()
    );
  });

  renderFonts();
}

document.addEventListener("click", (event) => {
  const categoryButton = event.target.closest("[data-category]");

  if (categoryButton) {
    selectCategory(categoryButton.dataset.category);
    return;
  }

  const previewButton = event.target.closest(".preview-button");

  if (previewButton) {
    const customId = previewButton.dataset.customPreviewButton;

    if (customId) {
      const font = customFonts.find((item) => item.id === customId);
      if (font) previewCustomFont(font);
      return;
    }

    const fontName = previewButton.dataset.font;
    const font = fontData.find((item) => item.name === fontName);

    if (font) previewBuiltInFont(font);
    return;
  }

  const downloadButton = event.target.closest("[data-download-font]");

  if (downloadButton) {
    const font = customFonts.find(
      (item) => item.id === downloadButton.dataset.downloadFont
    );

    if (font) downloadCustomFont(font);
  }
});

function previewBuiltInFont(font) {
  const input = $("#generatorInput");
  const results = $("#styleResults");

  if (input) {
    input.value = input.value || "SamoFont";
    input.style.fontFamily = font.family;
    input.focus();
  }

  if (results) {
    results.style.fontFamily = font.family;
  }

  selectedFont = {
    name: font.name,
    family: font.family,
    isCustom: false
  };

  const generator = $("#generatorInput");
  if (generator) {
    generator.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  updateGenerator();
}

async function previewCustomFont(font) {
  try {
    const loaded = await loadCustomFont(font);
    const input = $("#generatorInput");
    const results = $("#styleResults");

    if (input) {
      input.value = input.value || "SamoFont";
      input.style.fontFamily = `"${loaded.family}", sans-serif`;
    }

    if (results) {
      results.style.fontFamily = `"${loaded.family}", sans-serif`;
    }

    selectedFont = {
      name: font.name,
      family: `"${loaded.family}", sans-serif`,
      isCustom: true
    };

    const generator = $("#generatorInput");

    if (generator) {
      generator.scrollIntoView({ behavior: "smooth", block: "center" });
      generator.focus();
    }

    updateGenerator();
  } catch (error) {
    alert("Custom font preview load nahi hua. TTF download karke check karo.");
  }
}

/* Text generator */

const styleDefinitions = [
  { name: "Bold", convert: (text) => convertUnicode(text, 0x1D400, 0x1D41A) },
  { name: "Italic", convert: (text) => convertUnicode(text, 0x1D434, 0x1D44E) },
  { name: "Bold Italic", convert: (text) => convertUnicode(text, 0x1D468, 0x1D482) },
  { name: "Monospace", convert: (text) => convertUnicode(text, 0x1D670, 0x1D68A) },
  { name: "Double Struck", convert: convertDoubleStruck },
  { name: "Circled", convert: convertCircled },
  { name: "Fullwidth", convert: convertFullwidth },
  { name: "Upside Down", convert: convertUpsideDown }
];

function convertUnicode(text, upperStart, lowerStart) {
  return Array.from(text).map((char) => {
    const code = char.codePointAt(0);

    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(upperStart + code - 65);
    }

    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(lowerStart + code - 97);
    }

    return char;
  }).join("");
}

function convertDoubleStruck(text) {
  return Array.from(text).map((char) => {
    const code = char.codePointAt(0);

    if (code >= 65 && code <= 90) {
      const special = {
        C: 0x2102,
        H: 0x210D,
        N: 0x2115,
        P: 0x2119,
        Q: 0x211A,
        R: 0x211D,
        Z: 0x2124
      };

      return String.fromCodePoint(special[char] || (0x1D538 + code - 65));
    }

    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(0x1D552 + code - 97);
    }

    if (code >= 48 && code <= 57) {
      return String.fromCodePoint(0x1D7D8 + code - 48);
    }

    return char;
  }).join("");
}

function convertCircled(text) {
  return Array.from(text).map((char) => {
    const code = char.codePointAt(0);

    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(0x24B6 + code - 65);
    }

    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(0x24D0 + code - 97);
    }

    if (code >= 49 && code <= 57) {
      return String.fromCodePoint(0x2460 + code - 49);
    }

    if (char === "0") return "⓪";
    return char;
  }).join("");
}

function convertFullwidth(text) {
  return Array.from(text).map((char) => {
    const code = char.codePointAt(0);

    if (code >= 33 && code <= 126) {
      return String.fromCodePoint(code + 0xFEE0);
    }

    if (char === " ") return "　";
    return char;
  }).join("");
}

function convertUpsideDown(text) {
  const map = {
    a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ",
    f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ",
    k: "ʞ", l: "ן", m: "ɯ", n: "u", o: "o",
    p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ",
    u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ",
    z: "z", A: "∀", B: "𐐒", C: "Ɔ", D: "◖",
    E: "Ǝ", F: "Ⅎ", G: "פ", H: "H", I: "I",
    J: "ſ", K: "⋊", L: "˥", M: "W", N: "N",
    O: "O", P: "Ԁ", Q: "Ό", R: "ᴚ", S: "S",
    T: "┴", U: "∩", V: "Λ", W: "M", X: "X",
    Y: "⅄", Z: "Z", ".": "˙", ",": "'", "'": ",",
    "?": "¿", "!": "¡", "(": ")", ")": "(",
    "[": "]", "]": "[", "_": "‾"
  };

  return Array.from(text).reverse()
    .map((char) => map[char] || char)
    .join("");
}

function updateGenerator() {
  const input = $("#generatorInput");
  const results = $("#styleResults");
  const count = $("#characterCount");

  if (!input || !results) return;

  const text = input.value || "";
  if (count) count.textContent = `${text.length} characters`;

  results.innerHTML = styleDefinitions.map((style, index) => `
    <article class="style-card">
      <div class="style-card-top">
        <strong>${escapeHTML(style.name)}</strong>
        <button
          type="button"
          class="copy-button"
          data-style-index="${index}"
        >Copy</button>
      </div>
      <div class="style-output">${escapeHTML(style.convert(text))}</div>
    </article>
  `).join("");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    let success = false;

    try {
      success = document.execCommand("copy");
    } catch (copyError) {
      success = false;
    }

    textarea.remove();
    return success;
  }
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-style-index]");
  if (!button) return;

  const index = Number(button.dataset.styleIndex);
  const input = $("#generatorInput");

  if (!input || !styleDefinitions[index]) return;

  const output = styleDefinitions[index].convert(input.value || "");
  const success = await copyText(output);

  button.textContent = success ? "Copied!" : "Select & Copy";
  setTimeout(() => {
    button.textContent = "Copy";
  }, 1400);
});

const generatorInput = $("#generatorInput");
if (generatorInput) {
  generatorInput.addEventListener("input", updateGenerator);
}

const clearTextButton = $("#clearText");
if (clearTextButton) {
  clearTextButton.addEventListener("click", () => {
    if (generatorInput) {
      generatorInput.value = "";
      generatorInput.style.fontFamily = "";
    }

    selectedFont = null;
    updateGenerator();
    if (generatorInput) generatorInput.focus();
  });
}

const searchForm = $("#searchForm");
if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const searchInput = $("#searchInput");
    searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";

    renderFonts();
  });
}

const searchInput = $("#searchInput");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    renderFonts();
  });
}

document.querySelectorAll("[data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    selectCategory(button.dataset.category);
  });
});

/* Refresh My Fonts when the user returns from Font Studio. */

function refreshCustomFonts() {
  customFonts = getCustomFonts();
  renderFonts();
}

window.addEventListener("pageshow", refreshCustomFonts);
window.addEventListener("focus", refreshCustomFonts);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshCustomFonts();
});

/* Initialize */

ensureCustomFontsFilter();
customFonts = getCustomFonts();

const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

renderFonts();
updateGenerator();
