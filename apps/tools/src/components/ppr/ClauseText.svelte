<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { refResolves, type PprTextToken } from "../../lib/ppr/refs";
  import type { PprGlossaryTerm, PprManifest, PprRef } from "../../lib/ppr/search";

  /**
   * One run of annotated clause text: the citations open the provision they name
   * and the glossary terms raise the definition popover. The clause body is laid
   * out as several of these (lead-in, each clause, each lettered sub-clause), so
   * the run lives here rather than being repeated in the reader.
   */
  export let tokens: PprTextToken[];
  export let manifest: PprManifest;
  export let lang: "bn" | "en" = "bn";

  const dispatch = createEventDispatcher<{
    ref: PprRef;
    term: { event: MouseEvent; term: PprGlossaryTerm };
  }>();
</script>

{#each tokens as token}{#if token.ref}<button
      type="button"
      class="font-semibold text-primary-mid underline decoration-dotted underline-offset-2 hover:bg-primary-mid/10 rounded disabled:no-underline disabled:opacity-50"
      disabled={!refResolves(token.ref, manifest)}
      title={refResolves(token.ref, manifest)
        ? undefined
        : lang === "bn"
          ? "এই সংস্করণে অনুপস্থিত"
          : "not in this edition"}
      on:click={() => token.ref && dispatch("ref", token.ref)}
    >{token.text}</button>{:else if token.term}<button
      type="button"
      class="font-semibold text-emerald-600 dark:text-emerald-400 underline decoration-dotted underline-offset-2 hover:bg-emerald-500/10 rounded"
      on:click={(event) => token.term && dispatch("term", { event, term: token.term })}
    >{token.text}</button>{:else}{token.text}{/if}{/each}
