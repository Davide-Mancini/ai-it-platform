from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Assisted IT Platform"
  
    
    #Registriamo le variabili che hai nel file .env
    GEMINI_API_KEY: str
    JWT_SECRET: str
    SQLALCHEMY_DATABASE_URL: str
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        # Questo dice a Pydantic di ignorare eventuali altre variabili extra nel sistema 
        # senza mandare in crash l'applicazione
        extra = "ignore" 

settings = Settings()