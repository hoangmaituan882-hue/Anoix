import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Loader } from '../../components/motion/loader';
import { nominations, NominationActivity, VoteActivity } from '../../lib/nominations';
import { Vote, CheckCircle2, Clock } from 'lucide-react';

let openListener: (() => void) | null = null;

/** Open the activity drawer from anywhere (e.g. the Header dropdown). */
export function openActivityDrawer() {
  openListener?.();
}

const GATE_BADGE = ({ gate }: { gate: VoteActivity['gate'] }) => {
  if (gate === 'screened') return <Badge variant="secondary">已放映</Badge>;
  if (gate === 'frozen') return <Badge>已排期</Badge>;
  return <Badge variant="outline">可投</Badge>;
};

const PlannedBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
    <CheckCircle2 className="w-3 h-3" /> 已通过
  </span>
);

const VoteRow: React.FC<{ v: VoteActivity }> = ({ v }) => {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all t-tilt-card ${v.planned ? 'border-emerald-500/40 ring-1 ring-emerald-400/30 bg-emerald-500/5' : 'border-black/10 bg-black/30 hover:border-white/25'}`}>
      <Avatar className="h-12 w-9 rounded-lg shrink-0 overflow-hidden">
        <AvatarImage src={v.image || undefined} alt={v.filmTitle} className="hover:scale-110 transition-transform duration-300 object-cover" />
        <AvatarFallback className="bg-white/10 text-xs">{v.filmTitle.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate flex items-center gap-2">{v.filmTitle}{v.planned && <PlannedBadge />}</p>
        <p className="text-xs text-black/40 truncate">叠票 {v.count} · {v.weeks} 周</p>
      </div>
      <div className="text-right shrink-0"><GATE_BADGE gate={v.gate} /></div>
    </div>
  );
};

const NominationRow: React.FC<{ n: NominationActivity }> = ({ n }) => {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all t-tilt-card ${n.planned ? 'border-emerald-500/40 ring-1 ring-emerald-400/30 bg-emerald-500/5' : 'border-black/10 bg-black/30 hover:border-white/25'}`}>
      <Avatar className="h-12 w-9 rounded-lg shrink-0 overflow-hidden">
        <AvatarImage src={n.image || undefined} alt={n.filmTitle} className="hover:scale-110 transition-transform duration-300 object-cover" />
        <AvatarFallback className="bg-white/10 text-xs">{n.filmTitle.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate flex items-center gap-2">{n.filmTitle}{n.planned && <PlannedBadge />}</p>
        <p className="text-xs text-black/40 truncate">{n.note || (n.status === 'promoted' ? '已入库' : '提名中')}</p>
      </div>
    </div>
  );
};

/** Global right-side drawer showing the signed-in user's votes & nominations. */
export const ActivityDrawer: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [votes, setVotes] = useState<VoteActivity[] | null>(null);
  const [noms, setNoms] = useState<NominationActivity[] | null>(null);

  useEffect(() => {
    openListener = () => setOpen(true);
    return () => { openListener = null; };
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setVotes(null); setNoms(null);
    nominations.activity()
      .then((d) => { if (alive) { setVotes(d.votes ?? []); setNoms(d.nominations ?? []); } })
      .catch(() => { if (alive) { setVotes([]); setNoms([]); } });
    return () => { alive = false; };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[92vw] sm:max-w-md bg-[#151515] border-black/10 p-0 gap-0">
        <SheetHeader className="p-5 border-b border-black/10">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Vote className="w-5 h-5 text-[#ff3650]" /> 我的投票与提名
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          <Tabs defaultValue="votes" variant="segment">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="votes" className="w-full">我的投票</TabsTrigger>
              <TabsTrigger value="nominations" className="w-full">我的提名</TabsTrigger>
            </TabsList>

            <TabsContent value="votes" className="mt-4 space-y-2.5">
              {votes === null ? (
                <div className="py-10 flex justify-center"><Loader variant="dots" size={24} label="加载中" className="text-[#ff3650]" /></div>
              ) : votes.length === 0 ? (
                <div className="py-12 text-center text-black/40">
                  <Vote className="w-8 h-8 mx-auto mb-2 text-black/20" />
                  <p className="text-sm font-bold">还没有投票</p>
                </div>
              ) : (
                votes.map((v) => <VoteRow key={v.filmId} v={v} />)
              )}
            </TabsContent>

            <TabsContent value="nominations" className="mt-4 space-y-2.5">
              {noms === null ? (
                <div className="py-10 flex justify-center"><Loader variant="dots" size={24} label="加载中" className="text-[#ff3650]" /></div>
              ) : noms.length === 0 ? (
                <div className="py-12 text-center text-black/40">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-black/20" />
                  <p className="text-sm font-bold">还没有提名</p>
                </div>
              ) : (
                noms.map((n) => <NominationRow key={n.id} n={n} />)
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t border-black/10">
          <button
            onClick={() => { setOpen(false); navigate('/profile'); }}
            className="w-full text-center text-xs font-bold text-black/50 hover:text-[#ff3650] transition-colors cursor-pointer"
          >
            查看完整个人资料 →
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
