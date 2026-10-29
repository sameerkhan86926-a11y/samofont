"use strict";

const $ = (selector) => document.querySelector(selector);

const fontData = [
  { name: "Playfair Display", category: "Serif", family: "'Playfair Display', Georgia, serif", style: "serif", description: "Elegant & editorial" },
  { name: "DM Sans", category: "Sans Serif", family: "'DM Sans', Arial, sans-serif", style: "sans", description: "Clean & modern" },
  { name: "Georgia", category: "Serif", family: "Georgia, serif", style: "serif", description: "Classic & readable" },
  { name: "Arial", category: "Sans Serif", family: "Arial, sans-serif", style: "sans", description: "Simple & versatile" },
  { name: "Courier New", category: "Monospace", family: "'Courier New', monospace", style: "mono", description: "Code & technical" },
  { name: "Trebuchet MS", category: "Sans Serif", family: "'Trebuchet MS', sans-serif", style: "sans", description: "Friendly & clear" },
  { name: "Times New Roman", category: "Serif", family: "'Times New Roman', serif", style: "serif", description: "Traditional & formal" },
  { name: "Impact", category: "Display", family: "Impact, sans-serif", style: "display", description: "Bold & powerful" },
  { name: "Brush Script", category: "Handwriting", family: "'Brush Script MT', cursive", style: "handwriting", description: "Expressive & flowing" },
  { name: "Lucida Console", category: "Monospace", family: "'Lucida Console', monospace", style: "mono", description: "Developer favourite" },
  { name: "Palatino", category: "Serif", family: "Palatino, 'Palatino Linotype', serif", style: "serif", description: "Refined & timeless" },
  { name: "Verdana", category: "Sans Serif", family: "Verdana, sans-serif", style: "sans", description: "Readable & spacious" },
  { name: "Garamond", category: "Serif", family: "Garamond, serif", style: "serif", description: "Literary & graceful" },
  { name: "Monaco", category: "Monospace", family: "Monaco, monospace", style: "mono", description: "Compact & technical" },
  { name: "Comic Sans MS", category: "Handwriting", family: "'Comic Sans MS', cursive", style: "handwriting", description: "Casual & playful" },
  { name: "Fantasy Display", category: "Display", family: "fantasy", style: "display", description: "Creative & decorative" }
];

let activeCategory = "All";
let searchTerm = "";

const fontGrid = $("#fontGrid");
const fontCount = $("#fontCount");
const emptyState = $("#emptyState");
const searchInput = $("#searchInput");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderFonts() {
  const filteredFonts = fontData.filter((font) => {
    const matchesCategory =
      activeCategory === "All" || font.category === activeCategory;

    const searchableText =
      `${font.name} ${font.category} ${font.description}`.toLowerCase();

    return matchesCategory && searchableText.includes(searchTerm.toLowerCase());
  });

  fontCount.textContent = `${filteredFonts.length} fonts`;

  fontGrid.innerHTML = filteredFonts.map((font) => `
    <article class="font-card">
      <div class="font-card-head">
        <span class="font-category">${escapeHTML(font.category)}</span>
        <small>Preview</small>
      </div>

      <div class="font-sample"
           style="font-family:${font.family}"
           data-font="${escapeHTML(font.name)}">
        Aa Bb 123
      </div>

      <div class="font-card-bottom">
        <div>
          <strong>${escapeHTML(font.name)}</strong>
        </div>
        <button type="button"
                class="preview-button"
                data-font="${escapeHTML(font.name)}">
          Try font ↗
        </button>
      </div>
    </article>
  `).join("");

  emptyState.hidden = filteredFonts.length !== 0;
}

function selectCategory(category) {
  activeCategory = category;

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.category === category &&
      button.classList.contains("filter")
    );
  });

  renderFonts();
}

document.querySelectorAll("[data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    selectCategory(button.dataset.category);

    if (button.closest(".quick-tags")) {
      $("#library").scrollIntoView({ behavior: "smooth" });
    }
  });
});

$("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  searchTerm = searchInput.value.trim();
  renderFonts();
  $("#library").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim();
  renderFonts();
});

fontGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".preview-button");
  if (!button) return;

  const font = fontData.find((item) => item.name === button.dataset.font);
  if (!font) return;

  const generatorInput = $("#generatorInput");
  generatorInput.value = generatorInput.value.trim() || "SamoFont";

  generatorInput.scrollIntoView({ behavior: "smooth", block: "center" });
  generatorInput.focus();

  updateGenerator();
});

