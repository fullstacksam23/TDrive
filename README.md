# TDrive

> Unlock unlimited cloud storage using Telegram. Split files into chunks and store them securely with seamless file management across your messaging app and web interface.

![Status](https://img.shields.io/badge/status-active-success?style=flat-square)
![License](https://img.shields.io/badge/license-ISC-blue?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square)
![React](https://img.shields.io/badge/react-19-blue?style=flat-square)
![Express](https://img.shields.io/badge/express-5.2-lightgrey?style=flat-square)
![Telegram](https://img.shields.io/badge/telegram-bot_api-0088cc?style=flat-square)
![Supabase](https://img.shields.io/badge/supabase-postgresql-3ecf8e?style=flat-square)
![Vite](https://img.shields.io/badge/vite-7.2-646cff?style=flat-square)
![Tailwind](https://img.shields.io/badge/tailwind_css-4.1-38b2ac?style=flat-square)
![Docker](https://img.shields.io/badge/docker-ready-2496ed?style=flat-square)

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works-file-chunking)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

- **Unlimited File Storage** - Store unlimited files by automatically splitting them into chunks to bypass storage limitations and maximize your cloud capacity
- **Smart File Chunking** - Advanced splitting and reassembly mechanism for seamless handling of large files without storage constraints
- **Telegram Bot Integration** - Manage files directly through Telegram using the Grammy bot framework
- **Cloud Storage** - Secure file metadata storage with Supabase backend
- **Modern UI** - Beautiful, responsive web interface built with React and Tailwind CSS and shadcn components
- **Docker Ready** - Easy deployment with pre-configured Docker setup

## How It Works: File Chunking

Instead of storing entire files, TDrive automatically splits large files into smaller chunks before uploading them. This approach:

- **Bypasses file size limitations** - Store files of unlimited size
- **Maximizes storage efficiency** - Optimal chunk sizing for reliability and performance
- **Enables seamless reassembly** - Chunks are automatically reassembled when downloading
- **Provides reliability** - Individual chunk failures don't compromise the entire file
- **Supports any file type** - Works with documents, media, archives, and more

When you upload a file through TDrive, it intelligently chunks it, stores each chunk securely, and maintains a manifest for perfect reassembly. Downloading simply reverses the process - chunks are retrieved and recombined into your original file.

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (optional, for containerized deployment)
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Supabase Project (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/fullstacksam23/TDrive
   cd TDrive
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```
   
   Create a `.env` file in the backend directory:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   CHAT_ID=your_chat_id
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   PORT=3000(default)
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=your_backend_url
   VITE_SECRET_KEY=your_secret_key 
   ```

### Running Locally

**Backend:**
```bash
cd backend
node index.js
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Docker Deployment

```bash
cd backend
docker-compose up --build
```

This will start both the backend API and database services.

## Project Structure

```
TDrive/
├── backend/                    # Node.js Express API
│   ├── bot.js                 # Telegram bot logic
│   ├── index.js               # Express server setup
│   ├── database/              # Database utilities
│   │   ├── schema.sql         # Database schema
│   │   ├── migrate.js         # Migration scripts
│   │   └── supabase.js        # Supabase client
│   ├── data/                  # Data storage
│   ├── uploads/               # File uploads directory
│   ├── Dockerfile             # Docker configuration
│   ├── docker-compose.yml     # Docker Compose setup
│   └── package.json
│
├── frontend/                  # React + Vite Web App
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── File-grid.jsx  # File display grid
│   │   │   ├── Header.jsx     # App header
│   │   │   ├── Sidebar.jsx    # Navigation sidebar
│   │   │   ├── Upload.jsx     # File upload component
│   │   │   └── ui/            # Reusable UI components
│   │   ├── lib/               # Utility functions
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Entry point
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

### Backend (.env)
```env
PORT=3000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
CHAT_ID=your_chat_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_SECRET_KEY=your_secret_key
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For questions or issues, please open an issue on the GitHub repository.

---

<div align="center">

Made with care using React, Express, and Telegram

**[⬆ back to top](#tdrive)**

</div>
