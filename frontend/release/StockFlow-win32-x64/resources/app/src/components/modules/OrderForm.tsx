import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { Product, Customer, Supplier, fmt } from '../../lib/api';

interface OrderLine {
  product_code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderFormProps {
  type: 'sale' | 'purchase';
  onSave: (data: any) => void;
  onClose: () => void;
}

export default function OrderForm({ type, onSave, onClose }: OrderFormProps) {
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [parties, setParties] = useState<(Customer | Supplier)[]>([]);
  const [partySuggestions, setPartySuggestions] = useState<(Customer | Supplier)[]>([]);
  const [lines, setLines] = useState<OrderLine[]>([{ product_code: '', name: '', quantity: 1, price: 0, total: 0 }]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState<string[]>(['']);

  useEffect(() => {
    api.get('/products').then((r: { data: Product[] }) => setProductList(r.data));
    const endpoint = type === 'sale' ? '/customers' : '/suppliers';
    api.get(endpoint).then((r: { data: (Customer | Supplier)[] }) => setParties(r.data));
  }, [type]);

  const handlePartySearch = (val: string) => {
    setPartySearch(val);
    if (val.length < 1) { setPartySuggestions([]); return; }
    const q = val.toLowerCase();
    setPartySuggestions(parties.filter((p: Customer | Supplier) => {
      const name = p.name.toLowerCase();
      const id = (('customer_id' in p ? p.customer_id : p.supplier_id) || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    }).slice(0, 5));
  };

  const selectParty = (p: Customer | Supplier) => {
    const id = 'customer_id' in p ? p.customer_id : p.supplier_id;
    setPartyId(id); setPartyName(p.name); setPartySearch(p.name); setPartySuggestions([]);
  };

  const handleProductSearch = (idx: number, val: string) => {
    const newSearch = [...productSearch];
    newSearch[idx] = val;
    setProductSearch(newSearch);
    if (!val) return;
    const q = val.toLowerCase();
    // Match either code, name, or the combined "code — name" format
    const match = productList.find(p => 
      p.product_code.toLowerCase() === q || 
      p.name.toLowerCase() === q ||
      `${p.product_code} — ${p.name}`.toLowerCase() === q
    );
    if (match) selectProduct(idx, match);
  };

  const selectProduct = (idx: number, p: Product) => {
    const newLines = [...lines];
    newLines[idx] = { product_code: p.product_code, name: p.name, quantity: newLines[idx].quantity || 1, price: p.price, total: p.price * (newLines[idx].quantity || 1) };
    setLines(newLines);
    const newSearch = [...productSearch];
    newSearch[idx] = `${p.product_code} — ${p.name}`;
    setProductSearch(newSearch);
  };

  const updateLine = (idx: number, field: 'quantity' | 'price', val: number) => {
    const newLines = [...lines];
    newLines[idx] = { ...newLines[idx], [field]: val, total: field === 'quantity' ? val * newLines[idx].price : newLines[idx].quantity * val };
    setLines(newLines);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_: OrderLine, i: number) => i !== idx));
    setProductSearch(productSearch.filter((_: string, i: number) => i !== idx));
  };

  const addLine = () => {
    setLines([...lines, { product_code: '', name: '', quantity: 1, price: 0, total: 0 }]);
    setProductSearch([...productSearch, '']);
  };

  const total = lines.reduce((s: number, l: OrderLine) => s + l.total, 0);

  const handleSubmit = async () => {
    const validLines = lines.filter((l: OrderLine) => l.product_code && l.quantity > 0);
    if (validLines.length === 0) return toast.error('Add at least one product');
    setSaving(true);
    try {
      const { data } = await api.post('/orders', { type, party_id: partyId, party_name: partyName || partySearch, products: validLines, notes });
      onSave(data);
      toast.success(`${type === 'sale' ? 'Sales' : 'Purchase'} order created`);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create order');
    } finally { setSaving(false); }
  };

  const partyLabel = type === 'sale' ? 'Customer' : 'Supplier';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <h2 className="font-semibold text-ink-900">New {type === 'sale' ? 'Sales' : 'Purchase'} Order</h2>
          <button className="btn btn-ghost btn-sm p-1.5 h-auto" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Party search */}
          <div>
            <label className="label">{partyLabel}</label>
            <div className="relative">
              <input className="input" placeholder={`Search ${partyLabel.toLowerCase()} by name or ID…`} value={partySearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePartySearch(e.target.value)} />
              {partySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-surface-3 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                  {partySuggestions.map((p: Customer | Supplier) => (
                    <div key={'customer_id' in p ? p.customer_id : p.supplier_id} className="px-4 py-2.5 hover:bg-surface-1 cursor-pointer text-sm" onClick={() => selectParty(p)}>
                      <span className="font-medium text-ink-900">{p.name}</span>
                      <span className="text-ink-400 ml-2 font-mono text-xs">{'customer_id' in p ? p.customer_id : p.supplier_id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <div>
            <label className="label">Products</label>
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Product</th>
                    <th style={{ width: '20%' }}>Qty</th>
                    <th style={{ width: '20%' }}>Price (₹)</th>
                    <th style={{ width: '15%' }}>Total</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="relative">
                          <input className="input text-sm" placeholder="Search product code or name…" value={productSearch[idx]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProductSearch(idx, e.target.value)}
                            list={`products-${idx}`} />
                          <datalist id={`products-${idx}`}>
                            {productList.map(p => <option key={p.product_code} value={`${p.product_code} — ${p.name}`} />)}
                          </datalist>
                        </div>
                      </td>
                      <td><input className="input text-sm" type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                      <td><input className="input text-sm" type="number" min="0" step="0.01" value={line.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLine(idx, 'price', parseFloat(e.target.value) || 0)} /></td>
                      <td className="text-sm font-medium text-ink-700">{fmt.currency(line.total)}</td>
                      <td><button className="btn btn-ghost btn-sm p-1 h-auto text-ink-300 hover:text-red-500" onClick={() => removeLine(idx)} disabled={lines.length === 1}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-surface-2 flex items-center justify-between">
                <button className="btn btn-ghost btn-sm text-brand-500" onClick={addLine}><Plus size={14} />Add Product</button>
                <div className="text-sm font-semibold text-ink-900">Total: {fmt.currency(total)}</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} placeholder="Any additional notes…" value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-2">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Creating…' : 'Create Order'}</button>
        </div>
      </div>
    </div>
  );
}
