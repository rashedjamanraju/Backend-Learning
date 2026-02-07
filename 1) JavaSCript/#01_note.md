## Node.js Architecture & Execution Process (Complete Note)

Node.js যখন একটা file (যেমন `script.js`) execute করে, তখন এটা কেবল code line-by-line পড়ে না, বরং এটা বেশ কিছু complex step পার হয়ে কাজ করে। নিচে আমি step-by-step পুরো process-টা বিস্তারিতভাবে বুঝিয়ে বলছি:

---

# ✅ Learning Order (Best Flow)

## 0. Big Picture (High-Level Overview)

Node.js is a **JavaScript runtime environment** that allows JavaScript to run outside the browser.

Node.js নিজে JavaScript execute করে না। এটা ব্যবহার করে:

- **V8 Engine** → Converts JavaScript to Machine Code
- **libuv** → Handles async I/O, Event Loop, Thread Pool
- **C++ Bindings** → Connects JavaScript with OS APIs

> Node.js is **NOT a Virtual Machine**
> It is a runtime environment.

---

## 1. What happens when we run `node file.js`? (Chronological Flow)

1. Node.js process is created
2. Memory and main thread are allocated by OS
3. V8 engine is initialized
4. libuv is initialized
   - Event Loop is created
   - Thread Pool is created (default size = 4)
5. Global objects are created:
   - `global`
   - `process`
   - `Buffer`
   - `console`
   - Timer functions

---

## 2. Initialization & Environment Setup (পরিবেশ তৈরি)

তুমি যখন কমান্ড লাইনে `node script.js` লিখো, তখন Node.js তার ইঞ্জিন (V8) কে অ্যাক্টিভেট করে এবং environment set up করে।

### "Environment set up" মানে কী?

Environment set up করা মানে Node.js তোমার code চালানোর জন্য একটা **"Infrastructure"** বা **"Platform"** তৈরি করে। শুধু JavaScript code থাকলেই হয় না, সেটা চালানোর জন্য কিছু জিনিস দরকার হয় যা Node.js provide করে।

#### 2.1 V8 Instance Create করা

Node.js প্রথমে Google-এর V8 Engine-এর একটা **instance** তৈরি করে। এটা একটা **"Virtual Machine"**-এর মতো কাজ করে। এটার কাজ হলো তোমার লেখা JavaScript-কে **Machine Code**-এ রূপান্তর করা, যাতে তোমার computer-এর processor সেটা বুঝতে পারে।

##### V8 ইঞ্জিন কী?

V8 হলো Google-এর তৈরি একটি **open-source JavaScript engine**। এটা মূলত Chrome browser-এ ব্যবহার হয়। V8 এর কাজ হলো:

- JavaScript কোডকে **Machine Code**-এ রূপান্তর করা
- মেমোরি ম্যানেজমেন্ট করা (Garbage Collection)
- কোড অপ্টিমাইজেশন করা

#### 2.2 Global Objects Initialize করা

Browser-এ যেমন `window` বা `document` থাকে, Node.js-এ সেগুলো থাকে না। Environment setup-এর সময় Node.js কিছু **global object** তৈরি করে:

| Global Object  | কাজ                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `global`     | Main global object (Browser-এর `window`-এর মতো)                                                          |
| `process`    | তোমার program-টা কতো memory খাচ্ছে বা কোন version-এ চলছে সেটা এইখানে থাকে |
| `Buffer`     | Binary data handle করার জন্য                                                                              |
| `console`    | Console output দেখানোর জন্য                                                                            |
| `setTimeout` | Timer functions                                                                                                   |

---

##### 🧠 Global-এ কী থাকে — ৩টা ক্যাটাগরি

###### 1️⃣ **Node-specific Globals**

এগুলো Node.js নিজে যোগ করে:

