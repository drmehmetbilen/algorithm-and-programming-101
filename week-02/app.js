"use strict";
const byId = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll(".lesson")];
const navLinks = [...document.querySelectorAll(".nav a")];
const languageButtons = [...document.querySelectorAll("[data-language]")];
const staticText = [...document.querySelectorAll("[data-i18n]")].map((element) => ({ element, english:element.innerHTML, key:element.innerHTML.replace(/\s+/g, " ").trim() }));
const staticAttributes = ["aria-label", "content"].flatMap((name) => [...document.querySelectorAll(`[data-i18n-${name}]`)].map((element) => ({ element, name, english:element.getAttribute(name) })));
const localizedText = new Map();
const timers = new Map();
let language = "en";

function t(message, values = {}) {
  const template = language === "tr" ? turkishTranslations[message] ?? message : message;
  return template.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}
function setText(id, message, values = {}) {
  localizedText.set(id, { message, values });
  byId(id).textContent = t(message, values);
}
function feedback(id, message, kind = "", values = {}) {
  setText(id, message, values);
  byId(id).className = "feedback" + (kind ? " " + kind : "");
}
function readNumber(id, integer = false) {
  const input = byId(id), value = Number(input.value);
  return input.value.trim() !== "" && input.checkValidity() && Number.isFinite(value) && (!integer || Number.isInteger(value)) ? value : null;
}
function pythonNumber(value, type = "int") {
  return type === "float" && Number.isInteger(value) ? value.toFixed(1) : String(value);
}
function stopRun(name) {
  clearInterval(timers.get(name));
  timers.delete(name);
  setText(name + "-run", "Run");
}
function toggleRun(name, step) {
  if (timers.has(name)) { stopRun(name); return; }
  if (!step()) return;
  setText(name + "-run", "Pause");
  timers.set(name, setInterval(() => { if (!step()) stopRun(name); }, 800));
}
function highlight(id, index) {
  [...byId(id).children].forEach((line, i) => line.classList.toggle("current", i === index));
}
function showSection(id, focus = false) {
  let index = sections.findIndex((section) => section.id === id);
  if (index < 0) index = 0;
  sections.forEach((section, i) => section.classList.toggle("active", i === index));
  navLinks.forEach((link, i) => { if (i === index) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current"); });
  byId("previous-section").disabled = index === 0;
  byId("next-section").disabled = index === sections.length - 1;
  setText("section-position", "Section {current} of {total}", { current:index + 1, total:sections.length });
  [...timers.keys()].forEach(stopRun);
  navLinks[index].scrollIntoView({ block:"nearest", inline:"nearest" });
  if (focus) {
    window.scrollTo(0, 0);
    sections[index].querySelector("h1,h2").focus({ preventScroll:true });
  }
}
function setLanguage(value) {
  language = value === "tr" ? "tr" : "en";
  document.documentElement.lang = language;
  languageButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.language === language)));
  staticText.forEach(({ element, english, key }) => element.innerHTML = language === "tr" ? turkishTranslations[key] ?? english : english);
  staticAttributes.forEach(({ element, name, english }) => element.setAttribute(name, t(english)));
  localizedText.forEach(({ message, values }, id) => byId(id).textContent = t(message, values));
  if (quizChecked) renderQuiz();
  try { localStorage.setItem("algorithm101-language", language); } catch { /* The controls work without storage. */ }
}

// Section navigation is enabled after the lesson script initializes.
window.addEventListener("hashchange", () => showSection(location.hash.slice(1), true));
document.querySelector(".skip").addEventListener("click", (event) => { event.preventDefault(); byId("main").focus(); byId("main").scrollIntoView({ block:"start" }); });
document.querySelectorAll('a[href^="#"]:not(.skip)').forEach((link) => link.addEventListener("click", (event) => {
  const id = link.getAttribute("href").slice(1);
  if (!sections.some((section) => section.id === id)) return;
  event.preventDefault();
  if (location.hash === "#" + id) showSection(id, true); else location.hash = id;
}));
byId("previous-section").addEventListener("click", () => {
  const index = sections.findIndex((section) => section.classList.contains("active"));
  if (index > 0) location.hash = sections[index - 1].id;
});
byId("next-section").addEventListener("click", () => {
  const index = sections.findIndex((section) => section.classList.contains("active"));
  if (index < sections.length - 1) location.hash = sections[index + 1].id;
});

byId("recap-check").addEventListener("click", () => {
  const prediction = readNumber("recap-prediction", true);
  if (prediction === null) { feedback("recap-feedback", "Enter a whole-number prediction.", "error"); return; }
  feedback("recap-feedback", prediction === 11 ? "Correct. total keeps 11; changing a does not recalculate it." : "total is calculated before a changes. Trace the assignments again.", prediction === 11 ? "success" : "error");
});
byId("recap-prediction").addEventListener("input", () => feedback("recap-feedback", "Prediction changed. Check it again."));

