
# Node.js: নন-ব্লকিং I/O এবং ইভেন্ট লুপ — সম্পূর্ণ বাংলা ট্রান্সক্রিপ্ট

---

## ভূমিকা

**00:00:04**  
[Music] আজ আমি Node সম্পর্কে সংক্ষেপে কথা বলব। Node হলো একটি **server-side JS platform**। এটি **Google-এর V8** ইঞ্জিনের উপর তৈরি। এটি I/O (Input/Output) একটি বিশেষ পদ্ধতিতে করে, যা আমি বিস্তারিতভাবে বর্ণনা করব। এটি **CommonJS module system** ব্যবহার করে এবং এটি **C** ভাষায় লেখা, যা অনেক মানুষকে বিভ্রান্ত করেছে। এটি আসলে বেশ বড় একটি C প্রজেক্ট।

মূল থিসিস হলো যে **I/O ভিন্নভাবে করতে হবে** — আমরা এটা ভুলভাবে করছি। আমরা যেভাবে I/O নিয়ে চিন্তা করছি সেটাই সবকিছু কঠিন করে তুলছে।

---

## I/O এর সমস্যা

**00:00:56**  
সার্ভার লেখা এবং যেকোনো ধরনের অ্যাপ্লিকেশন লেখা কঠিন হয়ে যায় আমরা যেভাবে I/O করছি তার কারণে। অনেক ওয়েব অ্যাপ্লিকেশনে এই ধরনের কোড থাকে — তুমি একটি ডাটাবেসে কুয়েরি করো, তারপর একটি রেজাল্ট রিটার্ন করো, তারপর সেই রেজাল্ট ব্যবহার করো।

প্রশ্ন হলো: **তোমার ওয়েব ফ্রেমওয়ার্ক কী করছে যখন এই লাইন কোড রান করছে?** অনেক ক্ষেত্রে তুমি কিছুই করছ না — তুমি শুধু বসে আছ যখন ডাটাবেস রেসপন্স দেওয়ার জন্য অপেক্ষা করছে।

**00:01:48**  
সেই ডাটাবেস হয়তো San Francisco-তে আছে, অথবা অন্য কোথাও। অনেক কারণ থাকতে পারে। কিন্তু পয়েন্ট হলো তুমি শুধু এর রেসপন্সের জন্য অপেক্ষা করতে পারো না।

**CPU এবং মেমোরির ভেতরে যা হয়** এবং **বাইরে গেলে যা হয়** (ডিস্ক বা নেটওয়ার্কে) — এর মধ্যে বিশাল পার্থক্য আছে। যদি তোমাকে অন্য একটি সার্ভারে TCP কানেকশন করতে হয়, এমনকি সেটা তোমার একই হোস্টিং সেন্টারে থাকলেও, তুমি শত শত বা দশ দশটি clock cycle-এর বদলে **মিলিয়ন মিলিয়ন clock cycle** এর কথা বলছ।

---

## মাল্টিটাস্কিং এবং থ্রেড

**00:02:39**  
তুমি কিছু না করে বসে থাকতে পারো না। স্পষ্টতই ভালো সফটওয়্যার ডাটাবেসের রেসপন্সের জন্য শুধু অপেক্ষা করার চেয়ে ভালো করতে পারে — এটি **মাল্টিটাস্ক** করতে পারে। তোমার বিভিন্ন **threads of execution** রান করতে পারে।

প্রশ্ন হলো: **এটাই কি সেরা যা আমরা করতে পারি?**

আমি মনে করি তুমি দুটি জনপ্রিয় ওয়েব সার্ভার দেখে সিদ্ধান্ত নিতে পারো তারা I/O তে কী ঠিক করছে এবং কী ভুল করছে।

---

## Nginx বনাম Apache: বেঞ্চমার্ক

**00:03:30**  
এখানে একটি বেঞ্চমার্ক আছে যা হয়তো তোমাদের কাছে দেখা যাচ্ছে না। এটি দেখায়:
- **Horizontal axis**: ওয়েব সার্ভারে concurrent clients-এর সংখ্যা (concurrency)
- **Vertical axis**: প্রতি সেকেন্ডে requests

এটি **Nginx** এবং **Apache** এর তুলনা। তুমি দেখবে যে Nginx দ্রুত respond করছে — দুই গুণ, তিন গুণ দ্রুত, বিশেষ করে higher concurrency-তে।

**00:04:18**  
কিন্তু বড় পার্থক্য দেখা যায় **memory** এর ক্ষেত্রে:
- **Horizontal axis**: সার্ভারে clients-এর সংখ্যা
- **Vertical axis**: মেমোরি ব্যবহার

**Apache** অনেক মেমোরি ব্যবহার করে যখন তুমি অনেক ক্লায়েন্ট পাও। যদি তোমার Apache সার্ভারে 3,000 জন কানেক্ট করে, তুমি অনেক মেগাবাইট মেমোরি ব্যবহার করছ।

অন্যদিকে, **Nginx** খুব স্থিতিশীল থাকে — ছোট footprint সহ।

---

## মূল পার্থক্য: Threads বনাম Event Loop

**00:05:18**  
প্রশ্ন হলো: **এই দুটির মধ্যে পার্থক্য কী?**

বড় পার্থক্য হলো:
- **Apache** প্রতিটি কানেকশনের জন্য **threads** ব্যবহার করে
- **Nginx** একটি **Event Loop** ব্যবহার করে

