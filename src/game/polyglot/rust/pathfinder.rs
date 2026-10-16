//! Periphery-9 Experimental Rust Pathfinding Subsystem
//! Implements A* grid pathfinding with Manhattan heuristic for 2D tile maps.
//! Target target: wasm32-unknown-unknown

#[repr(C)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

pub struct Node {
    pub x: i32,
    pub y: i32,
    pub g: i32,
    pub f: i32,
    pub parent_idx: i32,
}

/// Computes Manhattan distance between two points
#[inline]
pub fn manhattan(x1: i32, y1: i32, x2: i32, y2: i32) -> i32 {
    (x1 - x2).abs() + (y1 - y2).abs()
}

/// Performs A* path search on a flattened 2D grid
/// grid: 0 = walkable, 1 = obstacle
#[no_mangle]
pub extern "C" fn find_path_grid(
    grid_ptr: *const u8,
    width: i32,
    height: i32,
    start_x: i32,
    start_y: i32,
    goal_x: i32,
    goal_y: i32,
    out_path_ptr: *mut Point,
    max_path_len: i32,
) -> i32 {
    if grid_ptr.is_null() || out_path_ptr.is_null() {
        return 0;
    }
    if start_x == goal_x && start_y == goal_y {
        return 0;
    }
    if start_x < 0 || start_x >= width || start_y < 0 || start_y >= height {
        return 0;
    }
    if goal_x < 0 || goal_x >= width || goal_y < 0 || goal_y >= height {
        return 0;
    }

    // Fixed-size node pool for deterministic, no-alloc embedded execution
    const MAX_NODES: usize = 512;
    let mut open_set: [Node; MAX_NODES] = unsafe { std::mem::zeroed() };
    let mut open_count = 0;
    let mut closed: [bool; 2048] = [false; 2048]; // up to 64x32 grid

    let start_idx = (start_y * width + start_x) as usize;
    if start_idx < closed.len() {
        closed[start_idx] = true;
    }

    open_set[0] = Node {
        x: start_x,
        y: start_y,
        g: 0,
        f: manhattan(start_x, start_y, goal_x, goal_y),
        parent_idx: -1,
    };
    open_count = 1;

    let dirs = [(0, -1), (0, 1), (-1, 0), (1, 0)];

    while open_count > 0 {
        // Find node with lowest f score
        let mut best_idx = 0;
        let mut lowest_f = open_set[0].f;
        for i in 1..open_count {
            if open_set[i].f < lowest_f {
                lowest_f = open_set[i].f;
                best_idx = i;
            }
        }

        let current = open_set[best_idx];

        // Check if goal reached
        if current.x == goal_x && current.y == goal_y {
            // Reconstruct path backwards
            let mut curr_node = current;
            let mut path_len = 0;
            while path_len < max_path_len {
                unsafe {
                    *out_path_ptr.offset(path_len as isize) = Point {
                        x: curr_node.x,
                        y: curr_node.y,
                    };
                }
                path_len += 1;
                if curr_node.parent_idx < 0 {
                    break;
                }
                curr_node = open_set[curr_node.parent_idx as usize];
            }
            return path_len;
        }

        // Remove best from open_set (swap with last)
        open_count -= 1;
        open_set[best_idx] = open_set[open_count];

        // Explore 4 cardinal neighbors
        for (dx, dy) in dirs.iter() {
            let nx = current.x + dx;
            let ny = current.y + dy;

            if nx < 0 || nx >= width || ny < 0 || ny >= height {
                continue;
            }

            let tile_idx = (ny * width + nx) as usize;
            let tile_val = unsafe { *grid_ptr.add(tile_idx) };
            if tile_val != 0 {
                continue; // blocked
            }

            if tile_idx < closed.len() && closed[tile_idx] {
                continue;
            }

            if open_count < MAX_NODES {
                let g = current.g + 1;
                let f = g + manhattan(nx, ny, goal_x, goal_y);
                open_set[open_count] = Node {
                    x: nx,
                    y: ny,
                    g,
                    f,
                    parent_idx: best_idx as i32,
                };
                open_count += 1;
                if tile_idx < closed.len() {
                    closed[tile_idx] = true;
                }
            }
        }
    }

    0
}
