// timeline.jsx — two takes on the Timeline (home) screen.
// TimelineCardList  = chosen layout: clean card rows grouped by day
// TimelineEditorial = immersive magazine take: hero photo per day

const TL_DATA = [
  {
    head: 'Hôm nay', sub: 'Thứ Ba, 9 Tháng 6',
    entries: [
      { time: '08:15', cap: 'Ly cà phê đầu ngày bên ô cửa sổ', cat: 'Đời thường', kind: 'photo', ph: 'cà phê sáng' },
      { time: '12:40', cap: 'Bữa trưa cùng cả team ở quán quen', cat: 'Công việc', kind: 'photo', ph: 'bữa trưa' },
    ],
  },
  {
    head: 'Hôm qua', sub: 'Thứ Hai, 8 Tháng 6',
    entries: [
      { time: '18:20', cap: 'Hoàng hôn buông trên cầu Long Biên', cat: 'Du lịch', kind: 'video', dur: '0:18', ph: 'hoàng hôn' },
      { time: '20:05', cap: 'Mẹ nấu canh chua, cả nhà quây quần', cat: 'Gia đình', kind: 'photo', ph: 'bữa tối' },
    ],
  },
  {
    head: 'Thứ Bảy', sub: '6 Tháng 6',
    entries: [
      { time: '09:30', cap: 'Chạy bộ một vòng quanh hồ buổi sớm', cat: 'Sức khỏe', kind: 'photo', ph: 'chạy bộ' },
    ],
  },
];

// Shared header (large title + AI line)
function TLHeader({ t, sub = '3 khoảnh khắc tuần này' }) {
  return (
    <div style={{ padding: '8px 20px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 760, letterSpacing: 0.3, color: t.text }}>Nhật ký</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.sub }}>
          <Icon name="calendar" size={20} color={t.sub} stroke={1.9} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: t.sub, fontSize: 14.5 }}>
        <Icon name="sparkle" size={15} color={t.accent} stroke={1.7} />
        <span>{sub}</span>
      </div>
    </div>
  );
}

// Day section label
function DayLabel({ t, head, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '14px 20px 8px' }}>
      <span style={{ fontSize: 19, fontWeight: 700, color: t.text, letterSpacing: -0.2 }}>{head}</span>
      <span style={{ fontSize: 13.5, color: t.ter, fontWeight: 500 }}>{sub}</span>
    </div>
  );
}

// ── Variation A: card list ───────────────────────────────────
function EntryCard({ t, e }) {
  return (
    <div style={{
      display: 'flex', gap: 13, alignItems: 'center',
      background: t.card, borderRadius: 20, padding: 10,
      boxShadow: t.dark ? 'none' : '0 1px 2px rgba(44,40,34,0.05)',
      border: t.dark ? `0.5px solid ${t.sep}` : 'none',
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
      </div>
    </div>
  );
}

function TimelineCardList({ t }) {
  return (
    <div style={{ height: '100%', position: 'relative', background: t.bg }}>
      <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 150 }}>
        <TLHeader t={t} />
        {TL_DATA.map((day, i) => (
          <div key={i}>
            <DayLabel t={t} head={day.head} sub={day.sub} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
              {day.entries.map((e, j) => <EntryCard key={j} t={t} e={e} />)}
            </div>
          </div>
        ))}
      </div>
      <TabBar t={t} active="timeline" />
    </div>
  );
}

// ── Variation B: editorial / magazine ────────────────────────
function HeroEntry({ t, e }) {
  return (
    <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', margin: '0 16px' }}>
      <Placeholder label={e.ph} t={t} radius={24} style={{ width: '100%', height: 220 }}>
        {e.kind === 'video' && <VideoBadge dur={e.dur} />}
      </Placeholder>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, padding: '34px 16px 14px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 680, color: 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums' }}>{e.time}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999,
            padding: '3px 9px', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)',
            color: '#fff', fontSize: 11.5, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: CATEGORIES[e.cat] }} />{e.cat}
          </span>
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.3, color: '#fff', fontWeight: 560, textWrap: 'pretty' }}>{e.cap}</div>
      </div>
    </div>
  );
}

function MiniEntry({ t, e }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '0 20px' }}>
      <Placeholder label={e.ph} t={t} radius={13} style={{ width: 54, height: 54, flexShrink: 0 }}>
        {e.kind === 'video' && <VideoBadge dur={e.dur} />}
      </Placeholder>
      <div style={{ flex: 1, minWidth: 0, borderBottom: `0.5px solid ${t.sep}`, paddingBottom: 12 }}>
        <div style={{ fontSize: 15, lineHeight: 1.3, color: t.text, fontWeight: 500, marginBottom: 4, textWrap: 'pretty' }}>{e.cap}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 620, color: t.ter, fontVariantNumeric: 'tabular-nums' }}>{e.time}</span>
          <span style={{ width: 3, height: 3, borderRadius: 9, background: t.ter }} />
          <Chip name={e.cat} t={t} />
        </div>
      </div>
    </div>
  );
}

function TimelineEditorial({ t }) {
  return (
    <div style={{ height: '100%', position: 'relative', background: t.bg }}>
      <div style={{ height: '100%', overflow: 'auto', paddingTop: 58, paddingBottom: 150 }}>
        <TLHeader t={t} sub="Khoảnh khắc nổi bật hôm nay" />
        {TL_DATA.map((day, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <DayLabel t={t} head={day.head} sub={day.sub} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <HeroEntry t={t} e={day.entries[0]} />
              {day.entries.slice(1).map((e, j) => <MiniEntry key={j} t={t} e={e} />)}
            </div>
          </div>
        ))}
      </div>
      <TabBar t={t} active="timeline" />
    </div>
  );
}

Object.assign(window, { TimelineCardList, TimelineEditorial });
