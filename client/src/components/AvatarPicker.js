import React, { useRef } from 'react';

// Preset cartoon-style avatars using emoji on colored backgrounds — no external assets needed
export const PRESET_AVATARS = [
  { id: 'fox',     emoji: '🦊', color: '#E8743B' },
  { id: 'owl',     emoji: '🦉', color: '#8E6C88' },
  { id: 'cat',     emoji: '🐱', color: '#4A90A4' },
  { id: 'panda',   emoji: '🐼', color: '#2D2D2D' },
  { id: 'lion',    emoji: '🦁', color: '#D4A017' },
  { id: 'koala',   emoji: '🐨', color: '#7B8FA1' },
  { id: 'penguin', emoji: '🐧', color: '#3A4750' },
  { id: 'frog',    emoji: '🐸', color: '#6B9B6E' },
  { id: 'rabbit',  emoji: '🐰', color: '#C97B84' },
  { id: 'bear',    emoji: '🐻', color: '#8B5A3C' },
  { id: 'tiger',   emoji: '🐯', color: '#E8964B' },
  { id: 'unicorn', emoji: '🦄', color: '#B07BC9' },
];

// Resize + compress an uploaded image client-side before sending over the socket,
// so we never broadcast huge base64 strings to every player
function resizeImage(file, maxSize = 160) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height *= maxSize / width; width = maxSize; }
        } else {
          if (height > maxSize) { width *= maxSize / height; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AvatarPicker({ value, onChange }) {
  const fileInputRef = useRef(null);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Image too large — please choose a photo under 8MB.');
      return;
    }
    try {
      const resized = await resizeImage(file);
      onChange({ type: 'photo', value: resized });
    } catch (err) {
      console.error('Avatar resize failed', err);
      alert('Could not process that image. Try another one.');
    }
  }

  const isPhoto = value?.type === 'photo';
  const isPreset = value?.type === 'preset';

  return (
    <div>
      {/* Current selection preview */}
      <div className="flex items-center gap-12" style={{ marginBottom: 16 }}>
        <AvatarDisplay avatar={value} size={64} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            {isPhoto ? 'Your photo' : isPreset ? `${value.value} avatar` : 'No avatar selected'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline btn-sm"
            style={{ marginTop: 6 }}
          >
            📷 Upload Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Preset grid */}
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>OR PICK AN AVATAR</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {PRESET_AVATARS.map(preset => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange({ type: 'preset', value: preset.id })}
            style={{
              width: '100%', aspectRatio: '1', borderRadius: '50%',
              background: preset.color,
              border: isPreset && value.value === preset.id ? '3px solid var(--gold)' : '3px solid transparent',
              fontSize: 22, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.15s ease',
              transform: isPreset && value.value === preset.id ? 'scale(1.1)' : 'scale(1)',
            }}
            aria-label={`Choose ${preset.id} avatar`}
          >
            {preset.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// Reusable avatar renderer — used in picker, player list, and gameplay
export function AvatarDisplay({ avatar, size = 40, fallbackLetter = '?' }) {
  if (avatar?.type === 'photo' && avatar.value) {
    return (
      <img
        src={avatar.value}
        alt="avatar"
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid var(--border)'
        }}
      />
    );
  }
  if (avatar?.type === 'preset') {
    const preset = PRESET_AVATARS.find(p => p.id === avatar.value);
    if (preset) {
      return (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: preset.color, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: size * 0.55, flexShrink: 0,
        }}>
          {preset.emoji}
        </div>
      );
    }
  }
  // Fallback — colored circle with initial letter (current default style)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--ink)', color: 'var(--white)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
    }}>
      {fallbackLetter}
    </div>
  );
}
