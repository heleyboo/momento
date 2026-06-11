// app.jsx — gallery canvas presenting the two screens × two variations,
// with a global Light/Dark toggle and a short design-reasoning intro.

const { useState, useEffect } = React;

function Segmented({ value, onChange, options, accent }) {
  return (
    <div style={{ display: 'inline-flex', background: 'rgba(120,110,95,0.14)', borderRadius: 11, padding: 3, gap: 2 }}>
      {options.map(o => {
        const on = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            border: 'none', cursor: 'pointer', borderRadius: 8.5, padding: '6px 16px',
            fontSize: 14, fontWeight: on ? 640 : 520, fontFamily: 'inherit',
            background: on ? '#fff' : 'transparent',
            color: on ? '#2c2822' : 'rgba(44,40,34,0.6)',
            boxShadow: on ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function FrameWrap({ label, desc, children, ink, mute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
      <div style={{ paddingLeft: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 680, color: ink, letterSpacing: -0.1 }}>{label}</div>
        <div style={{ fontSize: 13, color: mute, marginTop: 2 }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

function SectionHead({ num, title, desc, accent, ink, mute }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
      <span style={{
        fontSize: 13, fontWeight: 760, color: accent,
        background: hexToRgba(accent, 0.13), borderRadius: 8, padding: '3px 10px',
      }}>{num}</span>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 720, color: ink, letterSpacing: -0.2 }}>{title}</h2>
        <div style={{ fontSize: 14, color: mute, marginTop: 3 }}>{desc}</div>
      </div>
    </div>
  );
}

function Swatches({ value, onChange, items }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      {Object.entries(items).map(([key, p]) => {
        const on = key === value;
        return (
          <button key={key} onClick={() => onChange(key)} title={p.name} style={{
            width: 30, height: 30, borderRadius: 999, cursor: 'pointer', padding: 0,
            background: p.swatch, border: '2px solid #fff',
            boxShadow: on ? `0 0 0 2px ${p.swatch}` : '0 1px 3px rgba(0,0,0,0.18)',
            transform: on ? 'scale(1.08)' : 'none', transition: 'transform .12s',
          }} />
        );
      })}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState('light');
  const [palette, setPalette] = useState('forest');
  const [base, setBase] = useState('sage');
  const dark = mode === 'dark';
  const t = theme(dark, palette, base);
  const ui = PALETTES[palette].light.accent;
  const deskBg = dark ? '#0b0e0f' : '#a9bba2';
  useEffect(() => {
    document.body.style.background = deskBg;
  }, [deskBg]);
  const deskInk = dark ? 'rgba(244,239,230,0.72)' : 'rgba(44,40,34,0.72)';
  const deskMute = dark ? 'rgba(244,239,230,0.5)' : 'rgba(44,40,34,0.5)';

  return (
    <div style={{
      minHeight: '100vh', background: deskBg,
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased', color: t.text,
      padding: '40px 48px 80px',
    }}>
      {/* Intro / reasoning */}
      <div style={{ maxWidth: 880, marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: ui, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={19} color="#fff" stroke={1.9} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 680, letterSpacing: 0.4, color: deskMute, textTransform: 'uppercase' }}>Nhật ký hình ảnh · iOS · Hi-fi v2</span>
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 30, fontWeight: 760, letterSpacing: -0.4 }}>Sáu màn hình chính</h1>
        <p style={{ margin: '0 0 18px', fontSize: 16, lineHeight: 1.55, color: deskInk, maxWidth: 720, textWrap: 'pretty' }}>
          Timeline, Chụp/Quay, Chi tiết, Album, Tìm kiếm và Cài đặt. Bo góc mềm, nhiều khoảng trắng,
          font hệ thống iOS (SF&nbsp;Pro). AI xuất hiện nhẹ nhàng bằng biểu tượng <Icon name="sparkle" size={14} color={ui} stroke={1.7} /> ở caption, gợi ý nhãn và album.
          Đổi <strong>Tông màu</strong> và <strong>Màu nền</strong> độc lập, áp cho cả Sáng/Tối.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginBottom: 12 }}>
          <Segmented value={mode} onChange={setMode} options={[{ id: 'light', label: '☀︎ Sáng' }, { id: 'dark', label: '☾ Tối' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: deskMute, width: 64 }}>Tông màu</span>
            <Swatches value={palette} onChange={setPalette} items={PALETTES} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: deskMute, width: 64 }}>Màu nền</span>
            <Swatches value={base} onChange={setBase} items={BASES} />
          </div>
        </div>
      </div>

      {/* Section 1 — Timeline */}
      <div style={{ marginBottom: 56 }}>
        <SectionHead num="01" title="Timeline — Trang chủ" desc="Dòng thời gian các khoảnh khắc, nhóm theo ngày." accent={ui} ink={t.text} mute={deskMute} />
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <FrameWrap label="Phương án A — Danh sách thẻ" desc="Gọn gàng, thumbnail + caption, dễ lướt nhanh." ink={t.text} mute={deskMute}>
            <IOSDevice dark={dark}><TimelineCardList t={t} /></IOSDevice>
          </FrameWrap>
          <FrameWrap label="Phương án B — Tạp chí" desc="Ảnh lớn nổi bật mỗi ngày, cảm giác đắm chìm." ink={t.text} mute={deskMute}>
            <IOSDevice dark={dark}><TimelineEditorial t={t} /></IOSDevice>
          </FrameWrap>
        </div>
      </div>

      {/* Section 2 — Capture */}
      <div>
        <SectionHead num="02" title="Chụp / Quay" desc="Camera trong app và bước AI tạo caption sau khi chụp." accent={ui} ink={t.text} mute={deskMute} />
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <FrameWrap label="Phương án A — Khung ngắm camera" desc="Chuyển Ảnh ↔ Video, nút chụp lớn, chọn từ thư viện." ink={t.text} mute={deskMute}>
            <IOSDevice dark={true}><CameraScreen t={t} mode="photo" /></IOSDevice>
          </FrameWrap>
          <FrameWrap label="Phương án B — AI tạo caption" desc="Sau khi chụp: caption AI sửa được, chọn nhãn, lưu → Drive." ink={t.text} mute={deskMute}>
            <IOSDevice dark={true}><CaptureReview t={t} /></IOSDevice>
          </FrameWrap>
        </div>
      </div>

      {/* Section 3 — Entry detail + Album */}
      <div style={{ marginTop: 56 }}>
        <SectionHead num="03" title="Chi tiết & Album" desc="Mở một khoảnh khắc, và gom theo chủ đề." accent={ui} ink={t.text} mute={deskMute} />
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <FrameWrap label="Chi tiết entry" desc="Ảnh/video lớn, caption AI, vị trí, nhãn, đồng bộ Drive." ink={t.text} mute={deskMute}>
            <IOSDevice dark={dark}><EntryDetail t={t} /></IOSDevice>
          </FrameWrap>
          <FrameWrap label="Album / Phân loại" desc="Lưới album theo chủ đề, AI gợi ý gom nhóm." ink={t.text} mute={deskMute}>
            <IOSDevice dark={dark}><AlbumScreen t={t} /></IOSDevice>
          </FrameWrap>
        </div>
      </div>

      {/* Section 4 — Search + Settings */}
      <div style={{ marginTop: 56 }}>
        <SectionHead num="04" title="Tìm kiếm & Cài đặt" desc="Tìm theo caption, lọc; kết nối Drive và tuỳ chọn AI." accent={ui} ink={t.text} mute={deskMute} />
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <FrameWrap label="Tìm kiếm & lọc" desc="Từ khoá trong caption, lọc theo loại/ngày/nhãn." ink={t.text} mute={deskMute}>
            <IOSDevice dark={dark}><SearchScreen t={t} /></IOSDevice>
          </FrameWrap>
          <FrameWrap label="Cài đặt" desc="Google Drive, đồng bộ tự động, lưu trữ, AI caption." ink={t.text} mute={deskMute}>
            <IOSDevice dark={dark}><SettingsScreen t={t} /></IOSDevice>
          </FrameWrap>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
