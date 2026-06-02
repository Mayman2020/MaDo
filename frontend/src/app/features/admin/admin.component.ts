import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

interface AdminStats {
  totalUsers: number;
  liveStreams: number;
  revenueCents: number;
}

interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBanned: boolean;
  banReason?: string | null;
  createdAt?: string;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  thumbnailUrl?: string | null;
}

@Component({
  selector: 'mado-admin',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Admin</h1>
      <p class="lead">Platform overview and moderation</p>

      <nav class="tabs">
        <button type="button" [class.on]="tab === 'stats'" (click)="tab = 'stats'">Stats</button>
        <button type="button" [class.on]="tab === 'users'" (click)="tab = 'users'; loadUsers()">Users</button>
        <button type="button" [class.on]="tab === 'cats'" (click)="tab = 'cats'; loadCategories()">Categories</button>
      </nav>

      @if (tab === 'stats') {
        @if (stats) {
          <div class="stat-grid">
            <div class="mado-card stat">
              <span class="lbl">Total users</span>
              <span class="val">{{ stats.totalUsers | number }}</span>
            </div>
            <div class="mado-card stat">
              <span class="lbl">Live streams</span>
              <span class="val">{{ stats.liveStreams | number }}</span>
            </div>
            <div class="mado-card stat">
              <span class="lbl">Wallet revenue (cents)</span>
              <span class="val">{{ stats.revenueCents | number }}</span>
            </div>
          </div>
        } @else {
          <p class="muted">Loading…</p>
        }
      }

      @if (tab === 'users') {
        <div class="toolbar mado-card">
          <input [(ngModel)]="userQuery" placeholder="Search username or email" (keydown.enter)="loadUsers(0)" />
          <button type="button" class="btn" (click)="loadUsers(0)">Search</button>
        </div>
        <div class="table-wrap mado-card">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (u of users; track u.id) {
                <tr>
                  <td>{{ u.username }}</td>
                  <td class="mono">{{ u.email }}</td>
                  <td>{{ u.role }}</td>
                  <td>
                    @if (u.isBanned) {
                      <span class="pill bad">Banned</span>
                    }
                    @if (u.isVerified) {
                      <span class="pill ok">Verified</span>
                    }
                  </td>
                  <td class="actions">
                    @if (!u.isBanned) {
                      <button type="button" class="link danger" (click)="ban(u)">Ban</button>
                    } @else {
                      <button type="button" class="link" (click)="unban(u)">Unban</button>
                    }
                    @if (!u.isVerified) {
                      <button type="button" class="link" (click)="verify(u)">Verify</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="muted">No users</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (tab === 'cats') {
        <div class="split">
          <div class="mado-card block">
            <h2>Add category</h2>
            <label class="lbl">Name</label>
            <input [(ngModel)]="catName" />
            <label class="lbl">Description</label>
            <input [(ngModel)]="catDesc" />
            <label class="lbl">Thumbnail URL</label>
            <input [(ngModel)]="catThumb" />
            <button type="button" class="btn" (click)="createCategory()">Create</button>
          </div>
          <div class="mado-card block">
            <h2>Existing</h2>
            <ul class="cat-list">
              @for (c of categories; track c.id) {
                <li>
                  <span class="cn">{{ c.name }}</span>
                  <code>{{ c.slug }}</code>
                  <button type="button" class="link" (click)="startEditCat(c)">Edit</button>
                  <button type="button" class="link danger" (click)="deleteCat(c)">Delete</button>
                </li>
              } @empty {
                <li class="muted">No categories</li>
              }
            </ul>
            @if (editingCat) {
              <div class="edit-box">
                <h3>Edit {{ editingCat.slug }}</h3>
                <label class="lbl">Name</label>
                <input [(ngModel)]="editCatName" />
                <label class="lbl">Description</label>
                <input [(ngModel)]="editCatDesc" />
                <label class="lbl">Thumbnail URL</label>
                <input [(ngModel)]="editCatThumb" />
                <button type="button" class="btn" (click)="saveCategory()">Save</button>
                <button type="button" class="btn secondary" (click)="editingCat = null">Cancel</button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); margin: 0 0 .25rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1rem; }
    .tabs { display: flex; gap: .5rem; margin-bottom: 1rem; }
    .tabs button {
      background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-primary);
      padding: .45rem 1rem; border-radius: 8px; cursor: pointer; font-family: inherit; font-weight: 600;
    }
    .tabs button.on { border-color: var(--accent); color: var(--accent); }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .stat { padding: 1rem; display: flex; flex-direction: column; gap: .35rem; }
    .lbl { font-size: .78rem; color: var(--text-muted); text-transform: uppercase; }
    .val { font-size: 1.75rem; font-weight: 800; }
    .muted { color: var(--text-muted); }
    .toolbar { padding: 1rem; display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .75rem; }
    .toolbar input { flex: 1; min-width: 200px; padding: .5rem .65rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-primary); }
    .table-wrap { overflow-x: auto; padding: 0; }
    table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    th, td { padding: .6rem .75rem; text-align: left; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-weight: 700; font-size: .75rem; text-transform: uppercase; }
    .mono { font-family: monospace; font-size: .8rem; word-break: break-all; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: .72rem; margin-right: 4px; }
    .pill.bad { background: rgba(244,67,54,.2); color: #f44336; }
    .pill.ok { background: rgba(83,252,24,.15); color: var(--accent); }
    .actions { white-space: nowrap; }
    .link { background: none; border: none; color: var(--accent); cursor: pointer; font-family: inherit; margin-right: .5rem; }
    .link.danger { color: var(--danger); }
    .btn {
      background: var(--accent); color: #000; border: none; border-radius: 8px; font-weight: 800;
      padding: .5rem 1rem; cursor: pointer; font-family: inherit;
    }
    .btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 800px) { .split { grid-template-columns: 1fr; } }
    .block { padding: 1rem; }
    .lbl { display: block; font-size: .78rem; font-weight: 700; margin: .5rem 0 .2rem; color: var(--text-muted); }
    input {
      width: 100%; box-sizing: border-box; padding: .5rem .65rem; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-tertiary); color: var(--text-primary); font-family: inherit;
    }
    .cat-list { list-style: none; padding: 0; margin: 0; }
    .cat-list li { padding: .5rem 0; border-bottom: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
    .cn { font-weight: 700; }
    code { font-size: .75rem; color: var(--text-muted); }
    .edit-box { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    h2, h3 { font-size: 1rem; margin: 0 0 .75rem; }
  `]
})
export class AdminComponent implements OnInit {
  tab: 'stats' | 'users' | 'cats' = 'stats';
  stats: AdminStats | null = null;

  userQuery = '';
  users: AdminUserRow[] = [];

  categories: CategoryRow[] = [];
  catName = '';
  catDesc = '';
  catThumb = '';
  editingCat: CategoryRow | null = null;
  editCatName = '';
  editCatDesc = '';
  editCatThumb = '';

  constructor(
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.http.get<AdminStats>('/api/admin/stats').subscribe({
      next: (s) => (this.stats = s),
      error: () => this.toastr.error('Could not load admin stats')
    });
  }

  loadUsers(page = 0): void {
    const q = this.userQuery.trim();
    const url = q
      ? `/api/admin/users?q=${encodeURIComponent(q)}&page=${page}&size=20`
      : `/api/admin/users?page=${page}&size=20`;
    this.http.get<{ content: AdminUserRow[] }>(url).subscribe({
      next: (p) => (this.users = p.content ?? []),
      error: () => this.toastr.error('Could not load users')
    });
  }

  loadCategories(): void {
    this.http.get<{ content: CategoryRow[] }>('/api/admin/categories?page=0&size=100').subscribe({
      next: (p) => (this.categories = p.content ?? []),
      error: () => this.toastr.error('Could not load categories')
    });
  }

  ban(u: AdminUserRow): void {
    const reason = prompt('Ban reason (optional)?') ?? '';
    this.http.post(`/api/admin/users/${u.id}/ban`, { reason }).subscribe({
      next: () => {
        this.toastr.success('User banned');
        this.loadUsers();
      },
      error: () => this.toastr.error('Ban failed')
    });
  }

  unban(u: AdminUserRow): void {
    this.http.post(`/api/admin/users/${u.id}/unban`, {}).subscribe({
      next: () => {
        this.toastr.success('User unbanned');
        this.loadUsers();
      },
      error: () => this.toastr.error('Unban failed')
    });
  }

  verify(u: AdminUserRow): void {
    this.http.post(`/api/admin/users/${u.id}/verify`, {}).subscribe({
      next: () => {
        this.toastr.success('User verified');
        this.loadUsers();
      },
      error: () => this.toastr.error('Verify failed')
    });
  }

  createCategory(): void {
    if (!this.catName.trim()) {
      this.toastr.warning('Name required');
      return;
    }
    this.http
      .post<CategoryRow>('/api/admin/categories', {
        name: this.catName.trim(),
        description: this.catDesc.trim() || undefined,
        thumbnailUrl: this.catThumb.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.toastr.success('Category created');
          this.catName = '';
          this.catDesc = '';
          this.catThumb = '';
          this.loadCategories();
        },
        error: () => this.toastr.error('Create failed')
      });
  }

  startEditCat(c: CategoryRow): void {
    this.editingCat = c;
    this.editCatName = c.name;
    this.editCatDesc = c.description ?? '';
    this.editCatThumb = c.thumbnailUrl ?? '';
  }

  saveCategory(): void {
    if (!this.editingCat || !this.editCatName.trim()) return;
    this.http
      .patch<CategoryRow>(`/api/admin/categories/${this.editingCat.id}`, {
        name: this.editCatName.trim(),
        description: this.editCatDesc.trim() || undefined,
        thumbnailUrl: this.editCatThumb.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.toastr.success('Saved');
          this.editingCat = null;
          this.loadCategories();
        },
        error: () => this.toastr.error('Save failed')
      });
  }

  deleteCat(c: CategoryRow): void {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    this.http.delete(`/api/admin/categories/${c.id}`).subscribe({
      next: () => {
        this.toastr.success('Deleted');
        if (this.editingCat?.id === c.id) this.editingCat = null;
        this.loadCategories();
      },
      error: () => this.toastr.error('Delete failed')
    });
  }
}
