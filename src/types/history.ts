export interface HistoryEra {
  id: string;
  period: string;
  name: string;
  nameZh: string;
  nameEn: string;
  tagline: string;
  taglineZh: string;
  summary: string;
  summaryZh: string;
  accentColor: string;
  milestones: HistoryMilestone[];
}

export interface HistoryMilestone {
  year: string;
  dateStr?: string;
  title: string;
  titleZh: string;
  category: 'founding' | 'tv_anime' | 'movie' | 'global' | 'award' | 'collab';
  categoryLabel: string;
  categoryLabelZh: string;
  description: string;
  descriptionZh: string;
  filmId?: string;
  director?: string;
  directorZh?: string;
  highlightStats?: { label: string; labelZh: string; value: string };
  image?: string;
}

export interface StudioStats {
  yearsActive: number;
  totalWorks: number;
  totalTvSeries: number;
  theatricalFilms: number;
  globalNominations: number;
  majorAwards: number;
  genreBreakdown: {
    genre: string;
    genreZh: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  formatBreakdown: {
    format: string;
    formatZh: string;
    count: number;
  }[];
  directorStats: {
    name: string;
    nameZh: string;
    role: string;
    roleZh: string;
    worksCount: number;
    iconicWork: string;
    iconicWorkZh: string;
    filmId?: string;
    avatarUrl?: string;
  }[];
}
