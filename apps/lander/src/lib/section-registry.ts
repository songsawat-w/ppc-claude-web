import Hero from "@/templates/base/sections/Hero.astro";
import Benefits from "@/templates/base/sections/Benefits.astro";
import FAQ from "@/templates/base/sections/FAQ.astro";
import CTA from "@/templates/base/sections/CTA.astro";

export const SECTION_REGISTRY: Record<string, any> = {
  hero: Hero,
  benefits: Benefits,
  faq: FAQ,
  cta: CTA,
};