```
global
├── process
│   ├── argv               → CLI arguments
│   ├── env                → Environment variables
│   ├── pid                → Process ID
│   ├── ppid               → Parent Process ID
│   ├── platform           → OS name
│   ├── arch               → CPU architecture
│   ├── version            → Node version
│   ├── versions
│   │   ├── node
│   │   ├── v8
│   │   └── uv
│   ├── cwd()
│   ├── chdir()
│   ├── exit()
│   ├── uptime()
│   ├── memoryUsage()
│   └── nextTick()
│
├── Buffer
│   ├── from()
│   ├── alloc()
│   ├── allocUnsafe()
│   ├── isBuffer()
│   └── byteLength()
│
├── console
│   ├── log()
│   ├── error()
│   ├── warn()
│   ├── info()
│   ├── table()
│   ├── time()
│   └── timeEnd()
│
├── setTimeout()
│   └── Timeout
│       ├── ref()
│       ├── unref()
│       └── hasRef()
│
├── setInterval()
│   └── Timeout
│       ├── ref()
│       ├── unref()
│       └── hasRef()
│
├── setImmediate()
│   └── Immediate
│       ├── ref()
│       ├── unref()
│       └── hasRef()
│
├── clearTimeout()
├── clearInterval()
└── clearImmediate()

```

✔️ এগুলো Node-এর runtime feature

✔️ require ছাড়াই পাওয়া যায়

---

###### 2️⃣ **JavaScript (ECMAScript) built-in globals**

এগুলো Node বানায় না — **JavaScript ভাষা নিজেই দেয়**

Node শুধু এগুলো রাখে।

```
global
├── Object
├── Array
├── Function
├── String
├── Number
├── Boolean
├── Math
├── Date
├── JSON
├── Promise
├── Error
├── Map
├── Set
├── WeakMap
└── WeakSet
```

👉 এগুলো  **Browser-এও থাকে** , Node-এও থাকে

👉 কারণ এগুলো **language feature**

---

###### 3️⃣ **Some utility globals**

ছোট কিন্তু দরকারি:

```
global
├── setImmediate
├── queueMicrotask
├── atob / btoa (newer Node)
└── structuredClone
```

(Version অনুযায়ী কিছু বাড়ে/কমে)

---

##### ❌ Global-এ কী থাকে না (IMPORTANT)

এইগুলা **global object-এ থাকে না** 👇

###### ❌ Core modules

```
fs
http
net
crypto
path
os
```

❌ কারণ:

```js
fs.readFile()      // ❌
require('fs')      // ✅
```

---

###### ❌ Internal runtime systems

```
Event Loop
Thread Pool
libuv
```

❌ এগুলো JS object না

❌ এগুলো runtime machinery

---

###### ❌ Module wrapper things

```
require
module
exports
__dirname
__filename
```

❌ এগুলো global না

✔️ এগুলো **per-file wrapper-এ আসে**

---

##### 🧩 সবকিছু একসাথে — FINAL MAP

```
global
├── JS built-ins (Object, Array, Promise, ...)
├── Node globals (process, Buffer, console, timers)
├── Utilities (queueMicrotask, structuredClone)
└── ❌ NOT included
   ├── fs, http, crypto (require needed)
   ├── Event Loop, Thread Pool (internal)
   └── require, __dirname (module wrapper)
```

---

##### 🔑 Golden Rule (এইটা মনে রাখো)

```
Language feature → global
Runtime helper → global
Heavy system API → require
Internal machinery → invisible
```

---

##### 🟢 একদম পরিষ্কার উত্তর (Bangla, interview-ready)

> **না, global object-এ শুধু process বা timer না।
>
> JavaScript-এর সব built-in object + Node-এর কিছু runtime API global-এ থাকে।
>
> কিন্তু core modules (fs, http) আর internal systems (event loop, thread pool) global-এ থাকে না।**

---

#### 2.3 Libuv (Event Loop) Start করা

এটা environment setup-এর **সবচেয়ে গুরুত্বপূর্ণ** part। **Libuv** library-টি চালু হয়, যা Node.js-কে "Asynchronous" হতে সাহায্য করে।

##### Libuv কী?

Libuv হলো একটি **C library** যেটা Node.js-এর অ্যাসিনক্রোনাস কাজগুলো হ্যান্ডেল করে:

- **I/O Operations:** ফাইল রিড/রাইট
- **Networking:** HTTP requests, TCP/UDP connections
- **Thread Pool:** ভারী কাজগুলোর জন্য আলাদা থ্রেড (সাধারণত ৪টি thread)
- **Event Loop:** অ্যাসিনক্রোনাস কাজের সমন্বয়

---

#### 2.4 C++ Bindings Connect করা

