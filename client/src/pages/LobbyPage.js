<div className="lobby-left">
              {/* Profile row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                <div onClick={() => onShowProfile && onShowProfile()} style={{ cursor: 'pointer' }}>
                  <PlayerAvatar name={profile?.username || 'Player'} seed={profile?.username} score={profile?.totalPoints} size="md" />
                </div>
                <span className="chip chip-accent" style={{ paddingLeft: 6 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 99, background: 'linear-gradient(140deg, var(--accent), var(--accent-2))', display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--accent-ink)' }}>⚡</span>
                  LVL {profile?.level || 1}
                </span>
              </div>
            </div>

            <div className="lobby-right">
              {/* Mode cards */}
              <div className="lobby-section-gap" style={{ marginBottom: 32 }}>
                <SectionHeader eyebrow="Choose a mode" title="Play" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Object.entries(MODES).map(([key, m]) => (
                    <button key={key} onClick={() => { setMode(key); setShowPopup(true); }} className="panel tap-target mode-card" type="button"
                      style={{
                        padding: 18, textAlign: 'left', cursor: 'pointer', border: 'none',
                        outline: selectedMode === key ? '2px solid var(--accent)' : '2px solid transparent',
                        boxShadow: selectedMode === key ? 'var(--glow-accent)' : 'none',
                        background: 'linear-gradient(165deg, oklch(from var(--surface-2) calc(l + .02) c h), var(--surface))',
                        transition: 'transform 140ms, box-shadow 200ms, outline 200ms',
                        position: 'relative', overflow: 'hidden',
                      }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <span aria-hidden style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: m.accent ? 'radial-gradient(circle, var(--accent), transparent 70%)' : 'radial-gradient(circle, var(--surface-3), transparent 70%)', opacity: 0.35, pointerEvents: 'none' }}/>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', marginBottom: 14, fontSize: 20, position: 'relative',
                        background: m.accent ? 'radial-gradient(circle at 30% 25%, oklch(from var(--accent) calc(l + .12) c h), var(--accent) 45%, var(--accent-2) 100%)' : 'linear-gradient(160deg, var(--surface-3), var(--surface-2))',
                        boxShadow: m.accent ? 'inset 0 2px 4px oklch(1 0 0 / .35), inset 0 -4px 8px oklch(0 0 0 / .25), var(--glow-accent)' : 'inset 0 1px 0 oklch(1 0 0 / .06)',
                        color: m.accent ? 'var(--accent-ink)' : 'var(--ink)',
                      }}>{m.icon}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', position: 'relative' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, position: 'relative' }}>{m.desc}</div>
                      {m.accent && <span className="chip chip-accent" style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, padding: '2px 8px' }}>POPULAR</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick play */}
              <div className="panel lobby-section-gap" style={{ padding: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>QUICK PLAY</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Jump into a lobby</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Medium · Syntax · 5 rounds</div>
                  </div>
                  <button onClick={() => { setMode('syntax'); setShowPopup(true); }} className="btn-cta tap-target" style={{ whiteSpace: 'nowrap' }}>▶ PLAY</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={onShowTutorial} className="btn-ghost tap-target">📖 Tutorial</button>
                  <button onClick={() => { setMode('syntax'); setStep('play'); setTab('join'); }} className="btn-ghost tap-target">🔗 Join</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
