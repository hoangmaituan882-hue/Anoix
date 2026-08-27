import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { getSession } from '../../lib/session';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import {
  X,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  MapPin,
  Calendar as CalendarIcon,
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
  type: 'live' | 'screening' | 'talk' | 'marathon';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  time: string;
  host: string;
  venue: string;
  theme: string;
  description: string;
  tone: EventTone;
  films: { id: string; title: string; year?: string }[];
}

const SCHEDULES_DATA: LiveScheduleItem[] = [
  {
    id: 'plan-15th-marathon',
    title: 'TRIGGER 15周年连映狂欢',
    type: 'marathon',
    startDate: '2026-08-26',
    endDate: '2026-08-28',
    time: '20:00 - 23:30',
    host: 'Nachiketa Tiwari · 放映组',
    venue: 'Google Meet & 官方直播间',
    theme: '历代名作精选三日连映同好会',
    description: '庆祝株式会社 TRIGGER 设立 15 周年！《斩服少女》、《小魔女学园》、《普罗米亚》超清重制连续三天通宵放映。',
    tone: 'rose',
    films: [
      { id: 'kill-la-kill', title: '斩服少女', year: '2013' },
      { id: 'little-witch-academia', title: '小魔女学园', year: '2017' },
      { id: 'promare', title: '普罗米亚', year: '2019' },
    ],
  },
  {
    id: 'plan-secret-meeting',
    title: 'Secret Meeting · 《迷宫饭 S2》首映',
    type: 'live',
    startDate: '2026-08-26',
    endDate: '2026-08-26',
    time: '20:30 - 22:00',
    host: 'Nachiketa Tiwari',
    venue: 'Google Meet',
    theme: '第二季魔物料理制作前瞻交流',
    description: '新季前瞻同好交流！宫岛善博监督第二季制作幕后拆解与第一季高光片段重温。',
    tone: 'amber',
    films: [
      { id: 'dungeon-meshi-s2', title: '迷宫饭 第二季', year: '2026' },
    ],
  },
  {
    id: 'plan-gridman-universe',
    title: '《古立特宇宙》杜比全景声特设放映',
    type: 'screening',
    startDate: '2026-08-28',
    endDate: '2026-08-30',
    time: '19:30 - 22:00',
    host: 'TRIGGER 官方影院组',
    venue: 'TOHO 影院 · 杜比巨幕厅',
    theme: '雨宫哲监督名作周末马拉松',
    description: '大银幕激光巨幕呈现！沉浸式体验古立特与戴纳泽农两界交汇的终极激战。',
    tone: 'blue',
    films: [
      { id: 'gridman-universe', title: '古立特宇宙', year: '2023' },
    ],
  },
  {
    id: 'plan-cper2-deep-dive',
    title: '《赛博朋克：边缘行者 2》解密直播',
    type: 'talk',
    startDate: '2026-08-31',
    endDate: '2026-09-02',
    time: '21:00 - 22:30',
    host: '五十岚海监督 & 特邀嘉宾',
    venue: 'Bilibili 官方直播间',
    theme: '夜之城新篇章世界观解构',
    description: '全球独家新 PV 帧析与全新主角团角色设定深度探讨。',
    tone: 'purple',
    films: [
      { id: 'cyberpunk-edgerunners-2', title: '赛博朋克：边缘行者 2', year: 'FALL 2026' },
    ],
  },
  {
    id: 'plan-new-panty-stocking',
    title: '《新吊带袜天使》爆音狂欢夜',
    type: 'screening',
    startDate: '2026-09-04',
    endDate: '2026-09-05',
    time: '20:00 - 23:00',
    host: '今石洋之粉丝应援会',
    venue: 'TOHO 影院特设厅',
    theme: '堕天市不良天使全面复活狂欢',
    description: '今石洋之 × 锦织敦史 × 中岛一基原班人马回归先行试映交流。',
    tone: 'rose',
    films: [
      { id: 'new-panty-and-stocking', title: '新吊带袜天使', year: '2025-2026' },
    ],
  },
  {
    id: 'plan-yoshinari-workshop',
    title: 'TRIGGER 原画与分镜鉴赏工坊',
    type: 'live',
    startDate: '2026-09-08',
    endDate: '2026-09-10',
    time: '20:00 - 21:30',
    host: '吉成曜特邀主持',
    venue: 'Google Meet 线上工坊',
    theme: '动态形变作画与分镜节奏解析',
    description: '针对 TRIGGER 经典分镜、特效爆炸作画及动作张力的深度视听拆解。',
    tone: 'emerald',
    films: [
      { id: 'little-witch-academia', title: '小魔女学园', year: '2017' },
    ],
  },
];

