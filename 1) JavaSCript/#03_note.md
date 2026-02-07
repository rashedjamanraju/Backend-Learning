# 📘 JavaScript Function Object — Engine Level Understanding

> **"A function is not code. A function is a reusable executable object."**

This is about **architecture**, not syntax.  
If this is weak → `this`, `bind`, `new`, closures will NEVER fully click.

---

## 📑 Table of Contents

| Part | Topic |
|------|-------|
| **Part 1** | Foundation — Why This Matters |
| **Part 2** | Function Object — What It Really Is |
| **Part 3** | Internal Slots — Engine View |
| **Part 4** | `this` — The Runtime Mystery |
| **Part 5** | Function Object vs Execution Context |
| **Part 6** | Complete Flow — AST to Execution |
| **Part 7** | `this` SET vs BOUND — The Critical Difference |
| **Part 8** | Practice & Checkpoint |

---

<br>

# Part 1: Foundation — Why This Matters

---

## ❌ Common Misconceptions

Most JavaScript developers fail because they believe:

- functions remember things
- `this` belongs to the function
- functions are "just code blocks"

**All of that is wrong.**

---

## ✅ What You Will Actually Learn

- What the engine actually creates
- What exists **before execution**
- What exists **only during execution**
- Why `this` can NEVER be inside a function
- Why `bind` MUST create a new function
- Why `call/apply` do NOT

---

<br>

# Part 2: Function Object — What It Really Is

---

## 2.1 When JS Sees a Function — What Really Happens

### Source code:

```js
function foo(a, b) {
  console.log(this, a, b)
}
```

### ❌ Beginner mental model:
> "JS stores this code and runs it later"

### ✅ Engine mental model:
> **"I need to create a FUNCTION OBJECT."**

The engine does NOT think in terms of "code blocks".  
It thinks in terms of **objects and execution behavior**.

---

## 2.2 A Function is NOT Code

A function is an **OBJECT in memory**.

Just like:
```js
const obj = {}
```
creates an object,

```js
function foo() {}
```
also creates an object — but a **special executable object**.

---

## 2.3 Where Does the Function Object Live?

👉 **HEAP MEMORY**

- ❌ Not stack
- ❌ Not execution context
- ❌ Not inside variables

### Conceptually:

```
Heap:
  foo ───► FunctionObject
```

📌 This happens during **parsing / compilation**  
📌 **Before any code runs**

---

## 2.4 When Function Objects Are Created (VERY IMPORTANT)

Function objects are created:

| ✅ When | ❌ NOT When |
|---------|-------------|
| During **parsing / compilation** | During execution |
| | During execution-context creation |

That means:
- Function exists **before** it is ever called
- Execution context **uses** the function — it does not create it

---

<br>

# Part 3: Internal Slots — Engine View

---

## 3.1 Function Object — Internal Structure

A Function Object is **not a plain JS object**.

Internally (conceptually):

```
FunctionObject foo
├─ [[Code]]
├─ [[Environment]]
├─ [[Call]]
├─ [[Construct]]
└─ [[Prototype]]
```

⚠️ These are **internal slots**  
⚠️ You CANNOT access them in JavaScript  
⚠️ They exist only inside the engine

---

## 3.2 [[Code]] — What It Really Is

❌ NOT source text  
❌ NOT a string

`[[Code]]` represents:
- Parsed instructions
- Bytecode
- Or JIT-compiled machine code

> **"How to execute this function"**

---

## 3.3 [[Environment]] — THIS IS CLOSURES

When the function object is created, the engine stores:

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

Internally:
```
foo.[[Environment]] → Global Lexical Environment
```

📌 This is why **closures work**  
📌 This is set **once**  
📌 This **NEVER changes**

---

## 3.4 [[Call]] — Normal Function Execution

Used when you do:

```js
foo()
obj.foo()
foo.call(x)
```

The engine performs: `foo.[[Call]]`

Which internally does:
1. Create execution context
2. Create `thisBinding`
3. Assign parameters
4. Execute `[[Code]]`

---

## 3.5 [[Construct]] — Constructor Execution

Used when you do:

```js
new foo()
```

The engine performs: `foo.[[Construct]]`

Which internally does:
1. Create empty object `{}`
2. Set `object.__proto__ → foo.prototype`
3. Bind `this` to that object
4. Execute function code
5. Return the object

