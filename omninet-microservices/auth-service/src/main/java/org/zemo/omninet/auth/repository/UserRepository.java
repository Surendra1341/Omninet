package org.zemo.omninet.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.zemo.omninet.auth.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByIdIn(List<String> ids);

    @Query("SELECT u FROM User u WHERE u.id <> :excludeId AND " +
           "(LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<User> searchByNameOrEmail(@Param("q") String q, @Param("excludeId") String excludeId);
}