const DEFAULT_SLOTS = [
  '20:30',
  '20:45',
  '21:00',
  '21:15',
  '21:30',
  '21:45',
  '22:00',
  '22:15',
  '22:30',
  '22:45',
];

interface CalendarPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Muted, low-saturation tone presets supporting both Light and Dark modes
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

export const CalendarPage: React.FC<CalendarPageProps> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // Current view cursor (August 2026)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1));
  const [selectedDateStr, setSelectedDateStr] = useState('2026-08-26'); // Aug 26, 2026

  // Options & Form states
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>('24');
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);

  // Booking Modal
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeeNote, setAttendeeNote] = useState('');

  // RSVPs state
  const [rsvpedMap, setRsvpedMap] = useState<Record<string, boolean>>({
    'plan-secret-meeting': true,
  });

  // Autofill logged-in user
  useEffect(() => {
    let alive = true;
    getSession().then((user) => {
      if (!alive || !user) return;
      if (user.name || user.username) setAttendeeName(user.name || user.username || '');
      if (user.email) setAttendeeEmail(user.email);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Generate week-by-week calendar structure
  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay(); // 0 is Sunday
    const totalDays = lastDay.getDate();

    const result: {
      days: {
        date: Date;
        dateStr: string;
        dayNum: number;
        inMonth: boolean;
        isSunday: boolean;
      }[];
    }[] = [];

    let currentDayIter = new Date(year, month, 1 - startOffset);
    const totalCells = (startOffset + totalDays) > 35 ? 42 : 35;

    for (let w = 0; w < totalCells / 7; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dObj = new Date(currentDayIter);
        weekDays.push({
          date: dObj,
          dateStr: toDateStr(dObj),
          dayNum: dObj.getDate(),
          inMonth: dObj.getMonth() === month,
          isSunday: d === 0,
        });
        currentDayIter.setDate(currentDayIter.getDate() + 1);
      }
      result.push({ days: weekDays });
    }

    return result;
  }, [year, month]);

  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDateStr]);

  // Selected day's active plans
  const dayPlans = useMemo(() => {
    return SCHEDULES_DATA.filter((p) => {
      return selectedDateStr >= p.startDate && selectedDateStr <= p.endDate;
    });
  }, [selectedDateStr]);

  const selectedDayLabel = useMemo(() => {
    const dayOfWeek = selectedDateObj.getDay();
    const dayNum = selectedDateObj.getDate();
    const weekName = WEEKDAYS_ZH[dayOfWeek];
    return `${weekName} ${dayNum}日`;
  }, [selectedDateObj]);

  const monthTitle = useMemo(() => {
    const monthsZh = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return `${monthsZh[month]} ${year}`;
  }, [month, year]);

  const formatTime = (slot: string) => {
    if (timeFormat === '24') return slot;
    const parts = slot.split(' - ');
    const convertOne = (s: string) => {
      const [hStr, mStr] = s.split(':');
      if (!hStr || !mStr) return s;
      let h = parseInt(hStr, 10);
      const suffix = h >= 12 ? 'pm' : 'am';
      h = h % 12 || 12;
      return `${h}:${mStr}${suffix}`;
    };
    if (parts.length === 2) {
      return `${convertOne(parts[0])} - ${convertOne(parts[1])}`;
    }
    return convertOne(slot);
  };

  const handleToggleRsvp = (eventId: string, title: string) => {
    setRsvpedMap((prev) => {
      const next = { ...prev, [eventId]: !prev[eventId] };
      if (next[eventId]) {
        success(`已预约「${title}」`);
      } else {
        success(`已取消「${title}」的预约`);
      }
      return next;
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingSlot) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setBookingConfirmed(true);
      success(`已成功预约 ${selectedDateStr} ${bookingSlot} 的同好会交流时段！`);
    } catch {
      toastError('预约失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fbfbfb] dark:bg-[#000000] text-neutral-900 dark:text-[#e5e5e5] font-sans antialiased flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      {/* Top Controls: Theme Toggle & Close Button */}
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

      {/* Main Centered Flat Card */}
      <div className="flex-1 flex items-center justify-center my-auto w-full py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.99, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[1120px] bg-white dark:bg-[#0e0e0e] border border-[#e5e7eb] dark:border-[#202020] rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/95 overflow-hidden transition-colors duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_280px]">
            {/* ================= LEFT COLUMN: Host & Meta ================= */}
            <div className="p-7 flex flex-col justify-between">
              <div>
                {/* Clean Solid Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#e5e7eb] dark:bg-[#d4d4d4] flex items-center justify-center" />

                {/* Subdued Host Name */}
                <p className="text-xs font-semibold text-[#6b7280] dark:text-[#888888] mt-3.5 tracking-wide">
                  Nachiketa Tiwari
                </p>

                {/* Clean Title */}
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1 leading-tight tracking-tight">
                  Secret Meeting
                </h1>

                {/* Meta List in Minimal Neutral Grays */}
                <div className="mt-4 space-y-2.5 text-xs font-medium text-[#4b5563] dark:text-[#999999]">
                  {/* Duration */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#737373] shrink-0" />
                    <span>15分钟</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" fill="#00AC47" />
                        <path d="M15 11.5V8.5a1.5 1.5 0 00-1.5-1.5h-7A1.5 1.5 0 005 8.5v7A1.5 1.5 0 006.5 17h7a1.5 1.5 0 001.5-1.5v-3l4 3v-7l-4 3z" fill="#4285F4" />
                      </svg>
                    </div>
                    <span>Google Meet</span>
                  </div>

                  {/* Timezone Dropdown */}
                  <div className="relative pt-0.5">
                    <button
                      onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                      className="flex items-center gap-1.5 text-[#4b5563] hover:text-black dark:text-[#999999] dark:hover:text-white transition-colors cursor-pointer group"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#737373] group-hover:text-black dark:group-hover:text-white/70 shrink-0" />
                      <span className="truncate max-w-[155px]">{timezone}</span>
                      <ChevronDown className={`w-3 h-3 text-[#6b7280] dark:text-[#737373] group-hover:text-black dark:group-hover:text-white transition-transform ${isTimezoneOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTimezoneOpen && (
                      <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#141414] border border-[#e5e7eb] dark:border-[#262626] rounded-xl shadow-2xl py-1 z-30 overflow-hidden">
                        {TIMEZONES.map((tz) => (
                          <button
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
                </div>
              </div>
            </div>

            {/* ================= MIDDLE COLUMN: Enlarged Flat Calendar Grid ================= */}
            <div className="p-7 overflow-x-auto">
              {/* Header: Month title & Nav */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-neutral-900 dark:text-white tracking-wide">
                  {monthTitle}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="w-6 h-6 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="上个月"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="w-6 h-6 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="下个月"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday Row */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {WEEKDAYS_ZH.map((day) => (
                  <div
                    key={day}
                    className="text-[11px] font-medium text-neutral-400 dark:text-[#737373] py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Weekly Grid Rows with Multi-Day Spanning Event Bars */}
              <div className="space-y-1.5 select-none min-w-[500px]">
                {weeks.map((week, wIdx) => {
                  const weekStartStr = week.days[0].dateStr;
                  const weekEndStr = week.days[6].dateStr;

                  // Find events overlapping with this week
                  const weekEvents = SCHEDULES_DATA.filter((e) => {
                    return e.startDate <= weekEndStr && e.endDate >= weekStartStr;
                  });

                  return (
                    <div
                      key={wIdx}
                      className="relative rounded-lg border border-[#f3f4f6] dark:border-[#1a1a1a] bg-[#fafafa] dark:bg-[#111111] p-1 min-h-[82px] flex flex-col justify-between transition-colors"
                    >
                      {/* Day Number Row */}
                      <div className="grid grid-cols-7 gap-1">
                        {week.days.map((day, dIdx) => {
                          const isSelected = day.dateStr === selectedDateStr;
                          const isSep1 = day.date.getMonth() === 8 && day.dayNum === 1;

                          return (
                            <button
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
                                <div className="flex items-center gap-0.5">
                                  <span className="text-xs font-medium text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white transition-colors">
                                    {day.dayNum}
                                  </span>
                                  {isSep1 && (
                                    <span className="text-[8px] font-semibold text-neutral-500 dark:text-[#888888] ml-0.5">
                                      9月
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Event Capsule Bars Layer */}
                      <div className="grid grid-cols-7 gap-x-1 gap-y-1 mt-1 z-10">
                        {weekEvents.map((evt) => {
                          const startColIdx = week.days.findIndex(
                            (d) => d.dateStr >= evt.startDate
                          );
                          const resolvedStartCol = startColIdx === -1 ? 0 : startColIdx;

                          const endColIdx = week.days.findLastIndex(
                            (d) => d.dateStr <= evt.endDate
                          );
                          const resolvedEndCol = endColIdx === -1 ? 6 : endColIdx;

                          const colStart = resolvedStartCol + 1;
                          const colEnd = resolvedEndCol + 2;

                          const isStartInThisWeek = evt.startDate >= weekStartStr;
                          const isEndInThisWeek = evt.endDate <= weekEndStr;
                          const isSelectedDayInEvent =
                            selectedDateStr >= evt.startDate &&
                            selectedDateStr <= evt.endDate;

                          const toneStyle = TONE_STYLES[evt.tone] || TONE_STYLES.rose;

                          return (
                            <button
                              key={evt.id}
                              style={{
                                gridColumn: `${colStart} / ${colEnd}`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDateStr(
                                  evt.startDate >= weekStartStr ? evt.startDate : weekStartStr
                                );
                              }}
                              className={`h-5.5 px-1.5 text-[10px] font-medium rounded border transition-all cursor-pointer flex items-center justify-between truncate ${
                                toneStyle.capsule
                              } ${
                                isSelectedDayInEvent
                                  ? 'ring-1 ring-black/30 dark:ring-white/40 shadow-xs'
                                  : ''
                              } ${!isStartInThisWeek ? 'rounded-l-none border-l-0' : ''} ${
                                !isEndInThisWeek ? 'rounded-r-none border-r-0' : ''
                              }`}
                              title={`${evt.title} (${evt.startDate} ~ ${evt.endDate})`}
                            >
                              <span className="truncate flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${toneStyle.dot}`} />
                                <span className="truncate">{evt.title}</span>
                              </span>
                              {colEnd - colStart > 1 && (
                                <span className="text-[9px] opacity-70 shrink-0 ml-1">
                                  {evt.time.split(' - ')[0]}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= RIGHT COLUMN: Selected Day's Plan & Slot Details ================= */}
            <div className="p-7 flex flex-col">
              {/* Header: Selected Date & 12h/24h toggle */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white tracking-wide">
                  {selectedDayLabel}
                </span>

                {/* 12h / 24h Toggle Capsule */}
                <div className="bg-[#f3f4f6] dark:bg-[#181818] rounded-md p-0.5 flex items-center border border-[#e5e7eb] dark:border-[#282828]">
                  <button
                    onClick={() => setTimeFormat('12')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                      timeFormat === '12'
                        ? 'bg-white text-black shadow-xs dark:bg-[#262626] dark:text-white'
                        : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                    }`}
                  >
                    12 小时
                  </button>
                  <button
                    onClick={() => setTimeFormat('24')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                      timeFormat === '24'
                        ? 'bg-white text-black shadow-xs dark:bg-[#262626] dark:text-white'
                        : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                    }`}
                  >
                    24 小时
                  </button>
                </div>
              </div>

              {/* Day's Event Plans or Slot List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5 scrollbar-none flex-1">
                {dayPlans.length > 0 ? (
                  dayPlans.map((plan) => {
                    const isRsvped = Boolean(rsvpedMap[plan.id]);
                    const toneStyle = TONE_STYLES[plan.tone] || TONE_STYLES.rose;

                    return (
                      <div
                        key={plan.id}
                        className={`p-3.5 rounded-lg border border-[#e5e7eb] dark:border-[#222222] bg-white dark:bg-[#141414] hover:border-[#d1d5db] dark:hover:border-[#333333] transition-all space-y-2 border-l-2 ${toneStyle.borderAccent}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white leading-snug">
                            {plan.title}
                          </h3>
                        </div>

                        <div className="space-y-1 text-[11px] text-[#6b7280] dark:text-[#888888]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#9ca3af] dark:text-[#666666]" />
                            <span>{formatTime(plan.time)}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-[#9ca3af] dark:text-[#666666]" />
                            <span className="truncate">{plan.venue}</span>
                          </div>
                        </div>

                        {/* Flat RSVP Button */}
                        <div className="pt-1">
                          <button
                            onClick={() => handleToggleRsvp(plan.id, plan.title)}
                            className={`w-full py-1.5 px-2.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                              isRsvped
                                ? 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb] border border-[#e5e7eb] dark:bg-[#222222] dark:text-[#cccccc] dark:hover:bg-[#2c2c2c] dark:border-[#333333]'
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
                      </div>
                    );
                  })
                ) : (
                  /* Standard Time Slot Buttons List */
                  DEFAULT_SLOTS.map((slot) => {
                    const isSelected = bookingSlot === slot;
                    const displayTime = formatTime(slot);

                    return (
                      <button
                        key={slot}
                        onClick={() => setBookingSlot(slot)}
                        className={`w-full py-2.5 px-3 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                            : 'border-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f3f4f6] text-neutral-700 dark:border-[#262626] dark:bg-[#141414] dark:hover:bg-[#202020] dark:hover:border-white/40 dark:text-[#d4d4d4]'
                        }`}
                      >
                        {displayTime}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Booking Form / Confirmation Modal */}
      <AnimatePresence>
        {bookingSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setBookingSlot(null)}
          >
            <motion.div
              initial={{ scale: 0.97, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-[#121212] border border-[#e5e7eb] dark:border-[#262626] rounded-xl p-5 shadow-2xl text-neutral-900 dark:text-white"
            >
              {bookingConfirmed ? (
                <div className="text-center py-3 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">预约已确认</h3>
                  <p className="text-xs text-neutral-500 dark:text-[#888888]">
                    {selectedDateStr} {formatTime(bookingSlot)}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setBookingSlot(null);
                        setBookingConfirmed(false);
                      }}
                      className="w-full py-2 rounded-lg bg-black text-white font-semibold text-xs transition-colors cursor-pointer hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5]"
                    >
                      完成
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-[#222222] pb-2.5">
                    <div>
                      <p className="text-[11px] text-neutral-500 dark:text-[#888888]">预约交流时段</p>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {selectedDayLabel} · {formatTime(bookingSlot)}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingSlot(null)}
                      className="text-neutral-400 hover:text-black dark:text-[#737373] dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-0.5">
                    <div>
                      <label className="block text-[11px] text-neutral-600 dark:text-[#888888] mb-1">
                        称呼 / 昵称
                      </label>
                      <input
                        type="text"
                        required
                        value={attendeeName}
                        onChange={(e) => setAttendeeName(e.target.value)}
                        placeholder="你的名字"
                        className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-black dark:text-white focus:outline-none focus:border-neutral-500 dark:focus:border-white/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-600 dark:text-[#888888] mb-1">
                        联系邮箱
                      </label>
                      <input
                        type="email"
                        required
                        value={attendeeEmail}
                        onChange={(e) => setAttendeeEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-black dark:text-white focus:outline-none focus:border-neutral-500 dark:focus:border-white/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-600 dark:text-[#888888] mb-1">
                        备注（选填）
                      </label>
                      <textarea
                        rows={2}
                        value={attendeeNote}
                        onChange={(e) => setAttendeeNote(e.target.value)}
                        placeholder="交流话题..."
                        className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-black dark:text-white focus:outline-none focus:border-neutral-500 dark:focus:border-white/50 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingSlot(null)}
                      className="w-1/2 py-2 rounded-lg bg-neutral-100 dark:bg-[#1c1c1c] text-neutral-600 dark:text-[#888888] hover:text-black dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-1/2 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold text-xs transition-colors cursor-pointer hover:bg-neutral-800 dark:hover:bg-[#e5e5e5]"
                    >
                      {isSubmitting ? '提交中...' : '确认预约'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal Brand Footer */}
      <div className="text-center py-4 select-none">
        <span className="text-xs font-bold text-neutral-400 hover:text-black dark:text-[#737373] dark:hover:text-white tracking-tight transition-colors cursor-pointer">
          Cal.com
        </span>
      </div>
    </div>
  );
};
