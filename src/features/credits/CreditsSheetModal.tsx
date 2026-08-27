import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Coins,
  CreditCard,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  History,
  Sparkles,
  ShieldCheck,
  X,
  PieChart,
  Calendar,
  Wallet,
} from 'lucide-react';

export type CreditsModalTab = 'topup' | 'usage';

let openModalListener: ((tab?: CreditsModalTab) => void) | null = null;

/** Global helper to trigger the Credits Top-Up & Usage Modal from anywhere */
export function openCreditsModal(tab: CreditsModalTab = 'topup') {
  openModalListener?.(tab);
}

interface CreditsSheetModalProps {
  lang?: 'zh' | 'ja' | 'en';
}

export const CreditsSheetModal: React.FC<CreditsSheetModalProps> = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CreditsModalTab>('topup');
  const [balance, setBalance] = useState(30947);
  const [selectedTier, setSelectedTier] = useState<number>(2); // Default to Tier 2 (Pro)
  const [selectedPayMethod, setSelectedPayMethod] = useState<'wechat' | 'alipay' | 'apple'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    openModalListener = (tab = 'topup') => {
      setActiveTab(tab);
      setOpen(true);
    };
    return () => {
      openModalListener = null;
    };
  }, []);

  const tiers = [
    {
      id: 1,
      credits: 5000,
      price: '¥ 50',
      bonus: '+500 赠送点数',
      tag: '入门礼包',
      badge: '入门基础',
    },
    {
      id: 2,
      credits: 15000,
      price: '¥ 128',
      bonus: '+2,500 赠送点数',
      tag: '最受欢迎 · 超值 20%',
      badge: '热门推荐 🔥',
      highlight: true,
    },
    {
      id: 3,
      credits: 50000,
      price: '¥ 388',
      bonus: '+12,000 赠送点数 + 独家放映优先购票权',
      tag: '制片人尊享礼包',
      badge: 'VIP 制片人',
    },
  ];

  const ledgerHistory = [
    {
      id: 1,
      title: '《赛博朋克：边缘行者2》超级音浪特映会入场预约',
      date: '2026.08.24 19:30',
      amount: -12000,
      category: '放映预约',
      venue: 'TOHO 影院新宿 (TCX / 杜比全景声)',
    },
    {
      id: 2,
      title: 'TRIGGER 2026 年度大赏 · 最佳原画候选加权投票',
      date: '2026.08.18 14:15',
      amount: -6053,
      category: '大赏投票',
      venue: '年度大赏线上投票系统',
    },
    {
      id: 3,
      title: '季度会员额度自动重置与制片人加赠',
      date: '2026.08.14 00:00',
      amount: 50000,
      category: '额度重置',
      venue: '系统自动入账',
    },
    {
      id: 4,
      title: '《古立特宇宙》立川极音爆音特设放映入场券',
      date: '2026.08.02 21:00',
      amount: -15000,
      category: '放映预约',
      venue: 'Cinema City 立川 (Cinema Two)',
    },
    {
      id: 5,
      title: '社区活跃观影资历认证达成奖励',
      date: '2026.07.28 10:20',
      amount: 10000,
      category: '成就奖励',
      venue: '资历成就系统',
    },
  ];

  const handleCheckout = () => {
    setIsProcessing(true);
    const chosen = tiers.find((t) => t.id === selectedTier) || tiers[1];
    setTimeout(() => {
      setBalance((prev) => prev + chosen.credits);
      setIsProcessing(false);
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        setOpen(false);
      }, 1600);
    }, 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
        >
          {/* Backdrop dismiss */}
          <div className="absolute inset-0" onClick={() => setOpen(false)} />

          {/* Main Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="credits-sheet-card relative z-10 w-full max-w-2xl bg-[#1c1c1f] text-white border border-white/15 rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header: 24px Main Title */}
            <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff3650] to-[#ff6b81] flex items-center justify-center shadow-lg shadow-[#ff3650]/30">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[24px] font-black text-white leading-tight">
                    放映点数中心
                  </h2>
                  <p className="text-[12px] text-white/50 mt-0.5">
                    可用于特设放映现场预约、年度大赏加权投票与限定特典兑换
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance & Tabs Bar */}
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
              {/* Balance Badge */}
              <div className="flex items-center gap-2.5">
                <span className="text-[12px] text-white/50 font-normal">当前可用余额：</span>
                <span className="text-[18px] font-bold text-white font-mono flex items-center gap-1">
                  <span className="text-[#ff3650] font-black">⚡</span>
                  {balance.toLocaleString()} 点
                </span>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-1 p-1 bg-black/40 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('topup')}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'topup'
                      ? 'bg-[#ff3650] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>充值点数</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('usage')}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'usage'
                      ? 'bg-[#ff3650] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>消费明细</span>
                </button>
              </div>
            </div>

            {/* Content Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'topup' ? (
                /* TAB 1: Top-Up Tiers */
                <div className="space-y-6">
                  {/* Tiers Grid */}
                  <div>
                    <h3 className="text-[18px] font-bold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#ff3650]" />
                      <span>选择充值额度礼包</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {tiers.map((tier) => {
                        const isSelected = selectedTier === tier.id;
                        return (
                          <div
                            key={tier.id}
                            onClick={() => setSelectedTier(tier.id)}
                            className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-gradient-to-b from-[#ff3650]/15 to-[#ff3650]/5 border-[#ff3650] shadow-[0_0_24px_rgba(255,54,80,0.25)]'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {/* Top Badge */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                {tier.badge}
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-[#ff3650]" />}
                            </div>

                            {/* Credits & Price: 16px Card Title */}
                            <div>
                              <p className="text-[16px] font-black text-white font-mono flex items-center gap-1">
                                <span>⚡</span>
                                <span>{tier.credits.toLocaleString()} 点</span>
                              </p>
                              <p className="text-[14px] font-bold text-[#ff3650] mt-0.5 font-mono">
                                {tier.price}
                              </p>
                            </div>

                            {/* Bonus Tag: 12px Caption */}
                            <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-white/70 leading-[1.4]">
                              {tier.bonus}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <h3 className="text-[18px] font-bold text-white mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#ff3650]" />
                      <span>选择安全支付方式</span>
                    </h3>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'wechat', name: '微信支付', icon: '🟢' },
                        { id: 'alipay', name: '支付宝', icon: '🔵' },
                        { id: 'apple', name: 'Apple Pay', icon: '🍎' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setSelectedPayMethod(pm.id as any)}
                          className={`p-3 rounded-xl border text-[14px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            selectedPayMethod === pm.id
                              ? 'bg-white/15 border-[#ff3650] text-white shadow-xs'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{pm.icon}</span>
                          <span>{pm.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guarantee notice */}
                  <div className="flex items-center gap-2 text-[12px] text-white/50 bg-white/5 p-3 rounded-xl border border-white/5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>官方安全加密支付通道，充值点数实时到账，永久有效。</span>
                  </div>
                </div>
              ) : (
                /* TAB 2: Usage Ledger */
                <div className="space-y-6">
                  {/* Category Breakdown Bar */}
                  <div>
                    <h3 className="text-[18px] font-bold text-white mb-2 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-[#ff3650]" />
                      <span>点数消费结构分布</span>
                    </h3>

                    {/* Progress multi-segment bar */}
                    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex my-2">
                      <div style={{ width: '61%' }} className="h-full bg-[#ff3650]" title="放映预约 61%" />
                      <div style={{ width: '26%' }} className="h-full bg-[#3b82f6]" title="大赏投票 26%" />
                      <div style={{ width: '13%' }} className="h-full bg-[#10b981]" title="特典兑换 13%" />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[12px] text-white/60">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ff3650]" /> 放映预约 (61%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> 大赏投票 (26%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10b981]" /> 特典兑换 (13%)
                      </span>
                    </div>
                  </div>

                  {/* Transaction Ledger Table */}
                  <div>
                    <h3 className="text-[18px] font-bold text-white mb-3">
                      近期交易记录
                    </h3>

                    <div className="space-y-2">
                      {ledgerHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-bold text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-[12px] text-white/50 flex items-center gap-2 mt-0.5">
                              <span>{item.date}</span>
                              <span>·</span>
                              <span>{item.venue}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-[14px] font-bold font-mono ${
                                item.amount < 0 ? 'text-white' : 'text-emerald-400'
                              }`}
                            >
                              {item.amount < 0 ? `${item.amount.toLocaleString()} 点` : `+${item.amount.toLocaleString()} 点`}
                            </span>
                            <span className="block text-[11px] text-white/40">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: 16px Action Button */}
            {activeTab === 'topup' && (
              <div className="p-4 sm:p-6 border-t border-white/10 bg-black/30 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[12px] text-white/50 block">应付金额</span>
                  <span className="text-[20px] font-black text-white font-mono">
                    {tiers.find((t) => t.id === selectedTier)?.price || '¥ 128'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCheckout}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-[#ff3650] to-[#e02640] hover:brightness-110 text-white text-[16px] font-bold shadow-lg shadow-[#ff3650]/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>正在安全处理...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>立即安全充值</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* Success Toast */}
          <AnimatePresence>
            {successToast && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute z-50 px-6 py-3 rounded-full bg-emerald-500 text-white font-bold text-[14px] shadow-2xl flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>点数充值成功！已实时计入账户。</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
