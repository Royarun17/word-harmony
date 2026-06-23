import { io } from 'socket.io-client';

// Auto-detect: use current URL on Replit, localhost for local dev
const URL = window.location.hostname === 'localhost'
  ? 'http://localhost:4000'
  : window.location.origin;

const socket = io(URL, { autoConnect: false });
export default socket;
