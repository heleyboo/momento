// proto-screens3.jsx — Album, Search, Settings (tab content; tab bar is rendered by controller).

// Local iOS switch (the prototype HTML doesn't load detail-album.jsx)
function PSwitch({ on, t }) {
  return (
    <div style={{ width: 51, height: 31, borderRadius: 99, flexShrink: 0, position: 'relative', transition: 'background .2s', background: on ? t.accent : hexToRgba(t.text, 0.16) }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 27, height: 27, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.28)', transition: 'left .2s' }} />
    </div>
  );
}

// ── Album ────────────────────────────────────────────────────
const PROTO_ALBUMS = [
  { name: 'Đời thường', count: 24, cat: 'Đời thường', ph: 'đời thường' },
  { name: 'Du lịch', count: 18, cat: 'Du lịch', ph: 'du lịch' },
  { name: 'Gia đình', count: 12, cat: 'Gia đình', ph: 'gia đình' },
  { name: 'Công việc', count: 9, cat: 'Công việc', ph: 'công việc' },
  { name: 'Sức khỏe', count: 7, cat: 'Sức khỏe', ph: 'sức khỏe' },
  { name: 'Ẩm thực', count: 15, cat: 'Đời thường', ph: 'ẩm thực' },
];

function ProtoAlbum({ t }) {
  const [hint, setHint] = useS(true);
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 110, background: t.bg }}>
      <div style={{ padding: '8px 20px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 760, letterSpacing: 0.3, color: t.text }}>Album</h1>
        <Icon name="plus" size={24} color={t.accent} stroke={2.2} />
      </div>
      <div style={{ padding: '0 20px 4px', fontSize: 14.5, color: t.sub }}>6 chủ đề · 85 khoảnh khắc</div>
      {hint && (
        <div style={{ margin: '14px 16px 18px', borderRadius: 18, padding: '14px 15px', background: hexToRgba(t.accent, t.dark ? 0.16 : 0.11), display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: t.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="sparkle" size={22} color={t.accent} stroke={1.7} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: t.text, marginBottom: 1 }}>AI gợi ý album mới</div>
            <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.35 }}>Gom 9 ảnh gần đây thành “Đà Lạt 2026”?</div>
          </div>
          <button onClick={() => setHint(false)} style={{ border: 'none', cursor: 'pointer', background: t.accent, color: t.accentText, fontWeight: 620, fontSize: 13.5, borderRadius: 999, padding: '8px 15px' }}>Tạo</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: hint ? '0 16px' : '14px 16px 0' }}>
        {PROTO_ALBUMS.map((a, i) => (
          <button key={i} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Placeholder label={a.ph} t={t} radius={18} style={{ width: '100%', aspectRatio: '1 / 1' }}>
              <div style={{ position: 'absolute', top: 9, left: 9, width: 10, height: 10, borderRadius: 99, background: CATEGORIES[a.cat], boxShadow: '0 0 0 2px rgba(255,255,255,0.6)' }} />
            </Placeholder>
            <div style={{ paddingLeft: 2 }}>
              <div style={{ fontSize: 15.5, fontWeight: 620, color: t.text, letterSpacing: -0.2 }}>{a.name}</div>
              <div style={{ fontSize: 13, color: t.sub }}>{a.count} mục</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Search ───────────────────────────────────────────────────
function ProtoSearch({ t, entries, onOpen }) {
  const [q, setQ] = useS('hoàng hôn');
  const [kind, setKind] = useS('all');
  const ql = q.trim().toLowerCase();
  const results = entries.filter(e =>
    (ql === '' || e.cap.toLowerCase().includes(ql)) &&
    (kind === 'all' || e.kind === kind)
  );
  const chips = [{ id: 'all', label: 'Tất cả' }, { id: 'photo', label: 'Ảnh' }, { id: 'video', label: 'Video' }];
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 110, background: t.bg }}>
      <div style={{ padding: '8px 20px 12px' }}>
        <h1 style={{ margin: '0 0 14px', fontSize: 34, fontWeight: 760, letterSpacing: 0.3, color: t.text }}>Tìm kiếm</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: t.fieldBg, borderRadius: 13, padding: '11px 13px', border: `1px solid ${t.sep}` }}>
          <Icon name="search" size={20} color={t.sub} stroke={1.9} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm trong caption…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 16.5, color: t.text, fontWeight: 460 }} />
          {q && (
            <button onClick={() => setQ('')} style={{ border: 'none', cursor: 'pointer', padding: 0, width: 19, height: 19, borderRadius: 999, background: hexToRgba(t.text, 0.22), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={11} color={t.bg} stroke={2.4} />
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', flexWrap: 'wrap' }}>
        {chips.map(c => {
          const on = c.id === kind;
          return (
            <button key={c.id} onClick={() => setKind(c.id)} style={{ border: on ? 'none' : `1px solid ${t.sep}`, cursor: 'pointer', borderRadius: 999, padding: '7px 14px', fontSize: 13.5, fontWeight: 560, background: on ? t.accent : t.card, color: on ? t.accentText : t.text }}>{c.label}</button>
          );
        })}
        {['Mọi thời gian', 'Mọi nhãn'].map((l, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '7px 12px', fontSize: 13.5, fontWeight: 560, background: t.card, color: t.text, border: `1px solid ${t.sep}` }}>
            <Icon name={i === 0 ? 'calendar' : 'grid'} size={15} color={t.sub} stroke={1.9} />{l}<Icon name="chevron" size={12} color={t.ter} stroke={2.2} />
          </span>
        ))}
      </div>
      <div style={{ padding: '0 20px 8px', fontSize: 13, fontWeight: 680, color: t.sub, letterSpacing: 0.3 }}>{results.length} KẾT QUẢ</div>
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', color: t.ter, padding: '40px 20px', fontSize: 15 }}>Không tìm thấy khoảnh khắc nào.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
          {results.map(e => (
            <button key={e.id} onClick={() => onOpen(e)} style={{ border: t.dark ? `0.5px solid ${t.sep}` : 'none', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', gap: 13, alignItems: 'center', background: t.card, borderRadius: 18, padding: 10 }}>
              <Placeholder label={e.ph} t={t} radius={13} style={{ width: 64, height: 64, flexShrink: 0 }}>
                {e.kind === 'video' && <VideoBadge dur={e.dur} />}
              </Placeholder>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, lineHeight: 1.3, color: t.text, fontWeight: 500, marginBottom: 5, textWrap: 'pretty' }}>{hlText(e.cap, ql, t)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.ter }}>{e.day} · {e.time}</span>
                  <span style={{ width: 3, height: 3, borderRadius: 9, background: t.ter }} />
                  <Chip name={e.cat} t={t} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function hlText(text, q, t) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return (<>{text.slice(0, idx)}<mark style={{ background: hexToRgba(t.accent, 0.28), color: t.text, borderRadius: 4, padding: '0 2px' }}>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>);
}

// ── Settings ─────────────────────────────────────────────────
function ProtoSettings({ t }) {
  const [sync, setSync] = useS(true);
  const [wifi, setWifi] = useS(true);
  const [aiCap, setAiCap] = useS(true);
  const [geo, setGeo] = useS(false);
  const [autoCat, setAutoCat] = useS(true);
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 110, background: t.bg }}>
      <h1 style={{ margin: '0 0 16px', padding: '8px 20px 0', fontSize: 34, fontWeight: 760, letterSpacing: 0.3, color: t.text }}>Cài đặt</h1>
      <SGrp t={t}>
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
      </SGrp>
      <SGrp t={t} header="ĐỒNG BỘ GOOGLE DRIVE">
        <SR t={t} icon="cloudUp" title="Tự động đồng bộ" sub="Tải lên ngay sau khi lưu" on={sync} set={setSync} />
        <SR t={t} icon="cloud" title="Chỉ qua Wi-Fi" on={wifi} set={setWifi} />
        <div style={{ padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontSize: 15.5, color: t.text }}>Dung lượng đã dùng</span>
            <span style={{ fontSize: 14, color: t.sub }}>3,2 / 15 GB</span>
          </div>
          <div style={{ height: 7, borderRadius: 99, background: hexToRgba(t.text, 0.1), overflow: 'hidden' }}>
            <div style={{ width: '21%', height: '100%', borderRadius: 99, background: t.accent }} />
          </div>
        </div>
      </SGrp>
      <SGrp t={t} header="AI CAPTION">
        <SR t={t} icon="sparkle" title="Tự động tạo caption" sub="Gợi ý mô tả sau khi chụp" on={aiCap} set={setAiCap} />
        <SRv t={t} icon="edit" title="Ngôn ngữ caption" detail="Tiếng Việt" />
        <SRv t={t} icon="timeline" title="Độ dài mô tả" detail="Vừa" last />
      </SGrp>
      <SGrp t={t} header="KHÁC">
        <SR t={t} icon="pin" title="Gắn vị trí vào khoảnh khắc" on={geo} set={setGeo} />
        <SR t={t} icon="grid" title="Tự động phân loại bằng AI" on={autoCat} set={setAutoCat} last />
      </SGrp>
    </div>
  );
}
function SGrp({ t, header, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      {header && <div style={{ fontSize: 12.5, fontWeight: 600, color: t.sub, letterSpacing: 0.3, padding: '0 16px 8px' }}>{header}</div>}
      <div style={{ background: t.card, borderRadius: 18, margin: '0 16px', overflow: 'hidden', border: t.dark ? `0.5px solid ${t.sep}` : 'none' }}>{children}</div>
    </div>
  );
}
function SRicon({ t, icon }) {
  return <div style={{ width: 30, height: 30, borderRadius: 8, background: hexToRgba(t.accent, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={18} color={t.accent} stroke={1.9} /></div>;
}
function SR({ t, icon, title, sub, on, set, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', minHeight: 52, borderBottom: last ? 'none' : `0.5px solid ${t.sep}` }}>
      <SRicon t={t} icon={icon} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, color: t.text, fontWeight: 480 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: t.sub, marginTop: 1 }}>{sub}</div>}
      </div>
      <button onClick={() => set(v => !v)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}><PSwitch on={on} t={t} /></button>
    </div>
  );
}
function SRv({ t, icon, title, detail, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', minHeight: 52, borderBottom: last ? 'none' : `0.5px solid ${t.sep}` }}>
      <SRicon t={t} icon={icon} />
      <div style={{ flex: 1, fontSize: 15.5, color: t.text, fontWeight: 480 }}>{title}</div>
      <span style={{ fontSize: 15, color: t.sub }}>{detail}</span>
      <Icon name="chevron" size={15} color={t.ter} stroke={2.1} />
    </div>
  );
}

Object.assign(window, { ProtoAlbum, ProtoSearch, ProtoSettings });
