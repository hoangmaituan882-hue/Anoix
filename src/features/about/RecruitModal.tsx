import React from 'react';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { X, CheckCircle, Briefcase, Mail, FileText } from 'lucide-react';

interface RecruitModalProps {
  lang: Language;
  onClose: () => void;
}

export const RecruitModal: React.FC<RecruitModalProps> = ({ lang, onClose }) => {
  const t = I18N[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-[#1a1a1a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-[#f5ffe5] my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-[#151515]">
          <div>
            <span className="text-xs font-black text-[#e0fe3d] uppercase tracking-widest">
              {lang === 'zh' ? '加入 TRIGGER 创作团队 · CAREERS' : 'JOIN THE TRIGGER CREATIVE TEAM'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {t.recruitModalTitle}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-sm sm:text-base leading-relaxed">
          {/* Tagline */}
          <div className="bg-[#e0fe3d]/10 border border-[#e0fe3d]/30 p-6 rounded-2xl">
            <h3 className="text-xl font-black text-[#e0fe3d] mb-2">
              {t.recruitTagline}
            </h3>
            <p className="text-white/80">
              {t.recruitDesc}
            </p>
          </div>

          {/* Open Positions */}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#e0fe3d]" />
              <span>{lang === 'zh' ? '招聘岗位 (RECRUITMENT POSITIONS)' : 'RECRUITMENT POSITIONS (募集職種)'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                <h5 className="font-black text-lg text-white mb-2">
                  {lang === 'zh' ? '1. 动画师 (作画 · 原画 · 动画)' : '1. アニメーター (作画・原画・動画)'}
                </h5>
                <p className="text-xs sm:text-sm text-white/70 mb-3">
                  {lang === 'zh' 
                    ? '在今石洋之、吉成曜等顶级动画大师指导下，负责充满张力的动作作画与角色关键动作设计。' 
                    : '今石洋之、吉成曜らトップアニメーターの元でアクション作画、キャラクターアニメーションの制作を担当。'}
                </p>
                <span className="inline-block bg-[#e0fe3d]/20 text-[#e0fe3d] text-xs font-bold px-2.5 py-0.5 rounded">
                  {lang === 'zh' ? '应届毕业生 · 往届生 · 社招' : '新卒・既卒・中途'}
                </span>
              </div>

              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                <h5 className="font-black text-lg text-white mb-2">
                  {lang === 'zh' ? '2. 制作进行 (Production Coordinator)' : '2. 制作進行 (Production Coordinator)'}
                </h5>
                <p className="text-xs sm:text-sm text-white/70 mb-3">
                  {lang === 'zh' 
                    ? '把控动画整体制作周期与时间表，协调监督、原画、外包团队等各环节跨部门高效协作。' 
                    : 'アニメーション制作全体のスケジュール管理、スタッフ間連携、作品完成に向けた総合進行管理。'}
                </p>
                <span className="inline-block bg-[#e0fe3d]/20 text-[#e0fe3d] text-xs font-bold px-2.5 py-0.5 rounded">
                  {lang === 'zh' ? '有经验者 · 欢迎无经验新人' : '経験者・未経験歓迎'}
                </span>
              </div>

              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                <h5 className="font-black text-lg text-white mb-2">
                  {lang === 'zh' ? '3. 3DCG / 摄影合成人员' : '3. 3DCG / 撮影スタッフ'}
                </h5>
                <p className="text-xs sm:text-sm text-white/70 mb-3">
                  {lang === 'zh' 
                    ? '熟练运用 Blender, 3ds Max, After Effects 等进行三维建模、镜头构图布局与特效合成工作。' 
                    : 'Blender, 3ds Max, After Effects等を用いた3Dモデリング、レイアウト、コンポジット作業。'}
                </p>
                <span className="inline-block bg-[#e0fe3d]/20 text-[#e0fe3d] text-xs font-bold px-2.5 py-0.5 rounded">
                  {lang === 'zh' ? '社招 · 需具备相关技能' : '中途・スキル保持者'}
                </span>
              </div>

              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                <h5 className="font-black text-lg text-white mb-2">
                  {lang === 'zh' ? '4. 美术 · 背景设计人员' : '4. 美術・背景スタッフ'}
                </h5>
                <p className="text-xs sm:text-sm text-white/70 mb-3">
                  {lang === 'zh' 
                    ? '构建极具独创性与视觉冲击力的世界观背景美术与概念设定图。熟练使用 Photoshop / CLIP STUDIO。' 
                    : '独創的で力強い世界観を構築する背景美術・設定画の制作。Photoshop/CLIP STUDIO PAINT。'}
                </p>
                <span className="inline-block bg-[#e0fe3d]/20 text-[#e0fe3d] text-xs font-bold px-2.5 py-0.5 rounded">
                  {lang === 'zh' ? '必须附带个人作品集 (Portfolio)' : 'ポートフォリオ必須'}
                </span>
              </div>
            </div>
          </div>

          {/* Application Process */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h4 className="text-sm font-black text-[#e0fe3d] uppercase tracking-wider mb-3">
              {lang === 'zh' ? '应聘方式 (HOW TO APPLY)' : '応募方法 (HOW TO APPLY)'}
            </h4>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-4">
              {lang === 'zh' 
                ? '请将个人简历及代表作品集（作品集PDF、素描手稿、原画复印件或视频作品Demo）发送至TRIGGER官方招聘事务局。' 
                : '履歴書および作品集（ポートフォリオ、デッサン、原画コピー等）をTRIGGER公式採用担当宛にお送りください。'}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-white/60">
              <Mail className="w-4 h-4 text-[#e0fe3d]" />
              <span>{lang === 'zh' ? '招聘邮箱：recruit@st-trigger.co.jp' : '宛先：recruit@st-trigger.co.jp'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
