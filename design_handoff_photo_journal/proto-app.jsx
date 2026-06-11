// proto-app.jsx — runnable flow controller: nav stack, capture→AI→save, sync.

function ProtoApp() {
  const [dark, setDark] = useS(false);
  const [tab, setTab] = useS('timeline');
  const [overlay, setOverlay] = useS(null); // {type:'camera'|'review'|'detail', kind?, entry?}
  const [entries, setEntries] = useS(SEED_ENTRIES);
  const [flash, setFlash] = useS(false);
  const [scale, setScale] = useS(1);

  const t = theme(dark, 'forest', 'sage');
  const deviceDark = dark || !!overlay;

  useE(() => {
    const calc = () => setScale(Math.min((window.innerHeight - 70 - 28) / 874, (window.innerWidth - 28) / 402, 1));
    calc(); window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const goTab = (id) => { setOverlay(null); setTab(id); };
  const openEntry = (e) => setOverlay({ type: 'detail', entry: e });
  const capture = (kind) => {
    setFlash(true);
    setTimeout(() => setFlash(false), 320);
    setTimeout(() => setOverlay({ type: 'review', kind }), 180);
  };
  const saveEntry = ({ cap, cat, kind }) => {
    const now = new Date();
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const id = 'n' + Date.now();
    const entry = { id, day: 'Hôm nay', date: TODAY.date, time, cap: cap || 'Khoảnh khắc mới', cat, kind, ph: kind === 'video' ? 'video mới' : 'ảnh mới', dur: kind === 'video' ? '0:12' : undefined, sync: 'uploading', loc: 'Vị trí hiện tại' };
    setEntries(es => [entry, ...es]);
    setOverlay(null); setTab('timeline');
    setTimeout(() => setEntries(es => es.map(x => x.id === id ? { ...x, sync: 'done' } : x)), 1800);
  };

  const tabScreen = () => {
    if (tab === 'album') return <ProtoAlbum t={t} />;
    if (tab === 'search') return <ProtoSearch t={t} entries={entries} onOpen={openEntry} />;
    if (tab === 'settings') return <ProtoSettings t={t} />;
    return <ProtoTimeline t={t} entries={entries} onNew={() => setOverlay({ type: 'camera' })} onOpen={openEntry} />;
  };

  const backdrop = dark ? '#0b0e0f' : '#a9bba2';
  const ctrlInk = dark ? 'rgba(255,255,255,0.85)' : 'rgba(20,35,25,0.82)';
  const ctrlBg = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)';

  return (
    <div style={{ minHeight: '100vh', background: backdrop, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      {/* top controls */}
      <div style={{ height: 70, width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: ctrlInk }}>
          <Icon name="sparkle" size={16} color={t.accent} stroke={1.7} />
          <span style={{ fontSize: 13.5, fontWeight: 560 }}>Prototype — chạm để dùng thử</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setEntries(SEED_ENTRIES); setOverlay(null); setTab('timeline'); }} style={{ ...ctrlBtn, background: ctrlBg, color: ctrlInk }}>↺ Đặt lại</button>
          <button onClick={() => setDark(d => !d)} style={{ ...ctrlBtn, background: ctrlBg, color: ctrlInk }}>{dark ? '☀︎ Sáng' : '☾ Tối'}</button>
        </div>
      </div>

      {/* scaled device */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
          <IOSDevice dark={deviceDark}>
            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
              {tabScreen()}
              <ProtoTabBar t={t} active={tab} onTab={goTab} onNew={() => setOverlay({ type: 'camera' })} />
              {overlay && overlay.type === 'detail' && <ProtoDetail t={t} e={overlay.entry} onBack={() => setOverlay(null)} />}
              {overlay && overlay.type === 'camera' && <ProtoCamera t={t} onClose={() => setOverlay(null)} onCapture={capture} />}
              {overlay && overlay.type === 'review' && <ProtoReview t={t} kind={overlay.kind} onBack={() => setOverlay({ type: 'camera' })} onSave={saveEntry} />}
              {flash && <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: '#fff', animation: 'protoFlash .32s ease-out both', pointerEvents: 'none' }} />}
            </div>
          </IOSDevice>
        </div>
      </div>
    </div>
  );
}

const ctrlBtn = { border: 'none', cursor: 'pointer', borderRadius: 999, padding: '8px 14px', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', backdropFilter: 'blur(10px)' };

ReactDOM.createRoot(document.getElementById('root')).render(<ProtoApp />);
