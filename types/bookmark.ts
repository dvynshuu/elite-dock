export type BookmarkTagView = {
  tag: {
    id: string;
    name: string;
  };
};

export type FolderView = {
  id: string;
  name: string;
  color: string;
  _count?: { bookmarks: number };
};

export type CollectionView = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  publicSlug: string | null;
  _count?: { bookmarks: number };
};

export type BookmarkView = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  notes: string | null;
  favicon: string | null;
  thumbnail: string | null;
  siteName: string | null;
  isFavorite: boolean;
  isDeleted: boolean;
  visitedCount: number;
  createdAt: string;
  folderId: string | null;
  folder: FolderView | null;
  tags: BookmarkTagView[];
};
