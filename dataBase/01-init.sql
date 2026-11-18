-- Project Manager - MySQL Initialization Script
-- Users (roles) + clients + projects + members + stages + updates + tasks
-- + work plan + important info + hiring + settings.
-- Intended for a fresh Docker MySQL volume.

CREATE DATABASE IF NOT EXISTS project_manager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE project_manager;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS project_updates;
DROP TABLE IF EXISTS project_stages;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS work_plan;
DROP TABLE IF EXISTS info_items;
DROP TABLE IF EXISTS hiring;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id_user INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(200) NOT NULL UNIQUE,
    role ENUM('admin', 'manager', 'employee') NOT NULL DEFAULT 'employee',
    job_percent TINYINT UNSIGNED NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- CLIENTS
-- =========================================================

CREATE TABLE clients (
    id_client INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(200) NOT NULL UNIQUE,
    contact_name VARCHAR(200) NULL,
    contact_email VARCHAR(200) NULL,
    contact_phone VARCHAR(30) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- PROJECTS + LEADS
-- =========================================================

CREATE TABLE projects (
    id_project INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kind ENUM('project', 'lead') NOT NULL DEFAULT 'project',
    id_client INT UNSIGNED NULL,
    project_name VARCHAR(200) NULL,

    status ENUM(
        'not_started', 'in_progress', 'fixes', 'waiting_client', 'frozen', 'delivered', 'completed',
        'new', 'scoping', 'quote_sent', 'waiting_decision', 'dropped'
    ) NOT NULL DEFAULT 'not_started',
    phase ENUM('development', 'production', 'fixes', 'delivered') NULL,
    urgency ENUM('normal', 'low', 'high', 'urgent', 'frozen') NOT NULL DEFAULT 'normal',

    deadline VARCHAR(100) NULL,
    end_date DATE NULL,

    hours_billable DECIMAL(7,1) NULL,
    hours_allocated DECIMAL(7,1) NULL,
    hours_done DECIMAL(7,1) NULL,

    contact_name VARCHAR(200) NULL,
    quote VARCHAR(255) NULL,

    invoice_status ENUM('none', 'ready', 'sent', 'paid', 'not_billable') NOT NULL DEFAULT 'none',
    invoice_what VARCHAR(255) NULL,
    billing_notes TEXT NULL,
    invoice_sent_date DATE NULL,
    paid_date DATE NULL,

    notes TEXT NULL,

    id_created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_client FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE SET NULL,
    CONSTRAINT fk_projects_creator FOREIGN KEY (id_created_by) REFERENCES users(id_user) ON DELETE SET NULL
);

CREATE INDEX idx_projects_kind_status ON projects(kind, status);

-- Who works on a project. An employee sees ONLY projects he is a member of.
CREATE TABLE project_members (
    id_project INT UNSIGNED NOT NULL,
    id_user INT UNSIGNED NOT NULL,
    member_role ENUM('manager', 'executor', 'team') NOT NULL DEFAULT 'team',
    load_level ENUM('none', 'low', 'medium', 'high') NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_project, id_user),
    CONSTRAINT fk_members_project FOREIGN KEY (id_project) REFERENCES projects(id_project) ON DELETE CASCADE,
    CONSTRAINT fk_members_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

CREATE INDEX idx_members_user ON project_members(id_user);

-- Work stages inside a project (sub tasks)
CREATE TABLE project_stages (
    id_stage INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_project INT UNSIGNED NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    stage_group VARCHAR(100) NULL,
    stage_name VARCHAR(200) NOT NULL,
    id_owner INT UNSIGNED NULL,
    status ENUM('todo', 'doing', 'review', 'done') NOT NULL DEFAULT 'todo',
    hours DECIMAL(7,1) NULL,
    due_date DATE NULL,

    CONSTRAINT fk_stages_project FOREIGN KEY (id_project) REFERENCES projects(id_project) ON DELETE CASCADE,
    CONSTRAINT fk_stages_owner FOREIGN KEY (id_owner) REFERENCES users(id_user) ON DELETE SET NULL
);

CREATE INDEX idx_stages_project ON project_stages(id_project, sort_order);

-- Meetings / updates log
CREATE TABLE project_updates (
    id_update INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_project INT UNSIGNED NOT NULL,
    update_date DATE NOT NULL,
    update_type ENUM(
        'client_meeting', 'internal_meeting', 'phone_call', 'email', 'status_update', 'task_completed', 'invoice'
    ) NOT NULL DEFAULT 'client_meeting',
    participants VARCHAR(500) NULL,
    summary TEXT NULL,
    tasks_text TEXT NULL,
    status_after ENUM(
        'not_started', 'in_progress', 'fixes', 'waiting_client', 'frozen', 'delivered', 'completed',
        'new', 'scoping', 'quote_sent', 'waiting_decision', 'dropped'
    ) NULL,
    id_author INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP NULL,

    CONSTRAINT fk_updates_project FOREIGN KEY (id_project) REFERENCES projects(id_project) ON DELETE CASCADE,
    CONSTRAINT fk_updates_author FOREIGN KEY (id_author) REFERENCES users(id_user) ON DELETE SET NULL
);

CREATE INDEX idx_updates_project ON project_updates(id_project, update_date);

-- Tasks: "next step" of a meeting, or a task added by hand (with or without project)
CREATE TABLE tasks (
    id_task INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_project INT UNSIGNED NULL,
    id_update INT UNSIGNED NULL,
    task_text VARCHAR(500) NOT NULL,
    id_owner INT UNSIGNED NULL,
    id_with_user INT UNSIGNED NULL,
    with_client BOOLEAN NOT NULL DEFAULT FALSE,
    priority ENUM('urgent', 'high', 'normal', 'low') NOT NULL DEFAULT 'normal',
    due_date DATE NULL,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    done_at TIMESTAMP NULL,
    id_done_by INT UNSIGNED NULL,
    id_created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tasks_project FOREIGN KEY (id_project) REFERENCES projects(id_project) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_update FOREIGN KEY (id_update) REFERENCES project_updates(id_update) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_owner FOREIGN KEY (id_owner) REFERENCES users(id_user) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_with FOREIGN KEY (id_with_user) REFERENCES users(id_user) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_done_by FOREIGN KEY (id_done_by) REFERENCES users(id_user) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_creator FOREIGN KEY (id_created_by) REFERENCES users(id_user) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_open ON tasks(is_done, id_project);

-- =========================================================
-- DEPARTMENT
-- =========================================================

CREATE TABLE work_plan (
    id_plan INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    area VARCHAR(150) NULL,
    quarter VARCHAR(10) NULL,
    id_owner INT UNSIGNED NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'postponed') NOT NULL DEFAULT 'not_started',
    due_date DATE NULL,
    kpi VARCHAR(500) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_plan_owner FOREIGN KEY (id_owner) REFERENCES users(id_user) ON DELETE SET NULL
);

CREATE TABLE info_items (
    id_info INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    category ENUM('pricing', 'procedures', 'contacts', 'templates', 'suppliers', 'general') NOT NULL DEFAULT 'general',
    body TEXT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    id_author INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_info_author FOREIGN KEY (id_author) REFERENCES users(id_user) ON DELETE SET NULL
);

CREATE TABLE hiring (
    id_hiring INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_title VARCHAR(200) NOT NULL,
    status ENUM('not_started', 'searching', 'interviewing', 'offer_sent', 'hired', 'closed') NOT NULL DEFAULT 'not_started',
    candidate_name VARCHAR(200) NULL,
    scope_percent TINYINT UNSIGNED NULL,
    start_date DATE NULL,
    source VARCHAR(200) NULL,
    notes TEXT NULL,
    id_author INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_hiring_author FOREIGN KEY (id_author) REFERENCES users(id_user) ON DELETE SET NULL
);

CREATE TABLE settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value JSON NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Load map: hours per full-time week + % of a job for each load level (projects without hours)
INSERT INTO settings (setting_key, setting_value)
VALUES ('heat', JSON_OBJECT('weekHours', 42, 'levels', JSON_OBJECT('low', 10, 'medium', 25, 'high', 40)));

-- The first admin is created by the backend on start from ADMIN_EMAIL (.env)