একটু টেকনিক্যাল হলে বলতে হয়:
1. **প্রথম বেঞ্চমার্ক** বলছে যে বিভিন্ন থ্রেডের মধ্যে **context switching** (যা Apache করে) ফ্রি নয় — এটি CPU time খরচ করে।
2. **দ্বিতীয়** হলো প্রতিটি থ্রেড মেমোরি নেয়, এবং এটি অনেক মেমোরি হয়ে যায়।

**00:06:09**  
Tight little server building community-তে সবাই জানে যে তুমি কানেকশনের জন্য থ্রেড ব্যবহার করতে পারো না — এটি **concurrency করার সঠিক উপায় নয়**।

**সঠিক উপায়** হলো একটি **single thread** রাখা এবং একটি **Event Loop** রাখা। তুমি কিছু করো, তারপর সেটা শেষ, তারপর অন্য কিছু করো, সেটাও শেষ।

এর জন্য যা দরকার তা হলো: **তুমি যা করো তা কখনো বেশি সময় নিতে পারবে না** — তোমার **Non-blocking I/O** থাকতে হবে।

---

## Threading Systems এবং তাদের সমস্যা

**00:06:50**  
Apache **OS threads** ব্যবহার করে। অন্যান্য threading systems আছে — **green threads** বা **co-routines** — এগুলো পরিস্থিতি অনেক উন্নত করতে পারে।

কিন্তু এটা এখনও **Machinery** — এখনও কিছু করতে হবে। তোমাকে **illusion** তৈরি করতে হবে যে যখন তুমি ডাটাবেসে কানেক্ট করো, তোমার প্রোগ্রাম থামে — তুমি পরের লাইনে যাও না যতক্ষণ না সেটা ফিরে আসে।

এটা একটা **illusion** — তোমার প্রোগ্রাম থামছে না, এটা অন্য সব কাজ করছে, কিন্তু দেখে মনে হচ্ছে থেমে আছে।

**00:07:32**  
আমি বলি **threaded concurrency একটি leaky abstraction** — এটি সমস্যা তৈরি করে:
- **Locking problems**
- **Memory problems**
- চিন্তা করা কঠিন

এটি তোমার কম্পিউটারে আসলে কী হচ্ছে তার জন্য খুব ভালো abstraction নয়।

---

## Blocking বনাম Callback-based কোড

**00:08:11**  
এই ধরনের কোড যেখানে তুমি একটি ফাংশন কল করো, এটি কোনো সার্ভারে কানেক্ট করে এবং সেই সার্ভার থেকে কিছু রিটার্ন করে যেন কোনো সময় পার হয়নি, এবং তারপর তুমি সেই রেজাল্ট ব্যবহার করবে — এর জন্য হয়:
- পুরো প্রসেস **block** করতে হবে, অথবা
- কোনো ধরনের **threading system** থাকতে হবে (হয়তো co-routines), কিন্তু সম্ভবত **multiple execution stacks** লাগবে

**কিন্তু তুমি এই ধরনের কোড লিখতে পারো** — যেখানে তুমি ডাটাবেসে query করো এবং সেই ফাংশনের ভেতরে response-এর জন্য অপেক্ষা করার বদলে তুমি এটাকে একটি **callback** দাও।

**00:08:51**  
যখন এটা হয়, তোমার execution সেই statement দিয়ে right through যেতে পারে, সেই request করতে পারে, এবং অন্য কাজ করতে থাকতে পারে। যখন request ফিরে আসে — মিলিয়ন মিলিয়ন clock cycles পরে — তুমি callback execute করতে পারো।

এতে **কোনো Machinery জড়িত নেই** — তোমার শুধু সেই callback-এ একটি **pointer** দরকার।

**এভাবেই আমাদের I/O করতে হবে** যদি তুমি খুব দ্রুত high concurrency সার্ভার চাও — তোমাকে এভাবে design করতে হবে।

---

## কেন সবাই এটা করছে না?

**00:09:38**  
তুমি বলবে "হ্যাঁ, কিন্তু সবাই threads নিয়ে কথা বলছে। আমার বস বলছে Java threads অসাধারণ..." — কেন সবাই এটা করছে না? কেন তোমার আমাকে বিশ্বাস করা উচিত?

দুটি কারণ আছে: **Cultural** এবং **Infrastructural**

### Cultural Bias:

তোমার প্রথম I/O প্রোগ্রাম হলো এমন কিছু যেখানে তুমি তোমার নাম enter করো এবং তারপর results পাও। কেউ সেটা টাইপ করে, কিন্তু তুমি সেই ফাংশনে **block** করো — অন্য কিছু করো না — এবং তারপর নাম print করো।

**00:10:17**  
তাই আমাদের শেখানো হয় input **demand** করতে এবং আমরা sockets-এও একইভাবে ব্যবহার করি। আমরা ডাটাবেসে কানেক্ট করি এবং বলি "দাও আমাকে response দাও"।

মানুষ এই ধরনের কোড দেখে (যেখানে অপেক্ষা করার বদলে callback দেওয়া হয়) এবং বলে "আমি এটা করতে পারব না — এটা spaghetti code, এটা খুব complicated"।

আমি মনে করি আমাদের এটা পুনর্বিবেচনা করা উচিত। আমি মনে করি না এটা অবশ্যই বেশি complicated। হয়তো সবচেয়ে simple ক্ষেত্রে, কিন্তু যখন তুমি একটি **IRC server** লিখতে শুরু করো, এই ধরনের কোড লেখা খুব **স্বাভাবিক** হয়ে যায়।

