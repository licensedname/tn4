// js/script.js
// Handles ambient audio, sound toggle, and compass navigation.

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('ambientAudio');
  const soundToggle = document.getElementById('soundToggle');
  const dirs = document.querySelectorAll('.dir');
  const THEME_KEY = 'front-audio-enabled';

  // Try to restore saved sound preference
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null }
  let audioEnabled = saved === 'true';

  function setSoundState(enabled){
    audioEnabled = !!enabled;
    if(audioEnabled){
      // attempt to play
      audio.play().catch(()=>{});
      soundToggle.classList.remove('sound-off');
      soundToggle.classList.add('sound-on');
      soundToggle.setAttribute('aria-pressed','true');
      soundToggle.textContent = '🔊';
    } else {
      try{ audio.pause(); audio.currentTime = 0 }catch(e){}
      soundToggle.classList.remove('sound-on');
      soundToggle.classList.add('sound-off');
      soundToggle.setAttribute('aria-pressed','false');
      soundToggle.textContent = '🔈';
    }
    try{ localStorage.setItem(THEME_KEY, String(audioEnabled)); }catch(e){}
  }

  // Attempt to start audio after first user interaction if disabled
  function initAutoplayOnInteraction(){
    if(audioEnabled) return;
    const onFirst = () => {
      // try play once
      try{ audio.play().then(()=>{ setSoundState(true); }) }catch(e){}
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
    };
    window.addEventListener('pointerdown', onFirst, {once:true});
    window.addEventListener('keydown', onFirst, {once:true});
  }

  // Setup toggle button
  soundToggle.addEventListener('click', (e)=>{
    e.preventDefault();
    setSoundState(!audioEnabled);
  });

  // Initialize state
  setSoundState(audioEnabled);
  initAutoplayOnInteraction();

  // (logout button removed) any logout logic should be handled by server-side flows

  // Compass interactions
  const routes = { north: 'main.html', east: 'Tierlist.html', south: 'contact.html', west: 'https://www.roblox.com/communities/5542605/floob' };
  // Initialize compass directions (no glyph cycling)
  dirs.forEach(dir => {
    const which = dir.dataset.dir;
    if(!which) return;

    // ensure data-letter is present and visible
    const letter = (dir.dataset.letter || which[0].toUpperCase());
    dir.dataset.letter = letter;
    dir.textContent = letter;

    dir.addEventListener('click', (ev)=>{
      // If this anchor is intended to open in a new tab (external link), allow default behavior
      if(dir.getAttribute('target') === '_blank') return;
      ev.preventDefault();
      // small click animation that preserves the element's translate() so it doesn't shift
      const base = (which === 'north' || which === 'south') ? 'translateX(-50%)' : 'translateY(-50%)';
      dir.animate([
        { transform: `${base} scale(1)` },
        { transform: `${base} scale(0.96)` }
      ], { duration: 140, fill: 'forwards' });
      setTimeout(()=>{
        const target = routes[which];
        if(typeof target === 'string' && /^https?:\/\//.test(target)){
          window.open(target, '_blank');
        } else {
          window.location.href = target;
        }
      }, 180);
    });

    // keyboard support
    dir.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' || ev.key === ' ') dir.click();
    });
  });

  // Allow play attempt if page was interacted with elsewhere
  document.body.addEventListener('pointerdown', ()=>{
    if(audioEnabled) return;
    try{ audio.play().then(()=>{ setSoundState(true) }).catch(()=>{}); }catch(e){}
  }, {once:true});

  // Global keyboard shortcuts: 'N' -> north, 'S' -> south
  window.addEventListener('keydown', (ev)=>{
    const key = ev.key.toLowerCase();
    if(key !== 'n' && key !== 's') return;
    // avoid triggering while typing in inputs
    const active = document.activeElement;
    if(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    const which = key === 'n' ? 'north' : 'south';
    const target = routes[which];
    if(typeof target === 'string' && /^https?:\/\//.test(target)){
      window.open(target, '_blank');
    } else {
      window.location.href = target;
    }
  });

});
