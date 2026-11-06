package mg.eni.email.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mg.eni.email.dto.request.ComposeMessageRequest;
import mg.eni.email.dto.request.ForwardRequest;
import mg.eni.email.dto.request.ReplyRequest;
import mg.eni.email.dto.response.FolderCountsDto;
import mg.eni.email.dto.response.MessageDto;
import mg.eni.email.dto.response.MessageSummaryDto;
import mg.eni.email.dto.response.PageResponse;
import mg.eni.email.enums.MessageFolder;
import mg.eni.email.security.SecurityUtils;
import mg.eni.email.service.MessageService;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<PageResponse<MessageSummaryDto>> list(
            @RequestParam(defaultValue = "INBOX") MessageFolder folder,
            @PageableDefault(size = 20, sort = "sentAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MessageSummaryDto> page = messageService.listFolder(folder,
                SecurityUtils.requireCurrentUser().getUser(), pageable);
        return ResponseEntity.ok(PageResponse.of(page, m -> m));
    }

    @GetMapping("/folders/counts")
    public ResponseEntity<FolderCountsDto> counts() {
        return ResponseEntity.ok(messageService.counts(SecurityUtils.requireCurrentUser().getUser()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MessageDto> get(@PathVariable String id) {
        return ResponseEntity.ok(messageService.getOne(id, SecurityUtils.requireCurrentUser().getUser()));
    }

    @PostMapping
    public ResponseEntity<MessageDto> send(@Valid @RequestBody ComposeMessageRequest req) {
        return ResponseEntity.status(201)
                .body(messageService.send(req, SecurityUtils.requireCurrentUser().getUser()));
    }

    @PutMapping("/drafts/{id}")
    public ResponseEntity<MessageDto> updateDraft(@PathVariable String id,
                                                  @Valid @RequestBody ComposeMessageRequest req) {
        return ResponseEntity.ok(messageService.updateDraft(id, req,
                SecurityUtils.requireCurrentUser().getUser()));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<MessageDto> reply(@PathVariable String id,
                                            @Valid @RequestBody ReplyRequest req) {
        return ResponseEntity.status(201).body(messageService.reply(id, req,
                SecurityUtils.requireCurrentUser().getUser()));
    }

    @PostMapping("/{id}/forward")
    public ResponseEntity<MessageDto> forward(@PathVariable String id,
                                              @Valid @RequestBody ForwardRequest req) {
        return ResponseEntity.status(201).body(messageService.forward(id, req,
                SecurityUtils.requireCurrentUser().getUser()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable String id,
                                         @RequestParam(defaultValue = "true") boolean read) {
        messageService.markRead(id, SecurityUtils.requireCurrentUser().getUser(), read);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        messageService.moveToTrash(id, SecurityUtils.requireCurrentUser().getUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restore(@PathVariable String id) {
        messageService.restore(id, SecurityUtils.requireCurrentUser().getUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deletePermanent(@PathVariable String id) {
        messageService.deletePermanent(id, SecurityUtils.requireCurrentUser().getUser());
        return ResponseEntity.noContent().build();
    }
}
