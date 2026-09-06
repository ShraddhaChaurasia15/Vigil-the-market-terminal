import datetime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean, Text

DATABASE_URL = "sqlite+aiosqlite:///./vigil.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

class Watchlist(Base):
    __tablename__ = "watchlists"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    items: Mapped[list["WatchlistItem"]] = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan", lazy="selectin")

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    watchlist_id: Mapped[str] = mapped_column(String(36), ForeignKey("watchlists.id"), nullable=False)
    ticker: Mapped[str] = mapped_column(String(12), nullable=False)
    notes: Mapped[str] = mapped_column(String(255), default="")
    target_price: Mapped[float] = mapped_column(Float, nullable=True)
    stop_price: Mapped[float] = mapped_column(Float, nullable=True)
    added_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    watchlist: Mapped["Watchlist"] = relationship("Watchlist", back_populates="items")

class UserCheckpoint(Base):
    __tablename__ = "user_checkpoints"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(50), default="default_user", index=True)
    checkpoint_time: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    label: Mapped[str] = mapped_column(String(100), default="Manual Checkpoint")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    snapshots: Mapped[list["TickerSnapshot"]] = relationship("TickerSnapshot", back_populates="checkpoint", cascade="all, delete-orphan", lazy="selectin")

class TickerSnapshot(Base):
    __tablename__ = "ticker_snapshots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    checkpoint_id: Mapped[str] = mapped_column(String(36), ForeignKey("user_checkpoints.id"), nullable=False)
    ticker: Mapped[str] = mapped_column(String(12), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(Integer, default=0)
    ema20: Mapped[float] = mapped_column(Float, default=0.0)
    ema50: Mapped[float] = mapped_column(Float, default=0.0)
    atr14: Mapped[float] = mapped_column(Float, default=0.0)
    day_high: Mapped[float] = mapped_column(Float, default=0.0)
    day_low: Mapped[float] = mapped_column(Float, default=0.0)

    checkpoint: Mapped["UserCheckpoint"] = relationship("UserCheckpoint", back_populates="snapshots")

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_session():
    async with async_session() as session:
        yield session
