"use strict";

// These builders simulate only the displayed examples, not arbitrary Python.
// Each frame stores state after the highlighted line has executed.
function py(value) {
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) return '[' + value.map(py).join(', ') + ']';
  if (typeof value === 'object') return '{' + Object.entries(value).map(([key, item]) => py(key) + ': ' + py(item)).join(', ') + '}';
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}
function program(code, cells = [], columns = 0) {
  const result = { code, cells, columns, frames: [] };
  result.record = (line, variables, output = [], current = -1, event = null) => {
    result.frames.push({ line, variables: structuredClone(variables), output: [...output], current, event });
  };
  return result;
}
const exhausted = ['Loop exhausted', 'Döngüde öğe kalmadı'];
const condition = value => ['Condition: ' + py(value), 'Koşul: ' + py(value)];

function buildFor(kind) {
  const configurations = {
    list: ['scores = [72, 85, 91]', 'score', 'scores', [72, 85, 91], { scores: [72, 85, 91] }],
    string: ['text = "CODE"', 'character', 'text', [...'CODE'], { text: 'CODE' }],
    tuple: ['point = (3, 5)', 'coordinate', 'point', [3, 5], {}],
    keys: ['scores = {"Ada": 90, "Lin": 75}', 'name', 'scores', ['Ada', 'Lin'], { scores: { Ada: 90, Lin: 75 } }],
    values: ['scores = {"Ada": 90, "Lin": 75}', 'score', 'scores.values()', [90, 75], { scores: { Ada: 90, Lin: 75 } }],
    items: ['scores = {"Ada": 90, "Lin": 75}', 'name, score', 'scores.items()', [['Ada', 90], ['Lin', 75]], { scores: { Ada: 90, Lin: 75 } }],
    set: ['skills = {"Python", "C", "SQL"}', 'skill', 'sorted(skills)', ['C', 'Python', 'SQL'], {}]
  };
  const [assignment, target, iterable, values, variables] = configurations[kind];
  const p = program(`${assignment}\nfor ${target} in ${iterable}:\n    print(${target})\nprint("Done")`, values.map(value => Array.isArray(value) ? value.join(', ') : py(value)));
  // Tuple and set displays retain their Python syntax in the state panel.
  p.literalVariables = kind === 'tuple' ? { point: '(3, 5)' } : kind === 'set' ? { skills: '{"Python", "C", "SQL"}' } : {};
  const output = [];
  p.record(1, variables);
  values.forEach((value, index) => {
    if (kind === 'items') { variables.name = value[0]; variables.score = value[1]; }
    else variables[target] = value;
    p.record(2, variables, output, index);
    output.push(Array.isArray(value) ? value.join(' ') : String(value));
    p.record(3, variables, output, index);
  });
  p.record(2, variables, output, -1, exhausted);
  output.push('Done'); p.record(4, variables, output);
  return p;
}

function buildRange(start, stop, step, form) {
  const args = form === '1' ? [stop] : form === '2' ? [start, stop] : [start, stop, step];
  if (form === '1') start = 0;
  if (form !== '3') step = 1;
  const values = [];
  if (step !== 0) for (let value = start; step > 0 ? value < stop : value > stop; value += step) values.push(value);
  const p = program(`for number in range(${args.join(', ')}):\n    print(number)\nprint("Done")`, values.map(String));
  const variables = {}, output = [];
  if (step === 0) {
    p.record(1, variables, ['ValueError: range() arg 3 must not be zero']);
    return p;
  }
  values.forEach((value, index) => {
    variables.number = value; p.record(1, variables, output, index);
    output.push(String(value)); p.record(2, variables, output, index);
  });
  p.record(1, variables, output, -1, exhausted);
  output.push('Done'); p.record(3, variables, output);
  return p;
}

