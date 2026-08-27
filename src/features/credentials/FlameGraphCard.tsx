import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, Sparkles } from 'lucide-react';

export interface FlameFrame {
  id: string;
  name: string;
  codeName: string;
  start: number;     // 0 to 100 relative to root
  width: number;     // percentage width (0 to 100)
  depth: number;     // 0 (bottom: main) to 4 (top: shallow)
  color: string;     // Exact flame gradient color
  parentId?: string;
  durationMs: number;
  sequenceIndex: number;
  columnIndex: number; // 0 for leftmost, 1 for middle, 2 for rightmost in the row
  category: string;
  description: string;
}

// 1:1 Exact Data with Coupled Chain-Reaction Neighborhood Coordinates
const FLAME_DATA: FlameFrame[] = [
  // Depth 0: Root (100% total)
  {
    id: 'main',
    name: '主执行流',
    codeName: 'main',
    start: 0,
    width: 100,
    depth: 0,
    color: '#e88700', // deep warm flame orange
    durationMs: 246,
    sequenceIndex: 0,
    columnIndex: 0,
    category: '根周期执行',
    description: '放映主线程完整生命周期与渲染调用总耗时',
  },

  // Depth 1:
  // renderApp (col 0, 60%) -> pushes fetchOrders (col 1, 29%) -> pushes runMicrotasks (col 2, 9.4%)
  {
    id: 'renderApp',
    name: '应用渲染',
    codeName: 'renderApp',
    start: 0,
    width: 60,
    depth: 1,
    color: '#ef9206', // warm rich orange
    parentId: 'main',
    durationMs: 148,
    sequenceIndex: 1,
    columnIndex: 0,
    category: '组件生命周期',
    description: '虚拟 DOM 生成、状态分发与组件树渲染调度',
  },
  {
    id: 'fetchOrders',
    name: '数据拉取',
    codeName: 'fetchOrders',
    start: 60.8,
    width: 29,
    depth: 1,
    color: '#fab81c', // golden amber
    parentId: 'main',
    durationMs: 70,
    sequenceIndex: 4,
    columnIndex: 1,
    category: '网络请求与存储',
    description: '放映档案网络请求、缓存同步与状态持久化',
  },
  {
    id: 'runMicrotasks',
    name: '微任务',
    codeName: 'runMicrotasks',
    start: 90.6,
    width: 9.4,
    depth: 1,
    color: '#fee27f', // pale warm yellow
    parentId: 'main',
    durationMs: 28,
    sequenceIndex: 7,
    columnIndex: 2,
    category: '异步队列调度',
    description: 'Promise 响应回调与微任务队列排空处理',
  },

  // Depth 2:
  // reconcile (col 0, 39%) -> pushes commitWork (col 1, 20.2%)
  // parseJSON (col 2, 18.5%) -> pushes normalize (col 3, 9.7%)
  {
    id: 'reconcile',
    name: '视图比对',
    codeName: 'reconcile',
    start: 0,
    width: 39,
    depth: 2,
    color: '#f6aa12', // amber yellow
    parentId: 'renderApp',
    durationMs: 91,
    sequenceIndex: 2,
    columnIndex: 0,
    category: '节点差异比对',
    description: 'Fiber 树对比算法与变更节点标记',
  },
  {
    id: 'commitWork',
    name: 'DOM提交',
    codeName: 'commitWork',
    start: 39.8,
    width: 20.2,
    depth: 2,
    color: '#f8ba1e', // golden yellow
    parentId: 'renderApp',
    durationMs: 38,
    sequenceIndex: 3,
    columnIndex: 1,
    category: '视图副作用执行',
    description: '真实 DOM 节点挂载、属性写入与副作用执行',
  },
  {
    id: 'parseJSON',
    name: 'JSON解析',
    codeName: 'parseJSON',
    start: 60.8,
    width: 18.5,
    depth: 2,
    color: '#f8ca2d', // warm yellow
    parentId: 'fetchOrders',
    durationMs: 43,
    sequenceIndex: 5,
    columnIndex: 2,
    category: '数据反序列化',
    description: '放映数据流反序列化与实体结构类型映射',
  },
  {
    id: 'normalize',
    name: '数据规范化',
    codeName: 'normalize',
    start: 80.1,
    width: 9.7,
    depth: 2,
    color: '#fde06d', // light yellow
    parentId: 'fetchOrders',
    durationMs: 21,
    sequenceIndex: 6,
    columnIndex: 3,
    category: '数据清洗转换',
    description: '实体字典扁平化与状态规范化存储',
  },

  // Depth 3:
  // diffProps (col 0, 24%) -> pushes createFiber (col 1, 14.2%)
  // applyStyles (col 2, 20.2%)
  {
    id: 'diffProps',
    name: '属性对比',
    codeName: 'diffProps',
    start: 0,
    width: 24,
    depth: 3,
    color: '#f8c728', // gold yellow
    parentId: 'reconcile',
    durationMs: 52,
    sequenceIndex: 2,
    columnIndex: 0,
    category: '浅层属性 Diff',
    description: '卡片属性浅比较与轻量更新计划计算',
  },
  {
    id: 'createFiber',
    name: '创建节点',
    codeName: 'createFiber',
    start: 24.8,
    width: 14.2,
    depth: 3,
    color: '#fde57f', // soft yellow
    parentId: 'reconcile',
    durationMs: 27,
    sequenceIndex: 3,
    columnIndex: 1,
    category: 'Fiber 节点实例化',
    description: '节点对象内存分配与父子指针绑定',
  },
  {
    id: 'applyStyles',
    name: '应用样式',
    codeName: 'applyStyles',
    start: 39.8,
    width: 20.2,
    depth: 3,
    color: '#fde57f', // soft yellow
    parentId: 'commitWork',
    durationMs: 26,
    sequenceIndex: 4,
    columnIndex: 2,
    category: '样式计算与渲染',
    description: 'CSS 变量计算与 GPU 视差图层合成',
  },

  // Depth 4: Leaf
  {
    id: 'shallow',
    name: '浅比较',
    codeName: 'shallow',
    start: 0,
    width: 14,
    depth: 4,
    color: '#feea90', // lightest pale cream yellow
    parentId: 'diffProps',
    durationMs: 27,
    sequenceIndex: 2,
    columnIndex: 0,
    category: '引用等值校验',
    description: '对象引用浅层等值快速对比校验',
  },
];

