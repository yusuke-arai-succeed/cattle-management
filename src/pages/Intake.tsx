import { useState, useRef } from 'react';
import { useApp } from '../context';
import type { Cattle, IntakeRecord } from '../types';
import { generateId } from '../store';

// ============================================================
// CSVパース
// ============================================================
const CSV_SUPPLIER = '栃木県家畜商商業協同組合 那須家畜市場';

interface CsvRow {
  entryNumber: string;
  id: string;           // 個体識別番号
  gender: 'male' | 'female';
  birthDate: string;    // YYYY-MM-DD
  weight: number;
  auctionPriceExcTax: number;
  consumptionTax: number;
  purchasePrice: number;
  notes: string;
  // UI用
  _raw: string;
  _error?: string;
}

function parseNum(s: string): number {
  return Number(s.replace(/[,，\s]/g, '')) || 0;
}

function parseBirthDate(s: string): string {
  // "08/04/29" → "2008-04-29"
  const parts = s.trim().split('/');
  if (parts.length !== 3) return '';
  const [yy, mm, dd] = parts;
  const year = 2000 + Number(yy);
  return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  // ヘッダー行スキップ（1行目）
  const dataLines = lines.slice(1);
  return dataLines.map(line => {
    // カンマ区切り（引用符対応）
    const cols: string[] = [];
    let cur = '';
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur);

    const [entryNumber, rawId, genderStr, birthRaw, weightStr,
           aucExStr, taxStr, totalStr, notes] = cols.map(c => c.trim());

    const gender: 'male' | 'female' = genderStr === '雌' ? 'female' : 'male';
    const birthDate = parseBirthDate(birthRaw);

    let _error: string | undefined;
    if (!rawId) _error = '個体識別番号が空です';
    else if (!birthDate) _error = '生年月日の形式が不正です';

    return {
      entryNumber,
      id: rawId,
      gender,
      birthDate,
      weight: parseNum(weightStr),
      auctionPriceExcTax: parseNum(aucExStr),
      consumptionTax: parseNum(taxStr),
      purchasePrice: parseNum(totalStr),
      notes: notes ?? '',
      _raw: line,
      _error,
    };
  });
}

// ============================================================
// 手動入荷フォームの初期値
// ============================================================
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
  entryNumber: '',
  auctionPriceExcTax: '',
  consumptionTax: '',
  purchasePrice: '',
  notes: '',
};

