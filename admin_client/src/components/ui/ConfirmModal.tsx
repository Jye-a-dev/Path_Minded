import React from "react";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  isDanger?: boolean;
  requirePromptText?: string;
  promptValue?: string;
  onPromptValueChange?: (value: string) => void;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDanger = false,
  requirePromptText,
  promptValue = "",
  onPromptValueChange,
  onConfirm,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
          {message}
        </p>

        {requirePromptText && onPromptValueChange && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nhập <span className="font-mono text-rose-400 font-extrabold">"{requirePromptText}"</span> để xác nhận:
            </label>
            <input
              type="text"
              value={promptValue}
              onChange={(e) => onPromptValueChange(e.target.value)}
              placeholder={`Nhập ${requirePromptText}...`}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-rose-500 focus:outline-none transition-all font-mono"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {cancelText !== null && cancelText !== "" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              {cancelText || "Hủy"}
            </button>
          )}
          <button
            type="button"
            disabled={
              requirePromptText !== undefined &&
              promptValue !== requirePromptText
            }
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all cursor-pointer ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600"
                : "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
