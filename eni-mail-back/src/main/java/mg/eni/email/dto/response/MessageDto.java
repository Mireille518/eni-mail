package mg.eni.email.dto.response;

import java.time.Instant;
import java.util.List;

import mg.eni.email.enums.MessageFolder;

public record MessageDto(
        String id,
        String subject,
        String body,
        String senderId,
        String senderDisplayName,
        String senderEmail,
        List<RecipientDto> recipients,
        List<AttachmentDto> attachments,
        List<String> groupIds,
        String parentMessageId,
        String threadId,
        boolean draft,
        MessageFolder currentFolder,
        Instant sentAt,
        Instant createdAt
) { }