### Missing Infrastructure:

**00:10:55**  
মনে রাখো যদি তুমি একটি Event Loop-এ থাকো, তুমি **কখনো I/O তে block করতে পারো না** — তুমি ডাটাবেসের response-এর জন্য অপেক্ষা করতে পারো না কারণ তুমি একটি **single thread-এ** আছ। যদি তুমি কখনো অপেক্ষা করো, **বাকি সবকিছু বন্ধ হয়ে যায়**।

Threaded environment-এ তুমি মাঝে মাঝে বা দীর্ঘ সময়ের জন্য অপেক্ষা করতে পারো।

**00:11:33**  
সমস্যা হলো আমাদের কাছে এই ধরনের **non-blocking I/O** করার জন্য libraries available নেই:
- **POSIX**-এ asynchronous file I/O specification আছে, কিন্তু এই ধরনের libraries খুঁজে পাওয়া কঠিন
- **Man pages** প্রায়ই বলে না যে একটি ফাংশন ডিস্ক access করবে কি না
- **Closures** এবং **Anonymous functions** নেই অনেক ভাষায়, যা evented code লেখা কঠিন করে
- **libmysql client** asynchronous queries support করে না (হয়তো queries করে, কিন্তু asynchronous connections নয়)
- **Asynchronous DNS resolution** খুঁজে পাওয়া কঠিন

---

## বিদ্যমান Solutions

**00:12:24**  
কিছু solutions আছে — হয়তো তুমি **EventMachine** (Ruby), **Python-এর Twisted**, অথবা **Perl-এর AnyEvent** এর কথা শুনেছ। এগুলো libraries যা non-blocking sockets সহ একটি event loop প্রদান করে এবং efficient servers তৈরি করতে এগুলো ব্যবহার করা বেশ সহজ।

কিন্তু আমি মনে করি users **confused** হয়ে যায় কিভাবে এগুলো ব্যবহার করতে হয়। যদি তুমি Ruby ব্যবহার করো, অনেক libraries available আছে, তোমার EventMachine আছে, এবং তুমি জানতে চাও "আমি অন্যগুলো কিভাবে ব্যবহার করব?"

**00:13:02**  
সাধারণত উত্তর হলো: **তুমি পারবে না** — কারণ Ruby-র MySQL library সবকিছুতে block করে। তুমি সেটাকে একটি Event Loop-এ ফেলতে পারো না। কিন্তু মানুষ এটা জানে না।

তাই users-দের এখনও **Event Loops বা non-blocking I/O** সম্পর্কে কিছু জ্ঞান থাকতে হয়, যা প্রায় কারোরই নেই। এটি সমস্যাটিকে খুব ভালোভাবে **abstract** করে না।

---

## JavaScript: Event Loop-এর জন্য Built

**00:13:47**  
সৌভাগ্যক্রমে, **JavaScript** এমনভাবে design করা হয়েছিল যে এটি **Event Loop-এর জন্য built**। Browser-side JavaScript যা তোমার আছে সেটা একটি Event Loop — তুমি একটি button তৈরি করো, কেউ click করে, তুমি একটি **onClick callback** পাও।

Event Loop stuff করার জন্য **ঠিক এটাই দরকার**।

JavaScript-এ আছে:
- **Anonymous functions**
- **Closures**
- Browser-এ তুমি একবারে শুধু **একটি callback** পাও
- তুমি multiple callbacks পাও না এবং variables lock করতে হয় না
- I/O শুধু সেই callbacks দিয়ে করা হয়

আমি মনে করি এই ঘরে যারা JavaScript-এর সাথে পরিচিত তারা ইতিমধ্যে **evented servers লেখার জন্য প্রস্তুত** — তোমার আর বেশি কিছু জানার দরকার নেই।

---

## Node.js এর লক্ষ্য

**00:14:36**  
এটা ছিল দীর্ঘ motivation। আমি যা বানাতে চাই তা হলো একটি **non-blocking infrastructure** যাতে তুমি খুব highly concurrent সার্ভার তৈরি করতে পারো এবং তোমার এটা সম্পর্কে জানার দরকার নেই।

আমরা সব কঠিন non-blocking event loop **abstract** করে ফেলব — তোমার এটা জানার দরকার নেই, এটা শুধু **callbacks** হবে।

---

## Design Goals

**00:15:20**  
### ১. কোনো ফাংশন I/O perform করবে না

ডিস্ক বা নেটওয়ার্ক থেকে তথ্য receive করতে বা অন্য প্রসেস থেকে, তোমার কোনো ধরনের **callback** থাকতে হবে। তুমি কখনো এই ধরনের ফাংশন রাখতে পারবে না যা কোনো query করে এবং কিছু return করে — **এটা allowed নয়**।

### ২. Low Level হওয়া উচিত

**00:16:03**  
আমি চাই সবকিছু **stream in এবং out** করতে পারুক। আমি কখনো user-কে data buffer করতে বাধ্য করব না।

যদি তুমি Ruby on Rails বা কিছুর সাথে পরিচিত হও, অনেক জায়গায় তোমাকে data buffer করতে বাধ্য করে। আমি তোমার জন্য সেই choices নিতে চাই না — এটা **low level**, মানুষ এর উপর build করতে পারবে। যদি তারা তাদের data buffer করতে চায়, তারা করতে পারে, কিন্তু **Node level-এ** এই ধরনের কোনো সিদ্ধান্ত নেওয়া উচিত নয়।

