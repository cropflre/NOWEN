// 名言库 - 系统默认名言（多语言支持）
import i18n from '../lib/i18n';

interface Quote {
  zh: string;
  en: string;
}

// 中英文对照名言
const wisdomQuotesData: Quote[] = [
  // 乔治·奥威尔 (George Orwell)
  {
    zh: "战争即和平，自由即奴役，无知即力量。 —— 乔治·奥威尔《1984》",
    en: "War is peace. Freedom is slavery. Ignorance is strength. —— George Orwell \"1984\""
  },
  {
    zh: "谁控制了过去，谁就控制了未来；谁控制了现在，谁就控制了过去。 —— 乔治·奥威尔《1984》",
    en: "Who controls the past controls the future. Who controls the present controls the past. —— George Orwell \"1984\""
  },
  {
    zh: "在欺骗盛行的时代，说出真相就是革命行为。 —— 乔治·奥威尔",
    en: "In a time of universal deceit, telling the truth is a revolutionary act. —— George Orwell"
  },
  {
    zh: "我们将在没有黑暗的地方相见。 —— 乔治·奥威尔《1984》",
    en: "We shall meet in the place where there is no darkness. —— George Orwell \"1984\""
  },
  {
    zh: "如果你感到保持人性是值得的，即使这不能有任何结果，你也已经打败了他们。 —— 乔治·奥威尔《1984》",
    en: "If you feel that staying human is worthwhile, even when it can't have any result whatever, you've beaten them. —— George Orwell \"1984\""
  },
  {
    zh: "所谓自由就是可以说二加二等于四的自由。承认这一点，其他一切就迎刃而解。 —— 乔治·奥威尔《1984》",
    en: "Freedom is the freedom to say that two plus two make four. If that is granted, all else follows. —— George Orwell \"1984\""
  },
  {
    zh: "如果说思想会腐蚀语言的话，那么语言也会腐蚀思想。 —— 乔治·奥威尔《1984》",
    en: "If thought corrupts language, language can also corrupt thought. —— George Orwell \"1984\""
  },
  {
    zh: "他们不到觉悟的时候，就不会造反；他们不造反，就不会觉悟。 —— 乔治·奥威尔《1984》",
    en: "Until they become conscious they will never rebel, and until after they have rebelled they cannot become conscious. —— George Orwell \"1984\""
  },
  {
    zh: "政治语言的目的就是使谎言听起来像真理，谋杀听起来值得尊敬，同时给完全虚无飘渺之物以实实在在之感。 —— 乔治·奥威尔",
    en: "Political language is designed to make lies sound truthful and murder respectable, and to give an appearance of solidity to pure wind. —— George Orwell"
  },
  {
    zh: "用逻辑来反逻辑，一边表示拥护道德一边又否定道德，一边相信民主是办不到的一边又相信党是民主的捍卫者。 —— 乔治·奥威尔《1984》",
    en: "To use logic against logic, to repudiate morality while laying claim to it, to believe that democracy was impossible and that the Party was the guardian of democracy. —— George Orwell \"1984\""
  },
  {
    zh: "我们很明白，没有人会为了废除权力而夺取权力。权力不是手段，权力是目的。 —— 乔治·奥威尔《1984》",
    en: "We know that no one ever seizes power with the intention of relinquishing it. Power is not a means; it is an end. —— George Orwell \"1984\""
  },
  {
    zh: "你爱一个人，就去爱他，你什么也不能给他时，你仍然给他以爱。 —— 乔治·奥威尔",
    en: "If you love someone, you love them, and when you have nothing else to give, you still give them love. —— George Orwell"
  },
  {
    zh: "他们说时间能治愈一切创伤，他们说你总能把它忘得精光；但是这些年来的笑容和泪痕，却仍使我心痛像刀割一样！ —— 乔治·奥威尔",
    en: "They say that time heals all wounds, they say you can always forget; but the smiles and tears of all these years still cut my heart like a knife! —— George Orwell"
  },
  {
    zh: "所有动物一律平等，但有些动物比其他动物更平等。 —— 乔治·奥威尔《动物农场》",
    en: "All animals are equal, but some animals are more equal than others. —— George Orwell \"Animal Farm\""
  },
  {
    zh: "真正的权力，我们日日夜夜为之奋战的权力，不是控制事物的权力，而是控制人的权力。 —— 乔治·奥威尔《1984》",
    en: "The real power, the power we have to fight for night and day, is not power over things, but over men. —— George Orwell \"1984\""
  },
  {
    zh: "历史不是一面镜子，而是黑板上的记号，可以随时擦去，随时填补。 —— 乔治·奥威尔《1984》",
    en: "History is not a mirror but a blackboard, which can be erased and rewritten at any time. —— George Orwell \"1984\""
  },
  {
    zh: "一切都消失在迷雾之中了。过去给抹掉了，而抹掉本身又被遗忘了，谎言便变成了真话。 —— 乔治·奥威尔《1984》",
    en: "Everything faded into mist. The past was erased, the erasure was forgotten, the lie became truth. —— George Orwell \"1984\""
  },
  {
    zh: "思想罪不会带来死亡，思想罪本身就是死亡。 —— 乔治·奥威尔《1984》",
    en: "Thoughtcrime does not entail death: thoughtcrime IS death. —— George Orwell \"1984\""
  },
  {
    zh: "也许和被人爱比起来，人们更想要的是被理解。 —— 乔治·奥威尔《1984》",
    en: "Perhaps one did not want to be loved so much as to be understood. —— George Orwell \"1984\""
  },
  {
    zh: "世界上有真理，也有非真理，如果你坚持真理，即使这会让你与世界为敌，你也不是疯子。 —— 乔治·奥威尔《1984》",
    en: "There is truth and there is untruth, and if you cling to the truth even against the whole world, you are not mad. —— George Orwell \"1984\""
  },
  {
    zh: "一个人如果将他自己描述得很好的话，他十有八九是在撒谎，因为任何生命从内部审视只不过是一系列的失败。 —— 乔治·奥威尔",
    en: "Autobiography is only to be trusted when it reveals something disgraceful. A man who gives a good account of himself is probably lying. —— George Orwell"
  },
  {
    zh: "所有的战争宣传，所有的叫嚣、谎言和仇恨，都来自那些不上战场的人。 —— 乔治·奥威尔",
    en: "All the war-Loss propaganda, all the screaming and lies and hatred, comes invariably from people who are not fighting. —— George Orwell"
  },
  {
    zh: "把人们的意愿撕成碎片，然后再按照你的意愿拼出新的形状，这就是权力。 —— 乔治·奥威尔《1984》",
    en: "Power is in tearing human minds to pieces and putting them together again in new shapes of your own choosing. —— George Orwell \"1984\""
  },
  {
    zh: "我注意到，许多人在独处的时候从来不笑，我想如果一个人独处时不笑，他的内心生活一定比较贫乏。 —— 乔治·奥威尔",
    en: "I noticed that many people never laugh when alone. I think if a person never laughs when alone, his inner life must be rather impoverished. —— George Orwell"
  },
  {
    zh: "一个社会离真相越远，它就越仇恨那些说出真相的人。 —— 乔治·奥威尔",
    en: "The further a society drifts from the truth, the more it will hate those who speak it. —— George Orwell"
  },
  {
    zh: "坚定不移地相信能征服世界的人正是那些知道这件事是不可能实现的人。 —— 乔治·奥威尔",
    en: "Those who firmly believe they can conquer the world are precisely those who know it is impossible. —— George Orwell"
  },
  {
    zh: "你越是以为自己正确，那么也就更自然胁迫别人也抱有同你一样的思想。 —— 乔治·奥威尔",
    en: "The more certain you are that you are right, the more naturally you coerce others to think as you do. —— George Orwell"
  },
  {
    zh: "你要准备最终被生活所打垮，这是把你的爱献给其他人的不可避免的代价。 —— 乔治·奥威尔",
    en: "You must be prepared to be ultimately defeated by life. This is the inevitable price of giving your love to others. —— George Orwell"
  },
  {
    zh: "被洗脑者最可悲之处，在于他们真诚地捍卫那些根本不了解的东西。 —— 乔治·奥威尔",
    en: "The most tragic thing about the brainwashed is that they sincerely defend things they don't understand at all. —— George Orwell"
  },
  {
    zh: "群众是软弱的、无能的动物，既不能面对真理，又不会珍惜自由，因此必须受人统治。 —— 乔治·奥威尔《1984》",
    en: "The masses are weak, feeble animals who cannot face the truth or value freedom, and therefore must be ruled. —— George Orwell \"1984\""
  },
  {
    zh: "我最害怕的是，我以为自己是那只特别的，清醒的又无可奈何的猪，到头来其实也只是埋头吃食的一员。 —— 乔治·奥威尔《动物农场》",
    en: "My greatest fear is that I think myself the special, conscious yet helpless pig, but in the end I'm just another one with my head down eating. —— George Orwell \"Animal Farm\""
  },
  {
    zh: "那些你钟爱的缎带，其实是奴隶主烙印在你身上的标志，你难道还不明白吗？自由比缎带更有价值。 —— 乔治·奥威尔《动物农场》",
    en: "Those ribbons you love are the mark of slavery branded on you, don't you understand? Freedom is worth more than ribbons. —— George Orwell \"Animal Farm\""
  },
  {
    zh: "愚蠢像智慧一样必要，也同样难以学到。 —— 乔治·奥威尔《1984》",
    en: "Stupidity was as necessary as intelligence, and as difficult to attain. —— George Orwell \"1984\""
  },
  {
    zh: "过一天算一天，过一星期算一星期，虽然没有前途，却还是尽量拖长现在的时间，这似乎是一种无法压制的本能。 —— 乔治·奥威尔《1984》",
    en: "To live day to day, week to week, prolonging the present with no future, seems an irrepressible instinct. —— George Orwell \"1984\""
  },
  {
    zh: "我理解如何，我不理解为何。 —— 乔治·奥威尔《1984》",
    en: "I understand HOW. I do not understand WHY. —— George Orwell \"1984\""
  },
  {
    zh: "只要等级化结构永远保持不变，至于是谁掌握权力并非重要。 —— 乔治·奥威尔《1984》",
    en: "So long as the hierarchy remains unchanged, it does not matter who holds power. —— George Orwell \"1984\""
  },
  // 尼采 (Nietzsche)
  {
    zh: "上帝死了，是我们杀死了他。 —— 尼采《快乐的科学》",
    en: "God is dead. God remains dead. And we have killed him. —— Nietzsche \"The Gay Science\""
  },
  {
    zh: "虚无主义就在门口，这个最不速之客是从哪里来的？ —— 尼采",
    en: "Nihilism stands at the door: whence comes this uncanniest of all guests? —— Nietzsche"
  },
  {
    zh: "如果你长时间凝视深渊，深渊也会凝视你。 —— 尼采《善恶的彼岸》",
    en: "If you gaze long into an abyss, the abyss also gazes into you. —— Nietzsche \"Beyond Good and Evil\""
  },
  {
    zh: "没有真理，只有解释。 —— 尼采",
    en: "There are no facts, only interpretations. —— Nietzsche"
  },
  {
    zh: "凡具有价值的思想，都是在与虚无的对抗中产生的。 —— 尼采",
    en: "All thoughts of value are born in the struggle against nothingness. —— Nietzsche"
  },
  // 叔本华 (Schopenhauer)
  {
    zh: "人生就像钟摆，在痛苦与无聊之间摆荡。 —— 叔本华《人生的智慧》",
    en: "Life swings like a pendulum backward and forward between pain and boredom. —— Schopenhauer \"The Wisdom of Life\""
  },
  {
    zh: "生存本身就是一种徒劳，因为死神最终会赢得一切。 —— 叔本华",
    en: "Existence itself is futile, for death will ultimately claim everything. —— Schopenhauer"
  },
  {
    zh: "世界是我的表象，也是一种虚幻的梦境。 —— 叔本华《作为意志和表象的世界》",
    en: "The world is my idea, and also an illusory dream. —— Schopenhauer \"The World as Will and Representation\""
  },
  // 萨特 (Sartre)
  {
    zh: "人是一根无用的桅杆。 —— 萨特",
    en: "Man is a useless passion. —— Sartre"
  },
  {
    zh: "人生本身没有意义，直到你赋予它意义。 —— 萨特《存在与虚无》",
    en: "Life has no meaning until you give it one. —— Sartre \"Being and Nothingness\""
  },
  {
    zh: "人是注定要自由的，这种自由包含着对虚无的承担。 —— 萨特",
    en: "Man is condemned to be free; this freedom includes bearing the weight of nothingness. —— Sartre"
  },
  // 加缪 (Camus)
  {
    zh: "推石上山的西西弗斯是快乐的，因为他知晓这种徒劳。 —— 加缪《西西弗神话》",
    en: "One must imagine Sisyphus happy, for he knows his task is futile. —— Camus \"The Myth of Sisyphus\""
  },
  // 齐奥朗 (Cioran)
  {
    zh: "意识到生命之虚妄，本该让我们获得某种类似平静的心态。 —— 齐奥朗",
    en: "Awareness of life's futility should bring us something like peace of mind. —— Cioran"
  },
  {
    zh: "除了失眠，我从未在任何地方找到过真相。 —— 齐奥朗",
    en: "Except for insomnia, I have never found truth anywhere. —— Cioran"
  },
  {
    zh: "人类的诞生本身就是一种灾难性的偶然。 —— 齐奥朗《生而为人的麻烦》",
    en: "The birth of humanity itself is a catastrophic accident. —— Cioran \"The Trouble with Being Born\""
  },
  // 莎士比亚 (Shakespeare)
  {
    zh: "生活是一个愚人所讲的故事，充满着喧嚣和骚动，却没有任何意义。 —— 莎士比亚《麦克白》",
    en: "Life is a tale told by an idiot, full of sound and fury, signifying nothing. —— Shakespeare \"Macbeth\""
  },
  // 影视作品 (Film & TV)
  {
    zh: "宇宙并不在乎你，这既是恐惧，也是自由。 —— 《瑞克和莫蒂》",
    en: "The universe doesn't care about you. That is both terrifying and liberating. —— \"Rick and Morty\""
  },
  {
    zh: "我们是被历史遗忘的一代，没有目的，没有地位。 —— 《搏击俱乐部》",
    en: "We are the middle children of history, with no purpose or place. —— \"Fight Club\""
  },
  {
    zh: "在这个世界上，唯一公平的事情就是死亡。 —— 《怪物》",
    en: "In this world, the only fair thing is death. —— \"Monster\""
  },
  // 其他 (Others)
  {
    zh: "我们只是尘埃，最终也将回归尘埃。",
    en: "We are but dust, and to dust we shall return."
  },
  {
    zh: "万物皆空，一切皆无可取。",
    en: "All is void, nothing is worth pursuing."
  },
  {
    zh: "你所谓的追求，在时间的尺度上不过是瞬息的幻影。",
    en: "What you call pursuit is merely a fleeting illusion on the scale of time."
  },
  {
    zh: "既然结局注定是无，那么过程的优劣也毫无意义。",
    en: "Since the ending is destined to be nothing, the quality of the journey is meaningless."
  },
  {
    zh: "文明不过是覆盖在虚无之上的一层薄冰。",
    en: "Civilization is merely a thin layer of ice covering the void."
  },
  {
    zh: "人类所有的努力，最终都会被热寂所抹平。",
    en: "All human efforts will ultimately be erased by the heat death of the universe."
  },
  {
    zh: "虚无不是终点，而是唯一的真相。",
    en: "Nothingness is not the destination; it is the only truth."
  },
  {
    zh: "我们从虚无中来，又向虚无中去。",
    en: "We come from nothing and return to nothing."
  },
  {
    zh: "所有的价值都是人类为了逃避恐惧而编织的谎言。",
    en: "All values are lies woven by humanity to escape fear."
  },
  {
    zh: "承认一切都没有意义，是成熟的第一步。",
    en: "Acknowledging that nothing has meaning is the first step to maturity."
  },
  {
    zh: "在无边无际的荒原中，连痛苦都显得微不足道。",
    en: "In the boundless wasteland, even pain seems insignificant."
  },
];

