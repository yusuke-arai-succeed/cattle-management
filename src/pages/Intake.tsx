import { useState } from 'react';
import { useApp } from '../context';
import type { Cattle, IntakeRecord } from '../types';
import { generateId } from '../store';

const initialForm = {
  earTag: '',
  breed: '',
  gender: 'male' as 'male' | 'female',
  birthDate: '',
  arrivalDate: new Date().toISOString().slice(0, 10),
  arrivalWeight: '',
  barnId: '',
  penId: '',
  supplierName: '',
  purchasePrice: '',
  notes: '',
};

export default function Intake() {
  const { data, update } = useApp();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const selectedBarn = data.barns.find(b => b.id === form.barnId);

  function set(key: keyof typeof initialForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'barnId') setForm(prev => ({ ...prev, barnId: value, penId: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.earTag.trim()) e.earTag = '耳標番号は必須です';
    else if (data.cattle.some(c => c.id === form.earTag.trim())) e.earTag = 'この耳標番号は既に登録されています';
    if (!form.breed.trim()) e.breed = '品種は必須です';
    if (!form.birthDate) e.birthDate = '生年月日は必須です';
    if (!form.barnId) e.barnId = '牛舎は必須です';
    if (!form.penId) e.penId = 'ペンは必須です';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const newCattle: Cattle = {
      id: form.earTag.trim(),
      breed: form.breed.trim(),
      gender: form.gender,
      birthDate: form.birthDate,
      arrivalDate: form.arrivalDate,
      arrivalWeight: Number(form.arrivalWeight) || 0,
      status: 'active',
      barnId: form.barnId,
      penId: form.penId,
      supplierName: form.supplierName.trim() || undefined,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      notes: form.notes.trim() || undefined,
    };
    const record: IntakeRecord = {
      id: generateId(),
      date: form.arrivalDate,
      cattleId: newCattle.id,
      barnId: form.barnId,
      penId: form.penId,
    };
    update(prev => ({
      ...prev,
      cattle: [...prev.cattle, newCattle],
      intakeRecords: [...prev.intakeRecords, record],
    }));
    setForm(initialForm);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">入荷登録</h2>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
          ✓ 入荷登録が完了しました
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <Section title="基本情報">
          <Field label="耳標番号 *" error={errors.earTag}>
            <input
              className="border rounded-lg px-3 py-2 w-full text-sm"
              value={form.earTag}
              onChange={e => set('earTag', e.target.value)}
              placeholder="JP000000000000"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="品種 *" error={errors.breed}>
              <input className="border rounded-lg px-3 py-2 w-full text-sm" value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="黒毛和種" />
            </Field>
            <Field label="性別 *">
              <select className="border rounded-lg px-3 py-2 w-full text-sm" value={form.gender} onChange={e => set('gender', e.target.value as 'male' | 'female')}>
                <option value="male">♂ 雄</option>
                <option value="female">♀ 雌</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="生年月日 *" error={errors.birthDate}>
              <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
            </Field>
            <Field label="入荷日 *">
              <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.arrivalDate} onChange={e => set('arrivalDate', e.target.value)} />
            </Field>
          </div>
          <Field label="入荷時体重 (kg)">
            <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.arrivalWeight} onChange={e => set('arrivalWeight', e.target.value)} placeholder="300" />
          </Field>
        </Section>

        <Section title="配置先">
          <Field label="牛舎 *" error={errors.barnId}>
            <select
              className="border rounded-lg px-3 py-2 w-full text-sm"
              value={form.barnId}
              onChange={e => { setForm(prev => ({ ...prev, barnId: e.target.value, penId: '' })); }}
            >
              <option value="">選択してください</option>
              {data.barns.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="ペン *" error={errors.penId}>
            <select
              className="border rounded-lg px-3 py-2 w-full text-sm"
              value={form.penId}
              onChange={e => set('penId', e.target.value)}
              disabled={!form.barnId}
            >
              <option value="">選択してください</option>
              {(selectedBarn?.pens ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="取引情報">
          <div className="grid grid-cols-2 gap-4">
            <Field label="仕入先">
              <input className="border rounded-lg px-3 py-2 w-full text-sm" value={form.supplierName} onChange={e => set('supplierName', e.target.value)} placeholder="〇〇牧場" />
            </Field>
            <Field label="購入価格 (円)">
              <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="500000" />
            </Field>
          </div>
          <Field label="備考">
            <textarea className="border rounded-lg px-3 py-2 w-full text-sm" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Field>
        </Section>

        <button
          onClick={submit}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          入荷登録
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
