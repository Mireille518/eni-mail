package mg.eni.email.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.admin-seed")
public class AdminSeedProperties {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
}