// Exact half cases in these bounded integer averages use Python's ties-to-even.
function averageText(total, count) {
  const scaled = total / count * 10, lower = Math.floor(scaled);
  const rounded = scaled - lower === 0.5 ? lower + lower % 2 : Math.round(scaled);
  return (rounded / 10).toFixed(1);
}
function buildTotal(scores) {
  const p = program(`scores = ${py(scores)}\ntotal = 0\ncount = 0\nfor score in scores:\n    total += score\n    count += 1\nprint(total, count)\nif count > 0:\n    print(f"Average: {total / count:.1f}")\nelse:\n    print("No scores")`, scores.map(String));
  const variables = { scores }, output = [];
  p.record(1, variables); variables.total = 0; p.record(2, variables); variables.count = 0; p.record(3, variables);
  scores.forEach((score, index) => {
    variables.score = score; p.record(4, variables, output, index);
    variables.total += score; p.record(5, variables, output, index);
    variables.count++; p.record(6, variables, output, index);
  });
  p.record(4, variables, output, -1, exhausted);
  output.push(`${variables.total} ${variables.count}`); p.record(7, variables, output);
  p.record(8, variables, output, -1, condition(scores.length > 0));
  output.push(scores.length ? 'Average: ' + averageText(variables.total, scores.length) : 'No scores');
  p.record(scores.length ? 9 : 11, variables, output);
  return p;
}
function buildFilter(scores, limit) {
  const p = program(`scores = ${py(scores)}\npassing = []\nfor score in scores:\n    if score >= ${limit}:\n        passing.append(score)\nprint(passing)`, scores.map(String));
  const variables = { scores };
  p.record(1, variables); variables.passing = []; p.record(2, variables);
  scores.forEach((score, index) => {
    variables.score = score; p.record(3, variables, [], index);
    p.record(4, variables, [], index, condition(score >= limit));
    if (score >= limit) { variables.passing.push(score); p.record(5, variables, [], index); }
  });
  p.record(3, variables, [], -1, exhausted);
  p.record(6, variables, [py(variables.passing)]);
  return p;
}
function buildCountdown(start, broken = false) {
  const p = program(`remaining = ${start}\nwhile remaining > 0:\n    print(remaining)\n    ${broken ? '# Missing: remaining -= 1' : 'remaining -= 1'}\nprint("Go")`);
  const variables = { remaining: start }, output = [];
  p.record(1, variables);
  let iterations = 0;
  while (variables.remaining > 0) {
    p.record(2, variables, output, -1, condition(true));
    output.push(String(variables.remaining)); p.record(3, variables, output);
    if (!broken) { variables.remaining--; p.record(4, variables, output); }
    if (++iterations === 5 && broken) {
      p.record(2, variables, output, -1, ['Preview stopped after 5 iterations. This loop does not terminate.', 'Önizleme 5 yinelemede durduruldu. Bu döngü sonlanmaz.']);
      p.stopped = true;
      return p;
    }
  }
  p.record(2, variables, output, -1, condition(false));
  output.push('Go'); p.record(5, variables, output);
  return p;
}
function buildSentinel(inputs) {
  const p = program(`# input() returns these strings in order: ${inputs.map(value => py(String(value))).join(', ')}\ntotal = 0\nvalue = int(input("Number (-1 to stop): "))\nwhile value != -1:\n    total += value\n    value = int(input("Number (-1 to stop): "))\nprint(total)`, inputs.map(value => py(String(value))));
  const variables = { total: 0 };
  let index = 0;
  p.record(2, variables); variables.value = inputs[index]; p.record(3, variables, [], index);
  while (variables.value !== -1) {
    p.record(4, variables, [], index, condition(true));
    variables.total += variables.value; p.record(5, variables, [], index);
    variables.value = inputs[++index]; p.record(6, variables, [], index);
  }
  p.record(4, variables, [], index, condition(false));
  p.record(7, variables, [String(variables.total)]);
  // Input prompts are displayed on their input() lines; the output panel shows print().
  return p;
}
function buildControl(values, mode) {
  const skip = mode === 'continue';
  const p = program(`numbers = ${py(values)}\nfor number in numbers:\n    if number ${skip ? '< 0' : '== 0'}:\n        ${mode}\n    print(number)\nprint("Done")`, values.map(String));
  const variables = { numbers: values }, output = [];
  p.record(1, variables);
  let broke = false;
  for (let index = 0; index < values.length; index++) {
    const number = values[index]; variables.number = number; p.record(2, variables, output, index);
    const matches = skip ? number < 0 : number === 0;
    p.record(3, variables, output, index, condition(matches));
    if (matches) {
      p.record(4, variables, output, index);
      if (skip) continue;
      broke = true; break;
    }
    output.push(String(number)); p.record(5, variables, output, index);
  }
  if (!broke) p.record(2, variables, output, -1, exhausted);
  output.push('Done'); p.record(6, variables, output);
  return p;
}
function buildNested(rows, columns) {
  const cells = [];
  for (let row = 1; row <= rows; row++) for (let column = 1; column <= columns; column++) cells.push(`${row}×${column}`);
  const p = program(`for row in range(1, ${rows + 1}):\n    for column in range(1, ${columns + 1}):\n        print(row, column, row * column)\nprint("Done")`, cells, columns);
  const variables = {}, output = [];
  for (let row = 1; row <= rows; row++) {
    variables.row = row; p.record(1, variables, output);
    for (let column = 1; column <= columns; column++) {
      variables.column = column;
      const index = (row - 1) * columns + column - 1;
      p.record(2, variables, output, index);
      output.push(`${row} ${column} ${row * column}`); p.record(3, variables, output, index);
    }
    p.record(2, variables, output, -1, exhausted);
  }
  p.record(1, variables, output, -1, exhausted);
  output.push('Done'); p.record(4, variables, output);
  return p;
}
function buildReport(scores) {
  const p = program(`scores = ${py(scores)}\ntotal = 0\npassed = 0\nfor score in scores:\n    total += score\n    if score >= 60:\n        passed += 1\nprint("Passed:", passed)\nif len(scores) > 0:\n    print(f"Average: {total / len(scores):.1f}")\nelse:\n    print("No scores")`, scores.map(String));
  const variables = { scores }, output = [];
  p.record(1, variables); variables.total = 0; p.record(2, variables); variables.passed = 0; p.record(3, variables);
  scores.forEach((score, index) => {
    variables.score = score; p.record(4, variables, output, index);
    variables.total += score; p.record(5, variables, output, index);
    p.record(6, variables, output, index, condition(score >= 60));
    if (score >= 60) { variables.passed++; p.record(7, variables, output, index); }
  });
  p.record(4, variables, output, -1, exhausted);
  output.push('Passed: ' + variables.passed); p.record(8, variables, output);
  p.record(9, variables, output, -1, condition(scores.length > 0));
  output.push(scores.length ? 'Average: ' + averageText(variables.total, scores.length) : 'No scores');
  p.record(scores.length ? 10 : 12, variables, output);
  return p;
}
function buildBasket(notebooks, pens) {
  const basket = [{ name: 'Notebook', price: 30, quantity: notebooks }, { name: 'Pen', price: 10, quantity: pens }];
  const p = program(`basket = [\n    ${py(basket[0])},\n    ${py(basket[1])},\n]\ntotal = 0\nfor item in basket:\n    subtotal = item["price"] * item["quantity"]\n    total += subtotal\n    print(item["name"], subtotal)\nprint("Total:", total)`, ['Notebook', 'Pen']);
  const variables = { basket }, output = [];
  p.record(1, variables); variables.total = 0; p.record(5, variables);
  basket.forEach((item, index) => {
    variables.item = item; p.record(6, variables, output, index);
    variables.subtotal = item.price * item.quantity; p.record(7, variables, output, index);
    variables.total += variables.subtotal; p.record(8, variables, output, index);
    output.push(item.name + ' ' + variables.subtotal); p.record(9, variables, output, index);
  });
  p.record(6, variables, output, -1, exhausted);
  output.push('Total: ' + variables.total); p.record(10, variables, output);
  return p;
}
function buildGuess(secret, guesses) {
  const p = program(`# input() returns these strings in order: ${guesses.map(value => py(String(value))).join(', ')}\nsecret = ${secret}\nattempts = 0\nfound = False\nwhile attempts < 3 and not found:\n    guess = int(input("Guess: "))\n    attempts += 1\n    if guess == secret:\n        found = True\n    elif guess < secret:\n        print("Higher")\n    else:\n        print("Lower")\nprint("Found" if found else "No attempts left")`, guesses.map(value => py(String(value))));
  const variables = { secret }, output = [];
  p.record(2, variables); variables.attempts = 0; p.record(3, variables); variables.found = false; p.record(4, variables);
  while (variables.attempts < 3 && !variables.found) {
    const index = variables.attempts;
    p.record(5, variables, output, index, condition(true));
    variables.guess = guesses[index]; p.record(6, variables, output, index);
    variables.attempts++; p.record(7, variables, output, index);
    p.record(8, variables, output, index, condition(variables.guess === secret));
    if (variables.guess === secret) { variables.found = true; p.record(9, variables, output, index); }
    else {
      const higher = variables.guess < secret;
      p.record(10, variables, output, index, condition(higher));
      output.push(higher ? 'Higher' : 'Lower'); p.record(higher ? 11 : 13, variables, output, index);
    }
  }
  p.record(5, variables, output, -1, condition(false));
  output.push(variables.found ? 'Found' : 'No attempts left'); p.record(14, variables, output);
  return p;
}

