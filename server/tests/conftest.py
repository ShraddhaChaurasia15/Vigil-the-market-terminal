import pytest
import pytest_asyncio
from app.database import init_db, async_session, Watchlist, WatchlistItem, UserCheckpoint
from app.api.routes import USER_ID
import datetime
import uuid

@pytest_asyncio.fixture(autouse=True)
async def setup_test_database():
    await init_db()
    async with async_session() as session:
        # Check if default watchlist exists
        from sqlalchemy import select
        stmt = select(Watchlist).where(Watchlist.is_default == True)
        res = await session.execute(stmt)
        wl = res.scalars().first()
        if not wl:
            wl_id = "test-watchlist"
            wl = Watchlist(
                id=wl_id,
                name="Test Portfolio",
                description="Test portfolio description",
                is_default=True
            )
            session.add(wl)
            session.add(WatchlistItem(watchlist_id=wl_id, ticker="NVDA", notes="Test item"))
            session.add(WatchlistItem(watchlist_id=wl_id, ticker="AAPL", notes="Test item"))
            session.add(WatchlistItem(watchlist_id=wl_id, ticker="TSLA", notes="Test item"))
            
            two_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=2)
            session.add(UserCheckpoint(
                id=str(uuid.uuid4()),
                user_id=USER_ID,
                checkpoint_time=two_hours_ago,
                label="Test Checkpoint",
                is_active=True
            ))
            await session.commit()
    yield
