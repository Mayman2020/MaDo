package com.mado.service;

import com.mado.config.MinioProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.file.Path;

@Service
@RequiredArgsConstructor
public class S3MediaUploadService {

    private final S3Client s3Client;
    private final MinioProperties minioProperties;

    /**
     * Uploads a file to MinIO/S3 and returns a public HTTP URL (path-style).
     */
    public String uploadFile(String objectKey, Path file, String contentType) {
        String bucket = minioProperties.getBucket();
        PutObjectRequest req = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType(contentType)
                .build();
        s3Client.putObject(req, RequestBody.fromFile(file));
        String base = minioProperties.getUrl().replaceAll("/$", "");
        return base + "/" + bucket + "/" + objectKey;
    }
}
