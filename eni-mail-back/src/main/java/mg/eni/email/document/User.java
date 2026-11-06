package mg.eni.email.document;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import mg.eni.email.enums.AccountStatus;
import mg.eni.email.enums.Role;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    @Field("password_hash")
    private String passwordHash;

    private String firstName;
    private String lastName;

    private Role role;

    @Indexed
    private String filiere;

    @Indexed
    private String promotion;

    private String avatarUrl;

    private AccountStatus status;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String fullName() {
        String f = firstName == null ? "" : firstName;
        String l = lastName == null ? "" : lastName;
        return (f + " " + l).trim();
    }
}
