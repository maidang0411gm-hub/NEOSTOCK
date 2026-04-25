import React, { useState, useEffect, useMemo, useRef, useDeferredValue, startTransition, Component } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  LayoutDashboard,
  Package,
  Plus,
  Minus,
  Scan,
  Search,
  AlertTriangle,
  TrendingUp,
  History,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  Filter,
  GripVertical,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Menu,
  Copy,
  Trash2,
  FileText,
  LogOut,
  Mail,
  Lock as LockIcon,
  User,
  Github,
  Edit2,
  ShoppingCart,
  PlusCircle,
  Info,
  Save,
  Calendar,
  Globe,
  ShoppingBag,
  Banknote,
  CreditCard,
  Percent,
  Keyboard,
  Image as ImageIcon,
  UploadCloud,
  Download,
  Link as LinkIcon,
  Activity,
  BarChart2,
  PieChart as PieChartIcon,
  Target,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Loader2,
  CheckCircle,
  Boxes
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  updateProfile
} from './lib/supabaseAdapter';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDocFromServer,
  Timestamp,
  writeBatch,
  orderBy
} from './lib/supabaseAdapter';
import { ref, uploadBytes, getDownloadURL } from './lib/supabaseAdapter';
import { createClient } from '@supabase/supabase-js';
import { auth, db, storage } from './lib/supabaseAdapter';
import { BarcodeScanner } from './components/BarcodeScanner';
import { FloatingKeyboard } from './components/FloatingKeyboard';
import { Product, Transaction } from './types';
import { cn } from './lib/utils';
import { fixVietnameseText, repairVietnameseUi } from './lib/fixVietnamese';

