package com.mado.mail;

import lombok.experimental.UtilityClass;

@UtilityClass
public final class EmailHtmlTemplates {

    public String channelLive(String channelUsername, String title, String watchUrl) {
        String safeTitle = escape(title == null || title.isBlank() ? "Live now" : title);
        String safeUser = escape(channelUsername);
        return """
                <!DOCTYPE html>
                <html><head><meta charset="UTF-8"><title>Live</title></head>
                <body style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b0e0f;color:#e8e8e8;padding:24px;">
                  <table width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="background:#141820;border:1px solid #2a2f3a;border-radius:12px;padding:28px;">
                      <tr><td style="font-size:22px;font-weight:800;color:#53fc18;">MaDo Live</td></tr>
                      <tr><td style="padding-top:16px;font-size:18px;font-weight:700;color:#fff;">%s is live</td></tr>
                      <tr><td style="padding-top:8px;font-size:15px;color:#b0b0c0;">%s</td></tr>
                      <tr><td style="padding-top:28px;">
                        <a href="%s" style="display:inline-block;background:#53fc18;color:#000;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:999px;">Watch stream</a>
                      </td></tr>
                      <tr><td style="padding-top:24px;font-size:12px;color:#6a6a7a;">If the button does not work, copy this link:<br/><span style="word-break:break-all;color:#53fc18;">%s</span></td></tr>
                    </table>
                  </td></tr></table>
                </body></html>
                """.formatted(safeUser, safeTitle, watchUrl, watchUrl);
    }

    public String subscriptionConfirmation(String channelUsername, String tier, String amount, String manageUrl) {
        return """
                <!DOCTYPE html>
                <html><head><meta charset="UTF-8"><title>Subscription</title></head>
                <body style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b0e0f;color:#e8e8e8;padding:24px;">
                  <table width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="background:#141820;border:1px solid #2a2f3a;border-radius:12px;padding:28px;">
                      <tr><td style="font-size:22px;font-weight:800;color:#53fc18;">MaDo Live</td></tr>
                      <tr><td style="padding-top:16px;font-size:18px;font-weight:700;color:#fff;">You're subscribed</td></tr>
                      <tr><td style="padding-top:8px;font-size:15px;color:#b0b0c0;">Channel: <strong style="color:#fff;">%s</strong><br/>
                      Tier: <strong style="color:#fff;">%s</strong><br/>
                      Amount: <strong style="color:#fff;">%s</strong></td></tr>
                      <tr><td style="padding-top:28px;">
                        <a href="%s" style="display:inline-block;background:#53fc18;color:#000;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:999px;">Open MaDo</a>
                      </td></tr>
                    </table>
                  </td></tr></table>
                </body></html>
                """.formatted(escape(channelUsername), escape(tier), escape(amount), manageUrl);
    }

    private String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
