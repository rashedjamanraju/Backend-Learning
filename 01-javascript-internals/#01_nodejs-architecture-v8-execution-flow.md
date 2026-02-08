## Node.js Architecture & Execution Process (Complete Note)

Node.js যখন একটা file (যেমন `script.js`) execute করে, তখন এটা কেবল code line-by-line পড়ে না, বরং এটা বেশ কিছু complex step পার হয়ে কাজ করে। নিচে আমি step-by-step পুরো process-টা বিস্তারিতভাবে বুঝিয়ে বলছি:

---

## ১. Initialization & Environment Setup (পরিবেশ তৈরি)

তুমি যখন কমান্ড লাইনে `node script.js` লিখো, তখন Node.js তার ইঞ্জিন (V8) কে অ্যাক্টিভেট করে এবং environment set up করে।

### ১.১ "Environment set up" মানে কী?

Environment set up করা মানে Node.js তোমার code চালানোর জন্য একটা **"Infrastructure"** বা **"Platform"** তৈরি করে। শুধু JavaScript code থাকলেই হয় না, সেটা চালানোর জন্য কিছু জিনিস দরকার হয় যা Node.js provide করে।

#### ১.১.১ V8 Instance Create করা

Node.js প্রথমে Google-এর V8 Engine-এর একটা **instance** তৈরি করে। এটা একটা **"Virtual Machine"**-এর মতো কাজ করে। এটার কাজ হলো তোমার লেখা JavaScript-কে **Machine Code**-এ রূপান্তর করা, যাতে তোমার computer-এর processor সেটা বুঝতে পারে।

##### V8 ইঞ্জিন কী?

V8 হলো Google-এর তৈরি একটি **open-source JavaScript engine**। এটা মূলত Chrome browser-এ ব্যবহার হয়। V8 এর কাজ হলো:

- JavaScript কোডকে **Machine Code**-এ রূপান্তর করা
- মেমোরি ম্যানেজমেন্ট করা (Garbage Collection)
- কোড অপ্টিমাইজেশন করা

#### ১.১.২ Global Objects Initialize করা

Browser-এ যেমন `window` বা `document` থাকে, Node.js-এ সেগুলো থাকে না। Environment setup-এর সময় Node.js কিছু **global object** তৈরি করে:

| Global Object  | কাজ                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `global`     | Main global object (Browser-এর `window`-এর মতো)                                                          |
| `process`    | তোমার program-টা কতো memory খাচ্ছে বা কোন version-এ চলছে সেটা এইখানে থাকে |
| `Buffer`     | Binary data handle করার জন্য                                                                              |
| `console`    | Console output দেখানোর জন্য                                                                            |
| `setTimeout` | Timer functions                                                                                                   |

##### 🧠 Global-এ কী থাকে — ৩টা ক্যাটাগরি

###### ১.১.২.১ **Node-specific Globals**

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

✔️ require ছাড়াই পাওয়া যায়

###### ১.১.২.২ **JavaScript (ECMAScript) built-in globals**

এগুলো Node বানায় না — **JavaScript ভাষা নিজেই দেয়**

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

###### ১.১.২.৩ **Some utility globals**

ছোট কিন্তু দরকারি:

```
global
├── setImmediate
├── queueMicrotask
├── atob / btoa (newer Node)
└── structuredClone
```

(Version অনুযায়ী কিছু বাড়ে/কমে)

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

###### ❌ Internal runtime systems

```
Event Loop
Thread Pool
libuv
```

❌ এগুলো JS object না

❌ এগুলো runtime machinery

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

##### 🔑 Golden Rule (এইটা মনে রাখো)

```
Language feature → global
Runtime helper → global
Heavy system API → require
Internal machinery → invisible
```

##### 🟢 একদম পরিষ্কার উত্তর (Bangla, interview-ready)

> **না, global object-এ শুধু process বা timer না।
>
> JavaScript-এর সব built-in object + Node-এর কিছু runtime API global-এ থাকে।
>
> কিন্তু core modules (fs, http) আর internal systems (event loop, thread pool) global-এ থাকে না।**

#### ১.৩ Libuv (Event Loop) Start করা

এটা environment setup-এর **সবচেয়ে গুরুত্বপূর্ণ** part। **Libuv** library-টি চালু হয়, যা Node.js-কে "Asynchronous" হতে সাহায্য করে।

