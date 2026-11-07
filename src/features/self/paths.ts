export const JOURNAL_PATH = '/daily/journal';
export const JOURNAL_HISTORY_PATH = '/daily/journal/history';
export const REFLECTION_PATH = '/daily/reflection';
export const READING_PATH = '/daily/reading';
export const NEW_BOOK_PATH = '/daily/reading/new';

export const bookPath = (id: string) => `${READING_PATH}/${id}`;
export const bookEditPath = (id: string) => `${READING_PATH}/${id}/edit`;