JavaScript দিয়ে সরাসরি তোমার computer-এর **Hard Drive** বা **Network card**-এ access করা যায় না। Environment setup-এর সময় Node.js JavaScript code-কে তার **C++ library-র (C++ Bindings)** সাথে connect করে দেয়, যাতে JavaScript দিয়ে তুমি file system বা internet access করতে পারো।

### সহজ কথায়:

> Environment setup মানে একটা **"কারখানা"** তৈরি করা। V8 হচ্ছে engine, Libuv হচ্ছে কাজের নিয়ম, আর Module Wrapper হচ্ছে কাঁচামাল processing-এর জায়গা।

---

## 3. Module Wrapper (Execution Context)

Node.js তোমার code-কে সরাসরি execute করে না। সেটাকে একটা **invisible function**-এর ভেতরে ঢুকিয়ে দেয়।

### IIFE (Immediately Invoked Function Expression)

Node.js তোমার কোডটাকে একটা **IIFE** দিয়ে wrap করে:

```js
(function(exports, require, module, __filename, __dirname) {
    // তোমার কোড এখানে থাকে
    const fs = require('fs');
    console.log(__dirname);
})();
```

### এই wrapper-এর সুবিধা:

| প্যারামিটার | টাইপ | কাজ                                           |
| ---------------------- | -------- | ------------------------------------------------ |
| `exports`            | Object   | মডিউল থেকে কিছু export করতে     |
| `require`            | Function | অন্য মডিউল import করতে              |
| `module`             | Object   | বর্তমান মডিউলের রেফারেন্স |
| `__filename`         | String   | বর্তমান ফাইলের পুরো path        |
| `__dirname`          | String   | বর্তমান ফাইলের directory path       |

---

## 4. V8 Engine: Compilation & Execution (The Translator)

V8 ইঞ্জিন JavaScript-কে সরাসরি এক্সিকিউট করে না। এটা কয়েকটি ধাপে কাজ করে:

### Computer-এর Processor কী বুঝতে পারে?

> **সহজ কথায়:** Computer-এর processor JavaScript বুঝে না, সে বুঝে শুধু **0 আর 1 (Binary)**।

#### JavaScript vs Machine Code

তুমি যখন লিখো `console.log("Hello")`, এটা হচ্ছে **High-level language**। এটা মানুষ বুঝতে পারে, কিন্তু computer-এর hardware (CPU) এর কাছে এটা শুধু একটা text file।

**Machine Code** হচ্ছে processor-এর নিজস্ব ভাষা (Instruction Set)। প্রতিটি processor-এর (Intel, AMD, বা Apple M1) নির্দিষ্ট কিছু instruction থাকে (যেমন: "Memory থেকে data আনো", "দুইটি number যোগ করো")।

#### V8 Engine যেটা করে (Just-In-Time Compilation)

V8 engine তোমার JavaScript code-কে প্রথমে পড়ে এবং সেটাকে CPU-র জন্য **Binary Instructions**-এ convert করে দেয়।

ধরো তুমি লিখলে: `a + b`

V8 এটাকে CPU-র জন্য এমনভাবে translate করবে:

```
MOV (Memory থেকে a-এর value register-এ নাও)
MOV (Memory থেকে b-এর value register-এ নাও)
ADD (দুইটি register যোগ করো)
```

#### Processor কী "Execute" করে?

Processor সেই binary instructions (010101...) গুলো পায় এবং তার ভেতরে থাকা লাখ লাখ tiny switches (transistors) on/off করার মাধ্যমে সেই কাজটা করে ফেলে।

### ধাপ 4.1: Lexical Analysis (Tokenization)

প্রথমে কোডকে ছোট ছোট **tokens**-এ ভাঙে:

```js
// এই কোড:
const x = 5;

// এভাবে টোকেনে ভাঙে:
// ['const', 'x', '=', '5', ';']
```

### ধাপ 4.2: Parsing (AST তৈরি)

Tokens থেকে **Abstract Syntax Tree (AST)** তৈরি করে। AST হলো কোডের একটা tree structure representation:

```
Program
└── VariableDeclaration (const)
    └── VariableDeclarator
        ├── Identifier (x)
        └── Literal (5)
```

### ধাপ 4.3: Ignition (Interpreter)

V8-এর **Ignition** interpreter AST থেকে **Bytecode** তৈরি করে। Bytecode হলো machine code-এর একটা intermediate form।

### ধাপ 4.4: TurboFan (JIT Compiler)

