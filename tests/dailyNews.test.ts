import { describe, it, expect } from 'vitest';
import { CURATED_NEWS_DATA } from '../src/data/newsData';
import { NewsArticle, NewsCategory } from '../src/types';

describe('Daily News & Senior Digest Engine', () => {
  it('should provide a curated daily digest of top 5–6 stories to prevent overwhelm', () => {
    expect(CURATED_NEWS_DATA.length).toBeGreaterThanOrEqual(5);
    expect(CURATED_NEWS_DATA.length).toBeLessThanOrEqual(8);
  });

  it('should include bilingual content (English and Hindi) for all stories', () => {
    for (const story of CURATED_NEWS_DATA) {
      expect(story.title).toBeTruthy();
      expect(story.titleHi).toBeTruthy();
      expect(story.summary).toBeTruthy();
      expect(story.summaryHi).toBeTruthy();
      expect(story.fullStory).toBeTruthy();
      expect(story.fullStoryHi).toBeTruthy();
      expect(story.source).toBeTruthy();
      expect(story.sourceHi).toBeTruthy();
    }
  });

  it('should have a distinct 1-line senior takeaway for every news item', () => {
    for (const story of CURATED_NEWS_DATA) {
      expect(story.takeaway).toBeTruthy();
      expect(story.takeawayHi).toBeTruthy();
      // Ensure it is concise and actionable for elders
      expect(story.takeaway.length).toBeGreaterThan(15);
      expect(story.takeawayHi.length).toBeGreaterThan(15);
    }
  });

  it('should properly classify stories into senior-relevant categories', () => {
    const validCategories: NewsCategory[] = ['important', 'schemes', 'health', 'local', 'weather'];
    for (const story of CURATED_NEWS_DATA) {
      expect(validCategories).toContain(story.category);
    }
  });

  it('should flag high-priority notices as important alerts for top callout banner', () => {
    const alerts = CURATED_NEWS_DATA.filter((s) => s.isImportantAlert);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    // Specifically verify Jeevan Pramaan or Ayushman senior cover is in the alert set
    const hasPensionOrAyushman = alerts.some(
      (s) => s.title.includes('Jeevan Pramaan') || s.title.includes('Ayushman')
    );
    expect(hasPensionOrAyushman).toBe(true);
  });

  it('should use explicit, comforting date labels instead of confusing relative timestamps', () => {
    for (const story of CURATED_NEWS_DATA) {
      // Must not use confusing 'ago' timestamps
      expect(story.dateLabel).not.toMatch(/\d+h ago/i);
      expect(story.dateLabel).not.toMatch(/\d+m ago/i);
      expect(story.dateLabel).toMatch(/Today|Yesterday/i);
      expect(story.dateLabelHi).toMatch(/आज|कल/i);
    }
  });

  it('should prioritize regional news when filtered by city or region', () => {
    const prioritizeByRegion = (articles: NewsArticle[], region: string) => {
      const copy = [...articles];
      return copy.sort((a, b) => {
        const aMatch = a.region.toLowerCase().includes(region.toLowerCase());
        const bMatch = b.region.toLowerCase().includes(region.toLowerCase());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    };

    const delhiFirst = prioritizeByRegion(CURATED_NEWS_DATA, 'Delhi NCR');
    expect(delhiFirst[0].region).toContain('Delhi NCR');

    const mumbaiFirst = prioritizeByRegion(CURATED_NEWS_DATA, 'Mumbai');
    expect(mumbaiFirst[0].region).toContain('Mumbai');
  });
});
