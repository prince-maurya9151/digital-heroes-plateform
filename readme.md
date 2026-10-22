# Digital Heroes Platform

Digital Heroes is a web-based community platform where users participate in draw events, track scores, support charities, and win rewards. It includes a full subscriber portal as well as a feature-rich Admin Panel to manage platform analytics, users, draws, charities, and prize winners.

---

## Key Features

### Subscriber Features

- **User Dashboard:** Track active subscriptions, view upcoming draw renewals, and manage score histories.
- **Charity Allocation:** Choose a charity to support and adjust the contribution percentage (10% – 50%).
- **Score Management:** Submit and manage golfing/competition scores with automatic update logic.
- **Draws & Entries:** View upcoming draws and entry statuses.

### Admin Features

- **Reports & Analytics:** Track system metrics including total users, prize pools, and charity donations.
- **User Management:** View all registered users and manage user roles (`subscriber`, `admin`).
- **Charity Management:** Add, update, or remove supported charities.
- **Draw Management:** Create, manage, and schedule draw events.
- **Winner Verification:** Review winning score proofs submitted by users.

---

## Live Demo & Admin Access for Judges

- **Live URL:** [https://digital-heroes-plateform-j4ce.vercel.app](https://digital-heroes-plateform-j4ce.vercel.app)
- **Admin Panel URL:** [https://digital-heroes-plateform-j4ce.vercel.app/admin](https://digital-heroes-plateform-j4ce.vercel.app/admin)

### Demo Credentials for Testing

To test the **Admin Panel** and role-based access control, judges can use the following pre-configured admin account:

| Role           | Email               | Password | Access Rights                        |
| :------------- | :------------------ | :------- | :----------------------------------- |
| **Admin**      | `prince1@gmail.com` | `123456` | Full access to `/admin` dashboard    |
| **Subscriber** | `prince@gmail.com`  | `123456` | Normal user dashboard (`/dashboard`) |

> **Note for Judges:** Non-admin accounts attempting to access `/admin` will automatically be redirected to `/dashboard` due to route protection guards.

---

## Tech Stack

- **Frontend:** React, React Router, Tailwind CSS, Lucide Icons
- **Backend :** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth / JWT-based session management
- **Deployment:** Vercel

---

## Local Setup & Development

### Prerequisites

- Node.js (v18 or higher)
- npm
- Supabase account & project

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/prince-maurya9151/digital-heroes-platform.git
   cd digital-heroes-platform
   ```

2. **Install dependencies:**

   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies (if applicable)
   cd ../backend
   npm install
   ```

3. **Run the Application:**
   ```bash
   # Start local dev server
   npm run dev
   ```

---

## Database Schema & Tables

The Supabase database relies on the following core tables:

- `profiles` – User details and role mappings (`subscriber` vs `admin`)
- `charities` – List of supported charity causes
- `draws` – Information on scheduled draw events and prize pools
- `draw_entries` – User participation details per draw
- `scores` – Recorded user competition scores
- `subscriptions` – Active recurring plans
- `donations` – Tracked contribution history toward charities
- `winners` – Verified draw winners and rewards

---

## Admin Access Setup (Database)

If creating a new user through registration, the system assigns the `subscriber` role by default. To elevate a user to `admin` status manually:

1. Open **Supabase Dashboard** $\rightarrow$ **Table Editor** $\rightarrow$ `profiles`.
2. Locate the user's record and update the `role` field from `subscriber` to `admin`.
3. Re-login on the frontend to refresh the session token.
