# 📘 JavaScript Function Object — Engine Level Understanding

> **"একটা function কোড না। একটা function হলো একটা reusable executable object।"**

এটা **architecture** নিয়ে, syntax না।
এটা weak থাকলে → `this`, `bind`, `new`, closures কখনোই পুরোপুরি বুঝবে না।

---

## 📑 Table of Contents

| Part             | Topic                                            |
| ---------------- | ------------------------------------------------ |
| **Part 1** | Foundation — Why This Matters                   |
| **Part 2** | Function Object — What It Really Is             |
| **Part 3** | Internal Slots — Engine View                    |
| **Part 4** | `this` — The Runtime Mystery                  |
| **Part 5** | Function Object vs Execution Context             |
| **Part 6** | Complete Flow — AST to Execution                |
| **Part 7** | `this` SET vs BOUND — The Critical Difference |
| **Part 8** | Practice & Checkpoint                            |

<br>

# Part 1: Foundation — Why This Matters

## ❌ Common Misconceptions

বেশিরভাগ JavaScript developer fail করে কারণ তারা বিশ্বাস করে:

- function জিনিস মনে রাখে
- `this` function-এর অংশ
- function "শুধুই code block"

**এই সবগুলোই ভুল।**

## ✅ What You Will Actually Learn

- Engine আসলে কী তৈরি করে
- **execution-এর আগে** কী থাকে
- **শুধুমাত্র execution-এর সময়** কী থাকে
- কেন `this` কখনোই function-এর ভেতরে থাকতে পারে না
- কেন `bind` অবশ্যই নতুন function তৈরি করে
- কেন `call/apply` করে না

<br>

# Part 2: Function Object — What It Really Is

## 2.1 When JS Sees a Function — What Really Happens

### Source code:

```js
function foo(a, b) {
  console.log(this, a, b)
}
```

### ❌ Beginner mental model:

> "JS এই code store করে রাখে এবং পরে run করে"

### ✅ Engine mental model:

> **"আমাকে একটা FUNCTION OBJECT তৈরি করতে হবে।"**

Engine "code blocks"-এর ভাষায় চিন্তা করে না।
সে চিন্তা করে **objects এবং execution behavior**-এর ভাষায়।

## 2.2 A Function is NOT Code

একটা function হলো **memory-তে একটা OBJECT**।

ঠিক যেমন:

```js
const obj = {}
```

একটা object তৈরি করে,

```js
function foo() {}
```

এটাও একটা object তৈরি করে — কিন্তু একটা **special executable object**।

## 2.3 Where Does the Function Object Live?

👉 **HEAP MEMORY**

- ❌ stack-এ না
- ❌ execution context-এ না
- ❌ variable-এর ভেতরে না

### Conceptually:

```
Heap:
  foo ───► FunctionObject
```

📌 এটা হয় **parsing / compilation**-এর সময়
📌 **কোনো code run হওয়ার আগেই**

## 2.4 When Function Objects Are Created (VERY IMPORTANT)

Function objects তৈরি হয়:

| ✅ কখন                                     | ❌ কখন না                        |
| --------------------------------------------- | ------------------------------------- |
| **parsing / compilation**-এর সময় | execution-এর সময়               |
|                                               | execution-context তৈরির সময় |

এর মানে:

- Function থাকে **call হওয়ার আগেই**
- Execution context function-কে **ব্যবহার করে** — সে তৈরি করে না

<br>

# Part 3: Internal Slots — Engine View

## 3.1 Function Object — Internal Structure

একটা Function Object **সাধারণ JS object না**।

অভ্যন্তরীণভাবে (conceptually):

```
FunctionObject foo
├─ [[Code]]
├─ [[Environment]]
├─ [[Call]]
├─ [[Construct]]
└─ [[Prototype]]
```

⚠️ এগুলো **internal slots**
⚠️ তুমি JavaScript-এ এগুলো access করতে পারবে না
⚠️ এগুলো শুধুমাত্র engine-এর ভেতরে থাকে

## 3.2 [[Code]] — What It Really Is

❌ source text না
❌ string না

`[[Code]]` represent করে:

- Parsed instructions
- Bytecode
- অথবা JIT-compiled machine code

> **"কীভাবে এই function execute করতে হবে"**

## 3.3 [[Environment]] — THIS IS CLOSURES

