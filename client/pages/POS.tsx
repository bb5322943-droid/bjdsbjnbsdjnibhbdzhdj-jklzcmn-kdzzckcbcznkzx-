import { useState, useCallback } from "react";
import {
  Banknote,
  CreditCard,
  DollarSign,
  Minus,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { POSCartItem, POSProduct } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/format";
import { branding } from "@/config/branding";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useProducts, useCustomers, useCreateSale } from "@/hooks/use-api";

/** QQS stavkasi (0 = QQS yo'q, 0.12 = 12%). Bir joyda o'zgartirish uchun. */
const VAT_RATE = 0;

export default function POS() {
  const { user } = useAuth();
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [terminalAmount, setTerminalAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);

  // Real API — ombordagi mahsulotlar
  const { data: productsData, isLoading: productsLoading } = useProducts({
    limit: 200,
    search: search || undefined,
    category: selectedCategory || undefined,
  });

  // Real API — mijozlar (qarz uchun)
  const { data: customersData } = useCustomers({ limit: 100 });

  const createSale = useCreateSale();

  const allProducts: POSProduct[] = (productsData?.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    quantity: p.quantity,
  }));

  // Kategoriyalar mahsulotlardan dinamik ajratiladi
  const categories = [...new Set(allProducts.map((p) => p.category))];

  const filteredProducts = allProducts.filter((p) => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesCategory && p.quantity > 0;
  });

  // Cart hisob-kitoblari — chegirma to'g'ri ishlaydi
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = cart.reduce((sum, item) => {
    const discountPct = item.discount ?? 0;
    return sum + Math.round((item.price * item.quantity * discountPct) / 100);
  }, 0);
  const taxAmount = Math.round((subtotal - totalDiscount) * VAT_RATE);
  const total = subtotal - totalDiscount + taxAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: POSProduct) => {
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error("Omborda yetarli mahsulot yo'q!");
        return;
      }
      setCart(cart.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: i.price * (i.quantity + 1) }
          : i,
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        total: product.price,
        discount: 0,
        category: product.category,
      }]);
    }
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) { removeFromCart(productId); return; }
    const product = allProducts.find((p) => p.id === productId);
    if (product && newQty > product.quantity) {
      toast.error("Omborda yetarli mahsulot yo'q!"); return;
    }
    setCart(cart.map((i) =>
      i.productId === productId ? { ...i, quantity: newQty, total: i.price * newQty } : i,
    ));
  };

  const updateDiscount = useCallback((productId: string, pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct));
    setCart((prev) => prev.map((i) =>
      i.productId === productId ? { ...i, discount: clamped } : i,
    ));
  }, []);

  const removeFromCart = (productId: string) =>
    setCart(cart.filter((i) => i.productId !== productId));

  const clearCart = () => {
    setCart([]);
    setCashAmount(""); setCardAmount(""); setTerminalAmount("");
    setSelectedCustomer(""); setShowPaymentModal(false);
  };

  const openPaymentModal = () => {
    if (cart.length === 0) { toast.error("Savat bo'sh!"); return; }
    setShowPaymentModal(true);
  };

  const processTransaction = async () => {
    const cash = Number(cashAmount) || 0;
    const card = Number(cardAmount) || 0;
    const terminal = Number(terminalAmount) || 0;
    const paidAmount = cash + card + terminal;

    if (paidAmount < total && !selectedCustomer) {
      toast.error("Qarzga sotish uchun mijozni tanlang!"); return;
    }

    const paymentCount = [cash > 0, card > 0, terminal > 0].filter(Boolean).length;
    const paymentMethod: "cash" | "card" | "transfer" | "credit" | "mixed" =
      paidAmount === 0 ? "credit"
      : paymentCount > 1 ? "mixed"
      : card > 0 || terminal > 0 ? "card"
      : "cash";

    const selectedCustomerData = customersData?.data.find((c) => c.id === selectedCustomer);

    setIsProcessing(true);
    try {
      // Real API ga so'rov
      const saleData = {
        customerId: selectedCustomer || null,
        customerName: selectedCustomerData?.name || null,
        customerPhone: selectedCustomerData?.phone || null,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          total: Math.round(item.price * item.quantity * (1 - (item.discount ?? 0) / 100)),
          discount: item.discount ?? 0,
        })),
        subtotal,
        discount: totalDiscount,
        tax: taxAmount,
        total,
        paymentMethod,
        sellerId: user?.id ?? "unknown",
        sellerName: user?.name ?? "Kassir",
        branchId: "branch1",
        branchName: "Asosiy filial",
        note: "",
      };

      const result = await createSale.mutateAsync(saleData);

      // Chek chop etish
      printReceipt(result.data, paidAmount, total - paidAmount);

      if (paidAmount >= total) {
        toast.success(`Sotuv muvaffaqiyatli! Chek: ${result.data.saleNumber}`);
      } else if (paidAmount > 0) {
        toast.success(`Qisman to'lov. Qarz: ${formatCurrency(total - paidAmount)}`);
      } else {
        toast.success(`Qarz sifatida saqlandi: ${formatCurrency(total)}`);
      }
      clearCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sotuv jarayonida xatolik!");
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (sale: { saleNumber: string; items: any[]; subtotal: number; discount: number; tax: number; total: number; paymentMethod: string; sellerName: string; branchName: string }, paidAmount: number, debtAmount: number) => {
    const w = window.open("", "_blank", "width=320,height=600");
    if (!w) { toast.error("Chek oynasini ochib bo'lmadi!"); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chek</title>
<style>body{font-family:'Courier New',monospace;max-width:300px;margin:0 auto;padding:10px;font-size:12px}
.center{text-align:center}.bold{font-weight:bold}.row{display:flex;justify-content:space-between;margin:4px 0}
.dashed{border-top:1px dashed #000;margin:10px 0}.double{border-top:2px dashed #000;margin:10px 0}
@media print{button{display:none}}</style></head><body>
<div class="center bold" style="font-size:16px">${branding.fullName.toUpperCase()}</div>
<div class="center">${sale.branchName}</div>
<div class="dashed"></div>
<div class="row"><span>Chek:</span><span>${sale.saleNumber}</span></div>
<div class="row"><span>Sana:</span><span>${new Date().toLocaleString("uz-UZ")}</span></div>
<div class="row"><span>Kassir:</span><span>${sale.sellerName}</span></div>
<div class="dashed"></div>
${sale.items.map((item: any, i: number) => `<div class="bold">${i + 1}. ${item.productName}</div>
<div class="row" style="margin-left:10px"><span>${item.quantity} × ${formatCurrency(item.unitPrice)}</span><span>${formatCurrency(item.total)}</span></div>`).join("")}
<div class="dashed"></div>
<div class="row"><span>Oraliq:</span><span>${formatCurrency(sale.subtotal)}</span></div>
${sale.discount > 0 ? `<div class="row"><span>Chegirma:</span><span>-${formatCurrency(sale.discount)}</span></div>` : ""}
${sale.tax > 0 ? `<div class="row"><span>QQS:</span><span>${formatCurrency(sale.tax)}</span></div>` : ""}
<div class="double"></div>
<div class="row bold" style="font-size:15px"><span>JAMI:</span><span>${formatCurrency(sale.total)}</span></div>
${paidAmount > 0 && paidAmount < sale.total ? `<div class="row" style="color:#d97706"><span>To'langan:</span><span>${formatCurrency(paidAmount)}</span></div>
<div class="row bold" style="color:#dc2626"><span>QARZ:</span><span>${formatCurrency(debtAmount)}</span></div>` : ""}
${paidAmount > sale.total ? `<div class="row"><span>Qaytim:</span><span>${formatCurrency(paidAmount - sale.total)}</span></div>` : ""}
<div class="double"></div>
<div class="center">Xaridingiz uchun rahmat!</div>
<div style="text-align:center;margin-top:15px">
<button onclick="window.print()" style="padding:8px 16px;cursor:pointer">Chop etish</button>
<button onclick="window.close()" style="padding:8px 16px;cursor:pointer;margin-left:8px">Yopish</button>
</div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const paidNow = (Number(cashAmount) || 0) + (Number(cardAmount) || 0) + (Number(terminalAmount) || 0);
  const remaining = total - paidNow;

  return (
    // h-screen o'rniga header balandligini ayirib aniq hisoblash
    <div className="flex bg-slate-50" style={{ height: "calc(100vh - 73px)" }}>
      {/* Chap panel — Mahsulotlar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* POS header */}
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">Kassa</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <User size={13} className="mr-1" />
                {user?.name ?? "Kassir"}
              </Badge>
              <Badge variant="outline">Asosiy filial</Badge>
            </div>
          </div>
        </div>

        {/* Qidiruv va kategoriyalar */}
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Mahsulot nomi yoki barkod..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={!selectedCategory ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setSelectedCategory(null)}
              >
                Barchasi
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Mahsulotlar grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Mahsulot topilmadi</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer transition-shadow hover:shadow-md active:scale-95"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="mb-2 flex aspect-square items-center justify-center rounded-lg bg-slate-100">
                      <Package size={22} className="text-slate-400" />
                    </div>
                    <h3 className="line-clamp-2 text-xs font-semibold text-slate-800">{product.name}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-900">{formatCurrency(product.price)}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
                      <span className="text-[10px] text-slate-400">Qoldiq: {product.quantity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* O'ng panel — Savat */}
      <div className="flex w-80 flex-col border-l border-slate-200 bg-white lg:w-96">
        {/* Savat header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {itemCount}
              </div>
              <span className="font-bold text-slate-900">Joriy savdo</span>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}
                className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Savat elementlari */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart size={48} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400">Savat bo'sh</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="rounded-lg bg-slate-50 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 text-xs font-semibold leading-tight text-slate-800">{item.productName}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.productId)}
                      className="h-5 w-5 p-0 text-slate-400 hover:text-red-500">
                      <X size={12} />
                    </Button>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                        <Minus size={11} />
                      </Button>
                      <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        <Plus size={11} />
                      </Button>
                    </div>
                    {/* Chegirma — to'g'ri ishlaydi */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">Chegirma:</span>
                      <Input
                        type="number"
                        value={item.discount ?? 0}
                        onChange={(e) => updateDiscount(item.productId, Number(e.target.value))}
                        className="h-6 w-12 px-1 text-center text-xs"
                        min="0" max="100"
                      />
                      <span className="text-[10px] text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                    <span>{formatCurrency(item.price)} × {item.quantity}</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(Math.round(item.price * item.quantity * (1 - (item.discount ?? 0) / 100)))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jami va checkout */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 p-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Oraliq summa</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Chegirma</span>
                  <span className="font-semibold text-red-600">−{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              {VAT_RATE > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">QQS ({Math.round(VAT_RATE * 100)}%)</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Jami to'lov</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
            <Button className="mt-3 h-12 w-full bg-blue-600 text-sm font-semibold hover:bg-blue-700"
              onClick={openPaymentModal}>
              <Receipt className="mr-2" size={18} /> To'lovga o'tish
            </Button>
          </div>
        )}
      </div>

      {/* To'lov modali */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>To'lovni rasmiylashtirish</DialogTitle>
            <DialogDescription>To'lov usulini tanlang va savdoni yakunlang.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg bg-slate-100 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Jami summa</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</p>
            </div>

            {/* To'lov miqdorlari */}
            <div className="space-y-2">
              {[
                { icon: Banknote, label: "Naqd", value: cashAmount, set: setCashAmount },
                { icon: CreditCard, label: "Karta", value: cardAmount, set: setCardAmount },
                { icon: DollarSign, label: "Terminal", value: terminalAmount, set: setTerminalAmount },
              ].map(({ icon: Icon, label, value, set }) => (
                <div key={label}>
                  <Label className="mb-1 flex items-center gap-1 text-xs font-medium">
                    <Icon size={13} /> {label}
                  </Label>
                  <Input
                    type="number" placeholder="0" value={value} min="0" step="1000"
                    className="h-9 text-sm"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || Number(v) >= 0) set(v);
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Qoldiq hisob */}
            {remaining > 0 && (
              <Alert className="border-orange-200 bg-orange-50 py-2">
                <Wallet className="h-3.5 w-3.5 text-orange-600" />
                <AlertDescription className="text-xs font-medium text-orange-800">
                  Qoldi — qarzga yoziladi: {formatCurrency(remaining)}
                </AlertDescription>
              </Alert>
            )}
            {paidNow > total && (
              <Alert className="border-green-200 bg-green-50 py-2">
                <AlertDescription className="text-xs font-medium text-green-800">
                  Qaytim: {formatCurrency(paidNow - total)}
                </AlertDescription>
              </Alert>
            )}

            {/* Mijoz tanlash — faqat qarz bo'lganda */}
            {remaining > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Mijoz <span className="text-red-500">*</span>
                </Label>
                <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox"
                      className="h-9 w-full justify-between text-sm font-normal">
                      {selectedCustomer
                        ? customersData?.data.find((c) => c.id === selectedCustomer)?.name
                        : <span className="text-slate-400">Mijozni tanlang...</span>}
                      <ChevronDown size={14} className="text-slate-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Mijoz qidirish..." />
                      <CommandList>
                        <CommandEmpty>Mijoz topilmadi.</CommandEmpty>
                        <CommandGroup>
                          {(customersData?.data ?? []).map((c) => (
                            <CommandItem key={c.id} value={c.name}
                              onSelect={() => { setSelectedCustomer(c.id); setOpenCustomerPopover(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedCustomer === c.id ? "opacity-100" : "opacity-0")} />
                              <span>{c.name}</span>
                              <span className="ml-auto text-xs text-slate-400">{c.phone}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {!selectedCustomer && (
                  <p className="text-xs text-red-500">Qarzga sotish uchun mijozni tanlang</p>
                )}
              </div>
            )}

            <div className="flex gap-2 border-t pt-3">
              <Button variant="outline" className="flex-1 h-9" disabled={isProcessing}
                onClick={() => { setShowPaymentModal(false); setCashAmount(""); setCardAmount(""); setTerminalAmount(""); setSelectedCustomer(""); }}>
                Bekor
              </Button>
              <Button className="flex-1 h-9 bg-blue-600 font-semibold hover:bg-blue-700"
                onClick={processTransaction} disabled={isProcessing}>
                {isProcessing ? "Saqlanmoqda..." : <><Receipt size={15} className="mr-1" /> Yakunlash</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
