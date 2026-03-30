export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (item: T, ...args: unknown[]) => void;

  constructor(createFn: () => T, resetFn: (item: T, ...args: unknown[]) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }

  get(...args: unknown[]): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.createFn();
    }
    this.resetFn(item, ...args);
    return item;
  }

  release(item: T) {
    this.pool.push(item);
  }

  clear() {
    this.pool = [];
  }
}