const styleDefinitions = [
  {
    name: "Bold",
    convert: (text) => convertUnicode(text, 0x1D400, 0x1D41A, 0x1D7CE)
  },
  {
    name: "Italic",
    convert: (text) => convertUnicode(text, 0x1D434, 0x1D44E, null)
  },
  {
    name: "Bold Italic",
    convert: (text) => convertUnicode(text, 0x1D468, 0x1D482, null)
  },
  {
    name: "Monospace",
    convert: (text) => convertUnicode(text, 0x1D670, 0x1D68A, 0x1D7F6)
  },
  {
    name: "Double Struck",
    convert: (text) => convertUnicode(text, 0x1D538, 0x1D552, 0x1D7D8)
  },
  {
    name: "Circled",
    convert: (text) => convertCircled(text)
  },
  {
    name: "Fullwidth",
    convert: (text) => convertFullwidth(text)
  },
  {
    name: "Upside Down",
    convert: (text) => convertUpsideDown(text)
  }
];

function convertUnicode(text, upperStart, lowerStart, digitStart) {
  return Array.from(text).map((character) => {
    const code = character.codePointAt(0);

    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(upperStart + code - 65);
    }

    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(lowerStart + code - 97);
    }

    if (digitStart !== null && code >= 48 && code <= 57) {
      return String.fromCodePoint(digitStart + code - 48);
    }

    return character;
  }).join("");
}

function convertCircled(text) {
  return Array.from(text).map((character) => {
    const code = character.codePointAt(0);

    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(0x24B6 + code - 65);
    }

    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(0x24D0 + code - 97);
    }

    if (code >= 49 && code <= 57) {
      return String.fromCodePoint(0x2460 + code - 49);
    }

    if (character === "0") return "⓪";

    return character;
  }).join("");
}

function convertFullwidth(text) {
  return Array.from(text).map((character) => {
    const code = character.codePointAt(0);

    if (code >= 33 && code <= 126) {
      return String.fromCodePoint(code + 0xFEE0);
    }

    if (character === " ") return "\u3000";

    return character;
  }).join("");
}

function convertUpsideDown(text) {
  const map = {
    a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ",
    f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ",
    k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o",
    p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ",
    u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ",
    z: "z",
    A: "∀", B: "𐐒", C: "Ɔ", D: "◖", E: "Ǝ",
    F: "Ⅎ", G: "פ", H: "H", I: "I", J: "ſ",
    K: "⋊", L: "˥", M: "W", N: "N", O: "O",
    P: "Ԁ", Q: "Ό", R: "ᴚ", S: "S", T: "⊥",
    U: "∩", V: "Λ", W: "M", X: "X", Y: "⅄",
    Z: "Z",
    ".": "˙", ",": "'", "'": ",", "?": "¿",
    "!": "¡", "(": ")", ")": "(", "[": "]",
    "]": "[", "{": "}", "}": "{", "_": "‾"
  };

  return Array.from(text).reverse()
    .map((character) => map[character] || character)
    .join("");
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      const success = document.execCommand("copy");
      textarea.remove();

      if (!success) throw new Error("Copy failed");
    }

    const oldText = button.textContent;
    button.textContent = "Copied!";

    setTimeout(() => {
      button.textContent = oldText;
    }, 1300);
  } catch (error) {
    window.prompt("Copy your text from here:", text);
  }
}

function updateGenerator() {
  const input = $("#generatorInput");
  const text = input.value;

  $("#characterCount").textContent = `${text.length} / 150 characters`;

  $("#styleResults").innerHTML = styleDefinitions.map((style, index) => {
    const converted = style.convert(text);

    return `
      <div class="style-card">
        <div class="style-card-top">
          <strong>${escapeHTML(style.name)}</strong>
          <button type="button"
                  class="copy-button"
                  data-style-index="${index}">
            Copy
          </button>
        </div>
        <div class="style-output">${escapeHTML(converted || "Your text here")}</div>
      </div>
    `;
  }).join("");
}

$("#styleResults").addEventListener("click", (event) => {
  const button = event.target.closest("[data-style-index]");
  if (!button) return;

  const index = Number(button.dataset.styleIndex);
  const style = styleDefinitions[index];

  if (style) {
    copyText(style.convert($("#generatorInput").value), button);
  }
});

$("#generatorInput").addEventListener("input", updateGenerator);

$("#clearText").addEventListener("click", () => {
  $("#generatorInput").value = "";
  updateGenerator();
  $("#generatorInput").focus();
});

$("#year").textContent = new Date().getFullYear();

renderFonts();
updateGenerator();
