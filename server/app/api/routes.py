import datetime
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.database import get_session, Watchlist, WatchlistItem, UserCheckpoint, TickerSnapshot
from app.models import (
    MarketRegime,
    WatchlistSummary,
    WatchlistDetail,
    CreateWatchlistRequest,
    AddTickerRequest,
    TickerDelta,
    CheckpointInfo,
    ExecutiveFeedItem,
    AttentionTier,
    AcknowledgeCheckpointRequest,
    SimulateCheckpointRequest,
    VolatilityShockRequest
)
from app.engine.data_provider import provider
from app.engine.delta_calculator import calculate_delta_attribution

router = APIRouter()

USER_ID = "default_user"

async def get_or_create_active_checkpoint(session: AsyncSession) -> UserCheckpoint:
    stmt = select(UserCheckpoint).where(
        UserCheckpoint.user_id == USER_ID,
        UserCheckpoint.is_active == True
    ).order_by(UserCheckpoint.checkpoint_time.desc())
    result = await session.execute(stmt)
    cp = result.scalars().first()
    
    if not cp:
        # Create default checkpoint anchored 2 hours ago to immediately demonstrate the "Since You Checked" feature
        two_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        cp = UserCheckpoint(
            id=str(uuid.uuid4()),
            user_id=USER_ID,
            checkpoint_time=two_hours_ago,
            label="Initial Session Checkpoint (2 hours ago)",
            is_active=True
        )
        session.add(cp)
        await session.commit()
        await session.refresh(cp)
    return cp

@router.get("/market/regime", response_model=MarketRegime)
async def get_market_regime():
    return provider.get_market_regime()

@router.get("/watchlists", response_model=List[WatchlistSummary])
async def list_watchlists(session: AsyncSession = Depends(get_session)):
    stmt = select(Watchlist)
    result = await session.execute(stmt)
    lists = result.scalars().all()
    summaries = []
    for wl in lists:
        summaries.append(WatchlistSummary(
            id=wl.id,
            name=wl.name,
            description=wl.description,
            ticker_count=len(wl.items),
            is_default=wl.is_default,
            created_at=wl.created_at.isoformat()
        ))
    return summaries

@router.post("/watchlists", response_model=WatchlistSummary)
async def create_watchlist(req: CreateWatchlistRequest, session: AsyncSession = Depends(get_session)):
    wl_id = str(uuid.uuid4())
    wl = Watchlist(
        id=wl_id,
        name=req.name,
        description=req.description or "",
        is_default=False
    )
    session.add(wl)
    
    if req.tickers:
        for t in req.tickers:
            item = WatchlistItem(
                watchlist_id=wl_id,
                ticker=t.upper().strip()
            )
            session.add(item)
            
    await session.commit()
    await session.refresh(wl)
    return WatchlistSummary(
        id=wl.id,
        name=wl.name,
        description=wl.description,
        ticker_count=len(wl.items),
        is_default=wl.is_default,
        created_at=wl.created_at.isoformat()
    )

