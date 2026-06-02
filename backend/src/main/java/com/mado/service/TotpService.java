package com.mado.service;

import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

@Service
public class TotpService {

    private static final int TIME_STEP = 30;
    private static final int DIGITS = 6;
    private final SecureRandom random = new SecureRandom();

    public String generateSecret() {
        byte[] buf = new byte[20];
        random.nextBytes(buf);
        return new Base32(0).encodeToString(buf).replace("=", "");
    }

    public boolean verify(String base32Secret, String code) {
        if (base32Secret == null || code == null || code.isBlank()) {
            return false;
        }
        String normalized = code.trim().replace(" ", "");
        if (!normalized.matches("\\d{6}")) {
            return false;
        }
        long now = Instant.now().getEpochSecond() / TIME_STEP;
        for (long i = now - 1; i <= now + 1; i++) {
            if (normalized.equals(generateCode(base32Secret, i))) {
                return true;
            }
        }
        return false;
    }

    public String otpAuthUri(String issuer, String account, String base32Secret) {
        return "otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=%d&period=%d"
                .formatted(urlEncode(issuer), urlEncode(account), base32Secret, urlEncode(issuer), DIGITS, TIME_STEP);
    }

    private String generateCode(String base32Secret, long counter) {
        try {
            Base32 base32 = new Base32(0);
            byte[] key = base32.decode(base32Secret.toUpperCase());
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format("%0" + DIGITS + "d", otp);
        } catch (Exception e) {
            return "";
        }
    }

    private String urlEncode(String s) {
        return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }
}
