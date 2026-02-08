# JavaScript Execution Context — Internal Flow Documentation

এই document-টি JavaScript-এর Execution Context-এর একটি বিস্তারিত breakdown দেয়, যার মধ্যে আছে এর internal structure, memory model এবং variable resolution process।

## Topics Covered

- **Execution Context**: যে environment-এ JavaScript code evaluate এবং execute হয়
- **Internal Structure**: LexicalEnvironment, VariableEnvironment, এবং thisBinding
- **EnvironmentRecord**: Variable bindings-এর জন্য memory storage
- **Phases of Execution**: Creation Phase এবং Execution Phase
- **Scope Chain**: Variable lookup এবং identifier resolution
- **Function Storage**: Memory allocation এবং references
- **Stack vs Heap**: Temporary vs persistent memory
- **Closures**: Lexical environment retention
- **Garbage Collection**: Reachability-এর উপর ভিত্তি করে memory release
- **Golden Rules**: JavaScript internals-এর mental models

---

## 1. What is Execution Context?

**Execution Context** = যে environment-এ JS code execute হয়

এটা manage করে:

- variables
- functions
- scope info
- `this` binding
- সেই execution-এর জন্য memory

---

## 2. Execution Context Structure

```
ExecutionContext
├─ LexicalEnvironment (let/const/params + outer)
├─ VariableEnvironment (var/functions)
└─ thisBinding
```

---

## 3. LexicalEnvironment

**যা store করে:**

- `let`
- `const`
- block-scoped variables
- parameters
- catch variables

**Structure:**

```javascript
LexicalEnvironment {
  EnvironmentRecord,    // variables এখানে stored
  outer                 // parent reference (scope chain)
}
```

**Note:** Parameters `let`-এর মতো behave করে, `var`-এর মতো না — তাই এরা এখানে থাকে!

---

## 4. EnvironmentRecord (Actual Memory Table)

**Real storage (hashmap/dictionary):**

```javascript
{
  a: 10,
  b: 20,
  sayHi: function(){}
}
```

প্রতিটা binding internally store করে:

```javascript
{
  value,
  initialized,  // TDZ check
  mutable,
  deletable
}
```

---

## 5. VariableEnvironment

**যা store করে:**

- `var`
- function declarations

**Structure:**

```javascript
VariableEnvironment {
  EnvironmentRecord
}
```

**Note:** এখানে কোনো `outer` নেই; chaining শুধুমাত্র LexicalEnvironment-এর মাধ্যমে হয়।

---

## 6. thisBinding

**যা store করে:** `this`-এর value

**Call type-এর উপর depend করে:**

| Call Type      | `this` Value                |
| -------------- | ----------------------------- |
| Browser global | `window`                    |
| Node global    | `global`/`module.exports` |
| Method call    | object                        |
| Constructor    | new instance                  |
| Strict mode    | `undefined`                 |
| Arrow function | inherited                     |

---

## 7. Creation Phase vs Execution Phase

প্রতিটা context **two passes**-এ run হয়:

### Creation Phase (Memory Setup)

- Memory allocate করে
- Declarations register করে
- `this` set করে
- Scope chain build করে

| Type                 | Stored as            |
| -------------------- | -------------------- |
| var                  | undefined            |
| let/const            | uninitialized (TDZ)  |
| function declaration | full function object |
| parameters           | argument values      |
| this                 | binding created      |

**এখানে create হয় না:** arrow functions, function expressions, `new Function()`

### Execution Phase

- Values assign করে
- Line-by-line code run করে
- Expressions evaluate করে
- Functions call করে

---

## 8. Scope Chain

Lexical Environments-এর Linked list

```
current → parent → parent → global → null
```

**Lookup algorithm:**

```javascript
let env = current
while (env != null) {
  if (found) return value
  env = env.outer
}
throw ReferenceError
```

---

## 9. Part 1 — Parameters

### Example

```javascript
function sum(a, b) {
  console.log(a, b)
}
sum(10, 20)
```

### What Beginners Think

অনেকে মনে করে: `parameters = special thing` ❌

### Reality

Parameters হলো শুধুই **JS দ্বারা automatically create হওয়া local variables**

Engine এদের এভাবে treat করে:

```javascript
let a = 10
let b = 20
```

### Creation Phase Step-by-Step

যখন `sum(10, 20)` call হয়:

**Step 1 — New Execution Context created**

```javascript
LexicalEnvironment {
  EnvironmentRecord: {}
}
```

**Step 2 — Parameters stored**

Engine insert করে:

```javascript
a → 10
b → 20
```

Result:

```javascript
EnvironmentRecord {
  a: 10,
  b: 20
}
```

