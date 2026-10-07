// Xuất file Excel thật (.xlsx) ngay trên trình duyệt, không cần thư viện ngoài, không cần mạng.
// Có chia cột, dòng tiêu đề in đậm nền xanh, kẻ khung, lọc dữ liệu, cố định dòng tiêu đề khi cuộn.
// Dùng: window.xuatExcel({ tenFile, tenTrang, tieuDe, phuDe, cot: [{ ten, rong }], dong: [[...], ...] })
(function () {
  // ---------------- Nén ZIP kiểu "store" (không nén), đủ cho định dạng .xlsx ----------------
  const BANG_CRC = (() => {
    const b = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; b[n] = c >>> 0; }
    return b;
  })();
  const crc32 = du => { let c = 0xFFFFFFFF; for (let i = 0; i < du.length; i++) c = BANG_CRC[(c ^ du[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  function taoZip(tep) {  // tep: [{ ten, noiDung (chuỗi) }]
    const ma = new TextEncoder(), phan = [], muc = [];
    let viTri = 0;
    const d = new Date(), gio = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const ngay = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const t of tep) {
      const ten = ma.encode(t.ten), du = ma.encode(t.noiDung), crc = crc32(du);
      const dau = new DataView(new ArrayBuffer(30));
      dau.setUint32(0, 0x04034b50, true); dau.setUint16(4, 20, true); dau.setUint16(6, 0x0800, true); dau.setUint16(8, 0, true);
      dau.setUint16(10, gio, true); dau.setUint16(12, ngay, true); dau.setUint32(14, crc, true);
      dau.setUint32(18, du.length, true); dau.setUint32(22, du.length, true); dau.setUint16(26, ten.length, true); dau.setUint16(28, 0, true);
      phan.push(new Uint8Array(dau.buffer), ten, du);
      muc.push({ ten, crc, co: du.length, viTri });
      viTri += 30 + ten.length + du.length;
    }
    const batDauMucLuc = viTri;
    for (const m of muc) {
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, gio, true); c.setUint16(14, ngay, true); c.setUint32(16, m.crc, true); c.setUint32(20, m.co, true); c.setUint32(24, m.co, true);
      c.setUint16(28, m.ten.length, true); c.setUint32(42, m.viTri, true);
      phan.push(new Uint8Array(c.buffer), m.ten);
      viTri += 46 + m.ten.length;
    }
    const cuoi = new DataView(new ArrayBuffer(22));
    cuoi.setUint32(0, 0x06054b50, true); cuoi.setUint16(8, muc.length, true); cuoi.setUint16(10, muc.length, true);
    cuoi.setUint32(12, viTri - batDauMucLuc, true); cuoi.setUint32(16, batDauMucLuc, true);
    phan.push(new Uint8Array(cuoi.buffer));
    return new Blob(phan, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ---------------- Nội dung bảng tính ----------------
  const xml = v => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tenCot = i => { let s = ''; i++; while (i) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
  // Kiểu ô (styles.xml): 1 tiêu đề lớn, 2 phụ đề, 3 đầu cột, 4 chữ, 5 số
  const o = (r, c, v, kieu) => {
    const ref = tenCot(c) + r;
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}" s="${kieu === 4 ? 5 : kieu}"><v>${v}</v></c>`;
    return `<c r="${ref}" s="${kieu}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  };

  window.xuatExcel = function ({ tenFile, tenTrang = 'Trang 1', tieuDe = '', phuDe = '', cot, dong }) {
    const soCot = cot.length, cotCuoi = tenCot(soCot - 1), hangDau = 3, hangCuoi = hangDau + Math.max(dong.length, 1);
    const trang = String(tenTrang).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
    let hang = `<row r="1" ht="24" customHeight="1">${o(1, 0, tieuDe, 1)}</row><row r="2">${o(2, 0, phuDe, 2)}</row>`;
    hang += `<row r="3" ht="32" customHeight="1">${cot.map((c, i) => o(3, i, c.ten, 3)).join('')}</row>`;
    dong.forEach((d, j) => { hang += `<row r="${4 + j}">${d.map((v, i) => o(4 + j, i, v, 4)).join('')}</row>`; });
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${cot.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.rong || 14}" customWidth="1"/>`).join('')}</cols>
<sheetData>${hang}</sheetData>
<autoFilter ref="A${hangDau}:${cotCuoi}${hangCuoi}"/>
<mergeCells count="2"><mergeCell ref="A1:${cotCuoi}1"/><mergeCell ref="A2:${cotCuoi}2"/></mergeCells>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="15"/><color rgb="FF0B5CD5"/><name val="Calibri"/></font>
<font><i/><sz val="10"/><color rgb="FF5B6475"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0B5CD5"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFC9D1DC"/></left><right style="thin"><color rgb="FFC9D1DC"/></right><top style="thin"><color rgb="FFC9D1DC"/></top><bottom style="thin"><color rgb="FFC9D1DC"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
    const tep = [
      { ten: '[Content_Types].xml', noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
      { ten: '_rels/.rels', noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { ten: 'xl/workbook.xml', noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${xml(trang)}" sheetId="1" r:id="rId1"/></sheets>
<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${xml(trang.replace(/'/g, "''"))}'!$A$${hangDau}:$${cotCuoi}$${hangCuoi}</definedName></definedNames></workbook>` },
      { ten: 'xl/_rels/workbook.xml.rels', noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { ten: 'xl/styles.xml', noiDung: styles },
      { ten: 'xl/worksheets/sheet1.xml', noiDung: sheet },
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(taoZip(tep));
    a.download = tenFile.endsWith('.xlsx') ? tenFile : tenFile + '.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
})();