// UI and navigation follow the same structure as Weeks 2 and 3.
const byId = id => document.getElementById(id);
const sections = [...document.querySelectorAll('.lesson')];
const navLinks = [...document.querySelectorAll('.nav a')];
const staticText = [...document.querySelectorAll('[data-i18n]')].map(element => ({ element, english: element.textContent }));
const traces = [];
const quizMessages = new Map();
let language = 'en';
const localize = (en, tr) => language === 'tr' ? tr : en;

function integer(id) {
  const input = byId(id), value = Number(input.value);
  if (input.value === '' || !input.checkValidity() || !Number.isSafeInteger(value)) throw new Error('integer');
  return value;
}
function numbers(id, min = 0, max = 100) {
  const text = byId(id).value.trim();
  if (!text) return [];
  const parts = text.split(',').map(item => item.trim());
  if (parts.length > 8 || parts.some(item => !/^[+-]?\d+$/.test(item) || Number(item) < min || Number(item) > max)) throw new Error('list');
  return parts.map(Number);
}
function mountTrace(id, build, fields) {
  let p = null, position = -1, timer = null, error = null;
  const buttons = Object.fromEntries(['back', 'step', 'run', 'finish', 'reset'].map(name => [name, byId(id + '-' + name)]));
  function pause() { clearInterval(timer); timer = null; buttons.run.textContent = localize('Run', 'Çalıştır'); }
  function status() {
    const node = byId(id + '-status');
    node.classList.toggle('error', Boolean(error) || Boolean(p?.stopped && position === p.frames.length - 1));
    if (error) { node.textContent = localize(...error); return; }
    const frame = p.frames[position];
    const progress = localize(`Step ${position + 1} / ${p.frames.length}`, `Adım ${position + 1} / ${p.frames.length}`);
    node.textContent = progress + (frame?.event ? ' · ' + localize(...frame.event) : '');
    buttons.run.textContent = timer ? localize('Pause', 'Duraklat') : localize('Run', 'Çalıştır');
  }
  function render() {
    const frame = p?.frames[position];
    [...byId(id + '-code').children].forEach((line, index) => {
      line.classList.toggle('current', frame?.line === index + 1);
      line.classList.toggle('visited', Boolean(p?.frames.slice(0, position).some(item => item.line === index + 1)));
      if (frame?.line === index + 1) line.setAttribute('aria-current', 'step'); else line.removeAttribute('aria-current');
    });
    const variables = byId(id + '-variables'); variables.replaceChildren();
    const entries = Object.entries(frame?.variables || {}).map(([key, value]) => [key, py(value)]);
    if (frame && p.literalVariables) entries.unshift(...Object.entries(p.literalVariables));
    entries.forEach(([key, value]) => {
      const row = document.createElement('div'), name = document.createElement('code'), content = document.createElement('code');
      row.className = 'variable'; name.textContent = key; content.textContent = value; row.append(name, content); variables.append(row);
    });
    byId(id + '-output').textContent = frame?.output.length ? frame.output.join('\n') : '—';
    const cells = byId(id + '-cells'); cells.replaceChildren();
    cells.classList.toggle('matrix', Boolean(p?.columns));
    cells.style.setProperty('--columns', p?.columns || 1);
    const visited = new Set(p?.frames.slice(0, position).map(item => item.current));
    (p?.cells || []).forEach((value, index) => {
      const cell = document.createElement('code'); cell.textContent = value;
      cell.className = 'iteration-cell' + (visited.has(index) ? ' visited' : '') + (frame?.current === index ? ' current' : '');
      cells.append(cell);
    });
    buttons.back.disabled = !p || position < 0;
    for (const name of ['step', 'run', 'finish']) buttons[name].disabled = !p || position === p.frames.length - 1;
    status();
  }
  function reset() {
    pause(); position = -1; error = null;
    try { p = build(); }
    catch (failure) {
      p = null;
      error = failure.message === 'sentinel' ? ['Include −1 in the input sequence.', 'Girdi sırasına −1 ekleyin.']
        : failure.message === 'guesses' ? ['Enter exactly three guesses from 1 to 10.', '1–10 arasında tam üç tahmin girin.']
        : ['Use whole numbers within the displayed limits.', 'Gösterilen sınırlar içinde tam sayılar kullanın.'];
    }
    const code = byId(id + '-code'); code.replaceChildren();
    (p?.code || '# Enter valid inputs.').split('\n').forEach(text => { const line = document.createElement('li'); line.textContent = text; code.append(line); });
    render();
  }
  function step() {
    if (!p || position >= p.frames.length - 1) return;
    position++;
    if (position === p.frames.length - 1) pause();
    render();
  }
  buttons.back.addEventListener('click', () => { pause(); position--; render(); });
  buttons.step.addEventListener('click', () => { pause(); step(); });
  buttons.run.addEventListener('click', () => {
    if (timer) { pause(); status(); return; }
    step();
    if (position < p.frames.length - 1) timer = setInterval(step, 650);
    status();
  });
  buttons.finish.addEventListener('click', () => { pause(); position = p.frames.length - 1; render(); });
  buttons.reset.addEventListener('click', reset);
  fields.forEach(field => byId(field).addEventListener('input', reset));
  traces.push({ pause, status }); reset();
}

