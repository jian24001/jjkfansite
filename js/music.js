/* music.js - background music for the whole site (loaded by every page).
   Plays one looping track per page, with a small MUSIC button (bottom-right).
   Browsers never allow sound to start by itself, so the music begins when
   you press the button (or tap/click anywhere after turning it on once). */
(function () {
  // ---- EDIT HERE: which page plays which song --------------------------
  var TRACKS = {
    'index.html':      'audio/Aizo.mp3',      // page 1 (home)
    'story.html':      'audio/Aizo.mp3',      // page 2
    'arcs.html':       'audio/Aizo.mp3',      // page 3
    'characters.html': 'audio/startinst.mp3', // page 4
    'villains.html':   'audio/instvil.mp3',   // page 5
    'techniques.html': 'audio/instvil.mp3',   // page 6
    'world.html':      'audio/instvil.mp3',   // page 7
    'anime.html':      'audio/instvil.mp3',   // page 8
    'manga.html':      'audio/instvil.mp3',   // page 9
    'fanhub.html':     'audio/instvil.mp3'    // page 10
  };
  var DEFAULT_TRACK = 'audio/instvil.mp3';
  var VOLUME = 0.4;                          // 0 (silent) to 1 (full)
  // ----------------------------------------------------------------------

  var page = location.pathname.split('/').pop();
  if (page === '') { page = 'index.html'; }
  var src = TRACKS[page] || DEFAULT_TRACK;

  // small helpers so the site still works if the browser blocks storage
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  var audio = new Audio(src);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = 'metadata';   // only fetch the song when it is played

  var button = document.createElement('button');
  button.className = 'music-btn';
  button.type = 'button';
  document.body.appendChild(button);

  var wantsMusic = load('jjkMusic') === 'on';   // did the visitor turn music on earlier?

  function updateButton() {
    if (!audio.paused) { button.textContent = '\u266A Music: On'; }
    else if (wantsMusic) { button.textContent = '\u266A Tap to play'; }
    else { button.textContent = '\u266A Music: Off'; }
    button.setAttribute('aria-pressed', String(!audio.paused));
  }

  function play() {
    var attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch(function () { waitForTap(); });   // blocked: try again on first tap
    }
  }

  var waiting = false;
  function waitForTap() {
    updateButton();
    if (waiting) { return; }
    waiting = true;
    function go() {
      document.removeEventListener('click', go);
      document.removeEventListener('keydown', go);
      document.removeEventListener('touchend', go);
      waiting = false;
      if (wantsMusic && audio.paused) { play(); }
    }
    document.addEventListener('click', go);
    document.addEventListener('keydown', go);
    document.addEventListener('touchend', go);
  }

  button.addEventListener('click', function () {
    if (audio.paused) { wantsMusic = true; save('jjkMusic', 'on'); play(); }
    else { wantsMusic = false; save('jjkMusic', 'off'); audio.pause(); }
    updateButton();
  });

  audio.addEventListener('play', updateButton);
  audio.addEventListener('pause', updateButton);
  audio.addEventListener('error', function () {
    button.textContent = '\u266A Music unavailable';
    button.disabled = true;
  });

  // continue from where the song stopped on the previous page
  audio.addEventListener('loadedmetadata', function () {
    if (load('jjkMusicSrc') === src) {
      var t = parseFloat(load('jjkMusicTime'));
      var ts = parseFloat(load('jjkMusicTs'));
      if (load('jjkMusicPlaying') === '1' && ts) { t += (Date.now() - ts) / 1000; }
      if (t > 0) { audio.currentTime = t % audio.duration; }
    }
  });
  window.addEventListener('pagehide', function () { save('jjkMusicTime', String(audio.currentTime)); save('jjkMusicTs', String(Date.now())); save('jjkMusicPlaying', audio.paused ? '0' : '1'); });
  var lastSecond = -1;
  audio.addEventListener('timeupdate', function () {
    var s = Math.floor(audio.currentTime);
    if (s !== lastSecond) { lastSecond = s; save('jjkMusicSrc', src); save('jjkMusicTime', String(audio.currentTime)); save('jjkMusicTs', String(Date.now())); save('jjkMusicPlaying', audio.paused ? '0' : '1'); }
  });

  // pause the music while a video on the page (the anime trailer) is playing
  var video = document.querySelector('video');
  if (video) {
    var resume = false;
    video.addEventListener('play', function () { resume = !audio.paused; audio.pause(); });
    video.addEventListener('pause', function () { if (resume && wantsMusic) { audio.play(); } resume = false; });
    video.addEventListener('ended', function () { if (resume && wantsMusic) { audio.play(); } resume = false; });
  }

  updateButton();
  if (wantsMusic) { play(); }
})();
