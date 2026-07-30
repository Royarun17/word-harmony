import React from 'react';
import styles from './gameplay.module.css';

// 1:1 translation of the Lovable reference's ArenaBackground.tsx — every
// gradient, blur, and transform value matched exactly, just expressed as
// plain CSS instead of Tailwind arbitrary-value classes.
function ArenaBackground() {
  return (
    <div className={styles.arenaBg} aria-hidden>
      <div className={styles.arenaBaseDepth} />
      <div className={styles.arenaNeuralGrid} />
      <div className={styles.arenaLightPoolCenter} />
      <div className={styles.arenaLightPoolLeft} />
      <div className={styles.arenaLightPoolRight} />
      <div className={styles.arenaParticles} />
      <div className={styles.arenaFog} />
      <div className={styles.arenaVignette} />
    </div>
  );
}

export default React.memo(ArenaBackground);
