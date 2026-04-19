import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService, UserPreferencesDto } from '../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';

const LS_HIDE_POOLS = 'mado_pref_hide_pools';
const LS_HIDE_SLOTS = 'mado_pref_hide_slots';
const LS_HIDE_VR = 'mado_pref_hide_vr';

@Component({
  selector: 'mado-settings-preferences',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 class="section-title">Preferences</h2>
    <section class="mado-card block">
      <h3>Content preferences</h3>
      <p class="sub">UI-only filters for browse (stored in this browser until backend fields exist).</p>
      <label class="row">
        <span>Hide pools, hot tubs &amp; bikinis</span>
        <input type="checkbox" [(ngModel)]="hidePools" (ngModelChange)="persistContent()" />
      </label>
      <label class="row">
        <span>Hide slots &amp; casino</span>
        <input type="checkbox" [(ngModel)]="hideSlots" (ngModelChange)="persistContent()" />
      </label>
      <label class="row">
        <span>Hide VR chat</span>
        <input type="checkbox" [(ngModel)]="hideVr" (ngModelChange)="persistContent()" />
      </label>
    </section>
    <section class="mado-card block">
      <h3>Playback</h3>
      <label class="row"><input type="checkbox" [(ngModel)]="prefs.darkMode" /> Dark mode (UI)</label>
      <label class="row"><input type="checkbox" [(ngModel)]="prefs.autoplay" /> Autoplay streams</label>
      <label class="field">Language <input [(ngModel)]="prefs.language" placeholder="en" /></label>
    </section>
    <button type="button" class="btn" (click)="save()">Save</button>
  `,
  styles: [`
    .section-title { font-size: 1.35rem; margin: 0 0 1rem; color: var(--text-primary); }
    h3 { font-size: 1rem; margin: 0 0 .35rem; color: var(--text-secondary); }
    .sub { color: var(--text-muted); font-size: .85rem; margin: 0 0 1rem; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: .55rem 0; color: var(--text-secondary); font-size: .95rem; }
    .field { display: flex; flex-direction: column; gap: .35rem; margin-top: .75rem; color: var(--text-secondary); font-size: .9rem; }
    input[type='text'] {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: .5rem .65rem;
      color: var(--text-primary);
      font-family: inherit;
      max-width: 200px;
    }
    .btn {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 10px;
      font-weight: 800;
      padding: .55rem 1.25rem;
      cursor: pointer;
      font-family: inherit;
    }
  `]
})
export class SettingsPreferencesComponent implements OnInit {
  prefs: UserPreferencesDto = {};
  hidePools = false;
  hideSlots = false;
  hideVr = false;

  constructor(
    private readonly users: UserService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.hidePools = localStorage.getItem(LS_HIDE_POOLS) === '1';
    this.hideSlots = localStorage.getItem(LS_HIDE_SLOTS) === '1';
    this.hideVr = localStorage.getItem(LS_HIDE_VR) === '1';

    this.users.getPreferences().subscribe((p) => {
      this.prefs = {
        ...p,
        emailOnLive: p.emailOnLive ?? true,
        emailOnFollow: p.emailOnFollow ?? true,
        pushOnLive: p.pushOnLive ?? false,
        darkMode: p.darkMode ?? true,
        autoplay: p.autoplay ?? true
      };
    });
  }

  persistContent(): void {
    localStorage.setItem(LS_HIDE_POOLS, this.hidePools ? '1' : '0');
    localStorage.setItem(LS_HIDE_SLOTS, this.hideSlots ? '1' : '0');
    localStorage.setItem(LS_HIDE_VR, this.hideVr ? '1' : '0');
  }

  save(): void {
    this.users.patchPreferences(this.prefs).subscribe({
      next: () => this.toastr.success('Preferences saved')
    });
  }
}
