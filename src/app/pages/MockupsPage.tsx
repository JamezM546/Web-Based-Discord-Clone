import React, { useState } from 'react';
import {
  Search, X, Sparkles, ChevronDown, ChevronUp, ArrowDown,
  Clock, MessageSquare, TrendingUp, Users, AlertCircle,
  Zap, Info, ExternalLink,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
──────────────────────────────────────────────────────────────────────────── */
const P = {
  bg:         '#060c18',
  surface:    '#0a1628',
  sidebar:    '#0d1a2e',
  card:       '#111e30',
  border:     '#1e3248',
  border2:    '#2a3f5a',
  accent:     '#06b6d4',
  accentDim:  'rgba(6,182,212,0.15)',
  accentLine: 'rgba(6,182,212,0.5)',
  text1:      '#e2e8f0',
  text2:      '#94a3b8',
  text3:      '#475569',
  text4:      '#334155',
  ann:        '#f59e0b',
  canvas:     '#040a14',
};

/* ────────────────────────────────────────────────────────────────────────────
   SHARED PRIMITIVES
──────────────────────────────────────────────────────────────────────────── */

/** Amber numbered callout dot, absolutely positioned over its parent */
function Ann({ n, top, left, right, bottom }: {
  n: number;
  top?: number | string; left?: number | string;
  right?: number | string; bottom?: number | string;
}) {
  return (
    <span style={{
      position: 'absolute', zIndex: 30, pointerEvents: 'none',
      top, left, right, bottom,
      width: 17, height: 17,
      background: P.ann, color: '#000',
      borderRadius: '50%',
      border: '1.5px solid rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 8.5, fontWeight: 900, letterSpacing: '-0.01em',
      boxShadow: '0 2px 6px rgba(0,0,0,0.55)',
    }}>{n}</span>
  );
}

/** A single row in the annotation key */
function SpecRow({ n, name, value }: { n: number; name: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '4px 0',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <span style={{
        width: 15, height: 15, background: P.ann, color: '#000',
        borderRadius: '50%', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 900, flexShrink: 0,
      }}>{n}</span>
      <span style={{ color: P.text3, fontSize: 10.5, flexShrink: 0, minWidth: 74 }}>{name}</span>
      <code style={{
        color: '#67e8f9', fontSize: 9.5, fontFamily: 'monospace',
        background: 'rgba(6,182,212,0.08)', padding: '1px 5px',
        borderRadius: 3, flex: 1, overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', lineHeight: 1.4,
      }}>{value}</code>
    </div>
  );
}

/** Dashed artboard card wrapping a state mockup */
function Card({ label, color = P.text4, children, style }: {
  label: string; color?: string;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      border: `1.5px dashed ${P.border2}`,
      borderRadius: 12, background: P.canvas,
      position: 'relative', overflow: 'visible',
      ...style,
    }}>
      <div style={{
        padding: '5px 10px 0',
        fontFamily: 'monospace', fontSize: 8.5, color,
        letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700,
      }}>{label}</div>
      <div style={{ padding: '8px 10px 10px', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

/** Compact one-line feature descriptor beneath the page title */
function FeatureHero({ icon: Icon, title, desc, usedIn }: {
  icon: React.ElementType; title: string; desc: string; usedIn: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      paddingBottom: 13, borderBottom: `1px solid ${P.border}`,
      flexShrink: 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: P.accentDim, border: `1px solid ${P.accentLine}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={P.accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 5 }}>
          <h2 style={{ color: P.text1, fontSize: 19, fontWeight: 700, margin: 0, flexShrink: 0 }}>{title}</h2>
          <span style={{
            color: P.text3, fontSize: 11.5, flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{desc}</span>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: P.accentDim, border: `1px solid ${P.accentLine}`,
          borderRadius: 14, padding: '2px 9px',
        }}>
          <Info size={9} color={P.accent} />
          <span style={{ fontSize: 9.5, color: P.accent }}>{usedIn}</span>
        </span>
      </div>
    </div>
  );
}

/** Right-hand spec panel — annotation key + responsive behaviour */
function SpecPanel({ items, resp }: {
  items: { n: number; name: string; value: string }[];
  resp: { mobile: string[]; desktop: string[] };
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden', gap: 0,
    }}>
      {/* ── Annotation key ── */}
      <div style={{ flexShrink: 0 }}>
        <p style={{
          margin: '0 0 5px', fontSize: 9, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', color: P.text4,
        }}>Annotation Key</p>
        {items.map(i => <SpecRow key={i.n} {...i} />)}
      </div>

      <div style={{ height: 1, background: P.border, margin: '12px 0' }} />

      {/* ── Responsive behaviour ── */}
      <div style={{ flexShrink: 0 }}>
        <p style={{
          margin: '0 0 8px', fontSize: 9, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', color: P.text4,
        }}>Responsive Behaviour</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([
            { label: '📱 Mobile  <768 px', color: '#a78bfa', pts: resp.mobile },
            { label: '🖥  Desktop ≥768 px', color: '#34d399',  pts: resp.desktop },
          ] as const).map(b => (
            <div key={b.label} style={{
              background: P.card, border: `1px solid ${P.border}`,
              borderRadius: 9, padding: '8px 10px',
            }}>
              <p style={{ color: b.color, fontSize: 9.5, fontWeight: 700, margin: '0 0 6px' }}>{b.label}</p>
              {b.pts.map((pt, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
                  <span style={{ color: b.color, fontSize: 8.5, flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span style={{ color: P.text2, fontSize: 9.5, lineHeight: 1.45 }}>{pt}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SLIDE 1 — SERVER SEARCH
──────────────────────────────────────────────────────────────────────────── */
function ServerSearchSlide() {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '16px 32px 16px', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      <FeatureHero
        icon={Search}
        title="Server Search"
        desc="Real-time overlay filtering the user's joined Spaces by name. Triggered by typing in the input that appears in the mobile sub-strip (md:hidden) or the desktop left sidebar when a Space is active."
        usedIn="/components/search/ServerSearch.tsx  ·  MainLayout mobile sub-strip  ·  desktop left sidebar"
      />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '6px 11px',
        background: P.card, border: `1px solid ${P.border}`, borderRadius: 7,
      }}>
        <span style={{ color: P.text4, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scope:</span>
        <span style={{ color: P.text2, fontSize: 11 }}>Additional feature — search bar beyond the two core user stories.</span>
      </div>

      <div style={{
        flex: 1, overflow: 'hidden', marginTop: 14,
        display: 'grid', gridTemplateColumns: '1fr 295px', gap: 22,
      }}>
        {/* ── Five state cards in a single row ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10, alignContent: 'start',
        }}>

          {/* 1 – Idle */}
          <Card label="1 · Idle" color={P.text4}>
            <Ann n={1} top={8} left={8} />
            <Ann n={2} top={8} right={8} />
            <div style={{
              position: 'relative', background: P.bg,
              border: `1px solid ${P.border}`, borderRadius: 7, height: 30,
              display: 'flex', alignItems: 'center', paddingLeft: 26,
            }}>
              <Search size={13} color={P.text3} style={{ position: 'absolute', left: 7 }} />
              <span style={{ color: P.text3, fontSize: 11 }}>Search spaces…</span>
            </div>
            <div style={{
              marginTop: 6, padding: '10px 8px',
              background: P.surface, border: `1px solid ${P.border}`,
              borderRadius: 8, textAlign: 'center',
            }}>
              <span style={{ color: P.text4, fontSize: 9 }}>
                Dropdown not rendered —<br />
                <code style={{ color: '#67e8f9', fontSize: 9 }}>if (!query) return null</code>
              </span>
            </div>
          </Card>

          {/* 2 – Loading skeleton */}
          <Card label="2 · Loading" color="#a78bfa">
            <Ann n={3} top={8} right={8} />
            <Ann n={4} top={54} left={8} />
            <div style={{
              position: 'relative', background: P.bg,
              border: `1px solid ${P.accent}4d`, borderRadius: 7, height: 30,
              display: 'flex', alignItems: 'center', paddingLeft: 26, paddingRight: 26,
              boxShadow: `0 0 0 2px ${P.accent}22`,
            }}>
              <Search size={13} color={P.text3} style={{ position: 'absolute', left: 7 }} />
              <span style={{ color: P.text1, fontSize: 11 }}>team</span>
              <X size={13} color={P.text3} style={{ position: 'absolute', right: 7 }} />
            </div>
            <div style={{
              marginTop: 5, background: P.surface,
              border: `1px solid ${P.border}`, borderRadius: 8, padding: 6,
            }}>
              {[75, 62, 80].map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '4px 3px' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: P.border, flexShrink: 0,
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, background: P.border, borderRadius: 3, width: `${w}%`, marginBottom: 4 }} />
                    <div style={{ height: 6, background: P.border, borderRadius: 3, width: '38%' }} />
                  </div>
                </div>
              ))}
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
          </Card>

          {/* 3 – Results */}
          <Card label="3 · Results found" color="#34d399">
            <Ann n={5} top={8} right={8} />
            <Ann n={6} top={54} left={8} />
            <Ann n={7} top={80} right={8} />
            <div style={{
              position: 'relative', background: P.bg,
              border: `1px solid ${P.accent}4d`, borderRadius: 7, height: 30,
              display: 'flex', alignItems: 'center', paddingLeft: 26, paddingRight: 26,
              boxShadow: `0 0 0 2px ${P.accent}22`,
            }}>
              <Search size={13} color={P.text3} style={{ position: 'absolute', left: 7 }} />
              <span style={{ color: P.text1, fontSize: 11 }}>team</span>
              <X size={13} color={P.text3} style={{ position: 'absolute', right: 7 }} />
            </div>
            <div style={{
              marginTop: 5, background: P.surface,
              border: `1px solid ${P.border}`, borderRadius: 8, padding: 6,
              boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
            }}>
              <div style={{
                color: P.text3, fontSize: 8.5, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '2px 4px 5px',
              }}>Spaces — 2</div>
              {[
                { icon: '🚀', name: 'Team Project', count: '5 people', hover: true },
                { icon: '⚽', name: 'Team Alpha',   count: '3 people', hover: false },
              ].map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '5px 4px', borderRadius: 6,
                  background: s.hover ? P.card : 'transparent',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: P.bg, border: `1px solid ${P.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ color: P.text1, fontSize: 11, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ color: P.text3, fontSize: 9.5 }}>{s.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 4 – No Results */}
          <Card label="4 · No results" color="#fb923c">
            <Ann n={8} top={52} left="calc(50% - 8px)" />
            <div style={{
              position: 'relative', background: P.bg,
              border: `1px solid ${P.border}`, borderRadius: 7, height: 30,
              display: 'flex', alignItems: 'center', paddingLeft: 26, paddingRight: 26,
            }}>
              <Search size={13} color={P.text3} style={{ position: 'absolute', left: 7 }} />
              <span style={{ color: P.text1, fontSize: 11 }}>xyz123</span>
              <X size={13} color={P.text3} style={{ position: 'absolute', right: 7 }} />
            </div>
            <div style={{
              marginTop: 5, background: P.surface,
              border: `1px solid ${P.border}`, borderRadius: 8,
              padding: '18px 8px', textAlign: 'center',
              boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
            }}>
              <Search size={18} color={P.border2} style={{ display: 'block', margin: '0 auto 6px' }} />
              <div style={{ color: P.text3, fontSize: 11 }}>No spaces found</div>
            </div>
          </Card>

          {/* 5 – Error */}
          <Card label="5 · Error / unavailable" color="#f87171">
            <Ann n={9} top={52} left="calc(50% - 8px)" />
            <div style={{
              position: 'relative', background: P.bg,
              border: `1px solid ${P.border}`, borderRadius: 7, height: 30,
              display: 'flex', alignItems: 'center', paddingLeft: 26, paddingRight: 26,
            }}>
              <Search size={13} color={P.text3} style={{ position: 'absolute', left: 7 }} />
              <span style={{ color: P.text1, fontSize: 11 }}>team</span>
              <X size={13} color={P.text3} style={{ position: 'absolute', right: 7 }} />
            </div>
            <div style={{
              marginTop: 5, background: P.surface,
              border: '1px solid rgba(248,113,113,0.28)', borderRadius: 8,
              padding: '14px 8px', textAlign: 'center',
              boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
            }}>
              <AlertCircle size={16} color="#f87171" style={{ display: 'block', margin: '0 auto 5px' }} />
              <div style={{ color: '#f87171', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Search unavailable</div>
              <button style={{
                padding: '3px 10px', background: P.accent, color: '#fff',
                border: 'none', borderRadius: 5, fontSize: 10, cursor: 'pointer',
              }}>Retry</button>
            </div>
          </Card>
        </div>

        {/* ── Spec panel ── */}
        <SpecPanel
          items={[
            { n: 1, name: 'Strip wrapper',   value: 'md:hidden · px-3 py-2 · bg-[#0a1628] · border-b border-[#1e3248]' },
            { n: 2, name: 'Input field',     value: 'h-8 · bg-[#060c18] · border-[#1e3248] · rounded-lg · pl-8 pr-8 · text-sm' },
            { n: 3, name: 'Focus ring',      value: 'focus-visible:ring-[#06b6d4]/50' },
            { n: 4, name: 'Skeleton rows',   value: 'bg-[#1e3248] · animate-pulse · rounded · 3 rows w 65–80%' },
            { n: 5, name: 'X clear btn',     value: 'absolute right-2 · size-4 · text-[#475569] · hover:text-[#94a3b8]' },
            { n: 6, name: 'Category header', value: 'text-xs · uppercase · tracking-wider · text-[#475569]' },
            { n: 7, name: 'Hover row',       value: 'bg-[#111e30] · rounded-lg · px-2 py-2 · gap-3' },
            { n: 8, name: 'Empty state',     value: 'text-center · py-4 · text-sm · text-[#475569]' },
            { n: 9, name: 'Error border',    value: 'border rgba(248,113,113,0.3) · Retry bg-[#06b6d4]' },
          ]}
          resp={{
            mobile: [
              'Input rendered in the always-visible md:hidden sub-strip',
              'Dropdown: top-14 from strip, left-2/right-2 — near full width',
              'max-h-96 + ScrollArea for overflow',
            ],
            desktop: [
              'Input inside w-64 left sidebar, only when selectedServer truthy',
              'Dropdown absolutely positioned inside sidebar column',
              'Strip hidden — md:hidden hides the mobile version',
            ],
          }}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SLIDE 2 — WHAT YOU MISSED
──────────────────────────────────────────────────────────────────────────── */
function WhatYouMissedSlide() {
  const avs = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Nafisa',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ashraf',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
  ];

  /** Reusable compact bar shared by collapsed & expanded states */
  const Bar = () => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '7px 14px',
      flexWrap: 'nowrap',
    }}>
      <Sparkles size={13} color={P.accent} />
      <span style={{ color: P.accent, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>What You Missed</span>
      <span style={{ color: P.text4, fontSize: 11 }}>·</span>
      <span style={{ color: P.text3, fontSize: 11, whiteSpace: 'nowrap' }}>12 new · 2h ago</span>
      <div style={{ display: 'flex', marginLeft: 2 }}>
        {avs.map((a, i) => (
          <img key={i} src={a} alt="" style={{
            width: 15, height: 15, borderRadius: '50%',
            border: `1px solid ${P.bg}`, marginLeft: i > 0 ? -4 : 0,
          }} />
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '2px 7px', borderRadius: 4, border: 'none',
        background: 'transparent', color: P.accent, fontSize: 10.5,
        fontWeight: 500, cursor: 'pointer',
      }}>
        <ArrowDown size={11} /> Jump
      </button>
      <button style={{ padding: 4, border: 'none', background: 'transparent', color: P.text3, cursor: 'pointer' }}>
        <ChevronDown size={13} />
      </button>
      <button style={{ padding: 4, border: 'none', background: 'transparent', color: P.text4, cursor: 'pointer' }}>
        <X size={13} />
      </button>
    </div>
  );

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '16px 32px 16px', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      <FeatureHero
        icon={Sparkles}
        title="What You Missed"
        desc="Auto-generated AI summary banner shown at the top of the message list when a channel or DM has unread messages since the user's last visit. Collapsible, dismissible, and includes a jump-to-unread shortcut."
        usedIn="/components/messaging/WhatYouMissed.tsx  ·  MessageArea (top of message list)"
      />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '6px 11px',
        background: P.card, border: `1px solid ${P.border}`, borderRadius: 7,
      }}>
        <span style={{ color: P.text4, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scope:</span>
        <span style={{ color: P.text2, fontSize: 11 }}>Dependent on Manual AI Summary — uses the same summary logic, triggered automatically when there are unread messages.</span>
      </div>

      <div style={{
        flex: 1, overflow: 'hidden', marginTop: 14,
        display: 'grid', gridTemplateColumns: '1fr 295px', gap: 22,
      }}>
        {/* ── Four states in a 2 × 2 grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: 12,
          alignContent: 'start',
        }}>

          {/* State 1 – Compact / collapsed */}
          <Card label="1 · Compact bar — collapsed (default)" color={P.text3}>
            <Ann n={1} top={10} left={-6} />
            <Ann n={2} top={10} left={14} />
            <Ann n={3} top={10} left={50} />
            <Ann n={4} top={7}  right={52} />
            <Ann n={5} top={7}  right={30} />
            <Ann n={6} top={7}  right={8}  />
            <div style={{
              borderLeft: '3px solid rgba(6,182,212,0.5)',
              background: 'rgba(6,182,212,0.04)',
              borderBottom: `1px solid ${P.border}`,
              borderRadius: '0 6px 6px 0',
            }}>
              <Bar />
            </div>
            <p style={{ color: P.text4, fontSize: 9.5, margin: '6px 2px 0' }}>
              Always-visible compact form. Clicking ▾ opens the expanded body below.
            </p>
          </Card>

          {/* State 2 – Expanded */}
          <Card label="2 · Expanded — summary body visible" color="#34d399">
            <Ann n={7} top={48} left={-6} />
            <Ann n={8} top={66} left={14} />
            <div style={{
              borderLeft: '3px solid rgba(6,182,212,0.5)',
              background: 'rgba(6,182,212,0.04)',
              borderBottom: `1px solid ${P.border}`,
              borderRadius: '0 6px 6px 0',
            }}>
              {/* Bar with chevron-up */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 14px',
              }}>
                <Sparkles size={13} color={P.accent} />
                <span style={{ color: P.accent, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>What You Missed</span>
                <span style={{ color: P.text4, fontSize: 11 }}>·</span>
                <span style={{ color: P.text3, fontSize: 11, whiteSpace: 'nowrap' }}>12 new · 2h ago</span>
                <div style={{ display: 'flex', marginLeft: 2 }}>
                  {avs.map((a, i) => (
                    <img key={i} src={a} alt="" style={{ width: 15, height: 15, borderRadius: '50%', border: `1px solid ${P.bg}`, marginLeft: i > 0 ? -4 : 0 }} />
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, border: 'none', background: 'transparent', color: P.accent, fontSize: 10.5, cursor: 'pointer' }}>
                  <ArrowDown size={11} /> Jump
                </button>
                <button style={{ padding: 4, border: 'none', background: 'transparent', color: P.text3, cursor: 'pointer' }}>
                  <ChevronUp size={13} />
                </button>
                <button style={{ padding: 4, border: 'none', background: 'transparent', color: P.text4, cursor: 'pointer' }}>
                  <X size={13} />
                </button>
              </div>
              {/* Expanded body */}
              <div style={{ padding: '0 14px 11px' }}>
                <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, margin: '0 0 7px' }}>
                  James is working on text channels with permissions. Elvis and Salma are working on messaging with real-time chat and emojis. Salma confirmed the emoji picker is working great. Ashraf asked about a meeting tomorrow.
                </p>
                <button style={{ fontSize: 10.5, color: P.text4, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                  Mark as read
                </button>
              </div>
            </div>
          </Card>

          {/* State 3 – No unread (not mounted) */}
          <Card label="3 · No unread — component not mounted" color={P.text4}>
            <Ann n={9} top={34} left="calc(50% - 8px)" />
            {/* Fake channel header */}
            <div style={{
              background: P.surface, borderBottom: `1px solid ${P.border}`,
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 7,
              borderRadius: '6px 6px 0 0',
            }}>
              <span style={{ color: P.text3, fontSize: 14 }}>#</span>
              <span style={{ color: P.text1, fontSize: 12, fontWeight: 600 }}>general</span>
            </div>
            {/* No banner */}
            <div style={{
              padding: '20px 12px', borderBottom: `1px solid ${P.border}`,
              textAlign: 'center', background: 'rgba(6,182,212,0.02)',
            }}>
              <div style={{ fontSize: 22, marginBottom: 5 }}>✓</div>
              <div style={{ color: P.text2, fontSize: 11.5, fontWeight: 500 }}>You're all caught up!</div>
              <div style={{ color: P.text4, fontSize: 10, marginTop: 3 }}>WhatYouMissed not mounted — no DOM output</div>
            </div>
            <p style={{ color: P.text4, fontSize: 9.5, margin: '6px 2px 0' }}>
              Guard: <code style={{ color: '#67e8f9', fontSize: 9.5 }}>unreadMessages.length === 0</code> → component returns null.
            </p>
          </Card>

          {/* State 4 – Dismissed */}
          <Card label="4 · Dismissed — user clicked ×" color="#fb923c">
            {/* Fake channel header */}
            <div style={{
              background: P.surface, borderBottom: `1px solid ${P.border}`,
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 7,
              borderRadius: '6px 6px 0 0',
            }}>
              <span style={{ color: P.text3, fontSize: 14 }}>#</span>
              <span style={{ color: P.text1, fontSize: 12, fontWeight: 600 }}>general</span>
            </div>
            {/* No banner — messages start immediately */}
            <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${P.border}` }}>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8,
              }}>
                <img src={avs[0]} alt="" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <span style={{ color: P.text1, fontSize: 11, fontWeight: 600 }}>nafisa</span>
                  <span style={{ color: P.text4, fontSize: 9.5, marginLeft: 7 }}>Today at 9:04 AM</span>
                  <p style={{ color: P.text2, fontSize: 11, margin: '2px 0 0' }}>Hey team, let's sync after standup!</p>
                </div>
              </div>
            </div>
            <p style={{ color: P.text4, fontSize: 9.5, margin: '6px 2px 0' }}>
              Parent sets <code style={{ color: '#67e8f9', fontSize: 9.5 }}>showWYM=false</code> on dismiss. Messages begin directly below channel header.
            </p>
          </Card>
        </div>

        {/* ── Spec panel ── */}
        <SpecPanel
          items={[
            { n: 1, name: 'Left stripe',    value: 'border-left: 3px solid rgba(6,182,212,0.5)' },
            { n: 2, name: 'Banner bg',      value: 'background: rgba(6,182,212,0.04)' },
            { n: 3, name: 'WYM label',      value: 'text-xs · font-semibold · text-[#06b6d4]' },
            { n: 4, name: 'Jump btn',       value: 'px-2 py-0.5 · text-xs · hover:bg-[#06b6d4]/10' },
            { n: 5, name: '▾ toggle',       value: 'p-1 · rounded · text-[#475569] · hover:bg-white/5' },
            { n: 6, name: '× dismiss',      value: 'p-1 · rounded · text-[#334155] · hover:text-[#64748b]' },
            { n: 7, name: 'Summary text',   value: 'text-xs · text-[#64748b] · leading-relaxed · px-4 pb-3' },
            { n: 8, name: 'Mark-as-read',   value: 'text-xs · text-[#334155] · hover:text-[#475569] · mt-2' },
            { n: 9, name: 'Empty guard',    value: 'Component not mounted · no DOM output produced' },
          ]}
          resp={{
            mobile: [
              'Banner spans full message-area width — no sidebar offset on mobile',
              'Avatar stack truncates to 2 if viewport < 360 px',
              'All action buttons always visible — never hidden on small screens',
            ],
            desktop: [
              'Banner sits within flex-1 chat column (excludes 256 px sidebar)',
              'Wider container gives ~60ch summary text — optimal readability',
              'No layout change vs mobile — same component in wider container',
            ],
          }}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SLIDE 3 — MANUAL AI SUMMARY
──────────────────────────────────────────────────────────────────────────── */
function ManualSummarySlide() {
  const Presets = ({ active }: { active: number }) => (
    <div style={{ padding: '9px 16px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 7 }}>
      {['Last 30 min', 'Last hour', 'Last 3 hours'].map((l, i) => (
        <button key={l} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
          border: `1px solid ${i === active ? P.accent + '66' : P.border}`,
          background: i === active ? P.accentDim : 'transparent',
          color: i === active ? P.accent : P.text3,
        }}>
          <Clock size={11} />{l}
        </button>
      ))}
    </div>
  );

  const ModalShell = ({ children, errorBorder = false }: { children: React.ReactNode; errorBorder?: boolean }) => (
    <div style={{
      background: P.sidebar,
      border: `1px solid ${errorBorder ? 'rgba(248,113,113,0.3)' : P.border}`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${P.border}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Sparkles size={14} color={errorBorder ? '#f87171' : P.accent} />
          <span style={{ color: P.text1, fontWeight: 600, fontSize: 13 }}>AI Summary</span>
        </div>
        <button style={{ padding: 5, borderRadius: 7, border: 'none', background: 'transparent', color: P.text3, cursor: 'pointer' }}>
          <X size={14} />
        </button>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '16px 32px 16px', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      <FeatureHero
        icon={Sparkles}
        title="Manual AI Summary"
        desc="Portal-rendered modal that generates a structured conversation summary for a user-selected time window. Has loading, empty-range, success, and error states. Trigger is the Sparkles button in the MessageInput toolbar."
        usedIn="/components/messaging/ManualSummary.tsx  ·  MessageArea toolbar  ·  createPortal → document.body"
      />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '6px 11px',
        background: P.card, border: `1px solid ${P.border}`, borderRadius: 7,
      }}>
        <span style={{ color: P.text4, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scope:</span>
        <span style={{ color: P.text2, fontSize: 11 }}>Independent user story — core summary feature. What You Missed depends on this and reuses the same logic.</span>
      </div>

      <div style={{
        flex: 1, overflow: 'hidden', marginTop: 14,
        display: 'grid', gridTemplateColumns: '1fr 295px', gap: 22,
      }}>
        {/* ── Left: compact top row + full success bottom ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

          {/* Top row: 4 compact state cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, flexShrink: 0 }}>

            {/* Trigger button */}
            <Card label="0 · Trigger — channel header btn" color={P.text3}>
              <Ann n={1} top={18} right={16} />
              {/* Channel header bar — faithful recreation */}
              <div style={{
                background: P.surface,
                border: `1px solid ${P.border}`,
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                {/* Left: channel identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: P.accentDim,
                    border: `1px solid rgba(6,182,212,0.2)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: P.accent, fontSize: 12, fontWeight: 700 }}>#</span>
                  </div>
                  <span style={{ color: P.text1, fontSize: 12, fontWeight: 600 }}>general</span>
                  <span style={{ color: P.text3, fontSize: 10 }}>· Room</span>
                </div>

                {/* Right: Summarize button (the actual trigger) */}
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
                  background: P.accentDim,
                  border: `1px solid rgba(6,182,212,0.2)`,
                  color: P.accent,
                  fontSize: 11, fontWeight: 500,
                  boxShadow: `0 0 0 2px ${P.accent}18`,
                  flexShrink: 0,
                }}>
                  <Sparkles size={12} color={P.accent} />
                  Summarize
                </button>
              </div>

              <p style={{ color: P.text4, fontSize: 9, margin: '6px 1px 0', lineHeight: 1.5 }}>
                Sits in MessageArea header — right side.<br />
                Hidden when <code style={{ color: '#67e8f9', fontSize: 9 }}>channelMessages.length === 0</code>
              </p>
            </Card>

            {/* Loading */}
            <Card label="1 · Generating / loading" color="#a78bfa">
              <Ann n={2} top={56} left="calc(50% - 8px)" />
              <ModalShell>
                <Presets active={2} />
                <div style={{
                  padding: '28px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 20, height: 20,
                    border: `2px solid ${P.border}`, borderTop: `2px solid ${P.accent}`,
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ color: P.text2, fontSize: 11.5 }}>Analysing last 3 hours…</span>
                </div>
                <div style={{
                  padding: '8px 14px', borderTop: `1px solid ${P.border}`,
                  background: P.surface, display: 'flex', justifyContent: 'flex-end',
                }}>
                  <button style={{ padding: '5px 14px', background: P.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>Done</button>
                </div>
              </ModalShell>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </Card>

            {/* Empty range */}
            <Card label="2 · Empty time range" color="#fb923c">
              <Ann n={3} top={50} left="calc(50% - 8px)" />
              <ModalShell>
                <Presets active={0} />
                <div style={{ padding: '24px 14px', textAlign: 'center' }}>
                  <AlertCircle size={26} color={P.text4} style={{ display: 'block', margin: '0 auto 8px' }} />
                  <div style={{ color: P.text2, fontSize: 12, fontWeight: 500, marginBottom: 3 }}>No messages in this range</div>
                  <div style={{ color: P.text3, fontSize: 10.5 }}>Try a wider range above</div>
                </div>
                <div style={{ padding: '8px 14px', borderTop: `1px solid ${P.border}`, background: P.surface, display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ padding: '5px 14px', background: P.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>Done</button>
                </div>
              </ModalShell>
            </Card>

            {/* Error */}
            <Card label="3 · Generation failed" color="#f87171">
              <Ann n={4} top={44} left="calc(50% - 8px)" />
              <ModalShell errorBorder>
                <div style={{ padding: '28px 14px', textAlign: 'center' }}>
                  <div style={{
                    width: 38, height: 38,
                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 9px',
                  }}>
                    <AlertCircle size={18} color="#f87171" />
                  </div>
                  <div style={{ color: '#f87171', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Failed to generate</div>
                  <div style={{ color: P.text3, fontSize: 10.5, marginBottom: 10 }}>An error occurred.</div>
                  <button style={{ padding: '5px 14px', background: P.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>Try again</button>
                </div>
                <div style={{ padding: '8px 14px', borderTop: `1px solid ${P.border}`, background: P.surface, display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ padding: '5px 14px', background: P.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>Done</button>
                </div>
              </ModalShell>
            </Card>
          </div>

          {/* Bottom: full success state with overflow fade */}
          <Card label="4 · Success — full summary" color="#34d399" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <Ann n={5}  top={18}  right={18} />
            <Ann n={6}  top={80}  left={18} />
            <Ann n={7}  top={160} left={18} />
            <Ann n={8}  top={230} left={18} />
            <Ann n={9}  top={285} left={18} />
            <Ann n={10} top={335} left={18} />

            <ModalShell>
              <Presets active={2} />
              {/* Body */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[
                    { label: 'Messages',     value: 18, Icon: MessageSquare },
                    { label: 'Participants', value: 4,  Icon: Users         },
                    { label: 'Questions',    value: 2,  Icon: AlertCircle   },
                    { label: 'Decisions',    value: 1,  Icon: TrendingUp    },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: P.text3, fontSize: 9.5, marginBottom: 4 }}>
                        <Icon size={10} />{label}
                      </div>
                      <div style={{ color: P.text1, fontSize: 20, fontWeight: 700 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Overview */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <Sparkles size={12} color={P.accent} />
                    <span style={{ color: P.text1, fontWeight: 600, fontSize: 12 }}>Overview</span>
                    <span style={{ color: P.text4, fontSize: 10 }}>Mar 2, 2026  9:00 AM – 12:00 PM</span>
                  </div>
                  <div style={{
                    background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)',
                    borderRadius: 10, padding: '10px 12px',
                  }}>
                    <p style={{ color: P.text2, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                      Nafisa is working on the user system including registration, login, and profiles. Ashraf is handling servers with creating, deleting, and settings. James is working on text channels with permissions. Elvis and Salma are working on messaging features including real-time chat and emoji support.
                    </p>
                  </div>
                </div>

                {/* Key Topics */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <TrendingUp size={12} color={P.accent} />
                    <span style={{ color: P.text1, fontWeight: 600, fontSize: 12 }}>Key Topics</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['user system', 'servers', 'text channels', 'messaging', 'emoji picker', 'meeting planning'].map(t => (
                      <span key={t} style={{
                        background: 'rgba(6,182,212,0.1)', color: P.accent,
                        padding: '4px 10px', borderRadius: 20, fontSize: 10.5,
                        fontWeight: 500, border: '1px solid rgba(6,182,212,0.25)',
                      }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Most Active */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Users size={12} color={P.accent} />
                    <span style={{ color: P.text1, fontWeight: 600, fontSize: 12 }}>Most Active</span>
                  </div>
                  {[{ name: 'nafisa', count: 7, pct: 39 }, { name: 'salma', count: 5, pct: 28 }].map((u, i) => (
                    <div key={i} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: '9px 12px', marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                          <span style={{ color: P.text1, fontSize: 11, fontWeight: 500 }}>{u.name}</span>
                        </div>
                        <span style={{ color: P.text3, fontSize: 10.5 }}>{u.count} msgs, {u.pct}%</span>
                      </div>
                      <div style={{ background: P.bg, borderRadius: 99, height: 4 }}>
                        <div style={{ background: `linear-gradient(90deg,${P.accent},#0891b2)`, height: '100%', width: `${u.pct}%`, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Message */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <AlertCircle size={12} color={P.accent} />
                    <span style={{ color: P.text1, fontWeight: 600, fontSize: 12 }}>Key Messages</span>
                  </div>
                  <div style={{ background: P.card, borderLeft: `4px solid ${P.accent}`, border: `1px solid ${P.border}`, borderRadius: 10, padding: '9px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=nafisa" alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                      <span style={{ color: P.text1, fontSize: 11, fontWeight: 500 }}>nafisa</span>
                      <span style={{ color: P.text3, fontSize: 9.5 }}>10:32 AM</span>
                    </div>
                    <p style={{ color: P.text2, fontSize: 11, margin: 0 }}>📢 Hey team, please review the project roadmap in the dev channel!</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '10px 16px', borderTop: `1px solid ${P.border}`,
                background: P.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
              }}>
                <span style={{ color: P.text4, fontSize: 10.5 }}>Showing last 3 hours of conversation</span>
                <button style={{ padding: '5px 14px', background: P.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>Done</button>
              </div>
            </ModalShell>

            {/* Fade overlay — indicates content above is clipped */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
              background: `linear-gradient(to bottom, transparent, ${P.canvas})`,
              pointerEvents: 'none', borderRadius: '0 0 12px 12px',
            }} />
          </Card>
        </div>

        {/* ── Spec panel ── */}
        <SpecPanel
          items={[
            { n: 1,  name: 'Trigger btn',     value: 'bg-[#06b6d4]/15 · border-[#06b6d4]/50 · active glow' },
            { n: 2,  name: 'Spinner',          value: 'size-6 · border-b-2 border-[#06b6d4] · animate-spin' },
            { n: 3,  name: 'Empty icon',       value: 'AlertCircle · size-10 · text-[#334155]' },
            { n: 4,  name: 'Error border',     value: 'border rgba(248,113,113,0.3) on modal shell' },
            { n: 5,  name: 'Active preset',    value: 'bg-[#06b6d4]/15 · border-[#06b6d4]/40 · text-[#06b6d4]' },
            { n: 6,  name: 'Stats card',       value: 'bg-[#111e30] · rounded-xl · p-3.5 · grid-cols-4' },
            { n: 7,  name: 'Overview block',   value: 'bg-[#06b6d4]/5 · border-[#06b6d4]/20 · rounded-xl · p-4' },
            { n: 8,  name: 'Topic chip',       value: 'bg-[#06b6d4]/10 · rounded-full · border-[#06b6d4]/25' },
            { n: 9,  name: 'Activity bar',     value: 'bg-[#060c18] h-1.5 · fill gradient cyan→#0891b2' },
            { n: 10, name: 'Key msg border',   value: 'border-l-4 border-l-[#06b6d4] · bg-[#111e30]' },
          ]}
          resp={{
            mobile: [
              'Modal: w-full inside p-4 — ~8 px edge gap each side',
              'Stats grid: grid-cols-2 (2×2) not grid-cols-4',
              'Time presets wrap if needed (flex-wrap)',
              'Body scrolls with overflow-y-auto inside max-h-[85vh]',
            ],
            desktop: [
              'Modal: max-w-2xl centred — never wider than 672 px',
              'Stats: grid-cols-4 in one row',
              'All preset chips fit in one line without wrapping',
              'Focus trap: Tab/Shift+Tab cycles within dialog only',
            ],
          }}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   MAIN PAGE — header + slide switcher
──────────────────────────────────────────────────────────────────────────── */
const SLIDES = [
  { id: 'search',  label: 'Server Search',     icon: Search,   Component: ServerSearchSlide  },
  { id: 'wym',     label: 'What You Missed',   icon: Sparkles, Component: WhatYouMissedSlide },
  { id: 'summary', label: 'Manual AI Summary', icon: Clock,    Component: ManualSummarySlide },
] as const;

type SlideId = typeof SLIDES[number]['id'];

export default function MockupsPage() {
  const [active, setActive] = useState<SlideId>('search');
  const idx   = SLIDES.findIndex(s => s.id === active);
  const Slide = SLIDES[idx].Component;

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: P.canvas, fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* ── Header bar ── */}
      <div style={{
        height: 50, flexShrink: 0,
        background: P.surface, borderBottom: `1px solid ${P.border}`,
        display: 'flex', alignItems: 'center', paddingInline: 32, gap: 14,
        zIndex: 50,
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: `linear-gradient(135deg,${P.accent},#0891b2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={14} color="#fff" />
          </div>
          <div>
            <div style={{ color: P.text1, fontSize: 13, fontWeight: 700, lineHeight: 1 }}>Anaphor</div>
            <div style={{ color: P.text4, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Design Spec</div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: P.border, margin: '0 4px' }} />

        {/* Slide tabs */}
        <div style={{ display: 'flex', gap: 3 }}>
          {SLIDES.map(({ id, label, icon: Icon }, i) => {
            const isActive = id === active;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 11.5, fontWeight: isActive ? 600 : 400,
                  background: isActive ? P.accentDim : 'transparent',
                  color: isActive ? P.accent : P.text3,
                  outline: isActive ? `1px solid ${P.accentLine}` : 'none',
                  transition: 'all 0.14s',
                }}
              >
                <Icon size={12} />
                <span style={{ color: P.text4, fontSize: 10, marginRight: 2 }}>{i + 1}.</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* Slide counter */}
        <div style={{ display: 'flex', gap: 5, marginLeft: 4 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 18 : 6, height: 6,
              borderRadius: 99, transition: 'all 0.2s',
              background: i === idx ? P.accent : P.border,
            }} />
          ))}
        </div>

        {/* Prev / Next */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {['← Prev', 'Next →'].map((label, dir) => {
            const disabled = dir === 0 ? idx === 0 : idx === SLIDES.length - 1;
            return (
              <button
                key={label}
                disabled={disabled}
                onClick={() => setActive(SLIDES[idx + (dir === 0 ? -1 : 1)].id)}
                style={{
                  padding: '5px 11px', borderRadius: 7, border: `1px solid ${P.border}`,
                  background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: 11, color: disabled ? P.text4 : P.text2,
                  transition: 'all 0.14s',
                }}
              >{label}</button>
            );
          })}
        </div>

        {/* Static badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 20, padding: '3px 10px', marginLeft: 10,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.ann, display: 'inline-block' }} />
          <span style={{ fontSize: 10.5, color: P.ann, fontWeight: 600 }}>Static · Read Only</span>
        </div>

        <a href="/channels" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 11px', background: P.card, border: `1px solid ${P.border}`,
          borderRadius: 7, color: P.text2, fontSize: 11, textDecoration: 'none',
        }}>
          <ExternalLink size={11} /> Live App
        </a>
      </div>

      {/* ── Slide canvas (fills remaining viewport) ── */}
      <div style={{
        flex: 1, overflow: 'hidden',
        backgroundImage: `radial-gradient(circle, #1a2d45 1px, transparent 1px)`,
        backgroundSize: '26px 26px',
      }}>
        <Slide />
      </div>
    </div>
  );
}