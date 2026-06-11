// shared.jsx — design tokens, icons, and small reusable bits for the
// Photo/Video Journal app. Exported to window for use across babel scripts.

// ─────────────────────────────────────────────────────────────
// Accent palettes — pick a brighter tone; neutrals stay warm paper
// ─────────────────────────────────────────────────────────────
function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const PALETTES = {
  forest:     { name: 'Xanh rừng',  swatch: '#1e4d2b', light: { accent: '#1e4d2b', accentText: '#ffffff', chipText: '#2c6e3f' }, dark: { accent: '#5bbd7e', accentText: '#08220f', chipText: '#7fd09b' } },
  coral:      { name: 'San hô',     swatch: '#fb6f4c', light: { accent: '#fb6f4c', accentText: '#ffffff', chipText: '#d2461f' }, dark: { accent: '#ff8a63', chipText: '#ff9e7a' } },
  amber:      { name: 'Vàng nắng',  swatch: '#f3a712', light: { accent: '#f0a012', accentText: '#3a2600', chipText: '#a86e00' }, dark: { accent: '#f8bc4d', chipText: '#f9c873' } },
  rose:       { name: 'Hồng đào',   swatch: '#ec5a8d', light: { accent: '#ec5a8d', accentText: '#ffffff', chipText: '#cc346b' }, dark: { accent: '#ff86ae', chipText: '#ff9ec0' } },
  teal:       { name: 'Xanh ngọc',  swatch: '#0fa493', light: { accent: '#0fa493', accentText: '#ffffff', chipText: '#0c7e71' }, dark: { accent: '#3ed4c2', chipText: '#5fdccd' } },
  blue:       { name: 'Xanh biển',  swatch: '#3b82e8', light: { accent: '#3b82e8', accentText: '#ffffff', chipText: '#2a62bd' }, dark: { accent: '#6ca6ff', chipText: '#8cbaff' } },
  violet:     { name: 'Tím',        swatch: '#8b5cf0', light: { accent: '#8b5cf0', accentText: '#ffffff', chipText: '#6d3fce' }, dark: { accent: '#b390ff', chipText: '#c4a6ff' } },
  terracotta: { name: 'Đất nung',   swatch: '#e9692e', light: { accent: '#e9692e', accentText: '#ffffff', chipText: '#c5511a' }, dark: { accent: '#f7a05e', chipText: '#fab27d' } },
};