const assignment = { index:0, x:null, y:null };
function resetAssignment() {
  stopRun("assignment");
  Object.assign(assignment, { index:0, x:null, y:null });
  highlight("assignment-code", -1);
  byId("assignment-history").replaceChildren();
  byId("assignment-x").textContent = "—";
  byId("assignment-y").textContent = "—";
  byId("assignment-output").textContent = "—";
  byId("assignment-step").disabled = false;
  byId("assignment-run").disabled = false;
  feedback("assignment-feedback", "Predict x and y before executing each instruction.");
}
function stepAssignment() {
  if (assignment.index >= 5) return false;
  const index = assignment.index++;
  if (index === 0) assignment.x = 4;
  if (index === 1) assignment.y = assignment.x;
  if (index === 2) assignment.x += 3;
  if (index === 3) assignment.y += 2;
  if (index === 4) byId("assignment-output").textContent = `${assignment.x} ${assignment.y}`;
  highlight("assignment-code", index);
  byId("assignment-x").textContent = assignment.x ?? "—";
  byId("assignment-y").textContent = assignment.y ?? "—";
  const row = byId("assignment-history").insertRow();
  [byId("assignment-code").children[index].textContent, assignment.x ?? "—", assignment.y ?? "—"].forEach((value) => row.insertCell().textContent = value);
  const messages = ["x receives 4.", "y receives the current value of x: 4.", "x becomes 7; y remains 4.", "y += 2 changes y from 4 to 6.", "The program prints 7 6. The trace is complete."];
  feedback("assignment-feedback", messages[index], index === 4 ? "success" : "");
  if (assignment.index === 5) { stopRun("assignment"); byId("assignment-step").disabled = true; byId("assignment-run").disabled = true; return false; }
  return true;
}
byId("assignment-step").addEventListener("click", () => { stopRun("assignment"); stepAssignment(); });
byId("assignment-run").addEventListener("click", () => toggleRun("assignment", stepAssignment));
byId("assignment-reset").addEventListener("click", resetAssignment);