---

## 3.6 Why Arrow Functions Break `new`

```js
const f = () => {}
new f() // ❌ TypeError
```

Because arrow functions:
- ❌ do NOT have `[[Construct]]`
- ✅ only have `[[Call]]`

They are **not constructable**.

---

<br>

# Part 4: `this` — The Runtime Mystery

---

## 4.1 What is NOT Inside a Function Object (CRITICAL)

🚨 **THERE IS NO `this` INSIDE A FUNCTION OBJECT**

The function object does NOT store:
- ❌ `this`
- ❌ previous calls
- ❌ execution state
- ❌ call history

---

## 4.2 Why `this` Cannot Be Stored

Consider:

```js
foo()           // this = undefined (strict) or global
obj.foo()       // this = obj
foo.call(x)     // this = x
new foo()       // this = new object
```

Same function → Different `this`

Which one should the function store? 👉 **Impossible**

So engine design is:

> **"`this` will be decided ONLY when the function executes."**

---

## 4.3 Where `this` Actually Lives

`this` lives ONLY here:

```
ExecutionContext
├─ LexicalEnvironment
├─ VariableEnvironment
└─ thisBinding   ✅
```

📌 Execution Context exists **only while code is running**

---

<br>

# Part 5: Function Object vs Execution Context

---

## 5.1 Key Differences (LOCK THIS IN)

| Function Object | Execution Context |
|-----------------|-------------------|
| Created at **parse time** | Created at **call time** |
| Lives in **heap** | Lives on **stack** |
| **Reusable** | **One per call** |
| Has `[[Code]]` | Has variables |
| **NO `this`** | Has `thisBinding` |

---

## 5.2 Function Object is a Blueprint

Think like this:

| Concept | Analogy |
|---------|---------|
| **Function Object** | Machine (blueprint) |
| **Execution Context** | Machine running |

You can turn the same machine on 100 times.  
Each run = new execution context.

---

## 5.3 Inner Functions — Important Clarification

### Example:

```js
function outer() {
  function inner() {}
}
```

### During compilation:
```
Heap:
  outer ──► FunctionObject
  inner ──► FunctionObject
```

### During execution context creation:
```
Outer Execution Context:
  inner → reference to FunctionObject
```

🚨 Inner function object is **NOT recreated**  
🚨 Scope only stores the **address/reference**

---

<br>

# Part 6: Complete Flow — AST to Execution

---

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
- AST is **not runtime**
- Function objects are created **after AST**
- Execution contexts exist **only during execution**

---

## 6.2 Why This Knowledge is Critical

Now you can logically understand:

| Question | Answer |
|----------|--------|
| Why does `this` depend on call-site? | Because `this` is in Execution Context, not Function Object |
| Why do arrow functions ignore `this`? | They don't have their own `thisBinding` |
| Why must `bind` create a new function? | To store the bound `this` value |
| Why don't `call/apply` create new function? | They just set `thisBinding` temporarily |
| Why does `new` change everything? | It uses `[[Construct]]` instead of `[[Call]]` |

**No memorization. Only cause → effect.**

---

<br>

# Part 7: `this` SET vs BOUND — The Critical Difference

---

## 7.1 Short Answer

| Term | Meaning |
|------|---------|
| **"this is SET"** | Happens **automatically** by the engine at call time |
| **"this is BOUND"** | Happens **manually** by you using `bind` / `call` / `apply` |

> **Setting = Engine decision**  
> **Binding = Developer control**

---

## 7.2 What Does "this is SET" Mean?

**Setting `this`** means the JavaScript engine decides the value of `this` when a function is executed.

- This happens **every time** a function is called
- You do **nothing manually**

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

**What happens internally:**
1. Engine sees call expression: `obj.foo()`
2. Creates execution context
3. **Sets** `this = obj`
4. Executes function

✅ `this` was **set**, not bound  
✅ No `bind`, no `call`, no `apply`

---

### Example: Default Setting

```js
function foo() {
  console.log(this)
}

foo()
```

**Engine logic:**
- ❌ not `new`
- ❌ not `call/apply/bind`
- ❌ not `obj.method()`
- ➡️ **default rule applies**

So engine **sets**:
- Sloppy mode → `this = global`
- Strict mode → `this = undefined`

✅ `this` is set **automatically**

---

## 7.3 What Does "this is BOUND" Mean?

