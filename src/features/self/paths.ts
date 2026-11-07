export const JOURNAL_PATH = '/daily/journal';
export const JOURNAL_HISTORY_PATH = '/daily/journal/history';
export const REFLECTION_PATH = '/daily/reflection';
export const READING_PATH = '/daily/reading';
export const NEW_BOOK_PATH = '/daily/reading/new';
export const TIMER_PATH = '/daily/timer';
export const PHOTOS_PATH = '/daily/photos';
export const PHOTO_COMPARE_PATH = '/daily/photos/compare';

export const bookPath = (id: string) => `${READING_PATH}/${id}`;
export const bookEditPath = (id: string) => `${READING_PATH}/${id}/edit`;
export const photoPath = (id: string) => `${PHOTOS_PATH}/${id}`;
export const comparePath = (first: string, second: string) =>
  `${PHOTO_COMPARE_PATH}?a=${encodeURIComponent(first)}&b=${encodeURIComponent(second)}`;
