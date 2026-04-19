package com.mado.service;

import com.mado.dto.ChannelPublicResponse;
import com.mado.dto.ClipResponse;
import com.mado.dto.SearchResponse;
import com.mado.dto.CategoryResponse;
import com.mado.repository.CategoryRepository;
import com.mado.repository.ChannelRepository;
import com.mado.repository.ClipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ChannelRepository channelRepository;
    private final CategoryRepository categoryRepository;
    private final ClipRepository clipRepository;
    private final ChannelService channelService;

    @Transactional(readOnly = true)
    public SearchResponse search(String q, String type) {
        if (q == null || q.isBlank()) {
            return SearchResponse.builder().channels(List.of()).clips(List.of()).categories(List.of()).build();
        }
        String term = q.trim();
        if ("clip".equalsIgnoreCase(type)) {
            return SearchResponse.builder()
                    .channels(List.of())
                    .clips(clipRepository.findByTitleContainingIgnoreCase(term, PageRequest.of(0, 20))
                            .map(c -> ClipResponse.builder()
                                    .id(c.getId())
                                    .channelId(c.getChannel().getId())
                                    .channelUsername(c.getChannel().getUser().getUsername())
                                    .title(c.getTitle())
                                    .clipUrl(c.getClipUrl())
                                    .thumbnailUrl(c.getThumbnailUrl())
                                    .viewCount(c.getViewCount() == null ? 0 : c.getViewCount())
                                    .createdAt(c.getCreatedAt())
                                    .build())
                            .getContent())
                    .categories(List.of())
                    .build();
        }
        if ("category".equalsIgnoreCase(type)) {
            String lower = term.toLowerCase();
            List<CategoryResponse> categories = categoryRepository.findAll().stream()
                    .filter(c -> c.getName().toLowerCase().contains(lower)
                            || c.getSlug().toLowerCase().contains(lower))
                    .limit(20)
                    .map(c -> CategoryResponse.builder()
                            .id(c.getId())
                            .name(c.getName())
                            .slug(c.getSlug())
                            .thumbnailUrl(c.getThumbnailUrl())
                            .viewerCount(c.getViewerCount() == null ? 0 : c.getViewerCount())
                            .build())
                    .toList();
            return SearchResponse.builder()
                    .channels(List.of())
                    .clips(List.of())
                    .categories(categories)
                    .build();
        }
        List<ChannelPublicResponse> channels = channelRepository.findAll().stream()
                .filter(ch -> ch.getUser().getUsername().toLowerCase().contains(term.toLowerCase())
                        || (ch.getTitle() != null && ch.getTitle().toLowerCase().contains(term.toLowerCase())))
                .limit(20)
                .map(channelService::toPublicDto)
                .toList();
        List<ClipResponse> clips = clipRepository.findByTitleContainingIgnoreCase(term, PageRequest.of(0, 10))
                .map(c -> ClipResponse.builder()
                        .id(c.getId())
                        .channelId(c.getChannel().getId())
                        .channelUsername(c.getChannel().getUser().getUsername())
                        .title(c.getTitle())
                        .clipUrl(c.getClipUrl())
                        .thumbnailUrl(c.getThumbnailUrl())
                        .viewCount(c.getViewCount() == null ? 0 : c.getViewCount())
                        .createdAt(c.getCreatedAt())
                        .build())
                .getContent();
        return SearchResponse.builder().channels(channels).clips(clips).categories(List.of()).build();
    }
}
