package mg.eni.email.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import mg.eni.email.document.RefreshToken;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    long deleteByUserId(String userId);
}
