# Laundry App

## Development Setup

### Prerequisites

#### Windows
- **Bun**: Run the following in PowerShell:
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **PostgreSQL**: 
  - Download the [installer](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads). (this problably not going to work)
  - Or use winget: `winget install -e --id PostgreSQL.PostgreSQL.17`

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd laundry-app
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Start PostgreSQL Service:**
    Ensure the PostgreSQL service is running in the background.

    **Windows:**
    The installer usually sets the service to start automatically. You can verify it's running in the "Services" app or run in an Admin PowerShell:
    ```powershell
    net start postgresql-x64-17
    # Note: Adjust the version number (17) if you installed a different version.
    ```
    
4.  **Configure PostgreSQL:**
    Open SQL Shell (psql) or a terminal with `psql -U postgres` and run:
    ```sql
    -- Create a user with a password
    CREATE USER myuser WITH PASSWORD 'mypassword';

    -- Create the database
    CREATE DATABASE laundry_app;

    -- Grant database access
    GRANT ALL PRIVILEGES ON DATABASE laundry_app TO myuser;

    -- Connect to the new database
    \c laundry_app

    -- Grant schema access (required for creating tables)
    GRANT ALL ON SCHEMA public TO myuser;
    ```

5.  **Environment Configuration:**
    Copy `.env.example` to `.env` and update the values.
    
    **Mac/Linux:**
    ```bash
    cp .env.example .env
    ```
    
    **Windows (PowerShell):**
    ```powershell
    cp .env.example .env
    ```
    
    **Windows (Command Prompt):**
    ```cmd
    copy .env.example .env
    ```
    
    Update `DATABASE_URL` in `.env` to match your local PostgreSQL setup.
    
    Based on the configuration in step 4, the URL should look like this:
    ```
    postgres://myuser:mypassword@localhost:5432/laundry_app
    ```

6.  **Database Setup:**
    Initialize the database schema and seed it with sample data.
    ```bash
    # Reset database (drops all tables) and seed data
    bun run db:reset --seed
    ```
    
    Alternatively, you can run these steps separately:
    ```bash
    # Push schema changes to the database
    bun run db:push
    
    # Seed the database with sample data
    bun run db:seed
    ```

7.  **Start the Development Server:**
    ```bash
    bun run dev
    ```
    The app will be available at `http://localhost:3000`.

8.  **Start Tailwind CSS:**
    In a separate terminal, run the Tailwind CLI to watch for changes:
    ```bash
    bunx @tailwindcss/cli -i input.css -o output.css --watch
    ```

### Scripts

- `bun run dev`: Start the development server.
- `bun run db:studio`: Open Drizzle Studio to view/edit database data.
- `bun run db:reset`: Reset the database (clears all tables).
- `bun run db:seed`: Seed the database with sample data.
- `bun run test`: Run tests.

### Test Accounts

The seed script creates the following accounts:

- **Student**: `user@mymona.uwi.edu` / `user123`
- **Staff**: `staff@mymona.uwi.edu` / `staff123`
- **Admin**: `admin@mymona.uwi.edu` / `staff123`
