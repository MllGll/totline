use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub content: String,
    pub cursor: i64,
    pub selection_start: i64,
    pub selection_end: i64,
    pub scroll_top: f64,
    pub scroll_left: f64,
    pub zoom: f64,
    pub theme: String,
    pub always_on_top: bool,
    pub last_window_visible: bool,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            content: String::new(),
            cursor: 0,
            selection_start: 0,
            selection_end: 0,
            scroll_top: 0.0,
            scroll_left: 0.0,
            zoom: 1.0,
            theme: "system".to_string(),
            always_on_top: true,
            last_window_visible: true,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct WindowState {
    pub x: i32,
    pub y: i32,
    pub width: f64,
    pub height: f64,
}

impl Default for WindowState {
    fn default() -> Self {
        Self {
            x: 100,
            y: 100,
            width: 480.0,
            height: 640.0,
        }
    }
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn open() -> rusqlite::Result<Self> {
        let path = database_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(path)?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.init()?;
        Ok(db)
    }

    #[cfg(test)]
    fn in_memory() -> rusqlite::Result<Self> {
        let db = Self {
            conn: Mutex::new(Connection::open_in_memory()?),
        };
        db.init()?;
        Ok(db)
    }

    fn init(&self) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS app_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                content TEXT NOT NULL DEFAULT '',
                cursor INTEGER NOT NULL DEFAULT 0,
                selection_start INTEGER NOT NULL DEFAULT 0,
                selection_end INTEGER NOT NULL DEFAULT 0,
                scroll_top REAL NOT NULL DEFAULT 0,
                scroll_left REAL NOT NULL DEFAULT 0,
                zoom REAL NOT NULL DEFAULT 1,
                theme TEXT NOT NULL DEFAULT 'system',
                always_on_top INTEGER NOT NULL DEFAULT 1,
                last_window_visible INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS window_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                x INTEGER NOT NULL DEFAULT 100,
                y INTEGER NOT NULL DEFAULT 100,
                width REAL NOT NULL DEFAULT 480,
                height REAL NOT NULL DEFAULT 640
            );

            INSERT OR IGNORE INTO app_state (id) VALUES (1);
            INSERT OR IGNORE INTO window_state (id) VALUES (1);
            ",
        )?;
        let _ = conn.execute(
            "ALTER TABLE app_state ADD COLUMN last_window_visible INTEGER NOT NULL DEFAULT 1",
            [],
        );
        Ok(())
    }

    pub fn load_app_state(&self) -> rusqlite::Result<AppState> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT content, cursor, selection_start, selection_end, scroll_top, scroll_left, zoom, theme, always_on_top, last_window_visible
             FROM app_state WHERE id = 1",
            [],
            |row| {
                Ok(AppState {
                    content: row.get(0)?,
                    cursor: row.get(1)?,
                    selection_start: row.get(2)?,
                    selection_end: row.get(3)?,
                    scroll_top: row.get(4)?,
                    scroll_left: row.get(5)?,
                    zoom: row.get(6)?,
                    theme: row.get(7)?,
                    always_on_top: row.get::<_, i64>(8)? == 1,
                    last_window_visible: row.get::<_, i64>(9)? == 1,
                })
            },
        )
    }

    pub fn save_app_state(&self, state: &AppState) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE app_state SET
                content = ?1,
                cursor = ?2,
                selection_start = ?3,
                selection_end = ?4,
                scroll_top = ?5,
                scroll_left = ?6,
                zoom = ?7,
                theme = ?8,
                always_on_top = ?9,
                last_window_visible = ?10
             WHERE id = 1",
            params![
                state.content,
                state.cursor,
                state.selection_start,
                state.selection_end,
                state.scroll_top,
                state.scroll_left,
                state.zoom,
                state.theme,
                if state.always_on_top { 1 } else { 0 },
                if state.last_window_visible { 1 } else { 0 },
            ],
        )?;
        Ok(())
    }

    pub fn load_window_state(&self) -> rusqlite::Result<WindowState> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT x, y, width, height FROM window_state WHERE id = 1",
            [],
            |row| {
                Ok(WindowState {
                    x: row.get(0)?,
                    y: row.get(1)?,
                    width: row.get(2)?,
                    height: row.get(3)?,
                })
            },
        )
    }

    pub fn save_window_state(&self, state: &WindowState) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE window_state SET x = ?1, y = ?2, width = ?3, height = ?4 WHERE id = 1",
            params![state.x, state.y, state.width, state.height],
        )?;
        Ok(())
    }
}

fn database_path() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("totline").join("totline.db")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initializes_default_app_state() {
        let db = Database::in_memory().expect("in-memory database");

        let state = db.load_app_state().expect("load app state");

        assert_eq!(state, AppState::default());
    }

    #[test]
    fn initializes_default_window_state() {
        let db = Database::in_memory().expect("in-memory database");

        let state = db.load_window_state().expect("load window state");

        assert_eq!(state, WindowState::default());
    }

    #[test]
    fn persists_complete_app_state() {
        let db = Database::in_memory().expect("in-memory database");
        let state = AppState {
            content: "[x] capture\n*important* note".to_string(),
            cursor: 12,
            selection_start: 3,
            selection_end: 12,
            scroll_top: 320.5,
            scroll_left: 8.25,
            zoom: 1.35,
            theme: "dark".to_string(),
            always_on_top: false,
            last_window_visible: false,
        };

        db.save_app_state(&state).expect("save app state");

        assert_eq!(db.load_app_state().expect("load app state"), state);
    }

    #[test]
    fn persists_window_state() {
        let db = Database::in_memory().expect("in-memory database");
        let state = WindowState {
            x: -1920,
            y: 72,
            width: 860.5,
            height: 700.25,
        };

        db.save_window_state(&state).expect("save window state");

        assert_eq!(db.load_window_state().expect("load window state"), state);
    }

    #[test]
    fn migrates_old_app_state_without_last_window_visible() {
        let conn = Connection::open_in_memory().expect("in-memory connection");
        conn.execute_batch(
            "
            CREATE TABLE app_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                content TEXT NOT NULL DEFAULT '',
                cursor INTEGER NOT NULL DEFAULT 0,
                selection_start INTEGER NOT NULL DEFAULT 0,
                selection_end INTEGER NOT NULL DEFAULT 0,
                scroll_top REAL NOT NULL DEFAULT 0,
                scroll_left REAL NOT NULL DEFAULT 0,
                zoom REAL NOT NULL DEFAULT 1,
                theme TEXT NOT NULL DEFAULT 'system',
                always_on_top INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE window_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                x INTEGER NOT NULL DEFAULT 100,
                y INTEGER NOT NULL DEFAULT 100,
                width REAL NOT NULL DEFAULT 480,
                height REAL NOT NULL DEFAULT 640
            );

            INSERT INTO app_state (
                id, content, cursor, selection_start, selection_end,
                scroll_top, scroll_left, zoom, theme, always_on_top
            ) VALUES (1, 'old note', 4, 1, 4, 12, 2, 1.2, 'system', 0);
            INSERT INTO window_state (id) VALUES (1);
            ",
        )
        .expect("legacy schema");
        let db = Database {
            conn: Mutex::new(conn),
        };

        db.init().expect("migrate schema");
        let state = db.load_app_state().expect("load migrated app state");

        assert_eq!(state.content, "old note");
        assert_eq!(state.cursor, 4);
        assert!(!state.always_on_top);
        assert!(state.last_window_visible);
    }
}