mountTrace('for', () => buildFor(byId('for-kind').value), ['for-kind']);
mountTrace('range', () => {
  const form = byId('range-form').value;
  byId('range-start').disabled = form === '1'; byId('range-increment').disabled = form !== '3';
  return buildRange(form === '1' ? 0 : integer('range-start'), integer('range-stop'), form === '3' ? integer('range-increment') : 1, form);
}, ['range-form', 'range-start', 'range-stop', 'range-increment']);
mountTrace('total', () => buildTotal(numbers('total-scores')), ['total-scores']);
mountTrace('filter', () => buildFilter(numbers('filter-scores'), integer('filter-limit')), ['filter-scores', 'filter-limit']);
mountTrace('while', () => {
  const sentinel = byId('while-mode').value === 'sentinel';
  byId('while-start').disabled = sentinel; byId('while-inputs').disabled = !sentinel;
  if (!sentinel) return buildCountdown(integer('while-start'));
  const inputs = numbers('while-inputs', -1, 100);
  if (!inputs.includes(-1)) throw new Error('sentinel');
  return buildSentinel(inputs);
}, ['while-mode', 'while-start', 'while-inputs']);
mountTrace('control', () => buildControl(numbers('control-values', -20, 20), byId('control-mode').value), ['control-values', 'control-mode']);
mountTrace('debug', () => buildCountdown(3, byId('debug-mode').value === 'broken'), ['debug-mode']);
mountTrace('nested', () => buildNested(integer('nested-rows'), integer('nested-columns')), ['nested-rows', 'nested-columns']);
mountTrace('report', () => buildReport(numbers('report-scores')), ['report-scores']);
mountTrace('basket', () => buildBasket(integer('basket-notebooks'), integer('basket-pens')), ['basket-notebooks', 'basket-pens']);
mountTrace('guess', () => {
  const guesses = numbers('guess-inputs', 1, 10);
  if (guesses.length !== 3) throw new Error('guesses');
  return buildGuess(integer('guess-secret'), guesses);
}, ['guess-secret', 'guess-inputs']);

