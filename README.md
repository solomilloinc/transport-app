# ZerosTour - Transport Management & Booking App

ZerosTour is a comprehensive web application for managing and booking transportation services. It features a powerful admin dashboard for managing routes, vehicles, drivers, and reservations, alongside a user-friendly interface for customers to search, book, and pay for their trips.

 <!-- Replace with a screenshot of your app's hero section -->

## ✨ Features

### 👤 Customer-Facing Portal

- **Intuitive Trip Search:** Easily search for trips by origin, destination, and date.
- **Interactive Results Page:** View available trips with details on timing, duration, and pricing.
- **Seamless Checkout:** A multi-step process to enter passenger and payment information.
- **Booking Confirmation:** A clear confirmation page after a successful booking.

### 🛠️ Admin Dashboard

- **Secure Login:** Role-based access for administrators.
- **Reservations Management:** A calendar-based view to manage all bookings.
- **CRUD Operations:** Full control over the core components of the business:
  - Services & Routes
  - Vehicles & Vehicle Types
  - Drivers
  - Cities & Directions
  - Passengers & Customers
  - Pricing
  - Holidays
- **Responsive Design:** Optimized for both desktop and mobile, with tables for large screens and cards for smaller devices.
- **Data Filtering & Pagination:** Easily find and navigate through large sets of data.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Date Handling:** [date-fns](https://date-fns.org/)
- **State Management:** React Hooks (`useState`, `useEffect`, custom hooks)

## 🏁 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18.x or later)
- npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/solomilloinc/transport-app.git
    cd transport-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up environment variables:**

    Create a file named `.env.local` in the root of the project and add the following variables. You will need to get the credentials for your backend and Google OAuth.

    ```env
    # Backend API URL
    BACKEND_URL=http://your-backend-api-url

    # NextAuth.js
    NEXTAUTH_URL=http://localhost:3000
    # Generate a secret with: `openssl rand -base64 32`
    NEXTAUTH_SECRET=

    # Google Provider for NextAuth.js
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

The project uses the Next.js App Router, which organizes the application by routes.

- `app/`: Contains all the routes and UI for the application.
  - `app/page.tsx`: The main landing page.
  - `app/results/`: Trip search results page.
  - `app/checkout/`: Checkout page.
  - `app/admin/`: The admin dashboard section. Each sub-folder represents a management page (e.g., `services`, `vehicles`).
  - `app/api/auth/[...nextauth]/`: NextAuth.js API route for authentication.
- `components/`: Contains reusable React components, including UI components from Shadcn.
- `hooks/`: Custom React hooks for form management, API calls, etc.
- `interfaces/`: TypeScript interfaces for data models (e.g., `Vehicle`, `Passenger`).
- `services/`: Functions for interacting with the backend API.
- `lib/`: Utility functions.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.