import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/tabletop.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Dev-only screen previews (see src/dev/DevPreview.js). The require sits behind
// the NODE_ENV check so production builds drop it.
const preview = process.env.NODE_ENV === 'development'
  && new URLSearchParams(window.location.search).get('preview');

if (preview) {
  const DevPreview = require('./dev/DevPreview').default;
  root.render(<DevPreview screen={preview} />);
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
