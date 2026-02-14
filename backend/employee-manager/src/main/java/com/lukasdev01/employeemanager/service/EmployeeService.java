package com.lukasdev01.employeemanager.service;

import com.lukasdev01.employeemanager.model.Employee;
import com.lukasdev01.employeemanager.repo.EmployeeRepo;

import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

// CRUD service for managing employees:
// creates (with UUID code), reads (by ID or all), updates, and deletes
@Service
public class EmployeeService {

    private final EmployeeRepo employeeRepo;

    public EmployeeService(EmployeeRepo employeeRepo) {
        this.employeeRepo = employeeRepo;
    }

    public Employee addEmployee(Employee employee) {
        employee.setEmployeeCode(UUID.randomUUID().toString());
        return employeeRepo.save(employee);
    }

    public List<Employee> findAllEmployees() {
        return employeeRepo.findAll();
    }

    public Employee updateEmployee(Employee employee) {
        return employeeRepo.save(employee);
    }

    public Employee findEmployeeById(long id) {
        return employeeRepo
            .findEmployeeById(id)
            .orElseThrow(() ->
                new UserNotFoundException("User by id " + id + " was not found")
            );
    }

    @Transactional
    public void deleteEmployee(Long id) {
        employeeRepo.deleteEmployeeById(id);
    }
}
