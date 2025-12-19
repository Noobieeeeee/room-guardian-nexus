# RoomGuardian Nexus

RoomGuardian Nexus is a modern web application for managing room bookings, schedules, and facility management. Built with React, TypeScript, and Supabase, it provides a sleek and intuitive interface for managing room reservations and monitoring facility usage.

## Features

- 📅 Interactive Calendar View
- 🏢 Room Management
- 👥 User Management
- 📊 Dashboard Analytics
- 📝 Booking Management
- 🔐 Role-based Access Control
- 📱 Responsive Design

## Tech Stack

- **Frontend Framework:** React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Query
- **Form Handling:** React Hook Form + Zod
- **Database:** Supabase
- **Routing:** React Router DOM
- **Date Handling:** date-fns
- **Charts:** Recharts
- **Build Tool:** Vite

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Noobieeeeee/room-guardian-nexus.git
   cd room-guardian-nexus
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Deployment

### Vercel Deployment

This project is configured for easy deployment to Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Set the following environment variables in your Vercel project settings:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_SOCKET_URL` - Your WebSocket server URL (if applicable)
4. Deploy!

The project includes a `vercel.json` configuration file for proper routing and security headers.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── lib/           # Utility functions and services
├── integrations/  # Third-party integrations
├── styles/        # Global styles
└── types/         # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Vite](https://vitejs.dev/) for the build tool
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