function updatePosition() {
  const index = sections.findIndex(section => section.classList.contains('active'));
  byId('section-position').textContent = localize(`Section ${index + 1} of ${sections.length}`, `Bölüm ${index + 1} / ${sections.length}`);
}
function setLanguage(value) {
  language = value === 'tr' ? 'tr' : 'en'; document.documentElement.lang = language;
  staticText.forEach(({ element, english }) => { element.textContent = language === 'tr' ? turkishTranslations[english] ?? english : english; });
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  document.querySelector('.nav').setAttribute('aria-label', localize('Lesson sections', 'Ders bölümleri'));
  document.querySelector('meta[name=description]').content = localize('Week 4: Python loops, code examples, and interactive execution traces.', 'Hafta 4: Python döngüleri, kod örnekleri ve etkileşimli kod izleme.');
  byId('flow-title').textContent = localize('remaining = 3; check the condition, print, subtract, repeat; otherwise exit.', 'remaining = 3; koşulu kontrol et, yazdır, azalt, tekrarla; koşul sağlanmazsa çık.');
  traces.forEach(trace => trace.status());
  quizMessages.forEach((message, id) => { byId(id).textContent = localize(...message); });
  updatePosition();
  try { localStorage.setItem('algorithm101-language', language); } catch { /* Local storage is optional. */ }
}
function showSection(id, focus = false) {
  let index = sections.findIndex(section => section.id === id);
  if (index < 0) index = 0;
  sections.forEach((section, i) => section.classList.toggle('active', i === index));
  navLinks.forEach((link, i) => { if (i === index) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  byId('previous-section').disabled = index === 0;
  byId('next-section').disabled = index === sections.length - 1;
  traces.forEach(trace => trace.pause()); updatePosition();
  navLinks[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (focus) { window.scrollTo(0, 0); sections[index].querySelector('h1,h2').focus({ preventScroll: true }); }
}
navLinks.forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); const id = link.getAttribute('href').slice(1);
  if (location.hash === '#' + id) showSection(id, true); else location.hash = id;
}));
window.addEventListener('hashchange', () => showSection(location.hash.slice(1), true));
for (const [id, offset] of [['previous-section', -1], ['next-section', 1]]) byId(id).addEventListener('click', () => {
  const index = sections.findIndex(section => section.classList.contains('active')) + offset;
  if (sections[index]) location.hash = sections[index].id;
});
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); byId('main').focus(); byId('main').scrollIntoView({ block: 'start' }); });
document.addEventListener('visibilitychange', () => { if (document.hidden) traces.forEach(trace => trace.pause()); });

