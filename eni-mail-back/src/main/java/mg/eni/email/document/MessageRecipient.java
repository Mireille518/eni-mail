package mg.eni.email.document;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import mg.eni.email.enums.MessageFolder;
import mg.eni.email.enums.RecipientType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRecipient {
    private String userId;
    private RecipientType type;
    private boolean read;
    private Instant readAt;
    private MessageFolder folder;
    private boolean deleted;
    private Instant deletedAt;
}
