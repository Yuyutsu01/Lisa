from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class ConnectedAccountBase(BaseModel):
    platform: str
    external_account_id: str
    account_name: str
    scopes: List[str] = []
    metadata: Dict[str, Any] = {}


class ConnectedAccountCreate(ConnectedAccountBase):
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class ConnectedAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    status: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class ConnectedAccountRead(BaseModel):
    id: str
    workspace_id: str
    platform: str
    external_account_id: str
    account_name: str
    status: str
    scopes_json: List[str] = []
    metadata_json: Dict[str, Any] = {}
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
