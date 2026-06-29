from pydantic import BaseModel, Field


class SettingsBase(BaseModel):
    key: str = Field(..., max_length=100)
    value: str = Field(..., max_length=500)


class SettingsCreate(SettingsBase):
    pass


class SettingsResponse(SettingsBase):
    class Config:
        from_attributes = True
