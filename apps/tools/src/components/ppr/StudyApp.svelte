<script lang="ts">
  import { onMount } from "svelte";
  import { PPR_PDF_URL, PprDataStore } from "../../lib/ppr/data";
  import {
    createPprSearch,
    resolveDirect,
    searchProvisions,
    type PprDocument,
    type PprGlossaryTerm,
    type PprManifest,
    type PprManifestChapter,
    type PprRef,
    type PprResult,
    type PprSubRule,
  } from "../../lib/ppr/search";
  import {
    annotateText,
    citation,
    clauseParam,
    parseClauseParam,
    provisionId,
    provisionLabel,
    refLabel,
    refResolves,
    type PprTextToken,
  } from "../../lib/ppr/refs";
  import ClauseText from "./ClauseText.svelte";
  import PdfViewer from "./PdfViewer.svelte";

  export let lang: "bn" | "en" = "bn";

  const store = new PprDataStore();

  let loading = true;
  let error: string | null = null;
  let manifest: PprManifest | null = null;
  let documents: PprDocument[] | null = null;
  let offline = false;

  let query = "";
  let openChapter: number | null = null;
  let openClauseId: string | null = null;
  let trail: string[] = [];
  let viewer: { page: number; query: string } | null = null;
  let termPopover: { term: PprGlossaryTerm; x: number; y: number } | null = null;
  let copied: string | null = null;

  const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
  const EN_ORDINALS = [
    "First", "Second", "Third", "Fourth", "Fifth", "Sixth",
    "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth",
  ];
  // One hue per chapter, so the browse grid reads as a set of distinct cards.
  const CHAPTER_HUES = [199, 262, 330, 24, 152, 291, 43];
  // Rotating row tints, so a long rule list stays scannable.
  const ROW_TINTS = ["bg-sky-500/5", "bg-violet-500/5", "bg-rose-500/5"];

  /** Bengali numerals in `bn`, ASCII in `en` — for numbers and mixed labels alike. */
  function localize(value: number | string): string {
    const text = String(value);
    if (lang === "bn") return text.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);
    return text.replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)));
  }

  function chapterLabel(chapter: PprManifestChapter | number): string {
    const number = typeof chapter === "number" ? chapter : chapter.number;
    const ordinal = typeof chapter === "number" ? undefined : chapter.ordinal;
    if (lang === "bn") return `${ordinal ?? localize(number)} অধ্যায়`;
    return `${EN_ORDINALS[number - 1] ?? number} Chapter`;
  }

  function hue(chapterNumber: number): number {
    return CHAPTER_HUES[(chapterNumber - 1) % CHAPTER_HUES.length];
  }

  // ---------------------------------------------------------------- data

  onMount(load);

  async function load() {
    loading = true;
    error = null;
    try {
      manifest = await store.fetchManifest();
      documents = await store.fetchDocuments();
      offline = store.source === "cache";
      applyUrl();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  /** Land on whatever a shared link asked for. */
  function applyUrl() {
    if (!manifest) return;
    const params = new URLSearchParams(window.location.search);

    const clauseValue = params.get("clause");
    if (clauseValue) {
      const target = parseClauseParam(clauseValue);
      if (target?.kind === "chapter") {
        openChapter = target.number;
      } else if (target) {
        openClauseId = provisionId(manifest, target.kind, target.number);
      }
    }

    const chapterValue = params.get("chapter");
    if (chapterValue) openChapter = Number(chapterValue);

    const q = params.get("q");
    if (q) query = q;

    const page = Number(params.get("page"));
    if (page) viewer = { page, query: params.get("pdfq") ?? "" };
  }

  /** The view is the same URL, so it can be shared and restored. */
  function writeUrl() {
    const params = new URLSearchParams();
    if (clause) {
      params.set("clause", clauseParam(clause.kind, clause.number));
    } else if (chapter) {
      params.set("chapter", String(chapter.number));
    }
    if (query.trim()) params.set("q", query.trim());
    if (viewer) {
      params.set("page", String(viewer.page));
      if (viewer.query) params.set("pdfq", viewer.query);
    }
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }

  // ------------------------------------------------------------- derived

  $: chapters = manifest?.chapters ?? [];
  $: index = manifest && documents ? createPprSearch(documents, manifest) : null;
  $: results = index && query.trim() ? searchProvisions(index, manifest!, query, 60) : [];
  $: direct = manifest && query.trim() ? resolveDirect(query, manifest.resolve) : null;
  $: clause =
    openClauseId && documents
      ? documents.find((document) => document.id === openClauseId) ?? null
      : null;
  $: chapter =
    openChapter === null ? null : chapters.find((entry) => entry.number === openChapter) ?? null;
  $: chapterRules =
    chapter && documents
      ? documents
          .filter((document) => document.chapter === chapter.number)
          .sort((a, b) => a.number - b.number)
      : [];
  $: ruleGroups = groupRules(chapter, chapterRules);
  $: resultGroups = groupResults(results);
  $: if (!loading && manifest) writeUrl();

  interface RuleGroup {
    label: string | null;
    title: string | null;
    rules: PprDocument[];
  }

  /** Rules grouped under their part heading, in the order the parts are declared. */
  function groupRules(source: PprManifestChapter | null, rules: PprDocument[]): RuleGroup[] {
    if (!source) return [];
    const groups: RuleGroup[] = [];
    for (const part of source.parts ?? []) {
      const partRules = rules.filter((rule) => rule.part === part.label);
      if (partRules.length) groups.push({ label: part.label, title: part.title, rules: partRules });
    }
    const placed = new Set(groups.flatMap((group) => group.rules.map((rule) => rule.id)));
    const remainder = rules.filter((rule) => !placed.has(rule.id));
    if (remainder.length) groups.push({ label: null, title: null, rules: remainder });
    return groups;
  }

  interface ResultGroup {
    key: string;
    label: string;
    hue: number;
    results: PprResult[];
  }

  /** Hits grouped by the chapter they belong to, chapters in order, schedules last. */
  function groupResults(hits: PprResult[]): ResultGroup[] {
    const groups = new Map<string, ResultGroup>();
    const keyFor = (hit: PprResult) =>
      hit.chapter ? `chapter-${hit.chapter}` : hit.kind === "schedule" ? "schedules" : "rules";
    for (const hit of hits) {
      const key = keyFor(hit);
      if (!groups.has(key)) {
        const number = hit.chapter ?? 0;
        groups.set(key, {
          key,
          label: hit.chapter
            ? chapterLabel(hit.chapter)
            : hit.kind === "schedule"
              ? lang === "bn"
                ? "তফসিল"
                : "Schedules"
              : lang === "bn"
                ? "বিধি"
                : "Rules",
          hue: hit.chapter ? hue(hit.chapter) : 215,
          results: [],
        });
      }
      groups.get(key)!.results.push(hit);
    }
    return [...groups.values()].sort((a, b) => {
      if (a.key === "schedules") return 1;
      if (b.key === "schedules") return -1;
      return (a.results[0].chapter ?? 0) - (b.results[0].chapter ?? 0);
    });
  }

  interface SubRuleView {
    key: string;
    label: string;
    kind: PprSubRule["kind"];
    tokens: PprTextToken[];
    children: SubRuleView[];
  }

  interface ClauseBody {
    /** Whatever sits between the title and the first clause - often nothing. */
    lead: PprTextToken[];
    items: SubRuleView[];
  }

  /**
   * A rule body, cut the way the corpus cuts it. The marker (`৫৭।`) and the
   * title are already on the heading above, so they are dropped; what is left is
   * the lead-in plus the numbered clauses, with their lettered sub-clauses nested
   * underneath. A body with no list markers comes back whole, as one run.
   */
  function clauseBodyOf(document: PprDocument, source: PprManifest): ClauseBody {
    const afterMarker = document.text.slice(document.text.indexOf("।") + 1);
    const titleEnd = afterMarker.indexOf("।");
    const body = (titleEnd < 0 ? "" : afterMarker.slice(titleEnd + 1)).trim();
    const first = document.subRules?.[0];
    const leadEnd = first ? body.indexOf(first.text) : -1;
    const lead = first ? (leadEnd < 0 ? "" : body.slice(0, leadEnd)) : body;

    const items: SubRuleView[] = [];
    for (const [index, sub] of (document.subRules ?? []).entries()) {
      const view: SubRuleView = {
        key: `${index}:${sub.label}`,
        label: sub.label,
        kind: sub.kind,
        // The clause text still carries the label the gazette drew in front of it.
        tokens: annotateText(sub.text.replace(/^\([^)]*\)\s*/, ""), source, source.glossary),
        children: [],
      };
      if (sub.kind === "letter" && items.length) items[items.length - 1].children.push(view);
      else items.push(view);
    }
    return { lead: annotateText(lead, source, source.glossary), items };
  }

  // ---------------------------------------------------------- navigation

  function onQueryInput() {
    openClauseId = null;
    openChapter = null;
    trail = [];
    termPopover = null;
  }

  function clearQuery() {
    query = "";
    openClauseId = null;
  }

  function openClause(id: string, fromClause = false) {
    trail = fromClause && openClauseId ? [...trail, openClauseId] : [];
    openClauseId = id;
    termPopover = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backFromClause() {
    if (trail.length) {
      openClauseId = trail[trail.length - 1];
      trail = trail.slice(0, -1);
      return;
    }
    openClauseId = null;
  }

  function openRef(ref: PprRef) {
    if (!manifest) return;
    if (ref.kind === "chapter") {
      openClauseId = null;
      openChapter = ref.number;
      query = "";
      return;
    }
    if (!refResolves(ref, manifest)) return;
    openClause(provisionId(manifest, ref.kind, ref.number), true);
  }

  function toggleChapter(number: number) {
    query = "";
    openClauseId = null;
    termPopover = null;
    openChapter = openChapter === number ? null : number;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function home() {
    query = "";
    openChapter = null;
    openClauseId = null;
    trail = [];
    viewer = null;
  }

  function openPdf(page: number, pdfQuery = "") {
    viewer = { page, query: pdfQuery };
  }

  // -------------------------------------------------------------- extras

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      copied = key;
      window.setTimeout(() => {
        if (copied === key) copied = null;
      }, 1600);
    } catch {
      // Clipboard blocked (insecure context, denied permission): leave it be.
    }
  }

  function showTerm(event: MouseEvent, term: PprGlossaryTerm) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const width = 288;
    const x = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    termPopover = { term, x, y: rect.bottom + 8 };
  }

  /** The clause runs are rendered by ClauseText, which reports what was clicked. */
  function onRefClick(event: CustomEvent<PprRef>) {
    openRef(event.detail);
  }

  function onTermClick(event: CustomEvent<{ event: MouseEvent; term: PprGlossaryTerm }>) {
    showTerm(event.detail.event, event.detail.term);
  }

  /** Jump from the definition popover to the rule the term is defined in. */
  function openTermSource() {
    if (!termPopover || !manifest) return;
    const { kind, number } = termPopover.term.source;
    openClause(provisionId(manifest, kind, number), true);
  }

  /** Keep the URL in step while the reader pages through the gazette. */
  function onViewerPage(event: CustomEvent<number>) {
    if (viewer) viewer = { ...viewer, page: event.detail };
  }

  $: clauseBody =
    clause && manifest ? clauseBodyOf(clause, manifest) : { lead: [], items: [] };
  $: clauseCitation = clause && manifest ? citation(clause, manifest, lang) : "";
  $: clausePermalink =
    clause && typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?clause=${clauseParam(clause.kind, clause.number)}`
      : "";
  $: relatedRefs = clause ? clause.refs.filter((ref) => ref.kind !== "chapter") : [];
  $: relatedChapters = clause ? clause.refs.filter((ref) => ref.kind === "chapter") : [];
  $: termsInSource =
    clause && manifest
      ? manifest.glossary.filter(
          (term) => term.source.kind === clause.kind && term.source.number === clause.number,
        )
      : [];
</script>

{#if loading}
  <div class="flex flex-col items-center justify-center py-24 gap-4">
    <div
      class="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-white/10 border-t-primary-start animate-spin"
    ></div>
    <p class="text-slate-500 dark:text-silver">{lang === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
  </div>
{:else if error}
  <div class="max-w-md mx-auto text-center py-24">
    <p class="text-lg font-bold text-rose-600 dark:text-rose-400 mb-3">
      {lang === "bn" ? "তথ্য লোড করা যায়নি।" : "Could not load the data."}
    </p>
    <p class="text-sm text-slate-500 dark:text-silver mb-6 break-words">{error}</p>
    <button
      type="button"
      on:click={load}
      class="px-6 py-2.5 rounded-full bg-primary-start text-white font-bold hover:bg-primary-end transition-colors"
    >
      {lang === "bn" ? "আবার চেষ্টা করুন" : "Retry"}
    </button>
  </div>
{:else if manifest}
  <!-- Toolbar: what this is, the search box, and the source gazette -->
  <div class="flex flex-col gap-4 mb-8">
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        on:click={home}
        class="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      >
        {lang === "bn" ? manifest.title : manifest.titleEn}
      </button>
      <span class="text-sm text-slate-500 dark:text-silver">
        {localize(manifest.counts.rules)} {lang === "bn" ? "বিধি" : "rules"} ·
        {localize(manifest.counts.schedules)} {lang === "bn" ? "তফসিল" : "schedules"}
      </span>
      {#if offline}
        <span
          class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
        >
          {lang === "bn" ? "সংরক্ষিত কপি থেকে" : "from the saved copy"}
        </span>
      {/if}
      <a
        href={PPR_PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-primary-mid hover:text-primary-mid transition-colors"
      >
        📄 {lang === "bn" ? "মূল বিধিমালা (পিডিএফ)" : "Full gazette (PDF)"}
      </a>
    </div>

    <div class="relative">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">🔍</span>
      <input
        bind:value={query}
        on:input={onQueryInput}
        placeholder={lang === "bn"
          ? "বিধি, বিষয় বা সংক্ষিপ্ত রূপ — যেমন OTM, কোটেশন, ৪২"
          : "Rule, subject or acronym — e.g. OTM, quotation, 42"}
        class="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white dark:bg-[var(--glass-bg)] border border-slate-200 dark:border-[var(--glass-border)] text-slate-800 dark:text-slate-100 outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20"
        aria-label={lang === "bn" ? "বিধিমালায় খুঁজুন" : "Search the rules"}
      />
      {#if query}
        <button
          type="button"
          on:click={clearQuery}
          aria-label={lang === "bn" ? "খোঁজ মুছুন" : "Clear search"}
          class="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          ✕
        </button>
      {/if}
    </div>
  </div>

  {#if clause}
    <!-- Clause detail: the clause itself, then how to cite and follow it -->
    <div style={`--accent: ${hue(clause.chapter ?? 1)} 85% 55%`}>
      <button
        type="button"
        on:click={backFromClause}
        class="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-silver hover:text-primary-mid transition-colors"
      >
        <span aria-hidden="true">←</span>
        {trail.length
          ? lang === "bn"
            ? "পূর্বের বিধি"
            : "Previous rule"
          : query.trim()
            ? lang === "bn"
              ? "অনুসন্ধান ফলাফল"
              : "Search results"
            : lang === "bn"
              ? "ফিরে যান"
              : "Back"}
      </button>

      <div class="flex items-start gap-3 mb-3">
        <span
          class="shrink-0 w-14 h-14 rounded-2xl bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-display text-xl font-bold flex items-center justify-center text-center leading-none px-1"
        >
          {localize(clause.number)}
        </span>
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
            {provisionLabel(clause, lang)}
            {#if clause.chapter}· {chapterLabel(clause.chapter)}{/if}
          </p>
          <h2 class="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {clause.title}
          </h2>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-6 text-xs">
        <span class="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
          {lang === "bn" ? "গেজেট পৃষ্ঠা" : "gazette page"} {localize(clause.page)}
        </span>
        <span class="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
          {localize(clause.subRuleCount)} {lang === "bn" ? "উপ-বিধি" : "sub-rules"}
        </span>
        <button
          type="button"
          on:click={() => openPdf(clause.pdfPage + 1)}
          class="px-2.5 py-1 rounded-full bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))] font-semibold hover:bg-[hsl(var(--accent)/0.2)] transition-colors"
        >
          📖 {lang === "bn" ? "মূল পিডিএফের পৃষ্ঠা দেখুন" : "Open the gazette page"}
        </button>
      </div>

      <div
        class="rounded-3xl bg-white dark:bg-[var(--glass-bg)] border border-slate-200 dark:border-[var(--glass-border)] p-5 sm:p-7 mb-5"
      >
        {#if clauseBody.lead.length}
          <p
            class="text-[16px] leading-[1.9] text-slate-700 dark:text-slate-200 {clauseBody.items
              .length
              ? 'mb-6'
              : ''}"
          >
            <ClauseText
              tokens={clauseBody.lead}
              {manifest}
              {lang}
              on:ref={onRefClick}
              on:term={onTermClick}
            />
          </p>
        {/if}

        {#if clauseBody.items.length}
          <ol class="space-y-5">
            {#each clauseBody.items as item (item.key)}
              <li class="flex items-start gap-3.5">
                <span
                  class="shrink-0 mt-0.5 min-w-8 h-8 px-1.5 rounded-xl bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))] text-sm font-bold flex items-center justify-center"
                >
                  {localize(item.label)}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-[16px] leading-[1.9] text-slate-700 dark:text-slate-200">
                    <ClauseText
                      tokens={item.tokens}
                      {manifest}
                      {lang}
                      on:ref={onRefClick}
                      on:term={onTermClick}
                    />
                  </p>

                  {#if item.children.length}
                    <ul
                      class="mt-3 space-y-3 border-l-2 border-slate-100 dark:border-white/10 pl-4"
                    >
                      {#each item.children as child (child.key)}
                        <li class="flex items-start gap-3">
                          <span
                            class="shrink-0 mt-0.5 min-w-7 h-7 px-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-silver text-xs font-bold flex items-center justify-center"
                          >
                            {child.label}
                          </span>
                          <p
                            class="min-w-0 flex-1 text-[15px] leading-[1.85] text-slate-600 dark:text-slate-300"
                          >
                            <ClauseText
                              tokens={child.tokens}
                              {manifest}
                              {lang}
                              on:ref={onRefClick}
                              on:term={onTermClick}
                            />
                          </p>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              </li>
            {/each}
          </ol>
        {/if}
      </div>

      <!-- How to cite it, and where it goes in the gazette -->
      <div
        class="rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-[var(--glass-border)] p-5 mb-5"
      >
        <p class="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          {lang === "bn" ? "উদ্ধৃতি" : "Citation"}
        </p>
        <p class="text-sm text-slate-700 dark:text-slate-200 mb-4 select-all">{clauseCitation}</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            on:click={() => copy(clauseCitation, "citation")}
            class="px-4 py-2 rounded-full text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
          >
            {copied === "citation"
              ? lang === "bn"
                ? "✓ কপি হয়েছে"
                : "✓ Copied"
              : lang === "bn"
                ? "উদ্ধৃতি কপি করুন"
                : "Copy as citation"}
          </button>
          <button
            type="button"
            on:click={() => copy(clausePermalink, "link")}
            class="px-4 py-2 rounded-full text-sm font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
          >
            {copied === "link"
              ? lang === "bn"
                ? "✓ লিংক কপি হয়েছে"
                : "✓ Link copied"
              : lang === "bn"
                ? "স্থায়ী লিংক"
                : "Permalink"}
          </button>
          <button
            type="button"
            on:click={() => openPdf(clause.pdfPage + 1)}
            class="px-4 py-2 rounded-full text-sm font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
          >
            {lang === "bn" ? "পিডিএফ পৃষ্ঠা" : "PDF page"} {localize(clause.page)}
          </button>
        </div>
      </div>

      {#if relatedRefs.length || relatedChapters.length || clause.refsBy.length}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {#if relatedRefs.length || relatedChapters.length}
            <div
              class="rounded-3xl border border-slate-200 dark:border-[var(--glass-border)] p-5"
            >
              <p class="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                {lang === "bn" ? "যেসব বিধি নির্দেশ করে" : "Refers to"}
              </p>
              <div class="flex flex-wrap gap-2">
                {#each [...relatedRefs, ...relatedChapters] as ref (ref.kind + ref.number)}
                  <button
                    type="button"
                    disabled={!refResolves(ref, manifest)}
                    on:click={() => openRef(ref)}
                    class="px-3 py-1.5 rounded-full text-sm font-semibold bg-primary-mid/10 text-primary-mid hover:bg-primary-mid/20 disabled:opacity-50 disabled:cursor-default transition-colors"
                  >
                    {refLabel(ref, lang)}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          {#if clause.refsBy.length}
            <div
              class="rounded-3xl border border-slate-200 dark:border-[var(--glass-border)] p-5"
            >
              <p class="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                {lang === "bn" ? "যেখানে এই বিধি টানা হয়েছে" : "Cited by"}
              </p>
              <div class="flex flex-wrap gap-2">
                {#each clause.refsBy as ref (ref.id)}
                  <button
                    type="button"
                    on:click={() => ref.id && openClause(ref.id, true)}
                    class="px-3 py-1.5 rounded-full text-sm font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-300 hover:bg-violet-500/20 transition-colors"
                  >
                    {refLabel(ref, lang)}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      {#if termsInSource.length}
        <div class="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p class="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-3">
            {lang === "bn" ? "এই বিধির সংজ্ঞার্থ" : "Terms defined here"}
          </p>
          <dl class="space-y-2">
            {#each termsInSource as term (term.id)}
              <div>
                <dt class="text-sm font-bold text-slate-800 dark:text-slate-100">{term.term}</dt>
                <dd class="text-sm text-slate-600 dark:text-slate-300">{term.definition}</dd>
              </div>
            {/each}
          </dl>
        </div>
      {/if}
    </div>
  {:else if chapter}
    <!-- Chapter detail: parts and rules -->
    <div style={`--accent: ${hue(chapter.number)} 85% 55%`}>
      <button
        type="button"
        on:click={() => (openChapter = null)}
        class="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-silver hover:text-primary-mid transition-colors"
      >
        <span aria-hidden="true">←</span>{lang === "bn" ? "সব অধ্যায়" : "All chapters"}
      </button>

      <div class="flex items-center gap-3 mb-2">
        <span
          class="w-12 h-12 rounded-2xl bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-display text-2xl font-bold flex items-center justify-center"
        >
          {localize(chapter.number)}
        </span>
        <h2 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          {chapterLabel(chapter)}
        </h2>
      </div>
      <p class="text-sm text-slate-500 dark:text-silver mb-8">
        {lang === "bn" ? "বিধি" : "Rules"} {localize(chapter.ruleRange[0])}–{localize(chapter.ruleRange[1])}
        · {lang === "bn" ? "গেজেট পৃষ্ঠা" : "gazette page"} {localize(chapter.page)}
        <button
          type="button"
          on:click={() => openPdf(chapter.pdfPage + 1)}
          class="ml-2 font-bold text-[hsl(var(--accent))] underline decoration-dotted"
        >
          {lang === "bn" ? "পিডিএফ দেখুন" : "view PDF"}
        </button>
      </p>

      {#each ruleGroups as group}
        {#if group.title}
          <div class="flex items-center gap-3 mt-8 mb-3">
            <span
              class="px-3 py-1 rounded-full text-xs font-bold bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]"
            >
              {lang === "bn" ? "অংশ" : "Part"} {localize(group.label ?? "")}
            </span>
            <span class="text-sm font-semibold text-slate-600 dark:text-silver">{group.title}</span>
          </div>
        {/if}
        <div
          class="rounded-2xl overflow-hidden border border-slate-200 dark:border-[var(--glass-border)] divide-y divide-slate-100 dark:divide-white/5"
        >
          {#each group.rules as rule, rowIndex (rule.id)}
            <div class={ROW_TINTS[rowIndex % ROW_TINTS.length]}>
              <button
                type="button"
                on:click={() => openClause(rule.id)}
                class="w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <span class="shrink-0 w-24 font-bold text-slate-500 dark:text-silver">
                  {lang === "bn" ? "বিধি" : "Rule"} {localize(rule.number)}
                </span>
                <span class="flex-1 font-semibold text-slate-800 dark:text-slate-100">
                  {rule.title}
                </span>
                <span class="shrink-0 hidden sm:inline text-xs text-slate-400 mt-0.5">
                  {localize(rule.subRuleCount)} {lang === "bn" ? "উপ-বিধি" : "sub-rules"}
                </span>
                <span class="shrink-0 text-xs text-slate-400 mt-0.5">
                  {lang === "bn" ? "পৃষ্ঠা" : "p."} {localize(rule.page)}
                </span>
              </button>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else if query.trim()}
    <!-- Results: a direct hit first, then everything grouped by chapter -->
    {#if direct}
      <button
        type="button"
        on:click={() =>
          direct.kind === "chapter"
            ? toggleChapter(direct.number)
            : openClause(provisionId(manifest, direct.kind, direct.number))}
        class="w-full text-left mb-6 p-5 rounded-3xl bg-primary-mid/10 border border-primary-mid/30 hover:bg-primary-mid/15 transition-colors"
      >
        <p class="text-xs font-bold uppercase tracking-wide text-primary-mid mb-1">
          {lang === "bn" ? "সরাসরি যান" : "Jump straight to"}
        </p>
        <p class="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {direct.kind === "chapter"
            ? chapterLabel(direct.number)
            : `${direct.kind === "schedule" ? (lang === "bn" ? "তফসিল" : "Schedule") : lang === "bn" ? "বিধি" : "Rule"} ${localize(direct.number)}`}
        </p>
      </button>
    {/if}

    <p class="text-sm text-slate-500 dark:text-silver mb-6">
      {localize(results.length)} {lang === "bn" ? "টি ফলাফল" : "results"} · “{query.trim()}”
    </p>

    {#if !results.length}
      <div class="text-center py-16">
        <p class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
          {lang === "bn" ? "কিছু পাওয়া যায়নি।" : "Nothing found."}
        </p>
        <p class="text-sm text-slate-500 dark:text-silver">
          {lang === "bn"
            ? "সংক্ষিপ্ত রূপ (যেমন OTM) বা বিষয়ের নাম দিয়ে চেষ্টা করুন।"
            : "Try an acronym (e.g. OTM) or the subject of the rule."}
        </p>
      </div>
    {:else}
      {#each resultGroups as group (group.key)}
        <div class="mb-8" style={`--accent: ${group.hue} 85% 55%`}>
          <div class="flex items-center gap-3 mb-3">
            <span
              class="px-3 py-1 rounded-full text-xs font-bold bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]"
            >
              {group.label}
            </span>
            <span class="text-xs text-slate-400">
              {localize(group.results.length)} {lang === "bn" ? "টি" : "hits"}
            </span>
          </div>
          <div
            class="rounded-2xl overflow-hidden border border-slate-200 dark:border-[var(--glass-border)] divide-y divide-slate-100 dark:divide-white/5"
          >
            {#each group.results as hit, rowIndex (hit.id)}
              <div class={ROW_TINTS[rowIndex % ROW_TINTS.length]}>
                <button
                  type="button"
                  on:click={() => openClause(hit.id)}
                  class="w-full text-left px-4 py-3.5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <div class="flex items-start gap-3">
                    <span class="shrink-0 w-24 font-bold text-slate-500 dark:text-silver">
                      {lang === "bn" ? "বিধি" : "Rule"} {localize(hit.number)}
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-slate-800 dark:text-slate-100">{hit.title}</p>
                      <p class="text-sm text-slate-500 dark:text-silver line-clamp-2 mt-0.5">
                        {hit.snippet}
                      </p>
                    </div>
                    <span class="shrink-0 text-xs text-slate-400 mt-0.5">
                      {lang === "bn" ? "পৃষ্ঠা" : "p."} {localize(hit.page)}
                    </span>
                  </div>
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  {:else}
    <!-- Landing: chapter cards, then the schedules -->
    <h2 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
      {lang === "bn" ? "অধ্যায় অনুযায়ী দেখুন" : "Browse by chapter"}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {#each chapters as entry (entry.number)}
        <button
          type="button"
          on:click={() => toggleChapter(entry.number)}
          style={`--accent: ${hue(entry.number)} 85% 55%`}
          class="group text-left relative flex flex-col p-6 rounded-3xl bg-[hsl(var(--accent)/0.07)] border border-[hsl(var(--accent)/0.25)] hover:-translate-y-1.5 hover:border-[hsl(var(--accent)/0.6)] hover:shadow-[0_12px_30px_hsl(var(--accent)/0.18)] transition-all duration-300"
        >
          <div class="flex items-center gap-3 mb-4">
            <span
              class="w-12 h-12 rounded-2xl bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-display text-2xl font-bold flex items-center justify-center"
            >
              {localize(entry.number)}
            </span>
            <span class="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {chapterLabel(entry)}
            </span>
          </div>
          <p class="text-sm font-semibold text-slate-600 dark:text-silver mb-4">
            {lang === "bn" ? "বিধি" : "Rules"} {localize(entry.ruleRange[0])}–{localize(entry.ruleRange[1])}
          </p>
          <div class="mt-auto flex flex-wrap items-center gap-2 text-xs">
            {#if entry.parts.length}
              <span class="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                {localize(entry.parts.length)} {lang === "bn" ? "অংশ" : "parts"}
              </span>
            {/if}
            <span class="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
              {lang === "bn" ? "পৃষ্ঠা" : "page"} {localize(entry.page)}
            </span>
            {#if entry.headingMissing}
              <span
                class="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold"
              >
                {lang === "bn" ? "শিরোনাম অনুপস্থিত" : "no heading"}
              </span>
            {/if}
          </div>
        </button>
      {/each}
    </div>

    <h2 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-14 mb-6">
      {lang === "bn" ? "তফসিল" : "Schedules"}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each manifest.schedules as schedule (schedule.number)}
        <button
          type="button"
          on:click={() => openClause(provisionId(manifest, "schedule", schedule.number))}
          class="flex items-start gap-3 p-4 text-left rounded-2xl bg-white dark:bg-[var(--glass-bg)] border border-slate-200 dark:border-[var(--glass-border)] hover:border-indigo-400 hover:-translate-y-1 transition-all"
        >
          <span
            class="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold text-sm"
          >
            {lang === "bn" ? "তফসিল" : "Sch."} {localize(schedule.number)}
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate" title={schedule.title}>
              {schedule.title}
            </p>
            <p class="text-xs text-slate-400 mt-1">
              {lang === "bn" ? "পৃষ্ঠা" : "page"} {localize(schedule.page)}
            </p>
          </div>
        </button>
      {/each}
    </div>
    {#each manifest.missingSchedules ?? [] as missing}
      <p
        class="mt-4 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3"
      >
        {lang === "bn"
          ? `চিহ্নিত অনুপস্থিত: ${localize(missing.what)} — এই পৃষ্ঠাগুলো স্ক্যান করা ছবি, টেক্সট লেয়ার নেই।`
          : `Recorded as missing: ${missing.what} — ${missing.note}.`}
      </p>
    {/each}
  {/if}

  {#if termPopover}
    <button
      type="button"
      aria-label={lang === "bn" ? "সংজ্ঞা বন্ধ করুন" : "Close the definition"}
      class="fixed inset-0 z-40 cursor-default"
      on:click={() => (termPopover = null)}
    ></button>
    <div
      class="fixed z-50 w-72 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl"
      style={`left: ${termPopover.x}px; top: ${termPopover.y}px`}
    >
      <p class="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">
        {lang === "bn" ? "সংজ্ঞার্থ" : "Definition"}
      </p>
      <p class="font-bold text-slate-900 dark:text-white mb-1">{termPopover.term.term}</p>
      <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {termPopover.term.definition}
      </p>
      <button
        type="button"
        on:click={openTermSource}
        class="mt-3 text-xs font-bold text-primary-mid underline decoration-dotted"
      >
        {lang === "bn" ? "সংজ্ঞার্থের বিধি দেখুন" : "See the defining rule"}
      </button>
    </div>
  {/if}

  {#if viewer}
    <PdfViewer
      page={viewer.page}
      query={viewer.query}
      {lang}
      pageOffset={manifest.pageOffset}
      on:close={() => (viewer = null)}
      on:page={onViewerPage}
    />
  {/if}
{/if}
