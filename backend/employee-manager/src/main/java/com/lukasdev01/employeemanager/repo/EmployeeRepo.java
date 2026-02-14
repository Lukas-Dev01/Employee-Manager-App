package com.lukasdev01.employeemanager.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.lukasdev01.employeemanager.model.Employee;

// JPA repo for Employee: CRUD + find/delete by ID
public interface EmployeeRepo extends JpaRepository<Employee, Long> {
    void deleteEmployeeById(Long id);

    Optional<Employee>findEmployeeById(long id);
}