যে কোড বারবার run হয় (hot code), সেটাকে **TurboFan** compiler অপ্টিমাইজড **Machine Code**-এ কনভার্ট করে। এটাকে বলে **Just-In-Time (JIT) Compilation**।

### Complete Flow:

```
JavaScript Code
      ↓
   Tokenizer (Lexical Analysis)
      ↓
    Parser
      ↓
     AST (Abstract Syntax Tree)
      ↓
   Ignition → Bytecode
      ↓
   TurboFan → Optimized Machine Code (010101...)
      ↓
   Processor (CPU)
```

### Key Points:

- **Human Readable vs Machine Readable:** JavaScript হচ্ছে "Human Readable", কিন্তু CPU-র দরকার "Machine Readable" code।
- **The Translator:** V8 Engine এখানে একটা Interpreter এবং Compiler হিসেবে কাজ করে। সে code translate করে সরাসরি Processor-এর কাছে পাঠায়।
- **Result:** Processor সেই instructions গুলো execute করে আমাদের result দেখায় (যেমন screen-এ কিছু print করা বা file save করা)।

---

## 5. Call Stack

- Executes synchronous code
- Uses LIFO (Last In, First Out)

**Example:**

```js
console.log("Hello");
```

---

## 6. Asynchronous Handling (libuv)

Node.js is single-threaded but non-blocking.

**Async tasks are handled in two ways:**

### A. Thread Pool (libuv)

Used for:

- File system (fs)
- Crypto
- Zlib
- dns.lookup

### B. OS Kernel (Not Thread Pool)

- Network I/O (HTTP, TCP, sockets)
- Most database operations

> Network I/O is handled by the OS, not the thread pool.

---

## 7. Event Loop & Thread Pool (Asynchronous Magic)

Node.js হচ্ছে **Single Threaded**। মানে মেইন থ্রেডে একসাথে একটি মাত্র কাজ করতে পারে। কিন্তু যদি কোনো বড় কাজ থাকে (যেমন ফাইল রিড করা বা ডাটাবেস অ্যাক্সেস), তখন সেইটা **Libuv**-এর **Thread Pool**-এ পাঠিয়ে দেয়।

### Event Loop-এর ৬টি Phase:

```
   ┌───────────────────────────┐
┌─>│         timers            │  ← setTimeout(), setInterval()
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  ← I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  ← internal use
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │  ← incoming connections, data
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │  ← setImmediate()
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │  ← socket.on('close')
   └───────────────────────────┘
```

### প্রতিটি Phase-এর বিস্তারিত:

| Phase                       | কাজ                                                              | উদাহরণ                   |
| --------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| **Timers**            | `setTimeout()` ও `setInterval()` এর callbacks execute করে | `setTimeout(() => {}, 1000)` |
| **Pending Callbacks** | আগের iteration-এ complete হওয়া I/O callbacks             | TCP error callbacks            |
| **Idle/Prepare**      | Node.js-এর internal operations                                    | -                              |
| **Poll**              | নতুন I/O events fetch করে এবং callbacks execute করে    | File read complete             |
| **Check**             | `setImmediate()` callbacks execute করে                         | `setImmediate(() => {})`     |
| **Close Callbacks**   | Close events handle করে                                          | `socket.on('close')`         |

### Call Stack, Node APIs, Callback Queue:

| কম্পোনেন্ট                  | দায়িত্ব                                     | উদাহরণ                        |
| ------------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| **Call Stack**                  | synchronous কোড execute করে (LIFO)             | `console.log()`, function calls   |
| **Node APIs**                   | async operations register করে                     | `setTimeout()`, `fs.readFile()` |
| **Callback Queue (Task Queue)** | async callbacks অপেক্ষা করে                | Timer callbacks                     |
| **Microtask Queue**             | Promises, process.nextTick()                         | `.then()`, `async/await`        |
| **Event Loop**                  | Stack খালি হলে Queue থেকে কাজ নেয় | -                                   |

### Priority Order:

```
1. Call Stack (সবার আগে)
2. Microtask Queue (process.nextTick > Promise)
3. Callback Queue (setTimeout, setInterval)
4. Check Queue (setImmediate)
```

---

## 8. Thread Pool Details (Libuv)

Libuv-এর Thread Pool-এ by default **4টি worker thread** থাকে (UV_THREADPOOL_SIZE দিয়ে বাড়ানো যায়, max 1024)।

