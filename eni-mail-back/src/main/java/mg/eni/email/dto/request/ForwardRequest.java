package mg.eni.email.dto.request;

import java.util.List;

import jakarta.validation.constraints.Size;

public record ForwardRequest(
        @Size(max = 50_000) String body,
        List<String> toUserIds,
        List<String> toGroupIds
) { }
