package mg.eni.email.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {
    private int loginMaxAttempts = 5;
    private int loginLockoutMinutes = 15;
}
