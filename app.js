(function () {
  'use strict';

  var NAMES = { red: 'Red', blue: 'Blue', yellow: 'Yellow', green: 'Green', purple: 'Purple' };
  var AR = { red: 'أحمر', blue: 'أزرق', yellow: 'أصفر', green: 'أخضر', purple: 'بنفسجي' };

  var LEVELS = [
    {
      kind: 'finish',
      mission: 'Finish the necklace. Tap the bead that comes next.',
      unit: ['red', 'blue'],
      beads: ['red', 'blue', 'red', 'blue', 'red', 'blue', null, null, null, null],
      palette: ['red', 'blue', 'yellow'],
      hint: 'انظر للخرز: أحمر، أزرق، أحمر، أزرق… ماذا يأتي بعد ذلك؟',
      done: 'رائع! أكملت العقد 👏 القاعدة: أحمر، أزرق (A B).'
    },
    {
      kind: 'fix',
      mission: 'Oops! One bead is wrong. Tap it, then pick the right bead.',
      unit: ['yellow', 'yellow', 'green'],
      beads: ['yellow', 'yellow', 'green', 'yellow', 'yellow', 'green', 'yellow', 'green', 'green'],
      wrongAt: 7,
      palette: ['yellow', 'green', 'red'],
      done: 'ممتاز! صلّحت العقد 🛠️ القاعدة: أصفر، أصفر، أخضر (A A B).'
    },
    {
      kind: 'name',
      mission: 'Look at the necklace. What is its rule?',
      beads: ['red', 'yellow', 'blue', 'red', 'yellow', 'blue', 'red', 'yellow', 'blue'],
      answer: 'ABC',
      done: 'صحيح! 🎯 ثلاثة ألوان مختلفة تتكرر: A B C.'
    },
    {
      kind: 'make',
      mission: 'Make your own pattern! Tap 2 or 3 beads, then press Repeat!',
      palette: ['red', 'blue', 'yellow', 'green', 'purple'],
      done: 'واو! صنعت نمطك الخاص 🎉'
    }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    start: $('start'), game: $('game'), success: $('success'),
    stepNum: $('stepNum'), stars: $('stars'), mission: $('missionText'), feedback: $('feedback'),
    necklace: $('necklace'), palette: $('palette'), paletteBox: $('paletteBox'), paletteTitle: $('paletteTitle'),
    ruleBox: $('ruleBox'), unitBox: $('unitBox'), unit: $('unit'), repeatBtn: $('repeatBtn'), clearBtn: $('clearBtn'),
    nextBtn: $('nextBtn'), myNecklace: $('myNecklace')
  };

  var level = 0, beads = [], picked = -1, myUnit = [], locked = false, sentComplete = false;

  function beadEl(color) {
    var s = document.createElement('span');
    s.className = 'bead ' + color;
    return s;
  }

  function say(text, cls) {
    el.feedback.textContent = text;
    el.feedback.className = 'feedback' + (cls ? ' ' + cls : '');
  }

  function renderStars() {
    var html = '';
    for (var i = 0; i < LEVELS.length; i++) {
      html += '<span class="' + (i < level ? '' : 'off') + '">⭐</span>';
    }
    el.stars.innerHTML = html;
  }

  function nextEmpty() { return beads.indexOf(null); }

  function renderNecklace(target, list) {
    target.innerHTML = '';
    target.style.setProperty('--n', list.length);
    var next = list === beads ? nextEmpty() : -1;
    var L = LEVELS[level];
    list.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.dataset.i = i;
      if (c) {
        b.appendChild(beadEl(c));
        b.setAttribute('aria-label', 'Bead ' + (i + 1) + ': ' + NAMES[c]);
      } else {
        b.classList.add('empty');
        b.setAttribute('aria-label', 'Empty place ' + (i + 1));
        if (i === next) {
          b.classList.add('next');
          var q = document.createElement('span');
          q.className = 'qmark'; q.textContent = '?';
          b.appendChild(q);
        }
      }
      if (L && L.kind === 'fix' && target === el.necklace && !locked) {
        b.classList.add('tappable');
        if (i === picked) b.classList.add('picked');
      } else {
        b.tabIndex = -1;
      }
      target.appendChild(b);
    });
  }

  function renderPalette(colors, enabled) {
    el.palette.innerHTML = '';
    colors.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pal-btn';
      b.dataset.c = c;
      b.setAttribute('aria-label', NAMES[c] + ' bead');
      b.appendChild(beadEl(c));
      b.disabled = !enabled;
      el.palette.appendChild(b);
    });
  }

  function renderUnit() {
    el.unit.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.className = 'uslot';
      if (myUnit[i]) s.appendChild(beadEl(myUnit[i]));
      el.unit.appendChild(s);
    }
    el.repeatBtn.disabled = myUnit.length < 2;
  }

  function loadLevel() {
    var L = LEVELS[level];
    locked = false; picked = -1; myUnit = [];
    el.stepNum.textContent = 'Necklace ' + (level + 1) + ' of ' + LEVELS.length;
    el.mission.textContent = L.mission;
    say('');
    renderStars();
    el.nextBtn.hidden = true;
    el.ruleBox.hidden = L.kind !== 'name';
    el.unitBox.hidden = L.kind !== 'make';
    el.paletteBox.hidden = L.kind === 'name';
    Array.prototype.forEach.call(el.ruleBox.querySelectorAll('.rule-btn'), function (b) {
      b.classList.remove('wrong', 'right'); b.disabled = false;
    });

    if (L.kind === 'make') {
      beads = new Array(12).fill(null);
      el.paletteTitle.textContent = 'Tap beads to make your rule:';
      renderUnit();
      renderPalette(L.palette, true);
    } else {
      beads = L.beads.slice();
      if (L.kind === 'fix') {
        el.paletteTitle.textContent = 'First tap the wrong bead on the necklace.';
        renderPalette(L.palette, false);
      } else if (L.kind === 'finish') {
        el.paletteTitle.textContent = 'Tap a bead:';
        renderPalette(L.palette, true);
      }
    }
    renderNecklace(el.necklace, beads);
  }

  function levelDone() {
    locked = true;
    var L = LEVELS[level];
    say(L.done, 'good');
    level++;
    renderStars();
    Array.prototype.forEach.call(el.palette.querySelectorAll('button'), function (b) { b.disabled = true; });
    renderNecklace(el.necklace, beads);
    if (level < LEVELS.length) {
      el.nextBtn.hidden = false;
      el.nextBtn.focus();
    } else {
      setTimeout(finish, 1300);
    }
  }

  function finish() {
    el.game.hidden = true;
    el.success.hidden = false;
    renderNecklace(el.myNecklace, beads);
    if (!sentComplete) {
      sentComplete = true;
      try {
        window.parent.postMessage(
          { type: 'codez-learning-activity', version: 1, event: 'completed' },
          window.location.origin
        );
      } catch (e) { /* not in a frame */ }
    }
  }

  function shake(i) {
    var s = el.necklace.querySelector('[data-i="' + i + '"]');
    if (s) { s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
  }
  function pop(i) {
    var s = el.necklace.querySelector('[data-i="' + i + '"]');
    if (s) s.classList.add('pop');
  }

  // palette taps
  el.palette.addEventListener('click', function (e) {
    var btn = e.target.closest('.pal-btn');
    if (!btn || btn.disabled || locked) return;
    var c = btn.dataset.c;
    var L = LEVELS[level];

    if (L.kind === 'finish') {
      var i = nextEmpty();
      if (i < 0) return;
      var want = L.unit[i % L.unit.length];
      if (c === want) {
        beads[i] = c;
        renderNecklace(el.necklace, beads);
        pop(i);
        if (nextEmpty() < 0) levelDone();
        else say('أحسنت! ' + AR[c] + ' ✔️ كمّل…', 'good');
      } else {
        shake(i);
        say(L.hint, 'bad');
      }
    } else if (L.kind === 'fix') {
      if (picked < 0) return;
      var right = L.unit[picked % L.unit.length];
      if (c === right) {
        beads[picked] = c;
        var at = picked;
        picked = -1;
        renderNecklace(el.necklace, beads);
        pop(at);
        levelDone();
      } else {
        say('لا، القاعدة: أصفر، أصفر، أخضر. أي لون مكانه هنا؟', 'bad');
      }
    } else if (L.kind === 'make') {
      if (myUnit.length >= 3) {
        say('القاعدة فيها 3 خرزات بالكثير. اضغط Repeat!', 'bad');
        return;
      }
      myUnit.push(c);
      renderUnit();
      say(myUnit.length < 2 ? 'جميل! اختر خرزة أخرى.' : 'اضغط Repeat! لتكرار القاعدة، أو أضف خرزة ثالثة.', 'good');
    }
  });

  // necklace taps (fix level)
  el.necklace.addEventListener('click', function (e) {
    var s = e.target.closest('.slot');
    var L = LEVELS[level];
    if (!s || locked || L.kind !== 'fix') return;
    var i = Number(s.dataset.i);
    if (i === L.wrongAt) {
      picked = i;
      renderNecklace(el.necklace, beads);
      el.paletteTitle.textContent = 'Now pick the right bead:';
      renderPalette(L.palette, true);
      say('وجدتها! 🔎 الآن اختر الخرزة الصحيحة من الأسفل.', 'good');
    } else {
      shake(i);
      say('هذه الخرزة في مكانها الصحيح. اقرأ القاعدة: أصفر، أصفر، أخضر… أين الخطأ؟', 'bad');
    }
  });

  // rule buttons
  el.ruleBox.addEventListener('click', function (e) {
    var b = e.target.closest('.rule-btn');
    if (!b || locked) return;
    var L = LEVELS[level];
    if (b.dataset.rule === L.answer) {
      b.classList.add('right');
      Array.prototype.forEach.call(el.ruleBox.querySelectorAll('.rule-btn'), function (x) { x.disabled = true; });
      levelDone();
    } else {
      b.classList.add('wrong');
      say('عدّ الألوان قبل أن تتكرر: أحمر، أصفر، أزرق… كم لونًا مختلفًا في القاعدة؟', 'bad');
    }
  });

  el.clearBtn.addEventListener('click', function () {
    if (locked) return;
    myUnit = [];
    beads = new Array(12).fill(null);
    renderUnit();
    renderNecklace(el.necklace, beads);
    say('');
  });

  el.repeatBtn.addEventListener('click', function () {
    if (locked || myUnit.length < 2) return;
    var allSame = myUnit.every(function (c) { return c === myUnit[0]; });
    if (allSame) {
      say('كل الخرز بنفس اللون! اختر لونين مختلفين على الأقل حتى يصبح نمطًا.', 'bad');
      return;
    }
    locked = true;
    el.repeatBtn.disabled = true;
    var i = 0;
    (function step() {
      beads[i] = myUnit[i % myUnit.length];
      renderNecklace(el.necklace, beads);
      pop(i);
      i++;
      if (i < beads.length) setTimeout(step, 110);
      else { locked = false; levelDone(); }
    })();
  });

  el.nextBtn.addEventListener('click', function () { loadLevel(); });

  $('startBtn').addEventListener('click', function () {
    el.start.hidden = true;
    el.game.hidden = false;
    level = 0;
    loadLevel();
  });

  $('againBtn').addEventListener('click', function () {
    el.success.hidden = true;
    el.game.hidden = false;
    level = 0;
    loadLevel();
  });
})();