### ৩. POSIX layer-এ কোনো functionality সরানো উচিত নয়

উদাহরণস্বরূপ: **half-close TCP connections** — সবাই এটা ignore করে কিন্তু এতে ভালো জিনিস আছে।

### ৪. Built-in Support থাকা উচিত

**00:16:42**  
তুমি সবকিছু লিখতে চাও না। আমি চাই এটা low level হোক, কিন্তু আমি মনে করি **TCP, DNS, এবং HTTP** হলো **infrastructural protocols** — এগুলো খুব গুরুত্বপূর্ণ এবং এই ধরনের system-এ এগুলোর জন্য খুব ভালো support থাকা উচিত।

বিশেষ করে **HTTP** এর জন্য অনেক features থাকবে:
- **Chunked requests**
- **Chunked responses**
- **Keep-alive**

গুরুত্বপূর্ণভাবে, তুমি একটি request পেয়ে সেটার respond **ইচ্ছামতো** করতে পারবে — তুমি **requests hang** করতে পারবে।

**Comet style applications** এর জন্য এটাই দরকার। যদি তুমি **long poll** করতে চাও, তোমাকে সেই request hang করতে হবে এবং অপেক্ষা করতে হবে যতক্ষণ না user-কে বলার কিছু থাকে।

### ৫. API পরিচিত হওয়া উচিত

**00:17:23**  
যদি আমার একটি timer থাকে, আমি এটাকে **setTimeout** বলব। এটা **browser JavaScript**-এর মতো দেখতে হবে।

যেখানে এটা browser JavaScript নয়, যেখানে আমি POSIX stuff নিয়ে কথা বলছি, সেখানে এটা **POSIX names** ব্যবহার করবে।

আমি মানুষ যা করছে তা reinvent করতে চাই না — আমি শুধু এর একটি **idealized version** উপস্থাপন করতে চাই।

### ৬. Platform Independent হওয়া উচিত

এই মুহূর্তে আমি Windows-এ compile করি না, কিন্তু না করার কোনো কারণ নেই এবং আমি শীঘ্রই করার আশা করি।

---

## প্রথম উদাহরণ: Hello World

**00:17:57**  
এখন কিছু actual examples। Node compile করতে হয়, তাই তোমাকে download করতে হবে। কোনো binaries নেই। Python ছাড়া কোনো real dependencies নেই, তাই build করা বেশ সহজ হওয়া উচিত।

**00:18:41**  
এখানে তোমার প্রথম উদাহরণ। এই program দুই সেকেন্ড অপেক্ষা করার পর "hello" output করবে।

প্রথমে আমরা **sys module require** করি — যা আমাদের কিছু data output করতে হবে। এটি **CommonJS require** — CommonJS দ্বারা defined semantics ব্যবহার করে।

তারপর আমরা **2000 milliseconds** এর জন্য একটি **setTimeout** সেট করি।

গুরুত্বপূর্ণভাবে, ভেতরের callback এখনই done হয় না। প্রথমে আমরা **"hello"** print করি, তারপর দুই সেকেন্ড পরে **"world"** print হয়।

**00:19:26**  
"world" print হওয়ার পর **Node exits** — এটা বেশ গুরুত্বপূর্ণ। যখন Event Loop-এ আর কিছু করার নেই, কোনো timer নেই, তখন এটি exits — **process এর শেষ**।

তুমি যা করবে:
1. এটা একটি file-এ রাখবে যার নাম `helloworld.js`
2. তারপর node program দিয়ে run করবে
3. তুমি "hello" পাবে, দুই সেকেন্ড পরে "World", এবং process exits

---

## দ্বিতীয় উদাহরণ: Signal Handlers

**00:20:06**  
এখন আমরা hello world program পরিবর্তন করব। এবার আমরা একটি loop-এ যাব — আমরা **setInterval** function ব্যবহার করব, চিরকালের জন্য loop করব এবং একটি message print করব।

যখন user এটা kill করে (Ctrl+C চাপলে), এটি একটি message print করবে এবং exit করবে।

এটি Node-এ special **process object** এবং **signal handler** কিভাবে set করতে হয় তা demonstrate করে — interrupt signal (SIGINT) এর জন্য।

**00:20:49**  
আবার আমরা require করি, শুধু একটি function দরকার তাই সেটা একটি variable-এ pull out করি।

পরের তিন লাইনে আমরা interval set up করি যা প্রতি **500 milliseconds** এ সেই callback কল করে।

শেষের কয়েকটি লাইনে আমরা একটি **signal handler** set up করছি। তুমি এটা করো **addListener** function কল করে — যা DOM-এর সাথে পরিচিত হলে জানা থাকার কথা।

তারপর তুমি **"goodbye"** print করো এবং **process exit** করো।

---

## Process Object এবং Events

**00:21:36**  
এই **process object** events emit করে যখন এটি একটি signal receive করে — এটি **SIGINT event** emit করে। অন্য যেকোনো signal-এর জন্যও একই হবে।

এটা DOM-এর মতো — তুমি শুধু একটি listener add করো process কী করছে তা catch করতে।

