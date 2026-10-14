import type { HydratedDocument, Model } from 'mongoose';

/** The tabs on the Investors page. */
export const NOTICE_CATEGORIES = ['notice', 'financial-report', 'ipo-update', 'governance'] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

/**
 * A company notice, investor document or news item. One record can appear on
 * the Investors page (its category tab), the home page investor section and
 * the News & Events page.
 */
export interface INotice {
  title: string;
  /** One or two sentences under the title. */
  summary: string;
  /** Label before the date, e.g. "Company notice". */
  type: string;
  date: Date;
  category: NoticeCategory;
  /** What the notice concerns, e.g. "Capital and a proposed IPO". */
  subject: string;
  /** e.g. "Requires confirmation". */
  outcome: string;
  /** Approved PDF; blank shows "PDF unavailable". */
  documentUrl: string;

  /** On the News & Events page. */
  showOnNews: boolean;
  /** Longer headline for the news card; blank uses the title. */
  newsTitle: string;
  /** Text on the news card; blank uses the summary. */
  newsSummary: string;
  /** Background photo of the news card; blank uses the default. */
  image: string;

  /** The notice in the home page investor section (the newest one wins). */
  showOnHome: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NoticeDocument = HydratedDocument<INotice>;
export type NoticeModel = Model<INotice>;
