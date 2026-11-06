package mg.eni.email.dto.response;

import java.time.Instant;
import java.util.List;

public record MessageSummaryDto(
        String id,
        String subject,
        String preview,
        String senderId,
        String senderDisplayName,
        String senderEmail,
        List<String> recipientLabels,
        int attachmentCount,
        boolean read,
        boolean draft,
        Instant sentAt,
        Instant createdAt,
        String threadId
) { }