যখন function object তৈরি হয়, engine store করে:

```
[[Environment]] → Lexical Environment of definition
```

### Example:

```js
let x = 10

function foo() {
  console.log(x)
}
```

অভ্যন্তরীণভাবে:

```
foo.[[Environment]] → Global Lexical Environment
```

📌 এই কারণেই **closures কাজ করে**
📌 এটা **একবারই** set হয়
📌 এটা **কখনো বদলায় না**

## 3.4 [[Call]] — Normal Function Execution

ব্যবহার হয় যখন তুমি করো:

```js
foo()
obj.foo()
foo.call(x)
```

Engine perform করে: `foo.[[Call]]`

যা অভ্যন্তরীণভাবে করে:

1. Execution context তৈরি করে
2. `thisBinding` তৈরি করে
3. Parameters assign করে
4. `[[Code]]` execute করে

## 3.5 [[Construct]] — Constructor Execution

ব্যবহার হয় যখন তুমি করো:

```js
new foo()
```

Engine perform করে: `foo.[[Construct]]`

যা অভ্যন্তরীণভাবে করে:

1. Empty object `{}` তৈরি করে
2. `object.__proto__ → foo.prototype` set করে
3. `this`-কে সেই object-এ bind করে
4. Function code execute করে
5. Object return করে

## 3.6 Why Arrow Functions Break `new`

```js
const f = () => {}
new f() // ❌ TypeError
```

কারণ arrow functions:

- ❌ `[[Construct]]` নেই
- ✅ শুধু `[[Call]]` আছে

তারা **constructable না**।

<br>

# Part 4: `this` — The Runtime Mystery

## 4.1 What is NOT Inside a Function Object (CRITICAL)

🚨 **FUNCTION OBJECT-এর ভেতরে কোনো `this` নেই**

Function object store করে না:

- ❌ `this`
- ❌ আগের calls
- ❌ execution state
- ❌ call history

## 4.2 Why `this` Cannot Be Stored

বিবেচনা করো:

```js
foo()           // this = undefined (strict) or global
obj.foo()       // this = obj
foo.call(x)     // this = x
new foo()       // this = new object
```

একই function → আলাদা `this`

কোনটা function store করবে? 👉 **অসম্ভব**

তাই engine design হলো:

> **"`this` নির্ধারিত হবে শুধুমাত্র যখন function execute হবে।"**

## 4.3 Where `this` Actually Lives

`this` থাকে শুধুমাত্র এখানে:

```
ExecutionContext
├─ LexicalEnvironment
├─ VariableEnvironment
└─ thisBinding   ✅
```

📌 Execution Context থাকে **শুধুমাত্র যখন code চলছে**

<br>

# Part 5: Function Object vs Execution Context

## 5.1 Key Differences (LOCK THIS IN)

| Function Object                    | Execution Context                     |
| ---------------------------------- | ------------------------------------- |
| **parse time**-এ তৈরি   | **call time**-এ তৈরি       |
| **heap**-এ থাকে         | **stack**-এ থাকে           |
| **Reusable**                 | **প্রতি call-এ একটা** |
| `[[Code]]` আছে                | variables আছে                      |
| **কোনো `this` নেই** | `thisBinding` আছে                |

## 5.2 Function Object is a Blueprint

এভাবে চিন্তা করো:

| Concept                     | Analogy             |
| --------------------------- | ------------------- |
| **Function Object**   | Machine (blueprint) |
| **Execution Context** | Machine চলছে    |

তুমি একই machine ১০০ বার on করতে পারো।
প্রতিটা run = নতুন execution context।

## 5.3 Inner Functions — Important Clarification

### Example:

```js
function outer() {
  function inner() {}
}
```

### Compilation-এর সময়:

```
Heap:
  outer ──► FunctionObject
  inner ──► FunctionObject
```

### Execution context তৈরির সময়:

```
Outer Execution Context:
  inner → reference to FunctionObject
```

🚨 Inner function object **নতুন করে তৈরি হয় না**
🚨 Scope শুধু **address/reference** store করে

<br>

# Part 6: Complete Flow — AST to Execution

## 6.1 The Full Pipeline

```
Source Code
     ↓
Parsing → AST (TEMPORARY)
     ↓
Compilation → Function Objects + Bytecode
     ↓
Execution → Execution Contexts created
```

