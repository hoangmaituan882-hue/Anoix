import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Volume2, MapPin, Ticket, Plus, X, ChevronDown, Check, Sparkles } from 'lucide-react';
import { Screening } from '../../types/screening';

export type DateOperator = '处于' | '晚于' | '早于' | '介于区间' | '时间周期';
export type GeneralOperator = '为' | '包含';

export interface FilterCondition {
  id: string;
  field: 'date' | 'audio' | 'status' | 'venue';
  operator: DateOperator | GeneralOperator | string;
  value: string;
  secondValue?: string;
}

interface ScreeningFilterPillsProps {
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  availableYears: string[];
  lang?: 'zh' | 'ja' | 'en';
}

const AUDIO_SPECS = [
  '杜比全景声 (Dolby Atmos)',
  'TCX 巨幕',
  'BESTIA 影院',
  'IMAX 激光厅',
  '立川极音爆音厅',
  '5.1 环绕声',
];

const VENUE_PRESETS = [
  'TOHO 影院新宿',
  '池袋 Grand Cinema',
  '立川 Cinema City',
  'TOHO 影院日比谷',
  'TOHO 影院六本木',
  '东京特设剧场',
  '海外巡展现场',
];

export const ScreeningFilterPills: React.FC<ScreeningFilterPillsProps> = ({
  conditions,
  onChange,
  availableYears,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeEditingPillId, setActiveEditingPillId] = useState<string | null>(null);
  const [editingSegment, setEditingSegment] = useState<'operator' | 'value' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setActiveEditingPillId(null);
        setEditingSegment(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addFilter = (field: FilterCondition['field']) => {
    let newCondition: FilterCondition;
    if (field === 'date') {
      newCondition = {
        id: `filter_date_${Date.now()}`,
        field: 'date',
        operator: '处于',
        value: availableYears[0] || '2026',
      };
    } else if (field === 'audio') {
      newCondition = {
        id: `filter_audio_${Date.now()}`,
        field: 'audio',
        operator: '包含',
        value: '杜比全景声',
      };
    } else if (field === 'status') {
      newCondition = {
        id: `filter_status_${Date.now()}`,
        field: 'status',
        operator: '为',
        value: 'upcoming',
      };
    } else {
      newCondition = {
        id: `filter_venue_${Date.now()}`,
        field: 'venue',
        operator: '包含',
        value: '新宿',
      };
    }

    onChange([...conditions, newCondition]);
    setMenuOpen(false);
  };

  const removeFilter = (id: string) => {
    onChange(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onChange(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div ref={menuRef} className="flex flex-wrap items-center gap-2 select-none relative">
      {/* Active Filter Pills (1:1 with pure Chinese segmented capsule) */}
      <AnimatePresence>
        {conditions.map((cond) => {
          const isDate = cond.field === 'date';
          const isAudio = cond.field === 'audio';
          const isStatus = cond.field === 'status';
          const isVenue = cond.field === 'venue';

          const Icon = isDate
            ? Calendar
            : isAudio
            ? Volume2
            : isStatus
            ? Ticket
            : MapPin;

          const fieldLabel = isDate
            ? '放映日期'
            : isAudio
            ? '音响规格'
            : isStatus
            ? '活动状态'
            : '影院地区';

          const isEditingThis = activeEditingPillId === cond.id;

          // Normalized display operator
          const displayOp =
            cond.operator === 'is on' ? '处于' :
            cond.operator === 'is after' ? '晚于' :
            cond.operator === 'is before' ? '早于' :
            cond.operator === 'is between' ? '介于区间' :
            cond.operator === 'is within' ? '时间周期' :
            cond.operator === 'contains' ? '包含' :
            cond.operator === 'is' ? '为' : cond.operator;

          const displayVal =
            cond.value === 'upcoming' ? '即将上映' :
            cond.value === 'completed' ? '历史档案' :
            cond.value;

          return (
            <motion.div
              key={cond.id}
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -4 }}
              transition={{ duration: 0.2 }}
              className="relative inline-flex items-center text-[12px] font-medium rounded-full bg-white/10 dark:bg-white/10 hover:bg-white/15 border border-black/15 dark:border-black/20 text-white shadow-xs transition-colors backdrop-blur-xs"
            >
              {/* Segment 1: Field Name */}
              <div className="flex items-center gap-1.5 pl-3 pr-2 py-1 text-white/90 font-bold">
                <Icon className="w-3.5 h-3.5 text-[#ff3650]" />
                <span>{fieldLabel}</span>
              </div>

              {/* Vertical Segment Divider */}
              <span className="text-black/20 select-none">|</span>

              {/* Segment 2: Operator */}
              <button
                type="button"
                onClick={() => {
                  setActiveEditingPillId(isEditingThis && editingSegment === 'operator' ? null : cond.id);
                  setEditingSegment('operator');
                }}
                className="px-2 py-1 text-black/70 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{displayOp}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-50" />
              </button>

              {/* Vertical Segment Divider */}
              <span className="text-black/20 select-none">|</span>

              {/* Segment 3: Target Value */}
              <button
                type="button"
                onClick={() => {
                  setActiveEditingPillId(isEditingThis && editingSegment === 'value' ? null : cond.id);
                  setEditingSegment('value');
                }}
                className="px-2 py-1 font-bold text-white hover:text-[#ff3650] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>
                  {(cond.operator === '介于区间' || cond.operator === 'is between') && cond.secondValue
                    ? `${cond.value}年 — ${cond.secondValue}年`
                    : isDate && !displayVal.includes('年') && !isNaN(Number(displayVal))
                    ? `${displayVal}年`
                    : displayVal}
                </span>
                <ChevronDown className="w-2.5 h-2.5 opacity-50" />
              </button>

              {/* Vertical Segment Divider */}
              <span className="text-black/20 select-none">|</span>

              {/* Segment 4: Clear Button (×) */}
              <button
                type="button"
                onClick={() => removeFilter(cond.id)}
                className="pl-2 pr-3 py-1 text-black/50 hover:text-white transition-colors cursor-pointer hover:bg-white/10 rounded-r-full"
                aria-label="移除筛选条件"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Dropdown Popover for Operator Selection */}
              {isEditingThis && editingSegment === 'operator' && (
                <div className="absolute top-full left-12 mt-1 z-50 min-w-36 bg-[#1c1c1c] border border-black/20 rounded-xl p-1.5 shadow-2xl backdrop-blur-md text-[12px]">
                  {isDate ? (
                    ['处于', '晚于', '早于', '介于区间', '时间周期'].map((op) => (
                      <button
                        key={op}
                        onClick={() => {
                          updateCondition(cond.id, {
                            operator: op as DateOperator,
                            secondValue: op === '介于区间' ? availableYears[availableYears.length - 1] || '2013' : undefined,
                          });
                          setActiveEditingPillId(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                          displayOp === op ? 'text-[#ff3650] font-bold bg-white/5' : 'text-black/80'
                        }`}
                      >
                        <span>{op}</span>
                        {displayOp === op && <Check className="w-3 h-3 text-[#ff3650]" />}
                      </button>
                    ))
                  ) : (
                    ['包含', '为'].map((op) => (
                      <button
                        key={op}
                        onClick={() => {
                          updateCondition(cond.id, { operator: op as GeneralOperator });
                          setActiveEditingPillId(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                          displayOp === op ? 'text-[#ff3650] font-bold bg-white/5' : 'text-black/80'
                        }`}
                      >
                        <span>{op}</span>
                        {displayOp === op && <Check className="w-3 h-3 text-[#ff3650]" />}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Dropdown Popover for Target Value Selection */}
              {isEditingThis && editingSegment === 'value' && (
                <div className="absolute top-full right-4 mt-1 z-50 min-w-44 bg-[#1c1c1c] border border-black/20 rounded-xl p-2 shadow-2xl backdrop-blur-md text-[12px] max-h-60 overflow-y-auto">
                  {isDate ? (
                    cond.operator === '时间周期' || cond.operator === 'is within' ? (
                      ['未来90天特映', '近1年放映', '全历史场次'].map((val) => (
                        <button
                          key={val}
                          onClick={() => {
                            updateCondition(cond.id, { value: val });
                            setActiveEditingPillId(null);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                            cond.value === val ? 'text-[#ff3650] font-bold bg-white/5' : 'text-black/80'
                          }`}
                        >
                          <span>{val}</span>
                          {cond.value === val && <Check className="w-3 h-3 text-[#ff3650]" />}
                        </button>
                      ))
                    ) : cond.operator === '介于区间' || cond.operator === 'is between' ? (
                      <div className="space-y-2 p-1">
                        <div className="text-[10px] text-black/50">起始年份:</div>
                        <div className="grid grid-cols-3 gap-1">
                          {availableYears.map((yr) => (
                            <button
                              key={`from_${yr}`}
                              onClick={() => updateCondition(cond.id, { value: yr })}
                              className={`px-2 py-1 rounded text-center cursor-pointer ${
                                cond.value === yr ? 'bg-[#ff3650] text-white font-bold' : 'bg-white/5 text-black/70 hover:bg-white/10'
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                        <div className="text-[10px] text-black/50 pt-1 border-t border-black/10">截止年份:</div>
                        <div className="grid grid-cols-3 gap-1">
                          {availableYears.map((yr) => (
                            <button
                              key={`to_${yr}`}
                              onClick={() => {
                                updateCondition(cond.id, { secondValue: yr });
                                setActiveEditingPillId(null);
                              }}
                              className={`px-2 py-1 rounded text-center cursor-pointer ${
                                cond.secondValue === yr ? 'bg-[#ff3650] text-white font-bold' : 'bg-white/5 text-black/70 hover:bg-white/10'
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      availableYears.map((yr) => (
                        <button
                          key={yr}
                          onClick={() => {
                            updateCondition(cond.id, { value: yr });
                            setActiveEditingPillId(null);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                            cond.value === yr ? 'text-[#ff3650] font-bold bg-white/5' : 'text-black/80'
                          }`}
                        >
                          <span>{yr}年</span>
                          {cond.value === yr && <Check className="w-3 h-3 text-[#ff3650]" />}
                        </button>
                      ))
                    )
                  ) : isAudio ? (
                    AUDIO_SPECS.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => {
                          updateCondition(cond.id, { value: spec.split(' ')[0] });
                          setActiveEditingPillId(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                          cond.value === spec.split(' ')[0] ? 'text-[#ff3650] font-bold bg-white/5' : 'text-black/80'
                        }`}
                      >
                        <span>{spec}</span>
                        {cond.value === spec.split(' ')[0] && <Check className="w-3 h-3 text-[#ff3650]" />}
                      </button>
                    ))
                  ) : isStatus ? (
                    [
                      { val: 'upcoming', label: '即将上映 (最新特映)' },
                      { val: 'completed', label: '历史展映 (已完结)' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => {
                          updateCondition(cond.id, { value: item.val });
                          setActiveEditingPillId(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                          cond.value === item.val ? 'text-[#ff3650] font-bold bg-white/5' : 'text-black/80'
                        }`}
                      >
                        <span>{item.label}</span>
                        {cond.value === item.val && <Check className="w-3 h-3 text-[#ff3650]" />}
                      </button>
                    ))
                  ) : (
                    VENUE_PRESETS.map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          updateCondition(cond.id, { value: v.replace(/影院|特设剧场|巡展现场/g, '') });
                          setActiveEditingPillId(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                          cond.value === v.replace(/影院|特设剧场|巡展现场/g, '') ? 'text-[#ff3650] font-bold bg-white/5' : 'text-black/80'
                        }`}
                      >
                        <span>{v}</span>
                        {cond.value === v.replace(/影院|特设剧场|巡展现场/g, '') && <Check className="w-3 h-3 text-[#ff3650]" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add Filter Capsule Button */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-black/80 hover:text-white border border-black/10 text-[12px] font-bold transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#ff3650]" />
          <span>添加筛选条件</span>
        </button>

        {/* Add Filter Menu Popover */}
        {menuOpen && (
          <div className="absolute top-full left-0 mt-1.5 z-50 w-48 bg-[#1c1c1c] border border-black/20 rounded-2xl p-2 shadow-2xl backdrop-blur-md text-[12px]">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-black/40 tracking-wider">
              选择筛选维度
            </div>
            <div className="space-y-0.5 mt-1">
              <button
                onClick={() => addFilter('date')}
                className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2 text-black/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <Calendar className="w-3.5 h-3.5 text-[#ff3650]" />
                <span>放映日期</span>
              </button>
              <button
                onClick={() => addFilter('audio')}
                className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2 text-black/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#ff3650]" />
                <span>音响规格</span>
              </button>
              <button
                onClick={() => addFilter('status')}
                className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2 text-black/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <Ticket className="w-3.5 h-3.5 text-[#ff3650]" />
                <span>活动状态</span>
              </button>
              <button
                onClick={() => addFilter('venue')}
                className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2 text-black/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <MapPin className="w-3.5 h-3.5 text-[#ff3650]" />
                <span>影院地区</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear All Button if any filter is active */}
      {conditions.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-[12px] text-black/40 hover:text-[#ff3650] px-2 py-1 transition-colors cursor-pointer font-bold"
        >
          清空筛选
        </button>
      )}
    </div>
  );
};

/**
 * Filter evaluator utility supporting Chinese & Canonical operators
 */
export function evaluateScreeningFilters(
  screenings: Screening[],
  conditions: FilterCondition[]
): Screening[] {
  if (!conditions || conditions.length === 0) return screenings;

  return screenings.filter((s) => {
    return conditions.every((cond) => {
      // 1. Date filter
      if (cond.field === 'date') {
        const match = s.screen_date.match(/\b(19\d\d|20\d\d)\b/);
        const itemYear = match ? parseInt(match[1], 10) : parseInt(s.screen_date.slice(0, 4), 10);
        const targetYear = parseInt(cond.value, 10);

        if (cond.operator === '处于' || cond.operator === 'is on') {
          return itemYear === targetYear;
        }
        if (cond.operator === '晚于' || cond.operator === 'is after') {
          return itemYear > targetYear;
        }
        if (cond.operator === '早于' || cond.operator === 'is before') {
          return itemYear < targetYear;
        }
        if (cond.operator === '介于区间' || cond.operator === 'is between') {
          const secondYear = parseInt(cond.secondValue || cond.value, 10);
          const minYear = Math.min(targetYear, secondYear);
          const maxYear = Math.max(targetYear, secondYear);
          return itemYear >= minYear && itemYear <= maxYear;
        }
        if (cond.operator === '时间周期' || cond.operator === 'is within') {
          if (cond.value.includes('未来') || cond.value.includes('upcoming')) {
            return s.status === 'upcoming';
          }
          if (cond.value.includes('1年') || cond.value.includes('1 year')) {
            return itemYear >= 2025;
          }
          return true;
        }
      }

      // 2. Audio/Specs filter
      if (cond.field === 'audio') {
        if (!s.format_tags || s.format_tags.length === 0) return false;
        const q = cond.value.toLowerCase().replace(/杜比全景声/g, 'dolby');
        return s.format_tags.some((tag) => tag.toLowerCase().includes(q) || tag.includes(cond.value));
      }

      // 3. Status filter
      if (cond.field === 'status') {
        return s.status === cond.value;
      }

      // 4. Venue filter
      if (cond.field === 'venue') {
        const q = cond.value.toLowerCase();
        const venueMatch = s.venue && s.venue.toLowerCase().includes(q);
        const cityMatch = s.city && s.city.toLowerCase().includes(q);
        return Boolean(venueMatch || cityMatch);
      }

      return true;
    });
  });
}