### Thread Pool যে কাজগুলো করে:

- File System operations (`fs.readFile()`)
- DNS lookups (`dns.lookup()`)
- Crypto operations (`crypto.pbkdf2()`)
- Zlib compression

```js
// Thread Pool সাইজ বাড়াতে:
process.env.UV_THREADPOOL_SIZE = 8;
```

---

## 9. C++ Bindings

JavaScript cannot directly access OS resources.

**Execution flow:**

```
JavaScript
→ C++ Bindings
→ OS System Calls
```

**Examples:**

- `fs.readFile` → Disk access
- `net` → Network access

---

## 10. Process Exit (Final Execution & Exit)

### Execution:

Processor code-এর result **output** হিসেবে দেখায় (যেমন: Console log করা বা response পাঠানো)।

### Exit:

যখন Call Stack খালি হয়ে যায় এবং কোনো pending অ্যাসিনক্রোনাস কাজ থাকে না, তখন Node.js প্রসেসটা বন্ধ হয়ে যায় (`process.exit()`)।

### Exit Conditions:

- Event Loop-এ কোনো pending work নেই
- কোনো active timers নেই
- কোনো pending I/O operations নেই

---

## 11. Detailed Example (Execution Order)

**JavaScript**

```js
console.log("1. শুরু"); // ১. Call Stack-এ যায়, সাথে সাথে প্রিন্ট হয়

setTimeout(() => {
  console.log("2. setTimeout"); // ৫. Timer phase-এ execute হয়
}, 0);

setImmediate(() => {
  console.log("3. setImmediate"); // ৬. Check phase-এ execute হয়
});

Promise.resolve().then(() => {
  console.log("4. Promise"); // ৩. Microtask Queue-তে যায়, Stack খালি হলেই execute
});

process.nextTick(() => {
  console.log("5. nextTick"); // ২. Microtask Queue-তে যায় (highest priority)
});

console.log("6. শেষ"); // ৪. Call Stack-এ যায়, সাথে সাথে প্রিন্ট হয়
```

**আউটপুট সিকুয়েন্স:**

```
1. শুরু
6. শেষ
5. nextTick
4. Promise
2. setTimeout
3. setImmediate
```

### কেন এই order?

1. **"1. শুরু"** - Synchronous, সরাসরি Stack-এ execute
2. **"6. শেষ"** - Synchronous, সরাসরি Stack-এ execute
3. **"5. nextTick"** - Microtask Queue (সর্বোচ্চ priority)
4. **"4. Promise"** - Microtask Queue (nextTick-এর পরে)
5. **"2. setTimeout"** - Timer phase
6. **"3. setImmediate"** - Check phase

---

## 12. Visual Summary (Architecture Map)