##### Libuv কী?

Libuv হলো একটি **C library** যেটা Node.js-এর অ্যাসিনক্রোনাস কাজগুলো হ্যান্ডেল করে:

- **I/O Operations:** ফাইল রিড/রাইট
- **Networking:** HTTP requests, TCP/UDP connections
- **Thread Pool:** ভারী কাজগুলোর জন্য আলাদা থ্রেড (সাধারণত ৪টি thread)
- **Event Loop:** অ্যাসিনক্রোনাস কাজের সমন্বয়

#### ১.৪ C++ Bindings Connect করা

JavaScript দিয়ে সরাসরি তোমার computer-এর **Hard Drive** বা **Network card**-এ access করা যায় না। Environment setup-এর সময় Node.js JavaScript code-কে তার **C++ library-র (C++ Bindings)** সাথে connect করে দেয়, যাতে JavaScript দিয়ে তুমি file system বা internet access করতে পারো।

### সহজ কথায়:

> Environment setup মানে একটা **"কারখানা"** তৈরি করা। V8 হচ্ছে engine, Libuv হচ্ছে কাজের নিয়ম, আর Module Wrapper হচ্ছে কাঁচামাল processing-এর জায়গা।

### ২. Module Wrapping & V8 Compilation (Deep Dive)

Node.js যখন কোনো ফাইল লোড করে, তখন পর্দার আড়ালে নিচের ধাপগুলো একে একে ঘটে:

### ২.১ স্ট্রিং ম্যানিপুলেশন (Wrapping)

Node.js প্রথমে তোমার ফাইলের সমস্ত কোডকে একটি **স্ট্রিং (String)** হিসেবে পড়ে। তারপর সেই স্ট্রিংয়ের শুরুতে এবং শেষে কিছু বাড়তি কোড জোড়া দিয়ে একটি **Function Expression** তৈরি করে।

ধরা যাক তোমার `app.js` ফাইলে শুধু এই লাইনটি আছে:

**JavaScript**

```
console.log("Hello Node");
```

Node.js এটাকে এভাবে স্ট্রিং হিসেবে সাজায়:

**JavaScript**

```javascript
// শুরুতে যোগ করে:
"(function (exports, require, module, __filename, __dirname) { " 
// তোমার আসল কোড:
"console.log('Hello Node');"
// শেষে যোগ করে:
"\n});"
```

### এই wrapper-এর সুবিধা:

| প্যারামিটার | টাইপ | কাজ                                           |
| ---------------------- | -------- | ------------------------------------------------ |
| `exports`            | Object   | মডিউল থেকে কিছু export করতে     |
| `require`            | Function | অন্য মডিউল import করতে              |
| `module`             | Object   | বর্তমান মডিউলের রেফারেন্স |
| `__filename`         | String   | বর্তমান ফাইলের পুরো path        |
| `__dirname`          | String   | বর্তমান ফাইলের directory path       |

## ৩. V8 Engine: Compilation & Execution (The Translator)

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

```markdown
MOV (Memory থেকে a-এর value register-এ নাও)
MOV (Memory থেকে b-এর value register-এ নাও)
ADD (দুইটি register যোগ করো)
```

#### Processor কী "Execute" করে?

Processor সেই binary instructions (010101...) গুলো পায় এবং তার ভেতরে থাকা লাখ লাখ tiny switches (transistors) on/off করার মাধ্যমে সেই কাজটা করে ফেলে।

### ধাপ ৩.১: Lexical Analysis (Tokenization)

প্রথমে কোডকে ছোট ছোট **tokens**-এ ভাঙে:

```js
// এই কোড:
const x = 5;

// এভাবে টোকেনে ভাঙে:
// ['const', 'x', '=', '5', ';']
```

### ধাপ ৩.২: V8 Parsing - দ্য ইনার ইঞ্জিনিয়ারিং (Deep Dive)

এটি V8 ইঞ্জিনের সবচেয়ে গুরুত্বপূর্ণ এবং ইন্টারেস্টিং পার্ট। এখানে ডিসিশন নেওয়া হয় কোডের কোন অংশ এখনই প্রসেস হবে আর কোনটা পরে।

#### ৩.২.১ মেমোরি ব্রিজ (C++ Heap থেকে V8 Heap)

