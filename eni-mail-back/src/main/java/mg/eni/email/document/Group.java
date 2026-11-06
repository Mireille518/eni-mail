package mg.eni.email.document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Group {

    @Id
    private String id;

    @Indexed(unique = true)
    private String name;

    private String description;

    @Builder.Default
    private List<String> memberIds = new ArrayList<>();

    @Indexed
    private String createdBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
