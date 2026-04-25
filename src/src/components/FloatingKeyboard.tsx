import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, ChevronDown, Delete, ArrowUp, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

const TELEX_MAP: [RegExp, string][] = [
  [/aa/g, 'â'], [/aw/g, 'ă'], [/ee/g, 'ê'], [/oo/g, 'ô'], [/ow/g, 'ơ'], [/uw/g, 'ư'], [/wi/g, 'ưi'], [/dd/g, 'đ'],
  [/AA/g, 'Â'], [/AW/g, 'Ă'], [/EE/g, 'Ê'], [/OO/g, 'Ô'], [/OW/g, 'Ơ'], [/UW/g, 'Ư'], [/WI/g, 'ƯI'], [/DD/g, 'Đ'],
  [/as/g, 'á'], [/af/g, 'à'], [/ar/g, 'ả'], [/ax/g, 'ã'], [/aj/g, 'ạ'],
  [/As/g, 'Á'], [/Af/g, 'À'], [/Ar/g, 'Ả'], [/Ax/g, 'Ã'], [/Aj/g, 'Ạ'],
  [/ăs/g, 'ắ'], [/ăf/g, 'ằ'], [/ăr/g, 'ẳ'], [/ăx/g, 'ẵ'], [/ăj/g, 'ặ'],
  [/Ăs/g, 'Ắ'], [/Ăf/g, 'Ằ'], [/Ăr/g, 'Ẳ'], [/Ăx/g, 'Ẵ'], [/Ăj/g, 'Ặ'],
  [/âs/g, 'ấ'], [/âf/g, 'ầ'], [/âr/g, 'ẩ'], [/âx/g, 'ẫ'], [/âj/g, 'ậ'],
  [/Âs/g, 'Ấ'], [/Âf/g, 'Ầ'], [/Âr/g, 'Ẩ'], [/Âx/g, 'Ẫ'], [/Âj/g, 'Ậ'],
  [/es/g, 'é'], [/ef/g, 'è'], [/er/g, 'ẻ'], [/ex/g, 'ẽ'], [/ej/g, 'ẹ'],
  [/Es/g, 'É'], [/Ef/g, 'È'], [/Er/g, 'Ẻ'], [/Ex/g, 'Ẽ'], [/Ej/g, 'Ẹ'],
  [/ês/g, 'ế'], [/êf/g, 'ề'], [/êr/g, 'ể'], [/êx/g, 'ễ'], [/êj/g, 'ệ'],
  [/Ês/g, 'Ế'], [/Êf/g, 'Ề'], [/Êr/g, 'Ể'], [/Êx/g, 'Ễ'], [/Êj/g, 'Ệ'],
  [/is/g, 'í'], [/if/g, 'ì'], [/ir/g, 'ỉ'], [/ix/g, 'ĩ'], [/ij/g, 'ị'],
  [/Is/g, 'Í'], [/If/g, 'Ì'], [/Ir/g, 'Ỉ'], [/Ix/g, 'Ĩ'], [/Ij/g, 'Ị'],
  [/os/g, 'ó'], [/of/g, 'ò'], [/or/g, 'ỏ'], [/ox/g, 'õ'], [/oj/g, 'ọ'],
  [/Os/g, 'Ó'], [/Of/g, 'Ò'], [/Or/g, 'Ỏ'], [/Ox/g, 'Õ'], [/Oj/g, 'Ọ'],
  [/ôs/g, 'ố'], [/ôf/g, 'ồ'], [/ôr/g, 'ổ'], [/ôx/g, 'ỗ'], [/ôj/g, 'ộ'],
  [/Ôs/g, 'Ố'], [/Ôf/g, 'Ồ'], [/Ôr/g, 'Ổ'], [/Ôx/g, 'Ỗ'], [/Ôj/g, 'Ộ'],
  [/ơs/g, 'ớ'], [/ơf/g, 'ờ'], [/ơr/g, 'ở'], [/ơx/g, 'ỡ'], [/ơj/g, 'ợ'],
  [/Ơs/g, 'Ớ'], [/Ơf/g, 'Ờ'], [/Ơr/g, 'Ở'], [/Ơx/g, 'Ỡ'], [/Ơj/g, 'Ợ'],
  [/us/g, 'ú'], [/uf/g, 'ù'], [/ur/g, 'ủ'], [/ux/g, 'ũ'], [/uj/g, 'ụ'],
  [/Us/g, 'Ú'], [/Uf/g, 'Ù'], [/Ur/g, 'Ủ'], [/Ux/g, 'Ũ'], [/Uj/g, 'Ụ'],
  [/ưs/g, 'ứ'], [/ưf/g, 'ừ'], [/ưr/g, 'ử'], [/ưx/g, 'ữ'], [/ưj/g, 'ự'],
  [/Ưs/g, 'Ứ'], [/Ưf/g, 'Ừ'], [/Ưr/g, 'Ử'], [/Ưx/g, 'Ữ'], [/Ưj/g, 'Ự'],
  [/ys/g, 'ý'], [/yf/g, 'ỳ'], [/yr/g, 'ỷ'], [/yx/g, 'ỹ'], [/yj/g, 'ỵ'],
  [/Ys/g, 'Ý'], [/Yf/g, 'Ỳ'], [/Yr/g, 'Ỷ'], [/Yx/g, 'Ỹ'], [/Yj/g, 'Ỵ'],
];

