# Bill Management App

A React Native/Expo application for managing student bills and department enrollments.

## Features

- Department management with bill items
- Student enrollment system
- Bill tracking and management
- Department-wise student listing
- Bill item management
- Modern and responsive UI

## Tech Stack

- React Native
- Expo
- SQLite for local database
- TypeScript
- React Navigation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on your preferred platform:
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for web

## Project Structure

- `/app` - Main application code
  - `/(admin)` - Admin screens
  - `/(auth)` - Authentication screens
- `/components` - Reusable components
- `/lib` - Core functionality
  - `/db` - Database schema and operations
  - `/operations` - Business logic operations
- `/utils` - Utility functions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 