// ============================================================
// メインコンポーネント
// ============================================================
export default function Intake() {
  const { data, update } = useApp();
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');

  // ---- 手動登録 ----
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // ---- CSVインポート ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvDate, setCsvDate] = useState(new Date().toISOString().slice(0, 10));
  const [csvBarnId, setCsvBarnId] = useState('');
  const [csvPenId, setCsvPenId] = useState('');
  const [csvImported, setCsvImported] = useState(false);
  const [csvErrors, setCsvErrors] = useState<Record<string, string>>({});
  const [importedCount, setImportedCount] = useState(0);

  const selectedBarn = data.barns.find(b => b.id === form.barnId);
  const csvSelectedBarn = data.barns.find(b => b.id === csvBarnId);

  // ---- 手動登録 ----
  function setF(key: keyof typeof initialForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'barnId') setForm(prev => ({ ...prev, barnId: value, penId: '' }));
  }

  function validateManual() {
    const e: Record<string, string> = {};
    if (!form.earTag.trim()) e.earTag = '個体識別番号は必須です';
    else if (data.cattle.some(c => c.id === form.earTag.trim())) e.earTag = 'この番号は既に登録されています';
    if (!form.breed.trim()) e.breed = '品種は必須です';
    if (!form.birthDate) e.birthDate = '生年月日は必須です';
    if (!form.barnId) e.barnId = '牛舎は必須です';
    if (!form.penId) e.penId = 'ペンは必須です';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submitManual() {
    if (!validateManual()) return;
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
      entryNumber: form.entryNumber.trim() || undefined,
      auctionPriceExcTax: form.auctionPriceExcTax ? Number(form.auctionPriceExcTax) : undefined,
      consumptionTax: form.consumptionTax ? Number(form.consumptionTax) : undefined,
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

  // ---- CSVインポート ----
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text).filter(r => r.id); // 空行除去
      setCsvRows(rows);
      setCsvImported(false);
      setCsvErrors({});
    };
    reader.readAsText(file, 'UTF-8');
    // inputをリセット（同じファイルを再選択できるよう）
    e.target.value = '';
  }

  function validateCsvImport() {
    const e: Record<string, string> = {};
    if (!csvBarnId) e.barn = '牛舎を選択してください';
    if (!csvPenId) e.pen = 'ペンを選択してください';
    const validRows = csvRows.filter(r => !r._error);
    if (validRows.length === 0) e.rows = '登録可能な行がありません';
    // 重複チェック
    const duplicates = validRows.filter(r => data.cattle.some(c => c.id === r.id));
    if (duplicates.length > 0) e.dup = `既に登録済みの番号があります: ${duplicates.map(r => r.id).join(', ')}`;
    setCsvErrors(e);
    return Object.keys(e).length === 0;
  }

  function submitCsvImport() {
    if (!validateCsvImport()) return;
    const validRows = csvRows.filter(r => !r._error && !data.cattle.some(c => c.id === r.id));
    const newCattle: Cattle[] = validRows.map(r => ({
      id: r.id,
      breed: '黒毛和種', // CSVに品種列がないためデフォルト（後で変更可）
      gender: r.gender,
      birthDate: r.birthDate,
      arrivalDate: csvDate,
      arrivalWeight: r.weight,
      status: 'active',
      barnId: csvBarnId,
      penId: csvPenId,
      supplierName: CSV_SUPPLIER,
      entryNumber: r.entryNumber || undefined,
      auctionPriceExcTax: r.auctionPriceExcTax || undefined,
      consumptionTax: r.consumptionTax || undefined,
      purchasePrice: r.purchasePrice || undefined,
      notes: r.notes || undefined,
    }));
    const newRecords: IntakeRecord[] = newCattle.map(c => ({
      id: generateId(),
      date: csvDate,
      cattleId: c.id,
      barnId: csvBarnId,
      penId: csvPenId,
    }));
    update(prev => ({
      ...prev,
      cattle: [...prev.cattle, ...newCattle],
      intakeRecords: [...prev.intakeRecords, ...newRecords],
    }));
    setImportedCount(newCattle.length);
    setCsvImported(true);
    setCsvRows([]);
    setCsvBarnId('');
    setCsvPenId('');
  }

  const validCsvRows = csvRows.filter(r => !r._error);
  const errorCsvRows = csvRows.filter(r => r._error);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-6">入荷登録</h2>

      {/* タブ */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'manual' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          手動登録
        </button>
        <button onClick={() => setTab('csv')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${tab === 'csv' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          📋 市場CSVインポート
        </button>
      </div>

      {/* ============================================================
          手動登録
      ============================================================ */}
      {tab === 'manual' && (
        <div className="max-w-2xl">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
              ✓ 入荷登録が完了しました
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <Section title="基本情報">
              <Field label="個体識別番号 *" error={errors.earTag}>
                <input className="border rounded-lg px-3 py-2 w-full text-sm font-mono" value={form.earTag} onChange={e => setF('earTag', e.target.value)} placeholder="XXXXX-XXXX-X" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="品種 *" error={errors.breed}>
                  <input className="border rounded-lg px-3 py-2 w-full text-sm" value={form.breed} onChange={e => setF('breed', e.target.value)} placeholder="黒毛和種" />
                </Field>
                <Field label="性別 *">
                  <select className="border rounded-lg px-3 py-2 w-full text-sm" value={form.gender} onChange={e => setF('gender', e.target.value as 'male' | 'female')}>
                    <option value="male">♂ 雄</option>
                    <option value="female">♀ 雌</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="生年月日 *" error={errors.birthDate}>
                  <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.birthDate} onChange={e => setF('birthDate', e.target.value)} />
                </Field>
                <Field label="入荷日 *">
                  <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.arrivalDate} onChange={e => setF('arrivalDate', e.target.value)} />
                </Field>
              </div>
              <Field label="入荷時体重 (kg)">
                <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.arrivalWeight} onChange={e => setF('arrivalWeight', e.target.value)} placeholder="300" />
              </Field>
            </Section>

            <Section title="配置先">
              <Field label="牛舎 *" error={errors.barnId}>
                <select className="border rounded-lg px-3 py-2 w-full text-sm" value={form.barnId} onChange={e => setF('barnId', e.target.value)}>
                  <option value="">選択してください</option>
                  {data.barns.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="ペン *" error={errors.penId}>
                <select className="border rounded-lg px-3 py-2 w-full text-sm" value={form.penId} onChange={e => setF('penId', e.target.value)} disabled={!form.barnId}>
                  <option value="">選択してください</option>
                  {(selectedBarn?.pens ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            </Section>

            <Section title="取引情報">
              <div className="grid grid-cols-2 gap-4">
                <Field label="入場番号">
                  <input className="border rounded-lg px-3 py-2 w-full text-sm" value={form.entryNumber} onChange={e => setF('entryNumber', e.target.value)} placeholder="311" />
                </Field>
                <Field label="仕入先">
                  <input className="border rounded-lg px-3 py-2 w-full text-sm" value={form.supplierName} onChange={e => setF('supplierName', e.target.value)} placeholder="〇〇牧場" />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="セリ価格（税抜）">
                  <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.auctionPriceExcTax} onChange={e => setF('auctionPriceExcTax', e.target.value)} placeholder="398000" />
                </Field>
                <Field label="消費税額">
                  <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.consumptionTax} onChange={e => setF('consumptionTax', e.target.value)} placeholder="39800" />
                </Field>
                <Field label="購買金額（税込）">
                  <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.purchasePrice} onChange={e => setF('purchasePrice', e.target.value)} placeholder="437800" />
                </Field>
              </div>
              <Field label="備考">
                <textarea className="border rounded-lg px-3 py-2 w-full text-sm" rows={2} value={form.notes} onChange={e => setF('notes', e.target.value)} />
              </Field>
            </Section>

            <button onClick={submitManual} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              入荷登録
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          CSVインポート
      ============================================================ */}
      {tab === 'csv' && (
        <div>
          {/* 説明バナー */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-5 text-sm text-blue-800">
            <p className="font-semibold mb-1">📋 那須家畜市場 購買明細書CSVインポート</p>
            <p className="text-xs text-blue-600">
              対象: <span className="font-medium">栃木県家畜商商業協同組合 那須家畜市場</span>の購買明細書CSV<br />
              CSVの列順: 入場番号, 個体識別番号, 性別, 生年月日, 体重(kg), セリ価格(税抜), 消費税額, 購買金額, 備考, ソース
            </p>
          </div>

          {/* インポート成功 */}
          {csvImported && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 mb-5 text-sm font-medium">
              ✓ {importedCount} 頭の入荷データを取り込みました
            </div>
          )}

          {/* ファイル選択エリア */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors mb-5"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = ev => {
                  const text = ev.target?.result as string;
                  const rows = parseCsv(text).filter(r => r.id);
                  setCsvRows(rows);
                  setCsvImported(false);
                  setCsvErrors({});
                };
                reader.readAsText(file, 'UTF-8');
              }
            }}
          >
            <p className="text-3xl mb-2">📁</p>
            <p className="text-sm font-medium text-gray-700">CSVファイルを選択またはドロップ</p>
            <p className="text-xs text-gray-400 mt-1">.csv ファイル</p>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>

          {/* プレビュー */}
          {csvRows.length > 0 && (
            <div className="space-y-4">
              {/* 配置先・入荷日の選択 */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-4">
                  取り込み設定
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    （全 {csvRows.length} 件 — 正常 {validCsvRows.length} 件 / エラー {errorCsvRows.length} 件）
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">入荷日 *</label>
                    <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={csvDate} onChange={e => setCsvDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">牛舎 *</label>
                    <select className="border rounded-lg px-3 py-2 w-full text-sm" value={csvBarnId} onChange={e => { setCsvBarnId(e.target.value); setCsvPenId(''); }}>
                      <option value="">選択</option>
                      {data.barns.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {csvErrors.barn && <p className="text-red-500 text-xs mt-1">{csvErrors.barn}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ペン *</label>
                    <select className="border rounded-lg px-3 py-2 w-full text-sm" value={csvPenId} onChange={e => setCsvPenId(e.target.value)} disabled={!csvBarnId}>
                      <option value="">選択</option>
                      {(csvSelectedBarn?.pens ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {csvErrors.pen && <p className="text-red-500 text-xs mt-1">{csvErrors.pen}</p>}
                  </div>
                  <div className="flex items-end">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 w-full">
                      <p className="font-medium text-gray-500 mb-0.5">入荷元（固定）</p>
                      <p className="font-semibold text-gray-700 leading-snug">那須家畜市場</p>
                    </div>
                  </div>
                </div>
                {csvErrors.dup && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                    ⚠️ {csvErrors.dup}
                  </div>
                )}
                {csvErrors.rows && (
                  <p className="mt-2 text-red-500 text-xs">{csvErrors.rows}</p>
                )}
              </div>

              {/* データプレビュー */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">データプレビュー</h3>
                  <button
                    onClick={submitCsvImport}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    disabled={validCsvRows.length === 0}
                  >
                    {validCsvRows.length} 頭を取り込む
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 text-xs">状態</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 text-xs">入場番号</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 text-xs">個体識別番号</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 text-xs">性別</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 text-xs">生年月日</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600 text-xs">体重</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600 text-xs">セリ価格(税抜)</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600 text-xs">消費税</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600 text-xs">購買金額</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 text-xs">備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((r, i) => {
                        const isDup = data.cattle.some(c => c.id === r.id);
                        const hasIssue = !!r._error || isDup;
                        return (
                          <tr key={i} className={`border-b border-gray-100 ${hasIssue ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-3 py-2.5">
                              {r._error ? (
                                <span className="text-xs text-red-600 font-medium">❌ {r._error}</span>
                              ) : isDup ? (
                                <span className="text-xs text-yellow-600 font-medium">⚠️ 登録済</span>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">✓ OK</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">{r.entryNumber}</td>
                            <td className="px-3 py-2.5 font-mono text-xs font-semibold">{r.id}</td>
                            <td className="px-3 py-2.5 text-xs">{r.gender === 'male' ? '♂ 雄' : '♀ 雌'}</td>
                            <td className="px-3 py-2.5 text-xs">{r.birthDate}</td>
                            <td className="px-3 py-2.5 text-xs text-right">{r.weight} kg</td>
                            <td className="px-3 py-2.5 text-xs text-right">¥{r.auctionPriceExcTax.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-right">¥{r.consumptionTax.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-right font-semibold">¥{r.purchasePrice.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">{r.notes || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                      <tr>
                        <td colSpan={8} className="px-3 py-2.5 text-xs font-semibold text-gray-600 text-right">合計購買金額</td>
                        <td className="px-3 py-2.5 text-sm font-bold text-gray-800 text-right">
                          ¥{validCsvRows.reduce((s, r) => s + r.purchasePrice, 0).toLocaleString()}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 共通パーツ
// ============================================================
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
