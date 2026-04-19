import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

function showFatal(err: unknown): void {
  console.error(err);
  const raw = err instanceof Error ? err.stack ?? err.message : String(err);
  const msg = raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  document.body.innerHTML = `
    <div style="font-family:system-ui,sans-serif;padding:24px;background:#0a0a0f;color:#f0f0f0;min-height:100vh;">
      <h1 style="color:#53fc18;margin-top:0;">MaDo Live — failed to start</h1>
      <pre style="white-space:pre-wrap;word-break:break-word;opacity:.9;border:1px solid #333;padding:12px;border-radius:8px;">${msg}</pre>
      <p style="color:#9090a8;">Open DevTools (F12) → Console. Run from <code style="color:#53fc18">Kick Live/frontend</code>: <code style="color:#53fc18">npm start</code> → open <code style="color:#53fc18">http://localhost:4300</code> (API proxy to http://127.0.0.1:8090).</p>
    </div>`;
}

/** Catch synchronous import failures and async bootstrap failures (stuck “Loading…” otherwise). */
try {
  void bootstrapApplication(AppComponent, appConfig).catch(showFatal);
} catch (err) {
  showFatal(err);
}
