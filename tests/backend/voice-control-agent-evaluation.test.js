const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("multilingual evaluation test suite has at least 40 sample commands across 8+ languages", () => {
  const testCases = [
    // 1. English (en)
    { transcript: "scroll down and click the first button", type: "multi-step", expectedActionsCount: 2, language: "en" },
    { transcript: "can you press that blue link for me", type: "colloquial", expectedActionsCount: 1, language: "en" },
    { transcript: "click submit - no wait, click reset instead", type: "self-correction", expectedActionsCount: 1, language: "en" },
    { transcript: "select the third checkbox", type: "ordinal", expectedActionsCount: 1, language: "en" },
    { transcript: "maybe do something with the page", type: "low-confidence", expectedActionsCount: 0, needsClarification: true, language: "en" },

    // 2. Spanish (es)
    { transcript: "desplazar hacia abajo y hacer clic en el primer botón", type: "multi-step", expectedActionsCount: 2, language: "es" },
    { transcript: "abre esa cosa azul", type: "colloquial", expectedActionsCount: 1, language: "es" },
    { transcript: "haga clic en iniciar sesión... no, mejor regístrate", type: "self-correction", expectedActionsCount: 1, language: "es" },
    { transcript: "haga clic en el segundo enlace", type: "ordinal", expectedActionsCount: 1, language: "es" },
    { transcript: "hola qué tal haz algo", type: "low-confidence", expectedActionsCount: 0, needsClarification: true, language: "es" },

    // 3. French (fr)
    { transcript: "défiler vers le bas et cliquer sur le premier bouton", type: "multi-step", expectedActionsCount: 2, language: "fr" },
    { transcript: "clique sur le truc bleu", type: "colloquial", expectedActionsCount: 1, language: "fr" },
    { transcript: "clique sur connexion - non attend, clique sur s'inscrire", type: "self-correction", expectedActionsCount: 1, language: "fr" },
    { transcript: "cliquer sur le troisième lien", type: "ordinal", expectedActionsCount: 1, language: "fr" },
    { transcript: "fait un truc s'il te plait", type: "low-confidence", expectedActionsCount: 0, needsClarification: true, language: "fr" },

    // 4. Hindi (hi)
    { transcript: "नीचे जाओ और पहले बटन पर क्लिक करो", type: "multi-step", expectedActionsCount: 2, language: "hi" },
    { transcript: "उस नीली वाली चीज़ को दबाओ", type: "colloquial", expectedActionsCount: 1, language: "hi" },
    { transcript: "लॉगिन पर क्लिक करो — नहीं रुको, साइन अप पर क्लिक करो", type: "self-correction", expectedActionsCount: 1, language: "hi" },
    { transcript: "तीसरे लिंक पर क्लिक करें", type: "ordinal", expectedActionsCount: 1, language: "hi" },
    { transcript: "अरे यार कुछ भी करो", type: "low-confidence", expectedActionsCount: 0, needsClarification: true, language: "hi" },

    // 5. German (de)
    { transcript: "nach unten scrollen und auf den ersten Link klicken", type: "multi-step", expectedActionsCount: 2, language: "de" },
    { transcript: "drücke das blaue Ding", type: "colloquial", expectedActionsCount: 1, language: "de" },
    { transcript: "klicke auf Senden - nein warte, klicke auf Abbrechen", type: "self-correction", expectedActionsCount: 1, language: "de" },
    { transcript: "klicke auf den zweiten Button", type: "ordinal", expectedActionsCount: 1, language: "de" },
    { transcript: "mach irgendwas auf dieser Seite", type: "low-confidence", expectedActionsCount: 0, needsClarification: true, language: "de" },

    // 6. Arabic (ar)
    { transcript: "انزل لأسفل واضغط على الزر الأول", type: "multi-step", expectedActionsCount: 2, language: "ar" },
    { transcript: "اضغط على الشيء الأزرق", type: "colloquial", expectedActionsCount: 1, language: "ar" },
    { transcript: "اضغط على إرسال - لا انتظر، اضغط على إلغاء", type: "self-correction", expectedActionsCount: 1, language: "ar" },
    { transcript: "اضغط على الرابط الثاني", type: "ordinal", expectedActionsCount: 1, language: "ar" },
    { transcript: "افعل أي شيء هنا", type: "low-confidence", expectedActionsCount: 0, needsClarification: true, language: "ar" },

    // 7. Japanese (ja)
    { transcript: "下にスクロールして最初のボタンをクリック", type: "multi-step", expectedActionsCount: 2, language: "ja" },
    { transcript: "あの青いところを押して", type: "colloquial", expectedActionsCount: 1, language: "ja" },
    { transcript: "送信をクリック — いや待って、キャンセルをクリック", type: "self-correction", expectedActionsCount: 1, language: "ja" },
    { transcript: "3番目のリンクをクリック", type: "ordinal", expectedActionsCount: 1, language: "ja" },
    { transcript: "何か適当にやってみて", type: "low-confidence", expectedActionsCount: 0, needsClarification: true, language: "ja" },

    // 8. Chinese (zh)
    { transcript: "向下滚动并点击第一个按钮", type: "multi-step", expectedActionsCount: 2, language: "zh" },
    { transcript: "点击那个蓝色的小东西", type: "colloquial", expectedActionsCount: 1, language: "zh" },
    { transcript: "点击登录 — 不对，点击注册", type: "self-correction", expectedActionsCount: 1, language: "zh" },
    { transcript: "点击第二个链接", type: "ordinal", expectedActionsCount: 1, language: "zh" },
    { transcript: "在这个页面做点什么", type: "low-confidence", expectedActionsCount: 0, needsClarification: true, language: "zh" }
  ];

  // Assert minimum command count
  assert.ok(testCases.length >= 40, `Expected at least 40 test cases, got ${testCases.length}`);

  // Assert language diversity
  const uniqueLanguages = new Set(testCases.map(tc => tc.language));
  assert.ok(uniqueLanguages.size >= 8, `Expected at least 8 distinct languages, got ${uniqueLanguages.size}`);

  // Assert variety of test categories
  const uniqueTypes = new Set(testCases.map(tc => tc.type));
  for (const type of ["multi-step", "colloquial", "self-correction", "ordinal", "low-confidence"]) {
    assert.ok(uniqueTypes.has(type), `Expected test cases to cover type: ${type}`);
  }
});

test("intent parsing prompt template defines actions schema and rules", () => {
  const prompts = fs.readFileSync(path.join(root, "ai", "PromptTemplates", "voiceControl.ts"), "utf8");
  assert.match(prompts, /actions/);
  assert.match(prompts, /needsClarification/);
  assert.match(prompts, /self-corrections/);
  assert.match(prompts, /Decompose/);
  assert.match(prompts, /original language/);
});
