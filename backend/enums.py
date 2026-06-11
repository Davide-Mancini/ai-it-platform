from enum import Enum

class UserRole(str, Enum):
    ADMINISTRATOR = "Administrator"
    SYSTEM_ADMINISTRATOR = "System Administrator"
    IT_MANAGER = "IT Manager"
    ENGINEER = "Engineer"
    SALES = "Sales"
    AUDITOR = "Auditor"
    CUSTOMER= "Customer"