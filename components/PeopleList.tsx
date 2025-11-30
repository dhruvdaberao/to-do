
import React from 'react';
import { X, User } from 'lucide-react';

interface PeopleListProps {
  isOpen: boolean;
  onClose: () => void;
  members: string[];
}

const PeopleList: React.FC<PeopleListProps> = ({ isOpen, onClose, members }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
         <div className="bg-sky-200 p-4 border-b-4 border-slate-900 flex justify-between items-center">
            <h3 className="font-marker text-2xl">Who's Here?</h3>
            <button onClick={onClose}><X size={24} /></button>
         </div>
         <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
            {members.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
                    <div className="bg-slate-900 text-white p-2 rounded-full"><User size={16} /></div>
                    <span className="font-hand font-bold text-xl">{m}</span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default PeopleList;
