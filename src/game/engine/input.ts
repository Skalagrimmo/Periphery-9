/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Unified Input Manager for Desktop Keyboard & Mobile Touch / Virtual Controls

export class InputManager {
  private heldKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();

  // Virtual analog axis from touch joystick: [-1..1]
  public virtualAxisX = 0;
  public virtualAxisY = 0;

  // Virtual buttons (one-shot queue)
  private virtualActionPending: {
    attack: boolean;
    interact: boolean;
    inventory: boolean;
    menu: boolean;
  } = {
    attack: false,
    interact: false,
    inventory: false,
    menu: false,
  };

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      // Do not prevent F12 or default refresh shortcuts
      if (['Space', 'KeyE', 'KeyI', 'Escape', 'KeyP', 'F3', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      if (!this.heldKeys.has(code)) {
        this.justPressedKeys.add(code);
      }
      this.heldKeys.add(code);
    });

    window.addEventListener('keyup', (e) => {
      this.heldKeys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.heldKeys.clear();
      this.justPressedKeys.clear();
      this.virtualAxisX = 0;
      this.virtualAxisY = 0;
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.heldKeys.clear();
        this.justPressedKeys.clear();
        this.virtualAxisX = 0;
        this.virtualAxisY = 0;
      }
    });
  }

  // Called by Virtual Joystick UI
  public setVirtualJoystick(x: number, y: number) {
    this.virtualAxisX = x;
    this.virtualAxisY = y;
  }

  // Called by Virtual Action Buttons
  public triggerVirtualButton(action: 'attack' | 'interact' | 'inventory' | 'menu') {
    this.virtualActionPending[action] = true;
  }

  // Get movement direction normalized [-1..1]
  public getMovementVector(): { x: number; y: number } {
    let kx = 0;
    let ky = 0;

    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) kx -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) kx += 1;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) ky -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) ky += 1;

    // Combine with virtual touch joystick
    let finalX = kx !== 0 ? kx : this.virtualAxisX;
    let finalY = ky !== 0 ? ky : this.virtualAxisY;

    // Diagonal normalization
    const lenSq = finalX * finalX + finalY * finalY;
    if (lenSq > 1) {
      const len = Math.sqrt(lenSq);
      finalX /= len;
      finalY /= len;
    }

    return { x: finalX, y: finalY };
  }

  public isAttackPressed(): boolean {
    const pressed =
      this.justPressedKeys.has('Space') || this.virtualActionPending.attack;
    this.virtualActionPending.attack = false;
    return pressed;
  }

  public isInteractPressed(): boolean {
    const pressed =
      this.justPressedKeys.has('KeyE') ||
      this.justPressedKeys.has('Enter') ||
      this.virtualActionPending.interact;
    this.virtualActionPending.interact = false;
    return pressed;
  }

  public isInventoryPressed(): boolean {
    const pressed =
      this.justPressedKeys.has('KeyI') ||
      this.virtualActionPending.inventory;
    this.virtualActionPending.inventory = false;
    return pressed;
  }

  public isMenuPressed(): boolean {
    const pressed =
      this.justPressedKeys.has('Escape') ||
      this.justPressedKeys.has('KeyP') ||
      this.virtualActionPending.menu;
    this.virtualActionPending.menu = false;
    return pressed;
  }

  public isF3Pressed(): boolean {
    return this.justPressedKeys.has('F3');
  }

  // End of frame cleanup of one-shot keys
  public updateEndOfFrame() {
    this.justPressedKeys.clear();
  }
}

export const inputManager = new InputManager();