Node.js যখন ফাইল রিড করে, সে কিন্তু বোকার মতো পুরো কোড কপি করে V8-কে দেয় না। এটি একটি স্মার্ট পদ্ধতিতে কাজ করে:

1. **রিডিং:** Node.js (C++) প্রথমে ফাইলটি পড়ে তার নিজস্ব মেমোরিতে (C++ Heap) রাখে ।
2. **পয়েন্টার ট্রান্সফার (Pointer Transfer):** পুরো স্ট্রিং কপি করার বদলে, Node.js V8-কে শুধু মেমোরির **অ্যাড্রেস বা পয়েন্টার** ধরিয়ে দেয়। বলে, "এই ঠিকানায় কোড আছে, তুমি এখান থেকে পড়া শুরু করো।"
3. **API Call:** `v8::String::NewFromUtf8` - এই ধরনের API দিয়ে সে V8-কে নির্দেশ দেয়।

#### ৩.২.২ Eager vs Lazy Parsing (স্মার্ট মেমোরি ম্যানেজমেন্ট)

V8 ইঞ্জিন মেমোরি বাঁচানোর জন্য কোডকে দুই ভাগে ভাগ করে ফেলে:

**১. Eager Parsing (তৎক্ষণাৎ পার্সিং):**

* **কাকে করে?** মেইন বডির কোড, গ্লোবাল ভেরিয়েবল এবং যেসব ফাংশন এখনই রান করতে হবে।
* **কাজ:** এর জন্য সাথে সাথে **AST** এবং **Bytecode** তৈরি করে ফেলে।

**২. Lazy Parsing (অলস/দেরিতে পার্সিং):**

* **কাকে করে?** কোডের ভেতরে থাকা ফাংশন যা এখনি কল করা হয়নি (Uncalled Functions)।
* **কাজ:** V8 এই ফাংশনগুলোর ভেতরে বিন্দুমাত্র ঢোকে না। সে শুধু দেখে ফাংশনের নাম আর মেমোরিতে তার অবস্থান (Start/End Position)। একে বলে **Pre-parsing**।
* **সুবিধা:** পুরো কোডের AST না বানানোর ফলে মেমোরি এবং স্টার্ট-আপ টাইম প্রচুর বাঁচে।

#### ৩.২.৩ SharedFunctionInfo (SFI) - যেখানে "নোট" জমা থাকে

এখানেই অনেকের কনফিউশন হয়। প্রশ্ন হলো: **"Lazy Parsing-এর সময় ফাংশনের তথ্য কোথায় থাকে? AST-তে?"**

**উত্তর: না, AST-তে নয়।**

V8 যখন Lazy Parsing করে, তখন সে ফাংশনের জন্য মেমোরিতে (Heap-এ) **`SharedFunctionInfo` (SFI)** নামে একটি অবজেক্ট তৈরি করে।

| বৈশিষ্ট্য              | AST (Abstract Syntax Tree)                                                                             | SharedFunctionInfo (SFI)                                                            |
| :------------------------------ | :----------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **কাজ**                | কোডের লজিক ও গ্রামার বোঝা                                                         | ফাংশনের 'আইডি কার্ড' বা মেটাডেটা রাখা                 |
| **কখন তৈরি হয়?** | **Eager:** সাথে সাথে`<br>`**Lazy:** যখন ফাংশন **কল** করা হয় | ফাংশন ডিক্লেয়ার করার সাথে সাথেই                          |
| **স্থায়িত্ব**  | বাইটকোড হয়ে গেলে মেমোরি থেকে মুছে যায় (Temporary)                       | পুরো প্রোগ্রাম চলাকালীন মেমোরিতে থাকে (Persistent) |
| **উপমা**              | রান্নার**চপিং বোর্ড** (কাজ শেষে ফাকা)                                 | লাইব্রেরির**ক্যাটালগ কার্ড** (সবসময় থাকে)     |

**ভিজ্যুয়াল প্রসেস:**

1. **Code:** `function myFunc() { ... }`
2. **Lazy Parse:** V8 দেখে "ওহ, এটা ফাংশন!" -> AST বানায় না -> **SFI** তৈরি করে (Start: line 10, End: line 20)।
3. **Function Call:** `myFunc()` কল হলো -> V8 SFI চেক করে কোড খুঁজে পায় -> সেই কোডটুকু নিয়ে **AST** বানায় -> **Bytecode** বানায় -> রান করে।