Process-এ আরো কিছু জিনিস আছে:
- **PID**
- **Program arguments**
- **Environment**
- **Current working directory**
- **Memory usage**
- উপকারী জিনিস

**00:22:18**  
Process যেভাবে events emit করে সেটা Node-এর জন্য বেশ typical। অনেক objects events emit করে — এটা Node-এর **fundamental paradigm**।

উদাহরণস্বরূপ:
- একটি **TCP server** প্রতিবার কেউ connect করলে **connection event** emit করবে
- যদি কেউ HTTP upload করে, **request object** প্রতিবার upload-এর একটি packet পেলে **body event** emit করবে

কেউ তোমার server-এ একটি movie stream upload করছে এবং তুমি পাচ্ছ: body, body, body...

সব objects যা events emit করে তারা **EventEmitter class** এর instances।

---

## TCP Server উদাহরণ

**00:22:58**  
এখানে প্রথম **TCP server** উদাহরণ। আমরা একটি TCP server বানাব যা **Port 8000**-এ listen করবে। যখন কেউ connect করবে, আমরা peer-কে একটি message পাঠাব — "hello" বলব — তারপর connection close করব।

খুব simple TCP server:
1. প্রথম লাইনে **TCP module require** করি
2. একটি **server object** তৈরি করি (TCP server)
3. **Connection event** এর জন্য একটি listener add করি
4. Connection event থেকে **c** object পাই — সেটা আমাদের connection
5. এটাকে **"hello"** পাঠাই
6. **Close** করি
7. অবশেষে এটাকে **Port 8000**-এ **listening** শুরু করতে হয়

**00:23:42**  
যদি আমরা এটা try করি:
1. সেই code **server.js**-এ রাখি
2. `telnet localhost 8000` করি
3. "hello" পাই
4. Server connection close করে

আমরা এটা একটু simplify করতে পারি — connection listener-এ তোমাকে addListener কল করতে হয় না, তুমি শুধু এটা Constructor-এ pass করতে পারো।

---

## File I/O in Node

**00:24:27**  
Node-এ **File I/O unblocking** — এটা এমন কিছু যা সাধারণত করা কঠিন। Node-এ এটা না করা বেশ কঠিন — এটা উল্টো।

এটা ভালো — যেভাবে কাজ করা উচিত সেটা **সহজ** হওয়া উচিত এবং যেভাবে করা উচিত নয় সেটা **কঠিন** হওয়া উচিত।

আমরা দেখব কেউ শেষবার কখন **`/etc/passwd`** modify করেছে:
1. **POSIX module require** করি — যেখানে সব file I/O operations আছে
2. **stat** function বের করি
3. **sys module** থেকে **puts** function require করি
4. `/etc/passwd`-এ **stat** কল করি
5. এটি একটি **promise** return করে
6. Promise-এ একটি **callback** add করি — যা stat operation complete হলে কল হবে
7. অবশেষে **modified time** print করি

**00:25:08**  
এই **promise objects** বেশ common। সব file operations একটি promise return করে।

**Promise** হলো একটি **EventEmitter** যা **success** বা **error** event emit করে।

যদি তুমি কোনো file operation করো, তুমি block করতে চাও না কারণ এটা দীর্ঘ সময় হবে — তুমি তোমার server বন্ধ করতে পারো না যখন disk spin করছে।

**00:25:49**  
তাই তুমি disk-এ এই request পাঠাও: "আমাকে বলো সেই file কখন modify হয়েছিল" — আমি অন্য কাজ করতে যাচ্ছি।

তারপর eventually এটা ফিরে আসে এবং বলে: "success, তোমার উত্তর এখানে" অথবা "error"।

`promise.addCallback` হলো `promise.addListener('success', ...)` এর জন্য শুধু **API sugar**।

---

## HTTP Server উদাহরণ

**00:26:36**  
আমরা ধীরে ধীরে আরো complicated হচ্ছি। এখন আমরা একটি **HTTP server** করব।

**HTTP module require** করতে হবে এবং একটি **HTTP server object** তৈরি করতে হবে।

এর callback — যা প্রতিটি request-এ কল হয় — তোমাকে একটি **request object** এবং একটি **response object** দেয়।

তারপর আমরা:
1. **Header** পাঠাই — 200 success code এবং content-type text/plain
2. **Body "Hello"** পাঠাই
3. **Body "World"** পাঠাই
4. **Response finish** করি

**00:27:25**  
এটা **JSGI specification** এর চেয়ে একটু complicated, কিন্তু **ভালো কারণে**।

JSGI-তে তোমাকে react করতে হয় — এটা একই জিনিস, তোমার একটি function আছে এবং তারপর result return করো। সব processing একটি single function-এ হয়।

শুরুতে যা বলেছিলাম — এটাই আমরা **avoid** করতে চাই। যদি তোমাকে database-এ connect করতে হয়, তুমি এক function-এ respond করতে চাও না।

আমি মনে করি JSGI দিয়েও এটা করার উপায় আছে, কিন্তু আমি এটা পছন্দ করি — এটা যথেষ্ট simple।

---

## HTTP Server with setTimeout

**00:28:07**  
একটু complicated — একই জিনিস, একটি HTTP server যা "hello world" output করে, কিন্তু সব একসাথে output করার বদলে এটা "hello" output করবে এবং তারপর দুই সেকেন্ড পরে "world" output করবে।

আমরা request callback-এ একটি **setTimeout** দিই — **2000 milliseconds** অপেক্ষা করি।

