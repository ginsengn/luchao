// =========================================================
//  MTRACHCAT2.JS (v3 – BỔ TÚC LOGIC HIỆP KỶ BIỆN PHƯƠNG THƯ)
//  Trạch Cát: Niên–Nguyệt khắc/hợp Sơn gia (Mộ Long Biến Vận)
//
//  NÂNG CẤP TRONG v3:
//    1. Quy tắc "Đông Chí trùng biến" riêng cho 4 sơn Kim (Càn, Hợi, Đoài/Dậu, Đinh).
//    2. Đặc biệt cát (DAC_BIET_CAT) khi Nạp Âm Mộ Long khắc Nạp Âm Thái Tuế (trụ Niên).
//    3. Bổ sung cảnh báo ngũ hành kỵ trực tiếp theo Bảng Mộ Long Biến Vận.
//    4. Thêm ghi chú phạm vi ứng dụng (Đào đất / Phần ngầm vs Phần nổi).
//
//  API (window.TrachCat):
//    moLong(son, can, laSauDongChi)   -> mộ long của sơn theo can năm
//    danhGiaThoiDiem(son, y, m, d, chi)
//    quetKhoang(son, tu, den, opts)
//    CONFIG
// =========================================================
(function (root) {
    'use strict';

    // ---------- DỮ LIỆU GỐC ----------
    const CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
    const CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];

    // Tên quái dùng thay cho 4 sơn chính vị
    const QUAI_RA_CHI = { 'Khảm':'Tý', 'Ly':'Ngọ', 'Chấn':'Mão', 'Đoài':'Dậu' };

    // Bảng Hồng Phạm Ngũ Hành (Chính vận 24 sơn)
    const SON_HANH = {
        'Giáp':'Thủy','Dần':'Thủy','Thìn':'Thủy','Tốn':'Thủy','Tuất':'Thủy','Tý':'Thủy','Tân':'Thủy','Thân':'Thủy',
        'Sửu':'Thổ','Quý':'Thổ','Khôn':'Thổ','Canh':'Thổ','Mùi':'Thổ',
        'Ngọ':'Hỏa','Nhâm':'Hỏa','Bính':'Hỏa','Ất':'Hỏa',
        'Mão':'Mộc','Cấn':'Mộc','Tỵ':'Mộc',
        'Càn':'Kim','Hợi':'Kim','Dậu':'Kim','Đinh':'Kim'
    };

    // Cục tam hợp -> chi Mộ khố (Thủy & Thổ cùng mộ tại Thìn)
    const HANH_RA_MO = { 'Thủy':'Thìn','Thổ':'Thìn','Hỏa':'Tuất','Kim':'Sửu','Mộc':'Mùi' };

    // Ngũ hành khắc Mộ vận (Hành kỵ dùng cho Năm, Tháng, Ngày, Giờ)
    const HANH_BI_KHAC_BOI = { 'Mộc':'Kim', 'Kim':'Hỏa', 'Hỏa':'Thủy', 'Thủy':'Thổ', 'Thổ':'Mộc' };

    // 30 cặp nạp âm, bắt đầu từ Giáp Tý/Ất Sửu
    const NAP_AM = [
        ['Hải trung kim','Kim'],['Lư trung hỏa','Hỏa'],['Đại lâm mộc','Mộc'],['Lộ bàng thổ','Thổ'],['Kiếm phong kim','Kim'],
        ['Sơn đầu hỏa','Hỏa'],['Giản hạ thủy','Thủy'],['Thành đầu thổ','Thổ'],['Bạch lạp kim','Kim'],['Dương liễu mộc','Mộc'],
        ['Tuyền trung thủy','Thủy'],['Ốc thượng thổ','Thổ'],['Tích lịch hỏa','Hỏa'],['Tùng bách mộc','Mộc'],['Trường lưu thủy','Thủy'],
        ['Sa trung kim','Kim'],['Sơn hạ hỏa','Hỏa'],['Bình địa mộc','Mộc'],['Bích thượng thổ','Thổ'],['Kim bạch kim','Kim'],
        ['Phú đăng hỏa','Hỏa'],['Thiên hà thủy','Thủy'],['Đại dịch thổ','Thổ'],['Thoa xuyến kim','Kim'],['Tang đố mộc','Mộc'],
        ['Đại khê thủy','Thủy'],['Sa trung thổ','Thổ'],['Thiên thượng hỏa','Hỏa'],['Thạch lựu mộc','Mộc'],['Đại hải thủy','Thủy']
    ];

    const SINH = { 'Mộc':'Hỏa','Hỏa':'Thổ','Thổ':'Kim','Kim':'Thủy','Thủy':'Mộc' };
    const KHAC = { 'Mộc':'Thổ','Thổ':'Thủy','Thủy':'Hỏa','Hỏa':'Kim','Kim':'Mộc' };

    // ---------- QUY ƯỚC CHỈNH ĐƯỢC ----------
    const CONFIG = {
        mucTheoQuanHe: {
            dongHanh:        'CAT',
            sinhMoLong:      'DAI_CAT',
            biMoLongKhac:    'CAT',          // Riêng trụ Niên sẽ nâng lên DAC_BIET_CAT
            biMoLongKhacNien:'DAC_BIET_CAT', // Hiệp Kỷ: "Mộ vận nạp âm khắc Thái tuế nạp âm là đặc biệt cát"
            moLongSinh:      'TIEU_HUNG',
            khacMoLong:      'DAI_HUNG'
        },
        // Kết luận chung: Niên + 3 trụ (Tháng, Ngày, Giờ) — "3 chọi 1"
        xepLoai: function (nienMuc, ba) {
            const tot = m => m === 'CAT' || m === 'DAI_CAT' || m === 'DAC_BIET_CAT';
            const soCat = ba.filter(tot).length;
            const coDaiHung = ba.indexOf('DAI_HUNG') !== -1;
            if (tot(nienMuc)) {
                if (soCat === 3) return 'DAI_CAT';
                if (soCat === 2 && !coDaiHung) return 'CAT';
                return 'NEN_TRANH';
            }
            if (nienMuc === 'TIEU_HUNG') return soCat === 3 ? 'TRUNG_SACH' : 'NEN_TRANH';
            if (nienMuc === 'DAI_HUNG')  return soCat === 3 ? 'HA_SACH'    : 'NEN_TRANH';
            return 'NEN_TRANH';
        }
    };

    const NHAN_MUC = {
        DAC_BIET_CAT:'Đặc biệt cát (Chế Thái Tuế)',
        DAI_CAT:'Đại cát',
        CAT:'Cát',
        TIEU_HUNG:'Tiểu hung (Tiết khí)',
        DAI_HUNG:'Đại hung (Khắc Mộ vận)'
    };
    const NHAN_LOAI = {
        DAI_CAT:'Đại cát',
        CAT:'Cát',
        TRUNG_SACH:'Trung sách (3 chọi 1)',
        HA_SACH:'Hạ sách — nên hoãn nếu được',
        NEN_TRANH:'Nên tránh'
    };

    // ---------- HÀM CƠ BẢN ----------
    function chuanHoaSon(son) {
        let s = String(son || '').trim();
        s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        if (s === 'Tị') s = 'Tỵ';
        if (QUAI_RA_CHI[s]) s = QUAI_RA_CHI[s];
        return SON_HANH[s] ? s : null;
    }

    function parseCanChi(text) {
        const p = String(text || '').trim().split(/\s+/);
        if (p.length < 2) return null;
        const chi = p[1] === 'Tị' ? 'Tỵ' : p[1];
        const c = CAN.indexOf(p[0]), h = CHI.indexOf(chi);
        if (c < 0 || h < 0 || (c % 2) !== (h % 2)) return null;
        let n = -1;
        for (let t = 0; t < 6; t++) { if ((c + 10 * t) % 12 === h) { n = c + 10 * t; break; } }
        return n < 0 ? null : { can: p[0], chi: chi, idx60: n };
    }

    function napAm(canChiText) {
        const cc = parseCanChi(canChiText);
        if (!cc) return null;
        const e = NAP_AM[Math.floor(cc.idx60 / 2)];
        return { canChi: cc.can + ' ' + cc.chi, ten: e[0], hanh: e[1] };
    }

    // Kiểm tra xem ngày có rơi vào khoảng Sau Đông Chí (từ ~21/12 Dương lịch) đến trước Lập Xuân (tháng 1 Dương lịch) không
    function kiemTraSauDongChiTruocLapXuan(y, m, d, ctx) {
        // Nếu calendar-core.js có trả về tên tiết khí hiện hành (VD: "Đông chí", "Tiểu hàn", "Đại hàn")
        if (ctx && ctx.tietKhi && ctx.tietKhi.ten) {
            const tenTK = ctx.tietKhi.ten.toLowerCase();
            if (tenTK.includes('đông chí') || tenTK.includes('tiểu hàn') || tenTK.includes('đại hàn')) {
                return true;
            }
        }
        // Fallback an toàn theo Dương lịch: từ 22/12 đến 31/12 luôn nằm sau Đông Chí và trước Lập Xuân
        if (m === 12 && d >= 22) return true;
        return false;
    }

    // Ngũ Tý Nguyên Độn tính Mộ Long Biến Vận (Có xét Đông Chí trùng biến cho 4 sơn Kim)
    function moLong(son, canNam, laSauDongChi) {
        const s = chuanHoaSon(son);
        let canIdx = CAN.indexOf(canNam);
        if (!s || canIdx < 0) return null;

        const hanhSon = SON_HANH[s];
        let daTrungBien = false;

        // Quy tắc Hiệp Kỷ: "Bốn sơn Càn, Hợi, Đoài, Đinh chính vận thuộc Kim... Sau Đông chí lại trùng biến"
        if (hanhSon === 'Kim' && laSauDongChi) {
            canIdx = (canIdx + 1) % 10;
            daTrungBien = true;
        }

        const chiMo = HANH_RA_MO[hanhSon];
        const stemTy = (2 * (canIdx % 5)) % 10;
        const canMo = CAN[(stemTy + CHI.indexOf(chiMo)) % 10];
        const na = napAm(canMo + ' ' + chiMo);
        const hanhKy = HANH_BI_KHAC_BOI[na.hanh];

        return {
            son: s,
            hanhSon: hanhSon,
            chiMo: chiMo,
            canChi: na.canChi,
            napAm: na.ten,
            hanh: na.hanh,
            hanhKy: hanhKy,
            daTrungBien: daTrungBien,
            canDungTinh: CAN[canIdx]
        };
    }

    function quanHe(hanhMo, hanhX, laTruNien) {
        const m = CONFIG.mucTheoQuanHe;
        if (hanhX === hanhMo)       return { quanHe:'Đồng hành mộ long',        muc: m.dongHanh };
        if (SINH[hanhX] === hanhMo) return { quanHe:'Sinh mộ long (Tiếp khí)',  muc: m.sinhMoLong };
        if (KHAC[hanhMo] === hanhX) {
            return {
                quanHe: laTruNien ? 'Mộ vận khắc Thái tuế (Đặc biệt cát)' : 'Bị mộ long khắc',
                muc: laTruNien ? m.biMoLongKhacNien : m.biMoLongKhac
            };
        }
        if (SINH[hanhMo] === hanhX) return { quanHe:'Mộ long sinh ra (Tiết khí)', muc: m.moLongSinh };
        return                             { quanHe:'Khắc mộ long (Phạm kỵ)',  muc: m.khacMoLong };
    }

    function danhGiaTru(tenTru, canChiText, mo) {
        const na = napAm(canChiText);
        if (!na) return { tru: tenTru, canChi: canChiText || '?', loi: true, muc: null };
        const q = quanHe(mo.hanh, na.hanh, tenTru === 'Niên');
        return {
            tru: tenTru, canChi: na.canChi, napAm: na.ten, hanh: na.hanh,
            quanHe: q.quanHe, muc: q.muc, nhanMuc: NHAN_MUC[q.muc]
        };
    }

    // ---------- ĐÁNH GIÁ MỘT THỜI ĐIỂM (cần calendar-core.js) ----------
    function danhGiaThoiDiem(son, y, m, d, chi) {
        if (typeof NL_getDayContext !== 'function')
            return { loi: 'Chưa load calendar-core.js (thiếu NL_getDayContext).' };
        const s = chuanHoaSon(son);
        if (!s) return { loi: 'Sơn không hợp lệ: ' + son };
        const ctx = NL_getDayContext(y, m, d, chi);
        if (!ctx.tietKhi) return { loi: 'Ngoài phạm vi dữ liệu Tiết Khí (2023–2046).' };
        if (!ctx.socVong || !ctx.gio || !ctx.gio.canChi) return { loi: 'Không đọc được can chi ngày/giờ.' };

        const canNam = ctx.tietKhi.canChiNam.split(' ')[0];
        const laSauDongChi = kiemTraSauDongChiTruocLapXuan(y, m, d, ctx);
        const mo = moLong(s, canNam, laSauDongChi);

        const nien  = danhGiaTru('Niên',  ctx.tietKhi.canChiNam,   mo);
        const thang = danhGiaTru('Tháng', ctx.tietKhi.canChiThang, mo);
        const ngay  = danhGiaTru('Ngày',  ctx.socVong.canChiNgay,  mo);
        const gio   = danhGiaTru('Giờ',   ctx.gio.canChi,          mo);
        if ([nien, thang, ngay, gio].some(t => t.loi)) return { loi: 'Lỗi tra nạp âm.' };

        const loai = CONFIG.xepLoai(nien.muc, [thang.muc, ngay.muc, gio.muc]);
        return {
            son: s, hanhSon: mo.hanhSon, moLong: mo,
            nien: nien, thang: thang, ngay: ngay, gio: gio,
            loai: loai, nhanLoai: NHAN_LOAI[loai],
            ngayDuong: { y: y, m: m, d: d }, chiGio: chi
        };
    }

    // ---------- QUÉT KHOẢNG NGÀY ----------
    function quetKhoang(son, tu, den, opts) {
        opts = opts || {};
        const dsChi = opts.chiGio || CHI;
        const lay = opts.chiLay || ['DAI_CAT', 'CAT'];
        const out = [];
        const cur = new Date(tu.y, tu.m - 1, tu.d);
        const end = new Date(den.y, den.m - 1, den.d);
        for (; cur <= end; cur.setDate(cur.getDate() + 1)) {
            const y = cur.getFullYear(), m = cur.getMonth() + 1, d = cur.getDate();
            for (const c of dsChi) {
                const r = danhGiaThoiDiem(son, y, m, d, c);
                if (r.loi) { if (out.length === 0 && !opts.boQuaLoi) return { loi: r.loi }; continue; }
                if (lay.indexOf(r.loai) !== -1) out.push(r);
            }
        }
        return out;
    }

    // =========================================================
    //  GIAO DIỆN TỰ ĐỘNG (Nút nổi tím + Bổ túc thông tin Mộ vận)
    // =========================================================
    const MAU = { DAI_CAT:'#15803d', CAT:'#65a30d', TRUNG_SACH:'#b45309', HA_SACH:'#b91c1c' };

    function htmlKetQua(ds) {
        if (!ds.length) return '<p style="color:#b91c1c">Không có ngày giờ nào đạt mức đã chọn trong khoảng này.</p>';
        const pad = n => String(n).padStart(2, '0');
        const nhom = {};
        ds.forEach(r => { const k = r.ngayDuong.y + '-' + r.ngayDuong.m + '-' + r.ngayDuong.d; (nhom[k] = nhom[k] || []).push(r); });
        let html = '', dem = 0;
        for (const k in nhom) {
            if (++dem > 120) { html += '<p>… còn nữa, hãy thu hẹp khoảng ngày.</p>'; break; }
            const a = nhom[k], f = a[0], dd = f.ngayDuong;
            const noteTrungBien = f.moLong.daTrungBien ? ' <span style="color:#7c3aed;font-weight:700">[Sau Đông Chí: Kim sơn trùng biến sang Can ' + f.moLong.canDungTinh + ']</span>' : '';
            html += '<div class="tc-day"><div class="tc-dayh"><b>' + pad(dd.d) + '/' + pad(dd.m) + '/' + dd.y + '</b>'
                 + ' · Ngày ' + f.ngay.canChi + ' · Tháng ' + f.thang.canChi + ' · Năm ' + f.nien.canChi
                 + '<br><small>Sơn ' + f.son + ' (Chính vận: ' + f.hanhSon + ') · <b>Biến vận (Mộ khố): ' + f.moLong.canChi + ' – ' + f.moLong.napAm + ' (' + f.moLong.hanh + ' vận)</b>' + noteTrungBien
                 + '<br>⚠️ <b>Kỵ dùng Năm/Tháng/Ngày/Giờ hành: ' + f.moLong.hanhKy + '</b> · Niên: ' + f.nien.napAm + ' → <b>' + f.nien.quanHe + '</b></small></div>';
            a.forEach(r => {
                html += '<div class="tc-row"><span style="color:' + (MAU[r.loai] || '#444') + ';font-weight:700">' + r.nhanLoai + '</span> · Giờ ' + r.chiGio
                     + ' (' + r.gio.canChi + ' – ' + r.gio.napAm + ')'
                     + '<br><small>Tháng: ' + r.thang.napAm + ' → ' + r.thang.quanHe + ' · Ngày: ' + r.ngay.napAm + ' → ' + r.ngay.quanHe
                     + ' · Giờ: ' + r.gio.quanHe + '</small></div>';
            });
            html += '</div>';
        }
        return html;
    }

    function dungGiaoDien() {
        if (typeof document === 'undefined' || document.getElementById('tcBtn')) return;
        const css = document.createElement('style');
        css.textContent =
            '#tcBtn{position:fixed;right:14px;bottom:14px;z-index:99998;background:#7c3aed;color:#fff;border:0;border-radius:24px;padding:12px 18px;font-size:15px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer}' +
            '#tcOv{display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);align-items:center;justify-content:center}' +
            '#tcOv.on{display:flex}' +
            '#tcBox{background:#fff;color:#222;width:min(680px,94vw);max-height:90vh;overflow:auto;border-radius:12px;padding:16px;font-family:system-ui,sans-serif;font-size:14px}' +
            '#tcBox h3{margin:0 0 4px}#tcBox label{display:block;margin:8px 0 2px;font-weight:600}' +
            '#tcBox select,#tcBox input{width:100%;padding:8px;box-sizing:border-box;font-size:14px}' +
            '.tc-2{display:flex;gap:8px}.tc-2>div{flex:1}' +
            '.tc-note{background:#fef3c7;border-left:3px solid #d97706;padding:8px 10px;margin:8px 0;font-size:12.5px;color:#78350f;border-radius:4px}' +
            '#tcGo{margin-top:12px;width:100%;background:#7c3aed;color:#fff;border:0;border-radius:8px;padding:11px;font-size:15px;font-weight:700;cursor:pointer}' +
            '#tcX{float:right;border:0;background:none;font-size:22px;cursor:pointer}' +
            '.tc-day{border:1px solid #ddd;border-radius:8px;margin-top:10px;overflow:hidden}' +
            '.tc-dayh{background:#f3e8ff;padding:8px}.tc-row{padding:6px 8px;border-top:1px solid #eee}';
        document.head.appendChild(css);

        const sons = ['Tý','Quý','Sửu','Cấn','Dần','Giáp','Mão','Ất','Thìn','Tốn','Tỵ','Bính','Ngọ','Đinh','Mùi','Khôn','Thân','Canh','Dậu','Tân','Tuất','Càn','Hợi','Nhâm'];
        const alias = { 'Tý':'Khảm', 'Ngọ':'Ly', 'Mão':'Chấn', 'Dậu':'Đoài' };
        const optSon = sons.map(s => '<option value="' + s + '">' + s + (alias[s] ? ' (' + alias[s] + ')' : '') + ' – Chính vận: ' + SON_HANH[s] + '</option>').join('');
        const iso = dt => dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
        const hn = new Date(), sau = new Date(hn.getTime() + 30 * 86400000);

        const ov = document.createElement('div');
        ov.id = 'tcOv';
        ov.innerHTML =
            '<div id="tcBox"><button id="tcX">×</button><h3>🏠 Trạch Cát – Mộ Long Biến Vận (v3)</h3>' +
            '<div class="tc-note"><b>Phạm vi vận dụng (Hiệp Kỷ):</b> Chỉ dùng khi <b>đào đất thật sự</b> hoặc sửa chữa phần ngầm có long mạch (không long mạch thì lấy Tọa làm Long). Sửa chữa nhỏ phần nổi không cần xét Mộ Long. Đại sự cần chuyên gia thẩm định.</div>' +
            '<label>Sơn tọa / Long mạch</label><select id="tcSon">' + optSon + '</select>' +
            '<div class="tc-2"><div><label>Từ ngày</label><input type="date" id="tcTu" value="' + iso(hn) + '"></div>' +
            '<div><label>Đến ngày (tối đa 92 ngày)</label><input type="date" id="tcDen" value="' + iso(sau) + '"></div></div>' +
            '<label>Mức hiển thị</label><select id="tcMuc"><option value="1">Đại cát + Cát</option><option value="2">Thêm Trung sách (niên tiểu hung)</option><option value="3">Thêm cả Hạ sách (niên đại hung)</option></select>' +
            '<button id="tcGo">Tìm ngày giờ tốt</button><div id="tcOut" style="margin-top:10px"></div></div>';
        document.body.appendChild(ov);

        const btn = document.createElement('button');
        btn.id = 'tcBtn'; btn.textContent = '🏠 Trạch Cát';
        document.body.appendChild(btn);

        const toast = document.createElement('div');
        toast.textContent = '✅ Trạch Cát v3 (Hiệp Kỷ) đã nạp';
        toast.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:99999;background:#15803d;color:#fff;padding:8px 14px;border-radius:8px;font:14px system-ui,sans-serif';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);

        btn.onclick = () => ov.classList.add('on');
        document.getElementById('tcX').onclick = () => ov.classList.remove('on');
        ov.onclick = e => { if (e.target === ov) ov.classList.remove('on'); };

        document.getElementById('tcGo').onclick = () => {
            const out = document.getElementById('tcOut');
            const son = document.getElementById('tcSon').value;
            const tu = document.getElementById('tcTu').value.split('-').map(Number);
            const den = document.getElementById('tcDen').value.split('-').map(Number);
            if (tu.length < 3 || den.length < 3 || tu.some(isNaN) || den.some(isNaN)) { out.innerHTML = '<p style="color:#b91c1c">Hãy chọn đủ ngày.</p>'; return; }
            const soNgay = (new Date(den[0], den[1] - 1, den[2]) - new Date(tu[0], tu[1] - 1, tu[2])) / 86400000;
            if (soNgay < 0) { out.innerHTML = '<p style="color:#b91c1c">Ngày kết thúc phải sau ngày bắt đầu.</p>'; return; }
            if (soNgay > 92) { out.innerHTML = '<p style="color:#b91c1c">Khoảng quá dài, chọn tối đa 92 ngày.</p>'; return; }
            const m = document.getElementById('tcMuc').value;
            const lay = ['DAI_CAT', 'CAT'].concat(m >= 2 ? ['TRUNG_SACH'] : [], m >= 3 ? ['HA_SACH'] : []);
            out.innerHTML = 'Đang tính…';
            setTimeout(() => {
                const kq = quetKhoang(son, { y: tu[0], m: tu[1], d: tu[2] }, { y: den[0], m: den[1], d: den[2] }, { chiLay: lay });
                out.innerHTML = kq.loi ? '<p style="color:#b91c1c">' + kq.loi + '</p>' : htmlKetQua(kq);
            }, 30);
        };
    }
    if (typeof document !== 'undefined') {
        const chay = () => { try { dungGiaoDien(); } catch (e) { alert('Trạch Cát lỗi: ' + e.message); } };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
        else chay();
    }

    const API = {
        moLong: moLong, napAm: napAm, quanHe: quanHe, chuanHoaSon: chuanHoaSon,
        danhGiaThoiDiem: danhGiaThoiDiem, quetKhoang: quetKhoang, htmlKetQua: htmlKetQua,
        CONFIG: CONFIG, NHAN_LOAI: NHAN_LOAI, NHAN_MUC: NHAN_MUC,
        _data: { SON_HANH: SON_HANH, HANH_RA_MO: HANH_RA_MO, HANH_BI_KHAC_BOI: HANH_BI_KHAC_BOI, NAP_AM: NAP_AM }
    };
    root.TrachCat = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
