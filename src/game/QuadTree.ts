import { Vector2 } from './Vector';

export interface QuadTreeItem {
  id: string;
  position: Vector2;
  radius: number;
}

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export class QuadTree {
  boundary: Rect;
  capacity: number;
  points: QuadTreeItem[];
  divided: boolean;
  northeast: QuadTree | null = null;
  northwest: QuadTree | null = null;
  southeast: QuadTree | null = null;
  southwest: QuadTree | null = null;

  constructor(boundary: Rect, capacity: number) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  insert(point: QuadTreeItem): boolean {
    if (!this.contains(this.boundary, point.position)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    if (this.northeast!.insert(point)) return true;
    if (this.northwest!.insert(point)) return true;
    if (this.southeast!.insert(point)) return true;
    if (this.southwest!.insert(point)) return true;

    return false;
  }

  subdivide() {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w / 2;
    const h = this.boundary.h / 2;

    const ne = { x: x + w, y: y, w: w, h: h };
    this.northeast = new QuadTree(ne, this.capacity);

    const nw = { x: x, y: y, w: w, h: h };
    this.northwest = new QuadTree(nw, this.capacity);

    const se = { x: x + w, y: y + h, w: w, h: h };
    this.southeast = new QuadTree(se, this.capacity);

    const sw = { x: x, y: y + h, w: w, h: h };
    this.southwest = new QuadTree(sw, this.capacity);

    this.divided = true;
  }

  query(range: Rect, found: QuadTreeItem[] = []): QuadTreeItem[] {
    if (!this.intersects(this.boundary, range)) {
      return found;
    }

    for (const p of this.points) {
      if (this.contains(range, p.position)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }

  queryCircle(center: Vector2, radius: number, found: QuadTreeItem[] = []): QuadTreeItem[] {
      // Create a bounding box for the circle query to filter broadly first
      const range = {
          x: center.x - radius,
          y: center.y - radius,
          w: radius * 2,
          h: radius * 2
      };

      if (!this.intersects(this.boundary, range)) {
          return found;
      }

      for (const p of this.points) {
          if (p.position.distanceTo(center) <= radius + p.radius) { // Check actual distance + enemy radius
              found.push(p);
          }
      }

      if (this.divided) {
          this.northwest!.queryCircle(center, radius, found);
          this.northeast!.queryCircle(center, radius, found);
          this.southwest!.queryCircle(center, radius, found);
          this.southeast!.queryCircle(center, radius, found);
      }

      return found;
  }

  private contains(rect: Rect, point: Vector2): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.h
    );
  }

  private intersects(a: Rect, b: Rect): boolean {
    return !(
      b.x > a.x + a.w ||
      b.x + b.w < a.x ||
      b.y > a.y + a.h ||
      b.y + b.h < a.y
    );
  }
}
