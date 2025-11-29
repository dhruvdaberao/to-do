
import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: string[];
  setItems: (items: string[]) => void;
}

const TodoModal: React.FC<TodoModalProps> = ({ isOpen, onClose, items, setItems }) => {
  const [newItem, setNewItem] = useState('');

  if (!isOpen) return null;

  const handleAddItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      
      {/* Quirky Theme Card - Matches Sticker Menu */}
      <div className="relative w-full max-w-md bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-xl overflow-hidden flex flex-col max-h-[80vh] transform -rotate-1">
        
        {/* Header - Yellow */}
        <div className="bg-yellow-400 p-4 border-b-4 border-slate-900 flex justify-between items-center relative z-10">
             <h2 className="font-marker text-3xl text-slate-900 tracking-wide">Bucket List</h2>
             <button 
                onClick={onClose} 
                className="hover:bg-black/10 p-1 rounded-full transition-colors"
             >
                <X size={28} strokeWidth={2.5} className="text-slate-900" />
             </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-grid-pattern">
            {items.length === 0 ? (
                <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                    <span className="text-4xl">✨</span>
                    <span className="font-hand text-xl font-bold text-slate-500">Empty page... <br/> Add a dream!</span>
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-start justify-between bg-white border-2 border-slate-900 p-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,0.1)] group hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-all">
                            <span className="font-hand text-xl text-slate-800 break-words w-full pr-2 leading-tight font-bold">{item}</span>
                            <button 
                                onClick={() => handleRemoveItem(index)}
                                className="text-slate-300 hover:text-rose-500 transition-colors pt-0.5"
                            >
                                <Trash2 size={20} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* Footer Input */}
        <div className="p-4 bg-white border-t-4 border-slate-900 z-10">
             <form onSubmit={handleAddItem} className="flex gap-3">
                <input 
                    type="text" 
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="New adventure..."
                    className="flex-1 bg-slate-50 border-2 border-slate-900 rounded-lg px-4 py-2 font-hand text-xl font-bold focus:bg-yellow-50 focus:outline-none placeholder:text-slate-400 placeholder:font-normal transition-colors"
                    autoFocus
                />
                <button 
                    type="submit"
                    disabled={!newItem.trim()}
                    className="bg-slate-900 text-yellow-400 px-3 py-2 rounded-lg border-2 border-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_#facc15]"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
             </form>
        </div>

      </div>
    </div>
  );
};

export default TodoModal;
