import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Home,
  Bookmark as BookmarkIcon,
  Github,
  Code2,
  Zap,
  BookOpen,
  Palette,
  Play,
  ExternalLink,
  Pin,
  BookMarked,
  Edit2,
  Trash2,
  Command,
  LayoutDashboard,
} from "lucide-react";
import { AuroraBackground } from "./components/ui/aurora-background";
import { Card3D, CardItem } from "./components/ui/3d-card";
import { BentoGrid, BentoGridItem } from "./components/ui/bento-grid";
import { SpotlightCard } from "./components/ui/spotlight-card";
import { FloatingDock } from "./components/ui/floating-dock";
import { SpotlightSearch } from "./components/ui/spotlight-search";
import { Typewriter } from "./components/ui/typewriter";
import { Meteors, Sparkles } from "./components/ui/effects";
import { BorderBeam, BreathingDot } from "./components/ui/advanced-effects";
import { AddBookmarkModal } from "./components/AddBookmarkModal";
import { ContextMenu, useBookmarkContextMenu } from "./components/ContextMenu";
import { Admin } from "./pages/Admin";
import { AdminLogin } from "./components/AdminLogin";
import { useBookmarkStore } from "./hooks/useBookmarkStore";
import { useTheme } from "./hooks/useTheme";
import { useTime } from "./hooks/useTime";
import { Bookmark } from "./types/bookmark";
import { cn } from "./lib/utils";
import {
  checkAuthStatus,
  clearAuthStatus,
  fetchSettings,
  fetchQuotes,
  SiteSettings,
} from "./lib/api";

// Dock 导航项
const dockItems = [
  { id: "home", title: "首页", icon: <Home className="w-5 h-5" /> },
  { id: "search", title: "搜索", icon: <Search className="w-5 h-5" /> },
  { id: "add", title: "添加", icon: <Plus className="w-5 h-5" /> },
  { id: "admin", title: "管理", icon: <LayoutDashboard className="w-5 h-5" /> },
  {
    id: "github",
    title: "GitHub",
    icon: <Github className="w-5 h-5" />,
    href: "https://github.com",
  },
];

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  dev: <Code2 className="w-5 h-5" />,
  productivity: <Zap className="w-5 h-5" />,
  design: <Palette className="w-5 h-5" />,
  reading: <BookOpen className="w-5 h-5" />,
  media: <Play className="w-5 h-5" />,
};