byId('quiz-check').addEventListener('click', () => {
  const questions = [...document.querySelectorAll('.quiz-question')];
  let correct = 0;
  questions.forEach(question => {
    const selected = question.querySelector('input:checked'), answer = question.querySelector('.quiz-answer');
    const ok = selected?.value === question.dataset.answer;
    if (ok) correct++;
    const message = !selected ? ['Choose an answer.', 'Bir yanıt seçin.'] : ok ? ['Correct.', 'Doğru.'] : ['Check the loop body and stopping condition.', 'Döngü gövdesini ve bitiş koşulunu kontrol edin.'];
    quizMessages.set(answer.id, message); answer.textContent = localize(...message); answer.hidden = false; answer.classList.toggle('correct', ok);
  });
  const message = [`${correct} / ${questions.length} correct`, `${correct} / ${questions.length} doğru`];
  quizMessages.set('quiz-status', message); byId('quiz-status').textContent = localize(...message);
});
document.querySelectorAll('.quiz-question input').forEach(input => input.addEventListener('change', () => {
  const answer = input.closest('fieldset').querySelector('.quiz-answer'); answer.hidden = true; quizMessages.delete(answer.id);
  quizMessages.delete('quiz-status'); byId('quiz-status').textContent = '';
}));
document.querySelectorAll('[data-language]').forEach(button => { button.addEventListener('click', () => setLanguage(button.dataset.language)); button.disabled = false; });
let savedLanguage = 'en';
try { savedLanguage = localStorage.getItem('algorithm101-language') || 'en'; } catch { /* Use English by default. */ }
document.body.classList.add('enhanced'); showSection(location.hash.slice(1)); setLanguage(savedLanguage);
