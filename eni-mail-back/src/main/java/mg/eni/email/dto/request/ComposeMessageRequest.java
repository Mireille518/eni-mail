package mg.eni.email.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComposeMessageRequest(
        @NotBlank @Size(max = 300) String subject,
        @NotBlank @Size(max = 50_000) String body,
        List<String> toUserIds,
        List<String> ccUserIds,
        List<String> bccUserIds,
        List<String> toGroupIds,
        List<String> attachmentIds,
        String parentMessageId,
        Boolean asDraft
) { }
