import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language, OpenSiteModal } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { getSession } from '../../lib/session';
import { community, CalendarEvent } from '../../lib/community';
import { catalog } from '../../lib/catalog';
import { openFilmPreview } from '../../lib/filmPreview';
import { shanghaiDateString, screeningRoundStatus } from '../../lib/scheduleOps';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { BeianLink } from '../../components/layout/Footer';
import {
  X,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  MapPin,
  LoaderCircle,
} from 'lucide-react';

const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const TIMEZONES = [
  { label: 'Asia/Shanghai (中国标准时间)', value: 'Asia/Shanghai', offset: '+08:00' },
  { label: 'Asia/Tokyo (日本标准时间)', value: 'Asia/Tokyo', offset: '+09:00' },
  { label: 'America/New_York (美东时间)', value: 'America/New_York', offset: '-04:00' },
  { label: 'Europe/London (格林威治标准时间)', value: 'Europe/London', offset: '+01:00' },
  { label: 'UTC (世界协调时间)', value: 'UTC', offset: '+00:00' },
];

export type EventTone = 'rose' | 'amber' | 'blue' | 'purple' | 'emerald';

export interface LiveScheduleItem {
  id: string;
  title: string;
  type: 'screening';
  startDate: string;
  endDate: string;
  venue: string;
  theme: string;
  tone: EventTone;
  films: { id: string; title: string; year?: string; image?: string }[];
}

const TONE_STYLES: Record<EventTone, {
  capsule: string;
  dot: string;
  borderAccent: string;
}> = {
  rose: {
    capsule: 'bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] border-[#fecdd3] dark:bg-[#221618] dark:hover:bg-[#2c1b1e] dark:text-[#f4a7b0] dark:border-[#3d2327]',
    dot: 'bg-[#e11d48] dark:bg-[#e06c77]',
    borderAccent: 'border-l-[#e11d48] dark:border-l-[#e06c77]',
  },
  amber: {
    capsule: 'bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] border-[#fde68a] dark:bg-[#201c13] dark:hover:bg-[#2b2518] dark:text-[#f2ce8a] dark:border-[#3b311e]',
    dot: 'bg-[#d97706] dark:bg-[#d9a84e]',
    borderAccent: 'border-l-[#d97706] dark:border-l-[#d9a84e]',
  },
  blue: {
    capsule: 'bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] dark:bg-[#131b26] dark:hover:bg-[#182535] dark:text-[#9bc5ed] dark:border-[#203044]',
    dot: 'bg-[#0284c7] dark:bg-[#5b9bd5]',
    borderAccent: 'border-l-[#0284c7] dark:border-l-[#5b9bd5]',
  },
  purple: {
    capsule: 'bg-[#faf5ff] hover:bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff] dark:bg-[#1d1726] dark:hover:bg-[#271d33] dark:text-[#cdb1ec] dark:border-[#332444]',
    dot: 'bg-[#9333ea] dark:bg-[#a379db]',
    borderAccent: 'border-l-[#9333ea] dark:border-l-[#a379db]',
  },
  emerald: {
    capsule: 'bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] border-[#a7f3d0] dark:bg-[#122018] dark:hover:bg-[#192b21] dark:text-[#9ed3b3] dark:border-[#1f372a]',
    dot: 'bg-[#059669] dark:bg-[#56ab7c]',
    borderAccent: 'border-l-[#059669] dark:border-l-[#56ab7c]',
  },
};

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function toneForDate(date: string, today: string): EventTone {
  const status = screeningRoundStatus(date, today);
  if (status === 'screened') return 'emerald';
  if (status === 'tonight') return 'amber';
  return 'blue';
}

function toSchedule(e: CalendarEvent, today: string): LiveScheduleItem {
  return {
    id: e.id,
    title: e.title,
    type: 'screening',
    startDate: e.date,
    endDate: e.date,
    venue: e.venue || '场地待定',
    theme: e.theme || '',
    tone: toneForDate(e.date, today),
    films: e.films,
  };
}

