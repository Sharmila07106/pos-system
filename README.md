# NovaPOS - Point of Sale System

A premium, futuristic MERN stack point-of-sale system built for retail checkout.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Environment Variables**
   Create a `server/.env` file with the following variables:
   ```env
   PORT=5090
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5190
   ```

3. **Seed Database**
   ```bash
   npm run seed:products
   ```

4. **Run Application**
   ```bash
   npm run dev
   ```

*Note: The application uses specific ports to avoid collisions.*
- **Client**: `http://localhost:5190`
- **Server API**: `http://localhost:5090`
