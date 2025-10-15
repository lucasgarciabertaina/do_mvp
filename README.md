# Peña - Event Management App

A Next.js 14 application for managing social gatherings ("Peñas") with TypeScript, TailwindCSS, Prisma, and PostgreSQL.

## Features

- 🔐 **Authentication**: Simple username=password authentication with cookie sessions
- 📅 **Event Management**: View event details (owner, date, time, place, buyer)
- ✅ **RSVP System**: Track who's confirmed, declined, or pending
- 💰 **Expense Tracking**: Add and view expenses with automatic per-person calculations
- 💬 **Chat**: Simple real-time messaging for event coordination
- 🗄️ **Database**: Prisma + PostgreSQL schema (with mock data fallback)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL (optional - app works with mock data)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lucasgarciabertaina/do_mvp.git
cd do_mvp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. (Optional) Set up PostgreSQL database:
```bash
# Edit .env with your DATABASE_URL
# Then run migrations
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Demo Credentials

- Username: `admin` / Password: `admin`
- Username: `lucas` / Password: `lucas`
- Username: `maria` / Password: `maria`

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Prisma + PostgreSQL
- **Authentication**: JWT with HTTP-only cookies (using jose)

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── expenses/     # Expense management
│   │   └── messages/     # Chat messages
│   ├── components/       # React components
│   ├── login/            # Login page
│   └── page.tsx          # Home page
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── mockData.ts       # Mock data for development
│   └── prisma.ts         # Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
└── middleware.ts         # Route protection middleware
```

## Database Schema

The application uses the following models:
- **User**: User accounts
- **Member**: Group members
- **Occurrence**: Event instances
- **RSVP**: Event responses
- **Expense**: Event expenses
- **Message**: Chat messages

## License

MIT License - see [LICENSE](LICENSE) file for details
