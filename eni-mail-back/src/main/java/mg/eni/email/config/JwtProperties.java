package mg.eni.email.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    private String secret;
    private long accessTokenTtlMinutes = 15;
    private long refreshTokenTtlDays = 7;
    private String issuer = "eni-mail";
}
