package com.mado.service;

import com.mado.dto.AdminStatsResponse;
import com.mado.dto.CategoryWriteRequest;
import com.mado.entity.Category;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.CategoryRepository;
import com.mado.repository.ChannelRepository;
import com.mado.repository.UserRepository;
import com.mado.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final Pattern NON_SLUG = Pattern.compile("[^a-z0-9-]+");

    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final CategoryRepository categoryRepository;

    public AdminStatsResponse stats() {
        long users = userRepository.count();
        long live = channelRepository.countByIsLiveTrue();
        long revenue = walletTransactionRepository.sumAmountCentsAll();
        return AdminStatsResponse.builder()
                .totalUsers(users)
                .liveStreams(live)
                .revenueCents(revenue)
                .build();
    }

    public Page<User> searchUsers(String q, Pageable pageable) {
        String term = q == null ? "" : q.trim();
        if (term.isEmpty()) {
            return userRepository.findAll(pageable);
        }
        return userRepository.search(term, pageable);
    }

    @Transactional
    public void banUser(UUID id, String reason) {
        User u = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        u.setIsBanned(true);
        u.setBanReason(reason);
        userRepository.save(u);
    }

    @Transactional
    public void unbanUser(UUID id) {
        User u = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        u.setIsBanned(false);
        u.setBanReason(null);
        userRepository.save(u);
    }

    @Transactional
    public void verifyUser(UUID id) {
        User u = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        u.setIsVerified(true);
        userRepository.save(u);
    }

    public Page<Category> listCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable);
    }

    @Transactional
    public Category createCategory(CategoryWriteRequest req) {
        String slug = slugify(req.getName());
        slug = ensureUniqueSlug(slug);
        Category c = Category.builder()
                .name(req.getName().trim())
                .slug(slug)
                .description(req.getDescription())
                .thumbnailUrl(req.getThumbnailUrl())
                .build();
        return categoryRepository.save(c);
    }

    @Transactional
    public Category updateCategory(UUID id, CategoryWriteRequest req) {
        Category c = categoryRepository.findById(id).orElseThrow(() -> new NotFoundException("Category not found"));
        if (req.getName() != null && !req.getName().isBlank()) {
            c.setName(req.getName().trim());
            String newSlug = slugify(req.getName());
            if (!newSlug.equals(c.getSlug())) {
                var existing = categoryRepository.findBySlug(newSlug);
                if (existing.isEmpty() || existing.get().getId().equals(c.getId())) {
                    c.setSlug(newSlug);
                } else {
                    c.setSlug(ensureUniqueSlug(newSlug));
                }
            }
        }
        if (req.getDescription() != null) {
            c.setDescription(req.getDescription());
        }
        if (req.getThumbnailUrl() != null) {
            c.setThumbnailUrl(req.getThumbnailUrl());
        }
        return categoryRepository.save(c);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Category not found");
        }
        categoryRepository.deleteById(id);
    }

    private String slugify(String name) {
        String n = Normalizer.normalize(name.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        n = NON_SLUG.matcher(n.replaceAll("\\p{M}+", "")).replaceAll("-");
        n = n.replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
        if (n.isBlank()) {
            n = "category";
        }
        return n;
    }

    private String ensureUniqueSlug(String base) {
        String s = base;
        int i = 0;
        while (categoryRepository.findBySlug(s).isPresent()) {
            i++;
            s = base + "-" + i;
            if (i > 50) {
                throw new BadRequestException("Could not allocate slug");
            }
        }
        return s;
    }
}
