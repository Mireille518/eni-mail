package mg.eni.email.controller;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mg.eni.email.dto.request.CreateGroupRequest;
import mg.eni.email.dto.request.UpdateGroupRequest;
import mg.eni.email.dto.response.GroupDto;
import mg.eni.email.dto.response.PageResponse;
import mg.eni.email.security.SecurityUtils;
import mg.eni.email.service.GroupService;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<PageResponse<GroupDto>> list(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.of(
                groupService.list(SecurityUtils.requireCurrentUser().getUser(), q, pageable),
                GroupDto::from));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDto> get(@PathVariable String id) {
        return ResponseEntity.ok(GroupDto.from(groupService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<GroupDto> create(@Valid @RequestBody CreateGroupRequest req) {
        return ResponseEntity.status(201)
                .body(GroupDto.from(groupService.create(req, SecurityUtils.requireCurrentUser().getUser())));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<GroupDto> update(@PathVariable String id,
                                           @Valid @RequestBody UpdateGroupRequest req) {
        return ResponseEntity.ok(GroupDto.from(
                groupService.update(id, req, SecurityUtils.requireCurrentUser().getUser())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        groupService.delete(id, SecurityUtils.requireCurrentUser().getUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<GroupDto> addMembers(@PathVariable String id,
                                               @RequestBody List<String> memberIds) {
        return ResponseEntity.ok(GroupDto.from(
                groupService.addMembers(id, memberIds, SecurityUtils.requireCurrentUser().getUser())));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<GroupDto> removeMember(@PathVariable String id,
                                                 @PathVariable String memberId) {
        return ResponseEntity.ok(GroupDto.from(
                groupService.removeMember(id, memberId, SecurityUtils.requireCurrentUser().getUser())));
    }
}
