import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";

interface CreateWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

export const CreateWatchlistModal: React.FC<CreateWatchlistModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreate(name.trim(), desc.trim());
      setName("");
      setDesc("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#12141c] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Create New Watchlist
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 font-mono mb-1.5">
              Watchlist Name
            </label>
            <input
              type="text"
              placeholder="e.g. Banking Momentum, Smallcap Breakouts"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 font-mono mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. High-beta swing setups for Q3"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Creating..." : "Create Watchlist"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
