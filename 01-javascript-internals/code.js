function proofTest(paramValue) {
  // ১. প্যারামিটার চেক: 
  // এখানে paramValue ডিক্লেয়ার করার আগে আমরা এক্সেস করছি না, 
  // কারণ প্যারামিটার ফাংশন বডিতে ঢোকার আগেই ইনিশিয়ালাইজ হয়ে যায়।
  console.log("১. প্যারামিটার ভ্যালু:", paramValue); // আউটপুট: undefined (কোনো Error নেই)

  try {
    // ২. let চেক:
    // এখানে 'letVariable' মেমোরিতে আছে কিন্তু uninitialized অবস্থায় (TDZ)।
    console.log(letVariable); 
  } catch (e) {
    console.log("২. let এর ক্ষেত্রে এরর:", e.message); // আউটপুট: Cannot access 'letVariable' before initialization
  }

  let letVariable = "I am a let variable";
}

// ফাংশন কল করার সময় কোনো আর্গুমেন্ট পাস করা হচ্ছে না
proofTest();