interface CalendarPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: OpenSiteModal) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const today = useMemo(() => shanghaiDateString(), []);
  const [y0, m0] = today.split('-').map(Number);

  const [currentDate, setCurrentDate] = useState(() => new Date(y0, m0 - 1, 1));
  const [selectedDateStr, setSelectedDateStr] = useState(today);
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [schedules, setSchedules] = useState<LiveScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpedMap, setRsvpedMap] = useState<Record<string, boolean>>({});
  const [rsvpBusy, setRsvpBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    community.calendar()
      .then((body) => {
        if (!alive) return;
        setSchedules((body.events || []).map((e) => toSchedule(e, today)));
      })
      .catch(() => {
        if (alive) setSchedules([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [today]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const result: {
      days: {
        date: Date;
        dateStr: string;
        dayNum: number;
        inMonth: boolean;
      }[];
    }[] = [];
    const cursor = new Date(year, month, 1 - startOffset);
    const totalCells = (startOffset + totalDays) > 35 ? 42 : 35;
    for (let w = 0; w < totalCells / 7; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dObj = new Date(cursor);
        weekDays.push({
          date: dObj,
          dateStr: toDateStr(dObj),
          dayNum: dObj.getDate(),
          inMonth: dObj.getMonth() === month,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push({ days: weekDays });
    }
    return result;
  }, [year, month]);

  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDateStr]);

  const dayPlans = useMemo(
    () => schedules.filter((p) => selectedDateStr >= p.startDate && selectedDateStr <= p.endDate),
    [schedules, selectedDateStr],
  );

  useEffect(() => {
    let alive = true;
    const ids = dayPlans.map((p) => p.id);
    if (!ids.length) {
      setRsvpedMap({});
      return;
    }
    Promise.all(ids.map((id) => community.rsvp(id).catch(() => ({ rsvped: false, count: 0 }))))
      .then((rows) => {
        if (!alive) return;
        const next: Record<string, boolean> = {};
        ids.forEach((id, i) => { next[id] = Boolean(rows[i]?.rsvped); });
        setRsvpedMap(next);
      });
    return () => { alive = false; };
  }, [dayPlans]);

  const selectedDayLabel = useMemo(() => {
    return `${WEEKDAYS_ZH[selectedDateObj.getDay()]} ${selectedDateObj.getDate()}日`;
  }, [selectedDateObj]);

  const monthTitle = useMemo(() => {
    const monthsZh = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return `${monthsZh[month]} ${year}`;
  }, [month, year]);

  const featured = dayPlans[0] || null;

  const handleToggleRsvp = async (eventId: string, title: string) => {
    const user = await getSession();
    if (!user) {
      toastError('请先登录再预约场次');
      navigate('/auth?redirect=/calendar');
      return;
    }
    setRsvpBusy(eventId);
    const joined = Boolean(rsvpedMap[eventId]);
    try {
      if (joined) await community.cancelRsvp(eventId);
      else await community.joinRsvp(eventId);
      setRsvpedMap((prev) => ({ ...prev, [eventId]: !joined }));
      success(joined ? `已取消「${title}」的预约` : `已预约「${title}」`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : '预约失败');
    } finally {
      setRsvpBusy(null);
    }
  };

  const openFilm = useCallback(async (id: string) => {
    const work = await catalog.get(id);
    if (work) openFilmPreview(work);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#fbfbfb] dark:bg-[#000000] text-neutral-900 dark:text-[#e5e5e5] font-sans antialiased flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      <div className="fixed top-5 right-5 sm:top-7 sm:right-7 z-50 flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => navigate('/')}
          className="text-neutral-500 hover:text-black dark:text-[#888888] dark:hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          title="关闭 / 返回首页"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center my-auto w-full py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.99, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[1120px] bg-white dark:bg-[#0e0e0e] border border-[#e5e7eb] dark:border-[#202020] rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/95 overflow-hidden transition-colors duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_280px]">
            <div className="p-7 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-[#e5e7eb] dark:bg-[#d4d4d4] flex items-center justify-center" />
                <p className="text-xs font-semibold text-[#6b7280] dark:text-[#888888] mt-3.5 tracking-wide">
                  放映会档案
                </p>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1 leading-tight tracking-tight">
                  {featured ? featured.title : '场次日历'}
                </h1>
                <div className="mt-4 space-y-2.5 text-xs font-medium text-[#4b5563] dark:text-[#999999]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#737373] shrink-0" />
                    <span>{featured ? featured.startDate : '选择有场次的日子'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#737373] shrink-0" />
                    <span className="truncate">{featured?.venue || '场地随场次变化'}</span>
                  </div>
                  <div className="relative pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                      className="flex items-center gap-1.5 text-[#4b5563] hover:text-black dark:text-[#999999] dark:hover:text-white transition-colors cursor-pointer group"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#737373] group-hover:text-black dark:group-hover:text-black/70 shrink-0" />
                      <span className="truncate max-w-[155px]">{timezone}</span>
                      <ChevronDown className={`w-3 h-3 text-[#6b7280] dark:text-[#737373] group-hover:text-black dark:group-hover:text-white transition-transform ${isTimezoneOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isTimezoneOpen && (
                      <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-white border border-[#e5e7eb] dark:border-[#262626] rounded-xl shadow-2xl py-1 z-30 overflow-hidden">
                        {TIMEZONES.map((tz) => (
                          <button
                            type="button"
                            key={tz.value}
                            onClick={() => {
                              setTimezone(tz.value);
                              setIsTimezoneOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                              timezone === tz.value
                                ? 'bg-neutral-100 dark:bg-white/10 text-black dark:text-white font-bold'
                                : 'text-neutral-600 hover:bg-neutral-50 dark:text-[#888888] dark:hover:bg-white/5 dark:hover:text-white'
                            }`}
                          >
                            <span>{tz.value}</span>
                            <span className="text-[10px] text-neutral-400 dark:text-[#666666]">{tz.offset}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 dark:text-[#666666] leading-relaxed">
                    场次按 Asia/Shanghai 日历日排期，时区仅作对照。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-7 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-neutral-900 dark:text-white tracking-wide">
                  {monthTitle}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="w-6 h-6 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="上个月"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="w-6 h-6 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="下个月"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {WEEKDAYS_ZH.map((day) => (
                  <div key={day} className="text-[11px] font-medium text-neutral-400 dark:text-[#737373] py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 select-none min-w-[500px]">
                {weeks.map((week, wIdx) => {
                  const weekStartStr = week.days[0].dateStr;
                  const weekEndStr = week.days[6].dateStr;
                  const weekEvents = schedules.filter((e) => e.startDate <= weekEndStr && e.endDate >= weekStartStr);

                  return (
                    <div
                      key={wIdx}
                      className="relative rounded-lg border border-[#f3f4f6] dark:border-[#1a1a1a] bg-[#fafafa] dark:bg-[#111111] p-1 min-h-[82px] flex flex-col justify-between transition-colors"
                    >
                      <div className="grid grid-cols-7 gap-1">
                        {week.days.map((day, dIdx) => {
                          const isSelected = day.dateStr === selectedDateStr;
                          return (
                            <button
                              type="button"
                              key={dIdx}
                              onClick={() => setSelectedDateStr(day.dateStr)}
                              className={`h-7 rounded flex items-center justify-center transition-colors cursor-pointer text-left ${
                                !day.inMonth ? 'opacity-30' : 'opacity-100'
                              }`}
                            >
                              {isSelected ? (
                                <div className="w-7 h-7 rounded-md bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex flex-col items-center justify-center shadow-md">
                                  <span className="leading-none">{day.dayNum}</span>
                                  <span className="w-1 h-1 rounded-full bg-white dark:bg-black mt-0.5" />
                                </div>
                              ) : (
                                <span className="text-xs font-medium text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white transition-colors">
                                  {day.dayNum}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-7 gap-x-1 gap-y-1 mt-1 z-10">
                        {weekEvents.map((evt) => {
                          const startColIdx = week.days.findIndex((d) => d.dateStr >= evt.startDate);
                          const resolvedStartCol = startColIdx === -1 ? 0 : startColIdx;
                          let endColIdx = -1;
                          for (let i = week.days.length - 1; i >= 0; i--) {
                            if (week.days[i].dateStr <= evt.endDate) {
                              endColIdx = i;
                              break;
                            }
                          }
                          const resolvedEndCol = endColIdx === -1 ? 6 : endColIdx;
                          const colStart = resolvedStartCol + 1;
                          const colEnd = resolvedEndCol + 2;
                          const isStartInThisWeek = evt.startDate >= weekStartStr;
                          const isEndInThisWeek = evt.endDate <= weekEndStr;
                          const isSelectedDayInEvent = selectedDateStr >= evt.startDate && selectedDateStr <= evt.endDate;
                          const toneStyle = TONE_STYLES[evt.tone] || TONE_STYLES.blue;

                          return (
                            <button
                              type="button"
                              key={evt.id}
                              style={{ gridColumn: `${colStart} / ${colEnd}` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDateStr(evt.startDate >= weekStartStr ? evt.startDate : weekStartStr);
                              }}
                              className={`h-5.5 px-1.5 text-[10px] font-medium rounded border transition-all cursor-pointer flex items-center truncate ${
                                toneStyle.capsule
                              } ${
                                isSelectedDayInEvent ? 'ring-1 ring-black/30 dark:ring-white/40 shadow-xs' : ''
                              } ${!isStartInThisWeek ? 'rounded-l-none border-l-0' : ''} ${
                                !isEndInThisWeek ? 'rounded-r-none border-r-0' : ''
                              }`}
                              title={evt.title}
                            >
                              <span className="truncate flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${toneStyle.dot}`} />
                                <span className="truncate">{evt.title}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-7 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white tracking-wide">
                  {selectedDayLabel}
                </span>
                {loading && <LoaderCircle className="w-4 h-4 animate-spin text-neutral-400" />}
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5 scrollbar-none flex-1">
                {!loading && dayPlans.length === 0 ? (
                  <p className="text-xs text-neutral-400 dark:text-[#737373] py-8 text-center">这一天没有排期。</p>
                ) : (
                  dayPlans.map((plan) => {
                    const isRsvped = Boolean(rsvpedMap[plan.id]);
                    const toneStyle = TONE_STYLES[plan.tone] || TONE_STYLES.blue;
                    const busy = rsvpBusy === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`p-3.5 rounded-lg border border-[#e5e7eb] dark:border-[#222222] bg-white dark:bg-white hover:border-[#d1d5db] dark:hover:border-[#333333] transition-all space-y-2 border-l-2 ${toneStyle.borderAccent}`}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/screenings/${encodeURIComponent(plan.id)}`)}
                          className="text-left w-full cursor-pointer"
                        >
                          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white leading-snug">
                            {plan.title}
                          </h3>
                        </button>
                        <div className="space-y-1 text-[11px] text-[#6b7280] dark:text-[#888888]">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-[#9ca3af] dark:text-[#666666]" />
                            <span className="truncate">{plan.venue}</span>
                          </div>
                        </div>
                        {plan.films.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {plan.films.map((f) => (
                              <button
                                type="button"
                                key={f.id}
                                onClick={() => void openFilm(f.id)}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-black/70 hover:text-black dark:hover:text-white cursor-pointer"
                              >
                                {f.title}
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleToggleRsvp(plan.id, plan.title)}
                          className={`w-full py-1.5 px-2.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                            isRsvped
                              ? 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb] border border-[#e5e7eb] dark:bg-white dark:text-[#cccccc] dark:hover:bg-[#2c2c2c] dark:border-[#333333]'
                              : 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5]'
                          }`}
                        >
                          {isRsvped ? (
                            <>
                              <Check className="w-3 h-3 text-[#059669] dark:text-[#56ab7c]" />
                              <span>已预约 (点击取消)</span>
                            </>
                          ) : (
                            <span>预约席位</span>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="text-center py-4 select-none flex flex-col items-center gap-2">
        <span className="text-xs font-bold text-neutral-400 dark:text-[#737373] tracking-tight">
          放映日历
        </span>
        <BeianLink className="text-xs text-neutral-400 hover:text-black dark:text-[#737373] dark:hover:text-white transition-colors" />
      </div>
    </div>
  );
};
