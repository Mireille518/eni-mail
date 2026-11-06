package mg.eni.email.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReplyRequest(
        @NotBlank @Size(max = 50_000) String body,
        Boolean replyAll,
        List<String> attachmentIds
) { }