**Key Points:**

- AST **runtime না**
- Function objects তৈরি হয় **AST-এর পরে**
- Execution contexts থাকে **শুধুমাত্র execution-এর সময়**

## 6.2 Why This Knowledge is Critical

এখন তুমি logically বুঝতে পারবে:

| Question                                                      | Answer                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| কেন `this` call-site-এর উপর depend করে?          | কারণ `this` Execution Context-এ, Function Object-এ না          |
| কেন arrow functions `this` ignore করে?                | তাদের নিজস্ব `thisBinding` নেই                           |
| কেন `bind` নতুন function তৈরি করতে হয়?   | bound `this` value store করতে                                      |
| কেন `call/apply` নতুন function তৈরি করে না? | তারা শুধু`thisBinding` temporarily set করে                  |
| কেন `new` সবকিছু বদলে দেয়?                | এটা`[[Call]]`-এর বদলে `[[Construct]]` ব্যবহার করে |

**মুখস্থ না। শুধু cause → effect।**

<br>

# Part 7: `this` SET vs BOUND — The Critical Difference

## 7.1 Short Answer

| Term                      | Meaning                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------- |
| **"this is SET"**   | call time-এ engine**automatically** করে                                       |
| **"this is BOUND"** | তুমি`bind` / `call` / `apply` ব্যবহার করে **manually** করো |

> **Setting = Engine decision**
> **Binding = Developer control**

## 7.2 What Does "this is SET" Mean?

**`this` Setting** মানে JavaScript engine নির্ধারণ করে `this`-এর value যখন function execute হয়।

- এটা হয় **প্রতিবার** function call হলে
- তুমি **কিছুই manually করো না**

### Example: Implicit Setting

```js
const obj = {
  x: 10,
  foo() {
    console.log(this.x)
  }
}

obj.foo()  // this = obj
```

**অভ্যন্তরীণভাবে যা হয়:**

1. Engine call expression দেখে: `obj.foo()`
2. Execution context তৈরি করে
3. **Sets** `this = obj`
4. Function execute করে

✅ `this` **set** হয়েছে, bound না
✅ কোনো `bind` নেই, `call` নেই, `apply` নেই

### Example: Default Setting

```js
function foo() {
  console.log(this)
}

foo()
```

**Engine logic:**

- ❌ `new` না
- ❌ `call/apply/bind` না
- ❌ `obj.method()` না
- ➡️ **default rule apply হয়**

তাই engine **sets**:

- Sloppy mode → `this = global`
- Strict mode → `this = undefined`

✅ `this` **automatically** set হয়

## 7.3 What Does "this is BOUND" Mean?

**`this` Binding** মানে তুমি **explicitly force** করো `this` কী হবে।

তুমি এটা করো using:

- `bind()`
- `call()`
- `apply()`

This **overrides** the engine's default behavior.

### Example: `bind()`

```js
function foo() {
  console.log(this)
}

const boundFoo = foo.bind({ a: 1 })
boundFoo()  // this = { a: 1 }
```

**What happens:**

1. `bind` creates a **new function**
2. That function **remembers** `{ a: 1 }`
3. When called → `this` is **forced** to `{ a: 1 }`

✅ `this` is **bound**, not set by call-site

### Example: `call()`

```js
foo.call({ a: 1 })  // this = { a: 1 }
```

**Engine behavior:**

1. Create execution context
2. **Force** `this = { a: 1 }`
3. Execute immediately

✅ This is **binding**

## 7.4 Core Difference Table

| Aspect                      | `this` is SET | `this` is BOUND               |
| --------------------------- | --------------- | ------------------------------- |
| **Who decides**       | JS engine       | You                             |
| **When**              | At call time    | Before or during call           |
| **How**               | Call-site rules | `bind` / `call` / `apply` |
| **Automatic**         | ✅ Yes          | ❌ No                           |
| **Can be overridden** | ✅ Yes          | ❌ No (bind is permanent)       |

## 7.5 Priority Order (Engine Decision Flow)

When a function is called, the engine checks in this order:

```
1️⃣ new           → sets this to new object
2️⃣ bind          → binds this permanently
3️⃣ call / apply  → binds this temporarily
4️⃣ obj.method()  → sets this to object
5️⃣ plain call    → sets default this
```

**Key insight:**

- Binding **beats** setting
- `new` **beats** binding

