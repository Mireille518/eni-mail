package mg.eni.email.document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import mg.eni.email.enums.MessageFolder;

@Document(collection = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndexes({
        @CompoundIndex(name = "idx_recipient_folder_date",
                def = "{ 'recipients.userId': 1, 'recipients.folder': 1, 'sentAt': -1 }"),
        @CompoundIndex(name = "idx_sender_folder_date",
                def = "{ 'senderId': 1, 'senderFolder': 1, 'sentAt': -1 }"),
        @CompoundIndex(name = "idx_thread",
                def = "{ 'threadId': 1, 'createdAt': 1 }")
})
public class Message {

    @Id
    private String id;

    @Indexed
    private String senderId;

    @TextIndexed(weight = 2f)
    private String subject;

    @TextIndexed
    private String body;

    @Builder.Default
    private List<MessageRecipient> recipients = new ArrayList<>();

    private MessageFolder senderFolder;
    private boolean senderDeleted;
    private Instant senderDeletedAt;

    @Indexed
    private boolean draft;

    private String parentMessageId;

    @Indexed
    private String threadId;

    @Builder.Default
    private List<String> attachmentIds = new ArrayList<>();

    @Builder.Default
    private List<String> groupIds = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    private Instant sentAt;
}
