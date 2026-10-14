import { Router, type Request, type Response } from 'express';
import { can, requireUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { Career } from '../career/career.model.js';
import { Enquiry } from '../enquiry/enquiry.model.js';
import { Notice } from '../notice/notice.model.js';
import { Product } from '../product/product.model.js';
import { Task } from '../task/task.model.js';

/** The company works on Nepal time; "today" and the chart's days follow it. */
const TIMEZONE = 'Asia/Kathmandu';
const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 30;

/** Midnight at the start of `date`'s day in Kathmandu, as a UTC instant. */
function startOfDay(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // "2026-10-14"
  // Kathmandu is UTC+05:45 all year (no daylight saving).
  return new Date(`${parts}T00:00:00+05:45`);
}

/** "2026-10-14" for the day `date` falls on in Kathmandu. */
const dayKey = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date,
  );

/** GET /api/dashboard — everything the Dashboard page shows, in one request. */
const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const chartStart = new Date(today.getTime() - (CHART_DAYS - 1) * DAY_MS);
  const previousStart = new Date(chartStart.getTime() - CHART_DAYS * DAY_MS);

  const [
    newEnquiries,
    thisPeriod,
    lastPeriod,
    openTasks,
    dueToday,
    overdue,
    unpublishedProducts,
    unpublishedNotices,
    inactiveRoles,
    perDay,
    recentEnquiries,
    myTasks,
  ] = await Promise.all([
    Enquiry.countDocuments({ status: 'New' }),
    Enquiry.countDocuments({ createdAt: { $gte: chartStart } }),
    Enquiry.countDocuments({ createdAt: { $gte: previousStart, $lt: chartStart } }),
    Task.countDocuments({ done: false }),
    Task.countDocuments({ done: false, dueDate: { $gte: today, $lt: tomorrow } }),
    Task.countDocuments({ done: false, dueDate: { $lt: today } }),
    Product.countDocuments({ published: false }),
    Notice.countDocuments({ published: false }),
    Career.countDocuments({ active: false }),
    Enquiry.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: chartStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIMEZONE } }, count: { $sum: 1 } } },
    ]),
    Enquiry.find().populate('owner', 'name email').sort({ createdAt: -1 }).limit(5),
    Task.find({ done: false, assignee: { $in: [user.id, null] } })
      .populate('assignee', 'name email')
      .sort({ dueDate: 1, createdAt: 1 })
      .limit(20),
  ]);

  const counts = new Map(perDay.map((row) => [row._id, row.count]));
  const volume = Array.from({ length: CHART_DAYS }, (_, index) => {
    const date = new Date(chartStart.getTime() + index * DAY_MS);
    const key = dayKey(date);
    return { date: key, count: counts.get(key) ?? 0 };
  });

  // Tasks without a deadline go after the dated ones.
  myTasks.sort((a, b) => Number(a.dueDate === null) - Number(b.dueDate === null));

  res.json({
    stats: {
      newEnquiries,
      /** Enquiries in the last 30 days against the 30 before, as a whole percentage; null with nothing to compare. */
      enquiryChange: lastPeriod === 0 ? null : Math.round(((thisPeriod - lastPeriod) / lastPeriod) * 100),
      openTasks,
      dueToday,
      overdue,
      awaitingReview: unpublishedProducts + unpublishedNotices + inactiveRoles,
    },
    volume,
    recentEnquiries,
    myTasks: myTasks.slice(0, 5),
  });
});

export const dashboardRouter = Router();

dashboardRouter.get('/', can('dashboard', 'view'), getDashboard);