## 7.6 Arrow Functions (Important Exception)

```js
const foo = () => {
  console.log(this)
}

foo.call({ a: 1 })  // ❌ ignored, uses lexical this
new foo()           // ❌ TypeError
```

Arrow functions:

- ❌ do NOT **set** `this`
- ❌ do NOT **bind** `this`
- ✅ **capture** `this` lexically (from surrounding scope)

> Arrow functions **opt out** of both setting and binding.

## 7.7 One-Line Mental Model

> **"this is set by the engine, but bound by the developer."**

Or even simpler:

> **Setting is automatic. Binding is deliberate.**

## 7.8 Interview-Grade Explanation

If an interviewer asks:

> "What's the difference between `this` being set and bound?"

**Your answer:**

> "`this` is **set automatically** by the engine at call time using call-site rules. `bind`, `call`, and `apply` **explicitly bind** `this`, overriding that default behavior."

<br>

# Part 8: Practice & Checkpoint

## 🧠 One-Sentence Mental Model

> **A function is a heap-allocated executable object; `this` is a runtime binding created inside an execution context, never stored in the function itself.**

## ✍️ Practice 1 — Explain Out Loud

Answer this question:

> "What is a function in JavaScript at engine level?"

You MUST mention:

- Object
- Heap
- Internal slots (`[[Code]]`, `[[Environment]]`, `[[Call]]`)
- No `this` stored

## ✍️ Practice 2 — True / False

| Statement                                          | Answer |
| -------------------------------------------------- | ------ |
| Function objects are created during execution      | ❌     |
| `this` is part of function definition            | ❌     |
| Arrow functions have `[[Construct]]`             | ❌     |
| Same function can have multiple execution contexts | ✅     |
| `[[Environment]]` changes on each call           | ❌     |
| Execution context lives on heap                    | ❌     |
| `bind` creates a new function                    | ✅     |
| `call` creates a new function                    | ❌     |

## ✍️ Practice 3 — SET or BOUND?

### Question 1:

```js
const obj = {
  foo() {
    console.log(this)
  }
}

const f = obj.foo
f()
```

Was `this` set or bound?
👉 **SET** (default setting — `undefined` in strict mode)

### Question 2:

```js
const g = obj.foo.bind(obj)
g()
```

Was `this` set or bound?
👉 **BOUND** (explicitly via `bind`)

### Question 3:

```js
obj.foo()
```

Was `this` set or bound?
👉 **SET** (implicit setting — `this = obj`)

### Question 4:

```js
obj.foo.call({ x: 99 })
```

Was `this` set or bound?
👉 **BOUND** (explicitly via `call`)

## 🔒 Checkpoint — Is This Clear Now?

If these feel obvious, you're DONE:

- ✅ Function exists before execution
- ✅ Execution context exists only during execution
- ✅ `this` is call-time, not definition-time
- ✅ `bind` must create new function
- ✅ `call/apply` reuse same function
- ✅ Arrow functions have no `[[Construct]]`
- ✅ Setting is automatic, binding is deliberate

## 📊 Quick Reference Tables

### Function Object vs Execution Context

| Concept           | Created When | Lives Where         | Contains                                                           |
| ----------------- | ------------ | ------------------- | ------------------------------------------------------------------ |
| Function Object   | Parse time   | Heap                | `[[Code]]`, `[[Environment]]`, `[[Call]]`, `[[Construct]]` |
| Execution Context | Call time    | Stack               | Variables,`thisBinding`                                          |
| `this`          | Call time    | Execution Context   | Determined by call-site                                            |
| Closure           | Parse time   | `[[Environment]]` | Reference to outer scope                                           |

### Complete `this` Reference

| Call Pattern      | `this` Value             | SET or BOUND       |
| ----------------- | -------------------------- | ------------------ |
| `foo()`         | `undefined` / `global` | SET (default)      |
| `obj.foo()`     | `obj`                    | SET (implicit)     |
| `foo.call(x)`   | `x`                      | BOUND (temporary)  |
| `foo.apply(x)`  | `x`                      | BOUND (temporary)  |
| `foo.bind(x)()` | `x`                      | BOUND (permanent)  |
| `new foo()`     | new object                 | SET (by `new`)   |
| `() => {}`      | lexical                    | NEITHER (captured) |

✅ **Note Complete!**