### Important Behavior

যেহেতু এরা `let`-এর মতো behave করে:

- ✅ block scoped
- ✅ var-এর মতো hoisted না
- ✅ outer scope থেকে separate
- ✅ outer variables-কে shadow করে

### Example: Parameter Shadowing

```javascript
let a = 100

function test(a) {
  console.log(a)
}

test(5)  // Output: 5
```

কেন? কারণ parameter `a` outer `a`-কে shadow করে

Same as:

```javascript
function test() {
  let a = 5
}
```

### Rule

Parameters **LexicalEnvironment**-এ থাকে, VariableEnvironment-এ না

কারণ: এরা `let`-এর মতো block scoped

---

## 10. Part 2 — Catch Variables

### Example

```javascript
try {
  throw "error"
} catch (err) {
  console.log(err)
}
```

### Reality

JS **catch block-এর জন্য একটা special temporary LexicalEnvironment create করে**

### Step-by-Step Internally

যখন catch run হয়, engine create করে:

```javascript
LexicalEnvironment_catch {
  EnvironmentRecord {
    err: "error"
  }
  outer → parent
}
```

### Why Special Environment?

Catch variable অবশ্যই:

- ✅ শুধুমাত্র catch-এর ভেতরে exist করবে
- ❌ বাইরে leak হবে না

### Example: Scope Isolation

```javascript
try {
  throw "error"
} catch (err) {
  console.log(err)  // ✅ "error"
}

console.log(err)    // ❌ ReferenceError
```

কারণ: block-এর পরে `err` destroy হয়ে যায়

### How Engine Ensures This

এভাবে:

- শুধুমাত্র catch-এর জন্য একটা NEW LexicalEnvironment create করে
- Block end হওয়ার পর সেটা delete করে

### Visual

```
Global LexicalEnv
  ↓
Catch LexicalEnv (temporary)
  err → "error"
```

Block-এর পরে:

```
Catch LexicalEnv destroyed
```

### Why NOT VariableEnvironment?

কারণ:

VariableEnvironment হলো: `var` + function declarations-এর জন্য

এবং: `var` হলো function-scoped

কিন্তু: parameters + catch অবশ্যই block-scoped হতে হবে

তাই: **LexicalEnvironment**

---

## 11. Final Comparison

| Thing         | Stored in   | Why                      |
| ------------- | ----------- | ------------------------ |
| let/const     | LexicalEnv  | block scoped             |
| parameters    | LexicalEnv  | block scoped             |
| catch vars    | LexicalEnv  | block scoped + temporary |
| var           | VariableEnv | function scoped          |
| function decl | VariableEnv | hoisted                  |

---

## 12. Super Simple Mental Model

এভাবে চিন্তা করো:

```
LexicalEnvironment  = modern variables
VariableEnvironment = old var stuff
```

তাই: parameters & catch modern-এর মতো behave করে → Lexical-এ যায়

---

## 13. Function Storage

Declaring-এর সময়:

```javascript
function sum(a, b) { return a + b }
```

- **EnvironmentRecord:** `sum` → reference (address)
- **Heap:** function object store করে (`[[Code]]`, `[[ParamNames]]`, `[[Scope]]`)
- শুধুমাত্র reference scope-এ stored; body heap-এ থাকে
- Parameters শুধুমাত্র function call হলে create হয়

---

## 14. Stack vs Heap (Closures!)

### Stack (Temporary)

- Execution contexts store করে (call order)
- Function return করলে destroy হয়

### Heap (Persistent)

- Variables, objects, functions, lexical environments store করে
- Automatically destroy হয় না

---

## 15. Closures

**Definition:** Closure = function + তার outer lexical environment-এর reference

### Example

```javascript
function outer() {
  let count = 0
  return function inner() {
    console.log(count)
  }
}
const fn = outer()
fn()  // prints 0
```

`inner` `outer`-এর environment-এর reference রাখে, তাই `count` alive থাকে।

---

## 16. Garbage Collection & Closures

- Memory delete হয় **শুধুমাত্র যখন কোনো references থাকে না** (reachability rule)
- Closures environments-কে alive রাখে যতক্ষণ তাদের reference থাকে

### Example

```javascript
function outer() {
  let x = 10
  return function inner() { 
    console.log(x) 
  }
}
const fn = outer()   // x alive থাকে
fn = null            // এখন x garbage collected হতে পারে
```

---

## 17. Example: Full Walkthrough

```javascript
var a = 10
let b = 20

function outer(x) {
  var c = 30
  let d = 40

  function inner() {
    let e = 50
    console.log(a, b, c, d, e, x)
  }

  inner()
}

outer(99)
```

