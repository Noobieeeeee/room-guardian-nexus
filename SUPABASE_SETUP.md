# Room Guardian Nexus - Supabase Setup Guide

This guide explains how to connect the Room Guardian Nexus frontend to your Supabase backend.

## Current Configuration

The application is now configured to use your Supabase instance:
- **URL**: `https://ffncqaljdwbquprtjwxa.supabase.co`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbmNxYWxqZHdicXVwcnRqd3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDgzMzIsImV4cCI6MjA4MTY4NDMzMn0.nIfXxFcr9ErQzJa7XpwGXcR3_jYp3Wshag2H5xG8oe0`

## Prerequisites

1. Make sure you've run the database schema script (`supabase_schema.sql`) on your Supabase instance
2. Ensure all tables have been created successfully
3. Verify that sample data has been inserted

## Connection Verification

The application now includes automatic connection testing. When you start the application:

1. It will test connectivity to all database tables
2. It will verify authentication functionality
3. It will test basic CRUD operations

You can view the test results in the browser's developer console.

## Default Login Credentials

For testing purposes, the database includes these sample users:
- **Username**: `admin` | **Password**: `password` | **Role**: admin
- **Username**: `faculty` | **Password**: `password` | **Role**: faculty
- **Username**: `guest` | **Password**: `password` | **Role**: guest

## Troubleshooting

If you encounter connection issues:

1. **Check Environment Variables**: Verify that your `.env` file contains the correct Supabase credentials
2. **Verify Database Schema**: Ensure all tables were created successfully by running the test query
3. **Check Network Connectivity**: Make sure your Supabase instance is accessible from your network
4. **Review Console Logs**: Check the browser's developer console for detailed error messages

## Manual Connection Test

You can manually test the connection by running the included SQL test script (`test_database_connections.sql`) in your Supabase SQL editor.

## Security Note

For production use, you should:
1. Change all default passwords
2. Implement proper password hashing
3. Use Supabase Auth instead of the custom authentication
4. Set up proper Row Level Security (RLS) policies