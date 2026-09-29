// RASAD website: language toggle + video player. No trackers, no third-party code.
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'rasad-lang';

  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage may be blocked */ }
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  var browser = (navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';
  setLang(saved === 'ar' || saved === 'en' ? saved : browser);

  document.getElementById('lang-toggle').addEventListener('click', function () {
    setLang(root.getAttribute('data-lang') === 'ar' ? 'en' : 'ar');
  });

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Video player
  var FILES = {
    '00': 'RASAD_00_Overview.mp4',
    '01': 'RASAD_01_Cybersecurity.mp4',
    '02': 'RASAD_02_Information_Security.mp4',
    '03': 'RASAD_03_Risk_Assessment.mp4',
    '04': 'RASAD_04_Digital_Forensics.mp4',
    '05': 'RASAD_05_Security_Consulting.mp4'
  };
  var dialog = document.getElementById('player');
  var video = document.getElementById('player-video');

  function open(id) {
    if (!FILES[id]) return;
    video.poster = 'assets/img/poster_' + id + '.jpg';
    video.src = 'assets/video/' + FILES[id];
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: user presses play */ });
  }
  function close() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (dialog.open) dialog.close();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-video]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-video')); }
  });
  document.getElementById('player-close').addEventListener('click', close);
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
  dialog.addEventListener('close', function () { video.pause(); });
})();