function applyTelex(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [regex, replacement] of TELEX_MAP) {
    result = result.replace(regex, replacement);
  }
  return result;
}

const LAYOUT_EN = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '{backspace}']
];

const LAYOUT_NUM = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  ['.', ',', '?', '!', "'", '{backspace}']
];

export function FloatingKeyboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const [isNum, setIsNum] = useState(false);
  const [isVn, setIsVn] = useState(true);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.target.type !== 'date' && e.target.type !== 'time' && e.target.type !== 'file') {
          setActiveInput(e.target);
        }
      }
    };
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (!activeInput) return;

    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const currentVal = activeInput.value;

    let newVal = currentVal;
    let newCursorPos = start;

    if (key === '{backspace}') {
      if (start === end && start > 0) {
        newVal = currentVal.substring(0, start - 1) + currentVal.substring(end);
        newCursorPos = start - 1;
      } else {
        newVal = currentVal.substring(0, start) + currentVal.substring(end);
        newCursorPos = start;
      }
    } else if (key === '{space}') {
      newVal = currentVal.substring(0, start) + ' ' + currentVal.substring(end);
      newCursorPos = start + 1;
    } else if (key === '{shift}') {
      setIsShift(!isShift);
      return;
    } else if (key === '{num}') {
      setIsNum(!isNum);
      return;
    } else if (key === '{lang}') {
      setIsVn(!isVn);
      return;
    } else if (key === '{enter}') {
        activeInput.blur();
        setIsOpen(false);
        return;
    } else {
      let char = isShift ? key.toUpperCase() : key.toLowerCase();
      
      if (isVn && /[a-zA-Z]/.test(key)) {
        const beforeCursor = currentVal.substring(0, start);
        const afterCursor = currentVal.substring(end);
        const lastSpaceIdx = beforeCursor.lastIndexOf(' ');
        const prefix = lastSpaceIdx === -1 ? '' : beforeCursor.substring(0, lastSpaceIdx + 1);
        let word = lastSpaceIdx === -1 ? beforeCursor : beforeCursor.substring(lastSpaceIdx + 1);
        
        word += char;
        const newWord = applyTelex(word);
        
        newVal = prefix + newWord + afterCursor;
        newCursorPos = start + (newWord.length - (word.length - 1));
      } else {
        newVal = currentVal.substring(0, start) + char + currentVal.substring(end);
        newCursorPos = start + char.length;
      }
      
      if (isShift) setIsShift(false);
    }

    activeInput.value = newVal;
    activeInput.setSelectionRange(newCursorPos, newCursorPos);
    
    // Set value natively so React detects onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
    )?.set;
    if (nativeInputValueSetter && activeInput instanceof HTMLInputElement) {
        nativeInputValueSetter.call(activeInput, newVal);
    }

    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
    )?.set;
    if (nativeTextareaValueSetter && activeInput instanceof HTMLTextAreaElement) {
        nativeTextareaValueSetter.call(activeInput, newVal);
    }

    const event = new Event('input', { bubbles: true });
    activeInput.dispatchEvent(event);
    
    activeInput.focus();

  }, [activeInput, isShift, isVn]);

  const displayLayout = isNum ? LAYOUT_NUM : LAYOUT_EN;

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        className="fixed right-6 bottom-6 z-[100] w-14 h-14 rounded-full bg-neon-blue text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)] cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
        whileDrag={{ scale: 1.1 }}
      >
        <Keyboard size={24} />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[100] bg-black/95 backdrop-blur-xl border-t border-white/10 p-2 md:p-4 pb-8 shadow-2xl select-none"
            onPointerDown={(e) => e.preventDefault()}
          >
            <div className="max-w-4xl mx-auto flex flex-col gap-2">
              <div className="flex justify-between items-center px-4 mb-2">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-400">
                        {activeInput ? 'Đang nhập...' : 'Chưa chọn ô nhập liệu'}
                    </span>
                    {isVn && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">VN TELEX</span>}
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"
                >
                  <ChevronDown size={24} />
                </button>
              </div>

              {displayLayout.map((row, i) => (
                <div key={i} className="flex justify-center gap-1.5 md:gap-2">
                  {row.map(key => {
                    let label: React.ReactNode = key;
                    let widthClass = "flex-1 max-w-[45px] md:max-w-[60px]";
                    
                    if (key === '{shift}') {
                      label = <ArrowUp size={18} />;
                      widthClass = "flex-[1.5] max-w-[65px] md:max-w-[80px]";
                    } else if (key === '{backspace}') {
                      label = <Delete size={18} />;
                      widthClass = "flex-[1.5] max-w-[65px] md:max-w-[80px]";
                    } else {
                      label = isShift ? key.toUpperCase() : key;
                    }

                    return (
                      <button
                        key={key}
                        onPointerDown={(e) => {
                            e.preventDefault();
                            handleKeyPress(key);
                        }}
                        className={cn(
                          "h-12 md:h-14 bg-white/10 hover:bg-white/20 active:bg-neon-blue active:text-black rounded-lg md:rounded-xl text-lg md:text-xl font-bold flex items-center justify-center transition-colors shadow-sm",
                          widthClass,
                          key === '{shift}' && isShift ? "bg-neon-blue text-black" : ""
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ))}
              
              <div className="flex justify-center gap-1.5 md:gap-2 mt-1">
                <button 
                  onPointerDown={(e) => { e.preventDefault(); handleKeyPress('{num}'); }}
                  className="w-16 md:w-24 h-12 md:h-14 bg-white/10 hover:bg-white/20 active:bg-neon-blue rounded-lg md:rounded-xl text-xs font-bold transition-colors uppercase"
                >
                  {isNum ? 'ABC' : '?123'}
                </button>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); handleKeyPress('{lang}'); }}
                  className="w-12 md:w-16 h-12 md:h-14 bg-white/10 hover:bg-white/20 active:bg-neon-blue rounded-lg md:rounded-xl flex items-center justify-center transition-colors"
                  title="Chuyển ngôn ngữ"
                >
                  <Globe size={18} className={isVn ? "text-neon-blue" : "text-gray-400"} />
                  <span className="text-[10px] ml-1 font-bold">{isVn ? 'VN' : 'EN'}</span>
                </button>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); handleKeyPress('{space}'); }}
                  className="flex-[3] max-w-[300px] md:max-w-[500px] h-12 md:h-14 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg md:rounded-xl text-sm font-bold flex items-center justify-center transition-colors uppercase"
                >
                  Khoảng trống
                </button>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); handleKeyPress('{enter}'); }}
                  className="flex-[1] max-w-[80px] md:max-w-[100px] h-12 md:h-14 bg-neon-blue/20 text-neon-blue hover:bg-neon-blue hover:text-black active:bg-neon-blue/80 rounded-lg md:rounded-xl text-xs md:text-sm font-bold flex items-center justify-center transition-colors uppercase"
                >
                  Xong
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
