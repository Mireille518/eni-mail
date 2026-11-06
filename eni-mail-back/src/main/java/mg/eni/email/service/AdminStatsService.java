package mg.eni.email.service;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import mg.eni.email.document.Group;
import mg.eni.email.document.Message;
import mg.eni.email.document.User;
import mg.eni.email.dto.response.AdminStatsDto;
import mg.eni.email.enums.AccountStatus;
import mg.eni.email.enums.Role;
import mg.eni.email.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final UserRepository userRepository;
    private final MongoTemplate mongo;

    public AdminStatsDto build() {
        long totalUsers = userRepository.count();
        long students = userRepository.countByRole(Role.ROLE_ETUDIANT);
        long teachers = userRepository.countByRole(Role.ROLE_ENSEIGNANT);
        long admins = userRepository.countByRole(Role.ROLE_ADMIN);
        long messages = mongo.count(new Query(Criteria.where("draft").is(false)), Message.class);
        long groups = mongo.count(new Query(), Group.class);
        long active = mongo.count(new Query(Criteria.where("status").is(AccountStatus.ACTIVE)), User.class);
        return new AdminStatsDto(totalUsers, students, teachers, admins, messages, groups, active);
    }
}
