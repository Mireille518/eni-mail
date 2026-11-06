package mg.eni.email.dto.response;

import java.time.Instant;
import java.util.List;

import mg.eni.email.document.Group;

public record GroupDto(
        String id,
        String name,
        String description,
        int memberCount,
        List<String> memberIds,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static GroupDto from(Group g) {
        List<String> members = g.getMemberIds() == null ? List.of() : g.getMemberIds();
        return new GroupDto(g.getId(), g.getName(), g.getDescription(),
                members.size(), members, g.getCreatedBy(),
                g.getCreatedAt(), g.getUpdatedAt());
    }
}
