// detail-album.jsx — Entry Detail + Album/Categorisation screens.

// iOS-style switch
function Switch({ on, t }) {
  return (
    <div style={{ width: 51, height: 31, borderRadius: 99, flexShrink: 0, position: 'relative', transition: 'background .2s', background: on ? t.accent : hexToRgba(t.text, 0.16) }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 27, height: 27, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.28)', transition: 'left .2s' }} />
    </div>
  );
}

// Small glass round button (for hero overlays)
const heroBtn = {
  width: 40, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer',
  background: 'rgba(0,0,0,0.34)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

// ── 03 · ENTRY DETAIL ────────────────────────────────────────
function EntryDetail({ t }) {
  return (
    <div style={{ height: '100%', position: 'relative', background: t.bg, overflow: 'hidden' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 92 }}>
        {/* hero media */}
        <div style={{ position: 'relative' }}>
          <Placeholder label="hoàng hôn cầu Long Biên" t={t} radius={0} style={{ width: '100%', height: 392 }} />
          <div style={{ position: 'absolute', top: 60, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <button style={heroBtn}><Icon name="chevronL" size={21} color="#fff" stroke={2.2} /></button>
            <button style={heroBtn}><svg width="20" height="6" viewBox="0 0 22 6"><circle cx="3" cy="3" r="2.6" fill="#fff"/><circle cx="11" cy="3" r="2.6" fill="#fff"/><circle cx="19" cy="3" r="2.6" fill="#fff"/></svg></button>
          </div>
          {/* play (video) */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 66, height: 66, borderRadius: 999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.8)' }}>
              <Icon name="play" size={26} color="#fff" />
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 12, right: 14 }}><VideoBadge dur="0:18" /></div>
        </div>

        {/* content */}
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.sub, fontSize: 14, fontWeight: 520 }}>
              <Icon name="calendar" size={16} color={t.sub} stroke={1.9} />
              Thứ Hai, 8 Tháng 6 · 18:20
            </div>
            <Chip name="Du lịch" t={t} size="md" />
          </div>

          {/* caption */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="sparkle" size={17} color={t.accent} stroke={1.7} />
              <span style={{ fontSize: 12.5, fontWeight: 680, color: t.accent, letterSpacing: 0.2 }}>CAPTION DO AI TẠO</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.sub, fontSize: 13.5, fontWeight: 560 }}>
              <Icon name="edit" size={15} color={t.sub} stroke={1.9} />Sửa
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.45, color: t.text, fontWeight: 480, textWrap: 'pretty' }}>
            Hoàng hôn buông trên cầu Long Biên, bầu trời nhuộm cam và những chuyến tàu cuối ngày lăn bánh chậm rãi qua dòng Hồng Hà.
          </p>

          {/* meta */}
          <div style={{ marginTop: 20, background: t.card, borderRadius: 18, overflow: 'hidden', border: t.dark ? `0.5px solid ${t.sep}` : 'none' }}>
            <MetaRow t={t} icon="pin" label="Vị trí" value="Cầu Long Biên, Hà Nội" />
            <MetaRow t={t} icon="library" label="Album" value="Du lịch" />
            <MetaRow t={t} icon="video" label="Định dạng" value="Video · 0:18 · 24 MB" last />
          </div>

          {/* drive status */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, background: hexToRgba(t.accent, t.dark ? 0.14 : 0.10), borderRadius: 16, padding: '13px 15px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: t.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="cloud" size={21} color={t.accent} stroke={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Đã đồng bộ Google Drive</div>
              <div style={{ fontSize: 12.5, color: t.sub }}>Hôm nay lúc 18:21 · Nhật ký / 2026 / Tháng 6</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5" stroke={t.accentText} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* bottom action bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30, paddingBottom: 26, paddingTop: 10, background: t.barBg, backdropFilter: 'blur(22px) saturate(180%)', borderTop: `0.5px solid ${t.barBorder}`, display: 'flex', justifyContent: 'space-around' }}>
        {[['edit', 'Sửa'], ['grid', 'Đổi album'], ['cloud', 'Tải xuống'], ['close', 'Xoá']].map(([ic, lb]) => (
          <div key={lb} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Icon name={ic} size={23} color={lb === 'Xoá' ? '#e0533c' : t.text} stroke={1.9} />
            <span style={{ fontSize: 10.5, fontWeight: 540, color: lb === 'Xoá' ? '#e0533c' : t.sub }}>{lb}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaRow({ t, icon, label, value, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderBottom: last ? 'none' : `0.5px solid ${t.sep}` }}>
      <Icon name={icon} size={19} color={t.sub} stroke={1.9} />
      <span style={{ fontSize: 15, color: t.sub, flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, textAlign: 'right', fontSize: 15, color: t.text, fontWeight: 520 }}>{value}</span>
    </div>
  );
}

// ── 04 · ALBUM / CATEGORISATION ──────────────────────────────
const ALBUMS = [
  { name: 'Đời thường', count: 24, cat: 'Đời thường', ph: 'đời thường' },
  { name: 'Du lịch', count: 18, cat: 'Du lịch', ph: 'du lịch' },
  { name: 'Gia đình', count: 12, cat: 'Gia đình', ph: 'gia đình' },
  { name: 'Công việc', count: 9, cat: 'Công việc', ph: 'công việc' },
  { name: 'Sức khỏe', count: 7, cat: 'Sức khỏe', ph: 'sức khỏe' },
  { name: 'Ẩm thực', count: 15, cat: 'Đời thường', ph: 'ẩm thực' },
];

function AlbumScreen({ t }) {
  return (
    <div style={{ height: '100%', position: 'relative', background: t.bg }}>
      <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 110 }}>
        <div style={{ padding: '8px 20px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 760, letterSpacing: 0.3, color: t.text }}>Album</h1>
          <Icon name="plus" size={24} color={t.accent} stroke={2.2} />
        </div>
        <div style={{ padding: '0 20px 4px', fontSize: 14.5, color: t.sub }}>6 chủ đề · 85 khoảnh khắc</div>

        {/* AI suggestion */}
        <div style={{ margin: '14px 16px 18px', borderRadius: 18, padding: '14px 15px', background: hexToRgba(t.accent, t.dark ? 0.16 : 0.11), display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: t.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="sparkle" size={22} color={t.accent} stroke={1.7} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: t.text, marginBottom: 1 }}>AI gợi ý album mới</div>
            <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.35 }}>Gom 9 ảnh gần đây thành “Đà Lạt 2026”?</div>
          </div>
          <button style={{ border: 'none', cursor: 'pointer', background: t.accent, color: t.accentText, fontWeight: 620, fontSize: 13.5, borderRadius: 999, padding: '8px 15px' }}>Tạo</button>
        </div>

        {/* grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 16px' }}>
          {ALBUMS.map((a, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Placeholder label={a.ph} t={t} radius={18} style={{ width: '100%', aspectRatio: '1 / 1' }}>
                <div style={{ position: 'absolute', top: 9, left: 9, width: 10, height: 10, borderRadius: 99, background: CATEGORIES[a.cat], boxShadow: '0 0 0 2px rgba(255,255,255,0.6)' }} />
              </Placeholder>
              <div style={{ paddingLeft: 2 }}>
                <div style={{ fontSize: 15.5, fontWeight: 620, color: t.text, letterSpacing: -0.2 }}>{a.name}</div>
                <div style={{ fontSize: 13, color: t.sub }}>{a.count} mục</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar t={t} active="album" />
    </div>
  );
}

Object.assign(window, { Switch, EntryDetail, AlbumScreen });
