-- Team login addresses from the local project_manager.users table.
-- users.role is already ENUM('admin','manager','employee'), so no schema change.
-- Re-running sets the same email and role.

UPDATE users SET email = 'meital@T-more.co.il', role = 'manager' WHERE id_user = 1;
UPDATE users SET email = 'neta@T-more.co.il', role = 'employee' WHERE id_user = 2;
UPDATE users SET email = 'noa@T-more.co.il', role = 'employee' WHERE id_user = 3;
UPDATE users SET email = 'may@T-more.co.il', role = 'employee' WHERE id_user = 4;
UPDATE users SET email = 'mor@T-more.co.il', role = 'employee' WHERE id_user = 5;
UPDATE users SET email = 'noga@T-more.co.il', role = 'employee' WHERE id_user = 6;
UPDATE users SET email = 'dor@T-more.co.il', role = 'employee' WHERE id_user = 7;
UPDATE users SET email = 'keren@T-more.co.il', role = 'manager' WHERE id_user = 8;
UPDATE users SET email = 'yuval@T-more.co.il', role = 'employee' WHERE id_user = 9;
UPDATE users SET email = 'hodaya@T-more.co.il', role = 'employee' WHERE id_user = 10;
UPDATE users SET email = 'amit@T-more.co.il', role = 'employee' WHERE id_user = 11;
UPDATE users SET email = 'rivka@T-more.co.il', role = 'employee' WHERE id_user = 12;
UPDATE users SET email = 'your_email@gmail.com', role = 'admin' WHERE id_user = 13;
UPDATE users SET email = 'ronenc7@gmail.com', role = 'admin' WHERE id_user = 14;