// 获取当前语言的名言列表
function getLocalizedQuotes(): string[] {
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  return wisdomQuotesData.map(q => q[lang]);
}

// 导出中文名言（用于兼容旧代码）
export const wisdomQuotes = wisdomQuotesData.map(q => q.zh);

// 当前使用的名言列表（可被后端数据覆盖）
let customQuotesList: string[] = [];
let useDefaultQuotes = true;

// 设置名言列表
export function setActiveQuotes(customQuotes: string[], useDefault: boolean) {
  customQuotesList = customQuotes || [];
  useDefaultQuotes = useDefault;
}

// 获取活跃的名言列表（根据当前语言）
function getActiveQuotes(): string[] {
  const localizedDefaults = getLocalizedQuotes();
  
  if (useDefaultQuotes) {
    // 合并系统默认名言和自定义名言
    const combined = [...localizedDefaults];
    if (customQuotesList && customQuotesList.length > 0) {
      customQuotesList.forEach((q) => {
        if (!combined.includes(q)) {
          combined.push(q);
        }
      });
    }
    return combined;
  } else {
    // 仅使用自定义名言
    if (customQuotesList && customQuotesList.length > 0) {
      return customQuotesList;
    } else {
      // 如果没有自定义名言，回退到系统默认
      return localizedDefaults;
    }
  }
}

// 获取随机名言（不限制，每次随机）
export function getRandomWisdom(): string {
  const activeQuotes = getActiveQuotes();
  return activeQuotes[Math.floor(Math.random() * activeQuotes.length)];
}

// 处理名言更新的回调（供外部组件调用）
export function handleQuotesChange(customQuotes: string[], useDefault: boolean) {
  setActiveQuotes(customQuotes, useDefault);
}
