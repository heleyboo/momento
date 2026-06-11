// proto-screens.jsx — interactive screens for the runnable flow.
// Reuses atoms from shared.jsx (Icon, Placeholder, Chip, VideoBadge, CATEGORIES, hexToRgba).

const { useState: useS, useEffect: useE, useRef: useR } = React;

const TODAY = { day: 'Hôm nay', date: 'Thứ Tư, 10 Tháng 6' };

const SEED_ENTRIES = [
  { id: 'e1', day: 'Hôm nay', date: 'Thứ Tư, 10 Tháng 6', time: '08:15', cap: 'Ly cà phê đầu ngày bên ô cửa sổ', cat: 'Đời thường', kind: 'photo', ph: 'cà phê sáng', sync: 'done', loc: 'Nhà' },
  { id: 'e2', day: 'Hôm nay', date: 'Thứ Tư, 10 Tháng 6', time: '12:40', cap: 'Bữa trưa cùng cả team ở quán quen', cat: 'Công việc', kind: 'photo', ph: 'bữa trưa', sync: 'done', loc: 'Quán Cơm Phố' },
  { id: 'e3', day: 'Hôm qua', date: 'Thứ Ba, 9 Tháng 6', time: '18:20', cap: 'Hoàng hôn buông trên cầu Long Biên, bầu trời nhuộm cam', cat: 'Du lịch', kind: 'video', dur: '0:18', ph: 'hoàng hôn', sync: 'done', loc: 'Cầu Long Biên, Hà Nội' },
  { id: 'e4', day: 'Hôm qua', date: 'Thứ Ba, 9 Tháng 6', time: '20:05', cap: 'Mẹ nấu canh chua, cả nhà quây quần bên mâm cơm', cat: 'Gia đình', kind: 'photo', ph: 'bữa tối', sync: 'done', loc: 'Nhà' },
];

function groupByDay(entries) {
  const out = [];
  for (const e of entries) {
    let g = out.find(x => x.day === e.day);
    if (!g) { g = { day: e.day, date: e.date, items: [] }; out.push(g); }
    g.items.push(e);
  }
  return out;
}

