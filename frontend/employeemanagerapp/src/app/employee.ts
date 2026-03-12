export interface Employee {
    id: number;
    name: string;
    email: string;
    jobTitle: string;
    phone: string;
    imageUrl: string;
    employeeCode: string;
    birthday?: string;
    hireDate?: string;
    status: string;
    contractType?: string;
    contractStartDate?: string;
    contractEndDate?: string;
}

export interface EmployeeWithBirthday extends Employee {
    daysUntilBirthday: number;
}

export interface EmployeeWithAnniversary extends Employee {
    daysUntilAnniversary: number;
    yearsOfService: number;
}

export interface EmployeeWithContractWarning extends Employee {
    daysUntilContractEnd: number;
    contractStatus: 'active' | 'ending-soon' | 'expired' | 'not-applicable';
}
