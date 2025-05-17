# Installation Guide for New Features

Follow these steps to install and enable the new features:

1. **Install Dependencies**

   The email history and detail view features require the date-fns library for date formatting. Install it using npm:

   ```bash
   npm install date-fns
   ```

2. **Update Environment Variables**

   To enable multiple frontend URLs, update your environment variables:

   ```
   # Previous configuration
   FRONTEND_URL=http://localhost:5173

   # New configuration (comma-separated list)
   FRONTEND_URLS=http://localhost:5173,http://localhost:3000,https://coldmailer.com
   ```

   If both `FRONTEND_URLS` and `FRONTEND_URL` are provided, `FRONTEND_URLS` will take precedence.

3. **Run migrations (if needed)**

   No database migrations are required for these features, as the email model already contains all necessary fields.

4. **Restart your application**

   ```bash
   npm run dev
   ```

## Verification

To verify that the new features are working:

1. **Email History**

   - Navigate to the Emails page from your dashboard
   - You should see a list of all your emails with status, company, recipient, and other details
   - Click on any email to view its detailed information
   - On the dashboard, you should see email statistics in the Email Analytics section

2. **Multiple Frontend URLs**
   - Access your application from different allowed origins
   - The application should work properly from all configured domains

## Troubleshooting

If you encounter issues:

1. **Empty email list**: Make sure you have sent at least one email. If you need test data, use the Email Generator to create draft emails.

2. **CORS errors**: Verify that your environment variables are set correctly. The `FRONTEND_URLS` variable should be a comma-separated list with no spaces after the commas.

3. **Date formatting errors**: Ensure the date-fns package is installed correctly.

If you need further assistance, please refer to the detailed documentation in `/docs/new-features.md`.
