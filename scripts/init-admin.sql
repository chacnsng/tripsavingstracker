-- Initialize first admin user
-- Run this after setting up your database schema
-- You can modify the values below

INSERT INTO users (name, email, role, avatar_color)
VALUES ('Admin User', 'admin@example.com', 'admin', '#0ea5e9')
ON CONFLICT (email) DO NOTHING;

-- Verify the admin was created
SELECT * FROM users WHERE role = 'admin';