// ─────────────────────────────────────────────────────────────
// Base / surface themes — the app's main color (background + cards)
// Each anchor: bg, appBg, card, card2, ink (text), field, stripeA/B
// the rest (sub/ter/sep/bars/labels) is derived from ink + bg.
// ─────────────────────────────────────────────────────────────
const BASES = {
  paper: { name: 'Giấy ấm',   swatch: '#f3ead9',
    light: { bg: '#f8f3e9', appBg: '#efe7d8', card: '#ffffff', card2: '#fdf8f0', ink: '#2c2822', field: '#f6f0e6', stripeA: '#efe2cf', stripeB: '#e6d5bb' },
    dark:  { bg: '#181410', appBg: '#100e0b', card: '#231e16', card2: '#2d271d', ink: '#f4efe6', field: '#2d271d', stripeA: '#2a2418', stripeB: '#352d1f' } },
  snow:  { name: 'Trắng sạch', swatch: '#eef0f3',
    light: { bg: '#f6f7f9', appBg: '#e8eaee', card: '#ffffff', card2: '#f3f5f8', ink: '#1f2226', field: '#f1f3f6', stripeA: '#e4e8ec', stripeB: '#d7dde4' },
    dark:  { bg: '#121417', appBg: '#0b0c0e', card: '#1c1f23', card2: '#252930', ink: '#eef1f4', field: '#252930', stripeA: '#20242a', stripeB: '#2a3038' } },
  sand:  { name: 'Cát',        swatch: '#e7d3b4',
    light: { bg: '#f1e7d6', appBg: '#e5d6bd', card: '#fffdf8', card2: '#f7eddc', ink: '#34291b', field: '#f3e8d3', stripeA: '#e7d6bb', stripeB: '#ddc8a6' },
    dark:  { bg: '#1b1610', appBg: '#120e09', card: '#261f15', card2: '#31281b', ink: '#f3ebdd', field: '#31281b', stripeA: '#2c2418', stripeB: '#38301f' } },
  mist:  { name: 'Xanh khói',  swatch: '#d8e3e4',
    light: { bg: '#eef2f3', appBg: '#dde6e8', card: '#ffffff', card2: '#f1f5f6', ink: '#1f2a2d', field: '#eaf0f1', stripeA: '#dce7e9', stripeB: '#ccdcdf' },
    dark:  { bg: '#111719', appBg: '#0a0f10', card: '#192124', card2: '#222d31', ink: '#e9f1f2', field: '#222d31', stripeA: '#1d272a', stripeB: '#263438' } },
  blush: { name: 'Hồng phấn',  swatch: '#f0dbe0',
    light: { bg: '#f8eef0', appBg: '#eedce0', card: '#fffafb', card2: '#faeef1', ink: '#2f2226', field: '#f4e6ea', stripeA: '#efdadf', stripeB: '#e6c8d0' },
    dark:  { bg: '#1a1416', appBg: '#110b0d', card: '#251c20', card2: '#30242a', ink: '#f4eaed', field: '#30242a', stripeA: '#2c2024', stripeB: '#38292f' } },
  sage:  { name: 'Xanh sage',  swatch: '#aebfa5',
    light: { bg: '#f6f3e9', appBg: '#a9bba2', card: '#ffffff', card2: '#f3efe2', ink: '#15273a', field: '#f1ede0', stripeA: '#e7e8d8', stripeB: '#d7dcc6' },
    dark:  { bg: '#13181a', appBg: '#0a0e0f', card: '#1b2224', card2: '#242c2e', ink: '#ecf1ec', field: '#242c2e', stripeA: '#1f2829', stripeB: '#293433' } },
};

// ─────────────────────────────────────────────────────────────
// Theme tokens — chosen base surface + chosen accent palette
// ─────────────────────────────────────────────────────────────
function theme(dark, paletteKey = 'coral', baseKey = 'paper') {
  const pal = (PALETTES[paletteKey] || PALETTES.coral)[dark ? 'dark' : 'light'];
  const b = (BASES[baseKey] || BASES.paper)[dark ? 'dark' : 'light'];
  const accent = pal.accent;
  const accentText = dark ? '#1c1408' : (pal.accentText || '#ffffff');
  return {
    dark,
    bg: b.bg, appBg: b.appBg, card: b.card, card2: b.card2,
    text: b.ink,
    sub: hexToRgba(b.ink, dark ? 0.64 : 0.56),
    ter: hexToRgba(b.ink, dark ? 0.42 : 0.34),
    sep: hexToRgba(b.ink, dark ? 0.11 : 0.08),
    barBg: hexToRgba(b.bg, 0.78),
    barBorder: hexToRgba(b.ink, 0.08),
    stripeA: b.stripeA, stripeB: b.stripeB,
    stripeLabel: hexToRgba(b.ink, dark ? 0.45 : 0.42),
    fieldBg: b.field,
    accent, accentText,
    chipBg: hexToRgba(accent, dark ? 0.20 : 0.14),
    chipText: pal.chipText,
  };
}

// Category accent dots — calm, equal chroma/lightness, varied hue
const CATEGORIES = {
  'Du lịch':    'oklch(0.62 0.13 230)',
  'Gia đình':   'oklch(0.64 0.15 30)',
  'Công việc':  'oklch(0.58 0.13 280)',
  'Đời thường': 'oklch(0.58 0.13 155)',
  'Sức khỏe':   'oklch(0.62 0.14 350)',
};