```
┌─────────────────────────────────────────────────────────┐
│                    Node.js Architecture                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              Your JavaScript Code                │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Node.js Bindings                    │
│  │         (C++ code connecting JS to C)           │
│  └─────────────────────────────────────────────────┘   │
│                    ↓           ↓                        │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │    V8 Engine     │  │        Libuv             │    │
│  │  (JS → Machine)  │  │  (Async I/O, Thread Pool)│    │
│  └──────────────────┘  └──────────────────────────┘    │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Operating System                    │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 13. Chronological Summary (Best for Revision)

```
1. Node Start ➔ V8 & Libuv চালু হয়
2. Wrapping ➔ Code-কে (function(...){ }) দিয়ে ঘেরা হয়
3. Parsing ➔ Code-কে AST-এ convert করা হয়
4. JIT Compiling ➔ AST থেকে Machine Code (0, 1) তৈরি হয়
5. Execution ➔ Call Stack-এ code execute হয়; heavy কাজ Thread Pool-এ যায়
6. Event Loop ➔ Background কাজের callback গুলোকে Stack-এ পাঠায়
7. Exit ➔ সব কাজ শেষ হলে process বন্ধ হয়
```

---

## 14. Interview One-Liner (Pro-Tip)

যদি কেউ জিজ্ঞেস করে, **"Node.js কেন single-threaded হয়েও fast?"**

**উত্তর:** কারণ Node.js heavy কাজগুলো নিজে করে না, সেগুলো **Libuv**-এর মাধ্যমে background-এ পাঠিয়ে দেয় এবং **Event Loop**-এর মাধ্যমে results গুলো manage করে।

---

## 15. Ultra-Short Revision Flow

```
Node start
→ V8 + libuv initialized
→ Module wrapper applied
→ JS → AST → Bytecode → Machine Code
→ Sync code → Call Stack
→ Async code → libuv / OS
→ Event Loop schedules callbacks
→ Process exits
```

---

# 📘 Quick Reference (English Summary)

## 1. What is Node.js?

Node.js is a **JavaScript runtime environment** that allows JavaScript to run outside the browser.

Node.js itself does not execute JavaScript directly. It uses:

- **V8 Engine** → Converts JavaScript to Machine Code
- **libuv** → Handles async I/O, Event Loop, Thread Pool
- **C++ Bindings** → Connects JavaScript with OS APIs

---

## 2. What happens when we run `node file.js`?

1. Node.js process is created
2. Memory and main thread are allocated by OS
3. V8 engine is initialized
4. libuv is initialized
   - Event Loop is created
   - Thread Pool is created (default size = 4)
5. Global objects are created:
   - `global`
   - `process`
   - `Buffer`
   - `console`
   - Timer functions

> Node.js is **NOT a Virtual Machine**
> It is a runtime environment.

---

## 3. Module Wrapper

Each `.js` file is wrapped internally like this:

```js
(function (exports, require, module, __filename, __dirname) {
  // your code
});
```

**Purpose of Module Wrapper:**

- Provides file-level scope
- Enables `require`, `__dirname`, `__filename`
- Prevents global scope pollution

---

## 4. V8 Compilation Process

CPU understands only Machine Code (0 and 1), not JavaScript.

**V8 Execution Flow:**

```
JavaScript Code
→ Tokenization
→ Abstract Syntax Tree (AST)
→ Ignition (Interpreter → Bytecode)
→ TurboFan (JIT Compiler → Optimized Machine Code)
→ CPU Execution
```

**Key Notes:**

- V8 is both Interpreter + JIT Compiler
- Frequently executed code becomes **Hot Code**
- Hot Code is optimized into Machine Code

---

## 5. Call Stack

- Executes synchronous code
- Uses LIFO (Last In, First Out)

**Example:**

```js
console.log("Hello");
```

---

## 6. Asynchronous Handling (libuv)

Node.js is single-threaded but non-blocking.

**Async tasks are handled in two ways:**

### A. Thread Pool (libuv)

Used for:

- File system (fs)
- Crypto
- Zlib
- dns.lookup

### B. OS Kernel (Not Thread Pool)

- Network I/O (HTTP, TCP, sockets)
- Most database operations

> Network I/O is handled by the OS, not the thread pool.

---

## 7. Event Loop

The Event Loop decides when a callback moves to the Call Stack.

**Event Loop Phases:**

1. Timers (`setTimeout`, `setInterval`)
2. Pending callbacks
3. Poll (I/O callbacks)
4. Check (`setImmediate`)
5. Close callbacks

---

## 8. Microtask Queue (Highest Priority)

**Priority order:**

```
Call Stack
→ process.nextTick
→ Promise.then
→ Timer callbacks
→ I/O callbacks
→ setImmediate
```

---

## 9. Thread Pool Details

- Default size: **4 threads**
- Can be increased using:

```js
process.env.UV_THREADPOOL_SIZE = 8;
```

**Used for:**

- File system operations
- Crypto
- Compression

---

## 10. C++ Bindings

JavaScript cannot directly access OS resources.

**Execution flow:**

```
JavaScript
→ C++ Bindings
→ OS System Calls
```

**Examples:**

- `fs.readFile` → Disk access
- `net` → Network access

---

## 11. Process Exit

Node.js process exits when:

- Call Stack is empty
- Event Loop has no pending tasks
- No active timers or I/O

---

## 12. Interview One-Liner

> **Why is Node.js fast despite being single-threaded?**
>
> Because heavy tasks are offloaded to libuv or OS, and results are managed efficiently using the Event Loop.

---

## 13. Ultra-Short Revision Flow

```
Node start
→ V8 + libuv initialized
→ Module wrapper applied
→ JS → AST → Bytecode → Machine Code
→ Sync code → Call Stack
→ Async code → libuv / OS
→ Event Loop schedules callbacks
→ Process exits
```

---

✅ **Note Complete!**