#### ৩.২.৪ AST Visualizer বনাম V8 Reality (সতর্কতা)

অনলাইন AST Visualizer-এ কোড দিলে পুরো গাছের ডালপালা (Full AST) দেখা যায়। কিন্তু বাস্তবে V8 রানটাইমে সেটা করে না।

* **Visualizer:** শেখার জন্য পুরো কোড "Eagerly" পার্স করে দেখায়।
* **V8 Reality:** পারফরমেন্সের জন্য অপ্রয়োজনীয় ফাংশন স্কিপ করে (Lazy Parsing)।

#### ৩.২.৫ পূর্ণাঙ্গ ফ্লো চার্ট (স্টেপ-বাই-স্টেপ)

| **স্টেপ**                        | **অ্যাকশন**                                         | **ইঞ্জিনের ভেতরে যা ঘটে**                                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **১. রিডিং**                    | Node.js ফাইল রিড করে পয়েন্টার V8-কে দেয় | Source Code (C++ Heap-এ থাকে, V8 Pointer পায়)                                                                                         |
| **২. গ্লোবাল পার্সিং** | `const a = 10`(Eager)                                          | AST তৈরি হয় ->**Ignition**একে **Bytecode** -এ রূপান্তর করে -> রান হয়।                                  |
| **৩. ফাংশন স্ক্যান**     | `function show()`(Lazy)                                        | *কোনো AST নেই। শুধু**SharedFunctionInfo (SFI)*তৈরি করে মেমোরিতে "বুকমার্ক" করে রাখে।               |
| **৪. ফাংশন কলিং**           | `show()`কল করা হলো                                     | V8 SFI চেক করে কোড খুঁজে পায় -> ফাংশনের ভেতরের কোডের জন্য**AST**তৈরি হয়।                  |
| **৫. ইন্টারপ্রিটিং**    | **Ignition**এর কাজ শুরু                           | Ignition ওই AST থেকে**Bytecode**জেনারেট করে এবং সাথে সাথে এক্সিকিউট করে।                        |
| **৬. অপ্টিমাইজেশন**      | **TurboFan**(JIT)                                          | ফাংশনটি বারবার কল হলে (Hot Function), TurboFan বাইটকোডকে সরাসরি**Machine Code**বানিয়ে ফেলে। |

### ধাপ ৩.৩: Ignition (Interpreter)

V8-এর **Ignition** interpreter AST থেকে **Bytecode** তৈরি করে। Bytecode হলো machine code-এর একটা intermediate form।

### ধাপ ৩.৪: TurboFan (JIT Compiler)

যে কোড বারবার run হয় (hot code), সেটাকে **TurboFan** compiler অপ্টিমাইজড **Machine Code**-এ কনভার্ট করে। এটাকে বলে **Just-In-Time (JIT) Compilation**।

### Complete Flow:

```md
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

### ৩.৫ V8 Engine: Parsing (স্পষ্টীকরণ)

**Ignition (Interpreter)** এবং **TurboFan (JIT)** সম্পর্কে আরও একটি গুরুত্বপূর্ণ পয়েন্ট:

- V8 এখন আর সরাসরি Bytecode থেকে মেশিন কোড করে না।
- **Ignition** বাইটকোড তৈরি করে এবং সেটা সাথে সাথে রান করে (Interpreter)।
- যখন দেখা যায় একটা ফাংশন বারবার কল হচ্ছে (Hot Code), তখন **TurboFan** এসে সেটাকে অপ্টিমাইজড মেশিন কোডে রূপান্তর করে।

## ৪. Wrapper Function Call → Execution Context CREATED

Wrapper function call হওয়ার **আগে** Node.js runtime কিছু গুরুত্বপূর্ণ কাজ করে।

### 🔹 Call দেওয়ার আগেই Node.js runtime যা করে

Node.js runtime (C++ side):

1. বর্তমান ফাইলের জন্য একটি **Module object** তৈরি করে
2. `module.exports` তৈরি করে
3. `exports` কে `module.exports`-এর **reference** হিসেবে সেট করে
4. ওই ফাইলের জন্য একটি **local `require` function** তৈরি করে
5. ফাইলের **absolute path** থেকে `__filename` বানায়
6. ফাইলের **directory path** থেকে `__dirname` বানায়

📌 এই সব value **wrapper function call দেওয়ার আগেই প্রস্তুত থাকে**

### 🔹 এরপর Node.js runtime wrapper function call করে

সব value তৈরি হয়ে যাওয়ার পর Node.js runtime ভিতরে ভিতরে এভাবে call করে:

```js
wrapper(
  exports,        // reference to module.exports
  require,        // per-file local require function
  module,         // current Module object
  __filename,     // absolute file path
  __dirname       // directory path
);
```

⚠️ এই call JavaScript code থেকে হয় না

⚠️ এই call হয় **Node.js runtime (C++ → V8 boundary)** থেকে

### 🔥 এই exact moment-এই V8 কী করে?

V8 দেখে:

> “একটা function call এসেছে”

তখন V8:

- একটি **Function Execution Context** তৈরি করে
- সেটাকে **Call Stack-এ push** করে
- Wrapper function-এর parameters হিসেবে পাওয়া
  `exports`, `require`, `module`, `__filename`, `__dirname`
  — এই value গুলো **bind করে**

📌 **এই মুহূর্ত থেকেই actual execution শুরু হয়**

## 🧠 Important Clarification (Exam-safe)

- `exports`, `require`, `module`, `__filename`, `__dirname`
  - ❌ global না
  - ❌ compile-এর সময় বানানো না
  - ✅ execution-এর ঠিক আগ মুহূর্তে Node.js runtime বানায়
- **Execution Context**
  - ❌ Node.js বানায় না
  - ✅ **V8 বানায়**
  - ✅ function call detect করলেই

## 🟢 One-Line Final Version (Interview-Ready)

> Wrapper function call করার আগে Node.js runtime নিজে
>
> `exports`, `require`, `module`, `__filename`, `__dirname`-এর value তৈরি করে,
>
> তারপর wrapper function call করে,
>
> আর সেই call detect করেই V8 execution context তৈরি করে।

## ৫. Event Loop & Thread Pool (Asynchronous Magic)

Node.js হচ্ছে **Single Threaded**। মানে মেইন থ্রেডে একসাথে একটি মাত্র কাজ করতে পারে। কিন্তু যদি কোনো বড় কাজ থাকে (যেমন ফাইল রিড করা বা ডাটাবেস অ্যাক্সেস), তখন সেইটা **Libuv**-এর **Thread Pool**-এ পাঠিয়ে দেয়।

### Event Loop-এর ৬টি Phase:

```md
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

## ৬. Thread Pool (Libuv)

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

## ৭. Final Execution & Exit (কাজ শেষ)

### Execution:

Processor code-এর result **output** হিসেবে দেখায় (যেমন: Console log করা বা response পাঠানো)।

### Exit:

যখন Call Stack খালি হয়ে যায় এবং কোনো pending অ্যাসিনক্রোনাস কাজ থাকে না, তখন Node.js প্রসেসটা বন্ধ হয়ে যায় (`process.exit()`)।

### Exit Conditions:

- Event Loop-এ কোনো pending work নেই
- কোনো active timers নেই
- কোনো pending I/O operations নেই

## 💡 Chronological Summary (Best for Revision):

```
1. Node Start ➔ V8 & Libuv চালু হয়
2. Wrapping ➔ Code-কে (function(...){ }) দিয়ে ঘেরা হয়
3. Parsing ➔ Code-কে AST-এ convert করা হয়
4. JIT Compiling ➔ AST থেকে Machine Code (0, 1) তৈরি হয়
5. Execution ➔ Call Stack-এ code execute হয়; heavy কাজ Thread Pool-এ যায়
6. Event Loop ➔ Background কাজের callback গুলোকে Stack-এ পাঠায়
7. Exit ➔ সব কাজ শেষ হলে process বন্ধ হয়
```

## বিস্তারিত উদাহরণ:

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

## সারসংক্ষেপ (Quick Reference):