**00:28:48**  
তুমি হয়তো ভাবছ "কে পরোয়া করে, কেউ কেন এটা করতে চাইবে?" — কিন্তু এটা গুরুত্বপূর্ণ কারণ:

যখন setTimeout কল হয় server বন্ধ হয় না — এটা ঘুমাচ্ছে না দুই সেকেন্ডের জন্য কিছু না করে — এটা **requests serve করছে**।

এখানে একটি request, এখানে একটি request, এখানে একটি request... এবং তারপর হঠাৎ: ওটা done, ওটা done, ওটা done।

**Comet style applications** এর জন্য **ঠিক এই behavior** দরকার। যদি তোমাকে **long poll** করতে হয়, তোমাকে efficiently requests **hang** করতে পারতে হবে।

**00:29:17**  
এটা দেখায় তুমি কিভাবে এটা করতে পারো। এটা long poll করার সঠিক উপায় নয়, কিন্তু এটা demonstrate করে যে তুমি **requests hang করতে পারো**।

---

## Child Processes

**00:30:01**  
আমরা **sys.exec** command দিয়ে programs কল করতে পারি।

অবশ্যই এটাও একটি **promise** return করে কারণ এটা immediately হয় না, memory-তে হয় না। যদি তুমি `ls /` করো, সেটা হয়তো disk spin করতে হবে এবং start এবং finish-এর মধ্যে কিছু সময় যায়।

তাই আমাদের একটি **callback** থাকতে হবে — `sys.exec` থেকে returned promise object-এ একটি callback add করি এবং output print করি।

**00:30:40**  
কিন্তু আমি আগে বলেছিলাম আমি কখনো মানুষকে data buffer করতে বাধ্য করব না — এবং সেটা data buffer করেছে।

তাই **sub-process কল করার একটি lower level উপায়** আছে — যেখানে তুমি **standard I/O** দিয়ে data stream করতে পারো।

যদি তুমি একটি বিশাল directory-তে `ls` করছ, তুমি সেই সব data memory-তে buffer করতে চাও না — তুমি এটা parent process-এ **stream** করতে চাও, parse করতে চাও, handle করতে চাও, যা খুশি করতে চাও — কিন্তু hopefully buffer করতে চাও না।

**00:31:20**  
এটা **inter-process communication** এর একটি simple form।

এখানে একটি উদাহরণ যেখানে আমরা **cat program** launch করব — Unix cat program যা তুমি যা পাঠাও সেটাই ফেরত পাঠায়।

আমরা:
1. Line 3-এ **child process** তৈরি করি
2. **Output** এর জন্য একটি listener add করি — প্রতিবার output থাকলে সেই callback কল হয়
3. শেষের কয়েকটি লাইনে cat process-এ **data write** করি — "hello world" পাঠাই cat process-এর standard in-এ
4. অবশেষে **close** কল করি — যা cat process-এর standard in close করে এবং Cat terminate হয়

**00:31:59**  
তাই আমরা **sub-processes তৈরি** করতে পারি, **child processes** তৈরি করতে পারি এবং তাদের মধ্যে **data stream in এবং out** করতে পারি।

---

## IRC Server Demo

**00:33:23**  
এখন তোমাদের জন্য একটি **demo** আছে। আমি Node-এ একটি **IRC server** লিখেছি — শুধু একটি hack, কিন্তু demonstrate করার জন্য তুমি কী করতে পারো।

হয়তো এটা কাজ করবে হয়তো করবে না, কিন্তু চলো `irc.nodejs.org` এ গিয়ে node.js channel-এ যাই...

আমার terminal আছে এখানে, আমি আসলে server-এ logged in আছি। প্রথমে server-এ connect করব... hopefully এটা এখনও running আছে এবং crash করেনি।

এখন আমি connected এবং **node.js channel join** করব...

**00:34:04**  
যদি মানুষ সেটা করে, তুমি দেখতে পাবে মানুষ কথা বলছে। এই IRC server Node-এ running — এটা একটি IRC client অবশ্যই।

আমার একটি **REPL (Read-Eval-Print Loop)** library আছে। যেহেতু আমাদের একটি event loop আছে, আমরা এতে সব ধরনের I/O add করতে পারি।

এটি **এক process** — কিন্তু আমরা এতে একটি REPL add করতে পারি এটা নিয়ে না ভেবে। কারণ আমরা যা করি তা হলো: আমাদের event loop-এ সব connections করি, সব messages পাঠাই, ফিরে আসি, এবং তারপর REPL stuff করতে পারি।

**00:35:20**  
যদি আমরা এতে একটি **HTTP server** add করতে চাইতাম সেটাও possible — সব একই process-এ, শুধু event loop ঘুরে।

যেহেতু কিছুই block করে না, আমরা যত খুশি I/O add করতে পারি।

আমি তোমাদের REPL দেখাই... এটা screen-এ running... REPL thing খুলি...

এখানে ircd REPL thing। আমার IRC server-এর উপর **total control** আছে। উদাহরণস্বরূপ, আমি কিছু users-কে kill করতে পারি... yay!

আমার full control আছে, আমি মানুষদের দিয়ে কিছু বলাতেও পারি — এটা অবশ্যই শুধু JavaScript।

**00:37:43**  
যাই হোক, পয়েন্ট হলো আমাদের IRC server-এ একটি **REPL** আছে।

