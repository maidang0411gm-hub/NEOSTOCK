<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run the Neostock inventory app

This project is a Vite + React inventory application using Supabase authentication and database tables.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env`
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run the app:
   `npm run dev`

## Supabase requirements

- Enable Email auth and Google auth in Supabase Authentication.
- Add your local/dev and production callback URLs to the Google provider redirect allow list in Supabase.
- Create the `products` and `transactions` tables with the snake_case columns used in [src/App.tsx](/c:/Users/maida/OneDrive/Máy tính/Web App/Web App/neostock-inventory/src/App.tsx).