**Binding `this`** means you **explicitly force** what `this` should be.

You do this using:
- `bind()`
- `call()`
- `apply()`

This **overrides** the engine's default behavior.

---

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

---

### Example: `call()`

```js
foo.call({ a: 1 })  // this = { a: 1 }
```

**Engine behavior:**
1. Create execution context
2. **Force** `this = { a: 1 }`
3. Execute immediately

✅ This is **binding**

---

## 7.4 Core Difference Table

| Aspect | `this` is SET | `this` is BOUND |
|--------|---------------|-----------------|
| **Who decides** | JS engine | You |
| **When** | At call time | Before or during call |
| **How** | Call-site rules | `bind` / `call` / `apply` |
| **Automatic** | ✅ Yes | ❌ No |
| **Can be overridden** | ✅ Yes | ❌ No (bind is permanent) |

---

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

---

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

---

## 7.7 One-Line Mental Model

> **"this is set by the engine, but bound by the developer."**

Or even simpler:

> **Setting is automatic. Binding is deliberate.**

---

## 7.8 Interview-Grade Explanation

If an interviewer asks:

> "What's the difference between `this` being set and bound?"

**Your answer:**

> "`this` is **set automatically** by the engine at call time using call-site rules. `bind`, `call`, and `apply` **explicitly bind** `this`, overriding that default behavior."

---

<br>

# Part 8: Practice & Checkpoint

---

## 🧠 One-Sentence Mental Model

> **A function is a heap-allocated executable object; `this` is a runtime binding created inside an execution context, never stored in the function itself.**

---

## ✍️ Practice 1 — Explain Out Loud

Answer this question:

> "What is a function in JavaScript at engine level?"

You MUST mention:
- Object
- Heap
- Internal slots (`[[Code]]`, `[[Environment]]`, `[[Call]]`)
- No `this` stored

---

## ✍️ Practice 2 — True / False

| Statement | Answer |
|-----------|--------|
| Function objects are created during execution | ❌ |
| `this` is part of function definition | ❌ |
| Arrow functions have `[[Construct]]` | ❌ |
| Same function can have multiple execution contexts | ✅ |
| `[[Environment]]` changes on each call | ❌ |
| Execution context lives on heap | ❌ |
| `bind` creates a new function | ✅ |
| `call` creates a new function | ❌ |

---

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

---

### Question 2:

```js
const g = obj.foo.bind(obj)
g()
```

Was `this` set or bound?  
👉 **BOUND** (explicitly via `bind`)

---

### Question 3:

```js
obj.foo()
```

Was `this` set or bound?  
👉 **SET** (implicit setting — `this = obj`)

---

### Question 4:

```js
obj.foo.call({ x: 99 })
```

Was `this` set or bound?  
👉 **BOUND** (explicitly via `call`)

---

## 🔒 Checkpoint — Is This Clear Now?

If these feel obvious, you're DONE:

- ✅ Function exists before execution
- ✅ Execution context exists only during execution
- ✅ `this` is call-time, not definition-time
- ✅ `bind` must create new function
- ✅ `call/apply` reuse same function
- ✅ Arrow functions have no `[[Construct]]`
- ✅ Setting is automatic, binding is deliberate

---

## 📊 Quick Reference Tables

### Function Object vs Execution Context

| Concept | Created When | Lives Where | Contains |
|---------|--------------|-------------|----------|
| Function Object | Parse time | Heap | `[[Code]]`, `[[Environment]]`, `[[Call]]`, `[[Construct]]` |
| Execution Context | Call time | Stack | Variables, `thisBinding` |
| `this` | Call time | Execution Context | Determined by call-site |
| Closure | Parse time | `[[Environment]]` | Reference to outer scope |

---

### Complete `this` Reference

| Call Pattern | `this` Value | SET or BOUND |
|--------------|--------------|--------------|
| `foo()` | `undefined` / `global` | SET (default) |
| `obj.foo()` | `obj` | SET (implicit) |
| `foo.call(x)` | `x` | BOUND (temporary) |
| `foo.apply(x)` | `x` | BOUND (temporary) |
| `foo.bind(x)()` | `x` | BOUND (permanent) |
| `new foo()` | new object | SET (by `new`) |
| `() => {}` | lexical | NEITHER (captured) |

---

✅ **Note Complete!**
