// capture.jsx — two takes on the Capture flow.
// CameraScreen  = in-app camera / viewfinder (photo ↔ video modes, shutter)
// CaptureReview = post-capture sheet: AI caption (editable), category, save→Drive

// ── Variation A: camera viewfinder ───────────────────────────
function CameraScreen({ t, mode = 'photo' }) {
  const video = mode === 'video';
  const tint = '#fff';
  const dim = 'rgba(255,255,255,0.62)';
  return (
    <div style={{ height: '100%', position: 'relative', background: '#000', overflow: 'hidden' }}>
      {/* viewfinder */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Placeholder label="khung ngắm camera" t={{ stripeA: '#1c1c1c', stripeB: '#262626', stripeLabel: 'rgba(255,255,255,0.35)' }} radius={0} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* top controls */}
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <button style={glassBtn}><Icon name="close" size={22} color={tint} stroke={2.2} /></button>
        {video && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.45)', padding: '6px 12px', borderRadius: 999 }}>
            <span style={{ width: 9, height: 9, borderRadius: 9, background: '#ff4b3e' }} />
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 640, fontVariantNumeric: 'tabular-nums' }}>00:00</span>
          </div>
        )}
        <button style={glassBtn}><Icon name="flash" size={22} color={tint} stroke={2} /></button>
      </div>

      {/* AI hint pill */}
      <div style={{ position: 'absolute', top: 118, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', padding: '7px 14px', borderRadius: 999 }}>
          <Icon name="sparkle" size={15} color={t.accent} stroke={1.7} />
          <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: 520 }}>AI sẽ tự viết caption sau khi chụp</span>
        </div>
      </div>

      {/* bottom control cluster */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10, paddingBottom: 30, background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))' }}>
        {/* mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 26, marginBottom: 22 }}>
          {[['photo', 'ẢNH'], ['video', 'VIDEO']].map(([id, label]) => (
            <span key={id} style={{
              fontSize: 13, fontWeight: 720, letterSpacing: 1.2,
              color: id === mode ? t.accent : dim,
            }}>{label}</span>
          ))}
        </div>
        {/* shutter row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px' }}>
          <Placeholder label="thư viện" t={{ stripeA: '#333', stripeB: '#3d3d3d', stripeLabel: 'rgba(255,255,255,0.5)' }} radius={11} style={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.85)' }} />
          {/* shutter */}
          <div style={{ width: 78, height: 78, borderRadius: 999, border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              borderRadius: video ? 9 : 999,
              width: video ? 32 : 64, height: video ? 32 : 64,
              background: video ? '#ff4b3e' : '#fff', transition: 'all .2s',
            }} />
          </div>
          <button style={{ ...glassBtn, background: 'rgba(255,255,255,0.18)' }}><Icon name="flip" size={24} color={tint} stroke={1.9} /></button>
        </div>
      </div>
    </div>
  );
}

const glassBtn = {
  width: 44, height: 44, borderRadius: 999, border: 'none',
  background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

// ── Variation B: AI caption review sheet ─────────────────────
function CaptureReview({ t }) {
  const cats = ['Du lịch', 'Gia đình', 'Đời thường', 'Công việc', 'Sức khỏe'];
  const selected = 'Du lịch';
  return (
    <div style={{ height: '100%', position: 'relative', background: '#000', overflow: 'hidden' }}>
      {/* captured photo behind */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}>
        <Placeholder label="ảnh vừa chụp" t={{ stripeA: '#1c1c1c', stripeB: '#262626', stripeLabel: 'rgba(255,255,255,0.35)' }} radius={0} style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', top: 60, left: 20 }}>
          <button style={glassBtn}><Icon name="chevronL" size={22} color="#fff" stroke={2.2} /></button>
        </div>
        <div style={{ position: 'absolute', top: 60, right: 20 }}>
          <button style={{ ...glassBtn, width: 'auto', padding: '0 16px', gap: 6, color: '#fff', fontSize: 15, fontWeight: 600 }}>Chụp lại</button>
        </div>
      </div>

      {/* review sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 270,
        background: t.bg, borderRadius: '28px 28px 0 0', overflow: 'auto',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 9 }}>
          <div style={{ width: 38, height: 5, borderRadius: 9, background: t.ter, opacity: 0.5 }} />
        </div>

        <div style={{ padding: '14px 20px 130px' }}>
          {/* AI caption block */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="sparkle" size={18} color={t.accent} stroke={1.7} />
              <span style={{ fontSize: 13, fontWeight: 680, color: t.accent, letterSpacing: 0.2 }}>CAPTION DO AI GỢI Ý</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.sub, fontSize: 13, fontWeight: 560 }}>
              <Icon name="edit" size={15} color={t.sub} stroke={1.9} />Sửa
            </div>
          </div>
          <div style={{
            background: t.card, borderRadius: 18, padding: '15px 16px',
            border: t.dark ? `0.5px solid ${t.sep}` : 'none',
            boxShadow: t.dark ? 'none' : '0 1px 2px rgba(44,40,34,0.05)',
          }}>
            <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.42, color: t.text, fontWeight: 470, textWrap: 'pretty' }}>
              Hoàng hôn buông trên cầu Long Biên, bầu trời nhuộm cam và những chuyến tàu cuối ngày.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 11, paddingTop: 11, borderTop: `0.5px solid ${t.sep}` }}>
              <Icon name="pin" size={15} color={t.ter} stroke={1.8} />
              <span style={{ fontSize: 13, color: t.sub, fontWeight: 500 }}>Cầu Long Biên, Hà Nội</span>
            </div>
          </div>

          {/* category suggestion */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '22px 0 11px' }}>
            <span style={{ fontSize: 13, fontWeight: 680, color: t.sub, letterSpacing: 0.2 }}>NHÃN PHÂN LOẠI</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: t.accent }}>
              <Icon name="sparkle" size={12} color={t.accent} stroke={1.7} />AI đề xuất
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cats.map(c => {
              const on = c === selected;
              return (
                <span key={c} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  borderRadius: 999, padding: '8px 14px', fontSize: 14, fontWeight: 560,
                  background: on ? t.accent : t.card,
                  color: on ? t.accentText : t.text,
                  border: on ? 'none' : `1px solid ${t.sep}`,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: 9, background: on ? t.accentText : CATEGORIES[c] }} />{c}
                </span>
              );
            })}
          </div>

          {/* drive sync row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 22,
            background: t.card, borderRadius: 16, padding: '13px 15px',
            border: t.dark ? `0.5px solid ${t.sep}` : 'none',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="cloudUp" size={21} color={t.accent} stroke={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 580, color: t.text }}>Tự động tải lên Google Drive</div>
              <div style={{ fontSize: 12.5, color: t.sub }}>Khi lưu, ảnh sẽ được đồng bộ</div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 620, color: t.accent }}>Bật</span>
          </div>
        </div>

        {/* sticky save bar */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 20px 30px',
          background: t.bg, borderTop: `0.5px solid ${t.sep}`,
        }}>
          <button style={{
            width: '100%', height: 52, borderRadius: 16, border: 'none', cursor: 'pointer',
            background: t.accent, color: t.accentText, fontSize: 17, fontWeight: 640,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            Lưu khoảnh khắc
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CameraScreen, CaptureReview });
