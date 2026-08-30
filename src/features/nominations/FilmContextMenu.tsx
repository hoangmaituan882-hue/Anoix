import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Copy, Heart } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '../../components/ui/context-menu';
import { useToast } from '../../components/ui/Toast';
import { community } from '../../lib/community';

/**
 * Right-click (long-press on touch) context menu for a film card: view detail,
 * nominate, or copy the title. Wraps any card element as its trigger.
 */
export const FilmContextMenu: React.FC<{
  filmId: string;
  title: string;
  children: React.ReactNode;
  onNominate?: () => void;
  extra?: React.ReactNode;
  key?: React.Key;
}> = ({ filmId, title, children, onNominate, extra }) => {
  const navigate = useNavigate();
  const { success } = useToast();

  const copyTitle = async () => {
    try {
      await navigator.clipboard.writeText(title);
      success(`已复制「${title}」`);
    } catch {
      success(title);
    }
  };

  const toggleFavorite = async () => {
    try {
      await community.addFavorite(filmId);
      success(`已收藏「${title}」`);
    } catch {
      success(`已收藏「${title}」`);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52 bg-[#1d1d1f] border-black/10 text-white">
        {filmId && (
          <ContextMenuItem
            onClick={() => navigate(`/films/${filmId}`, { viewTransition: true })}
            className="focus:bg-white/10 focus:text-white"
          >
            <Eye className="text-[#ff3650]" /> 查看详情
          </ContextMenuItem>
        )}
        {onNominate && (
          <ContextMenuItem onClick={onNominate} className="focus:bg-white/10 focus:text-white">
            <Plus className="text-[#e0fe3d]" /> 提名这部
          </ContextMenuItem>
        )}
        {filmId && (
          <ContextMenuItem onClick={toggleFavorite} className="focus:bg-white/10 focus:text-white">
            <Heart className="text-[#ff3650]" /> 收藏
          </ContextMenuItem>
        )}
        {extra}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={copyTitle} className="focus:bg-white/10 focus:text-white">
          <Copy className="text-black/50" /> 复制标题
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
