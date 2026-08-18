INSERT INTO user_roles (user_id, role)
VALUES ('c45a8e46-9128-4d0c-b05c-c81ea2cdfade', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
