import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from './site-config';

export interface PageSeo {
  title: string;
  description: string;
  /** In-app path, for example `/components`. */
  path: string;
}

/**
 * Route-specific head metadata for the landing and catalogue pages.
 *
 * Doqs owns the metadata of documentation pages and never replaces a host-authored canonical, so
 * everything written here is reverted when the page is destroyed. Otherwise a client-side
 * navigation from `/` to a documentation page would keep this page's canonical and social tags.
 * Site-wide defaults (site name, type, card type) live statically in `index.html`.
 */
@Injectable({ providedIn: 'root' })
export class PageSeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);

  claim(destroyRef: DestroyRef, seo: PageSeo): void {
    const url = `${SITE_ORIGIN}${seo.path}`;
    this.write(seo.title, seo.description);
    this.meta.updateTag({ property: 'og:url', content: url });
    const link = this.claimCanonical(url);

    destroyRef.onDestroy(() => {
      // A successor page may already have taken the canonical over; only remove our own value.
      if (link?.getAttribute('href') === url) link.remove();
      if (this.meta.getTag('property="og:url"')?.content === url) {
        this.meta.removeTag('property="og:url"');
      }
      if (this.titleService.getTitle() === seo.title) {
        this.write(SITE_NAME, DEFAULT_DESCRIPTION);
      }
    });
  }

  private write(title: string, description: string): void {
    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  private claimCanonical(href: string): HTMLLinkElement | null {
    const head = this.document.head;
    const existing = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (existing && !existing.hasAttribute('data-site-canonical')) return null; // not ours (Doqs)
    const link = existing ?? this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', href);
    link.setAttribute('data-site-canonical', '');
    if (!existing) head.appendChild(link);
    return link;
  }
}
