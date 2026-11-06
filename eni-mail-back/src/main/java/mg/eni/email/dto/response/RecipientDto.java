package mg.eni.email.dto.response;

import java.time.Instant;

import mg.eni.email.document.MessageRecipient;
import mg.eni.email.enums.MessageFolder;
import mg.eni.email.enums.RecipientType;

public record RecipientDto(
        String userId,
        String displayName,
        String email,
        RecipientType type,
        boolean read,
        Instant readAt,
        MessageFolder folder,
        boolean deleted
) {
    public static RecipientDto from(MessageRecipient r, String displayName, String email) {
        return new RecipientDto(r.getUserId(), displayName, email, r.getType(),
                r.isRead(), r.getReadAt(), r.getFolder(), r.isDeleted());
    }
}
