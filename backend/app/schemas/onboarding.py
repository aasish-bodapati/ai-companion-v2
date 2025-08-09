from typing import List, Optional
from pydantic import BaseModel, Field

class Identity(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    pronouns: Optional[str] = None
    birthday: Optional[str] = None  # ISO date string
    location: Optional[str] = None

class Interests(BaseModel):
    topics: Optional[List[str]] = None
    otherTopic: Optional[str] = None
    hobbies: Optional[str] = None
    favorites: Optional[str] = None

class Communication(BaseModel):
    responseStyle: Optional[str] = Field(None, pattern="^(Concise|Detailed|Balanced)$")
    tone: Optional[List[str]] = None
    smallTalkLevel: Optional[int] = Field(None, ge=0, le=2)

class Goals(BaseModel):
    primaryReason: Optional[str] = None
    personalGoals: Optional[str] = None
    checkinsEnabled: Optional[bool] = None

class Boundaries(BaseModel):
    avoidTopics: Optional[str] = None
    memoryPolicy: Optional[str] = Field(None, pattern="^(RememberAll|ImportantOnly|NoMemory)$")
    recallEnabled: Optional[bool] = None

class Fun(BaseModel):
    dreamTrip: Optional[str] = None
    randomFact: Optional[str] = None
    aiPersona: Optional[str] = None

class OnboardingProfileBase(BaseModel):
    identity: Optional[Identity] = None
    interests: Optional[Interests] = None
    communication: Optional[Communication] = None
    goals: Optional[Goals] = None
    boundaries: Optional[Boundaries] = None
    fun: Optional[Fun] = None

class OnboardingProfileIn(OnboardingProfileBase):
    pass

class OnboardingProfileOut(OnboardingProfileBase):
    completed: bool = False

    class Config:
        from_attributes = True