// Pastel icon tiles (reference style) — soft bg + saturated line icon
const CAT_TILE = {
  'Du lịch':    { bg: '#dcebf5', dark: '#1d2f3c', icon: '#3f7fb0', glyph: 'pin' },
  'Gia đình':   { bg: '#f7e2d4', dark: '#3a2a20', icon: '#c4763f', glyph: 'camera' },
  'Công việc':  { bg: '#e7e0f3', dark: '#2a2438', icon: '#7a5fc0', glyph: 'grid' },
  'Đời thường': { bg: '#dcefe0', dark: '#1e2f24', icon: '#3f9560', glyph: 'sparkle' },
  'Sức khỏe':   { bg: '#f6dde3', dark: '#382128', icon: '#bb5878', glyph: 'play' },
};

// ─────────────────────────────────────────────────────────────
// Icons — simple geometric line icons, inherit currentColor
// ─────────────────────────────────────────────────────────────
function Icon({ name, size = 24, stroke = 2, color = 'currentColor', fill = 'none' }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    timeline: <g {...p}><circle cx="5" cy="6.5" r="1.4" /><circle cx="5" cy="17.5" r="1.4" /><line x1="9.5" y1="6.5" x2="19" y2="6.5" /><line x1="9.5" y1="17.5" x2="19" y2="17.5" /><line x1="9.5" y1="12" x2="15" y2="12" /></g>,
    grid: <g {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></g>,
    search: <g {...p}><circle cx="11" cy="11" r="6.5" /><line x1="16" y1="16" x2="20.5" y2="20.5" /></g>,
    gear: <g {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" /></g>,
    plus: <g {...p}><line x1="12" y1="6" x2="12" y2="18" /><line x1="6" y1="12" x2="18" y2="12" /></g>,
    camera: <g {...p}><path d="M4 8.5a2 2 0 0 1 2-2h2l1.2-1.8h5.6L18 6.5h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.4" /></g>,
    chevron: <g {...p}><path d="M9 5l7 7-7 7" /></g>,
    chevronL: <g {...p}><path d="M15 5l-7 7 7 7" /></g>,
    close: <g {...p}><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></g>,
    flash: <g {...p}><path d="M13 3 5 13h5l-1 8 8-10h-5z" /></g>,
    flip: <g {...p}><path d="M4 7h3l1.5-2h7L17 7h3v11H4z" /><path d="M9 12.5a3 3 0 0 0 5.5 1.6M15 11.5a3 3 0 0 0-5.5-1.6" /><path d="M9 8.5v2.5h2.5M15 15.5V13h-2.5" /></g>,
    play: <g fill={color} stroke="none"><path d="M8 5.5v13l11-6.5z" /></g>,
    pin: <g {...p}><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></g>,
    sparkle: <g {...p}><path d="M12 4.5c.6 3.2 1.8 4.4 5 5-3.2.6-4.4 1.8-5 5-.6-3.2-1.8-4.4-5-5 3.2-.6 4.4-1.8 5-5z" /><path d="M18.5 4l.5 1.6 1.6.5-1.6.5-.5 1.6-.5-1.6L16.4 6l1.6-.5z" /></g>,
    edit: <g {...p}><path d="M16.5 4.5l3 3L9 18l-3.8.8L6 15z" /><line x1="14.5" y1="6.5" x2="17.5" y2="9.5" /></g>,
    cloud: <g {...p}><path d="M7 18a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.6-1.2A3.5 3.5 0 0 1 17 18z" /><path d="M9.5 13.5l2 2 3.5-3.8" /></g>,
    cloudUp: <g {...p}><path d="M7 18a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.6-1.2A3.5 3.5 0 0 1 17 18" /><path d="M12 21v-7m0 0-2.3 2.3M12 14l2.3 2.3" /></g>,
    library: <g {...p}><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M4 14l4-3.5 3.5 3 3-2.5L20 15" /><circle cx="9" cy="10" r="1.2" /></g>,
    video: <g {...p}><rect x="3" y="6.5" width="12" height="11" rx="2" /><path d="M15 10.5l5-2.5v8l-5-2.5z" /></g>,
    calendar: <g {...p}><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><line x1="4" y1="9.5" x2="20" y2="9.5" /><line x1="8.5" y1="3.5" x2="8.5" y2="7" /><line x1="15.5" y1="3.5" x2="15.5" y2="7" /></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>{paths[name]}</svg>;
}

// ─────────────────────────────────────────────────────────────
// Striped image placeholder
// ─────────────────────────────────────────────────────────────
function Placeholder({ label = 'ảnh', t, radius = 16, style = {}, children }) {
  return (
    <div style={{
      position: 'relative', borderRadius: radius, overflow: 'hidden',
      background: `repeating-linear-gradient(135deg, ${t.stripeA} 0 9px, ${t.stripeB} 9px 18px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      <span style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 10.5, letterSpacing: 0.4, color: t.stripeLabel,
        textTransform: 'lowercase', padding: '2px 6px',
      }}>{label}</span>
      {children}
    </div>
  );
}

// Category chip (dot + label)
function Chip({ name, t, size = 'sm' }) {
  const big = size === 'md';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: t.chipBg, color: t.chipText,
      borderRadius: 999, padding: big ? '5px 11px' : '3px 9px',
      fontSize: big ? 13 : 12, fontWeight: 590, letterSpacing: -0.1,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: CATEGORIES[name] || t.accent }} />
      {name}
    </span>
  );
}

// Video duration badge
function VideoBadge({ dur = '0:12' }) {
  return (
    <div style={{
      position: 'absolute', right: 6, bottom: 6,
      display: 'flex', alignItems: 'center', gap: 3,
      background: 'rgba(0,0,0,0.55)', color: '#fff',
      borderRadius: 999, padding: '2px 7px 2px 5px',
      fontSize: 10.5, fontWeight: 600, backdropFilter: 'blur(4px)',
    }}>
      <Icon name="play" size={9} color="#fff" />
      {dur}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom tab bar — 4 tabs split around a centered green "+" FAB
// ─────────────────────────────────────────────────────────────
function TabBar({ t, active = 'timeline', onTab, onNew }) {
  const left = [{ id: 'timeline', icon: 'timeline', label: 'Nhật ký' }, { id: 'album', icon: 'grid', label: 'Album' }];
  const right = [{ id: 'search', icon: 'search', label: 'Tìm kiếm' }, { id: 'settings', icon: 'gear', label: 'Cài đặt' }];
  const Item = ({ tab }) => {
    const on = tab.id === active;
    const col = on ? t.accent : t.ter;
    return (
      <button onClick={onTab ? () => onTab(tab.id) : undefined} style={{
        border: 'none', background: 'transparent', cursor: onTab ? 'pointer' : 'default', padding: 0,
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
      paddingBottom: 26, paddingTop: 10,
      background: t.barBg,
      backdropFilter: 'blur(22px) saturate(180%)',
      WebkitBackdropFilter: 'blur(22px) saturate(180%)',
      borderTop: `0.5px solid ${t.barBorder}`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 6,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>{left.map(tab => <Item key={tab.id} tab={tab} />)}</div>
      <div style={{ width: 70, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onNew} style={{
          border: 'none', cursor: onNew ? 'pointer' : 'default', marginTop: -30,
          width: 56, height: 56, borderRadius: 999, background: t.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 18px ${hexToRgba(t.accent, 0.45)}`,
          border: `3px solid ${t.bg}`,
        }}>
          <Icon name="plus" size={26} color={t.accentText} stroke={2.4} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>{right.map(tab => <Item key={tab.id} tab={tab} />)}</div>
    </div>
  );
}

Object.assign(window, { theme, PALETTES, BASES, hexToRgba, CATEGORIES, CAT_TILE, Icon, Placeholder, Chip, VideoBadge, TabBar });