@router.get("/watchlists/{watchlist_id}", response_model=WatchlistDetail)
async def get_watchlist_detail(watchlist_id: str, session: AsyncSession = Depends(get_session)):
    stmt = select(Watchlist).where(Watchlist.id == watchlist_id)
    result = await session.execute(stmt)
    wl = result.scalars().first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    cp = await get_or_create_active_checkpoint(session)
    now_utc = datetime.datetime.utcnow()
    diff_seconds = max(0, int((now_utc - cp.checkpoint_time).total_seconds()))
    diff_minutes = max(1, diff_seconds // 60)
    
    if diff_minutes < 60:
        elapsed_str = f"{diff_minutes}m ago"
    else:
        hours = diff_minutes // 60
        rem_m = diff_minutes % 60
        elapsed_str = f"{hours}h {rem_m}m ago"

    regime = provider.get_market_regime()
    spy_quote = next((b for b in regime.benchmarks if b.symbol == "SPY"), None)
    benchmark_pct = spy_quote.change_pct if spy_quote else 0.40

    tickers_computed: List[TickerDelta] = []
    urgent_count = 0
    developing_count = 0
    quiet_count = 0

    for item in wl.items:
        ticker = item.ticker.upper()
        meta = provider.get_ticker_meta(ticker)
        
        curr_price, chk_price, vol, rvol, sparkline, catalyst = provider.generate_intraday_series(
            ticker=ticker,
            checkpoint_minutes_ago=diff_minutes
        )

        today_change_amt = round(curr_price - meta["base_price"], 2)
        today_change_pct = round((today_change_amt / meta["base_price"]) * 100.0, 2)
        
        delta_chk_amt = round(curr_price - chk_price, 2)
        delta_chk_pct = round((delta_chk_amt / chk_price) * 100.0, 2) if chk_price > 0 else 0.0

        day_high = max([p.price for p in sparkline] + [curr_price])
        day_low = min([p.price for p in sparkline] + [curr_price])

        score, tier, factors = calculate_delta_attribution(
            ticker=ticker,
            current_price=curr_price,
            checkpoint_price=chk_price,
            beta=meta["beta"],
            benchmark_pct=benchmark_pct,
            rvol=rvol,
            atr14=meta["atr14"],
            ema20=meta["ema20"],
            ema50=meta["ema50"],
            day_high=day_high,
            day_low=day_low,
            target_price=item.target_price or meta.get("default_target"),
            stop_price=item.stop_price or meta.get("default_stop"),
            catalyst_headline=catalyst
        )

        if tier == AttentionTier.URGENT:
            urgent_count += 1
        elif tier == AttentionTier.DEVELOPING:
            developing_count += 1
        else:
            quiet_count += 1

        tickers_computed.append(TickerDelta(
            ticker=ticker,
            company_name=meta["name"],
            sector=meta["sector"],
            current_price=curr_price,
            today_change_pct=today_change_pct,
            today_change_amt=today_change_amt,
            checkpoint_price=chk_price,
            delta_since_checkpoint_amt=delta_chk_amt,
            delta_since_checkpoint_pct=delta_chk_pct,
            beta=meta["beta"],
            rvol=rvol,
            atr14=meta["atr14"],
            day_high=day_high,
            day_low=day_low,
            volume=vol,
            avg_volume=meta["avg_volume"],
            delta_score=score,
            attention_tier=tier,
            delta_factors=factors,
            sparkline=sparkline,
            notes=item.notes,
            target_price=item.target_price or meta.get("default_target"),
            stop_price=item.stop_price or meta.get("default_stop"),
            last_updated=now_utc.strftime("%H:%M:%S UTC")
        ))

    # Sort tickers by Delta Score descending (most critical changes on top)
    tickers_computed.sort(key=lambda t: t.delta_score, reverse=True)

    # Build Executive Feed
    executive_feed: List[ExecutiveFeedItem] = []
    for td in tickers_computed:
        if td.attention_tier in [AttentionTier.URGENT, AttentionTier.DEVELOPING] and td.delta_factors:
            top_factor = td.delta_factors[0]
            executive_feed.append(ExecutiveFeedItem(
                id=str(uuid.uuid4()),
                ticker=td.ticker,
                headline=f"{td.ticker}: {top_factor.label} ({td.delta_since_checkpoint_pct:+.1f}% since check)",
                detail=top_factor.description,
                tier=td.attention_tier,
                factor_tag=top_factor.factor_type.value,
                timestamp=elapsed_str
            ))

    cp_info = CheckpointInfo(
        id=cp.id,
        checkpoint_time=cp.checkpoint_time.isoformat(),
        elapsed_human=elapsed_str,
        label=cp.label,
        total_tickers_tracked=len(tickers_computed),
        urgent_count=urgent_count,
        developing_count=developing_count,
        quiet_count=quiet_count
    )

    return WatchlistDetail(
        id=wl.id,
        name=wl.name,
        description=wl.description,
        checkpoint=cp_info,
        executive_feed=executive_feed[:5],  # top 5 critical highlights
        tickers=tickers_computed
    )

@router.post("/watchlists/{watchlist_id}/items")
async def add_watchlist_item(watchlist_id: str, req: AddTickerRequest, session: AsyncSession = Depends(get_session)):
    stmt = select(Watchlist).where(Watchlist.id == watchlist_id)
    result = await session.execute(stmt)
    wl = result.scalars().first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    ticker_clean = req.ticker.upper().strip()
    # Check if already exists in this watchlist
    for it in wl.items:
        if it.ticker.upper() == ticker_clean:
            return {"status": "exists", "ticker": ticker_clean}

    item = WatchlistItem(
        watchlist_id=watchlist_id,
        ticker=ticker_clean,
        notes=req.notes or "",
        target_price=req.target_price,
        stop_price=req.stop_price
    )
    session.add(item)
    await session.commit()
    return {"status": "added", "ticker": ticker_clean}

@router.delete("/watchlists/{watchlist_id}/items/{ticker}")
async def remove_watchlist_item(watchlist_id: str, ticker: str, session: AsyncSession = Depends(get_session)):
    stmt = delete(WatchlistItem).where(
        WatchlistItem.watchlist_id == watchlist_id,
        WatchlistItem.ticker == ticker.upper().strip()
    )
    await session.execute(stmt)
    await session.commit()
    return {"status": "removed", "ticker": ticker.upper()}

@router.post("/checkpoints/acknowledge")
async def acknowledge_checkpoint(req: AcknowledgeCheckpointRequest, session: AsyncSession = Depends(get_session)):
    """
    Sets checkpoint to NOW. This means the user has reviewed current conditions.
    All deltas return to 0 until future drift accumulates.
    """
    now_utc = datetime.datetime.utcnow()
    new_cp = UserCheckpoint(
        id=str(uuid.uuid4()),
        user_id=USER_ID,
        checkpoint_time=now_utc,
        label=req.label or "User Acknowledged All Market Changes",
        is_active=True
    )
    # Deactivate prior checkpoints
    await session.execute(
        update(UserCheckpoint).where(UserCheckpoint.user_id == USER_ID).values(is_active=False)
    )
    session.add(new_cp)
    await session.commit()
    return {"status": "checkpoint_updated", "timestamp": now_utc.isoformat(), "label": new_cp.label}

@router.post("/checkpoints/simulate")
async def simulate_checkpoint(req: SimulateCheckpointRequest, session: AsyncSession = Depends(get_session)):
    """
    Allows evaluators to time-travel the checkpoint backward to test the delta engine.
    """
    now_utc = datetime.datetime.utcnow()
    if req.preset == "30M_AGO":
        target_time = now_utc - datetime.timedelta(minutes=30)
        label = "Simulated Absence (30 minutes ago)"
    elif req.preset == "2H_AGO":
        target_time = now_utc - datetime.timedelta(hours=2)
        label = "Simulated Absence (2 hours ago)"
    elif req.preset == "MARKET_OPEN":
        target_time = now_utc.replace(hour=13, minute=30, second=0, microsecond=0)
        label = "Simulated Absence (Market Open 09:30 EST)"
    elif req.preset == "YESTERDAY_CLOSE":
        target_time = now_utc - datetime.timedelta(days=1)
        label = "Simulated Absence (Yesterday Close)"
    elif req.custom_minutes_ago:
        target_time = now_utc - datetime.timedelta(minutes=req.custom_minutes_ago)
        label = f"Simulated Absence ({req.custom_minutes_ago}m ago)"
    else:
        target_time = now_utc - datetime.timedelta(hours=2)
        label = "Simulated Absence (2 hours ago)"

    new_cp = UserCheckpoint(
        id=str(uuid.uuid4()),
        user_id=USER_ID,
        checkpoint_time=target_time,
        label=label,
        is_active=True
    )
    await session.execute(
        update(UserCheckpoint).where(UserCheckpoint.user_id == USER_ID).values(is_active=False)
    )
    session.add(new_cp)
    await session.commit()
    return {"status": "checkpoint_simulated", "timestamp": target_time.isoformat(), "label": label}

@router.post("/simulate/shock")
async def inject_volatility_shock(req: VolatilityShockRequest):
    """
    Simulates a sudden catalyst or volatility shock on a ticker to verify live delta response.
    """
    provider.inject_shock(req.ticker, req.shock_pct, req.catalyst_headline)
    return {"status": "shock_injected", "ticker": req.ticker.upper(), "shock_pct": req.shock_pct}

@router.post("/simulate/reset")
async def reset_simulation():
    provider.clear_shocks()
    return {"status": "simulation_reset"}