অবশ্যই যদি আমি শুধু Ctrl+C করি তাহলে সবাই চলে যাবে — তারা offline এখন কারণ IRC server gone। এবং যদি আমি এটা আবার চালু করি তাহলে এটা শুধু সেখানে আছে।

এটা আমার demo। sorry আমি খুব ভালো presenter না।

---

## কেন Node IRC Server লেখা সহজ করে

**00:38:22**  
Code checkout করো যদি চাও — এটা শুধু **400 lines** বা তার কাছাকাছি।

আমি মনে করি এটা demonstrate করে যে Node IRC server লেখার আসল সমস্যাটিকে **abstract করে দেয়**।

যদি তুমি সেই code দেখো, এটা শুধু:
- কেউ connect করে
- আমার একটি users-এর list আছে
- আমি এই user-কে সেই message পাঠাই

এটা follow করা **সত্যিই বেশ সহজ** আমার humble opinion-এ।

যেখানে যদি তুমি বসে Ruby-তে একটি IRC server লিখতে চাও, আমি মনে করি তুমি এটা **খুব কঠিন** পাবে।

হ্যাঁ তুমি EventMachine ব্যবহার করতে পারো এবং হয়তো okay পাবে, কিন্তু আমি মনে করি এটা সত্যিই **concurrent server লেখার সমস্যাটিকে abstract করে**।

যদি তুমি একটি **message queue daemon** একসাথে throw করতে চাও: Node শুরু করো, 100 lines JavaScript টাইপ করো, এবং এই তোমার message queue daemon — যা তোমার যা specific দরকার সেটা করে।

---

## Node এর Internal Design

**00:39:05**  
সংক্ষেপে, আমি Node-এর internal design নিয়ে কথা বলি।

Node কোনো big monolithic app নয় — এটা **কিছু C libraries** যা বিভিন্নভাবে একসাথে hacked।

- **V8** কোনো ছোট library নয় — এটা একটি **বিশাল C library** (Google-এর)
- **libev** (event loop) এবং **libeio** (thread pool) — সত্যিই nice little libraries, দুটোই **Marc Lehmann** এর লেখা
- **HTTP parser** — বেশ advanced, সব ধরনের streaming stuff করতে পারে (আমার লেখা)
- **Socket library** (আমার লেখা)
- **c-ares** — একটি DNS resolver, যা গুরুত্বপূর্ণ

**00:39:47**  
আমি যেভাবে এটা করি:

অনেক **system calls** আছে যা তুমি করতে পারো যদি তোমাকে file system access করতে হয়। সেই system calls — সেই POSIX system calls — **block করতে পারে**।

তাই আমি যা করি তা হলো সবকিছুর নিচে একটি **thread pool** রাখি এবং বলি "আমি এই system call করতে চাই, আমি একটি directory read করতে চাই" — এটা pack up করি এবং **thread pool-এ পাঠিয়ে দিই**। এটা stuff করে এবং তারপর ফিরে আসে।

**00:40:33**  
**Signal handlers** সাধারণত তোমার বাকি execution stack থেকে asynchronous হয়।

এই thread pool thing — এগুলো main Node.js event loop থেকে কিছুটা asynchronous এবং তাই তাদের notify করতে হয়, তাদের main event loop-এ **marshal back** করতে হয় বলতে "wait your turn, alright এখন আমরা signal handler process করতে পারি"।

তুমি event loop থেকে result আসলেই immediately করতে পারো না — তুমি বলতে পারো না "সবকিছু থামাও, আমরা এটা করতে যাচ্ছি"। তোমাকে বলতে হবে "alright, এখন আমরা তোমাকে process করতে পারি"।

আমি এটা করি thread pool থেকে এবং signal handlers থেকে একটি **pipe** ব্যবহার করে, এবং তুমি সেই pipe-এ **select** করতে পারো।

---

## বড় Files Streaming করা

**00:41:04**  
আরেকটি জিনিস যা আমি করেছি — আমি worried ছিলাম কী হবে যদি তুমি একটি বিশাল file Node-এ pipe করো।

ধরো এই file **200 megabytes** এবং domain names-এর একটি list আছে এবং তুমি সেগুলো সব lookup করতে চাও — প্রতিটি line একটি domain name এবং তুমি তাদের উপর DNS resolution করতে চাও।

কিন্তু তুমি DNS resolution **block করতে পারো না** নাহলে এটা সত্যিই slow হবে।

**00:41:42**  
তুমি যা করতে চাও তা হলো এটা read করো এবং তোমার Node process-এ stream করো, lines read করো, DNS lookups করো — এবং এই সব **একই event loop-এ** হওয়া উচিত।

সমস্যা হলো Unix বা যেকোনো POSIX system-এ, standard file descriptor একটি file refer করবে এবং তুমি **files-এ select করতে পারো না** — তুমি এগুলো তোমার event loop-এ add করতে পারো না, তুমি শুধু এগুলো থেকে read করতে পারো না কারণ সেটা **block করবে**।

**00:42:23**  
তাই তুমি যা করো তা হলো একটি **pumping thread** তৈরি করো এবং একটি **pipe** থাকে।

তুমি file থেকে এই **blocking reads** করো, সেগুলো pipe-এ pump করো, যা main application-এ যায়।

এভাবে তুমি server-এ data **stream করতে পারো non-blocking way-তে** শুধু **একটি extra thread** দিয়ে।