// Error handling for remote data operations
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface DataErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleDataError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DataErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Remote data error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function formatCurrency(amount: number) {
  return `${Number(amount || 0).toLocaleString('vi-VN')}₫`;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function sortProductsByOrder(items: Product[]) {
  return [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

// Auth Component
function AuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,242,255,0.3)] mb-4">
            <Package className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold neon-text tracking-tighter">NEOSTOCK</h2>
          <p className="text-gray-400">{isLogin ? 'Đăng nhập để quản lý kho hàng' : 'Tạo tài khoản mới'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Mật khẩu</label>
            <div className="relative">
              <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                placeholder="????????"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-black bg-neon-blue hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-95 disabled:opacity-50"
          >
            {loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ')}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm">
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-neon-blue font-bold hover:underline"
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

interface DirectCartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'amount' | 'percent';
  surcharge: number;
  surchargeType: 'amount' | 'percent';
}

interface DirectCart {
  items: DirectCartItem[];
  note: string;
  paymentMethod: 'cash' | 'transfer';
  cashReceived: number;
  isNoteOpen: boolean;
}

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export default function App() {
  const shippingCodePattern = /\[MV(?:\?|Đ): (.*?)\]/;
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'transactions' | 'history' | 'settings' | 'sales' | 'analytics'>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<'account' | 'data'>('account');
  const [salesSubTab, setSalesSubTab] = useState<'direct' | 'online'>('direct');
  const [historySubTab, setHistorySubTab] = useState<'all' | 'direct' | 'online' | 'inventory'>('all');
  const [inventoryHistorySubTab, setInventoryHistorySubTab] = useState<'retail' | 'batch'>('retail');
  const [inventoryListSubTab, setInventoryListSubTab] = useState<'retail' | 'batch'>('retail');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | 'custom'>('all');
  const [historyDateRange, setHistoryDateRange] = useState({ start: '', end: '' });
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom'>('30days');
  const [analyticsDateRange, setAnalyticsDateRange] = useState({ start: '', end: '' });
  const [expandedHistoryOrders, setExpandedHistoryOrders] = useState<Set<string>>(new Set());
  const [isSalesExpanded, setIsSalesExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('neostock_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('neostock_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const applyRepair = () => repairVietnameseUi();
    applyRepair();

    let scheduled = false;
    let animationFrameId = 0;
    const scheduleRepair = () => {
      if (scheduled) return;
      scheduled = true;
      animationFrameId = window.requestAnimationFrame(() => {
        scheduled = false;
        applyRepair();
      });
    };

    const observer = new MutationObserver(() => {
      scheduleRepair();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['title', 'placeholder', 'aria-label'],
    });

    const originalAlert = window.alert.bind(window);
    const originalConfirm = window.confirm.bind(window);

    window.alert = ((message?: string) => originalAlert(typeof message === 'string' ? fixVietnameseText(message) : message)) as typeof window.alert;
    window.confirm = ((message?: string) => originalConfirm(typeof message === 'string' ? fixVietnameseText(message) : message)) as typeof window.confirm;

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrameId);
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  const [onlineOrderSearchQuery, setOnlineOrderSearchQuery] = useState('');
  const [onlineDateFilter, setOnlineDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | 'custom'>('all');
  const [onlineDateRange, setOnlineDateRange] = useState({ start: '', end: '' });
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  // Separate Carts and Notes for Direct vs Online
  const createEmptyCart = (): DirectCart => ({
    items: [],
    note: '',
    paymentMethod: 'cash',
    cashReceived: 0,
    isNoteOpen: false
  });

  const [directCarts, setDirectCarts] = useState<DirectCart[]>([createEmptyCart()]);
  const [activeDirectCartIndex, setActiveDirectCartIndex] = useState(0);

  const [onlineCart, setOnlineCart] = useState<DirectCartItem[]>([]);
  const [onlineNote, setOnlineNote] = useState('');
  const [editingCartItem, setEditingCartItem] = useState<{ productId: string; quantity: number; price: number; discount: number; discountType: 'amount' | 'percent'; surcharge: number; surchargeType: 'amount' | 'percent' } | null>(null);

  // Helpers to get current tab data
  const currentDirectCart = directCarts[activeDirectCartIndex] || createEmptyCart();
  const cart = salesSubTab === 'direct' ? currentDirectCart.items : onlineCart;

  const setCart = (updater: any) => {
    if (salesSubTab === 'direct') {
      setDirectCarts(prev => {
        const newCarts = [...prev];
        const currentCart = newCarts[activeDirectCartIndex];
        const newItems = typeof updater === 'function' ? updater(currentCart.items) : updater;
        newCarts[activeDirectCartIndex] = { ...currentCart, items: newItems };
        return newCarts;
      });
    } else {
      setOnlineCart(updater);
    }
  };

  const currentNote = salesSubTab === 'direct' ? currentDirectCart.note : onlineNote;
  const setDirectNote = (valOrUpdater: string | ((prev: string) => string)) => {
    setDirectCarts(prev => {
      const newCarts = [...prev];
      const cart = newCarts[activeDirectCartIndex];
      const newVal = typeof valOrUpdater === 'function' ? valOrUpdater(cart.note) : valOrUpdater;
      newCarts[activeDirectCartIndex] = { ...cart, note: newVal };
      return newCarts;
    });
  };

  const directPaymentMethod = currentDirectCart.paymentMethod;
  const setDirectPaymentMethod = (valOrUpdater: 'cash' | 'transfer' | ((prev: 'cash' | 'transfer') => 'cash' | 'transfer')) => {
    setDirectCarts(prev => {
      const newCarts = [...prev];
      const cart = newCarts[activeDirectCartIndex];
      const newVal = typeof valOrUpdater === 'function' ? valOrUpdater(cart.paymentMethod) : valOrUpdater;
      newCarts[activeDirectCartIndex] = { ...cart, paymentMethod: newVal };
      return newCarts;
    });
  };

  const directCashReceived = currentDirectCart.cashReceived;
  const setDirectCashReceived = (valOrUpdater: number | ((prev: number) => number)) => {
    setDirectCarts(prev => {
      const newCarts = [...prev];
      const cart = newCarts[activeDirectCartIndex];
      const newVal = typeof valOrUpdater === 'function' ? valOrUpdater(cart.cashReceived) : valOrUpdater;
      newCarts[activeDirectCartIndex] = { ...cart, cashReceived: newVal };
      return newCarts;
    });
  };

  const isDirectNoteOpen = currentDirectCart.isNoteOpen;
  const setIsDirectNoteOpen = (valOrUpdater: boolean | ((prev: boolean) => boolean)) => {
    setDirectCarts(prev => {
      const newCarts = [...prev];
      const cart = newCarts[activeDirectCartIndex];
      const newVal = typeof valOrUpdater === 'function' ? valOrUpdater(cart.isNoteOpen) : valOrUpdater;
      newCarts[activeDirectCartIndex] = { ...cart, isNoteOpen: newVal };
      return newCarts;
    });
  };
  const currentTotal = useMemo(() => cart.reduce((sum, item) => {
    let price = item.unitPrice;
    if (item.discount > 0) {
      if (item.discountType === 'percent') price -= (item.unitPrice * item.discount / 100);
      else price -= item.discount;
    }
    if (item.surcharge > 0) {
      if (item.surchargeType === 'percent') price += (item.unitPrice * item.surcharge / 100);
      else price += item.surcharge;
    }
    return sum + (Math.max(0, price) * item.quantity);
  }, 0), [cart]);

  useEffect(() => {
    if (user) {
      setNickname(user.displayName || user.email?.split('@')[0] || '');
    }
  }, [user]);

  const handleUpdateNickname = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: nickname });
      setIsEditingNickname(false);
      alert('Đã cập nhật tên hiển thị!');
    } catch (error: any) {
      alert('Lỗi cập nhật: ' + error.message);
    }
  };
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    const saved = localStorage.getItem('neostock_supabase_config');
    const defaults = {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      enabled: true,
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const supabase = useMemo(() => {
    if (supabaseConfig.url && supabaseConfig.key && supabaseConfig.enabled) {
      return createClient(supabaseConfig.url, supabaseConfig.key, {
        global: {
          fetch: fetch.bind(window),
        },
      });
    }
    return null;
  }, [supabaseConfig]);

  useEffect(() => {
    localStorage.setItem('neostock_supabase_config', JSON.stringify(supabaseConfig));
  }, [supabaseConfig]);
  const [scannerMode, setScannerMode] = useState<'normal' | 'quick-in' | 'quick-out'>('normal');
  const [sessionHistory, setSessionHistory] = useState<{ id: string; name: string; sku: string; type: 'in' | 'out'; quantity: number; timestamp: string }[]>([]);
  const [lastScannedProduct, setLastScannedProduct] = useState<{ name: string, type: 'in' | 'out', quantity: number, variant?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const recentInventoryTransactions = useMemo(() => {
    // We only want inventory transactions (those without an orderSource like 'direct' or 'online')
    const inventoryOnly = transactions.filter(t => !t.orderSource || (t.orderSource !== 'direct' && t.orderSource !== 'online'));

    // Sort by timestamp descending
    const sorted = [...inventoryOnly].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (inventoryListSubTab === 'retail') {
      return sorted.filter(t => !t.batchId).slice(0, 20); // Last 20 retail scans
    } else {
      // Group by batch for the 'Nhập Xuất Lô' sub-tab
      const batches: any[] = [];
      const batchMap = new Map();

      sorted.filter(t => t.batchId).forEach(t => {
        if (!batchMap.has(t.batchId)) {
          const newBatch = {
            id: t.batchId,
            name: t.batchName || 'Không tên',
            timestamp: t.timestamp,
            type: t.type,
            totalQuantity: t.quantity,
            note: t.note || '',
            transactions: [t]
          };
          batchMap.set(t.batchId, newBatch);
          batches.push(newBatch);
        } else {
          const b = batchMap.get(t.batchId);
          b.totalQuantity += t.quantity;
          b.transactions.push(t);
        }
      });
      return batches.slice(0, 10); // Last 10 batches
    }
  }, [transactions, inventoryListSubTab]);

  const [shippingCode, setShippingCode] = useState('');
  const [onlineSkuInput, setOnlineSkuInput] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<'in' | 'out' | 'add' | 'edit' | null>(null);
  const [formData, setFormData] = useState({ quantity: 1, note: '', name: '', sku: '', category: '', variant: '', minStock: 5, recommendedStock: 10, price: 0, costPrice: 0, imageUrl: '' });
  const [quickQuantity, setQuickQuantity] = useState(1);
  const [sortBy, setSortBy] = useState<'manual' | 'name' | 'quantity' | 'restock'>('manual');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isOrderLocked, setIsOrderLocked] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; product: Product } | null>(null);
  const [renamingProduct, setRenamingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [orderTransactionsState, setOrderTransactionsState] = useState<Transaction[]>([]);
  const [originalOrderTransactions, setOriginalOrderTransactions] = useState<Transaction[]>([]);
  const [skuSearch, setSkuSearch] = useState('');
  const [editShippingCode, setEditShippingCode] = useState('');
  const [editNote, setEditNote] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [addProductSku, setAddProductSku] = useState('');

  // Batch Transaction States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchType, setBatchType] = useState<'in' | 'out'>('in');
  const [batchCart, setBatchCart] = useState<{ product: Product, quantity: number, originalQuantity: number }[]>([]);
  const [batchNote, setBatchNote] = useState('');
  const [batchName, setBatchName] = useState('');

  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [isCartExtraVisible, setIsCartExtraVisible] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [checkedProducts, setCheckedProducts] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const deferredInventorySearchQuery = useDeferredValue(searchQuery);
  const deferredSalesSearchTerm = useDeferredValue(salesSearchTerm);
  const deferredSelectorSearch = useDeferredValue(selectorSearch);
  const deferredOnlineOrderSearchQuery = useDeferredValue(onlineOrderSearchQuery);

  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  const serverProductsRef = useRef<Product[]>([]);
  const reorderSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [imageUploadMethod, setImageUploadMethod] = useState<'device' | 'url'>('device');
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(() => {
    const saved = localStorage.getItem('neostock_keyboard_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [predefinedCategories, setPredefinedCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('neostock_predefined_categories');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('neostock_predefined_categories', JSON.stringify(predefinedCategories));
  }, [predefinedCategories]);

  const availableCategories = useMemo(() => {
    const fromProducts = products.map(p => p.category).filter(Boolean);
    const combined = Array.from(new Set([...fromProducts, ...predefinedCategories]));
    return combined.sort();
  }, [products, predefinedCategories]);

  const activeProducts = useMemo(() => products.filter(p => !p.isHeader), [products]);

  const productByNormalizedSku = useMemo(() => {
    const entries = activeProducts.map(product => [product.sku.toLowerCase(), product] as const);
    return new Map(entries);
  }, [activeProducts]);

  const lowStockProducts = useMemo(() => (
    [...activeProducts]
      .filter(product => product.quantity <= product.minStock)
      .sort((a, b) => (b.recommendedStock - b.quantity) - (a.recommendedStock - a.quantity))
  ), [activeProducts]);

  const inventoryCategoryOptions = useMemo(() => {
    const productCategories = Array.from(new Set(activeProducts.map(p => p.category).filter(Boolean)))
      .filter(category => category && category !== 'Tất cả');
    return ['Tất cả', ...productCategories];
  }, [activeProducts]);

  const filteredSalesProducts = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(deferredSalesSearchTerm);
    if (!normalizedSearch) return activeProducts;

    return activeProducts.filter(product =>
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.sku.toLowerCase().includes(normalizedSearch)
    );
  }, [activeProducts, deferredSalesSearchTerm]);

  const filteredSelectorProducts = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(deferredSelectorSearch);
    if (!normalizedSearch) return activeProducts;

    return activeProducts.filter(product =>
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.sku.toLowerCase().includes(normalizedSearch)
    );
  }, [activeProducts, deferredSelectorSearch]);

  const [historySettings, setHistorySettings] = useState(() => {
    const saved = localStorage.getItem('neostock_history_settings');
    return saved ? JSON.parse(saved) : { autoDelete: false, retentionDays: 30 };
  });

  const [isHistorySettingsOpen, setIsHistorySettingsOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [viewingBatch, setViewingBatch] = useState<any | null>(null);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [editBatchName, setEditBatchName] = useState('');
  const [editBatchNote, setEditBatchNote] = useState('');
  const [editBatchTransactions, setEditBatchTransactions] = useState<Transaction[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('neostock_keyboard_enabled', JSON.stringify(isKeyboardEnabled));
  }, [isKeyboardEnabled]);

  useEffect(() => {
    localStorage.setItem('neostock_history_settings', JSON.stringify(historySettings));
  }, [historySettings]);

  // Auto history cleanup
  useEffect(() => {
    if (user && historySettings.autoDelete && transactions.length > 0) {
      const lastCleanup = localStorage.getItem('neostock_last_cleanup');
      const now = Date.now();

      // Run cleanup once a day
      if (!lastCleanup || now - parseInt(lastCleanup) > 24 * 60 * 60 * 1000) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - (historySettings.retentionDays || 30));

        const oldTransactions = transactions.filter(t => new Date(t.timestamp) < thresholdDate);

        if (oldTransactions.length > 0) {
          const performAutoCleanup = async () => {
            try {
              const batch = writeBatch(db);
              // limit to 500 per batch to avoid oversized bulk operations
              oldTransactions.slice(0, 500).forEach(t => {
                batch.delete(doc(db, 'transactions', t.id));
              });
              await batch.commit();
              localStorage.setItem('neostock_last_cleanup', now.toString());
              console.log(`Auto-cleaned ${oldTransactions.length} old transactions`);
            } catch (error) {
              console.error('Auto cleanup failed:', error);
            }
          };
          performAutoCleanup();
        } else {
          localStorage.setItem('neostock_last_cleanup', now.toString());
        }
      }
    }
  }, [user, historySettings, transactions]);

  const groupedOnlineOrders = useMemo(() => {
    let onlineTransactions = transactions.filter(t => t.note?.includes('Online'));

    // Date Filtering Logic
    if (onlineDateFilter !== 'all') {
      const now = new Date();
      // Set to midnight local time for the current date
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      onlineTransactions = onlineTransactions.filter(t => {
        const tDate = new Date(t.timestamp);

        if (onlineDateFilter === 'today') {
          return tDate >= today;
        }
        if (onlineDateFilter === 'yesterday') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return tDate >= yesterday && tDate < today;
        }
        if (onlineDateFilter === '7days') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return tDate >= sevenDaysAgo;
        }
        if (onlineDateFilter === 'custom' && onlineDateRange.start) {
          const start = new Date(onlineDateRange.start);
          start.setHours(0, 0, 0, 0); // Start of selected day

          const end = onlineDateRange.end ? new Date(onlineDateRange.end) : new Date();
          end.setHours(23, 59, 59, 999); // End of selected day or current moment

          return tDate >= start && tDate <= end;
        }
        return true;
      });
    }

    const groups: { [key: string]: Transaction[] } = {};

    onlineTransactions.forEach(t => {
      const mvdMatch = t.note?.match(shippingCodePattern);
      const mvd = mvdMatch ? mvdMatch[1] : `no-mvd-${t.id}`;
      if (!groups[mvd]) {
        groups[mvd] = [];
      }
      groups[mvd].push(t);
    });

    return Object.entries(groups).map(([mvd, trans]) => ({
      shippingCode: mvd.startsWith('no-mvd-') ? '' : mvd,
      transactions: trans,
      timestamp: trans[0].timestamp,
      note: trans[0].note?.split(' - ')[1] || '',
      id: mvd // Use MV? as the ID for the group
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, onlineDateFilter, onlineDateRange]);

  const filteredOnlineOrders = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(deferredOnlineOrderSearchQuery);
    if (!normalizedSearch) return groupedOnlineOrders.slice(0, 20);

    return groupedOnlineOrders.filter(order =>
      order.shippingCode.toLowerCase().includes(normalizedSearch) ||
      order.transactions.some(t => t.productName.toLowerCase().includes(normalizedSearch))
    ).slice(0, 20);
  }, [deferredOnlineOrderSearchQuery, groupedOnlineOrders]);

  const analyticsData = useMemo(() => {
    // 1. Filter transactions by date range
    let filtered = transactions.filter(t => t.type !== 'adjustment');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentFiltered = [...filtered];
    let previousFiltered: Transaction[] = [];

    if (analyticsDateFilter !== 'all') {
      let rangeMs = 0;
      let start: Date = new Date(0);
      let end: Date = new Date();

      if (analyticsDateFilter === 'today') {
        start = today;
        rangeMs = 24 * 60 * 60 * 1000;
      } else if (analyticsDateFilter === 'yesterday') {
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = today;
        rangeMs = 24 * 60 * 60 * 1000;
      } else if (analyticsDateFilter === '7days') {
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        rangeMs = 7 * 24 * 60 * 60 * 1000;
      } else if (analyticsDateFilter === '30days') {
        start = new Date(today);
        start.setDate(start.getDate() - 30);
        rangeMs = 30 * 24 * 60 * 60 * 1000;
      } else if (analyticsDateFilter === 'custom' && analyticsDateRange.start) {
        start = new Date(analyticsDateRange.start);
        start.setHours(0, 0, 0, 0);
        end = analyticsDateRange.end ? new Date(analyticsDateRange.end) : new Date();
        end.setHours(23, 59, 59, 999);
        rangeMs = end.getTime() - start.getTime();
      }

      currentFiltered = filtered.filter(t => {
        const d = new Date(t.timestamp);
        return d >= start && d <= end;
      });

      // Previous period for growth comparison
      const prevStart = new Date(start.getTime() - (rangeMs || 24 * 60 * 60 * 1000));
      const prevEnd = start;
      previousFiltered = filtered.filter(t => {
        const d = new Date(t.timestamp);
        return d >= prevStart && d < prevEnd;
      });
    }

    const getStats = (list: Transaction[]) => {
      const sales = list.filter(t => t.type === 'out');
      const revenue = sales.reduce((sum, t) => {
        const rev = t.totalPrice || (t.price ? t.price * t.quantity : 0);
        if (rev === 0) {
          const prod = products.find(p => p.id === t.productId);
          return sum + ((prod?.price || 0) * t.quantity);
        }
        return sum + rev;
      }, 0);
      const cost = sales.reduce((sum, t) => {
        const prod = products.find(p => p.id === t.productId);
        const cp = prod?.costPrice || 0;
        return sum + (cp * t.quantity);
      }, 0);

      const onlineSales = sales.filter(t => t.note?.includes('Online') || t.note?.includes('[MV?:') || t.note?.includes('[MVĐ:'));
      const directSales = sales.filter(t => !t.note?.includes('Online') && !t.note?.includes('[MV?:') && !t.note?.includes('[MVĐ:'));

      // Count unique orders
      const onlineOrders = new Set();
      onlineSales.forEach(t => {
        const mvdMatch = t.note?.match(shippingCodePattern);
        if (mvdMatch) onlineOrders.add(mvdMatch[1]);
        else onlineOrders.add(t.timestamp + t.userId);
      });

      const directOrders = new Set();
      directSales.forEach(t => directOrders.add(t.timestamp + t.userId));

      return {
        revenue,
        cost,
        profit: revenue - cost,
        onlineOrderCount: onlineOrders.size,
        directOrderCount: directOrders.size,
        totalItems: sales.reduce((sum, t) => sum + t.quantity, 0)
      };
    };

    const currentStats = getStats(currentFiltered);
    const prevStats = getStats(previousFiltered);

    const dailyData: { date: string, revenue: number, profit: number }[] = [];
    const daysToMap = analyticsDateFilter === 'all' ? 30 :
      (analyticsDateFilter === '7days' ? 7 :
        (analyticsDateFilter === '30days' ? 30 :
          (analyticsDateFilter === 'today' ? 1 : 7)));

    for (let i = daysToMap - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

      const dayTrans = currentFiltered.filter(t => {
        const td = new Date(t.timestamp);
        return td.getDate() === d.getDate() && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });

      const stats = getStats(dayTrans);
      dailyData.push({ date: dateStr, revenue: stats.revenue, profit: stats.profit });
    }

    const productStats: { [id: string]: { name: string, quantity: number, revenue: number, profit: number } } = {};
    currentFiltered.filter(t => t.type === 'out').forEach(t => {
      if (!productStats[t.productId]) {
        productStats[t.productId] = { name: t.productName, quantity: 0, revenue: 0, profit: 0 };
      }
      productStats[t.productId].quantity += t.quantity;
      const rev = t.totalPrice || (t.price ? t.price * t.quantity : (products.find(p => p.id === t.productId)?.price || 0) * t.quantity);
      productStats[t.productId].revenue += rev;
      const prod = products.find(p => p.id === t.productId);
      const cp = prod?.costPrice || 0;
      productStats[t.productId].profit += rev - (cp * t.quantity);
    });

    const topProducts = Object.entries(productStats)
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const categoryStats: { [cat: string]: number } = {};
    currentFiltered.filter(t => t.type === 'out').forEach(t => {
      const prod = products.find(p => p.id === t.productId);
      const cat = prod?.category || 'Khác';
      const rev = t.totalPrice || (t.price ? t.price * t.quantity : (prod?.price || 0) * t.quantity);
      categoryStats[cat] = (categoryStats[cat] || 0) + rev;
    });

    const categoryData = Object.entries(categoryStats).map(([name, value]) => ({ name, value }));

    const COLORS = ['#00f2ff', '#b625fc', '#ff0055', '#00ffaa', '#ffaa00'];

    return {
      current: currentStats,
      previous: prevStats,
      timeline: dailyData,
      topProducts,
      categories: categoryData,
      COLORS
    };
  }, [transactions, products, analyticsDateFilter, analyticsDateRange]);

  const filteredHistoryTransactions = useMemo(() => {
    let filtered = transactions.filter(trans => {
      // Main History Category Filter
      if (historySubTab === 'direct') {
        const isDirect = trans.orderSource === 'direct' || trans.note?.includes('Bán Hàng Trực Tiếp') || trans.note?.includes('Bán hàng Trực tiếp');
        if (!isDirect) return false;
      } else if (historySubTab === 'online') {
        const isOnline = trans.orderSource === 'online' || trans.note?.includes('Bán Hàng Online') || trans.note?.includes('Bán hàng Online');
        if (!isOnline) return false;
      } else if (historySubTab === 'inventory') {
        // Inventory transactions are those WITHOUT an orderNumber OR those specifically marked as inventory
        const isSale = !!trans.orderNumber || trans.orderSource === 'direct' || trans.orderSource === 'online' || trans.note?.includes('Bán Hàng') || trans.note?.includes('Bán hàng');
        if (isSale) return false;

        // Sub-filter for Inventory
        if (inventoryHistorySubTab === 'retail') {
          if (trans.batchId) return false;
        } else if (inventoryHistorySubTab === 'batch') {
          if (!trans.batchId) return false;
        }
      }

      // Date Filter
      const transDate = new Date(trans.timestamp);
      const now = new Date();
      if (historyDateFilter === 'today') {
        return transDate.toDateString() === now.toDateString();
      } else if (historyDateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return transDate.toDateString() === yesterday.toDateString();
      } else if (historyDateFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return transDate >= sevenDaysAgo;
      } else if (historyDateFilter === 'custom') {
        if (!historyDateRange.start) return true;
        const start = new Date(historyDateRange.start);
        start.setHours(0, 0, 0, 0);
        const end = historyDateRange.end ? new Date(historyDateRange.end) : new Date();
        end.setHours(23, 59, 59, 999);
        return transDate >= start && transDate <= end;
      }
      return true;
    });

    // Sort order
    if (historySubTab === 'direct' || historySubTab === 'online') {
      // Sort by timestamp descending primarily, then by orderNumber string descending
      return filtered.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        if (timeA !== timeB) return timeB - timeA;

        const aNum = String(a.orderNumber || '');
        const bNum = String(b.orderNumber || '');
        return bNum.localeCompare(aNum);
      });
    }

    // Default sort by timestamp descending
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, historySubTab, inventoryHistorySubTab, historyDateFilter, historyDateRange]);

  const groupedHistoryTransactions = useMemo(() => {
    const groups: {
      id: string;
      orderNumber?: string;
      batchId?: string;
      batchName?: string;
      timestamp: string;
      paymentMethod?: 'cash' | 'transfer';
      type: 'in' | 'out';
      totalQuantity: number;
      transactions: Transaction[];
      note: string;
    }[] = [];

    const orderMap = new Map<string, typeof groups[0]>();
    const batchMap = new Map<string, typeof groups[0]>();

    filteredHistoryTransactions.forEach((trans, idx) => {
      // 1. Group by orderNumber (Sales)
      if (trans.orderNumber) {
        if (orderMap.has(trans.orderNumber)) {
          const group = orderMap.get(trans.orderNumber)!;
          group.totalQuantity += trans.quantity;
          group.transactions.push(trans);
          if (!group.note && trans.note) group.note = trans.note;
        } else {
          const newGroup = {
            id: `order-${trans.orderNumber}`,
            orderNumber: trans.orderNumber,
            timestamp: trans.timestamp,
            paymentMethod: trans.paymentMethod,
            type: trans.type,
            totalQuantity: trans.quantity,
            transactions: [trans],
            note: trans.note || ''
          };
          orderMap.set(trans.orderNumber, newGroup);
          groups.push(newGroup);
        }
      }
      // 2. Group by batchId (Batch Transactions)
      else if (trans.batchId) {
        if (batchMap.has(trans.batchId)) {
          const group = batchMap.get(trans.batchId)!;
          group.totalQuantity += trans.quantity;
          group.transactions.push(trans);
          if (!group.note && trans.note) group.note = trans.note;
        } else {
          const newGroup = {
            id: `batch-${trans.batchId}`,
            batchId: trans.batchId,
            batchName: trans.batchName,
            timestamp: trans.timestamp,
            paymentMethod: trans.paymentMethod,
            type: trans.type,
            totalQuantity: trans.quantity,
            transactions: [trans],
            note: trans.note || ''
          };
          batchMap.set(trans.batchId, newGroup);
          groups.push(newGroup);
        }
      }
      // 3. Individual transactions
      else {
        const fallbackId = trans.id ? `trans-${trans.id}` : `fallback-${trans.timestamp}-${idx}`;
        groups.push({
          id: fallbackId,
          orderNumber: trans.orderNumber,
          timestamp: trans.timestamp,
          paymentMethod: trans.paymentMethod,
          type: trans.type,
          totalQuantity: trans.quantity,
          transactions: [trans],
          note: trans.note || ''
        });
      }
    });

    return groups;
  }, [filteredHistoryTransactions]);

  const toggleHistoryOrderExpand = (id: string) => {
    setExpandedHistoryOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const currentDayOrderSTT = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const prefix = now.getDate().toString().padStart(2, '0') +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getFullYear().toString();

    const todaySales = transactions.filter(t => t.timestamp.startsWith(todayStr) && String(t.orderNumber || '').startsWith(prefix));

    let nextSeq = 1;
    if (todaySales.length > 0) {
      const seqs = todaySales.map(t => {
        const orderVal = String(t.orderNumber || '');
        const seqStr = orderVal.slice(-4) || '0';
        return parseInt(seqStr, 10);
      });
      nextSeq = Math.max(0, ...seqs) + 1;
    }

    return prefix + nextSeq.toString().padStart(4, '0');
  }, [transactions]);

  const [history, setHistory] = useState<{ products: Product[], transactions: Transaction[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ products: Product[], transactions: Transaction[] }[]>([]);

  useEffect(() => {
    setShippingCode('');
    setOnlineSkuInput('');
  }, [salesSubTab]);

  const pushToHistory = () => {
    setHistory(prev => [...prev.slice(-19), { products, transactions }]);
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setRedoStack(prev => [...prev, { products, transactions }]);
    setProducts(prevState.products);
    setTransactions(prevState.transactions);
    setHistory(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, { products, transactions }]);
    setProducts(nextState.products);
    setTransactions(nextState.transactions);
    setRedoStack(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setTransactions([]);
      return;
    }

    const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = sortProductsByOrder(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
      serverProductsRef.current = productsData;
      setProducts(productsData);
    }, (error) => handleDataError(error, OperationType.LIST, 'products'));

    const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
      setTransactions(transactionsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, (error) => handleDataError(error, OperationType.LIST, 'transactions'));

    return () => {
      if (reorderSaveTimeoutRef.current) {
        clearTimeout(reorderSaveTimeoutRef.current);
      }
      unsubscribeProducts();
      unsubscribeTransactions();
    };
  }, [user]);

  // Validate connection to the remote data backend
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  const stats = useMemo(() => {
    const totalItems = activeProducts.reduce((acc, p) => acc + p.quantity, 0);
    const lowStockItems = activeProducts.filter(p => p.quantity <= p.minStock).length;
    const totalValue = activeProducts.reduce((acc, p) => acc + (p.quantity * p.price), 0);
    const recentTransCount = transactions.filter(t => {
      const date = new Date(t.timestamp);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length;

    return { totalItems, lowStockItems, totalValue, recentTransCount };
  }, [activeProducts, transactions]);

  const sortedProducts = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(deferredInventorySearchQuery);
    const filtered = normalizedSearch
      ? products.filter(p =>
        p.name.toLowerCase().includes(normalizedSearch) ||
        p.sku.toLowerCase().includes(normalizedSearch) ||
        p.variant?.toLowerCase().includes(normalizedSearch) ||
        (p.isHeader && p.name.toLowerCase().includes(normalizedSearch))
      )
      : products;

    switch (sortBy) {
      case 'name':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'quantity':
        return [...filtered].sort((a, b) => a.quantity - b.quantity);
      case 'restock':
        return [...filtered].sort((a, b) => (b.recommendedStock - b.quantity) - (a.recommendedStock - a.quantity));
      default:
        return [...filtered].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
  }, [deferredInventorySearchQuery, products, sortBy]);

  const applyProductsOptimistically = (updater: (prev: Product[]) => Product[]) => {
    startTransition(() => {
      setProducts(prev => sortProductsByOrder(updater(prev)));
    });
  };

  const persistProductOrder = async (orderedProducts: Product[]) => {
    await Promise.all(
      orderedProducts.map((product, idx) => updateDoc(doc(db, 'products', product.id), { sortOrder: idx })),
    );
  };

  const moveProduct = async (id: string, direction: 'up' | 'down') => {
    if (sortBy !== 'manual' || isOrderLocked || !user) return;

    const orderedProducts = sortProductsByOrder(products);
    const previousProducts = products;
    const index = orderedProducts.findIndex(p => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === orderedProducts.length - 1) return;

    const newProducts = [...orderedProducts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
    const optimisticProducts = newProducts.map((product, idx) => ({ ...product, sortOrder: idx }));

    applyProductsOptimistically(() => optimisticProducts);

    try {
      await persistProductOrder(optimisticProducts);
    } catch (error) {
      setProducts(previousProducts.length > 0 ? previousProducts : serverProductsRef.current);
      handleDataError(error, OperationType.UPDATE, 'products/move');
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingBatch) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const originalById = new Map<string, Transaction>(
        editingBatch.transactions.map((transaction: Transaction) => [transaction.id, transaction]),
      );
      const editedIds = new Set(editBatchTransactions.map(transaction => transaction.id));
      const inventoryAdjustments = new Map<string, number>();

      editingBatch.transactions.forEach((transaction: Transaction) => {
        if (!transaction.productId) return;
        const revertDelta = transaction.type === 'in' ? -transaction.quantity : transaction.quantity;
        inventoryAdjustments.set(
          transaction.productId,
          (inventoryAdjustments.get(transaction.productId) || 0) + revertDelta,
        );
      });

      editBatchTransactions.forEach((transaction: Transaction) => {
        if (!transaction.productId) return;
        const applyDelta = transaction.type === 'in' ? transaction.quantity : -transaction.quantity;
        inventoryAdjustments.set(
          transaction.productId,
          (inventoryAdjustments.get(transaction.productId) || 0) + applyDelta,
        );
      });

      await Promise.all(
        Array.from(inventoryAdjustments.entries()).map(async ([productId, delta]) => {
          if (delta === 0) return;
          const product = products.find(item => item.id === productId);
          if (!product) return;
          await updateDoc(doc(db, 'products', productId), {
            quantity: product.quantity + delta,
            lastUpdated: now,
          });
        }),
      );

      await Promise.all(
        editingBatch.transactions
          .filter((transaction: Transaction) => !editedIds.has(transaction.id))
          .map((transaction: Transaction) => deleteDoc(doc(db, 'transactions', transaction.id))),
      );

      await Promise.all(
        editBatchTransactions.map((transaction) =>
          updateDoc(doc(db, 'transactions', transaction.id), {
            batchName: editBatchName,
            note: editBatchNote,
            quantity: transaction.quantity,
            totalPrice: (transaction.price || 0) * transaction.quantity,
          }),
        ),
      );

      setIsBatchEditModalOpen(false);
      setEditingBatch(null);
      alert('Đã cập nhật lô hàng thành công!');
    } catch (error) {
      handleDataError(error, OperationType.UPDATE, `batches/${editingBatch.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProductFromBatchEdit = (transactionId: string) => {
    setEditBatchTransactions(prev => prev.filter(item => item.id !== transactionId));
  };

  const handleDeleteBatch = async () => {
    if (!editingBatch) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lô "${editBatchName || editingBatch.name}"?`)) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const inventoryAdjustments = new Map<string, number>();

      editingBatch.transactions.forEach((transaction: Transaction) => {
        if (!transaction.productId) return;
        const restoreDelta = transaction.type === 'in' ? -transaction.quantity : transaction.quantity;
        inventoryAdjustments.set(
          transaction.productId,
          (inventoryAdjustments.get(transaction.productId) || 0) + restoreDelta,
        );
      });

      await Promise.all(
        Array.from(inventoryAdjustments.entries()).map(async ([productId, delta]) => {
          const product = products.find(item => item.id === productId);
          if (!product) return;
          await updateDoc(doc(db, 'products', productId), {
            quantity: product.quantity + delta,
            lastUpdated: now,
          });
        }),
      );

      await Promise.all(
        editingBatch.transactions.map((transaction: Transaction) =>
          deleteDoc(doc(db, 'transactions', transaction.id)),
        ),
      );

      setIsBatchEditModalOpen(false);
      setEditingBatch(null);
      setEditBatchTransactions([]);
      alert('Đã xóa lô hàng thành công!');
    } catch (error) {
      handleDataError(error, OperationType.DELETE, `batches/${editingBatch.id}`);
    } finally {
      setIsSaving(false);
    }
  };


  const handleUpdateTransaction = async (e?: React.FormEvent, closeAfter = true) => {
    if (e) e.preventDefault();
    if (orderTransactionsState.length === 0 || !user) return;

    setIsSaving(true);
    try {
      // 1. Calculate inventory changes
      // Net change = New Total Qty per Product - Original Total Qty per Product
      const productChanges = new Map<string, number>();

      // Original totals
      originalOrderTransactions.forEach(t => {
        productChanges.set(t.productId, (productChanges.get(t.productId) || 0) - t.quantity);
      });

      // New totals
      orderTransactionsState.forEach(t => {
        productChanges.set(t.productId, (productChanges.get(t.productId) || 0) + t.quantity);
      });

      // Apply inventory changes
      const productUpdates = Array.from(productChanges.entries()).map(async ([productId, delta]) => {
        if (delta === 0) return;
        const product = products.find(p => p.id === productId);
        if (product) {
          return updateDoc(doc(db, 'products', productId), {
            quantity: product.quantity - delta,
            lastUpdated: new Date().toISOString()
          });
        }
      });
      await Promise.all(productUpdates);

      // 2. Sync transactions with the remote backend via batched writes
      const batch = writeBatch(db);

      // Delete all originals
      originalOrderTransactions.forEach(t => {
        batch.delete(doc(db, 'transactions', t.id));
      });

      // Merge new entries by productId
      const mergedMap = new Map<string, Transaction>();
      orderTransactionsState.forEach(t => {
        const base = t.note?.includes('Online') ? 'Bán hàng Online' : (t.note?.split(' - ')[0] || '');
        const finalNote = `${base}${editShippingCode ? ' [MVĐ: ' + editShippingCode + ']' : ''}${editNote ? ' - ' + editNote : ''}`;

        if (mergedMap.has(t.productId)) {
          const existing = mergedMap.get(t.productId)!;
          mergedMap.set(t.productId, {
            ...existing,
            quantity: existing.quantity + t.quantity,
            note: finalNote
          });
        } else {
          mergedMap.set(t.productId, { ...t, note: finalNote });
        }
      });

      const finalTransactions: Transaction[] = [];
      Array.from(mergedMap.values()).forEach(t => {
        const docRef = doc(collection(db, 'transactions'));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...data } = t;
        batch.set(docRef, data);
        finalTransactions.push({ ...data, id: docRef.id } as Transaction);
      });

      await batch.commit();

      if (closeAfter) {
        setEditingTransaction(null);
        setOrderTransactionsState([]);
        setOriginalOrderTransactions([]);
      } else {
        setShowSaveSuccess(true);
        setOriginalOrderTransactions(finalTransactions);
        setOrderTransactionsState(finalTransactions);
        // Find the one we were editing and stay on it
        if (editingTransaction) {
          const stillEditing = finalTransactions.find(t => t.productId === editingTransaction.productId);
          if (stillEditing) {
            setEditingTransaction(stillEditing);
            setSkuSearch(products.find(p => p.id === stillEditing.productId)?.sku || '');
          }
        }
        setTimeout(() => setShowSaveSuccess(false), 2000);
      }
    } catch (error) {
      handleDataError(error, OperationType.UPDATE, 'transactions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng?')) return;
    setOrderTransactionsState(prev => prev.filter(t => t.id !== id));
  };

  const handleDeleteCurrentOrder = async () => {
    if (!editingTransaction || !user) return;

    const transactionsToDelete = originalOrderTransactions.length > 0 ? originalOrderTransactions : [editingTransaction];
    if (transactionsToDelete.length === 0) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ đơn hàng này?')) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const inventoryAdjustments = new Map<string, number>();

      transactionsToDelete.forEach((transaction) => {
        if (!transaction.productId) return;
        const restoreDelta = transaction.type === 'in' ? -transaction.quantity : transaction.quantity;
        inventoryAdjustments.set(
          transaction.productId,
          (inventoryAdjustments.get(transaction.productId) || 0) + restoreDelta,
        );
      });

      await Promise.all(
        Array.from(inventoryAdjustments.entries()).map(async ([productId, delta]) => {
          const product = products.find(item => item.id === productId);
          if (!product) return;
          await updateDoc(doc(db, 'products', productId), {
            quantity: product.quantity + delta,
            lastUpdated: now,
          });
        }),
      );

      await Promise.all(
        transactionsToDelete.map((transaction) => deleteDoc(doc(db, 'transactions', transaction.id))),
      );

      setEditingTransaction(null);
      setOrderTransactionsState([]);
      setOriginalOrderTransactions([]);
      alert('Đã xóa đơn hàng thành công!');
    } catch (error) {
      handleDataError(error, OperationType.DELETE, 'transactions/order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProductToOrder = () => {
    if (!user || !editingTransaction || !addProductSku) return;

    const product = products.find(p => p.sku === addProductSku);
    if (!product) {
      alert('Không tìm thấy sản phẩm với SKU này!');
      return;
    }

    setOrderTransactionsState(prev => {
      // Find if already exists in state to merge
      const existingIdx = prev.findIndex(t => t.productId === product.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
        return next;
      } else {
        const baseNote = editingTransaction.note?.includes('Online') ? 'Bán hàng Online' : (editingTransaction.note?.split(' - ')[0] || '');
        const newTransaction: Transaction = {
          id: `new-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          type: 'out',
          quantity: 1,
          timestamp: new Date().toISOString(),
          note: `${baseNote}${editShippingCode ? ' [MVĐ: ' + editShippingCode + ']' : ''}${editNote ? ' - ' + editNote : ''}`,
          userId: user.uid
        };
        return [...prev, newTransaction];
      }
    });
    setAddProductSku('');
  };
  const handleAddSelectedProduct = (product: Product) => {
    if (!user || !editingTransaction) return;

    setOrderTransactionsState(prev => {
      // Find if already exists in state to merge
      const existingIdx = prev.findIndex(t => t.productId === product.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
        return next;
      } else {
        const baseNote = editingTransaction.note?.includes('Online') ? 'Bán hàng Online' : (editingTransaction.note?.split(' - ')[0] || '');
        const newTransaction: Transaction = {
          id: `new-sel-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          type: 'out',
          quantity: 1,
          timestamp: new Date().toISOString(),
          note: `${baseNote}${editShippingCode ? ' [MVĐ: ' + editShippingCode + ']' : ''}${editNote ? ' - ' + editNote : ''}`,
          userId: user.uid
        };
        return [...prev, newTransaction];
      }
    });
    setIsProductSelectorOpen(false);
  };

  const handleReorder = (newOrder: Product[]) => {
    if (sortBy !== 'manual' || searchQuery || isOrderLocked || !user) return;

    const optimisticOrder = newOrder.map((product, idx) => ({ ...product, sortOrder: idx }));
    applyProductsOptimistically(() => optimisticOrder);

    if (reorderSaveTimeoutRef.current) {
      clearTimeout(reorderSaveTimeoutRef.current);
    }

    reorderSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await persistProductOrder(optimisticOrder);
      } catch (error) {
        setProducts(serverProductsRef.current);
        handleDataError(error, OperationType.UPDATE, 'products/reorder');
      }
    }, 250);
  };

  const handleScan = async (sku: string) => {
    setLastScanTime(Date.now());
    const product = products.find(p => p.sku === sku);

    if (isBatchMode) {
      if (product) {
        addToBatch(product);
        setLastScannedProduct({ name: product.name, type: batchType, quantity: 1, variant: product.variant });
        setTimeout(() => setLastScannedProduct(null), 2000);
      } else {
        alert(`Không tìm thấy sản phẩm với mã: ${sku}`);
      }
      return;
    }

    if (scannerMode === 'quick-in' || scannerMode === 'quick-out') {
      if (product && user) {
        const type = scannerMode === 'quick-in' ? 'in' : 'out';

        if (type === 'out' && product.quantity < quickQuantity) {
          alert(`Sản phẩm ${product.name} không đủ tồn kho (cần ${quickQuantity}, hiện có ${product.quantity})!`);
          return;
        }

        try {
          const productRef = doc(db, 'products', product.id);
          await updateDoc(productRef, {
            quantity: type === 'in' ? product.quantity + quickQuantity : product.quantity - quickQuantity,
            lastUpdated: new Date().toISOString()
          });

          const newTransaction: Omit<Transaction, 'id'> = {
            productId: product.id,
            productName: product.name,
            type,
            quantity: quickQuantity,
            timestamp: new Date().toISOString(),
            note: type === 'in' ? `Quét nhanh (+${quickQuantity})` : `Quét nhanh (-${quickQuantity})`,
            userId: user.uid
          };

          await addDoc(collection(db, 'transactions'), newTransaction);

          // Update session history
          setSessionHistory(prev => [{
            id: product.id,
            name: product.name,
            sku: product.sku,
            type,
            quantity: quickQuantity,
            timestamp: new Date().toISOString()
          }, ...prev]);

          setLastScannedProduct({ name: product.name, type, quantity: quickQuantity, variant: product.variant });
          setTimeout(() => setLastScannedProduct(null), 2000);
        } catch (error) {
          handleDataError(error, OperationType.WRITE, 'products/scan');
        }
      } else if (!product) {
        alert(`Không tìm thấy sản phẩm với mã: ${sku}`);
      }
      return;
    }

    if (activeTab === 'sales') {
      if (product) {
        addToCart(product);
        setLastScannedProduct({ name: product.name, type: 'out', quantity: 1, variant: product.variant });
        setTimeout(() => setLastScannedProduct(null), 2000);
      } else {
        alert(`Không tìm thấy sản phẩm với mã: ${sku}`);
      }
      return;
    }

    if (product) {
      setSelectedProduct(product);
      setIsScannerOpen(false);
      setIsModalOpen('in');
    } else {
      setFormData(prev => ({ ...prev, sku, name: '', category: '', variant: '', quantity: 1, minStock: 5, price: 0 }));
      setIsScannerOpen(false);
      setIsModalOpen('add');
    }
  };

  const handleManualCleanup = async (mode: 'all' | 'old') => {
    if (!user) return;

    let toDelete = [];
    if (mode === 'all') {
      if (!confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử Hành động này không thể hoàn tác.')) return;
      toDelete = transactions;
    } else {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - (historySettings.retentionDays || 30));
      toDelete = transactions.filter(t => new Date(t.timestamp) < thresholdDate);
      if (toDelete.length === 0) {
        alert('Không có dữ liệu cần xóa.');
        return;
      }
      if (!confirm(`Bạn có chắc chắn muốn xóa ${toDelete.length} giao dịch cũ hơn ${historySettings.retentionDays} ngày?`)) return;
    }

    setIsSaving(true);
    try {
      // Firebase batches are limited to 500 operations
      const chunks = [];
      for (let i = 0; i < toDelete.length; i += 500) {
        chunks.push(toDelete.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(t => {
          batch.delete(doc(db, 'transactions', t.id));
        });
        await batch.commit();
      }

      alert('Xóa lịch sử thành công!');
      setIsHistorySettingsOpen(false);
    } catch (error: any) {
      alert('Lỗi khi xóa lịch sử: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOrderLock = async () => {
    if (!isOrderLocked && user) {
      try {
        const batch = products.map((p) => {
          const currentIdx = sortedProducts.findIndex(item => item.id === p.id);
          if (currentIdx !== -1) {
            const productRef = doc(db, 'products', p.id);
            return updateDoc(productRef, { sortOrder: currentIdx });
          }
          return Promise.resolve();
        });
        await Promise.all(batch);
        setSortBy('manual');
      } catch (error) {
        handleDataError(error, OperationType.UPDATE, 'products/lock');
      }
    }
    setIsOrderLocked(!isOrderLocked);
  };

  const handleContextMenu = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      product
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!user) return;
    const previousProducts = products;
    setDeletingProduct(null);
    setContextMenu(null);
    applyProductsOptimistically(prev => prev.filter(product => product.id !== id));

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      setProducts(previousProducts);
      handleDataError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || checkedProducts.length === 0) return;

    // We can use the existing deletingProduct modal for bulk delete too 
    // but for now let's just confirm and use writeBatch.
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${checkedProducts.length} sản phẩm đã chọn?`)) return;

    const idsToDelete = new Set<string>(checkedProducts);
    const previousProducts = products;
    applyProductsOptimistically(prev => prev.filter(product => !idsToDelete.has(product.id)));
    setCheckedProducts([]);

    const batch = writeBatch(db);
    idsToDelete.forEach(id => {
      batch.delete(doc(db, 'products', id));
    });

    try {
      await batch.commit();
    } catch (error) {
      setProducts(previousProducts);
      handleDataError(error, OperationType.DELETE, 'products/batch');
    }
  };

  const handleRenameHeader = async () => {
    if (!renamingProduct || !user) return;
    const productId = renamingProduct.id;
    const newName = renameValue;
    const previousProducts = products;
    setRenamingProduct(null);
    setRenameValue('');
    setContextMenu(null);
    applyProductsOptimistically(prev => prev.map(product => (
      product.id === productId ? { ...product, name: newName } : product
    )));
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { name: newName });
    } catch (error) {
      setProducts(previousProducts);
      handleDataError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const addToBatch = (product: Product) => {
    setBatchCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, originalQuantity: product.quantity }];
    });
    setIsBatchMode(true);
  };

  const handleProcessBatch = async () => {
    if (!user || batchCart.length === 0) return;

    setIsSaving(true);
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();
    const batchId = `batch-${Date.now()}`;

    try {
      for (const item of batchCart) {
        const productRef = doc(db, 'products', item.product.id);
        const newQuantity = batchType === 'in'
          ? item.product.quantity + item.quantity
          : item.product.quantity - item.quantity;

        if (newQuantity < 0 && batchType === 'out') {
          throw new Error(`Sản phẩm ${item.product.name} không đủ tồn kho!`);
        }

        batch.update(productRef, {
          quantity: newQuantity,
          lastUpdated: timestamp
        });

        const transactionData: any = {
          productId: item.product.id,
          productSku: item.product.sku,
          productName: item.product.name,
          productImageUrl: item.product.imageUrl || '',
          type: batchType,
          quantity: item.quantity,
          timestamp: timestamp,
          userId: user.uid,
          batchId: batchId,
          batchName: batchName || `Lô ${batchType === 'in' ? 'nhập' : 'xuất'} ${new Date().toLocaleDateString('vi-VN')}`,
          note: `${batchType === 'in' ? 'Nhập kho theo lô' : 'Xuất kho theo lô'}${batchNote ? ' - ' + batchNote : ''}`
        };

        const transRef = doc(collection(db, 'transactions'));
        batch.set(transRef, transactionData);
      }

      await batch.commit();
      setBatchCart([]);
      setBatchNote('');
      setBatchName('');
      setIsBatchMode(false);
      alert(`Đã xử lý lô hàng ${batchType === 'in' ? 'nhập' : 'xuất'} thành công!`);
    } catch (error: any) {
      alert('Lỗi xử lý lô: ' + error.message);
      handleDataError(error, OperationType.WRITE, 'batch_transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        product,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        discountType: 'amount',
        surcharge: 0,
        surchargeType: 'amount'
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const completeSale = async () => {
    if (!user || cart.length === 0) return;

    // Calculate daily order number in DDMMYYYYNNNN format
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const prefix = now.getDate().toString().padStart(2, '0') +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getFullYear().toString();

    const todaySales = transactions.filter(t => t.timestamp.startsWith(todayStr) && String(t.orderNumber || '').startsWith(prefix));

    let nextSeq = 1;
    if (todaySales.length > 0) {
      const seqs = todaySales.map(t => {
        const orderVal = String(t.orderNumber || '');
        const seqStr = orderVal.slice(-4) || '0';
        return parseInt(seqStr, 10);
      });
      nextSeq = Math.max(0, ...seqs) + 1;
    }
    const finalOrderNum = prefix + nextSeq.toString().padStart(4, '0');

    try {
      const timestamp = now.toISOString();
      for (const item of cart) {
        const productRef = doc(db, 'products', item.product.id);
        const newQuantity = item.product.quantity - item.quantity;

        await updateDoc(productRef, {
          quantity: newQuantity,
          lastUpdated: timestamp
        });

        const discountVal = item.discountType === 'percent'
          ? (item.unitPrice * item.discount / 100)
          : item.discount;
        const surchargeVal = item.surchargeType === 'percent'
          ? (item.unitPrice * item.surcharge / 100)
          : item.surcharge;

        const finalUnitPrice = item.unitPrice - discountVal + surchargeVal;
        const totalPrice = finalUnitPrice * item.quantity;

        const transactionData: any = {
          productId: item.product.id,
          productSku: item.product.sku,
          productName: item.product.name,
          productImageUrl: item.product.imageUrl || '',
          type: 'out',
          quantity: item.quantity,
          price: finalUnitPrice,
          totalPrice: totalPrice,
          timestamp: timestamp,
          userId: user.uid,
          orderNumber: finalOrderNum,
          orderSource: salesSubTab,
          note: `Bán hàng ${salesSubTab === 'direct' ? 'Trực tiếp' : 'Online'}${salesSubTab === 'online' && shippingCode ? ' [MVĐ: ' + shippingCode + ']' : ''}${currentNote ? ' - ' + currentNote : ''}`
        };

        if (salesSubTab === 'direct') {
          transactionData.paymentMethod = directPaymentMethod;
        }

        if (salesSubTab === 'online' && shippingCode) {
          transactionData.shippingCode = shippingCode;
        }

        await addDoc(collection(db, 'transactions'), transactionData);

        if (supabase) {
          await supabase.from('transactions').insert(transactionData);
          await supabase.from('products').update({
            quantity: newQuantity,
            lastUpdated: timestamp
          }).eq('id', item.product.id);
        }
      }

      setCart([]);
      if (salesSubTab === 'direct') setDirectNote('');
      else setOnlineNote('');
      setShippingCode('');
      setOnlineSkuInput('');
      setDirectPaymentMethod('cash');
      setDirectCashReceived(0);
      setIsDirectNoteOpen(false);
      alert(`?a hoan thanh ??n hang! #${finalOrderNum}`);
    } catch (error) {
      handleDataError(error, OperationType.WRITE, 'sales/complete');
    }
  };

  const addHeaderRow = async (relativeToProduct: Product, position: 'above' | 'below') => {
    if (!user) return;
    const previousProducts = products;
    try {
      const newHeaderRef = doc(collection(db, 'products'));
      const newHeader: Product = {
        id: newHeaderRef.id,
        sku: '',
        name: 'TIÊU ĐỀ MỚI',
        category: '',
        variant: '',
        quantity: 0,
        minStock: 0,
        recommendedStock: 0,
        price: 0,
        lastUpdated: new Date().toISOString(),
        sortOrder: 0,
        isHeader: true,
        userId: user.uid
      };

      const sorted = sortProductsByOrder(products);
      const relativeIndex = sorted.findIndex(p => p.id === relativeToProduct.id);

      if (relativeIndex === -1) return;

      const newSorted = [...sorted];
      if (position === 'above') {
        newSorted.splice(relativeIndex, 0, newHeader);
      } else {
        newSorted.splice(relativeIndex + 1, 0, newHeader);
      }

      setContextMenu(null);
      setSortBy('manual');
      const optimisticProducts = newSorted.map((product, idx) => ({ ...product, sortOrder: idx }));
      applyProductsOptimistically(() => optimisticProducts);

      await Promise.all(
        optimisticProducts.map((product, idx) => {
          if (product.id === newHeader.id) {
            return setDoc(newHeaderRef, { ...product, sortOrder: idx });
          }
          return updateDoc(doc(db, 'products', product.id), { sortOrder: idx });
        }),
      );
    } catch (error) {
      setProducts(previousProducts);
      handleDataError(error, OperationType.CREATE, 'products/header');
    }
  };

  const exportProductsToCSV = () => {
    const headers = ['Tên', 'SKU', 'Danh mục', 'Biến thể', 'Tồn kho', 'Gợi ý nhập', 'Tồn tối thiểu', 'Giá bán', 'Giá nhập', 'Ghi chú', 'Hình ảnh'];
    const rows = products
      .filter(p => !p.isHeader)
      .map(p => [
        p.name,
        p.sku,
        p.category,
        p.variant || '',
        p.quantity,
        p.recommendedStock,
        p.minStock,
        p.price,
        p.costPrice || 0,
        p.note || '',
        p.imageUrl || ''
      ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NeoStock_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const importProductsFromCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let text = event.target?.result as string;
        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
          alert('File khong co d? li?u ?? nh?p!');
          return;
        }

        const parseRow = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && i + 1 < line.length && line[i + 1] === '"') {
              current += '"';
              i++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const batch = writeBatch(db);
        let count = 0;
        const timestamp = new Date().toISOString();

        for (let i = 1; i < lines.length; i++) {
          const row = parseRow(lines[i]);
          if (row.length < 2) continue;

          // Headers: Tên, SKU, Danh mục, Biến thể, Tồn kho, Gợi ý nhập, Tồn tối thiểu, Giá bán, Giá nhập, Ghi chú, Hình ảnh
          const [name, sku, category, variant, quantity, recommended, min, price, cost, note, imageUrl] = row;
          if (!name || !sku) continue;

          const productData: any = {
            name: name,
            sku: sku,
            category: category || 'Chưa phân loại',
            variant: variant || '',
            quantity: Math.max(0, Number(quantity) || 0),
            recommendedStock: Math.max(0, Number(recommended) || 0),
            minStock: Math.max(0, Number(min) || 0),
            price: Math.max(0, Number(price) || 0),
            costPrice: Math.max(0, Number(cost) || 0),
            note: note || '',
            imageUrl: imageUrl || '',
            lastUpdated: timestamp,
            userId: user.uid,
            isHeader: false,
            sortOrder: products.length + count
          };

          // Try to find by SKU in the current products state
          const existing = products.find(p => p.sku === productData.sku);
          if (existing) {
            batch.update(doc(db, 'products', existing.id), productData);
          } else {
            const newRef = doc(collection(db, 'products'));
            batch.set(newRef, { ...productData, id: newRef.id });
          }
          count++;

          // Keep import batches bounded to avoid oversized write payloads
          if (count >= 490) break;
        }

        if (count > 0) {
          await batch.commit();
          alert(`Đã nhập thành công ${count} sản phẩm!`);
        } else {
          alert('Không tìm thấy sản phẩm hợp lệ để nhập.');
        }
      } catch (error: any) {
        console.error('Import Error:', error);
        alert('Lỗi khi xử lý file: ' + error.message);
      }
    };
    reader.onerror = () => alert('Lỗi khi đọc file.');
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleTransaction = async (type: 'in' | 'out') => {
    if (!selectedProduct || !user) return;

    const qty = Number(formData.quantity);
    if (type === 'out' && selectedProduct.quantity < qty) {
      alert('Không đủ hàng tồn kho!');
      return;
    }

    const productId = selectedProduct.id;
    const productName = selectedProduct.name;
    const productImageUrl = selectedProduct.imageUrl || '';
    const currentQty = selectedProduct.quantity;
    const note = formData.note;

    setIsModalOpen(null);
    setFormData({ quantity: 1, note: '', name: '', sku: '', category: '', variant: '', minStock: 5, recommendedStock: 10, price: 0, imageUrl: '' });

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        quantity: type === 'in' ? currentQty + qty : currentQty - qty,
        lastUpdated: new Date().toISOString()
      });

      const newTransaction: Omit<Transaction, 'id'> = {
        productId,
        productName,
        productImageUrl,
        type,
        quantity: qty,
        timestamp: new Date().toISOString(),
        note,
        userId: user.uid
      };

      await addDoc(collection(db, 'transactions'), newTransaction);
    } catch (error) {
      handleDataError(error, OperationType.WRITE, 'products/transaction');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn (Tối đa 5MB)');
      return;
    }

    setIsUploadingImage(true);
    try {
      if (storage) {
        // Try uploading to Firebase Storage
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `products/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setFormData(prev => ({ ...prev, imageUrl: url }));
      } else {
        throw new Error("Storage not initialized.");
      }
    } catch (error: any) {
      console.warn("Storage upload failed, falling back to Base64:", error);
      // Fallback to compressed base64 if Firebase storage rules block it or storage isn't configured.
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 512;
          const MAX_HEIGHT = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddProduct = async () => {
    if (!user) return;
    const productData = { ...formData };
    const previousProducts = products;
    setIsModalOpen(null);
    setSelectedProduct(null);
    setFormData({ quantity: 1, note: '', name: '', sku: '', category: '', variant: '', minStock: 5, recommendedStock: 10, price: 0, costPrice: 0, imageUrl: '' });

    try {
      const newProductRef = doc(collection(db, 'products'));
      const newProduct: Product = {
        id: newProductRef.id,
        sku: productData.sku,
        name: productData.name,
        category: productData.category,
        variant: productData.variant,
        quantity: Number(productData.quantity),
        minStock: Number(productData.minStock),
        recommendedStock: Number(productData.recommendedStock),
        price: Number(productData.price),
        costPrice: Number(productData.costPrice),
        imageUrl: productData.imageUrl,
        note: productData.note,
        lastUpdated: new Date().toISOString(),
        sortOrder: products.length > 0 ? Math.max(...products.map(p => p.sortOrder || 0)) + 1 : 0,
        userId: user.uid
      };

      applyProductsOptimistically(prev => [...prev, newProduct]);
      await setDoc(newProductRef, newProduct);
    } catch (error) {
      setProducts(previousProducts);
      handleDataError(error, OperationType.CREATE, 'products');
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      variant: product.variant || '',
      quantity: product.quantity,
      minStock: product.minStock,
      recommendedStock: product.recommendedStock,
      price: product.price,
      costPrice: product.costPrice || 0,
      imageUrl: product.imageUrl || '',
      note: product.note || ''
    });
    setIsModalOpen('edit');
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !user) return;

    const productId = selectedProduct.id;
    const productData = { ...formData };
    const previousProducts = products;
    setIsModalOpen(null);
    setSelectedProduct(null);
    setFormData({ quantity: 1, note: '', name: '', sku: '', category: '', variant: '', minStock: 5, recommendedStock: 10, price: 0, costPrice: 0, imageUrl: '' });

    try {
      const updatedProduct: Product = {
        ...selectedProduct,
        sku: productData.sku,
        name: productData.name,
        category: productData.category,
        variant: productData.variant,
        quantity: Number(productData.quantity),
        minStock: Number(productData.minStock),
        recommendedStock: Number(productData.recommendedStock),
        price: Number(productData.price),
        costPrice: Number(productData.costPrice),
        imageUrl: productData.imageUrl,
        note: productData.note,
        lastUpdated: new Date().toISOString()
      };
      applyProductsOptimistically(prev => prev.map(product => (
        product.id === productId ? updatedProduct : product
      )));

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        category: updatedProduct.category,
        variant: updatedProduct.variant,
        quantity: updatedProduct.quantity,
        minStock: updatedProduct.minStock,
        recommendedStock: updatedProduct.recommendedStock,
        price: updatedProduct.price,
        costPrice: updatedProduct.costPrice,
        imageUrl: updatedProduct.imageUrl,
        note: updatedProduct.note,
        lastUpdated: updatedProduct.lastUpdated
      });
    } catch (error) {
      setProducts(previousProducts);
      handleDataError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Background Barcode Scanning for Direct Sales
      if (activeTab === 'sales' && salesSubTab === 'direct') {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        if (!isInput) {
          const now = Date.now();
          if (e.key === 'Enter') {
            if (barcodeBuffer.current.length >= 2) { // Barcodes are usually 2+ chars
              handleScan(barcodeBuffer.current.trim());
              barcodeBuffer.current = '';
            }
          } else if (e.key.length === 1) {
            // If gap between keys > 200ms, reset buffer (manual typing vs scan)
            if (now - lastKeyTime.current > 200) {
              barcodeBuffer.current = '';
            }
            barcodeBuffer.current += e.key;
            lastKeyTime.current = now;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, transactions, history, redoStack, activeTab, salesSubTab, handleScan]);

  if (!isAuthReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: 'var(--app-bg)' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => { }} />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--app-bg)', color: 'var(--app-text)' }}
    >
      {isKeyboardEnabled && <FloatingKeyboard />}

      {/* Fullscreen Toggle Button */}
      <div className="fixed bottom-6 left-6 z-[60]">
        <button
          onClick={toggleFullscreen}
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 glass rounded-full md:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl border border-white/10 hover:border-neon-blue/50 group overflow-hidden",
            isFullscreen ? "bg-neon-purple/20 text-neon-purple shadow-[0_0_25px_rgba(191,0,255,0.4)]" : "bg-white/5 text-gray-400 hover:text-neon-blue"
          )}
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isFullscreen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {isFullscreen ? <Minimize size={20} className="neon-text" /> : <Maximize size={20} />}
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar / Mobile Drawer */}
      <aside className={cn(
        "glass border-r border-white/10 flex flex-col items-center py-8 transition-all duration-300 fixed md:relative h-full z-50",
        isSidebarCollapsed ? "w-20" : "w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "pb-24",
        isFullscreen && "hidden"
      )}>
        {/* Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-neon-blue rounded-full flex items-center justify-center text-black shadow-[0_0_10px_rgba(0,242,255,0.5)] z-50 hover:scale-110 transition-transform hidden md:flex"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn("px-6 mb-8 flex items-center gap-3 w-full", isSidebarCollapsed && "md:px-0 md:justify-center")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3)] shrink-0">
            <Package className="text-white" size={24} />
          </div>
          {(!isSidebarCollapsed || isMobileMenuOpen) && <h1 className="text-2xl font-black tracking-tighter neon-text">NEOSTOCK</h1>}
        </div>

        <nav className="flex-1 px-4 space-y-2 w-full overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
            {
              id: 'sales',
              icon: ShoppingCart,
              label: 'Bán Hàng',
              subItems: [
                { id: 'direct', label: 'Trực Tiếp', icon: User },
                { id: 'online', label: 'Online', icon: Globe }
              ]
            },
            { id: 'inventory', icon: Package, label: 'Kho hàng' },
            { id: 'transactions', icon: Scan, label: 'Nhập Xuất' },
            { id: 'history', icon: History, label: 'Lịch sử' },
            { id: 'analytics', icon: BarChart2, label: 'Hiệu suất' },
          ].map((item) => (
            <div key={item.id} className="relative group/item">
              <button
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (item.subItems) {
                    setIsSalesExpanded(!isSalesExpanded);
                  } else {
                    setIsSalesExpanded(false);
                    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                  activeTab === item.id
                    ? "bg-neon-blue/10 text-neon-blue"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
                  isSidebarCollapsed && !isMobileMenuOpen && "md:justify-center md:px-0"
                )}
              >
                <item.icon size={22} className={cn(activeTab === item.id ? "neon-text scale-110" : "group-hover:scale-110 transition-transform")} />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-bold flex-1 text-left tracking-wide">{item.label}</span>}
                {(!isSidebarCollapsed || isMobileMenuOpen) && item.subItems && (
                  <ChevronDown size={16} className={cn("transition-transform duration-300", isSalesExpanded && "rotate-180")} />
                )}
              </button>

              {item.id === 'sales' && (!isSidebarCollapsed || isMobileMenuOpen) && (
                <AnimatePresence>
                  {isSalesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1 mt-1 ml-6"
                    >
                      {item.subItems?.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab('sales');
                            setSalesSubTab(sub.id as any);
                            if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all relative group",
                            activeTab === 'sales' && salesSubTab === sub.id
                              ? "text-neon-blue font-bold"
                              : "text-gray-500 hover:text-gray-300"
                          )}
                        >
                          <sub.icon size={16} />
                          <span>{sub.label}</span>
                          {activeTab === 'sales' && salesSubTab === sub.id && (
                            <motion.div layoutId="subtab-active" className="absolute left-0 w-1 h-4 bg-neon-blue rounded-full" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </nav>

        <div className="px-4 mt-auto w-full space-y-4 pt-4 border-t border-white/5">
          <button
            onClick={() => {
              setActiveTab('settings');
              if (window.innerWidth < 768) setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
              activeTab === 'settings'
                ? "bg-neon-blue/10 text-neon-blue"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
              isSidebarCollapsed && !isMobileMenuOpen && "md:justify-center md:px-0"
            )}
          >
            <Settings size={22} />
            {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-bold tracking-wide">Cài đặt</span>}
          </button>

          <div className={cn("p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 transition-all", isSidebarCollapsed && !isMobileMenuOpen && "md:p-2 md:justify-center")}>
            <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center shrink-0 border border-neon-blue/20">
              <User className="text-neon-blue" size={20} />
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate uppercase tracking-tighter">{user.displayName || user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-gray-500 truncate font-mono">{user.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-red-400/70 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold",
              isSidebarCollapsed && !isMobileMenuOpen && "md:justify-center md:px-0"
            )}
          >
            <LogOut size={20} />
            {(!isSidebarCollapsed || isMobileMenuOpen) && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 relative flex flex-col scroll-smooth transition-all duration-500",
        isFullscreen ? "h-screen overflow-hidden pb-0" : "overflow-y-auto pb-20 md:pb-0"
      )}>
        {/* Header */}
        <header className={cn(
          "sticky top-0 z-30 glass border-b border-white/10 px-4 md:px-8 py-3 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 transition-all",
          isFullscreen && "hidden"
        )}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 bg-white/5 rounded-xl text-gray-400 md:hidden hover:bg-white/10 active:scale-95 transition-all outline-none"
                title="M? Menu"
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <span className="w-5 h-0.5 bg-current rounded-full" />
                  <span className="w-4 h-0.5 bg-current rounded-full" />
                  <span className="w-5 h-0.5 bg-current rounded-full" />
                </div>
              </button>
              <div>
                <h2 className="text-lg md:text-3xl font-black tracking-tighter uppercase neon-text leading-tight md:leading-none">
                  {activeTab === 'dashboard' && 'Tổng quan'}
                  {activeTab === 'sales' && 'Bán Hàng'}
                  {activeTab === 'inventory' && 'Kho hàng'}
                  {activeTab === 'transactions' && 'Nhập Xuất'}
                  {activeTab === 'history' && 'Lịch sử'}
                  {activeTab === 'settings' && 'Cài đặt'}
                </h2>
                <div className="hidden md:flex items-center gap-2 mt-2">
                  <div className="w-1 h-1 rounded-full bg-neon-blue animate-pulse shadow-[0_0_5px_rgba(0,242,255,1)]" />
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Hệ thống đã sẵn sàng
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setActiveTab('settings')}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden active:scale-90 transition-all flex items-center justify-center"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="text-gray-500" size={20} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto pb-1 md:pb-0">
            <div className="relative group flex-1 md:flex-none md:min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={16} />
              <input
                type="text"
                placeholder="Tìm sản phẩm nhanh..."
                className="glass pl-10 pr-10 md:pr-4 py-2.5 md:py-2 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-neon-blue/30 transition-all text-sm font-medium border-white/5"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => {
                  setSessionHistory([]);
                  setIsScannerOpen(true);
                }}
                className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-blue hover:text-white transition-colors"
                title="Quét mã vạch"
              >
                <Scan size={18} />
              </button>
            </div>
            <button
              onClick={() => {
                setSessionHistory([]);
                setIsScannerOpen(true);
              }}
              className="hidden md:flex items-center gap-2 bg-neon-blue text-black font-black px-6 py-2.5 rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-95 text-xs tracking-widest uppercase"
            >
              <Scan size={18} />
              <span>QUÉT MÃ</span>
            </button>
          </div>
        </header>

        <div className={cn("flex-1", isFullscreen ? "p-0" : "p-4 md:p-8")}>
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: 'Tổng sản phẩm', value: stats.totalItems, icon: Package, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
                    { label: 'Sắp hết hàng', value: stats.lowStockItems, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                    { label: 'Giá trị tồn kho', value: stats.totalValue.toLocaleString('vi-VN') + '₫', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
                    { label: 'Giao dịch hôm nay', value: stats.recentTransCount, icon: History, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
                  ].map((stat, i) => (
                    <motion.div
                      key={`stat-${stat.label}-${i}`}
                      whileHover={{ y: -5 }}
                      className="glass p-4 md:p-6 rounded-[2rem] md:rounded-3xl neon-border relative overflow-hidden group"
                    >
                      <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className={cn("p-2 md:p-3 rounded-xl md:rounded-2xl shrink-0", stat.bg)}>
                          <stat.icon className={stat.color} size={20} />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">Live</span>
                          <div className="w-1 h-1 rounded-full bg-neon-blue animate-ping" />
                        </div>
                      </div>
                      <h3 className="text-gray-500 text-[10px] md:text-sm font-bold uppercase tracking-wider">{stat.label}</h3>
                      <p className="text-lg md:text-2xl font-black mt-1 tracking-tighter truncate">{stat.value}</p>

                      {/* Technical Detail */}
                      <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <stat.icon size={64} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Low Stock List */}
                  <div className="lg:col-span-2 glass rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <AlertTriangle className="text-yellow-400" size={20} />
                        Cảnh báo hết hàng
                      </h3>
                      <button onClick={() => setActiveTab('inventory')} className="text-neon-blue text-sm hover:underline">Xem tất cả</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Sản phẩm</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Danh mục</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Biến thể</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Tồn kho</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Đề xuất nhập</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Đơn giá</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {lowStockProducts.map(product => (
                              <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-neon-blue/20 transition-colors overflow-hidden shrink-0">
                                      {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="text-gray-400 group-hover:text-neon-blue" size={16} />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold text-sm">{product.name}</div>
                                      <div className="text-[10px] text-gray-500 font-mono">{product.sku}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-300 border border-white/10">
                                    {product.category}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-gray-400">
                                    {product.variant || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-bold text-sm text-yellow-400">
                                    {product.quantity}
                                  </div>
                                  <div className="flex flex-col text-[10px] text-gray-500">
                                    <span>Min: {product.minStock}</span>
                                    <span>Đề xuất: {product.recommendedStock}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-bold text-sm text-neon-blue">
                                    {Math.max(0, product.recommendedStock - product.quantity)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                  {product.price.toLocaleString('vi-VN')}₫
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <div className="flex flex-col gap-0.5">
                                      <button
                                        onClick={() => { setSelectedProduct(product); setIsModalOpen('in'); }}
                                        className="p-0.5 hover:bg-green-400/20 text-green-400 rounded transition-colors" title="Nhập kho"
                                      >
                                        <Plus size={10} />
                                      </button>
                                      <button
                                        onClick={() => { setSelectedProduct(product); setIsModalOpen('out'); }}
                                        className="p-0.5 hover:bg-red-400/20 text-red-400 rounded transition-colors" title="Xuất kho"
                                      >
                                        <Minus size={10} />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className="p-2 hover:bg-neon-blue/20 text-neon-blue rounded-lg transition-colors" title="Chỉnh sửa"
                                    >
                                      <Settings size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {lowStockProducts.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Check className="mx-auto mb-2 text-green-400" size={32} />
                          <p>Tất cả sản phẩm đều đủ hàng.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="glass rounded-3xl p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <History className="text-neon-purple" size={20} />
                      Hoạt động gần đây
                    </h3>
                    <div className="space-y-6">
                      {transactions.slice(0, 5).map((trans, idx) => (
                        <div key={trans.id || `trans-${idx}`} className="flex gap-4 relative">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 overflow-hidden",
                            trans.type === 'in' ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"
                          )}>
                            {trans.productImageUrl ? (
                              <img src={trans.productImageUrl} alt={trans.productName} className="w-full h-full object-cover" />
                            ) : (
                              trans.type === 'in' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />
                            )}
                          </div>
                          <div className="flex-1 border-b border-white/5 pb-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm">{trans.productName}</h4>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {new Date(trans.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {trans.type === 'in' ? 'Nhập kho' : 'Xuất kho'}: <span className="font-bold">{trans.quantity}</span> sản phẩm
                            </p>
                          </div>
                        </div>
                      ))}
                      {transactions.length === 0 && (
                        <p className="text-center py-12 text-gray-500 text-sm">Chưa có giao dịch nào.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                {/* Scanner Section */}
                <div className="glass p-8 rounded-[2rem] neon-border flex flex-col items-center gap-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 rounded-3xl bg-neon-blue/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.2)] shrink-0">
                        <Scan className="text-neon-blue" size={48} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-2">Nhập mã vạch nhanh</h3>
                        <p className="text-gray-400">Sử dụng máy quét mã vạch hoặc nhập SKU thủ công.</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-4 glass bg-white/5 p-2 rounded-2xl border border-white/10">
                        <span className={cn("text-xs font-bold uppercase tracking-widest px-3", isBatchMode ? "text-neon-blue" : "text-gray-500")}>
                          Chế độ theo lô
                        </span>
                        <div
                          onClick={() => setIsBatchMode(!isBatchMode)}
                          className={cn(
                            "w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300",
                            isBatchMode ? "bg-neon-blue shadow-[0_0_10px_rgba(0,242,255,0.5)]" : "bg-white/10"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                            isBatchMode ? "left-7" : "left-1"
                          )} />
                        </div>
                      </div>

                      {isBatchMode && (
                        <div className="flex gap-2 p-1 glass bg-white/5 rounded-xl border border-white/5">
                          <button
                            onClick={() => setBatchType('in')}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                              batchType === 'in' ? "bg-green-400 text-black" : "text-gray-500"
                            )}
                          >
                            NHẬP LÔ
                          </button>
                          <button
                            onClick={() => setBatchType('out')}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                              batchType === 'out' ? "bg-red-400 text-black" : "text-gray-500"
                            )}
                          >
                            XUẤT LÔ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <button
                      onClick={() => {
                        setScannerMode('normal');
                        setSessionHistory([]);
                        setIsScannerOpen(true);
                      }}
                      className="flex flex-col items-center gap-3 p-6 glass border-white/10 rounded-2xl hover:bg-white/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-neon-blue/20 transition-colors">
                        <Scan className="text-gray-400 group-hover:text-neon-blue" size={24} />
                      </div>
                      <span className="font-bold text-sm uppercase tracking-wider">NHẬP MÃ THÔNG THƯỜNG</span>
                    </button>

                    <button
                      onClick={() => {
                        setScannerMode('quick-in');
                        setSessionHistory([]);
                        setQuickQuantity(1);
                        setIsScannerOpen(true);
                      }}
                      className="flex flex-col items-center gap-3 p-6 glass border-green-400/30 rounded-2xl hover:bg-green-400/10 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-green-400/20 flex items-center justify-center group-hover:bg-green-400/40 transition-colors">
                        <Plus className="text-green-400" size={24} />
                      </div>
                      <span className="font-bold text-sm text-green-400 uppercase tracking-wider">Nhập kho nhanh</span>
                    </button>

                    <button
                      onClick={() => {
                        setScannerMode('quick-out');
                        setSessionHistory([]);
                        setQuickQuantity(1);
                        setIsScannerOpen(true);
                      }}
                      className="flex flex-col items-center gap-3 p-6 glass border-red-400/30 rounded-2xl hover:bg-red-400/10 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-red-400/20 flex items-center justify-center group-hover:bg-red-400/40 transition-colors">
                        <Minus className="text-red-400" size={24} />
                      </div>
                      <span className="font-bold text-sm text-red-400 uppercase tracking-wider">Xuất kho nhanh</span>
                    </button>
                  </div>

                  {lastScannedProduct && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "w-full p-4 rounded-xl flex items-center justify-center gap-3 font-bold",
                        lastScannedProduct.type === 'in' ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"
                      )}
                    >
                      <Check size={20} />
                      ?a {lastScannedProduct.type === 'in' ? 'nh?p' : 'xu?t'} {lastScannedProduct.quantity}: {lastScannedProduct.name}
                      {lastScannedProduct.variant && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-white/20 text-[10px] uppercase">{lastScannedProduct.variant}</span>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Batch List Section */}
                <AnimatePresence>
                  {isBatchMode && batchCart.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass p-8 rounded-[2rem] border-neon-blue/30 overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                            batchType === 'in' ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"
                          )}>
                            <Package size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">DANH SÁCH LÔ {batchType === 'in' ? 'NHẬP' : 'XUẤT'}</h3>
                            <p className="text-xs text-gray-500 font-bold">{batchCart.length} sản phẩm đang chờ xử lý</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setBatchCart([]); setBatchNote(''); }}
                            className="px-6 py-3 rounded-xl glass border-white/10 text-xs font-bold uppercase transition-all hover:bg-white/5"
                          >
                            Hủy toàn bộ
                          </button>
                          <button
                            onClick={handleProcessBatch}
                            disabled={isSaving}
                            className={cn(
                              "px-8 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 shadow-lg",
                              batchType === 'in'
                                ? "bg-green-400 text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.4)]"
                                : "bg-red-400 text-black hover:shadow-[0_0_20px_rgba(248,113,113,0.4)]"
                            )}
                          >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            XÁC NHẬN {batchType === 'in' ? 'NHẬP LÔ' : 'XUẤT LÔ'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {batchCart.map((item, idx) => (
                          <div key={`${item.product.id}-${idx}`} className="glass bg-white/5 p-4 rounded-2xl flex items-center justify-between gap-4 border border-white/5 group">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                                {item.product.imageUrl ? (
                                  <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="text-gray-500" size={24} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-300 font-mono px-1.5 py-0.5 bg-white/5 rounded italic uppercase">
                                    {item.product.sku}
                                  </span>
                                  <span className="text-[10px] font-bold text-neon-blue">Tồn: {item.product.quantity}</span>
                                  <span className="text-[10px] font-bold text-neon-purple uppercase">{item.product.variant || 'Mặc định'}</span>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">{item.product.category || 'Khác'}</span>
                                  <span className="text-[10px] font-mono text-green-300">{(item.product.price || 0).toLocaleString('vi-VN')}₫</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-3 glass bg-black/40 p-1 rounded-xl border border-white/10">
                                <button
                                  onClick={() => {
                                    setBatchCart(prev => prev.map(p =>
                                      p.product.id === item.product.id && p.quantity > 1
                                        ? { ...p, quantity: p.quantity - 1 }
                                        : p
                                    ));
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-12 text-center font-black text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => {
                                    setBatchCart(prev => prev.map(p =>
                                      p.product.id === item.product.id
                                        ? { ...p, quantity: p.quantity + 1 }
                                        : p
                                    ));
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button
                                onClick={() => setBatchCart(prev => prev.filter(p => p.product.id !== item.product.id))}
                                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tên lô hàng</label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Lô hàng xưởng A - 23/04"
                            className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/40 transition-all text-sm"
                            value={batchName}
                            onChange={(e) => setBatchName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ghi chú lô hàng</label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Hàng về trễ 1 ngày..."
                            className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/40 transition-all text-sm"
                            value={batchNote}
                            onChange={(e) => setBatchNote(e.target.value)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual Search & Action Section */}
                <div className="glass p-8 rounded-[2rem] border-white/5 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Search className="text-neon-purple" size={20} />
                      Tìm kiếm & Thao tác thủ công
                    </h3>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        placeholder="Tìm tên hoặc SKU..."
                        className="w-full glass pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedProducts.slice(0, 4).map(product => (
                      <div key={product.id} className="glass p-4 rounded-2xl border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-neon-blue/10 transition-colors">
                            <Package className="text-gray-400 group-hover:text-neon-blue" size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{product.name}</h4>
                            <p className="text-[10px] text-gray-500 font-mono">{product.sku} ? {product.variant || 'No variant'}</p>
                            <p className="text-xs text-neon-blue font-bold mt-1">Tồn: {product.quantity}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isBatchMode ? (
                            <button
                              onClick={() => addToBatch(product)}
                              className="flex flex-col items-center justify-center w-24 h-full rounded-xl bg-neon-blue/10 text-neon-blue hover:bg-neon-blue hover:text-black transition-all text-xs font-black"
                            >
                              <Plus className="mb-1" size={18} />
                              THÊM LÔ
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => { setSelectedProduct(product); setIsModalOpen('in'); }}
                                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-green-400/10 text-green-400 hover:bg-green-400 hover:text-black transition-all text-[10px] font-bold"
                              >
                                <Plus size={16} />
                                NHẬP
                              </button>
                              <button
                                onClick={() => { setSelectedProduct(product); setIsModalOpen('out'); }}
                                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-black transition-all text-[10px] font-bold"
                              >
                                <Minus size={16} />
                                XUẤT
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {sortedProducts.length === 0 && (
                      <div className="md:col-span-2 text-center py-12 text-gray-500">
                        Không tìm thấy sản phẩm nào phù hợp.
                      </div>
                    )}
                  </div>
                  {sortedProducts.length > 4 && (
                    <p className="text-center text-xs text-gray-500 italic">Hiển thị 4 kết quả đầu tiên. Hãy thu hẹp tìm kiếm để thấy sản phẩm cụ thể.</p>
                  )}
                </div>

                {/* Danh Sách Nhập Xuất Section */}
                <div className="glass p-8 rounded-[2rem] border-white/5 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                        <History className="text-neon-blue" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight uppercase">Danh Sách Nhập Xuất</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Lịch sử giao dịch kho gần đây</p>
                      </div>
                    </div>

                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                      {[
                        { id: 'retail', label: 'Nhập Xuất Lẻ', icon: FileText },
                        { id: 'batch', label: 'Nhập Xuất Lô', icon: Boxes }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setInventoryListSubTab(tab.id as any)}
                          className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all text-[10px] uppercase tracking-[0.2em]",
                            inventoryListSubTab === tab.id
                              ? "bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                              : "text-gray-400 hover:text-white"
                          )}
                        >
                          <tab.icon size={12} />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Thời gian</th>
                          <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">
                            {inventoryListSubTab === 'retail' ? 'Sản phẩm' : 'Tên Lô Hàng'}
                          </th>
                          {inventoryListSubTab === 'retail' && (
                            <>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Danh mục</th>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Biến thể</th>
                            </>
                          )}
                          <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Số lượng</th>
                          {inventoryListSubTab === 'retail' && (
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Đơn giá</th>
                          )}
                          <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Loại</th>
                          <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {recentInventoryTransactions.map((item, idx) => (
                          <tr key={`inv-${inventoryListSubTab}-${item.id || idx}`} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 text-xs font-mono text-gray-400">
                              {new Date(item.timestamp).toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4">
                              {inventoryListSubTab === 'retail' ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <Package size={16} className="text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">{item.productName}</p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-[10px] text-gray-500 font-mono tracking-widest">{item.productSku}</p>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(item.productSku || '')}
                                        className="p-1 rounded-md text-gray-500 hover:text-neon-blue hover:bg-white/10 transition-colors"
                                        title="Sao chép mã SKU"
                                      >
                                        <Copy size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                      item.type === 'in' ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                                    )}>
                                      <Boxes size={20} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-white uppercase tracking-tighter italic">{item.name}</p>
                                      <p className="text-[10px] text-gray-500 font-bold truncate max-w-[320px]">{item.note || 'Không có ghi chú'}</p>
                                      <p className="text-[10px] text-gray-400 mt-1">{item.transactions.length} sản phẩm</p>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    {item.transactions.slice(0, 2).map((transaction: Transaction) => {
                                      const product = products.find(p => p.id === transaction.productId);
                                      const imageUrl = transaction.productImageUrl || product?.imageUrl;
                                      const variant = product?.variant || 'Mặc định';
                                      const category = product?.category || 'Khác';
                                      const unitPrice = transaction.price || product?.price || 0;
                                      return (
                                        <div key={`batch-summary-${item.id}-${transaction.id}`} className="flex items-center gap-2 text-[10px]">
                                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                                            {imageUrl ? (
                                              <img src={imageUrl} alt={transaction.productName} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                              <Package size={12} className="text-gray-500" />
                                            )}
                                          </div>
                                          <p className="font-bold text-gray-200 truncate max-w-[140px]">{transaction.productName}</p>
                                          <span className="px-1.5 py-0.5 rounded bg-white/5 uppercase text-gray-400">{category}</span>
                                          <span className="px-1.5 py-0.5 rounded bg-neon-purple/10 uppercase text-neon-purple">{variant}</span>
                                          <span className="font-mono text-neon-blue">{unitPrice.toLocaleString('vi-VN')}₫</span>
                                        </div>
                                      );
                                    })}
                                    {item.transactions.length > 2 && (
                                      <p className="text-[10px] text-gray-500 italic">+{item.transactions.length - 2} sản phẩm khác...</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                            {inventoryListSubTab === 'retail' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                    {products.find(p => p.id === item.productId)?.category || 'Khác'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-[10px] font-black text-neon-purple uppercase tracking-tighter">
                                    {products.find(p => p.id === item.productId)?.variant || 'Mặc định'}
                                  </span>
                                </td>
                              </>
                            )}
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-white">
                                {inventoryListSubTab === 'retail' ? item.quantity : item.totalQuantity}
                              </span>
                            </td>
                            {inventoryListSubTab === 'retail' && (
                              <td className="px-6 py-4">
                                <span className="text-xs font-mono text-neon-blue">
                                  {(item.price || products.find(p => p.id === item.productId)?.price || 0).toLocaleString('vi-VN')}₫
                                </span>
                              </td>
                            )}
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                                item.type === 'in' ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                              )}>
                                {item.type === 'in' ? 'NHẬP' : 'XUẤT'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {inventoryListSubTab === 'batch' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setViewingBatch(item)}
                                    className="p-2 hover:bg-neon-blue/10 text-neon-blue rounded-xl transition-all"
                                    title="Xem chi tiết"
                                  >
                                    <Info size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingBatch(item);
                                      setEditBatchName(item.name);
                                      setEditBatchNote(item.note);
                                      setEditBatchTransactions([...item.transactions]);
                                      setIsBatchEditModalOpen(true);
                                    }}
                                    className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                                    title="Chỉnh sửa lô"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end">
                                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Hoàn tất</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {recentInventoryTransactions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                              Chưa có phiên quét nào gần đây
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>


                {/* Quick Transaction Guide */}
                <div className="glass p-8 rounded-[2rem] border-white/5">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Check className="text-neon-blue" size={18} />
                    Quy Trình Nhập / Xuất
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {[
                      { step: '01', title: 'Chọn Chế Độ', desc: 'Chọn Nhập nhanh, Xuất nhanh hoặc Thông thường.' },
                      { step: '02', title: 'Quét Mã', desc: 'Sử dụng máy quét để nhập mã SKU sản phẩm.' },
                      { step: '03', title: 'Xác Nhận', desc: 'Hệ thống tự động xử lý hoặc mở bằng xác nhận.' },
                    ].map((item, i) => (
                      <div key={`step-${i}`} className="flex gap-4">
                        <span className="text-2xl font-black text-white/10 font-mono">{item.step}</span>
                        <div>
                          <h4 className="font-bold text-neon-blue text-sm">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'sales' && (
              <motion.div
                key="sales"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {salesSubTab === 'direct' ? (
                  <div className={cn(
                    "flex flex-col md:flex-row gap-6 md:gap-4 lg:gap-8 items-start transition-all duration-500",
                    isFullscreen ? "h-screen p-0" : "pb-32 md:pb-0 md:h-[calc(100vh-120px)]"
                  )}>
                    {/* Product Selection (Direct) */}
                    <div className="w-full md:w-[60%] lg:w-[60%] flex flex-col space-y-4 h-full">
                      <div className="flex items-center justify-between px-2 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <h3 className="text-xl font-bold uppercase tracking-tighter italic">BÁN HÀNG TRỰC TIẾP <span className="text-neon-blue ml-2 font-black">#{currentDayOrderSTT}</span></h3>
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">MODE: POS_DIRECT_LOCAL</div>
                      </div>

                      <div className="glass p-4 rounded-[2rem] flex flex-col h-full overflow-hidden space-y-4 border-white/5">
                        <div className="flex gap-2 shrink-0">
                          <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
                            <input
                              type="text"
                              placeholder="Tìm hoặc quét mã sản phẩm..."
                              value={salesSearchTerm}
                              onChange={(e) => setSalesSearchTerm(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && salesSearchTerm) {
                                  const exactMatch = productByNormalizedSku.get(normalizeSearchValue(salesSearchTerm));
                                  if (exactMatch) {
                                    addToCart(exactMatch);
                                    setSalesSearchTerm('');
                                    e.preventDefault();
                                  }
                                }
                              }}
                              className="w-full glass pl-12 pr-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/30 border-white/5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 custom-scrollbar flex-1 pb-4">
                          {filteredSalesProducts.map(product => (
                              <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="glass group flex flex-col p-2 rounded-[2rem] border-white/5 hover:border-neon-blue/30 transition-all active:scale-95 text-left h-full"
                              >
                                <div className="aspect-square w-full rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover:bg-neon-blue/10 transition-colors overflow-hidden relative">
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                                  ) : (
                                    <Package className="text-gray-400 group-hover:text-neon-blue" size={32} />
                                  )}
                                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                    <span className={cn(
                                      "text-[8px] px-2 py-0.5 rounded-full font-black uppercase border",
                                      product.quantity > product.minStock
                                        ? "bg-green-400/10 text-green-400 border-green-400/20"
                                        : "bg-red-400/10 text-red-400 border-red-400/20"
                                    )}>
                                      Kho: {product.quantity}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-2 flex flex-col flex-1 gap-1">
                                  <h4 className="font-bold text-[10px] md:text-xs line-clamp-2 uppercase tracking-tight leading-tight">{product.name}</h4>
                                  <div className="flex items-center justify-between mt-auto pt-1">
                                    <span className="text-[10px] md:text-xs font-black text-neon-blue">{formatCurrency(product.price)}</span>
                                    {product.variant && (
                                      <span className="text-[7px] px-1.5 py-0.5 rounded bg-neon-purple/10 text-neon-purple font-bold border border-neon-purple/20 truncate max-w-[50px]">
                                        {product.variant}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Cart / Checkout (Direct) */}
                    <div className="w-full md:w-[40%] lg:w-[40%] h-full">
                      <div className={cn(
                        "glass rounded-[2rem] flex flex-col h-full transition-all overflow-hidden border-white/5",
                        "fixed inset-x-0 bottom-16 md:relative md:bottom-auto z-40 md:z-10",
                        cart.length > 0 ? "translate-y-0 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] md:shadow-none" : "translate-y-full md:translate-y-0 opacity-0 md:opacity-100"
                      )}>
                        {/* Combined Cart Header & Tabs */}
                        <div className="p-3 md:p-4 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-3 md:gap-4 md:items-center justify-between shrink-0">
                          {/* Left: Headers / Actions */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 bg-neon-blue/10 px-3 py-1.5 rounded-xl border border-neon-blue/20">
                              <ShoppingCart size={14} className="text-neon-blue md:size-4" />
                              <span className="text-[9px] md:text-xs font-black uppercase tracking-tight text-neon-blue">Giỏ hàng</span>
                              <span className="text-[9px] font-bold text-neon-blue/80 px-1 bg-neon-blue/20 rounded-md">
                                {cart.reduce((a, b) => a + b.quantity, 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setIsDirectNoteOpen(!isDirectNoteOpen)}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  currentDirectCart.note || isDirectNoteOpen ? "bg-neon-blue/20 text-neon-blue" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                )}
                                title="Ghi chú đơn hàng"
                              >
                                <FileText size={16} />
                              </button>
                              <button
                                onClick={() => setCart([])}
                                className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-all"
                                title="Xóa giỏ hàng"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Right: Tabs */}
                          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                            {directCarts.map((_, idx) => (
                              <button
                                key={`cart-tab-${idx}`}
                                onClick={() => setActiveDirectCartIndex(idx)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border",
                                  activeDirectCartIndex === idx
                                    ? "bg-neon-blue/20 text-neon-blue border-neon-blue/40 shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                                    : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10"
                                )}
                              >
                                Đơn hàng {idx + 1}
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                setDirectCarts(prev => [...prev, createEmptyCart()]);
                                setActiveDirectCartIndex(directCarts.length);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all border border-white/5 shrink-0"
                              title="Thêm giỏ hàng mới"
                            >
                              <Plus size={14} />
                            </button>
                            {directCarts.length > 1 && (
                              <button
                                onClick={() => {
                                  if (directCarts.length > 1) {
                                    setDirectCarts(prev => prev.filter((_, i) => i !== activeDirectCartIndex));
                                    setActiveDirectCartIndex(Math.max(0, activeDirectCartIndex - 1));
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-all border border-red-400/10 shrink-0"
                                title="Xóa giỏ hàng hiện tại"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isDirectNoteOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-4 md:px-6 pt-4 overflow-hidden"
                            >
                              <div className="p-3 bg-neon-blue/5 border border-neon-blue/20 rounded-2xl space-y-2">
                                <textarea
                                  placeholder="Ghi chú đơn hàng / Tên khách..."
                                  value={currentDirectCart.note}
                                  onChange={(e) => setDirectNote(e.target.value)}
                                  className="w-full bg-transparent p-0 text-xs focus:outline-none min-h-[40px] resize-none text-white/80 placeholder:text-gray-600"
                                  autoFocus
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-1.5">
                          {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                              <ShoppingBag size={48} className="mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Chưa có sản phẩm</p>
                            </div>
                          ) : (
                            cart.map((item, idx) => {
                              const basePrice = item.unitPrice * item.quantity;
                              let discountAmount = 0;
                              if (item.discount > 0) {
                                if (item.discountType === 'percent') discountAmount = (item.unitPrice * item.discount / 100) * item.quantity;
                                else discountAmount = item.discount;
                              }
                              let surchargeAmount = 0;
                              if (item.surcharge > 0) {
                                if (item.surchargeType === 'percent') surchargeAmount = (item.unitPrice * item.surcharge / 100) * item.quantity;
                                else surchargeAmount = item.surcharge * item.quantity;
                              }
                              const itemTotal = Math.max(0, basePrice - discountAmount + surchargeAmount);

                              return (
                                <div key={`${item.product.id}-${idx}`} className="group relative glass p-2 md:p-2.5 rounded-xl border-white/10 hover:border-neon-blue/30 hover:bg-white/[0.04] transition-all">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {item.product.imageUrl && (
                                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="mb-0.5">
                                          <h4 className="font-bold text-[11px] md:text-sm uppercase tracking-tight line-clamp-2 leading-tight w-full text-white">{item.product.name}</h4>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] md:text-[10px]">
                                          {item.product.variant && (
                                            <span className="shrink-0 px-1 py-0.5 rounded bg-neon-purple/20 text-neon-purple font-black uppercase border border-neon-purple/20">
                                              {item.product.variant}
                                            </span>
                                          )}
                                          <span className="text-white/40 font-bold">{formatCurrency(item.product.price)}</span>
                                          {item.unitPrice !== item.product.price && (
                                            <span className="text-neon-blue font-black bg-neon-blue/10 px-1 rounded">Giá mới: {formatCurrency(item.unitPrice)}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 shrink-0 pt-1.5 md:pt-0 border-t md:border-t-0 border-white/5">
                                      <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/5">
                                        <button
                                          onClick={() => updateCartQuantity(item.product.id, -1)}
                                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                                        >
                                          <Minus size={10} />
                                        </button>
                                        <span className="font-mono text-[11px] font-black min-w-[28px] text-center text-white px-0.5">{item.quantity}</span>
                                        <button
                                          onClick={() => updateCartQuantity(item.product.id, 1)}
                                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                                        >
                                          <Plus size={10} />
                                        </button>
                                      </div>

                                      <div className="flex flex-col items-end min-w-[80px] md:min-w-[100px]">
                                        <span className="font-black text-xs md:text-lg text-neon-blue neon-text leading-none">
                                          {formatCurrency(itemTotal)}
                                        </span>
                                        <div className="flex flex-col items-end mt-0.5">
                                          {discountAmount > 0 && <span className="text-[8px] md:text-[9px] font-black text-red-500 uppercase tracking-tighter">-{formatCurrency(discountAmount)}</span>}
                                          {surchargeAmount > 0 && <span className="text-[8px] md:text-[9px] font-black text-green-500 uppercase tracking-tighter">+{formatCurrency(surchargeAmount)}</span>}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => setEditingCartItem({
                                            productId: item.product.id,
                                            quantity: item.quantity,
                                            price: item.unitPrice,
                                            discount: item.discount,
                                            discountType: item.discountType,
                                            surcharge: item.surcharge,
                                            surchargeType: item.surchargeType
                                          })}
                                          className="p-1.5 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue transition-all group/edit"
                                        >
                                          <Edit2 size={13} className="group-hover/edit:text-black transition-colors" />
                                        </button>
                                        <button
                                          onClick={() => removeFromCart(item.product.id)}
                                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 transition-all group/del"
                                        >
                                          <Trash2 size={13} className="group-hover/del:text-white transition-colors" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Cart Summary & Actions */}
                        <div className="p-2 bg-white/[0.02] border-t border-white/5 space-y-2 shrink-0">
                          <div className="space-y-1">
                            {/* Totals & Toggle */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setIsCartExtraVisible(!isCartExtraVisible)}
                                  className={cn(
                                    "p-1.5 rounded-lg border transition-all",
                                    isCartExtraVisible
                                      ? "bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                                      : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                                  )}
                                  title="Mở rộng tùy chọn"
                                >
                                  <ChevronUp size={14} className={cn("transition-transform duration-300", isCartExtraVisible ? "rotate-0" : "rotate-180")} />
                                </button>
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] text-gray-300">
                                  Tổng cộng: <span className="text-[8px] text-gray-500 ml-1">({cart.reduce((a, b) => a + b.quantity, 0)} MON)</span>
                                </span>
                              </div>
                              <span className="text-lg md:text-2xl font-black text-neon-blue neon-text leading-none">
                                {formatCurrency(currentTotal)}
                              </span>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isCartExtraVisible && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 overflow-hidden"
                              >
                                {directPaymentMethod === 'cash' && cart.length > 0 && (
                                  <div className="space-y-3 pt-2 border-t border-white/5">
                                    {/* Quick Cash Selection */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {[10000, 20000, 50000, 100000, 200000, 500000].map((amount) => (
                                        <button
                                          key={amount}
                                          onClick={() => setDirectCashReceived(prev => (typeof prev === 'number' ? prev : 0) + amount)}
                                          className="py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-neon-blue/50 hover:bg-neon-blue/10 transition-all text-[9px] font-bold text-gray-400 active:scale-95"
                                        >
                                          +{amount.toLocaleString('vi-VN')}
                                        </button>
                                      ))}
                                      <button
                                        onClick={() => setDirectCashReceived(currentTotal)}
                                        className="col-span-3 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-[9px] font-bold hover:bg-neon-blue/20 transition-all active:scale-95 uppercase tracking-widest"
                                      >
                                        Khach ??a ??: {formatCurrency(currentTotal)}
                                      </button>
                                    </div>

                                    {/* Custom Amount & Change */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                          <Banknote size={10} className="text-green-400" />
                                          Khach tr?
                                        </label>
                                        <div className="relative">
                                          <input
                                            type="number"
                                            placeholder="0"
                                            value={directCashReceived || ''}
                                            onChange={(e) => setDirectCashReceived(Number(e.target.value))}
                                            className="w-full glass px-3 py-2 rounded-xl text-xs font-black text-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 border border-white/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-gray-500">VND</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                          <ArrowDownLeft size={10} className="text-neon-purple" />
                                          Trả lại
                                        </label>
                                        <div className="w-full glass px-3 py-2 rounded-xl border border-white/5 flex items-center justify-between">
                                          <span className={cn(
                                            "text-xs font-black",
                                            (directCashReceived as number) >= currentTotal ? "text-neon-purple" : "text-gray-500"
                                          )}>
                                            {formatCurrency(Math.max(0, (directCashReceived as number) - currentTotal))}
                                          </span>
                                          <span className="text-[8px] font-bold text-gray-500">VND</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <CreditCard size={10} className="text-neon-blue" />
                                    Hình thức thanh toán
                                  </label>
                                  <div className="flex gap-2 p-1 glass rounded-xl border-white/5">
                                    {[
                                      { id: 'cash', label: 'Tiền Mặt', icon: Banknote },
                                      { id: 'transfer', label: 'C.Khoản', icon: CreditCard }
                                    ].map((method) => (
                                      <button
                                        key={method.id}
                                        onClick={() => setDirectPaymentMethod(method.id as any)}
                                        className={cn(
                                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                                          directPaymentMethod === method.id
                                            ? "bg-neon-blue text-black shadow-lg"
                                            : "text-gray-400 hover:text-white"
                                        )}
                                      >
                                        <method.icon size={12} />
                                        {method.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button
                            disabled={cart.length === 0}
                            onClick={completeSale}
                            className="w-full py-3 rounded-xl bg-neon-blue text-black font-black text-xs md:text-lg shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 uppercase tracking-widest flex items-center justify-center gap-3"
                          >
                            THANH TOÁN NGAY
                            <ArrowRight size={16} className="hidden sm:block" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Online Sales UI */
                  <div className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Side: Workflow (Scanning + Cart) */}
                      <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
                            <h3 className="text-xl font-bold uppercase tracking-tighter italic">BÁN ONLINE <span className="text-neon-purple ml-2 font-black">#{currentDayOrderSTT}</span></h3>
                          </div>
                          <div className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">MODE: POS_ONLINE_SHIP</div>
                        </div>

                        {/* 1. Scanning Hub */}
                        <div className="glass p-6 rounded-[2rem] border-neon-blue/20 shadow-[0_0_50px_rgba(0,242,255,0.05)]">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                                <Scan className="text-neon-blue" size={24} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold">TRẠM QUÉT ĐƠN</h3>
                                <p className="text-gray-400 text-xs">Nhập mã vận đơn và sản phẩm</p>
                              </div>
                            </div>

                            {/* Quick Search */}
                            <div className="flex flex-col gap-2 w-full md:w-96">
                              <div className="flex gap-2 w-full">
                                <div className="relative group flex-1">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
                                  <input
                                    type="text"
                                    placeholder="Tìm hoặc quét nhanh..."
                                    value={salesSearchTerm}
                                    onChange={(e) => setSalesSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && salesSearchTerm) {
                                        const exactMatch = productByNormalizedSku.get(normalizeSearchValue(salesSearchTerm));
                                        if (exactMatch) {
                                          addToCart(exactMatch);
                                          setSalesSearchTerm('');
                                          e.preventDefault();
                                        }
                                      }
                                    }}
                                    className="w-full glass pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 border border-white/5 transition-all text-sm"
                                  />
                                </div>
                              </div>
                              <div className="relative w-full">
                                {salesSearchTerm && (
                                  <div className="absolute top-0 left-0 right-0 mt-2 glass rounded-2xl border border-white/10 shadow-2xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {filteredSalesProducts.map(product => (
                                        <button
                                          key={product.id}
                                          onClick={() => {
                                            addToCart(product);
                                            setSalesSearchTerm('');
                                          }}
                                          className="w-full p-4 hover:bg-white/5 text-left border-b border-white/5 last:border-0 flex items-center justify-between group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                                              {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                              ) : (
                                                <Package size={16} className="text-gray-500" />
                                              )}
                                            </div>
                                            <div>
                                              <p className="font-bold text-sm uppercase tracking-tight">{product.name}</p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] text-gray-500 font-mono">{product.sku}</p>
                                                {product.variant && (
                                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-neon-purple/10 text-neon-purple font-bold">
                                                    {product.variant}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <Plus size={16} className="text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Shipping Code Input */}
                            <div className="relative group">
                              <div className="absolute -top-2 left-4 px-2 bg-[#0a0a0b] text-[9px] font-bold text-neon-blue uppercase tracking-widest z-10">Mã vận đơn</div>
                              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
                              <input
                                type="text"
                                placeholder="Quét hoặc nhập mã..."
                                value={shippingCode}
                                onChange={(e) => setShippingCode(e.target.value)}
                                className="w-full glass pl-11 pr-4 py-4 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-neon-blue/50 border border-white/5"
                              />
                              {shippingCode && <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400" size={16} />}
                            </div>

                            {/* Product SKU Input */}
                            <div className="relative group">
                              <div className="absolute -top-2 left-4 px-2 bg-[#0a0a0b] text-[9px] font-bold text-neon-blue uppercase tracking-widest z-10">Mã Sản Phẩm</div>
                              <Scan className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
                              <input
                                type="text"
                                placeholder="Quét mã SKU..."
                                value={onlineSkuInput}
                                onChange={(e) => setOnlineSkuInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const product = products.find(p => p.sku === onlineSkuInput.trim());
                                    if (product) {
                                      addToCart(product);
                                      setOnlineSkuInput('');
                                    } else {
                                      alert('Không tìm thấy sản phẩm!');
                                    }
                                  }
                                }}
                                className="w-full glass pl-11 pr-4 py-4 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-neon-blue/50 border border-white/5"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Cart & Order Summary */}
                        <div className="glass p-6 rounded-[2rem] border-white/10 shadow-xl">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold flex items-center gap-3">
                              <ShoppingCart size={20} className="text-neon-blue" />
                              Chi tiết đơn hàng
                              <span className="px-2 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue text-[10px] font-bold">
                                {cart.length} sản phẩm
                              </span>
                            </h4>
                            {cart.length > 0 && (
                              <button onClick={() => setCart([])} className="text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase font-bold tracking-wider">Xóa giỏ hàng</button>
                            )}
                          </div>

                          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                            {cart.map((item, idx) => {
                              let price = item.unitPrice;
                              if (item.discount > 0) {
                                if (item.discountType === 'percent') price -= (item.unitPrice * item.discount / 100);
                                else price -= item.discount;
                              }
                              if (item.surcharge > 0) {
                                if (item.surchargeType === 'percent') price += (item.unitPrice * item.surcharge / 100);
                                else price += item.surcharge;
                              }
                              const finalPrice = Math.max(0, price);

                              return (
                                <div key={`${item.product.id}-${idx}`} className="glass p-4 rounded-xl border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden shrink-0">
                                      {item.product.imageUrl ? (
                                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="text-gray-400" size={20} />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-bold text-sm uppercase tracking-tight truncate leading-tight">{item.product.name}</h5>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{item.product.sku}</span>
                                        {item.product.variant && (
                                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-neon-purple/10 text-neon-purple font-black border border-neon-purple/20 uppercase tracking-tighter">
                                            {item.product.variant}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-neon-blue font-bold">{formatCurrency(finalPrice)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3 glass rounded-xl p-1.5 border-white/10">
                                      <button onClick={() => updateCartQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"><Minus size={12} /></button>
                                      <span className="text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                                      <button onClick={() => updateCartQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"><Plus size={12} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product.id)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><X size={16} /></button>
                                  </div>
                                </div>
                              );
                            })}
                            {cart.length === 0 && (
                              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 opacity-20">
                                  <ShoppingCart size={32} />
                                </div>
                                <p className="text-sm font-medium opacity-40">Giỏ hàng đang trống</p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Ghi chú & Thông tin khách</label>
                              <textarea
                                placeholder="Nhập tên khách, SĐT, Địa chỉ hoặc ghi chú đặc biệt..."
                                value={onlineNote}
                                onChange={(e) => setOnlineNote(e.target.value)}
                                className="w-full glass px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue/30 min-h-[100px] resize-none border border-white/5"
                              />
                            </div>
                            <div className="flex flex-col justify-between gap-6">
                              <div className="glass p-4 rounded-2xl border-white/5 bg-gradient-to-br from-neon-blue/5 to-transparent">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-400">Tạm tính:</span>
                                  <span className="text-sm font-medium">{formatCurrency(currentTotal)}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                  <span className="text-sm font-bold">Tổng thanh toán:</span>
                                  <span className="text-2xl font-black text-neon-blue">
                                    {formatCurrency(currentTotal)}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={completeSale}
                                disabled={!shippingCode || cart.length === 0}
                                className="w-full py-4 bg-neon-blue text-black font-black rounded-xl hover:bg-white transition-all shadow-[0_0_30px_rgba(0,242,255,0.3)] disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-wider"
                              >
                                <Check size={20} />
                                Xác nhận & Hoàn tất
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Order List */}
                      <div className="lg:col-span-4 space-y-6">
                        <div className="glass p-6 rounded-[2rem] border-white/10 shadow-xl h-full flex flex-col min-h-[600px]">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <History size={20} className="text-gray-400" />
                              </div>
                              Danh Sách Đơn Hàng
                            </h4>
                          </div>

                          <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                              type="text"
                              placeholder="Tìm mã vận đơn..."
                              value={onlineOrderSearchQuery}
                              onChange={(e) => setOnlineOrderSearchQuery(e.target.value)}
                              className="w-full glass pl-10 pr-4 py-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neon-blue/30 border border-white/5"
                            />
                          </div>

                          {/* Date Filter Chips */}
                          <div className="flex flex-wrap gap-2 mb-6">
                            {[
                              { id: 'all', label: 'Tất cả' },
                              { id: 'today', label: 'Hôm nay' },
                              { id: 'yesterday', label: 'Hôm qua' },
                              { id: '7days', label: '7 ngày' },
                              { id: 'custom', label: 'Tùy chọn' }
                            ].map(chip => (
                              <button
                                key={chip.id}
                                onClick={() => setOnlineDateFilter(chip.id as any)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                                  onlineDateFilter === chip.id
                                    ? "bg-neon-blue/20 text-neon-blue border-neon-blue/50 shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                                    : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10"
                                )}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>

                          {onlineDateFilter === 'custom' && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-neon-blue" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Khoảng thời gian tùy chỉnh</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Bắt đầu</label>
                                  <div className="relative">
                                    <input
                                      type="date"
                                      value={onlineDateRange.start}
                                      onChange={(e) => setOnlineDateRange(prev => ({ ...prev, start: e.target.value }))}
                                      className="w-full glass pl-3 pr-2 py-2.5 rounded-xl text-[10px] border-white/5 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 text-white font-medium color-scheme-dark"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Kết thúc</label>
                                  <div className="relative">
                                    <input
                                      type="date"
                                      value={onlineDateRange.end}
                                      onChange={(e) => setOnlineDateRange(prev => ({ ...prev, end: e.target.value }))}
                                      className="w-full glass pl-3 pr-2 py-2.5 rounded-xl text-[10px] border-white/5 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 text-white font-medium color-scheme-dark"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={() => { setOnlineDateRange({ start: '', end: '' }); setOnlineDateFilter('all'); }}
                                  className="text-[9px] font-bold text-red-400/70 hover:text-red-400 uppercase tracking-tighter transition-colors"
                                >
                                  Xóa bộ lọc tùy chọn
                                </button>
                              </div>
                            </motion.div>
                          )}

                          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredOnlineOrders.map(order => (
                                <div
                                  key={order.id}
                                  onClick={() => {
                                    const t = order.transactions[0];
                                    setEditingTransaction(t);
                                    setSkuSearch(products.find(p => p.id === t.productId)?.sku || '');

                                    setEditShippingCode(order.shippingCode);
                                    setEditNote(order.note);

                                    // Initialize local order transactions for the whole order
                                    const allTrans = transactions.filter(tr =>
                                      order.shippingCode
                                        ? (tr.note?.includes(`[MV?: ${order.shippingCode}]`) || tr.note?.includes(`[MVĐ: ${order.shippingCode}]`))
                                        : (tr.id === t.id)
                                    );
                                    setOrderTransactionsState(allTrans);
                                    setOriginalOrderTransactions(allTrans);
                                  }}
                                  className="glass p-4 rounded-2xl border-white/5 flex items-center justify-between hover:bg-white/10 hover:border-neon-blue/30 transition-all group cursor-pointer relative overflow-hidden"
                                >
                                  <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-neon-blue/10 text-neon-blue flex items-center justify-center group-hover:bg-neon-blue/20 transition-colors overflow-hidden shrink-0">
                                      {order.transactions[0]?.productImageUrl ? (
                                        <img src={order.transactions[0].productImageUrl} alt="order" className="w-full h-full object-cover" />
                                      ) : (
                                        <Package size={20} />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold truncate max-w-[140px] text-white group-hover:text-neon-blue transition-colors">
                                        {order.shippingCode || 'Đơn hàng không mã'}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[9px] text-gray-500 font-medium">
                                          {new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                        <p className="text-[9px] font-bold text-neon-purple">
                                          {order.transactions.length} sản phẩm
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right relative z-10">
                                    <p className="text-[10px] font-mono text-gray-400 mb-1 group-hover:text-gray-300 transition-colors">
                                      {order.note || (order.transactions[0].productName.length > 15 ? order.transactions[0].productName.slice(0, 12) + '...' : order.transactions[0].productName)}
                                    </p>
                                    <div className="flex items-center justify-end gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                                      <span className="text-[9px] text-green-400 font-black uppercase tracking-tighter">Hoàn tất</span>
                                    </div>
                                  </div>

                                  {/* Hover Action Overlay */}
                                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-neon-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Edit2 size={14} className="text-neon-blue animate-pulse" />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    {/* Category Scroller (Mobile) */}
                    <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                      {inventoryCategoryOptions.map((cat, idx) => (
                          <button
                            key={`mobile-cat-${cat}-${idx}`}
                            onClick={() => setSearchQuery(cat === 'Tất cả' ? '' : cat)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                              (searchQuery === cat || (cat === 'Tất cả' && !searchQuery))
                                ? "bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                                : "glass text-gray-400 border-white/10"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                        className="flex items-center gap-3 glass p-2.5 rounded-2xl border-white/10 hover:bg-white/5 transition-all w-full md:min-w-[220px] justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <Filter size={18} className="text-neon-blue" />
                          <span className="text-sm font-bold">
                            {sortBy === 'manual' && "Thứ tự tùy chỉnh"}
                            {sortBy === 'name' && "Tên sản phẩm (A-Z)"}
                            {sortBy === 'quantity' && "Tồn kho (Thấp -> Cao)"}
                            {sortBy === 'restock' && "Gợi ý nhập hàng (Nhiều -> It)"}
                          </span>
                        </div>
                        <ChevronDown size={16} className={cn("text-gray-500 transition-transform duration-300", isSortDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isSortDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setIsSortDropdownOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full left-0 mt-2 w-full glass rounded-2xl border-white/10 overflow-hidden z-20 shadow-2xl backdrop-blur-xl"
                            >
                              {[
                                { id: 'manual', label: 'Thứ tự tùy chỉnh' },
                                { id: 'name', label: 'Tên sản phẩm (A-Z)' },
                                { id: 'quantity', label: 'Tồn kho (Thấp -> Cao)' },
                                { id: 'restock', label: 'Gợi ý nhập hàng (Nhiều -> Ít)' },
                              ].map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => {
                                    setSortBy(option.id as any);
                                    setIsSortDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-between",
                                    sortBy === option.id ? "text-neon-blue bg-white/5" : "text-gray-300"
                                  )}
                                >
                                  {option.label}
                                  {sortBy === option.id && <Check size={14} />}
                                </button>
                              ))}

                              <button
                                onClick={() => {
                                  toggleOrderLock();
                                  setIsSortDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-3 text-sm font-bold transition-colors flex items-center gap-2 border-t border-white/5",
                                  isOrderLocked ? "text-neon-blue hover:bg-neon-blue/10" : "text-yellow-400 hover:bg-yellow-400/10"
                                )}
                              >
                                {isOrderLocked ? (
                                  <>
                                    <Check size={14} />
                                    Mở khóa để thay đổi thứ tự
                                  </>
                                ) : (
                                  <>
                                    <Lock size={14} />
                                    Cố định thứ tự hiện tại
                                  </>
                                )}
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {sortBy === 'manual' && searchQuery && (
                      <span className="text-[10px] text-yellow-400/70 ml-2 italic">
                        * Tắt tìm kiếm để sử dụng kéo/thả
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {checkedProducts.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 p-2 px-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
                        title="Xóa các mục đã chọn"
                      >
                        <Trash2 size={16} />
                        <span className="text-[10px] font-black uppercase">Xóa ({checkedProducts.length})</span>
                      </button>
                    )}
                    <div className="flex items-center gap-1 glass p-1 rounded-full border-white/5">
                      <button
                        onClick={exportProductsToCSV}
                        title="Xuất file (CSV/Excel)"
                        className="flex items-center gap-2 p-2 px-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-neon-blue transition-all"
                      >
                        <Download size={16} />
                        <span className="text-[10px] font-black uppercase">Xuất</span>
                      </button>
                      <label className="flex items-center gap-2 p-2 px-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-neon-purple transition-all cursor-pointer">
                        <UploadCloud size={16} />
                        <span className="text-[10px] font-black uppercase">Nhập</span>
                        <input type="file" accept=".csv" onChange={importProductsFromCSV} className="hidden" />
                      </label>
                    </div>

                    <button
                      onClick={() => {
                        setFormData({ quantity: 1, note: '', name: '', sku: '', category: '', variant: '', minStock: 5, recommendedStock: 10, price: 0 });
                        setIsModalOpen('add');
                      }}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-neon-purple text-white font-bold px-6 py-2.5 rounded-full hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(188,19,254,0.3)] active:scale-95"
                    >
                      <Plus size={18} />
                      <span className="text-xs uppercase tracking-tighter">THÊM SẢN PHẨM</span>
                    </button>
                  </div>
                </div>

                <div className="glass rounded-[2rem] md:rounded-3xl overflow-hidden border border-white/10">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-4 w-10">
                            <input
                              type="checkbox"
                              checked={products.filter(p => !p.isHeader).length > 0 && checkedProducts.length === products.filter(p => !p.isHeader).length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCheckedProducts(products.filter(p => !p.isHeader).map(p => p.id));
                                } else {
                                  setCheckedProducts([]);
                                }
                              }}
                              className="w-5 h-5 rounded-lg border-white/20 bg-white/5 text-neon-blue focus:ring-neon-blue/50 transition-all cursor-pointer accent-neon-blue ml-2"
                              title={checkedProducts.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            />
                          </th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Sản phẩm</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Danh mục</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Biến thể</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Tồn kho</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Đề Xuất Nhập</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Đơn giá</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Cập Nhật</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <Reorder.Group
                        as="tbody"
                        axis="y"
                        values={sortedProducts}
                        onReorder={handleReorder}
                        className="divide-y divide-white/5"
                      >
                        {sortedProducts.map((product, idx) => (
                          <Reorder.Item
                            key={product.id}
                            value={product}
                            as="tr"
                            onContextMenu={(e) => handleContextMenu(e, product)}
                            dragListener={sortBy === 'manual' && !searchQuery && !isOrderLocked}
                            className={cn(
                              "hover:bg-white/5 transition-colors group relative",
                              sortBy === 'manual' && !searchQuery && !isOrderLocked ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                              checkedProducts.includes(product.id) && "opacity-40 grayscale-[0.5]"
                            )}
                          >
                            {product.isHeader ? (
                              <td colSpan={9} className="px-6 py-3 bg-white/5 border-y border-white/10">
                                <div className="flex items-center justify-between group/header">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-neon-blue/10 flex items-center justify-center">
                                      <Filter className="text-neon-blue" size={16} />
                                    </div>
                                    <span className="font-bold text-sm tracking-widest uppercase text-neon-blue">{product.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setRenamingProduct(product);
                                        setRenameValue(product.name);
                                      }}
                                      className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                    >
                                      <Settings size={14} />
                                    </button>
                                    <button
                                      onClick={() => setDeletingProduct(product)}
                                      className="p-1 hover:bg-red-400/10 rounded text-gray-500 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="px-4 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={checkedProducts.includes(product.id)}
                                    onChange={() => {
                                      setCheckedProducts(prev =>
                                        prev.includes(product.id)
                                          ? prev.filter(id => id !== product.id)
                                          : [...prev, product.id]
                                      );
                                    }}
                                    className="w-5 h-5 rounded-lg border-white/20 bg-white/5 text-neon-blue focus:ring-neon-blue/50 transition-all cursor-pointer accent-neon-blue"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-neon-blue/20 transition-colors overflow-hidden shrink-0">
                                      {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <Package className="text-gray-400 group-hover:text-neon-blue" size={20} />
                                      )}
                                    </div>
                                    <div>
                                      <div className={cn(
                                        "font-bold transition-all",
                                        checkedProducts.includes(product.id) && "line-through text-gray-500"
                                      )}>{product.name}</div>
                                      <div className="text-xs text-gray-500 font-mono">{product.sku}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">
                                    {product.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-gray-400">
                                    {product.variant || '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className={cn(
                                    "font-bold",
                                    product.quantity <= product.minStock ? "text-yellow-400" : "text-white"
                                  )}>
                                    {product.quantity}
                                  </div>
                                  <div className="flex flex-col text-[10px] text-gray-500">
                                    <span>Min: {product.minStock}</span>
                                    <span>Đề Xuất: {product.recommendedStock}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className={cn(
                                    "font-bold",
                                    product.recommendedStock > product.quantity ? "text-neon-blue" : "text-gray-500"
                                  )}>
                                    {Math.max(0, product.recommendedStock - product.quantity)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-sm">
                                  {formatCurrency(product.price)}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                  {new Date(product.lastUpdated).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 text-right relative">
                                  {product.note && (
                                    <div className="absolute top-0 right-32 -translate-y-1.5 z-10 pointer-events-none">
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-[#0a0a0a]/80 backdrop-blur-xl px-2 py-0.5 border-t border-x border-neon-blue/20 rounded-t-lg flex items-center gap-1.5 shadow-[0_-2px_8px_rgba(0,242,255,0.1)]"
                                      >
                                        <FileText size={8} className="text-neon-blue/80" />
                                        <span className="text-[8px] text-neon-blue/90 font-bold uppercase tracking-widest whitespace-nowrap">
                                          {product.note}
                                        </span>
                                      </motion.div>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="flex flex-col gap-1">
                                      <button
                                        onClick={() => { setSelectedProduct(product); setIsModalOpen('in'); }}
                                        className="p-1 hover:bg-green-400/20 text-green-400 rounded transition-colors" title="Nhập kho"
                                      >
                                        <Plus size={14} />
                                      </button>
                                      <button
                                        onClick={() => { setSelectedProduct(product); setIsModalOpen('out'); }}
                                        className="p-1 hover:bg-red-400/20 text-red-400 rounded transition-colors" title="Xuất kho"
                                      >
                                        <Minus size={14} />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className="p-3 hover:bg-neon-blue/20 text-neon-blue rounded-xl transition-colors" title="Chỉnh Sửa"
                                    >
                                      <Settings size={20} />
                                    </button>
                                    <button
                                      onClick={() => setDeletingProduct(product)}
                                      className="p-3 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors" title="Xóa"
                                    >
                                      <Trash2 size={20} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </table>
                  </div>

                  {/* Mobile Inventory Grid */}
                  <div className="md:hidden p-2 pb-32">
                    <div className="grid grid-cols-2 gap-2">
                      {sortedProducts.map((product) => (
                        <div
                          key={product.id}
                          className={cn(
                            "relative flex flex-col",
                            product.isHeader ? "col-span-2 mt-6 first:mt-0" : ""
                          )}
                        >
                          {product.isHeader ? (
                            <div className="flex items-center gap-2 px-1 py-2 text-[10px] font-black text-neon-blue uppercase tracking-[0.2em] opacity-80 mb-1 border-b border-neon-blue/20">
                              <Filter size={14} className="text-neon-blue" />
                              {product.name}
                            </div>
                          ) : (
                            <motion.div
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "glass rounded-2xl border-white/5 overflow-hidden flex flex-col h-full transition-all active:bg-white/10",
                                checkedProducts.includes(product.id) && "opacity-40 grayscale-[0.5]"
                              )}
                              onClick={() => {
                                setCheckedProducts(prev =>
                                  prev.includes(product.id)
                                    ? prev.filter(id => id !== product.id)
                                    : [...prev, product.id]
                                );
                              }}
                            >
                              {/* Product Image Area */}
                              <div className="aspect-square w-full relative bg-white/5 border-b border-white/5 overflow-hidden">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="text-gray-700/50" size={32} />
                                  </div>
                                )}

                                {/* Status Overlays */}
                                <div className="absolute top-1.5 right-1.5">
                                  <div className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-black shadow-lg backdrop-blur-md border border-white/10",
                                    product.quantity <= product.minStock ? "bg-red-500/90 text-white animate-pulse" : "bg-black/60 text-white"
                                  )}>
                                    {product.quantity}
                                  </div>
                                </div>

                                {product.variant && (
                                  <div className="absolute bottom-1.5 left-1.5 max-w-[80%]">
                                    <div className="px-1.5 py-0.5 rounded bg-neon-purple/80 text-white text-[8px] font-black uppercase truncate border border-neon-purple/20 backdrop-blur-sm">
                                      {product.variant}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Content Area */}
                              <div className="p-2 flex flex-col flex-1 gap-1">
                                <h4 className={cn(
                                  "font-bold text-[10px] leading-tight line-clamp-2 uppercase tracking-tight",
                                  checkedProducts.includes(product.id) && "line-through text-gray-500"
                                )}>
                                  {product.name}
                                </h4>

                                <div className="flex flex-col gap-0.5 mb-1">
                                  <p className="text-[8px] text-neon-blue/70 font-mono font-bold tracking-tighter uppercase truncate">SKU: {product.sku}</p>
                                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Tồn Kho Đề Xuất: {product.recommendedStock}</p>
                                  <p className={cn(
                                    "text-[8px] font-black uppercase tracking-tighter",
                                    product.recommendedStock > product.quantity ? "text-yellow-400" : "text-gray-600"
                                  )}>
                                    Đề Xuất Nhập: {Math.max(0, product.recommendedStock - product.quantity)}
                                  </p>
                                </div>

                                <div className="flex items-center justify-end mt-auto pt-1">
                                  {/* Compact Actions Menu Trigger */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProduct(product);
                                      setContextMenu({ x: e.clientX, y: e.clientY, product });
                                    }}
                                    className="p-1 px-2 hover:bg-white/10 rounded-lg text-gray-500 active:text-neon-blue transition-colors border border-white/5"
                                  >
                                    <Settings size={12} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* History Navigation & Filters */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2 p-1 glass rounded-2xl w-fit">
                      {[
                        { id: 'all', label: 'Tất Cả', icon: FileText },
                        { id: 'direct', label: 'Bán Hàng Trực Tiếp', icon: ShoppingBag },
                        { id: 'online', label: 'Bán Hàng Online', icon: Globe },
                        { id: 'inventory', label: 'Nhập Xuất', icon: Boxes }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setHistorySubTab(tab.id as any)}
                          className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider",
                            historySubTab === tab.id
                              ? "bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <tab.icon size={14} />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                      {[
                        { id: 'all', label: 'Tất Cả' },
                        { id: 'today', label: 'Hôm Nay' },
                        { id: 'yesterday', label: 'Hôm Qua' },
                        { id: '7days', label: '7 Ngày' },
                        { id: 'custom', label: 'Tùy Chọn' }
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setHistoryDateFilter(filter.id as any)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            historyDateFilter === filter.id
                              ? "bg-white/10 text-white shadow-lg"
                              : "text-gray-500 hover:text-gray-300"
                          )}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setIsHistorySettingsOpen(!isHistorySettingsOpen)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest",
                        isHistorySettingsOpen
                          ? "bg-neon-blue text-black border-neon-blue shadow-[0_0_20px_rgba(0,242,255,0.3)]"
                          : "glass border-white/10 text-gray-400 hover:text-white"
                      )}
                    >
                      <Trash2 size={16} />
                      <span className="hidden md:inline">QUẢN LÝ DỮ LIỆU</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {historySubTab === 'inventory' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-xl w-fit ml-2"
                      >
                        {[
                          { id: 'retail', label: 'Giao Dịch Lẻ', icon: Package },
                          { id: 'batch', label: 'Giao Dịch Lô', icon: Boxes }
                        ].map((subTab) => (
                          <button
                            key={subTab.id}
                            onClick={() => setInventoryHistorySubTab(subTab.id as any)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold transition-all text-[10px] uppercase tracking-widest",
                              inventoryHistorySubTab === subTab.id
                                ? "bg-white/10 text-white"
                                : "text-gray-500 hover:text-gray-300"
                            )}
                          >
                            <subTab.icon size={12} />
                            {subTab.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isHistorySettingsOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, height: 0 }}
                        animate={{ opacity: 1, scale: 1, height: 'auto' }}
                        exit={{ opacity: 0, scale: 0.95, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="glass p-6 md:p-8 rounded-[2rem] border-neon-blue/20 bg-gradient-to-br from-neon-blue/5 to-transparent space-y-6">
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-4 flex-1">
                              <div>
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                  <History className="text-neon-blue" size={20} />
                                  Tự Động Dọn Dẹp Lịch Sử
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Tự động xóa các giao dịch cũ để tối ưu dung lượng cơ sở dữ liệu</p>
                              </div>

                              <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-gray-300">Kích Hoạt Tự Động Xóa</p>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Hệ Thống Sẽ Tự Chạy Dọn Dẹp Theo Thời Gian Đã Cài Đặt</p>
                                </div>
                                <button
                                  onClick={() => setHistorySettings(prev => ({ ...prev, autoDelete: !prev.autoDelete }))}
                                  className={cn(
                                    "w-12 h-6 rounded-full p-1 transition-all duration-300 relative",
                                    historySettings.autoDelete ? "bg-neon-blue" : "bg-gray-700"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded-full bg-white transition-all duration-300",
                                    historySettings.autoDelete ? "translate-x-6" : "translate-x-0"
                                  )} />
                                </button>
                              </div>

                              {historySettings.autoDelete && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-4"
                                >
                                  <div>
                                    <label className="text-[10px] font-bold text-neon-blue uppercase tracking-widest ml-1">Thời Gian Lưu Giữ</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                                      {[7, 15, 30, 60, 90].map((days) => (
                                        <button
                                          key={days}
                                          type="button"
                                          onClick={() => setHistorySettings(prev => ({ ...prev, retentionDays: days }))}
                                          className={cn(
                                            "py-2 rounded-xl text-[10px] font-bold transition-all border",
                                            historySettings.retentionDays === days
                                              ? "bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                                              : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                                          )}
                                        >
                                          {days} NGÀY
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Hoặc Nhập Thủ Công (Ngày)</label>
                                    <input
                                      type="number"
                                      value={historySettings.retentionDays}
                                      onChange={(e) => setHistorySettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                                      className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 font-mono text-lg"
                                      placeholder="30"
                                    />
                                    <p className="text-[9px] text-gray-500 italic ml-1">* Giao Dịch Cũ Hơn Số Ngày Sẽ Bị Xóa Vĩnh Viễn.</p>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            <div className="space-y-4 flex-1">
                              <div>
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                  <Trash2 className="text-red-500" size={20} />
                                  Dọn Dẹp Thủ Công
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Xóa Dữ Liệu Ngay Lập Tức Theo Yêu Cầu</p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                  disabled={isSaving}
                                  onClick={() => handleManualCleanup('old')}
                                  className="p-4 rounded-2xl border border-neon-blue/20 bg-neon-blue/5 hover:bg-neon-blue/10 transition-all text-left flex flex-col gap-1 group disabled:opacity-50"
                                >
                                  <span className="text-neon-blue font-bold text-sm">Xóa Dữ Liệu Cũ</span>
                                  <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter group-hover:text-neon-blue/70">Xóa Dữ Liệu Cũ Hơn {historySettings.retentionDays} Ngày</span>
                                </button>
                                <button
                                  disabled={isSaving}
                                  onClick={() => handleManualCleanup('all')}
                                  className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all text-left flex flex-col gap-1 group disabled:opacity-50"
                                >
                                  <span className="text-red-500 font-bold text-sm">Xóa Toàn Bộ</span>
                                  <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter group-hover:text-red-500/70">Xóa Vĩnh Viễn Tất Cả Lịch Sử</span>
                                </button>
                              </div>

                              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 space-y-2">
                                <div className="flex items-center gap-2 text-yellow-500">
                                  <AlertTriangle size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Lưu Ý Bảo Mật</span>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed italic">Hành Động Này Sẽ Thực Hiện Trực Tiếp Trên Supabase. Hãy Đảm Bảo Rằng Bạn Đã Sao Lưu Dữ Liệu Của Mình Trước Khi Thực Hiện Xóa Vĩnh Viễn.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {historyDateFilter === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-wrap gap-4 glass p-4 rounded-2xl border-white/5"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Từ ngày</label>
                        <input
                          type="date"
                          value={historyDateRange.start}
                          onChange={(e) => setHistoryDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-neon-blue"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Đến ngày</label>
                        <input
                          type="date"
                          value={historyDateRange.end}
                          onChange={(e) => setHistoryDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-neon-blue"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="glass rounded-[2rem] md:rounded-3xl overflow-hidden border border-white/10">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Mã đơn / lô</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Thời gian</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Thanh toán</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Danh mục</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-center">Sản phẩm</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Biến thể</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Loại</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-right">Đơn giá</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-center">Số lượng</th>
                          <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {groupedHistoryTransactions.map(group => {
                          const isSingle = group.transactions.length === 1;
                          const firstTrans = group.transactions[0];
                          const product = products.find(p => p.id === firstTrans.productId);

                          return (
                            <React.Fragment key={group.id}>
                              <tr
                                onClick={() => toggleHistoryOrderExpand(group.id)}
                                className={cn(
                                  "hover:bg-white/5 transition-colors group",
                                  group.transactions.length > 1 ? "cursor-pointer" : ""
                                )}
                              >
                                <td className="px-6 py-4 font-mono text-sm">
                                  <div className="flex items-center gap-2">
                                    {group.transactions.length > 1 && (
                                      <ChevronDown
                                        size={16}
                                        className={cn(
                                          "transition-transform text-gray-500 group-hover:text-white shrink-0",
                                          expandedHistoryOrders.has(group.id) && "rotate-180"
                                        )}
                                      />
                                    )}
                                    {group.orderNumber ? (
                                      <span className="bg-neon-blue/10 text-neon-blue px-2 py-1 rounded font-black">
                                        #{group.orderNumber}
                                      </span>
                                    ) : group.batchName ? (
                                      <span className="bg-neon-purple/10 text-neon-purple px-2 py-1 rounded font-black text-[10px] truncate max-w-[120px]">
                                        {group.batchName}
                                      </span>
                                    ) : (
                                      <span className="text-gray-600 italic text-[10px]">Giao dịch lẻ</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                                  {new Date(group.timestamp).toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4">
                                  {group.paymentMethod ? (
                                    <div className="flex items-center gap-1.5 min-w-[120px]">
                                      <div className={cn(
                                        "p-1.5 rounded-lg",
                                        group.paymentMethod === 'cash' ? "bg-green-400/10 text-green-400" : "bg-neon-blue/10 text-neon-blue"
                                      )}>
                                        {group.paymentMethod === 'cash' ? <Banknote size={14} /> : <CreditCard size={14} />}
                                      </div>
                                      <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        group.paymentMethod === 'cash' ? "text-green-400" : "text-neon-blue"
                                      )}>
                                        {group.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                                      </span>
                                    </div>
                                  ) : <span className="text-gray-600 font-mono text-xs">---</span>}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400 uppercase tracking-tighter">
                                  {isSingle ? (product?.category || '---') : <span className="italic">Đa danh mục</span>}
                                </td>

                                <td className="px-6 py-4 font-bold text-sm text-center">
                                  {group.batchId ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Package size={14} className="text-neon-purple" />
                                      <span className="text-gray-400 font-normal uppercase tracking-tighter text-[10px]">{group.transactions.length} MẶT HÀNG</span>
                                    </div>
                                  ) : group.transactions.length > 1 ? (
                                    <span className="text-gray-400 italic font-normal text-xs">{group.transactions.length} sản phẩm</span>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      {(group.transactions[0].productImageUrl || product?.imageUrl) && (
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                                          <img
                                            src={group.transactions[0].productImageUrl || product?.imageUrl}
                                            alt={group.transactions[0].productName}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        </div>
                                      )}
                                      <span>{group.transactions[0].productName}</span>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(group.transactions[0].productSku || '')}
                                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono text-gray-400 transition-colors hover:text-neon-blue hover:border-neon-blue/30"
                                        title="Sao chép mã SKU"
                                      >
                                        <span>{group.transactions[0].productSku || '---'}</span>
                                        <Copy size={10} />
                                      </button>
                                    </div>
                                  )}
                                </td>

                                <td className="px-6 py-4 text-xs text-gray-400">
                                  {isSingle ? (product?.variant || '---') : <span className="italic font-mono">...</span>}
                                </td>

                                <td className="px-6 py-4 text-center">
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    group.type === 'in' ? "bg-green-400/10 text-green-400 border border-green-400/20" : "bg-red-400/10 text-red-400 border border-red-400/20"
                                  )}>
                                    {group.type === 'in' ? 'Nhập' : 'Xuất'}
                                  </span>
                                </td>

                                <td className="px-6 py-4 text-right font-mono text-sm text-neon-blue">
                                  {isSingle ? (((firstTrans.price || product?.price || 0)).toLocaleString('vi-VN') + '₫') : '---'}
                                </td>

                                <td className="px-6 py-4 font-bold text-center">
                                  {group.type === 'in' ? '+' : '-'}{group.totalQuantity}
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-400 italic max-w-[200px] truncate" title={group.note}>
                                  {group.note || '-'}
                                </td>
                              </tr>
                              {/* Expanded Order Details Row */}
                              <AnimatePresence>
                                {expandedHistoryOrders.has(group.id) && group.transactions.length > 1 && (
                                  <tr className="bg-white/[0.02]">
                                    <td colSpan={10} className="p-0 border-b border-white/5">
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-10 py-6 space-y-4">
                                          <div className="text-[10px] font-black text-neon-blue uppercase tracking-widest border-b border-white/10 pb-2 mb-2 flex justify-between">
                                            <span>CHI TIẾT {group.batchId ? 'LÔ HÀNG' : 'ĐƠN HÀNG'}</span>
                                            <span>{group.transactions.length} SẢN PHẨM</span>
                                          </div>
                                          <div className="grid grid-cols-1 gap-3">
                                            {group.transactions.map((t, idx) => {
                                              const p = products.find(prod => prod.id === t.productId);
                                              return (
                                                <div key={`history-detail-${t.id || idx}`} className="grid grid-cols-12 items-center gap-4 py-3 px-5 glass rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                                  <div className="col-span-1 p-2 rounded-xl bg-white/5 text-gray-400 flex justify-center">
                                                    {(t.productImageUrl || p?.imageUrl) ? (
                                                      <img
                                                        src={t.productImageUrl || p?.imageUrl}
                                                        alt={t.productName}
                                                        className="w-full h-full object-cover rounded-xl"
                                                        loading="lazy"
                                                      />
                                                    ) : (
                                                      <Package size={16} />
                                                    )}
                                                  </div>
                                                  <div className="col-span-3">
                                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">{p?.category || 'KHÁC'}</p>
                                                    <p className="font-bold text-sm text-gray-100 truncate">{t.productName}</p>
                                                    <button
                                                      type="button"
                                                      onClick={() => copyToClipboard(t.productSku || '')}
                                                      className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono text-gray-400 transition-colors hover:text-neon-blue hover:border-neon-blue/30"
                                                      title="Sao chép mã SKU"
                                                    >
                                                      <span>{t.productSku || '---'}</span>
                                                      <Copy size={10} />
                                                    </button>
                                                  </div>
                                                  <div className="col-span-3">
                                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">BIẾN THỂ</p>
                                                    <p className="text-xs text-gray-400 font-bold">{p?.variant || '---'}</p>
                                                  </div>
                                                  <div className="col-span-2 text-right">
                                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">GIÁ</p>
                                                    <p className="text-xs font-mono text-neon-blue">{formatCurrency(t.price || p?.price || 0)}</p>
                                                  </div>
                                                  <div className="col-span-1 text-center">
                                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">SL</p>
                                                    <p className={cn("font-mono font-bold", t.type === 'in' ? 'text-green-400' : 'text-red-400')}>
                                                      {t.type === 'in' ? '+' : '-'}{t.quantity}
                                                    </p>
                                                  </div>
                                                  <div className="col-span-2 text-right">
                                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">THANH TOÁN</p>
                                                    <p className="font-mono font-black text-white">{formatCurrency(t.quantity * (t.price || p?.price || 0))}</p>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </motion.div>
                                    </td>
                                  </tr>
                                )}
                              </AnimatePresence>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile History Cards */}
                  <div className="md:hidden divide-y divide-white/5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {groupedHistoryTransactions.map(group => (
                      <div key={group.id} className="bg-transparent transition-colors border-b border-white/5 last:border-0">
                        <div
                          className={cn("p-4 group/card", group.transactions.length > 1 ? "active:bg-white/5 cursor-pointer" : "")}
                          onClick={() => group.transactions.length > 1 && toggleHistoryOrderExpand(group.id)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-start gap-2">
                              {group.transactions.length > 1 && (
                                <ChevronDown
                                  size={16}
                                  className={cn(
                                    "transition-transform text-gray-500 mt-1 shrink-0",
                                    expandedHistoryOrders.has(group.id) && "rotate-180"
                                  )}
                                />
                              )}
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 shrink-0",
                                group.type === 'in' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                              )}>
                                {group.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  {group.orderNumber ? (
                                    <span className="text-[9px] font-black text-neon-blue bg-neon-blue/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                      #{group.orderNumber}
                                    </span>
                                  ) : group.batchId && (
                                    <span className="text-[9px] font-black text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                      LO HANG
                                    </span>
                                  )}
                                  <p className="text-[9px] text-gray-500 font-mono italic">{new Date(group.timestamp).toLocaleString('vi-VN')}</p>
                                </div>
                                <h4 className="font-bold text-sm text-gray-200 truncate uppercase">
                                  {group.batchId ? group.batchName : (group.transactions.length > 1 ? `${group.transactions.length} sản phẩm` : group.transactions[0].productName)}
                                </h4>
                                {group.transactions.length === 1 && (
                                  <>
                                    {(group.transactions[0].productImageUrl || products.find(p => p.id === group.transactions[0].productId)?.imageUrl) && (
                                      <div className="mt-2 w-14 h-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                                        <img
                                          src={group.transactions[0].productImageUrl || products.find(p => p.id === group.transactions[0].productId)?.imageUrl}
                                          alt={group.transactions[0].productName}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                      </div>
                                    )}
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">
                                      {products.find(p => p.id === group.transactions[0].productId)?.category || 'KHÁC'}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(group.transactions[0].productSku || '')}
                                      className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono text-gray-400 transition-colors hover:text-neon-blue hover:border-neon-blue/30"
                                      title="Sao chép mã SKU"
                                    >
                                      <span>{group.transactions[0].productSku || '---'}</span>
                                      <Copy size={10} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                              <div className={cn(
                                "text-lg font-black",
                                group.type === 'in' ? "text-green-400" : "text-red-400"
                              )}>
                                {group.type === 'in' ? '+' : '-'}{group.totalQuantity}
                              </div>
                              {group.paymentMethod && (
                                <div className={cn(
                                  "flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase whitespace-nowrap",
                                  group.paymentMethod === 'cash' ? "bg-green-400/10 text-green-400 border border-green-400/20" : "bg-neon-blue/10 text-neon-blue border border-neon-blue/20"
                                )}>
                                  {group.paymentMethod === 'cash' ? <Banknote size={10} /> : <CreditCard size={10} />}
                                  {group.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                                </div>
                              )}
                            </div>
                          </div>
                          {group.note && (
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 mt-2 ml-10">
                              <p className="text-[10px] text-gray-400 italic leading-relaxed line-clamp-2">
                                <span className="font-bold text-neon-blue mr-1">GHI CHÚ:</span>
                                {group.note}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Mobile Expanded Details */}
                        <AnimatePresence>
                          {expandedHistoryOrders.has(group.id) && group.transactions.length > 1 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-white/5"
                            >
                              <div className="p-4 space-y-2 border-t border-white/5">
                                {group.transactions.map((t, idx) => (
                                  <div key={`history-mobile-detail-${t.id || idx}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                        {(t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl) ? (
                                          <img
                                            src={t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl}
                                            alt={t.productName}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="w-1.5 h-1.5 rounded-full bg-neon-blue/50" />
                                        )}
                                      </div>
                                      <div>
                                        <span className="font-bold text-xs text-gray-300 block">{t.productName}</span>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(t.productSku || '')}
                                          className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono text-gray-400 transition-colors hover:text-neon-blue hover:border-neon-blue/30"
                                          title="Sao chép mã SKU"
                                        >
                                          <span>{t.productSku || '---'}</span>
                                          <Copy size={10} />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="font-mono text-xs font-bold">
                                      <span className={t.type === 'in' ? 'text-green-400' : 'text-red-400'}>
                                        {t.type === 'in' ? '+' : '-'}{t.quantity}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  {groupedHistoryTransactions.length === 0 && (
                    <div className="text-center py-24 text-gray-500">
                      <History className="mx-auto mb-4 opacity-20" size={64} />
                      <p>Chưa có lịch sử giao dịch nào trong mục này.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Settings Sub-tabs */}
                <div className="flex gap-4 p-1 glass rounded-2xl w-fit">
                  <button
                    onClick={() => setSettingsSubTab('account')}
                    className={cn(
                      "px-6 py-2 rounded-xl font-bold transition-all",
                      settingsSubTab === 'account' ? "bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]" : "text-gray-400 hover:text-white"
                    )}
                  >
                    TÀI KHOẢN
                  </button>
                  <button
                    onClick={() => setSettingsSubTab('data')}
                    className={cn(
                      "px-6 py-2 rounded-xl font-bold transition-all",
                      settingsSubTab === 'data' ? "bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]" : "text-gray-400 hover:text-white"
                    )}
                  >
                    KẾT NỐI DỮ LIỆU
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {settingsSubTab === 'account' ? (
                    <motion.div
                      key="account-settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="glass p-8 rounded-3xl space-y-8"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 shadow-[0_0_30px_rgba(0,242,255,0.1)]">
                          <User className="text-neon-blue" size={48} />
                        </div>
                        <div className="space-y-1">
                          {isEditingNickname ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="glass px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-white font-bold"
                                autoFocus
                              />
                              <button
                                onClick={handleUpdateNickname}
                                className="p-2 bg-neon-blue text-black rounded-xl hover:bg-white transition-all"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditingNickname(false);
                                  setNickname(user.displayName || user.email?.split('@')[0] || '');
                                }}
                                className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-bold text-white">{user.displayName || user.email?.split('@')[0]}</h3>
                              <button
                                onClick={() => setIsEditingNickname(true)}
                                className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                            </div>
                          )}
                          <p className="text-gray-400">{user.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                              Đã xác thực
                            </span>
                            <span className="px-3 py-1 rounded-full bg-neon-purple/10 text-neon-purple text-[10px] font-bold uppercase tracking-wider border border-neon-purple/20">
                              Thành viên Pro
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                          <h4 className="font-bold text-white flex items-center gap-2">
                            <Keyboard size={18} className="text-neon-blue" />
                            Cài đặt giao diện
                          </h4>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-300">Chế độ sáng/tối</p>
                                <p className="text-xs text-gray-500">Chuyển đổi giao diện hệ thống</p>
                              </div>
                              <button
                                onClick={() => setIsDarkMode(prev => !prev)}
                                className={cn(
                                  "w-14 h-8 rounded-full p-1 transition-all duration-300 relative flex items-center",
                                  isDarkMode ? "bg-neon-purple" : "bg-neon-blue"
                                )}
                              >
                                <div className={cn(
                                  "w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 flex items-center justify-center",
                                  isDarkMode ? "translate-x-6" : "translate-x-0"
                                )}>
                                  {isDarkMode ? <Moon size={12} className="text-neon-purple" /> : <Sun size={12} className="text-neon-blue" />}
                                </div>
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-300">Bàn phím ảo</p>
                                <p className="text-xs text-gray-500">Giúp bạn nhập liệu dễ dàng hơn</p>
                              </div>
                              <button
                                onClick={() => setIsKeyboardEnabled(prev => !prev)}
                                className={cn(
                                  "w-14 h-8 rounded-full p-1 transition-all duration-300",
                                  isKeyboardEnabled ? "bg-neon-blue" : "bg-gray-700"
                                )}
                              >
                                <div className={cn(
                                  "w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300",
                                  isKeyboardEnabled ? "translate-x-6" : "translate-x-0"
                                )} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                          <h4 className="font-bold text-white flex items-center gap-2">
                            <Mail size={18} className="text-neon-blue" />
                            Thông tin liên hệ
                          </h4>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase font-bold">Email đăng nhập</p>
                            <p className="text-gray-300">{user.email}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase font-bold">UID người dùng</p>
                            <p className="text-gray-300 font-mono text-xs truncate">{user.uid}</p>
                          </div>
                        </div>

                        <div className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                          <h4 className="font-bold text-white flex items-center gap-2">
                            <LockIcon size={18} className="text-neon-purple" />
                            Bảo mật tài khoản
                          </h4>
                          <p className="text-sm text-gray-400">Tài khoản của bạn được bảo vệ bởi hệ thống xác thực.</p>
                          <button
                            onClick={handleLogout}
                            className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all border border-red-500/20 md:w-auto md:px-8"
                          >
                            ĐĂNG XUẤT NGAY
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="data-settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="glass p-8 rounded-3xl space-y-6"
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                          <Settings className="text-neon-blue" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Kết nối Supabase</h3>
                          <p className="text-sm text-gray-400">Cấu hình API để lưu trữ dữ liệu lên Supabase</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400 ml-1">Supabase URL</label>
                          <input
                            type="text"
                            value={supabaseConfig.url}
                            onChange={(e) => setSupabaseConfig(prev => ({ ...prev, url: e.target.value }))}
                            className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                            placeholder="https://your-project.supabase.co"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400 ml-1">Supabase Anon Key</label>
                          <input
                            type="password"
                            value={supabaseConfig.key}
                            onChange={(e) => setSupabaseConfig(prev => ({ ...prev, key: e.target.value }))}
                            className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                            placeholder="your-anon-key"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="space-y-1">
                          <h4 className="font-bold">Kick hoạt lưu trữ Supabase</h4>
                          <p className="text-xs text-gray-400">Dữ liệu sẽ được đồng bộ lên Supabase khi được bật</p>
                        </div>
                        <button
                          onClick={() => setSupabaseConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                          className={cn(
                            "w-14 h-8 rounded-full p-1 transition-all duration-300",
                            supabaseConfig.enabled ? "bg-neon-blue" : "bg-gray-700"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300",
                            supabaseConfig.enabled ? "translate-x-6" : "translate-x-0"
                          )} />
                        </button>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            if (!supabaseConfig.url || !supabaseConfig.key) {
                              alert('Vui lòng nhập đầy đủ URL và Key');
                              return;
                            }
                            const client = createClient(supabaseConfig.url, supabaseConfig.key, {
                              global: {
                                fetch: fetch.bind(window),
                              },
                            });
                            client.from('products').select('*', { count: 'exact', head: true })
                              .then(({ error }) => {
                                if (error) {
                                  alert('Kết nối thất bại: ' + error.message);
                                } else {
                                  alert('Kết nối thành công!');
                                }
                              });
                          }}
                          className="flex-1 py-4 rounded-2xl font-bold text-white glass hover:bg-white/10 transition-all border border-white/10"
                        >
                          KIỂM TRA KẾT NỐI
                        </button>
                        <button
                          onClick={() => {
                            alert('Cấu hình đã được lưu!');
                          }}
                          className="flex-1 py-4 rounded-2xl font-bold text-black bg-neon-blue hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)]"
                        >
                          LƯU CẤU HÌNH
                        </button>
                      </div>

                      <div className="p-6 rounded-2xl bg-neon-blue/5 border border-neon-blue/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold">Đồng bộ dữ liệu hiện tại</h4>
                            <p className="text-xs text-gray-400">Đẩy toàn bộ sản phẩm và giao dịch hiện có lên Supabase</p>
                          </div>
                          <button
                            onClick={async () => {
                              if (!supabase) {
                                alert('Vui lòng cấu hình và kích hoạt Supabase trước');
                                return;
                              }
                              try {
                                // Sync products
                                const { error: pError } = await supabase.from('products').upsert(
                                  products.map(p => ({ ...p, userId: user?.uid }))
                                );
                                if (pError) throw pError;

                                // Sync transactions
                                const { error: tError } = await supabase.from('transactions').upsert(
                                  transactions.map(t => ({ ...t, userId: user?.uid }))
                                );
                                if (tError) throw tError;

                                alert('Đồng bộ thành công!');
                              } catch (err: any) {
                                alert('Lỗi đồng bộ: ' + err.message);
                              }
                            }}
                            className="px-6 py-2 bg-neon-blue/20 text-neon-blue rounded-xl font-bold hover:bg-neon-blue hover:text-black transition-all"
                          >
                            ĐỒNG BỘ NGAY
                          </button>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <AlertTriangle size={18} />
                          <span className="font-bold text-sm uppercase tracking-wider">Lưu ý quan trọng</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Để Supabase hoạt động chính xác, bạn cần tạo các bảng <code className="text-neon-blue">products</code> và <code className="text-neon-blue">transactions</code> trong cơ sở dữ liệu Supabase của mình với cấu trúc tương ứng.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8 pb-32"
              >
                {/* Header & Date Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black neon-text uppercase tracking-tighter">Hiệu Suất</h2>
                    <p className="text-gray-500 font-medium">Báo cáo chi tiết về kinh doanh và tồn kho</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 glass p-2 rounded-2xl">
                    {[
                      { id: 'today', label: 'Hôm nay' },
                      { id: 'yesterday', label: 'Hôm qua' },
                      { id: '7days', label: '7 ngày' },
                      { id: '30days', label: '30 ngày' },
                      { id: 'all', label: 'Tất cả' },
                      { id: 'custom', label: 'Tùy chỉnh' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setAnalyticsDateFilter(filter.id as any)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase whitespace-nowrap",
                          analyticsDateFilter === filter.id
                            ? "bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {analyticsDateFilter === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400">Từ ngày:</span>
                      <input
                        type="date"
                        value={analyticsDateRange.start}
                        onChange={(e) => setAnalyticsDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="glass px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-xs font-bold text-white shrink-0"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400">Đến:</span>
                      <input
                        type="date"
                        value={analyticsDateRange.end}
                        onChange={(e) => setAnalyticsDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="glass px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-xs font-bold text-white shrink-0"
                      />
                    </div>
                  </motion.div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: 'TỔNG DOANH THU',
                      value: analyticsData.current.revenue,
                      prev: analyticsData.previous.revenue,
                      icon: Banknote,
                      color: 'text-neon-blue',
                      bg: 'bg-neon-blue/10'
                    },
                    {
                      label: 'LỢI NHUẬN ƯỚC TÍNH',
                      value: analyticsData.current.profit,
                      prev: analyticsData.previous.profit,
                      icon: TrendingUp,
                      color: 'text-neon-purple',
                      bg: 'bg-neon-purple/10'
                    },
                    {
                      label: 'ĐƠN TRỰC TIẾP',
                      value: analyticsData.current.directOrderCount,
                      prev: analyticsData.previous.directOrderCount,
                      icon: User,
                      color: 'text-yellow-400',
                      bg: 'bg-yellow-400/10'
                    },
                    {
                      label: 'ĐƠN ONLINE',
                      value: analyticsData.current.onlineOrderCount,
                      prev: analyticsData.previous.onlineOrderCount,
                      icon: Globe,
                      color: 'text-green-400',
                      bg: 'bg-green-400/10'
                    }
                  ].map((kpi, idx) => {
                    const growth = kpi.prev === 0 ? 100 : ((kpi.value - kpi.prev) / (kpi.prev || 1)) * 100;
                    return (
                      <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group"
                      >
                        <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20", kpi.bg)}></div>
                        <div className="flex justify-between items-start relative z-10">
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{kpi.label}</p>
                            <div className="space-y-1">
                              <h4 className="text-2xl font-black text-white">
                                {kpi.label.includes('ĐƠN') ? kpi.value : formatCurrency(kpi.value)}
                              </h4>
                              <div className="flex items-center gap-1.5">
                                <div className={cn(
                                  "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                  growth >= 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                                )}>
                                  {growth >= 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                                  {Math.abs(growth).toFixed(1)}%
                                </div>
                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">so với kỳ trước</span>
                              </div>
                            </div>
                          </div>
                          <div className={cn("p-4 rounded-2xl shrink-0 group-hover:scale-110 transition-transform", kpi.bg, kpi.color)}>
                            <kpi.icon size={24} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Revenue Timeline */}
                  <div className="lg:col-span-2 glass rounded-3xl border border-white/10 p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black uppercase text-white tracking-widest flex items-center gap-2">
                          <Activity size={20} className="text-neon-blue" />
                          BIỂU ĐỒ DOANH THU & LỢI NHUẬN
                        </h3>
                        <p className="text-xs text-gray-500">Thống kê chi tiết theo thời gian thực</p>
                      </div>
                    </div>

                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.timeline}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#b625fc" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#b625fc" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#555"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                          />
                          <YAxis
                            stroke="#555"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#00f2ff', marginBottom: '4px', fontWeight: '900' }}
                            formatter={(value: any) => [formatCurrency(Number(value)), '']}
                          />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Area
                            name="Doanh Thu"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#00f2ff"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                          <Area
                            name="Lợi Nhuận"
                            type="monotone"
                            dataKey="profit"
                            stroke="#b625fc"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Distribution */}
                  <div className="glass rounded-3xl border border-white/10 p-8 space-y-8">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase text-white tracking-widest flex items-center gap-2">
                        <PieChartIcon size={20} className="text-neon-blue" />
                        PHÂN CHIA DANH MỤC
                      </h3>
                      <p className="text-xs text-gray-500">Cơ cấu doanh thu theo nhóm hàng</p>
                    </div>

                    <div className="h-[300px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData.categories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={analyticsData.COLORS[index % analyticsData.COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                            formatter={(value: any) => [formatCurrency(Number(value)), '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Tổng cộng</p>
                          <p className="text-sm font-black text-white">
                            {(analyticsData.current.revenue / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {analyticsData.categories.slice(0, 4).map((cat, idx) => (
                        <div key={`stat-cat-${cat.name}-${idx}`} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-gray-400 font-bold">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: analyticsData.COLORS[idx % analyticsData.COLORS.length] }}></div>
                            <span className="truncate max-w-[120px] uppercase tracking-tighter">{cat.name}</span>
                          </div>
                          <span className="text-white font-black">
                            {((cat.value / (analyticsData.current.revenue || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top Selling Products */}
                  <div className="glass rounded-3xl border border-white/10 p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black uppercase text-white tracking-widest flex items-center gap-2">
                          <ShoppingBag size={20} className="text-neon-blue" />
                          SẢN PHẨM BÁN CHẠY
                        </h3>
                        <p className="text-xs text-gray-500">Top 5 sản phẩm đạt doanh số cao nhất</p>
                      </div>
                      <Target className="text-neon-blue opacity-20" size={32} />
                    </div>

                    <div className="space-y-4">
                      {analyticsData.topProducts.map((p, idx) => (
                        <div key={p.id || p.sku || `top-${idx}`} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-blue/30 transition-all">
                          <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center font-black text-neon-blue group-hover:bg-neon-blue group-hover:text-black transition-all">
                            0{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate uppercase tracking-tight">{p.name}</h4>
                            <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">{p.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white">{formatCurrency(p.revenue)}</p>
                            <p className="text-[10px] text-neon-blue font-bold tracking-tighter mt-1">{p.quantity} l??t ban</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Profit Analysis */}
                  <div className="glass rounded-3xl border border-white/10 p-8 space-y-8">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase text-white tracking-widest flex items-center gap-2">
                        <Percent size={20} className="text-neon-purple" />
                        TỈ LỆ LỢI NHUẬN
                      </h3>
                      <p className="text-xs text-gray-500">Hiệu quả kinh doanh theo thời gian</p>
                    </div>

                    <div className="h-[200px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.timeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="date" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis
                            stroke="#555"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                            formatter={(value: any) => [formatCurrency(Number(value)), 'Lợi Nhuận']}
                          />
                          <Bar
                            dataKey="profit"
                            fill="#b625fc"
                            radius={[6, 6, 0, 0]}
                            barSize={analyticsDateFilter === 'today' ? 60 : 20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Tỉ Suất Lợi Nhuận Gộp</p>
                        <h4 className="text-2xl font-black text-neon-blue">
                          {analyticsData.current.revenue > 0
                            ? ((analyticsData.current.profit / analyticsData.current.revenue) * 100).toFixed(1)
                            : '0'}%
                        </h4>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (analyticsData.current.profit / (analyticsData.current.revenue || 1)) * 100)}%` }}
                            className="h-full bg-neon-blue"
                          />
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Giá trị đơn Trung bình</p>
                        <h4 className="text-2xl font-black text-neon-purple">
                          {analyticsData.current.directOrderCount + analyticsData.current.onlineOrderCount > 0
                            ? formatCurrency(Math.round(analyticsData.current.revenue / (analyticsData.current.directOrderCount + analyticsData.current.onlineOrderCount)))
                            : formatCurrency(0)}
                        </h4>
                        <p className="text-[10px] text-gray-500 italic">Dựa trên {analyticsData.current.directOrderCount + analyticsData.current.onlineOrderCount} đơn hàng</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Floating Action Button - Removed as per request */}

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#050505]/80 backdrop-blur-2xl border-t border-white/10 z-[60] flex items-center justify-around px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng Quan' },
            { id: 'sales', icon: ShoppingCart, label: 'Bán Hàng' },
            { id: 'inventory', icon: Package, label: 'Kho Hàng' },
            { id: 'history', icon: History, label: 'Lịch Sử' },
            { id: 'analytics', icon: BarChart2, label: 'Hiệu Suất' },
            { id: 'settings', icon: Settings, label: 'Cài Đặt' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 w-16 h-full transition-all relative overflow-hidden active:bg-white/5",
                activeTab === item.id ? "text-neon-blue" : "text-gray-500"
              )}
            >
              <div className={cn(
                "absolute inset-0 bg-neon-blue/5 transition-opacity duration-500",
                activeTab === item.id ? "opacity-100" : "opacity-0"
              )} />
              {activeTab === item.id && (
                <motion.div
                  layoutId="bottomNavDot"
                  className="absolute -top-1 w-2 h-1 bg-neon-blue rounded-full shadow-[0_0_15px_rgba(0,242,255,1)]"
                />
              )}
              <item.icon size={20} className={cn(activeTab === item.id && "drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]")} />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter truncate w-full text-center transition-all",
                activeTab === item.id ? "scale-105 opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </main>

      {/* Context Menu */}
      <AnimatePresence>
        {renamingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md glass rounded-3xl border-white/10 p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6 text-neon-blue">Đổi tên tiêu đề</h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full glass px-6 py-4 rounded-2xl mb-8 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-lg"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRenameHeader()}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setRenamingProduct(null)}
                  className="flex-1 py-4 rounded-2xl hover:bg-white/5 transition-colors font-bold"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRenameHeader}
                  className="flex-1 py-4 bg-neon-blue text-black rounded-2xl font-bold hover:bg-white transition-colors"
                >
                  LƯU THAY ĐỔI
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {deletingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md glass rounded-3xl border-white/10 p-8 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Xác Nhận Xóa</h3>
              <p className="text-gray-400 text-center mb-8">
                Bạn có chắc chắn muốn xóa {deletingProduct.isHeader ? 'tiêu đề' : 'sản phẩm'}
                <span className="text-white font-bold"> "{deletingProduct.name}"</span>?
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeletingProduct(null)}
                  className="flex-1 py-4 rounded-2xl hover:bg-white/5 transition-colors font-bold"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeleteProduct(deletingProduct.id)}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors"
                >
                  XÁC NHẬN XÓA
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {editingTransaction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-6xl glass rounded-[2.5rem] border-white/10 p-8 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-blue/10 blur-[80px] rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-neon-purple/10 blur-[80px] rounded-full" />

              <div className="relative z-10 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                      <Edit2 className="text-neon-blue" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Chi tiết đơn hàng</h3>
                      <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">ID: {editingTransaction.id.slice(-8)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingTransaction(null)}
                    className="p-3 hover:bg-white/10 rounded-2xl transition-colors group"
                  >
                    <X size={24} className="text-gray-500 group-hover:text-white transition-colors" />
                  </button>
                </div>

                <form onSubmit={handleUpdateTransaction} className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                      {/* Left Column: Order Info & Notes */}
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <Scan size={14} className="text-neon-blue" />
                              Mã Vận Đơn
                            </label>
                            <input
                              type="text"
                              value={editShippingCode}
                              onChange={(e) => setEditShippingCode(e.target.value)}
                              className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all font-mono text-white text-lg"
                              placeholder="Nhập mã vận đơn..."
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <FileText size={14} className="text-neon-purple" />
                              Ghi chú chung
                            </label>
                            <textarea
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all min-h-[150px] resize-none text-white"
                              placeholder="Nhập ghi chú khách hàng..."
                            />
                          </div>
                        </div>

                        {/* Summary Card */}
                        <div className="glass p-6 rounded-3xl border-white/5 bg-white/5 space-y-4">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Info size={14} className="text-neon-blue" />
                            Tóm tắt đơn hàng
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Thời gian tạo:</span>
                              <span className="text-white font-medium">
                                {new Date(editingTransaction.timestamp).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Số lượng mặt hàng:</span>
                              <span className="text-white font-medium">
                                {orderTransactionsState.length}
                              </span>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between items-end">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tổng thanh toán:</span>
                              <span className="text-2xl font-black text-neon-blue">
                                {formatCurrency(orderTransactionsState.reduce((sum, t) => {
                                  const price = products.find(p => p.id === t.productId)?.price || 0;
                                  return sum + (price * t.quantity);
                                }, 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Products List */}
                      <div className="space-y-4 flex flex-col min-h-[400px]">
                        <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-md py-2 -mx-2 px-2 flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <ShoppingCart size={14} className="text-neon-blue" />
                            Danh sách sản phẩm
                          </label>

                          {/* Add Product Inline Search */}
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="text"
                                value={addProductSku}
                                onChange={(e) => setAddProductSku(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProductToOrder())}
                                placeholder="Nhập SKU thêm..."
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-neon-blue/50 font-mono text-white w-40"
                              />
                              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsProductSelectorOpen(true)}
                              className="p-2 bg-neon-blue/20 text-neon-blue rounded-xl hover:bg-neon-blue hover:text-black transition-all"
                              title="Thêm sản phẩm"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {(() => {
                            // Merge orderTransactionsState for display
                            const groupedMap = new Map<string, Transaction>();
                            orderTransactionsState.forEach(t => {
                              if (groupedMap.has(t.productId)) {
                                const existing = groupedMap.get(t.productId)!;
                                groupedMap.set(t.productId, {
                                  ...existing,
                                  quantity: existing.quantity + t.quantity,
                                  // Keep the ID of the one currently being edited if possible
                                  id: (t.id === editingTransaction.id || existing.id === editingTransaction.id) ? editingTransaction.id : existing.id
                                });
                              } else {
                                groupedMap.set(t.productId, { ...t });
                              }
                            });

                            const displayTransactions = Array.from(groupedMap.values());

                            return displayTransactions.map((t, idx) => (
                              <div
                                key={t.id || t.productId || `txn-${idx}`}
                                className={cn(
                                  "glass p-4 rounded-2xl border-white/5 transition-all relative group/item",
                                  editingTransaction.id === t.id ? "border-neon-blue/50 bg-neon-blue/5 shadow-[0_0_15px_rgba(0,242,255,0.1)]" : "hover:bg-white/5"
                                )}
                                onClick={() => {
                                  setEditingTransaction(t);
                                  setSkuSearch(products.find(p => p.id === t.productId)?.sku || '');
                                }}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                      <Package size={20} className="text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-white uppercase tracking-tight">{t.productName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                          {products.find(p => p.id === t.productId)?.sku || 'N/A'}
                                        </p>
                                        {products.find(p => p.id === t.productId)?.variant && (
                                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-neon-purple/10 text-neon-purple font-black border border-neon-purple/20 uppercase tracking-tighter">
                                            {products.find(p => p.id === t.productId)?.variant}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-neon-blue">x{t.quantity}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatCurrency((products.find(p => p.id === t.productId)?.price || 0) * t.quantity)}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTransaction(t.id);
                                      }}
                                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>

                                {editingTransaction.id === t.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-4 border-t border-white/5 grid grid-cols-[3fr_1fr] gap-4"
                                  >
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Biến thể / Mã sản phẩm</p>
                                      <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                                        <span className="text-neon-purple font-bold">
                                          {products.find(p => p.id === t.productId)?.variant || 'Mặc định'}
                                        </span>
                                        <span className="text-gray-500 font-mono">
                                          ({products.find(p => p.id === t.productId)?.sku})
                                        </span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Số lượng</p>
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newQty = Math.max(1, t.quantity - 1);
                                            const newTrans = { ...t, quantity: newQty };
                                            setEditingTransaction(newTrans);
                                            setOrderTransactionsState(prev => prev.map(item => item.id === t.id ? newTrans : item));
                                          }}
                                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 text-gray-400 hover:text-red-400 transition-all active:scale-90"
                                          title="Giảm số lượng"
                                        >
                                          <Minus size={16} strokeWidth={3} />
                                        </button>
                                        <div className="relative">
                                          <input
                                            type="number"
                                            value={t.quantity}
                                            onChange={(e) => {
                                              const newQty = parseInt(e.target.value) || 0;
                                              const newTrans = { ...t, quantity: newQty };
                                              setEditingTransaction(newTrans);
                                              setOrderTransactionsState(prev => prev.map(item => item.id === t.id ? newTrans : item));
                                            }}
                                            className="w-14 bg-transparent text-center text-lg font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-neon-blue/30 rounded-full"></div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newQty = t.quantity + 1;
                                            const newTrans = { ...t, quantity: newQty };
                                            setEditingTransaction(newTrans);
                                            setOrderTransactionsState(prev => prev.map(item => item.id === t.id ? newTrans : item));
                                          }}
                                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-green-500/20 hover:border-green-500/50 text-gray-400 hover:text-green-400 transition-all active:scale-90"
                                          title="Tổng số lượng"
                                        >
                                          <Plus size={16} strokeWidth={3} />
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={handleDeleteCurrentOrder}
                      className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all order-3 sm:order-1"
                    >
                      <Trash2 size={18} />
                      XÓA ĐƠN
                    </button>
                    <div className="flex-1 flex flex-wrap gap-3 order-1 sm:order-2">
                      <button
                        type="button"
                        onClick={() => setEditingTransaction(null)}
                        className="flex-1 min-w-[100px] py-4 rounded-2xl hover:bg-white/5 transition-colors font-bold border border-white/5"
                      >
                        H?Y
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateTransaction(undefined, false)}
                        disabled={isSaving}
                        className="flex-1 min-w-[120px] py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                        ) : showSaveSuccess ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-green-400">
                            <Check size={18} />
                            ĐÃ LƯU
                          </motion.div>
                        ) : (
                          <>
                            <Save size={18} className="text-neon-blue" />
                            LƯU TẠM
                          </>
                        )}
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-[1.5] min-w-[150px] py-4 bg-neon-blue text-black rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,242,255,0.3)] disabled:opacity-50"
                      >
                        CẬP NHẬT
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {false && viewingBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl glass rounded-[2.5rem] border-white/10 p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    viewingBatch.type === 'in' ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"
                  )}>
                    <Boxes size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{viewingBatch.name}</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest italic">{viewingBatch.type === 'in' ? 'NHẬP LÔ' : 'XUẤT LÔ'} • {new Date(viewingBatch.timestamp).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <button onClick={() => setViewingBatch(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} className="text-gray-500 hover:text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={14} className="text-neon-blue" />
                    Ghi chú lô hàng
                  </h4>
                  <p className="text-white text-sm leading-relaxed">{viewingBatch.note || 'Không có ghi chú cho lô hàng này.'}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Package size={14} className="text-neon-purple" />
                    Chi tiết sản phẩm ({viewingBatch.transactions.length})
                  </h4>
                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {viewingBatch.transactions.map((t: Transaction, idx: number) => (
                      <div key={`batch-view-${t.id || idx}`} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center">
                            {(t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl) ? (
                              <img
                                src={t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl}
                                alt={t.productName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Package size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">{t.productName}</p>
                            <p className="text-[10px] text-gray-500 font-mono italic uppercase">{t.productSku}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 uppercase text-gray-400">
                                {products.find(p => p.id === t.productId)?.category || 'Khác'}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-purple/10 uppercase text-neon-purple">
                                {products.find(p => p.id === t.productId)?.variant || 'Mặc định'}
                              </span>
                              <span className="text-[9px] font-mono text-neon-blue">
                                {(t.price || products.find(p => p.id === t.productId)?.price || 0).toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-neon-blue">x{t.quantity}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{t.type === 'in' ? 'Nhập' : 'Xuất'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tổng số lượng</p>
                    <p className="text-2xl font-black text-white">{viewingBatch.totalQuantity}</p>
                  </div>
                  <button
                    onClick={() => setViewingBatch(null)}
                    className="px-8 py-3 bg-neon-blue text-black rounded-2xl font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)]"
                  >
                    ĐÓNG
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {false && isBatchEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-5xl glass rounded-[2.5rem] border-white/10 p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                    <Edit2 className="text-neon-blue" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Chỉnh sửa lô hàng</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Cập nhật thông tin và sản phẩm trong lô</p>
                  </div>
                </div>
                <button onClick={() => setIsBatchEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} className="text-gray-500 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleUpdateBatch} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tên lô hàng</label>
                    <input
                      type="text"
                      className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all font-bold text-base"
                      value={editBatchName}
                      onChange={(e) => setEditBatchName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ghi chú lô</label>
                    <input
                      type="text"
                      className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all text-base"
                      value={editBatchNote}
                      onChange={(e) => setEditBatchNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Danh sách sản phẩm trong lô</label>
                    <button
                      type="button"
                      onClick={handleDeleteBatch}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Xóa lô hàng
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {editBatchTransactions.map((t, idx) => (
                      <div key={`batch-edit-${t.id || idx}`} className="glass bg-white/5 p-5 rounded-3xl flex items-center justify-between gap-5 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-5 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                            {(t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl) ? (
                              <img
                                src={t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl}
                                alt={t.productName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Package size={26} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-lg font-bold text-white leading-tight">{t.productName}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gray-400 font-mono uppercase tracking-[0.2em]">{t.productSku}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(t.productSku || '')}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-neon-blue hover:bg-white/10 transition-colors"
                                title="Sao chép mã SKU"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 uppercase text-gray-400">
                                {products.find(p => p.id === t.productId)?.category || 'Khác'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-neon-purple/10 uppercase text-neon-purple">
                                {products.find(p => p.id === t.productId)?.variant || 'Mặc định'}
                              </span>
                              <span className="text-[10px] font-mono text-neon-blue">
                                {(t.price || products.find(p => p.id === t.productId)?.price || 0).toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 glass bg-black/40 px-2 py-2 rounded-2xl border border-white/10">
                            <button
                              type="button"
                              onClick={() => {
                                setEditBatchTransactions(prev => prev.map((item, i) =>
                                  i === idx && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
                                ));
                              }}
                              className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10"
                            >
                              <Minus size={18} />
                            </button>
                            <input
                              type="number"
                              value={t.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setEditBatchTransactions(prev => prev.map((item, i) => i === idx ? { ...item, quantity: val } : item));
                              }}
                              className="w-20 text-center bg-transparent font-black text-xl outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditBatchTransactions(prev => prev.map((item, i) =>
                                  i === idx ? { ...item, quantity: item.quantity + 1 } : item
                                ));
                              }}
                              className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProductFromBatchEdit(t.id)}
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Xóa sản phẩm khỏi lô"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsBatchEditModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl hover:bg-white/5 transition-all font-bold uppercase tracking-widest text-xs"
                  >
                    HỦY THAY ĐỔI
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[1.5] py-4 bg-neon-blue text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_30px_rgba(0,242,255,0.3)] flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    LƯU THAY ĐỔI LÔ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {viewingBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl glass rounded-[2.5rem] border-white/10 p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    viewingBatch.type === 'in' ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"
                  )}>
                    <Boxes size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{viewingBatch.name}</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest italic">{viewingBatch.type === 'in' ? 'NHẬP LÔ' : 'XUẤT LÔ'} • {new Date(viewingBatch.timestamp).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <button onClick={() => setViewingBatch(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} className="text-gray-500 hover:text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={14} className="text-neon-blue" />
                    Ghi chú lô hàng
                  </h4>
                  <p className="text-white text-sm leading-relaxed">{viewingBatch.note || 'Không có ghi chú cho lô hàng này.'}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Package size={14} className="text-neon-purple" />
                    Chi tiết sản phẩm ({viewingBatch.transactions.length})
                  </h4>
                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {viewingBatch.transactions.map((t: Transaction, idx: number) => (
                      <div key={`batch-view-${t.id || idx}`} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center">
                            {(t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl) ? (
                              <img
                                src={t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl}
                                alt={t.productName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Package size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">{t.productName}</p>
                            <p className="text-[10px] text-gray-500 font-mono italic uppercase">{t.productSku}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 uppercase text-gray-400">
                                {products.find(p => p.id === t.productId)?.category || 'Khác'}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-purple/10 uppercase text-neon-purple">
                                {products.find(p => p.id === t.productId)?.variant || 'Mặc định'}
                              </span>
                              <span className="text-[9px] font-mono text-neon-blue">
                                {(t.price || products.find(p => p.id === t.productId)?.price || 0).toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-neon-blue">x{t.quantity}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{t.type === 'in' ? 'Nhập' : 'Xuất'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tổng số lượng</p>
                    <p className="text-2xl font-black text-white">{viewingBatch.totalQuantity}</p>
                  </div>
                  <button
                    onClick={() => setViewingBatch(null)}
                    className="px-8 py-3 bg-neon-blue text-black rounded-2xl font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)]"
                  >
                    ĐÓNG
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isBatchEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-5xl glass rounded-[2.5rem] border-white/10 p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                    <Edit2 className="text-neon-blue" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Chỉnh sửa lô hàng</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Cập nhật thông tin và sản phẩm trong lô</p>
                  </div>
                </div>
                <button onClick={() => setIsBatchEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} className="text-gray-500 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleUpdateBatch} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tên lô hàng</label>
                    <input
                      type="text"
                      className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all font-bold text-base"
                      value={editBatchName}
                      onChange={(e) => setEditBatchName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ghi chú lô</label>
                    <input
                      type="text"
                      className="w-full glass px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all text-base"
                      value={editBatchNote}
                      onChange={(e) => setEditBatchNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Danh sách sản phẩm trong lô</label>
                    <button
                      type="button"
                      onClick={handleDeleteBatch}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Xóa lô hàng
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {editBatchTransactions.map((t, idx) => (
                      <div key={`batch-edit-${t.id || idx}`} className="glass bg-white/5 p-5 rounded-3xl flex items-center justify-between gap-5 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-5 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                            {(t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl) ? (
                              <img
                                src={t.productImageUrl || products.find(p => p.id === t.productId)?.imageUrl}
                                alt={t.productName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Package size={26} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-lg font-bold text-white leading-tight">{t.productName}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gray-400 font-mono uppercase tracking-[0.2em]">{t.productSku}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(t.productSku || '')}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-neon-blue hover:bg-white/10 transition-colors"
                                title="Sao chép mã SKU"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 uppercase text-gray-400">
                                {products.find(p => p.id === t.productId)?.category || 'Khác'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-neon-purple/10 uppercase text-neon-purple">
                                {products.find(p => p.id === t.productId)?.variant || 'Mặc định'}
                              </span>
                              <span className="text-[10px] font-mono text-neon-blue">
                                {(t.price || products.find(p => p.id === t.productId)?.price || 0).toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 glass bg-black/40 px-2 py-2 rounded-2xl border border-white/10">
                            <button
                              type="button"
                              onClick={() => {
                                setEditBatchTransactions(prev => prev.map((item, i) =>
                                  i === idx && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
                                ));
                              }}
                              className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10"
                            >
                              <Minus size={18} />
                            </button>
                            <input
                              type="number"
                              value={t.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setEditBatchTransactions(prev => prev.map((item, i) => i === idx ? { ...item, quantity: val } : item));
                              }}
                              className="w-20 text-center bg-transparent font-black text-xl outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditBatchTransactions(prev => prev.map((item, i) =>
                                  i === idx ? { ...item, quantity: item.quantity + 1 } : item
                                ));
                              }}
                              className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProductFromBatchEdit(t.id)}
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Xóa sản phẩm khỏi lô"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsBatchEditModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl hover:bg-white/5 transition-all font-bold uppercase tracking-widest text-xs"
                  >
                    HỦY THAY ĐỔI
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[1.5] py-4 bg-neon-blue text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_30px_rgba(0,242,255,0.3)] flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    LƯU THAY ĐỔI LÔ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setContextMenu(null)}
              onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed',
                left: window.innerWidth < 768 ? '50%' : Math.min(contextMenu.x, window.innerWidth - 200),
                top: window.innerWidth < 768 ? '50%' : Math.min(contextMenu.y, window.innerHeight - 300),
                transform: window.innerWidth < 768 ? 'translate(-50%, -50%)' : 'none',
                zIndex: 70
              }}
              className={cn(
                "glass rounded-3xl border-white/10 shadow-2xl overflow-hidden py-3 backdrop-blur-xl",
                window.innerWidth < 768 ? "w-[280px]" : "w-48 py-2 rounded-2xl"
              )}
            >
              <div className={cn("px-4 py-2 border-b border-white/5 mb-1", window.innerWidth < 768 && "pb-3")}>
                <div className={cn("font-bold truncate text-neon-blue", window.innerWidth < 768 ? "text-base" : "text-xs")}>
                  {contextMenu.product.isHeader ? 'TIEU ??' : contextMenu.product.name}
                </div>
                {!contextMenu.product.isHeader && (
                  <div className={cn("text-gray-500 font-mono", window.innerWidth < 768 ? "text-xs" : "text-[10px]")}>{contextMenu.product.sku}</div>
                )}
              </div>

              {!contextMenu.product.isHeader && (
                <div className={cn(window.innerWidth < 768 ? "space-y-1" : "")}>
                  <button
                    onClick={() => { setSelectedProduct(contextMenu.product); setIsModalOpen('in'); setContextMenu(null); }}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-green-400",
                      window.innerWidth < 768 ? "text-base py-4" : "text-sm"
                    )}
                  >
                    <Plus size={window.innerWidth < 768 ? 20 : 16} /> Nhập kho
                  </button>

                  <button
                    onClick={() => { setSelectedProduct(contextMenu.product); setIsModalOpen('out'); setContextMenu(null); }}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-red-400",
                      window.innerWidth < 768 ? "text-base py-4" : "text-sm"
                    )}
                  >
                    <Minus size={window.innerWidth < 768 ? 20 : 16} /> Xuất kho
                  </button>

                  <button
                    onClick={() => { handleEditProduct(contextMenu.product); setContextMenu(null); }}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-neon-blue",
                      window.innerWidth < 768 ? "text-base py-4" : "text-sm"
                    )}
                  >
                    <Settings size={window.innerWidth < 768 ? 20 : 16} /> Chỉnh sửa
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                </div>
              )}

              {contextMenu.product.isHeader && (
                <button
                  onClick={() => {
                    setRenamingProduct(contextMenu.product);
                    setRenameValue(contextMenu.product.name);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-neon-blue"
                >
                  <Settings size={16} /> Đổi tên tiêu đề
                </button>
              )}

              <button
                onClick={() => addHeaderRow(contextMenu.product, 'above')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-300"
              >
                <ArrowUp size={16} /> Thêm hàng trên
              </button>

              <button
                onClick={() => addHeaderRow(contextMenu.product, 'below')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-300"
              >
                <ArrowDown size={16} /> Thêm hàng dưới
              </button>

              <div className="h-px bg-white/5 my-1" />

              {!contextMenu.product.isHeader && (
                <button
                  onClick={() => copyToClipboard(contextMenu.product.sku)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-300"
                >
                  <Copy size={16} /> Sao chép SKU
                </button>
              )}

              <button
                onClick={() => {
                  setDeletingProduct(contextMenu.product);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-red-500/70 hover:text-red-500"
              >
                <Trash2 size={16} /> Xóa {contextMenu.product.isHeader ? 'tiêu đề' : 'sản phẩm'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isScannerOpen && (
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setIsScannerOpen(false)}
            scannerMode={scannerMode}
            sessionHistory={sessionHistory}
            quickQuantity={quickQuantity}
            setQuickQuantity={setQuickQuantity}
          />
        )}

        {(isModalOpen === 'in' || isModalOpen === 'out') && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-md rounded-3xl overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  if (Date.now() - lastScanTime < 500) return;
                  handleTransaction(isModalOpen as 'in' | 'out');
                }
              }}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold neon-text">
                  {isModalOpen === 'in' ? 'Nhập kho sản phẩm' : 'Xuất kho sản phẩm'}
                </h3>
                <button onClick={() => setIsModalOpen(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5">
                  <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedProduct.imageUrl ? (
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="text-neon-blue" size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold">{selectedProduct.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{selectedProduct.sku}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Số lượng</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                        className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <Minus size={20} />
                      </button>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        className="flex-1 glass text-center text-2xl font-bold py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                      />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                        className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Ghi chú (tùy chọn)</label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 min-h-[100px]"
                      placeholder="Nhập lý do nhập/xuất..."
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleTransaction(isModalOpen as 'in' | 'out')}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-black transition-all shadow-lg active:scale-95",
                    isModalOpen === 'in' ? "bg-green-400 hover:bg-green-300 shadow-green-400/20" : "bg-red-400 hover:bg-red-300 shadow-red-400/20"
                  )}
                >
                  XÁC NHẬN {isModalOpen === 'in' ? 'NHẬP KHO' : 'XUẤT KHO'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {(isModalOpen === 'add' || isModalOpen === 'edit') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  if (Date.now() - lastScanTime < 500) return;
                  isModalOpen === 'add' ? handleAddProduct() : handleUpdateProduct();
                }
              }}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold neon-text">
                  {isModalOpen === 'add' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
                </h3>
                <button onClick={() => setIsModalOpen(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400">Mã SKU / Barcode</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                        }
                      }}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 font-mono"
                    />
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400">Tên sản phẩm</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Danh mục</label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            onFocus={() => setIsCategoryDropdownOpen(true)}
                            className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 pr-12"
                            placeholder="Nhập hoặc chọn danh mục..."
                          />
                          <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neon-blue transition-colors"
                          >
                            <ChevronDown className={cn("transition-transform duration-300", isCategoryDropdownOpen ? "rotate-180" : "")} size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Compact Scrollable Category Dropdown */}
                      <AnimatePresence>
                        {isCategoryDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setIsCategoryDropdownOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute z-[70] left-0 right-0 top-full mt-2 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                            >
                              <div className="p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {/* Add New Option */}
                                {formData.category && !predefinedCategories.includes(formData.category) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPredefinedCategories(prev => [...prev, formData.category]);
                                      setIsCategoryDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neon-blue/10 text-neon-blue transition-all group border border-dashed border-neon-blue/30"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center group-hover:bg-neon-blue group-hover:text-black transition-all">
                                      <Plus size={18} />
                                    </div>
                                    <div className="text-left">
                                      <p className="text-xs font-bold uppercase tracking-widest">Lưu danh mục mới</p>
                                      <p className="text-[10px] opacity-70 italic line-clamp-1">"{formData.category}"</p>
                                    </div>
                                  </button>
                                )}

                                <div className="py-1 px-2">
                                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Danh sách hiện có</p>
                                  <div className="grid grid-cols-1 gap-1">
                                    {availableCategories.map((cat, idx) => (
                                      <div key={`cat-select-${cat}-${idx}`} className="group flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setFormData(prev => ({ ...prev, category: cat }));
                                            setIsCategoryDropdownOpen(false);
                                          }}
                                          className={cn(
                                            "flex-1 flex items-center justify-between p-3 rounded-xl transition-all text-xs font-bold uppercase tracking-tight",
                                            formData.category === cat
                                              ? "bg-neon-blue text-black"
                                              : "hover:bg-white/5 text-gray-400 hover:text-white"
                                          )}
                                        >
                                          <span>{cat}</span>
                                          {formData.category === cat && <Check size={14} />}
                                        </button>

                                        {predefinedCategories.includes(cat) && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPredefinedCategories(prev => prev.filter(c => c !== cat));
                                            }}
                                            className="p-3 text-red-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Xoa m?u"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        )}
                                      </div>
                                    ))}

                                    {availableCategories.length === 0 && !formData.category && (
                                      <p className="text-[10px] text-gray-600 italic p-3">Chưa có danh mục nào. Hãy nhập để tạo mới.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Biến thể (Màu sắc, kích thước...)</label>
                    <input
                      type="text"
                      value={formData.variant}
                      onChange={(e) => setFormData(prev => ({ ...prev, variant: e.target.value }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                      placeholder="VD: Đỏ, XL, 128GB..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Giá bán (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 font-mono"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Giá nhập (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 font-mono text-neon-purple shadow-[0_0_10px_rgba(182,37,252,0.1)]"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Số lượng</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Cảnh báo tồn tại tối thiểu</label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Tồn kho đề xuất</label>
                    <input
                      type="number"
                      value={formData.recommendedStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, recommendedStock: Number(e.target.value) }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400">Hình ảnh sản phẩm</label>
                    <div className="p-4 glass rounded-2xl space-y-4 border border-white/5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setImageUploadMethod('device')}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                            imageUploadMethod === 'device' ? "bg-neon-blue text-black shadow-lg" : "bg-white/5 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          <UploadCloud size={14} /> TẢI ẢNH LÊN
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUploadMethod('url')}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                            imageUploadMethod === 'url' ? "bg-neon-blue text-black shadow-lg" : "bg-white/5 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          <LinkIcon size={14} /> DÁN URL
                        </button>
                      </div>

                      <div className="flex items-start gap-4">
                        {/* Current Image Preview */}
                        <div className="w-24 h-24 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative group">
                          {formData.imageUrl ? (
                            <>
                              <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))}
                                className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"
                              >
                                <Trash2 size={16} className="mb-1" />
                                XÓA
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="text-gray-600" size={32} />
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          {imageUploadMethod === 'device' && (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                disabled={isUploadingImage}
                              />
                              <div className={cn(
                                "w-full glass border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all",
                                isUploadingImage ? "border-neon-blue/50 opacity-50" : "border-white/10 hover:border-neon-blue/50 hover:bg-white/5"
                              )}>
                                {isUploadingImage ? (
                                  <div className="w-6 h-6 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <UploadCloud className="text-gray-400" size={24} />
                                )}
                                <span className="text-xs font-bold text-gray-400">
                                  {isUploadingImage ? 'Đang xử lý...' : 'Nhấn để chọn ảnh từ thiết bị'}
                                </span>
                              </div>
                            </div>
                          )}
                          {imageUploadMethod === 'url' && (
                            <input
                              type="text"
                              placeholder="Dán link ảnh vào đây (https://...)"
                              value={formData.imageUrl}
                              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                              className="w-full glass px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400">Ghi chú sản phẩm</label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 min-h-[100px] resize-none"
                      placeholder="Nhập ghi chú cho sản phẩm này..."
                    />
                  </div>

                  <button
                    onClick={isModalOpen === 'add' ? handleAddProduct : handleUpdateProduct}
                    className="md:col-span-2 w-full py-4 rounded-2xl font-bold text-black bg-neon-blue hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-95 mt-4"
                  >
                    {isModalOpen === 'add' ? 'THÊM SẢN PHẨM VÀO KHO' : 'CẬP NHẬT THÔNG TIN'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Product Selector Modal for adding to existing order */}
        <AnimatePresence>
          {isProductSelectorOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-2xl glass rounded-[2.5rem] border-white/10 p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                      <Package className="text-neon-blue" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Chọn sản phẩm bổ sung</h3>
                      <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Tìm kiếm trong kho hàng</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsProductSelectorOpen(false)}
                    className="p-3 hover:bg-white/10 rounded-2xl transition-colors"
                  >
                    <X size={24} className="text-gray-500" />
                  </button>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc SKU..."
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                    className="w-full glass pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all"
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {filteredSelectorProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleAddSelectedProduct(product)}
                        className="w-full glass p-3 md:p-4 rounded-2xl border-white/5 hover:border-neon-blue/30 hover:bg-white/5 transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-neon-blue/20 transition-colors shrink-0 overflow-hidden">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Package className="text-gray-400 group-hover:text-neon-blue" size={24} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-white truncate uppercase tracking-tight">{product.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-gray-500 font-mono">{product.sku}</p>
                              {product.variant && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                  <p className="text-[10px] text-neon-purple font-medium uppercase">{product.variant}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-black text-neon-blue">{formatCurrency(product.price)}</p>
                          <p className={cn(
                            "text-[10px] font-bold",
                            product.quantity > 0 ? "text-green-400" : "text-red-400"
                          )}>
                            KHO: {product.quantity}
                          </p>
                        </div>
                      </button>
                    ))}

                  {filteredSelectorProducts.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>Không tìm thấy sản phẩm nào.</p>
                      </div>
                    )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingCartItem && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md glass rounded-[2.5rem] border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                      <Edit2 className="text-neon-blue" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight uppercase">Sửa sản phẩm</h3>
                      <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">Giá / SL / Chiết khấu</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingCartItem(null)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Quantity Edit */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Số lượng</label>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                      <button
                        onClick={() => setEditingCartItem(prev => prev ? ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }) : null)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Minus size={20} />
                      </button>
                      <input
                        type="number"
                        value={editingCartItem.quantity}
                        onChange={(e) => setEditingCartItem(prev => prev ? ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }) : null)}
                        className="flex-1 bg-transparent text-center text-xl font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setEditingCartItem(prev => prev ? ({ ...prev, quantity: prev.quantity + 1 }) : null)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Unit Price Edit */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Đơn giá</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={editingCartItem.price}
                        onChange={(e) => setEditingCartItem(prev => prev ? ({ ...prev, price: Number(e.target.value) }) : null)}
                        className="w-full glass p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 font-black text-neon-blue text-lg"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">₫/sp</span>
                    </div>
                  </div>

                  {/* Discount & Surcharge */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-red-400/70 uppercase tracking-widest ml-1">Giảm giá</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={editingCartItem.discount || ''}
                          onChange={(e) => setEditingCartItem(prev => prev ? ({ ...prev, discount: Number(e.target.value) }) : null)}
                          className="w-full glass pl-3 pr-10 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/30 text-xs font-bold text-red-400"
                          placeholder="0"
                        />
                        <button
                          onClick={() => setEditingCartItem(prev => prev ? ({ ...prev, discountType: prev.discountType === 'amount' ? 'percent' : 'amount' }) : null)}
                          className="absolute right-1.5 p-1.5 bg-white/5 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all text-red-400 min-w-[24px]"
                        >
                          {editingCartItem.discountType === 'amount' ? '₫' : '%'}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-green-400/70 uppercase tracking-widest ml-1">Phụ thu</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={editingCartItem.surcharge || ''}
                          onChange={(e) => setEditingCartItem(prev => prev ? ({ ...prev, surcharge: Number(e.target.value) }) : null)}
                          className="w-full glass pl-3 pr-10 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/30 text-xs font-bold text-green-400"
                          placeholder="0"
                        />
                        <button
                          onClick={() => setEditingCartItem(prev => prev ? ({ ...prev, surchargeType: prev.surchargeType === 'amount' ? 'percent' : 'amount' }) : null)}
                          className="absolute right-1.5 p-1.5 bg-white/5 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all text-green-400 min-w-[24px]"
                        >
                          {editingCartItem.surchargeType === 'amount' ? '₫' : '%'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Final Calculation */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Thành tiền mới:</span>
                    <span className="text-lg font-black text-neon-blue">
                      {(() => {
                        const subtotal = editingCartItem.price * editingCartItem.quantity;
                        let disc = 0;
                        if (editingCartItem.discount > 0) {
                          if (editingCartItem.discountType === 'percent') disc = (subtotal * editingCartItem.discount / 100);
                          else disc = editingCartItem.discount;
                        }
                        let sur = 0;
                        if (editingCartItem.surcharge > 0) {
                          if (editingCartItem.surchargeType === 'percent') sur = (subtotal * editingCartItem.surcharge / 100);
                          else sur = editingCartItem.surcharge * editingCartItem.quantity;
                        }
                        return formatCurrency(Math.max(0, subtotal - disc + sur));
                      })()}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (!editingCartItem) return;

                      setCart(prev => prev.map(item =>
                        item.product.id === editingCartItem.productId
                          ? {
                            ...item,
                            quantity: editingCartItem.quantity,
                            unitPrice: editingCartItem.price,
                            discount: editingCartItem.discount,
                            discountType: editingCartItem.discountType,
                            surcharge: editingCartItem.surcharge,
                            surchargeType: editingCartItem.surchargeType
                          }
                          : item
                      ));
                      setEditingCartItem(null);
                    }}
                    className="w-full py-4 rounded-2xl bg-neon-blue text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Ap d?ng thay ??i
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}

