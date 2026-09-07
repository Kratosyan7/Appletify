/* =============================================================================
   Appletify — theme.js
   1. moveNavElementsMod   — moves the global nav into the sidebar and the
                             now-playing bar into the main view (top bar)
   2. sidebarStateMod      — toggles .apple-sidebar-collapsed on the sidebar
   3. localeStylesMod      — injects CSS rules whose selectors depend on
                             localized aria-labels (read from Spicetify.Locale)
   4. SpotifySearchMod     — short, localized search placeholder
   5. discographyMod       — clones the first discography card into the header
   6. enhanceImageSizes    — forces full-size header images
   7. glowMod              — album/playlist cover glow
   ============================================================================= */

/* ---------------------------------------------------------------------------
   Locale helpers
   --------------------------------------------------------------------------- */
const AppletifyLocale = {
  /** Translated string for `key`, or `fallback` if the dictionary is missing it. */
  get(key, fallback) {
    try {
      const v = Spicetify?.Locale?.get?.(key);
      if (typeof v === "string" && v.length && v !== key) return v;
    } catch (_) { /* Locale not ready */ }
    return fallback;
  },
  ready() {
    return typeof Spicetify?.Locale?.get === "function";
  },
};

/** Escape a string for use inside a double-quoted CSS attribute value. */
function cssStr(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** `[attr="value"]` */
function attrEq(attr, value) {
  return `[${attr}="${cssStr(value)}"]`;
}

/**
 * Attribute selector for a template like "More options for {0}".
 * Uses the literal text before the placeholder (`^=`), or after it (`$=`)
 * when the placeholder comes first, or `*=` on the longest literal chunk.
 */
function attrTemplate(attr, template) {
  const parts = String(template).split(/\{\d+\}|%[a-z]+%/i).map((p) => p.trim());
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (first) return `[${attr}^="${cssStr(first)}"]`;
  if (last) return `[${attr}$="${cssStr(last)}"]`;
  const longest = parts.sort((a, b) => b.length - a.length)[0] || "";
  return longest ? `[${attr}*="${cssStr(longest)}"]` : `[${attr}]`;
}

/* ---------------------------------------------------------------------------
   1. Move nav elements
   --------------------------------------------------------------------------- */
(function moveNavElementsMod() {
  const globalNavBar = document.querySelector("#global-nav-bar");
  const navTarget = document.querySelector("#Desktop_LeftSidebar_Id > nav > div");
  const searchSection = document.querySelector("#global-nav-bar > div.main-globalNav-searchSection");
  const libraryContainer = document.querySelector("#Desktop_LeftSidebar_Id > nav > div > div.main-yourLibraryX-libraryContainer.YourLibraryX");
  const newElement = document.querySelector(".playback-bar");
  const nowPlayingWidget = document.querySelector(".main-nowPlayingWidget-nowPlaying");

  const nowPlayingBar = document.querySelector(".Root__now-playing-bar");
  const mainViewContainer = document.querySelector(".main-view-container");

  if (
    !globalNavBar ||
    !navTarget ||
    !searchSection ||
    !libraryContainer ||
    !newElement ||
    !nowPlayingWidget ||
    !nowPlayingBar ||
    !mainViewContainer
  ) {
    setTimeout(moveNavElementsMod, 300);
    return;
  }

  navTarget.insertBefore(globalNavBar, navTarget.firstChild);
  libraryContainer.insertBefore(searchSection, libraryContainer.firstChild);
  nowPlayingWidget.appendChild(newElement);

  // The now-playing bar becomes the main view's top bar (see user.css §7).
  // It is inserted as the first child so it sits above the scroll node in
  // DOM order; positioning is handled in CSS.
  mainViewContainer.insertBefore(nowPlayingBar, mainViewContainer.firstChild);
  document.body.classList.add("apple-playbar-top");
})();

/* ---------------------------------------------------------------------------
   2. Sidebar collapsed state
   --------------------------------------------------------------------------- */
(function sidebarStateMod() {
  const sb = document.querySelector("#Desktop_LeftSidebar_Id");
  if (!sb) {
    setTimeout(sidebarStateMod, 300);
    return;
  }
  const update = () =>
    sb.classList.toggle("apple-sidebar-collapsed", sb.getBoundingClientRect().width < 120);
  new ResizeObserver(update).observe(sb);
  update();

  // Collapsed rail: the search input is hidden, so its leading search icon
  // would only focus an invisible field — make it open the Search page instead.
  document.addEventListener("click", (e) => {
    if (!sb.classList.contains("apple-sidebar-collapsed")) return;
    const btn = e.target.closest?.(".main-globalNav-searchInputContainer [class*='form-input-icon__icon--leading'] button");
    if (!btn || !sb.contains(btn)) return;
    e.preventDefault();
    e.stopPropagation();
    Spicetify?.Platform?.History?.push("/search");
  }, true);
})();

/* ---------------------------------------------------------------------------
   3. Locale-dependent styles
   Spotify localizes aria-label / title attributes, so every selector that
   matches on them is generated here from the current dictionary instead of
   being hard-coded in English in user.css.
   --------------------------------------------------------------------------- */
(function localeStylesMod() {
  if (!AppletifyLocale.ready()) {
    setTimeout(localeStylesMod, 300);
    return;
  }

  const t = (key, fallback) => AppletifyLocale.get(key, fallback);

  // Strings ------------------------------------------------------------------
  const likedSongs   = attrEq("aria-label", t("web-player.aligned-curation.tooltips.add-to-liked-songs", "Add to Liked Songs"));
  const addToPlaylist = [
    t("web-player.aligned-curation.tooltips.add-to-playlist", "Add to playlist"),
    t("contextmenu.add-to-playlist", "Add to playlist"),
  ];
  const saveToLibrary = [
    t("save_to_your_library", "Save to Your Library"),
    t("contextmenu.add-to-library", "Add to Your Library"),
    t("web-player.aligned-curation.tooltips.add-to-your-library", "Add to Your Library"),
  ];
  const removeFromLibrary = [
    t("remove_from_your_library", "Remove from Your Library"),
    t("contextmenu.remove-from-library", "Remove from Your Library"),
  ];
  const merch = [t("artist-page.merch", "Merch"), t("web-player.merch.title", "Merch")];
  const download = [t("download.download", "Download"), t("contextmenu.download", "Download")];
  const explore      = attrTemplate("aria-label", t("web-player.watch-feed.entity-button.aria-label", "Explore {0}"));
  const invite       = attrTemplate("aria-label", t("permissions.invite-collaborators", "Invite collaborators to {0}"));
  const moreOptions  = attrTemplate("aria-label", t("more.label.context", "More options for {0}"));
  const allSongsFor  = attrTemplate("aria-label", t("search.showing-category-query-songs", "All songs for “{0}”"));
  const externalLink = attrEq("aria-label", t("a11y.externalLink", "External link"));
  const searchPage   = attrEq("aria-label", t("search.page-title", "Spotify – Search"));
  const recentlyPlayed = attrEq("aria-label", t("view.recently-played", "Recently played"));
  const fansAlsoLike = attrEq("aria-label", t("artist-page.fansalsolike", "Fans also like"));
  const discography  = attrEq("aria-label", t("artist-page.discography", "Discography"));
  const appearsOn    = attrEq("aria-label", t("artist.appears-on", "Appears On"));
  const artistPlaylists = attrEq("aria-label", t("artist-page.artist-playlists", "Artist Playlists"));
  const discoveredOn = attrEq("aria-label", t("artist-page.discovered-on", "Discovered on"));
  const featuring    = attrTemplate("aria-label", t("artist-page.featuring", "Featuring {0}"));

  const anyOf = (attr, values) => `:is(${[...new Set(values)].map((v) => attrEq(attr, v)).join(", ")})`;

  // Rules --------------------------------------------------------------------
  const css = `
/* Appletify — generated from Spicetify.Locale (${Spicetify?.Locale?.getLocale?.() ?? "unknown"}) */

/* Track rows: hide the like / add-to-playlist buttons at the row end */
.main-trackList-rowSectionEnd ${likedSongs},
.main-trackList-rowSectionEnd ${anyOf("aria-label", addToPlaylist)} { display: none; }

/* Context menu: hide the "external link" entries */
.main-contextMenu-menuItemButton:has(${externalLink}) { display: none; }

/* Search page top spacing */
main${searchPage} > div > div:nth-child(1) { padding-top: 60px; }

/* Queue panel */
[id="queue-panel"] ${recentlyPlayed} > li > div { --box-hover-background-color: rgba(255, 255, 255, .1) !important; }
[id="queue-panel"] ${moreOptions} { opacity: 1; zoom: 1.2; color: #fa586a; }

/* Album / playlist pages: hide library, merch, explore, download, invite buttons */
[data-testid="album-page"] ${anyOf("aria-label", saveToLibrary)},
[data-testid="album-page"] .main-trackList-curationButton${likedSongs},
[data-testid="album-page"] ${anyOf("aria-label", merch)},
[data-testid="album-page"] .main-rootlist-wrapper ${anyOf("aria-label", addToPlaylist)},
.main-actionBar-ActionBar ${anyOf("aria-label", saveToLibrary)},
.main-actionBar-ActionBarRow ${anyOf("aria-label", saveToLibrary)},
.main-actionBar-ActionBarRow ${anyOf("aria-label", removeFromLibrary)},
.main-actionBar-ActionBarRow ${explore},
[data-testid="playlist-page"] .main-actionBar-ActionBarRow > ${invite} { display: none; }

.main-actionBar-ActionBarRow > div:has(> div > ${anyOf("aria-label", download)}) { display: none; }
.main-actionBar-ActionBarRow > ${anyOf("aria-label", download)},
.main-actionBar-ActionBarRow > :has(> ${anyOf("aria-label", download)}) { display: none; }

/* Artist page: "All songs for …" */
${allSongsFor} { margin-top: 50px; margin-left: 60px; margin-right: 90px; }
${allSongsFor} .main-rootlist-wrapper > div:nth-child(2) > div:nth-child(1) > div::after { border-top: none; }
${allSongsFor} .main-rootlist-wrapper > div:nth-child(2) > div:nth-child(1) > div { margin-top: -10px; }

/* Artist / album page: "more options" button */
[data-test-uri^="spotify:artist"] .main-actionBar-ActionBarRow ${moreOptions} { zoom: 0.9; margin-left: auto; }
[data-test-uri^="spotify:artist"] .main-actionBar-ActionBarRow ${moreOptions}::before {
    content: '';
    position: absolute; z-index: -1;
    top: 50%; left: 50%;
    background: rgba(40, 40, 40, 0.5);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    height: 45px; width: 45px;
}
:is([data-testid="album-page"], [data-test-uri^="spotify:artist"]) ${moreOptions} span { color: #ff375f; }

/* Artist page: "Fans also like" shelf */
[data-test-uri^="spotify:artist"] ${fansAlsoLike} > .main-shelf-shelfGrid { column-gap: 20px; --min-column-width: 160px !important; }
[data-test-uri^="spotify:artist"] ${fansAlsoLike} [data-encore-id="cardSubtitle"] { display: none; }
[data-test-uri^="spotify:artist"] ${fansAlsoLike} { margin-bottom: 20px; order: 3; }
[data-test-uri^="spotify:artist"] ${fansAlsoLike} .main-shelf-header { zoom: 1.4; margin-bottom: 5px; }

/* Artist page shelves (Discography / Appears On / Artist Playlists / Fans also like / Discovered on / Featuring) */
[data-test-uri^="spotify:artist"] ${fansAlsoLike}::before {
    content: "";
    position: absolute;
    background: rgb(43, 43, 43);
    left: -60px;
    width: 115%;
    height: 143%;
}

[data-test-uri^="spotify:artist"] ${discography} > div:nth-child(3) {
    --min-column-width: 18vw !important;
    padding-left: 90px;
    margin-left: -100px;
}

${appearsOn} > .main-gridContainer-gridContainer { --min-column-width: 230px !important; }

/* Artist playlists grid */
[data-test-uri^="spotify:artist"] ${artistPlaylists} div:nth-child(2){
    --min-column-width: 18vw !important;}

[data-test-uri^="spotify:artist"] div.contentSpacing > ${discography} > .main-gridContainer-gridContainer > div:nth-child(7),
[data-test-uri^="spotify:artist"] div.contentSpacing > ${discography} > .main-gridContainer-gridContainer > div:nth-child(8) { display: none; }

[data-test-uri^="spotify:artist"] ${discoveredOn},
[data-test-uri^="spotify:artist"] ${featuring} { display: none; }
`;

  const ID = "appletify-locale-css";
  let style = document.getElementById(ID);
  if (!style) {
    style = document.createElement("style");
    style.id = ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
})();

/* ---------------------------------------------------------------------------
   4. Search placeholder
   --------------------------------------------------------------------------- */
(function SpotifySearchMod() {
  const selector = '[data-encore-id="formInput"]';
  const searchInput = document.querySelector(selector);
  if (!searchInput || !AppletifyLocale.ready()) {
    setTimeout(SpotifySearchMod, 300);
    return;
  }

  const placeholder = AppletifyLocale.get("navbar.search", "Search");

  function modifySearchPlaceholder() {
    const input = document.querySelector(selector);
    if (input && input.placeholder !== placeholder) input.placeholder = placeholder;
  }

  modifySearchPlaceholder();
  new MutationObserver(modifySearchPlaceholder).observe(searchInput, {
    attributes: true,
    attributeFilter: ["placeholder"],
  });
})();

/* ---------------------------------------------------------------------------
   5. Discography card in the artist header
   --------------------------------------------------------------------------- */
(function discographyMod() {
  if (!Spicetify?.Platform?.History || !Spicetify?.CosmosAsync || !AppletifyLocale.ready()) {
    setTimeout(discographyMod, 300);
    return;
  }

  const discography = attrEq("aria-label", AppletifyLocale.get("artist-page.discography", "Discography"));

  const ARTIST_SELECTOR = "[data-test-uri^='spotify:artist']";
  const SOURCE_SELECTOR = `.main-actionBar-ActionBarContainer + .contentSpacing > ${discography} > .main-gridContainer-gridContainer > div:nth-child(1)`;
  const TARGET_SELECTOR = ".main-actionBar-ActionBarContainer + .contentSpacing > div:nth-child(1)";
  const BUTTON_SELECTOR = ".main-gridContainer-gridContainerMargin > div:nth-child(1) > button";
  const CLONE_ID = "discography-first-card-clone";
  const DONE_ATTR = "data-discography-done";

  function addClickHandler(clone) {
    clone.addEventListener("click", (e) => {
      e.preventDefault();
      const anchor = e.target.closest("a") || clone.querySelector("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href) Spicetify.Platform.History.push(href);
    });
  }

  function insertClone(source, target) {
    if (document.getElementById(CLONE_ID)) return;
    const clone = source.cloneNode(true);
    clone.id = CLONE_ID;
    target.insertBefore(clone, target.firstChild);
    addClickHandler(clone);
    const clonedImg = clone.querySelector("img");
    if (clonedImg) clonedImg.style.opacity = "1";
  }

  function run(retries = 10) {
    const page = document.querySelector(ARTIST_SELECTOR);
    if (!page) return;

    let somethingPending = false;

    // --- See more button ---
    if (!page.hasAttribute(DONE_ATTR)) {
      const button = page.querySelector(BUTTON_SELECTOR);
      if (button) {
        button.click();
        button.style.display = "none";
        page.setAttribute(DONE_ATTR, "true");
      } else {
        somethingPending = true;
      }
    }

    // --- Discography clone ---
    if (!document.getElementById(CLONE_ID)) {
      const source = page.querySelector(SOURCE_SELECTOR);
      const target = page.querySelector(TARGET_SELECTOR);

      if (source && target) {
        const img = source.querySelector("img");
        if (img && !img.complete) {
          img.addEventListener("load", () => insertClone(source, target), { once: true });
        } else {
          insertClone(source, target);
        }
      } else {
        somethingPending = true;
      }
    }

    if (somethingPending && retries > 0) {
      setTimeout(() => run(retries - 1), 500);
    }
  }

  function onNavigate() {
    document.getElementById(CLONE_ID)?.remove();
    document.querySelector(ARTIST_SELECTOR)?.removeAttribute(DONE_ATTR);
    setTimeout(run, 800);
  }

  Spicetify.Platform.History.listen(onNavigate);
  setTimeout(run, 800);
})();

/* ---------------------------------------------------------------------------
   6. Full-size header images
   --------------------------------------------------------------------------- */
(function enhanceImageSizes() {
  const SELECTOR = ".main-image-image.main-entityHeader-image[srcset]";

  function apply(root) {
    if (root.matches?.(SELECTOR)) root.setAttribute("sizes", "9999px");
    root.querySelectorAll?.(SELECTOR).forEach((img) => img.setAttribute("sizes", "9999px"));
  }

  function start() {
    apply(document.body);

    // Batch DOM mutations into one pass per animation frame instead of
    // walking every added subtree synchronously on each mutation.
    let pending = null;
    let rafID = null;
    const observer = new MutationObserver((mutations) => {
      pending ??= new Set();
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) pending.add(node);
        }
      }
      if (rafID) return;
      rafID = requestAnimationFrame(() => {
        const nodes = pending;
        pending = null;
        rafID = null;
        nodes.forEach(apply);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* ---------------------------------------------------------------------------
   7. Cover glow on album / playlist pages
   --------------------------------------------------------------------------- */
(function glowMod() {
  const PAGE_SELECTOR = '[data-testid="album-page"], [data-testid="playlist-page"]';
  const WRAP_SELECTOR = ".main-entityHeader-image";

  let currentWrap = null;
  let imgObserver = null;
  let rafID = null;

  function applyGlow(wrap) {
    if (!wrap) return;
    wrap.classList.add("glow-wrap");

    const img = wrap.querySelector("img[src]");
    const src = img?.getAttribute("src");
    if (!src) return;

    wrap.style.setProperty("--glow-img", `url("${src.replace(/"/g, '\\"')}")`);
  }

  function watchImage(wrap) {
    const img = wrap?.querySelector("img");
    if (!img) return;

    // Spotify lazy-loads and swaps the cover image
    imgObserver = new MutationObserver(() => applyGlow(wrap));
    imgObserver.observe(img, { attributes: true, attributeFilter: ["src", "srcset"] });
  }

  function clearPrevious() {
    if (currentWrap) {
      currentWrap.classList.remove("glow-wrap");
      currentWrap.style.removeProperty("--glow-img");
    }
    imgObserver?.disconnect();
    imgObserver = null;
    currentWrap = null;
  }

  function checkAlbum() {
    const page = document.querySelector(PAGE_SELECTOR);
    const wrap = page?.querySelector(WRAP_SELECTOR);
    if (!wrap) {
      clearPrevious();
      return;
    }
    if (wrap === currentWrap) return;

    clearPrevious();
    currentWrap = wrap;
    applyGlow(currentWrap);
    watchImage(currentWrap);
  }

  const globalObs = new MutationObserver(() => {
    if (rafID) cancelAnimationFrame(rafID);
    rafID = requestAnimationFrame(checkAlbum);
  });
  globalObs.observe(document.body, { childList: true, subtree: true });

  checkAlbum();
})();
