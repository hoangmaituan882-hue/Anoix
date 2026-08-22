import React, { useState } from 'react';
import { Language } from '../types';
import { I18N } from '../data/triggerData';
import { X, Mail, Send, CheckCircle2 } from 'lucide-react';

interface ContactModalProps {
  lang: Language;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ lang, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const t = I18N[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-[#1c1c1c] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-[#f5ffe5] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest">
            ANIMATION STUDIO TRIGGER
          </span>
          <h2 className="text-2xl font-black text-white uppercase">
            {t.contactModalTitle}
          </h2>
        </div>

        {submitted ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-2">
              {lang === 'zh' ? '消息已发送！' : lang === 'en' ? 'Message Sent!' : '送信完了いたしました'}
            </h3>
            <p className="text-xs text-white/70">
              {lang === 'zh' ? '感谢您的联络，我们将尽快回复。' : lang === 'en' ? 'Thank you for reaching out to Studio TRIGGER.' : 'お問い合わせありがとうございます。'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                {lang === 'zh' ? '您的姓名' : lang === 'en' ? 'Your Name' : 'お名前'} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff3650] text-sm"
                placeholder="Trigger Fan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                {lang === 'zh' ? '电子邮箱' : lang === 'en' ? 'Email Address' : 'メールアドレス'} *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff3650] text-sm"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                {lang === 'zh' ? '咨询类型' : lang === 'en' ? 'Inquiry Category' : 'お問い合わせ項目'} *
              </label>
              <select
                className="w-full bg-[#242424] border border-white/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff3650] text-sm"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              >
                <option value="business">取材・制作依頼 (Business / Production Inquiries)</option>
                <option value="goods">グッズ・物販について (Merchandise Inquiries)</option>
                <option value="event">イベント・サイン会について (Events / Appearances)</option>
                <option value="other">その他 (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                {lang === 'zh' ? '内容' : lang === 'en' ? 'Message' : 'お問い合わせ内容'} *
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff3650] text-sm resize-none"
                placeholder="Your inquiry details..."
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#ff3650] hover:bg-[#e02640] text-white py-3.5 rounded-full font-black text-sm uppercase tracking-wider transition-colors shadow-lg cursor-pointer mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{lang === 'zh' ? '发送咨询' : lang === 'en' ? 'Submit Inquiry' : '送信する'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