// 名言库
const wisdomQuotes = [
  // 乔治·奥威尔
  "战争即和平，自由即奴役，无知即力量。 —— 乔治·奥威尔《1984》",
  "谁控制了过去，谁就控制了未来；谁控制了现在，谁就控制了过去。 —— 乔治·奥威尔《1984》",
  "在欺骗盛行的时代，说出真相就是革命行为。 —— 乔治·奥威尔",
  "我们将在没有黑暗的地方相见。 —— 乔治·奥威尔《1984》",
  "如果你感到保持人性是值得的，即使这不能有任何结果，你也已经打败了他们。 —— 乔治·奥威尔《1984》",
  "所谓自由就是可以说二加二等于四的自由。承认这一点，其他一切就迎刃而解。 —— 乔治·奥威尔《1984》",
  "如果说思想会腐蚀语言的话，那么语言也会腐蚀思想。 —— 乔治·奥威尔《1984》",
  "他们不到觉悟的时候，就不会造反；他们不造反，就不会觉悟。 —— 乔治·奥威尔《1984》",
  "政治语言的目的就是使谎言听起来像真理，谋杀听起来值得尊敬，同时给完全虚无飘渺之物以实实在在之感。 —— 乔治·奥威尔",
  "用逻辑来反逻辑，一边表示拥护道德一边又否定道德，一边相信民主是办不到的一边又相信党是民主的捍卫者。 —— 乔治·奥威尔《1984》",
  "我们很明白，没有人会为了废除权力而夺取权力。权力不是手段，权力是目的。 —— 乔治·奥威尔《1984》",
  "你爱一个人，就去爱他，你什么也不能给他时，你仍然给他以爱。 —— 乔治·奥威尔",
  "他们说时间能治愈一切创伤，他们说你总能把它忘得精光；但是这些年来的笑容和泪痕，却仍使我心痛像刀割一样！ —— 乔治·奥威尔",
  "所有动物一律平等，但有些动物比其他动物更平等。 —— 乔治·奥威尔《动物农场》",
  "真正的权力，我们日日夜夜为之奋战的权力，不是控制事物的权力，而是控制人的权力。 —— 乔治·奥威尔《1984》",
  "历史不是一面镜子，而是黑板上的记号，可以随时擦去，随时填补。 —— 乔治·奥威尔《1984》",
  "一切都消失在迷雾之中了。过去给抹掉了，而抹掉本身又被遗忘了，谎言便变成了真话。 —— 乔治·奥威尔《1984》",
  "思想罪不会带来死亡，思想罪本身就是死亡。 —— 乔治·奥威尔《1984》",
  "也许和被人爱比起来，人们更想要的是被理解。 —— 乔治·奥威尔《1984》",
  "世界上有真理，也有非真理，如果你坚持真理，即使这会让你与世界为敌，你也不是疯子。 —— 乔治·奥威尔《1984》",
  "一个人如果将他自己描述得很好的话，他十有八九是在撒谎，因为任何生命从内部审视只不过是一系列的失败。 —— 乔治·奥威尔",
  "所有的战争宣传，所有的叫嚣、谎言和仇恨，都来自那些不上战场的人。 —— 乔治·奥威尔",
  "把人们的意愿撕成碎片，然后再按照你的意愿拼出新的形状，这就是权力。 —— 乔治·奥威尔《1984》",
  "我注意到，许多人在独处的时候从来不笑，我想如果一个人独处时不笑，他的内心生活一定比较贫乏。 —— 乔治·奥威尔",
  "一个社会离真相越远，它就越仇恨那些说出真相的人。 —— 乔治·奥威尔",
  "坚定不移地相信能征服世界的人正是那些知道这件事是不可能实现的人。 —— 乔治·奥威尔",
  "你越是以为自己正确，那么也就更自然胁迫别人也抱有同你一样的思想。 —— 乔治·奥威尔",
  "你要准备最终被生活所打垮，这是把你的爱献给其他人的不可避免的代价。 —— 乔治·奥威尔",
  "被洗脑者最可悲之处，在于他们真诚地捍卫那些根本不了解的东西。 —— 乔治·奥威尔",
  "群众是软弱的、无能的动物，既不能面对真理，又不会珍惜自由，因此必须受人统治。 —— 乔治·奥威尔《1984》",
  "我最害怕的是，我以为自己是那只特别的，清醒的又无可奈何的猪，到头来其实也只是埋头吃食的一员。 —— 乔治·奥威尔《动物农场》",
  "那些你钟爱的缎带，其实是奴隶主烙印在你身上的标志，你难道还不明白吗？自由比缎带更有价值。 —— 乔治·奥威尔《动物农场》",
  "愚蠢像智慧一样必要，也同样难以学到。 —— 乔治·奥威尔《1984》",
  "过一天算一天，过一星期算一星期，虽然没有前途，却还是尽量拖长现在的时间，这似乎是一种无法压制的本能。 —— 乔治·奥威尔《1984》",
  "我理解如何，我不理解为何。 —— 乔治·奥威尔《1984》",
  "只要等级化结构永远保持不变，至于是谁掌握权力并非重要。 —— 乔治·奥威尔《1984》",
  // 尼采
  "上帝死了，是我们杀死了他。 —— 尼采《快乐的科学》",
  "虚无主义就在门口，这个最不速之客是从哪里来的？ —— 尼采",
  "如果你长时间凝视深渊，深渊也会凝视你。 —— 尼采《善恶的彼岸》",
  "没有真理，只有解释。 —— 尼采",
  "凡具有价值的思想，都是在与虚无的对抗中产生的。 —— 尼采",
  // 叔本华
  "人生就像钟摆，在痛苦与无聊之间摆荡。 —— 叔本华《人生的智慧》",
  "生存本身就是一种徒劳，因为死神最终会赢得一切。 —— 叔本华",
  "世界是我的表象，也是一种虚幻的梦境。 —— 叔本华《作为意志和表象的世界》",
  // 萨特
  "人是一根无用的桅杆。 —— 萨特",
  "人生本身没有意义，直到你赋予它意义。 —— 萨特《存在与虚无》",
  "人是注定要自由的，这种自由包含着对虚无的承担。 —— 萨特",
  // 加缪
  "推石上山的西西弗斯是快乐的，因为他知晓这种徒劳。 —— 加缪《西西弗神话》",
  // 齐奥朗
  "意识到生命之虚妄，本该让我们获得某种类似平静的心态。 —— 齐奥朗",
  "除了失眠，我从未在任何地方找到过真相。 —— 齐奥朗",
  "人类的诞生本身就是一种灾难性的偶然。 —— 齐奥朗《生而为人的麻烦》",
  // 莎士比亚
  "生活是一个愚人所讲的故事，充满着喧嚣和骚动，却没有任何意义。 —— 莎士比亚《麦克白》",
  // 影视作品
  "宇宙并不在乎你，这既是恐惧，也是自由。 —— 《瑞克和莫蒂》",
  "我们是被历史遗忘的一代，没有目的，没有地位。 —— 《搏击俱乐部》",
  "在这个世界上，唯一公平的事情就是死亡。 —— 《怪物》",
  // 其他
  "我们只是尘埃，最终也将回归尘埃。",
  "万物皆空，一切皆无可取。",
  "你所谓的追求，在时间的尺度上不过是瞬息的幻影。",
  "既然结局注定是无，那么过程的优劣也毫无意义。",
  "文明不过是覆盖在虚无之上的一层薄冰。",
  "人类所有的努力，最终都会被热寂所抹平。",
  "虚无不是终点，而是唯一的真相。",
  "我们从虚无中来，又向虚无中去。",
  "所有的价值都是人类为了逃避恐惧而编织的谎言。",
  "承认一切都没有意义，是成熟的第一步。",
  "在无边无际的荒原中，连痛苦都显得微不足道。",
];

