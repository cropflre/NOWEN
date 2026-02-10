# NOWEN - Nebula Portal

> A minimalist personal navigation hub combining bookmark management and system monitoring, featuring deep space aesthetics and glassmorphism design, supporting day/night dual modes with complete real-time hardware monitoring capabilities

![Version](https://img.shields.io/badge/version-0.1.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Docker Hub](https://img.shields.io/badge/Docker%20Hub-cropflre%2Fnowen-blue)

## 🌐 Live Demo

**🔗 Access URL**:

## 📖 Documentation

| Language    | Document                                 |
| ----------- | ---------------------------------------- |
| 🇨🇳 简体中文 | [README.md](./README.md)                 |
| 🇬🇧 English  | [README_EN.md](./README_EN.md) (Current) |

---

## 📸 Screenshots

### ☀️ Light Mode

<table>
  <tr>
    <td align="center" colspan="2"><b>Desktop Homepage - System Monitor Dashboard</b></td>
  </tr>
  <tr>
    <td colspan="2"><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/light-desktop-monitor.png" alt="Light Mode - System Monitor" width="800"></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center"><b>Bookmark Categories & Sidebar</b></td>
    <td align="center"><b>Mobile Homepage</b></td>
  </tr>
  <tr>
    <td><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/light-desktop-bookmarks.png" alt="Light Mode - Bookmarks" width="500"></td>
    <td><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/light-mobile.png" alt="Light Mode - Mobile" width="250"></td>
  </tr>
</table>

### 🌙 Dark Mode

<table>
  <tr>
    <td align="center"><b>Desktop Homepage - Deep Space Aesthetics</b></td>
    <td align="center"><b>Mobile Homepage</b></td>
  </tr>
  <tr>
    <td><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/dark-desktop-monitor.png" alt="Dark Mode - Desktop" width="500"></td>
    <td><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/dark-mobile.png" alt="Dark Mode - Mobile" width="250"></td>
  </tr>
</table>

### 🎛️ Feature Highlights

| Feature                  | Description                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Weather & Lunar**      | Real-time weather 19°C · Cloudy · 75% humidity · 5.5m/s wind · Lunar date · Solar terms    |
| **Sidebar Navigation**   | Quick category navigation (Dev/Tools/Design/Reading/Media) · Smart highlighting            |
| **Category Editing**     | Hover to show edit button ✏️ · Edit directly without backend                               |
| **Quick Add Category**   | Create category while adding bookmark · 10 preset colors · Real-time refresh               |
| **System Monitoring**    | Engine Room (CPU 57%/RAM 89%/Disk) · Hardware ID · Vital Signs (28°C) · Network · Services |
| **Dock Status Bar**      | SYSTEM ONLINE · CPU/MEM/Temp/Network speed · Draggable                                     |
| **Mobile Floating Dock** | Expandable menu · Search/Add/Theme/Apps                                                    |
| **Read Later**           | Hero card display · 3D card effect · List view · Mark as read                              |
| **Data Management**      | Import/Export JSON · Factory reset · Auto redirect to home after import                    |

---

## 📋 Table of Contents

- [Screenshots](#-screenshots)
- [Features](#-features)
- [Theme System](#-theme-system)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
  - [Windows Local](#option-1-windows-local-installation)
  - [Docker](#option-2-docker-installation)
  - [Synology NAS](#option-3-synology-nas)
  - [UGREEN NAS](#option-4-ugreen-nas)
  - [fnOS](#option-5-fnos)
  - [QNAP NAS](#option-6-qnap-nas)
  - [Extreme Space NAS](#option-7-extreme-space-nas)
- [API Reference](#-api-reference)
- [Keyboard Shortcuts](#️-keyboard-shortcuts)
- [FAQ](#-faq)
- [Changelog](#-changelog)
- [License](#-license)

---

## ✨ Features

### 🏠 Homepage Display

- **Dynamic Clock**: Real-time display (accurate to seconds), smart greetings (Good morning/afternoon/evening)
- **Weather Display** (NEW): Real-time weather info, temperature, weather icons (via Open-Meteo API)
- **Lunar Calendar** (NEW): Lunar date, solar terms, traditional festivals
- **Quote Display**: Random quote rotation, supports system default and custom quotes
- **Aurora Background**: Immersive deep space visual effects
- **Meteor Effects**: Random meteor animations for sci-fi atmosphere
- **System Monitor Dashboard**: Real-time display of CPU, memory, disk, network, processes
- **Lite Mode**: Disable animations and effects, significantly reduce CPU/GPU usage

### 💻 System Monitoring (NEW)

- **Engine Room (System Monitor Card)**: CPU usage, memory, disk space, uptime
- **Hardware Identity Card**: CPU model, motherboard info, firmware version, RAM, storage, GPU, OS
- **Vital Signs Card**: CPU/Memory gauges, temperature monitoring, LIVE status
- **Network Telemetry Card**: Download/Upload speed, traffic charts, IP address, connection status
- **Service Hive (Process Matrix Card)**: Docker container status, runtime timer, service health
- **Dock Mini Monitor**: Desktop bottom SYSTEM ONLINE status bar with CPU/MEM/Temp/Speed
- **Ticker Status Bar**: Mobile bottom scrolling status bar
- **Widget Visibility Control**: Backend control for each monitor component
- **Menu Visibility Control** (NEW): Control language/theme toggle buttons visibility

### 🔍 Spotlight Search

- **Hotkey Activation**: `⌘/Ctrl + K` global trigger
- **Multi-Search Engines**: Google, Bing, Baidu, DuckDuckGo one-click switch
- **Bookmark Search**: Quick search saved bookmarks
- **Quick Add**: Add new bookmarks directly in search box

### 📚 Bookmark Management

- **Smart Metadata Fetching**: Auto-fetch title, description, favicon, OG image
- **Category Management**: Custom category names, icons, and colors
- **Frontend Category Editing** (NEW): Edit/create/delete categories directly on homepage
- **Quick Add Category** (NEW): Create new categories while adding bookmarks, inline form with 10 preset colors
- **Quick Navigation Sidebar** (NEW): Auto-display category nav, quick positioning, smart highlighting
- **Pin Feature**: Pin frequently used bookmarks (Bento Grid asymmetric layout)
- **Read Later**: Hero card display for pending reads, read mark support, 3D card effect
- **Drag & Drop Sorting**: Smooth drag experience with @dnd-kit
- **Context Menu**: Quick operations when logged in (edit/delete/pin)
- **Custom Icons**: Three icon modes (preset icons, custom upload, URL remote image)
- **Virtual Scroll**: Auto-enabled when 50+ bookmarks, optimized rendering performance

### ⚙️ Admin Panel

| Module              | Features                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| **Bookmarks**       | CRUD, batch operations, category filter, search, virtual scroll, quick category change            |
| **Categories**      | Custom names, icon picker, color picker, drag sorting                                             |
| **Icons**           | Upload custom icons, preview, delete management                                                   |
| **Quotes**          | Custom quotes, system default toggle                                                              |
| **Site Settings**   | Custom site name and icon, lite mode toggle, weather/lunar toggle, menu visibility                |
| **Theme Settings**  | 8 preset themes, light/dark mode, auto switch, day/night animation, circle expand animation       |
| **Widget Settings** | Control each monitor component visibility, Beam border toggle                                     |
| **Security**        | Password change with strength indicator, first login force change, login state verification       |
| **Data Management** | JSON import/export backup, factory reset, auto redirect to home after import, nested object support |

### 🎨 Visual Design

- **Glassmorphism**: `backdrop-blur` + transparent borders
- **Border Beam**: Animated light border effect (backend toggle)
- **3D Cards**: Mouse-tracking 3D perspective effect
- **Spotlight Effect**: Card hover light effect
- **Toast Notifications**: Physics bounce animation
- **Theme Transition**: Circle expand animation
- **Day/Night Mode**: Fully adapted dual theme system
- **Mobile Adaptation**: Responsive design, expandable floating dock, ticker scroll bar
- **Desktop Optimization**: Floating dock nav, mini monitor widget, draggable menu, sidebar
- **Lite Mode**: Disable all animations, significantly reduce resource usage

---

## 🎨 Theme System

Supports **8 carefully designed theme colors**, each with 20+ CSS variables:

### Dark Themes

| Theme         | Description                          |
| ------------- | ------------------------------------ |
| 🌌 **Nebula** | Default theme, purple-cyan gradient  |
| 🔮 **Aurora** | Aurora colors, mysterious and dreamy |
| 🌊 **Ocean**  | Deep blue tones, calm and profound   |
| 🌲 **Forest** | Dark green tones, natural and stable |

### Light Themes

| Theme           | Description                              |
| --------------- | ---------------------------------------- |
| ☀️ **Daylight** | Bright and fresh, professional and clean |
| 🌅 **Sunrise**  | Warm orange tones, warm and vibrant      |
| 🌸 **Sakura**   | Pink series, romantic and elegant        |
| 🍃 **Mint**     | Mint green, fresh and natural            |

### Smart Switching

- **Manual**: Backend settings page selection
- **Follow System**: Auto-adapt to system dark mode preference
- **Auto Mode**: Time-based switch (6:00-18:00 light, otherwise dark)
- **Visibility Control**: Backend control for theme toggle button visibility

---

## 🛠️ Tech Stack

### Frontend

| Tech                        | Version | Purpose                 |
| --------------------------- | ------- | ----------------------- |
| **React**                   | 18.3.1  | UI Framework            |
| **TypeScript**              | 5.6.2   | Type Safety             |
| **Vite**                    | 6.0.3   | Build Tool              |
| **Tailwind CSS**            | 3.4.16  | Atomic CSS              |
| **Framer Motion**           | 11.15   | Animations              |
| **@dnd-kit**                | 6.3     | Drag & Drop             |
| **@tanstack/react-virtual** | 3.13    | Virtual Scroll          |
| **Lucide Icons**            | 0.468   | Icon Library            |
| **Zod**                     | 4.3     | Data Validation         |
| **SWR**                     | 2.4     | Data Fetching & Caching |
| **lunar-javascript**        | 1.7     | Lunar Calculation       |

### Backend

| Tech                  | Version | Purpose                 |
| --------------------- | ------- | ----------------------- |
| **Express**           | 4.21.2  | Web Framework           |
| **sql.js**            | 1.11.0  | SQLite (WebAssembly)    |
| **systeminformation** | 5.23.5  | System Hardware Info    |
| **Cheerio**           | 1.0.0   | HTML Parsing (Metadata) |
| **bcryptjs**          | 3.0.3   | Password Encryption     |
| **tsx**               | 4.19.2  | TypeScript Runtime      |

### Deployment

| Tech               | Purpose          |
| ------------------ | ---------------- |
| **Docker**         | Containerization |
| **Docker Compose** | Orchestration    |
| **GitHub Actions** | CI/CD Auto Build |
| **Nginx**          | Reverse Proxy    |

---

## 📦 Project Structure

```
NOWEN/
├── src/                              # Frontend Source
│   ├── components/
│   │   ├── ui/                       # UI Components
│   │   ├── admin/                    # Admin Components
│   │   ├── monitor/                  # System Monitor Components
│   │   └── home/                     # Homepage Components
│   ├── hooks/                        # Custom Hooks
│   ├── contexts/                     # React Contexts
│   ├── lib/                          # Utility Library
│   ├── pages/                        # Pages
│   ├── types/                        # Type Definitions
│   ├── data/                         # Data Files
│   ├── config/                       # Configuration
│   ├── App.tsx                       # Main App
│   └── index.css                     # Global Styles
├── server/                           # Backend Source
│   ├── src/
│   │   ├── routes/                   # Route Modules
│   │   ├── services/                 # Services
│   │   ├── middleware/               # Middleware
│   │   └── utils/                    # Utilities
│   └── data/                         # Database
├── Dockerfile                        # Docker Config
├── docker-compose.yml                # Docker Compose
└── package.json                      # Dependencies
```

---

## 🚀 Installation

### Default Admin Credentials

| Username | Password |
| -------- | -------- |
| admin    | admin123 |

> ⚠️ **Security Note**: Please change the default password immediately after first login!

---

### Option 1: Windows Local Installation

#### Prerequisites

- **Node.js 20+**: [Download](https://nodejs.org/)
- **Git**: [Download](https://git-scm.com/)

#### Installation Steps

**Step 1: Install Node.js**

1. Visit https://nodejs.org/
2. Download **LTS version** (20.x or higher recommended)
3. Install and verify:
   ```bash
   node -v
   npm -v
   ```

**Step 2: Clone Project**

```bash
cd D:\Projects
git clone https://github.com/cropflre/NOWEN.git
cd NOWEN
```

**Step 3: Install Dependencies**

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

**Step 4: Start Services**

Open **two** terminal windows:

**Window 1 - Backend:**

```bash
cd D:\Projects\NOWEN\server
npm run dev
```

**Window 2 - Frontend:**

```bash
cd D:\Projects\NOWEN
npm run dev
```

**Step 5: Access Application**

Open browser: http://localhost:5173

---

### Option 2: Docker Installation

#### Using Docker Hub Image (Recommended)

```bash
# Pull image
docker pull cropflre/nowen:latest

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  nowen:
    image: cropflre/nowen:latest
    container_name: nowen
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - ./server/data:/app/server/data
      - /:/host:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=production
      - SI_FILESYSTEM_DISK_PREFIX=/host
      - PROC_PATH=/host/proc
      - SYS_PATH=/host/sys
      - FS_PATH=/host
    privileged: true
EOF

# Start service
docker-compose up -d
```

**Access:**

- Frontend: http://localhost:3000
- API: http://localhost:3001

---

### Option 3: Synology NAS

1. Install **Container Manager** from Package Center
2. Create `/docker/nebula-portal` directory
3. Clone or upload project files
4. In Container Manager: Projects → Add → Select `docker-compose.yml`
5. Access: `http://NAS_IP:3000`

---

### Option 4: UGREEN NAS

1. Enable Docker in App Center
2. Create `/docker/nebula-portal` directory
3. Upload project files via File Manager
4. In Docker app: Compose → Add → Select project path
5. Access: `http://NAS_IP:3000`

---

### Option 5: fnOS

```bash
ssh root@NAS_IP
cd /vol1/1000/docker
git clone https://github.com/cropflre/NOWEN.git nebula-portal
cd nebula-portal
docker-compose up -d --build
```

Access: `http://NAS_IP:3000`

---

### Option 6: QNAP NAS

1. Install **Container Station** from App Center
2. Create `/Container/nebula-portal` directory
3. Upload project files
4. In Container Station: Applications → Create → Docker Compose
5. Access: `http://NAS_IP:3000`

---

### Option 7: Extreme Space NAS

```bash
ssh root@NAS_IP
cd /Volume1/docker
git clone https://github.com/cropflre/NOWEN.git nebula-portal
cd nebula-portal
docker-compose up -d --build
```

Access: `http://NAS_IP:3000`

---

## 📡 API Reference

### Bookmarks API

| Method | Path                       | Auth | Description             |
| ------ | -------------------------- | ---- | ----------------------- |
| GET    | `/api/bookmarks`           | ❌   | Get all bookmarks       |
| GET    | `/api/bookmarks/paginated` | ❌   | Get paginated bookmarks |
| POST   | `/api/bookmarks`           | ❌   | Create bookmark         |
| PATCH  | `/api/bookmarks/:id`       | ❌   | Update bookmark         |
| DELETE | `/api/bookmarks/:id`       | ❌   | Delete bookmark         |
| PATCH  | `/api/bookmarks/reorder`   | ❌   | Reorder bookmarks       |

### Categories API

| Method | Path                  | Auth | Description        |
| ------ | --------------------- | ---- | ------------------ |
| GET    | `/api/categories`     | ❌   | Get all categories |
| POST   | `/api/categories`     | ❌   | Create category    |
| PATCH  | `/api/categories/:id` | ❌   | Update category    |
| DELETE | `/api/categories/:id` | ❌   | Delete category    |

### Admin API

| Method | Path                         | Auth | Description         |
| ------ | ---------------------------- | ---- | ------------------- |
| POST   | `/api/admin/login`           | ❌   | Login (returns JWT) |
| POST   | `/api/admin/logout`          | ✅   | Logout              |
| GET    | `/api/admin/verify`          | ✅   | Verify token        |
| POST   | `/api/admin/change-password` | ✅   | Change password     |

### Other APIs

| Method | Path                 | Auth | Description         |
| ------ | -------------------- | ---- | ------------------- |
| POST   | `/api/metadata`      | ❌   | Fetch URL metadata  |
| GET    | `/api/settings`      | ❌   | Get site settings   |
| PATCH  | `/api/settings`      | ✅   | Update settings     |
| GET    | `/api/system/info`   | ❌   | Get system info     |
| GET    | `/api/system/stats`  | ❌   | Get real-time stats |
| GET    | `/api/export`        | ✅   | Export data (JSON)  |
| POST   | `/api/import`        | ✅   | Import data (JSON)  |
| POST   | `/api/factory-reset` | ✅   | Factory reset       |

---

## ⌨️ Keyboard Shortcuts

| Shortcut     | Function                |
| ------------ | ----------------------- |
| `⌘/Ctrl + K` | Open Spotlight search   |
| `⌘/Ctrl + N` | Quick add bookmark      |
| `Esc`        | Close current modal     |
| `↑/↓`        | Navigate search results |
| `Enter`      | Confirm selection       |

---

## ❓ FAQ

### Installation Issues

**Q: Docker build fails?**

A: Use pre-built image from Docker Hub:

```bash
docker pull cropflre/nowen:latest
```

**Q: Cannot access after container starts?**

A: Check if ports are occupied:

```bash
lsof -i :3000
lsof -i :3001
```

**Q: Data lost?**

A: Ensure correct volume mapping. Database is in `/app/server/data`.

### System Monitoring Issues

**Q: No hardware monitoring data?**

A: Ensure correct mounts in docker-compose.yml:

```yaml
volumes:
  - /:/host:ro
  - /proc:/host/proc:ro
  - /sys:/host/sys:ro
  - /var/run/docker.sock:/var/run/docker.sock
privileged: true
```

**Q: Can Windows/macOS Docker see real hardware info?**

A: No. Docker Desktop runs in a VM and can only read VM info. Deploy on Linux host for best experience.

### Usage Issues

**Q: Forgot admin password?**

A: Use factory reset or delete database file to reinitialize.

**Q: Bookmark icons not showing?**

A: Some sites have hotlink protection. Upload custom icons instead.

**Q: How to backup data?**

A: Admin → System Settings → Data Management → Export Backup, or copy `server/data/zen-garden.db`

---

## 📝 Changelog

### v0.1.3 (2026-02-10)

#### ✨ New Features

- **Quick Add Category in Bookmark Modal**: Create new categories directly while adding/editing bookmarks
  - Inline category creation form, no navigation needed
  - 10 preset color picker
  - Auto-select newly created category
  - Real-time category list refresh

#### 🐛 Bug Fixes

- Fixed bookmark management page showing blank after successful backup import
- Auto redirect to homepage after successful import
- Fixed login state not cleared after factory reset
- Fixed database being reset after Docker update (using absolute path)
- Fixed light mode create category button style issue

---

### v0.1.2 (2026-02-05)

#### ✨ New Features

- **Menu Visibility Control**: Backend site settings now include menu show/hide toggles
  - Language toggle button visibility
  - Theme toggle button visibility
  - Supports both desktop Dock and mobile floating dock

---

### v0.1.1 (2026-02-04)

#### ✨ New Features

- **Frontend Category Editing**: Edit/create/delete categories directly on homepage
- **Quick Navigation Sidebar**: Auto-display category nav with smart highlighting
- **Weather Display**: Real-time weather via Open-Meteo API
- **Lunar Calendar**: Lunar date, solar terms, traditional festivals
- **Lite Mode**: Performance-first experience, disable all animations
- **Quick Theme Switch**: Day/Night mode toggle in Dock menu

#### 🔒 Security Enhancements

- Admin page secondary login verification
- Force password change page login state check

#### 🐛 Bug Fixes

- Fixed sidebar collapse button cutoff
- Fixed Zod v4 import bookmark schema compatibility
- Fixed nested object settings storage during import
- Fixed CPU/GPU overheating issues (Lite Mode)

---

### v0.1.0 (2026-02-03)

#### 🎉 Initial Release

**Core Features**

- ✨ Bookmark management (CRUD, drag sort, virtual scroll)
- ✨ Category management (custom names, icons, colors)
- ✨ Icon management (custom icon upload)
- ✨ Quote management (custom + system default toggle)
- ✨ Spotlight search (multi-engine, bookmark search)
- ✨ Read later (Hero card, read mark)
- ✨ Pin feature (Bento Grid layout)
- ✨ Context menu (quick operations)

**System Monitoring**

- ✨ Real-time hardware monitoring (CPU, RAM, Disk, Network, Processes)
- ✨ 5 monitor cards (System, Hardware ID, Vital Signs, Network, Process Matrix)
- ✨ Dock mini monitor (Desktop)
- ✨ Ticker scroll bar (Mobile)
- ✨ Widget visibility control

**Theme System**

- ✨ 8 preset themes (4 dark + 4 light)
- ✨ Circle expand transition animation
- ✨ Auto mode (follow system or time-based)
- ✨ 20+ CSS variables

**Admin Panel**

- ✨ Complete admin system
- ✨ Site settings (custom name and icon)
- ✨ Theme settings (8 themes)
- ✨ Widget settings (visibility, Beam toggle)
- ✨ Security (password change with strength indicator)
- ✨ Data management (import/export, factory reset)

**Visual Design**

- ✨ Day/Night dual mode
- ✨ Glassmorphism design
- ✨ Border Beam effect
- ✨ 3D card mouse tracking
- ✨ Spotlight effect
- ✨ Meteor and Aurora effects
- ✨ Physics bounce Toast

**Deployment**

- ✨ Docker containerization
- ✨ GitHub Actions CI/CD
- ✨ Docker Hub official image
- ✨ Multi-NAS platform support

---

## 🎯 Roadmap

- [ ] Multi-user support and permission management
- [ ] Bookmark tag system enhancement
- [ ] Bookmark sharing feature
- [ ] Browser extensions (Chrome/Firefox)
- [ ] PWA offline support
- [ ] More theme colors
- [ ] Access statistics
- [ ] WebDAV sync support
- [ ] System monitoring alerts
- [ ] Custom monitoring metrics
- [ ] Mobile App

---

## 🚀 Quick Start

```bash
# Using Docker Hub image (Recommended)
docker pull cropflre/nowen:latest
docker run -d -p 3000:3000 -p 3001:3001 -v ./data:/app/server/data --name nowen cropflre/nowen:latest

# Access
# http://localhost:3000

# Default admin credentials
# Username: admin
# Password: admin123
```

---

## 📄 License

MIT License

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit Issues and Pull Requests.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [sql.js](https://sql.js.org/)
- [systeminformation](https://github.com/sebhildebrandt/systeminformation)
- [dnd-kit](https://dndkit.com/)

---

## 🌟 Star History

If this project helps you, please give it a ⭐ Star!

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/cropflre">cropflre</a>
</p>
