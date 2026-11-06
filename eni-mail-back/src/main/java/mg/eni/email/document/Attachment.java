package mg.eni.email.document;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    @Id
    private String id;

    @Indexed
    private String messageId;

    @Indexed
    private String ownerId;

    private String filename;
    private String storedName;
    private String contentType;
    private long size;

    @CreatedDate
    private Instant createdAt;
}
