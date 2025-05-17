# Cold Mailer

A platform designed to help job seekers generate personalized cold emails to potential employers based on their resume and skills.

## Features

- Resume parsing and analysis
- AI-powered company matching based on skills and experience
- Personalized cold email generation with company research
- Email sending and tracking
- Email history and metrics visualization
- Multiple domain support

## New Features

### Email History

Track and monitor all your sent emails with detailed metadata:
- View email status (sent, draft, failed)
- Filter emails by status
- View detailed email content and metadata
- See email statistics on your dashboard

### Multiple Frontend Support

Access the application from multiple domains with enhanced CORS configuration:
- Support for multiple frontend URLs
- Comma-separated list of allowed origins
- Backward compatibility with existing configuration

## Environment Variables

### Frontend

```
VITE_API_URL=http://localhost:5000/api
```

### Backend

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coldmailer
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_SECURE=false
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173,http://localhost:3000
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
3. Create a `.env` file in the root directory with the required environment variables
4. Start the development server:
   ```
   npm run dev
   ```

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run install-all` - Install all dependencies (frontend and backend)

## Project Structure

- `/server` - Backend Express.js server
- `/src` - Frontend React application
- `/docs` - Documentation files

## License

MIT
