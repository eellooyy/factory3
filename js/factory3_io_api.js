/* js/factory3_io_api.js */
window.Factory3Io = window.Factory3Io || {};

Factory3Io.API = {
    /* ─────────────────────────────────────────
       재고 누적 계산 (baseline 부터 순방향 전체 계산)
    ───────────────────────────────────────── */
    recalcAllStocks: function () {
        if (!Factory3Io.baselineRow) return;

        let currentSa = Factory3Io.baselineRow.stock_a;
        let currentSd = Factory3Io.baselineRow.stock_d;

        const dates = Object.keys(Factory3Io.dataCache).sort();
        dates.forEach(ds => {
            if (ds > Factory3Io.baselineRow.date) {
                const r = Factory3Io.dataCache[ds];
                currentSa += (r.in_a || 0) - (r.out_a || 0);
                currentSd += (r.in_d || 0) - (r.out_d || 0);
            }
            if (Factory3Io.dataCache[ds]) {
                Factory3Io.dataCache[ds].stock_a = currentSa;
                Factory3Io.dataCache[ds].stock_d = currentSd;
            }
        });
    },

    /* ─────────────────────────────────────────
       Supabase 로드 쿼리 모음
    ───────────────────────────────────────── */
    fetchBaseline: async function (beforeDate) {
        const { data, error } = await Factory3Io.supabase
            .from('factory3_io')
            .select('date, stock_a, stock_d')
            .lt('date', beforeDate)
            .order('date', { ascending: false })
            .limit(100);

        let found = null;
        if (!error && data && data.length > 0) {
            for (const r of data) {
                if (r.stock_a !== 0 || r.stock_d !== 0) {
                    found = r;
                    break;
                }
            }
            if (!found) found = data[data.length - 1];
        }

        if (found) {
            if (!Factory3Io.baselineRow || found.date < Factory3Io.baselineRow.date) {
                Factory3Io.baselineRow = { date: found.date, stock_a: found.stock_a || 0, stock_d: found.stock_d || 0 };
            }
        } else {
            if (!Factory3Io.baselineRow) Factory3Io.baselineRow = { date: '2000-01-01', stock_a: 0, stock_d: 0 };
        }
    },

    loadIoTableRange: async function (start, end) {
        const { data, error } = await Factory3Io.supabase
            .from('factory3_io')
            .select('date, in_a, in_d')
            .gte('date', start)
            .lte('date', end);

        if (error) {
            console.error('[factory3_io] 입고 데이터 로드 오류:', error);
            throw error;
        }
        if (data) {
            data.forEach(row => {
                if (!Factory3Io.dataCache[row.date]) Factory3Io.dataCache[row.date] = {};
                Factory3Io.dataCache[row.date].in_a = row.in_a || 0;
                Factory3Io.dataCache[row.date].in_d = row.in_d || 0;
            });
        }
    },

    loadOutgoingRange: async function (start, end) {
        const { data, error } = await Factory3Io.supabase
            .from('factory3_geupji_real')
            .select('date, col_id, value, item_type')
            .eq('item_type', 'geup_out')
            .gte('date', start)
            .lte('date', end);

        if (!error && data) {
            data.forEach(row => {
                if (!Factory3Io.dataCache[row.date]) Factory3Io.dataCache[row.date] = {};
                if (row.col_id === 'A') Factory3Io.dataCache[row.date].out_a = row.value || 0;
                if (row.col_id === 'D') Factory3Io.dataCache[row.date].out_d = row.value || 0;
            });
        }
    },

    loadUsageDataRange: async function (start, end) {
        const { data, error } = await Factory3Io.supabase
            .from('factory3_usage')
            .select('print_date, media_name, item_code, usage_qty')
            .gte('print_date', start)
            .lte('print_date', end);

        if (!error && data) {
            data.forEach(row => {
                const date = row.print_date;
                if (!Factory3Io.dataCache[date]) Factory3Io.dataCache[date] = {};
                
                if (!Factory3Io.dataCache[date].usage_media) Factory3Io.dataCache[date].usage_media = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
                if (!Factory3Io.dataCache[date].usage_paper) Factory3Io.dataCache[date].usage_paper = { A: 0, D: 0 };

                const qty = Number(row.usage_qty) || 0;
                if (row.media_name === '매일경제신문') Factory3Io.dataCache[date].usage_media[1] += qty;
                else if (row.media_name === '매일경제신문(특집)') Factory3Io.dataCache[date].usage_media[2] += qty;
                else if (row.media_name === '경인일보') Factory3Io.dataCache[date].usage_media[3] += qty;
                else if (row.media_name === '기독교타임즈') Factory3Io.dataCache[date].usage_media[4] += qty;
                else if (row.media_name === '한국대학신문') Factory3Io.dataCache[date].usage_media[5] += qty;
                else if (row.media_name === '가톨릭평화신문') Factory3Io.dataCache[date].usage_media[6] += qty;

                if (row.item_code === '11ANP-0000001') Factory3Io.dataCache[date].usage_paper.A += qty;
                else if (row.item_code === '11ANP-0000003') Factory3Io.dataCache[date].usage_paper.D += qty;
            });
        }
    },

    saveIncoming: async function (dateStr, in_a, in_d) {
        const { error } = await Factory3Io.supabase
            .from('factory3_io')
            .upsert({ date: dateStr, in_a, in_d }, { onConflict: 'date' });

        if (error) { alert('저장 실패: ' + error.message); return false; }
        return true;
    }
};