### Global Context

- Lexical: b → `<uninitialized>`
- Variable: a → undefined, outer → function
- this: window/global

### Outer() Context

- Lexical: x → 99, d → `<uninitialized>`
- Variable: c → undefined, inner → function

### Inner() Context

- Lexical: e → `<uninitialized>`
- Variable: {}

### Variable Lookup Table

| Variable | Found in    | Value |
| -------- | ----------- | ----- |
| e        | inner       | 50    |
| x        | outer       | 99    |
| d        | outer       | 40    |
| c        | outer(var)  | 30    |
| b        | global      | 20    |
| a        | global(var) | 10    |

**Output:** `10 20 30 40 50 99`

---

## 18. Final Mental Model

```
ExecutionContext
├─ LexicalEnvironment (let/const/params + outer)
├─ VariableEnvironment (var/functions)
└─ this

Stack → execution only
Heap → variables এখানে থাকে
Closures → heap-কে alive রাখে
```

---

## 19. Golden Rules

- ✅ প্রতিটা function call = new Execution Context
- ✅ Execution-এর আগে Creation হয়
- ✅ Scope chain LexicalEnvironment.outer use করে
- ✅ let/const-এর TDZ আছে
- ✅ parameters let-এর মতো behave করে
- ✅ functions heap-এ stored
- ✅ stack frames return-এর পর die করে
- ✅ closures lexical environments-কে alive রাখে
- ✅ memory delete হয় শুধুমাত্র যখন কোনো references নেই

---

## 20. One-Line Summary

JavaScript variables heap-based lexical environments-এ store করে, scope chain-এর মাধ্যমে resolve করে, এবং closures সেই environments-কে alive রাখে যতক্ষণ না কোনো references থাকে।

---

# Node.js `this` Binding — Complete Internal Flow

---

## Why Node.js is Different from Browsers

### Browser Behavior

```javascript
var a = 10
console.log(this)  // → window
```

Scripts directly **global scope**-এ run হয়।

### Node.js Behavior

Node **প্রতিটা file-কে একটা function-এ wrap করে** execution-এর আগে:

```javascript
(function (exports, require, module, __filename, __dirname) {
    // তোমার entire file এখানে execute হয়
})
```

**Result:** তোমার code global scope-এ না — এটা একটা function-এর ভেতরে।

---

## Rule #1: Top-Level `this` in Node

```javascript
console.log(this)
```

**Output:**

```javascript
{}  // ← module.exports
```

**`global` না** ❌

### Why?

```javascript
this === module.exports  // ✅ Top-level-এ always true
```

---

## All `this` Binding Cases in Node

### Case 1: Top-Level (File Scope)

```javascript
console.log(this)
// → {}  (module.exports)
```

### Case 2: Normal Function Call

```javascript
function test() {
  console.log(this)
}

test()  // → global
```

| Mode   | `this`      |
| ------ | ------------- |
| Normal | `global`    |
| Strict | `undefined` |

### Case 3: Method Call

```javascript
const obj = {
  x: 10,
  test() {
    console.log(this)
  }
}

obj.test()  // → obj (implicit binding)
```

### Case 4: Constructor (`new`)

```javascript
function Person(name) {
  this.name = name
}

const p = new Person("Raj")  // → new empty object {}
```

**Steps:**

1. Empty object `{}` create করে
2. `this`-কে সেই object-এ bind করে
3. Function body execute করে
4. Object return করে

### Case 5: Arrow Functions

```javascript
const obj = {
  x: 10,
  test: () => console.log(this)
}

obj.test()  // → {}  (NOT obj)
```

**Why?** Arrows-এর **own `this` নেই** — এরা parent scope (module wrapper) থেকে inherit করে।

### Case 6: setTimeout / Callbacks

```javascript
setTimeout(function() {
  console.log(this)
}, 0)  // → Timeout { ... }

setTimeout(() => {
  console.log(this)
}, 0)  // → {}  (inherits)
```

---

## Quick Reference Table

| Scenario          | `this` Value     |
| ----------------- | ------------------ |
| Top-level         | `module.exports` |
| Normal function   | `global`         |
| Strict function   | `undefined`      |
| Method call       | The object         |
| Constructor       | New instance       |
| Arrow function    | Inherited          |
| setTimeout(fn)    | Timer object       |
| setTimeout(arrow) | Inherited          |

---

## Mental Model

```
Browser:  file → global scope → this = window
Node:     file → wrapped function → this = module.exports
```

**Visual:**

```javascript
// What Node actually runs:
(function(exports, require, module, __filename, __dirname) {
    console.log(this)  // ← this === module.exports
})
```

---

---
