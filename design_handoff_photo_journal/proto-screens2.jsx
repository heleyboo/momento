// proto-screens2.jsx — Review (AI caption), Detail, Album, Search, Settings.

const AI_CAPTIONS = {
  photo: 'Buổi chiều dịu nắng, tách trà nóng và vài trang sách yêu thích bên hiên nhà.',
  video: 'Khoảnh khắc chuyển động của buổi chiều — gió nhẹ và ánh nắng vàng cuối ngày.',
};

// ── Review: AI caption + label + save ────────────────────────
function ProtoReview({ t, kind = 'photo', onBack, onSave }) {
  const [gen, setGen] = useS(true);
  const [cap, setCap] = useS('');
  const [cat, setCat] = useS('Đời thường');
  const cats = ['Du lịch', 'Gia đình', 'Đời thường', 'Công việc', 'Sức khỏe'];

  useE(() => {
    const id = setTimeout(() => { setCap(AI_CAPTIONS[kind]); setGen(false); }, 1400);
    return () => clearTimeout(id);
  }, [kind]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 270 }}>
        <Placeholder label={kind === 'video' ? 'video vừa quay' : 'ảnh vừa chụp'} t={{ stripeA: '#1c1c1c', stripeB: '#262626', stripeLabel: 'rgba(255,255,255,0.35)' }} radius={0} style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', top: 60, left: 20 }}>
          <button onClick={onBack} style={camGlass2}><Icon name="chevronL" size={22} color="#fff" stroke={2.2} /></button>
        </div>
        <div style={{ position: 'absolute', top: 60, right: 20 }}>
          <button onClick={onBack} style={{ ...camGlass2, width: 'auto', padding: '0 16px', color: '#fff', fontSize: 15, fontWeight: 600 }}>Chụp lại</button>
        </div>
        {kind === 'video' && <div style={{ position: 'absolute', bottom: 12, right: 14 }}><VideoBadge dur="0:12" /></div>}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 240, background: t.bg, borderRadius: '28px 28px 0 0', overflow: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 9 }}>
          <div style={{ width: 38, height: 5, borderRadius: 9, background: t.ter, opacity: 0.5 }} />
        </div>
        <div style={{ padding: '14px 20px 130px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="sparkle" size={18} color={t.accent} stroke={1.7} />
              <span style={{ fontSize: 13, fontWeight: 680, color: t.accent, letterSpacing: 0.2 }}>CAPTION DO AI GỢI Ý</span>
            </div>
            {!gen && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.sub, fontSize: 13, fontWeight: 560 }}><Icon name="edit" size={15} color={t.sub} stroke={1.9} />Sửa được</span>}
          </div>

          {gen ? (
            <div style={{ background: t.card, borderRadius: 18, padding: '17px 16px', border: t.dark ? `0.5px solid ${t.sep}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: t.sub, fontSize: 14.5, marginBottom: 13 }}>
                <Spinner color={t.accent} size={16} />AI đang viết caption…
              </div>
              {[88, 96, 62].map((w, i) => (
                <div key={i} style={{ height: 11, borderRadius: 6, width: w + '%', marginBottom: 8, background: `linear-gradient(90deg, ${hexToRgba(t.text, 0.07)}, ${hexToRgba(t.text, 0.13)}, ${hexToRgba(t.text, 0.07)})`, backgroundSize: '200% 100%', animation: 'protoShimmer 1.2s linear infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ background: t.card, borderRadius: 18, padding: '6px 14px 12px', border: t.dark ? `0.5px solid ${t.sep}` : 'none' }}>
              <textarea value={cap} onChange={e => setCap(e.target.value)} rows={3} style={{
                width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent',
                fontFamily: 'inherit', fontSize: 16.5, lineHeight: 1.42, color: t.text, fontWeight: 470, padding: '10px 2px 6px',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 9, borderTop: `0.5px solid ${t.sep}` }}>
                <Icon name="pin" size={15} color={t.ter} stroke={1.8} />
                <span style={{ fontSize: 13, color: t.sub, fontWeight: 500 }}>Thêm vị trí</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '22px 0 11px' }}>
            <span style={{ fontSize: 13, fontWeight: 680, color: t.sub, letterSpacing: 0.2 }}>NHÃN PHÂN LOẠI</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: t.accent }}><Icon name="sparkle" size={12} color={t.accent} stroke={1.7} />AI đề xuất</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cats.map(c => {
              const on = c === cat;
              return (
                <button key={c} onClick={() => setCat(c)} style={{
                  border: on ? 'none' : `1px solid ${t.sep}`, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '8px 14px', fontSize: 14, fontWeight: 560,
                  background: on ? t.accent : t.card, color: on ? t.accentText : t.text,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: 9, background: on ? t.accentText : CATEGORIES[c] }} />{c}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22, background: t.card, borderRadius: 16, padding: '13px 15px', border: t.dark ? `0.5px solid ${t.sep}` : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: hexToRgba(t.accent, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="cloudUp" size={21} color={t.accent} stroke={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 580, color: t.text }}>Tự động tải lên Google Drive</div>
              <div style={{ fontSize: 12.5, color: t.sub }}>Khi lưu, ảnh sẽ được đồng bộ</div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 620, color: t.accent }}>Bật</span>
          </div>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 20px 30px', background: t.bg, borderTop: `0.5px solid ${t.sep}` }}>
          <button disabled={gen} onClick={() => onSave({ cap, cat, kind })} style={{
            width: '100%', height: 52, borderRadius: 16, border: 'none', cursor: gen ? 'default' : 'pointer',
            background: gen ? hexToRgba(t.accent, 0.4) : t.accent, color: t.accentText, fontSize: 17, fontWeight: 640,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .2s',
          }}>
            {gen ? 'Đang chuẩn bị…' : 'Lưu khoảnh khắc'}
          </button>
        </div>
      </div>
    </div>
  );
}
const camGlass2 = { height: 40, minWidth: 40, borderRadius: 999, border: 'none', background: 'rgba(0,0,0,0.34)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

// ── Detail ───────────────────────────────────────────────────
function ProtoDetail({ t, e, onBack }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 55, background: t.bg, overflow: 'hidden' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 92 }}>
        <div style={{ position: 'relative' }}>
          <Placeholder label={e.ph} t={t} radius={0} style={{ width: '100%', height: 392 }} />
          <div style={{ position: 'absolute', top: 60, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={onBack} style={camGlass2}><Icon name="chevronL" size={21} color="#fff" stroke={2.2} /></button>
            <button style={camGlass2}><svg width="20" height="6" viewBox="0 0 22 6"><circle cx="3" cy="3" r="2.6" fill="#fff"/><circle cx="11" cy="3" r="2.6" fill="#fff"/><circle cx="19" cy="3" r="2.6" fill="#fff"/></svg></button>
          </div>
          {e.kind === 'video' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 66, height: 66, borderRadius: 999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.8)' }}>
                <Icon name="play" size={26} color="#fff" />
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.sub, fontSize: 14, fontWeight: 520 }}>
              <Icon name="calendar" size={16} color={t.sub} stroke={1.9} />{e.date} · {e.time}
            </div>
            <Chip name={e.cat} t={t} size="md" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="sparkle" size={17} color={t.accent} stroke={1.7} />
              <span style={{ fontSize: 12.5, fontWeight: 680, color: t.accent, letterSpacing: 0.2 }}>CAPTION DO AI TẠO</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.sub, fontSize: 13.5, fontWeight: 560 }}><Icon name="edit" size={15} color={t.sub} stroke={1.9} />Sửa</div>
          </div>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.45, color: t.text, fontWeight: 480, textWrap: 'pretty' }}>{e.cap}</p>
          <div style={{ marginTop: 20, background: t.card, borderRadius: 18, overflow: 'hidden', border: t.dark ? `0.5px solid ${t.sep}` : 'none' }}>
            <DRow t={t} icon="pin" label="Vị trí" value={e.loc || 'Chưa có'} />
            <DRow t={t} icon="library" label="Album" value={e.cat} />
            <DRow t={t} icon={e.kind === 'video' ? 'video' : 'camera'} label="Định dạng" value={e.kind === 'video' ? `Video · ${e.dur || '0:12'}` : 'Ảnh · JPG'} last />
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, background: hexToRgba(t.accent, t.dark ? 0.14 : 0.1), borderRadius: 16, padding: '13px 15px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: t.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="cloud" size={21} color={t.accent} stroke={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Đã đồng bộ Google Drive</div>
              <div style={{ fontSize: 12.5, color: t.sub }}>Nhật ký / 2026 / Tháng 6</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5" stroke={t.accentText} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30, paddingBottom: 26, paddingTop: 10, background: t.barBg, backdropFilter: 'blur(22px) saturate(180%)', borderTop: `0.5px solid ${t.barBorder}`, display: 'flex', justifyContent: 'space-around' }}>
        {[['edit', 'Sửa'], ['grid', 'Đổi album'], ['cloud', 'Tải xuống'], ['close', 'Xoá']].map(([ic, lb]) => (
          <button key={lb} onClick={lb === 'Xoá' ? onBack : undefined} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Icon name={ic} size={23} color={lb === 'Xoá' ? '#e0533c' : t.text} stroke={1.9} />
            <span style={{ fontSize: 10.5, fontWeight: 540, color: lb === 'Xoá' ? '#e0533c' : t.sub }}>{lb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function DRow({ t, icon, label, value, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderBottom: last ? 'none' : `0.5px solid ${t.sep}` }}>
      <Icon name={icon} size={19} color={t.sub} stroke={1.9} />
      <span style={{ fontSize: 15, color: t.sub, flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, textAlign: 'right', fontSize: 15, color: t.text, fontWeight: 520 }}>{value}</span>
    </div>
  );
}

Object.assign(window, { ProtoReview, ProtoDetail });
