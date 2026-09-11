import { ArrowDownTrayIcon, DocumentIcon, EyeIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const previewableExtensions = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt', 'json', 'xml', 'html', 'htm']);

export const canPreviewFile = (fileName = '') => previewableExtensions.has(fileName.split('.').pop()?.toLowerCase());

export default function FileActionModal({ item, onClose, onPreview, onDownload, isWorking }) {
  if (!item) return null;
  const canPreview = canPreviewFile(item.name);
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(item.name.split('.').pop()?.toLowerCase());

  return <dialog open className="modal modal-middle" onClick={onClose} aria-labelledby="file-action-title">
    <div className="modal-box max-w-md" onClick={(event) => event.stopPropagation()}>
      <button className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3" onClick={onClose} aria-label="Close"><XMarkIcon className="size-5" /></button>
      <div className="flex gap-4 pr-8"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-base-200">{isImage ? <PhotoIcon className="size-5" /> : <DocumentIcon className="size-5" />}</span><div className="min-w-0"><h2 id="file-action-title" className="text-lg font-semibold">{item.name}</h2><p className="mt-1 text-sm leading-6 text-base-content/60">Choose what you want to do with this file.</p></div></div>
      <div className="modal-action mt-7 flex-col gap-2 sm:flex-row">{canPreview && <button className="btn btn-ghost sm:flex-1" disabled={isWorking} onClick={onPreview}><EyeIcon className="size-4" />Preview</button>}<button className="btn btn-primary sm:flex-1" disabled={isWorking} onClick={onDownload}>{isWorking ? <span className="loading loading-spinner loading-xs" /> : <ArrowDownTrayIcon className="size-4" />}Download</button></div>
      {!canPreview && <p className="mt-4 text-xs text-base-content/45">A preview is not available for this file type, but you can download it.</p>}
    </div>
    <form method="dialog" className="modal-backdrop"><button aria-label="Close">close</button></form>
  </dialog>;
}
