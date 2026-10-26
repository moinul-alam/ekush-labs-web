<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { PPR_PDF_URL } from "../../lib/ppr/data";

  /**
   * Self-hosted pdf.js viewer. The gazette is opened by page number through the
   * `?page=` query parameter — not a `#page=` fragment, which iframes and mobile
   * browsers routinely ignore.
   *
   * The PDF's own text layer is the *legacy* encoding (the Bengali there is
   * glyph-coded, not Unicode), so the search box matches the Latin runs it
   * really carries: English terms, acronyms, numbers.
   */
  export let page = 1;
  export let query = "";
  export let lang: "bn" | "en" = "bn";
  /** The edition's printed-page offset, so the header shows the gazette number. */
  export let pageOffset = 0;

  const dispatch = createEventDispatcher<{ close: void; page: number }>();

  let host: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let textLayer: HTMLDivElement;

  let pdf: any = null;
  let pdfjs: any = null;
  let loading = true;
  let error: string | null = null;
  let progress = 0;
  let numPages = 0;
  let zoom = 1;
  let fitScale = 1;
  let highlightCount = 0;
  let searchInput = query;
  let renderToken = 0;

  const ZOOMS = [0.75, 1, 1.5, 2, 3];

  onMount(async () => {
    try {
      const [lib, worker] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      pdfjs = lib;
      pdfjs.GlobalWorkerOptions.workerSrc = (worker as { default: string }).default;
      pdf = await pdfjs.getDocument({
        url: PPR_PDF_URL,
        onProgress: ({ loaded, total }: { loaded: number; total: number }) => {
          if (total) progress = Math.round((loaded / total) * 100);
        },
      }).promise;
      numPages = pdf.numPages;
      await render();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    pdf?.destroy?.();
  });

  function zoomStep(direction: number) {
    const index = ZOOMS.findIndex((value) => value >= zoom);
    const next = Math.min(ZOOMS.length - 1, Math.max(0, index + direction));
    zoom = ZOOMS[next];
    render();
  }

  function goTo(target: number) {
    const next = Math.min(numPages, Math.max(1, target));
    if (next === page) return;
    page = next;
    dispatch("page", page);
    render();
  }

  function applyQuery() {
    query = searchInput.trim();
    render();
  }

  function close() {
    dispatch("close");
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      close();
    } else if (event.key === "ArrowRight" || event.key === "PageDown") {
      goTo(page + 1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      goTo(page - 1);
    }
  }

  /** One normalised form on both sides, so the highlight is case- and space-insensitive. */
  function normalizeText(text: string): string {
    return text.replace(/\s+/g, " ").trim().toLowerCase();
  }

  async function render() {
    if (!pdf || !canvas || !textLayer) return;
    const token = ++renderToken;
    try {
      const pdfPage = await pdf.getPage(page);
      if (token !== renderToken) return;

      const base = pdfPage.getViewport({ scale: 1 });
      const available = host?.clientWidth ?? 800;
      fitScale = Math.min(1.6, Math.max(0.2, (available - 2) / base.width));
      const viewport = pdfPage.getViewport({ scale: fitScale * zoom });

      const ratio = window.devicePixelRatio || 1;
      const context = canvas.getContext("2d")!;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      await pdfPage.render({
        canvasContext: context,
        viewport,
        transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
      }).promise;
      if (token !== renderToken) return;

      const textContent = await pdfPage.getTextContent();
      if (token !== renderToken) return;
      layoutText(textContent, viewport);
    } catch (err) {
      if (token === renderToken) {
        error = err instanceof Error ? err.message : String(err);
      }
    }
  }

  /**
   * Rebuild the page's text layer as absolutely positioned spans, so a match can
   * be marked in place. pdf.js gives each run a PDF-space transform and width;
   * the viewport transform plus a measured scaleX puts it back where it belongs.
   */
  function layoutText(textContent: any, viewport: any) {
    const needle = normalizeText(query);
    const fragment = document.createDocumentFragment();
    const placed: Array<{ node: HTMLSpanElement; width: number }> = [];
    highlightCount = 0;

    for (const item of textContent.items) {
      if (typeof item.str !== "string" || !item.str) continue;
      const matrix = pdfjs.Util.transform(viewport.transform, item.transform);
      const height = Math.hypot(matrix[2], matrix[3]);
      const node = document.createElement("span");
      node.textContent = item.str;
      node.style.left = `${matrix[4]}px`;
      node.style.top = `${matrix[5] - height}px`;
      node.style.fontSize = `${height}px`;
      node.style.fontFamily = textContent.styles?.[item.fontName]?.fontFamily ?? "sans-serif";
      if (needle && normalizeText(item.str).includes(needle)) {
        node.className = "hit";
        highlightCount += 1;
      }
      placed.push({ node, width: item.width * viewport.scale });
      fragment.appendChild(node);
    }

    textLayer.replaceChildren(fragment);
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    for (const { node, width } of placed) {
      const measured = node.getBoundingClientRect().width;
      if (measured > 0 && width > 0) {
        node.style.transform = `scaleX(${width / measured})`;
      }
    }
  }

  $: gazettePage =
    lang === "bn"
      ? String(page + pageOffset).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)])
      : String(page + pageOffset);

  const bn = lang === "bn";
