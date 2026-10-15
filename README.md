# Algorithm and Programming 101

Weekly lecture notes and interactive practices for beginner computer engineering students. The course uses Python 3.

Open the root [index.html](index.html) to select a week, preview its topics and practices, jump directly to a section, or download a Python sample. The selector supports EN/TR, keyboard navigation, and offline use. Each lecture links back to the selector.

## Week 1

Open [week-01/index.html](week-01/index.html) directly in a browser. It works offline without installing dependencies. JavaScript enables the exercises; the notes remain readable without it.

Topics:

1. Algorithms and precise instructions
2. Problem statements, inputs, processing, and outputs
3. Sequence, variables, and pseudocode
4. Flowcharts and decisions
5. Tracing, testing, and debugging
6. Python history and the interpreter
7. Python syntax, values, expressions, and indentation
8. Keyboard input, type conversion, and output
9. Perimeter exercise and recap questions

Use the section navigation or Previous/Next buttons during lectures. **Lecture view** enlarges text and code. **Print notes** includes all sections and revealed solutions.

Use the **EN** and **TR** buttons to switch between English and Turkish. The notes, controls, exercise feedback, and printed explanations follow the selected language. Switching preserves the current exercise state, and the browser remembers the choice when local storage is available. All code examples, pseudocode, variable names, comments, and program strings stay in English.

Keep `index.html` and `translations.js` together when sharing the lesson folder; both work locally without an internet connection.

The browser controls provide guided previews of the displayed examples. Run the matching Python programs from the repository folder:

```sh
python3 week-01/src/hello.py
python3 week-01/src/sum.py
python3 week-01/src/larger.py
python3 week-01/src/rectangle.py
python3 week-01/src/perimeter.py
```

Samples assume valid integer input. Rectangle dimensions must be positive. Input validation and exception handling are later topics.

## Week 2

Open [week-02/index.html](week-02/index.html) directly in a browser. Keep `styles.css`, `app.js`, `translations.js`, and `src/` alongside it when sharing the folder. The lesson works offline and uses the same section navigation and **EN / TR** controls as Week 1, with navy, violet, and teal colors.

Topics and guided practices:

1. Week 1 recap and output prediction
2. Variables, reassignment, and a trace table
3. `int`, `float`, `str`, `bool`, and type inspection
4. Input conversion, f-strings, and a temperature converter
5. Expressions, precedence, floor division, remainder, and even/odd classification
6. Comparisons, Boolean logic, truth tables, and inclusive ranges
7. `if / elif / else` with synchronized code and flowchart tracing
8. Independent and nested decisions
9. Shipping-cost exercise, worked pseudocode/flowchart/Python, and recap questions
10. String methods, returned types, and a name-cleanup trace
11. The `math` module: rounding, roots, factorials, circle area, and radians
12. Collection previews: `list`, `tuple`, `dict`, and `set`

Language switching preserves inputs, traces, quiz answers, and collection examples. Code, variable names, comments, and program output remain English. There are no lecture-view or print controls in Week 2.

Run the Python samples from the repository folder:

```sh
python3 week-02/src/assignment_trace.py
python3 week-02/src/temperature_converter.py
python3 week-02/src/even_odd.py
python3 week-02/src/grade_classifier.py
python3 week-02/src/range_check.py
python3 week-02/src/shipping_cost.py
python3 week-02/src/string_methods.py
python3 week-02/src/math_library.py
```

Samples assume valid numeric input. The grade classifier assumes an integer score from 0 to 100. Shipping accepts numeric weights in `(0, 10]` kg, prints `Invalid weight` outside that range, and treats the exact answer `yes` as membership. Rates are fixed classroom examples in credits. Browser controls preview these programs with the input limits shown in each activity.

## Week 3

Open [week-03/index.html](week-03/index.html). Keep its CSS, JavaScript, and `src/` folder together. The EN/TR lecture emphasizes Python code: 11 sections, code comparisons, four step/run/reset traces, and interactive string, list, tuple, dictionary, set, and collection-selection activities. Code, comments, variable names, and output remain English.

Topics:

1. Values and collections recap
2. String indexing, negative indexes, slicing, and membership
3. Choosing between lists, tuples, dictionaries, and sets
4. List statements, method return values, and mutation
5. Tuples, unpacking, and immutability
6. Dictionary access, updates, missing keys, and nested values
7. Set membership and operations
8. References, identity, copying, and shared nested lists
9. Student-profile walkthrough and code-prediction questions
10. Downloadable examples and a brief Week 4 loop preview

The browser simulates the displayed statements with editable parameters; it does not execute arbitrary Python. Examples and activities work offline. Notes and code remain readable without JavaScript. Input limits are shown in each activity. Set output is sorted explicitly for reproducibility.

Run and edit these examples locally:

```sh
python3 week-03/src/collection_basics.py
python3 week-03/src/string_indexing.py
python3 week-03/src/string_slicing.py
python3 week-03/src/list_operations.py
python3 week-03/src/tuple_unpacking.py
python3 week-03/src/dictionary_records.py
python3 week-03/src/set_operations.py
python3 week-03/src/references_and_copies.py
python3 week-03/src/shallow_copy.py
python3 week-03/src/student_profile.py
```

Week 4 introduces `for`, `while`, `range()`, and accumulating results.

Future weeks follow the same structure: `week-NN/index.html`, with a `src/` folder when the lesson includes source examples.