// ── Interactive tab bar (centered green "+" FAB) ──────────────
function ProtoTabBar({ t, active, onTab, onNew }) {
  const left = [{ id: 'timeline', icon: 'timeline', label: 'Nhật ký' }, { id: 'album', icon: 'grid', label: 'Album' }];
  const right = [{ id: 'search', icon: 'search', label: 'Tìm kiếm' }, { id: 'settings', icon: 'gear', label: 'Cài đặt' }];
  const Item = ({ tab }) => {
    const on = tab.id === active;
    const col = on ? t.accent : t.ter;
    return (
      <button onClick={() => onTab(tab.id)} style={{
        border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 62,
      }}>
        <Icon name={tab.icon} size={24} color={col} stroke={on ? 2.1 : 1.9} />
        <span style={{ fontSize: 10.5, fontWeight: on ? 660 : 520, color: col, letterSpacing: -0.1 }}>{tab.label}</span>
      </button>
    );
  };
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      paddingBottom: 26, paddingTop: 10, background: t.barBg,
      backdropFilter: 'blur(22px) saturate(180%)', WebkitBackdropFilter: 'blur(22px) saturate(180%)',
      borderTop: `0.5px solid ${t.barBorder}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 6,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>{left.map(tab => <Item key={tab.id} tab={tab} />)}</div>
      <div style={{ width: 70, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onNew} style={{
          cursor: 'pointer', marginTop: -30, width: 56, height: 56, borderRadius: 999,
          background: t.accent, border: `3px solid ${t.bg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 18px ${hexToRgba(t.accent, 0.45)}`,
        }}>
          <Icon name="plus" size={26} color={t.accentText} stroke={2.4} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>{right.map(tab => <Item key={tab.id} tab={tab} />)}</div>
    </div>
  );
}

// ── Timeline (interactive) ───────────────────────────────────
function ProtoTimeline({ t, entries, onNew, onOpen }) {
  const groups = groupByDay(entries);
  return (
    <div style={{ height: '100%', position: 'relative', background: t.bg }}>
      <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 150 }}>
        <div style={{ padding: '8px 20px 10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 760, letterSpacing: 0.3, color: t.text }}>Nhật ký</h1>
          <Icon name="calendar" size={22} color={t.sub} stroke={1.9} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px 4px', color: t.sub, fontSize: 14.5 }}>
          <Icon name="sparkle" size={15} color={t.accent} stroke={1.7} />
          <span>{entries.length} khoảnh khắc đã lưu</span>
        </div>
        {groups.map((g, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '14px 20px 8px' }}>
              <span style={{ fontSize: 19, fontWeight: 700, color: t.text }}>{g.day}</span>
              <span style={{ fontSize: 13.5, color: t.ter, fontWeight: 500 }}>{g.date}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
              {g.items.map(e => <TLCard key={e.id} t={t} e={e} onOpen={onOpen} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TLCard({ t, e, onOpen }) {
  const [press, setPress] = useS(false);
  const isNew = e.sync === 'uploading';
  return (
    <button
      onClick={() => onOpen(e)}
      onPointerDown={() => setPress(true)} onPointerUp={() => setPress(false)} onPointerLeave={() => setPress(false)}
      style={{
        textAlign: 'left', border: t.dark ? `0.5px solid ${t.sep}` : 'none', cursor: 'pointer', width: '100%',
        display: 'flex', gap: 13, alignItems: 'center', background: t.card, borderRadius: 20, padding: 10,
        boxShadow: t.dark ? 'none' : '0 1px 2px rgba(44,40,34,0.05)',
        transform: press ? 'scale(0.985)' : 'none', transition: 'transform .12s',
      }}>
      <Placeholder label={e.ph} t={t} radius={14} style={{ width: 72, height: 72, flexShrink: 0 }}>
        {e.kind === 'video' && <VideoBadge dur={e.dur} />}
      </Placeholder>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 12.5, fontWeight: 640, color: t.ter, fontVariantNumeric: 'tabular-nums' }}>{e.time}</span>
          <span style={{ width: 3, height: 3, borderRadius: 9, background: t.ter }} />
          <Chip name={e.cat} t={t} />
        </div>
        <div style={{ fontSize: 15.5, lineHeight: 1.32, color: t.text, fontWeight: 480, textWrap: 'pretty' }}>{e.cap}</div>
        {isNew && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, color: t.accent, fontSize: 12.5, fontWeight: 560 }}>
            <Spinner color={t.accent} size={13} />Đang tải lên Google Drive…
          </div>
        )}
      </div>
    </button>
  );
}

function Spinner({ color = '#888', size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'protoSpin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Camera ───────────────────────────────────────────────────
function ProtoCamera({ t, onClose, onCapture }) {
  const [mode, setMode] = useS('photo');
  const video = mode === 'video';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: '#000', overflow: 'hidden' }}>
      <Placeholder label="khung ngắm camera" t={{ stripeA: '#1c1c1c', stripeB: '#262626', stripeLabel: 'rgba(255,255,255,0.35)' }} radius={0} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', top: 60, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
        <button onClick={onClose} style={camGlass}><Icon name="close" size={22} color="#fff" stroke={2.2} /></button>
        <button style={camGlass}><Icon name="flash" size={22} color="#fff" stroke={2} /></button>
      </div>
      <div style={{ position: 'absolute', top: 118, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', padding: '7px 14px', borderRadius: 999 }}>
          <Icon name="sparkle" size={15} color={t.accent} stroke={1.7} />
          <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: 520 }}>AI sẽ tự viết caption sau khi chụp</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2, paddingBottom: 30, background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 26, marginBottom: 22 }}>
          {[['photo', 'ẢNH'], ['video', 'VIDEO']].map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 720, letterSpacing: 1.2, color: id === mode ? t.accent : 'rgba(255,255,255,0.62)' }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px' }}>
          <Placeholder label="thư viện" t={{ stripeA: '#333', stripeB: '#3d3d3d', stripeLabel: 'rgba(255,255,255,0.5)' }} radius={11} style={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.85)' }} />
          <button onClick={() => onCapture(mode)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, width: 78, height: 78, borderRadius: 999, boxShadow: '0 0 0 4px #fff inset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ borderRadius: video ? 9 : 999, width: video ? 32 : 64, height: video ? 32 : 64, background: video ? '#ff4b3e' : '#fff', transition: 'all .2s' }} />
          </button>
          <button style={{ ...camGlass, background: 'rgba(255,255,255,0.18)' }}><Icon name="flip" size={24} color="#fff" stroke={1.9} /></button>
        </div>
      </div>
    </div>
  );
}
const camGlass = { width: 44, height: 44, borderRadius: 999, border: 'none', background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

Object.assign(window, { SEED_ENTRIES, TODAY, groupByDay, ProtoTabBar, ProtoTimeline, ProtoCamera, Spinner });
