// search-settings.jsx — Search & Filter + Settings screens.

// ── 05 · SEARCH & FILTER ─────────────────────────────────────
const SEARCH_RESULTS = [
  { time: 'Hôm qua · 18:20', cap: 'Hoàng hôn buông trên cầu Long Biên', cat: 'Du lịch', kind: 'video', dur: '0:18', ph: 'hoàng hôn' },
  { time: '2 Th6 · 17:50', cap: 'Hoàng hôn từ ban công, trời rất trong', cat: 'Đời thường', kind: 'photo', ph: 'ban công' },
  { time: '28 Th5 · 18:40', cap: 'Ngắm hoàng hôn ở biển Mỹ Khê', cat: 'Du lịch', kind: 'photo', ph: 'biển' },
];

function SearchScreen({ t }) {
  const filters = [
    { label: 'Tất cả', on: true }, { label: 'Ảnh', on: false }, { label: 'Video', on: false },
    { label: 'Mọi thời gian', icon: 'calendar' }, { label: 'Mọi nhãn', icon: 'grid' },
  ];
  return (
    <div style={{ height: '100%', position: 'relative', background: t.bg }}>
      <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 110 }}>
        <div style={{ padding: '8px 20px 12px' }}>
          <h1 style={{ margin: '0 0 14px', fontSize: 34, fontWeight: 760, letterSpacing: 0.3, color: t.text }}>Tìm kiếm</h1>
          {/* search field */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: t.fieldBg, borderRadius: 13, padding: '11px 13px', border: `1px solid ${t.sep}` }}>
            <Icon name="search" size={20} color={t.sub} stroke={1.9} />
            <span style={{ flex: 1, fontSize: 16.5, color: t.text, fontWeight: 460 }}>hoàng hôn</span>
            <div style={{ width: 19, height: 19, borderRadius: 999, background: hexToRgba(t.text, 0.22), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={11} color={t.bg} stroke={2.4} />
            </div>
          </div>
        </div>

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', overflowX: 'auto', flexWrap: 'wrap' }}>
          {filters.map((f, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
              borderRadius: 999, padding: f.icon ? '7px 12px' : '7px 14px', fontSize: 13.5, fontWeight: 560,
              background: f.on ? t.accent : t.card, color: f.on ? t.accentText : t.text,
              border: f.on ? 'none' : `1px solid ${t.sep}`,
            }}>
              {f.icon && <Icon name={f.icon} size={15} color={f.on ? t.accentText : t.sub} stroke={1.9} />}
              {f.label}
              {f.icon && <Icon name="chevron" size={12} color={f.on ? t.accentText : t.ter} stroke={2.2} />}
            </span>
          ))}
        </div>

        {/* results */}
        <div style={{ padding: '0 20px 8px', fontSize: 13, fontWeight: 680, color: t.sub, letterSpacing: 0.3 }}>3 KẾT QUẢ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
          {SEARCH_RESULTS.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'center', background: t.card, borderRadius: 18, padding: 10, border: t.dark ? `0.5px solid ${t.sep}` : 'none' }}>
              <Placeholder label={e.ph} t={t} radius={13} style={{ width: 64, height: 64, flexShrink: 0 }}>
                {e.kind === 'video' && <VideoBadge dur={e.dur} />}
              </Placeholder>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, lineHeight: 1.3, color: t.text, fontWeight: 500, marginBottom: 5, textWrap: 'pretty' }}>
                  {hl(e.cap, 'hoàng hôn', t)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.ter }}>{e.time}</span>
                  <span style={{ width: 3, height: 3, borderRadius: 9, background: t.ter }} />
                  <Chip name={e.cat} t={t} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar t={t} active="search" />
    </div>
  );
}

// highlight matched keyword
function hl(text, q, t) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (<>
    {text.slice(0, idx)}
    <mark style={{ background: hexToRgba(t.accent, 0.28), color: t.text, borderRadius: 4, padding: '0 2px' }}>{text.slice(idx, idx + q.length)}</mark>
    {text.slice(idx + q.length)}
  </>);
}

