package mg.eni.email.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import mg.eni.email.document.Message;
import mg.eni.email.document.User;
import mg.eni.email.dto.response.MessageSummaryDto;
import mg.eni.email.dto.response.PageResponse;
import mg.eni.email.repository.MessageRepository;
import mg.eni.email.repository.UserRepository;
import mg.eni.email.security.SecurityUtils;
import mg.eni.email.service.MessageService;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<PageResponse<MessageSummaryDto>> search(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        User me = SecurityUtils.requireCurrentUser().getUser();
        Page<Message> page = messageRepository.searchFullText(q, me.getId(), pageable);
        Map<String, User> cache = hydrate(page);
        return ResponseEntity.ok(PageResponse.of(page, m -> messageService.toSummary(m, me, cache)));
    }

    private Map<String, User> hydrate(Page<Message> page) {
        java.util.Set<String> ids = new java.util.HashSet<>();
        page.forEach(m -> {
            ids.add(m.getSenderId());
            if (m.getRecipients() != null) m.getRecipients().forEach(r -> ids.add(r.getUserId()));
        });
        Map<String, User> map = new HashMap<>();
        if (ids.isEmpty()) return map;
        for (User u : userRepository.findByIdIn(new java.util.ArrayList<>(ids))) map.put(u.getId(), u);
        return map;
    }
}