const typeExamples = {
  int:{code:'value = 5\nprint(type(value).__name__)\nprint(value + value)',output:'int\n10',description:'Integers support arithmetic. Adding two 5 values produces 10.'},
  float:{code:'value = 5.0\nprint(type(value).__name__)\nprint(value + value)',output:'float\n10.0',description:'5.0 is a float. The result of this addition is also a float.'},
  str:{code:'value = "5"\nprint(type(value).__name__)\nprint(value + value)',output:'str\n55',description:'The + operator joins these strings. It does not perform numeric addition.'},
  bool:{code:'value = True\nprint(type(value).__name__)\nprint(not value)',output:'bool\nFalse',description:'True is a Boolean value. not True produces False.'},
  textbool:{code:'value = "False"\nprint(type(value).__name__)\nprint(bool(value))',output:'str\nTrue',description:'This is non-empty text. bool() returns True for a non-empty string, even when its letters spell False.'}
};
function selectType(name) {
  document.querySelectorAll("[data-type]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.type === name)));
  const example = typeExamples[name];
  byId("type-code").querySelector("code").textContent = example.code;
  byId("type-output").textContent = example.output;
  setText("type-description", example.description);
}
document.querySelectorAll("[data-type]").forEach((button) => button.addEventListener("click", () => selectType(button.dataset.type)));

function resetConversion() {
  const raw = byId("conversion-mode").value === "raw";
  byId("conversion-code").querySelector("code").textContent = `${raw ? 'celsius = input("Celsius: ")' : 'celsius = float(input("Celsius: "))'}\nfahrenheit = celsius * 9 / 5 + 32\nprint(f"Fahrenheit: {fahrenheit:.1f}")`;
  byId("conversion-values").textContent = "—";
  byId("conversion-output").textContent = "—";
  feedback("conversion-feedback", "Inputs changed. Preview the example again.");
}
["celsius", "conversion-mode"].forEach((id) => byId(id).addEventListener("input", resetConversion));
byId("conversion-run").addEventListener("click", () => {
  const celsius = readNumber("celsius");
  if (celsius === null) { feedback("conversion-feedback", "Enter a temperature from −100 to 100 in steps of 0.5.", "error"); return; }
  if (byId("conversion-mode").value === "raw") {
    byId("conversion-values").textContent = `celsius: ${JSON.stringify(byId("celsius").value)} (str)`;
    byId("conversion-output").textContent = "TypeError";
    feedback("conversion-feedback", "Without conversion, multiplying the text by 9 repeats it. Dividing that string by 5 raises TypeError; print() is never reached.", "error");
    return;
  }
  const fahrenheit = celsius * 9 / 5 + 32;
  byId("conversion-values").textContent = `celsius: ${pythonNumber(celsius, "float")} (float)\nfahrenheit: ${pythonNumber(fahrenheit, "float")} (float)`;
  byId("conversion-output").textContent = `Fahrenheit: ${fahrenheit.toFixed(1)}`;
  feedback("conversion-feedback", "float() converts the input before arithmetic. The f-string displays one decimal place.", "success");
});

const expressions = [
  {result:13,type:"int",explanation:"Multiply 2 by 3 first, then add 7: 13."},
  {result:27,type:"int",explanation:"Add 7 and 2 inside parentheses first, then multiply by 3: 27."},
  {result:3.5,type:"float",explanation:"True division produces the float 3.5."},
  {result:3,type:"int",explanation:"Floor division rounds 3.5 down to 3."},
  {result:-4,type:"int",explanation:"Floor division rounds −3.5 down to −4, not toward zero."},
  {result:1,type:"int",explanation:"7 = 3 × 2 + 1, so the remainder is 1."},
  {result:1,type:"int",explanation:"−7 = (−4) × 2 + 1, so the remainder is 1."},
  {result:8,type:"int",explanation:"** raises a number to a power: 2 × 2 × 2 = 8."}
];
byId("expression-check").addEventListener("click", () => {
  const prediction = readNumber("expression-prediction"), example = expressions[Number(byId("expression-choice").value)];
  if (prediction === null) { feedback("expression-feedback", "Enter a numeric prediction.", "error"); return; }
  byId("expression-output").textContent = `${pythonNumber(example.result, example.type)} (${example.type})`;
  const correct = prediction === example.result;
  feedback("expression-feedback", (correct ? "Correct." : "Review.") + " " + example.explanation, correct ? "success" : "error");
});
["expression-choice", "expression-prediction"].forEach((id) => byId(id).addEventListener("input", () => {
  byId("expression-output").textContent = "—";
  feedback("expression-feedback", "Inputs changed. Check your prediction again.");
}));
byId("parity-check").addEventListener("click", () => {
  const number = readNumber("parity-number", true);
  if (number === null) { feedback("parity-feedback", "Enter an integer from −100 to 100.", "error"); return; }
  const remainder = ((number % 2) + 2) % 2;
  byId("parity-output").textContent = remainder === 0 ? "Even" : "Odd";
  feedback("parity-feedback", "{number} % 2 = {remainder}. The condition number % 2 == 0 is {result}.", "success", { number, remainder, result:remainder === 0 ? "True" : "False" });
});
byId("parity-number").addEventListener("input", () => { byId("parity-output").textContent = "—"; feedback("parity-feedback", "Input changed. Calculate again."); });

const truthRows = [[true,true],[true,false],[false,true],[false,false]];
truthRows.forEach(([a,b]) => {
  const row = byId("truth-table").insertRow();
  [a,b,a && b,a || b,!(a && b)].forEach((value) => row.insertCell().textContent = value ? "True" : "False");
});
function resetLogic() {
  const mode = byId("logic-mode").value;
  byId("logic-code").querySelector("code").textContent = mode === "not" ? "not (temperature >= 10 and temperature <= 30)" : `temperature >= 10 ${mode} temperature <= 30`;
  ["logic-a", "logic-b", "logic-output"].forEach((id) => byId(id).textContent = "—");
  [...byId("truth-table").rows].forEach((row) => row.classList.remove("current"));
  feedback("logic-feedback", "Inputs changed. Evaluate the condition again.");
}
["logic-temperature", "logic-mode"].forEach((id) => byId(id).addEventListener("input", resetLogic));
byId("logic-evaluate").addEventListener("click", () => {
  const value = readNumber("logic-temperature", true);
  if (value === null) { feedback("logic-feedback", "Enter an integer temperature from −50 to 100.", "error"); return; }
  const a = value >= 10, b = value <= 30, mode = byId("logic-mode").value;
  const result = mode === "or" ? a || b : mode === "not" ? !(a && b) : a && b;
  byId("logic-a").textContent = a ? "True" : "False";
  byId("logic-b").textContent = b ? "True" : "False";
  byId("logic-output").textContent = result ? "True" : "False";
  [...byId("truth-table").rows].forEach((row,i) => row.classList.toggle("current", truthRows[i][0] === a && truthRows[i][1] === b));
  const message = mode === "or" ? "or accepts every number here: values below 10 satisfy B, and values above 30 satisfy A. It does not restrict the input to the range." : mode === "not" ? "not (A and B) describes values outside the allowed range." : "A and B is True only from 10 through 30, including both endpoints.";
  feedback("logic-feedback", message);
});

const grade = { index:0, score:null, trace:[] };
function resetGrade() {
  stopRun("grade");
  Object.assign(grade, { index:0, score:null, trace:[] });
  highlight("grade-code", -1);
  [...byId("grade-code").children].forEach((line) => line.classList.remove("visited"));
  byId("grade-flow").querySelectorAll(".active").forEach((node) => node.classList.remove("active"));
  ["grade-value", "grade-category", "grade-output"].forEach((id) => byId(id).textContent = "—");
  byId("grade-step").disabled = false;
  byId("grade-run").disabled = false;
  feedback("grade-feedback", "Predict the category, then step through the conditions.");
}
function stepGrade() {
  if (grade.score === null) {
    const score = readNumber("grade-score", true);
    if (score === null) { feedback("grade-feedback", "Enter an integer score from 0 to 100.", "error"); return false; }
    grade.score = score;
    grade.trace = [0,1,...(score >= 85 ? [2] : [3,...(score >= 60 ? [4] : [5,6])]),7];
  }
  if (grade.index >= grade.trace.length) return false;
  const line = grade.trace[grade.index++], score = grade.score;
  highlight("grade-code", line);
  byId("grade-code").children[line].classList.add("visited");
  const nodeIds = {0:"input",1:"85",2:"high",3:"60",4:"pass",6:"retry",7:"output"};
  byId("grade-flow").querySelectorAll(".active").forEach((node) => node.classList.remove("active"));
  const node = byId("grade-node-" + (nodeIds[line] ?? "retry"));
  node.classList.add("active");
  if (line === 2) byId("grade-edge-high").classList.add("active");
  if (line === 4) byId("grade-edge-pass").classList.add("active");
  if (line === 0) byId("grade-value").textContent = score;
  const category = score >= 85 ? "High" : score >= 60 ? "Pass" : "Retry";
  if ([2,4,6].includes(line)) byId("grade-category").textContent = category;
  if (line === 7) byId("grade-output").textContent = category;
  const messages = {
    0:"Read score: {score}.",
    1:"score >= 85 is {result}. Evaluate the first condition.",
    2:"Select High. The elif and else branches are skipped.",
    3:"score >= 60 is {result}. The first condition was False.",
    4:"Select Pass. The else branch is skipped.",
    5:"Both conditions are False. Enter the else branch.",
    6:"Select Retry.",
    7:"Print {category}. Exactly one category was assigned."
  };
  feedback("grade-feedback", messages[line], line === 7 ? "success" : "", { score, category, result:(line === 1 ? score >= 85 : score >= 60) ? "True" : "False" });
  if (grade.index === grade.trace.length) { stopRun("grade"); byId("grade-step").disabled = true; byId("grade-run").disabled = true; return false; }
  return true;
}
byId("grade-score").addEventListener("input", resetGrade);
byId("grade-step").addEventListener("click", () => { stopRun("grade"); stepGrade(); });
byId("grade-run").addEventListener("click", () => toggleRun("grade", stepGrade));
byId("grade-reset").addEventListener("click", resetGrade);

byId("combine-run").addEventListener("click", () => {
  const score = readNumber("combine-score", true);
  if (score === null) { feedback("combine-feedback", "Enter an integer score from 0 to 100.", "error"); return; }
  const output = [];
  if (score >= 60) output.push("Pass");
  if (score >= 85) output.push("High"); else output.push("Below 85");
  byId("independent-output").textContent = output.join("\n");
  byId("chain-output").textContent = score >= 85 ? "High" : score >= 60 ? "Pass" : "Retry";
  feedback("combine-feedback", "Independent statements print {count} line(s). The chain prints one. The first else belongs only to if score >= 85.", "", { count:output.length });
});
byId("combine-score").addEventListener("input", () => {
  ["independent-output", "chain-output"].forEach((id) => byId(id).textContent = "—");
  feedback("combine-feedback", "Input changed. Compare again.");
});
byId("nested-run").addEventListener("click", () => {
  const score = readNumber("nested-score", true);
  if (score === null) { feedback("nested-feedback", "Enter an integer score from 0 to 100.", "error"); return; }
  const registered = byId("registered").checked;
  byId("nested-output").textContent = !registered ? "Registration required" : score >= 60 ? "Eligible" : "Score too low";
  feedback("nested-feedback", registered ? "Registration is True, so the inner score condition is evaluated." : "Registration is False, so the inner score condition is skipped.");
});
["registered", "nested-score"].forEach((id) => byId(id).addEventListener("input", () => {
  byId("nested-output").textContent = "—";
  feedback("nested-feedback", "Inputs changed. Evaluate again.");
}));

function highlightShipping(weight, member) {
  byId("shipping-flow").querySelectorAll(".active").forEach((node) => node.classList.remove("active"));
  const ids = ["valid"];
  if (weight <= 0 || weight > 10) ids.push("invalid");
  else {
    ids.push("2");
    if (weight > 2) ids.push("5kg");
    ids.push(weight <= 2 ? "5" : weight <= 5 ? "8" : "12", "member");
    if (member) ids.push("discount");
    ids.push("output");
  }
  ids.forEach((id) => byId("shipping-node-" + id).classList.add("active"));
}
["shipping-weight", "shipping-member", "shipping-prediction"].forEach((id) => byId(id).addEventListener("input", () => {
  byId("shipping-output").textContent = "—";
  byId("shipping-flow").querySelectorAll(".active").forEach((node) => node.classList.remove("active"));
  feedback("shipping-feedback", "Inputs changed. Check your prediction again.");
}));
byId("shipping-check").addEventListener("click", () => {
  const weight = readNumber("shipping-weight"), prediction = readNumber("shipping-prediction", true);
  if (weight === null) { feedback("shipping-feedback", "Enter a weight from −2 to 12 in steps of 0.1 for this preview.", "error"); return; }
  if (weight <= 0 || weight > 10) {
    highlightShipping(weight, byId("shipping-member").checked);
    byId("shipping-output").textContent = "Invalid weight";
    feedback("shipping-feedback", "The weight is outside (0, 10]. No cost or discount is calculated.", "error");
    return;
  }
  if (prediction === null) { feedback("shipping-feedback", "Enter a whole-number cost prediction from 0 to 12.", "error"); return; }
  const base = weight <= 2 ? 5 : weight <= 5 ? 8 : 12, discount = byId("shipping-member").checked ? 2 : 0;
  highlightShipping(weight, byId("shipping-member").checked);
  byId("shipping-output").textContent = `Shipping: ${base - discount} credits`;
  feedback("shipping-feedback", prediction === base - discount ? "Correct. Base cost {base}, discount {discount}, final cost {cost}." : "Review the inclusive thresholds, then apply the membership discount. Base cost {base}, discount {discount}, final cost {cost}.", prediction === base - discount ? "success" : "error", { base, discount, cost:base - discount });
});

const quizAnswers = [
  {answer:"b",explanation:'"5" is a string, so its type name is str.'},
  {answer:"b",explanation:'Floor division rounds −3.5 down to −4.'},
  {answer:"a",explanation:'Both comparisons must be True to stay inside the inclusive range.'},
  {answer:"a",explanation:'The first True condition selects its branch; if all conditions are False, else runs.'}
];
let quizChecked = false;
function renderQuiz() {
  const data = new FormData(byId("quiz-form"));
  let score = 0;
  quizAnswers.forEach(({ answer, explanation }, index) => {
    const correct = data.get("q" + (index + 1)) === answer;
    if (correct) score++;
    const result = byId("quiz-q" + (index + 1));
    result.hidden = false;
    result.textContent = t(correct ? "Correct." : "Review.") + " " + t(explanation);
  });
  feedback("quiz-feedback", "{score} of 4 correct. Read the explanations.", score === 4 ? "success" : "", { score });
}
function resetQuiz() {
  quizChecked = false;
  document.querySelectorAll(".quiz-answer").forEach((element) => element.hidden = true);
  feedback("quiz-feedback", "Answer all four questions before checking.");
}
byId("quiz-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  if (quizAnswers.some((_,i) => !data.get("q" + (i + 1)))) { feedback("quiz-feedback", "Answer all four questions before checking.", "error"); return; }
  quizChecked = true;
  renderQuiz();
});
byId("quiz-form").addEventListener("change", resetQuiz);
byId("quiz-reset").addEventListener("click", () => { byId("quiz-form").reset(); resetQuiz(); });