// ── 06 · SETTINGS ────────────────────────────────────────────
function SGroup({ t, header, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      {header && <div style={{ fontSize: 12.5, fontWeight: 600, color: t.sub, letterSpacing: 0.3, padding: '0 16px 8px' }}>{header}</div>}
      <div style={{ background: t.card, borderRadius: 18, margin: '0 16px', overflow: 'hidden', border: t.dark ? `0.5px solid ${t.sep}` : 'none' }}>{children}</div>
    </div>
  );
}

function SRow({ t, icon, iconBg, title, sub, detail, control, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', minHeight: 52, borderBottom: last ? 'none' : `0.5px solid ${t.sep}` }}>
      {icon && (
        <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg || hexToRgba(t.accent, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={icon} size={18} color={iconBg ? '#fff' : t.accent} stroke={1.9} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, color: t.text, fontWeight: 480 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>{sub}</div>}
      </div>
      {detail && <span style={{ fontSize: 15, color: t.sub }}>{detail}</span>}
      {control}
      {(detail || (!control && !detail)) && <Icon name="chevron" size={15} color={t.ter} stroke={2.1} />}
    </div>
  );
}

function SettingsScreen({ t }) {
  return (
    <div style={{ height: '100%', position: 'relative', background: t.bg }}>
      <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 110 }}>
        <h1 style={{ margin: '0 0 16px', padding: '8px 20px 0', fontSize: 34, fontWeight: 760, letterSpacing: 0.3, color: t.text }}>Cài đặt</h1>

        {/* account */}
        <SGroup t={t}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px' }}>
            <Placeholder label="avatar" t={t} radius={999} style={{ width: 48, height: 48, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 600, color: t.text }}>Minh Anh</div>
              <div style={{ fontSize: 13, color: t.sub }}>minhanh@gmail.com</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: t.accent, background: hexToRgba(t.accent, 0.14), borderRadius: 999, padding: '5px 11px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 9, background: t.accent }} />Đã kết nối
            </span>
          </div>
        </SGroup>

        {/* google drive sync */}
        <SGroup t={t} header="ĐỒNG BỘ GOOGLE DRIVE">
          <SRow t={t} icon="cloudUp" title="Tự động đồng bộ" sub="Tải lên ngay sau khi lưu" control={<Switch on={true} t={t} />} />
          <SRow t={t} icon="cloud" title="Chỉ qua Wi-Fi" control={<Switch on={true} t={t} />} />
          <div style={{ padding: '13px 15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
              <span style={{ fontSize: 15.5, color: t.text }}>Dung lượng đã dùng</span>
              <span style={{ fontSize: 14, color: t.sub }}>3,2 / 15 GB</span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: hexToRgba(t.text, 0.1), overflow: 'hidden' }}>
              <div style={{ width: '21%', height: '100%', borderRadius: 99, background: t.accent }} />
            </div>
          </div>
        </SGroup>

        {/* AI caption */}
        <SGroup t={t} header="AI CAPTION">
          <SRow t={t} icon="sparkle" title="Tự động tạo caption" sub="Gợi ý mô tả sau khi chụp" control={<Switch on={true} t={t} />} />
          <SRow t={t} icon="edit" title="Ngôn ngữ caption" detail="Tiếng Việt" />
          <SRow t={t} icon="timeline" title="Độ dài mô tả" detail="Vừa" last />
        </SGroup>

        {/* other */}
        <SGroup t={t} header="KHÁC">
          <SRow t={t} icon="pin" title="Gắn vị trí vào khoảnh khắc" control={<Switch on={false} t={t} />} />
          <SRow t={t} icon="grid" title="Tự động phân loại bằng AI" control={<Switch on={true} t={t} />} last />
        </SGroup>
      </div>
      <TabBar t={t} active="settings" />
    </div>
  );
}

Object.assign(window, { SearchScreen, SettingsScreen });
