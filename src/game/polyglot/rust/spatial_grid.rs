//! Periphery-9 Experimental Rust Spatial Partitioning Subsystem
//! Fixed-size spatial grid hash cell partition for entity fast-broadphase.

pub const CELL_SIZE: i32 = 48;
pub const GRID_COLS: usize = 16;
pub const GRID_ROWS: usize = 16;
pub const MAX_PER_CELL: usize = 8;

pub struct SpatialGrid {
    pub counts: [[u8; GRID_COLS]; GRID_ROWS],
    pub entity_ids: [[[i32; MAX_PER_CELL]; GRID_COLS]; GRID_ROWS],
}

impl SpatialGrid {
    pub fn new() -> Self {
        Self {
            counts: [[0; GRID_COLS]; GRID_ROWS],
            entity_ids: [[[0; MAX_PER_CELL]; GRID_COLS]; GRID_ROWS],
        }
    }

    pub fn clear(&mut self) {
        for r in 0..GRID_ROWS {
            for c in 0..GRID_COLS {
                self.counts[r][c] = 0;
            }
        }
    }

    pub fn insert(&mut self, entity_id: i32, x: i32, y: i32) {
        let col = (x / CELL_SIZE).clamp(0, (GRID_COLS - 1) as i32) as usize;
        let row = (y / CELL_SIZE).clamp(0, (GRID_ROWS - 1) as i32) as usize;
        let cnt = self.counts[row][col] as usize;
        if cnt < MAX_PER_CELL {
            self.entity_ids[row][col][cnt] = entity_id;
            self.counts[row][col] += 1;
        }
    }
}
