from datetime import datetime
from typing import Dict, Optional

class Supplier:
    def __init__(self, full_name: str, email: str, phone: str, 
                 company: str, address: str, created_by: str,
                 id: Optional[str] = None, status: str = 'active'):
        self.id = id
        self.full_name = full_name
        self.email = email
        self.phone = phone
        self.company = company
        self.address = address
        self.status = status
        self.created_by = created_by
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self, include_id: bool = False) -> Dict:
        """Convert supplier object to dictionary
        
        Args:
            include_id: Whether to include the id field (False for inserts, True for updates)
        """
        data = {
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'company': self.company,
            'address': self.address,
            'status': self.status,
            'created_by': self.created_by
        }
        
        # Only include id if explicitly requested and it exists
        if include_id and self.id:
            data['id'] = self.id
        
        return data
    
    @staticmethod
    def validate(data: Dict) -> tuple[bool, Optional[str]]:
        """Validate supplier data"""
        required_fields = ['full_name', 'email', 'phone', 'company', 'address']
        
        for field in required_fields:
            if field not in data or not data[field]:
                return False, f"{field} is required"
        
        # Basic email validation
        if '@' not in data['email']:
            return False, "Invalid email format"
        
        # Phone validation (basic)
        if len(data['phone']) < 10:
            return False, "Invalid phone number"
        
        return True, None