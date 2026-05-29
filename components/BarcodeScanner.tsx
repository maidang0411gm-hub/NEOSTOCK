import React, { useEffect, useRef, useState } from 'react';
import { X, Scan, Plus, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  scannerMode: 'normal' | 'quick-in' | 'quick-out';
  sessionHistory?: { id: string; name: string; sku: string; type: 'in' | 'out'; quantity: number; timestamp: string }[];
  quickQuantity: number;
  setQuickQuantity: (qty: number) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  onClose, 
  scannerMode, 
  sessionHistory = [],
  quickQuantity,
  setQuickQuantity
}) => {
  const [sku, setSku] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the input field when the modal opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sku.trim()) {
      onScan(sku.trim());
      setSku(''); // Clear for next scan
    }
  };

  const isQuickMode = scannerMode === 'quick-in' || scannerMode === 'quick-out';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={cn(
        "glass rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(0,242,255,0.2)] transition-all duration-300",
        isQuickMode ? "w-full max-w-2xl" : "w-full max-w-md"
      )}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center">
              <Scan className="text-neon-blue" size={20} />
            </div>
            <h3 className="text-xl font-bold neon-text">
              {scannerMode === 'quick-in' ? 'Nhập kho nhanh' : scannerMode === 'quick-out' ? 'Xuất kho nhanh' : 'Nhập mã vạch'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={cn("p-8", isQuickMode ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "")}>
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Quét mã hoặc nhập SKU..." 
                  className="w-full glass p-6 rounded-2xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all placeholder:text-gray-600"
                  autoFocus
                />
                <div className="absolute inset-0 rounded-2xl pointer-events-none border border-neon-blue/20 group-focus-within:border-neon-blue/50 transition-colors"></div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                  Sử dụng máy quét mã vạch hoặc nhập tay và nhấn <span className="text-neon-blue font-bold">Enter</span>
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></div>
                  Đang chờ tín hiệu máy quét...
                </div>
              </div>

              {isQuickMode && (
                <div className="space-y-4 p-5 glass border-neon-blue/20 rounded-2xl bg-neon-blue/5">
                  <label className="text-xs font-bold text-neon-blue uppercase tracking-[0.2em] block text-center">
                    Số lượng mỗi lần quét
                  </label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => setQuickQuantity(Math.max(1, quickQuantity - 1))}
                      className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all active:scale-90 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                      title="Giảm số lượng"
                    >
                      <Minus size={28} strokeWidth={3} />
                    </button>
                    
                    <div className="relative min-w-[80px]">
                      <input
                        type="number"
                        value={quickQuantity}
                        onChange={(e) => setQuickQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-transparent text-center text-4xl font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-neon-blue/30 rounded-full"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setQuickQuantity(quickQuantity + 1)}
                      className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-all active:scale-90 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                      title="Tăng số lượng"
                    >
                      <Plus size={28} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-neon-blue text-black font-bold rounded-2xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-95"
              >
                XÁC NHẬN MÃ
              </button>
            </form>
          </div>

          {isQuickMode && (
            <div className="glass border-white/5 rounded-2xl overflow-hidden flex flex-col h-[300px]">
              <div className="p-4 border-b border-white/10 bg-white/5">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-blue"></div>
                  Lịch sử quét phiên này
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {sessionHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs gap-2 opacity-50">
                    <Scan size={32} />
                    <p>Chưa có sản phẩm nào được quét</p>
                  </div>
                ) : (
                  sessionHistory.map((item, idx) => (
                    <div key={`scan-${item.id}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 animate-in fade-in slide-in-from-right-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm truncate max-w-[150px]">{item.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{item.sku}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          item.type === 'in' ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"
                        )}>
                          {item.type === 'in' ? `+${item.quantity}` : `-${item.quantity}`}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