// 当前使用的名言列表（可被后端数据覆盖）
let activeQuotes = [...wisdomQuotes];

// 设置名言列表
function setActiveQuotes(customQuotes: string[], useDefault: boolean) {
  if (useDefault) {
    // 合并系统默认名言和自定义名言
    const combined = [...wisdomQuotes];
    if (customQuotes && customQuotes.length > 0) {
      customQuotes.forEach(q => {
        if (!combined.includes(q)) {
          combined.push(q);
        }
      });
    }
    activeQuotes = combined;
  } else {
    // 仅使用自定义名言
    if (customQuotes && customQuotes.length > 0) {
      activeQuotes = customQuotes;
    } else {
      // 如果没有自定义名言，回退到系统默认
      activeQuotes = [...wisdomQuotes];
    }
  }
}

// 获取随机名言（不限制，每次随机）
function getRandomWisdom(): string {
  return activeQuotes[Math.floor(Math.random() * activeQuotes.length)];
}

function App() {
  const [currentPage, setCurrentPage] = useState<
    "home" | "admin" | "admin-login"
  >("home");
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [pendingUrl, setPendingUrl] = useState("");
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: "Nebula Portal",
    siteFavicon: "",
  });

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    bookmark: Bookmark | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, bookmark: null });

  const { getMenuItems } = useBookmarkContextMenu();

  const { greeting, formattedTime, formattedDate } = useTime();

  const {
    bookmarks,
    categories,
    isLoading,
    newlyAddedId,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshData,
  } = useBookmarkStore();

  useTheme();

  // 初始化时检查登录状态和加载站点设置
  useEffect(() => {
    const { isValid, username } = checkAuthStatus();
    if (isValid && username) {
      setIsLoggedIn(true);
      setAdminUsername(username);
    }

    // 加载站点设置
    fetchSettings()
      .then((settings) => {
        setSiteSettings(settings);
        // 应用站点标题
        if (settings.siteTitle) {
          document.title = settings.siteTitle;
        }
        // 应用站点图标
        if (settings.siteFavicon) {
          const link = document.querySelector(
            "link[rel~='icon']"
          ) as HTMLLinkElement;
          if (link) {
            link.href = settings.siteFavicon;
          } else {
            const newLink = document.createElement("link");
            newLink.rel = "icon";
            newLink.href = settings.siteFavicon;
            document.head.appendChild(newLink);
          }
        }
      })
      .catch(console.error);

    // 加载名言
    fetchQuotes()
      .then((data) => {
        setActiveQuotes(data.quotes, data.useDefaultQuotes);
      })
      .catch(console.error);
  }, []);

  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSpotlightOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 检查是否已登录后台
  const checkAdminAuth = () => {
    const { isValid, username } = checkAuthStatus();
    if (isValid && username) {
      setAdminUsername(username);
      return true;
    }
    return false;
  };

  // Dock 点击处理
  const handleDockClick = (id: string) => {
    switch (id) {
      case "home":
        setCurrentPage("home");
        break;
      case "search":
        setIsSpotlightOpen(true);
        break;
      case "add":
        setIsAddModalOpen(true);
        break;
      case "admin":
        // 检查登录状态
        if (checkAdminAuth()) {
          setCurrentPage("admin");
        } else {
          setCurrentPage("admin-login");
        }
        break;
    }
  };

  // 后台登录成功
  const handleAdminLogin = (username: string) => {
    setAdminUsername(username);
    setIsLoggedIn(true);
    setCurrentPage("admin");
  };

  // 后台退出登录
  const handleAdminLogout = () => {
    clearAuthStatus();
    setAdminUsername("");
    setIsLoggedIn(false);
    setCurrentPage("home");
  };

  // 右键菜单处理
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, bookmark: Bookmark) => {
      if (!isLoggedIn) return; // 未登录不显示右键菜单

      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        bookmark,
      });
    },
    [isLoggedIn]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 书签操作
  const handleAddFromSpotlight = useCallback((url: string) => {
    setPendingUrl(url);
    setIsAddModalOpen(true);
    setIsSpotlightOpen(false);
  }, []);

  const handleSaveBookmark = useCallback(
    (data: Omit<Bookmark, "id" | "orderIndex" | "createdAt" | "updatedAt">) => {
      if (editingBookmark) {
        updateBookmark(editingBookmark.id, data);
      } else {
        addBookmark(data);
      }
      setEditingBookmark(null);
      setPendingUrl("");
    },
    [editingBookmark, updateBookmark, addBookmark]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("确定要删除这个书签吗？")) {
        deleteBookmark(id);
      }
    },
    [deleteBookmark]
  );

  // 分组书签
  const pinnedBookmarks = bookmarks.filter((b) => b.isPinned);
  const readLaterBookmarks = bookmarks.filter(
    (b) => b.isReadLater && !b.isRead
  );
  const bookmarksByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = bookmarks.filter((b) => b.category === cat.id && !b.isPinned);
    return acc;
  }, {} as Record<string, Bookmark[]>);

  // 后台登录页面
  if (currentPage === "admin-login") {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBack={() => setCurrentPage("home")}
      />
    );
  }

  // 后台管理页面
  if (currentPage === "admin") {
    return (
      <>
        <Admin
          bookmarks={bookmarks}
          categories={categories}
          username={adminUsername}
          onBack={() => setCurrentPage("home")}
          onLogout={handleAdminLogout}
          onAddBookmark={() => setIsAddModalOpen(true)}
          onEditBookmark={(bookmark) => {
            setEditingBookmark(bookmark);
            setIsAddModalOpen(true);
          }}
          onDeleteBookmark={deleteBookmark}
          onTogglePin={togglePin}
          onToggleReadLater={toggleReadLater}
          onUpdateBookmark={updateBookmark}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onRefreshData={refreshData}
        />
        <AddBookmarkModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingBookmark(null);
            setPendingUrl("");
          }}
          onAdd={handleSaveBookmark}
          categories={categories}
          initialUrl={pendingUrl}
          editBookmark={editingBookmark}
        />
      </>
    );
  }

  return (
    <AuroraBackground>
      {/* Meteors Effect */}
      <Meteors number={15} />

      {/* Main Content */}
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.section
            className="pt-20 pb-16 text-center relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Time Display */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="text-7xl sm:text-8xl lg:text-9xl font-semibold tracking-tighter font-mono"
                style={{ color: "var(--color-text-primary)" }}
              >
                {formattedTime}
              </div>
              <div
                className="text-base tracking-[0.2em] uppercase mt-3"
                style={{ color: "var(--color-text-muted)" }}
              >
                {formattedDate}
              </div>
            </motion.div>

            {/* Greeting with Typewriter */}
            <motion.h1
              className="text-xl sm:text-2xl lg:text-3xl font-serif font-medium mb-8 tracking-wide"
              style={{ color: "var(--color-text-secondary)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Sparkles>
                <Typewriter
                  getNextWord={getRandomWisdom}
                  initialWord={greeting}
                  delayBetweenWords={5000}
                  fullSentence
                />
              </Sparkles>
            </motion.h1>

            {/* Search Hint - 专业级搜索框 */}
            <motion.div
              className="relative inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ y: -2 }}
            >
              <button
                onClick={() => setIsSpotlightOpen(true)}
                className="search-input relative inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl backdrop-blur-xl transition-all duration-500 group overflow-hidden"
                style={{
                  background: "var(--color-glass)",
                  border: "1px solid var(--color-glass-border)",
                  boxShadow: "var(--color-shadow)",
                }}
              >
                {/* 夜间模式：Border Beam 流光 */}
                <BorderBeam
                  size={80}
                  duration={10}
                  colorFrom="var(--color-primary)"
                  colorTo="var(--color-accent)"
                />
                <Search
                  className="w-4 h-4 transition-colors group-hover:text-[var(--color-primary)]"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <span
                  className="tracking-wide transition-colors group-hover:text-[var(--color-text-secondary)]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  搜索或输入命令...
                </span>
                <kbd
                  className="px-2 py-1 rounded text-xs flex items-center gap-1 ml-2 transition-all"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border-light)",
                  }}
                >
                  <Command className="w-3 h-3" /> K
                </kbd>
              </button>
            </motion.div>
          </motion.section>

          {/* Read Later Hero Card */}
          {readLaterBookmarks.length > 0 && (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card3D
                className="cursor-pointer"
                glowColor="rgba(251, 146, 60, 0.4)"
              >
                <div
                  className="p-8 flex flex-col md:flex-row gap-6"
                  onClick={() =>
                    window.open(readLaterBookmarks[0].url, "_blank")
                  }
                >
                  {/* Image */}
                  {readLaterBookmarks[0].ogImage && (
                    <CardItem
                      translateZ={30}
                      className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden"
                    >
                      <img
                        src={readLaterBookmarks[0].ogImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </CardItem>
                  )}

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <CardItem translateZ={40}>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium mb-4">
                          <BookMarked className="w-3 h-3" />
                          稍后阅读
                        </span>
                      </CardItem>

                      <CardItem translateZ={50}>
                        <h2
                          className="text-2xl md:text-3xl font-serif font-medium mb-3 line-clamp-2"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {readLaterBookmarks[0].title}
                        </h2>
                      </CardItem>

                      {readLaterBookmarks[0].description && (
                        <CardItem translateZ={30}>
                          <p
                            className="line-clamp-2"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {readLaterBookmarks[0].description}
                          </p>
                        </CardItem>
                      )}
                    </div>

                    <CardItem translateZ={20} className="mt-6">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {new URL(readLaterBookmarks[0].url).hostname}
                        </span>
                        <span
                          className="flex items-center gap-2 text-sm"
                          style={{ color: "var(--color-primary)" }}
                        >
                          开始阅读 <ExternalLink className="w-4 h-4" />
                        </span>
                      </div>
                    </CardItem>
                  </div>
                </div>
              </Card3D>
            </motion.section>
          )}

          {/* Pinned Bookmarks - Bento Grid 非对称布局 */}
          {pinnedBookmarks.length > 0 && (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <Pin className="w-5 h-5 text-yellow-400" />
                  <BreathingDot
                    color="#eab308"
                    size="sm"
                    className="absolute -top-1 -right-1"
                  />
                </div>
                <h2
                  className="text-xl font-medium tracking-wide"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  常用
                </h2>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {pinnedBookmarks.length}
                </span>
              </div>

              <BentoGrid>
                {pinnedBookmarks.slice(0, 6).map((bookmark, index) => {
                  // 非对称布局：第一个占 2 列 2 行，其他 1 列
                  const colSpan = index === 0 ? 2 : 1;
                  const rowSpan = index === 0 ? 2 : 1;

                  return (
                    <BentoGridItem
                      key={bookmark.id}
                      colSpan={colSpan as 1 | 2}
                      rowSpan={rowSpan as 1 | 2}
                      spotlightColor="rgba(234, 179, 8, 0.15)"
                      onClick={() => window.open(bookmark.url, "_blank")}
                      onContextMenu={(e) => handleContextMenu(e, bookmark)}
                      delay={index * 0.05}
                    >
                      <BookmarkCardContent
                        bookmark={bookmark}
                        isLarge={index === 0}
                        isNew={bookmark.id === newlyAddedId}
                        isLoggedIn={isLoggedIn}
                        onTogglePin={() => togglePin(bookmark.id)}
                        onToggleReadLater={() => toggleReadLater(bookmark.id)}
                        onEdit={() => {
                          setEditingBookmark(bookmark);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={() => handleDelete(bookmark.id)}
                      />
                    </BentoGridItem>
                  );
                })}
              </BentoGrid>
            </motion.section>
          )}

          {/* Category Sections */}
          {categories.map((category, catIndex) => {
            const categoryBookmarks = bookmarksByCategory[category.id] || [];
            if (categoryBookmarks.length === 0) return null;

            return (
              <motion.section
                key={category.id}
                className="mb-12 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + catIndex * 0.1 }}
              >
                {/* 背景装饰文字 */}
                <div
                  className="absolute -top-8 left-0 text-[120px] font-bold pointer-events-none select-none leading-none"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    color: "var(--color-text-muted)",
                    opacity: 0.03,
                  }}
                >
                  {category.name}
                </div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                    }}
                  >
                    {categoryIcons[category.id] || (
                      <BookmarkIcon className="w-4 h-4" />
                    )}
                  </div>
                  <h2
                    className="text-xl font-medium tracking-wide"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {category.name}
                  </h2>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {categoryBookmarks.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
                  {categoryBookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SpotlightCard
                        className="h-full cursor-pointer"
                        spotlightColor={`${category.color}20`}
                        onClick={() => window.open(bookmark.url, "_blank")}
                        onContextMenu={(e) => handleContextMenu(e, bookmark)}
                      >
                        <div className="flex flex-col h-full">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: "var(--color-bg-tertiary)" }}
                          >
                            {bookmark.favicon ? (
                              <img
                                src={bookmark.favicon}
                                alt=""
                                className="w-5 h-5"
                              />
                            ) : (
                              <ExternalLink
                                className="w-5 h-5"
                                style={{ color: "var(--color-text-muted)" }}
                              />
                            )}
                          </div>

                          <h3
                            className="font-medium line-clamp-1 mb-1"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {bookmark.title}
                          </h3>
                          <p
                            className="text-sm line-clamp-2 flex-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {bookmark.description ||
                              new URL(bookmark.url).hostname}
                          </p>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            );
          })}

          {/* Empty State */}
          {bookmarks.length === 0 && !isLoading && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-nebula-purple/20 to-nebula-pink/20 flex items-center justify-center">
                <Sparkles>
                  <BookmarkIcon
                    className="w-10 h-10"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                </Sparkles>
              </div>
              <h3
                className="text-2xl font-serif mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                开启你的星云之旅
              </h3>
              <p
                className="mb-8 max-w-md mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                按{" "}
                <kbd
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: "var(--color-bg-tertiary)" }}
                >
                  ⌘K
                </kbd>{" "}
                打开命令面板， 粘贴链接即可添加第一个书签
              </p>
              <motion.button
                onClick={() => setIsAddModalOpen(true)}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nebula-purple to-nebula-pink text-white font-medium shadow-glow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                添加第一个书签
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Dock */}
      <FloatingDock
        items={dockItems.map((item) => ({
          ...item,
          onClick: item.href ? undefined : () => handleDockClick(item.id),
        }))}
      />

      {/* Spotlight Search */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        bookmarks={bookmarks}
        onAddBookmark={handleAddFromSpotlight}
      />

      {/* Add Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBookmark(null);
          setPendingUrl("");
        }}
        onAdd={handleSaveBookmark}
        categories={categories}
        initialUrl={pendingUrl}
        editBookmark={editingBookmark}
      />

      {/* Context Menu */}
      {contextMenu.bookmark && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={closeContextMenu}
          items={getMenuItems(contextMenu.bookmark, {
            onEdit: () => {
              setEditingBookmark(contextMenu.bookmark);
              setIsAddModalOpen(true);
            },
            onDelete: () => handleDelete(contextMenu.bookmark!.id),
            onTogglePin: () => togglePin(contextMenu.bookmark!.id),
            onToggleReadLater: () => toggleReadLater(contextMenu.bookmark!.id),
          })}
        />
      )}
    </AuroraBackground>
  );
}

