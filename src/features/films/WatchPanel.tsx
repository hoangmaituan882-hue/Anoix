import React, { useEffect, useState } from 'react';
import { community, WatchItem } from '../../lib/community';
import { Rating } from '../../components/ui/rating';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/Toast';
import { Eye, Trash2 } from 'lucide-react';

/** Inline watch-log editor: 已看过 + 5-star rating + short review. */
export const WatchPanel: React.FC<{ filmId: string; filmTitle: string }> = ({ filmId, filmTitle }) => {
  const { success, error: toastError } = useToast();
  const [mine, setMine] = useState<WatchItem | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    community.watchList()
      .then((list) => {
        if (!alive) return;
        const m = list.find((w) => w.film_id === filmId) ?? null;
        setMine(m);
        setRating(m?.rating ?? 0);
        setReview(m?.review ?? '');
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [filmId]);

  const save = async () => {
    setSaving(true);
    try {
      await community.saveWatch(filmId, rating, review);
      const list = await community.watchList();
      setMine(list.find((w) => w.film_id === filmId) ?? null);
      success('已保存观影记录');
    } catch (e) {
      toastError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await community.removeWatch(filmId);
      setMine(null); setRating(0); setReview('');
      success('已清除观影记录');
    } catch (e) {
      toastError(e instanceof Error ? e.message : '清除失败');
    }
  };

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-5">
      <h3 className="font-black text-white mb-3 flex items-center gap-2">
        <Eye className="w-4 h-4 text-[#ff3650]" /> 我的观影
      </h3>

      <div className="flex items-center gap-3">
        <Rating value={rating} onChange={setRating} />
        <span className="text-xs font-bold text-black/40">{rating > 0 ? `${rating}/5` : '未评分'}</span>
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        rows={2}
        maxLength={200}
        placeholder={`对《${filmTitle}》的短评（可选）`}
        className="mt-3 w-full bg-black/50 border border-black/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-black/30 resize-none"
      />
      <p className="text-[11px] text-black/30 text-right mt-1">{review.length}/200</p>

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={remove}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-black/40 hover:text-[#ff3650] transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> 清除记录
        </button>
        <Button onClick={save} disabled={saving}>
          {saving ? '保存中...' : mine ? '更新记录' : '标记已看过'}
        </Button>
      </div>
    </div>
  );
};