const collectionExamples = {
  list:{code:'scores = [60, 85, 72]\nprint(scores[0])\nscores.append(90)\nprint(scores)',items:[['0','60'],['1','85'],['2','72']],after:[['0','60'],['1','85'],['2','72'],['3','90']],output:'60\n[60, 85, 72, 90]',description:'A list keeps its items in order. Index 0 accesses the first item; append adds an item at the end.',result:'The list now has four items. append changes the existing list.'},
  tuple:{code:'point = (3, 4)\nprint(point[0])\npoint[0] = 10',items:[['0','3'],['1','4']],after:[['0','3'],['1','4']],output:'3\nTypeError',description:'A tuple is an ordered sequence whose elements cannot be reassigned. This tuple stores two numeric coordinates.',result:'Assigning point[0] raises TypeError. The tuple stays unchanged. A tuple can contain mutable objects; its own element references remain fixed.'},
  dict:{code:'student = {"name": "Ada", "score": 85}\nprint(student["name"])\nstudent["score"] = 90\nprint(student["score"])',items:[['"name"','"Ada"'],['"score"','85']],after:[['"name"','"Ada"'],['"score"','90']],output:'Ada\n90',description:'A dictionary associates unique keys with values. Access the name with a key, not a numeric position.',result:'The score key now maps to 90. The name key still maps to Ada.'},
  set:{code:'names = {"Ada", "Lin", "Ada"}\nprint(len(names))\nnames.add("Mia")\nprint(len(names))',items:[['','"Ada"'],['','"Lin"']],after:[['','"Ada"'],['','"Lin"'],['','"Mia"']],output:'2\n3',description:'A set keeps unique elements. The repeated Ada is stored once. Sets do not guarantee a positional order; the cards are one illustration.',result:'The set grows from two to three unique names. Adding Ada again would not increase its size.'}
};
let collectionName = "list";
const collectionApplied = { list:false, tuple:false, dict:false, set:false };
function renderCollection() {
  const example = collectionExamples[collectionName], applied = collectionApplied[collectionName];
  document.querySelectorAll("[data-collection]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.collection === collectionName)));
  byId("collection-code").querySelector("code").textContent = example.code;
  byId("collection-items").replaceChildren();
  (applied ? example.after : example.items).forEach(([label,value]) => {
    const item = document.createElement("div"); item.className = "collection-item";
    if (label) { const key = document.createElement("small"); key.textContent = label; item.append(key); }
    const content = document.createElement("code"); content.textContent = value; item.append(content);
    byId("collection-items").append(item);
  });
  byId("collection-output").textContent = applied ? example.output : "—";
  feedback("collection-feedback", applied ? example.result : example.description, applied && collectionName === "tuple" ? "error" : "");
  byId("collection-apply").disabled = applied;
}
document.querySelectorAll("[data-collection]").forEach((button) => button.addEventListener("click", () => { collectionName = button.dataset.collection; renderCollection(); }));
byId("collection-apply").addEventListener("click", () => { collectionApplied[collectionName] = true; renderCollection(); });
byId("collection-reset").addEventListener("click", () => { collectionApplied[collectionName] = false; renderCollection(); });

// The previews implement only the fixed examples shown in the lesson.
const pythonWhitespace = /[\t\n\v\f\r\x1c-\x1f\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000 ]/u;
function stripText(text) {
  const characters = Array.from(text);
  while (characters.length && pythonWhitespace.test(characters[0])) characters.shift();
  while (characters.length && pythonWhitespace.test(characters[characters.length - 1])) characters.pop();
  return characters.join("");
}
function splitWords(text) {
  const stripped = stripText(text);
  return stripped === "" ? [] : stripped.split(/[\t\n\v\f\r\x1c-\x1f\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000 ]+/u);
}
function representString(text) {
  const quote = text.includes("'") && !text.includes('"') ? '"' : "'";
  const escapes = { "\\":"\\\\", "\n":"\\n", "\r":"\\r", "\t":"\\t" };
  return quote + Array.from(text).map((character) => {
    if (character === quote) return "\\" + character;
    if (Object.hasOwn(escapes, character)) return escapes[character];
    if (character !== " " && /[\p{C}\p{Z}]/u.test(character)) {
      const point = character.codePointAt(0);
      return point <= 255 ? "\\x" + point.toString(16).padStart(2, "0") : point <= 65535 ? "\\u" + point.toString(16).padStart(4, "0") : "\\U" + point.toString(16).padStart(8, "0");
    }
    return character;
  }).join("") + quote;
}
function stringCall() {
  const method = byId("string-method").value;
  const search = JSON.stringify(byId("string-search").value), replacement = JSON.stringify(byId("string-replacement").value);
  if (method === "replace") return `text.replace(${search}, ${replacement})`;
  if (method === "join") return `${replacement}.join(text.split())`;
  if (method === "startswith" || method === "find") return `text.${method}(${search})`;
  return `text.${method}()`;
}
function resetStringPreview() {
  const text = byId("string-text").value, method = byId("string-method").value;
  byId("string-search").closest("label").hidden = !["replace", "startswith", "find"].includes(method);
  byId("string-replacement").closest("label").hidden = !["replace", "join"].includes(method);
  byId("string-code").querySelector("code").textContent = `text = ${JSON.stringify(text)}\nresult = ${stringCall()}\nprint(result)`;
  byId("string-original").textContent = representString(text);
  byId("string-call").textContent = stringCall();
  byId("string-length").textContent = Array.from(text).length;
  ["string-result", "string-output", "string-type"].forEach((id) => byId(id).textContent = "—");
  feedback("string-feedback", "Choose a method, predict the returned value, then apply it.");
}
["string-text", "string-method", "string-search", "string-replacement"].forEach((id) => byId(id).addEventListener("input", resetStringPreview));
byId("string-apply").addEventListener("click", () => {
  const text = byId("string-text").value, search = byId("string-search").value, replacement = byId("string-replacement").value;
  const method = byId("string-method").value;
  let result, type = "str";
  if (method === "strip") result = stripText(text);
  if (method === "lower") result = text.toLowerCase();
  if (method === "upper") result = text.toUpperCase();
  if (method === "replace") result = search === "" ? replacement + Array.from(text).join(replacement) + (text === "" ? "" : replacement) : text.split(search).join(replacement);
  if (method === "split") { result = splitWords(text); type = "list"; }
  if (method === "join") result = splitWords(text).join(replacement);
  if (method === "startswith") { result = text.startsWith(search); type = "bool"; }
  if (method === "find") {
    const index = text.indexOf(search);
    result = index < 0 ? -1 : Array.from(text.slice(0, index)).length;
    type = "int";
  }
  const representation = type === "str" ? representString(result) : type === "list" ? "[" + result.map(representString).join(", ") + "]" : type === "bool" ? (result ? "True" : "False") : String(result);
  byId("string-result").textContent = representation;
  byId("string-output").textContent = type === "str" ? result : representation;
  byId("string-type").textContent = type;
  const messages = {
    strip:"Only leading and trailing whitespace is removed. Spaces between words stay in place.",
    lower:"The returned string has lowercase letters. The original string stays unchanged.",
    upper:"The returned string has uppercase letters. The original string stays unchanged.",
    replace:"Every non-overlapping match is replaced. An empty search inserts text at each character boundary.",
    split:"split() returns a list of words. Consecutive whitespace is treated as one separator.",
    join:"The separator joins the words returned by split(). The original whitespace is not preserved.",
    startswith:"startswith() returns a Boolean. The prefix comparison is case-sensitive.",
    find:"find() returns the first character index, or −1 if there is no match. An empty search returns 0."
  };
  feedback("string-feedback", result === "" ? "The returned string is empty, so print() produces a blank line. The original string stays unchanged." : messages[method], "success");
});

const cleanTrace = { index:0, original:"", value:"" };
function resetClean() {
  stopRun("clean");
  Object.assign(cleanTrace, { index:0, original:"", value:"" });
  highlight("clean-code", -1);
  ["clean-original", "clean-value", "clean-output"].forEach((id) => byId(id).textContent = "—");
  byId("clean-step").disabled = false;
  byId("clean-run").disabled = false;
  feedback("clean-feedback", "Trace each returned string. raw_name remains unchanged.");
}
function stepClean() {
  if (cleanTrace.index >= 5) return false;
  const index = cleanTrace.index++;
  if (index === 0) cleanTrace.original = byId("clean-input").value;
  if (index === 1) cleanTrace.value = stripText(cleanTrace.original);
  if (index === 2) cleanTrace.value = cleanTrace.value.toLowerCase();
  if (index === 3) cleanTrace.value = cleanTrace.value.split(" ").join("_");
  if (index === 4) byId("clean-output").textContent = cleanTrace.value;
  highlight("clean-code", index);
  byId("clean-original").textContent = representString(cleanTrace.original);
  byId("clean-value").textContent = index === 0 ? "—" : representString(cleanTrace.value);
  const messages = ["Read raw_name. No cleanup has happened yet.", "strip() returns a string without whitespace at its ends.", "lower() returns the lowercase version of clean_name.", 'replace(" ", "_") replaces each internal space with an underscore.', "Print clean_name. raw_name still contains the original input."];
  feedback("clean-feedback", messages[index], index === 4 ? "success" : "");
  if (cleanTrace.index === 5) { stopRun("clean"); byId("clean-step").disabled = true; byId("clean-run").disabled = true; return false; }
  return true;
}
byId("clean-input").addEventListener("input", resetClean);
byId("clean-step").addEventListener("click", () => { stopRun("clean"); stepClean(); });
byId("clean-run").addEventListener("click", () => toggleRun("clean", stepClean));
byId("clean-reset").addEventListener("click", resetClean);

function resetMath() {
  const method = byId("math-function").value, raw = byId("math-value").value;
  byId("math-value").max = method === "factorial" ? "10" : "100";
  const value = Number(raw), type = /[.eE]/.test(raw) ? "float" : "int";
  const literal = raw !== "" && Number.isFinite(value) ? pythonNumber(value, type) : "0";
  byId("math-code").querySelector("code").textContent = `import math\nvalue = ${literal}\nresult = math.${method}(value)\n${method === "sqrt" ? 'print(f"{result:.6f}")' : 'print(result)'}`;
  ["math-output", "math-type", "math-floor", "math-ceil", "math-trunc"].forEach((id) => byId(id).textContent = "—");
  feedback("math-feedback", "Inputs changed. Evaluate the function again.");
}
["math-value", "math-function"].forEach((id) => byId(id).addEventListener("input", resetMath));
byId("math-evaluate").addEventListener("click", () => {
  const value = readNumber("math-value"), method = byId("math-function").value;
  if (value === null) { feedback("math-feedback", "Enter a value from −20 to 100; factorial is limited to 10.", "error"); return; }
  byId("math-floor").textContent = Math.floor(value);
  byId("math-ceil").textContent = Math.ceil(value);
  byId("math-trunc").textContent = Math.trunc(value);
  if (method === "sqrt" && value < 0) {
    byId("math-output").textContent = "ValueError";
    byId("math-type").textContent = "—";
    feedback("math-feedback", "math.sqrt() accepts non-negative real values. A negative argument raises ValueError.", "error");
    return;
  }
  if (method === "factorial" && (/[.eE]/.test(byId("math-value").value) || !Number.isInteger(value))) {
    byId("math-output").textContent = "TypeError";
    byId("math-type").textContent = "—";
    feedback("math-feedback", "math.factorial() requires an int. A float such as 5.0 raises TypeError.", "error");
    return;
  }
  if (method === "factorial" && value < 0) {
    byId("math-output").textContent = "ValueError";
    byId("math-type").textContent = "—";
    feedback("math-feedback", "math.factorial() requires a non-negative integer. A negative int raises ValueError.", "error");
    return;
  }
  let result;
  if (method === "sqrt") result = Math.sqrt(value);
  if (method === "floor") result = Math.floor(value);
  if (method === "ceil") result = Math.ceil(value);
  if (method === "trunc") result = Math.trunc(value);
  if (method === "factorial") { result = 1; for (let i = 2; i <= value; i++) result *= i; }
  byId("math-output").textContent = method === "sqrt" ? result.toFixed(6) : String(result);
  byId("math-type").textContent = method === "sqrt" ? "float" : "int";
  const messages = {
    sqrt:"The square root is a float. Six decimal places are displayed.",
    floor:"floor moves toward negative infinity. Compare it with trunc for negative values.",
    ceil:"ceil moves toward positive infinity. Compare it with trunc for positive values.",
    trunc:"trunc removes the fractional part toward zero.",
    factorial:"The result is n!. 0! is 1, and 5! is 120."
  };
  feedback("math-feedback", messages[method], "success");
});

function updateCircle() {
  const radius = readNumber("circle-radius");
  byId("circle-output").textContent = "—";
  if (radius === null) {
    byId("circle-shape").setAttribute("r", "0");
    byId("circle-radius-line").setAttribute("x2", "160");
    byId("circle-radius-label").textContent = "radius = —";
    feedback("circle-feedback", "Enter a radius from 0 to 10 in steps of 0.5.", "error");
    return;
  }
  byId("circle-shape").setAttribute("r", String(radius * 10));
  byId("circle-radius-line").setAttribute("x2", String(160 + radius * 10));
  byId("circle-radius-label").textContent = `radius = ${radius}`;
  byId("circle-code").querySelector("code").textContent = `import math\nradius = ${pythonNumber(radius, "float")}\narea = math.pi * radius ** 2\nprint(f"Circle area: {area:.3f}")`;
  feedback("circle-feedback", "Radius changed. Predict the area, then calculate.");
}
byId("circle-radius").addEventListener("input", updateCircle);
byId("circle-calculate").addEventListener("click", () => {
  const radius = readNumber("circle-radius");
  if (radius === null) { updateCircle(); return; }
  byId("circle-output").textContent = `Circle area: ${(Math.PI * radius ** 2).toFixed(3)}`;
  feedback("circle-feedback", "Area uses the square of the radius. Doubling the radius multiplies the area by four.", "success");
});
function renderTrig() {
  const degrees = readNumber("trig-angle", true);
  if (degrees === null) return;
  const radians = degrees * Math.PI / 180, sine = Math.sin(radians), cosine = Math.cos(radians);
  const x = 170 + 90 * cosine, y = 130 - 90 * sine;
  byId("trig-angle-label").textContent = `${degrees}°`;
  byId("trig-radius").setAttribute("x2", x); byId("trig-radius").setAttribute("y2", y);
  byId("trig-point").setAttribute("cx", x); byId("trig-point").setAttribute("cy", y);
  byId("trig-x").setAttribute("x2", x);
  byId("trig-y").setAttribute("x1", x); byId("trig-y").setAttribute("x2", x); byId("trig-y").setAttribute("y2", y);
  byId("trig-code").querySelector("code").textContent = `import math\nangle_degrees = ${pythonNumber(degrees, "float")}\nangle_radians = math.radians(angle_degrees)\nprint(f"Radians: {angle_radians:.6f}")\nprint(f"Sine: {math.sin(angle_radians):.6f}")\nprint(f"Cosine: {math.cos(angle_radians):.6f}")`;
  byId("trig-output").textContent = `Radians: ${radians.toFixed(6)}\nSine: ${sine.toFixed(6)}\nCosine: ${cosine.toFixed(6)}`;
  feedback("trig-feedback", "{degrees}° equals {radians} radians. On the unit circle, x is cosine and y is sine.", "", { degrees, radians:radians.toFixed(6) });
}
byId("trig-angle").addEventListener("input", renderTrig);
resetStringPreview();
renderTrig();

selectType("int");
renderCollection();
languageButtons.forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.language)));
let savedLanguage = "en";
try { savedLanguage = localStorage.getItem("algorithm101-language") || "en"; } catch { /* Default to English when storage is unavailable. */ }
setLanguage(savedLanguage);
languageButtons.forEach((button) => button.disabled = false);
document.body.classList.add("enhanced");
showSection(location.hash.slice(1));
