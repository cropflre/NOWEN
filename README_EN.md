# NOWEN - Nebula Portal

> A minimalist personal navigation hub combining bookmark management and system monitoring, featuring deep space aesthetics and glassmorphism design, supporting day/night dual modes with complete real-time hardware monitoring capabilities

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Docker Hub](https://img.shields.io/badge/Docker%20Hub-cropflre%2Fnowen-blue)
![ARM64](https://img.shields.io/badge/ARM64-Supported-orange)

## 🌐 Live Demo

**🔗 Access URL**: [http://118.145.185.221/](http://118.145.185.221/)

> 🎯 **Demo Mode**: When accessed via the URL above, the login page auto-fills default credentials (admin / admin123). Just click login to explore the admin panel. Password change is disabled in demo mode.

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
| **Dock Status Bar**      | SYSTEM ONLINE · CPU/MEM/Temp/Network speed · Freely draggable · Position memory          |
| **Mobile Floating Dock** | Freely draggable energy orb · Petal-style expand menu · Bottom status bar · Haptic feedback · Position persistence |
| **Read Later**           | Hero card display · 3D card effect · List view · Mark as read                              |
| **Visit Analytics**      | Click tracking · Top ranking · Trend charts · Recent visits · Data clearing               |
| **Link Health Check**    | Batch check · Dead link detection · Timeout/redirect detection · Response time stats · Delete dead links |
| **Network Switching**    | Dual URLs per bookmark (Internal/External) · Auto network detection · Smart URL switching              |
| **Footer Filing Info**   | Configure footer text in settings · HTML rendering support · Homepage bottom display                   |
| **Wallpaper**            | Custom background wallpaper · Upload/Drag/URL/Picsum/Bing · Adjustable blur and overlay · Beam effects layered |
| **Data Management**      | Import/Export JSON · Factory reset · Auto redirect to home after import · SunPanel data import compatible · Auto-fetch icons after import (≤50 bookmarks) |
| **ARM64 Support**        | Multi-arch Docker images · RK3588/RK3576/RK3566 SBCs · Apple Silicon · One-click build script |

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
  - [ARM64 SBC](#option-8-arm64-sbc-rk3588rk3576rk3566)
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
- **Wallpaper Background** (NEW): Custom page background image, supports upload/drag/URL/Picsum/Bing, adjustable blur and overlay

### 💻 System Monitoring (NEW)

- **Engine Room (System Monitor Card)**: CPU usage, memory, disk space, uptime
- **Hardware Identity Card**: CPU model, motherboard info, firmware version, RAM, storage, GPU, OS
- **Vital Signs Card**: CPU/Memory gauges, temperature monitoring, LIVE status
- **Network Telemetry Card**: Download/Upload speed, traffic charts, IP address, connection status
- **Service Hive (Process Matrix Card)**: Docker container status, runtime timer, service health
- **Dock Mini Monitor**: Desktop bottom SYSTEM ONLINE status bar with CPU/MEM/Temp/Speed
- **Ticker Status Bar**: Mobile bottom scrolling status bar, integrated into draggable energy orb bottom bar
- **Monitor Tri-Mode**: Mini capsule / Ticker bar / Full dashboard seamless switching, view selection persisted
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
- **Virtual Scroll**: Auto-enabled on homepage when 50+ bookmarks, optimized rendering performance
- **Link Health Check** (NEW): Batch check all bookmark links accessibility, dead link detection and cleanup
- **Internal/External URL Switching** (NEW): Configure dual URLs per bookmark, auto-detect network environment for smart URL switching

### ⚙️ Admin Panel

| Module              | Features                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| **Bookmarks**       | CRUD, batch operations, category filter, search, numeric pagination, quick category change            |
| **Categories**      | Custom names, icon picker, color picker, drag sorting                                             |
| **Icons**           | Upload custom icons, preview, delete management                                                   |
| **Quotes**          | Custom quotes, system default toggle                                                              |
| **Site Settings**   | Custom site name and icon, lite mode toggle, weather/lunar toggle, menu visibility, footer filing info |
| **Theme Settings**  | 8 preset themes, light/dark mode, auto switch, day/night animation, circle expand animation       |
| **Widget Settings** | Control each monitor component visibility, Beam border toggle                                     |
| **Wallpaper Settings** | Custom background wallpaper, image source selection (Upload/URL/Picsum/Bing), blur and overlay control |
| **Security**        | Password change with strength indicator, first login force change, login state verification, admin username change |
| **Data Management** | JSON import/export backup, factory reset, auto redirect to home after import, nested object support, SunPanel data compatible import, auto-fetch bookmark icons after import (≤50) |
| **Analytics**       | Bookmark click tracking, top bookmarks ranking, visit trends, recent visits, data clearing          |
| **Health Check**    | Batch check bookmark link accessibility, 4 status types (OK/Error/Timeout/Redirect), delete dead links |

### 🎨 Visual Design

- **Glassmorphism**: `backdrop-blur` + transparent borders
- **Border Beam**: Animated light border effect (backend toggle)
- **3D Cards**: Mouse-tracking 3D perspective effect
- **Spotlight Effect**: Card hover light effect
- **Toast Notifications**: Physics bounce animation
- **Theme Transition**: Circle expand animation
- **Day/Night Mode**: Fully adapted dual theme system
- **Mobile Adaptation**: Responsive design, freely draggable energy orb dock, petal-style expand menu, bottom status bar, single-column Bento layout
- **Desktop Optimization**: Floating dock nav (freely draggable + position memory), mini monitor widget, magnetic magnification effect, sidebar
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

| Tech               | Purpose                         |
| ------------------ | ------------------------------- |
| **Docker**         | Containerization (amd64+arm64)  |
| **Docker Compose** | Orchestration                   |
| **GitHub Actions** | CI/CD Auto Build                |
| **Nginx**          | Reverse Proxy                   |

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
├── Dockerfile                        # Docker Config (Multi-arch)
├── docker-compose.yml                # Docker Compose
├── build-multiarch.sh                # Multi-arch build script (amd64+arm64)
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

### Option 8: ARM64 SBC (RK3588/RK3576/RK3566)

> For Rockchip RK3588, RK3576, RK3566 and other ARM64 single-board computers, as well as Apple Silicon (M1/M2/M3) devices

#### Prerequisites

- ARM64 architecture device (`aarch64`) running Linux (Ubuntu/Debian/Armbian, etc.)
- Docker and Docker Compose installed

```bash
# Verify architecture
uname -m
# Should output: aarch64

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

#### Installation Steps

**Method A: Using Docker Hub Image (Recommended)**

```bash
# Pull image (Docker will automatically pull the arm64 version)
docker pull cropflre/nowen:latest

# Create project directory
mkdir -p ~/nowen && cd ~/nowen

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
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
      # System monitoring mounts (optional, recommended for ARM device monitoring)
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

# Start
docker compose up -d

# View logs
docker compose logs -f
```

**Method B: Build Locally on ARM64 Device**

```bash
# Clone project
git clone https://github.com/cropflre/NOWEN.git
cd NOWEN

# Build and start (Docker will automatically build for current arm64 architecture)
docker compose up -d --build

# Verify architecture in logs
docker compose logs | grep "Architecture"
# Should output: Architecture: aarch64
```

**Method C: Cross-Platform Build (Build ARM64 Image on x86 PC)**

If you want to build ARM64 images on an x86 computer and transfer to ARM devices:

```bash
# Clone project
git clone https://github.com/cropflre/NOWEN.git
cd NOWEN

# Use multi-arch build script
chmod +x build-multiarch.sh

# Build and push to Docker Hub (requires docker login first)
./build-multiarch.sh --tag yourrepo/nowen

# Or build for current architecture only and load locally
./build-multiarch.sh --load
```

**Access:** `http://DEVICE_IP:3000`

#### ARM64 Performance Tips

| Device | Recommendation |
| --- | --- |
| **RK3588** (8-core/8GB+) | Full features, all monitoring components enabled |
| **RK3576** (8-core/4GB+) | Enable Lite Mode, disable meteor effects |
| **RK3566** (4-core/2GB+) | Enable Lite Mode, disable some monitoring cards |

> 💡 **Tip**: Enable "Lite Mode" in Admin → Site Settings to significantly reduce CPU/GPU usage, ideal for ARM devices.

#### ARM64 FAQ

**Q: `docker pull` shows `no matching manifest for linux/arm64`?**

A: The ARM64 image version may not be published yet. Use Method B to build locally on the device.

**Q: `npm install` is very slow during build?**

A: ARM64 native module compilation is slower than x86. RK3588 takes about 3-5 minutes, RK3566 about 8-15 minutes. Use a China npm mirror for acceleration:

```bash
# Add before npm install in Dockerfile
RUN npm config set registry https://registry.npmmirror.com
```

**Q: System monitoring can't read CPU temperature?**

A: Ensure `privileged: true` is set and `/sys` is mounted. Temperature node paths vary between SBCs, but `systeminformation` auto-adapts for most ARM SoCs.

---

## 📡 API Reference

### Bookmarks API

| Method | Path                       | Auth | Description             |
| ------ | -------------------------- | ---- | ----------------------- |
| GET    | `/api/bookmarks`           | ❌   | Get all bookmarks       |
| GET    | `/api/bookmarks/paginated` | ❌   | Get paginated bookmarks |
| POST   | `/api/bookmarks`           | ✅   | Create bookmark         |
| PATCH  | `/api/bookmarks/:id`       | ✅   | Update bookmark         |
| DELETE | `/api/bookmarks/:id`       | ✅   | Delete bookmark         |
| PATCH  | `/api/bookmarks/reorder`   | ✅   | Reorder bookmarks       |
| PATCH  | `/api/bookmarks/tags/rename` | ✅ | Rename tag              |
| DELETE | `/api/bookmarks/tags/:name`  | ✅ | Delete tag              |

### Categories API

| Method | Path                     | Auth | Description        |
| ------ | ------------------------ | ---- | ------------------ |
| GET    | `/api/categories`        | ❌   | Get all categories |
| POST   | `/api/categories`        | ✅   | Create category    |
| PATCH  | `/api/categories/:id`    | ✅   | Update category    |
| DELETE | `/api/categories/:id`    | ✅   | Delete category    |
| PATCH  | `/api/categories/reorder`| ✅   | Reorder categories |

### Admin API

| Method | Path                         | Auth | Description         |
| ------ | ---------------------------- | ---- | ------------------- |
| POST   | `/api/admin/login`           | ❌   | Login (returns JWT) |
| POST   | `/api/admin/logout`          | ✅   | Logout              |
| GET    | `/api/admin/verify`          | ✅   | Verify token        |
| POST   | `/api/admin/change-password` | ✅   | Change password     |

### Visit Analytics API

| Method | Path                 | Auth | Description              |
| ------ | -------------------- | ---- | ------------------------ |
| POST   | `/api/visits/track`  | ❌   | Track bookmark visit     |
| GET    | `/api/visits/stats`  | ✅   | Get visit stats overview |
| GET    | `/api/visits/top`    | ✅   | Get top bookmarks        |
| GET    | `/api/visits/trend`  | ✅   | Get visit trend by day   |
| GET    | `/api/visits/recent` | ✅   | Get recent visits        |
| DELETE | `/api/visits/clear`  | ✅   | Clear all visit data     |

### Health Check API

| Method | Path                 | Auth | Description                          |
| ------ | -------------------- | ---- | ------------------------------------ |
| POST   | `/api/health-check`  | ✅   | Batch check bookmark link health     |

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
| GET    | `/api/import/enrich-status` | ✅ | Query icon fetch progress after import |
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

### v0.2.0 (2026-02-26)

#### ✨ New Features

- **ARM64 Multi-Architecture Support**: Docker images now support both linux/amd64 and linux/arm64
  - Compatible with Rockchip RK3588, RK3576, RK3566 ARM64 SBCs
  - Supports Apple Silicon (M1/M2/M3) devices
  - Dockerfile auto-installs ARM64 native module build toolchain (python3/make/g++), auto-cleaned after build
  - New `build-multiarch.sh` multi-arch one-click build script
  - Prints CPU architecture on startup for environment verification
- **AI Smart Tags**: Automatically generate matching tags when adding bookmarks via AI
  - Auto-triggers AI magic after URL analysis completes (no manual click needed)
  - Auto-fills tags + category + optimized description
  - New AI settings panel and tag management panel
- **Bookmark Tag Display**: Colorful tag pills displayed on bookmark cards
  - 8 soft color variations based on tag name hash (blue/green/amber/red/violet/pink/cyan/lime)
  - Tags shown on both category and pinned bookmark cards
  - Shows up to 3 tags with +N overflow indicator

#### 🔒 Security Enhancements

- **Bookmark/Category API Authentication**: All write operations (POST/PATCH/DELETE) now require login
  - 10 backend routes protected with authMiddleware (6 bookmark + 4 category)
  - 10 frontend API functions added requireAuth, GET endpoints remain public
- **Frontend Permission Control**: Unauthenticated users can only browse, all write entry points hidden
  - Hide Dock "Add Bookmark" and "AI Assistant" buttons
  - Hide category title edit button (pencil icon)
  - Hide empty state "Add First Bookmark" button
  - Disable Ctrl+N (add bookmark) and Ctrl+J (AI assistant) shortcuts
  - Disable bookmark drag-and-drop sorting for unauthenticated users

#### 🐛 Bug Fixes

- Fixed AI smart tags storage format inconsistency causing display as `#["Google"]`
- Fixed import backup tags field type validation failure (compatible with both string and array formats)
- Fixed HTML export then import putting all bookmarks under site name category (skip PERSONAL_TOOLBAR_FOLDER level)
- Fixed page not refreshing after successfully adding a bookmark (auto-call refreshData after save)
- Fixed DndContext sensors array size change causing React warning

### v0.1.9 (2026-02-25)

#### ✨ New Features

- **Mobile Energy Orb Free Dragging**: Mobile floating navigation orb supports free dragging to any screen position
  - Native drag via Pointer Events with 6px threshold to distinguish drag from click
  - Position persisted via localStorage, auto-restored on next visit
  - Blue glow + micro-scale visual feedback during drag
  - Tap to expand petal-style menu with haptic vibration feedback (`navigator.vibrate`)
- **Mobile Bottom Status Bar**: New fixed bottom status bar with integrated system monitoring Ticker
  - Real-time system status (CPU/Memory/Network speed) via `leftSlot` slot
  - Glassmorphism blur background, iOS safe area support (`safe-area-inset-bottom`)
  - Energy orb and bottom bar are fully independent
- **Desktop Dock Free Dragging**: Desktop floating Dock supports dragging to any position
  - Position persisted via localStorage (key: `desktop-dock-pos`), defaults to bottom center
  - Glowing border feedback during drag, cursor changes to `grabbing`
  - macOS-style magnetic magnification effect (fisheye zoom)
- **Mobile Bento Single Column**: Mobile bookmark grid changed from two columns to single column for better readability
- **Monitor Tri-Mode Switching**: Mini capsule / Ticker bar / Full dashboard seamless switching
  - View mode persisted via localStorage
  - Smooth scale + fade + slide transition animations between modes
- **Dashboard Light Mode Transparency**: Monitor dashboard background fully transparent in light mode, blending with page
  - DataBlock sub-card backgrounds synchronized to transparent, border opacity reduced to 30%

#### 🐛 Bug Fixes

- Fixed mobile energy orb tap not expanding menu (removed `preventDefault` interference)
- Fixed mobile mini mode status bar not centered
- Optimized progress bar animation performance, switched from Framer Motion to native CSS Transition

---

### v0.1.8 (2026-02-24)

#### ✨ New Features

- **SunPanel Data Import Compatibility**: Support direct import of SunPanel exported JSON configuration files
  - Auto-detect SunPanel format (`appName: "Sun-Panel-Config"`)
  - SunPanel categories → NOWEN categories with auto-assigned colors
  - Bookmark field mapping: `title`/`url`/`lanUrl`(→`internalUrl`)/`description`/`icon.src`(→`iconUrl`)
  - SunPanel-specific confirmation dialog showing version and export time
  - Full i18n support (Chinese/English)
- **Auto-Fetch Bookmark Icons After Import**: Automatically detect bookmarks missing favicons during import
  - Async batch metadata fetching (favicon/ogImage) after import, non-blocking
  - Concurrency limited to 3 requests to avoid overloading target sites
  - Frontend polls fetch progress in real-time, auto-refreshes on completion
  - Toast notifications for fetch progress and results
  - Skips icon fetching when importing more than 50 bookmarks to avoid excessive requests
- **Admin Username Change**: Security settings now support changing admin account username
- **Category Collapse Threshold**: Categories with 100+ bookmarks show first 8 with "Show More" button
- **Admin Numeric Pagination**: Bookmark management page switched from scroll pagination to numeric pagination (20 per page)

#### 🐛 Bug Fixes

- Fixed `internalUrl` field not being written to database during import
- Fixed import schema incompatible with number type `createdAt`/`updatedAt`
- Fixed `validateBody` crash due to missing defensive check on `result.error.errors.map()`
- Fixed dark mode theme switch not syncing without page refresh (unified ThemeContext)
- Improved Engine Room / Vital Signs card text clarity and dark mode adaptation

---

### v0.1.7 (2026-02-11)

#### ✨ New Features

- **Wallpaper Background**: Custom page background image
  - 5 image sources: local upload/drag, URL, Picsum random, Lorem Picsum, Bing daily wallpaper
  - Blur slider (0-20px) via CSS `filter: blur()`
  - Overlay slider (0-100%) semi-transparent black layer
  - Live preview with blur + overlay effects
  - Wallpaper layer rendered independently, aurora/beam effects visible on top
  - New wallpaper settings tab in admin panel (violet gradient icon)
  - Disabled by default, no impact on existing deployments
  - Full i18n support (Chinese/English)

#### 🐛 Bug Fixes

- Fixed background beam effects disappearing when scrolling to page bottom (background layers switched to `fixed` positioning)
- Restored beam collision explosion particle effects (using `useAnimationFrame` for precise collision detection)
- Replaced discontinued `source.unsplash.com` with working Picsum/Bing image sources

---

### v0.1.6 (2026-02-11)

#### ✨ New Features

- **Footer Filing Information Display**: New footer text configuration in site settings
  - Text input in site settings for ICP filing info
  - HTML rendering support (e.g., ICP number with links)
  - Auto-display at homepage bottom, hidden when empty
  - Full i18n support (Chinese/English)
- **Internal/External URL Auto-Switching**: Dual URL support for bookmarks
  - New internal URL field for bookmarks with collapsible input
  - Auto-detect network environment (internal/external)
  - Hostname-based detection: private IP ranges (10.x / 172.16-31.x / 192.168.x) and internal domain suffixes (.local / .lan / .internal / .corp / .home)
  - All bookmark-opening entry points adapted for dual URL logic (15 components, 18+ window.open calls)
  - Auto-expand internal URL input when editing bookmarks with existing internal URLs
  - Full i18n support (Chinese/English)

---

### v0.1.5 (2026-02-11)

#### ✨ New Features

- **Link Health Check (Dead Link Detection)**: Complete bookmark link accessibility check
  - Batch check all bookmark links (concurrency 5, 10s timeout)
  - 4 status types: OK / Error / Timeout / Redirect
  - Smart request strategy: HEAD first, fallback to GET for 405/403
  - Summary card: total, counts per status, average response time
  - Filter by status type
  - Response time color indicators (green <1s / yellow <3s / red >3s)
  - HTTP status code color labels (2xx/3xx/4xx/5xx)
  - One-click delete dead links (error and timeout bookmarks, with confirmation)
  - Full i18n support (Chinese/English)

---

### v0.1.4 (2026-02-10)

#### ✨ New Features

- **Visit Analytics**: Complete bookmark visit data analysis
  - Automatic bookmark click tracking
  - Total visits, today's visits, active bookmarks statistics
  - Top bookmarks ranking (filter by day/week/month/all)
  - 7-day visit trend chart
  - Recent visits history
  - One-click clear all visit data

#### 🐛 Bug Fixes

- Fixed sql.js parameter binding issue, using queryAll/queryOne/run utility functions
- Optimized light mode styling for analytics card

---

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
- Bookmark/category write API endpoints require authentication
- Hide add bookmark, edit category, and AI assistant entry points when not logged in

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
- ✨ Dock mini monitor (Desktop, freely draggable + position memory)
- ✨ Ticker scroll bar (Mobile, integrated into energy orb bottom bar)
- ✨ Monitor tri-mode switching (mini capsule / ticker / full dashboard)
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

- ✨ Docker containerization (amd64 + arm64 multi-arch)
- ✨ GitHub Actions CI/CD
- ✨ Docker Hub official image
- ✨ Multi-NAS platform support
- ✨ ARM64 SBC support (RK3588/RK3576/RK3566)

---

## 🎯 Roadmap

- [ ] Multi-user support and permission management
- [ ] Bookmark tag system enhancement
- [ ] Bookmark sharing feature
- [ ] Browser extensions (Chrome/Firefox)
- [ ] PWA offline support
- [ ] More theme colors
- [x] ~~Access statistics~~ ✅ v0.1.4 Implemented
- [x] ~~Link health check~~ ✅ v0.1.5 Implemented
- [x] ~~Custom wallpaper background~~ ✅ v0.1.7 Implemented
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