// Transitions.dev Card Resize Standard Curve
const RESIZE_EASE = [0.22, 1, 0.36, 1] as const;

interface FlameGraphCardProps {
  className?: string;
}

export const FlameGraphCard: React.FC<FlameGraphCardProps> = ({ className = '' }) => {
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [hoveredFrame, setHoveredFrame] = useState<FlameFrame | null>(null);
  const [sampleCount, setSampleCount] = useState(246);
  const [isReRecording, setIsReRecording] = useState(false);
  const [recordKey, setRecordKey] = useState(0);

  // Active frame or root
  const activeFrame = useMemo(() => {
    if (!selectedFrameId) return null;
    return FLAME_DATA.find((f) => f.id === selectedFrameId) || null;
  }, [selectedFrameId]);

  // View bounds [viewStart, viewWidth] (0 to 100)
  const viewWindow = useMemo(() => {
    if (!activeFrame) return { start: 0, width: 100 };
    return {
      start: activeFrame.start,
      width: activeFrame.width,
    };
  }, [activeFrame]);

  // Breadcrumbs: "所有执行帧" > "应用渲染" > ...
  const breadcrumbs = useMemo(() => {
    if (!activeFrame) return ['所有执行帧'];
    const path: FlameFrame[] = [];
    let curr: FlameFrame | undefined = activeFrame;
    while (curr) {
      path.unshift(curr);
      curr = FLAME_DATA.find((f) => f.id === curr?.parentId);
    }
    return ['所有执行帧', ...path.map((p) => p.name)];
  }, [activeFrame]);

  // Re-record action: Coupled Mutual Squeeze Chain Reaction
  const handleReRecord = () => {
    if (isReRecording) return;
    setIsReRecording(true);
    setSelectedFrameId(null);
    setSampleCount(0);
    setRecordKey((prev) => prev + 1);

    let count = 0;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 22) + 12;
      if (count >= 246) {
        count = 246;
        clearInterval(interval);
        setIsReRecording(false);
      }
      setSampleCount(count);
    }, 60);
  };

  // Depth rows: [4, 3, 2, 1, 0] (top to bottom)
  const rows = [4, 3, 2, 1, 0];

  return (
    <div
      className={`w-full max-w-[700px] mx-auto rounded-[32px] p-6 sm:p-7 bg-[#f2f2f5] dark:bg-[#141414] border border-black/[0.06] dark:border-white/10 shadow-lg transition-colors select-none ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight">
            火焰图耗时分析
          </h3>
          {isReRecording && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-2 h-2 rounded-full bg-amber-500 animate-ping"
            />
          )}
        </div>

        <motion.div
          key={sampleCount === 246 ? 'done' : 'counting'}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-[#e4e4e9] dark:bg-white/10 text-[#4b5563] dark:text-[#d4d4d4] font-mono text-xs px-3.5 py-1 rounded-full font-medium shadow-xs"
        >
          <span>{sampleCount} 个采样样本</span>
        </motion.div>
      </div>

      {/* Inner White Stage / Graph Canvas */}
      <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] p-6 border border-black/[0.04] dark:border-white/5 shadow-xs relative overflow-hidden transition-colors">
        {/* Breadcrumbs & Dashed Line */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#737373] dark:text-[#888888] overflow-x-auto pb-0.5 scrollbar-none">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-neutral-400 dark:text-white/30">/</span>}
                <button
                  type="button"
                  onClick={() => {
                    if (idx === 0) {
                      setSelectedFrameId(null);
                    } else {
                      const matched = FLAME_DATA.find((f) => f.name === crumb);
                      if (matched) setSelectedFrameId(matched.id);
                    }
                  }}
                  className={`hover:underline cursor-pointer transition-colors ${
                    idx === breadcrumbs.length - 1
                      ? 'text-neutral-900 dark:text-white font-semibold'
                      : 'hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {crumb}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Minimal Dashed Horizontal Divider */}
          <div className="w-full border-b border-dashed border-[#e5e5e7] dark:border-[#222222] mt-3" />
        </div>

        {/* Flame Graph Rows with Coupled Neighbor Mutual Squeeze Physics */}
        <div className="relative w-full h-[180px] flex flex-col justify-between pt-1">
          {rows.map((depth) => {
            const depthFrames = FLAME_DATA.filter((f) => f.depth === depth);

            return (
              <div key={depth} className="relative w-full h-7 flex items-center">
                {depthFrames.map((frame) => {
                  // Calculate relative offset and width against active zoom window
                  const relStart = ((frame.start - viewWindow.start) / viewWindow.width) * 100;
                  const relWidth = (frame.width / viewWindow.width) * 100;

                  // Visibility check
                  const isVisible = relStart + relWidth > 0 && relStart < 100;
                  const isSelected = selectedFrameId === frame.id;
                  const isAncestor =
                    activeFrame &&
                    frame.start <= activeFrame.start &&
                    frame.start + frame.width >= activeFrame.start + activeFrame.width;

                  if (!isVisible && !isAncestor) return null;

                  const isLeftmost = frame.start === 0;

                  // Base timing for chain reaction
                  const baseDelay = frame.sequenceIndex * 0.095;

                  // Define dynamic multi-body displacement trajectories:
                  // Leftmost block overshoots rightward, shoving the next block.
                  // Column 1 gets shoved rightward (+16% ~ +22px), shoving Column 2 (+24px),
                  // then they bounce back leftward and oscillate into place!
                  const isCol1 = frame.columnIndex === 1;
                  const isCol2 = frame.columnIndex >= 2;

                  return (
                    <motion.button
                      key={`${frame.id}-${recordKey}`}
                      type="button"
                      layout="position"
                      initial={{
                        left: isLeftmost
                          ? '0%'
                          : isCol1
                          ? `${Math.max(0, relStart - 18)}%`
                          : `${Math.max(0, relStart - 12)}%`,
                        width: '0%',
                        x: isLeftmost ? 0 : isCol1 ? -24 : -16,
                        scaleY: 0.6,
                        opacity: 0,
                      }}
                      animate={{
                        left: `${Math.max(0, relStart)}%`,
                        width: `${Math.min(100, Math.max(2, relWidth))}%`,
                        x: 0,
                        scaleY: 1,
                        opacity: isVisible ? 1 : 0.15,
                      }}
                      whileHover={{
                        scaleY: 1.08,
                        scaleX: 1.01,
                        y: -1.5,
                        transition: { duration: 0.18, ease: RESIZE_EASE },
                      }}
                      whileTap={{
                        scaleY: 0.94,
                        transition: { duration: 0.1, ease: RESIZE_EASE },
                      }}
                      transition={{
                        // Left coordinate with coupled chain-reaction spring
                        left: {
                          type: 'spring',
                          stiffness: isLeftmost ? 500 : isCol1 ? 140 : 160,
                          damping: isLeftmost ? 35 : isCol1 ? 11 : 13, // low damping creates explicit mutual shove & overshoot
                          mass: isLeftmost ? 1.0 : 0.85,
                          delay: isLeftmost ? 0 : baseDelay * 0.88,
                        },
                        // Physical push-shove x-axis displacement
                        x: {
                          type: 'spring',
                          stiffness: isLeftmost ? 500 : 135,
                          damping: isLeftmost ? 35 : 10.5, // visible physical chain reaction bounce
                          mass: 0.85,
                          delay: baseDelay,
                        },
                        // Width expansion with squeeze compression
                        width: {
                          type: 'spring',
                          stiffness: isLeftmost ? 150 : 180,
                          damping: isLeftmost ? 12 : 14, // overshoots by ~18% into neighbor before pulling back
                          mass: 0.9,
                          delay: baseDelay,
                        },
                        // Vertical squash & stretch
                        scaleY: {
                          type: 'spring',
                          stiffness: 220,
                          damping: 10.5,
                          mass: 0.75,
                          delay: baseDelay + 0.04,
                        },
                        opacity: {
                          duration: 0.26,
                          delay: baseDelay * 0.7,
                        },
                        layout: {
                          duration: 0.45,
                          ease: RESIZE_EASE,
                        },
                      }}
                      style={{
                        backgroundColor: frame.color,
                        position: 'absolute',
                        transformOrigin: isLeftmost ? 'left center' : 'center center',
                      }}
                      onClick={() => {
                        if (selectedFrameId === frame.id) {
                          setSelectedFrameId(frame.parentId || null);
                        } else {
                          setSelectedFrameId(frame.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredFrame(frame)}
                      onMouseLeave={() => setHoveredFrame(null)}
                      className={`h-6.5 rounded-[5px] pl-2 pr-1.5 flex items-center justify-start text-[11px] font-sans font-medium text-[#1c1917] overflow-hidden shadow-xs cursor-pointer select-none ${
                        isSelected
                          ? 'ring-2 ring-black dark:ring-white z-20 shadow-md brightness-105'
                          : 'z-10'
                      }`}
                      title={`${frame.name} (${frame.codeName} · ${frame.durationMs}ms)`}
                    >
                      {/* Inner text with smooth sequential reveal */}
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: baseDelay + 0.18, duration: 0.28 }}
                        className="truncate leading-none tracking-tight pointer-events-none"
                      >
                        {frame.name}
                      </motion.span>
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Hover Tooltip Overlay */}
        <AnimatePresence>
          {hoveredFrame && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 3, scale: 0.96 }}
              transition={{ duration: 0.22, ease: RESIZE_EASE }}
              className="absolute bottom-2.5 left-4 right-4 bg-black/90 dark:bg-[#161616]/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs flex items-center justify-between pointer-events-none z-30 shadow-xl border border-white/10"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#f59e0b] font-mono">{hoveredFrame.name}</span>
                <span className="text-white/40">({hoveredFrame.codeName})</span>
                <span className="text-white/40">·</span>
                <span className="text-white/80">{hoveredFrame.category}</span>
              </div>
              <div className="font-mono text-white font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{hoveredFrame.durationMs}ms ({((hoveredFrame.durationMs / 246) * 100).toFixed(1)}%)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between mt-4 px-1">
        <span className="text-xs font-normal text-[#737373] dark:text-[#888888] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 opacity-80" />
          <span>{selectedFrameId ? '再次点击帧块以缩放复原' : '点击任意帧以放大聚焦'}</span>
        </span>

        {/* 1:1 Black Capsule "重新采样" Button */}
        <motion.button
          onClick={handleReRecord}
          disabled={isReRecording}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          className="bg-[#18181b] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black rounded-full px-4 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isReRecording ? 'animate-spin' : ''}`} />
          <span>重新采样</span>
        </motion.button>
      </div>
    </div>
  );
};