</script>

<div
  class="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm p-0 sm:p-6"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  on:keydown={onKeydown}
>
  <!-- Backdrop click closes; the panel stops the event. -->
  <button
    type="button"
    aria-label={bn ? "বন্ধ করুন" : "Close"}
    class="absolute inset-0 cursor-default"
    on:click={close}
  ></button>

  <div
    class="relative flex flex-col w-full h-full sm:max-w-5xl mx-auto rounded-none sm:rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl"
  >
    <header
      class="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 border-b border-slate-200 dark:border-white/10"
    >
      <span class="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
        {bn ? "মূল বিধিমালা" : "Full gazette"}
      </span>
      <span class="text-xs text-slate-500 dark:text-silver">
        {bn ? "গেজেট পৃষ্ঠা" : "gazette page"}
        <span class="font-bold text-slate-700 dark:text-slate-200">{gazettePage}</span>
        · {page}/{numPages}
      </span>

      <div class="flex items-center gap-1 ml-auto">
        <button
          type="button"
          on:click={() => goTo(page - 1)}
          disabled={page <= 1}
          class="px-2.5 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30"
        >
          ‹
        </button>
        <button
          type="button"
          on:click={() => goTo(page + 1)}
          disabled={page >= numPages}
          class="px-2.5 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30"
        >
          ›
        </button>
        <button
          type="button"
          on:click={() => zoomStep(-1)}
          class="px-2.5 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          −
        </button>
        <span class="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          on:click={() => zoomStep(1)}
          class="px-2.5 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          +
        </button>
        <button
          type="button"
          on:click={close}
          class="ml-1 px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
        >
          {bn ? "বন্ধ" : "Close"}
        </button>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto sm:order-first">
        <input
          bind:value={searchInput}
          on:keydown={(event) => event.key === "Enter" && applyQuery()}
          placeholder={bn ? "এই পৃষ্ঠায় খুঁজুন (ইংরেজি)" : "Find on this page (Latin)"}
          class="flex-1 sm:w-64 px-3 py-1.5 rounded-lg text-sm bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 outline-none focus:border-primary-mid"
        />
        <button
          type="button"
          on:click={applyQuery}
          class="px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
        >
          {bn ? "খুঁজুন" : "Find"}
        </button>
        {#if query}
          <span class="text-xs text-slate-400 whitespace-nowrap">
            {highlightCount} {bn ? "মিল" : "hits"}
          </span>
        {/if}
      </div>
    </header>

    <div
      bind:this={host}
      class="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 flex justify-center p-2 sm:p-4"
    >
      {#if loading}
        <div class="flex flex-col items-center justify-center gap-3 py-24">
          <div class="w-9 h-9 rounded-full border-4 border-slate-300 dark:border-white/10 border-t-primary-start animate-spin"></div>
          <p class="text-sm text-slate-500 dark:text-silver">
            {bn ? `মূল বিধিমালা লোড হচ্ছে… ${progress}%` : `Loading the gazette… ${progress}%`}
          </p>
        </div>
      {:else if error}
        <div class="text-center py-24 max-w-sm">
          <p class="font-bold text-rose-600 dark:text-rose-400 mb-2">
            {bn ? "পিডিএফ লোড করা যায়নি।" : "Could not load the PDF."}
          </p>
          <p class="text-sm text-slate-500 dark:text-silver break-words mb-4">{error}</p>
          <a
            href={PPR_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-bold text-primary-mid underline"
          >
            {bn ? "সরাসরি পিডিএফ খুলুন" : "Open the PDF directly"}
          </a>
        </div>
      {:else}
        <div class="relative self-start">
          <canvas bind:this={canvas} class="block shadow-lg bg-white"></canvas>
          <div bind:this={textLayer} class="ppr-pdf-text"></div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* The spans are built imperatively, so these rules cannot be scoped. */
  :global(.ppr-pdf-text) {
    position: absolute;
    inset: 0;
    overflow: hidden;
    line-height: 1;
    opacity: 0.999;
  }

  :global(.ppr-pdf-text span) {
    position: absolute;
    white-space: pre;
    transform-origin: 0 0;
    color: transparent;
    cursor: text;
  }

  :global(.ppr-pdf-text span.hit) {
    color: transparent;
    background: rgba(250, 204, 21, 0.45);
    border-radius: 2px;
    box-shadow: 0 0 0 1px rgba(234, 88, 12, 0.4);
  }
</style>
