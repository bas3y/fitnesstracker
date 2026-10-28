export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

/** Teilen-Dialog (Handy: z. B. in Dateien/Drive speichern), sonst normaler Download */
export async function shareOrDownload(file: File): Promise<ShareResult> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // andere Fehler (z. B. nicht erlaubt) → Download versuchen
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