// 书签卡片内容组件
function BookmarkCardContent({
  bookmark,
  isLarge,
  isNew,
  isLoggedIn,
  onTogglePin,
  onToggleReadLater,
  onEdit,
  onDelete,
}: {
  bookmark: Bookmark;
  isLarge?: boolean;
  isNew?: boolean;
  isLoggedIn?: boolean;
  onTogglePin: () => void;
  onToggleReadLater: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="h-full flex flex-col"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "rounded-xl flex items-center justify-center",
            isLarge ? "w-14 h-14" : "w-12 h-12"
          )}
          style={{ background: "var(--color-bg-tertiary)" }}
        >
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className={isLarge ? "w-7 h-7" : "w-6 h-6"}
            />
          ) : (
            <ExternalLink
              className={cn(isLarge ? "w-7 h-7" : "w-6 h-6")}
              style={{ color: "var(--color-text-muted)" }}
            />
          )}
        </div>

        {/* Actions - 只有登录后才显示 */}
        <AnimatePresence>
          {showActions && isLoggedIn && (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  bookmark.isPinned
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "hover:bg-[var(--color-glass-hover)]"
                )}
                style={{
                  color: bookmark.isPinned
                    ? undefined
                    : "var(--color-text-muted)",
                }}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReadLater();
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  bookmark.isReadLater
                    ? "bg-orange-500/20 text-orange-400"
                    : "hover:bg-[var(--color-glass-hover)]"
                )}
                style={{
                  color: bookmark.isReadLater
                    ? undefined
                    : "var(--color-text-muted)",
                }}
              >
                <BookMarked className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3
          className={cn(
            "font-medium mb-2",
            isLarge ? "text-xl line-clamp-2" : "text-lg line-clamp-1"
          )}
          style={{ color: "var(--color-text-primary)" }}
        >
          {bookmark.title}
        </h3>
        {bookmark.description && (
          <p
            className={cn(
              "mb-4",
              isLarge ? "text-base line-clamp-3" : "text-sm line-clamp-2"
            )}
            style={{ color: "var(--color-text-muted)" }}
          >
            {bookmark.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between text-xs pt-4"
        style={{
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border-light)",
        }}
      >
        <span>{new URL(bookmark.url).hostname}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </div>

      {/* New Badge */}
      {isNew && (
        <motion.div
          className="absolute top-3 right-3 px-2 py-1 rounded-full bg-nebula-cyan/20 text-nebula-cyan text-xs"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
        >
          NEW
        </motion.div>
      )}
    </div>
  );
}

export default App;