```
┌─────────────────────────────────────────────────────────┐
│                    Node.js Architecture                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              Your JavaScript Code                │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Node.js Bindings                    │   │
│  │         (C++ code connecting JS to C)           │   │
│  └─────────────────────────────────────────────────┘   │
│                    ↓           ↓                        │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │    V8 Engine     │  │        Libuv             │    │
│  │  (JS → Machine)  │  │  (Async I/O, Thread Pool)│    │
│  └──────────────────┘  └──────────────────────────┘    │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Operating System                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 💡 Pro-Tip for Interview/Exam:

যদি কেউ জিজ্ঞেস করে, **"Node.js কেন single-threaded হয়েও fast?"**

**উত্তর:** কারণ Node.js heavy কাজগুলো নিজে করে না, সেগুলো **Libuv**-এর মাধ্যমে background-এ পাঠিয়ে দেয় এবং **Event Loop**-এর মাধ্যমে results গুলো manage করে।

### ৩.৬ Optimization Logic

#### ৩.৬.১ TurboFan সব ফাংশনের জন্য কেন নয়?

মেশিন কোড বানানো (Optimization) একটা ব্যয়বহুল বা দামী প্রসেস। এতে CPU এবং Memory অনেক খরচ হয়।

যদি তোমার অ্যাপে ১০০০টি ফাংশন থাকে এবং প্রতিটি ফাংশন মাত্র ১-২ বার কল হয়, তবে V8 যদি সবার জন্য মেশিন কোড বানাতে যায়, তাহলে তোমার অ্যাপ সুপার-ফাস্ট হওয়ার বদলে উল্টো স্লো হয়ে যাবে।

তাই V8 এর নীতি হলো: "যে ফাংশন বারবার খাটে, তাকেই আমি প্রমোশন দেব।"

---

#### ৩.৬.২ কখন TurboFan একশন নেয়? (The "Hot" Threshold)

ইঞ্জিন যখন বাইটকোড রান করে, সে তখন একটা Counter বা হিসাব রাখে যে কোন ফাংশন কতবার কল হচ্ছে।

- **Cold Function:** ১-৫ বার কল হয়েছে। (শুধু Ignition বাইটকোড চালাবে)।
- **Warm Function:** কয়েকশ বার কল হয়েছে। (ইঞ্জিন রেডি হতে থাকে)।
- **Hot Function:** যখন দেখে একই ফাংশন হাজার হাজার বার কল হচ্ছে (যেমন লুপের ভেতর বা রিকার্সন), তখন TurboFan একে সরাসরি Machine Code-এ রূপান্তর করে।

---

#### ৩.৬.৩ টাইপ স্পেশালাইজেশন (TurboFan-এর আসল ক্ষমতা)

ফাংশন বারবার কল হলেই শুধু হবে না, ইনপুট টাইপও এক হতে হবে। একে বলে **Speculative Optimization**।

```javascript
function add(a, b) {
  return a + b;
}

// ১০০০ বার কল হলো নম্বর দিয়ে
for(let i=0; i<1000; i++) add(i, i+1); 
```

এখানে TurboFan দেখবে `a` এবং `b` সবসময় **Number**। সে তখন এমন একটা মেশিন কোড বানাবে যা শুধু নম্বর যোগ করতে জানে। এটা রকেটের গতিতে চলবে।

##### সতর্কতা (De-optimization):

যদি ১০০১ তম বার তুমি `add("hello", "world")` কল করো, TurboFan অবাক হয়ে যাবে। সে দেখবে তার বানানো মেশিন কোড (যা শুধু নম্বরের জন্য) এখানে কাজ করবে না। তখন সে সাথে সাথে মেশিন কোড ফেলে দিয়ে আবার Ignition (Bytecode) এ ফেরত আসবে। এটাকে বলে **De-optimization**।

---

#### ৩.৬.৪ তোমার নোটের জন্য ফাইনাল ফ্লো-চার্ট (The Logic)

| **অবস্থা**               | **ইঞ্জিন পার্ট** | **আউটপুট**      | **গতি**      |
| ------------------------------------ | --------------------------------- | --------------------------- | --------------------- |
| **১ম বার কল**           | Ignition                          | Bytecode তৈরি ও রান | ভালো              |
| **বারবার কল (Hot)**    | TurboFan                          | Optimized Machine Code      | সুপার ফাস্ট |
| **টাইপ বদলে গেলে** | Bailing Out                       | Back to Bytecode            | স্লো              |

---

### সারসংক্ষেপ:

হ্যাঁ, ফাংশন বারবার ব্যবহারের জন্যই তৈরি, কিন্তু V8 বুদ্ধিমান। সে শুধু "বারবার ব্যবহৃত" এবং "একই ধরনের ডেটা (Stable Types)" নিয়ে কাজ করা ফাংশনগুলোকেই TurboFan দিয়ে মেশিন কোড বানায়।