এগুলো এমন জিনিস যা তোমাকে হয়তো জানতে হবে যদি তুমি এটা নিজে লিখতে যাও। তোমাকে এটা করতে হবে না — এটা users যে API deal করে তার নিচে আছে।

যদি interested হও, source directory-তে coupling দেখো।

---

## ভবিষ্যৎ পরিকল্পনা

**00:43:05**  
**What's next?**

- কিছু **API issues fix** করতে হবে — বিভিন্ন জিনিস আছে যা বেশ ugly
- আরো **modularity** চাই — libraries-কে DLLs-এ break করতে চাই যাতে core Node process খুব ছোট হয় এবং যদি তোমার HTTP server দরকার হয় তুমি একটি DLL/shared object load করবে HTTP parser পেতে
- **MySQL এবং Postgres** এর জন্য কিছু libraries core distribution-এ include করব
- **Performance improve** করতে হবে — এটা সবসময় একটি issue, কিছু low-hanging fruit আছে যা আমি জানি যেগুলো pick করে faster করা যায়
- **TLS support** আসছে
- এবং অবশেষে আমি কোনো ধরনের **Web Worker** মতো জিনিস করতে চাই — যা সম্ভবত শুধু child process object extend করবে যাতে তুমি processes তৈরি করতে পারো এবং তাদের মধ্যে nice way-তে **IPC** করতে পারো

**00:44:30**  
এখন version **0.1.17**। আমি **0.2** release করব — যা প্রথম version হবে যা আমি আশা করব অন্য মানুষ ব্যবহার করবে।

এই মুহূর্তে আমি মনে করি এটা একটু hacky — যদি তুমি experimental হও, please ব্যবহার করো, কিন্তু না হলে **0.2 এর জন্য অপেক্ষা করো**।

আমি মনে করি সেটা ভালো হবে কারণ আমি **API freeze করব** — বা অন্তত এর কিছু অংশ — তাই তুমি এর উপর কিছু confidence সহ build করতে পারবে যে আমি তোমার নিচ থেকে এটা change করে দেব না।

---

## প্রশ্নোত্তর

### Q: Source file পরিবর্তন করলে কি automatically load হবে?

**00:45:43**  
**উত্তর:** না, কিন্তু Felix এবং আমি এই weekend একটু এটা নিয়ে hack করছিলাম — এটা এমন কিছু যা আমি add করতে চাই।

### Q: Blocking writes কিভাবে handle করো?

যখন তোমার একটি socket আছে, kernel-এ একটি **write buffer** আছে এবং তুমি শুধু এতটুকু data write করতে পারো write buffer-এ এটা full হওয়ার আগে।

Kernel সব data network-এ যত দ্রুত চায় push করতে পারে না — কিছু buffer আছে যা possibly fill up করতে পারে।

**00:46:17**  
তাই যদি তুমি একটি file out socket-এ অন্য কোথাও stream করছ, সেটা block করতে পারে।

**Node এটা block করে না** — এটা data **buffer করে**, internally data allocate করবে যদি তুমি সেটা করো।

তুমি যা করতে পারো তা হলো একটি **callback পেতে যখন সেই buffer drain হয়**।

তাই যদি তুমি কাউকে একটি file stream করতে চাও:
1. এটা send করা শুরু করো
2. ধরো এক megabyte পাঠাও — যা buffer fill করতে পারে বা নাও পারে
3. তারপর **drain হওয়া পর্যন্ত অপেক্ষা করো**
4. তারপর আরেক megabyte পাঠাও

এভাবে তুমি data stream করতে পারো — write buffer কখনো fill up করবে না। যা হবে তা হলো আমি **user space-এ memory allocate করব**।

তাই **writes block করে না**।

### Q: CommonJS সম্পর্কে তোমার stance কী?

**00:47:16**  
**CommonJS** এর অনেক ভালো proposals আছে আমি মনে করি:
- **Module system** যা আমি ব্যবহার করছি
- একটি **binary proposal**
- একটি **package proposal** — যা খুব ভালো দেখাচ্ছে

এই মুহূর্তে CommonJS শুধু ratify করেছে:
- **Module proposal**
- **Assert** (testing library proposal)

এটা I/O এর মতো জিনিস define করে না।

আমি মনে করি সেই discussions **ongoing** থাকবে। কিছু মানুষ আছে যারা এটা আরো **blocking state**-এ চায়, আমি এটা আরো **evented state**-এ চাই — তাই আমরা পরের কয়েক মাস ধরে এটা নিয়ে লড়াই করব।

### Q: Funding আছে কি?

**00:48:07**  
একটু আছে। আমি এর জন্য **আরো টাকা চাই**।

নিজের **open source project** লেখার জন্য অনেক effort দরকার এবং হ্যাঁ, এর **funding দরকার**।

**[Applause]**

---

## উপসংহার

Node.js একটি revolutionary approach নিয়ে এসেছে server-side JavaScript development-এ। **Non-blocking I/O**, **Event Loop**, এবং **Callbacks** ব্যবহার করে এটি high-concurrency servers তৈরি করা সহজ করে দিয়েছে।

মূল শিক্ষাগুলো:
- Threads প্রতিটি connection-এর জন্য **efficient নয়**
- **Event Loop** হলো concurrent servers-এর জন্য সঠিক approach
- JavaScript **Event Loop-এর জন্য naturally designed**
- Node.js **I/O complexity abstract করে** দেয়

---
