# Gemini API Quota Optimization Guide

## 🎯 Apa yang Sudah Dioptimalkan

### 1. **Prompt Optimization** (~40% token reduction)

- ✅ Knowledge snippets dikurangi menjadi 1/3 ukuran asli
- ✅ Sprint planning prompt disederhanakan (verbose → concise)
- ✅ Menghilangkan JSON stringify penuh dari input
- ✅ Menghilangkan penjelasan berlebihan di output format

### 2. **Caching Mechanism**

- ✅ In-memory cache dengan 1-jam TTL
- ✅ Cache key menggunakan MD5 hash dari prompt
- ✅ Mencegah API call duplikat untuk request yang sama

### 3. **Retry Logic**

- ✅ Exponential backoff (1s → 2s → 4s)
- ✅ Stop immediately jika quota error (tidak retry)
- ✅ Max 3 attempts untuk network errors saja

---

## 📊 Estimasi Token Savings

| Component             | Before       | After       | Saving  |
| --------------------- | ------------ | ----------- | ------- |
| Sprint Prompt         | ~1200 tokens | ~450 tokens | **63%** |
| Estimate Prompt       | ~350 tokens  | ~150 tokens | **57%** |
| Breakdown Prompt      | ~280 tokens  | ~120 tokens | **57%** |
| Knowledge Injection   | ~150 tokens  | ~50 tokens  | **67%** |
| **Total per request** | **~1980**    | **~770**    | **61%** |

### Contoh: Sprint dengan 5 tasks

- **Before**: 1980 tokens × 1 request = ~1980 tokens
- **After**: 770 tokens × 1 request (cached) = ~770 tokens
- **Savings**: 1210 tokens / request (61% reduction)

---

## 🚀 Best Practices untuk Menghindari Quota Terlampaui

### ✅ DO's

1. **Batch requests ke 1 endpoint**

   ```typescript
   // ✅ GOOD - 1 request ke /api/sprint
   fetch("/api/sprint", { body: allTasksAtOnce });

   // ❌ BAD - 3 requests (estimate + breakdown + sprint)
   fetch("/api/estimate");
   fetch("/api/breakdown");
   fetch("/api/sprint");
   ```

2. **Use cache aggressively**
   - Cache sudah built-in sekarang
   - Refresh cache dengan `cache.clear()` saat user edit

3. **Keep prompts concise**
   - Gunakan shorthand (u/ untuk "untuk", w/ untuk "dengan")
   - Hapus penjelasan redundan
   - Fokus pada instruksi, bukan cerita

4. **Set appropriate TTL untuk cache**
   - Default: 1 jam (development/testing)
   - Production: Tergantung business logic

### ❌ DON'Ts

1. **Jangan retry terus-menerus** → sudah ditangani
2. **Jangan kirim data yang tidak perlu**

   ```typescript
   // ❌ Jangan: full object dengan field yang tidak relevan
   JSON.stringify(input, null, 2)
   // ✅ Gunakan: hanya field yang diperlukan
   `Task: ${input.name}, Complexity: ${input.complexity}`;
   ```

3. **Jangan buat multiple API calls untuk data yang bisa digabung**

---

## 📋 Implementation Checklist

- [x] Prompt optimization di `/src/features/planner/prompts.ts`
- [x] Caching mechanism di `/src/lib/ai.ts`
- [x] Retry logic dengan exponential backoff
- [ ] (Optional) Add Redis cache untuk production
- [ ] (Optional) Add request logging untuk monitoring
- [ ] (Optional) Add request deduplication untuk concurrent calls

---

## 🔧 Cara Menggunakan Cache API

### Cek cache status (development only):

```typescript
// Di console/terminal
const cache = require("@/lib/ai").requestCache;
console.log(cache.size); // berapa request di cache
```

### Clear cache jika perlu:

```typescript
// Jika user mengedit setting, clear cache
requestCache.clear();
```

### Custom TTL:

Edit `CACHE_TTL_MS` di `src/lib/ai.ts`:

```typescript
const CACHE_TTL_MS = 3600000; // 1 hour
const CACHE_TTL_MS = 1800000; // 30 min
const CACHE_TTL_MS = 600000; // 10 min
```

---

## 📈 Monitoring Quota

### Google Cloud Console

1. Buka: https://console.cloud.google.com
2. Jalankan report query untuk `generativelanguage.googleapis.com`:

```sql
SELECT timestamp, metric.type, resource.labels.service
FROM logentries
WHERE metric.type LIKE 'generativelanguage%'
AND timestamp >= CURRENT_DATE()
ORDER BY timestamp DESC
```

### Alternatif: Dashboard API

Gunakan: https://ai.google.dev/billing/

---

## 🎓 Kapan Quota Akan Reset

- **Free Tier**: 60 requests per minute, reset setiap menit
- **Paid Tier**: Tergantung plan yang dibeli
- **Rate Limit**: Jika kena, tunggu sesuai error message (usually 30-60 sec)

---

## 💡 Optimization Tips Lanjutan

### 1. Implement Request Queuing

```typescript
// Queue requests agar tidak concurrent pada free tier
class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        const result = await fn();
        resolve(result);
      });
      this.process();
    });
  }
}
```

### 2. Add User Feedback

- Show "Analyzing..." state
- Explain that quota limits exist
- Suggest batch processing

### 3. Implement Graceful Degradation

```typescript
// Sudah ada di shouldUseLocalFallback()
// Jika quota habis, gunakan fallback logic lokal
```

---

## 🆘 Troubleshooting

### Error: "Quota exceeded for free_tier_requests"

- **Penyebab**: Terlalu banyak request dalam 1 menit
- **Solusi**:
  1. Tunggu 1-2 menit
  2. Reduce parallel requests
  3. Implement request queuing

### Error: "Quota exceeded for input_token_count"

- **Penyebab**: Prompts terlalu besar
- **Solusi**:
  1. Optimize prompts (sudah dilakukan)
  2. Reduce knowledge injection
  3. Compress input data

### Cache hit tapi hasil berbeda

- **Kemungkinan**: Perbedaan whitespace/formatting di prompt
- **Solusi**: Normalize prompt sebelum hashing

---

## 📞 Support

Jika masih kena quota:

1. Pertahankan 5-10 detik delay antar request
2. Gunakan free tier API dari provider lain
3. Upgrade ke paid tier Google Gemini
4. Implementasi queue system yang lebih sophisticated
