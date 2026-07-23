import React from 'react';
import { Dialog } from '../../SynapseComponents';

function ExitDialog({ open, onStay, onLeave }) {
  return (
    <Dialog open={open} onClose={onStay} title="Leave game?" tone="danger" footer={
      <>
        <button onClick={onStay} className="btn-ghost tap" style={{ flex: 1 }}>Stay</button>
        <button onClick={onLeave} className="btn-primary tap" style={{ flex: 1 }}>Leave</button>
      </>
    }>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🚪</div>
        Your spot will be held for 90 seconds.
      </div>
    </Dialog>
  );
}

export default React.memo(ExitDialog);
