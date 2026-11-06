package mg.eni.email.dto.response;

public record AdminStatsDto(
        long totalUsers,
        long totalStudents,
        long totalTeachers,
        long totalAdmins,
        long totalMessages,
        long totalGroups,
        long activeUsers
) { }
